// ─── Admin: Códigos de Referencia ─────────────────────────────────────────────

async function renderAdminReferrals() {
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:900px;margin:32px auto;padding:0 16px">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
        <h2 style="margin:0;color:var(--accent)">♠ Códigos de Referencia</h2>
      </div>

      <!-- Agregar código -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:24px">
        <h3 style="margin:0 0 16px;font-size:1rem;color:var(--text2)">Agregar nuevo código</h3>
        <div id="ref-add-error" style="margin-bottom:8px"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <input type="text" id="ref-new-code" placeholder="Ej: tiburock"
            style="flex:1;min-width:140px;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:0.95rem"
            onkeydown="if(event.key==='Enter')addReferralCode()" />
          <input type="text" id="ref-new-notes" placeholder="Notas (opcional)"
            style="flex:2;min-width:160px;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:0.95rem"
            onkeydown="if(event.key==='Enter')addReferralCode()" />
          <button onclick="addReferralCode()"
            style="background:var(--accent);color:#000;border:none;border-radius:8px;padding:10px 20px;font-weight:700;cursor:pointer;white-space:nowrap">
            + Agregar
          </button>
        </div>
      </div>

      <!-- Lista de códigos -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;font-size:1rem;color:var(--text2)">Códigos activos</h3>
          <button onclick="loadReferralCodes()"
            style="background:none;border:1px solid var(--border);border-radius:6px;padding:6px 12px;color:var(--text2);cursor:pointer;font-size:0.85rem">
            ↻ Actualizar
          </button>
        </div>
        <div id="ref-list">
          <div style="text-align:center;padding:32px;color:var(--text3)">Cargando...</div>
        </div>
      </div>

      <!-- Reporte mensual -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px">
        <h3 style="margin:0 0 8px;font-size:1rem;color:var(--text2)">📧 Reporte Mensual de Comisiones</h3>
        <p style="margin:0 0 16px;color:var(--text3);font-size:0.85rem">
          Envía por email a cada referidor un resumen de sus usuarios, ventas y comisiones del mes seleccionado.
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <select id="ref-report-month"
            style="background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:0.95rem">
            ${_monthOptions()}
          </select>
          <select id="ref-report-year"
            style="background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:0.95rem">
            ${_yearOptions()}
          </select>
          <button id="ref-report-btn" onclick="sendMonthlyReport()"
            style="background:var(--accent);color:#000;border:none;border-radius:8px;padding:10px 22px;font-weight:700;cursor:pointer;white-space:nowrap">
            📤 Enviar Reportes
          </button>
        </div>
        <div id="ref-report-result" style="margin-top:14px"></div>
      </div>

    </div>`;

  await loadReferralCodes();
}

// ─── Helpers para selects de mes/año ──────────────────────────────────────────
function _monthOptions() {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const cur = new Date().getMonth(); // 0-based
  return months.map((m, i) =>
    `<option value="${i + 1}" ${i === cur ? 'selected' : ''}>${m}</option>`
  ).join('');
}

function _yearOptions() {
  const cur = new Date().getFullYear();
  return [cur - 1, cur].map(y =>
    `<option value="${y}" ${y === cur ? 'selected' : ''}>${y}</option>`
  ).join('');
}

// ─── Cargar y renderizar lista de códigos ─────────────────────────────────────
async function loadReferralCodes() {
  const listEl = document.getElementById('ref-list');
  if (!listEl) return;
  try {
    const data  = await Api.get('/api/admin/referral-codes');
    const codes = data.codes || [];

    if (codes.length === 0) {
      listEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text3)">No hay códigos todavía. Agrega el primero arriba.</div>`;
      return;
    }

    listEl.innerHTML = codes.map(c => _renderCodeCard(c)).join('');
  } catch (e) {
    listEl.innerHTML = `<div style="color:#ef4444;padding:16px">Error al cargar: ${escHtml(e.message)}</div>`;
  }
}

