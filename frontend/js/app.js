const App = {
  current: null,
  _lastArg: null,   // guarda el arg del último App.go() para re-render en cambio de idioma

  go(page, arg) {
    this.current = page;
    this._lastArg = arg;
    window.scrollTo(0, 0);
    if (_radarChart) { _radarChart.destroy(); _radarChart = null; }

    switch (page) {
      case 'landing':           renderLanding(); break;
      case 'login':             renderLogin(arg); break;
      case 'register':          renderRegister(); break;
      case 'payment':           renderPayment(); break;
      case 'test':              renderTest(); break;
      case 'results':           renderResults(arg); break;
      case 'dashboard':         renderDashboard(); break;
      case 'admin-referrals':   renderAdminReferrals(); break;
      case 'admin-users':       renderAdminUsers(); break;
      case 'admin-coupons':     renderAdminCoupons(); break;
      case 'admin-analytics':   renderAdminAnalytics(); break;
      case 'study-plan':        renderStudyPlan(); break;
      case 'sessions':          renderSessions(); break;
      case 'bankroll':          renderBankroll(); break;
      default: renderLanding();
    }

    // Update URL hash without triggering reload
    const hashMap = { landing: '', login: 'login', register: 'register', payment: 'payment', test: 'test', results: 'results', dashboard: 'dashboard' };
    history.replaceState(null, '', '#' + (hashMap[page] || ''));
  },
};

function renderCouponBanner() {
  const coupon = JSON.parse(localStorage.getItem('evhapo_coupon') || 'null');
  if (!coupon || !coupon.active) return '';
  const d = coupon.days_remaining;
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();
  const txt = isEN
    ? `⏳ Limited-time access — <strong>${d}</strong> day${d !== 1 ? 's' : ''} remaining`
    : isPT
    ? `⏳ Acesso por tempo limitado — <strong>${d}</strong> dia${d !== 1 ? 's' : ''} restante${d !== 1 ? 's' : ''}`
    : `⏳ Uso por tiempo limitado — <strong>${d}</strong> día${d !== 1 ? 's' : ''} restante${d !== 1 ? 's' : ''}`;
  return `<div style="background:linear-gradient(135deg,#92400e,#b45309);color:#fef3c7;text-align:center;padding:9px 16px;font-size:0.85rem;font-weight:600;letter-spacing:0.01em">${txt}</div>`;
}

