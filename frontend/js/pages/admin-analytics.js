// ─── Admin Analytics ────────────────────────────────────────────────────────
let _analyticsCharts = [];

async function renderAdminAnalytics() {
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:1100px;margin:32px auto;padding:0 16px">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap">
        <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
        <h2 style="margin:0;color:var(--accent)">📊 Analytics</h2>
        <span style="margin-left:auto;color:var(--text3);font-size:0.82rem">Últimos 30 días · actualizado ahora</span>
      </div>

      <!-- Skeleton mientras carga -->
      <div id="analytics-content">
        <div style="text-align:center;padding:60px"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>`;

  // Destruir charts anteriores si los hubiera
  _analyticsCharts.forEach(c => { try { c.destroy(); } catch(_) {} });
  _analyticsCharts = [];

  try {
    const data = await Api.get('/api/admin/analytics');
    renderAnalyticsContent(data);
  } catch (e) {
    document.getElementById('analytics-content').innerHTML =
      `<div style="color:#ef4444;padding:16px">Error: ${e.message}</div>`;
  }
}

function renderAnalyticsContent(d) {
  const { totals, coupon, users_by_day, tests_by_day, revenue_by_day, countries, test_types } = d;

  const card = (val, label, color = 'var(--accent)', sub = '') => `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px">
      <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">${label}</div>
      <div style="font-size:2rem;font-weight:800;color:${color}">${val}</div>
      ${sub ? `<div style="font-size:0.78rem;color:var(--text3);margin-top:4px">${sub}</div>` : ''}
    </div>`;

  let html = '';

  // ── Bloque 1: Métricas globales ──────────────────────────────────────────
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:28px">
    ${card(totals.users, 'Usuarios totales', 'var(--accent)', `+${totals.new_users_7d} últimos 7 días`)}
    ${card(totals.tests, 'Tests completados', '#4DB6AC', `+${totals.tests_7d} últimos 7 días`)}
    ${card('$' + totals.revenue.toFixed(2), 'Ingresos totales', '#4ade80')}
    ${card(totals.avg_score ? totals.avg_score + '%' : '—', 'Score promedio', '#fbbf24')}
  </div>`;

  // ── Bloque 2: Cupones ────────────────────────────────────────────────────
  html += `<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin-bottom:28px">
    <h3 style="margin:0 0 16px;color:var(--text2);font-size:0.95rem">🎟️ Embudo de Cupones</h3>
    <div style="display:flex;align-items:center;gap:0;flex-wrap:wrap">
      ${funnelStep(coupon.total, 'Generados', '#64748b')}
      <div style="color:var(--text3);font-size:1.2rem;padding:0 8px">→</div>
      ${funnelStep(coupon.used, 'Activados', '#fbbf24', coupon.total ? Math.round(coupon.used/coupon.total*100)+'%' : '')}
      <div style="color:var(--text3);font-size:1.2rem;padding:0 8px">→</div>
      ${funnelStep(coupon.active, 'Activos ahora', '#4ade80', coupon.used ? Math.round(coupon.active/coupon.used*100)+'%' : '')}
      <div style="color:var(--text3);font-size:1.2rem;padding:0 8px">→</div>
      ${funnelStep(coupon.converted, 'Convirtieron a pago', '#4DB6AC', coupon.conversion_rate + '%')}
      <div style="margin-left:auto;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:12px 20px;text-align:center;min-width:120px">
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Disponibles</div>
        <div style="font-size:1.6rem;font-weight:800;color:#4ade80">${coupon.available}</div>
      </div>
    </div>
  </div>`;

  // ── Bloque 3: Gráficos (actividad y países) ──────────────────────────────
  html += `<div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:28px">
    <!-- Actividad: usuarios + tests por día -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px">
      <h3 style="margin:0 0 16px;color:var(--text2);font-size:0.95rem">📈 Actividad diaria — últimos 30 días</h3>
      <canvas id="chart-activity" style="max-height:240px"></canvas>
    </div>
    <!-- Países -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px">
      <h3 style="margin:0 0 16px;color:var(--text2);font-size:0.95rem">🌍 Países</h3>
      <canvas id="chart-countries" style="max-height:240px"></canvas>
    </div>
  </div>`;

  // ── Bloque 4: Ingresos + tipos de test ───────────────────────────────────
  html += `<div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:28px">
    <!-- Ingresos -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px">
      <h3 style="margin:0 0 16px;color:var(--text2);font-size:0.95rem">💰 Ingresos diarios (USD)</h3>
      <canvas id="chart-revenue" style="max-height:200px"></canvas>
    </div>
    <!-- Test types -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px">
      <h3 style="margin:0 0 16px;color:var(--text2);font-size:0.95rem">🧬 Tipo de test</h3>
      <canvas id="chart-types" style="max-height:200px"></canvas>
    </div>
  </div>`;

  // ── Bloque 5: Exportar CSV ───────────────────────────────────────────────
  html += `<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin-bottom:32px">
    <h3 style="margin:0 0 16px;color:var(--text2);font-size:0.95rem">⬇️ Exportar datos (CSV)</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button onclick="exportCSV('users')"
        style="background:rgba(212,175,55,0.12);border:1px solid var(--accent);border-radius:8px;padding:9px 18px;color:var(--accent);cursor:pointer;font-size:0.88rem;font-weight:600">
        👥 Usuarios
      </button>
      <button onclick="exportCSV('tests')"
        style="background:rgba(77,182,172,0.12);border:1px solid #4DB6AC;border-radius:8px;padding:9px 18px;color:#4DB6AC;cursor:pointer;font-size:0.88rem;font-weight:600">
        🧠 Tests completados
      </button>
      <button onclick="exportCSV('coupons')"
        style="background:rgba(251,191,36,0.12);border:1px solid #fbbf24;border-radius:8px;padding:9px 18px;color:#fbbf24;cursor:pointer;font-size:0.88rem;font-weight:600">
        🎟️ Cupones
      </button>
      <button onclick="exportCSV('payments')"
        style="background:rgba(74,222,128,0.12);border:1px solid #4ade80;border-radius:8px;padding:9px 18px;color:#4ade80;cursor:pointer;font-size:0.88rem;font-weight:600">
        💳 Pagos
      </button>
    </div>
    <p style="margin:10px 0 0;color:var(--text3);font-size:0.78rem">
      Los archivos CSV son compatibles con Excel, Google Sheets y cualquier hoja de cálculo.
    </p>
  </div>`;

  document.getElementById('analytics-content').innerHTML = html;

  // ── Renderizar charts ────────────────────────────────────────────────────
  requestAnimationFrame(() => {
    buildActivityChart(users_by_day, tests_by_day);
    buildCountriesChart(countries);
    buildRevenueChart(revenue_by_day);
    buildTypesChart(test_types);
  });
}

