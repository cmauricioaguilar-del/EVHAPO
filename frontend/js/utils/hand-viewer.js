/**
 * PokerHandViewer — visualizador de manos de poker
 * Dibuja mesa, cartas de Hero, board y posiciones de jugadores.
 */

const SUIT_SYMBOLS = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_COLORS  = { s: '#94a3b8', h: '#ef4444', d: '#ef4444', c: '#94a3b8' };

function _renderCard(card, faceDown = false) {
  if (faceDown || !card) {
    return `<div class="phv-card phv-card-back">🂠</div>`;
  }
  const rank = card.slice(0, -1);
  const suit = card.slice(-1).toLowerCase();
  const color = SUIT_COLORS[suit] || '#94a3b8';
  const sym   = SUIT_SYMBOLS[suit] || suit;
  return `<div class="phv-card" style="color:${color}">
    <span class="phv-rank">${rank}</span><span class="phv-suit">${sym}</span>
  </div>`;
}

function _renderCardGroup(cards, label) {
  if (!cards || cards.length === 0) return '';
  const cardsHtml = cards.map(c => _renderCard(c)).join('');
  return `<div class="phv-card-group">
    <div class="phv-card-label">${label}</div>
    <div class="phv-cards-row">${cardsHtml}</div>
  </div>`;
}

function _positionAngle(pos, totalSeats) {
  // Ángulos en grados (0 = arriba, sentido horario)
  const posMap = {
    'BTN': 90, 'SB': 120, 'BB': 150,
    'UTG': 210, 'UTG+1': 240, 'LJ': 270,
    'HJ': 300, 'CO': 330, 'MP': 255,
  };
  return posMap[pos] !== undefined ? posMap[pos] : 0;
}

function _buildSeatLayout(hand) {
  const seatMap    = hand.seat_map || {};
  const heroCards  = hand.hero_cards || [];
  const vilCards   = hand.villain_cards || {};
  const seats      = Object.entries(seatMap);

  return seats.map(([seatNum, info]) => {
    const isHero = info.name === 'Hero';
    const pos    = info.position || '?';
    const angle  = _positionAngle(pos, seats.length);
    const rad    = angle * Math.PI / 180;
    // Posición en porcentaje relativo al centro de la mesa
    const rx = 42, ry = 38; // radios del óvalo en %
    const cx = 50 + rx * Math.sin(rad);
    const cy = 50 - ry * Math.cos(rad);

    let cards = '';
    if (isHero && heroCards.length) {
      cards = heroCards.map(c => _renderCard(c)).join('');
    } else if (!isHero && vilCards[info.name]) {
      cards = vilCards[info.name].map(c => _renderCard(c)).join('');
    } else if (!isHero) {
      cards = `${_renderCard(null, true)}${_renderCard(null, true)}`;
    }

    const chips = info.chips ? `<div class="phv-chips">${(info.chips).toLocaleString()}</div>` : '';
    const label = isHero ? 'HERO' : info.name.substring(0, 8);

    return `<div class="phv-seat ${isHero ? 'phv-seat-hero' : ''}"
                 style="left:${cx.toFixed(1)}%;top:${cy.toFixed(1)}%;transform:translate(-50%,-50%)">
      <div class="phv-seat-pos">${pos}</div>
      <div class="phv-seat-cards">${cards}</div>
      <div class="phv-seat-name">${label}</div>
      ${chips}
    </div>`;
  }).join('');
}

