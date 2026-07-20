# CLAUDE.md — Contexto del proyecto MinDev (EVHAPO)

## ¿Qué es este proyecto?
**MinDev** es una app web SaaS para jugadores de poker. Ofrece test de habilidades mentales, tracker de sesiones, plan de estudio, workbook, torneos y herramientas de biometría (frecuencia cardíaca).

- **Dominio principal:** https://mindev-ia.com (también mindev-ia.cl)
- **Deploy:** Railway (ver `railway.toml` y `Procfile`)
- **Repo GitHub:** cmauricioaguilar-del/evhapo

---

## Stack tecnológico

### Backend
- **Python / Flask** — `backend/app.py` (archivo único, monolítico)
- **SQLite** — base de datos local en Railway
- **Flask-CORS, Flask-Limiter** — CORS restringido a dominios propios, rate limiting
- **Sentry** — monitoreo de errores (opcional, via env var `SENTRY_DSN`)

### Frontend
- **Vanilla JS + HTML + CSS** — sin frameworks
- **SPA manual** — `frontend/js/app.js` maneja routing y páginas
- **i18n:** español (default), portugués, inglés — `frontend/js/utils/i18n.js`

### App Desktop
- **MinDev Bio** (`mindevbio_desktop/`) — app Electron/Python para biometría HR
- Se distribuye como ejecutable (.exe) compilado con PyInstaller

---

## Estructura de archivos clave

```
backend/
  app.py          ← TODO el backend Flask (monolítico, ~5000+ líneas)
  migrate.py      ← migraciones SQLite
  scoring.py      ← lógica de puntuación del test mental
  biometria/      ← módulo de frecuencia cardíaca (HR server/client)

frontend/
  index.html      ← SPA principal
  css/styles.css  ← estilos globales
  js/
    app.js        ← router principal
    pages/        ← una página por archivo JS
      landing.js, login.js, register.js, dashboard.js,
      test.js, results.js, payment.js, tournament.js,
      sessions.js, workbook.js, study-plan.js, bankroll.js,
      guide.js, mindevbio.js, legal.js,
      admin-users.js, admin-analytics.js, admin-coupons.js,
      admin-referrals.js, admin-retention.js
    data/
      questions.js / questions_pt.js / questions_en.js      ← test mental
      technical_questions.js / _pt / _en                    ← test técnico
    utils/
      api.js      ← llamadas al backend
      i18n.js     ← traducciones
      report.js   ← generación de reportes
      captcha.js
  blog/           ← artículos SEO estáticos en HTML

mindevbio_desktop/
  app.py          ← app desktop biometría
```

---

## Modelo de negocio / Tiers

| Tier | Precio | Descripción |
|------|--------|-------------|
| Free | $0 | Acceso limitado |
| Trial | $0.99 USD | Prueba única por cuenta |
| Pro | $4.90 USD/mes | Suscripción mensual |
| Elite | (pendiente) | Tier superior |

---

## Pagos integrados

- **Stripe** — principal (checkout sessions + webhooks + suscripciones)
- **MercadoPago** — LATAM (PIX Brasil incluido)
- **Paddle** — alternativo
- **Wompi** — Colombia

Variables de entorno necesarias:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUB_PRICE_ID`
- `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`
- `MP_ACCESS_TOKEN`
- `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_KEY`
- `BASE_URL` (https://mindev-ia.com en producción)
- `SENTRY_DSN` (opcional)
- `SMTP_*` (para emails)

---

## Funcionalidades implementadas

- [x] Registro/login con JWT
- [x] Test mental (preguntas ES/PT/EN)
- [x] Test técnico con nota motivacional
- [x] Dashboard de resultados
- [x] Tracker de sesiones de poker (MTT por defecto)
- [x] Exportar estadísticas a Excel (ExcelJS, con colores y negrillas)
- [x] Workbook personal
- [x] Plan de estudio
- [x] Gestión de bankroll
- [x] Torneos
- [x] Blog SEO (ES/PT/EN)
- [x] Admin: usuarios, analytics, cupones, referidos, retención
- [x] Módulo de retención con cron job cada 10 días
- [x] Email de retención HTML profesional con cupón reactivado y pixel de tracking
- [x] Tier prueba $0.99 (Stripe)
- [x] Suscripción mensual $4.90 (Stripe, MercadoPago, Paddle)
- [x] MinDev Bio — app desktop biometría HR
- [x] APK MinDev HR (descarga directa, sin Play Store)
- [x] i18n ES/PT/EN
- [x] CORS restringido, rate limiting, Sentry
- [x] Redirección www → sin www

---

## Convenciones de desarrollo

- El backend es **un solo archivo** `backend/app.py` — no separar en módulos
- El frontend es **vanilla JS** — no agregar frameworks ni npm
- Los commits van en **español** con prefijo `feat:` / `fix:` / `refactor:`
- Deploy automático en Railway al hacer push a `main`
- Las migraciones SQLite se agregan en `backend/migrate.py` y también como strings en la lista de `ALTER TABLE` en `app.py`

---

## Cómo correr localmente

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# La app queda en http://localhost:5000
```

Scripts de inicio rápido: `INICIAR.bat` (Windows) / `INICIAR.ps1` (PowerShell)

---

## Notas importantes

- La base de datos SQLite **no se versiona** — solo existe en Railway y local
- El owner del proyecto es **Mauricio Aguilar** (c.mauricio.aguilar@gmail.com)
- Este archivo CLAUDE.md debe mantenerse actualizado al final de cada sesión importante
