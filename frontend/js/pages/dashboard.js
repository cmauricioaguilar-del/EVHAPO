async function renderDashboard() {
  if (!Api.isLoggedIn()) { App.go('login'); return; }
  const user = Api.currentUser();

  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div class="page-wide">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:1.8rem;font-weight:800">Mi Dashboard</h1>
          <p class="text-muted">Bienvenido/a, <strong>${user.nombre}</strong>. Aquí puedes ver tu progreso y resultados.</p>
        </div>
        <button class="btn btn-primary" onclick="startNewTest()">♠ Nuevo test</button>
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
  const latest = history[0];
  const latestScores = latest ? (typeof latest.scores === 'string' ? JSON.parse(latest.scores) : latest.scores) : null;
  const overall = latestScores ? getOverallScore(latestScores) : null;
  const level = overall !== null ? getLevel(overall) : null;

  let html = '';

  // Stats
  html += `
    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-val">${history.length}</div>
        <div class="stat-label">Tests completados</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:${overall !== null ? (overall >= 80 ? 'var(--green)' : overall >= 60 ? 'var(--accent)' : 'var(--red)') : 'var(--text2)'}">${overall !== null ? overall + '%' : '—'}</div>
        <div class="stat-label">Último puntaje global</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${level ? level.label : '—'}</div>
        <div class="stat-label">Nivel actual</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="font-size:1.4rem">${latestScores ? (EVHAPO_CATEGORIES.map(c => ({...c, pct: latestScores[c.key]||0})).sort((a,b) => b.pct-a.pct)[0].icon + ' ' + EVHAPO_CATEGORIES.map(c => ({...c, pct: latestScores[c.key]||0})).sort((a,b) => b.pct-a.pct)[0].label) : '—'}</div>
        <div class="stat-label">Mayor fortaleza</div>
      </div>
    </div>`;

  if (history.length === 0) {
    html += `
      <div class="empty-state">
        <span class="empty-icon">♠</span>
        <h2>Aún no tienes resultados</h2>
        <p>Completa tu primer diagnóstico para ver tu mapa de habilidades.</p>
        <button class="btn btn-primary mt-4" onclick="startNewTest()">Comenzar ahora →</button>
      </div>`;
  } else {
    html += `<div class="tabs">
      <button class="tab-btn active" onclick="dashTab('latest')">📊 Último resultado</button>
      <button class="tab-btn" onclick="dashTab('history')">📅 Historial</button>
      <button class="tab-btn" onclick="dashTab('benchmark')">🏅 Benchmark</button>
    </div>`;

    // Latest tab
    html += `<div id="dtab-latest">`;
    if (latestScores) {
      const catData = EVHAPO_CATEGORIES.map(c => ({ ...c, pct: latestScores[c.key] || 0 }));
      html += `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
          <div class="card">
            <div class="card-header"><span class="card-icon">🕸️</span><div><h2>Telaraña de Habilidades</h2></div></div>
            <canvas id="dash-radar" style="max-height:320px"></canvas>
          </div>
          <div>
            <div class="category-scores" style="grid-template-columns:1fr">
              ${catData.sort((a,b) => a.pct-b.pct).map(c => {
                const color = c.pct >= 80 ? '#22c55e' : c.pct >= 60 ? '#f59e0b' : '#ef4444';
                return `
                  <div class="cat-score-card" style="padding:12px 16px">
                    <div class="cat-score-header">
                      <div class="cat-score-name" style="font-size:0.875rem">${c.icon} ${c.label}</div>
                      <div class="cat-score-pct" style="color:${color};font-size:1rem">${c.pct}%</div>
                    </div>
                    <div class="cat-score-bar"><div class="cat-score-fill" style="width:${c.pct}%;background:${color}"></div></div>
                  </div>`;
              }).join('')}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="App.go('results', ${latest.id})">Ver informe completo →</button>
          <button class="btn btn-secondary" onclick="exportToPDF('${user.nombre}', ${overall}, ${JSON.stringify(latestScores)})">↓ Descargar PDF</button>
        </div>`;
    }
    html += `</div>`;

    // History tab
    html += `<div id="dtab-history" style="display:none">`;
    if (history.length === 0) {
      html += '<div class="empty-state"><p>Sin historial aún.</p></div>';
    } else {
      html += history.map(s => {
        const sc = typeof s.scores === 'string' ? JSON.parse(s.scores) : s.scores;
        const ov = getOverallScore(sc);
        const lv = getLevel(ov);
        const date = new Date(s.completed_at).toLocaleDateString('es-ES', {day:'numeric',month:'short',year:'numeric'});
        return `
          <div class="history-item" onclick="App.go('results', ${s.id})">
            <div>
              <div style="font-weight:700">${date}</div>
              <div class="history-date">${lv.label}</div>
            </div>
            <div class="history-score">${ov}%</div>
            <button class="btn btn-secondary btn-sm">Ver →</button>
          </div>`;
      }).join('');
    }
    html += `</div>`;

    // Benchmark tab
    html += `<div id="dtab-benchmark" style="display:none">`;
    if (Object.keys(benchmark).length > 0 && latestScores) {
      html += `
        <div class="card">
          <div class="card-header"><span class="card-icon">🏅</span><div><h2>Benchmark Global</h2><div class="card-sub">Comparación con el promedio de la comunidad EVHAPO</div></div></div>
          <div class="benchmark-legend">
            <span><span class="legend-dot" style="background:var(--blue)"></span>Tu puntaje</span>
            <span><span class="legend-dot" style="background:var(--accent)"></span>Promedio comunidad</span>
          </div>
          ${EVHAPO_CATEGORIES.map(c => {
            const myPct = latestScores[c.key] || 0;
            const avgPct = benchmark[c.key] || 0;
            return `
              <div style="margin-bottom:16px">
                <div style="font-size:0.875rem;font-weight:600;margin-bottom:6px">${c.icon} ${c.label}</div>
                <div class="benchmark-bar">
                  <div class="benchmark-label" style="text-align:right;font-size:0.8rem;color:var(--blue)">Tú</div>
                  <div class="benchmark-track">
                    <div class="benchmark-fill user" style="width:${myPct}%"></div>
                  </div>
                  <div class="benchmark-pct" style="color:var(--blue)">${myPct}%</div>
                </div>
                <div class="benchmark-bar">
                  <div class="benchmark-label" style="text-align:right;font-size:0.8rem;color:var(--accent)">Promedio</div>
                  <div class="benchmark-track">
                    <div class="benchmark-fill" style="width:${avgPct}%"></div>
                  </div>
                  <div class="benchmark-pct">${avgPct}%</div>
                </div>
              </div>`;
          }).join('')}
        </div>`;
    } else {
      html += '<div class="alert alert-info">El benchmark estará disponible una vez que más jugadores completen el diagnóstico.</div>';
    }
    html += `</div>`;
  }

  document.getElementById('dashboard-content').innerHTML = html;

  // Draw radar
  setTimeout(() => {
    const ctx = document.getElementById('dash-radar');
    if (ctx && latestScores) {
      new Chart(ctx, {
        type: 'radar',
        data: {
          labels: EVHAPO_CATEGORIES.map(c => c.label),
          datasets: [{
            label: 'Tu nivel',
            data: EVHAPO_CATEGORIES.map(c => latestScores[c.key] || 0),
            backgroundColor: 'rgba(212,175,55,0.15)',
            borderColor: 'rgba(212,175,55,0.9)',
            borderWidth: 2,
            pointBackgroundColor: EVHAPO_CATEGORIES.map(c => (latestScores[c.key]||0) >= 80 ? '#22c55e' : '#f59e0b'),
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
              grid: { color: 'rgba(255,255,255,0.08)' },
              angleLines: { color: 'rgba(255,255,255,0.08)' },
              pointLabels: { color: '#94a3b8', font: { size: 9 } },
            },
          },
        },
      });
    }
  }, 150);
}

function dashTab(tab) {
  ['latest','history','benchmark'].forEach(t => {
    const el = document.getElementById(`dtab-${t}`);
    const btn = document.querySelector(`[onclick="dashTab('${t}')"]`);
    if (el) el.style.display = t === tab ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', t === tab);
  });
}

async function startNewTest() {
  if (!Api.isLoggedIn()) { App.go('login'); return; }
  const btn = event.target;
  btn.disabled = true; btn.textContent = 'Iniciando...';
  try {
    const result = await Api.createPayment('demo', 'US');
    if (result.session_id) {
      localStorage.setItem('evhapo_session', result.session_id);
      App.go('test');
    }
  } catch (e) {
    alert('Error: ' + e.message);
    btn.disabled = false; btn.textContent = '♠ Nuevo test';
  }
}
