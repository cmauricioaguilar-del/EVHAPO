const COUNTRIES = [
  ['AR','Argentina'],['BO','Bolivia'],['BR','Brasil'],['CL','Chile'],
  ['CO','Colombia'],['CR','Costa Rica'],['CU','Cuba'],['EC','Ecuador'],
  ['ES','España'],['GT','Guatemala'],['HN','Honduras'],['MX','México'],
  ['NI','Nicaragua'],['PA','Panamá'],['PE','Perú'],['PY','Paraguay'],
  ['SV','El Salvador'],['UY','Uruguay'],['VE','Venezuela'],['US','Estados Unidos'],
  ['OTHER','Otro'],
];

function renderRegister() {
  const isPT = I18N.isPT();
  const html = `
    <div class="auth-container">
      <div class="auth-card">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>${isPT ? 'Criar Conta' : 'Crear Cuenta'}</h1>
          <p class="auth-sub">${isPT ? 'Cadastre-se para começar seu diagnóstico' : 'Regístrate para comenzar tu diagnóstico mental'}</p>
        </div>
        <div id="reg-error"></div>
        <div class="form-row">
          <div class="form-group">
            <label>${isPT ? 'Nome' : 'Nombre'}</label>
            <input type="text" id="reg-nombre" placeholder="${isPT ? 'Seu nome' : 'Tu nombre'}" autocomplete="given-name" />
          </div>
          <div class="form-group">
            <label>${isPT ? 'Sobrenome' : 'Apellido'}</label>
            <input type="text" id="reg-apellido" placeholder="${isPT ? 'Seu sobrenome' : 'Tu apellido'}" autocomplete="family-name" />
          </div>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="reg-email" placeholder="tu@email.com" autocomplete="email" />
        </div>
        <div class="form-group">
          <label>${isPT ? 'País' : 'País'}</label>
          <select id="reg-pais">
            <option value="">${isPT ? '-- Selecione seu país --' : '-- Selecciona tu país --'}</option>
            ${COUNTRIES.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${isPT ? 'Senha' : 'Contraseña'}</label>
            <input type="password" id="reg-pass" placeholder="${isPT ? 'Mínimo 6 caracteres' : 'Mínimo 6 caracteres'}" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label>${isPT ? 'Confirmar' : 'Confirmar'}</label>
            <input type="password" id="reg-pass2" placeholder="${isPT ? 'Repita a senha' : 'Repite la contraseña'}" autocomplete="new-password" />
          </div>
        </div>
        <!-- CAPTCHA -->
        <div class="captcha-box" id="reg-captcha-box" onclick="toggleCaptcha('reg')">
          <div class="captcha-left">
            <div class="captcha-checkbox" id="reg-captcha-check"></div>
            <span class="captcha-label">${isPT ? 'Não sou um robô' : 'No soy un robot'}</span>
          </div>
          <div class="captcha-right">
            <span class="captcha-logo">🛡️</span>
            <span class="captcha-brand">reCAPTCHA</span>
            <span class="captcha-links">${isPT ? 'Privacidade · Termos' : 'Privacidad · Términos'}</span>
          </div>
        </div>

        <button class="btn btn-primary btn-block" id="reg-btn" onclick="doRegister()">
          ${isPT ? 'Criar conta e continuar →' : 'Crear cuenta y continuar →'}
        </button>
        <div class="auth-divider">${isPT ? 'ou' : 'o'}</div>
        <p style="text-align:center;font-size:0.9rem;color:var(--text2)">
          ${isPT ? 'Já tem conta?' : '¿Ya tienes cuenta?'}
          <button class="auth-link" onclick="App.go('login')">${isPT ? 'Entrar aqui' : 'Inicia sesión'}</button>
        </p>
        <p style="text-align:center;margin-top:12px">
          <button class="auth-link" onclick="App.go('landing')" style="color:var(--text3);font-size:0.875rem">← ${isPT ? 'Voltar ao início' : 'Volver al inicio'}</button>
        </p>
      </div>
    </div>`;

  document.getElementById('app').innerHTML = `${renderNavbar()}${html}`;
}

async function doRegister() {
  const nombre   = document.getElementById('reg-nombre').value.trim();
  const apellido = document.getElementById('reg-apellido').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const pais     = document.getElementById('reg-pais').value;
  const pass     = document.getElementById('reg-pass').value;
  const pass2    = document.getElementById('reg-pass2').value;
  const errEl    = document.getElementById('reg-error');
  const btn      = document.getElementById('reg-btn');

  const isPT = I18N.isPT();
  errEl.innerHTML = '';
  if (!nombre || !apellido || !email || !pais || !pass) {
    errEl.innerHTML = `<div class="form-error">${isPT ? 'Todos os campos são obrigatórios.' : 'Todos los campos son obligatorios.'}</div>`; return;
  }
  if (!_captchaState['reg']) {
    errEl.innerHTML = `<div class="form-error">${isPT ? 'Por favor confirme que não é um robô.' : 'Por favor confirma que no eres un robot.'}</div>`; return;
  }
  if (pass !== pass2) {
    errEl.innerHTML = `<div class="form-error">${isPT ? 'As senhas não coincidem.' : 'Las contraseñas no coinciden.'}</div>`; return;
  }
  if (pass.length < 6) {
    errEl.innerHTML = `<div class="form-error">${isPT ? 'A senha deve ter pelo menos 6 caracteres.' : 'La contraseña debe tener al menos 6 caracteres.'}</div>`; return;
  }

  btn.disabled = true; btn.textContent = isPT ? 'Criando conta...' : 'Creando cuenta...';
  try {
    await Api.register({ nombre, apellido, email, pais, password: pass });
    App.go('payment');
  } catch (e) {
    if (e.message && e.message.includes('already_paid')) {
      errEl.innerHTML = `<div class="alert alert-info" style="margin-bottom:0">
        ✅ ${isPT ? 'Você já tem uma conta ativa com este email.' : 'Ya tienes una cuenta activa con este email.'}
        <a href="#" onclick="App.go('login')" style="color:var(--accent);font-weight:700">${isPT ? 'Entrar aqui →' : 'Inicia sesión aquí →'}</a>
      </div>`;
    } else {
      errEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    }
    btn.disabled = false; btn.textContent = isPT ? 'Criar conta e continuar →' : 'Crear cuenta y continuar →';
  }
}
