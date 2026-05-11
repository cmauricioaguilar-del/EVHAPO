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
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Config
SECRET_KEY = os.environ.get('SECRET_KEY', 'evhapo-secret-key-2024-change-in-production')
# En Railway se monta un volumen en /data; localmente usa el directorio del script
_DATA_DIR = os.environ.get('DATA_DIR', os.path.dirname(__file__))
os.makedirs(_DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(_DATA_DIR, 'evhapo.db')
TEST_PRICE_USD = 9.90

MERCADOPAGO_ACCESS_TOKEN = os.environ.get('MERCADOPAGO_ACCESS_TOKEN', '')
MERCADOPAGO_PUBLIC_KEY   = os.environ.get('MERCADOPAGO_PUBLIC_KEY', '')
STRIPE_SECRET_KEY        = os.environ.get('STRIPE_SECRET_KEY', '')
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5000')

SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT   = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER   = os.environ.get('SMTP_USER', '')
SMTP_PASS   = os.environ.get('SMTP_PASS', '')

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

def _get_api_key():
    """Lee la API key en tiempo de ejecución — funciona aunque el servidor
    haya arrancado sin la variable de entorno configurada."""
    # 1. Variable de entorno (set por el .bat)
    key = os.environ.get('ANTHROPIC_API_KEY', '')
    if key:
        return key
    # 2. Módulo-level (si se cargó al inicio)
    if ANTHROPIC_API_KEY:
        return ANTHROPIC_API_KEY
    # 3. Leer el .env en disco en tiempo real
    _here = os.path.dirname(os.path.abspath(__file__))
    for _p in [os.path.join(_here, '.env'), os.path.join(_here, '..', '.env')]:
        try:
            with open(_p, encoding='utf-8') as _f:
                for _ln in _f:
                    _ln = _ln.strip()
                    if _ln.startswith('ANTHROPIC_API_KEY='):
                        _v = _ln.split('=', 1)[1].strip().strip('"').strip("'")
                        if _v:
                            os.environ['ANTHROPIC_API_KEY'] = _v
                            return _v
        except Exception:
            pass
    return ''

print(f"[CONFIG] API key: {'OK' if ANTHROPIC_API_KEY else 'se leerá desde .env en cada request'}")

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

        CREATE TABLE IF NOT EXISTS tournament_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            tournament_name TEXT,
            platform TEXT,
            buy_in TEXT,
            total_hands INTEGER,
            hero_hands INTEGER,
            date TEXT,
            report_html TEXT,
            status TEXT DEFAULT 'done',
            error_msg TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS referral_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            used_by INTEGER REFERENCES users(id),
            used_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    db.commit()
    # Migración: agregar columnas nuevas si no existen (para DBs ya creadas)
    for col, definition in [('status', "TEXT DEFAULT 'done'"), ('error_msg', 'TEXT')]:
        try:
            db.execute(f"ALTER TABLE tournament_analyses ADD COLUMN {col} {definition}")
            db.commit()
        except Exception:
            pass  # La columna ya existe

    # Migraciones automáticas (columnas nuevas en tablas existentes)
    migrations = [
        "ALTER TABLE test_sessions ADD COLUMN test_type TEXT DEFAULT 'mental'",
        "ALTER TABLE payments ADD COLUMN test_type TEXT DEFAULT 'mental'",
        "ALTER TABLE users ADD COLUMN sala_preferida TEXT DEFAULT ''",
        "ALTER TABLE users ADD COLUMN referral_code TEXT DEFAULT ''",
        "ALTER TABLE users ADD COLUMN referral_notified INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN coupon_code TEXT DEFAULT ''",
        "ALTER TABLE users ADD COLUMN coupon_activated_at TEXT",
        "ALTER TABLE users ADD COLUMN last_coupon_reminder TEXT",
        "ALTER TABLE player_profiles ADD COLUMN status TEXT DEFAULT 'done'",
        "ALTER TABLE player_profiles ADD COLUMN error_msg TEXT",
    ]
    for sql in migrations:
        try:
            db.execute(sql)
            db.commit()
        except Exception:
            pass  # La columna ya existe, ignorar

    # Promover cuenta owner a admin
    db.execute("UPDATE users SET is_admin=1 WHERE email='c.mauricio.aguilar@gmail.com'")
    db.commit()

    # Sembrar 100 cupones aleatorios si la tabla está vacía
    count = db.execute("SELECT COUNT(*) FROM coupons").fetchone()[0]
    if count == 0:
        codes = set()
        while len(codes) < 100:
            c = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            codes.add(c)
        for c in sorted(codes):
            db.execute("INSERT INTO coupons (code) VALUES (?)", (c,))
        db.commit()
        print("[COUPONS] 100 códigos generados y guardados en la base de datos")

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

VALID_ROOMS = {'pokerstars', 'ggpoker', 'wpt global', 'acr', 'coolbet', '888 poker', 'coin poker', 'ninguna'}

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    nombre = (data.get('nombre') or '').strip()
    apellido = (data.get('apellido') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    pais = (data.get('pais') or '').strip()
    sala_preferida = (data.get('sala_preferida') or '').strip()
    referral_code_raw = (data.get('referral_code') or '').strip()

    if not all([nombre, apellido, email, password]):
        return jsonify({'error': 'Todos los campos son obligatorios'}), 400
    if not sala_preferida:
        return jsonify({'error': 'Debes seleccionar una sala preferida'}), 400
    if sala_preferida.lower() not in VALID_ROOMS:
        return jsonify({'error': 'Sala preferida no válida'}), 400
    if len(password) < 6:
        return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400

    db = get_db()

    # Validar código de referencia si fue ingresado
    referral_code = ''
    if referral_code_raw:
        row = db.execute(
            "SELECT code FROM referral_codes WHERE LOWER(code)=LOWER(?)", (referral_code_raw,)
        ).fetchone()
        if not row:
            return jsonify({'error': 'Código de referencia no válido'}), 400
        referral_code = row['code']  # guardar el código en su forma canónica

    existing = db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
    if existing:
        uid = existing['id']
        paid = db.execute(
            "SELECT id FROM payments WHERE user_id=? AND status='approved' LIMIT 1", (uid,)
        ).fetchone()
        if paid:
            return jsonify({'error': 'already_paid', 'message': 'Ya tienes una cuenta activa con este email. Inicia sesión para continuar.'}), 409
        else:
            db.execute('DELETE FROM tokens WHERE user_id=?', (uid,))
            db.execute('DELETE FROM test_sessions WHERE user_id=?', (uid,))
            db.execute('DELETE FROM payments WHERE user_id=?', (uid,))
            db.execute('DELETE FROM player_profiles WHERE user_id=?', (uid,))
            db.execute('DELETE FROM tournament_analyses WHERE user_id=?', (uid,))
            db.execute('DELETE FROM users WHERE id=?', (uid,))
            db.commit()

    db.execute(
        "INSERT INTO users (nombre, apellido, email, password_hash, pais, sala_preferida, referral_code) VALUES (?,?,?,?,?,?,?)",
        (nombre, apellido, email, hash_password(password), pais, sala_preferida, referral_code)
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

def _get_coupon_days_remaining(coupon_activated_at):
    """Retorna los días restantes del cupón (0 si expiró, None si no tiene cupón)."""
    if not coupon_activated_at:
        return None
    try:
        activated = datetime.datetime.fromisoformat(coupon_activated_at)
        days_used = (datetime.datetime.utcnow() - activated).days
        return max(0, 30 - days_used)
    except Exception:
        return None


@app.route('/api/me', methods=['GET'])
@require_auth
def me():
    db = get_db()
    user = db.execute(
        "SELECT id, nombre, apellido, email, pais, created_at, coupon_code, coupon_activated_at FROM users WHERE id=?",
        (g.user_id,)
    ).fetchone()
    sessions = db.execute(
        "SELECT id, score_total, scores_json, completed_at FROM test_sessions "
        "WHERE user_id=? AND completed=1 ORDER BY completed_at DESC", (g.user_id,)
    ).fetchall()
    payment = db.execute(
        "SELECT id FROM payments WHERE user_id=? AND status='approved' LIMIT 1", (g.user_id,)
    ).fetchone()

    # Estado del cupón
    coupon_info = None
    days_remaining = _get_coupon_days_remaining(user['coupon_activated_at'])
    if user['coupon_activated_at']:
        coupon_info = {
            'code': user['coupon_code'],
            'activated_at': user['coupon_activated_at'],
            'days_remaining': days_remaining,
            'active': (days_remaining or 0) > 0,
            'expired': (days_remaining or 0) == 0,
        }

    has_access = bool(payment) or (coupon_info is not None and coupon_info['active'])

    return jsonify({
        'user': dict(user),
        'sessions': [dict(s) for s in sessions],
        'has_payment': has_access,
        'coupon': coupon_info,
    })

# ─── Payment routes ───────────────────────────────────────────────────────────

@app.route('/api/payment/mp-config', methods=['GET'])
def mp_config():
    """Devuelve la Public Key de MercadoPago al frontend."""
    pk  = os.environ.get('MERCADOPAGO_PUBLIC_KEY', MERCADOPAGO_PUBLIC_KEY)
    tok = os.environ.get('MERCADOPAGO_ACCESS_TOKEN', MERCADOPAGO_ACCESS_TOKEN)
    return jsonify({'public_key': pk, 'enabled': bool(tok)})

@app.route('/api/payment/create', methods=['POST'])
@require_auth
def create_payment():
    data = request.json or {}
    method = data.get('method', 'mercadopago')
    pais   = data.get('pais', 'CL')
    test_type = data.get('test_type', 'mental')

    # Montos reales en moneda local (sin dividir por 100)
    currency_map = {
        'AR': ('ARS', 9000),
        'CL': ('CLP', 9500),
        'MX': ('MXN', 170),
        'CO': ('COP', 40000),
        'PE': ('PEN', 37),
        'UY': ('UYU', 390),
        'BR': ('BRL', 50),
    }
    currency, local_amount = currency_map.get(pais.upper(), ('USD', 9.90))

    db = get_db()
    payment_id = db.execute(
        "INSERT INTO payments (user_id, amount, currency, method, status, test_type) VALUES (?,?,?,?,?,?)",
        (g.user_id, TEST_PRICE_USD, 'USD', method, 'pending', test_type)
    ).lastrowid
    db.commit()

    if method == 'mercadopago' and MERCADOPAGO_ACCESS_TOKEN:
        return _create_mercadopago_payment(payment_id, local_amount, currency, test_type)
    elif method == 'stripe' and (STRIPE_SECRET_KEY or os.environ.get('STRIPE_SECRET_KEY')):
        return _create_stripe_payment(payment_id)
    else:
        # Demo mode
        db.execute("UPDATE payments SET status='approved', external_id='DEMO' WHERE id=?", (payment_id,))
        db.commit()
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
            'message': 'Modo demo activo.'
        })

def _create_mercadopago_payment(payment_id, amount, currency, test_type='mental'):
    try:
        import mercadopago
        sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)
        pref = sdk.preference().create({
            "items": [{
                "title": f"MindEV – Diagnóstico {'Mental' if test_type == 'mental' else 'Técnico'} Poker",
                "quantity": 1,
                "unit_price": float(amount),
                "currency_id": currency
            }],
            "back_urls": {
                "success": f"{BASE_URL}/?mp_result=success&pid={payment_id}",
                "failure": f"{BASE_URL}/?mp_result=failure&pid={payment_id}",
                "pending": f"{BASE_URL}/?mp_result=pending&pid={payment_id}"
            },
            "auto_return": "approved",
            "external_reference": str(payment_id),
            "statement_descriptor": "MindEV Poker"
        })
        return jsonify({
            'mode': 'mercadopago',
            'init_point': pref['response']['init_point'],
            'payment_id': payment_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/payment/mp-verify', methods=['POST'])
@require_auth
def mp_verify():
    """Verifica el estado de un pago de MercadoPago y crea la sesión de test."""
    data = request.json or {}
    payment_id = data.get('payment_id')
    db = get_db()
    pay = db.execute(
        "SELECT * FROM payments WHERE id=? AND user_id=?", (payment_id, g.user_id)
    ).fetchone()
    if not pay:
        return jsonify({'error': 'Pago no encontrado'}), 404

    # Si ya está aprobado, devolver sesión existente o crear una
    if pay['status'] == 'approved':
        existing = db.execute(
            "SELECT id FROM test_sessions WHERE payment_id=?", (payment_id,)
        ).fetchone()
        if existing:
            return jsonify({'ok': True, 'session_id': existing['id'], 'test_type': pay['test_type']})
        session_id = db.execute(
            "INSERT INTO test_sessions (user_id, payment_id, test_type) VALUES (?,?,?)",
            (g.user_id, payment_id, pay['test_type'])
        ).lastrowid
        db.commit()
        return jsonify({'ok': True, 'session_id': session_id, 'test_type': pay['test_type']})

    # Consultar estado en MercadoPago
    mp_payment_id = data.get('mp_payment_id')
    if mp_payment_id and MERCADOPAGO_ACCESS_TOKEN:
        try:
            import mercadopago
            sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)
            info = sdk.payment().get(mp_payment_id)
            status = info['response'].get('status')
            if status == 'approved':
                db.execute("UPDATE payments SET status='approved', external_id=? WHERE id=?",
                           (str(mp_payment_id), payment_id))
                db.commit()
                threading.Thread(target=_send_referral_notification, args=(g.user_id,), daemon=True).start()
                session_id = db.execute(
                    "INSERT INTO test_sessions (user_id, payment_id, test_type) VALUES (?,?,?)",
                    (g.user_id, payment_id, pay['test_type'])
                ).lastrowid
                db.commit()
                return jsonify({'ok': True, 'session_id': session_id, 'test_type': pay['test_type']})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'ok': False, 'status': pay['status']})

