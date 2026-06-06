"""
MinDev Bio — App de escritorio Windows
Servidor HR local que recibe BPM desde el reloj Galaxy Watch
y lo expone en http://127.0.0.1:5150 para mindev-ia.com
"""

import sys
import os
import socket
import threading
import webbrowser
import time
from flask import Flask, request, jsonify

# ── Detectar si corre como .exe empaquetado ──────────────────────────────────
def resource_path(rel):
    base = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, rel)

# ── Intentar importar customtkinter; fallback a tkinter puro ─────────────────
try:
    import customtkinter as ctk
    USE_CTK = True
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("dark-blue")
except ImportError:
    import tkinter as tk
    from tkinter import ttk
    USE_CTK = False

# ── Colores del site MindEV ──────────────────────────────────────────────────
C_BG        = "#0a0e1a"
C_CARD      = "#1a2235"
C_BORDER    = "#2a3a55"
C_PINK      = "#f472b6"
C_GOLD      = "#d4af37"
C_GREEN     = "#4ade80"
C_RED       = "#f87171"
C_MUTED     = "#64748b"
C_TEXT      = "#e2e8f0"

# ── Estado global del servidor HR ────────────────────────────────────────────
_server_active   = False
_last_bpm        = 0
_sample_count    = 0
_server_thread   = None
_flask_app       = None
_werkzeug_server = None   # referencia para poder detenerlo
_bpm_history     = []
_on_bpm_callback = None   # callback(bpm) que actualiza la UI


# ── Flask server ─────────────────────────────────────────────────────────────
def _build_flask_app():
    app = Flask(__name__)
    import logging
    logging.getLogger("werkzeug").setLevel(logging.ERROR)

    def _cors(response):
        response.headers["Access-Control-Allow-Origin"]  = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    app.after_request(_cors)

    @app.route("/status", methods=["GET", "OPTIONS"])
    def status():
        return jsonify({
            "active":   _server_active,
            "last_bpm": _last_bpm,
            "samples":  _sample_count,
        })

    @app.route("/api/hr", methods=["POST"])
    def receive_hr():
        global _last_bpm, _sample_count, _bpm_history
        bpm = None
        data = request.get_json(silent=True)
        if data and "bpm" in data:
            bpm = data["bpm"]
        if bpm is None:
            try:
                bpm = int(request.data.decode().strip())
            except Exception:
                pass
        if bpm is None:
            return jsonify({"error": "Se requiere bpm"}), 400
        try:
            bpm = int(bpm)
        except (ValueError, TypeError):
            return jsonify({"error": "bpm debe ser entero"}), 400
        if not (30 <= bpm <= 220):
            return jsonify({"error": f"bpm {bpm} fuera de rango"}), 400

        _last_bpm = bpm
        _sample_count += 1
        _bpm_history.append(bpm)
        if len(_bpm_history) > 60:
            _bpm_history.pop(0)
        if _on_bpm_callback:
            _on_bpm_callback(bpm)
        return jsonify({"ok": True, "bpm": bpm, "samples": _sample_count})

    @app.route("/", methods=["GET"])
    def root():
        return jsonify({"status": "ok", "last_bpm": _last_bpm})

    return app


def _start_flask(port=5150):
    global _flask_app, _server_active, _werkzeug_server
    from werkzeug.serving import make_server
    _flask_app = _build_flask_app()
    _werkzeug_server = make_server("0.0.0.0", port, _flask_app)
    _server_active = True
    _werkzeug_server.serve_forever()
    # Al salir de serve_forever el servidor fue detenido
    _server_active = False

def _stop_flask():
    global _werkzeug_server, _server_active
    if _werkzeug_server:
        _werkzeug_server.shutdown()
        _werkzeug_server = None
    _server_active = False


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


