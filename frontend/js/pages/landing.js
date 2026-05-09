function renderLanding() {
  const features = [
    { icon: '🎯', title: 'Diagnóstico Profundo', desc: '94 preguntas en 10 dimensiones clave de la mentalidad del jugador de élite' },
    { icon: '🕸️', title: 'Gráfico Telaraña', desc: 'Visualiza tus fortalezas y debilidades en un mapa visual intuitivo' },
    { icon: '📋', title: 'Informe Personalizado', desc: 'Análisis detallado de brechas con recomendaciones específicas para ti' },
    { icon: '🗓️', title: 'Plan de Trabajo', desc: 'Programa de mejora semana a semana, desde las áreas más críticas' },
    { icon: '📊', title: 'Benchmark Global', desc: 'Compara tus resultados con el promedio de la comunidad EVHAPO' },
    { icon: '🔐', title: 'Dashboard Personal', desc: 'Accede a tus resultados y seguimiento en cualquier momento' },
  ];

  // Función auxiliar para construir filas de categorías
  const catRow = (c, borderColor) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg2);border-radius:8px;border:1px solid ${borderColor || 'var(--border)'}">
      <span style="font-size:1.5rem">${c.icon}</span>
      <div>
        <div style="font-weight:700;font-size:0.9rem">${c.label}</div>
        <div style="font-size:0.8rem;color:var(--text2)">${c.questions.length} preguntas</div>
      </div>
    </div>`;

  const html = `
    <div class="hero">
      <div class="hero-suits">♠ ♥ ♦ ♣</div>
      <h1>Test de Evaluación de las<br><span>Fortalezas y Debilidades</span><br>del Jugador de Poker</h1>
      <p class="subtitle">El poker es mucho más que cartas y apuestas. Es un juego de habilidades mentales, estrategia y resistencia emocional. Descubre dónde estás y hasta dónde puedes llegar.</p>

      <!-- Video reducido al 50% -->
      <div class="hero-video" style="max-width:340px">
        <video controls poster="">
          <source src="assets/VIDEO PROMO.mp4" type="video/mp4" />
          Tu navegador no soporta video HTML5.
        </video>
      </div>

      <div class="hero-cta">
        <button class="btn btn-primary btn-lg" onclick="App.go('register')">
          ♠ Comenzar mi diagnóstico — USD $9.90
        </button>
        <button class="btn btn-secondary btn-lg" onclick="App.go('login')">
          Ya tengo cuenta
        </button>
      </div>

      <!-- Botón de instalación PWA (solo aparece cuando el navegador lo permite) -->
      <button id="pwa-install-btn" class="btn btn-outline btn-sm" style="display:none;margin-top:12px" onclick="installPWA()">
        📲 Instalar App en mi dispositivo
      </button>

      <div class="chip gold" style="margin-top:8px">✓ Disponible en Android y PC · ✓ Informe PDF descargable · ✓ 100% en español</div>
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
        <div class="price-sub">Pago único · Acceso permanente a tus resultados y futuras comparaciones</div>

        <!-- Métodos de pago y países -->
        <div style="margin-top:24px;padding:20px;background:rgba(0,0,0,0.2);border-radius:12px;border:1px solid rgba(212,175,55,0.2)">
          <div style="font-size:0.85rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">
            💳 Métodos de pago aceptados
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;justify-content:center">
            <span style="background:rgba(0,102,255,0.15);border:1px solid rgba(0,102,255,0.3);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:#4a9eff">
              💙 Mercado Pago
            </span>
            <span style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:8px;padding:6px 14px;font-size:0.85rem;color:var(--text2)">
              💳 Débito · Crédito · Transferencia
            </span>
          </div>
          <div style="font-size:0.82rem;color:var(--text2);line-height:1.6;margin-bottom:10px">
            Usuarios de <strong style="color:var(--text1)">Chile, Argentina, Brasil, México, Colombia, Perú y Uruguay</strong>
            pueden pagar con su tarjeta local en moneda local. MercadoPago convierte automáticamente.
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
            ${['🇨🇱 Chile','🇦🇷 Argentina','🇧🇷 Brasil','🇲🇽 México','🇨🇴 Colombia','🇵🇪 Perú','🇺🇾 Uruguay'].map(p =>
              `<span style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:0.78rem;color:var(--text2)">${p}</span>`
            ).join('')}
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap">
          <button class="btn btn-primary" onclick="App.go('register')">Comenzar ahora →</button>
          <button class="btn btn-outline" onclick="App.go('login')">Iniciar sesión</button>
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
          <p style="font-size:0.85rem;color:var(--text2);margin-bottom:16px">Test Mental — Habilidades psicológicas del jugador</p>
          <div style="display:grid;gap:8px">
            ${EVHAPO_CATEGORIES.map(c => catRow(c, 'rgba(212,175,55,0.25)')).join('')}
          </div>
        </div>

        <!-- Test Técnico -->
        <div class="card">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <span style="font-size:1.8rem">⚙️</span>
            <img src="/icons/mindev-logo.png" alt="MindEV" class="section-logo">
          </div>
          <p style="font-size:0.85rem;color:var(--text2);margin-bottom:16px">Test Técnico — Conocimiento de Texas Hold'em</p>
          <div style="display:grid;gap:8px">
            ${TECHNICAL_CATEGORIES.map(c => catRow(c, 'rgba(77,182,172,0.25)')).join('')}
          </div>
        </div>

      </div>

      <div class="card" style="margin-top:20px;background:linear-gradient(135deg,var(--card),var(--card2));border-color:var(--accent)">
        <div style="text-align:center;padding:12px">
          <div style="font-size:3rem;margin-bottom:12px">♠</div>
          <blockquote style="font-size:1.1rem;font-style:italic;color:var(--text2);max-width:600px;margin:0 auto">
            "Si estás aquí es porque comprendes la IMPORTANCIA DE LOS ASPECTOS TÉCNICOS Y MENTALES y sabes que el póker es mucho más que cartas y apuestas. Este es tu coach personal. Disfruta tu proceso de crecimiento como jugador de póker y te deseamos éxito en tu sueño de convertirte en un jugador de élite."
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
