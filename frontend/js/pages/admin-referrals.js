async function renderAdminReferrals() {
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:700px;margin:32px auto;padding:0 16px">
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
            style="flex:1;min-width:160px;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:0.95rem"
            onkeydown="if(event.key==='Enter')addReferralCode()" />
          <input type="text" id="ref-new-notes" placeholder="Notas (opcional)"
            style="flex:2;min-width:180px;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:0.95rem"
            onkeydown="if(event.key==='Enter')addReferralCode()" />
          <button onclick="addReferralCode()"
            style="background:var(--accent);color:#000;border:none;border-radius:8px;padding:10px 20px;font-weight:700;cursor:pointer;white-space:nowrap">
            + Agregar
          </button>
        </div>
      </div>

      <!-- Lista de códigos -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px">
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
    </div>`;

  await loadReferralCodes();
}

async function loadReferralCodes() {
  const listEl = document.getElementById('ref-list');
  try {
    const data = await Api.get('/api/admin/referral-codes');
    const codes = data.codes || [];

    if (codes.length === 0) {
      listEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text3)">No hay códigos todavía. Agrega el primero arriba.</div>`;
      return;
    }

    listEl.innerHTML = `
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:10px 8px;color:var(--text3);font-size:0.8rem;font-weight:600;text-transform:uppercase">Código</th>
            <th style="text-align:left;padding:10px 8px;color:var(--text3);font-size:0.8rem;font-weight:600;text-transform:uppercase">Notas</th>
            <th style="text-align:left;padding:10px 8px;color:var(--text3);font-size:0.8rem;font-weight:600;text-transform:uppercase">Creado</th>
            <th style="width:60px"></th>
          </tr>
        </thead>
        <tbody>
          ${codes.map((c, i) => `
            <tr style="border-bottom:1px solid var(--border);${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}">
              <td style="padding:12px 8px;font-weight:700;color:var(--accent);font-family:monospace;font-size:1rem">${escHtml(c.code)}</td>
              <td style="padding:12px 8px;color:var(--text2);font-size:0.9rem">${escHtml(c.notes || '—')}</td>
              <td style="padding:12px 8px;color:var(--text3);font-size:0.82rem">${c.created_at ? c.created_at.slice(0,10) : '—'}</td>
              <td style="padding:12px 8px;text-align:right">
                <button onclick="deleteReferralCode('${escHtml(c.code)}')"
                  style="background:none;border:1px solid #ef4444;color:#ef4444;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.82rem"
                  title="Eliminar">✕</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
      <p style="margin:12px 0 0;color:var(--text3);font-size:0.8rem">${codes.length} código${codes.length !== 1 ? 's' : ''} activo${codes.length !== 1 ? 's' : ''}</p>`;
  } catch (e) {
    listEl.innerHTML = `<div style="color:#ef4444;padding:16px">Error al cargar: ${e.message}</div>`;
  }
}

async function addReferralCode() {
  const codeEl  = document.getElementById('ref-new-code');
  const notesEl = document.getElementById('ref-new-notes');
  const errEl   = document.getElementById('ref-add-error');
  const code    = codeEl.value.trim();
  const notes   = notesEl.value.trim();
  errEl.innerHTML = '';

  if (!code) {
    errEl.innerHTML = `<div class="form-error" style="margin-bottom:8px">El código no puede estar vacío.</div>`;
    return;
  }

  try {
    await Api.post('/api/admin/referral-codes', { code, notes });
    codeEl.value  = '';
    notesEl.value = '';
    await loadReferralCodes();
  } catch (e) {
    errEl.innerHTML = `<div class="form-error" style="margin-bottom:8px">${e.message}</div>`;
  }
}

async function deleteReferralCode(code) {
  if (!confirm(`¿Eliminar el código "${code}"? Los usuarios que ya lo usaron no se verán afectados.`)) return;
  try {
    await Api._req('DELETE', `/api/admin/referral-codes/${encodeURIComponent(code)}`);
    await loadReferralCodes();
  } catch (e) {
    alert(`Error al eliminar: ${e.message}`);
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