function renderHandViewer(hand) {
  if (!hand) return '<p style="color:#94a3b8;text-align:center">Mano no disponible</p>';

  const flop   = hand.flop   || [];
  const turn   = hand.turn   || [];
  const river  = hand.river  || [];
  const board  = [...flop, ...turn, ...river];

  const result = hand.hero_won
    ? `<span class="phv-result phv-win">GANÓ</span>`
    : `<span class="phv-result phv-loss">PERDIÓ</span>`;

  const flags = [];
  if (hand.hero_allin)    flags.push('<span class="phv-badge">ALL-IN</span>');
  if (hand.went_showdown) flags.push('<span class="phv-badge">SHOWDOWN</span>');

  const pot = hand.pot ? `<div class="phv-pot">POT: ${hand.pot.toLocaleString()}</div>` : '';

  const boardHtml = board.length
    ? `<div class="phv-board-area">
        <div class="phv-board-label">BOARD</div>
        <div class="phv-cards-row">
          ${_renderCardGroup(flop, 'Flop')}
          ${turn.length  ? _renderCardGroup(turn,  'Turn')  : ''}
          ${river.length ? _renderCardGroup(river, 'River') : ''}
        </div>
       </div>`
    : `<div class="phv-board-area"><div class="phv-board-label" style="color:#64748b">Sin board registrado</div></div>`;

  const seatsHtml  = _buildSeatLayout(hand);
  const levelStr   = hand.level ? `Nivel ${hand.level} (${hand.sb}/${hand.bb})` : '';
  const heroPos    = hand.hero_position || '?';
  const heroNet    = hand.hero_net !== undefined
    ? `<span class="${hand.hero_net >= 0 ? 'phv-pos' : 'phv-neg'}">${hand.hero_net >= 0 ? '+' : ''}${hand.hero_net.toLocaleString()}</span>`
    : '';

  return `
  <div class="phv-container">
    <div class="phv-header">
      <div class="phv-header-left">
        <span class="phv-level">${levelStr}</span>
        <span class="phv-pos-badge">Hero: ${heroPos}</span>
        ${flags.join('')}
      </div>
      <div class="phv-header-right">
        ${result} ${heroNet}
      </div>
    </div>

    <div class="phv-table-wrap">
      <div class="phv-table">
        <div class="phv-table-felt">
          ${pot}
          ${boardHtml}
        </div>
        ${seatsHtml}
      </div>
    </div>

    ${hand.hero_actions && hand.hero_actions.length
      ? `<div class="phv-actions">
           <div class="phv-actions-label">Acciones de Hero</div>
           <div class="phv-actions-list">${hand.hero_actions.map(a => `<span class="phv-action">${a}</span>`).join('')}</div>
         </div>`
      : ''}
  </div>`;
}

