import os
import sqlite3
import hashlib
import hmac
from werkzeug.security import generate_password_hash, check_password_hash
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

# ─── Sentry — monitoreo de errores (carga opcional) ──────────────────────────
_SENTRY_DSN = os.environ.get('SENTRY_DSN', '')
if _SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.flask import FlaskIntegration
        sentry_sdk.init(
            dsn=_SENTRY_DSN,
            integrations=[FlaskIntegration()],
            traces_sample_rate=0.2,
            send_default_pii=False,
            environment=os.environ.get('RAILWAY_ENVIRONMENT', 'production'),
        )
        print('[Sentry] Monitoreo de errores activo')
    except ImportError:
        print('[Sentry] sentry-sdk no instalado — monitoreo desactivado')

# Config
SECRET_KEY = os.environ.get('SECRET_KEY', 'evhapo-secret-key-2024-change-in-production')
# En Railway se monta un volumen en /data; localmente usa el directorio del script
_DATA_DIR = os.environ.get('DATA_DIR', os.path.dirname(__file__))
os.makedirs(_DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(_DATA_DIR, 'evhapo.db')
TEST_PRICE_USD = 9.90
SUB_PRICE_USD  = 4.90   # precio mensual suscripción

MERCADOPAGO_ACCESS_TOKEN  = os.environ.get('MERCADOPAGO_ACCESS_TOKEN', '')
MERCADOPAGO_PUBLIC_KEY    = os.environ.get('MERCADOPAGO_PUBLIC_KEY', '')
MERCADOPAGO_WEBHOOK_SECRET = os.environ.get('MERCADOPAGO_WEBHOOK_SECRET', '')
STRIPE_SECRET_KEY        = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET    = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
STRIPE_SUB_PRICE_ID      = os.environ.get('STRIPE_SUB_PRICE_ID', '')   # opcional: ID de precio ya creado
PADDLE_API_KEY           = os.environ.get('PADDLE_API_KEY', '')
PADDLE_PRICE_ONE_TIME    = os.environ.get('PADDLE_PRICE_ONE_TIME', '')
PADDLE_PRICE_SUBSCRIPTION= os.environ.get('PADDLE_PRICE_SUBSCRIPTION', '')
PADDLE_WEBHOOK_SECRET     = os.environ.get('PADDLE_WEBHOOK_SECRET', '')
PADDLE_WEBHOOK_SECRET_SIM = os.environ.get('PADDLE_WEBHOOK_SECRET_SIM', '')
PADDLE_CLIENT_TOKEN       = os.environ.get('PADDLE_CLIENT_TOKEN', '')
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

        CREATE TABLE IF NOT EXISTS study_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            plan_html TEXT,
            mental_overall REAL,
            technical_overall REAL,
            status TEXT DEFAULT 'pending',
            error_msg TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS poker_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            date TEXT NOT NULL,
            format TEXT NOT NULL,
            stakes TEXT NOT NULL,
            hours REAL NOT NULL DEFAULT 0,
            profit_loss REAL NOT NULL DEFAULT 0,
            mental_state INTEGER NOT NULL DEFAULT 5,
            notes TEXT DEFAULT '',
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
        "ALTER TABLE users ADD COLUMN coupon_expiry_warned INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN coupon_welcome_sent INTEGER DEFAULT 0",
        "ALTER TABLE player_profiles ADD COLUMN status TEXT DEFAULT 'done'",
        "ALTER TABLE player_profiles ADD COLUMN error_msg TEXT",
        # Suscripción mensual
        "ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN subscription_period_end TEXT DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN mp_subscription_id TEXT DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN paddle_subscription_id TEXT DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN idioma TEXT DEFAULT 'es'",
        # Sistema de referidos con comisiones
        "ALTER TABLE referral_codes ADD COLUMN owner_email TEXT DEFAULT ''",
        "ALTER TABLE referral_codes ADD COLUMN owner_name TEXT DEFAULT ''",
        "ALTER TABLE referral_codes ADD COLUMN commission_usd REAL DEFAULT 0",
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
    """Genera hash seguro con werkzeug (PBKDF2-SHA256 + salt)."""
    return generate_password_hash(password)

def verify_password(password, stored_hash):
    """Verifica contraseña. Soporta hashes werkzeug (nuevos) y SHA-256 legado."""
    if stored_hash.startswith('pbkdf2:') or stored_hash.startswith('scrypt:'):
        return check_password_hash(stored_hash, password)
    # Legado: SHA-256 sin sal — sólo para migración transparente
    return stored_hash == hashlib.sha256(password.encode()).hexdigest()

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

@app.route('/terms')
def terms_page():
    return send_from_directory('../frontend', 'terms.html')

@app.route('/privacy')
def privacy_page():
    return send_from_directory('../frontend', 'privacy.html')

@app.route('/refund')
def refund_page():
    return send_from_directory('../frontend', 'refund.html')

@app.route('/blog/')
@app.route('/blog')
def blog_index():
    return send_from_directory('../frontend/blog', 'index.html')

@app.route('/blog/<slug>')
def blog_article(slug):
    return send_from_directory('../frontend/blog', slug)

@app.route('/sitemap.xml')
def sitemap_xml():
    return send_from_directory('../frontend', 'sitemap.xml', mimetype='application/xml')

@app.route('/robots.txt')
def robots_txt():
    return send_from_directory('../frontend', 'robots.txt', mimetype='text/plain')

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
    idioma = (data.get('idioma') or 'es').strip().lower()
    if idioma not in ('es', 'pt', 'en'):
        idioma = 'es'
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
        "INSERT INTO users (nombre, apellido, email, password_hash, pais, sala_preferida, referral_code, idioma) VALUES (?,?,?,?,?,?,?,?)",
        (nombre, apellido, email, hash_password(password), pais, sala_preferida, referral_code, idioma)
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

    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Email o contraseña incorrectos'}), 401

    # Migración automática: si el hash es SHA-256 legado, actualizarlo a werkzeug
    stored = user['password_hash']
    if not (stored.startswith('pbkdf2:') or stored.startswith('scrypt:')):
        db.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(password), user['id']))
        db.commit()

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


def _get_subscription_active(user):
    """Retorna True si el usuario tiene suscripción mensual activa y vigente."""
    if not user:
        return False
    status = user['subscription_status'] if 'subscription_status' in user.keys() else None
    if status != 'active':
        return False
    period_end = user['subscription_period_end'] if 'subscription_period_end' in user.keys() else None
    if not period_end:
        return False
    try:
        end_dt = datetime.datetime.fromisoformat(period_end)
        return end_dt > datetime.datetime.utcnow()
    except Exception:
        return False


def _get_stripe_sub_price_id():
    """Obtiene o crea el Price ID de suscripción mensual en Stripe."""
    # 1. Variable de entorno hardcodeada (más rápido)
    if STRIPE_SUB_PRICE_ID:
        return STRIPE_SUB_PRICE_ID
    env_id = os.environ.get('STRIPE_SUB_PRICE_ID', '')
    if env_id:
        return env_id
    # 2. Crear producto + precio programáticamente
    import stripe
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY') or STRIPE_SECRET_KEY
    try:
        products = stripe.Product.search(query="metadata['mindev_type']:'subscription'")
        for p in products.data:
            prices = stripe.Price.list(product=p.id, active=True)
            if prices.data:
                return prices.data[0].id
    except Exception:
        pass
    # Crear
    product = stripe.Product.create(
        name='MindEV-IA — Suscripción Mensual',
        description='Acceso mensual: diagnósticos ilimitados, análisis IA, tracker y bankroll.',
        metadata={'mindev_type': 'subscription'}
    )
    price = stripe.Price.create(
        product=product.id,
        unit_amount=490,   # USD $4.90
        currency='usd',
        recurring={'interval': 'month'},
    )
    return price.id


