"""
hand_history.py — Parser multi-sala de hand histories de poker online.

Soporta: PokerStars, GGPoker, WPT Global, 888poker, ACR, Latpoker (archivos .txt)
         y Coolbet/iPoker (archivos .xml).
Detecta automáticamente la sala por extensión y contenido del archivo.
"""

import re
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional
from loguru import logger


@dataclass
class PokerHand:
    """Representa una mano de poker con datos relevantes para correlación biométrica."""
    hand_id: str
    room: str                           # Sala de poker
    timestamp: float                    # Timestamp UTC
    datetime_str: str                   # Fecha/hora original del archivo
    tournament_id: Optional[str] = None
    level: Optional[str] = None         # Nivel del torneo
    result: Optional[str] = None        # 'won', 'lost', 'folded'
    net_amount: Optional[float] = None  # Resultado en fichas
    board: Optional[str] = None         # Cartas del board
    hole_cards: Optional[str] = None    # Cartas del jugador
    position: Optional[str] = None      # Posición (BTN, SB, BB, etc.)
    went_to_showdown: bool = False
    hero_stack: Optional[float] = None  # Stack del hero al inicio de la mano
    hr_avg:     Optional[float] = None  # Promedio de calles jugadas (correlación/demo)
    hr_preflop: Optional[float] = None  # BPM durante el preflop
    hr_flop:    Optional[float] = None  # BPM durante el flop
    hr_turn:    Optional[float] = None  # BPM durante el turn
    hr_river:   Optional[float] = None  # BPM durante el river


def streets_played(hand: PokerHand) -> int:
    """
    Determina cuántas calles se jugaron en una mano (1–4).

        1 = solo preflop  (fold preflop o sin info de board)
        2 = hasta el flop
        3 = hasta el turn
        4 = hasta el river / showdown

    Prioridad: went_to_showdown > board (5/4/3 cartas) > 1 por defecto.
    Usada por el correlator y el módulo de simulación de demo.
    """
    if hand.went_to_showdown:
        return 4
    if hand.board:
        nc = len(hand.board.strip().split())
        if nc >= 5: return 4
        if nc >= 4: return 3
        if nc >= 3: return 2
    return 1


# ─────────────────────────────────────────────
# Utilidades comunes
# ─────────────────────────────────────────────

DATETIME_FORMATS = [
    "%Y/%m/%d %H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
    "%d/%m/%Y %H:%M:%S",
    "%m/%d/%Y %H:%M:%S",
    "%d %m %Y %H:%M:%S",
    "%Y/%m/%d %H:%M:%S ET",
    "%Y/%m/%d %H:%M:%S UTC",
]


def _parse_dt(dt_str: str) -> Optional[float]:
    """Parsea una cadena de fecha/hora y retorna timestamp UTC."""
    dt_str = dt_str.strip().rstrip(" ET").rstrip(" UTC").rstrip(" CET").rstrip(" CEST")
    for fmt in DATETIME_FORMATS:
        try:
            dt = datetime.strptime(dt_str, fmt)
            return dt.replace(tzinfo=timezone.utc).timestamp()
        except ValueError:
            continue
    logger.warning(f"No se pudo parsear fecha: '{dt_str}'")
    return None


def _split_hands(content: str, separator_pattern: str) -> List[str]:
    """Divide el contenido del archivo en bloques individuales de manos."""
    blocks = re.split(separator_pattern, content.strip())
    return [b.strip() for b in blocks if b.strip()]


# ─────────────────────────────────────────────
# Cálculo de posición (BTN, SB, BB, UTG, HJ, CO…)
# ─────────────────────────────────────────────

_POSITIONS_BY_N: dict = {
    2: ["BTN", "BB"],
    3: ["BTN", "SB", "BB"],
    4: ["BTN", "SB", "BB", "CO"],
    5: ["BTN", "SB", "BB", "UTG", "CO"],
    6: ["BTN", "SB", "BB", "UTG", "HJ", "CO"],
    7: ["BTN", "SB", "BB", "UTG", "UTG+1", "HJ", "CO"],
    8: ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "HJ", "CO"],
    9: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "MP", "HJ", "CO"],
}

