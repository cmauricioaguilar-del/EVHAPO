// ─── Calculadora de Bankroll — Cash & MTT ─────────────────────────────────────

const BRM_CASH = {
  'Cash Game': { min:20,  safe:30,  comfortable:50,  moveDown:15 },
  'Live Cash': { min:20,  safe:30,  comfortable:50,  moveDown:15 },
  'Home Game': { min:10,  safe:15,  comfortable:25,  moveDown:8  },
};
const BRM_MTT = {
  'MTT':       { min:50,  safe:75,  comfortable:100, moveDown:30 },
  'SNG':       { min:30,  safe:50,  comfortable:75,  moveDown:20 },
  'Spin & Go': { min:100, safe:150, comfortable:200, moveDown:75 },
};

// ─── Render principal ─────────────────────────────────────────────────────────
function renderBankroll() {
  const isEN = I18N.isEN(), isPT = I18N.isPT();
  const L = {
    title:      isEN ? 'Bankroll Calculator' : isPT ? 'Calculadora de Bankroll' : 'Calculadora de Bankroll',
    tabCash:    isEN ? '💰 Cash Game'        : isPT ? '💰 Cash Game'            : '💰 Cash Game',
    tabMTT:     isEN ? '🏆 MTT / Tournaments': isPT ? '🏆 MTT / Torneios'       : '🏆 MTT / Torneos',
    format:     isEN ? 'Game format'         : isPT ? 'Formato de jogo'         : 'Formato de juego',
    buyin:      isEN ? 'Buy-in ($)'          : isPT ? 'Buy-in ($)'              : 'Buy-in ($)',
    entry:      isEN ? 'Entry fee ($)'       : isPT ? 'Taxa de entrada ($)'     : 'Entrada al torneo ($)',
    bankroll:   isEN ? 'My bankroll ($)'     : isPT ? 'Meu bankroll ($)'        : 'Mi bankroll actual ($)',
    reentries:  isEN ? 'Re-entries allowed'  : isPT ? 'Re-entradas permitidas'  : 'Re-entradas permitidas',
    reentryRate:isEN ? 'Your re-entry rate'  : isPT ? 'Sua taxa de re-entrada'  : 'Tu tasa de re-entrada',
    tourneys:   isEN ? 'Tournaments / week (optional)' : isPT ? 'Torneios / semana (opcional)' : 'Torneos / semana (opcional)',
    freezeout:  isEN ? 'Freezeout (none)'    : isPT ? 'Freezeout (nenhuma)'     : 'Freezeout (ninguna)',
    unlimited:  isEN ? 'Unlimited'           : isPT ? 'Ilimitadas'              : 'Ilimitadas',
    guideTitle: isEN ? 'BRM guide by format' : isPT ? 'Guia de BRM por formato' : 'Guía de BRM por formato',
    fmtCol:     isEN ? 'Format'  : isPT ? 'Formato'  : 'Formato',
    minCol:     isEN ? 'Minimum' : isPT ? 'Mínimo'   : 'Mínimo',
    safeCol:    isEN ? 'Safe'    : isPT ? 'Seguro'    : 'Seguro',
    upCol:      isEN ? 'Move up' : isPT ? 'Subir'     : 'Para subir',
    downCol:    isEN ? 'Move down if' : isPT ? 'Baixar se' : 'Bajar si',
    footnote:   isEN ? 'bi = buy-ins · Conservative recommendations to minimise risk of ruin.'
                     : isPT ? 'bi = buy-ins · Recomendações conservadoras para minimizar risco de ruína.'
                     : 'bi = buy-ins · Recomendaciones conservadoras para minimizar riesgo de quiebra.',
  };

  const tabStyle  = (active) => `cursor:pointer;padding:10px 22px;border-radius:8px 8px 0 0;font-weight:700;font-size:0.88rem;border:none;transition:all .2s;${
    active ? 'background:var(--accent);color:#0a0e1a;'
           : 'background:var(--card);color:var(--text3);border:1px solid var(--border);'}`;

  const cashFmts = Object.keys(BRM_CASH).map(f => `<option value="${f}">${f}</option>`).join('');
  const mttFmts  = Object.keys(BRM_MTT).map(f  => `<option value="${f}">${f}</option>`).join('');

  document.getElementById('app').innerHTML = `${renderNavbar()}
  <div style="max-width:740px;margin:32px auto;padding:0 16px">

    <!-- Título -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
      <h2 style="margin:0;color:var(--accent)">💰 ${L.title}</h2>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:4px;margin-bottom:-1px;position:relative;z-index:1">
      <button id="brm-tab-cash" onclick="brmTab('cash')" style="${tabStyle(true)}">${L.tabCash}</button>
      <button id="brm-tab-mtt"  onclick="brmTab('mtt')"  style="${tabStyle(false)}">${L.tabMTT}</button>
    </div>

    <!-- Panel Cash -->
    <div id="brm-panel-cash" style="background:var(--card);border:1px solid var(--border);border-radius:0 12px 12px 12px;padding:24px;margin-bottom:24px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px">
        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">${L.format}</label>
          <select id="brm-cash-format" onchange="calcBankroll()"
            style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem">
            ${cashFmts}
          </select>
        </div>
        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">${L.buyin}</label>
          <input type="number" id="brm-cash-buyin" value="10" min="0.01" step="0.01" oninput="calcBankroll()"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem">
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px">${isEN ? 'NL10→$10 · NL25→$25 · NL50→$50' : 'NL10→$10 · NL25→$25 · NL50→$50'}</div>
        </div>
        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">${L.bankroll}</label>
          <input type="number" id="brm-cash-bankroll" value="300" min="0" step="1" oninput="calcBankroll()"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem">
        </div>
      </div>
    </div>

    <!-- Panel MTT -->
    <div id="brm-panel-mtt" style="display:none;background:var(--card);border:1px solid var(--border);border-radius:0 12px 12px 12px;padding:24px;margin-bottom:24px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px">
        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">${L.format}</label>
          <select id="brm-mtt-format" onchange="calcBankroll()"
            style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem">
            ${mttFmts}
          </select>
        </div>
        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">${L.entry}</label>
          <input type="number" id="brm-mtt-entry" value="25" min="0.01" step="0.01" oninput="calcBankroll()"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem">
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px">${isEN ? 'e.g. $5, $10, $25, $50, $100...' : 'Ej: $5, $10, $25, $50, $100...'}</div>
        </div>
        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">${L.reentries}</label>
          <select id="brm-mtt-reentries" onchange="calcBankroll()"
            style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem">
            <option value="0">${L.freezeout}</option>
            <option value="1">1 re-entry</option>
            <option value="2">2 re-entries</option>
            <option value="3">${L.unlimited}</option>
          </select>
        </div>
        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">${L.reentryRate} (%)</label>
          <input type="number" id="brm-mtt-rerate" value="60" min="0" max="100" step="5" oninput="calcBankroll()"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem">
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px">${isEN ? '% of tournaments where you re-enter' : isPT ? '% dos torneios em que você re-entra' : '% de torneos en los que re-entras'}</div>
        </div>
        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">${L.bankroll}</label>
          <input type="number" id="brm-mtt-bankroll" value="500" min="0" step="1" oninput="calcBankroll()"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem">
        </div>
        <div>
          <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">${L.tourneys}</label>
          <input type="number" id="brm-mtt-weekly" value="" min="0" step="1" oninput="calcBankroll()"
            style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem"
            placeholder="${isEN ? 'e.g. 5' : 'Ej: 5'}">
        </div>
      </div>
    </div>

    <!-- Resultado -->
    <div id="brm-result"></div>

    <!-- Tabla de referencia -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-top:8px">
      <h3 style="margin:0 0 14px;color:var(--text2);font-size:0.9rem">📖 ${L.guideTitle}</h3>

      <!-- Cash -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">💰 Cash</div>
      ${brmTable(BRM_CASH, L)}

      <!-- MTT -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin:14px 0 6px">🏆 MTT / ${isEN ? 'Tournaments' : isPT ? 'Torneios' : 'Torneos'}</div>
      ${brmTable(BRM_MTT, L)}

      <p style="margin:10px 0 0;color:var(--text3);font-size:0.75rem">${L.footnote}</p>
    </div>
  </div>`;

  calcBankroll();
}

