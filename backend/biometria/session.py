"""
session.py — Gestión del ciclo de vida de una sesión biométrica.

Coordina el detector de procesos, la sincronización NTP y el
almacenamiento de datos de sesión.
"""

import uuid
import time
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Optional, List
from loguru import logger

from .ntp_sync import get_session_anchor, correct_timestamp


@dataclass
class HRSample:
    """Una muestra de frecuencia cardíaca con timestamp corregido."""
    timestamp: float        # Timestamp UTC corregido con offset NTP
    bpm: int                # Frecuencia cardíaca en latidos por minuto
    source: str = "watch"   # Fuente del dato ('watch', 'manual', 'simulated')


@dataclass
class BioSession:
    """
    Representa una sesión biométrica completa.
    Desde que se detecta la mesa hasta que se cierra.
    """
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    room_name: str = ""
    started_at: Optional[float] = None          # Timestamp UTC de inicio (NTP)
    ended_at: Optional[float] = None            # Timestamp UTC de fin
    anchor: Optional[dict] = None               # Ancla NTP de la sesión
    hr_samples: List[HRSample] = field(default_factory=list)
    is_active: bool = False

    def start(self, room_info: dict):
        """Inicia la sesión biométrica."""
        self.anchor = get_session_anchor()
        self.started_at = self.anchor["ntp_timestamp"]
        self.room_name = room_info.get("room_name", "Unknown")
        self.is_active = True
        logger.info(f"[{self.session_id[:8]}] Sesión iniciada — sala: {self.room_name} | inicio: {self.started_at:.3f}")

    def stop(self):
        """Finaliza la sesión biométrica."""
        self.ended_at = time.time() + (self.anchor["offset_seconds"] if self.anchor else 0)
        self.is_active = False
        duration = (self.ended_at - self.started_at) / 60 if self.started_at else 0
        logger.info(f"[{self.session_id[:8]}] Sesión finalizada — duración: {duration:.1f} min | muestras HR: {len(self.hr_samples)}")

    def add_hr_sample(self, bpm: int, local_timestamp: Optional[float] = None):
        """
        Agrega una muestra de HR a la sesión.

        Args:
            bpm: frecuencia cardíaca en BPM
            local_timestamp: timestamp local (se corrige con offset NTP)
        """
        if not self.is_active:
            logger.warning("Intento de agregar muestra HR a sesión inactiva.")
            return

        local_ts = local_timestamp or time.time()
        corrected_ts = correct_timestamp(local_ts, self.anchor) if self.anchor else local_ts

        sample = HRSample(timestamp=corrected_ts, bpm=bpm)
        self.hr_samples.append(sample)
        logger.debug(f"HR muestra: {bpm} BPM @ {corrected_ts:.3f}")

    def get_hr_at(self, timestamp: float, window_seconds: int = 30) -> Optional[float]:
        """
        Retorna el promedio de HR en una ventana de tiempo alrededor de un timestamp.
        Usado para correlacionar HR con el momento de una mano de poker.

        Args:
            timestamp: momento de la mano (timestamp UTC)
            window_seconds: ventana de tiempo hacia atrás en segundos

        Returns:
            promedio de BPM en la ventana, o None si no hay datos
        """
        window_start = timestamp - window_seconds
        samples_in_window = [
            s.bpm for s in self.hr_samples
            if window_start <= s.timestamp <= timestamp
        ]

        if not samples_in_window:
            return None

        avg = sum(samples_in_window) / len(samples_in_window)
        return round(avg, 1)

    def get_hr_in_range(self, start_ts: float, end_ts: float) -> Optional[float]:
        """
        Retorna el promedio de HR de las muestras en el rango [start_ts, end_ts).

        Usado por el correlator para asignar HR a calles individuales
        (preflop, flop, turn, river) según la ventana temporal de cada calle.

        Returns:
            promedio de BPM en el rango, o None si no hay muestras en él
        """
        samples = [
            s.bpm for s in self.hr_samples
            if start_ts <= s.timestamp < end_ts
        ]
        if not samples:
            return None
        return round(sum(samples) / len(samples), 1)

    def summary(self) -> dict:
        """Retorna un resumen de la sesión. Siempre incluye todos los campos."""
        base = {
            "session_id":  self.session_id,
            "room_name":   self.room_name,
            "started_at":  self.started_at,
            "ended_at":    self.ended_at,
            "is_active":   self.is_active,
            "hr_samples":  len(self.hr_samples),
            "hr_avg":      None,
            "hr_max":      None,
            "hr_min":      None,
        }
        if self.hr_samples:
            bpms = [s.bpm for s in self.hr_samples]
            base["hr_avg"] = round(sum(bpms) / len(bpms), 1)
            base["hr_max"] = max(bpms)
            base["hr_min"] = min(bpms)
        return base
