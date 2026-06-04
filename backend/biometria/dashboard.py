"""
dashboard.py — Dashboard web de análisis biométrico/poker.

Levanta un servidor Flask local que muestra estadísticas de una sesión
de hand history, incluyendo HR correlacionado si está disponible.

Uso:
    from biometria.dashboard import launch_dashboard
    launch_dashboard(hands, filepath="torneos.txt", port=5000)
"""

import os
import json
import random
import threading
import webbrowser
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from loguru import logger

from .hand_history import PokerHand, streets_played


# ─────────────────────────────────────────────
# Orden canónico de posiciones (mejor → peor)
# ─────────────────────────────────────────────

_POSITION_ORDER = [
    "BTN", "CO", "HJ", "MP",
    "UTG+2", "UTG+1", "UTG",
    "BB", "SB",
]


def _pos_index(pos: str) -> int:
    try:
        return _POSITION_ORDER.index(pos)
    except ValueError:
        return len(_POSITION_ORDER)


# ─────────────────────────────────────────────
# Simulación de HR para demo
# ─────────────────────────────────────────────

def _simulate_hr(hands: List[PokerHand]) -> List[PokerHand]:
    """
    Genera HR por calle (preflop / flop / turn / river) para cada mano.

    Modelo fisiológico:
    - Base: 72-76 BPM en reposo, con curva de sesión (sube al inicio, meseta, baja al final)
    - Por calle: HR escala a medida que la mano avanza (preflop < flop < turn < river)
    - Factor de tensión (tf) determinado por resultado:
        fold preflop: tf muy bajo (0.3-1.0)   → poca reacción, se fue rápido
        fold post-flop: tf medio (1.0-2.5)    → vio las cartas comunitarias, algo de tensión
        won: tf alto (2.5-4.5), extra si SD   → emoción de ganar
        lost: tf máximo (3.5-5.5)             → estrés de perder
    - Solo se generan las calles que la mano alcanzó (board + went_to_showdown)
    - hr_avg = promedio de las calles jugadas

    Seed fija (42) → siempre reproducible para el mismo archivo.
    """
    if not hands:
        return hands

    rng = random.Random(42)
    n   = len(hands)

    def _curve(i: int) -> float:
        p = i / max(n - 1, 1)
        if p < 0.25:   return p / 0.25 * 6
        elif p < 0.65: return 6.0
        else:          return 6.0 * (1 - (p - 0.65) / 0.35)

    base = rng.uniform(72.0, 76.0)

    for i, hand in enumerate(hands):
        curve   = _curve(i)
        streets = streets_played(hand)

        # Factor de tensión según resultado y streets jugadas
        if hand.result == "folded" and streets == 1:
            tf = rng.uniform(0.3, 1.0)
        elif hand.result == "folded":
            tf = rng.uniform(1.0, 2.5)
        elif hand.result == "won":
            tf = rng.uniform(2.5, 4.5)
            if hand.went_to_showdown:
                tf *= 1.4
        elif hand.result == "lost":
            tf = rng.uniform(3.5, 5.5)
        else:
            tf = rng.uniform(1.5, 3.0)

        # ── Preflop (siempre presente) ──
        hr_pf = base + curve + tf * 0.4 + rng.uniform(-1.5, 1.5)
        hr_pf = round(max(58.0, min(145.0, hr_pf)), 1)

        # ── Flop ──
        hr_fl = None
        if streets >= 2:
            hr_fl = hr_pf + tf * rng.uniform(1.0, 2.0) + rng.uniform(2.0, 5.0)
            hr_fl = round(max(58.0, min(145.0, hr_fl)), 1)

        # ── Turn ──
        hr_tu = None
        if streets >= 3:
            hr_tu = hr_fl + tf * rng.uniform(0.8, 1.5) + rng.uniform(1.5, 4.0)
            hr_tu = round(max(58.0, min(145.0, hr_tu)), 1)

        # ── River ──
        hr_ri = None
        if streets >= 4:
            hr_ri = hr_tu + tf * rng.uniform(1.2, 2.2) + rng.uniform(3.0, 7.0)
            hr_ri = round(max(58.0, min(145.0, hr_ri)), 1)

        hand.hr_preflop = hr_pf
        hand.hr_flop    = hr_fl
        hand.hr_turn    = hr_tu
        hand.hr_river   = hr_ri

        played      = [v for v in [hr_pf, hr_fl, hr_tu, hr_ri] if v is not None]
        hand.hr_avg = round(sum(played) / len(played), 1) if played else None

    return hands