function renderNavbar() {
  const user = Api.currentUser();
  const initials = user ? (user.nombre || 'U')[0].toUpperCase() : '';
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();

  // Banderas CSS puras — sin archivos externos, siempre disponibles
  const flagES = `<span style="display:inline-block;flex-shrink:0;width:22px;height:15px;border-radius:2px;background:linear-gradient(to bottom,#c60b1e 25%,#ffc400 25%,#ffc400 75%,#c60b1e 75%)"></span>`;
  const flagBR = `<span style="display:inline-block;flex-shrink:0;width:22px;height:15px;border-radius:2px;background:#009c3b;position:relative;overflow:hidden"><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:10px;background:#FFDF00;clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%)"></span></span>`;
  const flagEN = `<span style="display:inline-block;flex-shrink:0;width:22px;height:15px;border-radius:2px;background:#012169;position:relative;overflow:hidden"><span style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(to bottom right,transparent calc(50% - 1.5px),#fff calc(50% - 1.5px),#fff calc(50% + 1.5px),transparent calc(50% + 1.5px)),linear-gradient(to top right,transparent calc(50% - 1.5px),#fff calc(50% - 1.5px),#fff calc(50% + 1.5px),transparent calc(50% + 1.5px))"></span><span style="position:absolute;top:50%;left:0;transform:translateY(-50%);width:100%;height:20%;background:#fff"></span><span style="position:absolute;top:50%;left:0;transform:translateY(-50%);width:100%;height:12%;background:#C8102E"></span><span style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:20%;height:100%;background:#fff"></span><span style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:12%;height:100%;background:#C8102E"></span></span>`;

  const langActive   = isEN ? 'en' : isPT ? 'pt' : 'es';
  const langToggle = `
    <div style="display:flex;gap:4px;align-items:center;margin-right:8px">
      <button onclick="I18N.set('en')" title="English"
        style="display:flex;align-items:center;gap:5px;background:${isEN ? 'var(--accent)' : 'transparent'};border:2px solid ${isEN ? 'var(--accent)' : 'var(--border)'};border-radius:8px;padding:4px 8px;cursor:pointer;opacity:${isEN ? '1' : '0.6'};transition:all 0.15s">
        ${flagEN}
        <span style="font-size:0.72rem;font-weight:700;color:${isEN ? '#000' : 'var(--text2)'}">EN</span>
      </button>
      <button onclick="I18N.set('es')" title="Español"
        style="display:flex;align-items:center;gap:5px;background:${langActive === 'es' ? 'var(--accent)' : 'transparent'};border:2px solid ${langActive === 'es' ? 'var(--accent)' : 'var(--border)'};border-radius:8px;padding:4px 8px;cursor:pointer;opacity:${langActive === 'es' ? '1' : '0.6'};transition:all 0.15s">
        ${flagES}
        <span style="font-size:0.72rem;font-weight:700;color:${langActive === 'es' ? '#000' : 'var(--text2)'}">ES</span>
      </button>
      <button onclick="I18N.set('pt')" title="Português"
        style="display:flex;align-items:center;gap:5px;background:${isPT ? 'var(--accent)' : 'transparent'};border:2px solid ${isPT ? 'var(--accent)' : 'var(--border)'};border-radius:8px;padding:4px 8px;cursor:pointer;opacity:${isPT ? '1' : '0.6'};transition:all 0.15s">
        ${flagBR}
        <span style="font-size:0.72rem;font-weight:700;color:${isPT ? '#000' : 'var(--text2)'}">PT</span>
      </button>
    </div>`;

  const rightSide = user
    ? `<div class="nav-user">
        ${langToggle}
        <button class="nav-btn" onclick="App.go('dashboard')">📊 ${isEN ? 'My Dashboard' : isPT ? 'Meu Painel' : 'Mi Dashboard'}</button>
        <div class="nav-avatar" title="${user.nombre}" onclick="App.go('dashboard')">${initials}</div>
        <button class="nav-btn" onclick="doLogout()">${isEN ? 'Sign out' : isPT ? 'Sair' : 'Salir'}</button>
      </div>`
    : `<div class="nav-links">
        ${langToggle}
        <a href="/blog/" class="nav-btn" style="text-decoration:none">📚 Blog</a>
        <button class="nav-btn" onclick="App.go('login')">${isEN ? 'Sign in' : isPT ? 'Entrar' : 'Iniciar sesión'}</button>
        <button class="nav-btn primary" onclick="App.go('register')">${isEN ? 'Get started →' : isPT ? 'Começar →' : 'Comenzar →'}</button>
      </div>`;

  return `
    <nav class="navbar">
      <div class="nav-brand" onclick="App.go(${user ? "'dashboard'" : "'landing'"})">
        <div style="overflow:hidden;flex-shrink:0;width:150px;height:150px;border-radius:10px;border:1px solid rgba(212,175,55,0.45);box-shadow:0 0 14px rgba(212,175,55,0.28),0 2px 10px rgba(0,0,0,0.5);background:rgba(10,14,26,0.7)">
          <img src="/icons/mindev-logo.png" alt="MindEV" style="height:150px;width:auto;display:block">
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;gap:3px">
          <div style="font-weight:800;font-size:1.4rem;letter-spacing:2px;background:linear-gradient(135deg,#d4af37,#f0c040);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">MindEV</div>
          <div style="font-size:0.78rem;color:#4DB6AC;font-weight:600">${isEN ? 'Your EV+ starts in your mind.' : isPT ? 'Seu EV+ começa na sua mente.' : 'Tu EV+ empieza en tu mente.'}</div>
          <div style="font-size:0.65rem;color:#d4af37;letter-spacing:0.08em;text-transform:uppercase">${isEN ? 'MENTAL · TECHNICAL · AI' : isPT ? 'MENTAL · TÉCNICO · IA' : 'DIAGNÓSTICO MENTAL · TÉCNICO · IA'}</div>
        </div>
      </div>
      ${rightSide}
    </nav>
    ${renderCouponBanner()}`;
}

function doLogout() {
  Api.logout();
  App.go('landing');
}

// ── Actualiza <title>, <meta description> y <html lang> según idioma activo ──
function _updatePageMeta() {
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();

  const titles = {
    en: 'MindEV-IA | Mental & Technical Test for Poker Players with AI',
    pt: 'MindEV-IA | Teste Mental e Técnico para Jogadores de Poker com IA',
    es: 'MindEV-IA | Test Mental y Técnico para Jugadores de Poker con IA',
  };
  const descs = {
    en: "Discover your real level as a Texas Hold'em player. AI-powered mental + technical test, skills radar and personalized week-by-week improvement plan.",
    pt: "Descubra seu nível real como jogador de Texas Hold'em. Teste mental + técnico com IA, radar de habilidades e plano de melhoria personalizado semana a semana.",
    es: "Descubre tu nivel real como jugador de Texas Hold'em. Test mental + técnico con IA, radar de habilidades y plan de mejora personalizado semana a semana.",
  };
  const lang = isEN ? 'en' : isPT ? 'pt' : 'es';

  document.title = titles[lang];
  document.documentElement.lang = lang;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', descs[lang]);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', titles[lang]);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', descs[lang]);

  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', titles[lang]);

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', descs[lang]);

  // URL canónica con lang param para EN/PT
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', lang === 'es'
      ? 'https://mindev-ia.cl/'
      : `https://mindev-ia.cl/?lang=${lang}`);
  }
}

