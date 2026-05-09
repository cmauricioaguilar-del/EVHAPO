// ─── ANÁLISIS DE TORNEO ───────────────────────────────────────────────────────
// Tab del dashboard para subir historial de manos y obtener análisis IA

function renderTournamentTab() {
  return `
    <div id="dtab-tournament" style="display:none">
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <span class="card-icon">🏆</span>
          <div>
            <h2>Análisis de Torneo</h2>
            <div class="card-sub">Sube tu historial de manos y la IA analizará tus mejores y peores decisiones</div>
          </div>
        </div>

        <!-- Plataformas soportadas -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
          ${['GGPoker','PokerStars','ACR','888poker','WPT Global','Coolbet'].map(p =>
            `<span style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);color:#d4af37;padding:4px 12px;border-radius:20px;font-size:0.78rem;font-weight:600">${p}</span>`
          ).join('')}
        </div>

        <!-- Zona de upload -->
        <div id="tourn-upload-area"
          style="border:2px dashed rgba(212,175,55,0.4);border-radius:12px;padding:40px 24px;text-align:center;cursor:pointer;transition:all 0.2s;background:rgba(212,175,55,0.03)"
          ondragover="tournDragOver(event)"
          ondragleave="tournDragLeave(event)"
          ondrop="tournDrop(event)"
          onclick="document.getElementById('tourn-file-input').click()">
          <div style="font-size:3rem;margin-bottom:12px">📂</div>
          <div style="font-weight:700;color:#e2e8f0;margin-bottom:6px">Arrastra tu archivo aquí o haz clic para seleccionar</div>
          <div style="color:#64748b;font-size:0.85rem">Formatos: <strong style="color:#94a3b8">.zip</strong> (exportación completa) o <strong style="color:#94a3b8">.txt</strong> (historial de manos)</div>
          <div style="color:#64748b;font-size:0.78rem;margin-top:6px">Máximo 10 MB · Un solo archivo por análisis</div>
          <input type="file" id="tourn-file-input" accept=".zip,.txt" style="display:none" onchange="tournFileSelected(this)">
        </div>

        <!-- Info del archivo seleccionado -->
        <div id="tourn-file-info" style="display:none;margin-top:14px">
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px">
            <span style="font-size:1.4rem">📄</span>
            <div style="flex:1">
              <div id="tourn-file-name" style="font-weight:700;color:#22c55e"></div>
              <div id="tourn-file-size" style="font-size:0.8rem;color:#64748b"></div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="tournClearFile()" style="padding:6px 12px">✕ Quitar</button>
          </div>
        </div>

        <!-- Instrucciones -->
        <div style="margin-top:16px;padding:14px;background:rgba(59,130,246,0.06);border-radius:8px;border:1px solid rgba(59,130,246,0.15)">
          <div style="font-size:0.82rem;color:#94a3b8;line-height:1.7">
            <strong style="color:#3b82f6">¿Cómo exportar el historial?</strong><br>
            🟢 <strong>GGPoker</strong>: Lobby → Mi cuenta → Historial de manos → Exportar por torneo (.zip)<br>
            🟣 <strong>PokerStars</strong>: Lobby → Solicitar historial de manos → Exportar .txt<br>
            🔵 <strong>ACR / 888 / WPT</strong>: Mi cuenta → Historial → Exportar (.txt o .zip)
          </div>
        </div>

        <!-- Botón analizar -->
        <div style="margin-top:20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <button id="tourn-analyze-btn" class="btn btn-primary" onclick="tournAnalyze()" disabled style="opacity:0.5">
            🤖 Analizar torneo con IA
          </button>
        </div>
      </div>

      <!-- Resultado del análisis -->
      <div id="tourn-result" style="display:none"></div>
    </div>`;
}

// ─── Estado del upload ────────────────────────────────────────────────────────
let _tournFile = null;

function tournDragOver(e) {
  e.preventDefault();
  document.getElementById('tourn-upload-area').style.borderColor = '#d4af37';
  document.getElementById('tourn-upload-area').style.background  = 'rgba(212,175,55,0.07)';
}
function tournDragLeave(e) {
  document.getElementById('tourn-upload-area').style.borderColor = 'rgba(212,175,55,0.4)';
  document.getElementById('tourn-upload-area').style.background  = 'rgba(212,175,55,0.03)';
}
function tournDrop(e) {
  e.preventDefault();
  tournDragLeave(e);
  const file = e.dataTransfer.files[0];
  if (file) _tournSetFile(file);
}
function tournFileSelected(input) {
  if (input.files[0]) _tournSetFile(input.files[0]);
}
function _tournSetFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['zip','txt'].includes(ext)) {
    alert('Solo se aceptan archivos .zip o .txt');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('El archivo supera el límite de 10 MB.');
    return;
  }
  _tournFile = file;
  document.getElementById('tourn-file-name').textContent = file.name;
  document.getElementById('tourn-file-size').textContent = (file.size / 1024).toFixed(0) + ' KB';
  document.getElementById('tourn-file-info').style.display = 'block';
  document.getElementById('tourn-upload-area').style.display = 'none';
  const btn = document.getElementById('tourn-analyze-btn');
  btn.disabled = false;
  btn.style.opacity = '1';
}
function tournClearFile() {
  _tournFile = null;
  document.getElementById('tourn-file-info').style.display  = 'none';
  document.getElementById('tourn-upload-area').style.display = 'block';
  document.getElementById('tourn-file-input').value          = '';
  const btn = document.getElementById('tourn-analyze-btn');
  btn.disabled = true;
  btn.style.opacity = '0.5';
  document.getElementById('tourn-result').style.display = 'none';
}

// ─── Análisis ─────────────────────────────────────────────────────────────────
let _tournPollTimer = null;
let _tournSeconds   = 0;

function _tournShowResult(data) {
  const resultEl = document.getElementById('tourn-result');
  resultEl.innerHTML = `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-icon">🏆</span>
        <div>
          <h2 style="margin:0">${data.meta?.tournament_name || 'Torneo'}</h2>
          <div class="card-sub">${data.meta?.platform || ''} · ${data.meta?.date?.slice(0,10) || ''} · Buy-in: ${data.meta?.buy_in || 'N/D'}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <span style="background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.3);color:#d4af37;padding:6px 14px;border-radius:6px;font-size:0.82rem">
            🃏 ${data.meta?.total_hands || 0} manos totales · ${data.meta?.hero_hands || 0} jugadas
          </span>
          <button class="btn btn-primary btn-sm" onclick="tournDownloadPDF()">📄 Descargar PDF</button>
        </div>
      </div>
      <div id="tourn-report-content">
        ${data.report}
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
      <button class="btn btn-secondary btn-sm" onclick="tournClearFile()">🔄 Analizar otro torneo</button>
      <button class="btn btn-primary btn-sm"   onclick="tournDownloadPDF()">📄 Descargar PDF</button>
    </div>`;
}

function _tournShowError(msg) {
  const resultEl = document.getElementById('tourn-result');
  resultEl.innerHTML = `
    <div class="form-error" style="margin:0">
      ❌ ${msg}
      <div style="margin-top:8px;font-size:0.85rem;color:#94a3b8">Verifica que el archivo contenga manos de torneo válidas y vuelve a intentarlo.</div>
    </div>`;
}

function _tournStopPolling() {
  if (_tournPollTimer) { clearInterval(_tournPollTimer); _tournPollTimer = null; }
  const btn = document.getElementById('tourn-analyze-btn');
  if (btn) { btn.disabled = false; btn.textContent = '🤖 Analizar torneo con IA'; btn.style.opacity = '1'; }
}

async function _tournPoll(jobId, meta) {
  _tournSeconds += 4;
  const elapsed = _tournSeconds;
  // Actualizar texto del spinner con tiempo transcurrido
  const p = document.querySelector('#tourn-result .spinner-msg');
  if (p) p.textContent = `La IA está analizando tu torneo… (${elapsed}s)`;

  try {
    const token = localStorage.getItem('evhapo_token');
    const res = await fetch(`/api/tournament/status/${jobId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.status === 'done') {
      _tournStopPolling();
      _tournShowResult(data);
    } else if (data.status === 'error') {
      _tournStopPolling();
      _tournShowError(data.error || 'Error al generar el análisis.');
    }
    // Si status === 'processing', seguir esperando
  } catch (err) {
    // Error de red — seguir intentando
    console.warn('[poll] error temporal:', err.message);
  }
}