# "Seat #N is the button"  — PokerStars, GGPoker, WPT, Latpoker, ACR
# "Seat N is the button"   — 888poker (sin #)
_re_btn_seat = re.compile(r"Seat #?(\d+) is the button")
_re_seat_map = re.compile(r"^Seat (\d+): (\S+)", re.MULTILINE)


def _calculate_position(
    hero_seat: int,
    btn_seat: int,
    all_seats: list,
) -> Optional[str]:
    """
    Calcula la posición del hero según el asiento del dealer y los asientos
    activos en la mano.

    Devuelve 'BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO', etc.
    Devuelve None si el número de jugadores no está en la tabla o los
    asientos no son reconocibles.
    """
    seats = sorted(all_seats)
    n = len(seats)
    if hero_seat not in seats or btn_seat not in seats:
        return None
    pos_list = _POSITIONS_BY_N.get(n)
    if pos_list is None:
        return None
    btn_idx  = seats.index(btn_seat)
    hero_idx = seats.index(hero_seat)
    steps = (hero_idx - btn_idx) % n
    return pos_list[steps]


def _extract_position(block: str, hero_name: str) -> Optional[str]:
    """
    Extrae la posición del hero desde un bloque de mano (formato texto).

    Funciona con PokerStars, GGPoker, WPT Global, Latpoker, ACR y 888poker.
    Todos publican 'Seat [#]N is the button' en la línea de Table.
    """
    if not hero_name:
        return None

    btn_m = _re_btn_seat.search(block)
    if not btn_m:
        return None
    btn_seat = int(btn_m.group(1))

    # Solo la sección de setup (antes de *** HOLE CARDS ***) para el mapa de asientos
    setup_end = block.find("*** HOLE CARDS ***")
    setup = block[:setup_end] if setup_end >= 0 else block

    seat_map = {
        int(m.group(1)): m.group(2)
        for m in _re_seat_map.finditer(setup)
    }
    if not seat_map:
        return None

    hero_seat = next(
        (s for s, name in seat_map.items() if name == hero_name),
        None,
    )
    if hero_seat is None:
        return None

    return _calculate_position(hero_seat, btn_seat, list(seat_map.keys()))


# ─────────────────────────────────────────────
# POKERSTARS
# Parser confirmado con muestras reales (nick: pappo23)
# Formato: PokerStars Hand #XXXXXXXXX: Tournament #XXXXXXXXX...
# ─────────────────────────────────────────────

def _parse_pokerstars(content: str, player_nick: str = "") -> List[PokerHand]:
    hands = []
    blocks = re.split(r'\n\n(?=PokerStars Hand #)', content.strip())

    re_header = re.compile(
        r"PokerStars Hand #(\d+):.*?(\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2})"
    )
    re_tourn = re.compile(r"Tournament #(\d+)")
    re_level = re.compile(r"Level [IVXLCDM]+ \((\d+/\d+)\)")
    re_board = re.compile(r"BOARD: \[(.+?)\]")
    re_hole = re.compile(r"Dealt to \S+ \[(.+?)\]")
    re_won = re.compile(r"collected (\d+(?:\.\d+)?) from")
    re_showdown = re.compile(r"\*\*\* SHOW DOWN \*\*\*")

    for block in blocks:
        m = re_header.search(block)
        if not m:
            continue
        ts = _parse_dt(m.group(2))
        if not ts:
            continue

        hand = PokerHand(
            hand_id=m.group(1),
            room="PokerStars",
            timestamp=ts,
            datetime_str=m.group(2),
        )
        t = re_tourn.search(block)
        if t:
            hand.tournament_id = t.group(1)
        lv = re_level.search(block)
        if lv:
            hand.level = lv.group(1)
        b = re_board.search(block)
        if b:
            hand.board = b.group(1)
            hand.went_to_showdown = True
        h = re_hole.search(block)
        if h:
            hand.hole_cards = h.group(1)
        if re_showdown.search(block):
            hand.went_to_showdown = True
        w = re_won.search(block)
        if w:
            hand.result = "won"
            hand.net_amount = float(w.group(1))
        elif re.search(r'folds', block):
            hand.result = "folded"
        # Position
        hn = player_nick
        if not hn:
            dn_m = re.search(r"Dealt to (\S+)\s*\[", block)
            hn = dn_m.group(1) if dn_m else ""
        hand.position = _extract_position(block, hn)
        hands.append(hand)

    logger.info(f"PokerStars: {len(hands)} manos parseadas")
    return hands