// ─── Tarjeta por código ────────────────────────────────────────────────────────
function _renderCodeCard(c) {
  const baseUrl   = 'https://mindev-ia.cl/?ref=';
  const link      = baseUrl + encodeURIComponent(c.code);
  const commission = typeof c.commission_usd === 'number' ? c.commission_usd.toFixed(2) : '0.00';
  const totalComm  = typeof c.total_commission === 'number' ? c.total_commission.toFixed(2) : '0.00';
  const users      = c.total_users  || 0;
  const sales      = c.total_sales  || 0;

  return `
  <div id="card-${escHtml(c.code)}" style="border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:14px;background:rgba(255,255,255,0.02)">

    <!-- Fila superior: código + stats -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px">
      <div>
        <span style="font-size:1.3rem;font-weight:800;color:var(--accent);font-family:monospace;letter-spacing:0.05em">${escHtml(c.code)}</span>
        ${c.notes ? `<span style="margin-left:10px;font-size:0.8rem;color:var(--text3)">${escHtml(c.notes)}</span>` : ''}
        <div style="margin-top:4px;font-size:0.78rem;color:var(--text3)">Creado: ${c.created_at ? c.created_at.slice(0,10) : '—'}</div>
      </div>
      <!-- Stats pill -->
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div style="background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:6px 14px;text-align:center;min-width:64px">
          <div style="font-size:1.1rem;font-weight:800;color:var(--accent)">${users}</div>
          <div style="font-size:0.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em">Usuarios</div>
        </div>
        <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.25);border-radius:8px;padding:6px 14px;text-align:center;min-width:64px">
          <div style="font-size:1.1rem;font-weight:800;color:#4ade80">${sales}</div>
          <div style="font-size:0.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em">Ventas</div>
        </div>
        <div style="background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.25);border-radius:8px;padding:6px 14px;text-align:center;min-width:80px">
          <div style="font-size:1.1rem;font-weight:800;color:#60a5fa">$${totalComm}</div>
          <div style="font-size:0.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em">Comisión</div>
        </div>
      </div>
    </div>

    <!-- Link de referido -->
    <div style="background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <span style="flex:1;font-size:0.82rem;color:var(--text2);font-family:monospace;word-break:break-all">${escHtml(link)}</span>
      <button onclick="copyRefLink('${escHtml(link)}', this)"
        style="background:var(--accent);color:#000;border:none;border-radius:6px;padding:6px 14px;font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0">
        📋 Copiar
      </button>
    </div>

    <!-- Formulario editable: dueño + comisión -->
    <div style="display:grid;grid-template-columns:1fr 1fr auto auto;gap:8px;align-items:end;flex-wrap:wrap" id="edit-row-${escHtml(c.code)}">
      <div>
        <label style="font-size:0.75rem;color:var(--text3);display:block;margin-bottom:4px">Nombre del dueño</label>
        <input type="text" id="edit-name-${escHtml(c.code)}" value="${escHtml(c.owner_name || '')}"
          placeholder="Nombre"
          style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:7px;padding:8px 12px;color:var(--text1);font-size:0.88rem;box-sizing:border-box" />
      </div>
      <div>
        <label style="font-size:0.75rem;color:var(--text3);display:block;margin-bottom:4px">Email del dueño</label>
        <input type="email" id="edit-email-${escHtml(c.code)}" value="${escHtml(c.owner_email || '')}"
          placeholder="email@ejemplo.com"
          style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:7px;padding:8px 12px;color:var(--text1);font-size:0.88rem;box-sizing:border-box" />
      </div>
      <div>
        <label style="font-size:0.75rem;color:var(--text3);display:block;margin-bottom:4px">Comisión USD/venta</label>
        <input type="number" id="edit-comm-${escHtml(c.code)}" value="${commission}"
          min="0" step="0.01" placeholder="0.00"
          style="width:90px;background:var(--input);border:1px solid var(--border);border-radius:7px;padding:8px 12px;color:var(--text1);font-size:0.88rem;box-sizing:border-box" />
      </div>
      <div style="padding-top:18px;display:flex;gap:6px">
        <button onclick="saveReferralCode('${escHtml(c.code)}')"
          style="background:var(--accent);color:#000;border:none;border-radius:7px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:0.85rem;white-space:nowrap">
          💾 Guardar
        </button>
        <button onclick="deleteReferralCode('${escHtml(c.code)}')"
          style="background:none;border:1px solid #ef4444;color:#ef4444;border-radius:7px;padding:8px 10px;cursor:pointer;font-size:0.85rem"
          title="Eliminar código">✕</button>
      </div>
    </div>

    <div id="edit-msg-${escHtml(c.code)}" style="margin-top:8px;font-size:0.82rem;min-height:16px"></div>
  </div>`;
}

// ─── Copiar link al portapapeles ───────────────────────────────────────────────
function copyRefLink(url, btn) {
  navigator.clipboard.writeText(url).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copiado';
    btn.style.background = '#4ade80';
    setTimeout(() => { btn.textContent = orig; btn.style.background = 'var(--accent)'; }, 2000);
  }).catch(() => {
    // Fallback para navegadores sin clipboard API
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✓ Copiado';
    setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000);
  });
}