# ─────────────────────────────────────────────
# Cálculo de estadísticas
# ─────────────────────────────────────────────

def compute_stats(hands: List[PokerHand], filepath: str = "") -> dict:
    """
    Calcula todas las estadísticas necesarias para el dashboard.

    Returns:
        dict con las claves que consume dashboard.html.
    """
    if not hands:
        return {
            "error": "No hay manos — sube un archivo de hand history.",
            "total": 0, "room": "—", "won_pct": 0, "sd_pct": 0,
            "total_net": 0, "total_net_str": "0", "n_won": 0, "n_folded": 0, "n_lost": 0,
            "tournament_id": "—", "date_start": "—", "date_end": "", "duration": "—",
            "filepath": "", "positions": [], "levels": [], "hands_detail": [],
            "tension_hands": [], "timeline_labels": [], "timeline_data": [],
            "stack_data": [], "timeline_labels_stack": [], "has_stack": False,
            "has_hr": False, "hr_data": [], "hr_preflop_data": [], "hr_river_data": [],
            "hr_avg_session": None, "hr_max_session": None, "hr_min_session": None,
            "upload_msg": "", "session_id": "", "demo": False,
        }

    total = len(hands)
    room  = hands[0].room

    # ── Resumen global ──
    n_won      = sum(1 for h in hands if h.result == "won")
    n_folded   = sum(1 for h in hands if h.result == "folded")
    n_lost     = sum(1 for h in hands if h.result == "lost")
    n_showdown = sum(1 for h in hands if h.went_to_showdown)

    net_hands = [h for h in hands if h.net_amount is not None]
    total_net = sum(h.net_amount for h in net_hands)

    tournament_id = hands[0].tournament_id or "—"

    # ── Rango de fechas y duración ──
    timestamps = sorted(h.timestamp for h in hands if h.timestamp)
    if timestamps:
        dt_start = datetime.fromtimestamp(timestamps[0],  tz=timezone.utc)
        dt_end   = datetime.fromtimestamp(timestamps[-1], tz=timezone.utc)
        date_start = dt_start.strftime("%Y-%m-%d %H:%M")
        date_end   = dt_end.strftime("%H:%M UTC")
        dur_min    = (timestamps[-1] - timestamps[0]) / 60
        if dur_min >= 60:
            dur_str = f"{int(dur_min // 60)}h {int(dur_min % 60)}min"
        else:
            dur_str = f"{int(dur_min)}min"
    else:
        date_start = date_end = dur_str = "—"

    # ── Estadísticas por posición ──
    pos_buckets: dict = defaultdict(
        lambda: {"manos": 0, "won": 0, "folded": 0, "lost": 0,
                 "net": 0.0, "showdown": 0, "hr_sum": 0.0, "hr_count": 0}
    )
    for h in hands:
        pos = h.position or "?"
        pos_buckets[pos]["manos"] += 1
        if h.result == "won":
            pos_buckets[pos]["won"] += 1
        elif h.result == "folded":
            pos_buckets[pos]["folded"] += 1
        elif h.result == "lost":
            pos_buckets[pos]["lost"] += 1
        if h.net_amount is not None:
            pos_buckets[pos]["net"] += h.net_amount
        if h.went_to_showdown:
            pos_buckets[pos]["showdown"] += 1
        if h.hr_avg is not None:
            pos_buckets[pos]["hr_sum"]   += h.hr_avg
            pos_buckets[pos]["hr_count"] += 1

    positions = []
    for pos in sorted(pos_buckets.keys(), key=_pos_index):
        d = pos_buckets[pos]
        m = d["manos"]
        hr_avg_pos = (round(d["hr_sum"] / d["hr_count"], 1)
                      if d["hr_count"] > 0 else None)
        positions.append({
            "pos":      pos,
            "manos":    m,
            "won":      d["won"],
            "won_pct":  round(d["won"]      / m * 100, 1),
            "folded":   d["folded"],
            "lost":     d["lost"],
            "sd_pct":   round(d["showdown"] / m * 100, 1),
            "net":      round(d["net"]),
            "net_str":  f"+{d['net']:,.0f}" if d["net"] >= 0 else f"{d['net']:,.0f}",
            "hr_avg":   hr_avg_pos,
        })

    # ── Timeline: fichas ganadas acumuladas mano a mano ──
    sorted_hands = sorted(hands, key=lambda h: h.timestamp or 0)
    running = 0.0
    timeline_data   = []
    timeline_labels = []
    for i, h in enumerate(sorted_hands, 1):
        if h.net_amount is not None:
            running += h.net_amount
        timeline_data.append(round(running, 1))
        timeline_labels.append(str(i))

    # ── Stack real del hero por mano ──
    stack_data = []
    stacks = [h.hero_stack for h in sorted_hands if h.hero_stack is not None]
    if stacks:
        for h in sorted_hands:
            stack_data.append(h.hero_stack if h.hero_stack is not None else None)
        # Agregar 0 al final si el último stack no es 0 (hero eliminado)
        if stack_data and stack_data[-1] and stack_data[-1] > 0:
            stack_data.append(0)
            timeline_labels_stack = [str(i) for i in range(1, len(stack_data) + 1)]
        else:
            timeline_labels_stack = timeline_labels[:]
    else:
        timeline_labels_stack = timeline_labels[:]

    # ── HR (si está correlacionado o demo) ──
    hr_values = [h.hr_avg for h in sorted_hands]
    has_hr    = any(v is not None for v in hr_values)
    hr_data   = hr_values  # hr_avg por mano (para el chart principal)

    # Series por calle para el chart HR (preflop = baseline, river = pico)
    hr_preflop_data = [h.hr_preflop for h in sorted_hands]
    hr_river_data   = [h.hr_river   for h in sorted_hands]

    # ── HR: métricas globales ──
    hr_nums = [v for v in hr_values if v is not None]
    hr_avg_session = round(sum(hr_nums) / len(hr_nums), 1) if hr_nums else None
    hr_max_session = max(hr_nums) if hr_nums else None
    hr_min_session = min(hr_nums) if hr_nums else None

    # ── Manos de mayor tensión (top 5 por HR) ──
    tension_hands = []
    if has_hr:
        with_hr = [(i+1, h, h.hr_avg) for i, h in enumerate(sorted_hands) if h.hr_avg is not None]
        top5    = sorted(with_hr, key=lambda x: x[2], reverse=True)[:5]
        for n, h, bpm in top5:
            net_str_val = ""
            if h.net_amount is not None:
                net_str_val = (f"+{h.net_amount:,.0f}" if h.net_amount >= 0
                               else f"{h.net_amount:,.0f}")
            tension_hands.append({
                "hand_id":    h.hand_id,
                "hand_n":     n,
                "hole_cards": h.hole_cards or "—",
                "position":   h.position or "—",
                "result":     h.result   or "—",
                "net":        round(h.net_amount) if h.net_amount is not None else None,
                "net_str":    net_str_val,
                "hr":         bpm,
                "hr_preflop": h.hr_preflop,
                "hr_flop":    h.hr_flop,
                "hr_turn":    h.hr_turn,
                "hr_river":   h.hr_river,
                "showdown":   h.went_to_showdown,
            })

    # ── Detalle mano a mano (con HR por calle) ──
    hands_detail = []
    for i, h in enumerate(sorted_hands, 1):
        net_str_val = ""
        if h.net_amount is not None:
            net_str_val = (f"+{h.net_amount:,.0f}" if h.net_amount >= 0
                           else f"{h.net_amount:,.0f}")
        hands_detail.append({
            "n":          i,
            "hand_id":    h.hand_id,
            "position":   h.position  or "—",
            "hole_cards": h.hole_cards or "—",
            "board":      h.board     or "—",
            "result":     h.result    or "—",
            "net":        round(h.net_amount) if h.net_amount is not None else None,
            "net_str":    net_str_val,
            "showdown":   h.went_to_showdown,
            # HR por calle
            "hr_preflop": h.hr_preflop,
            "hr_flop":    h.hr_flop,
            "hr_turn":    h.hr_turn,
            "hr_river":   h.hr_river,
        })

    # ── Estadísticas por nivel de blinds ──
    level_buckets: dict = defaultdict(
        lambda: {"manos": 0, "won": 0, "net": 0.0, "hands": []}
    )
    for i, h in enumerate(sorted_hands, 1):
        if h.level:
            level_buckets[h.level]["manos"] += 1
            if h.result == "won":
                level_buckets[h.level]["won"] += 1
            if h.net_amount is not None:
                level_buckets[h.level]["net"] += h.net_amount
            net_str_val = ""
            if h.net_amount is not None:
                net_str_val = f"+{h.net_amount:,.0f}" if h.net_amount >= 0 else f"{h.net_amount:,.0f}"
            level_buckets[h.level]["hands"].append({
                "n":          i,
                "position":   h.position or "—",
                "hole_cards": h.hole_cards or "—",
                "board":      h.board or "—",
                "result":     h.result or "—",
                "net_str":    net_str_val,
            })

    def _level_sort(lv):
        # ordena numéricamente por el SB (primer número de "SB/BB")
        try:
            return int(lv.split("/")[0].replace(",", ""))
        except (ValueError, IndexError):
            return 0

    levels = [
        {
            "level":    lv,
            "manos":    d["manos"],
            "won_pct":  round(d["won"] / d["manos"] * 100, 1) if d["manos"] > 0 else 0,
            "net":      round(d["net"]),
            "net_str":  f"+{d['net']:,.0f}" if d["net"] >= 0 else f"{d['net']:,.0f}",
            "hands":    d["hands"],
        }
        for lv, d in sorted(level_buckets.items(), key=lambda x: _level_sort(x[0]))
    ]

    return {
        # Meta
        "filepath":     Path(filepath).name if filepath else "—",
        "room":         room,
        "tournament_id": tournament_id,
        "date_start":   date_start,
        "date_end":     date_end,
        "duration":     dur_str,
        # Resumen
        "total":        total,
        "n_won":        n_won,
        "n_folded":     n_folded,
        "n_lost":       n_lost,
        "n_showdown":   n_showdown,
        "won_pct":      round(n_won      / total * 100, 1),
        "fold_pct":     round(n_folded   / total * 100, 1),
        "sd_pct":       round(n_showdown / total * 100, 1),
        "total_net":    round(total_net),
        "total_net_str": f"+{total_net:,.0f}" if total_net >= 0 else f"{total_net:,.0f}",
        # Tablas
        "positions":    positions,
        "levels":       levels,
        # Charts
        "timeline_labels":  timeline_labels,
        "timeline_data":    timeline_data,
        "stack_data":       stack_data,
        "timeline_labels_stack": timeline_labels_stack,
        "has_stack":        bool(stacks),
        "has_hr":           has_hr,
        "hr_data":          hr_data,
        "hr_preflop_data":  hr_preflop_data,
        "hr_river_data":    hr_river_data,
        # HR métricas globales
        "hr_avg_session":   hr_avg_session,
        "hr_max_session":   hr_max_session,
        "hr_min_session":   hr_min_session,
        # Tensión
        "tension_hands":   tension_hands,
        # Detalle por mano
        "hands_detail":    hands_detail,
    }