# ─────────────────────────────────────────────
# 888POKER
# Parser confirmado con muestras reales (nick: tiburock12)
# Formato: #Game No : XXXXXXXX / ***** 888poker Hand History...
# ─────────────────────────────────────────────

def _parse_888poker(content: str, player_nick: str = "") -> List[PokerHand]:
    hands = []
    blocks = re.split(r'\n\n(?=#Game No)', content.strip())

    re_game = re.compile(r"#Game No : (\d+)")
    re_dt = re.compile(r"\*\*\*\s+(\d{2}\s+\d{2}\s+\d{4}\s+\d{2}:\d{2}:\d{2})")
    re_tourn = re.compile(r"Tournament #(\d+)")
    re_board = re.compile(r"\*\* Dealing (the Flop|Turn|River) \*\*.*?\[(.+?)\]")
    re_hole = re.compile(r"Dealt to \S+\s*\[\s*(.+?)\s*\]")
    re_won = re.compile(r"collected \[\s*(\d+(?:\.\d+)?)\s*\]")
    re_showdown = re.compile(r"shows \[")

    for block in blocks:
        m = re_game.search(block)
        if not m:
            continue
        dt_m = re_dt.search(block)
        if not dt_m:
            continue

        # 888poker usa formato "DD MM YYYY HH:MM:SS"
        dt_str = dt_m.group(1)
        parts = dt_str.split()
        if len(parts) == 4:
            normalized = f"{parts[2]}/{parts[1]}/{parts[0]} {parts[3]}"
        else:
            normalized = dt_str

        ts = _parse_dt(normalized)
        if not ts:
            # fallback directo
            try:
                dt = datetime.strptime(dt_str, "%d %m %Y %H:%M:%S")
                ts = dt.replace(tzinfo=timezone.utc).timestamp()
            except Exception:
                continue

        hand = PokerHand(
            hand_id=m.group(1),
            room="888poker",
            timestamp=ts,
            datetime_str=dt_str,
        )
        t = re_tourn.search(block)
        if t:
            hand.tournament_id = t.group(1)

        # Reconstruir board de flop/turn/river
        board_cards = []
        for bm in re_board.finditer(block):
            board_cards.extend(bm.group(2).split())
        if board_cards:
            hand.board = " ".join(board_cards)

        h = re_hole.search(block)
        if h:
            hand.hole_cards = h.group(1)
        if re_showdown.search(block):
            hand.went_to_showdown = True
        w = re_won.search(block)
        if w:
            hand.result = "won"
            hand.net_amount = float(w.group(1))
        elif re.search(r'folds', block, re.IGNORECASE):
            hand.result = "folded"
        # Position
        hn = player_nick
        if not hn:
            dn_m = re.search(r"Dealt to (\S+)\s*\[", block)
            hn = dn_m.group(1) if dn_m else ""
        hand.position = _extract_position(block, hn)
        hands.append(hand)

    logger.info(f"888poker: {len(hands)} manos parseadas")
    return hands


