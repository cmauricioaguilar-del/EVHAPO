async function renderDashboard() {
  if (!Api.isLoggedIn()) { App.go('login'); return; }
  const user = Api.currentUser();

  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div class="page-wide">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:1.8rem;font-weight:800">Mi Dashboard</h1>
          <p class="text-muted">Bienvenido/a, <strong>${user.nombre}</strong>. Tu centro de diagnóstico y mejora.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-secondary" onclick="startNewTest('mental')">🧠 Test Mental</button>
          <button class="btn btn-primary"   onclick="startNewTest('technical')">⚙️ Test Técnico</button>
        </div>
      </div>
      <div id="dashboard-content"><div style="text-align:center;padding:60px"><div class="spinner" style="margin:0 auto"></div></div></div>
    </div>`;

  try {
    const data = await Api.dashboard();
    renderDashboardContent(data, user);
  } catch (e) {
    document.getElementById('dashboard-content').innerHTML = `<div class="form-error">Error: ${e.message}</div>`;
  }
}

function renderDashboardContent(data, user) {
  const { history, benchmark } = data;

  // Separar historial por tipo de test
  const mentalHistory    = history.filter(s => !s.test_type || s.test_type === 'mental');
  const technicalHistory = history.filter(s => s.test_type === 'technical');
  const latestMental     = mentalHistory[0] || null;
  const latestTechnical  = technicalHistory[0] || null;

  const getScores  = s => s ? (typeof s.scores === 'string' ? JSON.parse(s.scores) : s.scores) : null;
  const mentalSc   = getScores(latestMental);
  const techSc     = getScores(latestTechnical);
  const mentalOv   = mentalSc    ? getOverallScore(mentalSc)          : null;
  const techOv     = techSc      ? getTechnicalOverallScore(techSc)   : null;
  const mentalLvl  = mentalOv  !== null ? getLevel(mentalOv)          : null;
  const techLvl    = techOv    !== null ? getTechnicalLevel(techOv)   : null;

  let html = '';

  // ─── Stats cards ──────────────────────────────────────────────────────────
  html += `<div class="dashboard-grid">
    <div class="stat-card">
      <div class="stat-val">${history.length}</div>
      <div class="stat-label">Tests totales</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color:${mentalOv !== null ? (mentalOv >= 80 ? 'var(--green)' : mentalOv >= 60 ? 'var(--accent)' : 'var(--red)') : 'var(--text2)'}">
        ${mentalOv !== null ? mentalOv + '%' : '—'}
      </div>
      <div class="stat-label">🧠 Nivel Mental</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color:${techOv !== null ? (techOv >= 80 ? 'var(--green)' : techOv >= 60 ? 'var(--accent)' : 'var(--red)') : 'var(--text2)'}">
        ${techOv !== null ? techOv + '%' : '—'}
      </div>
      <div class="stat-label">⚙️ Nivel Técnico</div>
    </div>
    <div class="stat-card">
      ${(() => {
        const combinado = mentalOv !== null && techOv !== null
          ? Math.round((mentalOv + techOv) / 2)
          : mentalOv !== null ? mentalOv : techOv !== null ? techOv : null;
        const color = combinado !== null
          ? (combinado >= 80 ? 'var(--green)' : combinado >= 60 ? 'var(--accent)' : 'var(--red)')
          : 'var(--text2)';
        return `<div class="stat-val" style="color:${color}">${combinado !== null ? combinado + '%' : '—'}</div>`;
      })()}
      <div class="stat-label">Índice combinado</div>
    </div>
  </div>`;

  if (!history.length) {
    html += `
      <div class="empty-state">
        <span class="empty-icon">♠</span>
        <h2>Aún no tienes diagnósticos</h2>
        <p>Completa tu primer test para ver tu mapa de habilidades y plan de mejora.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px">
          <button class="btn btn-secondary" onclick="startNewTest('mental')">🧠 Comenzar Test Mental</button>
          <button class="btn btn-primary"   onclick="startNewTest('technical')">⚙️ Comenzar Test Técnico</button>
        </div>
      </div>`;
    document.getElementById('dashboard-content').innerHTML = html;
    return;
  }

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const hasBoth = mentalSc && techSc;
  html += `<div class="tabs">
    ${hasBoth ? `<button class="tab-btn active" onclick="dashTab('combined')">🔀 Vista Combinada</button>` : ''}
    <button class="tab-btn ${!hasBoth ? 'active' : ''}" onclick="dashTab('mental')">🧠 Mental ${mentalSc ? '' : '<span style=\'font-size:0.7rem;color:var(--text3)\'>— pendiente</span>'}</button>
    <button class="tab-btn" onclick="dashTab('technical')">⚙️ Técnico ${techSc ? '' : '<span style=\'font-size:0.7rem;color:var(--text3)\'>— pendiente</span>'}</button>
    <button class="tab-btn" onclick="dashTab('history')">📅 Historial</button>
    <button class="tab-btn" onclick="dashTab('benchmark')">🏅 Benchmark</button>
  </div>`;

  // ─── TAB: Vista combinada ─────────────────────────────────────────────────
  if (hasBoth) {
    html += `<div id="dtab-combined">`;
    html += `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <!-- Radar Mental -->
        <div class="card">
          <div class="card-header">
            <span class="card-icon">🧠</span>
            <div><h2>Mental</h2><div class="card-sub" style="color:var(--accent)">${mentalOv}% · ${mentalLvl.label}</div></div>
          </div>
          <canvas id="dash-radar-mental" style="max-height:280px"></canvas>
        </div>
        <!-- Radar Técnico -->
        <div class="card">
          <div class="card-header">
            <span class="card-icon">⚙️</span>
            <div><h2>Técnico</h2><div class="card-sub" style="color:#4DB6AC">${techOv}% · ${techLvl.label}</div></div>
          </div>
          <canvas id="dash-radar-tech" style="max-height:280px"></canvas>
        </div>
      </div>`;

    // Plan combinado (top 3 brechas de cada test)
    const mentalGaps = EVHAPO_CATEGORIES.map(c => ({ ...c, pct: mentalSc[c.key] || 0 }))
      .filter(c => c.pct < 80).sort((a, b) => a.pct - b.pct).slice(0, 3);
    const techGaps   = TECHNICAL_CATEGORIES.map(c => ({ ...c, pct: techSc[c.key] || 0 }))
      .filter(c => c.pct < 80).sort((a, b) => a.pct - b.pct).slice(0, 3);

    html += `
      <div class="card">
        <div class="card-header">
          <span class="card-icon">🗓️</span>
          <div><h2>Plan de Mejora Combinado</h2><div class="card-sub">Tus principales brechas de ambos diagnósticos</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
          <div>
            <div style="font-size:0.8rem;font-weight:700;color:var(--accent);margin-bottom:12px;text-transform:uppercase">🧠 Brechas Mentales</div>
            ${mentalGaps.length ? mentalGaps.map(c => `
              <div class="mini-gap" style="border-left:3px solid ${c.color}">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span>${c.icon} ${c.label}</span>
                  <span style="color:${c.color};font-weight:700">${c.pct}%</span>
                </div>
                <div class="cat-score-bar" style="height:6px">
                  <div class="cat-score-fill" style="width:${c.pct}%;background:${c.color}"></div>
                </div>
              </div>`).join('') : '<p class="text-muted" style="font-size:0.875rem">¡Todas las áreas mentales en élite!</p>'}
          </div>
          <div>
            <div style="font-size:0.8rem;font-weight:700;color:#4DB6AC;margin-bottom:12px;text-transform:uppercase">⚙️ Brechas Técnicas</div>
            ${techGaps.length ? techGaps.map(c => `
              <div class="mini-gap" style="border-left:3px solid ${c.color}">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span>${c.icon} ${c.label}</span>
                  <span style="color:${c.color};font-weight:700">${c.pct}%</span>
                </div>
                <div class="cat-score-bar" style="height:6px">
                  <div class="cat-score-fill" style="width:${c.pct}%;background:${c.color}"></div>
                </div>
              </div>`).join('') : '<p class="text-muted" style="font-size:0.875rem">¡Todas las áreas técnicas en élite!</p>'}
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">
          <button class="btn btn-secondary btn-sm" onclick="App.go('results', ${latestMental.id})">Ver informe mental →</button>
          <button class="btn btn-primary btn-sm"   onclick="App.go('results', ${latestTechnical.id})">Ver informe técnico →</button>
        </div>
      </div>`;
    html += `</div>`;
  }

  // ─── TAB: Mental ─────────────────────────────────────────────────────────
  html += `<div id="dtab-mental" ${hasBoth ? 'style="display:none"' : ''}>`;
  if (mentalSc) {
    const mentalCatData = EVHAPO_CATEGORIES.map(c => ({ ...c, pct: mentalSc[c.key] || 0 }));
    html += renderTestTab(mentalCatData, mentalOv, mentalLvl, latestMental.id, 'dash-radar-mental-solo', user, 'mental');
  } else {
    html += `
      <div class="empty-state">
        <span class="empty-icon">🧠</span>
        <h2>Test Mental pendiente</h2>
        <p>Completa el diagnóstico mental para ver tus habilidades psicológicas como jugador.</p>
        <button class="btn btn-secondary mt-4" onclick="startNewTest('mental')">Comenzar Test Mental →</button>
      </div>`;
  }
  html += `</div>`;

  // ─── TAB: Técnico ─────────────────────────────────────────────────────────
  html += `<div id="dtab-technical" style="display:none">`;
  if (techSc) {
    const techCatData = TECHNICAL_CATEGORIES.map(c => ({ ...c, pct: techSc[c.key] || 0 }));
    html += renderTestTab(techCatData, techOv, techLvl, latestTechnical.id, 'dash-radar-tech-solo', user, 'technical');
  } else {
    html += `
      <div class="empty-state">
        <span class="empty-icon">⚙️</span>
        <h2>Test Técnico pendiente</h2>
        <p>Completa el diagnóstico técnico para medir tus conocimientos de Texas Hold'em.</p>
        <button class="btn btn-primary mt-4" onclick="startNewTest('technical')">Comenzar Test Técnico →</button>
      </div>`;
  }
  html += `</div>`;

  // ─── TAB: Historial ───────────────────────────────────────────────────────
  html += `<div id="dtab-history" style="display:none">`;
  html += history.map(s => {
    const sc  = typeof s.scores === 'string' ? JSON.parse(s.scores) : s.scores;
    const tt  = s.test_type || 'mental';
    const ov  = tt === 'technical' ? getTechnicalOverallScore(sc) : getOverallScore(sc);
    const lv  = tt === 'technical' ? getTechnicalLevel(ov) : getLevel(ov);
    const dt  = new Date(s.completed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    const badge = tt === 'technical' ? '⚙️ Técnico' : '🧠 Mental';
    return `
      <div class="history-item" onclick="App.go('results', ${s.id})">
        <div>
          <div style="font-weight:700">${dt}</div>
          <div class="history-date">${badge} · ${lv.label}</div>
        </div>
        <div class="history-score">${ov}%</div>
        <button class="btn btn-secondary btn-sm">Ver →</button>
      </div>`;
  }).join('');
  html += `</div>`;

  // ─── TAB: Benchmark ───────────────────────────────────────────────────────
  html += `<div id="dtab-benchmark" style="display:none">`;
  if (Object.keys(benchmark).length > 0 && mentalSc) {
    const benchCats = EVHAPO_CATEGORIES.filter(c => benchmark[c.key] !== undefined);
    html += `
      <div class="card">
        <div class="card-header"><span class="card-icon">🏅</span><div><h2>Benchmark Global 🧠 Mental</h2><div class="card-sub">Tu nivel vs. promedio de la comunidad EVHAPO</div></div></div>
        ${benchCats.map(c => {
          const myPct  = mentalSc[c.key] || 0;
          const avgPct = benchmark[c.key] || 0;
          const diff   = myPct - avgPct;
          return `
            <div style="margin-bottom:18px">
              <div style="display:flex;justify-content:space-between;font-size:0.875rem;font-weight:600;margin-bottom:6px">
                <span>${c.icon} ${c.label}</span>
                <span style="color:${diff >= 0 ? 'var(--green)' : 'var(--red)'}">${diff >= 0 ? '+' : ''}${diff.toFixed(1)} vs promedio</span>
              </div>
              <div class="benchmark-bar">
                <div class="benchmark-label" style="font-size:0.8rem;color:var(--blue)">Tú</div>
                <div class="benchmark-track"><div class="benchmark-fill user" style="width:${myPct}%"></div></div>
                <div class="benchmark-pct" style="color:var(--blue)">${myPct}%</div>
              </div>
              <div class="benchmark-bar">
                <div class="benchmark-label" style="font-size:0.8rem;color:var(--accent)">Promedio</div>
                <div class="benchmark-track"><div class="benchmark-fill" style="width:${avgPct}%"></div></div>
                <div class="benchmark-pct">${avgPct}%</div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  } else {
    html += '<div class="alert alert-info">El benchmark estará disponible cuando más jugadores completen el diagnóstico.</div>';
  }
  html += `</div>`;

  document.getElementById('dashboard-content').innerHTML = html;

  // ─── Dibujar radares ──────────────────────────────────────────────────────
  setTimeout(() => {
    if (hasBoth && mentalSc) {
      drawDashRadar('dash-radar-mental', EVHAPO_CATEGORIES, mentalSc, 'rgba(212,175,55,0.9)', 'rgba(212,175,55,0.12)');
      drawDashRadar('dash-radar-tech',   TECHNICAL_CATEGORIES, techSc,  'rgba(77,182,172,0.9)', 'rgba(77,182,172,0.12)');
    }
    if (!hasBoth && mentalSc)  drawDashRadar('dash-radar-mental-solo', EVHAPO_CATEGORIES, mentalSc, 'rgba(212,175,55,0.9)', 'rgba(212,175,55,0.12)');
    if (!hasBoth && techSc)    drawDashRadar('dash-radar-tech-solo',   TECHNICAL_CATEGORIES, techSc, 'rgba(77,182,172,0.9)', 'rgba(77,182,172,0.12)');
  }, 150);
}

function renderTestTab(catData, overall, level, sessionId, canvasId, user, testType) {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
      <div class="card">
        <div class="card-header"><span class="card-icon">🕸️</span><div><h2>Telaraña</h2><div class="card-sub" style="color:${testType === 'technical' ? '#4DB6AC' : 'var(--accent)'}">${overall}% · ${level.label}</div></div></div>
        <canvas id="${canvasId}" style="max-height:280px"></canvas>
      </div>
      <div>
        <div class="category-scores" style="grid-template-columns:1fr">
          ${catData.sort((a, b) => a.pct - b.pct).map(c => {
            const color = c.pct >= 80 ? '#22c55e' : c.pct >= 60 ? '#f59e0b' : c.pct >= 40 ? '#f97316' : '#ef4444';
            return `
              <div class="cat-score-card" style="padding:10px 14px">
                <div class="cat-score-header">
                  <div class="cat-score-name" style="font-size:0.85rem">${c.icon} ${c.label}</div>
                  <div class="cat-score-pct" style="color:${color}">${c.pct}%</div>
                </div>
                <div class="cat-score-bar"><div class="cat-score-fill" style="width:${c.pct}%;background:${color}"></div></div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="App.go('results', ${sessionId})">Ver informe completo →</button>
    </div>`;
}

function drawDashRadar(canvasId, categories, scores, borderColor, bgColor) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: categories.map(c => c.label),
      datasets: [{
        label: 'Tu nivel',
        data: categories.map(c => scores[c.key] || 0),
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: 2,
        pointBackgroundColor: categories.map(c =>
          (scores[c.key] || 0) >= 80 ? '#22c55e' : (scores[c.key] || 0) >= 60 ? '#f59e0b' : '#ef4444'
        ),
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { stepSize: 20, color: '#64748b', font: { size: 9 }, backdropColor: 'transparent' },
          grid: { color: 'rgba(255,255,255,0.07)' },
          angleLines: { color: 'rgba(255,255,255,0.07)' },
          pointLabels: { color: '#94a3b8', font: { size: 9 } },
        },
      },
    },
  });
}

function dashTab(tab) {
  ['combined','mental','technical','history','benchmark'].forEach(t => {
    const el  = document.getElementById(`dtab-${t}`);
    const btn = document.querySelector(`[onclick="dashTab('${t}')"]`);
    if (el)  el.style.display  = t === tab ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', t === tab);
  });
}

async function startNewTest(testType = 'mental') {
  if (!Api.isLoggedIn()) { App.go('login'); return; }
  try {
    const result = await Api.createPayment('demo', 'US', testType);
    if (result.session_id) {
      localStorage.setItem('evhapo_session', result.session_id);
      localStorage.setItem('evhapo_test_type', testType);
      App.go('test');
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
}
