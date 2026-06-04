"""
hr_server.py — Servidor HTTP para recibir HR desde Tasker/teléfono vía WiFi.

El teléfono Android (Tasker) lee el HR de Samsung Health y hace un
POST /api/hr cada 5 segundos a este servidor.

Los datos se almacenan en una BioSession activa y se persisten en disco
al detener el servidor (Ctrl+C o POST /api/stop).

Uso:
    python main.py hr-server
    python main.py hr-server --port 5150

Endpoint de Tasker:
    POST http://<IP_PC>:5150/api/hr
    Body (JSON): {"bpm": 85}
    Body (texto plano): 85
"""

import threading
from typing import Optional

from flask import Flask, request, jsonify
from loguru import logger

from .session import BioSession
from .persistence import save_session


# ─────────────────────────────────────────────
# Estado global del servidor
# ─────────────────────────────────────────────

_session: Optional[BioSession] = None
_session_lock = threading.Lock()


def get_active_session() -> Optional[BioSession]:
    """Retorna la sesión HR activa (si hay una corriendo)."""
    return _session


# ─────────────────────────────────────────────
# Servidor Flask
# ─────────────────────────────────────────────

def start_hr_server(port: int = 5150) -> Optional[BioSession]:
    """
    Inicia el servidor HTTP para recibir HR de Tasker.

    Escucha en 0.0.0.0:<port> — accesible desde el teléfono en la misma red WiFi.

    Returns:
        La BioSession con los datos recibidos (al terminar).
    """
    global _session

    _session = BioSession()
    _session.start({"room_name": "Tasker/WiFi", "process_name": "hr_server", "pid": 0})

    app = Flask(__name__)
    # Silenciar logs de Flask (usamos loguru)
    import logging
    log = logging.getLogger("werkzeug")
    log.setLevel(logging.ERROR)

    @app.route("/")
    def status():
        """Estado del servidor — útil para verificar desde el navegador del teléfono."""
        if not _session:
            return jsonify({"status": "no_session"})
        s = _session.summary()
        last_bpm = _session.hr_samples[-1].bpm if _session.hr_samples else None
        return jsonify({
            "status":     "ok",
            "session_id": s["session_id"][:8],
            "hr_samples": s["hr_samples"],
            "hr_avg":     s["hr_avg"],
            "hr_last":    last_bpm,
        })

    @app.route("/api/hr", methods=["POST"])
    def receive_hr():
        """
        Recibe una muestra de HR desde Tasker.

        Acepta:
            JSON:  {"bpm": 85}
            Texto: "85"
        """
        bpm = None

        # Intentar JSON primero
        data = request.get_json(silent=True)
        if data and "bpm" in data:
            bpm = data["bpm"]

        # Fallback: texto plano (Tasker puede enviar solo el número)
        if bpm is None:
            try:
                bpm = int(request.data.decode().strip())
            except Exception:
                pass

        if bpm is None:
            return jsonify({"error": "Se requiere bpm — body: {\"bpm\": 85} o texto: 85"}), 400

        try:
            bpm = int(bpm)
        except (ValueError, TypeError):
            return jsonify({"error": "bpm debe ser entero"}), 400

        if not (30 <= bpm <= 220):
            return jsonify({"error": f"bpm {bpm} fuera de rango válido [30-220]"}), 400

        with _session_lock:
            _session.add_hr_sample(bpm)

        n = len(_session.hr_samples)
        logger.info(f"HR WiFi: {bpm} BPM  (muestra #{n})")
        return jsonify({"ok": True, "bpm": bpm, "samples": n})

    @app.route("/status", methods=["GET"])
    def hr_status():
        """Estado actual del servidor — usado por el HUD."""
        with _session_lock:
            last_bpm = _session.hr_samples[-1].bpm if _session.hr_samples else 0
            last_20  = [s.bpm for s in _session.hr_samples[-20:]]
            avg_20   = round(sum(last_20) / len(last_20), 1) if last_20 else 0
        return jsonify({
            "active":   _session.is_active,
            "last_bpm": last_bpm,
            "avg_20":   avg_20,
            "samples":  len(_session.hr_samples),
        })

    @app.route("/api/stop", methods=["POST"])
    def stop_session():
        """Finaliza y guarda la sesión en disco."""
        with _session_lock:
            if _session.is_active:
                _session.stop()
            path = save_session(_session)
        logger.info(f"Sesión guardada: {path}")
        return jsonify({
            "ok":        True,
            "saved":     str(path),
            "session_id": _session.session_id[:8],
            "hr_samples": len(_session.hr_samples),
        })

    logger.info(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info(f"HR Server activo en puerto {port}")
    logger.info(f"Sesión: {_session.session_id[:8]}")
    logger.info(f"Endpoint Tasker → POST http://192.168.0.8:{port}/api/hr")
    logger.info(f"Body: {{\"bpm\": VALOR}}")
    logger.info(f"Verificar en el teléfono: http://192.168.0.8:{port}")
    logger.info(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    try:
        app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        pass

    # Guardar automáticamente al detener con Ctrl+C
    if _session and _session.is_active:
        _session.stop()
        path = save_session(_session)
        logger.info(f"Sesión guardada automáticamente: {path}")

    return _session
