let _radarChart = null;
let _radarChart2 = null;

// Devuelve las categorías y funciones correctas según el tipo de test
function getTestMeta(testType) {
  if (testType === 'technical') {
    return {
      categories: TECHNICAL_CATEGORIES,
      getScore: getTechnicalOverallScore,
      getLevel: getTechnicalLevel,
      label: '⚙️ Técnico',
    };
  }
  return {
    categories: EVHAPO_CATEGORIES,
    getScore: getOverallScore,
    getLevel: getLevel,
    label: '🧠 Mental',
  };
}

async function renderResults(sessionId) {
  if (!Api.isLoggedIn()) { App.go('login'); return; }

  document.getElementById('app').innerHTML = `${renderNavbar()}<div class="page"><div style="text-align:center;padding:60px"><div class="spinner" style="margin:0 auto"></div><p style="margin-top:16px;color:var(--text2)">Calculando tu diagnóstico...</p></div></div>`;

  try {
    const sid = sessionId || localStorage.getItem('evhapo_session');
    const data = await Api.getResults(sid);
    const scores = data.scores || {};

    // Detectar tipo de test y obtener meta (categorías, funciones, etiqueta)
    const testType = data.test_type || 'mental';
    const meta = getTestMeta(testType);
    const overall = meta.getScore(scores);
    const level = meta.getLevel(overall);
    const user = Api.currentUser();

    const catData = meta.categories.map(c => ({
      ...c,
      pct: scores[c.key] || 0,
    }));

    const scoreCardsHtml = catData.map(c => {
      const needsFocus = c.pct < 80;
      const color = c.pct >= 80 ? '#22c55e' : c.pct >= 60 ? '#f59e0b' : c.pct >= 40 ? '#f97316' : '#ef4444';
      return `
        <div class="cat-score-card">
          <div class="cat-score-header">
            <div class="cat-score-name">${c.icon} ${c.label}</div>
            <div class="cat-score-pct" style="color:${color}">${c.pct}%</div>
          </div>
          <div class="cat-score-bar">
            <div class="cat-score-fill" style="width:${c.pct}%;background:${color}"></div>
          </div>
          ${needsFocus
            ? `<span class="cat-tag foco">▲ Área de mejora</span>`
            : `<span class="cat-tag ok">✓ Fortaleza consolidada</span>`}
        </div>`;
    }).join('');

    const testBadge = testType === 'technical'
      ? `<span class="chip" style="background:rgba(0,105,92,0.3);color:#4DB6AC">⚙️ Diagnóstico Técnico</span>`
      : `<span class="chip" style="background:rgba(63,81,181,0.3);color:#9FA8DA">🧠 Diagnóstico Mental</span>`;

    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="results-hero">
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">
          ${testBadge}
          <div class="chip">♠ ${new Date(data.completed_at).toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <h1>¡Tu diagnóstico está listo, ${data.nombre}!</h1>
        <div class="results-hero" style="padding:0">
          <div class="results-level ${level.cls}">${level.label}</div>
          <div class="score-circle" style="--pct:${overall}">
            <div class="score-inner">
              <div class="score-pct">${overall}%</div>
              <div class="score-label">GLOBAL</div>
            </div>
          </div>
          <p style="color:var(--text2);max-width:500px">${level.desc}</p>
        </div>
      </div>

      <div class="page">
        <div class="export-bar">
          <button class="btn btn-secondary btn-sm" onclick="App.go('dashboard')">← Mi dashboard</button>
          <button class="btn btn-primary btn-sm" onclick="exportToPDF('${data.nombre} ${data.apellido}', ${overall}, ${JSON.stringify(scores)})">
            ↓ Descargar informe PDF
          </button>
        </div>

        <div class="tabs">
          <button class="tab-btn active" onclick="switchTab('radar')">🕸️ Gráfico Telaraña</button>
          <button class="tab-btn" onclick="switchTab('scores')">📊 Puntajes</button>
          <button class="tab-btn" onclick="switchTab('report')">📋 Informe</button>
          <button class="tab-btn" onclick="switchTab('plan')">🗓️ Plan de Trabajo</button>
        </div>

        <!-- TAB: Radar -->
        <div id="tab-radar" class="tab-content">
          <div class="card">
            <div class="card-header">
              <span class="card-icon">🕸️</span>
              <div>
                <h2>Mapa de Habilidades ${meta.label}</h2>
                <div class="card-sub">Cuánto más cerca del borde exterior, mayor es tu desarrollo en cada área</div>
              </div>
            </div>
            <div class="radar-container">
              <canvas id="radarChart"></canvas>
            </div>
          </div>

          <!-- Leyenda de colores -->
          <div class="radar-legend">
            <span><span class="legend-dot" style="background:#22c55e"></span> Fortaleza (≥80%)</span>
            <span><span class="legend-dot" style="background:#f59e0b"></span> En desarrollo (60–79%)</span>
            <span><span class="legend-dot" style="background:#f97316"></span> Área de mejora (40–59%)</span>
            <span><span class="legend-dot" style="background:#ef4444"></span> Crítico (&lt;40%)</span>
          </div>
        </div>

        <!-- TAB: Scores -->
        <div id="tab-scores" class="tab-content" style="display:none">
          <div class="category-scores">${scoreCardsHtml}</div>
        </div>

        <!-- TAB: Report -->
        <div id="tab-report" class="tab-content" style="display:none">
          <div id="report-content">
            ${buildReport(scores, data.nombre, meta.categories)}
          </div>
        </div>

        <!-- TAB: Plan -->
        <div id="tab-plan" class="tab-content" style="display:none">
          <div class="card">
            <div class="card-header">
              <span class="card-icon">🗓️</span>
              <div>
                <h2>Tu Plan de Trabajo</h2>
                <div class="card-sub">Programa de mejora personalizado semana a semana basado en tus brechas</div>
              </div>
            </div>
            <div id="workplan-content">
              ${buildWorkPlan(scores, meta.categories)}
            </div>
          </div>
        </div>

        <div class="export-bar" style="margin-top:32px">
          <button class="btn btn-outline" onclick="App.go('dashboard')">← Volver al dashboard</button>
          <button class="btn btn-primary" onclick="exportToPDF('${data.nombre} ${data.apellido}', ${overall}, ${JSON.stringify(scores)})">
            ↓ Descargar informe PDF
          </button>
        </div>
      </div>`;

    // Render radar chart con las categorías correctas
    setTimeout(() => drawRadarChart(catData, 'radarChart', meta.label), 100);

  } catch (e) {
    document.getElementById('app').innerHTML = `${renderNavbar()}<div class="page"><div class="form-error">Error al cargar resultados: ${e.message}</div><button class="btn btn-secondary mt-4" onclick="App.go('dashboard')">← Dashboard</button></div>`;
  }
}

function drawRadarChart(catData, canvasId = 'radarChart', testLabel = '') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  // Destruir instancia previa si existe
  if (canvasId === 'radarChart' && _radarChart) { _radarChart.destroy(); _radarChart = null; }
  if (canvasId === 'radarChart2' && _radarChart2) { _radarChart2.destroy(); _radarChart2 = null; }

  const accentColor = testLabel.includes('Técnico')
    ? 'rgba(77,182,172,0.9)'    // verde azulado para técnico
    : 'rgba(212,175,55,0.9)';   // dorado para mental
  const bgColor = testLabel.includes('Técnico')
    ? 'rgba(77,182,172,0.12)'
    : 'rgba(212,175,55,0.12)';

  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: catData.map(c => c.label),
      datasets: [
        {
          label: `${testLabel || 'Tu nivel'} (%)`,
          data: catData.map(c => c.pct),
          backgroundColor: bgColor,
          borderColor: accentColor,
          borderWidth: 2,
          pointBackgroundColor: catData.map(c =>
            c.pct >= 80 ? '#22c55e' : c.pct >= 60 ? '#f59e0b' : c.pct >= 40 ? '#f97316' : '#ef4444'
          ),
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Objetivo élite (80%)',
          data: catData.map(() => 80),
          backgroundColor: 'rgba(59,130,246,0.04)',
          borderColor: 'rgba(59,130,246,0.35)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.r}%`,
          },
        },
      },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { stepSize: 20, color: '#64748b', font: { size: 10 }, backdropColor: 'transparent' },
          grid: { color: 'rgba(255,255,255,0.07)' },
          angleLines: { color: 'rgba(255,255,255,0.07)' },
          pointLabels: {
            color: '#e2e8f0',
            font: { size: 11, weight: '600' },
            callback: (label, idx) => {
              const cat = catData[idx];
              return `${cat ? cat.icon : ''} ${label}`;
            },
          },
        },
      },
    },
  });

  if (canvasId === 'radarChart') _radarChart = chart;
  if (canvasId === 'radarChart2') _radarChart2 = chart;
}

