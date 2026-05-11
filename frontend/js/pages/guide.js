// ──────────────────────────────────────────────
//  MindEV-IA — Instructivo / Guía de uso
// ──────────────────────────────────────────────

const GUIDE_STEPS = [
  {
    num: 1,
    icon: '🧠',
    titleES: 'Test Mental',
    titlePT: 'Teste Mental',
    descES: 'Diagnostica tus fugas psicológicas: tilt, disciplina, gestión emocional y concentración. ~20 min.',
    descPT: 'Diagnostica suas fugas psicológicas: tilt, disciplina, gestão emocional e concentração. ~20 min.',
    color: '#818cf8',
    action: "startNewTest('mental')",
    btnES: 'Iniciar →',
    btnPT: 'Iniciar →',
  },
  {
    num: 2,
    icon: '⚙️',
    titleES: 'Test Técnico',
    titlePT: 'Teste Técnico',
    descES: 'Evalúa tu dominio de Hold\'em: preflop, postflop, posición, rangos y análisis de spots. ~20 min.',
    descPT: 'Avalia seu domínio de Hold\'em: pré-flop, pós-flop, posição, ranges e análise de spots. ~20 min.',
    color: '#d4af37',
    action: "startNewTest('technical')",
    btnES: 'Iniciar →',
    btnPT: 'Iniciar →',
  },
  {
    num: 3,
    icon: '🧬',
    titleES: 'Perfil IA',
    titlePT: 'Perfil IA',
    descES: 'Genera tu análisis integral correlacionando ambos tests. La IA identifica tu arquetipo de jugador y brechas clave.',
    descPT: 'Gera sua análise integral correlacionando ambos os testes. A IA identifica seu arquétipo e lacunas principais.',
    color: '#4DB6AC',
    action: null,
    noteES: 'Disponible después de completar ambos tests',
    notePT: 'Disponível após completar ambos os testes',
  },
  {
    num: 4,
    icon: '📚',
    titleES: 'Plan de Estudio',
    titlePT: 'Plano de Estudo',
    descES: 'Obtén un plan personalizado de 4 semanas con objetivos, ejercicios y recursos adaptados a tus brechas.',
    descPT: 'Obtenha um plano personalizado de 4 semanas com objetivos, exercícios e recursos adaptados às suas lacunas.',
    color: '#818cf8',
    action: "App.go('study-plan')",
    btnES: 'Ver plan →',
    btnPT: 'Ver plano →',
  },
  {
    num: 5,
    icon: '🃏',
    titleES: 'Análisis de Manos',
    titlePT: 'Análise de Mãos',
    descES: 'Sube historiales de torneos (archivos .txt) para que la IA analice tus spots y detecte patrones de error.',
    descPT: 'Envie históricos de torneios (arquivos .txt) para que a IA analise seus spots e detecte padrões de erro.',
    color: '#f472b6',
    action: null,
    noteES: 'Desde el Dashboard → pestaña Torneo',
    notePT: 'No Dashboard → aba Torneio',
  },
  {
    num: 6,
    icon: '📊',
    titleES: 'Tracker + Bankroll',
    titlePT: 'Tracker + Bankroll',
    descES: 'Registra tus sesiones, analiza tu curva de resultados y verifica si tu bankroll soporta tus stakes actuales.',
    descPT: 'Registre suas sessões, analise sua curva de resultados e verifique se seu bankroll suporta seus stakes atuais.',
    color: '#4ade80',
    action: "App.go('sessions')",
    btnES: 'Ver sesiones →',
    btnPT: 'Ver sessões →',
  },
  {
    num: 7,
    icon: '🔄',
    titleES: 'Retest en 30 días',
    titlePT: 'Reteste em 30 dias',
    descES: 'Repite ambos tests después de trabajar el plan. Activa la pestaña Evolución para medir tu progreso real.',
    descPT: 'Repita ambos testes após trabalhar o plano. Ative a aba Evolução para medir seu progresso real.',
    color: '#fb923c',
    action: null,
    noteES: 'El tab Evolución aparece automáticamente',
    notePT: 'A aba Evolução aparece automaticamente',
  },
];