# ─────────────────────────────────────────────
# LATPOKER
# Parser confirmado con muestras reales (nick: TIBUROCK)
# Formato: latpkr Hand #XXXXXXXX: Tournament (Nombre)#XXXXXXXX...
# ─────────────────────────────────────────────

def _parse_latpoker(content: str, player_nick: str = "") -> List[PokerHand]:
    hands = []
    blocks = re.split(r'\n\n(?=latpkr Hand #)', content.strip())

    re_header = re.compile(
        r"latpkr Hand #(\d+):.*?(\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2})\s*(UTC)?"
    )
    re_tourn = re.compile(r"Tournament \([^)]*\)#(\d+)")
    re_level = re.compile(r"Level [IVXLCDM]+ \((\d+/\d+)\)")
    re_board = re.compile(r"\*\*\* (FLOP|TURN|RIVER) \*\*\*.*?\[(.+?)\]")
    re_hole = re.compile(r"Dealt to \S+ \[(.+?)\]")
    re_won = re.compile(r"collected (\d+(?:\.\d+)?) from")
    re_showdown = re.compile(r"\*\*\* SHOW DOWN \*\*\*")

    for block in blocks:
        m = re_header.search(block)
        if not m:
            continue
        ts = _parse_dt(m.group(2))
        if not ts:
            continue

        hand = PokerHand(
            hand_id=m.group(1),
            room="Latpoker",
            timestamp=ts,
            datetime_str=m.group(2),
        )
        t = re_tourn.search(block)
        if t:
            hand.tournament_id = t.group(1)
        lv = re_level.search(block)
        if lv:
            hand.level = lv.group(1)

        board_cards = []
        for bm in re_board.finditer(block):
            for card in bm.group(2).split():
                if card not in board_cards:
                    board_cards.append(card)
        if board_cards:
            hand.board = " ".join(board_cards)

        h = re_hole.search(block)
        if h:
            hand.hole_cards = h.group(1)
        if re_showdown.search(block):
            hand.went_to_showdown = True
        w = re_won.search(block)
        if w:
            hand.result = "won"
            hand.net_amount = float(w.group(1))
        elif re.search(r'folds', block):
            hand.result = "folded"
        # Position
        hn = player_nick
        if not hn:
            dn_m = re.search(r"Dealt to (\S+)\s*\[", block)
            hn = dn_m.group(1) if dn_m else ""
        hand.position = _extract_position(block, hn)
        hands.append(hand)

    logger.info(f"Latpoker: {len(hands)} manos parseadas")
    return hands


# ─────────────────────────────────────────────
# GGPOKER / WPT GLOBAL
# Formato GGNetwork confirmado con muestra real
# - Hand ID: #TM... (torneo) o #RC... (cash)
# - Jugador aparece como "Hero" (anonimizado)
# - Board en SUMMARY: Board [Xc Xd ...]
# - Nivel: Level20(2,500/5,000(750)) — sin espacio
# ─────────────────────────────────────────────

