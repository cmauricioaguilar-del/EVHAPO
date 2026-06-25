let _selectedMethod = 'mercadopago';
let _selectedPlan   = 'trial';   // 'trial' | 'subscription' | 'semi' | 'annual'
let _pixPollingActive = false;    // flag para detener polling si el usuario navega

// ─── Renderizado ──────────────────────────────────────────────────────────────
async function renderPayment() {
  const user = Api.currentUser();
  if (!user) { App.go('register'); return; }

  // ── Detectar retorno desde PIX pendiente ──────────────────────────────────
  const _pendingPix = JSON.parse(localStorage.getItem('evhapo_pending_pix') || 'null');
  if (_pendingPix && (Date.now() - _pendingPix.created_at) < 2 * 60 * 60 * 1000) {
    _startPixPolling(_pendingPix.payment_id);
    return;
  }
  // ─────────────────────────────────────────────────────────────────────────

  const pais    = (JSON.parse(localStorage.getItem('evhapo_user') || '{}').pais || 'CL').toUpperCase();
  const isLatam = ['CL','AR','MX','CO','PE','UY','BR'].includes(pais);
  const isCO    = pais === 'CO';
  const isBR    = pais === 'BR';
  _selectedMethod = isCO ? 'wompi_nequi' : isBR ? 'mercadopago_pix' : isLatam ? 'mercadopago' : 'paddle';

  const priceMap = {
    CL: { unique: '$9.500 CLP', sub: '$4.750 CLP' },
    AR: { unique: '$9.000 ARS', sub: '$4.500 ARS' },
    MX: { unique: '$170 MXN',   sub: '$85 MXN'    },
    CO: { unique: '$40.000 COP',sub: '$20.000 COP' },
    PE: { unique: 'S/37 PEN',   sub: 'S/18.50 PEN' },
    UY: { unique: '$390 UYU',   sub: '$195 UYU'    },
    BR: { unique: 'R$50 BRL',   sub: 'R$25 BRL'    },
  };
  const prices = priceMap[pais] || { unique: 'USD $9.90', sub: 'USD $4.90' };
  const isPT   = I18N.isPT();
  const isEN   = I18N.isEN();

  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div class="auth-container">
      <div class="auth-card" style="max-width:560px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:2.5rem;color:var(--accent)">♠</div>
          <h1>${isEN ? 'Choose your plan' : isPT ? 'Escolha seu plano' : 'Elige tu plan'}</h1>
          <p class="auth-sub">${isEN ? `Hi ${user.nombre}. One last step.` : isPT ? `Olá ${user.nombre}. Um último passo.` : `Hola ${user.nombre}. Un último paso.`}</p>
        </div>

        <!-- ── Selector de 4 planes ───────────────────────────────────── -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">

          <!-- Trial $0.99 -->
          <div id="plan-trial" onclick="selectPlan('trial')" style="
            border:2px solid #22c55e;border-radius:12px;padding:14px 12px;cursor:pointer;
            background:rgba(34,197,94,0.08);transition:all 0.15s;position:relative">
            <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);
              background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:0.6rem;
              font-weight:800;padding:2px 10px;border-radius:20px;white-space:nowrap;text-transform:uppercase">
              🔓 ${isEN ? 'Try first' : isPT ? 'Experimente' : 'Prueba primero'}
            </div>
            <div style="font-size:0.68rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;margin-top:4px">
              ${isEN ? 'Trial · 2 weeks' : isPT ? 'Teste · 2 semanas' : 'Prueba · 2 semanas'}
            </div>
            <div style="font-size:1.5rem;font-weight:900;color:#22c55e;line-height:1">$0.99</div>
            <div style="font-size:0.68rem;color:var(--text3);margin-top:2px">USD · ${isEN ? 'one time' : isPT ? 'uma vez' : 'única vez'}</div>
            <div id="plan-trial-check" style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:#fff;font-weight:800">✓</div>
          </div>

          <!-- Mensual $4.90 -->
          <div id="plan-subscription" onclick="selectPlan('subscription')" style="
            border:2px solid var(--border);border-radius:12px;padding:14px 12px;cursor:pointer;
            background:var(--card);transition:all 0.15s;position:relative">
            <div style="font-size:0.68rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">
              ${isEN ? 'Monthly' : isPT ? 'Mensal' : 'Mensual'}
            </div>
            <div style="font-size:1.5rem;font-weight:900;color:#818cf8;line-height:1">$4.90</div>
            <div style="font-size:0.68rem;color:var(--text3);margin-top:2px">USD/${isEN ? 'mo' : isPT ? 'mês' : 'mes'}</div>
            <div id="plan-subscription-check" style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:var(--text3);font-weight:800;opacity:0.3">✓</div>
          </div>

          <!-- Semestral $19.90 -->
          <div id="plan-semi" onclick="selectPlan('semi')" style="
            border:2px solid var(--border);border-radius:12px;padding:14px 12px;cursor:pointer;
            background:var(--card);transition:all 0.15s;position:relative">
            <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);
              background:linear-gradient(135deg,#4DB6AC,#00897B);color:#fff;font-size:0.6rem;
              font-weight:800;padding:2px 10px;border-radius:20px;white-space:nowrap;text-transform:uppercase">
              💰 ${isEN ? 'Save 32%' : isPT ? '-32%' : '-32%'}
            </div>
            <div style="font-size:0.68rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;margin-top:4px">
              ${isEN ? '6 months' : isPT ? '6 meses' : '6 meses'}
            </div>
            <div style="font-size:1.5rem;font-weight:900;color:#4DB6AC;line-height:1">$19.90</div>
            <div style="font-size:0.68rem;color:var(--text3);margin-top:2px">USD · ~$3.32/${isEN ? 'mo' : isPT ? 'mês' : 'mes'}</div>
            <div id="plan-semi-check" style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:var(--text3);font-weight:800;opacity:0.3">✓</div>
          </div>

          <!-- Anual $29.90 -->
          <div id="plan-annual" onclick="selectPlan('annual')" style="
            border:2px solid var(--border);border-radius:12px;padding:14px 12px;cursor:pointer;
            background:var(--card);transition:all 0.15s;position:relative">
            <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);
              background:linear-gradient(135deg,#d4af37,#b8860b);color:#000;font-size:0.6rem;
              font-weight:800;padding:2px 10px;border-radius:20px;white-space:nowrap;text-transform:uppercase">
              🏆 ${isEN ? 'Best value' : isPT ? 'Melhor custo' : 'Mejor valor'}
            </div>
            <div style="font-size:0.68rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;margin-top:4px">
              ${isEN ? 'Annual' : isPT ? 'Anual' : 'Anual'}
            </div>
            <div style="font-size:1.5rem;font-weight:900;color:var(--accent);line-height:1">$29.90</div>
            <div style="font-size:0.68rem;color:var(--text3);margin-top:2px">USD · ~$2.49/${isEN ? 'mo' : isPT ? 'mês' : 'mes'}</div>
            <div id="plan-annual-check" style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:var(--text3);font-weight:800;opacity:0.3">✓</div>
          </div>

        </div>

        <!-- Detalle del plan seleccionado -->
        <div id="plan-features" style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:0.82rem;color:var(--text2)">
          ${_renderPlanFeatures('trial', isPT, isEN)}
        </div>

        <!-- Cupón -->
        <div style="margin-bottom:16px;text-align:center">
          <button onclick="toggleCouponSection()"
            style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.15rem;font-weight:700;padding:4px 0;text-decoration:underline;text-underline-offset:3px">
            🎟️ ${isEN ? 'I have a Coupon' : isPT ? 'Tenho Cupom' : 'Tengo Cupón'}
          </button>
        </div>

        <div id="coupon-section" style="display:none;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.3);border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 10px;font-size:0.88rem;color:var(--text2);font-weight:600">
            ${isEN ? 'Coupon code (6 characters)' : isPT ? 'Código de cupom (6 caracteres)' : 'Código de cupón (6 caracteres)'}
          </p>
          <div style="display:flex;gap:8px">
            <input type="text" id="coupon-input" maxlength="6"
              placeholder="${isEN ? 'e.g. AB12CD' : isPT ? 'Ex: AB12CD' : 'Ej: AB12CD'}"
              oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')"
              style="flex:1;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:1.1rem;font-family:monospace;letter-spacing:3px;text-transform:uppercase;text-align:center" />
            <button onclick="applyCoupon()" id="coupon-apply-btn"
              style="background:var(--accent);color:#000;border:none;border-radius:8px;padding:10px 20px;font-weight:700;cursor:pointer;font-size:0.9rem;white-space:nowrap">
              ${isEN ? 'Apply' : isPT ? 'Aplicar' : 'Aplicar'}
            </button>
          </div>
          <div id="coupon-msg" style="margin-top:8px;min-height:20px"></div>
        </div>

        <div id="pay-error"></div>

        <!-- Métodos de pago (oculto en plan trial — usa solo Stripe) -->
        <div id="payment-methods-section">
        <h3 style="font-size:0.9rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">
          ${isEN ? 'Payment method' : isPT ? 'Método de pagamento' : 'Método de pago'}
        </h3>

        ${isBR ? `
        <div class="payment-methods">
          <div class="method-card selected" id="method-mercadopago_pix" onclick="selectMethod('mercadopago_pix')" style="position:relative">
            <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#32BCAD,#1e9e90);color:#fff;font-size:0.6rem;font-weight:800;padding:2px 8px;border-radius:20px;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em">
              ${isEN ? 'Recommended' : isPT ? 'Recomendado' : 'Recomendado'}
            </div>
            <span class="method-icon">⚡</span>
            <h3 style="color:#32BCAD;font-weight:900">PIX</h3>
            <p>${isEN ? 'Instant · 24h · Free' : isPT ? 'Instantâneo · 24h · Grátis' : 'Instantáneo · 24h · Gratis'}</p>
          </div>
          <div class="method-card" id="method-mercadopago" onclick="selectMethod('mercadopago')">
            <span class="method-icon">💳</span>
            <h3>${isEN ? 'Card' : isPT ? 'Cartão' : 'Tarjeta'}</h3>
            <p>${isEN ? 'Credit · Debit' : isPT ? 'Crédito · Débito' : 'Crédito · Débito'}</p>
          </div>
        </div>` : isCO ? `
        <div class="payment-methods">
          <div class="method-card selected" id="method-wompi_nequi" onclick="selectMethod('wompi_nequi')" style="position:relative">
            <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#160C45,#DA0081);color:#fff;font-size:0.6rem;font-weight:800;padding:2px 8px;border-radius:20px;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em">
              ${isEN ? 'For Colombia' : isPT ? 'Para Colômbia' : 'Para Colombia'}
            </div>
            <span class="method-icon">📱</span>
            <h3 style="color:#DA0081;font-weight:900">Nequi</h3>
            <p>${isEN ? 'Instant payment from your app' : isPT ? 'Pagamento instantâneo pelo app' : 'Pago instantáneo desde tu app'}</p>
          </div>
          <div class="method-card" id="method-wompi" onclick="selectMethod('wompi')">
            <span class="method-icon">🏦</span>
            <h3>${isEN ? 'Other methods' : isPT ? 'Outros métodos' : 'Otros métodos'}</h3>
            <p>PSE · ${isEN ? 'Card' : isPT ? 'Cartão' : 'Tarjeta'} · Bancolombia</p>
          </div>
        </div>` : `
        <div class="payment-methods">
          <div class="method-card ${isLatam ? 'selected' : ''}" id="method-mercadopago" onclick="selectMethod('mercadopago')">
            <span class="method-icon">💙</span>
            <h3>Mercado Pago</h3>
            <p>${isEN ? 'Debit · Credit · Transfer' : isPT ? 'Débito · Crédito · Transferência' : 'Débito · Crédito · Transferencia'}</p>
          </div>
          <div class="method-card ${!isLatam ? 'selected' : ''}" id="method-paddle" onclick="selectMethod('paddle')">
            <span class="method-icon">💳</span>
            <h3>${isEN ? 'International Card' : isPT ? 'Cartão Internacional' : 'Tarjeta Internacional'}</h3>
            <p>Visa · Mastercard · Amex</p>
          </div>
        </div>`}

        <div id="mercadopago_pix-info" class="alert alert-info" style="margin-bottom:16px;background:rgba(50,188,173,0.08);border:1px solid rgba(50,188,173,0.3);${isBR ? '' : 'display:none'}">
          ⚡ ${isEN
            ? 'You\'ll receive a <strong>PIX</strong> QR code to scan and confirm the payment instantly. Available 24/7, no extra cost.'
            : (isPT || isBR)
            ? 'Você receberá um QR code <strong style="color:#32BCAD">PIX</strong> para escanear e confirmar o pagamento na hora. Disponível 24h, sem custo adicional.'
            : 'Recibirás un QR code <strong style="color:#32BCAD">PIX</strong> para escanear y confirmar el pago al instante. Disponible 24h, sin costo adicional.'}
        </div>
        <div id="wompi_nequi-info" class="alert alert-info" style="margin-bottom:16px;background:rgba(218,0,129,0.08);border:1px solid rgba(218,0,129,0.3);${isCO ? '' : 'display:none'}">
          📱 ${isEN
            ? 'You\'ll receive a push notification in your <strong>Nequi</strong> app to confirm the payment in seconds. Processed by Wompi (Bancolombia).'
            : isPT
            ? 'Você receberá uma notificação no seu app <strong>Nequi</strong> para confirmar o pagamento em segundos. Processado pela Wompi (Bancolombia).'
            : 'Recibirás una notificación en tu app <strong style="color:#DA0081">Nequi</strong> para confirmar el pago en segundos. Procesado por Wompi (Bancolombia).'}
        </div>
        <div id="wompi-info" class="alert alert-info" style="margin-bottom:16px;display:none">
          🏦 ${isEN
            ? 'You\'ll be redirected to <strong>Wompi</strong> to choose from PSE, card, Bancolombia and more.'
            : isPT
            ? 'Você será redirecionado para a <strong>Wompi</strong> para escolher entre PSE, cartão, Bancolombia e outros.'
            : 'Serás redirigido a <strong>Wompi</strong> para elegir entre PSE, tarjeta, Bancolombia y más.'}
        </div>
        <div id="mp-info" class="alert alert-info" style="margin-bottom:16px;${isLatam && !isCO ? '' : 'display:none'}">
          ${isEN
            ? '💙 You will be redirected to <strong>Mercado Pago</strong> to complete your payment securely. We accept Visa, Mastercard, debit and bank transfer.'
            : isPT
            ? '💙 Você será redirecionado para o <strong>Mercado Pago</strong> para concluir o pagamento com segurança. Aceitamos Visa, Mastercard, débito e transferência.'
            : '💙 Serás redirigido a <strong>Mercado Pago</strong> para completar el pago de forma segura. Aceptamos Visa, Mastercard, débito y transferencia.'}
        </div>
        <div id="paddle-info" class="alert alert-info" style="margin-bottom:16px;${!isLatam ? '' : 'display:none'}">
          ${isEN
            ? '💳 You will be redirected to our secure international checkout. Accepts cards from any country.'
            : isPT
            ? '💳 Você será redirecionado ao checkout seguro internacional. Aceita cartões de qualquer país.'
            : '💳 Serás redirigido al checkout seguro internacional. Acepta tarjetas de cualquier país.'}
        </div>

        </div><!-- /payment-methods-section -->

        <!-- Nota para plan trial -->
        <div id="trial-note" style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:0.82rem;color:var(--text2)">
          🔒 ${isEN
            ? 'Trial payment processed securely via Stripe. One-time use per account.'
            : isPT
            ? 'Pagamento do teste processado com segurança via Stripe. Uso único por conta.'
            : 'Pago de prueba procesado de forma segura via Stripe. Uso único por cuenta.'}
        </div>

        <button class="btn btn-primary btn-block btn-lg" id="pay-btn" onclick="doPayment()">
          ♠ ${isEN ? 'Try for $0.99 →' : isPT ? 'Testar por $0.99 →' : 'Probar por $0.99 →'}
        </button>

        <p style="text-align:center;margin-top:16px;font-size:0.8rem;color:var(--text3)">
          🔒 ${isEN ? '100% secure payment' : isPT ? 'Pagamento 100% seguro' : 'Pago 100% seguro'}
        </p>
      </div>
    </div>`;

  // Inicializar estado visual: trial seleccionado por defecto
  document.getElementById('payment-methods-section').style.display = 'none';
  document.getElementById('trial-note').style.display = 'block';

  if (typeof _pwaUpdateInstallBtn === 'function') _pwaUpdateInstallBtn();
}

function _renderPlanFeatures(plan, isPT, isEN) {
  if (plan === 'trial') {
    return isEN
      ? `<strong style="color:#22c55e">Trial · 2 weeks · one-time use</strong><br>
         ✓ 1 mental test &nbsp;·&nbsp; ✓ 1 technical test &nbsp;·&nbsp; ✓ 1 AI profile &nbsp;·&nbsp; ✓ 3 tournaments analyzed<br>
         <span style="color:var(--text3)">✗ Study plan (available in paid plans)</span>`
      : isPT
      ? `<strong style="color:#22c55e">Teste · 2 semanas · uso único</strong><br>
         ✓ 1 teste mental &nbsp;·&nbsp; ✓ 1 teste técnico &nbsp;·&nbsp; ✓ 1 perfil IA &nbsp;·&nbsp; ✓ 3 torneios analisados<br>
         <span style="color:var(--text3)">✗ Plano de estudo (disponível nos planos pagos)</span>`
      : `<strong style="color:#22c55e">Prueba · 2 semanas · uso único por cuenta</strong><br>
         ✓ 1 test mental &nbsp;·&nbsp; ✓ 1 test técnico &nbsp;·&nbsp; ✓ 1 perfil IA &nbsp;·&nbsp; ✓ 3 torneos analizados<br>
         <span style="color:var(--text3)">✗ Plan de estudio (disponible en planes pagos)</span>`;
  }
  if (plan === 'subscription') {
    return isEN
      ? `<strong style="color:#818cf8">Monthly — everything included, cancel anytime</strong><br>
         ✓ Unlimited tests &nbsp;·&nbsp; ✓ AI profile &nbsp;·&nbsp; ✓ Study plan &nbsp;·&nbsp; ✓ Unlimited tournaments &nbsp;·&nbsp; ✓ Tracker + Bankroll`
      : isPT
      ? `<strong style="color:#818cf8">Mensal — tudo incluído, cancele quando quiser</strong><br>
         ✓ Testes ilimitados &nbsp;·&nbsp; ✓ Perfil IA &nbsp;·&nbsp; ✓ Plano de estudo &nbsp;·&nbsp; ✓ Torneios ilimitados &nbsp;·&nbsp; ✓ Tracker + Bankroll`
      : `<strong style="color:#818cf8">Mensual — todo incluido, cancela cuando quieras</strong><br>
         ✓ Tests ilimitados &nbsp;·&nbsp; ✓ Perfil IA &nbsp;·&nbsp; ✓ Plan de estudio &nbsp;·&nbsp; ✓ Torneos ilimitados &nbsp;·&nbsp; ✓ Tracker + Bankroll`;
  }
  if (plan === 'semi') {
    return isEN
      ? `<strong style="color:#4DB6AC">6 months — save 32% vs monthly</strong><br>
         ✓ Everything in Monthly &nbsp;·&nbsp; ✓ 6 months access &nbsp;·&nbsp; ✓ PDF report &nbsp;·&nbsp; ✓ Priority support`
      : isPT
      ? `<strong style="color:#4DB6AC">6 meses — economize 32% vs mensal</strong><br>
         ✓ Tudo do Mensal &nbsp;·&nbsp; ✓ 6 meses de acesso &nbsp;·&nbsp; ✓ Relatório PDF &nbsp;·&nbsp; ✓ Suporte prioritário`
      : `<strong style="color:#4DB6AC">6 meses — ahorra 32% vs mensual</strong><br>
         ✓ Todo lo del Mensual &nbsp;·&nbsp; ✓ 6 meses de acceso &nbsp;·&nbsp; ✓ Informe PDF &nbsp;·&nbsp; ✓ Soporte prioritario`;
  }
  // annual
  return isEN
    ? `<strong style="color:var(--accent)">Annual — best value, save 49%</strong><br>
       ✓ Everything in Monthly &nbsp;·&nbsp; ✓ 12 months access &nbsp;·&nbsp; ✓ PDF report &nbsp;·&nbsp; ✓ Priority support &nbsp;·&nbsp; ✓ Locked price forever`
    : isPT
    ? `<strong style="color:var(--accent)">Anual — melhor custo, economize 49%</strong><br>
       ✓ Tudo do Mensal &nbsp;·&nbsp; ✓ 12 meses de acesso &nbsp;·&nbsp; ✓ Relatório PDF &nbsp;·&nbsp; ✓ Suporte prioritário &nbsp;·&nbsp; ✓ Preço fixo para sempre`
    : `<strong style="color:var(--accent)">Anual — mejor valor, ahorra 49%</strong><br>
       ✓ Todo lo del Mensual &nbsp;·&nbsp; ✓ 12 meses de acceso &nbsp;·&nbsp; ✓ Informe PDF &nbsp;·&nbsp; ✓ Soporte prioritario &nbsp;·&nbsp; ✓ Precio fijo para siempre`;
}

function selectPlan(plan) {
  _selectedPlan = plan;

  const configs = {
    trial:        { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',     checkColor: '#22c55e',    checkText: '#fff' },
    subscription: { color: '#818cf8', bg: 'rgba(129,140,248,0.08)',   checkColor: '#818cf8',    checkText: '#fff' },
    semi:         { color: '#4DB6AC', bg: 'rgba(77,182,172,0.08)',    checkColor: '#4DB6AC',    checkText: '#fff' },
    annual:       { color: 'var(--accent)', bg: 'rgba(212,175,55,0.08)', checkColor: 'var(--accent)', checkText: '#000' },
  };

  ['trial', 'subscription', 'semi', 'annual'].forEach(p => {
    const card  = document.getElementById(`plan-${p}`);
    const check = document.getElementById(`plan-${p}-check`);
    const cfg   = configs[p];
    const active = p === plan;
    if (card) {
      card.style.borderColor = active ? cfg.color : 'var(--border)';
      card.style.background  = active ? cfg.bg    : 'var(--card)';
    }
    if (check) {
      check.style.background = active ? cfg.checkColor : 'var(--border)';
      check.style.color      = active ? cfg.checkText  : 'var(--text3)';
      check.style.opacity    = active ? '1' : '0.3';
    }
  });

  const featEl = document.getElementById('plan-features');
  if (featEl) featEl.innerHTML = _renderPlanFeatures(plan, I18N.isPT(), I18N.isEN());

  // El trial usa solo Stripe — ocultar selector de métodos
  const methodsEl = document.getElementById('payment-methods-section');
  const trialNote = document.getElementById('trial-note');
  if (methodsEl) methodsEl.style.display = plan === 'trial' ? 'none' : 'block';
  if (trialNote) trialNote.style.display  = plan === 'trial' ? 'block' : 'none';

  const btnEl = document.getElementById('pay-btn');
  const isPT = I18N.isPT(), isEN = I18N.isEN();
  if (btnEl) {
    if (plan === 'trial') {
      btnEl.textContent = isEN ? '♠ Try for $0.99 →' : isPT ? '♠ Testar por $0.99 →' : '♠ Probar por $0.99 →';
    } else {
      btnEl.textContent = isEN ? '♠ Pay and start' : isPT ? '♠ Pagar e começar' : '♠ Pagar y comenzar';
    }
  }
}

function selectMethod(method) {
  _selectedMethod = method;
  ['mercadopago','mercadopago_pix','paddle','wompi','wompi_nequi'].forEach(m => {
    document.getElementById(`method-${m}`)?.classList.toggle('selected', m === method);
  });
  ['mercadopago','mercadopago_pix','paddle','wompi','wompi_nequi'].forEach(m => {
    const el = document.getElementById(`${m}-info`);
    if (el) el.style.display = m === method ? 'block' : 'none';
  });
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
  const isEN  = I18N.isEN();

  if (code.length !== 6) {
    msgEl.innerHTML = `<span style="color:#ef4444;font-size:0.85rem">
      ${isEN ? 'The code must be exactly 6 characters.' : isPT ? 'O código deve ter exatamente 6 caracteres.' : 'El código debe tener exactamente 6 caracteres.'}
    </span>`;
    return;
  }
  btn.disabled    = true;
  btn.textContent = 'Verificando...';
  msgEl.innerHTML = '';

  try {
    const result = await Api.post('/api/coupon/apply', { code });
    if (result.ok) {
      await Api.me();
      msgEl.innerHTML = `<span style="color:#4ade80;font-size:0.9rem;font-weight:600">
        ✓ ${isEN ? `Coupon activated! ${result.days} days of access.` : isPT ? `Cupom ativado! ${result.days} dias de acesso.` : `¡Cupón activado! ${result.days} días de acceso.`}
      </span>`;
      setTimeout(() => App.go('dashboard'), 1500);
    }
  } catch (e) {
    msgEl.innerHTML = `<span style="color:#ef4444;font-size:0.85rem">${e.message}</span>`;
    btn.disabled    = false;
    btn.textContent = isEN ? 'Apply' : isPT ? 'Aplicar' : 'Aplicar';
  }
}

async function doPayment() {
  const btn   = document.getElementById('pay-btn');
  const errEl = document.getElementById('pay-error');
  const pais  = (JSON.parse(localStorage.getItem('evhapo_user') || '{}').pais || 'CL').toUpperCase();
  const isPT  = I18N.isPT();
  const isEN  = I18N.isEN();

  errEl.innerHTML = '';
  btn.disabled    = true;
  btn.textContent = isEN ? 'Processing...' : isPT ? 'Processando...' : 'Procesando...';

  try {
    // ── Plan trial $0.99 — siempre Stripe ──────────────────────────────────
    if (_selectedPlan === 'trial') {
      const result = await Api.post('/api/payment/create-trial', {});
      if (result.error === 'trial_used') {
        errEl.innerHTML = `<div class="form-error">${
          isEN ? 'You have already used your trial. Choose a paid plan.' :
          isPT ? 'Você já usou seu teste. Escolha um plano pago.' :
                 'Ya usaste tu prueba. Elige un plan pago.'
        }</div>`;
        btn.disabled    = false;
        btn.textContent = `♠ ${isEN ? 'Try for $0.99 →' : isPT ? 'Testar por $0.99 →' : 'Probar por $0.99 →'}`;
        return;
      }
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }
      throw new Error(result.error || 'Error al crear checkout');
    }

    // ── Planes de suscripción ───────────────────────────────────────────────
    const endpoint = (_selectedPlan === 'subscription' || _selectedPlan === 'semi' || _selectedPlan === 'annual')
      ? '/api/payment/create-subscription'
      : '/api/payment/create';

    const result = await Api.post(endpoint, {
      method: _selectedMethod,
      pais,
      plan: _selectedPlan,  // backend puede usar esto para el monto correcto
    });

    if (result.mode === 'demo') { App.go('dashboard'); return; }

    if (result.checkout_url || result.init_point) {
      if (_selectedMethod === 'mercadopago_pix' && result.payment_id) {
        localStorage.setItem('evhapo_pending_pix', JSON.stringify({
          payment_id: result.payment_id,
          created_at: Date.now()
        }));
      }
      window.location.href = result.checkout_url || result.init_point;
      return;
    }

    throw new Error(result.error || (isEN ? 'Unexpected response' : isPT ? 'Resposta inesperada' : 'Respuesta inesperada'));
  } catch (e) {
    errEl.innerHTML = `<div class="form-error">${e.message}</div>`;
    btn.disabled    = false;
    btn.textContent = _selectedPlan === 'trial'
      ? `♠ ${isEN ? 'Try for $0.99 →' : isPT ? 'Testar por $0.99 →' : 'Probar por $0.99 →'}`
      : `♠ ${isEN ? 'Pay and start' : isPT ? 'Pagar e começar' : 'Pagar y comenzar'}`;
  }
}

// ─── PIX Polling — espera confirmación asíncrona del banco ────────────────────
function _startPixPolling(payment_id) {
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();
  _pixPollingActive = true;

  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div class="auth-container">
      <div class="auth-card" style="max-width:460px;text-align:center">
        <div style="font-size:3.5rem;margin-bottom:8px">⚡</div>
        <h2 style="color:#32BCAD;margin-bottom:8px">
          ${isPT ? 'Aguardando confirmação do PIX' : isEN ? 'Waiting for PIX confirmation' : 'Esperando confirmación PIX'}
        </h2>
        <p style="color:var(--text2);font-size:0.92rem;margin-bottom:24px">
          ${isPT
            ? 'Seu pagamento está sendo processado. Assim que o banco confirmar, você será redirecionado automaticamente.'
            : isEN
            ? 'Your payment is being processed. Once the bank confirms, you\'ll be redirected automatically.'
            : 'Tu pago está siendo procesado. En cuanto el banco confirme, serás redirigido automáticamente.'}
        </p>

        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:24px">
          <div style="width:10px;height:10px;border-radius:50%;background:#32BCAD;animation:pixPulse 1.2s ease-in-out infinite"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#32BCAD;animation:pixPulse 1.2s ease-in-out infinite 0.4s"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#32BCAD;animation:pixPulse 1.2s ease-in-out infinite 0.8s"></div>
        </div>
        <style>
          @keyframes pixPulse {
            0%,100% { opacity:0.3; transform:scale(0.8); }
            50%      { opacity:1;   transform:scale(1.2); }
          }
        </style>

        <div id="pix-poll-status" style="color:var(--text3);font-size:0.82rem;margin-bottom:20px"></div>

        <button onclick="cancelPixWait()"
          style="background:none;border:1px solid var(--border);color:var(--text3);cursor:pointer;
                 font-size:0.82rem;padding:8px 18px;border-radius:8px;margin-top:4px">
          ${isPT ? 'Cancelar e tentar novamente' : isEN ? 'Cancel and try again' : 'Cancelar y volver al pago'}
        </button>
      </div>
    </div>`;

  let attempts = 0;
  const MAX_ATTEMPTS = 120; // 10 minutos (120 × 5 seg)

  const poll = async () => {
    if (!_pixPollingActive) return;
    attempts++;
    const statusEl = document.getElementById('pix-poll-status');

    try {
      const result = await Api.post('/api/payment/mp-verify', { payment_id });
      if (result && result.ok && result.session_id) {
        _pixPollingActive = false;
        localStorage.removeItem('evhapo_pending_pix');
        if (statusEl) statusEl.innerHTML = `<span style="color:#4ade80;font-weight:700">
          ✅ ${isPT ? 'Pagamento confirmado! Redirecionando...' : isEN ? 'Payment confirmed! Redirecting...' : '¡Pago confirmado! Redirigiendo...'}
        </span>`;
        setTimeout(() => App.go('test', { session_id: result.session_id, test_type: result.test_type || 'mental' }), 1200);
        return;
      }
    } catch (_) { /* red error — seguir intentando */ }

    if (attempts >= MAX_ATTEMPTS) {
      _pixPollingActive = false;
      if (statusEl) statusEl.innerHTML = `<span style="color:#fbbf24;font-size:0.85rem">
        ${isPT
          ? '⏱ Tempo limite atingido. Verifique seu email — o acesso pode já estar ativo.'
          : isEN
          ? '⏱ Timeout reached. Check your email — access may already be active.'
          : '⏱ Tiempo límite alcanzado. Revisa tu email — el acceso puede ya estar activo.'}
      </span>`;
      return;
    }

    if (statusEl) statusEl.textContent = isPT
      ? `Verificando com o banco... (${attempts}/${MAX_ATTEMPTS})`
      : isEN
      ? `Checking with bank... (${attempts}/${MAX_ATTEMPTS})`
      : `Verificando con el banco... (${attempts}/${MAX_ATTEMPTS})`;

    setTimeout(poll, 5000);
  };

  poll();
}

function cancelPixWait() {
  _pixPollingActive = false;
  localStorage.removeItem('evhapo_pending_pix');
  renderPayment();
}
