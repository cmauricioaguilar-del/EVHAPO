async function renderDashboard() {
  if (!Api.isLoggedIn()) { App.go('login'); return; }
  const user = Api.currentUser();
  const isPT = I18N.isPT();

  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div class="page-wide">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:1.8rem;font-weight:800">${isPT ? 'Meu Painel' : 'Mi Dashboard'}</h1>
          <p class="text-muted">${isPT ? 'Bem-vindo/a,' : 'Bienvenido/a,'} <strong>${user.nombre}</strong>. ${isPT ? 'Seu centro de diagnóstico e melhoria.' : 'Tu centro de diagnóstico y mejora.'}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-secondary" onclick="showGuide()" style="border-color:#d4af37;color:#d4af37">📖 ${isPT ? 'Guia' : 'Guía'}</button>
          <button class="btn btn-secondary" onclick="App.go('study-plan')" style="border-color:#818cf8;color:#818cf8">📚 Plan</button>
          <button class="btn btn-secondary" onclick="App.go('sessions')" style="border-color:#4DB6AC;color:#4DB6AC">🃏 Sesiones</button>
          <button class="btn btn-secondary" onclick="App.go('bankroll')" style="border-color:#4ade80;color:#4ade80">💰 Bankroll</button>
          ${user.is_admin ? `<button class="btn btn-secondary" onclick="App.go('admin-analytics')" style="border-color:#4DB6AC;color:#4DB6AC">📊 Analytics</button>` : ''}
          ${user.is_admin ? `<button class="btn btn-secondary" onclick="App.go('admin-referrals')" style="border-color:var(--accent);color:var(--accent)">♠ Referidos</button>` : ''}
          ${user.is_admin ? `<button class="btn btn-secondary" onclick="App.go('admin-users')" style="border-color:var(--accent);color:var(--accent)">👥 Usuarios</button>` : ''}
          ${user.is_admin ? `<button class="btn btn-secondary" onclick="App.go('admin-coupons')" style="border-color:var(--accent);color:var(--accent)">🎟️ Cupones</button>` : ''}
          <button class="btn btn-secondary" onclick="startNewTest('mental')">🧠 ${isPT ? 'Teste Mental' : 'Test Mental'}</button>
          <button class="btn btn-primary"   onclick="startNewTest('technical')">⚙️ ${isPT ? 'Teste Técnico' : 'Test Técnico'}</button>
        </div>
      </div>
      <div id="dashboard-content"><div style="text-align:center;padding:60px"><div class="spinner" style="margin:0 auto"></div></div></div>
    </div>`;

  try {
    const data = await Api.dashboard();
    renderDashboardContent(data, user);
  } catch (e) {
    document.getElementById('dashboard-content').innerHTML = `<div class="form-error">Error: ${e.message}</div>`;
  }
}

function renderDashboardContent(data, user) {
  const { history, benchmark } = data;
  const isPT = I18N.isPT();

  // Resetear flags de carga para que los tabs siempre recarguen su contenido guardado
  _profileAlreadyLoaded    = false;
  _tournamentAlreadyLoaded = false;

  // Separar historial por tipo de test
  const mentalHistory    = history.filter(s => !s.test_type || s.test_type === 'mental');
  const technicalHistory = history.filter(s => s.test_type === 'technical');
  const latestMental     = mentalHistory[0] || null;
  const latestTechnical  = technicalHistory[0] || null;

  const getScores  = s => s ? (typeof s.scores === 'string' ? JSON.parse(s.scores) : s.scores) : null;
  const mentalSc   = getScores(latestMental);
  const techSc     = getScores(latestTechnical);

  // Guardar globalmente para usarlos al cambiar de tab
  _dashMentalSc = mentalSc;
  _dashTechSc   = techSc;
  const mentalOv   = mentalSc    ? getOverallScore(mentalSc)          : null;
  const techOv     = techSc      ? getTechnicalOverallScore(techSc)   : null;
  const mentalLvl  = mentalOv  !== null ? getLevel(mentalOv)          : null;
  const techLvl    = techOv    !== null ? getTechnicalLevel(techOv)   : null;

  let html = '';

  // ─── Stats cards ──────────────────────────────────────────────────────────
  html += `<div class="dashboard-grid">
    <div class="stat-card">
      <div class="stat-val">${history.length}</div>
      <div class="stat-label">${isPT ? 'Testes totais' : 'Tests totales'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color:${mentalOv !== null ? (mentalOv >= 80 ? 'var(--green)' : mentalOv >= 60 ? 'var(--accent)' : 'var(--red)') : 'var(--text2)'}">
        ${mentalOv !== null ? mentalOv + '%' : '—'}
      </div>
      <div class="stat-label">🧠 ${isPT ? 'Nível Mental' : 'Nivel Mental'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color:${techOv !== null ? (techOv >= 80 ? 'var(--green)' : techOv >= 60 ? 'var(--accent)' : 'var(--red)') : 'var(--text2)'}">
        ${techOv !== null ? techOv + '%' : '—'}
      </div>
      <div class="stat-label">⚙️ ${isPT ? 'Nível Técnico' : 'Nivel Técnico'}</div>
    </div>
    <div class="stat-card">
      ${(() => {
        const combinado = mentalOv !== null && techOv !== null
          ? Math.round((mentalOv + techOv) / 2)
          : mentalOv !== null ? mentalOv : techOv !== null ? techOv : null;
        const color = combinado !== null
          ? (combinado >= 80 ? 'var(--green)' : combinado >= 60 ? 'var(--accent)' : 'var(--red)')
          : 'var(--text2)';
        return `<div class="stat-val" style="color:${color}">${combinado !== null ? combinado + '%' : '—'}</div>`;
      })()}
      <div class="stat-label">${isPT ? 'Índice combinado' : 'Índice combinado'}</div>
    </div>
  </div>`;

  if (!history.length) {
    html += `
      <div class="empty-state">
        <span class="empty-icon">♠</span>
        <h2>${isPT ? 'Ainda não tem diagnósticos' : 'Aún no tienes diagnósticos'}</h2>
        <p>${isPT ? 'Complete seu primeiro teste para ver seu mapa de habilidades e plano de melhoria.' : 'Completa tu primer test para ver tu mapa de habilidades y plan de mejora.'}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px">
          <button class="btn btn-secondary" onclick="startNewTest('mental')">🧠 ${isPT ? 'Começar Teste Mental' : 'Comenzar Test Mental'}</button>
          <button class="btn btn-primary"   onclick="startNewTest('technical')">⚙️ ${isPT ? 'Começar Teste Técnico' : 'Comenzar Test Técnico'}</button>
        </div>
      </div>`;
    document.getElementById('dashboard-content').innerHTML = html;
    return;
  }

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const hasBoth      = mentalSc && techSc;
  const hasEvolution = mentalHistory.length >= 2 || technicalHistory.length >= 2;
  _dashHasBoth  = !!hasBoth;

  // Guardar datos de evolución globalmente (para dibujar radares al activar el tab)
  _evoData = {};
  if (mentalHistory.length >= 2) {
    _evoData.mental = {
      prev: typeof mentalHistory[1].scores === 'string' ? JSON.parse(mentalHistory[1].scores) : mentalHistory[1].scores,
      curr: typeof mentalHistory[0].scores === 'string' ? JSON.parse(mentalHistory[0].scores) : mentalHistory[0].scores,
      prevDate: mentalHistory[1].completed_at,
      currDate: mentalHistory[0].completed_at,
    };
  }
  if (technicalHistory.length >= 2) {
    _evoData.technical = {
      prev: typeof technicalHistory[1].scores === 'string' ? JSON.parse(technicalHistory[1].scores) : technicalHistory[1].scores,
      curr: typeof technicalHistory[0].scores === 'string' ? JSON.parse(technicalHistory[0].scores) : technicalHistory[0].scores,
      prevDate: technicalHistory[1].completed_at,
      currDate: technicalHistory[0].completed_at,
    };
  }

  html += `<div class="tabs">
    ${hasBoth ? `<button class="tab-btn active" onclick="dashTab('combined')">🔀 ${isPT ? 'Vista Combinada' : 'Vista Combinada'}</button>` : ''}
    <button class="tab-btn ${!hasBoth ? 'active' : ''}" onclick="dashTab('mental')">🧠 Mental ${mentalSc ? '' : `<span style='font-size:0.7rem;color:var(--text3)'>— ${isPT ? 'pendente' : 'pendiente'}</span>`}</button>
    <button class="tab-btn" onclick="dashTab('technical')">⚙️ ${isPT ? 'Técnico' : 'Técnico'} ${techSc ? '' : `<span style='font-size:0.7rem;color:var(--text3)'>— ${isPT ? 'pendente' : 'pendiente'}</span>`}</button>
    ${hasEvolution ? `<button class="tab-btn" onclick="dashTab('evolution')">📈 ${isPT ? 'Evolução' : 'Evolución'}</button>` : ''}
    <button class="tab-btn" onclick="dashTab('profile')">🧬 ${isPT ? 'Meu Perfil' : 'Mi Perfil'}</button>
    <button class="tab-btn" onclick="dashTab('tournament')">🃏 ${isPT ? 'Análise de Mãos' : 'Análisis de Manos'}</button>
    <button class="tab-btn" onclick="dashTab('history')">📅 ${isPT ? 'Histórico' : 'Historial'}</button>
    <button class="tab-btn" onclick="dashTab('benchmark')">🏅 Benchmark</button>
  </div>`;

  // ─── TAB: Vista combinada ─────────────────────────────────────────────────
  if (hasBoth) {
    html += `<div id="dtab-combined">`;
    html += `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <!-- Radar Mental -->
        <div class="card">
          <div class="card-header">
            <span class="card-icon">🧠</span>
            <div><h2>Mental</h2><div class="card-sub" style="color:var(--accent)">${mentalOv}% · ${mentalLvl.label}</div></div>
          </div>
          <canvas id="dash-radar-mental" style="max-height:280px"></canvas>
        </div>
        <!-- Radar Técnico -->
        <div class="card">
          <div class="card-header">
            <span class="card-icon">⚙️</span>
            <div><h2>Técnico</h2><div class="card-sub" style="color:#4DB6AC">${techOv}% · ${techLvl.label}</div></div>
          </div>
          <canvas id="dash-radar-tech" style="max-height:280px"></canvas>
        </div>
      </div>`;

    // Plan combinado (top 3 brechas de cada test)
    const mentalGaps = I18N.cats().map(c => ({ ...c, pct: mentalSc[c.key] || 0 }))
      .filter(c => c.pct < 80).sort((a, b) => a.pct - b.pct).slice(0, 3);
    const techGaps   = I18N.techCats().map(c => ({ ...c, pct: techSc[c.key] || 0 }))
      .filter(c => c.pct < 80).sort((a, b) => a.pct - b.pct).slice(0, 3);

    html += `
      <div class="card">
        <div class="card-header">
          <span class="card-icon">🗓️</span>
          <div><h2>${isPT ? 'Plano de Melhoria Combinado' : 'Plan de Mejora Combinado'}</h2><div class="card-sub">${isPT ? 'Suas principais lacunas de ambos os diagnósticos' : 'Tus principales brechas de ambos diagnósticos'}</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
          <div>
            <div style="font-size:0.8rem;font-weight:700;color:var(--accent);margin-bottom:12px;text-transform:uppercase">🧠 ${isPT ? 'Lacunas Mentais' : 'Brechas Mentales'}</div>
            ${mentalGaps.length ? mentalGaps.map(c => `
              <div class="mini-gap" style="border-left:3px solid ${c.color}">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span>${c.icon} ${c.label}</span>
                  <span style="color:${c.color};font-weight:700">${c.pct}%</span>
                </div>
                <div class="cat-score-bar" style="height:6px">
                  <div class="cat-score-fill" style="width:${c.pct}%;background:${c.color}"></div>
                </div>
              </div>`).join('') : `<p class="text-muted" style="font-size:0.875rem">${isPT ? '🏆 Todas as áreas mentais no nível elite!' : '¡Todas las áreas mentales en élite!'}</p>`}
          </div>
          <div>
            <div style="font-size:0.8rem;font-weight:700;color:#4DB6AC;margin-bottom:12px;text-transform:uppercase">⚙️ ${isPT ? 'Lacunas Técnicas' : 'Brechas Técnicas'}</div>
            ${techGaps.length ? techGaps.map(c => `
              <div class="mini-gap" style="border-left:3px solid ${c.color}">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span>${c.icon} ${c.label}</span>
                  <span style="color:${c.color};font-weight:700">${c.pct}%</span>
                </div>
                <div class="cat-score-bar" style="height:6px">
                  <div class="cat-score-fill" style="width:${c.pct}%;background:${c.color}"></div>
                </div>
              </div>`).join('') : `<p class="text-muted" style="font-size:0.875rem">${isPT ? '🏆 Todas as áreas técnicas no nível elite!' : '¡Todas las áreas técnicas en élite!'}</p>`}
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">
          <button class="btn btn-secondary btn-sm" onclick="App.go('results', ${latestMental.id})">${isPT ? 'Ver relatório mental →' : 'Ver informe mental →'}</button>
          <button class="btn btn-primary btn-sm"   onclick="App.go('results', ${latestTechnical.id})">${isPT ? 'Ver relatório técnico →' : 'Ver informe técnico →'}</button>
        </div>
      </div>`;
    html += `</div>`;
  }

  // ─── TAB: Mental ─────────────────────────────────────────────────────────
  html += `<div id="dtab-mental" ${hasBoth ? 'style="display:none"' : ''}>`;
  if (mentalSc) {
    const mentalCatData = I18N.cats().map(c => ({ ...c, pct: mentalSc[c.key] || 0 }));
    html += renderTestTab(mentalCatData, mentalOv, mentalLvl, latestMental.id, 'dash-radar-mental-solo', user, 'mental');
  } else {
    html += `
      <div class="empty-state">
        <span class="empty-icon">🧠</span>
        <h2>${isPT ? 'Teste Mental pendente' : 'Test Mental pendiente'}</h2>
        <p>${isPT ? 'Complete o diagnóstico mental para ver suas habilidades psicológicas como jogador.' : 'Completa el diagnóstico mental para ver tus habilidades psicológicas como jugador.'}</p>
        <button class="btn btn-secondary mt-4" onclick="startNewTest('mental')">${isPT ? 'Começar Teste Mental →' : 'Comenzar Test Mental →'}</button>
      </div>`;
  }
  html += `</div>`;

  // ─── TAB: Técnico ─────────────────────────────────────────────────────────
  html += `<div id="dtab-technical" style="display:none">`;
  if (techSc) {
    const techCatData = I18N.techCats().map(c => ({ ...c, pct: techSc[c.key] || 0 }));
    html += renderTestTab(techCatData, techOv, techLvl, latestTechnical.id, 'dash-radar-tech-solo', user, 'technical');
  } else {
    html += `
      <div class="empty-state">
        <span class="empty-icon">⚙️</span>
        <h2>${isPT ? 'Teste Técnico pendente' : 'Test Técnico pendiente'}</h2>
        <p>${isPT ? 'Complete o diagnóstico técnico para medir seus conhecimentos de Texas Hold\'em.' : 'Completa el diagnóstico técnico para medir tus conocimientos de Texas Hold\'em.'}</p>
        <button class="btn btn-primary mt-4" onclick="startNewTest('technical')">${isPT ? 'Começar Teste Técnico →' : 'Comenzar Test Técnico →'}</button>
      </div>`;
  }
  html += `</div>`;

  // ─── TAB: Mi Perfil IA ────────────────────────────────────────────────────
  const hasAnyTest = !!(mentalSc || techSc);
  html += `<div id="dtab-profile" style="display:none">`;
  html += `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-icon">🧬</span>
        <div>
          <h2>${isPT ? 'Meu Perfil como Jogador' : 'Mi Perfil como Jugador'}</h2>
          <div class="card-sub">${isPT ? 'Análise integral gerada por Inteligência Artificial · Correlação mental + técnico' : 'Análisis integral generado por Inteligencia Artificial · Correlación mental + técnico'}</div>
        </div>
      </div>

      ${!hasAnyTest ? `
        <div class="empty-state" style="padding:40px 20px">
          <span class="empty-icon">🧬</span>
          <h2>${isPT ? 'Complete pelo menos um teste' : 'Completa al menos un test'}</h2>
          <p>${isPT ? 'Você precisa completar o Teste Mental ou o Teste Técnico para gerar seu perfil.' : 'Necesitas completar el Test Mental o el Test Técnico para generar tu perfil.'}</p>
        </div>
      ` : `
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
          <button class="btn btn-primary" id="profile-gen-btn" onclick="generateProfile(${latestMental ? latestMental.id : 'null'}, ${latestTechnical ? latestTechnical.id : 'null'})">
            ✨ ${isPT ? 'Gerar meu perfil com IA' : 'Generar mi perfil con IA'}
          </button>
          <div style="color:var(--text2);font-size:0.85rem;align-self:center">
            ${hasBoth ? `🟢 ${isPT ? 'Teste mental + técnico disponíveis' : 'Test mental + técnico disponibles'}` : mentalSc ? `🟡 ${isPT ? 'Apenas teste mental disponível' : 'Solo test mental disponible'}` : `🟡 ${isPT ? 'Apenas teste técnico disponível' : 'Solo test técnico disponible'}`}<br>
            <span style="font-size:0.75rem">${isPT ? 'É salva automaticamente' : 'Se guarda automáticamente'}</span>
          </div>
        </div>
        <div id="profile-content">
          <div style="text-align:center;padding:40px;color:var(--text2)">
            <div style="font-size:3rem;margin-bottom:12px">🧬</div>
            <p>${isPT ? 'Clique em <strong>"Gerar meu perfil com IA"</strong> para obter sua análise personalizada.' : 'Hacé clic en <strong>"Generar mi perfil con IA"</strong> para obtener tu análisis personalizado.'}</p>
            <p style="font-size:0.85rem;margin-top:8px">${isPT ? 'A IA analisa todas as suas respostas, encontra correlações e inconsistências, e gera um relatório com diagnóstico e plano de trabalho.' : 'La IA analiza todas tus respuestas, encuentra correlaciones e incoherencias, y genera un informe con diagnóstico y plan de trabajo.'}</p>
          </div>
        </div>
      `}
    </div>`;
  html += `</div>`;

  // ─── TAB: Torneo ─────────────────────────────────────────────────────────
  html += renderTournamentTab();

  // ─── TAB: Historial ───────────────────────────────────────────────────────
  html += `<div id="dtab-history" style="display:none">`;
  html += history.map(s => {
    const sc  = typeof s.scores === 'string' ? JSON.parse(s.scores) : s.scores;
    const tt  = s.test_type || 'mental';
    const ov  = tt === 'technical' ? getTechnicalOverallScore(sc) : getOverallScore(sc);
    const lv  = tt === 'technical' ? getTechnicalLevel(ov) : getLevel(ov);
    const dt  = new Date(s.completed_at).toLocaleDateString(isPT ? 'pt-BR' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    const badge = tt === 'technical' ? `⚙️ ${isPT ? 'Técnico' : 'Técnico'}` : `🧠 Mental`;
    return `
      <div class="history-item" onclick="App.go('results', ${s.id})">
        <div>
          <div style="font-weight:700">${dt}</div>
          <div class="history-date">${badge} · ${lv.label}</div>
        </div>
        <div class="history-score">${ov}%</div>
        <button class="btn btn-secondary btn-sm">${isPT ? 'Ver →' : 'Ver →'}</button>
      </div>`;
  }).join('');
  html += `</div>`;

  // ─── TAB: Evolución ──────────────────────────────────────────────────────
  html += `<div id="dtab-evolution" style="display:none">`;
  if (hasEvolution) {
    const evoSections = ['mental', 'technical'].map(tt => {
      const evoD = _evoData[tt];
      if (!evoD) return '';
      const cats   = tt === 'technical' ? I18N.techCats() : I18N.cats();
      const getOv  = sc => tt === 'technical' ? getTechnicalOverallScore(sc) : getOverallScore(sc);
      const getLv  = (sc, ov) => tt === 'technical' ? getTechnicalLevel(ov) : getLevel(ov);
      const prevOv = getOv(evoD.prev);
      const currOv = getOv(evoD.curr);
      const delta  = Math.round((currOv - prevOv) * 10) / 10;
      const dc     = delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : '#94a3b8';
      const da     = delta > 0 ? '▲' : delta < 0 ? '▼' : '→';
      const ds     = delta > 0 ? '+' : '';
      const fmtDate = d => new Date(d).toLocaleDateString(isPT ? 'pt-BR' : 'es-ES', { day:'numeric', month:'short' });
      const canvasId = `evo-radar-${tt}`;
      const accentColor = tt === 'technical' ? '#4DB6AC' : '#d4af37';
      const icon   = tt === 'technical' ? '⚙️' : '🧠';
      const label  = tt === 'technical' ? 'Técnico' : 'Mental';
      const currLv = getLv(evoD.curr, currOv);

      return `
        <div class="card" style="margin-bottom:24px">
          <div class="card-header" style="flex-wrap:wrap;gap:12px">
            <span class="card-icon">${icon}</span>
            <div>
              <h2>${isPT ? 'Evolução' : 'Evolución'} ${label}</h2>
              <div class="card-sub">${fmtDate(evoD.prevDate)} → ${fmtDate(evoD.currDate)}</div>
            </div>
            <div style="margin-left:auto;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
              <div style="text-align:center">
                <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">${isPT ? 'Anterior' : 'Anterior'}</div>
                <div style="font-size:1.4rem;font-weight:700;color:var(--text3)">${prevOv}%</div>
              </div>
              <div style="font-size:1.5rem;color:${dc}">${da}</div>
              <div style="text-align:center">
                <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">${isPT ? 'Agora' : 'Ahora'}</div>
                <div style="font-size:1.4rem;font-weight:700;color:${accentColor}">${currOv}%</div>
              </div>
              <div style="background:${delta > 0 ? 'rgba(74,222,128,0.1)' : delta < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(148,163,184,0.1)'};border:1px solid ${dc};border-radius:10px;padding:10px 18px;text-align:center;min-width:80px">
                <div style="font-size:1.6rem;font-weight:800;color:${dc}">${ds}${delta}%</div>
                <div style="font-size:0.72rem;color:${dc}">${isPT ? 'evolução' : 'evolución'}</div>
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
            <!-- Radar comparativo -->
            <div>
              <canvas id="${canvasId}" style="max-height:260px"></canvas>
              <div style="display:flex;justify-content:center;gap:20px;margin-top:8px;font-size:0.78rem;color:var(--text3)">
                <span><span style="color:#334155;font-weight:700">●</span> ${fmtDate(evoD.prevDate)}</span>
                <span><span style="color:${accentColor};font-weight:700">●</span> ${fmtDate(evoD.currDate)} · ${currLv.label}</span>
              </div>
            </div>
            <!-- Barras por categoría -->
            <div>
              ${cats.map(c => {
                const pv = evoD.prev[c.key] || 0;
                const cv = evoD.curr[c.key] || 0;
                const d  = cv - pv;
                const dcolor = d > 0 ? '#4ade80' : d < 0 ? '#f87171' : '#64748b';
                const darrow = d > 0 ? '▲' : d < 0 ? '▼' : '—';
                return `
                  <div style="margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:3px">
                      <span>${c.icon} ${c.label}</span>
                      <span style="font-weight:700;color:${dcolor};font-size:0.8rem">${darrow} ${d >= 0 ? '+' : ''}${d.toFixed(0)}%</span>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;font-size:0.72rem">
                      <span style="color:var(--text3);width:28px;text-align:right">${pv}%</span>
                      <div style="flex:1;height:7px;background:var(--border);border-radius:4px;position:relative;overflow:hidden">
                        <div style="position:absolute;left:0;top:0;height:100%;width:${pv}%;background:#1e3a5f;border-radius:4px"></div>
                        <div style="position:absolute;left:0;top:0;height:100%;width:${cv}%;background:${accentColor};border-radius:4px;opacity:0.9"></div>
                      </div>
                      <span style="color:${accentColor};width:28px">${cv}%</span>
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>
        </div>`;
    }).join('');
    html += evoSections;
  }
  html += `</div>`;

  // ─── TAB: Benchmark ───────────────────────────────────────────────────────
  html += `<div id="dtab-benchmark" style="display:none">`;

  const hasBenchData = Object.keys(benchmark).length > 0;

  // Helper para renderizar una tarjeta de benchmark
  const renderBenchCard = (title, sub, icon, categories, userScores, accentColor) => {
    const cats = categories.filter(c => benchmark[c.key] !== undefined);
    if (!userScores || cats.length === 0) return '';
    return `
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <span class="card-icon">${icon}</span>
          <div><h2>${title}</h2><div class="card-sub">${sub}</div></div>
        </div>
        ${cats.map(c => {
          const myPct  = userScores[c.key] || 0;
          const avgPct = benchmark[c.key]  || 0;
          const diff   = myPct - avgPct;
          return `
            <div style="margin-bottom:18px">
              <div style="display:flex;justify-content:space-between;font-size:0.875rem;font-weight:600;margin-bottom:6px">
                <span>${c.icon} ${c.label}</span>
                <span style="color:${diff >= 0 ? 'var(--green)' : 'var(--red)'}">${diff >= 0 ? '+' : ''}${diff.toFixed(1)} vs ${isPT ? 'média' : 'promedio'}</span>
              </div>
              <div class="benchmark-bar">
                <div class="benchmark-label" style="font-size:0.8rem;color:var(--blue)">${isPT ? 'Você' : 'Tú'}</div>
                <div class="benchmark-track"><div class="benchmark-fill user" style="width:${myPct}%"></div></div>
                <div class="benchmark-pct" style="color:var(--blue)">${myPct}%</div>
              </div>
              <div class="benchmark-bar">
                <div class="benchmark-label" style="font-size:0.8rem;color:${accentColor}">${isPT ? 'Média' : 'Promedio'}</div>
                <div class="benchmark-track"><div class="benchmark-fill" style="width:${avgPct}%;background:${accentColor}"></div></div>
                <div class="benchmark-pct" style="color:${accentColor}">${avgPct}%</div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  };

  if (hasBenchData && (mentalSc || techSc)) {
    html += renderBenchCard(
      isPT ? 'Benchmark Global 🧠 Mental' : 'Benchmark Global 🧠 Mental',
      isPT ? 'Seu nível vs. média da comunidade MindEV' : 'Tu nivel vs. promedio de la comunidad MindEV',
      '🏅', I18N.cats(), mentalSc, 'var(--accent)'
    );
    html += renderBenchCard(
      isPT ? 'Benchmark Global ⚙️ Técnico' : 'Benchmark Global ⚙️ Técnico',
      isPT ? 'Seu conhecimento de Texas Hold\'em vs. média da comunidade MindEV' : 'Tu conocimiento de Texas Hold\'em vs. promedio de la comunidad MindEV',
      '🏅', I18N.techCats(), techSc, '#4db6ac'
    );
    if (!mentalSc) {
      html += `<div class="alert alert-info" style="margin-bottom:12px">${isPT ? 'Complete o teste mental para ver seu benchmark mental.' : 'Completa el test mental para ver tu benchmark mental.'}</div>`;
    }
    if (!techSc) {
      html += `<div class="alert alert-info">${isPT ? 'Complete o teste técnico para ver seu benchmark técnico.' : 'Completa el test técnico para ver tu benchmark técnico.'}</div>`;
    }
  } else {
    html += `<div class="alert alert-info">${isPT ? 'O benchmark estará disponível quando mais jogadores completarem o diagnóstico.' : 'El benchmark estará disponible cuando más jugadores completen el diagnóstico.'}</div>`;
  }
  html += `</div>`;

  document.getElementById('dashboard-content').innerHTML = html;

  // ─── Dibujar radares ──────────────────────────────────────────────────────
  setTimeout(() => {
    if (hasBoth && mentalSc) {
      drawDashRadar('dash-radar-mental', I18N.cats(),     mentalSc, 'rgba(212,175,55,0.9)', 'rgba(212,175,55,0.12)');
      drawDashRadar('dash-radar-tech',   I18N.techCats(), techSc,   'rgba(77,182,172,0.9)', 'rgba(77,182,172,0.12)');
    }
    if (!hasBoth && mentalSc)  drawDashRadar('dash-radar-mental-solo', I18N.cats(),     mentalSc, 'rgba(212,175,55,0.9)', 'rgba(212,175,55,0.12)');
    if (!hasBoth && techSc)    drawDashRadar('dash-radar-tech-solo',   I18N.techCats(), techSc,   'rgba(77,182,172,0.9)', 'rgba(77,182,172,0.12)');
  }, 150);
}

function renderTestTab(catData, overall, level, sessionId, canvasId, user, testType) {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
      <div class="card">
        <div class="card-header"><span class="card-icon">📡</span><div><h2>Radar</h2><div class="card-sub" style="color:${testType === 'technical' ? '#4DB6AC' : 'var(--accent)'}">${overall}% · ${level.label}</div></div></div>
        <canvas id="${canvasId}" style="max-height:280px"></canvas>
      </div>
      <div>
        <div class="category-scores" style="grid-template-columns:1fr">
          ${catData.sort((a, b) => a.pct - b.pct).map(c => {
            const color = c.pct >= 80 ? '#22c55e' : c.pct >= 60 ? '#f59e0b' : c.pct >= 40 ? '#f97316' : '#ef4444';
            return `
              <div class="cat-score-card" style="padding:10px 14px">
                <div class="cat-score-header">
                  <div class="cat-score-name" style="font-size:0.85rem">${c.icon} ${c.label}</div>
                  <div class="cat-score-pct" style="color:${color}">${c.pct}%</div>
                </div>
                <div class="cat-score-bar"><div class="cat-score-fill" style="width:${c.pct}%;background:${color}"></div></div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="App.go('results', ${sessionId})">Ver informe completo →</button>
    </div>`;
}

function drawDashRadar(canvasId, categories, scores, borderColor, bgColor) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  // Destruir gráfico existente antes de crear uno nuevo (evita "Canvas already in use")
  const existing = Chart.getChart(ctx);
  if (existing) existing.destroy();
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: categories.map(c => c.label),
      datasets: [{
        label: 'Tu nivel',
        data: categories.map(c => scores[c.key] || 0),
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: 2,
        pointBackgroundColor: categories.map(c =>
          (scores[c.key] || 0) >= 80 ? '#22c55e' : (scores[c.key] || 0) >= 60 ? '#f59e0b' : '#ef4444'
        ),
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { stepSize: 20, color: '#64748b', font: { size: 9 }, backdropColor: 'transparent' },
          grid: { color: 'rgba(255,255,255,0.07)' },
          angleLines: { color: 'rgba(255,255,255,0.07)' },
          pointLabels: { color: '#94a3b8', font: { size: 9 } },
        },
      },
    },
  });
}

function drawComparisonRadar(canvasId, categories, prevScores, currScores, accentColor) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const existing = Chart.getChart(ctx);
  if (existing) existing.destroy();
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: categories.map(c => c.label),
      datasets: [
        {
          label: 'Anterior',
          data: categories.map(c => prevScores[c.key] || 0),
          backgroundColor: 'rgba(30,41,59,0.5)',
          borderColor: '#334155',
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 2,
          pointBackgroundColor: '#475569',
        },
        {
          label: 'Ahora',
          data: categories.map(c => currScores[c.key] || 0),
          backgroundColor: accentColor === '#d4af37' ? 'rgba(212,175,55,0.12)' : 'rgba(77,182,172,0.12)',
          borderColor: accentColor,
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: accentColor,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { stepSize: 25, color: '#64748b', font: { size: 9 }, backdropColor: 'transparent' },
          grid: { color: 'rgba(255,255,255,0.07)' },
          angleLines: { color: 'rgba(255,255,255,0.07)' },
          pointLabels: { color: '#94a3b8', font: { size: 9 } },
        },
      },
    },
  });
}

