function buildReport(scores, userName, categories) {
  const catList = categories || EVHAPO_CATEGORIES;
  const cats = catList.map(c => ({ ...c, pct: scores[c.key] || 0 }));
  cats.sort((a, b) => a.pct - b.pct);

  const gaps = cats.filter(c => c.pct < 80);
  const noFoco = cats.filter(c => c.pct >= 80);

  // Detectar tipo de test por las categorías y usar la función correcta
  const isTechnical = catList === TECHNICAL_CATEGORIES;
  const overall = isTechnical ? getTechnicalOverallScore(scores) : getOverallScore(scores);
  const level = isTechnical ? getTechnicalLevel(overall) : getLevel(overall);

  let html = `
    <div class="report-section">
      <h2>📊 Análisis de Brechas</h2>
      <p class="text-muted mb-4">Las siguientes áreas requieren atención, ordenadas de mayor a menor brecha respecto al 100%:</p>`;

  if (gaps.length === 0) {
    html += `<div class="form-success">🎉 ¡Felicitaciones! Todas tus habilidades están al 80% o más. Estás en nivel élite.</div>`;
  } else {
    gaps.forEach((cat, i) => {
      const priority = i < 3 ? (i === 0 ? 'priority-1' : i === 1 ? 'priority-2' : 'priority-3') : '';
      const urgency = cat.pct < 40 ? '🔴 CRÍTICO' : cat.pct < 60 ? '🟡 IMPORTANTE' : '🟢 MEJORABLE';
      html += `
        <div class="gap-item ${priority}">
          <div class="gap-rank">${i + 1}</div>
          <div class="gap-content">
            <h3>${cat.icon} ${cat.label} — ${cat.pct}%</h3>
            <p>${urgency} · Brecha: ${(100 - cat.pct).toFixed(1)} puntos por debajo del máximo</p>
            <p style="margin-top:6px">${cat.description}</p>
          </div>
        </div>`;
    });
  }
  html += `</div>`;

  // Work plan
  html += `
    <div class="report-section">
      <h2>🗓️ Plan de Trabajo Personalizado</h2>
      <p class="text-muted mb-4">Basado en tus resultados, este es tu plan de acción para las próximas semanas:</p>`;

  gaps.slice(0, 5).forEach((cat, i) => {
    const week = i === 0 ? 'Semanas 1–2 · PRIORIDAD MÁXIMA' :
                 i === 1 ? 'Semanas 3–4 · ALTA PRIORIDAD' :
                 i === 2 ? 'Semanas 5–6 · PRIORIDAD MEDIA' :
                 `Semana ${(i + 1) * 2 - 1}–${(i + 1) * 2} · A TRABAJAR`;
    html += `
      <div class="workplan-item">
        <div class="workplan-week">${week}</div>
        <h3>${cat.icon} Mejorar ${cat.label} (actualmente ${cat.pct}%)</h3>
        <ul class="workplan-tips">
          ${cat.tips.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>`;
  });

  if (noFoco.length > 0) {
    html += `
      <div class="workplan-item no-foco">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="margin:0">✅ Fortalezas consolidadas</h3>
          <span class="no-foco-badge">NO NECESITAN FOCO AHORA</span>
        </div>
        <p class="text-muted" style="margin-bottom:12px">Estas habilidades ya están sobre el 80%. Mantenlas con tu rutina actual:</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${noFoco.map(c => `<span class="chip gold">${c.icon} ${c.label} ${c.pct}%</span>`).join('')}
        </div>
      </div>`;
  }

  html += `</div>`;

  // Insights
  const best = cats[cats.length - 1];
  const worst = cats[0];
  html += `
    <div class="report-section">
      <h2>💡 Insights Clave</h2>
      <div class="card">
        <p>🏅 <strong>Tu mayor fortaleza:</strong> ${best.icon} <strong>${best.label}</strong> (${best.pct}%) — Esta habilidad es tu ancla de rendimiento. Aprovéchala.</p>
        <div class="gap-divider"></div>
        <p>⚠️ <strong>Tu mayor oportunidad:</strong> ${worst.icon} <strong>${worst.label}</strong> (${worst.pct}%) — Aquí está tu mayor palanca de crecimiento. Trabájala primero.</p>
        <div class="gap-divider"></div>
        <p>🎯 <strong>Objetivo recomendado:</strong> Llevar ${worst.label} y ${gaps[1] ? gaps[1].label : 'tus áreas débiles'} al 80% en los próximos 60 días.</p>
      </div>
    </div>`;

  return html;
}

async function exportToPDF(userName, overall, scores) {
  const { jsPDF } = window.jspdf;
  const reportEl = document.getElementById('report-content');
  if (!reportEl) return;

  const canvas = await html2canvas(reportEl, { scale: 1.5, backgroundColor: '#111827' });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = Math.min(pageW / imgW, pageH / imgH);

  // Header
  pdf.setFillColor(10, 14, 26);
  pdf.rect(0, 0, pageW, 30, 'F');
  pdf.setTextColor(212, 175, 55);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EVHAPO – Diagnóstico Mental del Jugador de Poker', pageW / 2, 15, { align: 'center' });
  pdf.setFontSize(11);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Informe de ${userName} · Puntaje global: ${overall}%`, pageW / 2, 23, { align: 'center' });

  // Content
  const imgRatio = (pageW - 20) / canvas.width;
  const imgHeightMm = canvas.height * imgRatio;
  let yPos = 34;
  let remaining = imgHeightMm;
  let srcY = 0;

  while (remaining > 0) {
    const sliceH = Math.min(pageH - yPos - 10, remaining);
    const srcSliceH = sliceH / imgRatio;
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = srcSliceH;
    const ctx = sliceCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcSliceH, 0, 0, canvas.width, srcSliceH);
    const sliceData = sliceCanvas.toDataURL('image/png');
    pdf.addImage(sliceData, 'PNG', 10, yPos, pageW - 20, sliceH);
    remaining -= sliceH;
    srcY += srcSliceH;
    if (remaining > 0) {
      pdf.addPage();
      yPos = 10;
    }
  }

  pdf.save(`EVHAPO_Informe_${userName.replace(/\s+/g, '_')}.pdf`);
}
