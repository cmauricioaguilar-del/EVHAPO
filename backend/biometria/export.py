"""
export.py — Exportación de sesiones biométricas a CSV.

Genera un archivo CSV con una fila por mano, incluyendo posición,
cartas, resultado, fichas y HR promedio (si está correlacionada).

Uso típico:
    from biometria.export import export_to_csv
    n = export_to_csv(hands, "sesion.csv", session_id="abc123")
"""

import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from loguru import logger

from .hand_history import PokerHand


# ─────────────────────────────────────────────
# Columnas del CSV
# ─────────────────────────────────────────────

CSV_COLUMNS = [
    "session_id",
    "hand_id",
    "room",
    "datetime_utc",
    "tournament_id",
    "level",
    "position",
    "hole_cards",
    "result",
    "net_amount",
    "went_to_showdown",
    "board",
    "hr_avg",
    "hr_preflop",
    "hr_flop",
    "hr_turn",
    "hr_river",
]


def _hand_to_row(hand: PokerHand, session_id: str = "") -> dict:
    """Convierte una PokerHand en un dict listo para csv.DictWriter."""
    dt_str = ""
    if hand.timestamp:
        dt_str = datetime.fromtimestamp(
            hand.timestamp, tz=timezone.utc
        ).strftime("%Y-%m-%d %H:%M:%S")

    return {
        "session_id":       session_id,
        "hand_id":          hand.hand_id,
        "room":             hand.room,
        "datetime_utc":     dt_str,
        "tournament_id":    hand.tournament_id or "",
        "level":            hand.level        or "",
        "position":         hand.position     or "",
        "hole_cards":       hand.hole_cards   or "",
        "result":           hand.result       or "",
        "net_amount":       hand.net_amount   if hand.net_amount is not None else "",
        "went_to_showdown": hand.went_to_showdown,
        "board":            hand.board        or "",
        "hr_avg":           hand.hr_avg       if hand.hr_avg     is not None else "",
        "hr_preflop":       hand.hr_preflop   if hand.hr_preflop is not None else "",
        "hr_flop":          hand.hr_flop      if hand.hr_flop    is not None else "",
        "hr_turn":          hand.hr_turn      if hand.hr_turn    is not None else "",
        "hr_river":         hand.hr_river     if hand.hr_river   is not None else "",
    }


def export_to_csv(
    hands: List[PokerHand],
    output_path: str,
    session_id: str = "",
) -> int:
    """
    Exporta una lista de PokerHand a un archivo CSV.

    Cada fila representa una mano. Si las manos ya fueron correlacionadas
    con una BioSession (hr_avg poblado), ese dato se incluye.

    Args:
        hands:       lista de PokerHand (ya ordenadas y correlacionadas si aplica)
        output_path: ruta del archivo CSV de salida (se crea o sobreescribe)
        session_id:  ID de la sesión biométrica (opcional, se incluye en cada fila)

    Returns:
        Número de filas escritas (= len(hands)).
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    # utf-8-sig escribe BOM al inicio del archivo.
    # Excel en Windows lo detecta y abre el CSV con doble clic sin configuración extra.
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for hand in hands:
            writer.writerow(_hand_to_row(hand, session_id))

    logger.info(
        f"CSV exportado: {len(hands)} manos → {path}"
    )
    return len(hands)


def default_csv_name(hand_history_filepath: str, session_id: str = "") -> str:
    """
    Genera el nombre de archivo CSV por defecto.

    Usa el stem del archivo de hand history más el prefijo de session_id
    si se proporcionó, o solo el stem si no.

    Examples:
        "GG20260523.txt", "abc12345" → "GG20260523_abc12345.csv"
        "GG20260523.txt", ""        → "GG20260523.csv"
    """
    stem = Path(hand_history_filepath).stem
    if session_id:
        return f"{stem}_{session_id[:8]}.csv"
    return f"{stem}.csv"
