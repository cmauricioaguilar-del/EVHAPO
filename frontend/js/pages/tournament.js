// ─── ANÁLISIS DE TORNEO ───────────────────────────────────────────────────────
// Tab del dashboard para subir historial de manos y obtener análisis IA

function renderTournamentTab() {
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  return `
    <div id="dtab-tournament" style="display:none">
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <span class="card-icon">🏆</span>
          <div>
            <h2>${isEN ? 'Hand Analysis' : isPT ? 'Análise de Mãos' : 'Análisis de Manos'}</h2>
            <div class="card-sub">${isEN ? 'Upload your hand history and the AI will analyse your best and worst decisions' : isPT ? 'Envie seu histórico de mãos e a IA analisará suas melhores e piores decisões' : 'Sube tu historial de manos y la IA analizará tus mejores y peores decisiones'}</div>
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
          <div style="font-weight:700;color:#e2e8f0;margin-bottom:6px">${isEN ? 'Drag your file here or click to select' : isPT ? 'Arraste seu arquivo aqui ou clique para selecionar' : 'Arrastra tu archivo aquí o haz clic para seleccionar'}</div>
          <div style="color:#64748b;font-size:0.85rem">${isEN ? 'Formats:' : 'Formatos:'} <strong style="color:#94a3b8">.zip</strong> ${isEN ? '(full export) or' : isPT ? '(exportação completa) ou' : '(exportación completa) o'} <strong style="color:#94a3b8">.txt</strong> ${isEN ? '(hand history)' : isPT ? '(histórico de mãos)' : '(historial de manos)'}</div>
          <div style="color:#64748b;font-size:0.78rem;margin-top:6px">${isEN ? 'Maximum 10 MB · One file per analysis' : isPT ? 'Máximo 10 MB · Um arquivo por análise' : 'Máximo 10 MB · Un solo archivo por análisis'}</div>
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
            <button class="btn btn-secondary btn-sm" onclick="tournClearFile()" style="padding:6px 12px">✕ ${isEN ? 'Remove' : isPT ? 'Remover' : 'Quitar'}</button>
          </div>
        </div>

        <!-- Instrucciones -->
        <div style="margin-top:16px;padding:14px;background:rgba(59,130,246,0.06);border-radius:8px;border:1px solid rgba(59,130,246,0.15)">
          <div style="font-size:0.82rem;color:#94a3b8;line-height:1.7">
            <strong style="color:#3b82f6">${isEN ? 'How to export the history?' : isPT ? 'Como exportar o histórico?' : '¿Cómo exportar el historial?'}</strong><br>
            🟢 <strong>GGPoker</strong>: ${isEN ? 'Lobby → My Account → Hand History → Export by tournament (.zip)' : isPT ? 'Lobby → Minha conta → Histórico de mãos → Exportar por torneio (.zip)' : 'Lobby → Mi cuenta → Historial de manos → Exportar por torneo (.zip)'}<br>
            🟣 <strong>PokerStars</strong>: ${isEN ? 'Lobby → Request Hand History → Export .txt' : isPT ? 'Lobby → Solicitar histórico de mãos → Exportar .txt' : 'Lobby → Solicitar historial de manos → Exportar .txt'}<br>
            🔵 <strong>ACR / 888 / WPT</strong>: ${isEN ? 'My Account → History → Export (.txt or .zip)' : isPT ? 'Minha conta → Histórico → Exportar (.txt ou .zip)' : 'Mi cuenta → Historial → Exportar (.txt o .zip)'}
          </div>
        </div>

        <!-- Botón analizar -->
        <div style="margin-top:20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <button id="tourn-analyze-btn" class="btn btn-primary" onclick="tournAnalyze()" disabled style="opacity:0.5">
            🤖 ${isEN ? 'Analyse hands with AI' : isPT ? 'Analisar mãos com IA' : 'Analizar manos con IA'}
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
  const _isEN = I18N.isEN();
  const _isPT = I18N.isPT();
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['zip','txt'].includes(ext)) {
    alert(_isEN ? 'Only .zip or .txt files are accepted.' : _isPT ? 'Apenas arquivos .zip ou .txt são aceitos.' : 'Solo se aceptan archivos .zip o .txt');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert(_isEN ? 'The file exceeds the 10 MB limit.' : _isPT ? 'O arquivo excede o limite de 10 MB.' : 'El archivo supera el límite de 10 MB.');
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
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  resultEl.innerHTML = `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-icon">🏆</span>
        <div>
          <h2 style="margin:0">${data.meta?.tournament_name || (isEN ? 'Hand Analysis' : isPT ? 'Análise de Mãos' : 'Análisis de Manos')}</h2>
          <div class="card-sub">${data.meta?.platform || ''} · ${data.meta?.date?.slice(0,10) || ''} · Buy-in: ${data.meta?.buy_in || 'N/A'}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <span style="background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.3);color:#d4af37;padding:6px 14px;border-radius:6px;font-size:0.82rem">
            🃏 ${data.meta?.total_hands || 0} ${isEN ? 'total hands' : isPT ? 'mãos totais' : 'manos totales'} · ${data.meta?.hero_hands || 0} ${isEN ? 'played' : isPT ? 'jogadas' : 'jugadas'}
          </span>
          <button class="btn btn-primary btn-sm" onclick="tournDownloadPDF()">📄 ${isEN ? 'Download PDF' : isPT ? 'Baixar PDF' : 'Descargar PDF'}</button>
        </div>
      </div>
      <div id="tourn-report-content">
        ${data.report}
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
      <button class="btn btn-secondary btn-sm" onclick="tournClearFile()">🔄 ${isEN ? 'Analyse other hands' : isPT ? 'Analisar outras mãos' : 'Analizar otras manos'}</button>
      <button class="btn btn-primary btn-sm"   onclick="tournDownloadPDF()">📄 ${isEN ? 'Download PDF' : isPT ? 'Baixar PDF' : 'Descargar PDF'}</button>
    </div>`;
}

function _tournShowError(msg) {
  const resultEl = document.getElementById('tourn-result');
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  resultEl.innerHTML = `
    <div class="form-error" style="margin:0">
      ❌ ${msg}
      <div style="margin-top:8px;font-size:0.85rem;color:#94a3b8">${isEN ? 'Check that the file contains valid tournament hands and try again.' : isPT ? 'Verifique se o arquivo contém mãos de torneio válidas e tente novamente.' : 'Verifica que el archivo contenga manos de torneo válidas y vuelve a intentarlo.'}</div>
    </div>`;
}

function _tournStopPolling() {
  if (_tournPollTimer) { clearInterval(_tournPollTimer); _tournPollTimer = null; }
  const btn = document.getElementById('tourn-analyze-btn');
  const _isEN = I18N.isEN();
  const _isPT = I18N.isPT();
  if (btn) { btn.disabled = false; btn.textContent = `🤖 ${_isEN ? 'Analyse hands with AI' : _isPT ? 'Analisar mãos com IA' : 'Analizar manos con IA'}`; btn.style.opacity = '1'; }
}

async function _tournPoll(jobId, meta) {
  _tournSeconds += 4;
  const elapsed = _tournSeconds;
  const _isEN = I18N.isEN();
  const _isPT = I18N.isPT();
  // Actualizar texto del spinner con tiempo transcurrido
  const p = document.querySelector('#tourn-result .spinner-msg');
  if (p) p.textContent = `${_isEN ? 'The AI is analysing your tournament…' : _isPT ? 'A IA está analisando seu torneio…' : 'La IA está analizando tu torneo…'} (${elapsed}s)`;

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
      const _isEN2 = I18N.isEN();
      const _isPT2 = I18N.isPT();
      _tournShowError(data.error || (_isEN2 ? 'Error generating the analysis.' : _isPT2 ? 'Erro ao gerar a análise.' : 'Error al generar el análisis.'));
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

  const _isEN2 = I18N.isEN();
  const _isPT2 = I18N.isPT();
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.textContent = `⏳ ${_isEN2 ? 'Uploading file...' : _isPT2 ? 'Enviando arquivo...' : 'Enviando archivo...'}`;

  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="card" style="text-align:center;padding:48px 20px">
      <div class="spinner" style="margin:0 auto 20px"></div>
      <p class="spinner-msg" style="color:#94a3b8;font-size:1rem;margin-bottom:8px">${_isEN2 ? 'Uploading file and preparing analysis…' : _isPT2 ? 'Enviando arquivo e preparando análise…' : 'Subiendo archivo y preparando análisis…'}</p>
      <p style="color:#64748b;font-size:0.85rem">${_isEN2 ? 'The AI will read each hand and evaluate your decisions. This may take 1–3 minutes.' : _isPT2 ? 'A IA lerá cada mão e avaliará suas decisões. Isso pode levar 1-3 minutos.' : 'La IA leerá cada mano y evaluará tus decisiones. Esto puede tardar 1-3 minutos.'}</p>
      <div style="margin-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        ${(
          _isEN2
            ? ['📂 Reading file','🃏 Processing hands','🤖 Analysing with AI','📊 Generating report']
            : _isPT2
            ? ['📂 Lendo arquivo','🃏 Processando mãos','🤖 Analisando com IA','📊 Gerando relatório']
            : ['📂 Leyendo archivo','🃏 Parseando manos','🤖 Analizando con IA','📊 Generando reporte']
        ).map(s => `<span style="font-size:0.8rem;color:#64748b;padding:4px 10px;background:#1a2235;border-radius:20px">${s}</span>`).join('')}
      </div>
    </div>`;

  try {
    const token = localStorage.getItem('evhapo_token');
    const form  = new FormData();
    form.append('file', _tournFile);
    form.append('lang', I18N.lang);

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

    btn.textContent = `⏳ ${_isEN2 ? 'Analysing...' : _isPT2 ? 'Analisando...' : 'Analizando...'}`;
    _tournSeconds = 0;

    // Actualizar spinner con meta del torneo
    const spinnerMsg = document.querySelector('#tourn-result .spinner-msg');
    if (spinnerMsg) spinnerMsg.textContent = `${_isEN2 ? 'Analysing' : _isPT2 ? 'Analisando' : 'Analizando'} ${data.meta?.tournament_name || (_isEN2 ? 'hands' : _isPT2 ? 'mãos' : 'manos')}…`;

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
  const isEN = I18N.isEN();
  const isPT = I18N.isPT();
  const reportEl = document.getElementById('tourn-report-content');
  if (!reportEl) {
    alert(isEN ? 'Generate the analysis first.' : isPT ? 'Gere a análise primeiro.' : 'Primero genera el análisis.');
    return;
  }

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
    const pdfTitle = isEN ? 'MindEV-IA — Hand Analysis' : isPT ? 'MindEV-IA — Análise de Mãos' : 'MindEV-IA — Análisis de Manos';
    pdf.text(pdfTitle, pageW / 2, 12, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    const metaEl = document.querySelector('#tourn-result .card-sub');
    const dateLocale = isEN ? 'en-GB' : isPT ? 'pt-BR' : 'es-ES';
    pdf.text(metaEl ? metaEl.textContent.trim() : new Date().toLocaleDateString(dateLocale), pageW / 2, 22, { align: 'center' });

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
    const fileLabel = isEN ? 'Hands' : isPT ? 'Maos' : 'Manos';
    pdf.save(`MindEV_${fileLabel}_${new Date().toISOString().slice(0,10)}.pdf`);
  } catch (e) {
    reportEl.style.background = origBg;
    const errMsg = isEN ? 'Error generating PDF: ' : isPT ? 'Erro ao gerar o PDF: ' : 'Error generando PDF: ';
    alert(errMsg + e.message);
  }
}
