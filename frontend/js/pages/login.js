function renderLogin(msg) {
  const html = `
    <div class="auth-container">
      <div class="auth-card">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>Iniciar Sesión</h1>
          <p class="auth-sub">Accede a tus resultados y diagnósticos</p>
        </div>
        ${msg ? `<div class="alert alert-info">${msg}</div>` : ''}
        <div id="login-error"></div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="login-email" placeholder="tu@email.com" autocomplete="email" />
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button class="btn btn-primary btn-block" id="login-btn" onclick="doLogin()">
          Entrar →
        </button>
        <div class="auth-divider">o</div>
        <p style="text-align:center;font-size:0.9rem;color:var(--text2)">
          ¿No tienes cuenta?
          <button class="auth-link" onclick="App.go('register')">Regístrate aquí</button>
        </p>
        <p style="text-align:center;font-size:0.875rem;margin-top:12px;color:var(--text3)">
          <button class="auth-link" onclick="App.go('landing')" style="color:var(--text3);font-size:0.875rem">← Volver al inicio</button>
        </p>
      </div>
    </div>`;

  document.getElementById('app').innerHTML = `${renderNavbar()}${html}`;

  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errEl.innerHTML = '';
  if (!email || !password) {
    errEl.innerHTML = '<div class="form-error">Completa todos los campos.</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Entrando...';
  try {
    await Api.login(email, password);
    App.go('dashboard');
  } catch (e) {
    errEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    btn.disabled = false;
    btn.textContent = 'Entrar →';
  }
}
