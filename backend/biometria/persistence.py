"""
persistence.py — Persistencia local de sesiones biométricas en JSON.

Almacena cada sesión como un archivo JSON en ~/.mindev-bio/sessions/.
No requiere dependencias externas — solo stdlib (json, pathlib).

Operaciones principales:
    save_session(session)           → escribe/actualiza el archivo
    load_session(session_id)        → reconstruye BioSession desde disco
    list_sessions()                 → metadata de todas las sesiones
    delete_session(session_id)      → elimina el archivo
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List

from loguru import logger

from .session import BioSession, HRSample


# ─────────────────────────────────────────────
# Directorio de almacenamiento
# ─────────────────────────────────────────────

DEFAULT_SESSIONS_DIR = Path.home() / ".mindev-bio" / "sessions"


def get_sessions_dir(sessions_dir: Optional[Path] = None) -> Path:
    """Retorna el directorio de sesiones, creándolo si no existe."""
    d = Path(sessions_dir) if sessions_dir else DEFAULT_SESSIONS_DIR
    d.mkdir(parents=True, exist_ok=True)
    return d


def _session_path(session_id: str, sessions_dir: Optional[Path] = None) -> Path:
    return get_sessions_dir(sessions_dir) / f"{session_id}.json"


# ─────────────────────────────────────────────
# Serialización / deserialización
# ─────────────────────────────────────────────

def _session_to_dict(session: BioSession) -> dict:
    """Convierte un BioSession a un dict serializable como JSON."""
    return {
        "version":    "1",
        "session_id": session.session_id,
        "room_name":  session.room_name,
        "started_at": session.started_at,
        "ended_at":   session.ended_at,
        "is_active":  session.is_active,
        "anchor":     session.anchor,
        "hr_samples": [
            {
                "timestamp": s.timestamp,
                "bpm":       s.bpm,
                "source":    s.source,
            }
            for s in session.hr_samples
        ],
    }


def _dict_to_session(data: dict) -> BioSession:
    """Reconstruye un BioSession desde un dict (leído de JSON)."""
    session = BioSession()
    session.session_id = data["session_id"]
    session.room_name  = data.get("room_name", "")
    session.started_at = data.get("started_at")
    session.ended_at   = data.get("ended_at")
    session.is_active  = data.get("is_active", False)
    session.anchor     = data.get("anchor")
    session.hr_samples = [
        HRSample(
            timestamp = s["timestamp"],
            bpm       = s["bpm"],
            source    = s.get("source", "watch"),
        )
        for s in data.get("hr_samples", [])
    ]
    return session


# ─────────────────────────────────────────────
# CRUD
# ─────────────────────────────────────────────

def save_session(session: BioSession, sessions_dir: Optional[Path] = None) -> Path:
    """
    Guarda o actualiza una sesión en disco.

    Llama a esta función tanto al finalizar la sesión como periódicamente
    durante la sesión para no perder datos si el programa se cierra inesperadamente.

    Returns:
        Path del archivo guardado.
    """
    path = _session_path(session.session_id, sessions_dir)
    data = _session_to_dict(session)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logger.info(
        f"Sesion guardada: {session.session_id[:8]} "
        f"({len(session.hr_samples)} muestras HR) → {path}"
    )
    return path


def load_session(
    session_id: str,
    sessions_dir: Optional[Path] = None,
) -> Optional[BioSession]:
    """
    Carga una sesión desde disco por su ID (o prefijo de ID).

    Acepta prefijos cortos (ej: '8f3a1c2b' en lugar del UUID completo).

    Returns:
        BioSession reconstruida, o None si no se encuentra.
    """
    d = get_sessions_dir(sessions_dir)

    # Búsqueda exacta primero
    exact = d / f"{session_id}.json"
    if exact.exists():
        with open(exact, "r", encoding="utf-8") as f:
            return _dict_to_session(json.load(f))

    # Búsqueda por prefijo
    matches = list(d.glob(f"{session_id}*.json"))
    if len(matches) == 1:
        with open(matches[0], "r", encoding="utf-8") as f:
            return _dict_to_session(json.load(f))
    elif len(matches) > 1:
        logger.warning(
            f"Prefijo '{session_id}' ambiguo — "
            f"{len(matches)} sesiones coinciden. Usa más caracteres."
        )
        return None

    logger.warning(f"Sesion no encontrada: {session_id}")
    return None


def list_sessions(sessions_dir: Optional[Path] = None) -> List[dict]:
    """
    Retorna metadata de todas las sesiones guardadas, ordenadas por fecha
    de inicio (más reciente primero).

    Cada entrada contiene:
        session_id, room_name, started_at, ended_at, hr_samples,
        duration_min, hr_avg, is_active, datetime_str
    """
    d = get_sessions_dir(sessions_dir)
    result = []

    for path in sorted(d.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"Archivo de sesion corrupto ignorado: {path.name} ({e})")
            continue

        started = data.get("started_at")
        ended   = data.get("ended_at")
        samples = data.get("hr_samples", [])

        duration_min = (ended - started) / 60 if started and ended else None

        bpms = [s["bpm"] for s in samples if "bpm" in s]
        hr_avg = round(sum(bpms) / len(bpms), 1) if bpms else None

        dt_str = ""
        if started:
            try:
                dt_str = datetime.fromtimestamp(
                    started, tz=timezone.utc
                ).strftime("%Y-%m-%d %H:%M UTC")
            except Exception:
                dt_str = str(started)

        result.append({
            "session_id":   data.get("session_id", path.stem),
            "room_name":    data.get("room_name", ""),
            "started_at":   started,
            "ended_at":     ended,
            "is_active":    data.get("is_active", False),
            "hr_samples":   len(samples),
            "duration_min": duration_min,
            "hr_avg":       hr_avg,
            "datetime_str": dt_str,
        })

    return result


def delete_session(
    session_id: str,
    sessions_dir: Optional[Path] = None,
) -> bool:
    """
    Elimina el archivo de una sesión.

    Returns:
        True si se eliminó, False si no existía.
    """
    path = _session_path(session_id, sessions_dir)
    if path.exists():
        path.unlink()
        logger.info(f"Sesion eliminada: {session_id[:8]}")
        return True

    # Intento por prefijo
    d = get_sessions_dir(sessions_dir)
    matches = list(d.glob(f"{session_id}*.json"))
    if len(matches) == 1:
        matches[0].unlink()
        logger.info(f"Sesion eliminada: {matches[0].stem[:8]}")
        return True

    logger.warning(f"Sesion no encontrada para eliminar: {session_id}")
    return False
