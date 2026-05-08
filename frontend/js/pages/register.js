const COUNTRIES = [
  ['AR','Argentina'],['BO','Bolivia'],['BR','Brasil'],['CL','Chile'],
  ['CO','Colombia'],['CR','Costa Rica'],['CU','Cuba'],['EC','Ecuador'],
  ['ES','España'],['GT','Guatemala'],['HN','Honduras'],['MX','México'],
  ['NI','Nicaragua'],['PA','Panamá'],['PE','Perú'],['PY','Paraguay'],
  ['SV','El Salvador'],['UY','Uruguay'],['VE','Venezuela'],['US','Estados Unidos'],
  ['OTHER','Otro'],
];

function renderRegister() {
  const html = `
    <div class="auth-container">
      <div class="auth-card">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>Crear Cuenta</h1>
          <p class="auth-sub">Regístrate para comenzar tu diagnóstico mental</p>
        </div>
        <div id="reg-error"></div>
        <div class="form-row">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="reg-nombre" placeholder="Tu nombre" autocomplete="given-name" />
          </div>
          <div class="form-group">
            <label>Apellido</label>
            <input type="text" id="reg-apellido" placeholder="Tu apellido" autocomplete="family-name" />
          </div>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="reg-email" placeholder="tu@email.com" autocomplete="email" />
        </div>
        <div class="form-group">
          <label>País</label>
          <select id="reg-pais">
            <option value="">-- Selecciona tu país --</option>
            ${COUNTRIES.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="reg-pass" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label>Confirmar</label>
            <input type="password" id="reg-pass2" placeholder="Repite la contraseña" autocomplete="new-password" />
          </div>
        </div>
        <button class="btn btn-primary btn-block" id="reg-btn" onclick="doRegister()">
          Crear cuenta y continuar →
        </button>
        <div class="auth-divider">o</div>
        <p style="text-align:center;font-size:0.9rem;color:var(--text2)">
          ¿Ya tienes cuenta?
          <button class="auth-link" onclick="App.go('login')">Inicia sesión</button>
        </p>
        <p style="text-align:center;margin-top:12px">
          <button class="auth-link" onclick="App.go('landing')" style="color:var(--text3);font-size:0.875rem">← Volver al inicio</button>
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

  errEl.innerHTML = '';
  if (!nombre || !apellido || !email || !pais || !pass) {
    errEl.innerHTML = '<div class="form-error">Todos los campos son obligatorios.</div>'; return;
  }
  if (pass !== pass2) {
    errEl.innerHTML = '<div class="form-error">Las contraseñas no coinciden.</div>'; return;
  }
  if (pass.length < 6) {
    errEl.innerHTML = '<div class="form-error">La contraseña debe tener al menos 6 caracteres.</div>'; return;
  }

  btn.disabled = true; btn.textContent = 'Creando cuenta...';
  try {
    await Api.register({ nombre, apellido, email, pais, password: pass });
    App.go('payment');
  } catch (e) {
    errEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    btn.disabled = false; btn.textContent = 'Crear cuenta y continuar →';
  }
}