# ══════════════════════════════════════════════════════════════════════════════
# UI — customtkinter
# ══════════════════════════════════════════════════════════════════════════════
def run_ui_ctk():
    import customtkinter as ctk

    root = ctk.CTk()
    root.title("MinDev Bio")
    root.geometry("380x520")
    root.resizable(False, False)
    root.configure(fg_color=C_BG)

    # Intentar poner ícono
    try:
        ico = resource_path("icon.ico")
        if os.path.exists(ico):
            root.iconbitmap(ico)
    except Exception:
        pass

    # ── Variables reactivas ───────────────────────────────────────────────────
    status_var = ctk.StringVar(value="● Servidor detenido")
    bpm_var    = ctk.StringVar(value="--")
    ip_var     = ctk.StringVar(value=f"IP: {get_local_ip()}")
    samples_var= ctk.StringVar(value="0 muestras")

    # ── Título ────────────────────────────────────────────────────────────────
    ctk.CTkLabel(root, text="MinDev Bio",
                 font=ctk.CTkFont(size=26, weight="bold"),
                 text_color=C_PINK).pack(pady=(28, 2))
    ctk.CTkLabel(root, text="Biometría + Poker",
                 font=ctk.CTkFont(size=12),
                 text_color=C_MUTED).pack(pady=(0, 20))

    # ── Card IP ───────────────────────────────────────────────────────────────
    ip_frame = ctk.CTkFrame(root, fg_color=C_CARD, corner_radius=12,
                             border_width=1, border_color=C_BORDER)
    ip_frame.pack(fill="x", padx=24, pady=(0, 8))
    ctk.CTkLabel(ip_frame, text="IP de este PC (ingrésala en tu reloj)",
                 font=ctk.CTkFont(size=10), text_color=C_MUTED).pack(pady=(10, 2))
    ctk.CTkLabel(ip_frame, textvariable=ip_var,
                 font=ctk.CTkFont(size=18, weight="bold"),
                 text_color=C_GOLD).pack(pady=(0, 10))

    # ── Card BPM ──────────────────────────────────────────────────────────────
    bpm_frame = ctk.CTkFrame(root, fg_color=C_CARD, corner_radius=12,
                              border_width=1, border_color=C_BORDER)
    bpm_frame.pack(fill="x", padx=24, pady=(0, 8))

    ctk.CTkLabel(bpm_frame, textvariable=status_var,
                 font=ctk.CTkFont(size=11), text_color=C_RED).pack(pady=(10, 2))

    bpm_lbl = ctk.CTkLabel(bpm_frame, textvariable=bpm_var,
                            font=ctk.CTkFont(size=52, weight="bold"),
                            text_color=C_PINK)
    bpm_lbl.pack(pady=(0, 2))
    ctk.CTkLabel(bpm_frame, text="BPM",
                 font=ctk.CTkFont(size=10), text_color=C_MUTED).pack()
    ctk.CTkLabel(bpm_frame, textvariable=samples_var,
                 font=ctk.CTkFont(size=10), text_color=C_MUTED).pack(pady=(2, 10))

    # ── Botones ───────────────────────────────────────────────────────────────
    btn_start = ctk.CTkButton(
        root, text="► Iniciar servidor HR",
        font=ctk.CTkFont(size=13, weight="bold"),
        fg_color=C_PINK, hover_color="#e05aa0", text_color="#fff",
        corner_radius=10, height=42,
        command=lambda: toggle_server(btn_start, status_var, bpm_var, samples_var)
    )
    btn_start.pack(fill="x", padx=24, pady=(4, 6))

    ctk.CTkButton(
        root, text="🌐 Ver correlación BPM en mindev.com",
        font=ctk.CTkFont(size=12),
        fg_color=C_CARD, hover_color=C_BORDER, text_color=C_TEXT,
        border_width=1, border_color=C_BORDER,
        corner_radius=10, height=38,
        command=lambda: webbrowser.open("https://www.mindev.com/#mindevbio")
    ).pack(fill="x", padx=24, pady=(0, 6))

    ctk.CTkButton(
        root, text="Activar Bio",
        font=ctk.CTkFont(size=12),
        fg_color="#2a1a35", hover_color="#3a1a50", text_color=C_PINK,
        border_width=1, border_color=C_PINK,
        corner_radius=10, height=38,
        command=lambda: webbrowser.open("https://mindev-ia.com/#mindevbio")
    ).pack(fill="x", padx=24, pady=(0, 6))

    # ── Footer ────────────────────────────────────────────────────────────────
    ctk.CTkLabel(root, text="mindev-ia.com · Puerto 5150",
                 font=ctk.CTkFont(size=9), text_color=C_MUTED).pack(pady=(8, 0))

    # ── Callbacks BPM ─────────────────────────────────────────────────────────
    def on_bpm(bpm):
        root.after(0, lambda: _update_bpm_ui(bpm, bpm_var, samples_var))

    global _on_bpm_callback
    _on_bpm_callback = on_bpm

    def _update_bpm_ui(bpm, bpm_var, samples_var):
        bpm_var.set(str(bpm))
        samples_var.set(f"{_sample_count} muestras")

    def toggle_server(btn, status_var, bpm_var, samples_var):
        global _server_thread, _server_active
        if _server_active:
            threading.Thread(target=_stop_flask, daemon=True).start()
            btn.configure(text="► Iniciar servidor HR", fg_color=C_PINK, hover_color="#c0397b", text_color="#fff")
            status_var.set("● Servidor detenido")
            return
        btn.configure(state="disabled", text="Iniciando…")
        def _start():
            global _server_thread
            _server_thread = threading.Thread(target=_start_flask, daemon=True)
            _server_thread.start()
            time.sleep(0.8)
            root.after(0, lambda: _on_started(btn, status_var))
        threading.Thread(target=_start, daemon=True).start()

    def _on_started(btn, status_var):
        btn.configure(state="normal", text="■ Servidor activo — puerto 5150",
                      fg_color=C_GREEN, hover_color="#2aad60", text_color="#0a0e1a")
        status_var.set("● Servidor activo :5150")
        # Actualizar color del label de status — buscar por texto no es ideal;
        # usamos after para actualizar via variable
        for widget in root.winfo_children():
            _patch_status_color(widget, status_var)

    def _patch_status_color(widget, status_var):
        # Actualizar color del label que muestra status_var
        try:
            if hasattr(widget, 'cget') and widget.cget('textvariable') == str(status_var):
                widget.configure(text_color=C_GREEN)
        except Exception:
            pass
        for child in widget.winfo_children():
            _patch_status_color(child, status_var)

    root.mainloop()