// ─── Tabla de referencia helper ───────────────────────────────────────────────
function brmTable(brmObj, L) {
  return `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:400px;font-size:0.83rem">
    <thead><tr style="border-bottom:1px solid var(--border)">
      ${[L.fmtCol, L.minCol, L.safeCol, L.upCol, L.downCol].map(h =>
        `<th style="text-align:left;padding:7px 8px;color:var(--text3);font-weight:600;text-transform:uppercase;font-size:0.72rem">${h}</th>`
      ).join('')}
    </tr></thead>
    <tbody>
      ${Object.entries(brmObj).map(([fmt, r], i) => `
        <tr style="border-bottom:1px solid var(--border);${i%2?'background:rgba(255,255,255,0.02)':''}">
          <td style="padding:7px 8px;font-weight:600;color:var(--text1)">${fmt}</td>
          <td style="padding:7px 8px;color:#f87171">${r.min} bi</td>
          <td style="padding:7px 8px;color:#fbbf24">${r.safe} bi</td>
          <td style="padding:7px 8px;color:#4ade80">${r.comfortable} bi</td>
          <td style="padding:7px 8px;color:var(--text3)">< ${r.moveDown} bi</td>
        </tr>`).join('')}
    </tbody>
  </table></div>`;
}

// ─── Cambio de tab ────────────────────────────────────────────────────────────
function brmTab(tab) {
  const isEN = I18N.isEN();
  const cashActive = tab === 'cash';
  const tabBase = 'cursor:pointer;padding:10px 22px;border-radius:8px 8px 0 0;font-weight:700;font-size:0.88rem;border:none;transition:all .2s;';

  document.getElementById('brm-tab-cash').style.cssText = tabBase + (cashActive
    ? 'background:var(--accent);color:#0a0e1a;'
    : 'background:var(--card);color:var(--text3);border:1px solid var(--border);');
  document.getElementById('brm-tab-mtt').style.cssText = tabBase + (!cashActive
    ? 'background:var(--accent);color:#0a0e1a;'
    : 'background:var(--card);color:var(--text3);border:1px solid var(--border);');

  document.getElementById('brm-panel-cash').style.display = cashActive ? 'block' : 'none';
  document.getElementById('brm-panel-mtt').style.display  = cashActive ? 'none'  : 'block';

  document.getElementById('brm-result').innerHTML = '';
  calcBankroll();
}

