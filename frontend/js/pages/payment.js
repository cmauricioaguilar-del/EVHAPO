let _selectedMethod = 'demo';

function renderPayment() {
  const user = Api.currentUser();
  if (!user) { App.go('register'); return; }

  const html = `
    <div class="auth-container">
      <div class="auth-card" style="max-width:540px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>Acceder al Diagnóstico</h1>
          <p class="auth-sub">Hola ${user.nombre}. Un último paso para comenzar.</p>
        </div>

        <div class="price-banner" style="padding:20px;margin-bottom:20px">
          <div class="price">USD $9.90</div>
          <div class="price-sub">Pago único · Acceso permanente</div>
        </div>

        <div id="pay-error"></div>

        <h3 style="font-size:0.9rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Método de pago</h3>
        <div class="payment-methods">
          <div class="method-card selected" id="method-demo" onclick="selectMethod('demo')">
            <span class="method-icon">🎮</span>
            <h3>Demo / Prueba</h3>
            <p>Modo de demostración gratuito</p>
          </div>
          <div class="method-card" id="method-mercadopago" onclick="selectMethod('mercadopago')">
            <span class="method-icon">💙</span>
            <h3>Mercado Pago</h3>
            <p>Latinoamérica · Moneda local</p>
          </div>
          <div class="method-card" id="method-stripe" onclick="selectMethod('stripe')">
            <span class="method-icon">💳</span>
            <h3>Tarjeta de Crédito</h3>
            <p>Visa, Mastercard, Amex (Stripe)</p>
          </div>
          <div class="method-card" id="method-paypal" onclick="selectMethod('paypal')">
            <span class="method-icon">🅿️</span>
            <h3>PayPal</h3>
            <p>Cuenta PayPal internacional</p>
          </div>
        </div>

        <div id="stripe-form" style="display:none;margin-bottom:16px">
          <div class="alert alert-info">
            Ingresa los datos de tu tarjeta de crédito de forma segura vía Stripe.
            <br><small>Requiere configurar STRIPE_SECRET_KEY en el servidor.</small>
          </div>
          <div class="form-group">
            <label>Número de tarjeta</label>
            <input type="text" placeholder="4242 4242 4242 4242" maxlength="19" id="card-num" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Vencimiento</label>
              <input type="text" placeholder="MM/AA" maxlength="5" />
            </div>
            <div class="form-group">
              <label>CVV</label>
              <input type="text" placeholder="123" maxlength="4" />
            </div>
          </div>
        </div>

        <div id="demo-note" class="alert alert-warning" style="margin-bottom:16px">
          🎮 <strong>Modo Demo activo:</strong> El test se habilitará sin cargo real. Para producción, configura las credenciales de pago.
        </div>

        <button class="btn btn-primary btn-block btn-lg" id="pay-btn" onclick="doPayment()">
          ♠ Pagar y comenzar el test
        </button>

        <p style="text-align:center;margin-top:16px;font-size:0.8rem;color:var(--text3)">
          🔒 Pago seguro · Tus datos están protegidos · Soporte: evhapo@tiburock.cl
        </p>
      </div>
    </div>`;

  document.getElementById('app').innerHTML = `${renderNavbar()}${html}`;
}

function selectMethod(method) {
  _selectedMethod = method;
  ['demo','mercadopago','stripe','paypal'].forEach(m => {
    document.getElementById(`method-${m}`).classList.toggle('selected', m === method);
  });
  document.getElementById('stripe-form').style.display = method === 'stripe' ? 'block' : 'none';
  document.getElementById('demo-note').style.display = method === 'demo' ? 'block' : 'none';
}

async function doPayment() {
  const btn = document.getElementById('pay-btn');
  const errEl = document.getElementById('pay-error');
  const user = Api.currentUser();
  const pais = JSON.parse(localStorage.getItem('evhapo_user') || '{}').pais || 'US';

  errEl.innerHTML = '';
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  try {
    const result = await Api.createPayment(_selectedMethod, pais);

    if (result.mode === 'demo' || result.session_id) {
      localStorage.setItem('evhapo_session', result.session_id);
      App.go('test');
      return;
    }
    if (result.mode === 'mercadopago' && result.init_point) {
      window.location.href = result.init_point;
      return;
    }
    if (result.mode === 'stripe' && result.client_secret) {
      // In production: use Stripe.js confirmCardPayment
      alert('Integración Stripe: usa stripe.confirmCardPayment con el client_secret. Ver documentación.');
      btn.disabled = false;
      btn.textContent = '♠ Pagar y comenzar el test';
      return;
    }
    throw new Error('Respuesta de pago inesperada');
  } catch (e) {
    errEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    btn.disabled = false;
    btn.textContent = '♠ Pagar y comenzar el test';
  }
}
