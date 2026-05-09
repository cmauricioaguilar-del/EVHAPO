const App = {
  current: null,

  go(page, arg) {
    this.current = page;
    window.scrollTo(0, 0);
    if (_radarChart) { _radarChart.destroy(); _radarChart = null; }

    switch (page) {
      case 'landing':  renderLanding(); break;
      case 'login':    renderLogin(arg); break;
      case 'register': renderRegister(); break;
      case 'payment':  renderPayment(); break;
      case 'test':     renderTest(); break;
      case 'results':  renderResults(arg); break;
      case 'dashboard': renderDashboard(); break;
      default: renderLanding();
    }

    // Update URL hash without triggering reload
    const hashMap = { landing: '', login: 'login', register: 'register', payment: 'payment', test: 'test', results: 'results', dashboard: 'dashboard' };
    history.replaceState(null, '', '#' + (hashMap[page] || ''));
  },
};

function renderNavbar() {
  const user = Api.currentUser();
  const initials = user ? (user.nombre || 'U')[0].toUpperCase() : '';

  const rightSide = user
    ? `<div class="nav-user">
        <button class="nav-btn" onclick="App.go('dashboard')">📊 Mi Dashboard</button>
        <div class="nav-avatar" title="${user.nombre}" onclick="App.go('dashboard')">${initials}</div>
        <button class="nav-btn" onclick="doLogout()">Salir</button>
      </div>`
    : `<div class="nav-links">
        <button class="nav-btn" onclick="App.go('login')">Iniciar sesión</button>
        <button class="nav-btn primary" onclick="App.go('register')">Comenzar →</button>
      </div>`;

  return `
    <nav class="navbar">
      <div class="nav-brand" onclick="App.go(${user ? "'dashboard'" : "'landing'"})">
        <img src="/icons/mindev-logo.png" alt="MindEV" class="nav-logo">
      </div>
      ${rightSide}
    </nav>`;
}

function doLogout() {
  Api.logout();
  App.go('landing');
}

// Boot
window.addEventListener('load', async () => {
  const params   = new URLSearchParams(window.location.search);
  const mpResult = params.get('mp_result');
  const mpPid    = params.get('pid');
  const mpPayId  = params.get('payment_id');

  // ── Retorno desde MercadoPago ──────────────────────────────────────────────
  if (mpResult) {
    history.replaceState(null, '', '/');
    if (!Api.isLoggedIn()) { App.go('landing'); return; }

    if (mpResult === 'success') {
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
