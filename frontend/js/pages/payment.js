let _selectedMethod = 'mercadopago';
let _selectedPlan   = 'unique';   // 'unique' | 'subscription'

// ─── Renderizado ──────────────────────────────────────────────────────────────
async function renderPayment() {
  const user = Api.currentUser();
  if (!user) { App.go('register'); return; }

  const pais    = (JSON.parse(localStorage.getItem('evhapo_user') || '{}').pais || 'CL').toUpperCase();
  const isLatam = ['CL','AR','MX','CO','PE','UY','BR'].includes(pais);
  _selectedMethod = isLatam ? 'mercadopago' : 'stripe';

  const priceMap = {
    CL: { unique: '$9.500 CLP', sub: '$4.750 CLP' },
    AR: { unique: '$9.000 ARS', sub: '$4.500 ARS' },
    MX: { unique: '$170 MXN',   sub: '$85 MXN'    },
    CO: { unique: '$40.000 COP',sub: '$20.000 COP' },
    PE: { unique: 'S/37 PEN',   sub: 'S/18.50 PEN' },
    UY: { unique: '$390 UYU',   sub: '$195 UYU'    },
    BR: { unique: 'R$50 BRL',   sub: 'R$25 BRL'    },
  };
  const prices     = priceMap[pais] || { unique: 'USD $9.90', sub: 'USD $4.90' };
  const isPT       = I18N.isPT();

  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div class="auth-container">
      <div class="auth-card" style="max-width:560px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>${isPT ? 'Escolha seu plano' : 'Elige tu plan'}</h1>
          <p class="auth-sub">${isPT ? `Olá ${user.nombre}. Um último passo.` : `Hola ${user.nombre}. Un último paso.`}</p>
        </div>

        <!-- ── Selector de plan ────────────────────────────────────────── -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">

          <!-- Plan Único -->
          <div id="plan-unique" onclick="selectPlan('unique')" style="
            border:2px solid var(--accent);border-radius:12px;padding:16px 14px;cursor:pointer;
            background:rgba(212,175,55,0.08);transition:all 0.15s;position:relative">
            <div style="font-size:0.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">
              ${isPT ? 'Pagamento Único' : 'Pago Único'}
            </div>
            <div style="font-size:1.5rem;font-weight:900;color:var(--accent);line-height:1">${prices.unique}</div>
            <div style="font-size:0.75rem;color:var(--text3);margin-top:4px">${isPT ? 'acesso permanente' : 'acceso permanente'}</div>
            <div id="plan-unique-check" style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:#000;font-weight:800">✓</div>
          </div>

          <!-- Plan Mensual -->
          <div id="plan-subscription" onclick="selectPlan('subscription')" style="
            border:2px solid var(--border);border-radius:12px;padding:16px 14px;cursor:pointer;
            background:var(--card);transition:all 0.15s;position:relative">
            <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);
              background:linear-gradient(135deg,#818cf8,#6366f1);color:#fff;font-size:0.65rem;
              font-weight:800;padding:2px 10px;border-radius:20px;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em">
              ${isPT ? '🔥 Mais popular' : '🔥 Más popular'}
            </div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">
              ${isPT ? 'Assinatura Mensal' : 'Suscripción Mensual'}
            </div>
            <div style="font-size:1.5rem;font-weight:900;color:#818cf8;line-height:1">${prices.sub}</div>
            <div style="font-size:0.75rem;color:var(--text3);margin-top:4px">${isPT ? 'por mês · cancela quando quiser' : 'al mes · cancela cuando quieras'}</div>
            <div id="plan-subscription-check" style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:var(--text3);font-weight:800;opacity:0.4">✓</div>
          </div>

        </div>

        <!-- Comparación de planes -->
        <div id="plan-features" style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:0.82rem;color:var(--text2)">
          ${_renderPlanFeatures('unique', isPT)}
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
            ? '💙 Você será redirecionado para o <strong>Mercado Pago</strong> para concluir o pagamento com segurança.'
            : '💙 Serás redirigido a <strong>Mercado Pago</strong> para completar el pago de forma segura.'}
        </div>
        <div id="stripe-info" class="alert alert-info" style="margin-bottom:16px;${!isLatam ? '' : 'display:none'}">
          ${isPT
            ? '💳 Você será redirecionado para o checkout seguro do <strong>Stripe</strong>.'
            : '💳 Serás redirigido al checkout seguro de <strong>Stripe</strong>.'}
        </div>

        <button class="btn btn-primary btn-block btn-lg" id="pay-btn" onclick="doPayment()">
          ♠ ${isPT ? 'Pagar e começar' : 'Pagar y comenzar'}
        </button>

        <p style="text-align:center;margin-top:16px;font-size:0.8rem;color:var(--text3)">
          🔒 ${isPT ? 'Pagamento seguro · Suporte: evhapo@tiburock.cl' : 'Pago seguro · Soporte: evhapo@tiburock.cl'}
        </p>
      </div>
    </div>`;
}

function _renderPlanFeatures(plan, isPT) {
  if (plan === 'unique') {
    return isPT
      ? `<strong style="color:var(--text1)">Pagamento único — acesso permanente</strong><br>
         ✓ Testes Mental + Técnico ilimitados &nbsp;·&nbsp; ✓ Perfil IA &nbsp;·&nbsp; ✓ Plano de Estudo &nbsp;·&nbsp; ✓ Análise de Mãos &nbsp;·&nbsp; ✓ Tracker + Bankroll`
      : `<strong style="color:var(--text1)">Pago único — acceso permanente</strong><br>
         ✓ Tests Mental + Técnico ilimitados &nbsp;·&nbsp; ✓ Perfil IA &nbsp;·&nbsp; ✓ Plan de Estudio &nbsp;·&nbsp; ✓ Análisis de Manos &nbsp;·&nbsp; ✓ Tracker + Bankroll`;
  }
  return isPT
    ? `<strong style="color:#818cf8">Assinatura — tudo incluído, cancele quando quiser</strong><br>
       ✓ Tudo do plano único &nbsp;·&nbsp; ✓ Acesso enquanto ativo &nbsp;·&nbsp; ✓ Cobrança automática mensal &nbsp;·&nbsp; <span style="color:#fbbf24">★ Metade do preço</span>`
    : `<strong style="color:#818cf8">Suscripción — todo incluido, cancela cuando quieras</strong><br>
       ✓ Todo lo del plan único &nbsp;·&nbsp; ✓ Acceso mientras activo &nbsp;·&nbsp; ✓ Cobro automático mensual &nbsp;·&nbsp; <span style="color:#fbbf24">★ La mitad del precio</span>`;
}

function selectPlan(plan) {
  _selectedPlan = plan;
  const isUnique = plan === 'unique';

  // Estilo plan único
  const cardU  = document.getElementById('plan-unique');
  const checkU = document.getElementById('plan-unique-check');
  if (cardU) {
    cardU.style.borderColor = isUnique ? 'var(--accent)' : 'var(--border)';
    cardU.style.background  = isUnique ? 'rgba(212,175,55,0.08)' : 'var(--card)';
  }
  if (checkU) checkU.style.opacity = isUnique ? '1' : '0.3';

  // Estilo plan mensual
  const cardS  = document.getElementById('plan-subscription');
  const checkS = document.getElementById('plan-subscription-check');
  if (cardS) {
    cardS.style.borderColor = !isUnique ? '#818cf8' : 'var(--border)';
    cardS.style.background  = !isUnique ? 'rgba(129,140,248,0.08)' : 'var(--card)';
  }
  if (checkS) {
    checkS.style.background = !isUnique ? '#818cf8' : 'var(--border)';
    checkS.style.opacity    = !isUnique ? '1' : '0.4';
    checkS.style.color      = !isUnique ? '#000' : 'var(--text3)';
  }

  // Actualizar features
  const featEl = document.getElementById('plan-features');
  if (featEl) featEl.innerHTML = _renderPlanFeatures(plan, I18N.isPT());
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
  const code  = (document.getElementById('coupon-input')?.value || '').trim().toUpperCase();
  const msgEl = document.getElementById('coupon-msg');
  const btn   = document.getElementById('coupon-apply-btn');
  const isPT  = I18N.isPT();

  if (code.length !== 6) {
    msgEl.innerHTML = `<span style="color:#ef4444;font-size:0.85rem">
      ${isPT ? 'O código deve ter exatamente 6 caracteres.' : 'El código debe tener exactamente 6 caracteres.'}
    </span>`;
    return;
  }
  btn.disabled    = true;
  btn.textContent = isPT ? 'Verificando...' : 'Verificando...';
  msgEl.innerHTML = '';

  try {
    const result = await Api.post('/api/coupon/apply', { code });
    if (result.ok) {
      await Api.me();
      msgEl.innerHTML = `<span style="color:#4ade80;font-size:0.9rem;font-weight:600">
        ✓ ${isPT ? `Cupom ativado! ${result.days} dias de acesso.` : `¡Cupón activado! ${result.days} días de acceso.`}
      </span>`;
      setTimeout(() => App.go('dashboard'), 1500);
    }
  } catch (e) {
    msgEl.innerHTML = `<span style="color:#ef4444;font-size:0.85rem">${e.message}</span>`;
    btn.disabled    = false;
    btn.textContent = isPT ? 'Aplicar' : 'Aplicar';
  }
}

async function doPayment() {
  const btn   = document.getElementById('pay-btn');
  const errEl = document.getElementById('pay-error');
  const pais  = (JSON.parse(localStorage.getItem('evhapo_user') || '{}').pais || 'CL').toUpperCase();
  const isPT  = I18N.isPT();

  errEl.innerHTML = '';
  btn.disabled    = true;
  btn.textContent = isPT ? 'Processando...' : 'Procesando...';

  try {
    const endpoint = _selectedPlan === 'subscription'
      ? '/api/payment/create-subscription'
      : '/api/payment/create';

    const result = await Api.post(endpoint, { method: _selectedMethod, pais });

    if (result.mode === 'demo') { App.go('dashboard'); return; }

    if (result.checkout_url || result.init_point) {
      window.location.href = result.checkout_url || result.init_point;
      return;
    }

    throw new Error(result.error || (isPT ? 'Resposta inesperada' : 'Respuesta inesperada'));
  } catch (e) {
    errEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    btn.disabled    = false;
    btn.textContent = `♠ ${isPT ? 'Pagar e começar' : 'Pagar y comenzar'}`;
  }
}