// ─── Cálculo principal ────────────────────────────────────────────────────────
function calcBankroll() {
  const isEN = I18N.isEN(), isPT = I18N.isPT();
  const cashVisible = document.getElementById('brm-panel-cash')?.style.display !== 'none';
  if (cashVisible) calcBankrollCash(isEN, isPT);
  else             calcBankrollMTT(isEN, isPT);
}

// ─── Cálculo Cash ─────────────────────────────────────────────────────────────
function calcBankrollCash(isEN, isPT) {
  const fmt      = document.getElementById('brm-cash-format')?.value || 'Cash Game';
  const buyIn    = parseFloat(document.getElementById('brm-cash-buyin')?.value || 0);
  const bankroll = parseFloat(document.getElementById('brm-cash-bankroll')?.value || 0);
  const resultEl = document.getElementById('brm-result');
  if (!resultEl) return;
  if (!buyIn || buyIn <= 0 || !bankroll || bankroll < 0) { resultEl.innerHTML = ''; return; }

  const brm = BRM_CASH[fmt] || BRM_CASH['Cash Game'];
  _renderBrmResult({ isEN, isPT, brm, buyIn, bankroll, fmt, mode:'cash' });
}

// ─── Cálculo MTT ─────────────────────────────────────────────────────────────
function calcBankrollMTT(isEN, isPT) {
  const fmt       = document.getElementById('brm-mtt-format')?.value || 'MTT';
  const entry     = parseFloat(document.getElementById('brm-mtt-entry')?.value || 0);
  const bankroll  = parseFloat(document.getElementById('brm-mtt-bankroll')?.value || 0);
  const reentries = parseInt(document.getElementById('brm-mtt-reentries')?.value || 0);
  const reRate    = parseFloat(document.getElementById('brm-mtt-rerate')?.value || 0) / 100;
  const weekly    = parseInt(document.getElementById('brm-mtt-weekly')?.value || 0);
  const resultEl  = document.getElementById('brm-result');
  if (!resultEl) return;
  if (!entry || entry <= 0 || !bankroll || bankroll < 0) { resultEl.innerHTML = ''; return; }

  // Buy-in efectivo = entrada × (1 + re-entradas_esperadas × tasa)
  const effectiveBuyIn = entry * (1 + reentries * reRate);
  const brm = BRM_MTT[fmt] || BRM_MTT['MTT'];

  _renderBrmResult({ isEN, isPT, brm, buyIn: effectiveBuyIn, bankroll, fmt, mode:'mtt',
                     entry, reentries, reRate, weekly, effectiveBuyIn });
}

