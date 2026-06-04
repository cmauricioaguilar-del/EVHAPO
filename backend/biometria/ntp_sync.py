"""
ntp_sync.py — Sincronización de tiempo vía NTP.

Obtiene el timestamp preciso del servidor NTP para anclar el inicio
de sesión y permitir la correlación exacta entre HR y hand history.
"""

import ntplib
import time
from datetime import datetime, timezone
from loguru import logger
from typing import Optional

NTP_SERVERS = [
    "pool.ntp.org",
    "time.google.com",
    "time.cloudflare.com",
    "time.windows.com",
]


def get_ntp_timestamp() -> Optional[float]:
    """
    Consulta servidores NTP y retorna el timestamp UTC preciso.
    Intenta con múltiples servidores en caso de fallo.

    Returns:
        timestamp UTC como float, o None si todos los servidores fallan
    """
    client = ntplib.NTPClient()

    for server in NTP_SERVERS:
        try:
            response = client.request(server, version=3, timeout=3)
            ntp_time = response.tx_time
            offset = response.offset
            logger.info(f"NTP sync OK — servidor: {server} | offset: {offset:.4f}s | timestamp: {ntp_time:.3f}")
            return ntp_time
        except Exception as e:
            logger.warning(f"NTP fallo en {server}: {e}")
            continue

    logger.error("Todos los servidores NTP fallaron. Usando tiempo local como fallback.")
    return time.time()


def get_session_anchor() -> dict:
    """
    Genera el ancla temporal para una sesión.
    Combina el timestamp NTP con el tiempo local para calcular el offset.

    Returns:
        dict con 'ntp_timestamp', 'local_timestamp', 'offset_seconds', 'datetime_utc'
    """
    local_before = time.time()
    ntp_ts = get_ntp_timestamp()
    local_after = time.time()

    local_ts = (local_before + local_after) / 2
    offset = ntp_ts - local_ts if ntp_ts else 0.0

    anchor = {
        "ntp_timestamp": ntp_ts,
        "local_timestamp": local_ts,
        "offset_seconds": offset,
        "datetime_utc": datetime.fromtimestamp(ntp_ts or local_ts, tz=timezone.utc).isoformat(),
    }

    logger.info(f"Ancla de sesión creada: {anchor['datetime_utc']} (offset NTP: {offset:.4f}s)")
    return anchor


def correct_timestamp(local_ts: float, anchor: dict) -> float:
    """
    Corrige un timestamp local usando el offset NTP calculado al inicio de sesión.

    Args:
        local_ts: timestamp local a corregir
        anchor: ancla de sesión generada por get_session_anchor()

    Returns:
        timestamp corregido
    """
    return local_ts + anchor["offset_seconds"]
