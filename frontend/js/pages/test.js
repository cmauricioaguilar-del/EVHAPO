let _testState = {
  catIdx: 0,
  answers: {},
  sessionId: null,
};

function renderTest() {
  if (!Api.isLoggedIn()) { App.go('login', 'Inicia sesión para continuar'); return; }
  const sid = localStorage.getItem('evhapo_session');
  if (!sid) { App.go('payment'); return; }
  _testState.sessionId = parseInt(sid);
  _testState.catIdx = 0;
  _testState.answers = {};
  renderTestSection();
}

function renderTestSection() {
  const { catIdx, answers } = _testState;
  const cat = EVHAPO_CATEGORIES[catIdx];
  const totalQ = EVHAPO_CATEGORIES.reduce((s, c) => s + c.questions.length, 0);
  const answeredSoFar = Object.keys(answers).length;
  const pct = Math.round((answeredSoFar / totalQ) * 100);

  let questionsHtml = cat.questions.map((q, qi) => {
    const ans = answers[q.id];
    return `
      <div class="question-card ${ans ? 'answered' : ''}" id="qcard-${q.id}">
        <div class="question-num">Pregunta ${qi + 1} de ${cat.questions.length}</div>
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

  const isLast = catIdx === EVHAPO_CATEGORIES.length - 1;
  const catAnswered = cat.questions.filter(q => answers[q.id] !== undefined).length;
  const catTotal = cat.questions.length;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="navbar">
      <div class="nav-brand" onclick="App.go('dashboard')">
        <span class="suits">♠♦</span>
        <span class="name">EVHAPO</span>
      </div>
      <div style="color:var(--text2);font-size:0.875rem">
        ${answeredSoFar} de ${totalQ} preguntas respondidas
      </div>
    </div>

    <div class="test-header">
      <div class="test-meta">
        <div class="test-category">${cat.icon} ${cat.label}</div>
        <div class="test-counter">Sección ${catIdx + 1} de ${EVHAPO_CATEGORIES.length} · ${catAnswered}/${catTotal} respondidas</div>
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
          ? `<button class="btn btn-secondary" onclick="navSection(-1)">← Anterior</button>`
          : `<button class="btn btn-secondary" onclick="App.go('landing')">← Salir</button>`}
      </div>
      <div class="test-nav-info">
        ${isLast
          ? `<strong style="color:var(--accent)">${catAnswered < catTotal ? catTotal - catAnswered + ' sin responder' : '¡Listo para enviar!'}</strong>`
          : `${catAnswered}/${catTotal} respondidas`}
      </div>
      <div>
        ${isLast
          ? `<button class="btn btn-primary" id="submit-btn" onclick="submitTest()">✓ Ver mis resultados</button>`
          : `<button class="btn btn-primary" onclick="navSection(1)">Siguiente sección →</button>`}
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
  const totalQ = EVHAPO_CATEGORIES.reduce((s, c) => s + c.questions.length, 0);
  const answeredSoFar = Object.keys(_testState.answers).length;
  const pct = Math.round((answeredSoFar / totalQ) * 100);
  const fill = document.querySelector('.progress-fill');
  if (fill) fill.style.width = pct + '%';

  const cat = EVHAPO_CATEGORIES[_testState.catIdx];
  const catAnswered = cat.questions.filter(q => _testState.answers[q.id] !== undefined).length;
  const counter = document.querySelector('.test-counter');
  if (counter) counter.textContent = `Sección ${_testState.catIdx + 1} de ${EVHAPO_CATEGORIES.length} · ${catAnswered}/${cat.questions.length} respondidas`;

  const navbar = document.querySelector('.navbar div:last-child');
  if (navbar) navbar.textContent = `${answeredSoFar} de ${totalQ} preguntas respondidas`;
}

function navSection(dir) {
  const cat = EVHAPO_CATEGORIES[_testState.catIdx];
  const unanswered = cat.questions.filter(q => _testState.answers[q.id] === undefined);

  if (dir > 0 && unanswered.length > 0) {
    const w = document.getElementById('unanswered-warn');
    if (w) {
      w.innerHTML = `<div class="unanswered-warning">⚠️ Por favor responde todas las preguntas de esta sección antes de continuar. Faltan ${unanswered.length} respuesta(s).</div>`;
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

async function submitTest() {
  const allQ = EVHAPO_CATEGORIES.flatMap(c => c.questions);
  const unanswered = allQ.filter(q => _testState.answers[q.id] === undefined);

  if (unanswered.length > 0) {
    // Find which section has unanswered
    for (let i = 0; i < EVHAPO_CATEGORIES.length; i++) {
      const cat = EVHAPO_CATEGORIES[i];
      if (cat.questions.some(q => _testState.answers[q.id] === undefined)) {
        _testState.catIdx = i;
        renderTestSection();
        setTimeout(() => {
          const w = document.getElementById('unanswered-warn');
          if (w) w.innerHTML = `<div class="unanswered-warning">⚠️ Faltan ${unanswered.length} preguntas por responder en el test completo.</div>`;
        }, 100);
        return;
      }
    }
  }

  const btn = document.getElementById('submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Calculando resultados...'; }

  try {
    const result = await Api.submitTest(_testState.sessionId, _testState.answers);
    localStorage.setItem('evhapo_result', JSON.stringify(result));
    localStorage.setItem('evhapo_session', _testState.sessionId);
    App.go('results', _testState.sessionId);
  } catch (e) {
    alert('Error al enviar: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = '✓ Ver mis resultados'; }
  }
}
