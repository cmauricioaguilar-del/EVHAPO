import os
import sqlite3
import hashlib
import hmac
import json
import datetime
import secrets
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
    """)
    db.commit()
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
        "SELECT id, score_total, scores_json, completed_at FROM test_sessions "
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

# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    print("=" * 60)
    print("  EVHAPO - Diagnóstico Mental del Jugador de Poker")
    print("  Servidor corriendo en: http://localhost:5000")
    print("=" * 60)
    app.run(debug=False, host='0.0.0.0', port=5000)
