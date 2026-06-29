async function renderAdminRetention() {
  const isEN = window._lang === 'en';
  const isPT = window._lang === 'pt';

  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:960px;margin:32px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
        <h2 style="margin:0;color:var(--accent)">📬 ${isEN ? 'User Retention' : isPT ? 'Retenção de Usuários' : 'Retención de Usuarios'}</h2>
      </div>

      <!-- Embudo resumen -->
      <div id="retention-funnel" style="margin-bottom:24px"></div>

      <!-- Tabla -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;font-size:1rem;color:var(--text2)">
            ${isEN ? 'Users with incomplete cycle' : isPT ? 'Usuários com ciclo incompleto' : 'Usuarios con ciclo incompleto'}
          </h3>
          <div style="display:flex;gap:8px">
            <button id="btn-preview" onclick="sendRetentionPreview(this)"
              style="background:#14532d;border:1px solid #4ade8055;border-radius:6px;padding:6px 14px;color:#4ade80;cursor:pointer;font-size:0.85rem">
              📧 ${isEN ? 'Send sample to me' : isPT ? 'Enviar amostra p/ mim' : 'Enviar muestra a mí'}
            </button>
            <button id="btn-send-all" onclick="sendRetentionAll(this)"
              style="background:#7c3aed22;border:1px solid #a78bfa55;border-radius:6px;padding:6px 14px;color:#a78bfa;cursor:pointer;font-size:0.85rem;font-weight:600">
              🚀 ${isEN ? 'Send to all' : isPT ? 'Enviar para todos' : 'Enviar a todos'}
            </button>
            <button onclick="loadRetentionData()"
              style="background:none;border:1px solid var(--border);border-radius:6px;padding:6px 12px;color:var(--text2);cursor:pointer;font-size:0.85rem">
              ↻ ${isEN ? 'Refresh' : isPT ? 'Atualizar' : 'Actualizar'}
            </button>
          </div>
        <input type="text" id="retention-search"
          placeholder="${isEN ? 'Search by name or email...' : isPT ? 'Buscar por nome ou e-mail...' : 'Buscar por nombre o email...'}"
          oninput="filterRetentionUsers(this.value)"
          style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:0.9rem;margin-bottom:16px" />
        <div id="retention-list">
          <div style="text-align:center;padding:32px;color:var(--text3)">
            ${isEN ? 'Loading...' : isPT ? 'Carregando...' : 'Cargando...'}
          </div>
        </div>
      </div>
    </div>`;

  await loadRetentionData();
}

let _allRetentionUsers = [];

async function loadRetentionData() {
  const isEN = window._lang === 'en';
  const isPT = window._lang === 'pt';
  try {
    const data = await Api.get('/api/admin/retention/status');
    _allRetentionUsers = data.users || [];

    // Embudo
    const funnel = document.getElementById('retention-funnel');
    const steps = [
      { key: 'test_mental',   es: 'Test Mental',      pt: 'Teste Mental',     en: 'Mental Test' },
      { key: 'test_tecnico',  es: 'Test Técnico',     pt: 'Teste Técnico',    en: 'Technical Test' },
      { key: 'perfil_ia',     es: 'Perfil IA',        pt: 'Perfil IA',        en: 'AI Profile' },
      { key: 'analisis_mano', es: 'Análisis de Mano', pt: 'Análise de Mão',   en: 'Hand Analysis' },
    ];
    const total = data.total || 1;
    funnel.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">
        ${steps.map(s => {
          const count = (data.users || []).filter(u => u.cycle[s.key]).length;
          const pct = Math.round((count / total) * 100);
          const label = isEN ? s.en : isPT ? s.pt : s.es;
          return `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
              <div style="font-size:1.5rem;font-weight:700;color:#a78bfa">${count}</div>
              <div style="font-size:0.75rem;color:var(--text3);margin-top:4px">${label}</div>
              <div style="font-size:0.8rem;color:var(--text2);margin-top:2px">${pct}%</div>
            </div>`;
        }).join('')}
        <div style="background:var(--card);border:1px solid #4ade8055;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700;color:#4ade80">${data.completados}</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px">${isEN ? 'Complete' : isPT ? 'Completos' : 'Completos'}</div>
          <div style="font-size:0.8rem;color:var(--text2);margin-top:2px">${Math.round(((data.completados||0)/total)*100)}%</div>
        </div>
      </div>`;

    renderRetentionTable(_allRetentionUsers.filter(u => !u.cycle.completado));
  } catch (e) {
    document.getElementById('retention-list').innerHTML =
      `<div style="color:#f87171;text-align:center;padding:24px">Error cargando datos</div>`;
  }
}

function filterRetentionUsers(q) {
  const filtered = _allRetentionUsers.filter(u =>
    !u.cycle.completado &&
    (u.nombre.toLowerCase().includes(q.toLowerCase()) ||
     u.email.toLowerCase().includes(q.toLowerCase()))
  );
  renderRetentionTable(filtered);
}