def _create_stripe_payment(payment_id):
    """Crea una sesión de Stripe Checkout (hosted page, igual que MercadoPago)."""
    try:
        import stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY') or STRIPE_SECRET_KEY
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': 990,  # $9.90 USD en centavos
                    'product_data': {
                        'name': 'EVHAPO – Acceso completo',
                        'description': 'Test Mental + Técnico · Acceso permanente',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            # {CHECKOUT_SESSION_ID} es una variable de plantilla que Stripe reemplaza automáticamente
            success_url=f"{BASE_URL}/?stripe_result=success&session_id={{CHECKOUT_SESSION_ID}}&pid={payment_id}",
            cancel_url=f"{BASE_URL}/?stripe_result=cancel",
            metadata={'payment_id': str(payment_id)},
        )
        return jsonify({
            'mode': 'stripe',
            'checkout_url': session.url,
            'payment_id': payment_id,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/payment/stripe-verify', methods=['POST'])
@require_auth
def stripe_verify():
    """Verifica el pago de Stripe y activa el acceso del usuario."""
    data       = request.json or {}
    session_id = data.get('session_id', '')
    payment_id = data.get('payment_id')

    if not session_id:
        return jsonify({'ok': False, 'error': 'Missing session_id'}), 400

    try:
        import stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY') or STRIPE_SECRET_KEY
        cs = stripe.checkout.Session.retrieve(session_id)

        if cs.payment_status != 'paid':
            return jsonify({'ok': False, 'status': cs.payment_status})

        db = get_db()
        pay = db.execute(
            "SELECT * FROM payments WHERE id=? AND user_id=?",
            (payment_id, g.user_id)
        ).fetchone()

        if not pay:
            return jsonify({'ok': False, 'error': 'Payment record not found'}), 404

        db.execute(
            "UPDATE payments SET status='approved', external_id=? WHERE id=?",
            (session_id, payment_id)
        )
        db.commit()
        threading.Thread(target=_send_referral_notification, args=(g.user_id,), daemon=True).start()
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

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
    db.commit()
    threading.Thread(target=_send_referral_notification, args=(g.user_id,), daemon=True).start()
    return jsonify({'ok': True})

@app.route('/api/test/new-session', methods=['POST'])
@require_auth
def new_test_session():
    """Crea una sesión de test. Requiere al menos un pago aprobado."""
    data = request.json or {}
    test_type = data.get('test_type', 'mental')
    db = get_db()

    # Verificar acceso: pago aprobado, cupón activo o es admin
    user = db.execute("SELECT is_admin, coupon_activated_at FROM users WHERE id=?", (g.user_id,)).fetchone()
    payment = db.execute(
        "SELECT id FROM payments WHERE user_id=? AND status='approved' ORDER BY id DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()

    coupon_access = (_get_coupon_days_remaining(user['coupon_activated_at'] if user else None) or 0) > 0

    if not payment and not coupon_access and not (user and user['is_admin']):
        return jsonify({'error': 'no_payment', 'message': 'Necesitas completar el pago para acceder al test'}), 402

    payment_id = payment['id'] if payment else None
    session_id = db.execute(
        "INSERT INTO test_sessions (user_id, payment_id, test_type) VALUES (?,?,?)",
        (g.user_id, payment_id, test_type)
    ).lastrowid
    db.commit()
    return jsonify({'session_id': session_id, 'test_type': test_type})

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
                    db.row_factory = sqlite3.Row
                    db.execute("UPDATE payments SET status='approved', external_id=? WHERE id=?",
                               (str(payment_id_external), ref))
                    row = db.execute("SELECT user_id, test_type FROM payments WHERE id=?", (ref,)).fetchone()
                    if row:
                        existing = db.execute("SELECT id FROM test_sessions WHERE payment_id=?", (ref,)).fetchone()
                        if not existing:
                            db.execute(
                                "INSERT INTO test_sessions (user_id, payment_id, test_type) VALUES (?,?,?)",
                                (row['user_id'], ref, row['test_type'] or 'mental')
                            )
                        threading.Thread(target=_send_referral_notification, args=(row['user_id'],), daemon=True).start()
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

@app.route('/api/admin/config-status', methods=['GET'])
@require_auth
def config_status():
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    stripe_key = os.environ.get('STRIPE_SECRET_KEY') or STRIPE_SECRET_KEY
    mp_token   = os.environ.get('MERCADOPAGO_ACCESS_TOKEN') or MERCADOPAGO_ACCESS_TOKEN
    return jsonify({
        'stripe_configured': bool(stripe_key),
        'stripe_key_prefix': stripe_key[:12] + '...' if stripe_key else 'NO CONFIGURADO',
        'mercadopago_configured': bool(mp_token),
        'base_url': BASE_URL,
        'smtp_configured': bool(SMTP_USER and SMTP_PASS),
    })

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

@app.route('/api/admin/referral-codes', methods=['GET'])
@require_auth
def list_referral_codes():
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    db = get_db()
    rows = db.execute("SELECT id, code, notes, created_at FROM referral_codes ORDER BY created_at DESC").fetchall()
    return jsonify({'codes': [dict(r) for r in rows]})

@app.route('/api/admin/referral-codes', methods=['POST'])
@require_auth
def add_referral_code():
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    data = request.json or {}
    code = (data.get('code') or '').strip()
    notes = (data.get('notes') or '').strip()
    if not code:
        return jsonify({'error': 'El código no puede estar vacío'}), 400
    db = get_db()
    existing = db.execute("SELECT id FROM referral_codes WHERE LOWER(code)=LOWER(?)", (code,)).fetchone()
    if existing:
        return jsonify({'error': 'El código ya existe'}), 409
    db.execute("INSERT INTO referral_codes (code, notes) VALUES (?,?)", (code, notes))
    db.commit()
    return jsonify({'ok': True, 'code': code}), 201

@app.route('/api/admin/referral-codes/<code>', methods=['DELETE'])
@require_auth
def delete_referral_code(code):
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    db = get_db()
    row = db.execute("SELECT id FROM referral_codes WHERE LOWER(code)=LOWER(?)", (code,)).fetchone()
    if not row:
        return jsonify({'error': 'Código no encontrado'}), 404
    db.execute("DELETE FROM referral_codes WHERE id=?", (row['id'],))
    db.commit()
    return jsonify({'ok': True})

@app.route('/api/admin/users', methods=['GET'])
@require_auth
def list_users():
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    db = get_db()
    rows = db.execute(
        "SELECT id, nombre, apellido, email, pais, referral_code, created_at, coupon_activated_at FROM users ORDER BY created_at DESC"
    ).fetchall()
    users_data = []
    for r in rows:
        u = dict(r)
        u['coupon_days_remaining'] = _get_coupon_days_remaining(r['coupon_activated_at'])
        users_data.append(u)
    return jsonify({'users': users_data})

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@require_auth
def delete_user(user_id):
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    if user_id == g.user_id:
        return jsonify({'error': 'No puedes eliminarte a ti mismo'}), 400
    db = get_db()
    user = db.execute("SELECT nombre, apellido, email FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    db.execute('DELETE FROM tokens WHERE user_id=?', (user_id,))
    db.execute('DELETE FROM test_sessions WHERE user_id=?', (user_id,))
    db.execute('DELETE FROM payments WHERE user_id=?', (user_id,))
    db.execute('DELETE FROM player_profiles WHERE user_id=?', (user_id,))
    db.execute('DELETE FROM tournament_analyses WHERE user_id=?', (user_id,))
    db.execute('DELETE FROM users WHERE id=?', (user_id,))
    db.commit()
    return jsonify({'ok': True, 'deleted': f"{user['nombre']} {user['apellido']}"})

@app.route('/api/referral/validate', methods=['POST'])
def validate_referral_code():
    data = request.json or {}
    code = (data.get('code') or '').strip()
    if not code:
        return jsonify({'valid': False})
    db = get_db()
    row = db.execute("SELECT code FROM referral_codes WHERE LOWER(code)=LOWER(?)", (code,)).fetchone()
    return jsonify({'valid': bool(row), 'canonical': row['code'] if row else None})

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

REFERRAL_NOTIFY_EMAIL = 'c.mauricio.aguilar@gmail.com'

def _send_referral_notification(user_id, db=None):
    """Envía email a Mauricio cuando un usuario referido completa su primer pago."""
    own_db = False
    try:
        if db is None:
            db = sqlite3.connect(DB_PATH)
            db.row_factory = sqlite3.Row
            own_db = True

        user = db.execute(
            "SELECT nombre, apellido, email, pais, referral_code, referral_notified FROM users WHERE id=?",
            (user_id,)
        ).fetchone()

        if not user or not user['referral_code'] or user['referral_notified']:
            return

        # Marcar como notificado primero para evitar duplicados
        db.execute("UPDATE users SET referral_notified=1 WHERE id=?", (user_id,))
        db.commit()

        code = user['referral_code']
        nombre = user['nombre']
        apellido = user['apellido']
        email = user['email']
        pais = user['pais']

        body = f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:32px;border-radius:12px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:3rem;color:#d4af37">♠</span>
            <h1 style="color:#d4af37;margin:8px 0">MindEV – Nuevo Usuario</h1>
          </div>
          <div style="background:#1a2235;border-left:4px solid #d4af37;padding:16px;border-radius:8px;margin-bottom:20px">
            <p style="margin:0;font-size:1.1rem">Referido por: <strong style="color:#d4af37">{code}</strong></p>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:10px 8px;color:#94a3b8;width:40%">Nombre</td><td style="padding:10px 8px">{nombre}</td></tr>
            <tr style="background:#1a2235"><td style="padding:10px 8px;color:#94a3b8">Apellido</td><td style="padding:10px 8px">{apellido}</td></tr>
            <tr><td style="padding:10px 8px;color:#94a3b8">Email</td><td style="padding:10px 8px">{email}</td></tr>
            <tr style="background:#1a2235"><td style="padding:10px 8px;color:#94a3b8">País</td><td style="padding:10px 8px">{pais}</td></tr>
            <tr><td style="padding:10px 8px;color:#94a3b8">Código referencia</td><td style="padding:10px 8px;color:#d4af37;font-weight:bold">{code}</td></tr>
          </table>
        </div>
        """
        _smtp_send(REFERRAL_NOTIFY_EMAIL, f"Nuevo usuario, referido por: {code}", body)

        print(f"[REFERRAL] Email enviado — usuario: {email}, código: {code}")
    except Exception as e:
        print(f"[REFERRAL] Error al enviar notificación: {e}")
    finally:
        if own_db and db:
            db.close()


def _smtp_send(to_addr, subject, html_body):
    """
    Envía un email HTML intentando múltiples estrategias SMTP.
    Fuerza IPv4 para evitar el error 'Network is unreachable' en Railway (IPv6 no disponible).
    Lanza excepción con detalle si todos los intentos fallan.
    """
    import ssl, socket

    smtp_user   = os.environ.get('SMTP_USER', '') or SMTP_USER
    smtp_pass   = os.environ.get('SMTP_PASS', '') or SMTP_PASS
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')

    if not smtp_user or not smtp_pass:
        raise Exception('SMTP_USER o SMTP_PASS no configurados')

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From']    = smtp_user
    msg['To']      = to_addr
    msg.attach(MIMEText(html_body, 'html'))
    raw = msg.as_string()

    errors = []

    # — Intento 1: IPv4 forzado, puerto 587 STARTTLS —
    try:
        infos = socket.getaddrinfo(smtp_server, 587, socket.AF_INET, socket.SOCK_STREAM)
        ipv4 = infos[0][4][0]
        with smtplib.SMTP(ipv4, 587, timeout=25) as s:
            s._host = smtp_server   # para validación TLS del certificado
            s.ehlo()
            s.starttls()
            s.ehlo()
            s.login(smtp_user, smtp_pass)
            s.sendmail(smtp_user, to_addr, raw)
        print(f"[SMTP] Enviado a {to_addr} via IPv4/587")
        return
    except Exception as e:
        errors.append(f"IPv4/587: {e}")

    # — Intento 2: IPv4 forzado, puerto 465 SSL —
    try:
        infos = socket.getaddrinfo(smtp_server, 465, socket.AF_INET, socket.SOCK_STREAM)
        ipv4 = infos[0][4][0]
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with smtplib.SMTP_SSL(ipv4, 465, context=ctx, timeout=25) as s:
            s.login(smtp_user, smtp_pass)
            s.sendmail(smtp_user, to_addr, raw)
        print(f"[SMTP] Enviado a {to_addr} via IPv4/465-SSL")
        return
    except Exception as e:
        errors.append(f"IPv4/465: {e}")

    # — Intento 3: hostname directo, puerto 587 —
    try:
        with smtplib.SMTP(smtp_server, 587, timeout=25) as s:
            s.ehlo()
            s.starttls()
            s.ehlo()
            s.login(smtp_user, smtp_pass)
            s.sendmail(smtp_user, to_addr, raw)
        print(f"[SMTP] Enviado a {to_addr} via hostname/587")
        return
    except Exception as e:
        errors.append(f"hostname/587: {e}")

    raise Exception("Todos los intentos SMTP fallaron — " + " | ".join(errors))


def _send_reset_email(to_email, nombre, temp_pw):
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:3rem;color:#d4af37">&#9824;</span>
        <h1 style="color:#d4af37;margin:8px 0">EVHAPO</h1>
      </div>
      <h2 style="margin-bottom:8px">Hola, {nombre}</h2>
      <p>Recibimos tu solicitud de recuperacion de contrasena.</p>
      <p>Tu nueva contrasena temporal es:</p>
      <div style="background:#1a2235;border:2px solid #d4af37;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
        <code style="font-size:1.5rem;color:#d4af37;letter-spacing:3px;font-weight:bold">{temp_pw}</code>
      </div>
      <p>Ingresa con esta contrasena y cambiala desde tu perfil lo antes posible.</p>
      <p style="color:#64748b;font-size:0.85rem;margin-top:24px">Si no solicitaste este cambio, ignora este mensaje.</p>
    </div>
    """
    _smtp_send(to_email, 'MindEV - Tu contrasena temporal', body)

# ─── Coupon routes ───────────────────────────────────────────────────────────

@app.route('/api/coupon/apply', methods=['POST'])
@require_auth
def apply_coupon():
    data = request.json or {}
    code = (data.get('code') or '').strip().upper()
    if not code or len(code) != 6:
        return jsonify({'error': 'Código inválido. Debe tener 6 caracteres.'}), 400

    db = get_db()

    # Verificar que el usuario no tenga ya un cupón activo
    user_row = db.execute(
        "SELECT coupon_activated_at FROM users WHERE id=?", (g.user_id,)
    ).fetchone()
    if user_row and user_row['coupon_activated_at']:
        days_rem = _get_coupon_days_remaining(user_row['coupon_activated_at'])
        if (days_rem or 0) > 0:
            return jsonify({'error': 'Ya tienes un cupón activo.'}), 400

    coupon = db.execute("SELECT * FROM coupons WHERE code=?", (code,)).fetchone()
    if not coupon:
        return jsonify({'error': 'Código no válido'}), 400
    if coupon['used_by']:
        return jsonify({'error': 'Este código ya fue utilizado'}), 400

    now = datetime.datetime.utcnow().isoformat()
    db.execute("UPDATE coupons SET used_by=?, used_at=? WHERE code=?", (g.user_id, now, code))
    db.execute("UPDATE users SET coupon_code=?, coupon_activated_at=? WHERE id=?",
               (code, now, g.user_id))
    db.commit()

    return jsonify({'ok': True, 'days': 30, 'activated_at': now})


@app.route('/api/admin/send-coupon-sample', methods=['POST'])
@require_auth
def send_coupon_sample():
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    smtp_user = os.environ.get('SMTP_USER', '') or SMTP_USER
    base_url  = os.environ.get('BASE_URL', BASE_URL)
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:3rem;color:#d4af37">&#9824;</span>
        <h1 style="color:#d4af37;margin:8px 0 4px">MindEV</h1>
        <p style="margin:0;color:#94a3b8;font-size:0.9rem">Diagnostico Mental y Tecnico para Poker</p>
      </div>
      <div style="background:#1a2235;border:1px dashed #d4af37;border-radius:8px;padding:10px 16px;margin-bottom:20px;text-align:center">
        <p style="margin:0;font-size:0.78rem;color:#d4af37;text-transform:uppercase;letter-spacing:1px">Correo de muestra - MindEV Admin</p>
      </div>
      <h2 style="margin-bottom:8px">Hola, Mauricio</h2>
      <div style="background:#1a2235;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:8px;margin:20px 0">
        <p style="margin:0;font-size:1.05rem;color:#fbbf24;font-weight:700">Tienes 23 dias restantes en MindEV</p>
      </div>
      <p style="line-height:1.7;color:#cbd5e1">
        Llevas 7 dias usando MindEV y tu acceso de prueba sigue activo.
        Este es un ejemplo del correo semanal que recibirán tus usuarios con cupon.
        El texto real es generado automaticamente por IA, personalizado con el nombre del jugador
        y un mensaje motivacional sobre su juego de poker.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="{base_url}" style="display:inline-block;background:#d4af37;color:#0a0e1a;font-weight:700;font-size:1rem;padding:14px 32px;border-radius:8px;text-decoration:none">
          Acceder a MindEV
        </a>
      </div>
      <p style="text-align:center;margin-top:24px;color:#475569;font-size:0.8rem">MindEV - evhapo@tiburock.cl</p>
    </div>
    """
    try:
        _smtp_send(REFERRAL_NOTIFY_EMAIL, "[MUESTRA] MindEV - correo semanal de cupon", html)
        return jsonify({'ok': True, 'message': f'Correo enviado a {REFERRAL_NOTIFY_EMAIL}', 'smtp_user': smtp_user})
    except Exception as e:
        print(f"[COUPON] ERROR: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/coupons', methods=['GET'])
@require_auth
def list_coupons():
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    db = get_db()
    rows = db.execute(
        """SELECT c.id, c.code, c.used_at, c.created_at,
                  u.nombre, u.apellido, u.email
           FROM coupons c LEFT JOIN users u ON c.used_by=u.id
           ORDER BY c.code ASC"""
    ).fetchall()
    return jsonify({'coupons': [dict(r) for r in rows]})


# ─── Coupon email scheduler ───────────────────────────────────────────────────

_coupon_sample_sent = False


def _generate_coupon_email_html(nombre, days_remaining, lang='es'):
    """Genera el HTML del correo de recordatorio de cupón con párrafo IA."""
    import requests as _requests
    api_key = _get_api_key()

    ai_paragraph = ''
    if api_key:
        try:
            lang_word = 'Spanish' if lang == 'es' else 'Brazilian Portuguese'
            prompt = (
                f"You are MindEV, a poker improvement platform. Write a SHORT motivational paragraph "
                f"(2-3 sentences) in {lang_word} for a poker player named {nombre} who has "
                f"{days_remaining} days left of trial access to the MindEV diagnostic platform. "
                f"Focus on: the value of continuing to study their mental game, a specific mindset "
                f"concept relevant to poker improvement, or the cost of unaddressed leaks. "
                f"Be encouraging, professional, and poker-specific. "
                f"Do NOT use generic phrases. Write ONLY the paragraph, nothing else."
            )
            resp = _requests.post(
                'https://api.anthropic.com/v1/messages',
                headers={
                    'x-api-key': api_key,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
                json={
                    'model': 'claude-sonnet-4-6',
                    'max_tokens': 300,
                    'messages': [{'role': 'user', 'content': prompt}]
                },
                timeout=30,
                verify=False
            )
            if resp.status_code == 200:
                ai_paragraph = resp.json()['content'][0]['text'].strip()
        except Exception as e:
            print(f"[COUPON] AI paragraph error: {e}")

    if not ai_paragraph:
        ai_paragraph = (
            'Tu acceso a MindEV sigue activo y cada sesión de estudio cuenta. '
            'Aprovechar estos días para identificar y trabajar tus fugas mentales '
            'puede marcar la diferencia en tus resultados a largo plazo.'
            if lang == 'es' else
            'Seu acesso ao MindEV continua ativo e cada sessão de estudo conta. '
            'Aproveitar esses dias para identificar e trabalhar suas fugas mentais '
            'pode fazer a diferença nos seus resultados a longo prazo.'
        )

    subject_label = (
        f"Tienes {days_remaining} días restantes en MindEV"
        if lang == 'es' else
        f"Você tem {days_remaining} dias restantes no MindEV"
    )
    greeting = f"{'Hola' if lang == 'es' else 'Olá'}, {nombre} 👋"
    cta_text = '→ Acceder a MindEV' if lang == 'es' else '→ Acessar MindEV'
    footer_text = ('Diagnóstico Mental y Técnico para Poker'
                   if lang == 'es' else 'Diagnóstico Mental e Técnico para Poker')

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:3rem;color:#d4af37">♠</span>
        <h1 style="color:#d4af37;margin:8px 0 4px">MindEV</h1>
        <p style="margin:0;color:#94a3b8;font-size:0.9rem">{footer_text}</p>
      </div>
      <h2 style="margin-bottom:8px">{greeting}</h2>
      <div style="background:#1a2235;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:8px;margin:20px 0">
        <p style="margin:0;font-size:1.05rem;color:#fbbf24;font-weight:700">⏳ {subject_label}</p>
      </div>
      <p style="line-height:1.7;color:#cbd5e1">{ai_paragraph}</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{BASE_URL}" style="display:inline-block;background:#d4af37;color:#0a0e1a;font-weight:700;font-size:1rem;padding:14px 32px;border-radius:8px;text-decoration:none">
          {cta_text}
        </a>
      </div>
      <p style="text-align:center;margin-top:24px;color:#475569;font-size:0.8rem">
        MindEV – {footer_text}<br>
        <a href="mailto:evhapo@tiburock.cl" style="color:#64748b">evhapo@tiburock.cl</a>
      </p>
    </div>
    """


def _send_coupon_reminder_email(user_id, nombre, email, days_remaining, pais):
    """Envía el correo de recordatorio semanal al usuario con cupón (texto generado por IA)."""
    lang = 'pt' if pais and pais.upper() == 'BR' else 'es'
    html = _generate_coupon_email_html(nombre, days_remaining, lang)
    subject = (f"Tienes {days_remaining} dias restantes en MindEV"
               if lang == 'es' else
               f"Voce tem {days_remaining} dias restantes no MindEV")
    _smtp_send(email, subject, html)
    print(f"[COUPON] Reminder sent to {email} — {days_remaining} days remaining")


def _send_coupon_sample_email(force=False):
    """Envía un correo de muestra al admin. force=True omite la protección anti-duplicado."""
    global _coupon_sample_sent
    if _coupon_sample_sent and not force:
        return
    _coupon_sample_sent = True
    # Leer siempre en tiempo de ejecución
    smtp_user   = os.environ.get('SMTP_USER', '') or SMTP_USER
    smtp_pass   = os.environ.get('SMTP_PASS', '') or SMTP_PASS
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port   = int(os.environ.get('SMTP_PORT', '587'))
    base_url    = os.environ.get('BASE_URL', BASE_URL)
    if not smtp_user or not smtp_pass:
        print("[COUPON][DEV] SMTP no configurado — correo de muestra omitido")
        return
    try:
        nombre = "Mauricio"
        days_remaining = 23
        # Correo de muestra con párrafo fijo (sin llamada a IA para garantizar entrega)
        ai_paragraph = (
            "Hola Mauricio, llevas 7 días usando MindEV y tu acceso de prueba sigue activo. "
            "Este es un ejemplo del correo semanal que recibirán tus usuarios con cupón. "
            "El texto real de cada correo es generado automáticamente por IA, personalizado "
            "con el nombre del jugador, los días de uso y un mensaje motivacional sobre su "
            "juego de poker. <em>(Párrafo de ejemplo — en el correo real este texto es generado por Claude IA)</em>"
        )
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:32px;border-radius:12px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:3rem;color:#d4af37">♠</span>
            <h1 style="color:#d4af37;margin:8px 0 4px">MindEV</h1>
            <p style="margin:0;color:#94a3b8;font-size:0.9rem">Diagnóstico Mental y Técnico para Poker</p>
          </div>
          <div style="background:#1a2235;border:1px dashed #d4af37;border-radius:8px;padding:10px 16px;margin-bottom:20px;text-align:center">
            <p style="margin:0;font-size:0.78rem;color:#d4af37;text-transform:uppercase;letter-spacing:1px">✉️ Correo de muestra — MindEV Admin</p>
          </div>
          <h2 style="margin-bottom:8px">Hola, {nombre} 👋</h2>
          <div style="background:#1a2235;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:8px;margin:20px 0">
            <p style="margin:0;font-size:1.05rem;color:#fbbf24;font-weight:700">⏳ Tienes {days_remaining} días restantes en MindEV</p>
          </div>
          <p style="line-height:1.7;color:#cbd5e1">{ai_paragraph}</p>
          <div style="text-align:center;margin:28px 0">
            <a href="{base_url}" style="display:inline-block;background:#d4af37;color:#0a0e1a;font-weight:700;font-size:1rem;padding:14px 32px;border-radius:8px;text-decoration:none">
              → Acceder a MindEV
            </a>
          </div>
          <p style="text-align:center;margin-top:24px;color:#475569;font-size:0.8rem">
            MindEV – Diagnóstico Mental y Técnico para Poker<br>
            <a href="mailto:evhapo@tiburock.cl" style="color:#64748b">evhapo@tiburock.cl</a>
          </p>
        </div>
        """
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"[MUESTRA] MindEV — correo semanal de cupón ({days_remaining} días restantes)"
        msg['From']    = smtp_user
        msg['To']      = REFERRAL_NOTIFY_EMAIL
        msg.attach(MIMEText(html, 'html'))
        print(f"[COUPON] Conectando a SMTP {smtp_server}:{smtp_port} como {smtp_user}...")
        with smtplib.SMTP(smtp_server, smtp_port, timeout=30) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, REFERRAL_NOTIFY_EMAIL, msg.as_string())
        print(f"[COUPON] Correo de muestra enviado a {REFERRAL_NOTIFY_EMAIL}")
    except Exception as e:
        _coupon_sample_sent = False  # Permitir reintento
        print(f"[COUPON] ERROR al enviar correo de muestra: {e}")


def _check_coupon_reminders():
    """Revisa qué usuarios con cupón necesitan recordatorio semanal y los envía."""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    try:
        now = datetime.datetime.utcnow()
        users = db.execute(
            "SELECT id, nombre, apellido, email, pais, coupon_activated_at, last_coupon_reminder "
            "FROM users WHERE coupon_activated_at IS NOT NULL AND coupon_activated_at != ''"
        ).fetchall()
        for user in users:
            try:
                days_remaining = _get_coupon_days_remaining(user['coupon_activated_at'])
                if (days_remaining or 0) <= 0:
                    continue  # Expirado, no más correos
                activated = datetime.datetime.fromisoformat(user['coupon_activated_at'])
                days_used = (now - activated).days
                last_reminder = user['last_coupon_reminder']
                if last_reminder:
                    last_dt = datetime.datetime.fromisoformat(last_reminder)
                    if (now - last_dt).days < 7:
                        continue  # Correo enviado hace menos de 7 días
                elif days_used < 7:
                    continue  # Primer correo: esperar al menos 7 días tras activación
                _send_coupon_reminder_email(
                    user['id'], user['nombre'], user['email'],
                    days_remaining, user['pais']
                )
                db.execute("UPDATE users SET last_coupon_reminder=? WHERE id=?",
                           (now.isoformat(), user['id']))
                db.commit()
            except Exception as e:
                print(f"[COUPON] Error processing user {user['id']}: {e}")
    finally:
        db.close()


def _coupon_email_scheduler():
    """Hilo daemon que envía recordatorios semanales a usuarios con cupón."""
    import time
    time.sleep(20)  # Esperar a que el servidor esté listo
    _send_coupon_sample_email()
    while True:
        try:
            _check_coupon_reminders()
        except Exception as e:
            print(f"[COUPON] Scheduler error: {e}")
        time.sleep(3600)  # Revisar cada hora


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
    _api_key = _get_api_key()
    if not _api_key:
        return jsonify({'error': 'Servicio no disponible. Reinicia el servidor con iniciar_servidor.bat'}), 503

    data = request.json or {}
    mental_answers       = data.get('mental_answers', [])
    technical_answers    = data.get('technical_answers', [])
    mental_scores        = data.get('mental_scores', {})
    technical_scores     = data.get('technical_scores', {})
    inconsistencies      = data.get('inconsistencies', [])
    mental_session_id    = data.get('mental_session_id')
    technical_session_id = data.get('technical_session_id')
    lang                 = data.get('lang', 'es')
    nombre = g.user_name

    prompt = _build_profile_prompt(
        nombre, mental_answers, technical_answers,
        mental_scores, technical_scores, inconsistencies,
        lang=lang
    )

    db = get_db()
    # Insertar job con status='processing'
    db.execute("DELETE FROM player_profiles WHERE user_id=? AND status='processing'", (g.user_id,))
    job_id = db.execute(
        "INSERT INTO player_profiles (user_id, mental_session_id, technical_session_id, profile_html, status, created_at) VALUES (?,?,?,?,?,?)",
        (g.user_id, mental_session_id, technical_session_id, None, 'processing',
         datetime.datetime.utcnow().isoformat())
    ).lastrowid
    db.commit()

    threading.Thread(
        target=_bg_profile_generation,
        args=(job_id, g.user_id, prompt, _api_key),
        daemon=True
    ).start()

    return jsonify({'job_id': job_id})


def _bg_profile_generation(job_id, user_id, prompt, api_key):
    """Genera el perfil IA en background y guarda el resultado en DB."""
    import requests as _requests
    db = None
    try:
        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row

        resp = _requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            json={
                'model': 'claude-sonnet-4-6',
                'max_tokens': 24000,
                'messages': [{'role': 'user', 'content': prompt}]
            },
            timeout=600,
            verify=False
        )
        resp.raise_for_status()
        profile_html = resp.json()['content'][0]['text']

        # Eliminar perfiles anteriores y guardar el nuevo
        db.execute("DELETE FROM player_profiles WHERE user_id=? AND id!=?", (user_id, job_id))
        db.execute(
            "UPDATE player_profiles SET profile_html=?, status='done', error_msg=NULL WHERE id=?",
            (profile_html, job_id)
        )
        db.commit()
        print(f"[PROFILE] Job {job_id} completado para user {user_id}")
    except Exception as e:
        print(f"[PROFILE] Error en job {job_id}: {e}")
        if db:
            try:
                db.execute(
                    "UPDATE player_profiles SET status='error', error_msg=? WHERE id=?",
                    (str(e), job_id)
                )
                db.commit()
            except Exception:
                pass
    finally:
        if db:
            db.close()


@app.route('/api/profile/status/<int:job_id>', methods=['GET'])
@require_auth
def profile_job_status(job_id):
    """Polling: retorna el estado del job de generación de perfil."""
    db = get_db()
    row = db.execute(
        "SELECT * FROM player_profiles WHERE id=? AND user_id=?",
        (job_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({'error': 'Job no encontrado'}), 404

    status = row['status'] or 'done'
    result = {'status': status}
    if status == 'done':
        result['profile'] = row['profile_html']
        result['created_at'] = row['created_at']
    elif status == 'error':
        result['error'] = row['error_msg'] or 'Error desconocido al generar el perfil.'
    return jsonify(result)


def _build_profile_prompt(nombre, mental_answers, technical_answers,
                           mental_scores, technical_scores, inconsistencies, lang='es'):

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

    if lang == 'pt':
        lang_instruction = "IMPORTANTE: Genera TODO el informe en PORTUGUÉS BRASILEÑO (PT-BR). Todos los títulos, análisis, diagnósticos, recomendaciones y textos deben estar íntegramente en portugués brasileño. No uses español en ninguna parte."
    else:
        lang_instruction = "IMPORTANTE: Genera todo el informe en ESPAÑOL."

    return f"""Eres coach de poker experto (MTT) y psicólogo deportivo. Genera un informe HTML completo para {nombre}. NO incluyas etiquetas html/head/body.
{lang_instruction}

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


def _bg_tournament_analysis(job_id, meta, prompt, api_key):
    """Ejecuta el análisis Claude en background y actualiza la BD al terminar."""
    import requests as _requests
    try:
        resp = _requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            json={
                'model': 'claude-sonnet-4-6',
                'max_tokens': 28000,
                'messages': [{'role': 'user', 'content': prompt}]
            },
            timeout=300,
            verify=False
        )
        resp.raise_for_status()
        report_html = resp.json()['content'][0]['text']

        conn = sqlite3.connect(DB_PATH)
        try:
            conn.execute(
                "UPDATE tournament_analyses SET status='done', report_html=? WHERE id=?",
                (report_html, job_id)
            )
            conn.commit()
        finally:
            conn.close()

    except Exception as e:
        import traceback
        traceback.print_exc()
        conn = sqlite3.connect(DB_PATH)
        try:
            conn.execute(
                "UPDATE tournament_analyses SET status='error', error_msg=? WHERE id=?",
                (str(e)[:500], job_id)
            )
            conn.commit()
        finally:
            conn.close()


@app.route('/api/tournament/analyze', methods=['POST'])
@require_auth
def analyze_tournament():
    _api_key = _get_api_key()
    if not _api_key:
        return jsonify({'error': 'Servicio no disponible. Reinicia el servidor con iniciar_servidor.bat'}), 503

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
            raw_profile = row['profile_html'] or ''
            player_profile = re.sub(r'<[^>]+>', ' ', raw_profile)
            player_profile = re.sub(r'\s+', ' ', player_profile).strip()[:3000]
    except Exception:
        pass

    # ── 4. Construir prompt ────────────────────────────────────────────────────
    nombre = g.user_name
    lang   = request.form.get('lang', 'es')
    prompt = _build_tournament_prompt(nombre, meta, player_profile, lang=lang)

    # ── 5. Insertar job con status='processing' y lanzar hilo background ──────
    db = get_db()
    cursor = db.execute(
        """INSERT INTO tournament_analyses
           (user_id, tournament_name, platform, buy_in, total_hands, hero_hands, date, status, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (g.user_id, meta['tournament_name'], meta['platform'], meta['buy_in'],
         meta['total_hands'], meta['hero_hands_played'], meta['date'],
         'processing', datetime.datetime.utcnow().isoformat())
    )
    job_id = cursor.lastrowid
    db.commit()

    t = threading.Thread(
        target=_bg_tournament_analysis,
        args=(job_id, meta, prompt, _api_key),
        daemon=True
    )
    t.start()

    return jsonify({
        'job_id': job_id,
        'meta': {
            'tournament_name': meta['tournament_name'],
            'buy_in':          meta['buy_in'],
            'platform':        meta['platform'],
            'total_hands':     meta['total_hands'],
            'hero_hands':      meta['hero_hands_played'],
            'date':            meta['date'],
        }
    })


@app.route('/api/tournament/status/<int:job_id>', methods=['GET'])
@require_auth
def tournament_job_status(job_id):
    """Polling endpoint: devuelve el estado del análisis background."""
    db = get_db()
    row = db.execute(
        "SELECT * FROM tournament_analyses WHERE id=? AND user_id=?",
        (job_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({'error': 'Job no encontrado'}), 404

    status = row['status'] or 'done'
    result = {'status': status}

    if status == 'done':
        result['report'] = row['report_html']
        result['meta'] = {
            'tournament_name': row['tournament_name'],
            'buy_in':          row['buy_in'],
            'platform':        row['platform'],
            'total_hands':     row['total_hands'],
            'hero_hands':      row['hero_hands'],
            'date':            row['date'],
        }
    elif status == 'error':
        result['error'] = row['error_msg'] or 'Error desconocido al generar el análisis.'

    return jsonify(result)


@app.route('/api/tournament/last', methods=['GET'])
@require_auth
def tournament_last():
    """Devuelve el análisis de torneo más reciente del usuario (con reporte completo)."""
    db = get_db()
    row = db.execute(
        """SELECT * FROM tournament_analyses
           WHERE user_id=? AND status='done'
           ORDER BY id DESC LIMIT 1""",
        (g.user_id,)
    ).fetchone()
    if not row:
        return jsonify({'analysis': None})
    return jsonify({'analysis': {
        'id':              row['id'],
        'tournament_name': row['tournament_name'],
        'platform':        row['platform'],
        'buy_in':          row['buy_in'],
        'total_hands':     row['total_hands'],
        'hero_hands':      row['hero_hands'],
        'date':            row['date'],
        'created_at':      row['created_at'],
        'report_html':     row['report_html'],
    }})


@app.route('/api/tournament/history', methods=['GET'])
@require_auth
def tournament_history():
    """Devuelve los análisis de torneo guardados del usuario."""
    db = get_db()
    rows = db.execute(
        """SELECT id, tournament_name, platform, buy_in, total_hands, hero_hands, date, created_at
           FROM tournament_analyses WHERE user_id=? ORDER BY id DESC""",
        (g.user_id,)
    ).fetchall()
    return jsonify({'analyses': [dict(r) for r in rows]})


@app.route('/api/tournament/analysis/<int:analysis_id>', methods=['GET'])
@require_auth
def get_tournament_analysis(analysis_id):
    """Devuelve el reporte completo de un análisis guardado."""
    db = get_db()
    row = db.execute(
        "SELECT * FROM tournament_analyses WHERE id=? AND user_id=?",
        (analysis_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({'error': 'Análisis no encontrado'}), 404
    return jsonify({'report': row['report_html'], 'meta': {
        'tournament_name': row['tournament_name'],
        'platform': row['platform'],
        'buy_in': row['buy_in'],
        'total_hands': row['total_hands'],
        'hero_hands': row['hero_hands'],
        'date': row['date'],
    }})


def _build_tournament_prompt(nombre, meta, player_profile, lang='es'):
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
PERFIL DEL JUGADOR SEGÚN RESPUESTAS DEL TEST MENTAL (generado por IA con tests MindEV):
{player_profile[:2500]}
"""
    else:
        profile_section = 'PERFIL DEL JUGADOR: El jugador aún no ha completado el test mental. Basa el análisis de la sección 5 en los patrones observados en las manos.'

    start_chips = f"{meta.get('starting_chips', 0):,}" if meta.get('starting_chips') else 'N/D'
    end_chips   = f"{meta.get('ending_chips',   0):,}" if meta.get('ending_chips')   else 'N/D'
    lvl_first   = meta.get('level_first', 'N/D')
    lvl_last    = meta.get('level_last',  'N/D')

    if lang == 'pt':
        lang_instruction = "IMPORTANTE: Genera TODO el reporte en PORTUGUÉS BRASILEÑO (PT-BR). Todos los títulos, análisis, secciones y textos deben estar íntegramente en portugués brasileño. No uses español en ninguna parte."
    else:
        lang_instruction = "IMPORTANTE: Genera todo el reporte en ESPAÑOL."

    return f"""Eres un coach de poker MTT de élite. Analiza el siguiente historial de manos del jugador "{nombre}" y genera un REPORTE COMPLETO en HTML (sin etiquetas html/head/body).
{lang_instruction}

TERMINOLOGÍA POKER OBLIGATORIA: Usa siempre los términos originales en inglés para acciones de poker. NUNCA los traduzcas:
- "call" → SIEMPRE "call" (NUNCA "llama", "paga", "iguala"). Úsalo como verbo: "hace call", "dio call", "hacer call".
- "raise" → SIEMPRE "raise" (NUNCA "sube", "aumenta"). Ej: "hizo raise", "hacer raise".
- "fold" → SIEMPRE "fold" (NUNCA "se retira", "tira"). Ej: "hizo fold", "hacer fold".
- "check" → SIEMPRE "check" (NUNCA "pasa"). Ej: "hizo check".
- "bet" → SIEMPRE "bet" (NUNCA "apuesta"). Ej: "hizo bet", "betting".
- "all-in", "bluff", "stack", "pot", "flop", "turn", "river", "pre-flop", "3-bet", "c-bet" → mantener en inglés siempre.

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

━━━ SECCIÓN 5: PERFIL SEGÚN RESPUESTAS DEL TEST MENTAL ━━━
~250 palabras. Título de la sección: "Perfil según respuestas del test mental".
{"Correlaciona los errores observados en las manos con las características del perfil del jugador. Con ejemplos concretos: 'En la mano X, Hero hizo Y, lo cual es consistente con su perfil de Z...'. Conecta lo que pasó en la mesa con lo que revelan sus tests MindEV." if player_profile else "Analiza los patrones de decisión observados en las manos y describe el perfil mental del jugador que se infiere de ellas (tolerancia al riesgo, manejo del tilt, disciplina, tendencias). Sugiere completar el test mental de MindEV para obtener un perfil más detallado."}

IMPORTANTE FINAL:
- Usa ejemplos REALES de las manos del historial (nivel, cartas, acciones reales).
- Sé directo, técnico y motivador.
- Completa ABSOLUTAMENTE TODAS las secciones (1 a 5) hasta el final sin cortar ninguna.
- No uses la frase "perfil psicológico no disponible" ni ninguna variante negativa de "no disponible".
"""


# Inicializar BD al importar el módulo (gunicorn no ejecuta __main__)
init_db()

# Iniciar scheduler de recordatorios de cupones
threading.Thread(target=_coupon_email_scheduler, daemon=True).start()

# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 60)
    print("  MindEV - Diagnóstico Mental del Jugador de Poker")
    print(f"  Servidor corriendo en: http://localhost:{port}")
    print("=" * 60)
    app.run(debug=False, host='0.0.0.0', port=port)
