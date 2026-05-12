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
    { icon: '🎯', title: 'Deep Diagnosis', desc: '94 questions across 10 key dimensions of elite poker player mentality' },
    { icon: '📡', title: 'Radar Chart', desc: 'Visualize your strengths and weaknesses on an intuitive visual map' },
    { icon: '📋', title: 'Personalized Report', desc: 'Detailed gap analysis with specific recommendations tailored for you' },
    { icon: '🗓️', title: 'Work Plan', desc: 'Week-by-week improvement program, starting from your most critical areas' },
    { icon: '📊', title: 'Global Benchmark', desc: 'Compare your results with the MindEV community average' },
    { icon: '🔐', title: 'Personal Dashboard', desc: 'Access your results and progress tracking at any time' },
  ] : isPT ? [
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
        <div style="font-size:0.8rem;color:var(--text2)">${c.questions.length} ${isEN ? 'questions' : isPT ? 'perguntas' : 'preguntas'}</div>
      </div>
    </div>`;

  const html = `
    <div class="hero">
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        ${[['cl','Chile'],['ar','Argentina'],['br','Brasil'],['mx','México'],['co','Colombia'],['pe','Perú'],['uy','Uruguay']].map(([code,name]) =>
            `<img src="/icons/flags/${code}.png" alt="${name}" title="${name}"
              style="height:28px;width:auto;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,0.4)">`
          ).join('')}
        <span title="USA" style="font-size:1.6rem;line-height:28px">🇺🇸</span>
        <span title="Canada" style="font-size:1.6rem;line-height:28px">🇨🇦</span>
        <span title="UK" style="font-size:1.6rem;line-height:28px">🇬🇧</span>
        <span title="Australia" style="font-size:1.6rem;line-height:28px">🇦🇺</span>
        <span title="Ireland" style="font-size:1.6rem;line-height:28px">🇮🇪</span>
        <span title="Worldwide" style="font-size:1.6rem;line-height:28px">🌍</span>
      </div>
      <div class="hero-suits">♠ ♥ ♦ ♣</div>
      <h1>${isEN
        ? 'Evaluation Test of<br><span>Strengths and Weaknesses</span><br>of the Poker Player'
        : isPT
        ? 'Teste de Avaliação das<br><span>Forças e Fraquezas</span><br>do Jogador de Poker'
        : 'Test de Evaluación de las<br><span>Fortalezas y Debilidades</span><br>del Jugador de Poker'}</h1>
      <p class="subtitle">${isEN
        ? 'Poker is much more than cards and bets. It is a game of mental skills, strategy and emotional resilience. Discover where you stand and how far you can go.'
        : isPT
        ? 'O poker é muito mais do que cartas e apostas. É um jogo de habilidades mentais, estratégia e resistência emocional. Descubra onde você está e até onde pode chegar.'
        : 'El poker es mucho más que cartas y apuestas. Es un juego de habilidades mentales, estrategia y resistencia emocional. Descubre dónde estás y hasta dónde puedes llegar.'}</p>

      <div class="hero-cta">
        <button class="btn btn-primary btn-lg" onclick="App.go('register')">
          ♠ ${isEN ? 'Start my diagnosis — USD $9.90' : isPT ? 'Começar meu diagnóstico — USD $9.90' : 'Comenzar mi diagnóstico — USD $9.90'}
        </button>
        <button class="btn btn-secondary btn-lg" onclick="App.go('login')">
          ${isEN ? 'I already have an account' : isPT ? 'Já tenho conta' : 'Ya tengo cuenta'}
        </button>
      </div>

      <!-- Botón de instalación PWA (solo aparece cuando el navegador lo permite) -->
      <button id="pwa-install-btn" class="btn btn-outline btn-sm" style="display:none;margin-top:12px" onclick="installPWA()">
        📲 ${isEN ? 'Install App on my device' : isPT ? 'Instalar App no meu dispositivo' : 'Instalar App en mi dispositivo'}
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
        <div class="price">USD $9.90</div>
        <div class="price-sub">${isEN ? 'One-time payment · Permanent access to your results and future comparisons' : isPT ? 'Pagamento único · Acesso permanente aos seus resultados e comparações futuras' : 'Pago único · Acceso permanente a tus resultados y futuras comparaciones'}</div>

        <!-- Métodos de pago y países -->
        <div style="margin-top:24px;padding:20px;background:rgba(0,0,0,0.2);border-radius:12px;border:1px solid rgba(212,175,55,0.2)">
          <div style="font-size:0.85rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">
            💳 ${isEN ? 'Accepted payment methods' : isPT ? 'Métodos de pagamento aceitos' : 'Métodos de pago aceptados'}
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;justify-content:center">
            <span style="background:rgba(0,102,255,0.15);border:1px solid rgba(0,102,255,0.3);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:#4a9eff">
              💙 Mercado Pago
            </span>
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
            ${[['cl','Chile'],['ar','Argentina'],['br','Brasil'],['mx','México'],['co','Colombia'],['pe','Perú'],['uy','Uruguay']].map(([code,name]) =>
              `<span style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:0.78rem;color:var(--text2);display:inline-flex;align-items:center;gap:5px">
                <img src="/icons/flags/${code}.png" alt="${name}" style="height:13px;border-radius:2px">${name}
              </span>`
            ).join('')}
            <span style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:0.78rem;color:var(--text2);display:inline-flex;align-items:center;gap:5px">🇺🇸 USA</span>
            <span style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:0.78rem;color:var(--text2);display:inline-flex;align-items:center;gap:5px">🇨🇦 Canada</span>
            <span style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:0.78rem;color:var(--text2);display:inline-flex;align-items:center;gap:5px">🇬🇧 UK</span>
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

          ${[
            {
              name: 'Rodrigo M.',
              country: 'cl', flag: 'Chile',
              room: 'GGPoker',
              stars: 5,
              textES: '"Llevaba 2 años jugando sin saber exactamente qué fallaba. El diagnóstico me mostró que mi problema era el tilt, no las cartas. En 30 días mejoré mi ITM un 18%."',
              textPT: '"Jogava há 2 anos sem saber o que falhava. O diagnóstico mostrou que meu problema era o tilt, não as cartas. Em 30 dias melhorei meu ITM em 18%."',
              textEN: '"I had been playing for 2 years without knowing exactly what was failing. The diagnosis showed me that my problem was tilt, not the cards. In 30 days I improved my ITM by 18%."',
            },
            {
              name: 'Gustavo A.',
              country: 'br', flag: 'Brasil',
              room: 'PokerStars',
              stars: 5,
              textES: '"El plan de estudio de 4 semanas es brutal. Concreto, sin relleno. Por primera vez tengo una rutina clara de mejora y puedo ver mi evolución semana a semana."',
              textPT: '"O plano de estudo de 4 semanas é incrível. Concreto, sem enrolação. Pela primeira vez tenho uma rotina clara de melhora e consigo ver minha evolução semana a semana."',
              textEN: '"The 4-week study plan is outstanding. Concrete, no filler. For the first time I have a clear improvement routine and can see my progress week by week."',
            },
            {
              name: 'Sebastián T.',
              country: 'ar', flag: 'Argentina',
              room: 'WPT Global',
              stars: 5,
              textES: '"El análisis de manos con IA me abrió los ojos en spots que repetía todo el tiempo. Vale diez veces lo que cuesta."',
              textPT: '"A análise de mãos com IA me abriu os olhos em spots que eu repetia o tempo todo. Vale dez vezes o que custa."',
              textEN: '"The AI hand analysis opened my eyes to spots I was repeating all the time. Worth ten times what it costs."',
            },
          ].map(t => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column;gap:12px">
              <!-- Estrellas -->
              <div style="color:#fbbf24;font-size:0.85rem;letter-spacing:2px">${'★'.repeat(t.stars)}</div>
              <!-- Texto -->
              <p style="margin:0;color:var(--text2);font-size:0.88rem;line-height:1.6;font-style:italic;flex:1">
                ${isEN ? t.textEN : isPT ? t.textPT : t.textES}
              </p>
              <!-- Autor -->
              <div style="display:flex;align-items:center;gap:10px;border-top:1px solid var(--border);padding-top:12px">
                <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;color:#000;flex-shrink:0">
                  ${t.name[0]}
                </div>
                <div>
                  <div style="font-weight:700;font-size:0.88rem">${t.name}</div>
                  <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
                    <img src="/icons/flags/${t.country}.png" alt="${t.flag}" style="height:11px;border-radius:1px">
                    <span style="color:var(--text3);font-size:0.75rem">${t.flag} · ${t.room}</span>
                  </div>
                </div>
              </div>
            </div>`
          ).join('')}

        </div>

        <!-- CTA final -->
        <div style="text-align:center;margin-top:32px">
          <button class="btn btn-primary btn-lg" onclick="App.go('register')">
            ♠ ${isEN ? 'I want my diagnosis — USD $9.90' : isPT ? 'Quero meu diagnóstico — USD $9.90' : 'Quiero mi diagnóstico — USD $9.90'}
          </button>
          <p style="margin:10px 0 0;color:var(--text3);font-size:0.78rem">
            ${isEN ? 'One-time payment · Permanent access' : isPT ? 'Pagamento único · Acesso permanente' : 'Pago único · Acceso permanente'}
          </p>
        </div>
      </div>
      <!-- ── /Testimonios ───────────────────────────────────────────────── -->

      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = `${renderNavbar()}${html}`;

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