def _parse_ggnetwork(content: str, player_nick: str = "") -> List[PokerHand]:
    hands = []
    blocks = re.split(r'\n\n(?=Poker Hand #)', content.strip())

    re_header = re.compile(
        r"Poker Hand #([A-Z]{2}\d+):.*?(\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2})"
    )
    re_tourn = re.compile(r"Tournament #(\d+)")
    re_level = re.compile(r"Level\d+\((\d[\d,]*/\d[\d,]*)")
    # Board en SUMMARY: "Board [Xc Xd Xs Xh Xd]"
    re_board_summary = re.compile(r"^Board \[(.+?)\]", re.MULTILINE)
    # Cartas del Hero
    re_hole = re.compile(r"Dealt to Hero \[(.+?)\]")
    # Ganador
    re_won = re.compile(r"Hero.*?won \((\d[\d,]*)\)|Hero.*?collected (\d[\d,]*) from")
    re_won_summary = re.compile(r"Hero.*?won \((\d[\d,]*)\)")
    re_showdown = re.compile(r"\*\*\* SHOWDOWN \*\*\*")
    re_room = re.compile(r"(WPT Global)", re.IGNORECASE)

    for block in blocks:
        m = re_header.search(block)
        if not m:
            continue
        ts = _parse_dt(m.group(2))
        if not ts:
            continue

        room_m = re_room.search(block)
        room = room_m.group(1) if room_m else "GGPoker"

        hand = PokerHand(
            hand_id=m.group(1),
            room=room,
            timestamp=ts,
            datetime_str=m.group(2),
        )

        t = re_tourn.search(block)
        if t:
            hand.tournament_id = t.group(1)

        lv = re_level.search(block)
        if lv:
            hand.level = lv.group(1).replace(",", "")

        # Board desde SUMMARY
        b = re_board_summary.search(block)
        if b:
            hand.board = b.group(1)
            hand.went_to_showdown = True

        h = re_hole.search(block)
        if h:
            hand.hole_cards = h.group(1)

        # Stack del hero al inicio de la mano
        stack_m = re.search(r"Hero \((\d[\d,]*) in chips\)", block)
        if stack_m:
            hand.hero_stack = float(stack_m.group(1).replace(",", ""))

        if re_showdown.search(block):
            hand.went_to_showdown = True

        # Resultado desde SUMMARY: "Hero showed [...] and won (X)"
        w_sum = re_won_summary.search(block)
        if w_sum:
            hand.result = "won"
            hand.net_amount = float(w_sum.group(1).replace(",", ""))
        elif re.search(r"Hero.*?lost|Hero folded|Hero: folds", block):
            hand.result = "folded"

        # Position — en GGNetwork el hero siempre aparece listado como "Hero"
        hand.position = _extract_position(block, "Hero")
        hands.append(hand)

    room_name = hands[0].room if hands else "GGPoker/WPT"
    logger.info(f"GGNetwork ({room_name}): {len(hands)} manos parseadas")
    return hands


# ─────────────────────────────────────────────
# ACR (Americas Cardroom)
# Parser confirmado con muestras reales (nick: TIBUR0CK)
# Formato:
#   Header: "Game Hand #XXXXXXXXX - Tournament #XXXXXXXX - Holdem (No Limit) - Level N (SB/BB) - YYYY/MM/DD HH:MM:SS UTC"
#   Hole:   "Dealt to NICK [Xh Xs]"   (bajo *** HOLE CARDS ***)
#   Board:  "Board [Xh Xs ...]"        en *** SUMMARY ***
#   Result: "Seat N: NICK ... won X.XX"  /  "... and lost"  /  "folded on ..."
#   Showdown: "*** SHOW DOWN ***"
# ─────────────────────────────────────────────

