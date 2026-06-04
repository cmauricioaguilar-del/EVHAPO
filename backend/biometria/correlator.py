"""
correlator.py — Correlación entre datos de HR y hand history.

Cruza las muestras de frecuencia cardíaca con las manos de poker
para asignar BPM a cada calle (preflop / flop / turn / river).

Modelo de ventanas temporales
──────────────────────────────
  Cada mano ocupa el tiempo entre su timestamp y el inicio de la
  mano siguiente.  Ese intervalo se divide en segmentos por calle
  usando proporciones calibradas para poker de torneo:

      1 calle  (fold PF) : [100%]  preflop
      2 calles (flop)    : [40% / 60%]
      3 calles (turn)    : [25% / 40% / 35%]
      4 calles (river)   : [20% / 30% / 25% / 25%]

  Si no hay muestras de HR en un segmento, se usa como fallback
  el promedio de los `window_seconds` previos al inicio del segmento.
"""

from typing import List, Optional
from loguru import logger

from .session import BioSession
from .hand_history import PokerHand, streets_played


# ─────────────────────────────────────────────
# Proporciones de tiempo por calle
# ─────────────────────────────────────────────

_STREET_PROPORTIONS = {
    1: [1.00],
    2: [0.40, 0.60],
    3: [0.25, 0.40, 0.35],
    4: [0.20, 0.30, 0.25, 0.25],
}

# Duración estimada de la última mano cuando no hay siguiente (seg.)
_DEFAULT_HAND_DURATION = 180.0


# ─────────────────────────────────────────────
# Correlación principal
# ─────────────────────────────────────────────

def correlate(
    session: BioSession,
    hands: List[PokerHand],
    window_seconds: int = 30,
) -> List[PokerHand]:
    """
    Correlaciona cada mano con el HR de la BioSession,
    asignando un BPM promedio por calle jugada.

    Campos poblados en cada PokerHand:
        hr_preflop, hr_flop, hr_turn, hr_river  (None si la calle no se jugó)
        hr_avg   (promedio de las calles jugadas)

    Args:
        session:        sesión biométrica con muestras de HR
        hands:          lista de manos del hand history
        window_seconds: ventana de fallback (seg.) si el segmento no tiene muestras

    Returns:
        lista de PokerHand con los campos HR poblados
    """
    if not session.hr_samples:
        logger.warning("Sin muestras de HR — correlación omitida.")
        return hands

    # Solo procesamos manos con timestamp
    timed = sorted(
        [h for h in hands if h.timestamp],
        key=lambda h: h.timestamp,
    )
    if not timed:
        logger.warning("Ninguna mano tiene timestamp — correlación omitida.")
        return hands

    correlated = 0

    for i, hand in enumerate(timed):
        # ── Ventana temporal de la mano ──────────────────────────────
        if i + 1 < len(timed):
            hand_end = timed[i + 1].timestamp
        else:
            hand_end = hand.timestamp + _DEFAULT_HAND_DURATION

        duration = max(hand_end - hand.timestamp, 10.0)   # mínimo 10 seg.

        # ── Segmentos por calle ──────────────────────────────────────
        n_streets   = streets_played(hand)
        proportions = _STREET_PROPORTIONS[n_streets]

        # Construir límites de cada segmento
        boundaries = [hand.timestamp]
        for p in proportions:
            boundaries.append(boundaries[-1] + p * duration)

        # ── HR por segmento ──────────────────────────────────────────
        street_hrs: List[Optional[float]] = []

        for j in range(n_streets):
            seg_start = boundaries[j]
            seg_end   = boundaries[j + 1]

            hr = session.get_hr_in_range(seg_start, seg_end)

            # Fallback: ventana previa al inicio del segmento
            if hr is None:
                hr = session.get_hr_at(seg_start, window_seconds=window_seconds)

            street_hrs.append(hr)

        # ── Asignar calles ───────────────────────────────────────────
        hand.hr_preflop = street_hrs[0] if len(street_hrs) > 0 else None
        hand.hr_flop    = street_hrs[1] if len(street_hrs) > 1 else None
        hand.hr_turn    = street_hrs[2] if len(street_hrs) > 2 else None
        hand.hr_river   = street_hrs[3] if len(street_hrs) > 3 else None

        played = [v for v in street_hrs if v is not None]
        hand.hr_avg = round(sum(played) / len(played), 1) if played else None

        if hand.hr_avg is not None:
            correlated += 1

    logger.info(
        f"Correlación por calle: {correlated}/{len(hands)} manos con HR  "
        f"({len(session.hr_samples)} muestras de {window_seconds}s ventana fallback)"
    )
    return hands


# ─────────────────────────────────────────────
# Análisis de tensión
# ─────────────────────────────────────────────

def detect_tension_hands(
    hands: List[PokerHand],
    baseline_bpm: Optional[float] = None,
    threshold_pct: float = 15.0,
) -> List[PokerHand]:
    """
    Detecta manos jugadas con tensión elevada comparando el HR
    contra el baseline del jugador.

    Args:
        hands:         manos ya correlacionadas con HR
        baseline_bpm:  HR base del jugador (si es None, usa el promedio de la sesión)
        threshold_pct: porcentaje sobre el baseline para considerar tensión (default 15%)

    Returns:
        lista de manos con HR por encima del umbral de tensión
    """
    hands_with_hr = [h for h in hands if h.hr_avg is not None]

    if not hands_with_hr:
        logger.warning("No hay manos con datos de HR para analizar.")
        return []

    if baseline_bpm is None:
        baseline_bpm = sum(h.hr_avg for h in hands_with_hr) / len(hands_with_hr)
        logger.info(f"Baseline calculado de la sesión: {baseline_bpm:.1f} BPM")

    threshold     = baseline_bpm * (1 + threshold_pct / 100)
    tension_hands = [h for h in hands_with_hr if h.hr_avg >= threshold]

    logger.info(
        f"Manos con tensión elevada (>{threshold:.1f} BPM): "
        f"{len(tension_hands)}/{len(hands_with_hr)}"
    )
    return tension_hands


# ─────────────────────────────────────────────
# Reporte de sesión
# ─────────────────────────────────────────────

def session_report(session: BioSession, hands: List[PokerHand]) -> dict:
    """
    Genera un reporte completo de la sesión con estadísticas de correlación.
    """
    hands_with_hr = [h for h in hands if h.hr_avg is not None]
    tension_hands = detect_tension_hands(hands_with_hr)

    report = {
        **session.summary(),
        "total_hands":      len(hands),
        "hands_correlated": len(hands_with_hr),
        "tension_hands":    len(tension_hands),
        "showdown_hands":   sum(1 for h in hands if h.went_to_showdown),
        "won_hands":        sum(1 for h in hands if h.result == "won"),
        "folded_hands":     sum(1 for h in hands if h.result == "folded"),
    }

    if tension_hands:
        report["tension_boards"]  = [h.board for h in tension_hands if h.board]
        report["tension_hr_avg"]  = round(
            sum(h.hr_avg for h in tension_hands) / len(tension_hands), 1
        )

    return report
