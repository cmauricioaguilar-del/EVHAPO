function promoPlay() {
  const vid = document.getElementById('promo-vid');
  const btn = document.getElementById('promo-play-btn');
  if (!vid) return;
  if (vid.paused) {
    vid.play();
    if (btn) btn.style.display = 'none';
  } else {
    vid.pause();
    if (btn) btn.style.display = 'flex';
  }
}

function renderLanding() {
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();

  const features = isEN ? [
    { icon: '⚡', title: 'Your 7 Key Errors in Seconds', desc: 'Upload your tournament hand history and AI instantly identifies your top 7 leaks — no hours in GTO software required' },
    { icon: '🧠', title: 'Mental + Technical Diagnosis', desc: '94 questions that reveal exactly what to fix in your mindset and your game, in one sitting' },
    { icon: '📡', title: 'Skills Radar', desc: 'See your strengths and weaknesses in a single visual — know where to study first' },
    { icon: '📋', title: 'AI-Generated Report', desc: 'Personalized analysis ready in seconds: what you do well, what to correct, and why' },
    { icon: '🗓️', title: 'Structured Study Plan', desc: 'Week-by-week roadmap built from your real gaps — no guessing what to study' },
    { icon: '💓', title: 'MinDev Bio — Body at the Table', desc: 'Correlate your heart rate data with your hand history: discover how your body reacts at key tournament moments' },
  ] : isPT ? [
    { icon: '⚡', title: 'Seus 7 Principais Erros em Segundos', desc: 'Suba o histórico do seu torneio e a IA identifica na hora seus 7 maiores vazamentos — sem horas num software GTO' },
    { icon: '🧠', title: 'Diagnóstico Mental + Técnico', desc: '94 perguntas que revelam exatamente o que corrigir na sua mentalidade e no seu jogo, em uma sessão' },
    { icon: '📡', title: 'Radar de Habilidades', desc: 'Veja seus pontos fortes e fracos em um único visual — saiba onde estudar primeiro' },
    { icon: '📋', title: 'Relatório Gerado por IA', desc: 'Análise personalizada pronta em segundos: o que você faz bem, o que corrigir e por quê' },
    { icon: '🗓️', title: 'Plano de Estudo Estruturado', desc: 'Roteiro semana a semana construído a partir das suas lacunas reais — sem adivinhar o que estudar' },
    { icon: '💓', title: 'MinDev Bio — Corpo na Mesa', desc: 'Correlacione seus dados de frequência cardíaca com o histórico de mãos: descubra como seu corpo reage nos momentos-chave do torneio' },
  ] : [
    { icon: '⚡', title: 'Tus 7 Errores Principales en Segundos', desc: 'Sube el historial de tu torneo y la IA identifica al instante tus 7 principales fugas — sin pasar horas en un software GTO' },
    { icon: '🧠', title: 'Diagnóstico Mental + Técnico', desc: '94 preguntas que revelan exactamente qué corregir en tu mentalidad y en tu juego, en una sola sesión' },
    { icon: '📡', title: 'Radar de Habilidades', desc: 'Ve tus fortalezas y debilidades en un solo visual — sabe dónde estudiar primero' },
    { icon: '📋', title: 'Informe Generado por IA', desc: 'Análisis personalizado listo en segundos: qué haces bien, qué corregir y por qué' },
    { icon: '🗓️', title: 'Plan de Estudio Estructurado', desc: 'Hoja de ruta semana a semana construida desde tus brechas reales — sin adivinar qué estudiar' },
    { icon: '💓', title: 'MinDev Bio — Tu Cuerpo en la Mesa', desc: 'Correlaciona tus datos de frecuencia cardíaca con tu historial de manos: descubre cómo reacciona tu cuerpo en los momentos clave del torneo' },
  ];

  // Función auxiliar para construir filas de categorías
  const catRow = (c, borderColor) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg2);border-radius:8px;border:1px solid ${borderColor || 'var(--border)'}">
      <span style="font-size:1.5rem">${c.icon}</span>
      <div>
        <div style="font-weight:700;font-size:0.9rem">${c.label}</div>
        <div style="font-size:0.8rem;color:var(--text2)">${c.questions.length} ${isEN ? 'questions' : isPT ? 'perguntas' : 'preguntas'}</div>
      </div>
    </div>`;

  const html = `
    <div class="hero">
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        ${[['cl','Chile'],['ar','Argentina'],['br','Brasil'],['mx','México'],['co','Colombia'],['pe','Perú'],['uy','Uruguay'],['us','USA'],['ca','Canada'],['gb','UK'],['au','Australia'],['ie','Ireland']].map(([code,name]) =>
            `<img src="https://flagcdn.com/w40/${code}.png" alt="${name}" title="${name}"
              style="height:28px;width:auto;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,0.4)">`
          ).join('')}
        <span title="Worldwide" style="font-size:1.6rem;line-height:28px">🌍</span>
      </div>
      <div class="hero-suits">♠ ♥ ♦ ♣</div>
      <h1>${isEN
        ? 'MindEV — <span>Improve your poker game,</span><br>fast and easy'
        : isPT
        ? 'MindEV — <span>Melhore seu jogo de poker,</span><br>rápido e fácil'
        : 'MindEV — <span>Mejora tu juego de poker,</span><br>rápido y fácil'}</h1>
      <p class="subtitle">${isEN
        ? 'Upload your tournament, get your 7 key errors in seconds. AI analyzes your mind, your technique and your body — and gives you a clear study plan. No GTO software. No wasted hours.'
        : isPT
        ? 'Suba seu torneio, receba seus 7 principais erros em segundos. A IA analisa sua mente, sua técnica e seu corpo — e entrega um plano de estudo claro. Sem software GTO. Sem horas perdidas.'
        : 'Sube tu torneo, recibe tus 7 errores principales en segundos. La IA analiza tu mente, tu técnica y tu cuerpo — y te entrega un plan de estudio claro. Sin software GTO. Sin horas perdidas.'}</p>

      <div class="hero-cta">
        <button class="btn btn-primary btn-lg" onclick="App.go('register')">
          ♠ ${isEN ? 'Buy my subscription' : isPT ? 'Comprar minha assinatura' : 'Comprar mi suscripción'}
        </button>
        <button class="btn btn-secondary btn-lg" onclick="App.go('login')">
          ${isEN ? 'I already have an account' : isPT ? 'Já tenho conta' : 'Ya tengo cuenta'}
        </button>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px">
        <span style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.4);color:#22c55e;border-radius:20px;padding:5px 14px;font-size:0.82rem;font-weight:700">
          🔓 ${isEN ? 'Try · USD $0.99' : isPT ? 'Teste · USD $0.99' : 'Prueba · USD $0.99'}
        </span>
        <span style="background:rgba(129,140,248,0.12);border:1px solid rgba(129,140,248,0.3);color:#818cf8;border-radius:20px;padding:5px 14px;font-size:0.82rem;font-weight:700">
          📅 ${isEN ? 'Monthly · USD $4.90' : isPT ? 'Mensal · USD $4.90' : 'Mensual · USD $4.90'}
        </span>
        <span style="background:rgba(77,182,172,0.12);border:1px solid rgba(77,182,172,0.3);color:#4DB6AC;border-radius:20px;padding:5px 14px;font-size:0.82rem;font-weight:700">
          📆 ${isEN ? '6 months · USD $19.90' : isPT ? '6 meses · USD $19.90' : '6 meses · USD $19.90'}
        </span>
        <span style="background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.3);color:#d4af37;border-radius:20px;padding:5px 14px;font-size:0.82rem;font-weight:700">
          🏆 ${isEN ? 'Annual · USD $29.90' : isPT ? 'Anual · USD $29.90' : 'Anual · USD $29.90'}
        </span>
      </div>

      <!-- Botón PWA: visible en Android/Chrome (prompt nativo) y en iOS (instrucciones) -->
      <button id="pwa-install-btn" class="btn btn-outline btn-sm"
        style="display:none;margin-top:12px;align-items:center;gap:6px" onclick="installPWA()">
        <span id="pwa-install-icon">📲</span>
        ${isEN ? 'Install App on my device' : isPT ? 'Instalar App no meu dispositivo' : 'Instalar App en mi dispositivo'}
      </button>

      <div class="chip gold" style="margin-top:8px">${isEN
        ? '✓ Available on Android & PC · ✓ Downloadable PDF report · ✓ 100% in English'
        : isPT
        ? '✓ Disponível em Android e PC · ✓ Relatório PDF para download · ✓ 100% em português'
        : '✓ Disponible en Android y PC · ✓ Informe PDF descargable · ✓ 100% en español'}</div>

      <!-- ── Video promo ───────────────────────────────────────────────── -->
      <div style="margin-top:32px;display:flex;flex-direction:column;align-items:center;gap:12px;width:100%">
        <p style="font-size:0.82rem;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;font-weight:600">
          ${isEN ? '▶ See it in action' : isPT ? '▶ Veja como funciona' : '▶ Míralo en acción'}
        </p>
        <div id="promo-wrap" style="position:relative;width:100%;max-width:820px;border-radius:18px;overflow:hidden;box-shadow:0 8px 48px rgba(0,0,0,0.7);border:1px solid rgba(212,175,55,0.2);cursor:pointer" onclick="promoPlay()">
          <video id="promo-vid" autoplay muted loop playsinline preload="auto"
            poster="/assets/promo-poster.jpg"
            oncanplay="this.play()"
            style="width:100%;display:block;background:#0a0a12">
            <source src="${isEN ? '/assets/promo-en.mp4' : isPT ? '/assets/promo-pt.mp4' : '/assets/promo.mp4'}" type="video/mp4">
            <source src="/assets/promo.mp4" type="video/mp4">
          </video>
          <!-- Botón play — visible solo si autoplay fue bloqueado -->
          <div id="promo-play-btn" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;background:rgba(0,0,0,0.45)">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(212,175,55,0.9);display:flex;align-items:center;justify-content:center;font-size:1.6rem">▶</div>
          </div>
        </div>
      </div>
      <!-- ── /Video promo ──────────────────────────────────────────────── -->

    </div>

    <div class="page">
      <div class="features">
        ${features.map(f => `
          <div class="feature-card">
            <span class="feature-icon">${f.icon}</span>
            <h3>${f.title}</h3>
            <p>${f.desc}</p>
          </div>
        `).join('')}
      </div>

      <div class="price-banner">

        <!-- Título sección precios -->
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="font-size:1.3rem;font-weight:800;margin:0 0 6px">
            ${isEN ? 'Choose your plan' : isPT ? 'Escolha seu plano' : 'Elige tu plan'}
          </h2>
          <p style="color:var(--text3);font-size:0.85rem;margin:0">
            ${isEN ? 'Start for $0.99 — no commitment' : isPT ? 'Comece por $0.99 — sem compromisso' : 'Empieza por $0.99 — sin compromiso'}
          </p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:20px">

          <!-- Tier 1: Prueba $0.99 -->
          <div style="border:2px solid #22c55e;border-radius:16px;padding:20px 16px;background:rgba(34,197,94,0.06);text-align:center;position:relative;cursor:pointer" onclick="App.go('register')">
            <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:0.65rem;font-weight:800;padding:3px 14px;border-radius:20px;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em">
              🔓 ${isEN ? 'Try first' : isPT ? 'Experimente' : 'Prueba primero'}
            </div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;margin-top:4px">
              ${isEN ? 'Trial · 2 weeks' : isPT ? 'Teste · 2 semanas' : 'Prueba · 2 semanas'}
            </div>
            <div style="font-size:2.4rem;font-weight:900;color:#22c55e;line-height:1">$0.99</div>
            <div style="font-size:0.72rem;color:var(--text3);margin-top:4px">USD · ${isEN ? 'one time' : isPT ? 'uma vez' : 'única vez'}</div>
            <div style="margin-top:14px;font-size:0.8rem;color:var(--text2);line-height:1.7;text-align:left">
              ✓ ${isEN ? '1 mental test' : isPT ? '1 teste mental' : '1 test mental'}<br>
              ✓ ${isEN ? '1 technical test' : isPT ? '1 teste técnico' : '1 test técnico'}<br>
              ✓ ${isEN ? '1 AI profile' : isPT ? '1 perfil IA' : '1 perfil IA'}<br>
              ✓ ${isEN ? '3 tournaments analyzed' : isPT ? '3 torneios analisados' : '3 torneos analizados'}<br>
              <span style="color:var(--text3)">✗ ${isEN ? 'Study plan (paid)' : isPT ? 'Plano de estudo (pago)' : 'Plan de estudio (pago)'}</span>
            </div>
            <button class="btn" style="margin-top:16px;width:100%;padding:10px;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;color:#fff;border-radius:10px;font-weight:800;cursor:pointer;font-size:0.9rem" onclick="App.go('register')">
              ${isEN ? 'Try for $0.99 →' : isPT ? 'Testar por $0.99 →' : 'Probar por $0.99 →'}
            </button>
            <div style="font-size:0.7rem;color:var(--text3);margin-top:8px">
              ${isEN ? 'One-time use per user' : isPT ? 'Uso único por usuário' : 'Uso único por usuario'}
            </div>
          </div>

          <!-- Tier 2: Mensual $4.90 -->
          <div style="border:2px solid #818cf8;border-radius:16px;padding:20px 16px;background:rgba(129,140,248,0.06);text-align:center;position:relative;cursor:pointer" onclick="App.go('register')">
            <div style="font-size:0.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">
              ${isEN ? 'Monthly · 30 days' : isPT ? 'Mensal · 30 dias' : 'Mensual · 30 días'}
            </div>
            <div style="font-size:2.4rem;font-weight:900;color:#818cf8;line-height:1">$4.90</div>
            <div style="font-size:0.72rem;color:var(--text3);margin-top:4px">USD / ${isEN ? 'month' : isPT ? 'mês' : 'mes'}</div>
            <div style="margin-top:14px;font-size:0.8rem;color:var(--text2);line-height:1.7;text-align:left">
              ✓ ${isEN ? 'Unlimited tests' : isPT ? 'Testes ilimitados' : 'Tests ilimitados'}<br>
              ✓ ${isEN ? 'AI profile' : isPT ? 'Perfil IA' : 'Perfil IA'}<br>
              ✓ ${isEN ? 'Full study plan' : isPT ? 'Plano de estudo completo' : 'Plan de estudio completo'}<br>
              ✓ ${isEN ? 'Unlimited tournaments' : isPT ? 'Torneios ilimitados' : 'Torneos ilimitados'}<br>
              ✓ ${isEN ? 'Cancel anytime' : isPT ? 'Cancela quando quiser' : 'Cancela cuando quieras'}
            </div>
            <button style="margin-top:16px;width:100%;padding:10px;background:rgba(129,140,248,0.15);border:2px solid #818cf8;color:#818cf8;border-radius:10px;font-weight:800;cursor:pointer;font-size:0.9rem" onclick="App.go('register')">
              ${isEN ? 'Subscribe →' : isPT ? 'Assinar →' : 'Suscribirme →'}
            </button>
          </div>

          <!-- Tier 3: Semestral $19.90 -->
          <div style="border:2px solid #4DB6AC;border-radius:16px;padding:20px 16px;background:rgba(77,182,172,0.06);text-align:center;position:relative;cursor:pointer" onclick="App.go('register')">
            <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#4DB6AC,#00897B);color:#fff;font-size:0.65rem;font-weight:800;padding:3px 14px;border-radius:20px;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em">
              💰 ${isEN ? 'Save 32%' : isPT ? 'Economize 32%' : 'Ahorra 32%'}
            </div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;margin-top:4px">
              ${isEN ? '6 months' : isPT ? '6 meses' : '6 meses'}
            </div>
            <div style="font-size:2.4rem;font-weight:900;color:#4DB6AC;line-height:1">$19.90</div>
            <div style="font-size:0.72rem;color:var(--text3);margin-top:4px">USD · ~$3.32/${isEN ? 'mo' : isPT ? 'mês' : 'mes'}</div>
            <div style="margin-top:14px;font-size:0.8rem;color:var(--text2);line-height:1.7;text-align:left">
              ✓ ${isEN ? 'Everything in Monthly' : isPT ? 'Tudo do Mensal' : 'Todo lo del Mensual'}<br>
              ✓ ${isEN ? '6 months access' : isPT ? '6 meses de acesso' : '6 meses de acceso'}<br>
              ✓ ${isEN ? 'PDF report' : isPT ? 'Relatório PDF' : 'Informe PDF'}<br>
              ✓ ${isEN ? 'Priority support' : isPT ? 'Suporte prioritário' : 'Soporte prioritario'}<br>
              &nbsp;
            </div>
            <button style="margin-top:16px;width:100%;padding:10px;background:rgba(77,182,172,0.15);border:2px solid #4DB6AC;color:#4DB6AC;border-radius:10px;font-weight:800;cursor:pointer;font-size:0.9rem" onclick="App.go('register')">
              ${isEN ? 'Subscribe →' : isPT ? 'Assinar →' : 'Suscribirme →'}
            </button>
          </div>

          <!-- Tier 4: Anual $29.90 -->
          <div style="border:2px solid var(--accent);border-radius:16px;padding:20px 16px;background:rgba(212,175,55,0.07);text-align:center;position:relative;cursor:pointer" onclick="App.go('register')">
            <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#d4af37,#b8860b);color:#000;font-size:0.65rem;font-weight:800;padding:3px 14px;border-radius:20px;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em">
              🏆 ${isEN ? 'Best value · Save 49%' : isPT ? 'Melhor custo · Economize 49%' : 'Mejor valor · Ahorra 49%'}
            </div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;margin-top:4px">
              ${isEN ? 'Annual · 12 months' : isPT ? 'Anual · 12 meses' : 'Anual · 12 meses'}
            </div>
            <div style="font-size:2.4rem;font-weight:900;color:var(--accent);line-height:1">$29.90</div>
            <div style="font-size:0.72rem;color:var(--text3);margin-top:4px">USD · ~$2.49/${isEN ? 'mo' : isPT ? 'mês' : 'mes'}</div>
            <div style="margin-top:14px;font-size:0.8rem;color:var(--text2);line-height:1.7;text-align:left">
              ✓ ${isEN ? 'Everything in Monthly' : isPT ? 'Tudo do Mensal' : 'Todo lo del Mensual'}<br>
              ✓ ${isEN ? '12 months access' : isPT ? '12 meses de acesso' : '12 meses de acceso'}<br>
              ✓ ${isEN ? 'PDF report' : isPT ? 'Relatório PDF' : 'Informe PDF'}<br>
              ✓ ${isEN ? 'Priority support' : isPT ? 'Suporte prioritário' : 'Soporte prioritario'}<br>
              ✓ ${isEN ? 'Locked price forever' : isPT ? 'Preço fixo para sempre' : 'Precio fijo para siempre'}
            </div>
            <button class="btn btn-primary" style="margin-top:16px;width:100%;padding:10px;border-radius:10px;font-weight:800;font-size:0.9rem" onclick="App.go('register')">
              ${isEN ? 'Subscribe →' : isPT ? 'Assinar →' : 'Suscribirme →'}
            </button>
          </div>

        </div>

        <!-- Métodos de pago y países -->
        <div style="margin-top:24px;padding:20px;background:rgba(0,0,0,0.2);border-radius:12px;border:1px solid rgba(212,175,55,0.2)">
          <div style="font-size:0.85rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">
            💳 ${isEN ? 'Accepted payment methods' : isPT ? 'Métodos de pagamento aceitos' : 'Métodos de pago aceptados'}
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;justify-content:center">
            <span style="background:rgba(0,102,255,0.15);border:1px solid rgba(0,102,255,0.3);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:#4a9eff">
              💙 Mercado Pago
            </span>
            ${isPT ? `<span style="background:rgba(50,188,173,0.15);border:1px solid rgba(50,188,173,0.4);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:#32BCAD;font-weight:700">
              ⚡ PIX — Instantâneo · 24h · Grátis
            </span>` : ''}
            <span style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:var(--text2)">
              💳 ${isEN ? 'Debit · Credit · Transfer' : isPT ? 'Débito · Crédito · Transferência' : 'Débito · Crédito · Transferencia'}
            </span>
            <span style="background:rgba(99,91,255,0.1);border:1px solid rgba(99,91,255,0.3);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:#a78bfa">
              💳 Visa · Mastercard · Amex · International
            </span>
          </div>
          <div style="font-size:0.82rem;color:var(--text2);line-height:1.6;margin-bottom:10px">
            ${isEN
              ? `Players from <strong style="color:var(--text1)">Chile, Argentina, Brazil, Mexico, Colombia, Peru and Uruguay</strong> can pay with local card in local currency via Mercado Pago. Rest of the world via secure international checkout.`
              : isPT
              ? `Usuários do <strong style="color:var(--text1)">Chile, Argentina, Brasil, México, Colômbia, Peru e Uruguai</strong> podem pagar com cartão local em moeda local via Mercado Pago. Resto do mundo via checkout internacional seguro.`
              : `Usuarios de <strong style="color:var(--text1)">Chile, Argentina, Brasil, México, Colombia, Perú y Uruguay</strong> pueden pagar con tarjeta local en moneda local vía Mercado Pago. Resto del mundo vía checkout internacional seguro.`}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
            ${[['cl','Chile'],['ar','Argentina'],['br','Brasil'],['mx','México'],['co','Colombia'],['pe','Perú'],['uy','Uruguay'],['us','USA'],['ca','Canada'],['gb','UK'],['au','Australia'],['ie','Ireland']].map(([code,name]) =>
              `<span style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:0.78rem;color:var(--text2);display:inline-flex;align-items:center;gap:5px">
                <img src="https://flagcdn.com/w20/${code}.png" alt="${name}" style="height:13px;border-radius:2px">${name}
              </span>`
            ).join('')}
            <span style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:0.78rem;color:var(--text2);display:inline-flex;align-items:center;gap:5px">🌍 ${isEN ? 'Worldwide' : isPT ? 'Resto do mundo' : 'Resto del mundo'}</span>
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap">
          <button class="btn btn-primary" onclick="App.go('register')">${isEN ? 'Start now →' : isPT ? 'Começar agora →' : 'Comenzar ahora →'}</button>
          <button class="btn btn-outline" onclick="App.go('login')">${isEN ? 'Sign in' : isPT ? 'Entrar' : 'Iniciar sesión'}</button>
        </div>
      </div>

      <!-- ¿Qué mide EVHAPO? — dos columnas: Mental + Técnico -->
      <div class="landing-tests-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px">

        <!-- Test Mental -->
        <div class="card">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <span style="font-size:1.8rem">🧠</span>
            <img src="/icons/mindev-logo.png" alt="MindEV" class="section-logo">
          </div>
          <p style="font-size:0.85rem;color:var(--text2);margin-bottom:16px">${isEN ? 'Mental Test — Psychological skills of the player' : isPT ? 'Teste Mental — Habilidades psicológicas do jogador' : 'Test Mental — Habilidades psicológicas del jugador'}</p>
          <div style="display:grid;gap:8px">
            ${I18N.cats().map(c => catRow(c, 'rgba(212,175,55,0.25)')).join('')}
          </div>
        </div>

        <!-- Test Técnico -->
        <div class="card">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <span style="font-size:1.8rem">⚙️</span>
            <img src="/icons/mindev-logo.png" alt="MindEV" class="section-logo">
          </div>
          <p style="font-size:0.85rem;color:var(--text2);margin-bottom:16px">${isEN ? "Technical Test — Texas Hold'em Knowledge" : isPT ? "Teste Técnico — Conhecimento de Texas Hold'em" : "Test Técnico — Conocimiento de Texas Hold'em"}</p>
          <div style="display:grid;gap:8px">
            ${I18N.techCats().map(c => catRow(c, 'rgba(77,182,172,0.25)')).join('')}
          </div>
        </div>

      </div>

      <div class="card" style="margin-top:20px;background:linear-gradient(135deg,var(--card),var(--card2));border-color:var(--accent)">
        <div style="text-align:center;padding:12px">
          <div style="font-size:3rem;margin-bottom:12px">♠</div>
          <blockquote style="font-size:1.1rem;font-style:italic;color:var(--text2);max-width:600px;margin:0 auto">
            ${isEN
              ? '"If you are here it is because you understand the IMPORTANCE OF THE TECHNICAL AND MENTAL ASPECTS and know that poker is much more than cards and bets. This is your personal coach. Enjoy your growth process as a poker player and we wish you success in your dream of becoming an elite player."'
              : isPT
              ? '"Se você está aqui é porque compreende a IMPORTÂNCIA DOS ASPECTOS TÉCNICOS E MENTAIS e sabe que o poker é muito mais do que cartas e apostas. Este é o seu coach pessoal. Aproveite seu processo de crescimento como jogador de poker e desejamos sucesso no seu sonho de se tornar um jogador de elite."'
              : '"Si estás aquí es porque comprendes la IMPORTANCIA DE LOS ASPECTOS TÉCNICOS Y MENTALES y sabes que el póker es mucho más que cartas y apuestas. Este es tu coach personal. Disfruta tu proceso de crecimiento como jugador de póker y te deseamos éxito en tu sueño de convertirte en un jugador de élite."'}
          </blockquote>
          <div style="margin-top:16px;display:flex;align-items:center;justify-content:center;gap:8px">
            <span style="color:var(--accent);font-weight:700">—</span>
            <img src="/icons/mindev-logo.png" alt="MindEV" class="quote-logo">
          </div>
        </div>
      <!-- ── Testimonios ───────────────────────────────────────────────── -->
      <div style="margin-top:40px">
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="font-size:1.3rem;font-weight:800;margin:0 0 6px">
            ${isEN ? 'What our players say' : isPT ? 'O que dizem nossos jogadores' : 'Lo que dicen nuestros jugadores'}
          </h2>
          <p style="color:var(--text3);font-size:0.85rem;margin:0">
            ${isEN ? 'Real results from real players' : isPT ? 'Resultados reais de jogadores reais' : 'Resultados reales de jugadores reales'}
          </p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">

          <!-- Testimonio real: Delpho21Poker -->
          <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;gap:12px">
            <div style="color:#fbbf24;font-size:0.85rem;letter-spacing:2px">★★★★★</div>
            <p style="margin:0;color:var(--text2);font-size:0.88rem;line-height:1.6;font-style:italic;flex:1">
              "Me ayudó a darme cuenta de que tengo muchos flaws en mi mindset y también mi parte técnica."
            </p>
            <div style="display:flex;align-items:center;gap:10px;border-top:1px solid var(--border);padding-top:12px">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;color:#000;flex-shrink:0">
                D
              </div>
              <div>
                <div style="font-weight:700;font-size:0.88rem">Delpho21Poker</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
                  <img src="/icons/flags/cl.png" alt="Chile" style="height:11px;border-radius:1px">
                  <span style="color:var(--text3);font-size:0.75rem">Chile</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Testimonio Brasil -->
          <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;gap:12px">
            <div style="color:#fbbf24;font-size:0.85rem;letter-spacing:2px">★★★★★</div>
            <p style="margin:0;color:var(--text2);font-size:0.88rem;line-height:1.6;font-style:italic;flex:1">
              "Achei que meu problema era técnico. O MinDev mostrou que era mental. Agora jogo com muito mais consistência."
            </p>
            <div style="display:flex;align-items:center;gap:10px;border-top:1px solid var(--border);padding-top:12px">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#32BCAD,#1a8a7f);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;color:#fff;flex-shrink:0">
                R
              </div>
              <div>
                <div style="font-weight:700;font-size:0.88rem">RafaPoker_BR</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
                  <img src="/icons/flags/br.png" alt="Brasil" style="height:11px;border-radius:1px">
                  <span style="color:var(--text3);font-size:0.75rem">Brasil</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Testimonio Colombia -->
          <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;gap:12px">
            <div style="color:#fbbf24;font-size:0.85rem;letter-spacing:2px">★★★★★</div>
            <p style="margin:0;color:var(--text2);font-size:0.88rem;line-height:1.6;font-style:italic;flex:1">
              "Excelente apoyo para jugar y aprender de POKER. Se enfocó directamente donde estoy fallando y me ayudó a solucionar fallas. El cruce de perfil+mental me sorprendió mucho, ¡súper recomendada!!"
            </p>
            <div style="display:flex;align-items:center;gap:10px;border-top:1px solid var(--border);padding-top:12px">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#fcd116,#ce1126);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;color:#000;flex-shrink:0">
                C
              </div>
              <div>
                <div style="font-weight:700;font-size:0.88rem">Chispas</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
                  <img src="https://flagcdn.com/w20/co.png" alt="Colombia" style="height:11px;border-radius:1px">
                  <span style="color:var(--text3);font-size:0.75rem">Colombia</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Testimonio Malque77 -->
          <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;gap:12px">
            <div style="color:#fbbf24;font-size:0.85rem;letter-spacing:2px">★★★★★</div>
            <p style="margin:0;color:var(--text2);font-size:0.88rem;line-height:1.6;font-style:italic;flex:1">
              "Excelente herramienta. Lo que más me sorprendió fue la precisión con que captura el lado mental del jugador: paciencia, control del tilt y mentalidad de crecimiento. Y no se queda solo en describir, te entrega un plan de acción estructurado por fases con objetivos medibles. Identificó justo mis áreas a mejorar y me dio una hoja de ruta clara para estudiar. Muy recomendable para cualquier jugador que quiera entenderse mejor y tener dirección."
            </p>
            <div style="display:flex;align-items:center;gap:10px;border-top:1px solid var(--border);padding-top:12px">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#15803d);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;color:#fff;flex-shrink:0">
                M
              </div>
              <div>
                <div style="font-weight:700;font-size:0.88rem">Mauricio "Malque77" Alarcón</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
                  <img src="/icons/flags/cl.png" alt="Chile" style="height:11px;border-radius:1px">
                  <span style="color:var(--text3);font-size:0.75rem">Chile</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Testimonio PatoQux -->
          <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;gap:12px">
            <div style="color:#fbbf24;font-size:0.85rem;letter-spacing:2px">★★★★★</div>
            <p style="margin:0;color:var(--text2);font-size:0.88rem;line-height:1.6;font-style:italic;flex:1">
              "Me parece una buena herramienta para quienes necesitan ayuda, ya sea del juego en sí en su parte técnica, como en la mental (gestión de emociones), lo cual creo que sirve para el día a día más allá de lo puntual que es el póker."
            </p>
            <div style="display:flex;align-items:center;gap:10px;border-top:1px solid var(--border);padding-top:12px">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;color:#fff;flex-shrink:0">
                P
              </div>
              <div>
                <div style="font-weight:700;font-size:0.88rem">PatoQux</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
                  <img src="/icons/flags/cl.png" alt="Chile" style="height:11px;border-radius:1px">
                  <span style="color:var(--text3);font-size:0.75rem">Chile</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- CTA final -->
        <div style="text-align:center;margin-top:32px">
          <button class="btn btn-primary btn-lg" onclick="App.go('register')">
            ♠ ${isEN ? 'Buy my subscription' : isPT ? 'Comprar minha assinatura' : 'Comprar mi suscripción'}
          </button>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px">
            <span style="font-size:0.8rem;color:#22c55e;font-weight:700">🔓 ${isEN ? 'Try $0.99 USD' : isPT ? 'Teste $0.99 USD' : 'Prueba $0.99 USD'}</span>
            <span style="font-size:0.8rem;color:var(--text3)">·</span>
            <span style="font-size:0.8rem;color:#818cf8;font-weight:700">📅 ${isEN ? '$4.90/mo' : isPT ? '$4.90/mês' : '$4.90/mes'}</span>
            <span style="font-size:0.8rem;color:var(--text3)">·</span>
            <span style="font-size:0.8rem;color:#4DB6AC;font-weight:700">📆 ${isEN ? '6mo $19.90' : isPT ? '6m $19.90' : '6m $19.90'}</span>
            <span style="font-size:0.8rem;color:var(--text3)">·</span>
            <span style="font-size:0.8rem;color:var(--accent);font-weight:700">🏆 ${isEN ? 'Annual $29.90' : isPT ? 'Anual $29.90' : 'Anual $29.90'}</span>
          </div>
        </div>
      </div>
      <!-- ── /Testimonios ───────────────────────────────────────────────── -->

      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = `${renderNavbar()}${html}`;

  // Restaurar botón PWA si el prompt ya fue capturado antes de este render
  if (typeof _pwaUpdateInstallBtn === 'function') _pwaUpdateInstallBtn();

  // Autoplay: esperar canplay y detectar solo NotAllowedError real
  const vid = document.getElementById('promo-vid');
  const btn = document.getElementById('promo-play-btn');
  if (vid) {
    const tryPlay = () => {
      vid.play().catch(err => {
        if (err.name === 'NotAllowedError' && btn) btn.style.display = 'flex';
      });
    };
    if (vid.readyState >= 3) {
      tryPlay();
    } else {
      vid.addEventListener('canplay', tryPlay, { once: true });
    }
    vid.addEventListener('playing', () => { if (btn) btn.style.display = 'none'; });
  }
}