def _parse_acr(content: str, player_nick: str = "") -> List[PokerHand]:
    hands = []
    blocks = re.split(r'\n\n+(?=Game Hand #)', content.strip())

    re_header   = re.compile(
        r"Game Hand #(\d+).*?(\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2})"
    )
    re_tourn    = re.compile(r"Tournament #(\d+)")
    re_level    = re.compile(r"Level \d+ \(([\d.]+/[\d.]+)\)")
    re_board    = re.compile(r"^Board \[(.+?)\]", re.MULTILINE)
    re_hole     = re.compile(r"Dealt to (\S+)\s*\[(.+?)\]")
    re_showdown = re.compile(r"\*\*\* SHOW DOWN \*\*\*")

    for block in blocks:
        m = re_header.search(block)
        if not m:
            continue
        ts = _parse_dt(m.group(2))
        if not ts:
            continue

        # Detectar el hero: de player_nick o del "Dealt to"
        h_m = re_hole.search(block)
        if not h_m:
            continue   # Solo trackeamos manos en las que fuimos repartidos
        hero = player_nick if player_nick else h_m.group(1)
        hole_cards = h_m.group(2)

        # Board desde SUMMARY
        b_m = re_board.search(block)
        board = b_m.group(1) if b_m else None

        # Resultado del hero desde la sección *** SUMMARY ***
        # La regex no puede buscar en todo el bloque porque la línea
        # "Seat N: NICK (chips)" al inicio del bloque haría match antes.
        # Posibles formas en SUMMARY:
        #   "Seat N: TIBUR0CK did not show and won 6375.00"
        #   "Seat N: TIBUR0CK (small blind) showed [7h 6s] and lost with ..."
        #   "Seat N: TIBUR0CK folded on the Pre-Flop and did not bet"
        summary_idx = block.find("*** SUMMARY ***")
        summary_section = block[summary_idx:] if summary_idx >= 0 else ""

        re_seat = re.compile(
            r"Seat \d+: " + re.escape(hero) + r"(?:\s*\([^)]+\))?\s+(.*)",
            re.IGNORECASE,
        )
        seat_m = re_seat.search(summary_section)
        result = None
        net_amount = None

        went_to_showdown = False

        if seat_m:
            seat_line = seat_m.group(1)
            won_m = re.search(r"won ([\d.]+)", seat_line)
            if won_m:
                result = "won"
                net_amount = float(won_m.group(1))
            elif "lost" in seat_line.lower():
                result = "lost"
            elif "folded" in seat_line.lower():
                result = "folded"
            # El hero fue a showdown si la línea de SUMMARY dice "showed"
            if "showed" in seat_line.lower():
                went_to_showdown = True

        hand = PokerHand(
            hand_id      = m.group(1),
            room         = "ACR",
            timestamp    = ts,
            datetime_str = m.group(2),
            hole_cards   = hole_cards,
            board        = board,
            result       = result,
            net_amount   = net_amount,
            went_to_showdown = went_to_showdown,
        )

        t = re_tourn.search(block)
        if t:
            hand.tournament_id = t.group(1)

        lv = re_level.search(block)
        if lv:
            hand.level = lv.group(1)

        hand.position = _extract_position(block, hero)
        hands.append(hand)

    logger.info(f"ACR: {len(hands)} manos parseadas")
    return hands


# ─────────────────────────────────────────────
# COOLBET (iPoker XML)
# Parser confirmado con muestras reales (nick: MaTTisaac)
# Formato: XML iPoker Engine
#   - Un archivo .xml = una sesión/torneo completa
#   - Root: <session sessioncode="XXXXXXXXX">
#   - Hero: <player reg_code="sessioncode" name="nick" win="..." bet="...">
#   - Manos: <game gamecode="XXXXXXXXX"> con <round no="0..4">
#   - Fold: <action type="0" player="nick">
#   - Cards: <cards type="Pocket|Flop|Turn|River" player="nick">
# ─────────────────────────────────────────────

