import os
import sqlite3
import hashlib
import hmac
import json
import datetime
import secrets
import smtplib
import random
import string
import zipfile
import io
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Config
SECRET_KEY = os.environ.get('SECRET_KEY', 'evhapo-secret-key-2024-change-in-production')
DB_PATH = os.path.join(os.path.dirname(__file__), 'evhapo.db')
TEST_PRICE_USD = 9.90

MERCADOPAGO_ACCESS_TOKEN = os.environ.get('MERCADOPAGO_ACCESS_TOKEN', '')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')

SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT   = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER   = os.environ.get('SMTP_USER', '')
SMTP_PASS   = os.environ.get('SMTP_PASS', '')

# Cargar .env SOLO si la variable no viene ya del entorno (del .bat)
if not os.environ.get('ANTHROPIC_API_KEY'):
    for _candidate in [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'),
    ]:
        if os.path.exists(_candidate):
            try:
                with open(_candidate, encoding='utf-8') as _ef:
                    for _line in _ef:
                        _line = _line.strip()
                        if _line and not _line.startswith('#') and '=' in _line:
                            _k, _v = _line.split('=', 1)
                            if _k.strip() == 'ANTHROPIC_API_KEY' and _v.strip():
                                os.environ['ANTHROPIC_API_KEY'] = _v.strip()
            except Exception:
                pass
            break

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

# Log de arranque para diagnóstico
print(f"[CONFIG] ANTHROPIC_API_KEY: {'OK (' + str(len(ANTHROPIC_API_KEY)) + ' chars)' if ANTHROPIC_API_KEY else 'NO ENCONTRADA — ejecuta iniciar_servidor.bat'}")

# ─── Database ────────────────────────────────────────────────────────────────

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db:
        db.close()

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            pais TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_admin INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            method TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            external_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS test_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            payment_id INTEGER REFERENCES payments(id),
            test_type TEXT DEFAULT 'mental',
            completed INTEGER DEFAULT 0,
            score_total REAL DEFAULT 0,
            scores_json TEXT DEFAULT '{}',
            answers_json TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            token TEXT UNIQUE NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS player_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            mental_session_id INTEGER,
            technical_session_id INTEGER,
            profile_html TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    db.commit()

    # Migraciones automáticas (columnas nuevas en tablas existentes)
    migrations = [
        "ALTER TABLE test_sessions ADD COLUMN test_type TEXT DEFAULT 'mental'",
    ]
    for sql in migrations:
        try:
            db.execute(sql)
            db.commit()
        except Exception:
            pass  # La columna ya existe, ignorar

    db.close()

# ─── Auth helpers ─────────────────────────────────────────────────────────────

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id):
    token = secrets.token_hex(32)
    expires = (datetime.datetime.utcnow() + datetime.timedelta(days=30)).isoformat()
    db = sqlite3.connect(DB_PATH)
    db.execute("INSERT INTO tokens (user_id, token, expires_at) VALUES (?,?,?)", (user_id, token, expires))
    db.commit()
    db.close()
    return token

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'No autorizado'}), 401
        token = auth[7:]
        db = get_db()
        row = db.execute(
            "SELECT t.user_id, t.expires_at, u.email, u.nombre, u.apellido, u.is_admin "
            "FROM tokens t JOIN users u ON t.user_id=u.id WHERE t.token=?", (token,)
        ).fetchone()
        if not row:
            return jsonify({'error': 'Token inválido'}), 401
        if row['expires_at'] < datetime.datetime.utcnow().isoformat():
            return jsonify({'error': 'Token expirado'}), 401
        g.user_id = row['user_id']
        g.user_email = row['email']
        g.user_name = row['nombre']
        g.is_admin = row['is_admin']
        return f(*args, **kwargs)
    return decorated

# ─── Static files ─────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../frontend', path)

