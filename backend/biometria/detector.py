"""
detector.py — Detección automática de mesas de poker abiertas en el sistema.

Monitorea procesos y ventanas del sistema operativo para detectar cuándo
el usuario abre una sala de poker, disparando el inicio automático de sesión.
"""

import psutil
from loguru import logger
from typing import Optional

# Procesos conocidos de salas de poker online
POKER_PROCESSES = {
    "PokerStars.exe": "PokerStars",
    "PokerStars64.exe": "PokerStars",
    "pokerstars.exe": "PokerStars",
    "PartyPoker.exe": "PartyPoker",
    "888poker.exe": "888poker",
    "WPTGlobalClient.exe": "WPT Global",
    "GGPoker.exe": "GGPoker",
    "GGnet.exe": "GGPoker",
    "ACRPoker.exe": "Americas Cardroom",
}


def get_running_poker_room() -> Optional[dict]:
    """
    Escanea los procesos activos del sistema y retorna la primera sala
    de poker detectada, o None si no hay ninguna corriendo.

    Returns:
        dict con 'process_name' y 'room_name', o None
    """
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            proc_name = proc.info['name']
            if proc_name in POKER_PROCESSES:
                room = POKER_PROCESSES[proc_name]
                logger.info(f"Mesa detectada: {room} (proceso: {proc_name}, PID: {proc.info['pid']})")
                return {
                    "process_name": proc_name,
                    "room_name": room,
                    "pid": proc.info['pid'],
                }
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return None


def is_poker_running() -> bool:
    """Retorna True si hay alguna sala de poker corriendo."""
    return get_running_poker_room() is not None


def watch_for_poker(on_open=None, on_close=None, interval_seconds: int = 5):
    """
    Monitoreo continuo. Llama on_open(room_info) cuando detecta una sala
    y on_close() cuando el proceso termina.

    Args:
        on_open: callback cuando se detecta una sala de poker
        on_close: callback cuando la sala se cierra
        interval_seconds: frecuencia de sondeo en segundos
    """
    import time
    active_room = None

    logger.info(f"Iniciando monitoreo de procesos (intervalo: {interval_seconds}s)")

    while True:
        current = get_running_poker_room()

        if current and not active_room:
            active_room = current
            logger.info(f"Sesión de poker iniciada: {current['room_name']}")
            if on_open:
                on_open(current)

        elif not current and active_room:
            logger.info(f"Sesión de poker cerrada: {active_room['room_name']}")
            active_room = None
            if on_close:
                on_close()

        time.sleep(interval_seconds)
