/**
 * MinDev+ Poker Hand Replayer
 * Reproductor animado paso a paso de manos de poker.
 */

// ── Constantes ────────────────────────────────────────────────────────────────
const _SUITS   = { s: '♠', h: '♥', d: '♦', c: '♣' };
const _COLORS  = { s: '#1e293b', h: '#dc2626', d: '#0284c7', c: '#15803d' };
const _ACTION_LABELS = {
  folds:   { label: 'FOLD',  color: '#64748b' },
  checks:  { label: 'CHECK', color: '#60a5fa' },
  calls:   { label: 'CALL',  color: '#34d399' },
  bets:    { label: 'BET',   color: '#f59e0b' },
  raises:  { label: 'RAISE', color: '#f59e0b' },
  'is all-in': { label: 'ALL-IN', color: '#ef4444' },
  shows:   { label: 'SHOW',  color: '#a78bfa' },
  show:    { label: 'SHOW',  color: '#a78bfa' },
  posts:   { label: 'POST',  color: '#475569' },
  collected: { label: 'WIN', color: '#22c55e' },
};

// ── Render de carta individual ────────────────────────────────────────────────
function _card(code, faceDown = false, small = false) {
  const sz = small ? 'phv-card-sm' : '';
  if (faceDown || !code) {
    return `<div class="phv-card phv-card-back ${sz}"></div>`;
  }
  const rank = code.slice(0, -1);
  const suit = code.slice(-1).toLowerCase();
  return `<div class="phv-card ${sz}" style="color:${_COLORS[suit]||'#c8d6e5'}">
    <div class="phv-card-rank">${rank}</div>
    <div class="phv-card-suit">${_SUITS[suit]||suit}</div>
  </div>`;
}

// ── Posiciones en la mesa (% sobre contenedor) ────────────────────────────────
function _seatPos(pos, n) {
  // Posiciones predefinidas para las posiciones más comunes
  const POS_ANGLES = {
    'BTN':190, 'SB':220, 'BB':250, 'UTG':300, 'UTG+1':330,
    'LJ':355,  'HJ':25,  'CO':55,  'MP':320,
  };
  const angle = (POS_ANGLES[pos] ?? (360 / n)) * Math.PI / 180;
  const rx = 41, ry = 36;
  return {
    left: (50 + rx * Math.sin(angle)).toFixed(1),
    top:  (50 - ry * Math.cos(angle)).toFixed(1),
  };
}

