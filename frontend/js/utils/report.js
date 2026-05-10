// ─── Diagnóstico de texto personalizado por score ─────────────────────────────

function getDiagnosis(pct) {
  const isPT = (typeof I18N !== 'undefined') && I18N.isPT();
  if (pct >= 80) return {
    tag:  isPT ? '✅ FORÇA'      : '✅ FORTALEZA',
    cls:  'diag-ok',
    text: isPT ? 'Habilidade consolidada. Mantenha suas rotinas atuais.'
               : 'Habilidad consolidada. Mantén tus rutinas actuales.',
  };
  if (pct >= 60) return {
    tag:  isPT ? '🟡 MELHORÁVEL' : '🟡 MEJORABLE',
    cls:  'diag-warn',
    text: isPT ? 'Base sólida com margem de crescimento. Pequenos ajustes geram grandes avanços.'
               : 'Base sólida con margen de crecimiento. Pequeños ajustes generan grandes avances.',
  };
  if (pct >= 40) return {
    tag:  isPT ? '🟠 IMPORTANTE' : '🟠 IMPORTANTE',
    cls:  'diag-important',
    text: isPT ? 'Lacuna significativa que afeta seu desempenho. Requer trabalho sistemático.'
               : 'Brecha significativa que afecta tu rendimiento. Requiere trabajo sistemático.',
  };
  return {
    tag:  isPT ? '🔴 CRÍTICO'   : '🔴 CRÍTICO',
    cls:  'diag-critical',
    text: isPT ? 'Área de alto impacto negativo. É sua prioridade nº 1 de melhoria imediata.'
               : 'Área de alto impacto negativo. Es tu prioridad #1 de mejora inmediata.',
  };
}

function getPhase(idx) {
  const isPT = (typeof I18N !== 'undefined') && I18N.isPT();
  if (idx === 0) return { phase: isPT ? 'FASE 1' : 'FASE 1', weeks: isPT ? 'Semanas 1–4' : 'Semanas 1–4', priority: isPT ? 'PRIORIDADE MÁXIMA'  : 'PRIORIDAD MÁXIMA' };
  if (idx === 1) return { phase: isPT ? 'FASE 1' : 'FASE 1', weeks: isPT ? 'Semanas 1–4' : 'Semanas 1–4', priority: isPT ? 'PRIORIDADE ALTA'    : 'PRIORIDAD ALTA' };
  if (idx === 2) return { phase: isPT ? 'FASE 2' : 'FASE 2', weeks: isPT ? 'Semanas 5–8' : 'Semanas 5–8', priority: isPT ? 'PRIORIDADE MÉDIA'   : 'PRIORIDAD MEDIA' };
  if (idx === 3) return { phase: isPT ? 'FASE 2' : 'FASE 2', weeks: isPT ? 'Semanas 5–8' : 'Semanas 5–8', priority: isPT ? 'A TRABALHAR'        : 'A TRABAJAR' };
  return           { phase: isPT ? 'FASE 3' : 'FASE 3', weeks: isPT ? 'Semanas 9–12': 'Semanas 9–12', priority: isPT ? 'REFINAMENTO'       : 'REFINAMIENTO' };
}

// ─── Plan de mejora personalizado (para tab Plan de Trabajo) ──────────────────