function dashTab(tab) {
  ['combined','mental','technical','evolution','profile','tournament','history','benchmark'].forEach(t => {
    const el  = document.getElementById(`dtab-${t}`);
    const btn = document.querySelector(`[onclick="dashTab('${t}')"]`);
    if (el)  el.style.display  = t === tab ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', t === tab);
  });
  // Al abrir el tab de perfil, cargar el perfil guardado si existe
  if (tab === 'profile')    loadSavedProfile();
  // Al abrir el tab de torneo, cargar el último análisis guardado si existe
  if (tab === 'tournament') loadLastTournament();

  // Dibujar radares de tabs individuales al hacerlos visibles
  // (cuando hasBoth=true, los radares solo se habían dibujado para el tab combinado)
  setTimeout(() => {
    if (tab === 'mental' && _dashMentalSc) {
      drawDashRadar('dash-radar-mental-solo', I18N.cats(), _dashMentalSc,
        'rgba(212,175,55,0.9)', 'rgba(212,175,55,0.12)');
    }
    if (tab === 'technical' && _dashTechSc) {
      drawDashRadar('dash-radar-tech-solo', I18N.techCats(), _dashTechSc,
        'rgba(77,182,172,0.9)', 'rgba(77,182,172,0.12)');
    }
    if (tab === 'combined') {
      if (_dashMentalSc) drawDashRadar('dash-radar-mental', I18N.cats(),     _dashMentalSc,
        'rgba(212,175,55,0.9)', 'rgba(212,175,55,0.12)');
      if (_dashTechSc)   drawDashRadar('dash-radar-tech',   I18N.techCats(), _dashTechSc,
        'rgba(77,182,172,0.9)', 'rgba(77,182,172,0.12)');
    }
    if (tab === 'evolution' && _evoData) {
      if (_evoData.mental)    drawComparisonRadar('evo-radar-mental',    I18N.cats(),     _evoData.mental.prev,    _evoData.mental.curr,    '#d4af37');
      if (_evoData.technical) drawComparisonRadar('evo-radar-technical', I18N.techCats(), _evoData.technical.prev, _evoData.technical.curr, '#4DB6AC');
    }
  }, 100);
}

