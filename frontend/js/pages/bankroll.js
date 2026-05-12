// ─── Calculadora de Bankroll ──────────────────────────────────────────────────

const BRM = {
  'Cash Game':  { min: 20, safe: 30, comfortable: 50,  moveDown: 15, label: 'Cash Game',   hint: '1 buy-in = 100 BBs' },
  'MTT':        { min: 50, safe: 75, comfortable: 100, moveDown: 30, label: 'MTT',          hint: '1 buy-in = precio del torneo' },
  'SNG':        { min: 30, safe: 50, comfortable: 75,  moveDown: 20, label: 'SNG',          hint: '1 buy-in = precio del SNG' },
  'Spin & Go':  { min: 100, safe: 150, comfortable: 200, moveDown: 75, label: 'Spin & Go',  hint: 'Alta varianza — requiere más buy-ins' },
  'Live':       { min: 20, safe: 30, comfortable: 50,  moveDown: 15, label: 'Live',         hint: '1 buy-in = 100 BBs en mesa live' },
  'Home Game':  { min: 10, safe: 15, comfortable: 25,  moveDown: 8,  label: 'Home Game',    hint: '1 buy-in = compra típica del juego' },
};

function renderBankroll() {
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:720px;margin:32px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
        <h2 style="margin:0;color:var(--accent)">💰 ${isEN ? 'Bankroll Calculator' : isPT ? 'Calculadora de Bankroll' : 'Calculadora de Bankroll'}</h2>
      </div>

      <!-- Formulario -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:24px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">

          <div>
            <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">${isEN ? 'Game format' : isPT ? 'Formato de jogo' : 'Formato de juego'}</label>
            <select id="brm-format" onchange="calcBankroll()"
              style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem">
              ${Object.keys(BRM).map(f => `<option value="${f}">${f}</option>`).join('')}
            </select>
            <div id="brm-hint" style="font-size:0.75rem;color:var(--text3);margin-top:4px">${BRM['Cash Game'].hint}</div>
          </div>

          <div>
            <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">Buy-in ($)</label>
            <input type="number" id="brm-buyin" value="10" min="0.01" step="0.01" oninput="calcBankroll()"
              style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem"
              placeholder="${isEN ? 'e.g. 10' : 'Ej: 10'}">
            <div style="font-size:0.75rem;color:var(--text3);margin-top:4px">${isEN ? 'e.g. NL10 → $10 · NL25 → $25' : 'Ej: NL10 → $10 · NL25 → $25'}</div>
          </div>

          <div>
            <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">${isEN ? 'My current bankroll ($)' : isPT ? 'Meu bankroll atual ($)' : 'Mi bankroll actual ($)'}</label>
            <input type="number" id="brm-bankroll" value="200" min="0" step="1" oninput="calcBankroll()"
              style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem"
              placeholder="${isEN ? 'e.g. 200' : 'Ej: 200'}">
          </div>

        </div>
      </div>

      <!-- Resultado -->
      <div id="brm-result"></div>

      <!-- Tabla de referencia -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-top:24px">
        <h3 style="margin:0 0 14px;color:var(--text2);font-size:0.9rem">📖 ${isEN ? 'BRM guide by format' : isPT ? 'Guia de BRM por formato' : 'Guía de BRM por formato'}</h3>
        <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:420px;font-size:0.83rem">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              ${(isEN ? ['Format','Minimum','Safe','To move up','Move down if'] : isPT ? ['Formato','Mínimo','Seguro','Para subir','Baixar se'] : ['Formato','Mínimo','Seguro','Para subir','Bajar si']).map(h =>
                `<th style="text-align:left;padding:7px 8px;color:var(--text3);font-weight:600;text-transform:uppercase;font-size:0.72rem">${h}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${Object.entries(BRM).map(([fmt, r], i) => `
              <tr style="border-bottom:1px solid var(--border);${i % 2 ? 'background:rgba(255,255,255,0.02)' : ''}">
                <td style="padding:7px 8px;font-weight:600;color:var(--text1)">${fmt}</td>
                <td style="padding:7px 8px;color:#f87171">${r.min} bi</td>
                <td style="padding:7px 8px;color:#fbbf24">${r.safe} bi</td>
                <td style="padding:7px 8px;color:#4ade80">${r.comfortable} bi</td>
                <td style="padding:7px 8px;color:var(--text3)">< ${r.moveDown} bi</td>
              </tr>`).join('')}
          </tbody>
        </table>
        </div>
        <p style="margin:10px 0 0;color:var(--text3);font-size:0.75rem">bi = buy-ins · ${isEN ? 'Conservative recommendations to minimise risk of ruin.' : isPT ? 'Recomendações conservadoras para minimizar risco de ruína.' : 'Recomendaciones conservadoras para minimizar riesgo de quiebra.'}</p>
      </div>
    </div>`;

  calcBankroll();
}