# ══════════════════════════════════════════════════════════════════════════════
# UI — tkinter puro (fallback sin customtkinter)
# ══════════════════════════════════════════════════════════════════════════════
def run_ui_tk():
    import tkinter as tk
    from tkinter import font as tkfont

    root = tk.Tk()
    root.title("MinDev Bio")
    root.geometry("360x480")
    root.resizable(False, False)
    root.configure(bg=C_BG)

    try:
        ico = resource_path("icon.ico")
        if os.path.exists(ico):
            root.iconbitmap(ico)
    except Exception:
        pass

    bold_big  = tkfont.Font(family="Segoe UI", size=22, weight="bold")
    bold_med  = tkfont.Font(family="Segoe UI", size=14, weight="bold")
    normal    = tkfont.Font(family="Segoe UI", size=10)
    small     = tkfont.Font(family="Segoe UI", size=9)
    bpm_font  = tkfont.Font(family="Segoe UI", size=44, weight="bold")

    # Título
    tk.Label(root, text="MinDev Bio", font=bold_big,
             bg=C_BG, fg=C_PINK).pack(pady=(24, 2))
    tk.Label(root, text="Biometría + Poker", font=small,
             bg=C_BG, fg=C_MUTED).pack()

    # IP
    tk.Label(root, text=f"IP de este PC: {get_local_ip()}",
             font=bold_med, bg=C_BG, fg=C_GOLD).pack(pady=(16, 4))
    tk.Label(root, text="Ingrésala en MinDev HR (tu reloj)", font=small,
             bg=C_BG, fg=C_MUTED).pack()

    # Status
    status_var = tk.StringVar(value="● Servidor detenido")
    tk.Label(root, textvariable=status_var, font=normal,
             bg=C_BG, fg=C_RED).pack(pady=(12, 0))

    # BPM
    bpm_var = tk.StringVar(value="--")
    tk.Label(root, textvariable=bpm_var, font=bpm_font,
             bg=C_BG, fg=C_PINK).pack()
    tk.Label(root, text="BPM", font=small, bg=C_BG, fg=C_MUTED).pack()

    samples_var = tk.StringVar(value="0 muestras")
    tk.Label(root, textvariable=samples_var, font=small,
             bg=C_BG, fg=C_MUTED).pack(pady=(2, 12))

    def toggle_server():
        global _server_thread, _server_active
        if _server_active:
            threading.Thread(target=_stop_flask, daemon=True).start()
            btn_start.configure(text="► Iniciar servidor HR", bg=C_PINK, fg="#fff")
            status_var.set("● Servidor detenido")
            return
        btn_start.configure(state="disabled", text="Iniciando…")
        def _start():
            global _server_thread
            _server_thread = threading.Thread(target=_start_flask, daemon=True)
            _server_thread.start()
            time.sleep(0.8)
            root.after(0, _on_started)
        threading.Thread(target=_start, daemon=True).start()

    def _on_started():
        btn_start.configure(text="■ Servidor activo — puerto 5150",
                            bg=C_GREEN, fg="#0a0e1a", state="normal")
        status_var.set("● Servidor activo :5150")

    def on_bpm(bpm):
        root.after(0, lambda: [bpm_var.set(str(bpm)),
                                samples_var.set(f"{_sample_count} muestras")])

    global _on_bpm_callback
    _on_bpm_callback = on_bpm

    btn_start = tk.Button(root, text="► Iniciar servidor HR",
                          font=bold_med, bg=C_PINK, fg="#fff",
                          relief="flat", cursor="hand2",
                          padx=16, pady=10, command=toggle_server)
    btn_start.pack(fill="x", padx=24, pady=(0, 6))

    tk.Button(root, text="🌐 Ver correlación BPM en mindev.com",
              font=normal, bg=C_CARD, fg=C_TEXT,
              relief="flat", cursor="hand2", padx=16, pady=8,
              command=lambda: webbrowser.open("https://www.mindev.com/#mindevbio")
              ).pack(fill="x", padx=24, pady=(0, 6))

    tk.Button(root, text="♥ Activar Bio",
              font=normal, bg="#2a1a35", fg=C_PINK,
              relief="flat", cursor="hand2", padx=16, pady=8,
              command=lambda: webbrowser.open("https://mindev-ia.com/#mindevbio")
              ).pack(fill="x", padx=24, pady=(0, 6))

    tk.Label(root, text="mindev-ia.com · Puerto 5150",
             font=small, bg=C_BG, fg=C_MUTED).pack(pady=(8, 0))

    root.mainloop()


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if USE_CTK:
        run_ui_ctk()
    else:
        run_ui_tk()