// ─── Perfil IA ────────────────────────────────────────────────────────────────

let _profileAlreadyLoaded  = false;
let _tournamentAlreadyLoaded = false;

// Scores globales para dibujar radares al cambiar de tab
let _dashMentalSc  = null;
let _dashTechSc    = null;
let _dashHasBoth   = false;
let _evoData       = null;  // { mental:{prev,curr}, technical:{prev,curr} }

async function loadSavedProfile() {
  if (_profileAlreadyLoaded) return;
  const contentEl = document.getElementById('profile-content');
  if (!contentEl) return;

  try {
    const res = await Api.get('/api/profile/get');
    if (res.profile) {
      _profileAlreadyLoaded = true;
      const u  = Api.currentUser();
      const nombre = u ? u.nombre : 'Jugador';
      const dt = new Date(res.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      contentEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(212,175,55,0.08);border-radius:8px;border:1px solid rgba(212,175,55,0.2);flex:1;min-width:220px">
            <span style="font-size:1.2rem">📅</span>
            <span style="font-size:0.85rem;color:var(--text2)">Perfil generado el <strong>${dt}</strong>. Regenerá si completaste nuevos tests.</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="downloadProfilePDF('${nombre.replace(/'/g,"\\'")}')">📄 Descargar PDF</button>
        </div>
        <div id="profile-ia-output">${res.profile}</div>`;
    }
  } catch (e) {
    // Sin perfil guardado — no mostrar error, el botón ya está visible
  }
}

function _showProfileResult(contentEl, profileHtml, isPT) {
  _profileAlreadyLoaded = true;
  const _u = Api.currentUser();
  const _nombre = _u ? _u.nombre : (isPT ? 'Jogador' : 'Jugador');
  const now = new Date().toLocaleDateString(isPT ? 'pt-BR' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  contentEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(34,197,94,0.08);border-radius:8px;border:1px solid rgba(34,197,94,0.2);flex:1;min-width:220px">
        <span style="font-size:1.2rem">✅</span>
        <span style="font-size:0.85rem;color:var(--text2)">${isPT ? 'Perfil gerado em' : 'Perfil generado el'} <strong>${now}</strong>.</span>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="downloadProfilePDF('${_nombre.replace(/'/g,"\\'")}')">📄 ${isPT ? 'Baixar PDF' : 'Descargar PDF'}</button>
    </div>
    <div id="profile-ia-output">${profileHtml}</div>`;
}

async function generateProfile(mentalSessionId, technicalSessionId) {
  const btn = document.getElementById('profile-gen-btn');
  const contentEl = document.getElementById('profile-content');
  if (!btn || !contentEl) return;

  const _isPT = I18N.isPT();
  btn.disabled = true;
  btn.textContent = _isPT ? '⏳ Analisando seu perfil...' : '⏳ Analizando tu perfil...';

  contentEl.innerHTML = `
    <div style="text-align:center;padding:48px 20px">
      <div class="spinner" style="margin:0 auto 20px"></div>
      <p style="color:var(--text2);font-size:1rem">${_isPT ? 'A IA está analisando suas respostas e correlações...' : 'La IA está analizando tus respuestas y correlaciones...'}</p>
      <p style="color:var(--text3);font-size:0.85rem;margin-top:8px">${_isPT ? 'Isso pode demorar alguns minutos. Pode fechar esta aba — o resultado ficará salvo.' : 'Esto puede tomar varios minutos. Puedes cerrar esta pestaña — el resultado quedará guardado.'}</p>
    </div>`;

  try {
    const [mentalData, techData] = await Promise.all([
      mentalSessionId ? Api.get(`/api/test/results/${mentalSessionId}`).catch(() => null) : Promise.resolve(null),
      technicalSessionId ? Api.get(`/api/test/results/${technicalSessionId}`).catch(() => null) : Promise.resolve(null),
    ]);

    const mentalAnswers   = mentalData  ? _enrichAnswers(mentalData.answers_json  || mentalData.answers  || {}, I18N.cats()) : [];
    const techAnswers     = techData    ? _enrichAnswers(techData.answers_json    || techData.answers    || {}, I18N.techCats()) : [];
    const mentalScores    = mentalData  ? (mentalData.scores || {}) : {};
    const techScores      = techData    ? (techData.scores   || {}) : {};
    const inconsistencies = _detectInconsistencies(mentalScores, techScores);

    // Inicia el job en background — el servidor responde inmediatamente con job_id
    const res = await Api.post('/api/profile/generate', {
      mental_answers: mentalAnswers,
      technical_answers: techAnswers,
      mental_scores: mentalScores,
      technical_scores: techScores,
      inconsistencies,
      mental_session_id: mentalSessionId,
      technical_session_id: technicalSessionId,
      lang: I18N.lang,
    });

    const jobId = res.job_id;

    // Polling cada 4 segundos hasta que termine
    const poll = async () => {
      try {
        const st = await Api.get(`/api/profile/status/${jobId}`);
        if (st.status === 'done') {
          _showProfileResult(contentEl, st.profile, _isPT);
          btn.disabled = false;
          btn.textContent = `✨ ${_isPT ? 'Regenerar perfil' : 'Regenerar perfil'}`;
        } else if (st.status === 'error') {
          contentEl.innerHTML = `<div class="form-error" style="margin:16px 0">${_isPT ? 'Erro ao gerar o perfil' : 'Error al generar el perfil'}: ${st.error}</div>`;
          btn.disabled = false;
          btn.textContent = `✨ ${_isPT ? 'Regenerar perfil' : 'Regenerar perfil'}`;
        } else {
          setTimeout(poll, 4000);
        }
      } catch (pollErr) {
        setTimeout(poll, 5000);
      }
    };
    setTimeout(poll, 4000);
    return; // no ejecutar el finally con re-enable del botón aún

  } catch (e) {
    contentEl.innerHTML = `<div class="form-error" style="margin:16px 0">${_isPT ? 'Erro ao gerar o perfil' : 'Error al generar el perfil'}: ${e.message}</div>`;
    btn.disabled = false;
    btn.textContent = `✨ ${_isPT ? 'Regenerar perfil' : 'Regenerar perfil'}`;
  }
}

// Enriquece las respuestas con el texto de pregunta y respuesta
function _enrichAnswers(answersRaw, categories) {
  const answers = typeof answersRaw === 'string' ? JSON.parse(answersRaw) : answersRaw;
  const result = [];
  for (const cat of categories) {
    for (const q of cat.questions) {
      const val = answers[String(q.id)] ?? answers[q.id];
      if (val === undefined) continue;
      const opt = q.options.find(o => o.value === val);
      result.push({
        category: cat.label,
        question: q.text,
        answer: opt ? opt.label : val,
        points: opt ? opt.points : 0,
        maxPoints: 10,
      });
    }
  }
  return result;
}

// Detecta incoherencias entre categorías de ambos tests
function _detectInconsistencies(mentalSc, techSc) {
  const issues = [];
  const hasMental = Object.keys(mentalSc).length > 0;
  const hasTech   = Object.keys(techSc).length  > 0;

  if (!hasMental || !hasTech) return issues;

  const techAvg   = getTechnicalOverallScore(techSc);
  const mentalAvg = getOverallScore(mentalSc);

  // 1. Dunning-Kruger: alta confianza mental + bajo conocimiento técnico
  const confKey = Object.keys(mentalSc).find(k => k.includes('confianz') || k.includes('autoconfi'));
  if (confKey && mentalSc[confKey] >= 70 && techAvg < 50) {
    issues.push({
      type: 'EXCESO DE CONFIANZA (Dunning-Kruger)',
      detail: `Autoconfianza mental alta (${mentalSc[confKey]}%) vs conocimiento técnico verificado bajo (${techAvg.toFixed(0)}%). El jugador puede sobreestimar su nivel real.`
    });
  }

  // 2. Brecha tilt vs control emocional
  const tiltKey    = Object.keys(mentalSc).find(k => k.includes('tilt'));
  const emocKey    = Object.keys(mentalSc).find(k => k.includes('emoc') || k.includes('toleranc'));
  if (tiltKey && emocKey) {
    const diff = Math.abs(mentalSc[tiltKey] - mentalSc[emocKey]);
    if (diff > 25) {
      issues.push({
        type: 'PARADOJA TILT vs CONTROL EMOCIONAL',
        detail: `Gestión del Tilt (${mentalSc[tiltKey]}%) y Control Emocional (${mentalSc[emocKey]}%) difieren en ${diff.toFixed(0)} puntos. Estas habilidades suelen estar fuertemente correlacionadas.`
      });
    }
  }

  // 3. Imbalance general mental vs técnico
  if (mentalAvg > 68 && techAvg < 42) {
    issues.push({
      type: 'IMBALANCE MENTAL-TÉCNICO',
      detail: `Perfil mental sólido (${mentalAvg.toFixed(0)}%) con conocimiento técnico marcadamente inferior (${techAvg.toFixed(0)}%). El potencial mental no se apoya en bases técnicas suficientes.`
    });
  } else if (techAvg > 68 && mentalAvg < 42) {
    issues.push({
      type: 'IMBALANCE TÉCNICO-MENTAL',
      detail: `Conocimiento técnico sólido (${techAvg.toFixed(0)}%) con habilidades mentales por debajo (${mentalAvg.toFixed(0)}%). Las decisiones técnicas se ven limitadas por la gestión emocional.`
    });
  }

  // 4. Disciplina alta pero bankroll o rangos preflop bajos
  const discKey = Object.keys(mentalSc).find(k => k.includes('disciplin'));
  const preflopScore = techSc['rangos_preflop'] || 0;
  if (discKey && mentalSc[discKey] >= 70 && preflopScore < 45) {
    issues.push({
      type: 'DISCIPLINA SIN FUNDAMENTO TÉCNICO',
      detail: `Alta disciplina mental (${mentalSc[discKey]}%) pero rangos preflop débiles (${preflopScore}%). La disciplina no compensa decisiones preflop técnicamente incorrectas.`
    });
  }

  // 5. Gap preflop vs postflop técnico
  const ipScore  = techSc['juego_ip']  || 0;
  const oopScore = techSc['juego_oop'] || 0;
  const postflopAvg = (ipScore + oopScore) / 2;
  if (preflopScore > 65 && postflopAvg < 40) {
    issues.push({
      type: 'GAP PREFLOP SÓLIDO vs POSTFLOP DÉBIL',
      detail: `Buen conocimiento preflop (${preflopScore}%) pero postflop significativamente por debajo (IP: ${ipScore}%, OOP: ${oopScore}%). La ventaja preflop se pierde en la ejecución postflop.`
    });
  }

  return issues;
}

// ─── Descargar perfil IA como PDF ─────────────────────────────────────────────

async function downloadProfilePDF(userName) {
  const profileEl = document.getElementById('profile-ia-output');
  if (!profileEl) {
    alert('Primero genera tu perfil con IA.');
    return;
  }

  // Mostrar feedback al usuario
  const btn = event && event.target ? event.target : null;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando PDF...'; }

  try {
    const { jsPDF } = window.jspdf;

    // Forzar visibilidad y fondo para captura
    const origBg = profileEl.style.background;
    profileEl.style.background = '#111827';

    const canvas = await html2canvas(profileEl, {
      scale: 1.5,
      backgroundColor: '#111827',
      useCORS: true,
      logging: false,
    });

    profileEl.style.background = origBg;

    const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW  = pdf.internal.pageSize.getWidth();
    const pageH  = pdf.internal.pageSize.getHeight();

    // ── Cabecera ──
    pdf.setFillColor(10, 14, 26);
    pdf.rect(0, 0, pageW, 32, 'F');
    pdf.setTextColor(212, 175, 55);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EVHAPO - Perfil como Jugador de Poker', pageW / 2, 13, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`${userName}   ·   ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageW / 2, 23, { align: 'center' });

    // ── Contenido paginado ──
    const imgRatio = (pageW - 20) / canvas.width;
    let yPos    = 36;
    let srcY    = 0;
    let remaining = canvas.height * imgRatio;

    while (remaining > 0) {
      const availH   = pageH - yPos - 10;
      const sliceH   = Math.min(remaining, availH);
      const srcSliceH = sliceH / imgRatio;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = srcSliceH;
      sliceCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcSliceH, 0, 0, canvas.width, srcSliceH);

      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 10, yPos, pageW - 20, sliceH);
      remaining -= sliceH;
      srcY      += srcSliceH;
      if (remaining > 0) { pdf.addPage(); yPos = 10; }
    }

    pdf.save(`EVHAPO_Perfil_${(userName || 'Jugador').replace(/\s+/g, '_')}.pdf`);
  } catch (err) {
    alert('Error al generar el PDF: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📄 Descargar PDF'; }
  }
}

