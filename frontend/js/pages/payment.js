let _selectedMethod = 'mercadopago';
let _mpConfigLoaded  = false;

// ─── Renderizado ──────────────────────────────────────────────────────────────
async function renderPayment() {
  const user = Api.currentUser();
  if (!user) { App.go('register'); return; }

  const pais = (JSON.parse(localStorage.getItem('evhapo_user') || '{}').pais || 'CL').toUpperCase();
  const isLatam = ['CL','AR','MX','CO','PE','UY','BR'].includes(pais);
  _selectedMethod = isLatam ? 'mercadopago' : 'stripe';

  // Precio en moneda local
  const priceMap = {
    CL: '$9.500 CLP', AR: '$9.000 ARS', MX: '$170 MXN',
    CO: '$40.000 COP', PE: 'S/37 PEN', UY: '$390 UYU', BR: 'R$50 BRL'
  };
  const localPrice = priceMap[pais] || 'USD $9.90';

  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div class="auth-container">
      <div class="auth-card" style="max-width:540px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>Acceder al Diagnóstico</h1>
          <p class="auth-sub">Hola ${user.nombre}. Un último paso para comenzar.</p>
        </div>

        <div class="price-banner" style="padding:20px;margin-bottom:20px">
          <div class="price">${localPrice}</div>
          <div class="price-sub">Pago único · Acceso permanente · Test Mental + Técnico</div>
        </div>

        <div id="pay-error"></div>

        <h3 style="font-size:0.9rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Método de pago</h3>
        <div class="payment-methods">
          <div class="method-card ${isLatam ? 'selected' : ''}" id="method-mercadopago" onclick="selectMethod('mercadopago')">
            <span class="method-icon">💙</span>
            <h3>Mercado Pago</h3>
            <p>Débito · Crédito · Transferencia</p>
          </div>
          <div class="method-card ${!isLatam ? 'selected' : ''}" id="method-stripe" onclick="selectMethod('stripe')">
            <span class="method-icon">💳</span>
            <h3>Tarjeta Internacional</h3>
            <p>Visa, Mastercard, Amex</p>
          </div>
          <div class="method-card" id="method-demo" onclick="selectMethod('demo')">
            <span class="method-icon">🎮</span>
            <h3>Demo</h3>
            <p>Sin costo real</p>
          </div>
        </div>

        <div id="mp-info" class="alert alert-info" style="margin-bottom:16px;${isLatam ? '' : 'display:none'}">
          💙 Serás redirigido a <strong>Mercado Pago</strong> para completar el pago de forma segura.
          Aceptamos débito, crédito y transferencia bancaria.
        </div>

        <div id="demo-note" class="alert alert-warning" style="margin-bottom:16px;display:none">
          🎮 <strong>Modo Demo:</strong> El test se habilitará sin cargo real.
        </div>

        <button class="btn btn-primary btn-block btn-lg" id="pay-btn" onclick="doPayment()">
          ♠ Pagar y comenzar el test
        </button>

        <p style="text-align:center;margin-top:16px;font-size:0.8rem;color:var(--text3)">
          🔒 Pago seguro · Soporte: evhapo@tiburock.cl
        </p>
      </div>
    </div>`;
}

function selectMethod(method) {
  _selectedMethod = method;
  ['demo','mercadopago','stripe'].forEach(m => {
    document.getElementById(`method-${m}`)?.classList.toggle('selected', m === method);
  });
  document.getElementById('mp-info').style.display   = method === 'mercadopago' ? 'block' : 'none';
  document.getElementById('demo-note').style.display = method === 'demo' ? 'block' : 'none';
}

async function doPayment() {
  const btn     = document.getElementById('pay-btn');
  const errEl   = document.getElementById('pay-error');
  const pais = (JSON.parse(localStorage.getItem('evhapo_user') || '{}').pais || 'CL').toUpperCase();

  errEl.innerHTML = '';
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  try {
    const result = await Api.post('/api/payment/create', {
      method: _selectedMethod,
      pais: pais
    });

    if (result.mode === 'demo') {
      // Demo: pago aprobado → ir al dashboard
      App.go('dashboard');
      return;
    }

    if (result.mode === 'mercadopago' && result.init_point) {
      // Redirigir a MercadoPago
      window.location.href = result.init_point;
      return;
    }

    if (result.mode === 'stripe' && result.client_secret) {
      errEl.innerHTML = `<div class="alert alert-info">Integración Stripe en configuración. Usa Mercado Pago por ahora.</div>`;
      btn.disabled = false;
      btn.textContent = '♠ Pagar y comenzar el test';
      return;
    }

    throw new Error(result.error || 'Respuesta inesperada del servidor');
  } catch (e) {
    errEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    btn.disabled = false;
    btn.textContent = '♠ Pagar y comenzar el test';
  }
}