def _parse_coolbet_xml(filepath: str, player_nick: str = "") -> List[PokerHand]:
    """
    Parsea un archivo .xml de Coolbet (formato iPoker Engine).
    Un archivo = una sesión/torneo con N manos (<game> elements).
    """
    import xml.etree.ElementTree as ET

    def _chips(val: str) -> float:
        """Convierte '10,000' o '1,100' a float eliminando separadores de miles."""
        if not val:
            return 0.0
        try:
            return float(val.replace(",", "").strip())
        except ValueError:
            return 0.0

    try:
        tree = ET.parse(filepath)
    except ET.ParseError as e:
        logger.error(f"Coolbet XML parse error en {filepath}: {e}")
        return []

    root = tree.getroot()  # <session sessioncode="...">
    session_code = root.get("sessioncode", "")

    # Metadata de la sesión (torneo)
    sess_general = root.find("general")
    if sess_general is None:
        logger.warning(f"Coolbet XML sin <general>: {filepath}")
        return []

    nickname       = sess_general.findtext("nickname",       "").strip()
    tournament_id  = sess_general.findtext("tournamentcode", "").strip() or None
    tournament_name = sess_general.findtext("tournamentname", "").strip()

    # El hero_name definitivo: preferir player_nick si se pasó explícitamente
    hero_name = player_nick if player_nick else nickname

    hands = []

    for game in root.findall("game"):
        gamecode = game.get("gamecode", "")
        game_general = game.find("general")
        if game_general is None:
            continue

        # Timestamp de la mano
        startdate = game_general.findtext("startdate", "").strip()
        ts = _parse_dt(startdate)
        if not ts:
            continue

        # Nivel de blinds (ej: "50/100")
        sb = game_general.findtext("smallblind", "0")
        bb = game_general.findtext("bigblind",   "0")
        level_str = f"{sb}/{bb}"

        # Localizar al hero entre los jugadores de esta mano
        hero_player_el = None
        for p in game_general.findall("players/player"):
            if p.get("reg_code") == session_code:
                hero_player_el = p
                break
        if hero_player_el is None:
            for p in game_general.findall("players/player"):
                if p.get("name") == hero_name:
                    hero_player_el = p
                    break

        if hero_player_el is not None:
            actual_hero_name = hero_player_el.get("name", hero_name)
            hero_win = _chips(hero_player_el.get("win", "0"))
            hero_bet = _chips(hero_player_el.get("bet", "0"))
        else:
            # Hero no participó en esta mano (poco probable, pero defensivo)
            actual_hero_name = hero_name
            hero_win = 0.0
            hero_bet = 0.0

        # ── Posición (usa atributo dealer="1" del elemento player) ──
        _btn_seat_xml  = None
        _hero_seat_xml = None
        _all_seats_xml = []
        for _p in game_general.findall("players/player"):
            _s = int(_p.get("seat", 0))
            if _s > 0:
                _all_seats_xml.append(_s)
            if _p.get("dealer") == "1":
                _btn_seat_xml = _s
            if hero_player_el is not None and _p is hero_player_el:
                _hero_seat_xml = _s
        _position_xml = (
            _calculate_position(_hero_seat_xml, _btn_seat_xml, _all_seats_xml)
            if _btn_seat_xml and _hero_seat_xml
            else None
        )

        # ── Recorrer rounds para extraer cartas y acciones del hero ──
        hole_cards    = None
        flop_cards    = []
        turn_card     = None
        river_card    = None
        hero_folded   = False

        for rnd in game.findall("round"):
            rnd_no = int(rnd.get("no", "0"))

            # Comprobar si el hero plegó en este round (type="0")
            for action in rnd.findall("action"):
                if action.get("player") == actual_hero_name and action.get("type") == "0":
                    hero_folded = True

            if rnd_no == 1:  # Pre-flop
                for cards_el in rnd.findall("cards"):
                    if (cards_el.get("type") == "Pocket"
                            and cards_el.get("player") == actual_hero_name):
                        val = (cards_el.text or "").strip()
                        if val and "X" not in val:
                            hole_cards = val

            elif rnd_no == 2:  # Flop
                for cards_el in rnd.findall("cards"):
                    if cards_el.get("type") == "Flop":
                        flop_cards = (cards_el.text or "").strip().split()

            elif rnd_no == 3:  # Turn
                for cards_el in rnd.findall("cards"):
                    if cards_el.get("type") == "Turn":
                        turn_card = (cards_el.text or "").strip()

            elif rnd_no == 4:  # River
                for cards_el in rnd.findall("cards"):
                    if cards_el.get("type") == "River":
                        river_card = (cards_el.text or "").strip()

        # ── Resultado ──
        if hero_win > 0:
            result = "won"
            net_amount = hero_win - hero_bet
        elif hero_folded:
            result = "folded"
            net_amount = -hero_bet
        else:
            result = "lost"
            net_amount = -hero_bet

        # ── Board ──
        board_parts = flop_cards[:]
        if turn_card:
            board_parts.append(turn_card)
        if river_card:
            board_parts.append(river_card)
        board = " ".join(board_parts) if board_parts else None

        # ── Showdown: llegó al river y no plegó ──
        went_to_showdown = bool(river_card and not hero_folded)

        hand = PokerHand(
            hand_id      = gamecode,
            room         = "Coolbet",
            timestamp    = ts,
            datetime_str = startdate,
            tournament_id = tournament_id,
            level        = level_str,
            result       = result,
            net_amount   = net_amount if net_amount != 0 else None,
            board        = board,
            hole_cards   = hole_cards,
            position     = _position_xml,
            went_to_showdown = went_to_showdown,
        )
        hands.append(hand)

    logger.info(
        f"Coolbet XML [{session_code}]: {len(hands)} manos "
        f"(torneo: {tournament_name}, nick: {actual_hero_name if hands else hero_name})"
    )
    return hands


