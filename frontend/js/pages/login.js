function renderLogin(msg) {
  const isPT = I18N.isPT();
  const html = `
    <div class="auth-container">
      <div class="auth-card">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>${isPT ? 'Entrar' : 'Iniciar Sesión'}</h1>
          <p class="auth-sub">${isPT ? 'Acesse seus resultados e diagnósticos' : 'Accede a tus resultados y diagnósticos'}</p>
        </div>
        ${msg ? `<div class="alert alert-info">${msg}</div>` : ''}
        <div id="login-error"></div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="login-email" placeholder="tu@email.com" autocomplete="email" />
        </div>
        <div class="form-group">
          <label>${isPT ? 'Senha' : 'Contraseña'}</label>
          <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <div class="captcha-box" id="login-captcha-box" onclick="toggleCaptcha('login')">
          <div class="captcha-left">
            <div class="captcha-checkbox" id="login-captcha-check"></div>
            <span class="captcha-label">${isPT ? 'Não sou um robô' : 'No soy un robot'}</span>
          </div>
          <div class="captcha-right">
            <span class="captcha-logo">🛡️</span>
            <span class="captcha-brand">reCAPTCHA</span>
            <span class="captcha-links">${isPT ? 'Privacidade · Termos' : 'Privacidad · Términos'}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-block" id="login-btn" onclick="doLogin()">
          ${isPT ? 'Entrar →' : 'Entrar →'}
        </button>
        <div style="text-align:center;margin-top:12px">
          <button class="auth-link" onclick="renderForgotPassword()" style="font-size:0.85rem;color:var(--text2)">
            ${isPT ? 'Esqueceu sua senha?' : '¿Olvidaste tu contraseña?'}
          </button>
        </div>
        <div class="auth-divider">${isPT ? 'ou' : 'o'}</div>
        <p style="text-align:center;font-size:0.9rem;color:var(--text2)">
          ${isPT ? 'Não tem conta?' : '¿No tienes cuenta?'}
          <button class="auth-link" onclick="App.go('register')">${isPT ? 'Cadastre-se aqui' : 'Regístrate aquí'}</button>
        </p>
        <p style="text-align:center;font-size:0.875rem;margin-top:12px;color:var(--text3)">
          <button class="auth-link" onclick="App.go('landing')" style="color:var(--text3);font-size:0.875rem">← ${isPT ? 'Voltar ao início' : 'Volver al inicio'}</button>
        </p>
      </div>
    </div>`;

  document.getElementById('app').innerHTML = `${renderNavbar()}${html}`;

  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
}

function renderForgotPassword() {
  const html = `
    <div class="auth-container">
      <div class="auth-card">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">🔑</div>
          <h1>Recuperar Contraseña</h1>
          <p class="auth-sub">Te enviaremos una contraseña temporal a tu correo</p>
        </div>
        <div id="forgot-msg"></div>
        <div class="form-group">
          <label>Email de tu cuenta</label>
          <input type="email" id="forgot-email" placeholder="tu@email.com" autocomplete="email" />
        </div>
        <button class="btn btn-primary btn-block" id="forgot-btn" onclick="doForgotPassword()">
          📧 Enviar contraseña temporal
        </button>
        <p style="text-align:center;font-size:0.875rem;margin-top:16px;color:var(--text3)">
          <button class="auth-link" onclick="renderLogin()" style="color:var(--text3)">← Volver al login</button>
        </p>
      </div>
    </div>`;

  document.getElementById('app').innerHTML = `${renderNavbar()}${html}`;

  document.getElementById('forgot-email').addEventListener('keydown', e => {
    if (e.key === 'Enter') doForgotPassword();
  });
}

async function doForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  const msgEl = document.getElementById('forgot-msg');
  const btn   = document.getElementById('forgot-btn');

  if (!email) {
    msgEl.innerHTML = '<div class="form-error">Ingresa tu email.</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const res = await Api.post('/api/password-reset', { email });
    msgEl.innerHTML = `<div class="form-success">✅ ${res.message}</div>`;
    btn.textContent = '✓ Enviado';
  } catch (e) {
    msgEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    btn.disabled = false;
    btn.textContent = '📧 Enviar contraseña temporal';
  }
}

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  errEl.innerHTML = '';
  if (!email || !password) {
    errEl.innerHTML = '<div class="form-error">Completa todos los campos.</div>';
    return;
  }
  if (!_captchaState['login']) {
    errEl.innerHTML = '<div class="form-error">Por favor confirma que no eres un robot.</div>';
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