// ── CSS (inyectado una sola vez) ──────────────────────────────────────────────
function _injectCSS() {
  if (document.getElementById('phv-css')) return;
  const s = document.createElement('style');
  s.id = 'phv-css';
  s.textContent = `
/* ── Modal ── */
.phv-overlay {
  position:fixed;inset:0;z-index:9999;
  background:rgba(0,0,0,0.82);backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;padding:12px;
}
.phv-modal {
  background:#0f172a;border:1px solid rgba(212,175,55,0.25);
  border-radius:14px;width:100%;max-width:620px;
  box-shadow:0 32px 80px rgba(0,0,0,0.7);overflow:hidden;
  display:flex;flex-direction:column;max-height:96vh;
}
.phv-modal-head {
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.07);
  background:rgba(212,175,55,0.06);flex-shrink:0;
}
.phv-modal-title {
  color:#d4af37;font-weight:800;font-size:0.9rem;letter-spacing:0.03em;
}
.phv-modal-meta { color:#64748b;font-size:0.75rem;margin-top:2px; }
.phv-modal-close {
  background:none;border:none;color:#64748b;font-size:1.3rem;
  cursor:pointer;padding:4px 8px;line-height:1;
}
.phv-modal-close:hover{color:#e2e8f0;}

/* ── Mesa ── */
.phv-scene { flex-shrink:0; position:relative; width:100%; padding-bottom:56%; background:#0a0f1e; }
.phv-table-wrap { position:absolute;inset:10px; }
.phv-table-oval {
  position:absolute;left:7%;top:4%;width:86%;height:92%;
  background:radial-gradient(ellipse at 50% 40%, #1a5c35 0%, #145228 55%, #0d3d1e 100%);
  border-radius:50%;
  border:5px solid #7c4a03;
  box-shadow:0 0 0 8px #5c3602, inset 0 4px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.6);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
}
/* Texto del paño */
.phv-felt-brand {
  font-size:clamp(6rem,18vw,9.6rem);font-weight:900;letter-spacing:0.18em;
  color:rgba(255,255,255,0.07);text-transform:uppercase;pointer-events:none;
  position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);
  white-space:nowrap;
}
.phv-pot-area { text-align:center;z-index:1; }
.phv-pot-label { color:rgba(255,255,255,0.35);font-size:0.6rem;letter-spacing:0.1em; }
.phv-pot-value { color:#fbbf24;font-size:0.85rem;font-weight:800; }

/* Board */
.phv-board { display:flex;gap:5px;justify-content:center;z-index:1; }

/* ── Cartas ── */
.phv-card {
  display:inline-flex;flex-direction:column;align-items:center;justify-content:center;
  width:136px;height:192px;background:#f8fafc;
  border-radius:7px;border:1px solid rgba(0,0,0,0.12);
  box-shadow:0 2px 6px rgba(0,0,0,0.5);
  font-weight:800;line-height:1;transition:transform 0.2s;
}
.phv-card-sm { width:88px;height:128px; }
.phv-card-back {
  background:linear-gradient(135deg,#1e3a8a,#1e40af);
  border-color:#1e3a8a;
}
.phv-card-back::after {
  content:'';display:block;width:60%;height:70%;
  border:1px solid rgba(255,255,255,0.15);border-radius:2px;
}
.phv-card-rank { font-size:3rem; }
.phv-card-sm .phv-card-rank { font-size:2.2rem; }
.phv-card-suit { font-size:3.4rem;line-height:0.9; }
.phv-card-sm .phv-card-suit { font-size:2.4rem; }

/* Animación entrada de carta */
@keyframes phv-deal {
  from { transform:scale(0.4) translateY(-20px);opacity:0; }
  to   { transform:scale(1) translateY(0);opacity:1; }
}
.phv-card-anim { animation:phv-deal 0.25s ease-out; }

/* ── Asientos ── */
.phv-seat {
  position:absolute;transform:translate(-50%,-50%);
  display:flex;flex-direction:column;align-items:center;gap:2px;
  min-width:60px;
}
.phv-seat-cards { display:flex;gap:2px; }
.phv-seat-info {
  background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.08);
  border-radius:6px;padding:2px 7px;text-align:center;
  backdrop-filter:blur(4px);
}
.phv-seat-pos { font-size:0.6rem;font-weight:800;letter-spacing:0.06em;color:#94a3b8; }
.phv-seat-name { font-size:0.58rem;color:#64748b;max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.phv-seat-chips { font-size:0.55rem;color:#94a3b8; }
.phv-seat-hero .phv-seat-pos { color:#fbbf24; }
.phv-seat-hero .phv-seat-name { color:#fbbf24;font-weight:700; }

/* Badge de acción sobre el asiento */
.phv-action-badge {
  position:absolute;top:-18px;left:50%;transform:translateX(-50%);
  font-size:0.6rem;font-weight:800;padding:2px 7px;border-radius:4px;
  white-space:nowrap;pointer-events:none;letter-spacing:0.05em;
  animation:phv-badge-in 0.2s ease-out;
}
@keyframes phv-badge-in {
  from{opacity:0;transform:translateX(-50%) translateY(6px);}
  to{opacity:1;transform:translateX(-50%) translateY(0);}
}

/* Asiento inactivo (fold) */
.phv-seat-folded { opacity:0.35; }
.phv-seat-active { outline:2px solid #d4af37;border-radius:8px; }

/* ── Panel inferior ── */
.phv-bottom { flex:1;overflow-y:auto;display:flex;flex-direction:column; }

/* Street indicator */
.phv-street-bar {
  display:flex;gap:6px;padding:8px 14px;
  border-bottom:1px solid rgba(255,255,255,0.05);flex-shrink:0;
}
.phv-street-chip {
  padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;
  background:rgba(255,255,255,0.04);color:#475569;border:1px solid rgba(255,255,255,0.06);
  transition:all 0.2s;user-select:none;
}
.phv-street-chip:hover {
  background:rgba(255,255,255,0.1);color:#94a3b8;border-color:rgba(255,255,255,0.15);
}
.phv-street-chip.active {
  background:rgba(212,175,55,0.15);color:#d4af37;border-color:rgba(212,175,55,0.35);
}

/* Log de acciones */
.phv-log { flex:1;overflow-y:auto;padding:8px 14px;min-height:80px;max-height:130px; }
.phv-log-entry {
  display:flex;align-items:center;gap:8px;padding:4px 0;
  border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.78rem;
}
.phv-log-entry.current { background:rgba(212,175,55,0.06);border-radius:4px;padding:4px 6px; }
.phv-log-player { color:#e2e8f0;font-weight:600;min-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.phv-log-action { font-weight:800;font-size:0.7rem;padding:1px 7px;border-radius:3px;min-width:52px;text-align:center; }
.phv-log-amount { color:#94a3b8;font-size:0.72rem; }

/* Controles */
.phv-controls {
  display:flex;align-items:center;gap:8px;padding:10px 14px;
  border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0;flex-wrap:wrap;
}
.phv-btn {
  background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  color:#e2e8f0;border-radius:7px;padding:6px 14px;font-size:0.8rem;
  cursor:pointer;font-weight:600;transition:all 0.15s;
}
.phv-btn:hover:not(:disabled){background:rgba(255,255,255,0.12);}
.phv-btn:disabled{opacity:0.3;cursor:default;}
.phv-btn-play {
  background:rgba(212,175,55,0.15);border-color:rgba(212,175,55,0.35);
  color:#d4af37;padding:6px 20px;
}
.phv-btn-play:hover:not(:disabled){background:rgba(212,175,55,0.25);}
.phv-step-counter { color:#475569;font-size:0.75rem;margin-left:auto; }
.phv-speed {
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
  color:#94a3b8;border-radius:6px;padding:5px 8px;font-size:0.75rem;cursor:pointer;
}

/* ── Botón "Ver mano" ── */
.phv-btn-view {
  display:inline-flex;align-items:center;gap:5px;
  background:rgba(212,175,55,0.1);color:#d4af37;
  border:1px solid rgba(212,175,55,0.28);border-radius:6px;
  padding:4px 12px;font-size:0.78rem;font-weight:700;
  cursor:pointer;margin-top:8px;transition:background 0.2s;
}
.phv-btn-view:hover{background:rgba(212,175,55,0.2);}
`;
  document.head.appendChild(s);
}