function renderRetentionTable(users) {
  const isEN = window._lang === 'en';
  const isPT = window._lang === 'pt';
  const el = document.getElementById('retention-list');
  if (!users.length) {
    el.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text3)">
      ${isEN ? 'No users with incomplete cycle' : isPT ? 'Nenhum usuário com ciclo incompleto' : 'No hay usuarios con ciclo incompleto'}
    </div>`;
    return;
  }

  const check = (val) => val
    ? '<span style="color:#4ade80">✓</span>'
    : '<span style="color:#f87171">✗</span>';

  const rows = users.map(u => {
    const lastMail = u.last_retention_email_at
      ? new Date(u.last_retention_email_at).toLocaleDateString()
      : (isEN ? 'Never' : isPT ? 'Nunca' : 'Nunca');
    const opened = u.retention_email_opened_at
      ? `<span style="color:#4ade80;font-size:0.8rem">👁 ${new Date(u.retention_email_opened_at).toLocaleDateString()}</span>`
      : `<span style="color:#475569;font-size:0.78rem">—</span>`;
    return `
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:10px 8px;color:var(--text1);font-size:0.88rem">${u.nombre}</td>
        <td style="padding:10px 8px;color:var(--text3);font-size:0.8rem">${u.email}</td>
        <td style="padding:10px 8px;text-align:center">${check(u.cycle.test_mental)}</td>
        <td style="padding:10px 8px;text-align:center">${check(u.cycle.test_tecnico)}</td>
        <td style="padding:10px 8px;text-align:center">${check(u.cycle.perfil_ia)}</td>
        <td style="padding:10px 8px;text-align:center">${check(u.cycle.analisis_mano)}</td>
        <td style="padding:10px 8px;color:var(--text3);font-size:0.8rem;text-align:center">${lastMail}</td>
        <td style="padding:10px 8px;text-align:center">${opened}</td>
        <td style="padding:10px 8px;text-align:center">
          <button onclick="sendRetentionNow(${u.id}, this)"
            style="background:#a78bfa22;border:1px solid #a78bfa55;border-radius:6px;padding:5px 12px;color:#a78bfa;cursor:pointer;font-size:0.8rem">
            ${isEN ? 'Send now' : isPT ? 'Enviar agora' : 'Enviar ahora'}
          </button>
        </td>
      </tr>`;
  }).join('');

  el.innerHTML = `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:0.88rem">
        <thead>
          <tr style="color:var(--text3);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em">
            <th style="padding:8px;text-align:left">${isEN ? 'Name' : isPT ? 'Nome' : 'Nombre'}</th>
            <th style="padding:8px;text-align:left">Email</th>
            <th style="padding:8px;text-align:center">${isEN ? 'Mental' : 'Mental'}</th>
            <th style="padding:8px;text-align:center">${isEN ? 'Technical' : isPT ? 'Técnico' : 'Técnico'}</th>
            <th style="padding:8px;text-align:center">${isEN ? 'AI Profile' : isPT ? 'Perfil IA' : 'Perfil IA'}</th>
            <th style="padding:8px;text-align:center">${isEN ? 'Hand' : isPT ? 'Mão' : 'Mano'}</th>
            <th style="padding:8px;text-align:center">${isEN ? 'Last email' : isPT ? 'Último e-mail' : 'Último mail'}</th>
            <th style="padding:8px;text-align:center">${isEN ? 'Opened' : isPT ? 'Aberto' : 'Abierto'}</th>
            <th style="padding:8px;text-align:center">${isEN ? 'Action' : isPT ? 'Ação' : 'Acción'}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

async function sendRetentionNow(userId, btn) {
  const isEN = window._lang === 'en';
  const isPT = window._lang === 'pt';
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const res = await Api.post(`/api/admin/retention/send-now/${userId}`, {});
    if (res.ok) {
      btn.textContent = isEN ? 'Sent ✓' : isPT ? 'Enviado ✓' : 'Enviado ✓';
      btn.style.color = '#4ade80';
      btn.style.borderColor = '#4ade8055';
    } else {
      btn.textContent = res.message || 'Error';
      btn.style.color = '#f87171';
      btn.disabled = false;
    }
  } catch (e) {
    btn.textContent = 'Error';
    btn.style.color = '#f87171';
    btn.disabled = false;
  }
}

async function sendRetentionAll(btn) {
  const isEN = window._lang === 'en';
  const isPT = window._lang === 'pt';
  const confirm_msg = isEN
    ? 'This will send emails to ALL users with incomplete cycle. Continue?'
    : isPT ? 'Isso enviará e-mails para TODOS os usuários com ciclo incompleto. Continuar?'
    : '¿Enviar correos a TODOS los usuarios con ciclo incompleto?';
  if (!confirm(confirm_msg)) return;
  btn.disabled = true;
  btn.textContent = '⏳ Enviando...';
  try {
    const res = await Api.post('/api/admin/retention/send-all', {});
    if (res.ok) {
      btn.textContent = `✓ ${res.sent} enviados`;
      btn.style.color = '#4ade80';
      btn.style.borderColor = '#4ade8055';
      if (res.errors && res.errors.length) {
        console.warn('[RETENTION] Errores:', res.errors);
      }
      await loadRetentionData();
    } else {
      btn.textContent = res.error || 'Error';
      btn.style.color = '#f87171';
      btn.disabled = false;
    }
  } catch (e) {
    btn.textContent = 'Error';
    btn.style.color = '#f87171';
    btn.disabled = false;
  }
}

async function sendRetentionPreview(btn) {
  const isEN = window._lang === 'en';
  const isPT = window._lang === 'pt';
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const res = await Api.post('/api/admin/retention/preview', {});
    if (res.ok) {
      btn.textContent = isEN ? 'Sent ✓' : isPT ? 'Enviado ✓' : 'Enviado ✓';
      btn.style.color = '#4ade80';
      btn.style.borderColor = '#4ade8055';
    } else {
      btn.textContent = res.error || 'Error';
      btn.style.color = '#f87171';
      btn.disabled = false;
    }
  } catch (e) {
    btn.textContent = 'Error';
    btn.style.color = '#f87171';
    btn.disabled = false;
  }
}
