let _allCoupons = [];

async function renderAdminCoupons() {
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:900px;margin:32px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
        <h2 style="margin:0;color:var(--accent)">🎟️ Cupones de Acceso</h2>
      </div>

      <!-- Stats -->
      <div id="coupon-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Cargando</div>
          <div style="font-size:1.6rem;font-weight:700;color:var(--text1)">…</div>
        </div>
      </div>

      <!-- Tabla -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <h3 style="margin:0;font-size:1rem;color:var(--text2)">Todos los cupones</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <select id="coupon-filter" onchange="filterCoupons()"
              style="background:var(--input);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text2);font-size:0.85rem">
              <option value="all">Todos</option>
              <option value="available">Disponibles</option>
              <option value="used">Utilizados</option>
            </select>
            <button onclick="loadAdminCoupons()"
              style="background:none;border:1px solid var(--border);border-radius:6px;padding:6px 12px;color:var(--text2);cursor:pointer;font-size:0.85rem">
              ↻ Actualizar
            </button>
            <button onclick="copyCodes()"
              style="background:none;border:1px solid var(--border);border-radius:6px;padding:6px 12px;color:var(--text2);cursor:pointer;font-size:0.85rem">
              📋 Copiar disponibles
            </button>
          </div>
        </div>
        <div id="coupons-list">
          <div style="text-align:center;padding:32px;color:var(--text3)">Cargando...</div>
        </div>
      </div>
    </div>`;

  await loadAdminCoupons();
}

async function loadAdminCoupons() {
  const listEl = document.getElementById('coupons-list');
  try {
    const data = await Api.get('/api/admin/coupons');
    _allCoupons = data.coupons || [];
    renderCouponsStats(_allCoupons);
    filterCoupons();
  } catch (e) {
    listEl.innerHTML = `<div style="color:#ef4444;padding:16px">Error: ${e.message}</div>`;
  }
}

function renderCouponsStats(coupons) {
  const total     = coupons.length;
  const used      = coupons.filter(c => c.used_at).length;
  const available = total - used;

  document.getElementById('coupon-stats').innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Total</div>
      <div style="font-size:2rem;font-weight:700;color:var(--accent)">${total}</div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Disponibles</div>
      <div style="font-size:2rem;font-weight:700;color:#4ade80">${available}</div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Utilizados</div>
      <div style="font-size:2rem;font-weight:700;color:#f87171">${used}</div>
    </div>`;
}

function filterCoupons() {
  const filter = document.getElementById('coupon-filter')?.value || 'all';
  let list = _allCoupons;
  if (filter === 'available') list = _allCoupons.filter(c => !c.used_at);
  if (filter === 'used')      list = _allCoupons.filter(c =>  c.used_at);
  renderCouponsList(list);
}

function renderCouponsList(coupons) {
  const listEl = document.getElementById('coupons-list');
  if (coupons.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text3)">No hay cupones en esta categoría.</div>`;
    return;
  }
  listEl.innerHTML = `
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;min-width:500px">
      <thead>
        <tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px;color:var(--text3);font-size:0.78rem;font-weight:600;text-transform:uppercase">Código</th>
          <th style="text-align:left;padding:8px;color:var(--text3);font-size:0.78rem;font-weight:600;text-transform:uppercase">Estado</th>
          <th style="text-align:left;padding:8px;color:var(--text3);font-size:0.78rem;font-weight:600;text-transform:uppercase">Utilizado por</th>
          <th style="text-align:left;padding:8px;color:var(--text3);font-size:0.78rem;font-weight:600;text-transform:uppercase">Fecha uso</th>
        </tr>
      </thead>
      <tbody>
        ${coupons.map((c, i) => {
          const isUsed = !!c.used_at;
          return `
          <tr style="border-bottom:1px solid var(--border);${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}">
            <td style="padding:10px 8px">
              <span style="font-family:monospace;font-size:0.95rem;font-weight:700;letter-spacing:2px;color:var(--accent)">${escHtml(c.code)}</span>
            </td>
            <td style="padding:10px 8px">
              ${isUsed
                ? `<span style="background:rgba(239,68,68,0.15);color:#f87171;padding:3px 10px;border-radius:4px;font-size:0.82rem;font-weight:600">Utilizado</span>`
                : `<span style="background:rgba(74,222,128,0.15);color:#4ade80;padding:3px 10px;border-radius:4px;font-size:0.82rem;font-weight:600">Disponible</span>`}
            </td>
            <td style="padding:10px 8px;color:var(--text2);font-size:0.85rem">
              ${isUsed
                ? `${escHtml(c.nombre || '')} ${escHtml(c.apellido || '')}<br><span style="color:var(--text3);font-size:0.78rem">${escHtml(c.email || '')}</span>`
                : `<span style="color:var(--text3)">—</span>`}
            </td>
            <td style="padding:10px 8px;color:var(--text3);font-size:0.82rem">
              ${isUsed ? (c.used_at || '').slice(0, 10) : '—'}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>
    <p style="margin:12px 0 0;color:var(--text3);font-size:0.8rem">${coupons.length} código${coupons.length !== 1 ? 's' : ''}</p>`;
}

function copyCodes() {
  const available = _allCoupons.filter(c => !c.used_at).map(c => c.code);
  if (available.length === 0) { alert('No hay códigos disponibles.'); return; }
  navigator.clipboard.writeText(available.join('\n')).then(() => {
    alert(`✓ ${available.length} códigos disponibles copiados al portapapeles.`);
  }).catch(() => {
    prompt('Copia los códigos:', available.join(', '));
  });
}
