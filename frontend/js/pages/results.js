let _radarChart = null;
let _radarChart2 = null;

// Datos del resultado actual para el PDF (evitar JSON inline en onclick)
let _currentResultData = { userName: '', overall: 0, scores: {} };

function downloadPDF() {
  const { userName, overall, scores } = _currentResultData;
  exportToPDF(userName, overall, scores);
}

// Devuelve las categorías y funciones correctas según el tipo de test
function getTestMeta(testType) {
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();
  if (testType === 'technical') {
    return {
      categories: I18N.techCats(),
      getScore: getTechnicalOverallScore,
      getLevel: getTechnicalLevel,
      label: isEN ? '⚙️ Technical' : isPT ? '⚙️ Técnico' : '⚙️ Técnico',
    };
  }
  return {
    categories: I18N.cats(),
    getScore: getOverallScore,
    getLevel: getLevel,
    label: isEN ? '🧠 Mental' : isPT ? '🧠 Mental' : '🧠 Mental',
  };
}

async function renderResults(sessionId) {
  if (!Api.isLoggedIn()) { App.go('login'); return; }

  const isPT = I18N.isPT();
  const isEN = I18N.isEN();
  document.getElementById('app').innerHTML = `${renderNavbar()}<div class="page"><div style="text-align:center;padding:60px"><div class="spinner" style="margin:0 auto"></div><p style="margin-top:16px;color:var(--text2)">${isEN ? 'Calculating your diagnosis...' : isPT ? 'Calculando seu diagnóstico...' : 'Calculando tu diagnóstico...'}</p></div></div>`;

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

    // Guardar para uso en downloadPDF()
    _currentResultData = {
      userName: `${data.nombre} ${data.apellido}`,
      overall,
      scores,
    };

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
            ? `<span class="cat-tag foco">▲ ${isEN ? 'Area for improvement' : isPT ? 'Área de melhoria' : 'Área de mejora'}</span>`
            : `<span class="cat-tag ok">✓ ${isEN ? 'Consolidated strength' : isPT ? 'Ponto forte consolidado' : 'Fortaleza consolidada'}</span>`}
        </div>`;
    }).join('');

    const testBadge = testType === 'technical'
      ? `<span class="chip" style="background:rgba(0,105,92,0.3);color:#4DB6AC">⚙️ ${isEN ? 'Technical Diagnosis' : isPT ? 'Diagnóstico Técnico' : 'Diagnóstico Técnico'}</span>`
      : `<span class="chip" style="background:rgba(63,81,181,0.3);color:#9FA8DA">🧠 ${isEN ? 'Mental Diagnosis' : isPT ? 'Diagnóstico Mental' : 'Diagnóstico Mental'}</span>`;

    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="results-hero">
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">
          ${testBadge}
          <div class="chip">♠ ${new Date(data.completed_at).toLocaleDateString(isEN ? 'en-GB' : isPT ? 'pt-BR' : 'es-ES', {day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <h1>${isEN ? `Your diagnosis is ready, ${data.nombre}!` : isPT ? `Seu diagnóstico está pronto, ${data.nombre}!` : `¡Tu diagnóstico está listo, ${data.nombre}!`}</h1>
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
          <button class="btn btn-secondary btn-sm" onclick="App.go('dashboard')">← ${isEN ? 'My dashboard' : isPT ? 'Meu painel' : 'Mi dashboard'}</button>
          <button class="btn btn-primary btn-sm" onclick="downloadPDF()">
            ↓ ${isEN ? 'Download PDF report' : isPT ? 'Baixar relatório PDF' : 'Descargar informe PDF'}
          </button>
        </div>

        <div class="tabs">
          <button class="tab-btn active" onclick="switchTab('radar')">🕸️ ${isEN ? 'Spider Chart' : isPT ? 'Gráfico Aranha' : 'Gráfico Telaraña'}</button>
          <button class="tab-btn" onclick="switchTab('scores')">📊 ${isEN ? 'Scores' : isPT ? 'Pontuações' : 'Puntajes'}</button>
          <button class="tab-btn" onclick="switchTab('report')">📋 ${isEN ? 'Report' : isPT ? 'Relatório' : 'Informe'}</button>
          <button class="tab-btn" onclick="switchTab('plan')">🗓️ ${isEN ? 'Work Plan' : isPT ? 'Plano de Trabalho' : 'Plan de Trabajo'}</button>
        </div>

        <!-- TAB: Radar -->
        <div id="tab-radar" class="tab-content">
          <div class="card">
            <div class="card-header">
              <span class="card-icon">🕸️</span>
              <div>
                <h2>${isEN ? 'Skills Map' : isPT ? 'Mapa de Habilidades' : 'Mapa de Habilidades'} ${meta.label}</h2>
                <div class="card-sub">${isEN ? 'The closer to the outer edge, the greater your development in each area' : isPT ? 'Quanto mais perto da borda exterior, maior é seu desenvolvimento em cada área' : 'Cuánto más cerca del borde exterior, mayor es tu desarrollo en cada área'}</div>
              </div>
            </div>
            <div class="radar-container">
              <canvas id="radarChart"></canvas>
            </div>
          </div>

          <!-- Leyenda de colores -->
          <div class="radar-legend">
            <span><span class="legend-dot" style="background:#22c55e"></span> ${isEN ? 'Strength (≥80%)' : isPT ? 'Ponto forte (≥80%)' : 'Fortaleza (≥80%)'}</span>
            <span><span class="legend-dot" style="background:#f59e0b"></span> ${isEN ? 'Developing (60–79%)' : isPT ? 'Em desenvolvimento (60–79%)' : 'En desarrollo (60–79%)'}</span>
            <span><span class="legend-dot" style="background:#f97316"></span> ${isEN ? 'Area for improvement (40–59%)' : isPT ? 'Área de melhoria (40–59%)' : 'Área de mejora (40–59%)'}</span>
            <span><span class="legend-dot" style="background:#ef4444"></span> ${isEN ? 'Critical (&lt;40%)' : isPT ? 'Crítico (&lt;40%)' : 'Crítico (&lt;40%)'}</span>
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
                <h2>${isEN ? 'Your Work Plan' : isPT ? 'Seu Plano de Trabalho' : 'Tu Plan de Trabajo'}</h2>
                <div class="card-sub">${isEN ? 'Personalised week-by-week improvement programme based on your gaps' : isPT ? 'Programa de melhoria personalizado semana a semana com base em suas lacunas' : 'Programa de mejora personalizado semana a semana basado en tus brechas'}</div>
              </div>
            </div>
            <div id="workplan-content">
              ${buildWorkPlan(scores, meta.categories)}
            </div>
          </div>
        </div>

        <div class="export-bar" style="margin-top:32px">
          <button class="btn btn-outline" onclick="App.go('dashboard')">← ${isEN ? 'Back to dashboard' : isPT ? 'Voltar ao painel' : 'Volver al dashboard'}</button>
          <button class="btn btn-primary" onclick="downloadPDF()">
            ↓ ${isEN ? 'Download PDF report' : isPT ? 'Baixar relatório PDF' : 'Descargar informe PDF'}
          </button>
        </div>
      </div>`;

    // Render radar chart con las categorías correctas
    setTimeout(() => drawRadarChart(catData, 'radarChart', meta.label), 100);

  } catch (e) {
    const _isPT = I18N.isPT();
    const _isEN = I18N.isEN();
    document.getElementById('app').innerHTML = `${renderNavbar()}<div class="page"><div class="form-error">${_isEN ? 'Error loading results' : _isPT ? 'Erro ao carregar resultados' : 'Error al cargar resultados'}: ${e.message}</div><button class="btn btn-secondary mt-4" onclick="App.go('dashboard')">← ${_isEN ? 'Dashboard' : _isPT ? 'Painel' : 'Dashboard'}</button></div>`;
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
          label: `${testLabel || (I18N && I18N.isEN() ? 'Your level' : I18N && I18N.isPT() ? 'Seu nível' : 'Tu nivel')} (%)`,
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
          label: (I18N && I18N.isEN()) ? 'Elite target (80%)' : (I18N && I18N.isPT()) ? 'Meta elite (80%)' : 'Objetivo élite (80%)',
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
