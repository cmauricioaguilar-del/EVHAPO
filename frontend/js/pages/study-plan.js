// ─── Plan de Estudio IA ───────────────────────────────────────────────────────

let _studyPlanPollTimer = null;

async function renderStudyPlan() {
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:860px;margin:32px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap">
        <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
        <h2 style="margin:0;color:var(--accent)">📚 ${isEN ? 'Personalised Study Plan' : isPT ? 'Plano de Estudo Personalizado' : 'Plan de Estudio Personalizado'}</h2>
      </div>
      <div id="sp-content">
        <div style="text-align:center;padding:60px"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>`;

  // Intentar cargar plan guardado primero
  try {
    const saved = await Api.get('/api/study-plan/get');
    if (saved.plan) {
      renderStudyPlanSaved(saved);
    } else {
      renderStudyPlanEmpty();
    }
  } catch (e) {
    renderStudyPlanEmpty();
  }
}

function renderStudyPlanEmpty() {
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  document.getElementById('sp-content').innerHTML = `
    <div class="card" style="text-align:center;padding:48px 32px">
      <div style="font-size:3.5rem;margin-bottom:16px">📚</div>
      <h2 style="margin:0 0 12px;color:var(--text1)">${isEN ? 'Your AI Study Plan' : isPT ? 'Seu Plano de Estudo com IA' : 'Tu Plan de Estudio con IA'}</h2>
      <p style="color:var(--text2);max-width:480px;margin:0 auto 8px;line-height:1.7">
        ${isEN
          ? 'The AI analyses your diagnosis results and generates a 4-week plan with specific daily tasks targeting your weakest areas.'
          : isPT
          ? 'A IA analisa seus resultados do diagnóstico e gera um plano de 4 semanas com tarefas diárias específicas para suas áreas mais fracas.'
          : 'La IA analiza tus resultados del diagnóstico y genera un plan de 4 semanas con tareas diarias específicas para tus áreas más débiles.'}
      </p>
      <p style="color:var(--text3);font-size:0.85rem;margin:0 0 28px">
        ${isEN ? '⏱ Takes about 30 seconds · Saved automatically' : isPT ? '⏱ Demora cerca de 30 segundos · Salvo automaticamente' : '⏱ Tarda unos 30 segundos · Se guarda automáticamente'}
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn btn-primary" id="sp-gen-btn" onclick="startStudyPlanGeneration()" style="font-size:1rem;padding:14px 32px">
          ✨ ${isEN ? 'Generate my AI plan' : isPT ? 'Gerar meu plano com IA' : 'Generar mi plan con IA'}
        </button>
      </div>
      <div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:8px;padding:12px 16px;max-width:480px;margin:0 auto;font-size:0.82rem;color:var(--text3)">
        💡 ${isEN ? 'You need to have completed at least one test (Mental or Technical)' : isPT ? 'Necessário ter completado pelo menos um teste (Mental ou Técnico)' : 'Necesitas haber completado al menos un test (Mental o Técnico)'}
      </div>
    </div>`;
}

function renderStudyPlanSaved(saved) {
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  const dateLocale = isEN ? 'en-GB' : isPT ? 'pt-BR' : 'es-ES';
  const date = saved.created_at ? new Date(saved.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const mentalBadge   = saved.mental_overall   != null ? `🧠 ${saved.mental_overall}%` : '';
  const technicalBadge = saved.technical_overall != null ? `⚙️ ${saved.technical_overall}%` : '';

  document.getElementById('sp-content').innerHTML = `
    <!-- Header con badges y regenerar -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;flex-wrap:wrap;gap:12px">
      <div style="flex:1;min-width:200px">
        <div style="font-size:0.78rem;color:var(--text3);margin-bottom:4px">${isEN ? 'Plan generated on' : isPT ? 'Plano gerado em' : 'Plan generado el'} ${date}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${mentalBadge   ? `<span style="background:rgba(212,175,55,0.12);color:var(--accent);padding:3px 10px;border-radius:20px;font-size:0.82rem;font-weight:600">${mentalBadge}</span>` : ''}
          ${technicalBadge ? `<span style="background:rgba(77,182,172,0.12);color:#4DB6AC;padding:3px 10px;border-radius:20px;font-size:0.82rem;font-weight:600">${technicalBadge}</span>` : ''}
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="sp-gen-btn" onclick="startStudyPlanGeneration()">
        🔄 ${isEN ? 'Regenerate plan' : isPT ? 'Regenerar plano' : 'Regenerar plan'}
      </button>
    </div>

    <!-- Contenido del plan -->
    <div id="sp-plan-body">${saved.plan}</div>`;
}

async function startStudyPlanGeneration() {
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  const btn = document.getElementById('sp-gen-btn');
  if (btn) { btn.disabled = true; btn.textContent = `⏳ ${isEN ? 'Generating...' : isPT ? 'Gerando...' : 'Generando...'}`; }

  // Mostrar loading
  const spBody = document.getElementById('sp-plan-body');
  const spContent = document.getElementById('sp-content');
  const target = spBody || spContent;
  if (target) target.innerHTML = renderStudyPlanLoading(isEN, isPT);

  try {
    const res = await Api.post('/api/study-plan/generate', { lang: I18N.lang });
    if (res.job_id) pollStudyPlan(res.job_id);
  } catch (e) {
    if (target) target.innerHTML = `<div class="form-error" style="margin-top:16px">❌ ${e.message}</div>`;
    if (btn) { btn.disabled = false; btn.textContent = `✨ ${isEN ? 'Generate plan' : isPT ? 'Gerar plano' : 'Generar plan'}`; }
  }
}

function renderStudyPlanLoading(isEN, isPT) {
  const msgs = isEN
    ? ['Analysing your results...', 'Identifying priority areas...', 'Structuring 4 weeks of study...', 'Preparing daily tasks...']
    : isPT
    ? ['Analisando seus resultados...', 'Identificando áreas prioritárias...', 'Estruturando 4 semanas de estudo...', 'Preparando tarefas diárias...']
    : ['Analizando tus resultados...', 'Identificando áreas prioritarias...', 'Estructurando 4 semanas de estudio...', 'Preparando tareas diarias...'];
  let i = 0;
  if (_studyPlanPollTimer) clearInterval(_studyPlanPollTimer);
  let msgEl = null;
  setTimeout(() => {
    msgEl = document.getElementById('sp-loading-msg');
    if (!msgEl) return;
    setInterval(() => {
      i = (i + 1) % msgs.length;
      if (msgEl) msgEl.textContent = msgs[i];
    }, 4000);
  }, 100);

  return `
    <div style="text-align:center;padding:60px 32px" id="sp-loading-wrapper">
      <div class="spinner" style="margin:0 auto 24px;width:48px;height:48px;border-width:4px"></div>
      <p id="sp-loading-msg" style="color:var(--text2);font-size:0.95rem">${msgs[0]}</p>
      <p style="color:var(--text3);font-size:0.82rem;margin-top:8px">⏱ ${isEN ? 'This takes about 30 seconds' : isPT ? 'Isso leva cerca de 30 segundos' : 'Esto tarda unos 30 segundos'}</p>
    </div>`;
}

function pollStudyPlan(jobId) {
  if (_studyPlanPollTimer) clearTimeout(_studyPlanPollTimer);
  const poll = async () => {
    try {
      const res = await Api.get(`/api/study-plan/status/${jobId}`);
      if (res.status === 'done') {
        renderStudyPlanSaved(res);
        return;
      } else if (res.status === 'error') {
        const t = document.getElementById('sp-loading-wrapper') || document.getElementById('sp-content');
        const _errMsg = (typeof I18N !== 'undefined' && I18N.isEN()) ? 'Error generating the plan' : (typeof I18N !== 'undefined' && I18N.isPT()) ? 'Erro ao gerar o plano' : 'Error al generar el plan';
        if (t) t.innerHTML = `<div class="form-error">❌ ${res.error || _errMsg}</div>`;
        return;
      }
      _studyPlanPollTimer = setTimeout(poll, 3000);
    } catch (e) {
      _studyPlanPollTimer = setTimeout(poll, 5000);
    }
  };
  poll();
}