# ─────────────────────────────────────────────
# DETECTOR DE SALA Y DISPATCHER
# ─────────────────────────────────────────────

# Coolbet usa XML — se detecta por extensión .xml en load_hand_history(),
# NO aparece aquí porque este listado es solo para archivos de texto.
ROOM_DETECTORS = [
    ("PokerStars", r"PokerStars Hand #",          _parse_pokerstars),
    ("GGPoker",    r"Poker Hand #TM",              _parse_ggnetwork),
    ("GGPoker",    r"Poker Hand #RC",              _parse_ggnetwork),
    ("WPT Global", r"Poker Hand #HD",              _parse_ggnetwork),
    ("GGNetwork",  r"Poker Hand #[A-Z]{2}\d+",    _parse_ggnetwork),
    ("888poker",   r"#Game No :",                  _parse_888poker),
    ("Latpoker",   r"latpkr Hand #",               _parse_latpoker),
    ("ACR",        r"Game Hand #\d+",               _parse_acr),
]


def detect_room(content: str) -> Optional[str]:
    """Detecta la sala de poker por el contenido del archivo."""
    for room_name, pattern, _ in ROOM_DETECTORS:
        if re.search(pattern, content):
            return room_name
    return None


def load_hand_history(filepath: str, player_nick: str = "") -> List[PokerHand]:
    """
    Carga y parsea un archivo de hand history detectando la sala automáticamente.
    Soporta archivos .txt/.log (PokerStars, GGPoker, WPT Global, 888poker, Latpoker, ACR)
    y archivos .xml (Coolbet/iPoker Engine).

    Args:
        filepath: ruta al archivo de hand history (.txt o .xml)
        player_nick: nickname del jugador (opcional; Coolbet lo lee del XML)

    Returns:
        lista de PokerHand parseadas y ordenadas por timestamp
    """
    if not os.path.isfile(filepath):
        logger.error(f"Archivo no encontrado: {filepath}")
        return []

    ext = os.path.splitext(filepath)[1].lower()

    # ── Coolbet: archivos XML (iPoker Engine) ──
    if ext == ".xml":
        logger.info(f"Formato XML detectado — parser Coolbet iPoker: {filepath}")
        hands = _parse_coolbet_xml(filepath, player_nick)
        hands.sort(key=lambda h: h.timestamp)
        return hands

    # ── Salas de texto: detección por contenido ──
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except OSError as e:
        logger.error(f"Error leyendo archivo {filepath}: {e}")
        return []

    room = detect_room(content)
    if not room:
        logger.warning(f"Sala no reconocida en: {filepath}")
        return []

    logger.info(f"Sala detectada: {room} — archivo: {filepath}")

    parser_fn = next((fn for rn, _, fn in ROOM_DETECTORS if rn == room), None)
    if not parser_fn:
        return []

    hands = parser_fn(content, player_nick)
    hands.sort(key=lambda h: h.timestamp)
    return hands