// ─── Render resultado (compartido Cash + MTT) ─────────────────────────────────
function _renderBrmResult({ isEN, isPT, brm, buyIn, bankroll, fmt, mode,
                             entry, reentries, reRate, weekly, effectiveBuyIn }) {
  const resultEl = document.getElementById('brm-result');
  const numBi    = bankroll / buyIn;

  // ── Estado ──
  let status, statusColor, statusIcon, statusMsg, recommendation;
  if (numBi < brm.moveDown) {
    status = isEN ? 'DANGER' : isPT ? 'PERIGO' : 'PELIGRO';
    statusColor = '#ef4444'; statusIcon = '🔴';
    statusMsg = isEN ? 'Insufficient bankroll. High risk of ruin.'
      : isPT ? 'Bankroll insuficiente. Alto risco de ruína.'
      : 'Bankroll insuficiente. Alto riesgo de quiebra.';
    const safeBI = (bankroll / brm.min).toFixed(2);
    recommendation = mode === 'mtt'
      ? (isEN ? `Drop to lower buy-in tournaments. With $${bankroll.toFixed(0)} your safe entry is ≤ $${safeBI}.`
        : isPT ? `Jogue torneios com buy-in menor. Com $${bankroll.toFixed(0)} sua entrada segura é ≤ $${safeBI}.`
        : `Baja al nivel de buy-in inferior. Con $${bankroll.toFixed(0)} tu entrada segura es ≤ $${safeBI}.`)
      : (isEN ? `Move down. With $${bankroll.toFixed(0)} play buy-ins of at most $${safeBI}.`
        : isPT ? `Baixe. Com $${bankroll.toFixed(0)} jogue buy-ins de no máximo $${safeBI}.`
        : `Baja de límites. Con $${bankroll.toFixed(0)} juega buy-ins de máximo $${safeBI}.`);
  } else if (numBi < brm.min) {
    status = isEN ? 'CAUTION' : isPT ? 'PRECAUÇÃO' : 'PRECAUCIÓN';
    statusColor = '#f97316'; statusIcon = '🟠';
    statusMsg = isEN ? 'Below the recommended minimum for this format.'
      : isPT ? 'Abaixo do mínimo recomendado para este formato.'
      : 'Por debajo del mínimo recomendado para este formato.';
    const need = ((brm.min * buyIn) - bankroll).toFixed(0);
    recommendation = mode === 'mtt'
      ? (isEN ? `You need ${brm.min} effective buy-ins ($${(brm.min*buyIn).toFixed(0)}). You're $${need} short.`
        : isPT ? `Você precisa de ${brm.min} buy-ins efetivos ($${(brm.min*buyIn).toFixed(0)}). Faltam $${need}.`
        : `Necesitas ${brm.min} buy-ins efectivos ($${(brm.min*buyIn).toFixed(0)}). Te faltan $${need}.`)
      : (isEN ? `Need ${brm.min} buy-ins ($${(brm.min*buyIn).toFixed(0)}). Short by $${need}.`
        : isPT ? `Precisa de ${brm.min} buy-ins ($${(brm.min*buyIn).toFixed(0)}). Faltam $${need}.`
        : `Necesitas ${brm.min} buy-ins ($${(brm.min*buyIn).toFixed(0)}). Te faltan $${need}.`);
  } else if (numBi < brm.safe) {
    status = isEN ? 'ACCEPTABLE' : isPT ? 'ACEITÁVEL' : 'ACEPTABLE';
    statusColor = '#fbbf24'; statusIcon = '🟡';
    statusMsg = isEN ? "At the minimum. You can play, but play carefully."
      : isPT ? 'No mínimo. Você pode jogar, mas com cuidado.'
      : 'Estás en el mínimo. Puedes jugar, pero con cuidado.';
    const need = ((brm.safe * buyIn) - bankroll).toFixed(0);
    recommendation = isEN ? `For a comfortable bankroll you need ${brm.safe} buy-ins ($${(brm.safe*buyIn).toFixed(0)}). $${need} to go.`
      : isPT ? `Para jogar confortável você precisa de ${brm.safe} buy-ins ($${(brm.safe*buyIn).toFixed(0)}). Faltam $${need}.`
      : `Para jugar cómodo necesitas ${brm.safe} buy-ins ($${(brm.safe*buyIn).toFixed(0)}). Te faltan $${need}.`;
  } else if (numBi < brm.comfortable) {
    status = isEN ? 'HEALTHY' : isPT ? 'SAUDÁVEL' : 'SALUDABLE';
    statusColor = '#4ade80'; statusIcon = '🟢';
    statusMsg = isEN ? 'Good bankroll for this format. Keep building.'
      : isPT ? 'Bom bankroll para este formato. Continue construindo.'
      : 'Buen bankroll para este formato. Sigue construyendo.';
    const need = ((brm.comfortable * buyIn) - bankroll).toFixed(0);
    recommendation = mode === 'mtt'
      ? (isEN ? `To move to the next buy-in level you need ${brm.comfortable} buy-ins ($${(brm.comfortable*buyIn).toFixed(0)}). $${need} to go.`
        : isPT ? `Para subir de nível você precisa de ${brm.comfortable} buy-ins ($${(brm.comfortable*buyIn).toFixed(0)}). Faltam $${need}.`
        : `Para subir al siguiente buy-in necesitas ${brm.comfortable} buy-ins ($${(brm.comfortable*buyIn).toFixed(0)}). Te faltan $${need}.`)
      : (isEN ? `To move up you need ${brm.comfortable} buy-ins ($${(brm.comfortable*buyIn).toFixed(0)}). $${need} to go.`
        : isPT ? `Para subir você precisa de ${brm.comfortable} buy-ins ($${(brm.comfortable*buyIn).toFixed(0)}). Faltam $${need}.`
        : `Para subir necesitas ${brm.comfortable} buy-ins ($${(brm.comfortable*buyIn).toFixed(0)}). Te faltan $${need}.`);
  } else {
    status = isEN ? 'EXCELLENT' : isPT ? 'EXCELENTE' : 'EXCELENTE';
    statusColor = '#4DB6AC'; statusIcon = '💎';
    statusMsg = isEN ? 'Solid bankroll! Ready to move up in stakes.'
      : isPT ? 'Bankroll sólido! Pronto para subir de nível.'
      : '¡Bankroll sólido! Listo para subir de nivel.';
    recommendation = mode === 'mtt'
      ? (isEN ? `With ${Math.floor(numBi)} effective buy-ins in ${fmt}, you can consider higher buy-in tournaments.`
        : isPT ? `Com ${Math.floor(numBi)} buy-ins efetivos em ${fmt}, considere torneios de buy-in maior.`
        : `Con ${Math.floor(numBi)} buy-ins efectivos en ${fmt}, puedes considerar torneos de mayor buy-in.`)
      : (isEN ? `With ${Math.floor(numBi)} buy-ins in ${fmt}, consider moving up if your win rate supports it.`
        : isPT ? `Com ${Math.floor(numBi)} buy-ins em ${fmt}, considere subir se seu win rate justificar.`
        : `Con ${Math.floor(numBi)} buy-ins en ${fmt}, considera subir si tu win rate lo justifica.`);
  }

  // ── Riesgo de quiebra ──
  let rorText, rorColor;
  if      (numBi < brm.moveDown)    { rorText = '> 60%';  rorColor = '#ef4444'; }
  else if (numBi < brm.min)         { rorText = '30–60%'; rorColor = '#f97316'; }
  else if (numBi < brm.safe)        { rorText = '10–30%'; rorColor = '#fbbf24'; }
  else if (numBi < brm.comfortable) { rorText = '5–10%';  rorColor = '#a3e635'; }
  else                               { rorText = '< 5%';   rorColor = '#4ade80'; }

  const neededForUp = Math.max(0, (brm.comfortable * buyIn) - bankroll);

  // ── Card MTT extra: buy-in efectivo + proyección ──
  let mttExtra = '';
  if (mode === 'mtt') {
    const effectiveLabel = isEN ? 'Effective buy-in' : isPT ? 'Buy-in efetivo' : 'Buy-in efectivo';
    const coverLabel     = isEN ? 'Tournaments covered' : isPT ? 'Torneios cobertos' : 'Torneos cubiertos';
    const safeN          = Math.floor(bankroll / (brm.safe * buyIn / brm.safe)); // = numBi
    const tourneyCover   = Math.floor(bankroll / effectiveBuyIn);
    let weeklyHtml = '';
    if (weekly > 0) {
      const weeksLeft = (tourneyCover / weekly).toFixed(1);
      const monthsLeft = (tourneyCover / (weekly * 4.33)).toFixed(1);
      const durLabel = isEN ? 'Duration at your volume' : isPT ? 'Duração no seu volume' : 'Duración a tu ritmo';
      weeklyHtml = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
          <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${durLabel}</div>
          <div style="font-size:1.4rem;font-weight:800;color:var(--accent)">${weeksLeft} <span style="font-size:0.8rem">${isEN?'wks':isPT?'sem':'sem'}</span> / ${monthsLeft} <span style="font-size:0.8rem">${isEN?'mo':isPT?'mes':'mes'}</span></div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${weekly} ${isEN?'tournaments/week':isPT?'torneios/semana':'torneos/semana'}</div>
        </div>`;
    }
    mttExtra = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
          <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${effectiveLabel}</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--accent)">$${effectiveBuyIn.toFixed(2)}</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">
            $${entry?.toFixed(2)} × (1 + ${reentries}×${Math.round(reRate*100)}%)
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
          <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${coverLabel}</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--accent)">${tourneyCover}</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${isEN?'at current effective buy-in':isPT?'no buy-in efetivo atual':'al buy-in efectivo actual'}</div>
        </div>
        ${weeklyHtml}
      </div>`;
  }

  resultEl.innerHTML = `
    <!-- Estado -->
    <div style="background:var(--card);border:2px solid ${statusColor};border-radius:12px;padding:20px 24px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="font-size:2.4rem">${statusIcon}</div>
        <div style="flex:1">
          <div style="font-size:1.4rem;font-weight:800;color:${statusColor}">${status}</div>
          <div style="color:var(--text2);font-size:0.9rem;margin-top:2px">${statusMsg}</div>
        </div>
        <div style="text-align:center;min-width:80px">
          <div style="font-size:2rem;font-weight:800;color:${statusColor}">${Math.floor(numBi)}</div>
          <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase">${mode==='mtt'?(isEN?'eff. buy-ins':isPT?'bi efetivos':'bi efectivos'):'buy-ins'}</div>
        </div>
      </div>
    </div>

    ${mttExtra}

    <!-- Métricas comunes -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:16px">
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${isEN?'Risk of ruin':isPT?'Risco de ruína':'Riesgo de quiebra'}</div>
        <div style="font-size:1.6rem;font-weight:800;color:${rorColor}">${rorText}</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${isEN?'Estimate, average play':isPT?'Estimado, jogo médio':'Estimado, juego promedio'}</div>
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${isEN?'To move up':isPT?'Para subir':'Para subir'}</div>
        <div style="font-size:1.6rem;font-weight:800;color:var(--accent)">
          ${neededForUp <= 0 ? (isEN?'Ready!':isPT?'Pronto!':'¡Listo!') : '+$'+neededForUp.toFixed(0)}
        </div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${brm.comfortable} bi @ $${buyIn.toFixed(2)} = $${(brm.comfortable*buyIn).toFixed(0)}</div>
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${isEN?'Stop-loss':isPT?'Stop-loss':'Stop-loss'}</div>
        <div style="font-size:1.6rem;font-weight:800;color:#f87171">$${(brm.moveDown*buyIn).toFixed(0)}</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${brm.moveDown} bi — BRM stop-loss</div>
      </div>
    </div>

    <!-- Barra progreso -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text3);margin-bottom:8px">
        <span>0</span>
        <span style="color:#f97316">${brm.min} ${isEN?'min':'mín'}</span>
        <span style="color:#fbbf24">${brm.safe} safe</span>
        <span style="color:#4ade80">${brm.comfortable} ${isEN?'excellent':'excelente'}</span>
      </div>
      <div style="background:var(--border);border-radius:6px;height:12px;position:relative;overflow:hidden">
        <div style="position:absolute;left:0;top:0;height:100%;width:${Math.min(100,(numBi/brm.comfortable)*100)}%;background:linear-gradient(90deg,#ef4444,#f97316,#fbbf24,#4ade80);border-radius:6px;transition:width .5s"></div>
        <div style="position:absolute;top:0;left:${(brm.min/brm.comfortable)*100}%;height:100%;width:2px;background:#f97316;opacity:.8"></div>
        <div style="position:absolute;top:0;left:${(brm.safe/brm.comfortable)*100}%;height:100%;width:2px;background:#fbbf24;opacity:.8"></div>
      </div>
      <div style="text-align:center;margin-top:8px;font-size:0.8rem;color:var(--text2)">
        ${Math.floor(numBi)} / ${brm.comfortable} bi (${Math.min(100,Math.round((numBi/brm.comfortable)*100))}% ${isEN?'of target':isPT?'do objetivo':'del objetivo'})
      </div>
    </div>

    <!-- Recomendación -->
    <div style="background:#1e2d45;border-left:4px solid ${statusColor};padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px">
      <div style="font-size:0.78rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">💡 ${isEN?'Recommendation':isPT?'Recomendação':'Recomendación'}</div>
      <p style="margin:0;color:#cbd5e1;font-size:0.92rem;line-height:1.6">${recommendation}</p>
    </div>`;
}