// ─── Guardar cambios de un código (dueño + comisión) ─────────────────────────
async function saveReferralCode(code) {
  const name  = (document.getElementById(`edit-name-${code}`)?.value  || '').trim();
  const email = (document.getElementById(`edit-email-${code}`)?.value || '').trim();
  const comm  = parseFloat(document.getElementById(`edit-comm-${code}`)?.value || 0) || 0;
  const msgEl = document.getElementById(`edit-msg-${code}`);

  if (msgEl) msgEl.innerHTML = `<span style="color:var(--text3)">Guardando...</span>`;
  try {
    await Api._req('PUT', `/api/admin/referral-codes/${encodeURIComponent(code)}`, {
      owner_name: name, owner_email: email, commission_usd: comm
    });
    if (msgEl) msgEl.innerHTML = `<span style="color:#4ade80">✓ Guardado correctamente</span>`;
    setTimeout(() => { if (msgEl) msgEl.innerHTML = ''; }, 3000);
    // Refrescar para actualizar stats
    await loadReferralCodes();
  } catch (e) {
    if (msgEl) msgEl.innerHTML = `<span style="color:#ef4444">Error: ${escHtml(e.message)}</span>`;
  }
}

// ─── Agregar nuevo código ──────────────────────────────────────────────────────
async function addReferralCode() {
  const codeEl  = document.getElementById('ref-new-code');
  const notesEl = document.getElementById('ref-new-notes');
  const errEl   = document.getElementById('ref-add-error');
  const code    = (codeEl?.value || '').trim();
  const notes   = (notesEl?.value || '').trim();
  if (errEl) errEl.innerHTML = '';

  if (!code) {
    if (errEl) errEl.innerHTML = `<div class="form-error" style="margin-bottom:8px">El código no puede estar vacío.</div>`;
    return;
  }

  try {
    await Api.post('/api/admin/referral-codes', { code, notes });
    if (codeEl)  codeEl.value  = '';
    if (notesEl) notesEl.value = '';
    await loadReferralCodes();
  } catch (e) {
    if (errEl) errEl.innerHTML = `<div class="form-error" style="margin-bottom:8px">${escHtml(e.message)}</div>`;
  }
}

// ─── Eliminar código ───────────────────────────────────────────────────────────
async function deleteReferralCode(code) {
  if (!confirm(`¿Eliminar el código "${code}"?\nLos usuarios que ya lo usaron no se verán afectados.`)) return;
  try {
    await Api._req('DELETE', `/api/admin/referral-codes/${encodeURIComponent(code)}`);
    await loadReferralCodes();
  } catch (e) {
    alert(`Error al eliminar: ${e.message}`);
  }
}

// ─── Enviar reporte mensual ────────────────────────────────────────────────────
async function sendMonthlyReport() {
  const month  = parseInt(document.getElementById('ref-report-month')?.value || 0);
  const year   = parseInt(document.getElementById('ref-report-year')?.value  || 0);
  const resEl  = document.getElementById('ref-report-result');
  const btn    = document.getElementById('ref-report-btn');

  if (!month || !year) return;

  const monthNames = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  if (!confirm(`¿Enviar reportes de comisiones de ${monthNames[month]} ${year} a todos los referidores con email configurado?`)) return;

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }
  if (resEl) resEl.innerHTML = '';

  try {
    const data    = await Api.post('/api/admin/referrals/send-report', { month, year });
    const results = data.results || [];

    if (resEl) {
      const sentOk  = results.filter(r => r.sent);
      const noSales = results.filter(r => !r.sent && r.reason);

      let html = `<div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.25);border-radius:8px;padding:14px">`;
      html += `<div style="font-weight:700;color:#4ade80;margin-bottom:10px">✓ Proceso completado — ${monthNames[month]} ${year}</div>`;

      if (sentOk.length > 0) {
        html += `<div style="font-size:0.85rem;color:var(--text2);margin-bottom:6px"><strong>📧 Emails enviados (${sentOk.length}):</strong></div>`;
        html += `<ul style="margin:0 0 10px;padding-left:18px;font-size:0.82rem;color:var(--text3)">`;
        sentOk.forEach(r => {
          html += `<li><strong>${escHtml(r.code)}</strong> → ${escHtml(r.owner_email)} — `
               + `${r.users} venta${r.users !== 1 ? 's' : ''}, `
               + `$${Number(r.total_sales || 0).toFixed(2)} facturado, `
               + `<span style="color:#4ade80">$${Number(r.total_commission || 0).toFixed(2)} comisión</span></li>`;
        });
        html += `</ul>`;
      }

      if (noSales.length > 0) {
        html += `<div style="font-size:0.82rem;color:var(--text3)">⏭ Sin ventas este mes: ${noSales.map(r => escHtml(r.code)).join(', ')}</div>`;
      }

      if (sentOk.length === 0 && noSales.length === 0) {
        html += `<div style="font-size:0.85rem;color:var(--text3)">No hay referidores con email configurado o con ventas este mes.</div>`;
      }

      html += `</div>`;
      resEl.innerHTML = html;
    }
  } catch (e) {
    if (resEl) resEl.innerHTML = `<div style="color:#ef4444;font-size:0.88rem">Error: ${escHtml(e.message)}</div>`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📤 Enviar Reportes'; }
  }
}

// ─── Utilidad: escapar HTML ────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