async function tournAnalyze() {
  if (!_tournFile) return;

  const btn = document.getElementById('tourn-analyze-btn');
  const resultEl = document.getElementById('tourn-result');

  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.textContent = '⏳ Enviando archivo...';

  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="card" style="text-align:center;padding:48px 20px">
      <div class="spinner" style="margin:0 auto 20px"></div>
      <p class="spinner-msg" style="color:#94a3b8;font-size:1rem;margin-bottom:8px">Subiendo archivo y preparando análisis…</p>
      <p style="color:#64748b;font-size:0.85rem">La IA leerá cada mano y evaluará tus decisiones. Esto puede tardar 1-3 minutos.</p>
      <div style="margin-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        ${['📂 Leyendo archivo','🃏 Parseando manos','🤖 Analizando con IA','📊 Generando reporte'].map(s =>
          `<span style="font-size:0.8rem;color:#64748b;padding:4px 10px;background:#1a2235;border-radius:20px">${s}</span>`
        ).join('')}
      </div>
    </div>`;

  try {
    const token = localStorage.getItem('evhapo_token');
    const form  = new FormData();
    form.append('file', _tournFile);

    const res = await fetch('/api/tournament/analyze', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body:    form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Error ${res.status}`);
    }

    const data = await res.json();
    const jobId = data.job_id;

    btn.textContent = '⏳ Analizando...';
    _tournSeconds = 0;

    // Actualizar spinner con meta del torneo
    const spinnerMsg = document.querySelector('#tourn-result .spinner-msg');
    if (spinnerMsg) spinnerMsg.textContent = `Analizando ${data.meta?.tournament_name || 'torneo'}…`;

    // Iniciar polling cada 4 segundos
    if (_tournPollTimer) clearInterval(_tournPollTimer);
    _tournPollTimer = setInterval(() => _tournPoll(jobId, data.meta), 4000);

  } catch (err) {
    _tournShowError(err.message);
    _tournStopPolling();
  }
}