function buildWorkPlan(scores, categories) {
  const cats = (categories || EVHAPO_CATEGORIES).map(c => ({ ...c, pct: scores[c.key] || 0 }));
  cats.sort((a, b) => a.pct - b.pct);
  const gaps = cats.filter(c => c.pct < 80);
  const noFoco = cats.filter(c => c.pct >= 80);

  const weekLabels = ['Semanas 1–2', 'Semanas 3–4', 'Semanas 5–6', 'Semanas 7–8', 'Semanas 9–10'];
  let html = '';

  gaps.slice(0, 5).forEach((cat, i) => {
    const urgency = cat.pct < 40 ? '🔴 CRÍTICO' : cat.pct < 60 ? '🟡 IMPORTANTE' : '🟢 MEJORABLE';
    html += `
      <div class="workplan-item" style="border-left:4px solid ${cat.color};margin-bottom:16px">
        <div class="workplan-week">${weekLabels[i] || 'A trabajar'} · ${urgency}</div>
        <h3 style="color:${cat.color}">${cat.icon} ${cat.label} — ${cat.pct}% → Meta: 80%+</h3>
        <ul class="workplan-tips">
          ${cat.tips.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>`;
  });

  if (noFoco.length) {
    html += `
      <div class="workplan-item no-foco">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <h3 style="margin:0">✅ Fortalezas — No necesitan foco por ahora</h3>
          <span class="no-foco-badge">MANTENER</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${noFoco.map(c => `<span class="chip gold">${c.icon} ${c.label} ${c.pct}%</span>`).join('')}
        </div>
        <p style="margin-top:12px;font-size:0.875rem;color:var(--text2)">Sigue con tus rutinas actuales para mantener estas fortalezas mientras trabajas en las áreas de mejora.</p>
      </div>`;
  }

  if (!gaps.length) {
    html = `<div class="form-success">🏆 ¡Excelente! Todas tus habilidades están en 80% o más. Eres un jugador de élite. Continúa con tus rutinas actuales.</div>`;
  }

  return html;
}

function switchTab(tab) {
  ['radar','scores','report','plan'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const btn = document.querySelector(`[onclick="switchTab('${t}')"]`);
    if (el) el.style.display = t === tab ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', t === tab);
  });
  if (tab === 'radar') {
    const ctx = document.getElementById('radarChart');
    if (ctx && !_radarChart) {
      const result = JSON.parse(localStorage.getItem('evhapo_result') || '{}');
      const scores = result.scores || {};
      const testType = result.test_type || 'mental';
      const meta = getTestMeta(testType);
      drawRadarChart(meta.categories.map(c => ({ ...c, pct: scores[c.key] || 0 })), 'radarChart', meta.label);
    }
  }
}
