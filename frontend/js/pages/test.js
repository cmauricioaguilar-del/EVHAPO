let _testState = {
  catIdx: 0,
  answers: {},
  sessionId: null,
  testType: 'mental',
  categories: null,
};

function renderTest() {
  if (!Api.isLoggedIn()) { App.go('login', I18N.isEN() ? 'Sign in to continue' : I18N.isPT() ? 'Entre para continuar' : 'Inicia sesión para continuar'); return; }
  const sid = localStorage.getItem('evhapo_session');
  if (!sid) { App.go('payment'); return; }
  const testType = localStorage.getItem('evhapo_test_type') || 'mental';
  _testState.sessionId = parseInt(sid);
  _testState.catIdx = 0;
  _testState.answers = {};
  _testState.testType = testType;
  _testState.categories = I18N.catsForType(testType);
  renderTestSection();
}

function renderTestSection() {
  const { catIdx, answers } = _testState;
  const cat = _testState.categories[catIdx];
  const totalQ = _testState.categories.reduce((s, c) => s + c.questions.length, 0);
  const answeredSoFar = Object.keys(answers).length;
  const pct = Math.round((answeredSoFar / totalQ) * 100);

  const isPT = I18N.isPT();
  const isEN = I18N.isEN();
  let questionsHtml = cat.questions.map((q, qi) => {
    const ans = answers[q.id];
    return `
      <div class="question-card ${ans ? 'answered' : ''}" id="qcard-${q.id}">
        <div class="question-num">${isEN ? 'Question' : isPT ? 'Pergunta' : 'Pregunta'} ${qi + 1} ${isEN ? 'of' : isPT ? 'de' : 'de'} ${cat.questions.length}</div>
        <div class="question-text">${q.text}</div>
        <div class="options-grid">
          ${q.options.map(opt => `
            <button class="option-btn ${ans === opt.value ? 'selected' : ''}"
              onclick="selectAnswer(${q.id}, '${opt.value}', this)">
              <span class="opt-dot"></span>
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>`;
  }).join('');

  const isLast = catIdx === _testState.categories.length - 1;
  const catAnswered = cat.questions.filter(q => answers[q.id] !== undefined).length;
  const catTotal = cat.questions.length;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="navbar">
      <div class="nav-brand" onclick="App.go('dashboard')">
        <img src="/icons/mindev-logo.png" alt="MindEV" class="nav-logo">
      </div>
      <div style="color:var(--text2);font-size:0.875rem">
        ${answeredSoFar} ${isEN ? 'of' : isPT ? 'de' : 'de'} ${totalQ} ${isEN ? 'questions answered' : isPT ? 'perguntas respondidas' : 'preguntas respondidas'}
      </div>
    </div>

    <div class="test-header">
      <div class="test-meta">
        <div class="test-category">${cat.icon} ${cat.label}</div>
        <div class="test-counter">${isEN ? 'Section' : isPT ? 'Seção' : 'Sección'} ${catIdx + 1} ${isEN ? 'of' : isPT ? 'de' : 'de'} ${_testState.categories.length} · ${catAnswered}/${catTotal} ${isEN ? 'answered' : isPT ? 'respondidas' : 'respondidas'}</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
    </div>

    <div class="test-body">
      <div class="section-intro">
        <h2>${cat.icon} ${cat.label}</h2>
        <p>${cat.description}</p>
      </div>
      <div id="questions-container">
        ${questionsHtml}
      </div>
      <div id="unanswered-warn"></div>
    </div>

    <div class="test-nav">
      <div>
        ${catIdx > 0
          ? `<button class="btn btn-secondary" onclick="navSection(-1)">← ${isEN ? 'Previous' : isPT ? 'Anterior' : 'Anterior'}</button>`
          : `<button class="btn btn-secondary" onclick="App.go('landing')">← ${isEN ? 'Exit' : isPT ? 'Sair' : 'Salir'}</button>`}
      </div>
      <div>
        <button class="btn btn-outline" onclick="confirmDashboard()" style="margin-right:8px">🏠 ${isEN ? 'My Dashboard' : isPT ? 'Meu Painel' : 'Mi Dashboard'}</button>
        ${isLast
          ? `<button class="btn btn-primary" id="submit-btn" onclick="submitTest()">✓ ${isEN ? 'See my results' : isPT ? 'Ver meus resultados' : 'Ver mis resultados'}</button>`
          : `<button class="btn btn-primary" onclick="navSection(1)">${isEN ? 'Next section →' : isPT ? 'Próxima seção →' : 'Siguiente sección →'}</button>`}
      </div>
    </div>`;
}

function selectAnswer(qid, value, btn) {
  _testState.answers[qid] = value;
  const card = document.getElementById(`qcard-${qid}`);
  card.classList.add('answered');
  card.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  // Update counters
  const totalQ = _testState.categories.reduce((s, c) => s + c.questions.length, 0);
  const answeredSoFar = Object.keys(_testState.answers).length;
  const pct = Math.round((answeredSoFar / totalQ) * 100);
  const fill = document.querySelector('.progress-fill');
  if (fill) fill.style.width = pct + '%';

  const cat = _testState.categories[_testState.catIdx];
  const catAnswered = cat.questions.filter(q => _testState.answers[q.id] !== undefined).length;
  const counter = document.querySelector('.test-counter');
  const _isPT = I18N.isPT();
  const _isEN = I18N.isEN();
  if (counter) counter.textContent = `${_isEN ? 'Section' : _isPT ? 'Seção' : 'Sección'} ${_testState.catIdx + 1} ${_isEN ? 'of' : _isPT ? 'de' : 'de'} ${_testState.categories.length} · ${catAnswered}/${cat.questions.length} ${_isEN ? 'answered' : _isPT ? 'respondidas' : 'respondidas'}`;

  const navbar = document.querySelector('.navbar div:last-child');
  if (navbar) navbar.textContent = `${answeredSoFar} ${_isEN ? 'of' : _isPT ? 'de' : 'de'} ${totalQ} ${_isEN ? 'questions answered' : _isPT ? 'perguntas respondidas' : 'preguntas respondidas'}`;
}

function navSection(dir) {
  const cat = _testState.categories[_testState.catIdx];
  const unanswered = cat.questions.filter(q => _testState.answers[q.id] === undefined);

  if (dir > 0 && unanswered.length > 0) {
    const w = document.getElementById('unanswered-warn');
    const _isPT2 = I18N.isPT();
    const _isEN2 = I18N.isEN();
    if (w) {
      w.innerHTML = `<div class="unanswered-warning">⚠️ ${_isEN2 ? `Please answer all questions in this section before continuing. ${unanswered.length} answer(s) remaining.` : _isPT2 ? `Por favor responda todas as perguntas desta seção antes de continuar. Faltam ${unanswered.length} resposta(s).` : `Por favor responde todas las preguntas de esta sección antes de continuar. Faltan ${unanswered.length} respuesta(s).`}</div>`;
      // Highlight unanswered
      unanswered.forEach(q => {
        const card = document.getElementById(`qcard-${q.id}`);
        if (card) { card.style.borderColor = 'var(--red)'; card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      });
    }
    return;
  }

  _testState.catIdx += dir;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderTestSection();
}

function confirmDashboard() {
  const answered = Object.keys(_testState.answers).length;
  const total = _testState.categories.reduce((s, c) => s + c.questions.length, 0);
  const _isPT3 = I18N.isPT();
  const _isEN3 = I18N.isEN();
  if (answered > 0 && answered < total) {
    const msg = _isEN3
      ? `Exit to dashboard? You will lose your progress (${answered} of ${total} questions answered).`
      : _isPT3
      ? `Sair para o painel? Você perderá seu progresso (${answered} de ${total} perguntas respondidas).`
      : `¿Salir al dashboard? Perderás tu progreso (${answered} de ${total} preguntas respondidas).`;
    if (!confirm(msg)) return;
  }
  App.go('dashboard');
}

async function submitTest() {
  const _isPT5 = I18N.isPT();
  const _isEN5 = I18N.isEN();

  const allQ = _testState.categories.flatMap(c => c.questions);
  const unanswered = allQ.filter(q => _testState.answers[q.id] === undefined);

  if (unanswered.length > 0) {
    for (let i = 0; i < _testState.categories.length; i++) {
      const cat = _testState.categories[i];
      if (cat.questions.some(q => _testState.answers[q.id] === undefined)) {
        _testState.catIdx = i;
        renderTestSection();
        setTimeout(() => {
          const w = document.getElementById('unanswered-warn');
          if (w) w.innerHTML = `<div class="unanswered-warning">⚠️ ${_isEN5 ? `${unanswered.length} unanswered question(s) remaining in the full test.` : _isPT5 ? `Faltam ${unanswered.length} perguntas por responder no teste completo.` : `Faltan ${unanswered.length} preguntas por responder en el test completo.`}</div>`;
        }, 100);
        return;
      }
    }
  }

  const btn = document.getElementById('submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = _isEN5 ? 'Calculating results...' : _isPT5 ? 'Calculando resultados...' : 'Calculando resultados...'; }

  try {
    const result = await Api.submitTest(_testState.sessionId, _testState.answers);
    localStorage.setItem('evhapo_result', JSON.stringify(result));
    localStorage.setItem('evhapo_session', _testState.sessionId);
    App.go('results', _testState.sessionId);
  } catch (e) {
    alert((_isEN5 ? 'Error submitting: ' : _isPT5 ? 'Erro ao enviar: ' : 'Error al enviar: ') + e.message);
    if (btn) { btn.disabled = false; btn.textContent = `✓ ${_isEN5 ? 'See my results' : _isPT5 ? 'Ver meus resultados' : 'Ver mis resultados'}`; }
  }
}
