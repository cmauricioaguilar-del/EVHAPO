const COUNTRIES = [
  ['AR','Argentina'],['BO','Bolivia'],['BR','Brasil'],['CL','Chile'],
  ['CO','Colombia'],['CR','Costa Rica'],['CU','Cuba'],['EC','Ecuador'],
  ['ES','España'],['GT','Guatemala'],['HN','Honduras'],['MX','México'],
  ['NI','Nicaragua'],['PA','Panamá'],['PE','Perú'],['PY','Paraguay'],
  ['SV','El Salvador'],['UY','Uruguay'],['VE','Venezuela'],['US','Estados Unidos'],
  ['CA','Canada'],['GB','United Kingdom'],['AU','Australia'],['IE','Ireland'],
  ['DE','Germany'],['FR','France'],['IT','Italy'],['NL','Netherlands'],
  ['OTHER','Other / Otro'],
];

const POKER_ROOMS = [
  'PokerStars', 'GGPoker', 'WPT Global', 'ACR', 'Coolbet', '888 Poker', 'Coin Poker', 'Ninguna'
];

function renderRegister() {
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();
  const html = `
    <div class="auth-container">
      <div class="auth-card">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>${isEN ? 'Create Account' : isPT ? 'Criar Conta' : 'Crear Cuenta'}</h1>
          <p class="auth-sub">${isEN ? 'Sign up to start your mental diagnosis' : isPT ? 'Cadastre-se para começar seu diagnóstico' : 'Regístrate para comenzar tu diagnóstico mental'}</p>
        </div>
        <div id="reg-error"></div>
        <div class="form-row">
          <div class="form-group">
            <label>${isEN ? 'First name' : isPT ? 'Nome' : 'Nombre'}</label>
            <input type="text" id="reg-nombre" placeholder="${isEN ? 'Your first name' : isPT ? 'Seu nome' : 'Tu nombre'}" autocomplete="given-name" />
          </div>
          <div class="form-group">
            <label>${isEN ? 'Last name' : isPT ? 'Sobrenome' : 'Apellido'}</label>
            <input type="text" id="reg-apellido" placeholder="${isEN ? 'Your last name' : isPT ? 'Seu sobrenome' : 'Tu apellido'}" autocomplete="family-name" />
          </div>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="reg-email" placeholder="you@email.com" autocomplete="email" />
        </div>
        <div class="form-group">
          <label>${isEN ? 'Country' : isPT ? 'País' : 'País'}</label>
          <select id="reg-pais">
            <option value="">${isEN ? '-- Select your country --' : isPT ? '-- Selecione seu país --' : '-- Selecciona tu país --'}</option>
            ${COUNTRIES.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>${isEN ? 'Preferred Poker Room' : isPT ? 'Sala Preferida' : 'Sala Preferida'} <span style="color:var(--accent)">*</span></label>
          <select id="reg-sala">
            <option value="">${isEN ? '-- Select your room --' : isPT ? '-- Selecione sua sala --' : '-- Selecciona tu sala --'}</option>
            ${POKER_ROOMS.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${isEN ? 'Password' : isPT ? 'Senha' : 'Contraseña'}</label>
            <input type="password" id="reg-pass" placeholder="${isEN ? 'Min. 6 characters' : isPT ? 'Mínimo 6 caracteres' : 'Mínimo 6 caracteres'}" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label>${isEN ? 'Confirm' : isPT ? 'Confirmar' : 'Confirmar'}</label>
            <input type="password" id="reg-pass2" placeholder="${isEN ? 'Repeat password' : isPT ? 'Repita a senha' : 'Repite la contraseña'}" autocomplete="new-password" />
          </div>
        </div>
        <div class="form-group">
          <label style="display:flex;align-items:center;gap:6px">
            ${isEN ? 'Referral Code' : isPT ? 'Código de Referência' : 'Código de Referencia'}
            <span style="font-size:0.78rem;color:var(--text3);font-weight:400">(${isEN ? 'optional' : isPT ? 'opcional' : 'opcional'})</span>
          </label>
          <input type="text" id="reg-referral" placeholder="${isEN ? 'e.g. tiburock' : isPT ? 'Ex: tiburock' : 'Ej: tiburock'}" autocomplete="off" style="text-transform:lowercase" />
          <div id="reg-referral-feedback" style="font-size:0.8rem;margin-top:4px;min-height:16px"></div>
        </div>
        <!-- CAPTCHA -->
        <div class="captcha-box" id="reg-captcha-box" onclick="toggleCaptcha('reg')">
          <div class="captcha-left">
            <div class="captcha-checkbox" id="reg-captcha-check"></div>
            <span class="captcha-label">${isEN ? "I'm not a robot" : isPT ? 'Não sou um robô' : 'No soy un robot'}</span>
          </div>
          <div class="captcha-right">
            <span class="captcha-logo">🛡️</span>
            <span class="captcha-brand">reCAPTCHA</span>
            <span class="captcha-links">${isEN ? 'Privacy · Terms' : isPT ? 'Privacidade · Termos' : 'Privacidad · Términos'}</span>
          </div>
        </div>

        <button class="btn btn-primary btn-block" id="reg-btn" onclick="doRegister()">
          ${isEN ? 'Create account and continue →' : isPT ? 'Criar conta e continuar →' : 'Crear cuenta y continuar →'}
        </button>
        <div class="auth-divider">${isEN ? 'or' : isPT ? 'ou' : 'o'}</div>
        <p style="text-align:center;font-size:0.9rem;color:var(--text2)">
          ${isEN ? 'Already have an account?' : isPT ? 'Já tem conta?' : '¿Ya tienes cuenta?'}
          <button class="auth-link" onclick="App.go('login')">${isEN ? 'Sign in here' : isPT ? 'Entrar aqui' : 'Inicia sesión'}</button>
        </p>
        <p style="text-align:center;margin-top:12px">
          <button class="auth-link" onclick="App.go('landing')" style="color:var(--text3);font-size:0.875rem">← ${isEN ? 'Back to home' : isPT ? 'Voltar ao início' : 'Volver al inicio'}</button>
        </p>
      </div>
    </div>`;

  document.getElementById('app').innerHTML = `${renderNavbar()}${html}`;

  // Referral code real-time validation
  let _referralTimer = null;
  document.getElementById('reg-referral').addEventListener('input', function() {
    clearTimeout(_referralTimer);
    const val = this.value.trim();
    const fb = document.getElementById('reg-referral-feedback');
    if (!val) { fb.innerHTML = ''; return; }
    fb.innerHTML = `<span style="color:var(--text3)">Verificando...</span>`;
    _referralTimer = setTimeout(async () => {
      try {
        const res = await fetch('/api/referral/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: val })
        });
        const d = await res.json();
        if (d.valid) {
          fb.innerHTML = `<span style="color:#4ade80">✓ ${I18N.isEN() ? 'Valid code' : I18N.isPT() ? 'Código válido' : 'Código válido'}</span>`;
        } else {
          fb.innerHTML = `<span style="color:#f87171">✗ ${I18N.isEN() ? 'Code not found' : I18N.isPT() ? 'Código não encontrado' : 'Código no encontrado'}</span>`;
        }
      } catch { fb.innerHTML = ''; }
    }, 600);
  });
}