function calcBankroll() {
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  const fmt      = document.getElementById('brm-format')?.value || 'Cash Game';
  const buyIn    = parseFloat(document.getElementById('brm-buyin')?.value || 0);
  const bankroll = parseFloat(document.getElementById('brm-bankroll')?.value || 0);
  const hintEl   = document.getElementById('brm-hint');
  if (hintEl) hintEl.textContent = BRM[fmt]?.hint || '';

  const resultEl = document.getElementById('brm-result');
  if (!resultEl) return;

  if (!buyIn || buyIn <= 0 || !bankroll || bankroll < 0) {
    resultEl.innerHTML = '';
    return;
  }

  const brm   = BRM[fmt] || BRM['Cash Game'];
  const numBi = bankroll / buyIn;

  // Estado
  let status, statusColor, statusIcon, statusMsg, recommendation;
  if (numBi < brm.moveDown) {
    status = isEN ? 'DANGER' : isPT ? 'PERIGO' : 'PELIGRO';
    statusColor = '#ef4444'; statusIcon = '🔴';
    statusMsg = isEN ? 'Insufficient bankroll. High risk of ruin.' : isPT ? 'Bankroll insuficiente. Alto risco de ruína.' : 'Bankroll insuficiente. Alto riesgo de quiebra.';
    recommendation = isEN
      ? `Move down in stakes. With $${bankroll.toFixed(0)} you should play buy-ins of at most $${(bankroll / brm.min).toFixed(2)}.`
      : isPT
      ? `Baixe de limite. Com $${bankroll.toFixed(0)} você deveria jogar buy-ins de no máximo $${(bankroll / brm.min).toFixed(2)}.`
      : `Baja de límites. Con $${bankroll.toFixed(0)} deberías jugar buy-ins de máximo $${(bankroll / brm.min).toFixed(2)}.`;
  } else if (numBi < brm.min) {
    status = isEN ? 'CAUTION' : isPT ? 'PRECAUÇÃO' : 'PRECAUCIÓN';
    statusColor = '#f97316'; statusIcon = '🟠';
    statusMsg = isEN ? 'Below the recommended minimum for this format.' : isPT ? 'Abaixo do mínimo recomendado para este formato.' : 'Por debajo del mínimo recomendado para este formato.';
    recommendation = isEN
      ? `You need at least $${(brm.min * buyIn).toFixed(0)} for ${brm.min} buy-ins. You're $${((brm.min * buyIn) - bankroll).toFixed(0)} short.`
      : isPT
      ? `Você precisa de pelo menos $${(brm.min * buyIn).toFixed(0)} para ${brm.min} buy-ins. Faltam $${((brm.min * buyIn) - bankroll).toFixed(0)}.`
      : `Necesitas al menos $${(brm.min * buyIn).toFixed(0)} para ${brm.min} buy-ins. Te faltan $${((brm.min * buyIn) - bankroll).toFixed(0)}.`;
  } else if (numBi < brm.safe) {
    status = isEN ? 'ACCEPTABLE' : isPT ? 'ACEITÁVEL' : 'ACEPTABLE';
    statusColor = '#fbbf24'; statusIcon = '🟡';
    statusMsg = isEN ? "You're at the minimum. You can play, but be careful." : isPT ? 'Estás no mínimo. Você pode jogar, mas com cuidado.' : 'Estás en el mínimo. Puedes jugar, pero con cuidado.';
    recommendation = isEN
      ? `For comfortable play you need ${brm.safe} buy-ins ($${(brm.safe * buyIn).toFixed(0)}). You're $${((brm.safe * buyIn) - bankroll).toFixed(0)} short.`
      : isPT
      ? `Para jogar confortável você precisa de ${brm.safe} buy-ins ($${(brm.safe * buyIn).toFixed(0)}). Faltam $${((brm.safe * buyIn) - bankroll).toFixed(0)}.`
      : `Para jugar cómodo necesitas ${brm.safe} buy-ins ($${(brm.safe * buyIn).toFixed(0)}). Te faltan $${((brm.safe * buyIn) - bankroll).toFixed(0)}.`;
  } else if (numBi < brm.comfortable) {
    status = isEN ? 'HEALTHY' : isPT ? 'SAUDÁVEL' : 'SALUDABLE';
    statusColor = '#4ade80'; statusIcon = '🟢';
    statusMsg = isEN ? 'Good bankroll for this format. Keep building.' : isPT ? 'Bom bankroll para este formato. Continue construindo.' : 'Buen bankroll para este formato. Sigue construyendo.';
    recommendation = isEN
      ? `To move up you need ${brm.comfortable} buy-ins ($${(brm.comfortable * buyIn).toFixed(0)}). You're $${((brm.comfortable * buyIn) - bankroll).toFixed(0)} short.`
      : isPT
      ? `Para subir de nível você precisa de ${brm.comfortable} buy-ins ($${(brm.comfortable * buyIn).toFixed(0)}). Faltam $${((brm.comfortable * buyIn) - bankroll).toFixed(0)}.`
      : `Para subir al siguiente nivel necesitas ${brm.comfortable} buy-ins ($${(brm.comfortable * buyIn).toFixed(0)}). Te faltan $${((brm.comfortable * buyIn) - bankroll).toFixed(0)}.`;
  } else {
    status = isEN ? 'EXCELLENT' : isPT ? 'EXCELENTE' : 'EXCELENTE';
    statusColor = '#4DB6AC'; statusIcon = '💎';
    statusMsg = isEN ? 'Solid bankroll! Ready to consider moving up in stakes.' : isPT ? 'Bankroll sólido! Pronto para considerar subir de limite.' : '¡Bankroll sólido! Listo para considerar subir de límites.';
    recommendation = isEN
      ? `With ${Math.floor(numBi)} buy-ins in ${fmt}, you have a very healthy cushion. Consider moving up if your win rate justifies it.`
      : isPT
      ? `Com ${Math.floor(numBi)} buy-ins em ${fmt}, você tem uma margem muito saudável. Considere subir de stake se seu win rate justificar.`
      : `Con ${Math.floor(numBi)} buy-ins en ${fmt}, tienes un colchón muy saludable. Considera subir al siguiente stake si tu win rate lo justifica.`;
  }

  // Riesgo de quiebra (simplificado)
  let rorText, rorColor;
  if (numBi < brm.moveDown)   { rorText = '> 60%'; rorColor = '#ef4444'; }
  else if (numBi < brm.min)   { rorText = '30–60%'; rorColor = '#f97316'; }
  else if (numBi < brm.safe)  { rorText = '10–30%'; rorColor = '#fbbf24'; }
  else if (numBi < brm.comfortable) { rorText = '5–10%'; rorColor = '#a3e635'; }
  else                         { rorText = '< 5%';  rorColor = '#4ade80'; }

  const neededForUp  = Math.max(0, (brm.comfortable * buyIn) - bankroll);

  resultEl.innerHTML = `
    <!-- Badge de estado -->
    <div style="background:var(--card);border:2px solid ${statusColor};border-radius:12px;padding:20px 24px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="font-size:2.4rem">${statusIcon}</div>
        <div style="flex:1">
          <div style="font-size:1.4rem;font-weight:800;color:${statusColor}">${status}</div>
          <div style="color:var(--text2);font-size:0.9rem;margin-top:2px">${statusMsg}</div>
        </div>
        <div style="text-align:center;min-width:80px">
          <div style="font-size:2rem;font-weight:800;color:${statusColor}">${Math.floor(numBi)}</div>
          <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase">buy-ins</div>
        </div>
      </div>
    </div>

    <!-- Detalle -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:16px">

      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">${isEN ? 'Risk of ruin' : isPT ? 'Risco de ruína' : 'Riesgo de quiebra'}</div>
        <div style="font-size:1.6rem;font-weight:800;color:${rorColor}">${rorText}</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${isEN ? 'Estimate assuming average play' : isPT ? 'Estimado, assumindo jogo médio' : 'Estimado, asumiendo juego promedio'}</div>
      </div>

      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">${isEN ? 'To move up' : isPT ? 'Para subir de limite' : 'Para subir de límite'}</div>
        <div style="font-size:1.6rem;font-weight:800;color:var(--accent)">
          ${neededForUp <= 0 ? (isEN ? 'Ready!' : isPT ? 'Pronto!' : '¡Listo!') : '+$' + neededForUp.toFixed(0)}
        </div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${brm.comfortable} buy-ins @ $${buyIn} = $${(brm.comfortable * buyIn).toFixed(0)}</div>
      </div>

      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">${isEN ? 'Move down if you reach' : isPT ? 'Baixar se chegar em' : 'Bajar si llegas a'}</div>
        <div style="font-size:1.6rem;font-weight:800;color:#f87171">$${(brm.moveDown * buyIn).toFixed(0)}</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${brm.moveDown} buy-ins — BRM stop-loss</div>
      </div>

    </div>

    <!-- Barra de progreso hacia el nivel "excelente" -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text3);margin-bottom:8px">
        <span>0 bi</span>
        <span style="color:#f97316">${brm.min} ${isEN ? 'min' : 'mín'}</span>
        <span style="color:#fbbf24">${brm.safe} ${isEN ? 'safe' : isPT ? 'seg' : 'seg'}</span>
        <span style="color:#4ade80">${brm.comfortable} ${isEN ? 'excellent' : 'excelente'}</span>
      </div>
      <div style="background:var(--border);border-radius:6px;height:12px;position:relative;overflow:hidden">
        <div style="position:absolute;left:0;top:0;height:100%;width:${Math.min(100, (numBi / brm.comfortable) * 100)}%;background:linear-gradient(90deg,#ef4444,#f97316,#fbbf24,#4ade80);border-radius:6px;transition:width 0.5s"></div>
        <!-- Markers -->
        <div style="position:absolute;top:0;left:${(brm.min/brm.comfortable)*100}%;height:100%;width:2px;background:#f97316;opacity:0.8"></div>
        <div style="position:absolute;top:0;left:${(brm.safe/brm.comfortable)*100}%;height:100%;width:2px;background:#fbbf24;opacity:0.8"></div>
      </div>
      <div style="text-align:center;margin-top:8px;font-size:0.8rem;color:var(--text2)">
        ${Math.floor(numBi)} / ${brm.comfortable} buy-ins (${Math.min(100, Math.round((numBi/brm.comfortable)*100))}% ${isEN ? 'of target' : isPT ? 'do objetivo' : 'del objetivo'})
      </div>
    </div>

    <!-- Recomendación -->
    <div style="background:#1e2d45;border-left:4px solid ${statusColor};padding:14px 18px;border-radius:0 8px 8px 0">
      <div style="font-size:0.78rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">💡 ${isEN ? 'Recommendation' : isPT ? 'Recomendação' : 'Recomendación'}</div>
      <p style="margin:0;color:#cbd5e1;font-size:0.92rem;line-height:1.6">${recommendation}</p>
    </div>`;
}