// ── Funnel step helper ────────────────────────────────────────────────────────
function funnelStep(value, label, color, pct = '') {
  return `
    <div style="text-align:center;min-width:90px">
      <div style="font-size:1.6rem;font-weight:800;color:${color}">${value}</div>
      <div style="font-size:0.72rem;color:var(--text3);margin-top:2px">${label}</div>
      ${pct ? `<div style="font-size:0.75rem;color:${color};font-weight:600">${pct}</div>` : ''}
    </div>`;
}

// ── Chart: Actividad diaria ───────────────────────────────────────────────────
function buildActivityChart(users_by_day, tests_by_day) {
  const ctx = document.getElementById('chart-activity');
  if (!ctx) return;

  // Unificar días de ambas series
  const daysSet = new Set([
    ...users_by_day.map(r => r.day),
    ...tests_by_day.map(r => r.day),
  ]);
  const days = [...daysSet].sort();

  const usersMap = Object.fromEntries(users_by_day.map(r => [r.day, r.count]));
  const testsMap = Object.fromEntries(tests_by_day.map(r => [r.day, r.count]));

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map(d => d.slice(5)), // MM-DD
      datasets: [
        {
          label: 'Usuarios nuevos',
          data: days.map(d => usersMap[d] || 0),
          borderColor: '#d4af37',
          backgroundColor: 'rgba(212,175,55,0.1)',
          tension: 0.4, fill: true, pointRadius: 3,
        },
        {
          label: 'Tests completados',
          data: days.map(d => testsMap[d] || 0),
          borderColor: '#4DB6AC',
          backgroundColor: 'rgba(77,182,172,0.1)',
          tension: 0.4, fill: true, pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 45 }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b' }, beginAtZero: true },
      },
    },
  });
  _analyticsCharts.push(chart);
}

// ── Chart: Países ─────────────────────────────────────────────────────────────
function buildCountriesChart(countries) {
  const ctx = document.getElementById('chart-countries');
  if (!ctx) return;
  const COLORS = ['#d4af37','#4DB6AC','#818cf8','#f87171','#4ade80','#fbbf24','#a78bfa','#fb923c','#60a5fa','#34d399'];

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: countries.map(r => r.pais || '—'),
      datasets: [{
        data: countries.map(r => r.count),
        backgroundColor: COLORS.slice(0, countries.length),
        borderColor: '#0a0e1a',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 12, padding: 8 },
        },
      },
    },
  });
  _analyticsCharts.push(chart);
}

// ── Chart: Ingresos ───────────────────────────────────────────────────────────
function buildRevenueChart(revenue_by_day) {
  const ctx = document.getElementById('chart-revenue');
  if (!ctx) return;

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: revenue_by_day.map(r => r.day.slice(5)),
      datasets: [{
        label: 'USD',
        data: revenue_by_day.map(r => r.revenue),
        backgroundColor: 'rgba(74,222,128,0.5)',
        borderColor: '#4ade80',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 45 }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b' }, beginAtZero: true },
      },
    },
  });
  _analyticsCharts.push(chart);
}

// ── Chart: Tipo de test ───────────────────────────────────────────────────────
function buildTypesChart(test_types) {
  const ctx = document.getElementById('chart-types');
  if (!ctx) return;

  const labelMap = { mental: '🧠 Mental', technical: '⚙️ Técnico' };
  const colorMap = { mental: '#818cf8', technical: '#4DB6AC' };

  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: test_types.map(r => labelMap[r.test_type] || r.test_type),
      datasets: [{
        data: test_types.map(r => r.count),
        backgroundColor: test_types.map(r => colorMap[r.test_type] || '#d4af37'),
        borderColor: '#0a0e1a',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 14, padding: 10 },
        },
      },
    },
  });
  _analyticsCharts.push(chart);
}

// ── Exportar CSV ──────────────────────────────────────────────────────────────
async function exportCSV(type) {
  const labels = { users: 'Usuarios', tests: 'Tests', coupons: 'Cupones', payments: 'Pagos' };
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes(labels[type]));
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando...'; }

  try {
    const token = localStorage.getItem('evhapo_token');
    const res = await fetch(`/api/admin/export/${type}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindev-${type}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(`❌ Error al exportar: ${e.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      const icons = { users: '👥 Usuarios', tests: '🧠 Tests completados', coupons: '🎟️ Cupones', payments: '💳 Pagos' };
      btn.textContent = icons[type] || labels[type];
    }
  }
}