// ─── Descargar PDF del análisis de torneo ────────────────────────────────────
async function tournDownloadPDF() {
  const reportEl = document.getElementById('tourn-report-content');
  if (!reportEl) { alert('Primero genera el análisis.'); return; }

  const { jsPDF } = window.jspdf;
  const origBg = reportEl.style.background;
  reportEl.style.background = '#111827';

  try {
    const canvas = await html2canvas(reportEl, {
      scale: 1.5, backgroundColor: '#111827', useCORS: true, logging: false,
    });
    reportEl.style.background = origBg;

    const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Cabecera
    pdf.setFillColor(10, 14, 26);
    pdf.rect(0, 0, pageW, 32, 'F');
    pdf.setTextColor(212, 175, 55);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MindEV — Análisis de Torneo', pageW / 2, 12, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    const meta = document.querySelector('#tourn-result .card-sub');
    pdf.text(meta ? meta.textContent.trim() : new Date().toLocaleDateString('es-ES'), pageW / 2, 22, { align: 'center' });

    // Contenido paginado
    const ratio = (pageW - 20) / canvas.width;
    let yPos = 36, srcY = 0, remaining = canvas.height * ratio;
    while (remaining > 0) {
      const avail   = pageH - yPos - 10;
      const sliceH  = Math.min(remaining, avail);
      const srcH    = sliceH / ratio;
      const sl      = document.createElement('canvas');
      sl.width  = canvas.width;
      sl.height = srcH;
      sl.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
      pdf.addImage(sl.toDataURL('image/png'), 'PNG', 10, yPos, pageW - 20, sliceH);
      remaining -= sliceH; srcY += srcH;
      if (remaining > 0) { pdf.addPage(); yPos = 10; }
    }
    pdf.save(`MindEV_Torneo_${new Date().toISOString().slice(0,10)}.pdf`);
  } catch (e) {
    reportEl.style.background = origBg;
    alert('Error generando PDF: ' + e.message);
  }
}
