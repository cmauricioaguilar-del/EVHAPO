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
window.addEventListener('load', () => {
  // Si viene de retorno de MercadoPago, payment.js lo maneja en su IIFE
  const params = new URLSearchParams(window.location.search);
  if (params.get('mp_result') && Api.isLoggedIn()) {
    App.go('dashboard'); // Pantalla de espera mientras se verifica
    return;
  }

  const hash = location.hash.replace('#', '');
  const pageMap = { login: 'login', register: 'register', payment: 'payment', test: 'test', results: 'results', dashboard: 'dashboard' };
  const page = pageMap[hash] || (Api.isLoggedIn() ? 'dashboard' : 'landing');
  App.go(page);
});

window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', '');
  const pageMap = { login: 'login', register: 'register', dashboard: 'dashboard' };
  if (pageMap[hash]) App.go(pageMap[hash]);
});