function buildWorkPlan(scores, categories) {
  const isPT  = (typeof I18N !== 'undefined') && I18N.isPT();
  const catList = categories || EVHAPO_CATEGORIES;
  const cats = catList.map(c => ({ ...c, pct: scores[c.key] || 0 }));
  cats.sort((a, b) => a.pct - b.pct);

  const gaps   = cats.filter(c => c.pct < 80);
  const strong = cats.filter(c => c.pct >= 80);

  if (!gaps.length) {
    return `<div class="form-success">🏆 ${isPT
      ? 'Todas as áreas estão em 80% ou mais! Você é um jogador de elite. Mantenha suas rotinas atuais e continue refinando.'
      : '¡Todas las áreas están al 80% o más! Eres jugador de élite. Mantén tus rutinas actuales y continúa refinando.'}</div>`;
  }

  let html = '';

  const criticals  = gaps.filter(c => c.pct < 40);
  const importants = gaps.filter(c => c.pct >= 40 && c.pct < 60);
  const mejorables = gaps.filter(c => c.pct >= 60 && c.pct < 80);

  // FASE 1 — Críticos + Importantes
  const fase1 = [...criticals, ...importants].slice(0, 3);
  if (fase1.length) {
    html += `
      <div class="plan-phase">
        <div class="plan-phase-header phase-1">
          <span class="phase-badge">FASE 1</span>
          <div>
            <div class="phase-title">${isPT ? 'Semanas 1–4 · Ataque as lacunas críticas' : 'Semanas 1–4 · Ataque las brechas críticas'}</div>
            <div class="phase-sub">${isPT ? 'Foco total nas áreas com maior impacto negativo no seu jogo' : 'Foco total en las áreas con mayor impacto negativo en tu juego'}</div>
          </div>
        </div>
        ${fase1.map(c => renderPlanItem(c)).join('')}
      </div>`;
  }

  // FASE 2 — Mejorables
  if (mejorables.length) {
    html += `
      <div class="plan-phase">
        <div class="plan-phase-header phase-2">
          <span class="phase-badge">FASE 2</span>
          <div>
            <div class="phase-title">${isPT ? 'Semanas 5–8 · Consolide as áreas em desenvolvimento' : 'Semanas 5–8 · Consolida las áreas en desarrollo'}</div>
            <div class="phase-sub">${isPT ? 'Com as bases críticas reforçadas, foque nas lacunas médias' : 'Con las bases críticas reforzadas, enfócate en las brechas medias'}</div>
          </div>
        </div>
        ${mejorables.map(c => renderPlanItem(c)).join('')}
      </div>`;
  }

  // FASE 3 — Resto de gaps
  const fase3 = gaps.slice(fase1.length + mejorables.length);
  if (fase3.length) {
    html += `
      <div class="plan-phase">
        <div class="plan-phase-header phase-3">
          <span class="phase-badge">FASE 3</span>
          <div>
            <div class="phase-title">${isPT ? 'Semanas 9–12 · Refinamento e excelência' : 'Semanas 9–12 · Refinamiento y excelencia'}</div>
            <div class="phase-sub">${isPT ? 'Ajustes finos para levar todas as áreas ao nível elite' : 'Ajustes finos para llevar todas las áreas al nivel élite'}</div>
          </div>
        </div>
        ${fase3.map(c => renderPlanItem(c)).join('')}
      </div>`;
  }

  // Fortalezas — mantener
  if (strong.length) {
    html += `
      <div class="plan-phase">
        <div class="plan-phase-header phase-ok">
          <span class="phase-badge" style="background:#16a34a">${isPT ? '✅ MANTER' : '✅ MANTENER'}</span>
          <div>
            <div class="phase-title">${isPT ? 'Forças consolidadas — Sem foco especial' : 'Fortalezas consolidadas — Sin foco especial'}</div>
            <div class="phase-sub">${isPT ? 'Continue com suas rotinas atuais para não perder esses níveis' : 'Continúa con tus rutinas actuales para no perder estos niveles'}</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;padding:16px">
          ${strong.map(c => `
            <div class="strength-chip">
              <span>${c.icon} ${c.label}</span>
              <span class="strength-pct">${c.pct}%</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  return html;
}

function renderPlanItem(cat) {
  const isPT = (typeof I18N !== 'undefined') && I18N.isPT();
  const diag = getDiagnosis(cat.pct);
  const gap  = (100 - cat.pct).toFixed(1);
  const meta = Math.min(cat.pct + 25, 100);

  return `
    <div class="plan-item" style="border-left:4px solid ${cat.color}">
      <div class="plan-item-header">
        <div class="plan-item-title">
          <span style="font-size:1.4rem">${cat.icon}</span>
          <div>
            <div style="font-weight:700;color:${cat.color}">${cat.label}</div>
            <div style="font-size:0.8rem;color:var(--text2)">${cat.description}</div>
          </div>
        </div>
        <div class="plan-item-score">
          <div class="plan-score-now">${cat.pct}%</div>
          <div class="plan-score-arrow">→</div>
          <div class="plan-score-meta">${meta}%</div>
        </div>
      </div>

      <div class="plan-diag ${diag.cls}">
        <strong>${diag.tag}</strong> — ${diag.text} ${isPT ? 'Lacuna atual:' : 'Brecha actual:'} <strong>${gap} ${isPT ? 'pontos' : 'puntos'}</strong>.
      </div>

      <div class="plan-progress">
        <div class="plan-bar-track">
          <div class="plan-bar-now" style="width:${cat.pct}%;background:${cat.color}"></div>
          <div class="plan-bar-meta" style="left:${meta}%"></div>
          <div class="plan-bar-elite" style="left:80%"></div>
        </div>
        <div class="plan-bar-labels">
          <span>0%</span>
          <span style="color:#3b82f6;font-size:0.75rem">▲ ${isPT ? 'Meta elite 80%' : 'Meta élite 80%'}</span>
          <span>100%</span>
        </div>
      </div>

      <div class="plan-actions">
        <div class="plan-actions-title">📋 ${isPT ? 'Ações semanais' : 'Acciones semanales'}</div>
        <ul class="workplan-tips">
          ${cat.tips.slice(0, 3).map(t => `<li>${t}</li>`).join('')}
        </ul>
        ${cat.tips.length > 3 ? `
        <details style="margin-top:8px">
          <summary style="cursor:pointer;font-size:0.85rem;color:var(--text2)">${isPT ? 'Ver mais dicas...' : 'Ver más consejos...'}</summary>
          <ul class="workplan-tips" style="margin-top:8px">
            ${cat.tips.slice(3).map(t => `<li>${t}</li>`).join('')}
          </ul>
        </details>` : ''}
      </div>
    </div>`;
}

// ─── Informe completo (para tab Informe) ──────────────────────────────────────

function buildReport(scores, userName, categories) {
  const isPT  = (typeof I18N !== 'undefined') && I18N.isPT();
  const catList = categories || EVHAPO_CATEGORIES;
  const cats = catList.map(c => ({ ...c, pct: scores[c.key] || 0 }));
  cats.sort((a, b) => a.pct - b.pct);

  const gaps   = cats.filter(c => c.pct < 80);
  const strong = cats.filter(c => c.pct >= 80);
  const isTechnical = catList === TECHNICAL_CATEGORIES ||
    (typeof TECHNICAL_CATEGORIES_PT !== 'undefined' && catList === TECHNICAL_CATEGORIES_PT);
  const overall = isTechnical ? getTechnicalOverallScore(scores) : getOverallScore(scores);
  const level   = isTechnical ? getTechnicalLevel(overall) : getLevel(overall);

  const testLabel = isTechnical
    ? (isPT ? '⚙️ Técnico' : '⚙️ Técnico')
    : (isPT ? '🧠 Mental'  : '🧠 Mental');

  let html = `
    <div class="report-section">
      <div class="report-header-band" style="background:linear-gradient(135deg,#0a0e1a,#1a2235);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <img src="/icons/mindev-logo.png" alt="MindEV" style="height:20px;width:auto;border-radius:4px;border:1px solid rgba(212,175,55,0.3);padding:1px 5px;background:rgba(10,14,26,0.5)">
              <span style="font-size:0.8rem;color:var(--text2)">${isPT ? 'Relatório de Diagnóstico' : 'Informe de Diagnóstico'} ${testLabel}</span>
            </div>
            <h2 style="font-size:1.4rem;margin:0">${userName}</h2>
          </div>
          <div style="text-align:center">
            <div style="font-size:2.5rem;font-weight:900;color:${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f59e0b' : '#ef4444'}">${overall}%</div>
            <div class="results-level ${level.cls}" style="margin:4px 0 0">${level.label}</div>
          </div>
        </div>
      </div>
    </div>`;

  // Análisis de brechas
  html += `
    <div class="report-section">
      <h2>📊 ${isPT ? 'Análise de Lacunas' : 'Análisis de Brechas'}</h2>
      <p class="text-muted mb-4">${isPT
        ? 'Áreas ordenadas da maior para a menor lacuna em relação ao nível elite (80%):'
        : 'Áreas ordenadas de mayor a menor brecha respecto al nivel élite (80%):'}</p>`;

  if (!gaps.length) {
    html += `<div class="form-success">🎉 ${isPT
      ? 'Todas as áreas estão em 80% ou mais! Nível elite confirmado.'
      : '¡Todas las áreas están en 80% o más! Nivel élite confirmado.'}</div>`;
  } else {
    gaps.forEach((cat, i) => {
      const diag = getDiagnosis(cat.pct);
      const gap  = (100 - cat.pct).toFixed(1);
      html += `
        <div class="gap-item" style="border-left:4px solid ${cat.color}">
          <div class="gap-rank" style="background:${cat.color}20;color:${cat.color}">${i + 1}</div>
          <div class="gap-content">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
              <h3 style="margin:0">${cat.icon} ${cat.label}</h3>
              <span class="diag-tag ${diag.cls}">${diag.tag}</span>
              <span style="margin-left:auto;font-size:0.875rem;color:var(--text2)">${isPT ? 'Lacuna:' : 'Brecha:'} ${gap} pts</span>
            </div>
            <div class="cat-score-bar" style="margin-bottom:8px">
              <div class="cat-score-fill" style="width:${cat.pct}%;background:${cat.color}"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text2);margin-bottom:8px">
              <span>${isPT ? 'Seu nível:' : 'Tu nivel:'} <strong style="color:${cat.color}">${cat.pct}%</strong></span>
              <span style="color:#3b82f6">▲ ${isPT ? 'Elite: 80%' : 'Élite: 80%'}</span>
            </div>
            <p style="font-size:0.875rem;color:var(--text2)">${cat.description}</p>
          </div>
        </div>`;
    });
  }
  html += `</div>`;

  // Plan de trabajo compacto
  html += `
    <div class="report-section">
      <h2>🗓️ ${isPT ? 'Resumo do Plano de Trabalho' : 'Resumen del Plan de Trabajo'}</h2>
      <p class="text-muted mb-4">${isPT
        ? 'Plano de 12 semanas personalizado segundo suas lacunas:'
        : 'Plan de 12 semanas personalizado según tus brechas:'}</p>`;

  const planItems = gaps.slice(0, 5);
  planItems.forEach((cat, i) => {
    const ph = getPhase(i);
    html += `
      <div class="workplan-item" style="border-left:4px solid ${cat.color}">
        <div class="workplan-week">${ph.weeks} · ${ph.priority}</div>
        <h3>${cat.icon} ${cat.label} <span style="font-weight:400;font-size:0.875rem;color:var(--text2)">${cat.pct}% → ${isPT ? 'Meta: 80%' : 'Meta: 80%'}</span></h3>
        <ul class="workplan-tips">
          ${cat.tips.slice(0, 3).map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>`;
  });

  if (strong.length) {
    html += `
      <div class="workplan-item no-foco">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <h3 style="margin:0">✅ ${isPT ? 'Forças consolidadas' : 'Fortalezas consolidadas'}</h3>
          <span class="no-foco-badge">${isPT ? 'MANTER' : 'MANTENER'}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${strong.map(c => `<span class="chip gold">${c.icon} ${c.label} ${c.pct}%</span>`).join('')}
        </div>
      </div>`;
  }
  html += `</div>`;

  // Insights clave
  const best  = cats[cats.length - 1];
  const worst = cats[0];
  html += `
    <div class="report-section">
      <h2>💡 ${isPT ? 'Insights Chave' : 'Insights Clave'}</h2>
      <div class="card">
        <p>🏅 <strong>${isPT ? 'Maior força:' : 'Mayor fortaleza:'}</strong> ${best.icon} <strong>${best.label}</strong> (${best.pct}%) — ${isPT ? 'Sua âncora de desempenho. Capitalize-a.' : 'Tu ancla de rendimiento. Capitalízala.'}</p>
        <div class="gap-divider"></div>
        <p>⚠️ <strong>${isPT ? 'Maior alavanca de crescimento:' : 'Mayor palanca de crecimiento:'}</strong> ${worst.icon} <strong>${worst.label}</strong> (${worst.pct}%) — ${isPT ? 'Aqui está sua maior oportunidade. Priorize-a.' : 'Aquí está tu mayor oportunidad. Priorízala.'}</p>
        <div class="gap-divider"></div>
        <p>🎯 <strong>${isPT ? 'Objetivo em 60 dias:' : 'Objetivo a 60 días:'}</strong> ${isPT ? 'Levar' : 'Llevar'} <strong>${worst.label}</strong>${gaps[1] ? (isPT ? ` e <strong>${gaps[1].label}</strong>` : ` y <strong>${gaps[1].label}</strong>`) : ''} ${isPT ? 'a 70%+ mediante trabalho sistemático diário.' : 'al 70%+ mediante trabajo sistemático diario.'}</p>
        <div class="gap-divider"></div>
        <p>📈 <strong>${isPT ? 'Projeção:' : 'Proyección:'}</strong> ${isPT
          ? 'Com 30 minutos diários de prática focada, a maioria dos jogadores melhora entre 15 e 25 pontos em 8 semanas.'
          : 'Con 30 minutos diarios de práctica enfocada, la mayoría de jugadores mejoran entre 15 y 25 puntos en 8 semanas.'}</p>
      </div>
    </div>`;

  return html;
}

// ─── Exportar PDF ─────────────────────────────────────────────────────────────

async function exportToPDF(userName, overall, scores) {
  const isPT = (typeof I18N !== 'undefined') && I18N.isPT();
  const { jsPDF } = window.jspdf;

  // Asegurarse de que el tab de informe esté visible para html2canvas
  const tabReport = document.getElementById('tab-report');
  const wasHidden = tabReport && tabReport.style.display === 'none';
  if (wasHidden) {
    tabReport.style.display = 'block';
    tabReport.style.position = 'absolute';
    tabReport.style.left = '-9999px';
    tabReport.style.top = '0';
  }

  await new Promise(r => setTimeout(r, 100));

  const reportEl = document.getElementById('report-content');
  if (!reportEl) {
    if (wasHidden && tabReport) tabReport.style.display = 'none';
    alert(isPT
      ? 'Conteúdo do relatório não encontrado. Vá à aba "Relatório" e tente novamente.'
      : 'No se encontró el contenido del informe. Ve a la pestaña "Informe" e inténtalo de nuevo.');
    return;
  }

  try {
    const canvas = await html2canvas(reportEl, { scale: 1.5, backgroundColor: '#111827', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Header
    pdf.setFillColor(10, 14, 26);
    pdf.rect(0, 0, pageW, 30, 'F');
    pdf.setTextColor(212, 175, 55);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(isPT ? 'EVHAPO - Diagnóstico do Jogador de Poker' : 'EVHAPO - Diagnostico del Jugador de Poker', pageW / 2, 14, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`${isPT ? 'Relatório de' : 'Informe de'} ${userName}   ${isPT ? 'Pontuação global:' : 'Puntaje global:'} ${overall}%`, pageW / 2, 23, { align: 'center' });

    // Content paginado
    const imgRatio   = (pageW - 20) / canvas.width;
    let yPos      = 34;
    let remaining = canvas.height * imgRatio;
    let srcY      = 0;

    while (remaining > 0) {
      const sliceH    = Math.min(pageH - yPos - 10, remaining);
      const srcSliceH = sliceH / imgRatio;
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = srcSliceH;
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcSliceH, 0, 0, canvas.width, srcSliceH);
      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 10, yPos, pageW - 20, sliceH);
      remaining -= sliceH;
      srcY      += srcSliceH;
      if (remaining > 0) { pdf.addPage(); yPos = 10; }
    }

    pdf.save(`EVHAPO_${isPT ? 'Relatorio' : 'Informe'}_${userName.replace(/\s+/g, '_')}.pdf`);
  } finally {
    if (wasHidden && tabReport) {
      tabReport.style.display = 'none';
      tabReport.style.position = '';
      tabReport.style.left = '';
      tabReport.style.top = '';
    }
  }
}
