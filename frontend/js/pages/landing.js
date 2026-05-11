function renderLanding() {
  const isPT = I18N.isPT();

  const features = isPT ? [
    { icon: '🎯', title: 'Diagnóstico Profundo', desc: '94 perguntas em 10 dimensões-chave da mentalidade do jogador de elite' },
    { icon: '📡', title: 'Gráfico Radar', desc: 'Visualize seus pontos fortes e fracos em um mapa visual intuitivo' },
    { icon: '📋', title: 'Relatório Personalizado', desc: 'Análise detalhada de lacunas com recomendações específicas para você' },
    { icon: '🗓️', title: 'Plano de Trabalho', desc: 'Programa de melhoria semana a semana, das áreas mais críticas' },
    { icon: '📊', title: 'Benchmark Global', desc: 'Compare seus resultados com a média da comunidade MindEV' },
    { icon: '🔐', title: 'Painel Pessoal', desc: 'Acesse seus resultados e acompanhamento a qualquer momento' },
  ] : [
    { icon: '🎯', title: 'Diagnóstico Profundo', desc: '94 preguntas en 10 dimensiones clave de la mentalidad del jugador de élite' },
    { icon: '📡', title: 'Gráfico Radar', desc: 'Visualiza tus fortalezas y debilidades en un mapa visual intuitivo' },
    { icon: '📋', title: 'Informe Personalizado', desc: 'Análisis detallado de brechas con recomendaciones específicas para ti' },
    { icon: '🗓️', title: 'Plan de Trabajo', desc: 'Programa de mejora semana a semana, desde las áreas más críticas' },
    { icon: '📊', title: 'Benchmark Global', desc: 'Compara tus resultados con el promedio de la comunidad MindEV' },
    { icon: '🔐', title: 'Dashboard Personal', desc: 'Accede a tus resultados y seguimiento en cualquier momento' },
  ];

  // Función auxiliar para construir filas de categorías
  const catRow = (c, borderColor) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg2);border-radius:8px;border:1px solid ${borderColor || 'var(--border)'}">
      <span style="font-size:1.5rem">${c.icon}</span>
      <div>
        <div style="font-weight:700;font-size:0.9rem">${c.label}</div>
        <div style="font-size:0.8rem;color:var(--text2)">${c.questions.length} ${isPT ? 'perguntas' : 'preguntas'}</div>
      </div>
    </div>`;

  const html = `
    <div class="hero">
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        ${[['cl','Chile'],['ar','Argentina'],['br','Brasil'],['mx','México'],['co','Colombia'],['pe','Perú'],['uy','Uruguay']].map(([code,name]) =>
          `<img src="/icons/flags/${code}.png" alt="${name}" title="${name}"
            style="height:28px;width:auto;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,0.4)">`
        ).join('')}
      </div>
      <div class="hero-suits">♠ ♥ ♦ ♣</div>
      <h1>${isPT
        ? 'Teste de Avaliação das<br><span>Forças e Fraquezas</span><br>do Jogador de Poker'
        : 'Test de Evaluación de las<br><span>Fortalezas y Debilidades</span><br>del Jugador de Poker'}</h1>
      <p class="subtitle">${isPT
        ? 'O poker é muito mais do que cartas e apostas. É um jogo de habilidades mentais, estratégia e resistência emocional. Descubra onde você está e até onde pode chegar.'
        : 'El poker es mucho más que cartas y apuestas. Es un juego de habilidades mentales, estrategia y resistencia emocional. Descubre dónde estás y hasta dónde puedes llegar.'}</p>

      <div class="hero-cta">
        <button class="btn btn-primary btn-lg" onclick="App.go('register')">
          ♠ ${isPT ? 'Começar meu diagnóstico — USD $9.90' : 'Comenzar mi diagnóstico — USD $9.90'}
        </button>
        <button class="btn btn-secondary btn-lg" onclick="App.go('login')">
          ${isPT ? 'Já tenho conta' : 'Ya tengo cuenta'}
        </button>
      </div>

      <!-- Botón de instalación PWA (solo aparece cuando el navegador lo permite) -->
      <button id="pwa-install-btn" class="btn btn-outline btn-sm" style="display:none;margin-top:12px" onclick="installPWA()">
        📲 ${isPT ? 'Instalar App no meu dispositivo' : 'Instalar App en mi dispositivo'}
      </button>

      <div class="chip gold" style="margin-top:8px">${isPT
        ? '✓ Disponível em Android e PC · ✓ Relatório PDF para download · ✓ 100% em português'
        : '✓ Disponible en Android y PC · ✓ Informe PDF descargable · ✓ 100% en español'}</div>

      <!-- ── Video promo ───────────────────────────────────────────────── -->
      <div style="margin-top:32px;display:flex;flex-direction:column;align-items:center;gap:12px">
        <p style="font-size:0.82rem;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;font-weight:600">
          ${isPT ? '▶ Veja como funciona' : '▶ Míralo en acción'}
        </p>
        <div id="promo-video-wrap" style="position:relative;width:100%;max-width:340px;border-radius:18px;overflow:hidden;box-shadow:0 8px 48px rgba(0,0,0,0.7);border:1px solid rgba(212,175,55,0.2)">
          <video id="promo-video"
            autoplay muted loop playsinline
            style="width:100%;display:block;border-radius:18px">
            <source src="/assets/promo.mp4" type="video/mp4">
          </video>

          <!-- Overlay email blur — cubre el campo email (~42–54% desde top) -->
          <!-- Ajusta top/height si la posición no coincide exactamente -->
          <div id="email-blur-overlay" style="
            position:absolute;
            top:42%; left:8%; width:84%; height:10%;
            backdrop-filter:blur(18px) saturate(0.4);
            -webkit-backdrop-filter:blur(18px) saturate(0.4);
            background:rgba(10,10,20,0.45);
            border-radius:8px;
            pointer-events:none">
          </div>

          <!-- Icono de "privado" sobre el overlay -->
          <div style="
            position:absolute;
            top:42%; left:8%; width:84%; height:10%;
            display:flex;align-items:center;justify-content:center;
            pointer-events:none">
            <span style="font-size:0.7rem;color:rgba(255,255,255,0.35);font-weight:600;letter-spacing:0.05em">● ● ● ● ● ● ●</span>
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
        <div class="price">USD $9.90</div>
        <div class="price-sub">${isPT ? 'Pagamento único · Acesso permanente aos seus resultados e comparações futuras' : 'Pago único · Acceso permanente a tus resultados y futuras comparaciones'}</div>

        <!-- Métodos de pago y países -->
        <div style="margin-top:24px;padding:20px;background:rgba(0,0,0,0.2);border-radius:12px;border:1px solid rgba(212,175,55,0.2)">
          <div style="font-size:0.85rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">
            💳 ${isPT ? 'Métodos de pagamento aceitos' : 'Métodos de pago aceptados'}
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;justify-content:center">
            <span style="background:rgba(0,102,255,0.15);border:1px solid rgba(0,102,255,0.3);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:#4a9eff">
              💙 Mercado Pago
            </span>
            <span style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:var(--text2)">
              💳 ${isPT ? 'Débito · Crédito · Transferência' : 'Débito · Crédito · Transferencia'}
            </span>
            <span style="background:rgba(99,91,255,0.1);border:1px solid rgba(99,91,255,0.3);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:#a78bfa">
              💳 Stripe · Visa · Mastercard · Amex
            </span>
          </div>
          <div style="font-size:0.82rem;color:var(--text2);line-height:1.6;margin-bottom:10px">
            ${isPT
              ? `Usuários do <strong style="color:var(--text1)">Chile, Argentina, Brasil, México, Colômbia, Peru e Uruguai</strong> podem pagar com cartão local em moeda local via Mercado Pago. Resto do mundo via Stripe.`
              : `Usuarios de <strong style="color:var(--text1)">Chile, Argentina, Brasil, México, Colombia, Perú y Uruguay</strong> pueden pagar con tarjeta local en moneda local vía Mercado Pago. Resto del mundo vía Stripe.`}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
            ${[['cl','Chile'],['ar','Argentina'],['br','Brasil'],['mx','México'],['co','Colombia'],['pe','Perú'],['uy','Uruguay']].map(([code,name]) =>
              `<span style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:0.78rem;color:var(--text2);display:inline-flex;align-items:center;gap:5px">
                <img src="/icons/flags/${code}.png" alt="${name}" style="height:13px;border-radius:2px">${name}
              </span>`
            ).join('')}
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap">
          <button class="btn btn-primary" onclick="App.go('register')">${isPT ? 'Começar agora →' : 'Comenzar ahora →'}</button>
          <button class="btn btn-outline" onclick="App.go('login')">${isPT ? 'Entrar' : 'Iniciar sesión'}</button>
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
          <p style="font-size:0.85rem;color:var(--text2);margin-bottom:16px">${isPT ? 'Teste Mental — Habilidades psicológicas do jogador' : 'Test Mental — Habilidades psicológicas del jugador'}</p>
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
          <p style="font-size:0.85rem;color:var(--text2);margin-bottom:16px">${isPT ? 'Teste Técnico — Conhecimento de Texas Hold\'em' : 'Test Técnico — Conocimiento de Texas Hold\'em'}</p>
          <div style="display:grid;gap:8px">
            ${I18N.techCats().map(c => catRow(c, 'rgba(77,182,172,0.25)')).join('')}
          </div>
        </div>

      </div>

      <div class="card" style="margin-top:20px;background:linear-gradient(135deg,var(--card),var(--card2));border-color:var(--accent)">
        <div style="text-align:center;padding:12px">
          <div style="font-size:3rem;margin-bottom:12px">♠</div>
          <blockquote style="font-size:1.1rem;font-style:italic;color:var(--text2);max-width:600px;margin:0 auto">
            ${isPT
              ? '"Se você está aqui é porque compreende a IMPORTÂNCIA DOS ASPECTOS TÉCNICOS E MENTAIS e sabe que o poker é muito mais do que cartas e apostas. Este é o seu coach pessoal. Aproveite seu processo de crescimento como jogador de poker e desejamos sucesso no seu sonho de se tornar um jogador de elite."'
              : '"Si estás aquí es porque comprendes la IMPORTANCIA DE LOS ASPECTOS TÉCNICOS Y MENTALES y sabes que el póker es mucho más que cartas y apuestas. Este es tu coach personal. Disfruta tu proceso de crecimiento como jugador de póker y te deseamos éxito en tu sueño de convertirte en un jugador de élite."'}
          </blockquote>
          <div style="margin-top:16px;display:flex;align-items:center;justify-content:center;gap:8px">
            <span style="color:var(--accent);font-weight:700">—</span>
            <img src="/icons/mindev-logo.png" alt="MindEV" class="quote-logo">
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = `${renderNavbar()}${html}`;
}
