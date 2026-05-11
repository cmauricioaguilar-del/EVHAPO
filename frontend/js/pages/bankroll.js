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
  const isPT = I18N.isPT();
  document.getElementById('app').innerHTML = `${renderNavbar()}
    <div style="max-width:720px;margin:32px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <button onclick="App.go('dashboard')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.2rem">←</button>
        <h2 style="margin:0;color:var(--accent)">💰 Calculadora de Bankroll</h2>
      </div>

      <!-- Formulario -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:24px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">

          <div>
            <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">Formato de juego</label>
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
              placeholder="Ej: 10">
            <div style="font-size:0.75rem;color:var(--text3);margin-top:4px">Ej: NL10 → $10 · NL25 → $25</div>
          </div>

          <div>
            <label style="font-size:0.78rem;color:var(--text3);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">Mi bankroll actual ($)</label>
            <input type="number" id="brm-bankroll" value="200" min="0" step="1" oninput="calcBankroll()"
              style="width:100%;box-sizing:border-box;background:var(--input);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text1);font-size:0.95rem"
              placeholder="Ej: 200">
          </div>

        </div>
      </div>

      <!-- Resultado -->
      <div id="brm-result"></div>

      <!-- Tabla de referencia -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-top:24px">
        <h3 style="margin:0 0 14px;color:var(--text2);font-size:0.9rem">📖 Guía de BRM por formato</h3>
        <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:420px;font-size:0.83rem">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              ${['Formato','Mínimo','Seguro','Para subir','Bajar si'].map(h =>
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
        <p style="margin:10px 0 0;color:var(--text3);font-size:0.75rem">bi = buy-ins · Recomendaciones conservadoras para minimizar riesgo de quiebra.</p>
      </div>
    </div>`;

  calcBankroll();
}

function calcBankroll() {
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
    status = 'PELIGRO';        statusColor = '#ef4444'; statusIcon = '🔴';
    statusMsg = 'Bankroll insuficiente. Alto riesgo de quiebra.';
    recommendation = `Baja de límites. Con $${bankroll.toFixed(0)} deberías jugar buy-ins de máximo $${(bankroll / brm.min).toFixed(2)}.`;
  } else if (numBi < brm.min) {
    status = 'PRECAUCIÓN';     statusColor = '#f97316'; statusIcon = '🟠';
    statusMsg = 'Por debajo del mínimo recomendado para este formato.';
    recommendation = `Necesitas al menos $${(brm.min * buyIn).toFixed(0)} para ${brm.min} buy-ins. Te faltan $${((brm.min * buyIn) - bankroll).toFixed(0)}.`;
  } else if (numBi < brm.safe) {
    status = 'ACEPTABLE';      statusColor = '#fbbf24'; statusIcon = '🟡';
    statusMsg = 'Estás en el mínimo. Puedes jugar, pero con cuidado.';
    recommendation = `Para jugar cómodo necesitas ${brm.safe} buy-ins ($${(brm.safe * buyIn).toFixed(0)}). Te faltan $${((brm.safe * buyIn) - bankroll).toFixed(0)}.`;
  } else if (numBi < brm.comfortable) {
    status = 'SALUDABLE';      statusColor = '#4ade80'; statusIcon = '🟢';
    statusMsg = 'Buen bankroll para este formato. Sigue construyendo.';
    recommendation = `Para subir al siguiente nivel necesitas ${brm.comfortable} buy-ins ($${(brm.comfortable * buyIn).toFixed(0)}). Te faltan $${((brm.comfortable * buyIn) - bankroll).toFixed(0)}.`;
  } else {
    status = 'EXCELENTE';      statusColor = '#4DB6AC'; statusIcon = '💎';
    statusMsg = '¡Bankroll sólido! Listo para considerar subir de límites.';
    recommendation = `Con ${Math.floor(numBi)} buy-ins en ${fmt}, tienes un colchón muy saludable. Considera subir al siguiente stake si tu win rate lo justifica.`;
  }

  // Riesgo de quiebra (simplificado)
  let rorText, rorColor;
  if (numBi < brm.moveDown)   { rorText = '> 60%'; rorColor = '#ef4444'; }
  else if (numBi < brm.min)   { rorText = '30–60%'; rorColor = '#f97316'; }
  else if (numBi < brm.safe)  { rorText = '10–30%'; rorColor = '#fbbf24'; }
  else if (numBi < brm.comfortable) { rorText = '5–10%'; rorColor = '#a3e635'; }
  else                         { rorText = '< 5%';  rorColor = '#4ade80'; }

  // ¿Cuánto para subir al siguiente nivel?
  const nextLevelBi  = brm.comfortable;
  const neededForUp  = Math.max(0, (nextLevelBi * buyIn) - bankroll);
  const nextBuyin    = buyIn * 2.5; // stake siguiente aproximado
  const safeNextBi   = brm.safe * nextBuyin;

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
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Riesgo de quiebra</div>
        <div style="font-size:1.6rem;font-weight:800;color:${rorColor}">${rorText}</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">Estimado, asumiendo juego promedio</div>
      </div>

      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Para subir de límite</div>
        <div style="font-size:1.6rem;font-weight:800;color:var(--accent)">
          ${neededForUp <= 0 ? '¡Listo!' : '+$' + neededForUp.toFixed(0)}
        </div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${brm.comfortable} buy-ins de $${buyIn} = $${(brm.comfortable * buyIn).toFixed(0)}</div>
      </div>

      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Bajar si llegas a</div>
        <div style="font-size:1.6rem;font-weight:800;color:#f87171">$${(brm.moveDown * buyIn).toFixed(0)}</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:2px">${brm.moveDown} buy-ins — stop-loss de BRM</div>
      </div>

    </div>

    <!-- Barra de progreso hacia el nivel "excelente" -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text3);margin-bottom:8px">
        <span>0 bi</span>
        <span style="color:#f97316">${brm.min} mín</span>
        <span style="color:#fbbf24">${brm.safe} seg</span>
        <span style="color:#4ade80">${brm.comfortable} excelente</span>
      </div>
      <div style="background:var(--border);border-radius:6px;height:12px;position:relative;overflow:hidden">
        <div style="position:absolute;left:0;top:0;height:100%;width:${Math.min(100, (numBi / brm.comfortable) * 100)}%;background:linear-gradient(90deg,#ef4444,#f97316,#fbbf24,#4ade80);border-radius:6px;transition:width 0.5s"></div>
        <!-- Markers -->
        <div style="position:absolute;top:0;left:${(brm.min/brm.comfortable)*100}%;height:100%;width:2px;background:#f97316;opacity:0.8"></div>
        <div style="position:absolute;top:0;left:${(brm.safe/brm.comfortable)*100}%;height:100%;width:2px;background:#fbbf24;opacity:0.8"></div>
      </div>
      <div style="text-align:center;margin-top:8px;font-size:0.8rem;color:var(--text2)">
        ${Math.floor(numBi)} / ${brm.comfortable} buy-ins (${Math.min(100, Math.round((numBi/brm.comfortable)*100))}% del objetivo)
      </div>
    </div>

    <!-- Recomendación -->
    <div style="background:#1e2d45;border-left:4px solid ${statusColor};padding:14px 18px;border-radius:0 8px 8px 0">
      <div style="font-size:0.78rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">💡 Recomendación</div>
      <p style="margin:0;color:#cbd5e1;font-size:0.92rem;line-height:1.6">${recommendation}</p>
    </div>`;
}