// ── Estado del replayer ───────────────────────────────────────────────────────
let _state = null;

function _buildSteps(hand) {
  const steps = [];
  const sa    = hand.street_actions || {};

  // Quién está en la mesa (seat_map)
  const seats = Object.entries(hand.seat_map || {}).map(([n, info]) => ({
    seatNum: parseInt(n),
    name: info.name,
    pos:  info.position || '?',
    chips: info.chips || 0,
    isHero: info.name === 'Hero',
  }));

  // Paso 0: estado inicial (reparto de cartas)
  steps.push({ type: 'deal', seats, street: 'preflop', board: [], pot: 0 });

  // Blinds / antes del preflop
  let pot = 0;
  (sa.preflop || []).forEach(a => {
    if (a.action === 'posts') pot += (a.amount || 0);
  });

  // Acciones preflop
  const boardSoFar = [];
  const foldedPlayers = new Set();
  const streets = [
    { name: 'preflop', cards: [] },
    { name: 'flop',    cards: hand.flop  || [] },
    { name: 'turn',    cards: hand.turn  || [] },
    { name: 'river',   cards: hand.river || [] },
    { name: 'showdown',cards: [] },
  ];

  streets.forEach(({ name, cards }) => {
    // Añadir cartas del board al inicio de cada street
    if (cards.length) {
      boardSoFar.push(...cards);
      steps.push({
        type: 'board', street: name,
        board: [...boardSoFar], newCards: cards, pot,
        seats, foldedPlayers: new Set(foldedPlayers),
      });
    }

    const actions = sa[name] || [];
    actions.forEach(a => {
      if (['posts'].includes(a.action)) return; // saltar blinds/antes en log
      if (a.action === 'folds') foldedPlayers.add(a.player);
      if (a.amount) pot += a.amount;

      steps.push({
        type: 'action', street: name,
        player: a.player, action: a.action, amount: a.amount,
        board: [...boardSoFar], pot,
        seats, foldedPlayers: new Set(foldedPlayers),
      });
    });
  });

  // Paso final: resultado
  steps.push({
    type: 'result', street: 'showdown',
    board: [...boardSoFar], pot: hand.pot || pot,
    heroWon: hand.hero_won, heroNet: hand.hero_net,
    seats, foldedPlayers: new Set(foldedPlayers),
    heroCards:    hand.hero_cards    || [],
    villainCards: hand.villain_cards || {},
  });

  return steps;
}

