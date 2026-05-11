// ─── Tracker de Sesiones ─────────────────────────────────────────────────────

let _allSessions = [];
let _sessionsChart = null;

const SESSION_FORMATS = ['Cash Game', 'MTT', 'SNG', 'Spin & Go', 'Live', 'Home Game'];

async function renderSessions() {
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:960px;margin:32px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap">
        <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
        <h2 style="margin:0;color:var(--accent)">🃏 Tracker de Sesiones</h2>
        <button onclick="toggleSessionForm()" id="new-session-btn"
          class="btn btn-primary btn-sm" style="margin-left:auto">
          + Nueva Sesión
        </button>
      </div>

      <!-- Formulario (oculto por defecto) -->
      <div id="session-form-wrap" style="display:none;margin-bottom:24px">
        ${renderSessionForm()}
      </div>

      <!-- Stats + tabla -->
      <div id="sessions-content">
        <div style="text-align:center;padding:60px"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>`;

  await loadSessions();
}

function renderSessionForm(prefill = {}) {
  const today = new Date().toISOString().slice(0, 10);
  return `
    <div style="background:var(--card);border:1px solid var(--accent);border-radius:12px;padding:24px">
      <h3 style="margin:0 0 20px;color:var(--accent);font-size:1rem">+ Registrar sesión</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px">

        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:4px">FECHA *</label>
          <input type="date" id="sf-date" value="${prefill.date || today}"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text1);font-size:0.9rem">
        </div>

        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:4px">FORMATO *</label>
          <select id="sf-format"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text1);font-size:0.9rem">
            ${SESSION_FORMATS.map(f => `<option value="${f}" ${prefill.format === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>

        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:4px">NIVEL / STAKES *</label>
          <input type="text" id="sf-stakes" placeholder="NL10, $5 MTT, $1/$2..." value="${prefill.stakes || ''}"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text1);font-size:0.9rem">
        </div>

        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:4px">HORAS JUGADAS *</label>
          <input type="number" id="sf-hours" min="0.5" max="24" step="0.5" placeholder="2.5" value="${prefill.hours || ''}"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text1);font-size:0.9rem">
        </div>

        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:4px">RESULTADO ($) *</label>
          <input type="number" id="sf-profit" step="0.01" placeholder="-15.50 o +120" value="${prefill.profit_loss != null ? prefill.profit_loss : ''}"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text1);font-size:0.9rem">
        </div>

        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:4px">ESTADO MENTAL (1–10) *</label>
          <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
            <input type="range" id="sf-mental" min="1" max="10" step="1" value="${prefill.mental_state || 7}"
              oninput="document.getElementById('sf-mental-val').textContent=this.value"
              style="flex:1">
            <span id="sf-mental-val" style="font-weight:700;color:var(--accent);min-width:20px;text-align:center">${prefill.mental_state || 7}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text3);margin-top:2px">
            <span>😤 Inclinado</span><span>😎 Óptimo</span>
          </div>
        </div>

      </div>

      <div style="margin-top:14px">
        <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:4px">NOTAS (opcional)</label>
        <textarea id="sf-notes" placeholder="¿Algo notable de esta sesión?" rows="2"
          style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text1);font-size:0.9rem;resize:vertical">${prefill.notes || ''}</textarea>
      </div>

      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-primary" onclick="saveSession()" style="flex:1">💾 Guardar sesión</button>
        <button class="btn btn-secondary" onclick="toggleSessionForm()">Cancelar</button>
      </div>
      <div id="sf-error" style="color:#ef4444;font-size:0.85rem;margin-top:8px;display:none"></div>
    </div>`;
}

function toggleSessionForm() {
  const wrap = document.getElementById('session-form-wrap');
  const btn  = document.getElementById('new-session-btn');
  if (!wrap) return;
  const open = wrap.style.display === 'none';
  wrap.style.display = open ? 'block' : 'none';
  if (btn) btn.textContent = open ? '✕ Cancelar' : '+ Nueva Sesión';
  if (open) wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function saveSession() {
  const errEl = document.getElementById('sf-error');
  if (errEl) errEl.style.display = 'none';

  const payload = {
    date:         document.getElementById('sf-date')?.value,
    format:       document.getElementById('sf-format')?.value,
    stakes:       document.getElementById('sf-stakes')?.value?.trim(),
    hours:        parseFloat(document.getElementById('sf-hours')?.value || 0),
    profit_loss:  parseFloat(document.getElementById('sf-profit')?.value || 0),
    mental_state: parseInt(document.getElementById('sf-mental')?.value || 5),
    notes:        document.getElementById('sf-notes')?.value?.trim(),
  };

  try {
    await Api.post('/api/sessions', payload);
    toggleSessionForm();
    await loadSessions();
  } catch (e) {
    if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
  }
}

async function loadSessions() {
  try {
    const [sessRes, statsRes] = await Promise.all([
      Api.get('/api/sessions'),
      Api.get('/api/sessions/stats'),
    ]);
    _allSessions = sessRes.sessions || [];
    renderSessionsContent(statsRes);
  } catch (e) {
    document.getElementById('sessions-content').innerHTML =
      `<div class="form-error">Error: ${e.message}</div>`;
  }
}

function renderSessionsContent({ stats, chart }) {
  const isPT = I18N.isPT();
  let html = '';

  if (!stats || _allSessions.length === 0) {
    html = `
      <div class="card" style="text-align:center;padding:48px">
        <div style="font-size:3rem;margin-bottom:12px">🃏</div>
        <h3 style="color:var(--text2);margin:0 0 8px">${isPT ? 'Nenhuma sessão registrada' : 'Aún no hay sesiones registradas'}</h3>
        <p style="color:var(--text3);font-size:0.9rem">${isPT ? 'Clique em "+ Nova Sessão" para começar a registrar.' : 'Haz clic en "+ Nueva Sesión" para empezar a registrar.'}</p>
      </div>`;
    document.getElementById('sessions-content').innerHTML = html;
    return;
  }

  // ── Stats cards ──
  const profitColor = stats.total_profit >= 0 ? '#4ade80' : '#f87171';
  const rateColor   = stats.hourly_rate  >= 0 ? '#4ade80' : '#f87171';

  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:24px">
    ${statCard(stats.total_sessions, isPT ? 'Sessões totais' : 'Sesiones totales', 'var(--accent)', `${stats.sessions_30d} últimos 30d`)}
    ${statCard((stats.total_profit >= 0 ? '+' : '') + '$' + stats.total_profit.toFixed(2), isPT ? 'Resultado total' : 'Resultado total', profitColor)}
    ${statCard('$' + stats.hourly_rate.toFixed(2) + '/h', isPT ? 'Taxa horária' : 'Tasa por hora', rateColor, `${stats.total_hours}h totales`)}
    ${statCard(stats.avg_mental + '/10', isPT ? 'Mental promedio' : 'Mental promedio', '#fbbf24')}
    ${stats.best_format ? statCard(stats.best_format, isPT ? 'Mejor formato' : 'Mejor formato', '#4DB6AC', '$' + (stats.fmt_profit[stats.best_format] || 0).toFixed(2)) : ''}
  </div>`;

  // ── Gráfico de profit acumulado ──
  if (chart && chart.length > 1) {
    html += `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:24px">
        <h3 style="margin:0 0 14px;color:var(--text2);font-size:0.95rem">📈 Profit acumulado</h3>
        <canvas id="sessions-chart" style="max-height:200px"></canvas>
      </div>`;
  }

  // ── Tabla de sesiones ──
  html += `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px">
      <h3 style="margin:0 0 14px;color:var(--text2);font-size:0.95rem">📋 Historial de sesiones</h3>
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:600px">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            ${['Fecha','Formato','Stakes','Horas','Resultado','Mental','Notas',''].map(h =>
              `<th style="text-align:left;padding:8px;color:var(--text3);font-size:0.75rem;font-weight:600;text-transform:uppercase">${h}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>
          ${_allSessions.map((s, i) => {
            const pColor = s.profit_loss >= 0 ? '#4ade80' : '#f87171';
            const mColor = s.mental_state >= 8 ? '#4ade80' : s.mental_state >= 5 ? '#fbbf24' : '#f87171';
            return `
              <tr style="border-bottom:1px solid var(--border);${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}">
                <td style="padding:9px 8px;font-size:0.85rem;color:var(--text2)">${s.date}</td>
                <td style="padding:9px 8px;font-size:0.85rem;color:var(--text1);font-weight:600">${escHtml(s.format)}</td>
                <td style="padding:9px 8px;font-size:0.82rem;color:var(--text3)">${escHtml(s.stakes)}</td>
                <td style="padding:9px 8px;font-size:0.85rem;color:var(--text2)">${s.hours}h</td>
                <td style="padding:9px 8px;font-weight:700;color:${pColor};font-size:0.9rem">${s.profit_loss >= 0 ? '+' : ''}$${s.profit_loss.toFixed(2)}</td>
                <td style="padding:9px 8px">
                  <span style="background:${mColor}22;color:${mColor};padding:2px 8px;border-radius:12px;font-size:0.82rem;font-weight:700">${s.mental_state}/10</span>
                </td>
                <td style="padding:9px 8px;font-size:0.8rem;color:var(--text3);max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(s.notes || '—')}</td>
                <td style="padding:9px 8px;text-align:right">
                  <button onclick="deletePokerSession(${s.id})"
                    style="background:none;border:1px solid #ef4444;color:#ef4444;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:0.78rem">✕</button>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
      </div>
      <p style="margin:10px 0 0;color:var(--text3);font-size:0.78rem">${_allSessions.length} sesión${_allSessions.length !== 1 ? 'es' : ''}</p>
    </div>`;

  document.getElementById('sessions-content').innerHTML = html;

  // Dibujar gráfico
  if (chart && chart.length > 1) {
    requestAnimationFrame(() => buildSessionsChart(chart));
  }
}

function statCard(val, label, color, sub = '') {
  return `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
      <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${label}</div>
      <div style="font-size:1.6rem;font-weight:800;color:${color}">${val}</div>
      ${sub ? `<div style="font-size:0.75rem;color:var(--text3);margin-top:3px">${sub}</div>` : ''}
    </div>`;
}

function buildSessionsChart(chart) {
  const ctx = document.getElementById('sessions-chart');
  if (!ctx) return;
  if (_sessionsChart) { _sessionsChart.destroy(); _sessionsChart = null; }

  const labels = chart.map((_, i) => `S${i + 1}`);
  const data   = chart.map(r => r.cumulative);
  const colors = data.map(v => v >= 0 ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)');

  _sessionsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Profit acumulado ($)',
        data,
        borderColor: data[data.length - 1] >= 0 ? '#4ade80' : '#f87171',
        backgroundColor: data[data.length - 1] >= 0 ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: chart.length <= 30 ? 3 : 0,
        pointBackgroundColor: colors,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const r = chart[ctx.dataIndex];
              return [`Acumulado: ${r.cumulative >= 0 ? '+' : ''}$${r.cumulative}`, `Sesión: ${r.profit_loss >= 0 ? '+' : ''}$${r.profit_loss}`, `Fecha: ${r.date}`];
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' },
             beginAtZero: false },
      },
    },
  });
}

async function deletePokerSession(sid) {
  if (!confirm('¿Eliminar esta sesión?')) return;
  try {
    await Api._req('DELETE', `/api/sessions/${sid}`);
    _allSessions = _allSessions.filter(s => s.id !== sid);
    await loadSessions();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
}