@app.route('/api/me', methods=['GET'])
@require_auth
def me():
    db = get_db()
    user = db.execute(
        """SELECT id, nombre, apellido, email, pais, created_at, coupon_code, coupon_activated_at,
                  subscription_status, subscription_period_end, stripe_subscription_id, paddle_subscription_id
           FROM users WHERE id=?""",
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

    sub_active = _get_subscription_active(user)
    has_access = bool(payment) or (coupon_info is not None and coupon_info['active']) or sub_active

    sub_info = None
    if user['subscription_status']:
        sub_info = {
            'status': user['subscription_status'],
            'period_end': user['subscription_period_end'],
            'active': sub_active,
            'stripe_subscription_id': user['stripe_subscription_id'],
            'paddle_subscription_id': user['paddle_subscription_id'],
        }

    return jsonify({
        'user': dict(user),
        'sessions': [dict(s) for s in sessions],
        'has_payment': has_access,
        'coupon': coupon_info,
        'subscription': sub_info,
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
    elif method == 'paddle':
        paddle_key  = os.environ.get('PADDLE_API_KEY') or PADDLE_API_KEY
        price_id    = os.environ.get('PADDLE_PRICE_ONE_TIME') or PADDLE_PRICE_ONE_TIME
        if not paddle_key or not price_id:
            return jsonify({'error': 'Paddle no configurado'}), 400
        try:
            user_row = db.execute("SELECT email FROM users WHERE id=?", (g.user_id,)).fetchone()
            success_url = f"{BASE_URL}/?paddle_result=success&pid={payment_id}"
            checkout_url, txn_id = _create_paddle_checkout(
                price_id, user_row['email'], success_url,
                custom_data={"user_id": str(g.user_id), "payment_id": str(payment_id)}
            )
            db.execute("UPDATE payments SET external_id=? WHERE id=?", (txn_id, payment_id))
            db.commit()
            return jsonify({'mode': 'paddle', 'checkout_url': checkout_url, 'payment_id': payment_id})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
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

def _create_paddle_checkout(price_id, user_email, success_url, custom_data=None):
    """Crea un checkout en Paddle y retorna (checkout_url, transaction_id)."""
    import requests as _req
    api_key = os.environ.get('PADDLE_API_KEY') or PADDLE_API_KEY
    payload = {
        "items": [{"price_id": price_id, "quantity": 1}],
        "checkout": {"url": success_url},
        "customer": {"email": user_email},
    }
    if custom_data:
        payload["custom_data"] = custom_data
    resp = _req.post(
        "https://api.paddle.com/transactions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=15
    )
    resp.raise_for_status()
    data = resp.json()
    return data['data']['checkout']['url'], data['data']['id']

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
                        'name': 'MindEV-IA – Acceso completo',
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
    # Solo administradores pueden confirmar pagos manualmente
    if not g.is_admin:
        return jsonify({'error': 'No autorizado'}), 403
    data = request.json or {}
    payment_id = data.get('payment_id')
    db = get_db()
    pay = db.execute(
        "SELECT * FROM payments WHERE id=?", (payment_id,)
    ).fetchone()
    if not pay:
        return jsonify({'error': 'Pago no encontrado'}), 404
    db.execute("UPDATE payments SET status='approved' WHERE id=?", (payment_id,))
    db.commit()
    threading.Thread(target=_send_referral_notification, args=(pay['user_id'],), daemon=True).start()
    return jsonify({'ok': True})

# ─── Subscription routes ─────────────────────────────────────────────────────

@app.route('/api/payment/create-subscription', methods=['POST'])
@require_auth
def create_subscription():
    data   = request.json or {}
    method = data.get('method', 'stripe')
    db     = get_db()
    user   = db.execute("SELECT * FROM users WHERE id=?", (g.user_id,)).fetchone()

    if method == 'stripe':
        sk = os.environ.get('STRIPE_SECRET_KEY') or STRIPE_SECRET_KEY
        if not sk:
            return jsonify({'error': 'Stripe no configurado'}), 400
        try:
            import stripe
            stripe.api_key = sk
            price_id = _get_stripe_sub_price_id()
            session  = stripe.checkout.Session.create(
                customer_email = user['email'],
                line_items     = [{'price': price_id, 'quantity': 1}],
                mode           = 'subscription',
                success_url    = f"{BASE_URL}/?stripe_result=sub_success&session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url     = f"{BASE_URL}/?stripe_result=cancel",
                metadata       = {'user_id': str(g.user_id)},
                subscription_data = {'metadata': {'user_id': str(g.user_id)}},
            )
            return jsonify({'mode': 'stripe', 'checkout_url': session.url})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    elif method == 'mercadopago':
        mp_token = MERCADOPAGO_ACCESS_TOKEN or os.environ.get('MERCADOPAGO_ACCESS_TOKEN', '')
        if not mp_token:
            return jsonify({'error': 'MercadoPago no configurado'}), 400
        try:
            import mercadopago
            sdk  = mercadopago.SDK(mp_token)
            pais = (user['pais'] or 'CL').upper()
            # Precio mensual en moneda local (~$4.90 USD)
            sub_price_map = {
                'CL': (4750, 'CLP'), 'AR': (4500, 'ARS'), 'MX': (85, 'MXN'),
                'CO': (20000, 'COP'), 'PE': (18.50, 'PEN'), 'UY': (195, 'UYU'), 'BR': (25, 'BRL'),
            }
            amount, currency = sub_price_map.get(pais, (4.90, 'USD'))
            preapproval_data = {
                "back_url": f"{BASE_URL}/?mp_result=sub_success",
                "reason": "MindEV-IA — Suscripción Mensual",
                "external_reference": str(g.user_id),
                "payer_email": user['email'],
                "auto_recurring": {
                    "frequency": 1,
                    "frequency_type": "months",
                    "transaction_amount": float(amount),
                    "currency_id": currency,
                },
            }
            result = sdk.preapproval().create(preapproval_data)
            if result['status'] == 201:
                preapproval = result['response']
                # Guardar ID provisional
                db.execute("UPDATE users SET mp_subscription_id=? WHERE id=?",
                           (preapproval['id'], g.user_id))
                db.commit()
                return jsonify({'mode': 'mercadopago', 'checkout_url': preapproval['init_point']})
            return jsonify({'error': f"MP error: {result.get('response')}"}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    elif method == 'paddle':
        paddle_key = os.environ.get('PADDLE_API_KEY') or PADDLE_API_KEY
        price_id   = os.environ.get('PADDLE_PRICE_SUBSCRIPTION') or PADDLE_PRICE_SUBSCRIPTION
        if not paddle_key or not price_id:
            return jsonify({'error': 'Paddle no configurado'}), 400
        try:
            success_url = f"{BASE_URL}/?paddle_result=sub_success"
            checkout_url, txn_id = _create_paddle_checkout(
                price_id, user['email'], success_url,
                custom_data={"user_id": str(g.user_id)}
            )
            return jsonify({'mode': 'paddle', 'checkout_url': checkout_url})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Método no soportado'}), 400


@app.route('/api/payment/paddle-verify', methods=['POST'])
@require_auth
def paddle_verify():
    """Verifica un pago único de Paddle y activa el acceso."""
    data           = request.json or {}
    payment_id     = data.get('payment_id')
    transaction_id = data.get('transaction_id')
    if not payment_id:
        return jsonify({'ok': False, 'error': 'Missing payment_id'}), 400
    import requests as _req
    api_key = os.environ.get('PADDLE_API_KEY') or PADDLE_API_KEY
    db = get_db()
    try:
        payment = db.execute(
            "SELECT * FROM payments WHERE id=? AND user_id=?", (payment_id, g.user_id)
        ).fetchone()
        if not payment:
            return jsonify({'ok': False, 'error': 'Payment not found'}), 404
        if payment['status'] == 'approved':
            return jsonify({'ok': True})
        verified = False
        if transaction_id:
            resp = _req.get(
                f"https://api.paddle.com/transactions/{transaction_id}",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=15
            )
            if resp.ok and resp.json().get('data', {}).get('status') == 'completed':
                verified = True
        if verified:
            db.execute("UPDATE payments SET status='approved', external_id=? WHERE id=?",
                       (transaction_id, payment_id))
            db.commit()
            return jsonify({'ok': True})
        return jsonify({'ok': False, 'error': 'Payment not completed yet'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/api/payment/paddle-subscription-verify', methods=['POST'])
@require_auth
def paddle_subscription_verify():
    """Verifica suscripción Paddle al retornar del checkout."""
    data           = request.json or {}
    transaction_id = data.get('transaction_id')
    import requests as _req
    api_key = os.environ.get('PADDLE_API_KEY') or PADDLE_API_KEY
    db = get_db()
    try:
        if transaction_id:
            resp = _req.get(
                f"https://api.paddle.com/transactions/{transaction_id}",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=15
            )
            if resp.ok:
                txn = resp.json().get('data', {})
                if txn.get('status') == 'completed':
                    sub_id     = txn.get('subscription_id')
                    period_end = (datetime.datetime.utcnow() + datetime.timedelta(days=31)).isoformat()
                    db.execute(
                        """UPDATE users SET subscription_status='active',
                           subscription_period_end=?, paddle_subscription_id=? WHERE id=?""",
                        (period_end, sub_id, g.user_id)
                    )
                    db.commit()
                    return jsonify({'ok': True})
        return jsonify({'ok': False, 'error': 'No se pudo verificar la suscripción'})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/api/webhooks/paddle', methods=['POST'])
def paddle_webhook():
    """Webhook de Paddle para eventos de pago y suscripción."""
    secrets_to_try = [
        os.environ.get('PADDLE_WEBHOOK_SECRET')     or PADDLE_WEBHOOK_SECRET,
        os.environ.get('PADDLE_WEBHOOK_SECRET_SIM') or PADDLE_WEBHOOK_SECRET_SIM,
    ]
    secrets_to_try = [s for s in secrets_to_try if s]
    if secrets_to_try:
        sig_header = request.headers.get('paddle-signature', '')
        try:
            parts   = dict(p.split('=', 1) for p in sig_header.split(';') if '=' in p)
            ts      = parts.get('ts', '')
            h1      = parts.get('h1', '')
            payload = f"{ts}:{request.data.decode('utf-8')}"
            valid   = any(
                hmac.compare_digest(
                    hmac.new(s.encode(), payload.encode(), hashlib.sha256).hexdigest(), h1
                ) for s in secrets_to_try
            )
            if not valid:
                return jsonify({'error': 'Invalid signature'}), 401
        except Exception as ex:
            print(f"[PADDLE WH] Signature error: {ex}")
            return jsonify({'error': 'Signature error'}), 400

    data       = request.json or {}
    event_type = data.get('event_type', '')
    event_data = data.get('data', {})
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    try:
        if event_type == 'transaction.completed':
            custom = event_data.get('custom_data') or {}
            uid    = custom.get('user_id')
            pid    = custom.get('payment_id')
            txn_id = event_data.get('id')
            if pid and uid:
                db.execute("UPDATE payments SET status='approved', external_id=? WHERE id=?", (txn_id, pid))
                db.commit()
            sub_id = event_data.get('subscription_id')
            if sub_id and uid:
                items      = event_data.get('items', [{}])
                bp         = (items[0].get('billing_period') or {}) if items else {}
                period_end = bp.get('ends_at') or (datetime.datetime.utcnow() + datetime.timedelta(days=31)).isoformat()
                db.execute(
                    """UPDATE users SET subscription_status='active',
                       subscription_period_end=?, paddle_subscription_id=? WHERE id=?""",
                    (period_end, sub_id, uid)
                )
                db.commit()

        elif event_type in ('subscription.activated', 'subscription.updated'):
            sub_id  = event_data.get('id')
            status  = event_data.get('status', '')
            cb      = event_data.get('current_billing_period') or {}
            period_end = cb.get('ends_at') or (datetime.datetime.utcnow() + datetime.timedelta(days=31)).isoformat()
            custom  = event_data.get('custom_data') or {}
            uid     = custom.get('user_id')
            db_status = 'active' if status in ('active', 'trialing') else 'cancelled'
            if uid:
                db.execute(
                    """UPDATE users SET subscription_status=?, subscription_period_end=?,
                       paddle_subscription_id=? WHERE id=?""",
                    (db_status, period_end, sub_id, uid)
                )
            else:
                db.execute(
                    """UPDATE users SET subscription_status=?, subscription_period_end=?
                       WHERE paddle_subscription_id=?""",
                    (db_status, period_end, sub_id)
                )
            db.commit()

        elif event_type == 'subscription.canceled':
            sub_id = event_data.get('id')
            db.execute("UPDATE users SET subscription_status='cancelled' WHERE paddle_subscription_id=?", (sub_id,))
            db.commit()

        elif event_type == 'subscription.past_due':
            sub_id = event_data.get('id')
            db.execute("UPDATE users SET subscription_status='past_due' WHERE paddle_subscription_id=?", (sub_id,))
            db.commit()

    except Exception as ex:
        print(f"[PADDLE WH] Error procesando evento {event_type}: {ex}")
    finally:
        db.close()
    return jsonify({'ok': True})


@app.route('/api/payment/stripe-subscription-verify', methods=['POST'])
@require_auth
def stripe_subscription_verify():
    data       = request.json or {}
    session_id = data.get('session_id', '')
    if not session_id:
        return jsonify({'ok': False, 'error': 'Missing session_id'}), 400
    try:
        import stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY') or STRIPE_SECRET_KEY
        cs  = stripe.checkout.Session.retrieve(session_id, expand=['subscription'])
        if cs.status != 'complete':
            return jsonify({'ok': False, 'status': cs.status})
        sub        = cs.subscription
        period_end = datetime.datetime.utcfromtimestamp(sub.current_period_end).isoformat()
        db = get_db()
        db.execute("""UPDATE users SET subscription_status='active', subscription_period_end=?,
                        stripe_subscription_id=?, stripe_customer_id=? WHERE id=?""",
                   (period_end, sub.id, cs.customer, g.user_id))
        db.commit()
        return jsonify({'ok': True, 'period_end': period_end})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/api/payment/mp-subscription-verify', methods=['POST'])
@require_auth
def mp_subscription_verify():
    data   = request.json or {}
    sub_id = data.get('sub_id')
    if not sub_id:
        return jsonify({'ok': False, 'error': 'Missing sub_id'}), 400
    try:
        import mercadopago
        sdk    = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN or os.environ.get('MERCADOPAGO_ACCESS_TOKEN', ''))
        result = sdk.preapproval().get(sub_id)
        if result['status'] != 200:
            return jsonify({'ok': False, 'error': 'No se pudo verificar'})
        preapproval = result['response']
        status      = preapproval.get('status')
        if status == 'authorized':
            period_end = (datetime.datetime.utcnow() + datetime.timedelta(days=31)).isoformat()
            db = get_db()
            db.execute("""UPDATE users SET subscription_status='active', subscription_period_end=?,
                            mp_subscription_id=? WHERE id=?""",
                       (period_end, sub_id, g.user_id))
            db.commit()
            return jsonify({'ok': True, 'period_end': period_end})
        return jsonify({'ok': False, 'status': status})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/api/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    """Webhook de Stripe para renovación y cancelación de suscripciones."""
    payload = request.get_data()
    sig     = request.headers.get('Stripe-Signature', '')
    secret  = os.environ.get('STRIPE_WEBHOOK_SECRET') or STRIPE_WEBHOOK_SECRET
    try:
        import stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY') or STRIPE_SECRET_KEY
        if secret:
            event = stripe.Webhook.construct_event(payload, sig, secret)
        else:
            event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    db = get_db()
    etype = event.type
    obj   = event.data.object

    if etype == 'invoice.payment_succeeded':
        sub_id = obj.get('subscription')
        if sub_id:
            sub_obj    = stripe.Subscription.retrieve(sub_id)
            period_end = datetime.datetime.utcfromtimestamp(sub_obj.current_period_end).isoformat()
            customer   = obj.get('customer')
            db.execute("""UPDATE users SET subscription_status='active', subscription_period_end=?
                          WHERE stripe_customer_id=?""", (period_end, customer))
            db.commit()

    elif etype in ('customer.subscription.deleted',):
        customer = obj.get('customer')
        db.execute("UPDATE users SET subscription_status='cancelled' WHERE stripe_customer_id=?", (customer,))
        db.commit()

    elif etype == 'customer.subscription.updated':
        period_end = datetime.datetime.utcfromtimestamp(obj.current_period_end).isoformat()
        status     = 'active' if obj.status == 'active' else 'cancelled'
        db.execute("""UPDATE users SET subscription_status=?, subscription_period_end=?
                      WHERE stripe_customer_id=?""", (status, period_end, obj.customer))
        db.commit()

    return jsonify({'received': True})


@app.route('/api/payment/subscription', methods=['GET'])
@require_auth
def get_subscription_status():
    db   = get_db()
    user = db.execute(
        "SELECT subscription_status, subscription_period_end, stripe_subscription_id, mp_subscription_id FROM users WHERE id=?",
        (g.user_id,)
    ).fetchone()
    active = _get_subscription_active(user)
    return jsonify({
        'status':   user['subscription_status'],
        'period_end': user['subscription_period_end'],
        'active':   active,
        'stripe_subscription_id': user['stripe_subscription_id'],
        'mp_subscription_id': user['mp_subscription_id'],
    })


@app.route('/api/payment/cancel-subscription', methods=['POST'])
@require_auth
def cancel_subscription():
    db   = get_db()
    user = db.execute(
        "SELECT stripe_subscription_id, mp_subscription_id, paddle_subscription_id FROM users WHERE id=?",
        (g.user_id,)
    ).fetchone()
    # Cancelar en Stripe
    sub_id = user['stripe_subscription_id']
    if sub_id:
        try:
            import stripe
            stripe.api_key = os.environ.get('STRIPE_SECRET_KEY') or STRIPE_SECRET_KEY
            stripe.Subscription.cancel(sub_id)
        except Exception as e:
            print(f"[STRIPE] Error cancelando suscripción: {e}")
    # Cancelar en MercadoPago
    mp_sub_id = user['mp_subscription_id']
    if mp_sub_id:
        try:
            import mercadopago
            sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN or os.environ.get('MERCADOPAGO_ACCESS_TOKEN', ''))
            sdk.preapproval().update(mp_sub_id, {"status": "cancelled"})
        except Exception as e:
            print(f"[MP] Error cancelando suscripción: {e}")
    # Cancelar en Paddle
    paddle_sub_id = user['paddle_subscription_id']
    if paddle_sub_id:
        try:
            import requests as _req
            api_key = os.environ.get('PADDLE_API_KEY') or PADDLE_API_KEY
            _req.post(
                f"https://api.paddle.com/subscriptions/{paddle_sub_id}/cancel",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"effective_from": "next_billing_period"},
                timeout=15
            )
        except Exception as e:
            print(f"[PADDLE] Error cancelando suscripción: {e}")

    db.execute("UPDATE users SET subscription_status='cancelled' WHERE id=?", (g.user_id,))
    db.commit()
    return jsonify({'ok': True, 'message': 'Suscripción cancelada. El acceso continúa hasta el fin del período actual.'})


# ─── Test sessions ────────────────────────────────────────────────────────────

@app.route('/api/test/new-session', methods=['POST'])
@require_auth
def new_test_session():
    """Crea una sesión de test. Requiere al menos un pago aprobado."""
    data = request.json or {}
    test_type = data.get('test_type', 'mental')
    db = get_db()

    # Verificar acceso: pago aprobado, cupón activo, suscripción activa o es admin
    user = db.execute("SELECT is_admin, coupon_activated_at, subscription_status, subscription_period_end FROM users WHERE id=?", (g.user_id,)).fetchone()
    payment = db.execute(
        "SELECT id FROM payments WHERE user_id=? AND status='approved' ORDER BY id DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()

    coupon_access = (_get_coupon_days_remaining(user['coupon_activated_at'] if user else None) or 0) > 0
    sub_access    = _get_subscription_active(user)

    if not payment and not coupon_access and not sub_access and not (user and user['is_admin']):
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
    # ── Verificación de firma HMAC (MercadoPago x-signature) ──────────────────
    if MERCADOPAGO_WEBHOOK_SECRET:
        sig_header = request.headers.get('x-signature', '')
        req_id     = request.headers.get('x-request-id', '')
        ts = v1 = ''
        for part in sig_header.split(','):
            k, _, v = part.partition('=')
            if k == 'ts':  ts = v
            if k == 'v1':  v1 = v
        if not (ts and v1):
            return jsonify({'error': 'Firma inválida'}), 401
        # El payload firmado incluye el id del evento, el request-id y el timestamp
        raw_data = request.get_json(silent=True) or {}
        data_id  = str(raw_data.get('data', {}).get('id', ''))
        signed_template = f'id:{data_id};request-id:{req_id};ts:{ts}'
        expected = hmac.new(
            MERCADOPAGO_WEBHOOK_SECRET.encode(),
            signed_template.encode(),
            'sha256'
        ).hexdigest()
        if not hmac.compare_digest(expected, v1):
            return jsonify({'error': 'Firma inválida'}), 401
    # ──────────────────────────────────────────────────────────────────────────
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

# ─── Email post-test ─────────────────────────────────────────────────────────

_CAT_NAMES = {
    'es': {
        'tolerancia': 'Tolerancia', 'habitos': 'Hábitos',
        'concentracion': 'Concentración', 'expectativas': 'Expectativas',
        'disciplina': 'Disciplina', 'paciencia': 'Paciencia',
        'resiliencia': 'Resiliencia', 'constancia': 'Constancia',
        'perseverancia': 'Perseveranza', 'autocontrol': 'Autocontrol',
        'gestion_tilt': 'Gestión del Tilt', 'mentalidad_crecimiento': 'Mentalidad de Crecimiento',
        'rangos_preflop': 'Rangos Pre-Flop', 'juego_ip': 'Juego en Posición',
        'juego_oop': 'Juego Fuera de Posición', 'textura_flop': 'Textura del Flop',
        'lineas_turn': 'Turn: Líneas', 'river_value': 'River: Value Bet',
    },
    'pt': {
        'tolerancia': 'Tolerância', 'habitos': 'Hábitos',
        'concentracion': 'Concentração', 'expectativas': 'Expectativas',
        'disciplina': 'Disciplina', 'paciencia': 'Paciência',
        'resiliencia': 'Resiliência', 'constancia': 'Constância',
        'perseverancia': 'Perseverança', 'autocontrol': 'Autocontrole',
        'gestion_tilt': 'Gestão do Tilt', 'mentalidad_crecimiento': 'Mentalidade de Crescimento',
        'rangos_preflop': 'Ranges Pré-Flop', 'juego_ip': 'Jogo em Posição',
        'juego_oop': 'Jogo Fora de Posição', 'textura_flop': 'Textura do Flop',
        'lineas_turn': 'Turn: Linhas', 'river_value': 'River: Value Bet',
    },
}


def _level_label_py(overall, test_type='mental', lang='es'):
    if test_type == 'technical':
        if overall >= 85: return ('PROFESIONAL ♠', 'PROFISSIONAL ♠')[lang == 'pt']
        if overall >= 70: return ('AVANZADO',       'AVANÇADO')[lang == 'pt']
        if overall >= 50: return ('INTERMEDIO',      'INTERMEDIÁRIO')[lang == 'pt']
        if overall >= 30: return ('BAJO',            'BAIXO')[lang == 'pt']
        return ('PRINCIPIANTE', 'INICIANTE')[lang == 'pt']
    else:
        if overall >= 90: return ('Élite ♠',         'Elite ♠')[lang == 'pt']
        if overall >= 75: return ('Avanzado',         'Avançado')[lang == 'pt']
        if overall >= 60: return ('En Desarrollo',    'Em Desenvolvimento')[lang == 'pt']
        if overall >= 45: return ('Intermedio',       'Intermediário')[lang == 'pt']
        return ('Principiante', 'Iniciante')[lang == 'pt']


def _generate_posttest_email_html(nombre, test_type, overall, scores, lang='es'):
    """HTML del correo que se envía al usuario al completar un test."""
    import requests as _req2
    base_url = os.environ.get('BASE_URL', BASE_URL)
    logo_url = f"{base_url}/icons/mindev-logo.png"
    names    = _CAT_NAMES.get(lang, _CAT_NAMES['es'])
    sub_text = 'Diagnóstico Mental y Técnico para Poker' if lang == 'es' else 'Diagnóstico Mental e Técnico para Poker'

    level = _level_label_py(overall, test_type, lang)
    is_tech = test_type == 'technical'
    accent = '#4DB6AC' if is_tech else '#d4af37'
    type_label = ('Técnico ⚙️' if is_tech else 'Mental 🧠') if lang == 'es' else ('Técnico ⚙️' if is_tech else 'Mental 🧠')

    # Top 3 fortalezas y brechas
    sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top3    = [(names.get(k, k), v) for k, v in sorted_cats[:3]]
    bottom3 = [(names.get(k, k), v) for k, v in sorted_cats[-3:]]

    # Párrafo IA corto
    ai_text = ''
    api_key = _get_api_key()
    if api_key:
        try:
            lang_word = 'Spanish' if lang == 'es' else 'Brazilian Portuguese'
            prompt = (
                f"You are MindEV, a poker improvement platform. Write ONE short sentence (max 20 words) in {lang_word} "
                f"congratulating {nombre} for completing their {test_type} diagnostic with a score of {overall}%. "
                f"Be specific and encouraging. Write ONLY the sentence, nothing else."
            )
            resp = _req2.post(
                'https://api.anthropic.com/v1/messages',
                headers={'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
                json={'model': 'claude-haiku-4-5', 'max_tokens': 80, 'messages': [{'role': 'user', 'content': prompt}]},
                timeout=20
            )
            if resp.status_code == 200:
                ai_text = resp.json()['content'][0]['text'].strip()
        except Exception:
            pass

    if not ai_text:
        ai_text = (f'¡Buen trabajo completando tu diagnóstico, {nombre}!' if lang == 'es'
                   else f'Bom trabalho ao completar seu diagnóstico, {nombre}!')

    # Score color
    sc_color = '#4ade80' if overall >= 75 else '#fbbf24' if overall >= 50 else '#f87171'

    def cat_row(name, pct):
        bar_color = '#4ade80' if pct >= 75 else '#fbbf24' if pct >= 50 else '#f87171'
        return (f'<tr><td style="padding:5px 10px;font-size:0.85rem;color:#94a3b8">{name}</td>'
                f'<td style="padding:5px 10px;text-align:right;font-weight:700;color:{bar_color};font-size:0.85rem">{pct}%</td></tr>')

    strengths_rows = ''.join(cat_row(n, round(v, 0)) for n, v in top3)
    gaps_rows      = ''.join(cat_row(n, round(v, 0)) for n, v in bottom3)

    strengths_label = '💪 Tus fortalezas'   if lang == 'es' else '💪 Seus pontos fortes'
    gaps_label      = '🎯 Áreas a trabajar' if lang == 'es' else '🎯 Áreas a trabalhar'
    cta_label       = 'Ver mi informe completo'  if lang == 'es' else 'Ver meu relatório completo'
    footer_note     = 'Diagnóstico Mental y Técnico para Poker' if lang == 'es' else 'Diagnóstico Mental e Técnico para Poker'

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:36px 32px;border-radius:14px">

      <div style="text-align:center;margin-bottom:24px">
        <img src="{logo_url}" alt="MindEV" style="height:48px;max-width:180px;object-fit:contain">
        <p style="margin:8px 0 0;color:#64748b;font-size:0.78rem;letter-spacing:0.05em;text-transform:uppercase">{sub_text}</p>
      </div>

      <h2 style="margin:0 0 8px;font-size:1.2rem;color:#f1f5f9">{nombre}, completaste tu diagnóstico {'Test ' if lang == 'es' else 'Teste '}{type_label}</h2>
      <p style="color:#94a3b8;margin:0 0 20px;font-size:0.9rem;font-style:italic">{ai_text}</p>

      <!-- Score grande -->
      <div style="background:#1e2d45;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <div style="font-size:3rem;font-weight:800;color:{sc_color}">{overall}%</div>
        <div style="font-size:1rem;color:{accent};font-weight:700;margin-top:4px">{level}</div>
      </div>

      <!-- Fortalezas y brechas -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
        <div>
          <div style="font-size:0.8rem;font-weight:700;color:#4ade80;margin-bottom:8px;text-transform:uppercase">{strengths_label}</div>
          <table style="width:100%;border-collapse:collapse">
            <tbody>{strengths_rows}</tbody>
          </table>
        </div>
        <div>
          <div style="font-size:0.8rem;font-weight:700;color:#f87171;margin-bottom:8px;text-transform:uppercase">{gaps_label}</div>
          <table style="width:100%;border-collapse:collapse">
            <tbody>{gaps_rows}</tbody>
          </table>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:28px">
        <a href="{base_url}"
           style="display:inline-block;background:{accent};color:#0a0e1a;font-weight:800;font-size:1rem;padding:14px 36px;border-radius:8px;text-decoration:none">
          &#9654; {cta_label}
        </a>
      </div>

      <div style="border-top:1px solid #1e293b;padding-top:16px;text-align:center">
        <img src="{logo_url}" alt="MindEV" style="height:22px;opacity:0.45;margin-bottom:6px">
        <p style="margin:0;color:#334155;font-size:0.75rem">{footer_note}</p>
      </div>
    </div>
    """


def _send_posttest_email(nombre, email, pais, test_type, overall, scores):
    """Envía el correo de resultados después de completar un test."""
    lang = 'pt' if pais and pais.upper() == 'BR' else 'es'
    try:
        html    = _generate_posttest_email_html(nombre, test_type, overall, scores, lang)
        type_lbl = ('Técnico' if test_type == 'technical' else 'Mental') if lang == 'es' else ('Técnico' if test_type == 'technical' else 'Mental')
        subject = (f'Tus resultados del Test {type_lbl} en MindEV — {overall}%'
                   if lang == 'es' else
                   f'Seus resultados do Teste {type_lbl} no MindEV — {overall}%')
        _smtp_send(email, subject, html)
        print(f"[POSTTEST] Email sent to {email} — {test_type} {overall}%")
    except Exception as e:
        print(f"[POSTTEST] Email error for {email}: {e}")


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

    # Enviar email con resultados en background (no bloquea la respuesta)
    user_info = db.execute(
        "SELECT nombre, email, pais FROM users WHERE id=?", (g.user_id,)
    ).fetchone()
    if user_info and scores:
        overall = round(sum(scores.values()) / len(scores), 1) if scores else 0
        threading.Thread(
            target=_send_posttest_email,
            args=(user_info['nombre'], user_info['email'], user_info['pais'] or '',
                  test_type, overall, scores),
            daemon=True
        ).start()

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

    # ── Verificar acceso antes de devolver datos ───────────────────────────────
    user_row = db.execute(
        "SELECT is_admin, coupon_activated_at, subscription_status, subscription_period_end FROM users WHERE id=?",
        (g.user_id,)
    ).fetchone()
    payment_row = db.execute(
        "SELECT id FROM payments WHERE user_id=? AND status='approved' LIMIT 1", (g.user_id,)
    ).fetchone()
    coupon_ok = (_get_coupon_days_remaining(user_row['coupon_activated_at'] if user_row else None) or 0) > 0
    sub_ok    = _get_subscription_active(user_row)
    is_admin  = user_row and user_row['is_admin']
    if not payment_row and not coupon_ok and not sub_ok and not is_admin:
        return jsonify({'error': 'no_access', 'message': 'Acceso no autorizado'}), 403
    # ──────────────────────────────────────────────────────────────────────────

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

    # Suscripción
    user_row = db.execute(
        "SELECT subscription_status, subscription_period_end FROM users WHERE id=?", (g.user_id,)
    ).fetchone()
    sub_active = _get_subscription_active(user_row)
    sub_info   = None
    if user_row and user_row['subscription_status']:
        sub_info = {
            'status':     user_row['subscription_status'],
            'period_end': user_row['subscription_period_end'],
            'active':     sub_active,
        }

    return jsonify({'history': history, 'benchmark': benchmark, 'subscription': sub_info})

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
    rows = db.execute(
        "SELECT id, code, notes, created_at, owner_email, owner_name, commission_usd FROM referral_codes ORDER BY created_at DESC"
    ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        # Stats: usuarios registrados y ventas aprobadas con este código
        stats = db.execute("""
            SELECT COUNT(u.id) as total_users,
                   COALESCE(SUM(p.amount),0) as total_sales
            FROM users u
            LEFT JOIN payments p ON p.user_id = u.id AND p.status='approved'
            WHERE u.referral_code = ?
        """, (r['code'],)).fetchone()
        d['total_users'] = stats['total_users']
        d['total_sales'] = stats['total_sales']
        d['total_commission'] = round((r['commission_usd'] or 0) * stats['total_users'], 2)
        result.append(d)
    return jsonify({'codes': result})

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

@app.route('/api/admin/referral-codes/<code>', methods=['PUT'])
@require_auth
def update_referral_code(code):
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    data = request.json or {}
    owner_email    = (data.get('owner_email') or '').strip()
    owner_name     = (data.get('owner_name') or '').strip()
    commission_usd = float(data.get('commission_usd') or 0)
    notes          = (data.get('notes') or '').strip()
    db = get_db()
    row = db.execute("SELECT id FROM referral_codes WHERE LOWER(code)=LOWER(?)", (code,)).fetchone()
    if not row:
        return jsonify({'error': 'Código no encontrado'}), 404
    db.execute(
        "UPDATE referral_codes SET owner_email=?, owner_name=?, commission_usd=?, notes=? WHERE id=?",
        (owner_email, owner_name, commission_usd, notes, row['id'])
    )
    db.commit()
    return jsonify({'ok': True})

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

@app.route('/api/admin/referrals/send-report', methods=['POST'])
@require_auth
def send_referral_report():
    """Genera y envía reporte mensual de comisiones a cada referido."""
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    data  = request.json or {}
    year  = int(data.get('year',  datetime.datetime.now().year))
    month = int(data.get('month', datetime.datetime.now().month))
    code_filter = (data.get('code') or '').strip()
    test_mode   = bool(data.get('test'))   # Modo prueba: envía aunque no haya ventas reales

    start = f"{year}-{month:02d}-01"
    end   = f"{year+1}-01-01" if month == 12 else f"{year}-{month+1:02d}-01"
    month_name = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                  'Agosto','Septiembre','Octubre','Noviembre','Diciembre'][month-1]

    db = get_db()
    query = "SELECT * FROM referral_codes WHERE owner_email != '' AND owner_email IS NOT NULL"
    params = []
    if code_filter:
        query += " AND LOWER(code)=LOWER(?)"
        params.append(code_filter)
    codes = db.execute(query, params).fetchall()

    if not codes:
        return jsonify({'error': 'No hay códigos con email de propietario configurado'}), 400

    results = []
    for rc in codes:
        # Usuarios que se registraron este mes con este código
        users = db.execute("""
            SELECT u.nombre, u.apellido, u.email, u.created_at,
                   p.amount, p.currency, p.status
            FROM users u
            LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'approved'
            WHERE u.referral_code = ?
              AND u.created_at >= ? AND u.created_at < ?
            ORDER BY u.created_at ASC
        """, (rc['code'], start, end)).fetchall()

        paying_users = [u for u in users if u['amount']]

        if not paying_users:
            if not test_mode:
                results.append({'code': rc['code'], 'sent': False, 'reason': 'Sin ventas este mes', 'users': 0})
                continue
            # Modo prueba: usar datos ficticios para visualizar el email
            paying_users = [{'nombre': 'Usuario', 'apellido': 'Ejemplo', 'email': 'usuario@ejemplo.com', 'amount': 19.99}]

        commission_per_sale = rc['commission_usd'] or 0
        total_sales     = sum(u['amount'] for u in paying_users)
        total_commission = round(commission_per_sale * len(paying_users), 2)

        # Construir tabla HTML de usuarios
        rows_html = ''.join([f"""
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #2d3748">{u['nombre']} {u['apellido']}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #2d3748;color:#94a3b8">{u['email']}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #2d3748;text-align:center">USD ${u['amount']:.2f}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #2d3748;text-align:center;color:#4ade80">USD ${commission_per_sale:.2f}</td>
            </tr>""" for u in paying_users])

        html_body = f"""
        <div style="background:#0a0e1a;color:#e2e8f0;font-family:'Segoe UI',sans-serif;padding:40px 20px;max-width:640px;margin:0 auto">
          <div style="text-align:center;margin-bottom:32px">
            <div style="font-size:2rem;margin-bottom:8px">♠</div>
            <h1 style="color:#d4af37;font-size:1.5rem;margin:0">MindEV-IA</h1>
            <p style="color:#64748b;margin:4px 0 0">Reporte de Comisiones — {month_name} {year}</p>
          </div>

          <p style="margin-bottom:8px">Hola <strong>{rc['owner_name'] or rc['owner_email']}</strong>,</p>
          <p style="color:#94a3b8;margin-bottom:24px">
            A continuación encontrarás el detalle de usuarios que compraron una licencia MindEV-IA
            en <strong style="color:#e2e8f0">{month_name} {year}</strong> a través de tu código
            <strong style="color:#d4af37">{rc['code']}</strong>.
          </p>

          <table style="width:100%;border-collapse:collapse;background:#1a2035;border-radius:12px;overflow:hidden;margin-bottom:24px">
            <thead>
              <tr style="background:#d4af37">
                <th style="padding:12px;text-align:left;color:#000;font-size:0.8rem">USUARIO</th>
                <th style="padding:12px;text-align:left;color:#000;font-size:0.8rem">EMAIL</th>
                <th style="padding:12px;text-align:center;color:#000;font-size:0.8rem">PAGO</th>
                <th style="padding:12px;text-align:center;color:#000;font-size:0.8rem">TU COMISIÓN</th>
              </tr>
            </thead>
            <tbody>{rows_html}</tbody>
          </table>

          <div style="background:#1a2035;border:1px solid #d4af37;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
            <div style="font-size:0.85rem;color:#94a3b8;margin-bottom:8px">RESUMEN DEL MES</div>
            <div style="display:flex;justify-content:space-around;flex-wrap:wrap;gap:16px">
              <div>
                <div style="font-size:1.8rem;font-weight:900;color:#d4af37">{len(paying_users)}</div>
                <div style="font-size:0.8rem;color:#64748b">ventas</div>
              </div>
              <div>
                <div style="font-size:1.8rem;font-weight:900;color:#d4af37">USD ${total_sales:.2f}</div>
                <div style="font-size:0.8rem;color:#64748b">facturado total</div>
              </div>
              <div>
                <div style="font-size:1.8rem;font-weight:900;color:#4ade80">USD ${total_commission:.2f}</div>
                <div style="font-size:0.8rem;color:#64748b">tu comisión total</div>
              </div>
            </div>
          </div>

          <p style="color:#64748b;font-size:0.85rem;text-align:center">
            Para consultas sobre el pago de comisiones, responde este correo.<br>
            MindEV-IA · mindev-ia.cl
          </p>
        </div>"""

        # Enviar email
        sent      = False
        smtp_err  = None
        if not (SMTP_USER and SMTP_PASS):
            smtp_err = 'SMTP_USER o SMTP_PASS no configurados en Railway'
        else:
            try:
                msg = MIMEMultipart('alternative')
                subject_prefix = '[PRUEBA] ' if test_mode else ''
                msg['Subject'] = f'{subject_prefix}📊 Tu reporte de comisiones MindEV-IA — {month_name} {year}'
                msg['From']    = SMTP_USER
                msg['To']      = rc['owner_email']
                msg.attach(MIMEText(html_body, 'html', 'utf-8'))
                raw = msg.as_string()
                # Forzar IPv4 para evitar "Network is unreachable" en Railway (no soporta IPv6 saliente)
                infos = socket.getaddrinfo(SMTP_SERVER, SMTP_PORT, socket.AF_INET, socket.SOCK_STREAM)
                ipv4  = infos[0][4][0]
                with smtplib.SMTP(ipv4, SMTP_PORT, timeout=30) as srv:
                    srv._host = SMTP_SERVER   # para validación TLS del certificado
                    srv.ehlo(); srv.starttls(); srv.ehlo()
                    srv.login(SMTP_USER, SMTP_PASS)
                    srv.sendmail(SMTP_USER, rc['owner_email'], raw)
                sent = True
            except Exception as e:
                smtp_err = str(e)
                print(f'[REPORT] Error enviando a {rc["owner_email"]}: {e}')

        results.append({
            'code': rc['code'],
            'owner_email': rc['owner_email'],
            'sent': sent,
            'smtp_error': smtp_err,
            'users': len(paying_users),
            'total_sales': total_sales,
            'total_commission': total_commission
        })

    return jsonify({'ok': True, 'month': month_name, 'year': year, 'results': results})

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


@app.route('/api/admin/analytics', methods=['GET'])
@require_auth
def admin_analytics():
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    db = get_db()

    # Totales globales
    total_users   = db.execute("SELECT COUNT(*) as c FROM users").fetchone()['c']
    total_tests   = db.execute("SELECT COUNT(*) as c FROM test_sessions WHERE completed=1").fetchone()['c']
    total_revenue = db.execute("SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE status='approved'").fetchone()['s']
    avg_score     = db.execute("SELECT ROUND(AVG(score_total),1) as a FROM test_sessions WHERE completed=1 AND score_total > 0").fetchone()['a']

    # Usuarios por día (últimos 30 días)
    users_by_day = db.execute("""
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM users
        WHERE created_at >= DATE('now', '-30 days')
        GROUP BY day ORDER BY day ASC
    """).fetchall()

    # Tests completados por día (últimos 30 días)
    tests_by_day = db.execute("""
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM test_sessions
        WHERE completed=1 AND created_at >= DATE('now', '-30 days')
        GROUP BY day ORDER BY day ASC
    """).fetchall()

    # Ingresos por día (últimos 30 días)
    revenue_by_day = db.execute("""
        SELECT DATE(created_at) as day, ROUND(SUM(amount),2) as revenue
        FROM payments
        WHERE status='approved' AND created_at >= DATE('now', '-30 days')
        GROUP BY day ORDER BY day ASC
    """).fetchall()

    # Países (top 10)
    countries = db.execute("""
        SELECT COALESCE(NULLIF(TRIM(pais),''), 'Sin especificar') as pais, COUNT(*) as count
        FROM users
        GROUP BY pais ORDER BY count DESC LIMIT 10
    """).fetchall()

    # Tipos de test
    test_types = db.execute("""
        SELECT COALESCE(NULLIF(test_type,''),'mental') as test_type, COUNT(*) as count
        FROM test_sessions WHERE completed=1
        GROUP BY test_type
    """).fetchall()

    # Cupones: stats
    coupon_row = db.execute("""
        SELECT COUNT(*) as total,
               SUM(CASE WHEN used_by IS NOT NULL THEN 1 ELSE 0 END) as used
        FROM coupons
    """).fetchone()
    coupon_total     = coupon_row['total'] or 0
    coupon_used      = coupon_row['used']  or 0
    coupon_available = coupon_total - coupon_used

    # Cupones activos (no expirados)
    coupon_active_users = db.execute("""
        SELECT COUNT(*) as c FROM users
        WHERE coupon_activated_at IS NOT NULL AND coupon_activated_at != ''
          AND CAST((JULIANDAY('now') - JULIANDAY(coupon_activated_at)) AS INTEGER) < 30
    """).fetchone()['c']

    # Conversión cupón → pago
    coupon_converted = db.execute("""
        SELECT COUNT(DISTINCT u.id) as c
        FROM users u
        JOIN payments p ON p.user_id = u.id AND p.status='approved'
        WHERE u.coupon_activated_at IS NOT NULL AND u.coupon_activated_at != ''
    """).fetchone()['c']
    conversion_rate = round(coupon_converted / coupon_used * 100, 1) if coupon_used > 0 else 0

    # Usuarios nuevos últimos 7 días
    new_users_7d = db.execute("""
        SELECT COUNT(*) as c FROM users
        WHERE created_at >= DATE('now', '-7 days')
    """).fetchone()['c']

    # Tests últimos 7 días
    tests_7d = db.execute("""
        SELECT COUNT(*) as c FROM test_sessions
        WHERE completed=1 AND created_at >= DATE('now', '-7 days')
    """).fetchone()['c']

    return jsonify({
        'totals': {
            'users': total_users,
            'tests': total_tests,
            'revenue': round(total_revenue, 2),
            'avg_score': avg_score or 0,
            'new_users_7d': new_users_7d,
            'tests_7d': tests_7d,
        },
        'coupon': {
            'total': coupon_total,
            'used': coupon_used,
            'available': coupon_available,
            'active': coupon_active_users,
            'converted': coupon_converted,
            'conversion_rate': conversion_rate,
        },
        'users_by_day':   [dict(r) for r in users_by_day],
        'tests_by_day':   [dict(r) for r in tests_by_day],
        'revenue_by_day': [dict(r) for r in revenue_by_day],
        'countries':      [dict(r) for r in countries],
        'test_types':     [dict(r) for r in test_types],
    })


@app.route('/api/admin/export/<string:export_type>', methods=['GET'])
@require_auth
def admin_export(export_type):
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    db = get_db()
    from flask import Response
    import csv, io

    output = io.StringIO()
    writer = csv.writer(output)

    if export_type == 'users':
        writer.writerow(['ID', 'Nombre', 'Apellido', 'Email', 'País', 'Referido por',
                         'Cupón código', 'Cupón activado', 'Días restantes cupón', 'Registro'])
        rows = db.execute(
            "SELECT id, nombre, apellido, email, pais, referral_code, "
            "coupon_code, coupon_activated_at, created_at FROM users ORDER BY created_at DESC"
        ).fetchall()
        for r in rows:
            days = _get_coupon_days_remaining(r['coupon_activated_at'])
            writer.writerow([
                r['id'], r['nombre'], r['apellido'], r['email'],
                r['pais'] or '', r['referral_code'] or '',
                r['coupon_code'] or '', (r['coupon_activated_at'] or '')[:10],
                days if days else '', (r['created_at'] or '')[:10]
            ])
        filename = 'mindev-usuarios.csv'

    elif export_type == 'tests':
        writer.writerow(['ID', 'Usuario ID', 'Nombre', 'Email', 'Tipo', 'Score Total',
                         'Completado', 'Fecha'])
        rows = db.execute("""
            SELECT ts.id, ts.user_id, u.nombre, u.apellido, u.email,
                   COALESCE(NULLIF(ts.test_type,''),'mental') as test_type,
                   ts.score_total, ts.completed_at, ts.created_at
            FROM test_sessions ts
            LEFT JOIN users u ON u.id = ts.user_id
            WHERE ts.completed=1
            ORDER BY ts.created_at DESC
        """).fetchall()
        for r in rows:
            writer.writerow([
                r['id'], r['user_id'],
                f"{r['nombre'] or ''} {r['apellido'] or ''}".strip(),
                r['email'] or '', r['test_type'],
                round(r['score_total'] or 0, 1),
                (r['completed_at'] or '')[:10], (r['created_at'] or '')[:10]
            ])
        filename = 'mindev-tests.csv'

    elif export_type == 'coupons':
        writer.writerow(['Código', 'Estado', 'Usado por (nombre)', 'Email', 'País', 'Fecha uso'])
        rows = db.execute("""
            SELECT c.code, c.used_at, u.nombre, u.apellido, u.email, u.pais
            FROM coupons c LEFT JOIN users u ON c.used_by = u.id
            ORDER BY c.code ASC
        """).fetchall()
        for r in rows:
            estado = 'Utilizado' if r['used_at'] else 'Disponible'
            writer.writerow([
                r['code'], estado,
                f"{r['nombre'] or ''} {r['apellido'] or ''}".strip() if r['nombre'] else '',
                r['email'] or '', r['pais'] or '',
                (r['used_at'] or '')[:10]
            ])
        filename = 'mindev-cupones.csv'

    elif export_type == 'payments':
        writer.writerow(['ID', 'Usuario', 'Email', 'Monto', 'Moneda', 'Método', 'Estado', 'Fecha'])
        rows = db.execute("""
            SELECT p.id, u.nombre, u.apellido, u.email,
                   p.amount, p.currency, p.method, p.status, p.created_at
            FROM payments p LEFT JOIN users u ON u.id = p.user_id
            WHERE p.status='approved'
            ORDER BY p.created_at DESC
        """).fetchall()
        for r in rows:
            writer.writerow([
                r['id'],
                f"{r['nombre'] or ''} {r['apellido'] or ''}".strip(),
                r['email'] or '', r['amount'], r['currency'] or '',
                r['method'] or '', r['status'] or '',
                (r['created_at'] or '')[:10]
            ])
        filename = 'mindev-pagos.csv'

    else:
        return jsonify({'error': 'Tipo de exportación no válido'}), 400

    output.seek(0)
    return Response(
        '﻿' + output.getvalue(),   # BOM UTF-8 para que Excel lo abra bien
        mimetype='text/csv; charset=utf-8',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )

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

    # Solo proceder si el email está configurado — nunca exponer la clave en la respuesta
    if not (SMTP_USER and SMTP_PASS):
        # Sin SMTP configurado no podemos enviar; respondemos genérico sin tocar la BD
        return jsonify({'ok': True, 'message': 'Si el email está registrado, recibirás un correo en breve.'})

    # Generar contraseña temporal y actualizarla en BD
    temp_pw = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    db.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(temp_pw), user['id']))
    db.commit()

    try:
        _send_reset_email(email, user['nombre'], temp_pw)
        return jsonify({'ok': True, 'message': 'Te enviamos un correo con tu nueva contraseña temporal. Revisa también la carpeta de spam.'})
    except Exception as e:
        return jsonify({'error': f'Error al enviar el correo: {str(e)}'}), 500

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
    Envía un email HTML.
    Prioridad 1: Resend API (HTTPS/443 — funciona en Railway sin restricciones)
    Prioridad 2: SMTP directo (fallback para entornos sin bloqueo de puertos)
    """
    import requests as _req

    resend_key  = os.environ.get('RESEND_API_KEY', '')
    smtp_user   = os.environ.get('SMTP_USER', '') or SMTP_USER
    smtp_pass   = os.environ.get('SMTP_PASS', '') or SMTP_PASS
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    email_from  = os.environ.get('EMAIL_FROM', '') or smtp_user or 'noreply@mindev-ia.cl'

    # ── Intento 1: Resend API (recomendado en Railway) ────────────────────────
    if resend_key:
        try:
            resp = _req.post(
                'https://api.resend.com/emails',
                headers={
                    'Authorization': f'Bearer {resend_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'from': f'MindEV <{email_from}>',
                    'to': [to_addr],
                    'subject': subject,
                    'html': html_body,
                },
                timeout=30
            )
            if resp.status_code in (200, 201):
                print(f"[EMAIL] Enviado via Resend a {to_addr}")
                return
            raise Exception(f"Resend HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"[EMAIL] Resend falló: {e}")
            raise  # Si RESEND_API_KEY está configurada y falla, reportar el error

    # ── Intento 2: SMTP (fallback) ─────────────────────────────────────────────
    if not smtp_user or not smtp_pass:
        raise Exception(
            'No hay método de email configurado. '
            'Agrega RESEND_API_KEY en Railway (recomendado) o configura SMTP_USER/SMTP_PASS.'
        )

    import ssl, socket
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From']    = smtp_user
    msg['To']      = to_addr
    msg.attach(MIMEText(html_body, 'html'))
    raw = msg.as_string()
    errors = []

    for port, use_ssl in [(587, False), (465, True)]:
        try:
            infos = socket.getaddrinfo(smtp_server, port, socket.AF_INET, socket.SOCK_STREAM)
            ipv4 = infos[0][4][0]
            if use_ssl:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                with smtplib.SMTP_SSL(ipv4, port, context=ctx, timeout=25) as s:
                    s.login(smtp_user, smtp_pass)
                    s.sendmail(smtp_user, to_addr, raw)
            else:
                with smtplib.SMTP(ipv4, port, timeout=25) as s:
                    s._host = smtp_server
                    s.ehlo(); s.starttls(); s.ehlo()
                    s.login(smtp_user, smtp_pass)
                    s.sendmail(smtp_user, to_addr, raw)
            print(f"[EMAIL] Enviado via SMTP IPv4/{port} a {to_addr}")
            return
        except Exception as e:
            errors.append(f"SMTP/{port}: {e}")

    raise Exception("Todos los métodos de email fallaron — " + " | ".join(errors))


def _send_reset_email(to_email, nombre, temp_pw):
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:3rem;color:#d4af37">&#9824;</span>
        <h1 style="color:#d4af37;margin:8px 0">MindEV-IA</h1>
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

    # Enviar correo de bienvenida en background (no bloquea la respuesta)
    user_info = db.execute(
        "SELECT nombre, email, pais FROM users WHERE id=?", (g.user_id,)
    ).fetchone()
    if user_info:
        threading.Thread(
            target=_send_coupon_welcome_email,
            args=(user_info['nombre'], user_info['email'], user_info['pais'] or '', g.user_id),
            daemon=True
        ).start()

    return jsonify({'ok': True, 'days': 30, 'activated_at': now})


@app.route('/api/admin/users/<int:user_id>/resend-welcome', methods=['POST'])
@require_auth
def resend_welcome_email(user_id):
    """Reenvía el correo de bienvenida de cupón a un usuario específico."""
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    db = get_db()
    user = db.execute(
        "SELECT nombre, email, pais, coupon_activated_at FROM users WHERE id=?", (user_id,)
    ).fetchone()
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    if not user['coupon_activated_at']:
        return jsonify({'error': 'Este usuario no tiene cupón activo'}), 400
    try:
        _send_coupon_welcome_email(user['nombre'], user['email'], user['pais'] or '', user_id)
        return jsonify({'ok': True, 'message': f'Correo enviado a {user["email"]}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/send-coupon-welcome-sample', methods=['POST'])
@require_auth
def send_coupon_welcome_sample():
    """Envía un correo de muestra de bienvenida al admin."""
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    notify_email = os.environ.get('REFERRAL_NOTIFY_EMAIL', REFERRAL_NOTIFY_EMAIL)
    try:
        html = _generate_coupon_welcome_html('Mauricio', lang='es')
        _smtp_send(notify_email, '[MUESTRA] MindEV — correo de bienvenida con cupón', html)
        return jsonify({'ok': True, 'message': f'Correo de bienvenida enviado a {notify_email}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/send-coupon-expiry-sample', methods=['POST'])
@require_auth
def send_coupon_expiry_sample():
    """Envía un correo de muestra de expiración al admin."""
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    notify_email = os.environ.get('REFERRAL_NOTIFY_EMAIL', REFERRAL_NOTIFY_EMAIL)
    try:
        html = _generate_coupon_expiry_html('Mauricio', 3, lang='es')
        _smtp_send(notify_email, '[MUESTRA] MindEV — aviso de expiración de cupón', html)
        return jsonify({'ok': True, 'message': f'Correo de expiración enviado a {notify_email}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/send-coupon-sample', methods=['POST'])
@require_auth
def send_coupon_sample():
    if not g.is_admin:
        return jsonify({'error': 'Acceso denegado'}), 403
    base_url = os.environ.get('BASE_URL', BASE_URL)
    logo_url = f"{base_url}/icons/mindev-logo.png"
    ai_text_es = (
        "Llevas 7 días usando MindEV y tu acceso de prueba sigue activo. "
        "Este es un ejemplo del correo semanal que recibirán tus usuarios con cupón. "
        "El texto real es generado automáticamente por IA, personalizado con el nombre del jugador "
        "y un mensaje motivacional específico sobre su juego de poker."
    )
    ai_text_pt = (
        "Você já usa o MindEV há 7 dias e seu acesso de teste continua ativo. "
        "Este é um exemplo do e-mail semanal que seus usuários com cupom receberão. "
        "O texto real é gerado automaticamente por IA, personalizado com o nome do jogador "
        "e uma mensagem motivacional específica sobre seu jogo de poker."
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:36px 32px;border-radius:14px">

      <div style="text-align:center;margin-bottom:20px">
        <img src="{logo_url}" alt="MindEV" style="height:52px;max-width:200px;object-fit:contain">
        <p style="margin:8px 0 0;color:#64748b;font-size:0.78rem;letter-spacing:0.05em;text-transform:uppercase">Diagnóstico Mental y Técnico para Poker</p>
      </div>

      <div style="background:#1e2d45;border:1px dashed #d4af37;border-radius:8px;padding:8px 14px;margin-bottom:20px;text-align:center">
        <p style="margin:0;font-size:0.72rem;color:#d4af37;text-transform:uppercase;letter-spacing:1px">&#9993; Correo de muestra — MindEV Admin</p>
      </div>

      <h2 style="margin:0 0 18px;font-size:1.25rem;color:#f1f5f9">Hola, Mauricio!</h2>

      <div style="background:#1e2d45;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px">
        <p style="margin:0;font-size:1rem;color:#fbbf24;font-weight:700">&#9203; Tienes 23 días restantes en MindEV</p>
      </div>

      <p style="line-height:1.75;color:#cbd5e1;font-size:0.97rem;margin-bottom:12px"><strong>Español:</strong> {ai_text_es}</p>
      <p style="line-height:1.75;color:#94a3b8;font-size:0.97rem;margin-bottom:28px"><strong>Português:</strong> {ai_text_pt}</p>

      <div style="text-align:center;margin-bottom:28px">
        <a href="{base_url}" style="display:inline-block;background:#d4af37;color:#0a0e1a;font-weight:800;font-size:1rem;padding:14px 36px;border-radius:8px;text-decoration:none">
          &#9654; Acceder a MindEV
        </a>
      </div>

      <div style="border-top:1px solid #1e293b;padding-top:16px;text-align:center">
        <img src="{logo_url}" alt="MindEV" style="height:22px;opacity:0.45;margin-bottom:6px">
        <p style="margin:0;color:#334155;font-size:0.75rem">Diagnóstico Mental y Técnico para Poker</p>
      </div>
    </div>
    """
    try:
        _smtp_send(REFERRAL_NOTIFY_EMAIL, "[MUESTRA] MindEV — correo semanal de cupón", html)
        return jsonify({'ok': True, 'message': f'Correo enviado a {REFERRAL_NOTIFY_EMAIL}'})
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
            lang_word = 'English' if lang == 'en' else ('Spanish' if lang == 'es' else 'Brazilian Portuguese')
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
                timeout=30
            )
            if resp.status_code == 200:
                ai_paragraph = resp.json()['content'][0]['text'].strip()
        except Exception as e:
            print(f"[COUPON] AI paragraph error: {e}")

    if not ai_paragraph:
        if lang == 'en':
            ai_paragraph = (
                'Your MindEV access is still active and every study session counts. '
                'Using these days to identify and work on your mental leaks '
                'can make a real difference to your long-term results.'
            )
        elif lang == 'pt':
            ai_paragraph = (
                'Seu acesso ao MindEV continua ativo e cada sessão de estudo conta. '
                'Aproveitar esses dias para identificar e trabalhar suas fugas mentais '
                'pode fazer a diferença nos seus resultados a longo prazo.'
            )
        else:
            ai_paragraph = (
                'Tu acceso a MindEV sigue activo y cada sesión de estudio cuenta. '
                'Aprovechar estos días para identificar y trabajar tus fugas mentales '
                'puede marcar la diferencia en tus resultados a largo plazo.'
            )

    if lang == 'en':
        subject_label = f"You have {days_remaining} days remaining on MindEV"
        greeting  = f"Hi, {nombre}!"
        cta_text  = 'Access MindEV'
        sub_text  = 'Mental & Technical Diagnosis for Poker'
    elif lang == 'pt':
        subject_label = f"Você tem {days_remaining} dias restantes no MindEV"
        greeting  = f"Olá, {nombre}!"
        cta_text  = 'Acessar MindEV'
        sub_text  = 'Diagnóstico Mental e Técnico para Poker'
    else:
        subject_label = f"Tienes {days_remaining} días restantes en MindEV"
        greeting  = f"Hola, {nombre}!"
        cta_text  = 'Acceder a MindEV'
        sub_text  = 'Diagnóstico Mental y Técnico para Poker'
    base_url  = os.environ.get('BASE_URL', BASE_URL)
    logo_url  = f"{base_url}/icons/mindev-logo.png"
    logo_pt   = f"{base_url}/icons/mindev-logo-pt.svg"
    logo_src  = logo_pt if lang == 'pt' else logo_url

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:36px 32px;border-radius:14px">

      <!-- Header con logo -->
      <div style="text-align:center;margin-bottom:28px">
        <img src="{logo_src}" alt="MindEV" style="height:52px;max-width:200px;object-fit:contain"
             onerror="this.style.display='none';document.getElementById('logo-fallback').style.display='block'">
        <div id="logo-fallback" style="display:none">
          <span style="font-size:2.8rem;color:#d4af37">&#9824;</span>
          <h1 style="color:#d4af37;margin:4px 0 0;font-size:1.6rem;letter-spacing:2px">MindEV</h1>
        </div>
        <p style="margin:8px 0 0;color:#64748b;font-size:0.82rem;letter-spacing:0.05em;text-transform:uppercase">{sub_text}</p>
      </div>

      <!-- Saludo -->
      <h2 style="margin:0 0 20px;font-size:1.3rem;color:#f1f5f9">{greeting}</h2>

      <!-- Alerta de días -->
      <div style="background:#1e2d45;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:22px">
        <p style="margin:0;font-size:1rem;color:#fbbf24;font-weight:700">&#9203; {subject_label}</p>
      </div>

      <!-- Párrafo IA -->
      <p style="line-height:1.75;color:#cbd5e1;font-size:0.97rem;margin-bottom:28px">{ai_paragraph}</p>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:28px">
        <a href="{base_url}"
           style="display:inline-block;background:#d4af37;color:#0a0e1a;font-weight:800;font-size:1rem;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.02em">
          &#9654; {cta_text}
        </a>
      </div>

      <!-- Footer limpio -->
      <div style="border-top:1px solid #1e293b;padding-top:18px;text-align:center">
        <img src="{logo_url}" alt="MindEV" style="height:24px;opacity:0.5;margin-bottom:6px">
        <p style="margin:0;color:#334155;font-size:0.75rem">{sub_text}</p>
      </div>

    </div>
    """


def _generate_coupon_welcome_html(nombre, lang='es'):
    """HTML del correo de bienvenida al activar un cupón."""
    base_url = os.environ.get('BASE_URL', BASE_URL)
    logo_url = f"{base_url}/icons/mindev-logo.png"
    if lang == 'en':
        sub_text = 'Mental & Technical Diagnosis for Poker'
    elif lang == 'pt':
        sub_text = 'Diagnóstico Mental e Técnico para Poker'
    else:
        sub_text = 'Diagnóstico Mental y Técnico para Poker'

    if lang == 'en':
        greeting   = f"Welcome, {nombre}!"
        headline   = "✅ Your 30-day access is now active"
        body_p1    = (
            "Your coupon was successfully validated. You have <strong>30 full days</strong> "
            "to explore MindEV and discover exactly which areas you need to work on "
            "to improve your game."
        )
        body_p2    = "With your access you can:"
        features   = [
            "🧠 <strong>Mental Test</strong> — identify your emotional and focus leaks",
            "♠️ <strong>Technical Test</strong> — assess your mastery of key poker concepts",
            "📊 <strong>Dashboard</strong> — review your results and personalised improvement plan",
        ]
        cta_text   = "Get started now"
        sub_note   = "You will receive a weekly reminder while your access is active."
    elif lang == 'es':
        greeting   = f"¡Bienvenido, {nombre}!"
        headline   = "✅ Tu acceso de 30 días está activo"
        body_p1    = (
            "Tu cupón fue validado exitosamente. Tienes <strong>30 días completos</strong> "
            "para explorar MindEV y descubrir exactamente en qué áreas debes trabajar "
            "para mejorar tu juego."
        )
        body_p2    = "Con tu acceso puedes:"
        features   = [
            "🧠 <strong>Test Mental</strong> — identifica tus fugas emocionales y de enfoque",
            "♠️ <strong>Test Técnico</strong> — evalúa tu dominio de conceptos clave de poker",
            "📊 <strong>Dashboard</strong> — revisa tus resultados y plan de mejora personalizado",
        ]
        cta_text   = "Comenzar ahora"
        sub_note   = "Recibirás un recordatorio semanal mientras tu acceso esté activo."
    else:
        greeting   = f"Bem-vindo, {nombre}!"
        headline   = "✅ Seu acesso de 30 dias está ativo"
        body_p1    = (
            "Seu cupom foi validado com sucesso. Você tem <strong>30 dias completos</strong> "
            "para explorar o MindEV e descobrir exatamente em quais áreas você deve trabalhar "
            "para melhorar seu jogo."
        )
        body_p2    = "Com seu acesso você pode:"
        features   = [
            "🧠 <strong>Teste Mental</strong> — identifica suas fugas emocionais e de foco",
            "♠️ <strong>Teste Técnico</strong> — avalia seu domínio dos conceitos-chave do poker",
            "📊 <strong>Dashboard</strong> — revise seus resultados e plano de melhoria personalizado",
        ]
        cta_text   = "Começar agora"
        sub_note   = "Você receberá um lembrete semanal enquanto seu acesso estiver ativo."

    features_html = ''.join(
        f'<li style="margin:8px 0;color:#cbd5e1;font-size:0.95rem">{f}</li>'
        for f in features
    )

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:36px 32px;border-radius:14px">

      <div style="text-align:center;margin-bottom:28px">
        <img src="{logo_url}" alt="MindEV" style="height:52px;max-width:200px;object-fit:contain">
        <p style="margin:8px 0 0;color:#64748b;font-size:0.82rem;letter-spacing:0.05em;text-transform:uppercase">{sub_text}</p>
      </div>

      <h2 style="margin:0 0 16px;font-size:1.3rem;color:#f1f5f9">{greeting}</h2>

      <div style="background:#1e3a2f;border-left:4px solid #4ade80;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:22px">
        <p style="margin:0;font-size:1rem;color:#4ade80;font-weight:700">{headline}</p>
      </div>

      <p style="line-height:1.75;color:#cbd5e1;font-size:0.97rem;margin-bottom:16px">{body_p1}</p>

      <p style="color:#94a3b8;font-size:0.9rem;margin-bottom:10px">{body_p2}</p>
      <ul style="padding-left:20px;margin:0 0 24px">{features_html}</ul>

      <div style="text-align:center;margin-bottom:24px">
        <a href="{base_url}"
           style="display:inline-block;background:#d4af37;color:#0a0e1a;font-weight:800;font-size:1rem;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.02em">
          &#9654; {cta_text}
        </a>
      </div>

      <p style="text-align:center;color:#475569;font-size:0.82rem;margin-bottom:24px">{sub_note}</p>

      <div style="border-top:1px solid #1e293b;padding-top:18px;text-align:center">
        <img src="{logo_url}" alt="MindEV" style="height:24px;opacity:0.5;margin-bottom:6px">
        <p style="margin:0;color:#334155;font-size:0.75rem">{sub_text}</p>
      </div>
    </div>
    """


def _send_coupon_welcome_email(nombre, email, pais, user_id=None):
    """Envía el correo de bienvenida cuando el usuario activa su cupón."""
    # Determine language: prefer stored idioma field, fallback to pais heuristic
    lang = 'es'
    if user_id:
        try:
            _db = sqlite3.connect(DB_PATH)
            _db.row_factory = sqlite3.Row
            row = _db.execute("SELECT idioma FROM users WHERE id=?", (user_id,)).fetchone()
            _db.close()
            if row and row['idioma'] in ('es', 'pt', 'en'):
                lang = row['idioma']
            elif pais and pais.upper() == 'BR':
                lang = 'pt'
        except Exception:
            lang = 'pt' if pais and pais.upper() == 'BR' else 'es'
    elif pais and pais.upper() == 'BR':
        lang = 'pt'
    html = _generate_coupon_welcome_html(nombre, lang)
    if lang == 'en':
        subject = 'Your MindEV access is active — 30 days!'
    elif lang == 'pt':
        subject = 'Seu acesso ao MindEV está ativo — 30 dias!'
    else:
        subject = '¡Tu acceso a MindEV está activo — 30 días!'
    try:
        _smtp_send(email, subject, html)
        print(f"[COUPON] Welcome email sent to {email}")
        # Marcar como enviado en la BD (evita reenvíos del scheduler)
        if user_id:
            try:
                _db = sqlite3.connect(DB_PATH)
                _db.execute("UPDATE users SET coupon_welcome_sent=1 WHERE id=?", (user_id,))
                _db.commit()
                _db.close()
            except Exception:
                pass
    except Exception as e:
        print(f"[COUPON] Welcome email error for {email}: {e}")


def _generate_coupon_expiry_html(nombre, days_remaining, lang='es'):
    """HTML del correo de alerta cuando quedan ≤ 3 días."""
    import requests as _requests
    base_url = os.environ.get('BASE_URL', BASE_URL)
    logo_url = f"{base_url}/icons/mindev-logo.png"
    if lang == 'en':
        sub_text = 'Mental & Technical Diagnosis for Poker'
    elif lang == 'pt':
        sub_text = 'Diagnóstico Mental e Técnico para Poker'
    else:
        sub_text = 'Diagnóstico Mental y Técnico para Poker'

    # Párrafo generado por IA (urgencia)
    ai_paragraph = ''
    api_key = _get_api_key()
    if api_key:
        try:
            lang_word = 'English' if lang == 'en' else ('Spanish' if lang == 'es' else 'Brazilian Portuguese')
            prompt = (
                f"You are MindEV, a poker improvement platform. Write a SHORT urgent paragraph "
                f"(2-3 sentences) in {lang_word} for a poker player named {nombre} who has only "
                f"{days_remaining} day{'s' if days_remaining != 1 else ''} left of trial access. "
                f"Emphasize the urgency of using the remaining time. Mention that losing access "
                f"means losing the personalized improvement plan and diagnostics. Be direct and "
                f"motivating, not alarming. Write ONLY the paragraph, nothing else."
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
                    'max_tokens': 250,
                    'messages': [{'role': 'user', 'content': prompt}]
                },
                timeout=30
            )
            if resp.status_code == 200:
                ai_paragraph = resp.json()['content'][0]['text'].strip()
        except Exception as e:
            print(f"[COUPON] Expiry AI paragraph error: {e}")

    if not ai_paragraph:
        if lang == 'en':
            ai_paragraph = (
                f'Your MindEV access expires in {days_remaining} day{"s" if days_remaining != 1 else ""}. '
                'This is the ideal time to complete your diagnosis and download your improvement plan '
                'before your access expires.'
            )
        elif lang == 'pt':
            ai_paragraph = (
                f'Seu acesso ao MindEV expira em {days_remaining} dia{"s" if days_remaining != 1 else ""}. '
                'É o momento ideal para completar seu diagnóstico e baixar seu plano de melhoria antes '
                'que seu acesso expire.'
            )
        else:
            ai_paragraph = (
                f'Tu acceso a MindEV vence en {days_remaining} día{"s" if days_remaining != 1 else ""}. '
                'Es el momento ideal para completar tu diagnóstico y descargar tu plan de mejora antes '
                'de que expire tu acceso.'
            )

    if lang == 'en':
        greeting     = f"{nombre}, your access is expiring soon!"
        alert_text   = f"⚠️ Only {days_remaining} day{'s' if days_remaining != 1 else ''} remaining"
        cta_text     = "Use my access now"
    elif lang == 'es':
        greeting     = f"¡{nombre}, tu acceso vence pronto!"
        alert_text   = f"⚠️ Solo te quedan {days_remaining} día{'s' if days_remaining != 1 else ''}"
        cta_text     = "Aprovechar mi acceso ahora"
    else:
        greeting     = f"{nombre}, seu acesso está expirando!"
        alert_text   = f"⚠️ Só restam {days_remaining} dia{'s' if days_remaining != 1 else ''}"
        cta_text     = "Aproveitar meu acesso agora"

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0e1a;color:#e2e8f0;padding:36px 32px;border-radius:14px">

      <div style="text-align:center;margin-bottom:28px">
        <img src="{logo_url}" alt="MindEV" style="height:52px;max-width:200px;object-fit:contain">
        <p style="margin:8px 0 0;color:#64748b;font-size:0.82rem;letter-spacing:0.05em;text-transform:uppercase">{sub_text}</p>
      </div>

      <h2 style="margin:0 0 16px;font-size:1.3rem;color:#f1f5f9">{greeting}</h2>

      <div style="background:#3b1a1a;border-left:4px solid #ef4444;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:22px">
        <p style="margin:0;font-size:1.05rem;color:#f87171;font-weight:700">{alert_text}</p>
      </div>

      <p style="line-height:1.75;color:#cbd5e1;font-size:0.97rem;margin-bottom:28px">{ai_paragraph}</p>

      <div style="text-align:center;margin-bottom:28px">
        <a href="{base_url}"
           style="display:inline-block;background:#ef4444;color:#fff;font-weight:800;font-size:1rem;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.02em">
          &#9654; {cta_text}
        </a>
      </div>

      <div style="border-top:1px solid #1e293b;padding-top:18px;text-align:center">
        <img src="{logo_url}" alt="MindEV" style="height:24px;opacity:0.5;margin-bottom:6px">
        <p style="margin:0;color:#334155;font-size:0.75rem">{sub_text}</p>
      </div>
    </div>
    """


def _get_user_lang(user_id, pais):
    """Determine language for a user: check idioma column first, fallback to pais heuristic."""
    if user_id:
        try:
            _db = sqlite3.connect(DB_PATH)
            _db.row_factory = sqlite3.Row
            row = _db.execute("SELECT idioma FROM users WHERE id=?", (user_id,)).fetchone()
            _db.close()
            if row and row['idioma'] in ('es', 'pt', 'en'):
                return row['idioma']
        except Exception:
            pass
    return 'pt' if pais and pais.upper() == 'BR' else 'es'


def _send_coupon_expiry_warning(user_id, nombre, email, days_remaining, pais):
    """Envía el correo de alerta de expiración (una sola vez, cuando quedan ≤ 3 días)."""
    lang = _get_user_lang(user_id, pais)
    html = _generate_coupon_expiry_html(nombre, days_remaining, lang)
    if lang == 'en':
        subject = f'⚠️ Your MindEV access expires in {days_remaining} day{"s" if days_remaining != 1 else ""}'
    elif lang == 'pt':
        subject = f'⚠️ Seu acesso ao MindEV expira em {days_remaining} dia{"s" if days_remaining != 1 else ""}'
    else:
        subject = f'⚠️ Tu acceso a MindEV vence en {days_remaining} día{"s" if days_remaining != 1 else ""}'
    _smtp_send(email, subject, html)
    print(f"[COUPON] Expiry warning sent to {email} — {days_remaining} days remaining")


def _send_coupon_reminder_email(user_id, nombre, email, days_remaining, pais):
    """Envía el correo de recordatorio semanal al usuario con cupón (texto generado por IA)."""
    lang = _get_user_lang(user_id, pais)
    html = _generate_coupon_email_html(nombre, days_remaining, lang)
    if lang == 'en':
        subject = f"You have {days_remaining} days remaining on MindEV"
    elif lang == 'pt':
        subject = f"Voce tem {days_remaining} dias restantes no MindEV"
    else:
        subject = f"Tienes {days_remaining} dias restantes en MindEV"
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
            MindEV – Diagnóstico Mental y Técnico para Poker
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
    """Revisa qué usuarios con cupón necesitan welcome email, recordatorio semanal o aviso de expiración."""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    try:
        now = datetime.datetime.utcnow()
        users = db.execute(
            "SELECT id, nombre, apellido, email, pais, idioma, coupon_activated_at, "
            "last_coupon_reminder, coupon_expiry_warned, coupon_welcome_sent "
            "FROM users WHERE coupon_activated_at IS NOT NULL AND coupon_activated_at != ''"
        ).fetchall()
        for user in users:
            try:
                days_remaining = _get_coupon_days_remaining(user['coupon_activated_at'])
                if (days_remaining or 0) <= 0:
                    continue  # Expirado, no más correos

                # ── Correo de bienvenida (si el hilo background falló) ─────────────
                if not (user['coupon_welcome_sent'] or 0):
                    _send_coupon_welcome_email(
                        user['nombre'], user['email'], user['pais'], user['id']
                    )
                    continue  # No enviar también el semanal el mismo momento

                # ── Aviso de expiración próxima (≤ 3 días, se envía UNA sola vez) ──
                expiry_warned = user['coupon_expiry_warned'] or 0
                if days_remaining <= 3 and not expiry_warned:
                    _send_coupon_expiry_warning(
                        user['id'], user['nombre'], user['email'],
                        days_remaining, user['pais']
                    )
                    db.execute("UPDATE users SET coupon_expiry_warned=1 WHERE id=?", (user['id'],))
                    db.commit()
                    continue  # No enviar también el semanal el mismo día

                # ── Recordatorio semanal (a partir del día 7, cada 7 días) ──
                if days_remaining <= 3:
                    continue  # Ya en zona de expiración, no más semanales
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
            timeout=600
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
        lang_instruction = "IMPORTANT: Write the ENTIRE report in BRAZILIAN PORTUGUESE (PT-BR). All titles, analyses, diagnoses, recommendations and text must be entirely in Brazilian Portuguese. Do not use Spanish or English prose anywhere."
    elif lang == 'en':
        lang_instruction = "IMPORTANT: Write the ENTIRE report in ENGLISH (UK/US). All titles, analyses, diagnoses, recommendations and text must be entirely in English. Poker technical terms should remain in English as-is."
    else:
        lang_instruction = "IMPORTANTE: Genera todo el informe en ESPAÑOL."

    return f"""Eres coach de poker experto (MTT) y psicólogo deportivo. Genera un informe HTML completo para {nombre}. NO incluyas etiquetas html/head/body.
{lang_instruction}

TERMINOLOGÍA POKER OBLIGATORIA — Usa SIEMPRE los términos originales en inglés. NUNCA los traduzcas al español ni al portugués:
- "board" → SIEMPRE "board" (NUNCA "tablero", "mesa", "tabuleiro"). Ej: "en el board", "el board vino", "texture del board".
- "call" → SIEMPRE "call" (NUNCA "llama", "paga", "iguala", "pagar").
- "raise" → SIEMPRE "raise" (NUNCA "sube", "aumenta", "subida").
- "fold" → SIEMPRE "fold" (NUNCA "se retira", "tira", "descarta").
- "check" → SIEMPRE "check" (NUNCA "pasa").
- "bet" → SIEMPRE "bet" (NUNCA "apuesta").
- Mantener en inglés siempre: "all-in", "bluff", "stack", "pot", "flop", "turn", "river", "pre-flop", "3-bet", "c-bet", "range", "equity", "EV", "ITM", "ROI", "hand", "spot".

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
                'max_tokens': 10000,
                'messages': [{'role': 'user', 'content': prompt}]
            },
            timeout=600
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
    _hand_label = 'HAND' if lang == 'en' else 'MÃO' if lang == 'pt' else 'MANO'
    hands_text = '\n\n'.join(
        f"{_hand_label} {i+1}:\n{h['summary']}"
        for i, h in enumerate(meta.get('selected_hands', [])[:40])
    )
    if not hands_text:
        hands_text = ('(No Hero hands found in the hand history)'
                      if lang == 'en' else
                      '(Nenhuma mão do jogador Hero encontrada no histórico)'
                      if lang == 'pt' else
                      '(No se encontraron manos del jugador Hero en el historial)')

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
        _prof_hdr = ('PLAYER PROFILE FROM MENTAL TEST (generated by MindEV AI):'
                     if lang == 'en' else
                     'PERFIL DO JOGADOR SEGUNDO RESPOSTAS DO TESTE MENTAL (gerado pela IA MindEV):'
                     if lang == 'pt' else
                     'PERFIL DEL JUGADOR SEGÚN RESPUESTAS DEL TEST MENTAL (generado por IA con tests MindEV):')
        profile_section = f"\n{_prof_hdr}\n{player_profile[:2500]}\n"
    else:
        profile_section = (
            'PLAYER PROFILE: The player has not yet completed the mental test. Base the Section 5 analysis on the decision patterns observed in the hands.'
            if lang == 'en' else
            'PERFIL DO JOGADOR: O jogador ainda não completou o teste mental. Baseie a análise da seção 5 nos padrões observados nas mãos.'
            if lang == 'pt' else
            'PERFIL DEL JUGADOR: El jugador aún no ha completado el test mental. Basa el análisis de la sección 5 en los patrones observados en las manos.'
        )

    start_chips = f"{meta.get('starting_chips', 0):,}" if meta.get('starting_chips') else 'N/D'
    end_chips   = f"{meta.get('ending_chips',   0):,}" if meta.get('ending_chips')   else 'N/D'
    lvl_first   = meta.get('level_first', 'N/D')
    lvl_last    = meta.get('level_last',  'N/D')

    if lang == 'en':
        lang_instruction = "IMPORTANT: Generate the ENTIRE report in ENGLISH. Every title, heading, analysis, section and piece of text must be in English. Do not use Spanish or Portuguese anywhere in the output."
    elif lang == 'pt':
        lang_instruction = "IMPORTANTE: Gere TODO o relatório em PORTUGUÊS BRASILEIRO (PT-BR). Todos os títulos, análises, seções e textos devem estar integralmente em português brasileiro. Não use espanhol em nenhuma parte."
    else:
        lang_instruction = "IMPORTANTE: Genera todo el reporte en ESPAÑOL."

    return f"""Eres un coach de poker MTT de élite. Analiza el siguiente historial de manos del jugador "{nombre}" y genera un REPORTE COMPLETO en HTML (sin etiquetas html/head/body).
{lang_instruction}

POKER TERMINOLOGY (always keep these in English, never translate):
- "board", "call", "raise", "fold", "check", "bet", "all-in", "bluff", "stack", "pot", "flop", "turn", "river", "pre-flop", "3-bet", "c-bet", "range", "equity", "EV", "hand", "spot".

⚠️ REGLAS CRÍTICAS — ANÁLISIS BASADO SOLO EN INFORMACIÓN DISPONIBLE AL MOMENTO DE LA DECISIÓN:

REGLA 1 — IDENTIFICACIÓN DE STREET:
En los historiales de mano de poker, cuando un jugador va all-in PRE-FLOP, el sistema igual muestra las cartas comunitarias (flop/turn/river) porque se "corren" para determinar el ganador. Esto NO significa que la acción ocurrió en esos streets.
El street donde ocurrió una acción se determina ÚNICAMENTE por la sección del historial donde aparece la jugada:
- Acción bajo *** HOLE CARDS *** → ocurrió PRE-FLOP.
- Acción bajo *** FLOP *** → ocurrió en el FLOP.
- Acción bajo *** TURN *** → ocurrió en el TURN.
- Acción bajo *** RIVER *** → ocurrió en el RIVER.

REGLA 2 — ANALIZA SOLO CON LA INFORMACIÓN QUE HERO TENÍA EN ESE MOMENTO (LA MÁS IMPORTANTE):
El análisis de cada decisión debe realizarse EXCLUSIVAMENTE con la información disponible para Hero en el momento exacto de su jugada. NUNCA uses información de streets posteriores.
- Si Hero actuó PRE-FLOP (shove, call, 3-bet, fold): analiza SOLO con hand, posición, stack en BBs, nivel de ciegos, dinámica de mesa y rangos pre-flop. El board (flop/turn/river) NO EXISTÍA aún — NO lo menciones, NO lo uses para evaluar la decisión.
- Si Hero actuó en el FLOP: analiza con hand + flop. Turn y river NO EXISTÍAN — no los uses.
- Si Hero actuó en el TURN: analiza con hand + flop + turn. River NO EXISTÍA — no lo uses.
- Si Hero actuó en el RIVER: analiza con toda la información de la mano.

EJEMPLO CORRECTO para shove pre-flop con K2o con 7.7 BB:
✅ "Con 7.7 BB en nivel 41, K2o tiene equity suficiente para shove desde [posición]. El ICM y la presión de los ciegos justifican/no justifican este spot porque [análisis de rango]."
❌ INCORRECTO: "El board vino Q-alto bi-pareado lo que destruye la K-high de Hero" — esto usa información post-decisión que Hero no podía conocer.

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


# ─── Plan de Estudio IA ───────────────────────────────────────────────────────

def _build_study_plan_prompt(nombre, mental_scores, technical_scores, lang='es'):
    lang_word = 'Spanish' if lang == 'es' else 'Brazilian Portuguese'

    def fmt_scores(sc):
        names = _CAT_NAMES.get(lang, _CAT_NAMES['es'])
        return '\n'.join(f"  {names.get(k, k)}: {round(v, 1)}%" for k, v in sorted(sc.items(), key=lambda x: x[1]))

    mental_overall  = round(sum(mental_scores.values())  / len(mental_scores),  1) if mental_scores  else None
    tech_overall    = round(sum(technical_scores.values()) / len(technical_scores), 1) if technical_scores else None

    def weak(sc, threshold=60):
        names = _CAT_NAMES.get(lang, _CAT_NAMES['es'])
        return [names.get(k, k) for k, v in sc.items() if v < threshold]

    weak_mental = weak(mental_scores)  if mental_scores  else []
    weak_tech   = weak(technical_scores) if technical_scores else []

    scores_section = ''
    if mental_scores:
        scores_section += f"\nTEST MENTAL ({mental_overall}% overall):\n{fmt_scores(mental_scores)}"
    if technical_scores:
        scores_section += f"\n\nTEST TÉCNICO ({tech_overall}% overall):\n{fmt_scores(technical_scores)}"

    weak_section = ''
    if weak_mental:
        weak_section += f"\nÁreas mentales a priorizar: {', '.join(weak_mental)}"
    if weak_tech:
        weak_section += f"\nÁreas técnicas a priorizar: {', '.join(weak_tech)}"

    return f"""You are MindEV, an expert poker coach. Create a structured 4-week study plan in {lang_word} for {nombre}.

DIAGNOSTIC RESULTS:{scores_section}
{weak_section}

REQUIREMENTS:
- Week 1: Mental foundation focused on weakest mental area(s)
- Week 2: Technical foundation focused on weakest technical area(s)
- Week 3: Integration — connect mental + technical work
- Week 4: Application in live play + retesting habits

For each week provide:
1. Theme and main objective (1 sentence)
2. Daily schedule Mon–Sun: specific task + estimated time (15–30 min/day)
3. Two recommended resources (book, article, video type, or exercise)
4. Weekly measurable milestone

Write ONLY clean HTML with this exact dark-theme styling (no <html>/<head>/<body> tags):
- Wrap each week in: <div style="background:#1a2744;border-radius:12px;padding:20px;margin-bottom:20px">
- Week title: <h3 style="color:#d4af37;margin:0 0 4px;font-size:1.05rem">
- Subtitle/objective: <p style="color:#94a3b8;font-size:0.85rem;margin:0 0 14px">
- Day labels: <span style="color:#64748b;font-size:0.78rem;font-weight:700;text-transform:uppercase">LUNES</span>
- Task text: <span style="color:#cbd5e1;font-size:0.88rem">
- Resources section: <div style="background:#0f172a;border-radius:8px;padding:12px;margin-top:12px">
- Resources title: <div style="color:#60a5fa;font-size:0.8rem;font-weight:700;margin-bottom:6px">📚 RECURSOS</div>
- Milestone: <div style="background:#1e3a2f;border-left:3px solid #4ade80;padding:10px 14px;border-radius:0 6px 6px 0;margin-top:12px;font-size:0.85rem;color:#4ade80">

POKER TERMINOLOGY: Always use the original English terms. NEVER translate them:
- "board" → always "board" (NEVER "tablero", "mesa", "tabuleiro")
- "call", "raise", "fold", "check", "bet", "all-in", "bluff", "stack", "pot", "flop", "turn", "river", "pre-flop", "3-bet", "c-bet", "range", "equity", "EV" → keep in English always.

Be specific — use the player's actual weak areas. No generic advice. Total output: ~800-1000 words of HTML."""


def _bg_study_plan_generation(job_id, user_id, prompt, api_key):
    import requests as _rq
    db = None
    try:
        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
        resp = _rq.post(
            'https://api.anthropic.com/v1/messages',
            headers={'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
            json={'model': 'claude-sonnet-4-6', 'max_tokens': 8000, 'messages': [{'role': 'user', 'content': prompt}]},
            timeout=300
        )
        resp.raise_for_status()
        plan_html = resp.json()['content'][0]['text']
        db.execute("DELETE FROM study_plans WHERE user_id=? AND id!=?", (user_id, job_id))
        db.execute("UPDATE study_plans SET plan_html=?, status='done', error_msg=NULL WHERE id=?", (plan_html, job_id))
        db.commit()
        print(f"[STUDY] Plan generado para user {user_id}")
    except Exception as e:
        print(f"[STUDY] Error job {job_id}: {e}")
        if db:
            try:
                db.execute("UPDATE study_plans SET status='error', error_msg=? WHERE id=?", (str(e), job_id))
                db.commit()
            except Exception: pass
    finally:
        if db: db.close()


@app.route('/api/study-plan/generate', methods=['POST'])
@require_auth
def generate_study_plan():
    api_key = _get_api_key()
    if not api_key:
        return jsonify({'error': 'Servicio IA no disponible'}), 503
    db = get_db()
    lang = (request.json or {}).get('lang', 'es')

    # Obtener scores de los últimos tests completados
    mental_row = db.execute(
        "SELECT scores_json FROM test_sessions WHERE user_id=? AND completed=1 AND (test_type='mental' OR test_type IS NULL) ORDER BY completed_at DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()
    tech_row = db.execute(
        "SELECT scores_json FROM test_sessions WHERE user_id=? AND completed=1 AND test_type='technical' ORDER BY completed_at DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()

    if not mental_row and not tech_row:
        return jsonify({'error': 'Necesitas completar al menos un test para generar tu plan de estudio.'}), 400

    mental_scores = json.loads(mental_row['scores_json']) if mental_row else {}
    tech_scores   = json.loads(tech_row['scores_json'])   if tech_row   else {}

    mental_overall = round(sum(mental_scores.values()) / len(mental_scores), 1) if mental_scores else None
    tech_overall   = round(sum(tech_scores.values())   / len(tech_scores),   1) if tech_scores   else None

    prompt = _build_study_plan_prompt(g.user_name, mental_scores, tech_scores, lang)

    db.execute("DELETE FROM study_plans WHERE user_id=? AND status='processing'", (g.user_id,))
    job_id = db.execute(
        "INSERT INTO study_plans (user_id, plan_html, mental_overall, technical_overall, status, created_at) VALUES (?,?,?,?,?,?)",
        (g.user_id, None, mental_overall, tech_overall, 'processing', datetime.datetime.utcnow().isoformat())
    ).lastrowid
    db.commit()

    threading.Thread(target=_bg_study_plan_generation, args=(job_id, g.user_id, prompt, api_key), daemon=True).start()
    return jsonify({'job_id': job_id})


@app.route('/api/study-plan/status/<int:job_id>', methods=['GET'])
@require_auth
def study_plan_status(job_id):
    db = get_db()
    row = db.execute("SELECT * FROM study_plans WHERE id=? AND user_id=?", (job_id, g.user_id)).fetchone()
    if not row: return jsonify({'error': 'Job no encontrado'}), 404
    status = row['status'] or 'done'
    result = {'status': status}
    if status == 'done':
        result['plan'] = row['plan_html']
        result['created_at'] = row['created_at']
        result['mental_overall']   = row['mental_overall']
        result['technical_overall'] = row['technical_overall']
    elif status == 'error':
        result['error'] = row['error_msg'] or 'Error desconocido'
    return jsonify(result)


@app.route('/api/study-plan/get', methods=['GET'])
@require_auth
def get_study_plan():
    db = get_db()
    row = db.execute(
        "SELECT * FROM study_plans WHERE user_id=? AND status='done' ORDER BY created_at DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()
    if not row: return jsonify({'plan': None})
    return jsonify({'plan': row['plan_html'], 'created_at': row['created_at'],
                    'mental_overall': row['mental_overall'], 'technical_overall': row['technical_overall']})


# ─── Tracker de Sesiones ──────────────────────────────────────────────────────

@app.route('/api/sessions', methods=['GET'])
@require_auth
def list_sessions():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM poker_sessions WHERE user_id=? ORDER BY date DESC, created_at DESC LIMIT 100",
        (g.user_id,)
    ).fetchall()
    return jsonify({'sessions': [dict(r) for r in rows]})


@app.route('/api/sessions', methods=['POST'])
@require_auth
def add_session():
    d = request.json or {}
    date         = (d.get('date') or '').strip()
    fmt          = (d.get('format') or '').strip()
    stakes       = (d.get('stakes') or '').strip()
    hours        = float(d.get('hours') or 0)
    profit_loss  = float(d.get('profit_loss') or 0)
    mental_state = int(d.get('mental_state') or 5)
    notes        = (d.get('notes') or '').strip()[:500]

    if not date or not fmt or not stakes or hours <= 0:
        return jsonify({'error': 'Completa los campos obligatorios: fecha, formato, nivel y horas.'}), 400
    if not (1 <= mental_state <= 10):
        return jsonify({'error': 'Estado mental debe ser entre 1 y 10'}), 400

    db = get_db()
    sid = db.execute(
        "INSERT INTO poker_sessions (user_id, date, format, stakes, hours, profit_loss, mental_state, notes) VALUES (?,?,?,?,?,?,?,?)",
        (g.user_id, date, fmt, stakes, hours, profit_loss, mental_state, notes)
    ).lastrowid
    db.commit()
    return jsonify({'ok': True, 'id': sid}), 201


@app.route('/api/sessions/<int:sid>', methods=['DELETE'])
@require_auth
def delete_session(sid):
    db = get_db()
    row = db.execute("SELECT id FROM poker_sessions WHERE id=? AND user_id=?", (sid, g.user_id)).fetchone()
    if not row: return jsonify({'error': 'Sesión no encontrada'}), 404
    db.execute("DELETE FROM poker_sessions WHERE id=?", (sid,))
    db.commit()
    return jsonify({'ok': True})


@app.route('/api/sessions/stats', methods=['GET'])
@require_auth
def sessions_stats():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM poker_sessions WHERE user_id=? ORDER BY date ASC",
        (g.user_id,)
    ).fetchall()
    if not rows:
        return jsonify({'stats': None, 'chart': []})

    total_sessions = len(rows)
    total_profit   = sum(r['profit_loss'] for r in rows)
    total_hours    = sum(r['hours'] for r in rows)
    hourly_rate    = round(total_profit / total_hours, 2) if total_hours > 0 else 0
    avg_mental     = round(sum(r['mental_state'] for r in rows) / total_sessions, 1)

    # Mejor y peor formato
    fmt_profit = {}
    for r in rows:
        fmt_profit[r['format']] = fmt_profit.get(r['format'], 0) + r['profit_loss']
    best_format  = max(fmt_profit, key=fmt_profit.get) if fmt_profit else None
    worst_format = min(fmt_profit, key=fmt_profit.get) if len(fmt_profit) > 1 else None

    # Chart: profit acumulado por sesión
    cumulative = 0
    chart = []
    for r in rows:
        cumulative += r['profit_loss']
        chart.append({'date': r['date'], 'profit': round(r['profit_loss'], 2), 'cumulative': round(cumulative, 2)})

    # Sesiones último mes
    month_ago = (datetime.datetime.utcnow() - datetime.timedelta(days=30)).strftime('%Y-%m-%d')
    sessions_30d = sum(1 for r in rows if r['date'] >= month_ago)

    return jsonify({
        'stats': {
            'total_sessions': total_sessions,
            'total_profit':   round(total_profit, 2),
            'total_hours':    round(total_hours, 1),
            'hourly_rate':    hourly_rate,
            'avg_mental':     avg_mental,
            'best_format':    best_format,
            'worst_format':   worst_format,
            'sessions_30d':   sessions_30d,
            'fmt_profit':     {k: round(v, 2) for k, v in fmt_profit.items()},
        },
        'chart': chart
    })


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