// ── CSS del visualizador (se inyecta una sola vez) ───────────────────────────
function _injectHandViewerCSS() {
  if (document.getElementById('phv-styles')) return;
  const style = document.createElement('style');
  style.id = 'phv-styles';
  style.textContent = `
  .phv-container { font-family: inherit; color: #e2e8f0; }

  .phv-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px; background: rgba(255,255,255,0.04);
    border-radius: 8px 8px 0 0; border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-wrap: wrap; gap: 8px;
  }
  .phv-header-left, .phv-header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .phv-level { color: #94a3b8; font-size: 0.82rem; }
  .phv-pos-badge { background: rgba(59,130,246,0.15); color: #60a5fa;
    padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; }
  .phv-badge { background: rgba(212,175,55,0.15); color: #d4af37;
    padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
  .phv-result { padding: 2px 10px; border-radius: 4px; font-size: 0.82rem; font-weight: 700; }
  .phv-win  { background: rgba(34,197,94,0.15);  color: #22c55e; }
  .phv-loss { background: rgba(239,68,68,0.15);  color: #ef4444; }
  .phv-pos  { color: #22c55e; font-weight: 700; font-size: 0.9rem; }
  .phv-neg  { color: #ef4444; font-weight: 700; font-size: 0.9rem; }

  .phv-table-wrap {
    position: relative; width: 100%; padding-bottom: 58%; /* aspect ratio 100:58 */
    margin: 0; overflow: hidden;
    background: #0f172a;
  }
  .phv-table {
    position: absolute; inset: 8px;
  }
  .phv-table-felt {
    position: absolute;
    left: 8%; top: 6%; width: 84%; height: 88%;
    background: radial-gradient(ellipse at center, #166534 0%, #14532d 60%, #0f3d20 100%);
    border-radius: 50%;
    border: 4px solid #92400e;
    box-shadow: 0 0 0 6px #78350f, inset 0 0 40px rgba(0,0,0,0.4);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6px;
  }

  .phv-pot { color: #fbbf24; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.05em; }

  .phv-board-area { text-align: center; }
  .phv-board-label { color: rgba(255,255,255,0.4); font-size: 0.65rem;
    letter-spacing: 0.1em; margin-bottom: 4px; }

  .phv-cards-row { display: flex; gap: 6px; align-items: flex-start; justify-content: center; flex-wrap: wrap; }
  .phv-card-group { text-align: center; }
  .phv-card-label { color: rgba(255,255,255,0.35); font-size: 0.6rem;
    letter-spacing: 0.08em; margin-bottom: 3px; }

  .phv-card {
    display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
    width: 30px; height: 42px;
    background: #f8fafc; border-radius: 4px;
    border: 1px solid rgba(0,0,0,0.15);
    box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    font-size: 0.7rem; font-weight: 700; line-height: 1;
    margin: 1px;
  }
  .phv-card-back {
    background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
    color: rgba(255,255,255,0.4); font-size: 1.2rem; border-color: #1e40af;
  }
  .phv-rank { font-size: 0.72rem; line-height: 1; }
  .phv-suit { font-size: 0.8rem; line-height: 1; }

  /* Asientos posicionados absolutamente sobre la mesa */
  .phv-seat {
    position: absolute;
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    min-width: 56px;
  }
  .phv-seat-hero .phv-seat-pos { color: #fbbf24; }
  .phv-seat-pos {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.06em;
    color: #94a3b8; background: rgba(0,0,0,0.5);
    padding: 1px 5px; border-radius: 3px;
  }
  .phv-seat-cards { display: flex; gap: 2px; }
  .phv-seat-cards .phv-card { width: 22px; height: 32px; font-size: 0.58rem; }
  .phv-seat-cards .phv-card .phv-suit { font-size: 0.62rem; }
  .phv-seat-name {
    font-size: 0.58rem; color: #64748b;
    max-width: 56px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    text-align: center;
  }
  .phv-seat-hero .phv-seat-name { color: #fbbf24; font-weight: 700; }
  .phv-chips { font-size: 0.55rem; color: #94a3b8; }

  .phv-actions {
    padding: 10px 14px; background: rgba(255,255,255,0.02);
    border-top: 1px solid rgba(255,255,255,0.06);
    border-radius: 0 0 8px 8px;
  }
  .phv-actions-label { color: #64748b; font-size: 0.7rem; letter-spacing: 0.08em; margin-bottom: 6px; }
  .phv-actions-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .phv-action {
    background: rgba(255,255,255,0.05); color: #94a3b8;
    padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;
  }

  /* Modal */
  .phv-modal-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .phv-modal {
    background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; width: 100%; max-width: 560px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    overflow: hidden;
  }
  .phv-modal-title {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08);
    color: #d4af37; font-weight: 700; font-size: 0.95rem;
  }
  .phv-modal-close {
    cursor: pointer; color: #64748b; font-size: 1.2rem; line-height: 1;
    background: none; border: none; padding: 4px 8px;
  }
  .phv-modal-close:hover { color: #e2e8f0; }
  .phv-modal-body { overflow-y: auto; max-height: 80vh; }
  `;
  document.head.appendChild(style);
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Abre un modal con el visualizador para la mano indicada por hand_id.
 * @param {string} handId  — ID de la mano (ej: "TM5607060393")
 * @param {Array}  handsJson — array de objetos de mano del análisis actual
 */
function openHandViewer(handId, handsJson) {
  _injectHandViewerCSS();

  const hand = (handsJson || []).find(h => h.hand_id === handId);

  const overlay = document.createElement('div');
  overlay.className = 'phv-modal-overlay';
  overlay.innerHTML = `
    <div class="phv-modal">
      <div class="phv-modal-title">
        <span>Visualizador de Mano${hand ? ` — #${handId}` : ''}</span>
        <button class="phv-modal-close" aria-label="Cerrar">✕</button>
      </div>
      <div class="phv-modal-body">
        ${renderHandViewer(hand)}
      </div>
    </div>`;

  overlay.querySelector('.phv-modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

/**
 * Inyecta botones "Ver mano" en el HTML del reporte.
 * Busca <span data-hand-id="..."> que la IA inserta y los reemplaza por botones.
 * @param {HTMLElement} container — el div donde está el report_html renderizado
 * @param {Array}       handsJson — array de objetos de mano
 */
function injectHandViewerButtons(container, handsJson) {
  _injectHandViewerCSS();
  if (!container || !handsJson || !handsJson.length) return;

  const spans = container.querySelectorAll('span[data-hand-id]');
  spans.forEach(span => {
    const handId = span.getAttribute('data-hand-id');
    if (!handId) return;
    const hand = handsJson.find(h => h.hand_id === handId);

    const btn = document.createElement('button');
    btn.className = 'phv-btn-view';
    btn.innerHTML = '🃏 Ver mano';
    btn.style.cssText = `
      display:inline-flex;align-items:center;gap:5px;
      background:rgba(212,175,55,0.12);color:#d4af37;
      border:1px solid rgba(212,175,55,0.3);border-radius:6px;
      padding:4px 12px;font-size:0.78rem;font-weight:700;
      cursor:pointer;margin-top:8px;transition:background 0.2s;
    `;
    btn.onmouseenter = () => btn.style.background = 'rgba(212,175,55,0.22)';
    btn.onmouseleave = () => btn.style.background = 'rgba(212,175,55,0.12)';
    btn.addEventListener('click', () => openHandViewer(handId, handsJson));

    if (!hand) btn.title = 'Mano no disponible en el historial cargado';

    span.replaceWith(btn);
  });
}

window.PokerHandViewer = { openHandViewer, injectHandViewerButtons, renderHandViewer };