async function doRegister() {
  const nombre       = document.getElementById('reg-nombre').value.trim();
  const apellido     = document.getElementById('reg-apellido').value.trim();
  const email        = document.getElementById('reg-email').value.trim();
  const pais         = document.getElementById('reg-pais').value;
  const sala         = document.getElementById('reg-sala').value;
  const pass         = document.getElementById('reg-pass').value;
  const pass2        = document.getElementById('reg-pass2').value;
  const referralCode = document.getElementById('reg-referral').value.trim();
  const errEl        = document.getElementById('reg-error');
  const btn          = document.getElementById('reg-btn');

  const isPT = I18N.isPT();
  const isEN = I18N.isEN();
  errEl.innerHTML = '';

  if (!nombre || !apellido || !email || !pais || !pass) {
    errEl.innerHTML = `<div class="form-error">${isEN ? 'All fields are required.' : isPT ? 'Todos os campos são obrigatórios.' : 'Todos los campos son obligatorios.'}</div>`; return;
  }
  if (!sala) {
    errEl.innerHTML = `<div class="form-error">${isEN ? 'Please select your preferred poker room.' : isPT ? 'Selecione sua sala preferida.' : 'Debes seleccionar una sala preferida.'}</div>`; return;
  }
  if (!_captchaState['reg']) {
    errEl.innerHTML = `<div class="form-error">${isEN ? "Please confirm you're not a robot." : isPT ? 'Por favor confirme que não é um robô.' : 'Por favor confirma que no eres un robot.'}</div>`; return;
  }
  if (pass !== pass2) {
    errEl.innerHTML = `<div class="form-error">${isEN ? 'Passwords do not match.' : isPT ? 'As senhas não coincidem.' : 'Las contraseñas no coinciden.'}</div>`; return;
  }
  if (pass.length < 6) {
    errEl.innerHTML = `<div class="form-error">${isEN ? 'Password must be at least 6 characters.' : isPT ? 'A senha deve ter pelo menos 6 caracteres.' : 'La contraseña debe tener al menos 6 caracteres.'}</div>`; return;
  }

  btn.disabled = true; btn.textContent = isEN ? 'Creating account...' : isPT ? 'Criando conta...' : 'Creando cuenta...';
  try {
    const payload = { nombre, apellido, email, pais, sala_preferida: sala, password: pass, idioma: I18N.lang };
    if (referralCode) payload.referral_code = referralCode;
    await Api.register(payload);
    App.go('payment');
  } catch (e) {
    if (e.message && e.message.includes('already_paid')) {
      errEl.innerHTML = `<div class="alert alert-info" style="margin-bottom:0">
        ✅ ${isEN ? 'You already have an active account with this email.' : isPT ? 'Você já tem uma conta ativa com este email.' : 'Ya tienes una cuenta activa con este email.'}
        <a href="#" onclick="App.go('login')" style="color:var(--accent);font-weight:700">${isEN ? 'Sign in here →' : isPT ? 'Entrar aqui →' : 'Inicia sesión aquí →'}</a>
      </div>`;
    } else {
      errEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    }
    btn.disabled = false; btn.textContent = isEN ? 'Create account and continue →' : isPT ? 'Criar conta e continuar →' : 'Crear cuenta y continuar →';
  }
}
