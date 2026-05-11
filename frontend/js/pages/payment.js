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

  const isPT = I18N.isPT();
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div class="auth-container">
      <div class="auth-card" style="max-width:540px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>${isPT ? 'Acessar o Diagnóstico' : 'Acceder al Diagnóstico'}</h1>
          <p class="auth-sub">${isPT ? `Olá ${user.nombre}. Um último passo para começar.` : `Hola ${user.nombre}. Un último paso para comenzar.`}</p>
        </div>

        <div class="price-banner" style="padding:20px;margin-bottom:20px">
          <div class="price">${localPrice}</div>
          <div class="price-sub">${isPT ? 'Pagamento único · Acesso permanente · Teste Mental + Técnico' : 'Pago único · Acceso permanente · Test Mental + Técnico'}</div>
        </div>

        <!-- Cupón -->
        <div style="margin-bottom:16px;text-align:center">
          <button onclick="toggleCouponSection()"
            style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.9rem;padding:4px 0;text-decoration:underline;text-underline-offset:3px">
            🎟️ ${isPT ? 'Tenho Cupom' : 'Tengo Cupón'}
          </button>
        </div>

        <div id="coupon-section" style="display:none;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.3);border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 10px;font-size:0.88rem;color:var(--text2);font-weight:600">
            ${isPT ? 'Código de cupom (6 caracteres)' : 'Código de cupón (6 caracteres)'}
          </p>
          <div style="display:flex;gap:8px">
            <input type="text" id="coupon-input" maxlength="6"
              placeholder="${isPT ? 'Ex: AB12CD' : 'Ej: AB12CD'}"
              oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')"
              style="flex:1;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:1.1rem;font-family:monospace;letter-spacing:3px;text-transform:uppercase;text-align:center" />
            <button onclick="applyCoupon()" id="coupon-apply-btn"
              style="background:var(--accent);color:#000;border:none;border-radius:8px;padding:10px 20px;font-weight:700;cursor:pointer;font-size:0.9rem;white-space:nowrap">
              ${isPT ? 'Aplicar' : 'Aplicar'}
            </button>
          </div>
          <div id="coupon-msg" style="margin-top:8px;min-height:20px"></div>
        </div>

        <div id="pay-error"></div>

        <h3 style="font-size:0.9rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">${isPT ? 'Método de pagamento' : 'Método de pago'}</h3>
        <div class="payment-methods">
          <div class="method-card ${isLatam ? 'selected' : ''}" id="method-mercadopago" onclick="selectMethod('mercadopago')">
            <span class="method-icon">💙</span>
            <h3>Mercado Pago</h3>
            <p>${isPT ? 'Débito · Crédito · Transferência' : 'Débito · Crédito · Transferencia'}</p>
          </div>
          <div class="method-card ${!isLatam ? 'selected' : ''}" id="method-stripe" onclick="selectMethod('stripe')">
            <span class="method-icon">💳</span>
            <h3>${isPT ? 'Cartão Internacional' : 'Tarjeta Internacional'}</h3>
            <p>Visa, Mastercard, Amex</p>
          </div>
        </div>

        <div id="mp-info" class="alert alert-info" style="margin-bottom:16px;${isLatam ? '' : 'display:none'}">
          ${isPT
            ? '💙 Você será redirecionado para o <strong>Mercado Pago</strong> para concluir o pagamento com segurança. Aceitamos débito, crédito e transferência bancária.'
            : '💙 Serás redirigido a <strong>Mercado Pago</strong> para completar el pago de forma segura. Aceptamos débito, crédito y transferencia bancaria.'}
        </div>

        <div id="stripe-info" class="alert alert-info" style="margin-bottom:16px;${!isLatam ? '' : 'display:none'}">
          ${isPT
            ? '💳 Você será redirecionado para o checkout seguro do <strong>Stripe</strong>. Aceitamos Visa, Mastercard, Amex e Apple/Google Pay.'
            : '💳 Serás redirigido al checkout seguro de <strong>Stripe</strong>. Aceptamos Visa, Mastercard, Amex y Apple/Google Pay.'}
        </div>


        <button class="btn btn-primary btn-block btn-lg" id="pay-btn" onclick="doPayment()">
          ♠ ${isPT ? 'Pagar e começar o teste' : 'Pagar y comenzar el test'}
        </button>

        <p style="text-align:center;margin-top:16px;font-size:0.8rem;color:var(--text3)">
          🔒 ${isPT ? 'Pagamento seguro · Suporte: evhapo@tiburock.cl' : 'Pago seguro · Soporte: evhapo@tiburock.cl'}
        </p>
      </div>
    </div>`;
}

function selectMethod(method) {
  _selectedMethod = method;
  ['mercadopago','stripe'].forEach(m => {
    document.getElementById(`method-${m}`)?.classList.toggle('selected', m === method);
  });
  document.getElementById('mp-info').style.display     = method === 'mercadopago' ? 'block' : 'none';
  document.getElementById('stripe-info').style.display = method === 'stripe'      ? 'block' : 'none';
}

function toggleCouponSection() {
  const sec = document.getElementById('coupon-section');
  if (sec) sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
}

async function applyCoupon() {
  const code = (document.getElementById('coupon-input')?.value || '').trim().toUpperCase();
  const msgEl  = document.getElementById('coupon-msg');
  const btn    = document.getElementById('coupon-apply-btn');
  const isPT   = I18N.isPT();

  if (code.length !== 6) {
    msgEl.innerHTML = `<span style="color:#ef4444;font-size:0.85rem">
      ${isPT ? 'O código deve ter exatamente 6 caracteres.' : 'El código debe tener exactamente 6 caracteres.'}
    </span>`;
    return;
  }

  btn.disabled = true;
  btn.textContent = isPT ? 'Verificando...' : 'Verificando...';
  msgEl.innerHTML = '';

  try {
    const result = await Api.post('/api/coupon/apply', { code });
    if (result.ok) {
      // Actualizar localStorage con la info del cupón
      await Api.me();
      msgEl.innerHTML = `<span style="color:#4ade80;font-size:0.9rem;font-weight:600">
        ✓ ${isPT ? `Cupom ativado! ${result.days} dias de acesso.` : `¡Cupón activado! ${result.days} días de acceso.`}
      </span>`;
      setTimeout(() => App.go('dashboard'), 1500);
    }
  } catch (e) {
    msgEl.innerHTML = `<span style="color:#ef4444;font-size:0.85rem">${e.message}</span>`;
    btn.disabled = false;
    btn.textContent = isPT ? 'Aplicar' : 'Aplicar';
  }
}

async function doPayment() {
  const btn     = document.getElementById('pay-btn');
  const errEl   = document.getElementById('pay-error');
  const pais = (JSON.parse(localStorage.getItem('evhapo_user') || '{}').pais || 'CL').toUpperCase();

  const isPT = I18N.isPT();
  errEl.innerHTML = '';
  btn.disabled = true;
  btn.textContent = isPT ? 'Processando...' : 'Procesando...';

  try {
    const result = await Api.post('/api/payment/create', {
      method: _selectedMethod,
      pais: pais
    });

    if (result.mode === 'demo') {
      App.go('dashboard');
      return;
    }

    if (result.mode === 'mercadopago' && result.init_point) {
      window.location.href = result.init_point;
      return;
    }

    if (result.mode === 'stripe' && result.checkout_url) {
      // Redirect al checkout hosted de Stripe (igual que MercadoPago con init_point)
      window.location.href = result.checkout_url;
      return;
    }

    throw new Error(result.error || (isPT ? 'Resposta inesperada do servidor' : 'Respuesta inesperada del servidor'));
  } catch (e) {
    errEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    btn.disabled = false;
    btn.textContent = `♠ ${isPT ? 'Pagar e começar o teste' : 'Pagar y comenzar el test'}`;
  }
}