// ─── Último análisis de torneo ────────────────────────────────────────────────

async function loadLastTournament() {
  if (_tournamentAlreadyLoaded) return;
  const resultEl = document.getElementById('tourn-result');
  if (!resultEl) return;

  try {
    const res = await Api.get('/api/tournament/last');
    if (!res.analysis || !res.analysis.report_html) return; // sin análisis guardado

    _tournamentAlreadyLoaded = true;
    const a   = res.analysis;
    const isPT = I18N.isPT();
    const dt  = new Date(a.created_at).toLocaleDateString(isPT ? 'pt-BR' : 'es-ES', { day:'numeric', month:'short', year:'numeric' });

    // Ocultar zona de upload y mostrar el último análisis directamente
    const uploadArea = document.getElementById('tourn-upload-area');
    const fileInfo   = document.getElementById('tourn-file-info');
    if (uploadArea) uploadArea.style.display = 'none';
    if (fileInfo)   fileInfo.style.display   = 'none';

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="alert alert-info" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span>📂 ${isPT ? 'Último análise gerado em' : 'Último análisis generado el'} <strong>${dt}</strong></span>
        <button class="btn btn-secondary btn-sm" onclick="tournClearFile();loadLastTournament._shown=false;document.getElementById('tourn-upload-area').style.display='block'">
          ${isPT ? '+ Analisar novas mãos' : '+ Analizar nuevas manos'}
        </button>
      </div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <span class="card-icon">🏆</span>
          <div>
            <h2 style="margin:0">${a.tournament_name || (isPT ? 'Análise de Mãos' : 'Análisis de Manos')}</h2>
            <div class="card-sub">${a.platform || ''} · ${(a.date || '').slice(0,10)} · Buy-in: ${a.buy_in || 'N/D'}</div>
          </div>
          <div style="margin-left:auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <span style="background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.3);color:#d4af37;padding:6px 14px;border-radius:6px;font-size:0.82rem">
              🃏 ${a.total_hands || 0} ${isPT ? 'mãos totais' : 'manos totales'} · ${a.hero_hands || 0} ${isPT ? 'jogadas' : 'jugadas'}
            </span>
            <button class="btn btn-primary btn-sm" onclick="tournDownloadPDF()">📄 ${isPT ? 'Baixar PDF' : 'Descargar PDF'}</button>
          </div>
        </div>
        <div id="tourn-report-content">${a.report_html}</div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" onclick="
          _tournamentAlreadyLoaded=false;
          document.getElementById('tourn-result').style.display='none';
          document.getElementById('tourn-upload-area').style.display='block';
        ">🔄 ${isPT ? 'Analisar outras mãos' : 'Analizar otras manos'}</button>
        <button class="btn btn-primary btn-sm" onclick="tournDownloadPDF()">📄 ${isPT ? 'Baixar PDF' : 'Descargar PDF'}</button>
      </div>`;
  } catch (e) {
    // Sin análisis guardado — no mostrar error, el formulario de upload ya está visible
  }
}


async function startNewTest(testType = 'mental') {
  if (!Api.isLoggedIn()) { App.go('login'); return; }
  try {
    const result = await Api.post('/api/test/new-session', { test_type: testType });
    if (result.session_id) {
      localStorage.setItem('evhapo_session', result.session_id);
      localStorage.setItem('evhapo_test_type', testType);
      App.go('test');
    }
  } catch (e) {
    if (e.message && e.message.includes('402')) {
      App.go('payment');
    } else if (e.status === 402) {
      App.go('payment');
    } else {
      App.go('payment');
    }
  }
}
