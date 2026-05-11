async function renderAdminUsers() {
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:800px;margin:32px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
        <h2 style="margin:0;color:var(--accent)">👥 Gestión de Usuarios</h2>
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;font-size:1rem;color:var(--text2)">Todos los usuarios</h3>
          <button onclick="loadAdminUsers()"
            style="background:none;border:1px solid var(--border);border-radius:6px;padding:6px 12px;color:var(--text2);cursor:pointer;font-size:0.85rem">
            ↻ Actualizar
          </button>
        </div>
        <input type="text" id="user-search" placeholder="Buscar por nombre o email..."
          oninput="filterUsers(this.value)"
          style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text1);font-size:0.9rem;margin-bottom:16px" />
        <div id="users-list">
          <div style="text-align:center;padding:32px;color:var(--text3)">Cargando...</div>
        </div>
      </div>
    </div>`;

  await loadAdminUsers();
}

let _allUsers = [];

async function loadAdminUsers() {
  const listEl = document.getElementById('users-list');
  try {
    const data = await Api.get('/api/admin/users');
    _allUsers = data.users || [];
    renderUsersList(_allUsers);
  } catch (e) {
    listEl.innerHTML = `<div style="color:#ef4444;padding:16px">Error: ${e.message}</div>`;
  }
}

function filterUsers(q) {
  const term = q.toLowerCase();
  const filtered = _allUsers.filter(u =>
    `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(term)
  );
  renderUsersList(filtered);
}

function renderUsersList(users) {
  const listEl = document.getElementById('users-list');
  if (users.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text3)">No se encontraron usuarios.</div>`;
    return;
  }
  listEl.innerHTML = `
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:8px;color:var(--text3);font-size:0.78rem;font-weight:600;text-transform:uppercase">Nombre</th>
          <th style="text-align:left;padding:8px;color:var(--text3);font-size:0.78rem;font-weight:600;text-transform:uppercase">Email</th>
          <th style="text-align:left;padding:8px;color:var(--text3);font-size:0.78rem;font-weight:600;text-transform:uppercase">País</th>
          <th style="text-align:left;padding:8px;color:var(--text3);font-size:0.78rem;font-weight:600;text-transform:uppercase">Registro</th>
          <th style="width:60px"></th>
        </tr>
      </thead>
      <tbody>
        ${users.map((u, i) => `
          <tr style="border-bottom:1px solid var(--border);${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}">
            <td style="padding:10px 8px;font-weight:600">${escHtml(u.nombre)} ${escHtml(u.apellido)}</td>
            <td style="padding:10px 8px;color:var(--text2);font-size:0.88rem">${escHtml(u.email)}</td>
            <td style="padding:10px 8px;color:var(--text3);font-size:0.85rem">${escHtml(u.pais || '—')}</td>
            <td style="padding:10px 8px;color:var(--text3);font-size:0.82rem">${(u.created_at || '').slice(0,10)}</td>
            <td style="padding:10px 8px;text-align:right">
              <button onclick="deleteUser(${u.id}, '${escHtml(u.nombre)} ${escHtml(u.apellido)}')"
                style="background:none;border:1px solid #ef4444;color:#ef4444;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.82rem">
                ✕
              </button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
    <p style="margin:12px 0 0;color:var(--text3);font-size:0.8rem">${users.length} usuario${users.length !== 1 ? 's' : ''}</p>`;
}

async function deleteUser(userId, name) {
  if (!confirm(`¿Eliminar todos los datos de "${name}"? Esta acción no se puede deshacer.`)) return;
  try {
    await Api._req('DELETE', `/api/admin/users/${userId}`);
    _allUsers = _allUsers.filter(u => u.id !== userId);
    renderUsersList(_allUsers);
  } catch (e) {
    alert(`Error al eliminar: ${e.message}`);
  }
}