# ─────────────────────────────────────────────
# Flask app
# ─────────────────────────────────────────────

def launch_dashboard(
    hands: List[PokerHand],
    filepath: str = "",
    session_id: str = "",
    port: int = 5100,
    auto_open: bool = True,
    demo: bool = False,
) -> None:
    """
    Levanta el servidor Flask y abre el navegador.

    Args:
        hands:      lista de PokerHand (ya correlacionadas si aplica)
        filepath:   ruta del archivo de hand history (solo para mostrar nombre)
        session_id: ID de sesión biométrica (informativo)
        port:       puerto TCP del servidor (default 5100)
        auto_open:  si True, abre el navegador automáticamente
        demo:       si True, genera HR sintético para mostrar el dashboard completo
    """
    try:
        from flask import Flask, render_template
    except ImportError:
        logger.error(
            "Flask no está instalado.\n"
            "  Instálalo con:  pip install flask"
        )
        return

    if demo:
        logger.info("Modo DEMO: generando HR sintético...")
        hands = _simulate_hr(list(hands))   # copia para no mutar el original

    try:
        from flask import request, redirect, url_for
        import tempfile
    except ImportError:
        pass

    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
    app = Flask(__name__, template_folder=templates_dir)
    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max

    # Estado mutable para permitir recarga de manos
    state = {
        "hands":      hands,
        "filepath":   filepath,
        "session_id": session_id,
        "demo":       demo,
    }

    def _build_stats():
        s = compute_stats(state["hands"], state["filepath"])
        s["session_id"] = state["session_id"]
        s["demo"]       = state["demo"]
        s.setdefault("upload_msg", "")
        return s

    @app.route("/")
    def index():
        from flask import request as req
        import traceback
        msg = req.args.get("msg", "")
        try:
            s = _build_stats()
            s["upload_msg"] = msg
            return render_template("dashboard.html", **s)
        except Exception as e:
            tb = traceback.format_exc()
            logger.error(f"Error al renderizar dashboard: {e}\n{tb}")
            return f"<pre style='color:red'>{tb}</pre>", 500

    @app.route("/upload", methods=["POST"])
    def upload():
        from flask import request as req
        import zipfile as zf2

        f = req.files.get("hand_history")
        if not f or f.filename == "":
            return redirect("/?msg=error_no_archivo")

        # Carpeta permanente para el último historial
        last_dir = os.path.join(os.path.expanduser("~"), ".mindev-bio", "last_hand_history")
        os.makedirs(last_dir, exist_ok=True)

        suffix = ".txt" if f.filename.endswith(".txt") else ".zip"
        saved_path = os.path.join(last_dir, f"last{suffix}")
        f.save(saved_path)

        # Si es zip, extraer
        filepath_to_parse = saved_path
        if suffix == ".zip":
            with zf2.ZipFile(saved_path, "r") as z:
                z.extractall(last_dir)
                txts = [x for x in z.namelist() if x.endswith(".txt")]
                if txts:
                    filepath_to_parse = os.path.join(last_dir, txts[0])

        # Guardar el path del txt para próxima apertura
        meta_path = os.path.join(last_dir, "last.txt")
        with open(meta_path, "w") as mf:
            mf.write(filepath_to_parse + "\n" + f.filename)

        from .hand_history import load_hand_history
        new_hands = load_hand_history(filepath_to_parse)
        if not new_hands:
            return redirect("/?msg=error_sin_manos")

        # Aplicar correlación relativa si hay sesión HR
        if state["session_id"]:
            from .persistence import load_session
            session = load_session(state["session_id"])
            if session and session.hr_samples:
                hands_timed = sorted([h for h in new_hands if h.timestamp], key=lambda h: h.timestamp)
                if hands_timed:
                    t0_h = hands_timed[0].timestamp
                    t0_r = session.hr_samples[0].timestamp
                    for hand in hands_timed:
                        t_rel = hand.timestamp - t0_h
                        hr_win = [s.bpm for s in session.hr_samples if abs((s.timestamp - t0_r) - t_rel) <= 60]
                        if hr_win:
                            hand.hr_avg = round(sum(hr_win) / len(hr_win), 1)
                        else:
                            closest = min(session.hr_samples, key=lambda s: abs((s.timestamp - t0_r) - t_rel))
                            hand.hr_avg = float(closest.bpm)
                        hand.hr_preflop = hand.hr_avg

        state["hands"]    = new_hands
        state["filepath"] = f.filename
        return redirect("/?msg=ok_" + str(len(new_hands)))

    if auto_open:
        def _open_browser():
            import time
            time.sleep(1.2)
            webbrowser.open(f"http://localhost:{port}")
        threading.Thread(target=_open_browser, daemon=True).start()

    logger.info(f"Dashboard en http://localhost:{port}  (Ctrl+C para detener)")
    app.run(host="127.0.0.1", port=port, debug=True, use_reloader=False)