// ── Render de asientos ────────────────────────────────────────────────────────
function _renderSeats(step, hand) {
  const seats       = step.seats || [];
  const folded      = step.foldedPlayers || new Set();
  const isResult    = step.type === 'result';
  const heroCards   = hand.hero_cards    || [];
  const vilCards    = (isResult ? step.villainCards : {}) || {};
  const currentActor = step.type === 'action' ? step.player : null;

  return seats.map(seat => {
    const isFolded = folded.has(seat.name);
    const isHero   = seat.isHero;
    const isActive = seat.name === currentActor;
    const pos      = _seatPos(seat.pos, seats.length);

    let cardsHtml = '';
    if (isHero && (step.type !== 'deal')) {
      cardsHtml = heroCards.map(c => `<div class="phv-card-anim">${_card(c, false, true)}</div>`).join('');
    } else if (!isHero && vilCards[seat.name]) {
      cardsHtml = vilCards[seat.name].map(c => _card(c, false, true)).join('');
    } else if (!isFolded) {
      cardsHtml = `${_card(null,true,true)}${_card(null,true,true)}`;
    }

    // Badge de acción
    let badge = '';
    if (isActive && step.action) {
      const info = _ACTION_LABELS[step.action] || { label: step.action.toUpperCase(), color: '#94a3b8' };
      const amt  = step.amount ? ` ${step.amount.toLocaleString()}` : '';
      badge = `<div class="phv-action-badge" style="background:${info.color}22;color:${info.color};border:1px solid ${info.color}44">
        ${info.label}${amt}
      </div>`;
    }

    return `<div class="phv-seat ${isHero?'phv-seat-hero':''} ${isFolded?'phv-seat-folded':''} ${isActive?'phv-seat-active':''}"
                 style="left:${pos.left}%;top:${pos.top}%;position:absolute;transform:translate(-50%,-50%)">
      <div style="position:relative">
        ${badge}
        <div class="phv-seat-cards">${cardsHtml}</div>
      </div>
      <div class="phv-seat-info">
        <div class="phv-seat-pos">${seat.pos}</div>
        <div class="phv-seat-name">${isHero ? 'HERO' : seat.name.substring(0,8)}</div>
        <div class="phv-seat-chips">${seat.chips.toLocaleString()}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Render de un paso ─────────────────────────────────────────────────────────
function _renderStep(el, step, hand, stepIdx, totalSteps) {
  const board = step.board || [];

  // Mesa
  const seatsHtml = _renderSeats(step, hand);
  const boardHtml = board.map(c => _card(c)).join('');
  const pot       = step.pot || 0;

  el.querySelector('.phv-board').innerHTML      = boardHtml;
  el.querySelector('.phv-pot-value').textContent = pot ? pot.toLocaleString() : '—';
  el.querySelector('.phv-seats-layer').innerHTML = seatsHtml;

  // Street chips
  const streets = ['preflop','flop','turn','river','showdown'];
  el.querySelectorAll('.phv-street-chip').forEach((chip, i) => {
    chip.classList.toggle('active', streets[i] === step.street);
  });

  // Log
  const logEl = el.querySelector('.phv-log');
  if (step.type === 'action') {
    const info  = _ACTION_LABELS[step.action] || { label: step.action.toUpperCase(), color: '#94a3b8' };
    const amt   = step.amount ? step.amount.toLocaleString() : '';
    const entry = document.createElement('div');
    entry.className = 'phv-log-entry current';
    entry.innerHTML = `
      <span class="phv-log-player">${step.player === 'Hero' ? '⭐ HERO' : step.player}</span>
      <span class="phv-log-action" style="background:${info.color}22;color:${info.color}">${info.label}</span>
      ${amt ? `<span class="phv-log-amount">${amt}</span>` : ''}`;
    // Quitar clase current al anterior
    logEl.querySelectorAll('.phv-log-entry.current').forEach(e => e.classList.remove('current'));
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  } else if (step.type === 'board' && step.newCards) {
    const streetLabels = { flop:'FLOP', turn:'TURN', river:'RIVER' };
    const lbl = streetLabels[step.street] || step.street.toUpperCase();
    const entry = document.createElement('div');
    entry.className = 'phv-log-entry';
    entry.innerHTML = `<span style="color:#d4af37;font-weight:700;font-size:0.72rem">── ${lbl} ──</span>
      <span style="color:#94a3b8;font-size:0.72rem">${step.newCards.join(' ')}</span>`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  } else if (step.type === 'result') {
    const color  = step.heroWon ? '#22c55e' : '#ef4444';
    const result = step.heroWon ? '🏆 HERO GANÓ' : '❌ HERO PERDIÓ';
    const net    = step.heroNet !== undefined
      ? ` (${step.heroNet >= 0 ? '+' : ''}${step.heroNet.toLocaleString()})` : '';
    const entry  = document.createElement('div');
    entry.className = 'phv-log-entry';
    entry.innerHTML = `<span style="color:${color};font-weight:800">${result}${net}</span>`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  } else if (step.type === 'deal') {
    logEl.innerHTML = `<div style="color:#475569;font-size:0.72rem;padding:4px 0">Repartiendo cartas…</div>`;
  }

  // Contador
  el.querySelector('.phv-step-counter').textContent = `${stepIdx + 1} / ${totalSteps}`;

  // Botones
  el.querySelector('#phv-prev').disabled = stepIdx === 0;
  el.querySelector('#phv-next').disabled = stepIdx === totalSteps - 1;
}

// ── Abrir modal del replayer ──────────────────────────────────────────────────
function openHandViewer(handId, handsJson) {
  _injectCSS();
  const hand = (handsJson || []).find(h => h.hand_id === handId);

  const steps   = hand ? _buildSteps(hand) : [];
  let stepIdx   = 0;
  let playing   = false;
  let playTimer = null;
  let speed     = 1200; // ms por paso

  // Metadata header
  const level   = hand ? `Nivel ${hand.level || '?'} (${hand.sb||'?'}/${hand.bb||'?'})` : '';
  const streets = ['Preflop','Flop','Turn','River','Showdown'];

  const overlay = document.createElement('div');
  overlay.className = 'phv-overlay';
  overlay.innerHTML = `
  <div class="phv-modal">
    <div class="phv-modal-head">
      <div>
        <div class="phv-modal-title">🃏 MinDev+ Replayer${hand ? ` — #${handId}` : ''}</div>
        <div class="phv-modal-meta">${level}${hand?.hero_position ? ` · Hero: ${hand.hero_position}` : ''}</div>
      </div>
      <button class="phv-modal-close" id="phv-close">✕</button>
    </div>

    <div class="phv-scene">
      <div class="phv-table-wrap">
        <div class="phv-table-oval">
          <div class="phv-felt-brand">MindEv+</div>
          <div class="phv-pot-area">
            <div class="phv-pot-label">POT</div>
            <div class="phv-pot-value">—</div>
          </div>
          <div class="phv-board"></div>
        </div>
        <div class="phv-seats-layer" style="position:absolute;inset:0"></div>
      </div>
    </div>

    <div class="phv-bottom">
      <div class="phv-street-bar">
        ${streets.map((s,i) => `<span class="phv-street-chip" data-street-idx="${i}" style="cursor:pointer">${s}</span>`).join('')}
      </div>
      <div class="phv-log"></div>
      <div class="phv-controls">
        <button class="phv-btn" id="phv-prev">⏮</button>
        <button class="phv-btn phv-btn-play" id="phv-play">▶ Play</button>
        <button class="phv-btn" id="phv-next">⏭</button>
        <select class="phv-speed" id="phv-speed">
          <option value="2000">Lento</option>
          <option value="1200" selected>Normal</option>
          <option value="600">Rápido</option>
          <option value="250">⚡</option>
        </select>
        <span class="phv-step-counter"></span>
      </div>
    </div>
  </div>`;

  document.body.appendChild(overlay);

  const modal   = overlay.querySelector('.phv-modal');
  const btnPlay = overlay.querySelector('#phv-play');
  const btnPrev = overlay.querySelector('#phv-prev');
  const btnNext = overlay.querySelector('#phv-next');
  const selSpeed= overlay.querySelector('#phv-speed');

  if (!hand || !steps.length) {
    overlay.querySelector('.phv-log').innerHTML =
      '<div style="color:#ef4444;padding:8px">Mano no disponible en este análisis.</div>';
    overlay.querySelector('#phv-close').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });
    return;
  }

  // Render inicial
  _renderStep(modal, steps[0], hand, 0, steps.length);

  function goTo(idx) {
    if (idx < 0 || idx >= steps.length) return;
    stepIdx = idx;
    _renderStep(modal, steps[stepIdx], hand, stepIdx, steps.length);
  }

  function stopPlay() {
    playing = false;
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    btnPlay.textContent = '▶ Play';
  }

  function startPlay() {
    playing = true;
    btnPlay.textContent = '⏸ Pausa';
    playTimer = setInterval(() => {
      if (stepIdx >= steps.length - 1) { stopPlay(); return; }
      goTo(stepIdx + 1);
    }, speed);
  }

  // Chips de street — saltar al primer paso de esa street
  const streetKeys = ['preflop','flop','turn','river','showdown'];
  overlay.querySelectorAll('.phv-street-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const targetStreet = streetKeys[parseInt(chip.dataset.streetIdx)];
      const targetIdx = steps.findIndex(s => s.street === targetStreet);
      if (targetIdx >= 0) { stopPlay(); goTo(targetIdx); }
    });
  });

  btnPlay.onclick = () => { playing ? stopPlay() : startPlay(); };
  btnPrev.onclick = () => { stopPlay(); goTo(stepIdx - 1); };
  btnNext.onclick = () => { stopPlay(); goTo(stepIdx + 1); };
  selSpeed.onchange = () => {
    speed = parseInt(selSpeed.value);
    if (playing) { stopPlay(); startPlay(); }
  };

  overlay.querySelector('#phv-close').onclick = () => { stopPlay(); overlay.remove(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) { stopPlay(); overlay.remove(); } });

  // Auto-play al abrir
  setTimeout(startPlay, 400);
}

// ── Inyectar botones "Ver mano" en el reporte ─────────────────────────────────
function injectHandViewerButtons(container, handsJson) {
  _injectCSS();
  if (!container || !handsJson?.length) return;
  container.querySelectorAll('span[data-hand-id]').forEach(span => {
    const handId = span.getAttribute('data-hand-id');
    if (!handId) return;
    const btn = document.createElement('button');
    btn.className = 'phv-btn-view';
    btn.innerHTML = '🃏 Replay de mano';
    btn.onclick = () => openHandViewer(handId, handsJson);
    if (!handsJson.find(h => h.hand_id === handId))
      btn.title = 'Datos de esta mano no disponibles';
    span.replaceWith(btn);
  });
}

window.PokerHandViewer = { openHandViewer, injectHandViewerButtons };