function showGuide() {
  if (document.getElementById('guide-modal')) return;
  const isPT = I18N.isPT();

  const stepsHtml = GUIDE_STEPS.map((s, i) => {
    const isLast = i === GUIDE_STEPS.length - 1;
    const title  = isPT ? s.titlePT : s.titleES;
    const desc   = isPT ? s.descPT  : s.descES;
    const note   = isPT ? s.notePT  : s.noteES;
    const btn    = isPT ? s.btnPT   : s.btnES;

    const connectorLine = !isLast
      ? `<div style="display:flex;justify-content:center;margin:0 auto;height:20px;width:2px;background:linear-gradient(to bottom,${s.color}55,${GUIDE_STEPS[i+1].color}55)"></div>`
      : '';

    return `
      <div style="display:flex;gap:14px;align-items:flex-start">
        <!-- Número circular -->
        <div style="flex-shrink:0;width:38px;height:38px;border-radius:50%;background:${s.color}22;border:2px solid ${s.color};display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:800;color:${s.color}">${s.num}</div>
        <!-- Contenido -->
        <div style="flex:1;padding-bottom:4px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:1.1rem">${s.icon}</span>
            <span style="font-weight:700;color:var(--text1);font-size:0.95rem">${title}</span>
            ${s.action && btn ? `<button onclick="${s.action};hideGuide()" style="margin-left:auto;background:${s.color}22;border:1px solid ${s.color};color:${s.color};border-radius:6px;padding:3px 10px;font-size:0.75rem;cursor:pointer;font-weight:600">${btn}</button>` : ''}
          </div>
          <p style="margin:0;color:var(--text3);font-size:0.82rem;line-height:1.45">${desc}</p>
          ${note ? `<span style="display:inline-block;margin-top:4px;font-size:0.75rem;color:var(--text3);background:rgba(255,255,255,0.05);border-radius:4px;padding:2px 7px">💡 ${note}</span>` : ''}
        </div>
      </div>
      ${connectorLine}`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'guide-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);padding:16px;backdrop-filter:blur(4px)';
  modal.innerHTML = `
    <div id="guide-card" style="background:var(--card);border:1px solid var(--border);border-radius:16px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.6)">
      <!-- Header -->
      <div style="position:sticky;top:0;z-index:2;background:var(--card);border-bottom:1px solid var(--border);padding:18px 22px 14px;border-radius:16px 16px 0 0">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <h2 style="margin:0;font-size:1.1rem;font-weight:800;color:var(--accent)">${isPT ? '📖 Como usar o MindEV-IA' : '📖 Cómo usar MindEV-IA'}</h2>
            <p style="margin:4px 0 0;font-size:0.78rem;color:var(--text3)">${isPT ? 'Fluxo recomendado para máxima melhoria' : 'Flujo recomendado para máxima mejora'}</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button onclick="downloadGuidePDF()" title="${isPT ? 'Baixar PDF' : 'Descargar PDF'}"
              style="background:rgba(212,175,55,0.12);border:1px solid var(--accent);color:var(--accent);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.8rem;font-weight:600">
              PDF
            </button>
            <button onclick="hideGuide()"
              style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 10px;cursor:pointer;color:var(--text2);font-size:0.9rem">✕</button>
          </div>
        </div>
      </div>
      <!-- Steps -->
      <div id="guide-steps-inner" style="padding:20px 22px 24px">
        ${stepsHtml}
      </div>
    </div>`;

  modal.addEventListener('click', e => { if (e.target === modal) hideGuide(); });
  document.body.appendChild(modal);
}

function hideGuide() {
  const m = document.getElementById('guide-modal');
  if (m) m.remove();
}

function downloadGuidePDF() {
  const isPT = I18N.isPT();
  if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
    alert(isPT ? 'Biblioteca PDF não disponível.' : 'Librería PDF no disponible.');
    return;
  }
  const { jsPDF } = window.jspdf || window;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, margin = 18;
  let y = 20;

  // Título
  doc.setFillColor(22, 22, 30);
  doc.rect(0, 0, W, 32, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(212, 175, 55);
  doc.text('MindEV-IA', margin, 14);
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text(isPT ? 'Guia de uso — Fluxo recomendado' : 'Instructivo de uso — Flujo recomendado', margin, 22);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('mindev-ia.cl', W - margin, 22, { align: 'right' });
  y = 42;

  const colors = {
    '#818cf8': [129, 140, 248],
    '#d4af37': [212, 175, 55],
    '#4DB6AC': [77, 182, 172],
    '#f472b6': [244, 114, 182],
    '#4ade80': [74, 222, 128],
    '#fb923c': [251, 146, 60],
  };

  GUIDE_STEPS.forEach((s, i) => {
    const title = isPT ? s.titlePT : s.titleES;
    const desc  = isPT ? s.descPT  : s.descES;
    const note  = isPT ? s.notePT  : s.noteES;
    const rgb   = colors[s.color] || [212, 175, 55];

    const cardH = note ? 30 : 26;
    if (y + cardH > 275) { doc.addPage(); y = 20; }

    // Card background
    doc.setFillColor(28, 28, 38);
    doc.roundedRect(margin, y, W - margin * 2, cardH, 3, 3, 'F');

    // Accent left bar
    doc.setFillColor(...rgb);
    doc.roundedRect(margin, y, 3, cardH, 1, 1, 'F');

    // Step number circle
    doc.setFillColor(...rgb.map(v => Math.round(v * 0.25)));
    doc.circle(margin + 12, y + cardH / 2, 5, 'F');
    doc.setTextColor(...rgb);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(String(s.num), margin + 12, y + cardH / 2 + 2.5, { align: 'center' });

    // Title  (sin emoji — jsPDF solo soporta Latin)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...rgb);
    doc.text(title, margin + 21, y + 9);

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(190, 190, 190);
    const lines = doc.splitTextToSize(desc, W - margin * 2 - 24);
    doc.text(lines, margin + 21, y + 16);

    // Note  (reemplaza 💡 por > )
    if (note) {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(`> ${note}`, margin + 21, y + 26);
    }

    y += cardH + 5;

    // Connector (caracter ASCII puro)
    if (i < GUIDE_STEPS.length - 1) {
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.text('|', W / 2, y - 1, { align: 'center' });
    }
  });

  // Footer
  doc.setFillColor(22, 22, 30);
  doc.rect(0, 282, W, 15, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const footerTxt = isPT
    ? 'MindEV-IA © 2025 — Plataforma de diagnóstico para jogadores de Texas Hold\'em'
    : 'MindEV-IA © 2025 — Plataforma de diagnóstico para jugadores de Texas Hold\'em';
  doc.text(footerTxt, W / 2, 289, { align: 'center' });

  doc.save(isPT ? 'guia-mindev-ia.pdf' : 'instructivo-mindev-ia.pdf');
}
