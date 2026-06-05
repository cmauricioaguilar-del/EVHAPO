/**
 * mindevbio.js — MinDev Bio integrado en MinDev
 *
 * Correlación biométrica inline — sin servidores externos.
 * Usa el archivo subido en "Análisis de Manos" automáticamente.
 */

const BIO_SERVER = 'http://127.0.0.1:5150';
let _bioPollTimer = null;
let _bioHasServer = false;
let _bioBpm = 0;

async function renderMindevBio() {
  if (!Api.isLoggedIn()) { App.go('login'); return; }

  const isPT = I18N.isPT();
  const isEN = I18N.isEN();

  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div class="page-wide">

      <!-- Cabecera -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:1.8rem;font-weight:800;color:#f472b6">💓 MinDev Bio</h1>
          <p class="text-muted">${isEN
            ? 'Biometric correlation — heart rate vs. poker hands'
            : isPT
            ? 'Correlação biométrica — frequência cardíaca vs. mãos de poker'
            : 'Correlación biométrica — frecuencia cardíaca vs. manos de poker'}</p>
        </div>
        <button class="btn btn-secondary" onclick="bioClear();App.go('dashboard')">
          ← ${isEN ? 'Back to Dashboard' : isPT ? 'Voltar' : 'Volver al Dashboard'}
        </button>
      </div>

      <!-- Wizard de activación + estado HR en tiempo real -->
      <div id="bio-setup-wizard" style="margin-bottom:20px"></div>

      <!-- BPM live (solo visible cuando servidor activo) -->
      <div id="bio-bpm-card" style="display:none;background:rgba(244,114,182,0.08);border:2px solid #f472b6;border-radius:12px;padding:18px;text-align:center;margin-bottom:20px">
        <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">
          ${isEN ? 'HR Server' : 'Servidor HR'} &nbsp;·&nbsp; <span id="bio-server-status" style="color:#4ade80">● ${isEN ? 'Active' : isPT ? 'Ativo' : 'Activo'}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap">
          <div>
            <div id="bio-bpm-value" style="font-size:3rem;font-weight:800;color:#f472b6;line-height:1">--</div>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:4px">BPM live</div>
          </div>
          <div id="bio-bpm-bar" style="display:flex;align-items:flex-end;gap:3px;height:40px"></div>
        </div>
      </div>
      <!-- status oculto para compatibilidad con polling -->
      <span id="bio-server-status-hidden" style="display:none"></span>

      <!-- Contenido -->
      <div id="bio-content">
        <div style="text-align:center;padding:60px;color:var(--muted)">
          <div class="spinner" style="margin:0 auto 20px"></div>
          <p>${isEN ? 'Loading tournament data...' : isPT ? 'Carregando dados do torneio...' : 'Cargando datos del torneo...'}</p>
        </div>
      </div>

    </div>`;

  bioPollServer();

  // Cargar datos — primero desde variable en memoria, luego desde sessionStorage
  if (window._mindevBioFile) {
    await bioLoadData(window._mindevBioFile);
  } else {
    const savedData = sessionStorage.getItem('mindevbio_file_data');
    const savedName = sessionStorage.getItem('mindevbio_file_name');
    if (savedData && savedName) {
      // Reconstruir File desde base64
      const res  = await fetch(savedData);
      const blob = await res.blob();
      const file = new File([blob], savedName);
      window._mindevBioFile = file;
      await bioLoadData(file);
    } else {
      // Intentar cargar el último archivo del servidor
      await bioLoadData(null);
    }
  }
}

// ── Cargar y renderizar datos biométricos ────────────────────────────────────
async function bioLoadData(file) {
  const contentEl = document.getElementById('bio-content');
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();

  try {
    const token = localStorage.getItem('evhapo_token');
    const form  = new FormData();
    if (file) form.append('file', file);

    const res = await fetch('/api/bio/analyze', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body:    file ? form : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.error === 'no_file') {
        contentEl.innerHTML = `
          <div style="text-align:center;padding:60px;color:var(--muted)">
            <div style="font-size:3rem;margin-bottom:16px">📂</div>
            <p style="max-width:400px;margin:0 auto">${isEN
              ? 'Go to Hand Analysis, upload your hand history, and then come back here.'
              : isPT
              ? 'Vá para Análise de Mãos, envie seu histórico e volte aqui.'
              : 'Ve a Análisis de Manos, sube tu historial de manos y regresa aquí.'}</p>
            <button class="btn btn-secondary" onclick="App.go('dashboard')" style="margin-top:20px">
              ${isEN ? 'Go to Hand Analysis' : isPT ? 'Ir para Análise de Mãos' : 'Ir a Análisis de Manos'}
            </button>
          </div>`;
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const d = await res.json();
    if (!d.ok) throw new Error(d.error || 'Error');

    bioRenderDashboard(d, isEN, isPT);
  } catch (e) {
    contentEl.innerHTML = `<div class="form-error">Error: ${e.message}</div>`;
  }
}

// ── Renderizar dashboard biométrico ──────────────────────────────────────────
function bioRenderDashboard(d, isEN, isPT) {
  const contentEl = document.getElementById('bio-content');
  const noSmartwatch = isEN
    ? '⌚ No BPM data — to correlate your heart rate with your hands you need a smartwatch with the MinDev HR app installed on your watch.'
    : isPT
    ? '⌚ Sem dados de BPM — para correlacionar sua frequência cardíaca com suas mãos você precisa de um smartwatch com o app MinDev HR instalado no seu relógio.'
    : '⌚ Sin datos de BPM — para correlacionar tu frecuencia cardíaca con tus manos necesitas un smartwatch con la app MinDev HR instalada en tu reloj.';

  const netColor = d.total_net >= 0 ? '#4ade80' : '#f87171';

  contentEl.innerHTML = `
    <!-- Info torneo -->
    <div style="font-size:1.1rem;font-weight:700;color:#facc15;margin-bottom:16px;letter-spacing:0.01em">
      ${d.room} · ${d.filename}${d.tournament_id ? ` · Torneo #${d.tournament_id}` : ''}
    </div>

    <!-- Aviso sin BPM -->
    ${!d.has_hr ? `
    <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3);border-radius:12px;padding:16px 20px;margin-bottom:20px;font-size:0.88rem;color:#fbbf24">
      ${noSmartwatch}
    </div>` : ''}

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px">
      ${bioKpi(d.total, isEN ? 'Hands' : isPT ? 'Mãos' : 'Manos', '#60a5fa')}
      ${bioKpi(d.won_pct + '%', 'Win Rate', '#4ade80')}
      ${bioKpi(d.sd_pct + '%', 'Showdown', '#facc15')}
      ${bioKpi(d.total_net_str, isEN ? 'Total chips won' : isPT ? 'Fichas ganadas' : 'Total fichas ganadas', netColor)}
      ${d.has_hr ? bioKpi(Math.round(d.hr_data.filter(v=>v).reduce((a,b)=>a+b,0)/d.hr_data.filter(v=>v).length) + ' BPM', isEN ? 'Avg BPM' : 'Prom BPM', '#f472b6') : ''}
    </div>

    <!-- Gráfico fichas ganadas -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">
        ${isEN ? 'Chips won — cumulative' : isPT ? 'Fichas ganadas acumuladas' : 'Fichas ganadas acumuladas por mano'}
      </div>
      <div style="position:relative;height:160px"><canvas id="bio-chart-net"></canvas></div>
    </div>

    <!-- Gráfico stack real -->
    ${d.stack_data && d.stack_data.some(v=>v) ? `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">
        ${isEN ? 'Stack real — hand by hand' : isPT ? 'Stack real por mão' : 'Net acumulado por mano — stack real del hero'}
      </div>
      <div style="position:relative;height:160px"><canvas id="bio-chart-stack"></canvas></div>
    </div>` : ''}

    <!-- Gráfico BPM -->
    ${d.has_hr ? `
    <div style="background:var(--card);border:1px solid #4a2070;border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="font-size:0.72rem;color:#d8b4fe;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">
        💓 ${isEN ? 'Heart rate — by hand' : isPT ? 'Frequência cardíaca por mão' : 'Frecuencia cardíaca — evolución por mano'}
      </div>
      <div style="position:relative;height:160px"><canvas id="bio-chart-hr"></canvas></div>
    </div>` : ''}

    <!-- Tabla detalle de manos -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em">
          ${isEN ? 'Hand by hand detail' : isPT ? 'Detalhe por mão' : 'Detalle por mano'} — BPM ${isEN ? 'by street' : 'por calle'}
        </div>
        <div style="font-size:0.72rem;color:var(--muted)">${d.total} ${isEN ? 'hands' : isPT ? 'mãos' : 'manos'}</div>
      </div>
      <div style="overflow:auto;max-height:380px">
        <table style="width:100%;border-collapse:collapse;font-size:0.78rem">
          <thead>
            <tr style="color:var(--muted);font-size:0.68rem;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid var(--border)">
              <th style="padding:6px 8px;text-align:right;width:36px">#</th>
              <th style="padding:6px 8px;text-align:left">${isEN ? 'Pos.' : 'Pos.'}</th>
              <th style="padding:6px 8px;text-align:left">${isEN ? 'Cards' : isPT ? 'Cartas' : 'Cartas'}</th>
              <th style="padding:6px 8px;text-align:left">Board</th>
              <th style="padding:6px 8px;text-align:left">${isEN ? 'Result' : isPT ? 'Resultado' : 'Resultado'}</th>
              <th style="padding:6px 8px;text-align:right">Net</th>
              ${d.has_hr ? '<th style="padding:6px 8px;text-align:right">BPM</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${d.hands_detail.map(h => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
              <td style="padding:5px 8px;text-align:right;color:var(--muted)">${h.n}</td>
              <td style="padding:5px 8px">${bioPosTag(h.position)}</td>
              <td style="padding:5px 8px;color:#60a5fa;font-weight:600">${h.hole_cards}</td>
              <td style="padding:5px 8px;color:var(--muted)">${h.board}</td>
              <td style="padding:5px 8px">${bioResultTag(h.result)}</td>
              <td style="padding:5px 8px;text-align:right;${h.net > 0 ? 'color:#4ade80' : h.net < 0 ? 'color:#f87171' : 'color:var(--muted)'}">${h.net_str || '—'}</td>
              ${d.has_hr ? `<td style="padding:5px 8px;text-align:right;color:#f472b6;font-weight:600">${h.hr_avg || '—'}</td>` : ''}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Estadísticas por nivel de blinds -->
    ${d.levels && d.levels.length ? `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:14px">
        ${isEN ? 'Stats by blind level' : isPT ? 'Estatísticas por nível de blinds' : 'Estadísticas por nivel de blinds'}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
        <thead>
          <tr style="color:var(--muted);font-size:0.68rem;text-transform:uppercase;border-bottom:1px solid var(--border)">
            <th style="padding:6px 8px;width:24px"></th>
            <th style="padding:6px 8px;text-align:left">Blinds</th>
            <th style="padding:6px 8px;text-align:right">${isEN ? 'Hands' : 'Manos'}</th>
            <th style="padding:6px 8px;text-align:right">Win%</th>
            <th style="padding:6px 8px;text-align:right">Net</th>
          </tr>
        </thead>
        <tbody id="bio-levels-body">
          ${d.levels.map((lv, idx) => `
          <tr style="cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.04)" onclick="bioToggleLevel(${idx})">
            <td id="bio-arrow-${idx}" style="padding:5px 8px;color:var(--muted);font-size:0.7rem;position:relative"
              onmouseenter="this.querySelector('.arrow-tt').style.display='block'"
              onmouseleave="this.querySelector('.arrow-tt').style.display='none'">
              ▶
              <div class="arrow-tt" style="display:none;position:absolute;left:calc(100% + 6px);top:50%;transform:translateY(-50%);
                background:#1c2333;border:1px solid #4DB6AC;border-radius:8px;padding:6px 12px;
                white-space:nowrap;z-index:999;font-size:0.72rem;color:#4DB6AC;pointer-events:none;box-shadow:0 2px 12px rgba(77,182,172,0.2)">
                ${isEN ? '🃏 Click to see hand detail' : isPT ? '🃏 Clique para ver o detalhe das mãos' : '🃏 Click y ve el detalle de manos'}
              </div>
            </td>
            <td style="padding:5px 8px"><code style="color:#60a5fa;font-size:0.8rem">${lv.level}</code></td>
            <td style="padding:5px 8px;text-align:right">${lv.manos}</td>
            <td style="padding:5px 8px;text-align:right;${lv.won_pct > 15 ? 'color:#4ade80' : lv.won_pct > 0 ? 'color:#facc15' : 'color:var(--muted)'}">${lv.won_pct}%</td>
            <td style="padding:5px 8px;text-align:right;${lv.net > 0 ? 'color:#4ade80' : lv.net < 0 ? 'color:#f87171' : 'color:var(--muted)'}">${lv.net_str}</td>
          </tr>
          <tr id="bio-level-detail-${idx}" style="display:none">
            <td colspan="5" style="padding:0;background:rgba(255,255,255,0.02)">
              <table style="width:100%;font-size:0.75rem;border-collapse:collapse">
                <thead>
                  <tr style="color:var(--muted);font-size:0.67rem;text-transform:uppercase;border-bottom:1px solid var(--border)">
                    <th style="padding:4px 8px;text-align:right;width:36px">#</th>
                    <th style="padding:4px 8px;width:70px">Pos.</th>
                    <th style="padding:4px 8px;width:80px">${isEN ? 'Cards' : 'Cartas'}</th>
                    <th style="padding:4px 8px">Board</th>
                    <th style="padding:4px 8px;width:80px">${isEN ? 'Result' : 'Resultado'}</th>
                    <th style="padding:4px 8px;text-align:right;width:90px">Net</th>
                    ${d.has_hr ? '<th style="padding:4px 8px;text-align:right;width:60px;color:#f472b6">BPM</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${lv.hands.map(h => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03)">
                    <td style="padding:4px 8px;text-align:right;color:var(--muted)">${h.n}</td>
                    <td style="padding:4px 8px">${bioPosTag(h.position)}</td>
                    <td style="padding:4px 8px;color:#60a5fa">${h.hole_cards}</td>
                    <td style="padding:4px 8px;color:var(--muted)">${h.board}</td>
                    <td style="padding:4px 8px">${bioResultTag(h.result)}</td>
                    <td style="padding:4px 8px;text-align:right;${h.net > 0 ? 'color:#4ade80' : h.net < 0 ? 'color:#f87171' : 'color:var(--muted)'}">${h.net_str || '—'}</td>
                    ${d.has_hr ? `<td style="padding:4px 8px;text-align:right;color:#f472b6;font-weight:600">${h.hr_avg || '—'}</td>` : ''}
                  </tr>`).join('')}
                </tbody>
              </table>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}
  `;

  // Renderizar gráficos
  setTimeout(() => bioDrawCharts(d, isEN, isPT), 100);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function bioKpi(val, label, color) {
  return `<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
    <div style="font-size:1.6rem;font-weight:800;color:${color};line-height:1.1">${val}</div>
    <div style="font-size:0.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:4px">${label}</div>
  </div>`;
}

function bioPosTag(pos) {
  const colors = { BTN: '#86efac/#14532d', CO: '#93c5fd/#1e3a5f', HJ: '#93c5fd/#1e3a5f', MP: '#fde68a/#451a03', 'UTG+1': '#fde68a/#451a03', 'UTG+2': '#fde68a/#451a03', UTG: '#fca5a5/#3b0f0f', SB: '#94a3b8/#1e293b', BB: '#94a3b8/#1e293b' };
  const c = colors[pos];
  if (!c) return `<span style="color:var(--muted)">${pos || '—'}</span>`;
  const [fg, bg] = c.split('/');
  return `<span style="background:${bg};color:${fg};padding:1px 7px;border-radius:4px;font-size:0.7rem;font-weight:700">${pos}</span>`;
}

function bioResultTag(result) {
  if (result === 'won')    return `<span style="background:#14532d;color:#86efac;padding:1px 7px;border-radius:4px;font-size:0.68rem;font-weight:600">Won</span>`;
  if (result === 'lost')   return `<span style="background:#3b0f0f;color:#fca5a5;padding:1px 7px;border-radius:4px;font-size:0.68rem;font-weight:600">Lost</span>`;
  if (result === 'folded') return `<span style="background:#1e293b;color:#94a3b8;padding:1px 7px;border-radius:4px;font-size:0.68rem;font-weight:600">Fold</span>`;
  return `<span style="color:var(--muted)">${result || '—'}</span>`;
}

function bioToggleLevel(idx) {
  const row   = document.getElementById(`bio-level-detail-${idx}`);
  const arrow = document.getElementById(`bio-arrow-${idx}`);
  if (!row) return;
  if (row.style.display === 'none') {
    row.style.display = 'table-row';
    arrow.textContent = '▼';
    arrow.style.color = '#60a5fa';
  } else {
    row.style.display = 'none';
    arrow.textContent = '▶';
    arrow.style.color = 'var(--muted)';
  }
}

// ── Gráficos Chart.js ────────────────────────────────────────────────────────
function bioDrawCharts(d, isEN, isPT) {
  const labels = d.hands_detail.map(h => String(h.n));
  const DARK_GRID = 'rgba(255,255,255,0.05)';
  const DARK_TICK = '#64748b';
  const opts = {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 9 }, color: DARK_TICK }, border: { color: DARK_GRID } },
      y: { ticks: { font: { size: 9 }, color: DARK_TICK }, grid: { color: DARK_GRID }, border: { color: DARK_GRID } }
    }
  };

  // Net acumulado
  const netCanvas = document.getElementById('bio-chart-net');
  if (netCanvas) {
    new Chart(netCanvas, {
      type: 'line',
      data: { labels, datasets: [{ data: d.timeline, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.08)', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }] },
      options: { ...opts, plugins: { ...opts.plugins, tooltip: { callbacks: { title: ctx => { const h = d.hands_detail[ctx[0].dataIndex]; return `Mano ${h.n}${h.hole_cards !== '—' ? ` · 🃏 ${h.hole_cards}` : ''}`; }, label: ctx => ` ${ctx.raw >= 0 ? '+' : ''}${ctx.raw.toLocaleString()} fichas` } } } }
    });
  }

  // Stack real
  const stackCanvas = document.getElementById('bio-chart-stack');
  if (stackCanvas && d.stack_data && d.stack_data.some(v=>v)) {
    // Labels para stack pueden tener un punto extra (el 0 final al ser eliminado)
    const stackLabels = d.stack_data.map((_, i) => String(i + 1));
    new Chart(stackCanvas, {
      type: 'line',
      data: { labels: stackLabels, datasets: [{ data: d.stack_data, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.08)', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2, spanGaps: true }] },
      options: { ...opts, plugins: { ...opts.plugins, tooltip: { callbacks: { title: ctx => { const h = d.hands_detail[ctx[0].dataIndex]; return `Mano ${h.n}${h.hole_cards !== '—' ? ` · 🃏 ${h.hole_cards}` : ''}`; }, label: ctx => ` Stack: ${ctx.raw !== null ? ctx.raw.toLocaleString() + ' fichas' : '—'}` } } } }
    });
  }

  // BPM
  const hrCanvas = document.getElementById('bio-chart-hr');
  if (hrCanvas && d.has_hr) {
    const validHR = d.hr_data.filter(v => v !== null);
    const hrMin = Math.max(50, Math.min(...validHR) - 5);
    const hrMax = Math.min(160, Math.max(...validHR) + 8);
    new Chart(hrCanvas, {
      type: 'line',
      data: { labels, datasets: [{ data: d.hr_data, borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.10)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2.5, spanGaps: true }] },
      options: { ...opts, scales: { ...opts.scales, y: { ...opts.scales.y, min: hrMin, max: hrMax, ticks: { callback: v => v + ' bpm', font: { size: 9 }, color: DARK_TICK } } }, plugins: { ...opts.plugins, tooltip: { callbacks: { title: ctx => { const h = d.hands_detail[ctx[0].dataIndex]; return `Mano ${h.n}${h.hole_cards !== '—' ? ` · 🃏 ${h.hole_cards}` : ''}`; }, label: ctx => ` BPM: ${ctx.raw}` } } } }
    });
  }
}

// ── Polling servidor HR ──────────────────────────────────────────────────────
let _bioBpmHistory = [];

function bioPollServer() {
  if (_bioPollTimer) clearInterval(_bioPollTimer);

  // Render inicial del wizard (desconectado)
  bioRenderSetupWizard(false, 0);

  _bioPollTimer = setInterval(async () => {
    const wizardEl = document.getElementById('bio-setup-wizard');
    if (!wizardEl) { clearInterval(_bioPollTimer); return; }
    const isPT = I18N.isPT();
    const isEN = I18N.isEN();
    try {
      const r = await fetch(`${BIO_SERVER}/status`, { signal: AbortSignal.timeout(1000) });
      if (!r.ok) throw new Error();
      const data = await r.json();
      const wasConnected = _bioHasServer;
      _bioHasServer = true;
      _bioBpm = data.last_bpm || 0;

      // Ocultar wizard, mostrar tarjeta BPM
      wizardEl.style.display = 'none';
      const bpmCard = document.getElementById('bio-bpm-card');
      const bpmVal  = document.getElementById('bio-bpm-value');
      if (bpmCard) {
        bpmCard.style.display = 'block';
        if (bpmVal && _bioBpm > 0) {
          bpmVal.textContent = _bioBpm;
          _bioBpmHistory.push(_bioBpm);
          if (_bioBpmHistory.length > 20) _bioBpmHistory.shift();
          bioUpdateBpmBar();
        }
      }
    } catch {
      const wasConnected = _bioHasServer;
      _bioHasServer = false;
      _bioBpm = 0;

      // Mostrar wizard, ocultar tarjeta BPM
      if (wasConnected || wizardEl.innerHTML === '') {
        bioRenderSetupWizard(false, 0);
      }
      wizardEl.style.display = '';
      const bpmCard = document.getElementById('bio-bpm-card');
      if (bpmCard) bpmCard.style.display = 'none';
    }
  }, 2000);
}

// ── Mini bar chart de BPM ────────────────────────────────────────────────────
function bioUpdateBpmBar() {
  const bar = document.getElementById('bio-bpm-bar');
  if (!bar || _bioBpmHistory.length < 2) return;
  const min = Math.min(..._bioBpmHistory) - 5;
  const max = Math.max(..._bioBpmHistory) + 5;
  bar.innerHTML = _bioBpmHistory.map(v => {
    const h = Math.max(4, Math.round(((v - min) / (max - min)) * 36));
    return `<div style="width:4px;height:${h}px;background:#f472b6;border-radius:2px;opacity:0.7"></div>`;
  }).join('');
}

// ── Wizard de setup ──────────────────────────────────────────────────────────
function bioRenderSetupWizard(connected, bpm) {
  const el = document.getElementById('bio-setup-wizard');
  if (!el) return;
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();

  const t = {
    title:   isEN ? 'Connect your smartwatch' : isPT ? 'Conecte seu smartwatch' : 'Conecta tu smartwatch',
    sub:     isEN ? 'Follow these 3 steps to see your BPM live while you play.'
                  : isPT ? 'Siga estes 3 passos para ver seu BPM em tempo real enquanto joga.'
                  : 'Sigue estos 3 pasos para ver tu BPM en tiempo real mientras juegas.',
    s1t:     isEN ? 'Download MinDev Bio for Windows' : isPT ? 'Baixe o MinDev Bio para Windows' : 'Descarga MinDev Bio para Windows',
    s1d:     isEN ? 'The local server that bridges your watch and the web. Install it and click <strong>Start HR Server</strong>.'
                  : isPT ? 'O servidor local que conecta seu relógio com a web. Instale e clique em <strong>Iniciar servidor HR</strong>.'
                  : 'El servidor local que conecta tu reloj con la web. Instálalo y haz click en <strong>Iniciar servidor HR</strong>.',
    s1btn:   isEN ? '⬇ Download .exe' : isPT ? '⬇ Baixar .exe' : '⬇ Descargar .exe',
    s2t:     isEN ? 'Install MinDev HR on your Galaxy Watch' : isPT ? 'Instale o MinDev HR no seu Galaxy Watch' : 'Instala MinDev HR en tu Galaxy Watch',
    s2d:     isEN ? 'Open <strong>Galaxy Store</strong> on your watch, search for <strong>MinDev HR</strong> and install it.'
                  : isPT ? 'Abra a <strong>Galaxy Store</strong> no seu relógio, busque <strong>MinDev HR</strong> e instale.'
                  : 'Abre <strong>Galaxy Store</strong> en tu reloj, busca <strong>MinDev HR</strong> e instálala.',
    s3t:     isEN ? 'Open MinDev HR → enter your PC\'s IP' : isPT ? 'Abra o MinDev HR → insira o IP do seu PC' : 'Abre MinDev HR → ingresa la IP de tu PC',
    s3d:     isEN ? 'Your PC\'s IP is shown in MinDev Bio. Both devices must be on the same WiFi network.'
                  : isPT ? 'O IP do seu PC é exibido no MinDev Bio. Ambos os dispositivos devem estar na mesma rede WiFi.'
                  : 'La IP de tu PC se muestra en MinDev Bio. Ambos deben estar en la misma red WiFi.',
    detect:  isEN ? 'Waiting for server… detecting automatically'
                  : isPT ? 'Aguardando servidor… detectando automaticamente'
                  : 'Esperando servidor… detectando automáticamente',
    help:    isEN ? 'Need help?' : isPT ? 'Precisa de ajuda?' : '¿Necesitas ayuda?',
  };

  el.innerHTML = `
    <div style="background:var(--card);border:1px solid rgba(244,114,182,0.25);border-radius:16px;padding:24px 28px">

      <!-- Header -->
      <div style="margin-bottom:22px">
        <div style="font-size:1.1rem;font-weight:800;color:#f472b6;margin-bottom:4px">⌚ ${t.title}</div>
        <div style="font-size:0.82rem;color:var(--muted)">${t.sub}</div>
      </div>

      <!-- Pasos -->
      <div style="display:flex;flex-direction:column;gap:0">

        ${bioWizardStep(1, t.s1t, t.s1d, `
          <a href="#" onclick="bioDownloadExe(event)"
            style="display:inline-block;background:#f472b6;color:#fff;font-weight:700;font-size:0.82rem;
                   padding:8px 16px;border-radius:8px;text-decoration:none;margin-top:10px">
            ${t.s1btn}
          </a>`)}

        ${bioWizardStep(2, t.s2t, t.s2d, `
          <a href="https://galaxy.store/mindevhr" target="_blank" rel="noopener"
            style="display:inline-block;background:#1428A0;color:#fff;font-weight:700;font-size:0.82rem;
                   padding:8px 16px;border-radius:8px;text-decoration:none;margin-top:10px">
            🏪 Galaxy Store
          </a>`)}

        ${bioWizardStep(3, t.s3t, t.s3d, '', true)}

      </div>

      <!-- Indicador de detección automática -->
      <div style="display:flex;align-items:center;gap:10px;margin-top:20px;padding-top:18px;border-top:1px solid var(--border)">
        <div style="width:8px;height:8px;border-radius:50%;background:#f472b6;animation:bioPulse 1.4s ease-in-out infinite;flex-shrink:0"></div>
        <div style="font-size:0.78rem;color:var(--muted)">${t.detect}</div>
        <a href="#" onclick="bioShowHelp(event)" style="margin-left:auto;font-size:0.75rem;color:#f472b6;text-decoration:none;white-space:nowrap">${t.help}</a>
      </div>

    </div>

    <style>
      @keyframes bioPulse {
        0%,100% { opacity:1; transform:scale(1); }
        50%      { opacity:0.4; transform:scale(1.5); }
      }
    </style>`;
}

function bioWizardStep(n, title, desc, action = '', last = false) {
  return `
    <div style="display:flex;gap:16px;padding-bottom:${last ? '0' : '20px'};position:relative">
      <!-- línea vertical conectora -->
      ${!last ? `<div style="position:absolute;left:15px;top:32px;bottom:0;width:2px;background:rgba(244,114,182,0.15)"></div>` : ''}
      <!-- número -->
      <div style="width:32px;height:32px;border-radius:50%;border:2px solid rgba(244,114,182,0.4);
                  display:flex;align-items:center;justify-content:center;flex-shrink:0;
                  font-size:0.85rem;font-weight:800;color:#f472b6;background:rgba(244,114,182,0.08)">
        ${n}
      </div>
      <!-- contenido -->
      <div style="flex:1;padding-top:4px">
        <div style="font-weight:700;font-size:0.92rem;color:var(--text);margin-bottom:4px">${title}</div>
        <div style="font-size:0.8rem;color:var(--muted);line-height:1.5">${desc}</div>
        ${action}
      </div>
    </div>`;
}

function bioDownloadExe(e) {
  e.preventDefault();
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();
  // Placeholder hasta que el .exe esté disponible
  alert(isEN
    ? 'MinDev Bio for Windows is coming soon. We\'ll notify you by email when it\'s ready.'
    : isPT
    ? 'MinDev Bio para Windows estará disponível em breve. Você será notificado por e-mail.'
    : 'MinDev Bio para Windows estará disponible muy pronto. Te notificaremos por email cuando esté listo.');
}

function bioShowHelp(e) {
  e.preventDefault();
  const isPT = I18N.isPT();
  const isEN = I18N.isEN();
  const msg = isEN
    ? `MinDev Bio — Setup guide\n\n1. Download and install MinDev Bio on your Windows PC.\n2. Install MinDev HR on your Galaxy Watch from Galaxy Store.\n3. Open MinDev Bio → note your PC's IP address shown in the app.\n4. Open MinDev HR on your watch → enter that IP → tap Connect.\n5. In MinDev Bio, click "Start HR Server".\n6. Come back here — BPM will appear automatically.\n\nBoth devices must be connected to the same WiFi network.`
    : isPT
    ? `MinDev Bio — Guia de configuração\n\n1. Baixe e instale o MinDev Bio no seu PC Windows.\n2. Instale o MinDev HR no seu Galaxy Watch pela Galaxy Store.\n3. Abra o MinDev Bio → anote o IP do seu PC mostrado no app.\n4. Abra o MinDev HR no relógio → insira esse IP → toque em Conectar.\n5. No MinDev Bio, clique em "Iniciar servidor HR".\n6. Volte aqui — o BPM aparecerá automaticamente.\n\nAmbos os dispositivos devem estar na mesma rede WiFi.`
    : `MinDev Bio — Guía de configuración\n\n1. Descarga e instala MinDev Bio en tu PC Windows.\n2. Instala MinDev HR en tu Galaxy Watch desde Galaxy Store.\n3. Abre MinDev Bio → anota la IP de tu PC que muestra la app.\n4. Abre MinDev HR en el reloj → ingresa esa IP → toca Conectar.\n5. En MinDev Bio, haz click en "Iniciar servidor HR".\n6. Vuelve aquí — el BPM aparecerá automáticamente.\n\nAmbos dispositivos deben estar en la misma red WiFi.`;
  alert(msg);
}

function bioClear() {
  if (_bioPollTimer) { clearInterval(_bioPollTimer); _bioPollTimer = null; }
}