# ─── Auth routes ──────────────────────────────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    nombre = (data.get('nombre') or '').strip()
    apellido = (data.get('apellido') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    pais = (data.get('pais') or '').strip()

    if not all([nombre, apellido, email, password]):
        return jsonify({'error': 'Todos los campos son obligatorios'}), 400
    if len(password) < 6:
        return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
    if existing:
        return jsonify({'error': 'Este email ya está registrado'}), 409

    db.execute(
        "INSERT INTO users (nombre, apellido, email, password_hash, pais) VALUES (?,?,?,?,?)",
        (nombre, apellido, email, hash_password(password), pais)
    )
    db.commit()
    user_id = db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()['id']
    token = create_token(user_id)
    return jsonify({'token': token, 'nombre': nombre, 'email': email}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    db = get_db()
    user = db.execute(
        "SELECT id, nombre, apellido, email, password_hash, is_admin FROM users WHERE email=?", (email,)
    ).fetchone()

    if not user or user['password_hash'] != hash_password(password):
        return jsonify({'error': 'Email o contraseña incorrectos'}), 401

    token = create_token(user['id'])
    return jsonify({
        'token': token,
        'nombre': user['nombre'],
        'apellido': user['apellido'],
        'email': user['email'],
        'is_admin': user['is_admin']
    })

@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    auth = request.headers.get('Authorization', '')[7:]
    get_db().execute("DELETE FROM tokens WHERE token=?", (auth,))
    get_db().commit()
    return jsonify({'ok': True})

@app.route('/api/me', methods=['GET'])
@require_auth
def me():
    db = get_db()
    user = db.execute(
        "SELECT id, nombre, apellido, email, pais, created_at FROM users WHERE id=?", (g.user_id,)
    ).fetchone()
    sessions = db.execute(
        "SELECT id, score_total, scores_json, completed_at FROM test_sessions "
        "WHERE user_id=? AND completed=1 ORDER BY completed_at DESC", (g.user_id,)
    ).fetchall()
    return jsonify({
        'user': dict(user),
        'sessions': [dict(s) for s in sessions]
    })

# ─── Payment routes ───────────────────────────────────────────────────────────

@app.route('/api/payment/create', methods=['POST'])
@require_auth
def create_payment():
    data = request.json or {}
    method = data.get('method', 'stripe')
    pais = data.get('pais', 'US')

    # Determine currency based on country
    currency_map = {
        'AR': ('ARS', 9000),   # approx 9.90 USD in ARS
        'CL': ('CLP', 9500),   # approx 9.90 USD in CLP
        'MX': ('MXN', 170),
        'CO': ('COP', 40000),
        'PE': ('PEN', 37),
        'UY': ('UYU', 390),
        'BR': ('BRL', 50),
    }
    currency, local_amount = currency_map.get(pais.upper(), ('USD', 990))  # 990 cents

    db = get_db()
    payment_id = db.execute(
        "INSERT INTO payments (user_id, amount, currency, method, status) VALUES (?,?,?,?,?)",
        (g.user_id, TEST_PRICE_USD, 'USD', method, 'pending')
    ).lastrowid
    db.commit()

    if method == 'mercadopago' and MERCADOPAGO_ACCESS_TOKEN:
        return _create_mercadopago_payment(payment_id, local_amount, currency, pais)
    elif method == 'stripe' and STRIPE_SECRET_KEY:
        return _create_stripe_payment(payment_id)
    else:
        # Demo mode: simulate payment for testing
        db.execute("UPDATE payments SET status='approved', external_id='DEMO' WHERE id=?", (payment_id,))
        db.commit()
        test_type = data.get('test_type', 'mental')
        session_id = db.execute(
            "INSERT INTO test_sessions (user_id, payment_id, test_type) VALUES (?,?,?)",
            (g.user_id, payment_id, test_type)
        ).lastrowid
        db.commit()
        return jsonify({
            'mode': 'demo',
            'payment_id': payment_id,
            'session_id': session_id,
            'test_type': test_type,
            'message': 'Modo demo activo. En producción se procesará el pago real.'
        })

def _create_mercadopago_payment(payment_id, amount, currency, pais):
    try:
        import mercadopago
        sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)
        pref = sdk.preference().create({
            "items": [{"title": "EVHAPO Diagnóstico Mental Poker", "quantity": 1,
                        "unit_price": amount / 100, "currency_id": currency}],
            "back_urls": {
                "success": f"http://localhost:5000/payment/success?pid={payment_id}",
                "failure": f"http://localhost:5000/payment/failure",
                "pending": f"http://localhost:5000/payment/pending"
            },
            "auto_return": "approved",
            "external_reference": str(payment_id)
        })
        return jsonify({
            'mode': 'mercadopago',
            'init_point': pref['response']['init_point'],
            'payment_id': payment_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _create_stripe_payment(payment_id):
    try:
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        intent = stripe.PaymentIntent.create(
            amount=990,  # $9.90 USD in cents
            currency='usd',
            metadata={'payment_id': payment_id}
        )
        return jsonify({
            'mode': 'stripe',
            'client_secret': intent.client_secret,
            'payment_id': payment_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/payment/confirm', methods=['POST'])
@require_auth
def confirm_payment():
    data = request.json or {}
    payment_id = data.get('payment_id')
    db = get_db()
    pay = db.execute(
        "SELECT * FROM payments WHERE id=? AND user_id=?", (payment_id, g.user_id)
    ).fetchone()
    if not pay:
        return jsonify({'error': 'Pago no encontrado'}), 404

    db.execute("UPDATE payments SET status='approved' WHERE id=?", (payment_id,))
    session_id = db.execute(
        "INSERT INTO test_sessions (user_id, payment_id) VALUES (?,?)",
        (g.user_id, payment_id)
    ).lastrowid
    db.commit()
    return jsonify({'session_id': session_id})

# Mercado Pago webhook
@app.route('/api/payment/webhook/mp', methods=['POST'])
def mp_webhook():
    data = request.json or {}
    if data.get('type') == 'payment':
        payment_id_external = data.get('data', {}).get('id')
        if payment_id_external and MERCADOPAGO_ACCESS_TOKEN:
            try:
                import mercadopago
                sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)
                info = sdk.payment().get(payment_id_external)
                if info['response']['status'] == 'approved':
                    ref = info['response']['external_reference']
                    db = sqlite3.connect(DB_PATH)
                    db.execute("UPDATE payments SET status='approved', external_id=? WHERE id=?",
                               (str(payment_id_external), ref))
                    row = db.execute("SELECT user_id FROM payments WHERE id=?", (ref,)).fetchone()
                    if row:
                        db.execute("INSERT INTO test_sessions (user_id, payment_id) VALUES (?,?)",
                                   (row[0], ref))
                    db.commit()
                    db.close()
            except:
                pass
    return jsonify({'ok': True})

# ─── Test routes ──────────────────────────────────────────────────────────────

@app.route('/api/test/start', methods=['POST'])
@require_auth
def start_test():
    data = request.json or {}
    session_id = data.get('session_id')
    db = get_db()
    sess = db.execute(
        "SELECT * FROM test_sessions WHERE id=? AND user_id=?", (session_id, g.user_id)
    ).fetchone()
    if not sess:
        return jsonify({'error': 'Sesión no encontrada'}), 404
    if sess['completed']:
        return jsonify({'error': 'Test ya completado', 'session_id': session_id}), 400
    return jsonify({'ok': True, 'session_id': session_id})

@app.route('/api/test/submit', methods=['POST'])
@require_auth
def submit_test():
    data = request.json or {}
    session_id = data.get('session_id')
    answers = data.get('answers', {})

    db = get_db()
    sess = db.execute(
        "SELECT * FROM test_sessions WHERE id=? AND user_id=?", (session_id, g.user_id)
    ).fetchone()
    if not sess:
        return jsonify({'error': 'Sesión no encontrada'}), 404

    # Calculate scores per category
    test_type = sess['test_type'] if sess['test_type'] else 'mental'
    scores = calculate_scores(answers, test_type)
    total = sum(scores.values())

    db.execute(
        "UPDATE test_sessions SET completed=1, score_total=?, scores_json=?, answers_json=?, completed_at=? WHERE id=?",
        (total, json.dumps(scores), json.dumps(answers), datetime.datetime.utcnow().isoformat(), session_id)
    )
    db.commit()
    return jsonify({'ok': True, 'scores': scores, 'total': total, 'session_id': session_id})

def calculate_scores(answers, test_type='mental'):
    from scoring import QUESTIONS, TECHNICAL_QUESTIONS
    question_bank = TECHNICAL_QUESTIONS if test_type == 'technical' else QUESTIONS
    category_scores = {}

    for cat_key, questions in question_bank.items():
        cat_score = 0
        cat_max = 0
        for q in questions:
            qid = q['id']
            ans = answers.get(str(qid))
            if ans is not None:
                for opt in q['options']:
                    if opt['value'] == ans:
                        cat_score += opt['points']
                        break
                cat_max += 10
        category_scores[cat_key] = round((cat_score / cat_max * 100) if cat_max > 0 else 0, 1)
    return category_scores

@app.route('/api/test/results/<int:session_id>', methods=['GET'])
@require_auth
def get_results(session_id):
    db = get_db()
    sess = db.execute(
        "SELECT ts.*, u.nombre, u.apellido, u.email FROM test_sessions ts "
        "JOIN users u ON ts.user_id=u.id WHERE ts.id=? AND ts.user_id=?",
        (session_id, g.user_id)
    ).fetchone()
    if not sess:
        return jsonify({'error': 'Resultados no encontrados'}), 404
    result = dict(sess)
    result['scores'] = json.loads(sess['scores_json'] or '{}')
    return jsonify(result)

# ─── Dashboard / Benchmark ────────────────────────────────────────────────────

@app.route('/api/dashboard', methods=['GET'])
@require_auth
def dashboard():
    db = get_db()
    sessions = db.execute(
        "SELECT id, test_type, score_total, scores_json, completed_at FROM test_sessions "
        "WHERE user_id=? AND completed=1 ORDER BY completed_at DESC",
        (g.user_id,)
    ).fetchall()

    # Global benchmark (averages across all users)
    all_sessions = db.execute(
        "SELECT scores_json FROM test_sessions WHERE completed=1"
    ).fetchall()

    benchmark = compute_benchmark(all_sessions)
    history = []
    for s in sessions:
        r = dict(s)
        r['scores'] = json.loads(s['scores_json'] or '{}')
        history.append(r)

    return jsonify({'history': history, 'benchmark': benchmark})

def compute_benchmark(sessions):
    totals = {}
    count = len(sessions)
    if count == 0:
        return {}
    for s in sessions:
        scores = json.loads(s['scores_json'] or '{}')
        for k, v in scores.items():
            totals[k] = totals.get(k, 0) + v
    return {k: round(v / count, 1) for k, v in totals.items()}

# ─── Admin routes ─────────────────────────────────────────────────────────────

@app.route('/api/admin/stats', methods=['GET'])
@require_auth
def admin_stats():
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    db = get_db()
    total_users = db.execute("SELECT COUNT(*) as c FROM users").fetchone()['c']
    total_tests = db.execute("SELECT COUNT(*) as c FROM test_sessions WHERE completed=1").fetchone()['c']
    total_revenue = db.execute(
        "SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE status='approved'"
    ).fetchone()['s']
    all_sessions = db.execute("SELECT scores_json FROM test_sessions WHERE completed=1").fetchall()
    benchmark = compute_benchmark(all_sessions)
    return jsonify({
        'total_users': total_users,
        'total_tests': total_tests,
        'total_revenue': total_revenue,
        'benchmark': benchmark
    })

@app.route('/api/password-reset', methods=['POST'])
def password_reset():
    data  = request.json or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return jsonify({'error': 'Email requerido'}), 400

    db   = get_db()
    user = db.execute("SELECT id, nombre FROM users WHERE email=?", (email,)).fetchone()

    # Siempre respondemos OK para no revelar si el email existe
    if not user:
        return jsonify({'ok': True, 'message': 'Si el email está registrado, recibirás un correo en breve.'})

    # Generar contraseña temporal
    temp_pw = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    db.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(temp_pw), user['id']))
    db.commit()

    if SMTP_USER and SMTP_PASS:
        try:
            _send_reset_email(email, user['nombre'], temp_pw)
            return jsonify({'ok': True, 'message': 'Te enviamos un correo con tu nueva contraseña temporal. Revisa también la carpeta de spam.'})
        except Exception as e:
            return jsonify({'error': f'Error al enviar el correo: {str(e)}'}), 500
    else:
        # Modo desarrollo: devuelve la clave en la respuesta
        return jsonify({'ok': True, 'message': f'[MODO DEV] Contraseña temporal: {temp_pw}  —  Configura SMTP_USER y SMTP_PASS para envío real por email.'})

def _send_reset_email(to_email, nombre, temp_pw):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'EVHAPO – Tu contraseña temporal'
    msg['From']    = SMTP_USER
    msg['To']      = to_email

    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:3rem;color:#d4af37">♠</span>
        <h1 style="color:#d4af37;margin:8px 0">EVHAPO</h1>
      </div>
      <h2 style="margin-bottom:8px">Hola, {nombre}</h2>
      <p>Recibimos tu solicitud de recuperación de contraseña.</p>
      <p>Tu nueva contraseña temporal es:</p>
      <div style="background:#1a2235;border:2px solid #d4af37;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
        <code style="font-size:1.5rem;color:#d4af37;letter-spacing:3px;font-weight:bold">{temp_pw}</code>
      </div>
      <p>Ingresa con esta contraseña y cámbiala desde tu perfil lo antes posible.</p>
      <p style="color:#64748b;font-size:0.85rem;margin-top:24px">Si no solicitaste este cambio, ignora este mensaje.</p>
    </div>
    """
    msg.attach(MIMEText(body, 'html'))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, to_email, msg.as_string())

# ─── Perfil IA del jugador ────────────────────────────────────────────────────

@app.route('/api/profile/get', methods=['GET'])
@require_auth
def get_profile():
    db = get_db()
    row = db.execute(
        "SELECT * FROM player_profiles WHERE user_id=? ORDER BY created_at DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()
    if not row:
        return jsonify({'profile': None})
    return jsonify({
        'profile': row['profile_html'],
        'created_at': row['created_at'],
        'mental_session_id': row['mental_session_id'],
        'technical_session_id': row['technical_session_id'],
    })


@app.route('/api/profile/generate', methods=['POST'])
@require_auth
def generate_profile():
    _api_key = os.environ.get('ANTHROPIC_API_KEY') or ANTHROPIC_API_KEY
    if not _api_key:
        return jsonify({'error': 'Servicio no disponible. Reinicia el servidor con iniciar_servidor.bat'}), 503

    import requests as _requests

    # Asegurar que la tabla existe
    try:
        get_db().execute("""
            CREATE TABLE IF NOT EXISTS player_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                mental_session_id INTEGER,
                technical_session_id INTEGER,
                profile_html TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )""")
        get_db().commit()
    except Exception:
        pass

    try:
        data = request.json or {}
        mental_answers       = data.get('mental_answers', [])
        technical_answers    = data.get('technical_answers', [])
        mental_scores        = data.get('mental_scores', {})
        technical_scores     = data.get('technical_scores', {})
        inconsistencies      = data.get('inconsistencies', [])
        mental_session_id    = data.get('mental_session_id')
        technical_session_id = data.get('technical_session_id')
        nombre = g.user_name

        prompt = _build_profile_prompt(
            nombre, mental_answers, technical_answers,
            mental_scores, technical_scores, inconsistencies
        )

        # Llamada directa a la API de Anthropic usando requests (evita problemas de httpx en Windows)
        resp = _requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': _api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            json={
                'model': 'claude-sonnet-4-6',
                'max_tokens': 24000,
                'messages': [{'role': 'user', 'content': prompt}]
            },
            timeout=300,
            verify=False  # Evitar problemas de certificados SSL en entornos Windows locales
        )
        resp.raise_for_status()
        profile_html = resp.json()['content'][0]['text']

        db = get_db()
        db.execute("DELETE FROM player_profiles WHERE user_id=?", (g.user_id,))
        db.execute(
            "INSERT INTO player_profiles (user_id, mental_session_id, technical_session_id, profile_html, created_at) VALUES (?,?,?,?,?)",
            (g.user_id, mental_session_id, technical_session_id, profile_html,
             datetime.datetime.utcnow().isoformat())
        )
        db.commit()
        return jsonify({
            'profile': profile_html,
            'created_at': datetime.datetime.utcnow().isoformat()
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error al generar perfil: {str(e)}'}), 500


def _build_profile_prompt(nombre, mental_answers, technical_answers,
                           mental_scores, technical_scores, inconsistencies):

    def fmt_scores(scores):
        return ', '.join(f'{k}:{v}%' for k, v in scores.items())

    def fmt_key_answers(answers, n_worst=8, n_best=4):
        """Envía solo las respuestas más diagnósticas (peores + mejores)."""
        if not answers:
            return '(sin datos)'
        sorted_ans = sorted(answers, key=lambda x: x.get('points', 0))
        worst = sorted_ans[:n_worst]
        best  = sorted_ans[-n_best:]
        def fmt(item):
            return f'[{item["category"]}] {item["question"][:70]} → {item["answer"]} ({item.get("points",0)}/{item.get("maxPoints",10)}pts)'
        lines  = ['Peores respuestas:'] + [fmt(a) for a in worst]
        lines += ['Mejores respuestas:'] + [fmt(a) for a in best]
        return '\n'.join(lines)

    def fmt_inconsistencies(items):
        if not items:
            return 'Ninguna.'
        return ' | '.join(f'[{i["type"]}]: {i["detail"]}' for i in items)

    mental_avg = round(sum(mental_scores.values()) / max(len(mental_scores), 1), 1)
    tech_avg   = round(sum(technical_scores.values()) / max(len(technical_scores), 1), 1)

    return f"""Eres coach de poker experto (MTT) y psicólogo deportivo. Genera un informe HTML completo para {nombre}. NO incluyas etiquetas html/head/body.

SCORES — Mental (avg {mental_avg}%): {fmt_scores(mental_scores)}
SCORES — Técnico (avg {tech_avg}%): {fmt_scores(technical_scores)}
INCOHERENCIAS: {fmt_inconsistencies(inconsistencies)}
RESPUESTAS MENTALES:
{fmt_key_answers(mental_answers)}
RESPUESTAS TÉCNICAS:
{fmt_key_answers(technical_answers)}

ESTILOS HTML (usa inline):
h2→color:#d4af37;font-size:1.2rem | h3→color:#4DB6AC;font-size:1rem | p→color:#94a3b8;line-height:1.7
alerta-roja→background:rgba(239,68,68,0.1);border-left:4px solid #ef4444;padding:12px;border-radius:4px
alerta-verde→background:rgba(34,197,94,0.1);border-left:4px solid #22c55e;padding:12px;border-radius:4px
alerta-dorada→background:rgba(212,175,55,0.1);border-left:4px solid #d4af37;padding:12px;border-radius:4px
plan-item→border-left:4px solid [COLOR];padding:10px 14px;margin-bottom:10px;background:#1a2235;border-radius:0 6px 6px 0

GENERA LAS 6 SECCIONES COMPLETAS (no las omitas, no las cortes):

§1 RESUMEN EJECUTIVO
Arquetipo creativo + 3 fortalezas principales + 3 vulnerabilidades principales + frase-diagnóstico de {nombre}.

§2 PERFIL INTEGRADO MENTAL+TÉCNICO
Correlaciones causa-efecto entre categorías. Cómo las debilidades mentales sabotean las decisiones técnicas y viceversa. Menciona categorías específicas por nombre.

§3 ANÁLISIS DE INCOHERENCIAS
Por cada incoherencia detectada: explicación psicológica breve + cómo se ve en la mesa con ejemplo concreto de mano/situación.

§4 DIAGNÓSTICO CON EJEMPLOS MTT
2 situaciones reales de torneo. Formato por situación: Situación → Jugada de {nombre} → Jugada élite → Brecha explicada.

§5 PRONÓSTICO (tabla comparativa)
Sin mejora: 3m / 6m / 12m. Con el plan: 3m / 6m / 12m. Incluir impacto estimado en ITM% y ROI.

§6 PLAN 12 SEMANAS
Fase 1 sem 1-4, Fase 2 sem 5-8, Fase 3 sem 9-12.
Por cada fase: 3-4 acciones concretas (qué hacer, tiempo semanal, cómo medir progreso).

IMPORTANTE: Completa el §6 hasta el final. Usa el nombre {nombre} en cada sección. Sé directo y motivador.
"""


# ─── Tournament Analysis ──────────────────────────────────────────────────────

def _parse_hand_history(content):
    """
    Parsea un historial de manos multi-plataforma y devuelve:
      - meta: info del torneo
      - hero_hands: manos donde Hero participó (compactas)
      - stats: estadísticas agregadas
    Soporta: GGPoker, PokerStars, ACR, 888poker, WPT Global, Coolbet.
    """
    lines = content.replace('\r\n', '\n').replace('\r', '\n')

    # ── Detectar plataforma ────────────────────────────────────────────────────
    platform = 'Unknown'
    if 'Poker Hand #TM' in lines or 'GG' in lines[:200]:
        platform = 'GGPoker'
    elif 'PokerStars Hand' in lines[:200]:
        platform = 'PokerStars'
    elif 'Hand #' in lines[:200] and 'ACR' in lines[:500]:
        platform = 'ACR'
    elif '888poker' in lines[:500]:
        platform = '888poker'
    elif 'WPT' in lines[:500]:
        platform = 'WPT Global'

    # ── Split por manos ────────────────────────────────────────────────────────
    # Patrones de inicio de mano para distintas plataformas
    split_pats = [
        r'Poker Hand #TM\d+',          # GGPoker tournament
        r'Poker Hand #\d+',             # GGPoker cash
        r'PokerStars Hand #\d+',        # PokerStars
        r'Hand #\d+',                   # ACR / genérico
        r'\*\*\* \d{3}-\d{3} \*\*\*',  # 888poker
    ]
    raw_blocks = None
    for pat in split_pats:
        parts = re.split(f'({pat})', lines)
        if len(parts) > 3:
            # Reconstruir bloques completos
            raw_blocks = []
            for i in range(1, len(parts), 2):
                block = parts[i] + (parts[i+1] if i+1 < len(parts) else '')
                raw_blocks.append(block)
            break

    if not raw_blocks:
        raw_blocks = [lines]

    total_hands = len(raw_blocks)

    # ── Detectar y normalizar orden cronológico ────────────────────────────────
    # GGPoker exporta más reciente primero; PokerStars cronológico.
    # Detectar comparando nivel del primer y último bloque.
    lv_first_raw = _extract_level(raw_blocks[0])
    lv_last_raw  = _extract_level(raw_blocks[-1])
    if lv_first_raw and lv_last_raw and lv_first_raw > lv_last_raw:
        raw_blocks = list(reversed(raw_blocks))   # Poner en orden cronológico

    # ── Extraer meta del torneo del primer bloque (cronológico = inicio torneo) ─
    first = raw_blocks[0] if raw_blocks else ''
    last  = raw_blocks[-1] if raw_blocks else ''

    # Nombre del torneo (buscar en ambos extremos)
    tourn_name = 'Torneo desconocido'
    for search_block in [first, last]:
        m = re.search(r'Tournament #\d+,\s*(.+?)(?:Hold\'em|Omaha|\n|-\s*Level)', search_block)
        if not m:
            m = re.search(r'Tournament[:\s]+(.+?)(?:Hold\'em|Omaha|\n)', search_block, re.I)
        if m:
            tourn_name = m.group(1).strip().rstrip(',').strip()
            break

    # Buy-in
    buy_in = 'N/A'
    m = re.search(r'\$(\d+[\.,]?\d*)', tourn_name + first[:300] + last[:300])
    if m:
        buy_in = '$' + m.group(1)

    # Fecha (del inicio del torneo = primer bloque)
    date_str = 'N/A'
    m = re.search(r'(\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2})', first)
    if not m:
        m = re.search(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', first)
    if m:
        date_str = m.group(1)

    # Nivel inicial y final (ahora en orden cronológico correcto)
    level_first = _extract_level(first)
    level_last  = _extract_level(last)

    # ── Procesar cada mano ────────────────────────────────────────────────────
    hero_hands     = []   # manos donde Hero tiene cartas
    hero_wins      = 0
    hero_allin     = 0
    showdown_hands = 0
    max_players    = 0
    starting_chips = None
    ending_chips   = None

    for block in raw_blocks:
        if 'Hero' not in block:
            continue

        hand = _parse_single_hand(block)
        if not hand:
            continue

        if starting_chips is None and hand.get('hero_chips_start'):
            starting_chips = hand['hero_chips_start']
        if hand.get('hero_chips_start'):
            ending_chips = hand['hero_chips_start']

        players_in_hand = hand.get('players', 0)
        if players_in_hand > max_players:
            max_players = players_in_hand

        if hand.get('hero_won'):
            hero_wins += 1
        if hand.get('hero_allin'):
            hero_allin += 1
        if hand.get('went_showdown'):
            showdown_hands += 1

        hero_hands.append(hand)

    # ── Seleccionar las manos más relevantes para el prompt ────────────────────
    # Prioridad: all-in > showdown > big_decision > fold
    def hand_priority(h):
        score = 0
        if h.get('hero_allin'):       score += 100
        if h.get('went_showdown'):    score += 60
        if h.get('hero_big_raise'):   score += 40
        if h.get('hero_big_call'):    score += 30
        if h.get('hero_won'):         score += 20
        if not h.get('hero_folded_preflop'): score += 10
        return score

    sorted_hands = sorted(hero_hands, key=hand_priority, reverse=True)
    # Tomar las 40 mejores + primeras 5 + últimas 5 del torneo
    first5 = hero_hands[:5]
    last5  = hero_hands[-5:]
    top_hands = sorted_hands[:35]
    selected = {id(h): h for h in top_hands + first5 + last5}
    selected_hands = list(selected.values())

    return {
        'platform': platform,
        'tournament_name': tourn_name,
        'buy_in': buy_in,
        'date': date_str,
        'total_hands': total_hands,
        'hero_hands_played': len(hero_hands),
        'hero_wins': hero_wins,
        'hero_allin_count': hero_allin,
        'showdown_hands': showdown_hands,
        'max_players_seen': max_players,
        'starting_chips': starting_chips,
        'ending_chips': ending_chips,
        'level_first': level_first,
        'level_last': level_last,
        'selected_hands': selected_hands,
    }


def _extract_level(block):
    m = re.search(r'Level\s*(\d+)\s*\(', block)
    return int(m.group(1)) if m else None


def _parse_single_hand(block):
    """Extrae los datos clave de un bloque de mano individual."""
    hand = {}

    # Nivel / blinds
    m = re.search(r'Level\s*(\d+)\s*\((\d[\d,]*)/(\d[\d,]*)', block)
    if m:
        hand['level']  = int(m.group(1))
        hand['sb']     = int(m.group(2).replace(',', ''))
        hand['bb']     = int(m.group(3).replace(',', ''))
    else:
        m = re.search(r'\((\d[\d,]*)/(\d[\d,]*)\)', block)
        if m:
            hand['sb'] = int(m.group(1).replace(',', ''))
            hand['bb'] = int(m.group(2).replace(',', ''))

    # Chips de Hero al inicio
    m = re.search(r'Hero\s*\((\d[\d,]*)\s*in chips\)', block)
    if m:
        hand['hero_chips_start'] = int(m.group(1).replace(',', ''))

    # Número de jugadores en la mesa
    seats = re.findall(r'^Seat \d+:', block, re.MULTILINE)
    hand['players'] = len(seats)

    # Cartas del Hero
    m = re.search(r'Dealt to Hero \[(.+?)\]', block)
    hand['hero_cards'] = m.group(1) if m else None

    # Acciones de Hero
    hero_actions = re.findall(r'^Hero:\s+(.+)$', block, re.MULTILINE)
    hand['hero_actions'] = hero_actions

    # Detectar situaciones especiales
    hero_block = '\n'.join(hero_actions)
    hand['hero_allin']           = 'all-in' in hero_block.lower()
    hand['hero_big_raise']       = bool(re.search(r'raises .{0,30} to (\d[\d,]{4,})', hero_block))
    hand['hero_big_call']        = bool(re.search(r'calls (\d[\d,]{4,})', hero_block))
    hand['hero_folded_preflop']  = hero_actions and 'folds' in hero_actions[0].lower() and 'HOLE CARDS' in block.split('Hero')[0] if hero_actions else False

    # ¿Fue a showdown?
    hand['went_showdown'] = bool(re.search(r'Hero.*?showed?\s*\[', block))

    # ¿Ganó Hero?
    hand['hero_won'] = bool(re.search(r'Hero collected', block))

    # Board
    boards = re.findall(r'\*\*\* (?:FLOP|TURN|RIVER) \*\*\*\s*\[([^\]]+)\]', block)
    hand['board'] = ' → '.join(boards) if boards else None

    # Resumen compact para el prompt
    hand['summary'] = _format_hand_compact(hand)
    return hand


def _format_hand_compact(h):
    """Devuelve una representación compacta de la mano para el prompt de AI."""
    level_str = f"L{h.get('level','?')} {h.get('sb','?')}/{h.get('bb','?')}"
    cards  = h.get('hero_cards', '??')
    chips  = f"{h.get('hero_chips_start',0):,}" if h.get('hero_chips_start') else '?'
    board  = h.get('board') or '(sin board)'
    acts   = ' | '.join(h.get('hero_actions', []))[:120]

    flags = []
    if h.get('hero_allin'):         flags.append('ALL-IN')
    if h.get('went_showdown'):      flags.append('SHOWDOWN')
    if h.get('hero_won'):           flags.append('GANÓ')
    flag_str = ' '.join(f'[{f}]' for f in flags) if flags else ''

    return f"[{level_str}] Stack:{chips} Cards:[{cards}] {flag_str}\n  Acciones: {acts}\n  Board: {board}"


@app.route('/api/tournament/analyze', methods=['POST'])
@require_auth
def analyze_tournament():
    _api_key = os.environ.get('ANTHROPIC_API_KEY') or ANTHROPIC_API_KEY
    if not _api_key:
        return jsonify({'error': 'Servicio no disponible. Reinicia el servidor con iniciar_servidor.bat'}), 503

    import requests as _requests

    # ── 1. Leer archivo ────────────────────────────────────────────────────────
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No se recibió ningún archivo.'}), 400

    filename = file.filename.lower()
    try:
        raw = file.read()
        if filename.endswith('.zip'):
            with zipfile.ZipFile(io.BytesIO(raw)) as z:
                txt_files = [n for n in z.namelist()
                             if n.lower().endswith('.txt') and not n.startswith('__')]
                if not txt_files:
                    return jsonify({'error': 'El ZIP no contiene ningún archivo .txt.'}), 400
                content = z.read(txt_files[0]).decode('utf-8', errors='replace')
        elif filename.endswith('.txt'):
            content = raw.decode('utf-8', errors='replace')
        else:
            return jsonify({'error': 'Formato no soportado. Use .zip o .txt.'}), 400
    except Exception as e:
        return jsonify({'error': f'Error leyendo el archivo: {str(e)}'}), 400

    # ── 2. Parsear manos ───────────────────────────────────────────────────────
    try:
        meta = _parse_hand_history(content)
    except Exception as e:
        return jsonify({'error': f'Error parseando el historial: {str(e)}'}), 400

    # ── 3. Obtener perfil del jugador (si existe) ─────────────────────────────
    player_profile = None
    try:
        row = get_db().execute(
            "SELECT profile_html FROM player_profiles WHERE user_id=? ORDER BY id DESC LIMIT 1",
            (g.user_id,)
        ).fetchone()
        if row:
            # Extraer texto plano del HTML del perfil (quitar tags)
            raw_profile = row['profile_html'] or ''
            player_profile = re.sub(r'<[^>]+>', ' ', raw_profile)
            player_profile = re.sub(r'\s+', ' ', player_profile).strip()[:3000]
    except Exception:
        pass

    # ── 4. Construir prompt ────────────────────────────────────────────────────
    nombre = g.user_name
    prompt = _build_tournament_prompt(nombre, meta, player_profile)

    # ── 5. Llamar a Claude ─────────────────────────────────────────────────────
    try:
        resp = _requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': _api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            json={
                'model': 'claude-sonnet-4-6',
                'max_tokens': 16000,
                'messages': [{'role': 'user', 'content': prompt}]
            },
            timeout=300,
            verify=False
        )
        resp.raise_for_status()
        report_html = resp.json()['content'][0]['text']

        return jsonify({
            'report': report_html,
            'meta': {
                'tournament_name': meta['tournament_name'],
                'buy_in':          meta['buy_in'],
                'platform':        meta['platform'],
                'total_hands':     meta['total_hands'],
                'hero_hands':      meta['hero_hands_played'],
                'date':            meta['date'],
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error al generar análisis: {str(e)}'}), 500


def _build_tournament_prompt(nombre, meta, player_profile):
    """Construye el prompt para el análisis de torneo."""

    # Formatear manos seleccionadas
    hands_text = '\n\n'.join(
        f"MANO {i+1}:\n{h['summary']}"
        for i, h in enumerate(meta.get('selected_hands', [])[:40])
    )
    if not hands_text:
        hands_text = '(No se encontraron manos del jugador Hero en el historial)'

    # Estadísticas
    total   = meta.get('total_hands', 0)
    played  = meta.get('hero_hands_played', 0)
    wins    = meta.get('hero_wins', 0)
    allins  = meta.get('hero_allin_count', 0)
    sd      = meta.get('showdown_hands', 0)
    vpip    = round(played / max(total, 1) * 100, 1)
    wtsd    = round(sd / max(played, 1) * 100, 1)

    profile_section = ''
    if player_profile:
        profile_section = f"""
PERFIL PSICOLÓGICO DEL JUGADOR (generado por IA con tests EVHAPO/MindEV):
{player_profile[:2500]}
"""
    else:
        profile_section = 'PERFIL PSICOLÓGICO: No disponible (el jugador aún no generó su perfil).'

    start_chips = f"{meta.get('starting_chips', 0):,}" if meta.get('starting_chips') else 'N/D'
    end_chips   = f"{meta.get('ending_chips',   0):,}" if meta.get('ending_chips')   else 'N/D'
    lvl_first   = meta.get('level_first', 'N/D')
    lvl_last    = meta.get('level_last',  'N/D')

    return f"""Eres un coach de poker MTT de élite. Analiza el siguiente historial de torneo del jugador "{nombre}" y genera un REPORTE COMPLETO en HTML (sin etiquetas html/head/body).

═══ DATOS DEL TORNEO ═══
Plataforma: {meta.get('platform', 'N/D')}
Torneo: {meta.get('tournament_name', 'N/D')}
Buy-in: {meta.get('buy_in', 'N/D')}
Fecha: {meta.get('date', 'N/D')}
Nivel de entrada al historial: {lvl_first} | Nivel final: {lvl_last}
Stack inicial (en historial): {start_chips} | Stack final: {end_chips}
Manos totales del torneo: {total}
Manos donde Hero recibió cartas: {played} (VPIP aprox: {vpip}%)
Manos ganadas por Hero: {wins}
All-ins de Hero: {allins}
Showdowns de Hero: {sd} (W$SD aprox: {round(wins/max(sd,1)*100,0)}%)

═══ MANOS SELECCIONADAS PARA ANÁLISIS ({len(meta.get('selected_hands',[])[:40])}) ═══
(Ordenadas por relevancia: all-ins, showdowns y grandes decisiones primero)

{hands_text}

═══ {profile_section} ═══

═══ INSTRUCCIONES DE SALIDA ═══
Genera el reporte COMPLETO con TODAS las secciones siguientes. NO las omitas ni las acortes.

ESTILOS HTML (usa SIEMPRE inline):
- h2 → style="color:#d4af37;font-size:1.3rem;margin:24px 0 10px;border-bottom:1px solid rgba(212,175,55,0.25);padding-bottom:6px"
- h3 → style="color:#4DB6AC;font-size:1rem;margin:14px 0 6px"
- p  → style="color:#94a3b8;line-height:1.7;margin-bottom:10px"
- span.badge-good → style="background:rgba(34,197,94,0.15);color:#22c55e;padding:2px 8px;border-radius:4px;font-size:0.8rem;font-weight:700"
- span.badge-bad  → style="background:rgba(239,68,68,0.15);color:#ef4444;padding:2px 8px;border-radius:4px;font-size:0.8rem;font-weight:700"
- span.badge-tip  → style="background:rgba(212,175,55,0.15);color:#d4af37;padding:2px 8px;border-radius:4px;font-size:0.8rem;font-weight:700"
- div.card-blue   → style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:14px;margin-bottom:10px"
- div.card-red    → style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px;margin-bottom:10px"
- div.card-green  → style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:14px;margin-bottom:10px"
- div.card-gold   → style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:8px;padding:14px;margin-bottom:10px"

━━━ SECCIÓN 1: RESUMEN EJECUTIVO DEL TORNEO ━━━
Una tabla HTML estilizada con: Torneo, Plataforma, Buy-in, Fecha, Nivel inicio/fin, Stack inicio/fin, Manos jugadas, VPIP, All-ins, Showdowns.
Luego 1 párrafo de síntesis del resultado global de {nombre} (¿llegó tarde o temprano? ¿cómo fue su stack journey? ¿fue élite o por debajo del promedio?).

━━━ SECCIÓN 2: LAS 7 MEJORES DECISIONES ━━━
Usa layout de 2 columnas HTML: left=Decisión (con example real de mano), right=Por qué fue correcta (análisis técnico).
Cada decisión tiene: título h3 con badge-good, descripción de la mano real del historial, análisis de por qué fue +EV, impacto estimado.

━━━ SECCIÓN 3: LAS 7 PEORES DECISIONES ━━━
Mismo layout 2 columnas: left=Decisión con ejemplo real, right=La jugada correcta alternativa.
Cada error: título h3 con badge-bad, descripción de la mano real, jugada alternativa óptima, costo estimado en chips/EV.

━━━ SECCIÓN 4: 7 RECOMENDACIONES DE MEJORA ━━━
Una lista numerada con ítems card-gold. Cada recomendación conecta directamente con uno de los 7 errores. Accionable y específica.

━━━ SECCIÓN 5: CORRELACIÓN CON PERFIL DEL JUGADOR ━━━
~200 palabras (suficientes para justificar y cerrar la idea).
{"Correlaciona los errores del torneo con las debilidades del perfil psicológico/técnico. Con ejemplos: 'En la mano X, Hero hizo Y, lo cual es consistente con su perfil de Z...'. Conecta lo que pasó en la mesa con lo que revelan sus tests MindEV." if player_profile else "No hay perfil disponible. Explica cómo un perfil psicológico ayudaría a entender estos errores y recomienda completar los tests MindEV."}

IMPORTANTE: Usa ejemplos REALES de las manos del historial (nivel, cartas, acciones reales). Sé directo, técnico y motivador. Completa TODAS las secciones hasta el final.
"""


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    print("=" * 60)
    print("  EVHAPO - Diagnóstico Mental del Jugador de Poker")
    print("  Servidor corriendo en: http://localhost:5000")
    print("=" * 60)
    app.run(debug=False, host='0.0.0.0', port=5000)