// Boot
window.addEventListener('load', async () => {
  const params        = new URLSearchParams(window.location.search);

  // ── Detectar ?lang= y aplicarlo antes de cualquier render ──────────────────
  const langParam = params.get('lang');
  if (langParam && ['en', 'es', 'pt'].includes(langParam)) {
    I18N._lang = langParam;
    localStorage.setItem('mindev_lang', langParam);
  }
  _updatePageMeta();
  // ───────────────────────────────────────────────────────────────────────────

  const mpResult      = params.get('mp_result');
  const mpPid         = params.get('pid');
  const mpPayId       = params.get('payment_id');
  const stripeResult  = params.get('stripe_result');
  const stripeSession = params.get('session_id');
  const stripePid     = params.get('pid');
  const paddleResult  = params.get('paddle_result');
  const paddleTxn     = params.get('_ptxn');
  const paddlePid     = params.get('pid');

  // ── Retorno desde Paddle ──────────────────────────────────────────────────
  if (paddleResult) {
    history.replaceState(null, '', '/');
    if (!Api.isLoggedIn()) { App.go('landing'); return; }

    if (paddleResult === 'success') {
      try {
        const res = await Api.post('/api/payment/paddle-verify', {
          payment_id:     parseInt(paddlePid),
          transaction_id: paddleTxn || ''
        });
        App.go(res.ok ? 'dashboard' : 'payment');
      } catch { App.go('payment'); }
    } else if (paddleResult === 'sub_success') {
      try {
        const res = await Api.post('/api/payment/paddle-subscription-verify', {
          transaction_id: paddleTxn || ''
        });
        App.go(res.ok ? 'dashboard' : 'payment');
      } catch { App.go('payment'); }
    } else {
      App.go('payment');
    }
    return;
  }

  // ── Retorno desde Stripe ───────────────────────────────────────────────────
  if (stripeResult) {
    history.replaceState(null, '', '/');
    if (!Api.isLoggedIn()) { App.go('landing'); return; }

    if (stripeResult === 'sub_success') {
      // Suscripción mensual Stripe
      try {
        const res = await Api.post('/api/payment/stripe-subscription-verify', { session_id: stripeSession });
        App.go(res.ok ? 'dashboard' : 'payment');
      } catch { App.go('payment'); }
    } else if (stripeResult === 'success') {
      try {
        const res = await Api.post('/api/payment/stripe-verify', {
          session_id:  stripeSession,
          payment_id:  parseInt(stripePid),
        });
        App.go(res.ok ? 'dashboard' : 'payment');
      } catch { App.go('payment'); }
    } else {
      App.go('payment');
    }
    return;
  }

  // ── Retorno desde MercadoPago ──────────────────────────────────────────────
  if (mpResult) {
    history.replaceState(null, '', '/');
    if (!Api.isLoggedIn()) { App.go('landing'); return; }

    if (mpResult === 'sub_success') {
      // Suscripción mensual MercadoPago
      const user = Api.currentUser();
      const sub  = JSON.parse(localStorage.getItem('evhapo_user') || '{}');
      try {
        const res = await Api.post('/api/payment/mp-subscription-verify', {
          sub_id: sub.mp_subscription_id || ''
        });
        App.go(res.ok ? 'dashboard' : 'payment');
      } catch { App.go('dashboard'); }
    } else if (mpResult === 'success') {
      // Verificar y activar acceso
      try {
        const res = await Api.post('/api/payment/mp-verify', {
          payment_id: parseInt(mpPid),
          mp_payment_id: mpPayId
        });
        App.go(res.ok ? 'dashboard' : 'payment');
      } catch { App.go('payment'); }
    } else if (mpResult === 'pending') {
      alert('⏳ Tu pago está pendiente. Recibirás acceso cuando se confirme.');
      App.go('dashboard');
    } else {
      // failure o cancelación → volver a pagar
      App.go('payment');
    }
    return;
  }

  // ── Navegación normal ──────────────────────────────────────────────────────
  const hash    = location.hash.replace('#', '');
  const pageMap = { login:'login', register:'register', payment:'payment',
                    test:'test', results:'results', dashboard:'dashboard' };

  if (!Api.isLoggedIn()) {
    App.go(pageMap[hash] || 'landing');
    return;
  }

  // Usuario logueado → verificar si tiene pago antes de ir al dashboard
  if (!pageMap[hash] || pageMap[hash] === 'dashboard') {
    try {
      const me = await Api.me();
      if (me.has_payment) {
        App.go('dashboard');
      } else {
        App.go('payment');
      }
    } catch {
      App.go('landing');
    }
    return;
  }

  App.go(pageMap[hash]);
});

window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', '');
  const pageMap = { login: 'login', register: 'register', dashboard: 'dashboard' };
  if (pageMap[hash]) App.go(pageMap[hash]);
});
