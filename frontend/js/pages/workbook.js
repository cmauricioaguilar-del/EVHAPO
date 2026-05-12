// ─── Cuadernillo de Control — Generador de PDF ───────────────────────────────
// Usa datos reales del usuario autenticado. Lang detectado desde I18N.lang.

// ── Genera PNG de radar chart usando Chart.js (para PDF y Excel) ──────────────
function wbRadarPng(labels, data, lineRgba, fillRgba, bgHex) {
  return new Promise(resolve => {
    const CW = 380, CH = 320;
    const canvas = document.createElement('canvas');
    canvas.width = CW; canvas.height = CH;
    canvas.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: lineRgba,
          backgroundColor: fillRgba,
          pointBackgroundColor: lineRgba,
          pointBorderColor: bgHex || '#0a0e1a',
          pointBorderWidth: 1,
          borderWidth: 2,
          pointRadius: 4,
        }]
      },
      options: {
        animation: false,
        responsive: false,
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { stepSize: 25, color: '#94a3b8', font: { size: 9 }, backdropColor: 'transparent' },
            grid: { color: 'rgba(148,163,184,0.2)' },
            pointLabels: { color: '#e2e8f0', font: { size: 9, weight: 'bold' } },
            angleLines: { color: 'rgba(148,163,184,0.2)' },
          }
        },
        plugins: { legend: { display: false } },
      },
      plugins: [{
        id: 'wbBg',
        beforeDraw(ch) {
          const c = ch.canvas.getContext('2d');
          c.save();
          c.fillStyle = bgHex || '#0a0e1a';
          c.fillRect(0, 0, ch.width, ch.height);
          c.restore();
        }
      }]
    });
    requestAnimationFrame(() => {
      const dataUrl = canvas.toDataURL('image/png');
      chart.destroy();
      document.body.removeChild(canvas);
      resolve(dataUrl);
    });
  });
}

const WB_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <rect width="192" height="192" rx="36" fill="#0a0e1a"/>
  <rect x="5" y="5" width="182" height="182" rx="30" fill="none" stroke="#d4af37" stroke-width="4"/>
  <text x="96" y="112" font-size="96" font-family="serif" text-anchor="middle" dominant-baseline="auto" fill="#d4af37">&#9824;</text>
  <text x="96" y="168" font-size="26" font-family="Arial,sans-serif" font-weight="900" text-anchor="middle" fill="#d4af37" letter-spacing="1">MindEV</text>
</svg>`;

const WB_SLOGANS = {
  es: 'Tu EV+ empieza en tu mente.',
  pt: 'O seu EV+ comeca na sua mente.',
  en: 'Your EV+ starts in your mind.',
};

function wbSvgToPng(svgStr, w, h) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Traducciones (sin tildes — Helvetica no soporta Unicode extendido) ──
const WB_T = {
  es: {
    title:'Cuadernillo de Control', subtitle:'Plan de Trabajo Personalizado',
    tagline:'MENTAL  .  TECNICO  .  IA', player:'Jugador', generated:'Generado el',
    diagTitle:'Resumen del Diagnostico', mentalSec:'TEST MENTAL', techSec:'TEST TECNICO',
    area:'Area', score:'Puntaje', level:'Nivel', overall:'Promedio general',
    lvlCrit:'CRITICO', lvlLow:'BAJO', lvlMed:'MEDIO', lvlHigh:'ALTO', lvlExc:'EXCELENTE',
    phase1:'FASE 1 — MENTAL', phase2:'FASE 2 — TECNICA', phase3:'FASE 3 — INTEGRACION',
    objective:'Objetivo semanal', resources:'Recursos', milestone:'Meta de la semana',
    notes:'Notas y reflexiones', days:['LUN','MAR','MIE','JUE','VIE','SAB','DOM'], min:'min',
    backQuote:'"La mejora en poker no es un evento, es un proceso diario de habitos correctos."',
    backAuthor:'— Jared Tendler', pageOf:'Pagina', of:'de',
    priorityAreas:'Areas prioritarias', noTest:'Sin datos de test',
    url:'mindev-ia.cl', wkLabel:'SEMANA', themeLabel:'TEMA', statusLabel:'COMPLETADO',
  },
  pt: {
    title:'Caderno de Controle', subtitle:'Plano de Trabalho Personalizado',
    tagline:'MENTAL  .  TECNICO  .  IA', player:'Jogador', generated:'Gerado em',
    diagTitle:'Resumo do Diagnostico', mentalSec:'TESTE MENTAL', techSec:'TESTE TECNICO',
    area:'Area', score:'Pontuacao', level:'Nivel', overall:'Media geral',
    lvlCrit:'CRITICO', lvlLow:'BAIXO', lvlMed:'MEDIO', lvlHigh:'ALTO', lvlExc:'EXCELENTE',
    phase1:'FASE 1 — MENTAL', phase2:'FASE 2 — TECNICA', phase3:'FASE 3 — INTEGRACAO',
    objective:'Objetivo semanal', resources:'Recursos', milestone:'Meta da semana',
    notes:'Notas e reflexoes', days:['SEG','TER','QUA','QUI','SEX','SAB','DOM'], min:'min',
    backQuote:'"A melhora no poker nao e um evento, e um processo diario de habitos corretos."',
    backAuthor:'— Jared Tendler', pageOf:'Pagina', of:'de',
    priorityAreas:'Areas prioritarias', noTest:'Sem dados de teste',
    url:'mindev-ia.cl', wkLabel:'SEMANA', themeLabel:'TEMA', statusLabel:'CONCLUIDO',
  },
  en: {
    title:'Control Workbook', subtitle:'Personalised Work Plan',
    tagline:'MENTAL  .  TECHNICAL  .  AI', player:'Player', generated:'Generated on',
    diagTitle:'Diagnostic Summary', mentalSec:'MENTAL TEST', techSec:'TECHNICAL TEST',
    area:'Area', score:'Score', level:'Level', overall:'Overall average',
    lvlCrit:'CRITICAL', lvlLow:'LOW', lvlMed:'MEDIUM', lvlHigh:'HIGH', lvlExc:'EXCELLENT',
    phase1:'PHASE 1 — MENTAL', phase2:'PHASE 2 — TECHNICAL', phase3:'PHASE 3 — INTEGRATION',
    objective:'Weekly objective', resources:'Resources', milestone:'Weekly milestone',
    notes:'Notes and reflections', days:['MON','TUE','WED','THU','FRI','SAT','SUN'], min:'min',
    backQuote:'"Improvement in poker is not an event, it is a daily process of correct habits."',
    backAuthor:'— Jared Tendler', pageOf:'Page', of:'of',
    priorityAreas:'Priority areas', noTest:'No test data',
    url:'mindev-ia.cl', wkLabel:'WEEK', themeLabel:'THEME', statusLabel:'COMPLETED',
  },
};

// ── Plan de 12 semanas ────────────────────────────────────────────────────────
function wbGetWeeks(lang) {
  const t = WB_T[lang];
  const weeks = {
    es: [
      { n:1, phase:t.phase1, color:'mental', theme:'Construir la Rutina de Estudio',
        focus:'Habitos (Area Critica)', obj:'Establecer una rutina diaria de estudio consistente y un sistema de registro de sesiones.',
        days:[
          {d:'LUN',t:30,task:'Disena tu rutina semanal de estudio: horarios, duracion y tipo de analisis.'},
          {d:'MAR',t:20,task:'Crea tu diario de sesiones. Primera entrada: metas de la semana y estado mental.'},
          {d:'MIE',t:25,task:"Lee cap. 1-2 de 'The Mental Game of Poker': fundamentos de habitos de estudio."},
          {d:'JUE',t:30,task:'Analiza 5 manos post-sesion con notas escritas: que decidiste y por que.'},
          {d:'VIE',t:15,task:'Escribe tus 3 metas de mejora para este plan y colocalas en un lugar visible.'},
          {d:'SAB',t:60,task:'Sesion de juego con diario activo: anota decisiones clave en tiempo real.'},
          {d:'DOM',t:20,task:'Revision semanal: cumpliste la rutina? Que ajustar para la proxima semana?'},
        ],
        res:["'The Mental Game of Poker' — Jared Tendler & Barry Carter (cap. 1-3)",
             'Pokerology.com — Guia de estudio sistematico para jugadores en desarrollo'],
        milestone:'7 entradas en el diario de sesiones. Rutina aplicada 5 de 7 dias.',
      },
      { n:2, phase:t.phase1, color:'mental', theme:'Protocolo de Activacion Pre-Sesion',
        focus:'Habitos (continuacion)', obj:'Crear y aplicar un protocolo de preparacion mental sistematico antes de cada sesion.',
        days:[
          {d:'LUN',t:20,task:'Disena tu checklist pre-sesion: estado fisico, mental, objetivos y stop-loss.'},
          {d:'MAR',t:10,task:'Practica tecnica de respiracion 4-7-8 durante 3 ciclos antes de jugar.'},
          {d:'MIE',t:15,task:'Define tus limites de sesion: stop-loss (3 buy-ins) y duracion maxima (2 h).'},
          {d:'JUE',t:25,task:'Revision de 5 manos criticas de semanas anteriores con notas de contexto emocional.'},
          {d:'VIE',t:45,task:'Sesion con checklist aplicado desde el primer momento. Anota como te sientes.'},
          {d:'SAB',t:20,task:'Analiza la sesion del viernes: cumpliste el protocolo? Hubo tilt? Cuanto?'},
          {d:'DOM',t:15,task:'Ajusta el checklist con los aprendizajes de la semana. Version 2.0.'},
        ],
        res:["'The Mental Game of Poker' cap. 4-5 (preparacion y rutinas)",
             "YouTube: 'Pre-Poker Session Routine' — Jonathan Little (Canal PokerCoaching)"],
        milestone:'Protocolo pre-sesion documentado y aplicado en todas las sesiones de la semana.',
      },
      { n:3, phase:t.phase1, color:'mental', theme:'Identificar Patrones de Tilt',
        focus:'Gestion del Tilt', obj:'Mapear los tipos y triggers de tilt propios para anticiparlos y neutralizarlos.',
        days:[
          {d:'LUN',t:20,task:"Estudia 'Los 7 Tipos de Tilt' segun Jared Tendler. Identifica los tuyos."},
          {d:'MAR',t:30,task:'Crea tu Mapa de Triggers: situaciones que te provocan tilt (bad beats, bluffs, etc).'},
          {d:'MIE',t:45,task:'Sesion de juego: identifica momentos de tilt en tiempo real y anotalos.'},
          {d:'JUE',t:25,task:'Analiza 3 manos bajo tilt: que error cometiste? Cual era la jugada correcta?'},
          {d:'VIE',t:20,task:'Disena tu senal de alerta personal: la frase o sensacion que indica tilt inminente.'},
          {d:'SAB',t:45,task:"Aplica tecnica 'Pause Button': detente 60 seg cuando identifiques el trigger."},
          {d:'DOM',t:20,task:'Revision: cuantos tilts detectaste? Evitaste alguno? Que funciono?'},
        ],
        res:["'The Mental Game of Poker' cap. 6-8 (tilt, tipos y causas)",
             "Upswing Poker: 'How to Deal with Bad Beats and Stop Tilting' (articulo gratuito)"],
        milestone:'Mapa de Triggers completado con al menos 5 triggers personales identificados.',
      },
      { n:4, phase:t.phase1, color:'mental', theme:'Tecnicas de Control del Tilt',
        focus:'Gestion del Tilt (aplicacion)', obj:'Implementar tecnicas practicas para interrumpir el ciclo del tilt en tiempo real.',
        days:[
          {d:'LUN',t:15,task:"Aprende tecnica 'Breathing Reset': 4 respiraciones lentas al sentir tilt."},
          {d:'MAR',t:20,task:'Crea tu mantra anti-tilt personal (frase corta que te centra en el proceso).'},
          {d:'MIE',t:20,task:'Practica visualizacion: imagina 5 min una sesion perfecta de toma de decisiones.'},
          {d:'JUE',t:45,task:'Sesion con mantra activo: repitelo al inicio y cada vez que sientas presion.'},
          {d:'VIE',t:25,task:'Analiza 5 decisiones bajo presion de esta semana. Que tan equilibradas fueron?'},
          {d:'SAB',t:30,task:"Roleplay con un companero: simula spots dificiles y practica 'pause button'."},
          {d:'DOM',t:20,task:'Journaling: mejoro tu control vs semana 3? Que tecnica funciona mejor para ti?'},
        ],
        res:["'Emotional Agility' — Susan David (cap. sobre manejo de emociones bajo presion)",
             "Podcast: 'The Mental Game Podcast' — Jared Tendler, episodio 'Tilt Control'"],
        milestone:'Reducir en 50% las sesiones terminadas por tilt comparado con la semana 3.',
      },
      { n:5, phase:t.phase1, color:'mental', theme:'Consolidacion Mental',
        focus:'Integracion habitos + tilt', obj:'Automatizar las habilidades mentales y preparar la transicion hacia la fase tecnica.',
        days:[
          {d:'LUN',t:20,task:'Revision completa de habitos: que mantener, que mejorar, que eliminar.'},
          {d:'MAR',t:15,task:'Actualiza tu protocolo pre-sesion con los aprendizajes de las 4 semanas.'},
          {d:'MIE',t:60,task:'Sesion de juego con journal integrado: mental + decisiones tecnicas basicas.'},
          {d:'JUE',t:25,task:'Compara tu estado mental semana 1 vs semana 5. Escribe 3 mejoras concretas.'},
          {d:'VIE',t:20,task:'Define 3 objetivos tecnicos para la Fase 2. Anotalos en el plan.'},
          {d:'SAB',t:120,task:'Sesion larga (2h): aplica TODO lo aprendido en la fase mental.'},
          {d:'DOM',t:25,task:"Sintesis escrita: 'Mi perfil mental actual' — fortalezas, debilidades y plan."},
        ],
        res:["'Poker Mindset: Your Secret Weapon' — Taylor Caby (articulo Cardrunners)",
             "Mental Game Podcast: episodio 'Sustaining Improvement Over Time'"],
        milestone:"Journal de 5 semanas completo + autoevaluacion con 70%+ de cumplimiento.",
      },
      { n:6, phase:t.phase2, color:'technical', theme:'Lineas de Turn: Teoria',
        focus:'Lineas de Turn', obj:'Comprender la teoria de continuation bets, checks y lineas optimas en el turn.',
        days:[
          {d:'LUN',t:25,task:'Estudia frecuencias de c-bet en turn: cuando continuar, cuando check-fold.'},
          {d:'MAR',t:30,task:'Teoria de equity y proteccion de rango en turn. Analiza 3 boards con solver.'},
          {d:'MIE',t:25,task:'Conceptos de barrel: double barrel vs check-call vs check-raise en turn.'},
          {d:'JUE',t:30,task:'Analiza 10 manos de turn de pros (YouTube/RIO): justifica cada linea elegida.'},
          {d:'VIE',t:20,task:'Quiz mental: ante un turn card especifico, cual es tu linea y por que?'},
          {d:'SAB',t:45,task:'Sesion enfocada: comenta en voz alta tu razonamiento en cada turno jugado.'},
          {d:'DOM',t:25,task:'Revision de manos de turn de la sesion del sabado con solver.'},
        ],
        res:["'Applications of No-Limit Hold'em' — Matthew Janda (cap. turn play)",
             "GTO+ o PIO Solver — analisis de frecuencias optimas en turn por tipo de board"],
        milestone:'10 manos de turn analizadas con justificacion escrita de la linea elegida.',
      },
      { n:7, phase:t.phase2, color:'technical', theme:'Lineas de Turn: Aplicacion',
        focus:'Lineas de Turn (practica)', obj:'Aplicar lineas de turn de forma consistente usando rangos reales de las sesiones.',
        days:[
          {d:'LUN',t:25,task:'Analiza 5 spots de turn OOP de tus sesiones recientes con solver.'},
          {d:'MAR',t:25,task:'Analiza 5 spots de turn IP de tus sesiones recientes con solver.'},
          {d:'MIE',t:30,task:'Construccion de rangos en turn: aprende a balancear value y bluffs.'},
          {d:'JUE',t:45,task:'Sesion de juego: etiqueta todas las manos de turn para revision posterior.'},
          {d:'VIE',t:30,task:'Revisa las manos etiquetadas del jueves con solver. Mide tu desvio del optimo.'},
          {d:'SAB',t:45,task:'Workshop con companero: debate 3 spots de turn dificiles. Justifica tu linea.'},
          {d:'DOM',t:15,task:'Sintesis: tus 3 errores mas frecuentes en turn. Plan para corregirlos.'},
        ],
        res:["Run It Once Elite: 'Turn Play Masterclass' (acceso gratuito primeros 30 dias)",
             'PokerCoachingUniversity.com — modulo de lineas en turn (contenido gratuito)'],
        milestone:'Consistencia en linea de turn mayor al 70% segun analisis con solver.',
      },
      { n:8, phase:t.phase2, color:'technical', theme:'River Value: Sizing Optimo',
        focus:'River Value', obj:'Maximizar el valor en el rio eligiendo el sizing correcto segun la textura y el rango.',
        days:[
          {d:'LUN',t:25,task:'Teoria de polarizacion de rangos en river: valor, bluff y manos de showdown.'},
          {d:'MAR',t:25,task:'Sizing del river: cuando usar sizing pequeno, mediano o overbet.'},
          {d:'MIE',t:30,task:'Analiza 10 manos de river value de jugadores de alto nivel (videos/solver).'},
          {d:'JUE',t:45,task:'Sesion enfocada en river bets: etiqueta todas las decisiones de river.'},
          {d:'VIE',t:30,task:'Revision con solver: elegiste el sizing correcto? Calcula la diferencia de EV.'},
          {d:'SAB',t:25,task:'Estudio de bluff catching en river: frecuencias y como defenderte de overbets.'},
          {d:'DOM',t:20,task:'Lista de patrones de sizing vs tipo de board (seco, mojado, pareado, monotono).'},
        ],
        res:["'No-Limit Hold'em Theory and Practice' — Sklansky & Miller (cap. river decisions)",
             "YouTube: Poker Detox — 'River Sizing Masterclass' (gratuito, 45 min)"],
        milestone:'10 spots de river value analizados con sizing optimo documentado y justificado.',
      },
      { n:9, phase:t.phase2, color:'technical', theme:'River: Bluffs y Equilibrio',
        focus:'River Value (disciplina)', obj:'Construir un rango de river balanceado: valor, bluffs y frecuencias correctas.',
        days:[
          {d:'LUN',t:25,task:'Teoria de blocker bets en river: seleccion de manos para bluff.'},
          {d:'MAR',t:25,task:'Frecuencias optimas de bluff por tipo de board. Cuando sobre-bluffeas?'},
          {d:'MIE',t:30,task:'Analiza 5 spots donde sobre-bluffeaste en los ultimos 30 dias.'},
          {d:'JUE',t:30,task:'Analiza 5 spots donde no protegiste suficiente tu rango en river.'},
          {d:'VIE',t:45,task:'Sesion con foco en equilibrio river: ni demasiado value ni demasiado bluff.'},
          {d:'SAB',t:30,task:'Review completo de river plays de la semana con solver. Mide tu frecuencia real.'},
          {d:'DOM',t:20,task:'Journaling tecnico: mejoro tu EV estimado en river vs semana 8?'},
        ],
        res:["'Mastering Small Stakes No-Limit Hold'em' — Carter Gill (cap. river play)",
             "PokerCoaching.com: modulo de river strategy — 'Balancing Your River Range'"],
        milestone:'Porcentaje de bluffs en river entre 30-40% segun analisis de 20 manos del solver.',
      },
      { n:10, phase:t.phase3, color:'integration', theme:'Aplicacion Mental + Tecnica en Vivo',
        focus:'Integracion (mental + turn + river)', obj:'Aplicar simultaneamente las habilidades mentales y tecnicas en sesiones reales.',
        days:[
          {d:'LUN',t:20,task:'Disena tu checklist integrado: mental (tilt, habitos) + tecnico (turn, river).'},
          {d:'MAR',t:60,task:'Sesion de juego con doble foco: control de tilt y calidad de decisiones turn/river.'},
          {d:'MIE',t:25,task:'Revision completa: hubo tilt? Acertaste las lineas turn/river? Calidad: 1-10.'},
          {d:'JUE',t:30,task:'Analiza 3 spots criticos con solver + notas sobre tu estado emocional en ese momento.'},
          {d:'VIE',t:60,task:'Segunda sesion de la semana con grabacion de audio (razonamiento en voz alta).'},
          {d:'SAB',t:30,task:'Review de grabacion: detecta patrones de error bajo presion emocional.'},
          {d:'DOM',t:20,task:'Ajusta el checklist para las 2 semanas finales segun lo aprendido.'},
        ],
        res:["Poker Bankroll Tracker app — registro integrado de sesiones",
             "Hoja de calculo propia: columnas mental/tecnico/resultado para medir correlacion"],
        milestone:'2 sesiones completas con journal integrado (mental + tecnico) y analisis posterior.',
      },
      { n:11, phase:t.phase3, color:'integration', theme:'Sistema de Analisis Post-Sesion',
        focus:'Habitos de analisis sostenibles', obj:'Construir un sistema de analisis post-sesion eficiente y repetible a largo plazo.',
        days:[
          {d:'LUN',t:20,task:'Disena tu plantilla estandar de analisis: campos fijos para cada sesion.'},
          {d:'MAR',t:30,task:'Practica analisis completo de una sesion reciente usando la plantilla.'},
          {d:'MIE',t:60,task:'Sesion de juego (60 min) + analisis inmediato con plantilla (30 min).'},
          {d:'JUE',t:25,task:'Identifica tus 3 patrones de error mas frecuentes de las ultimas 11 semanas.'},
          {d:'VIE',t:30,task:'Trabaja especificamente esos 3 errores con solver. Busca la solucion optima.'},
          {d:'SAB',t:60,task:'Sesion larga (60 min) + analisis diferido al dia siguiente (planificado).'},
          {d:'DOM',t:20,task:'Evaluacion: tu sistema de analisis es sostenible? Cuanto tiempo toma? Es util?'},
        ],
        res:["Plantilla de analisis de sesion MindEV-IA (disponible en el Dashboard)",
             "'The Course: Serious Hold'em Strategy For Smart Players' — Ed Miller"],
        milestone:'Sistema de analisis documentado y aplicado consistentemente en 3 sesiones.',
      },
      { n:12, phase:t.phase3, color:'integration', theme:'Re-test, Medicion y Proyeccion',
        focus:'Evaluacion de progreso real', obj:'Medir el progreso real del plan de 12 semanas y definir los proximos 3 meses.',
        days:[
          {d:'LUN',t:25,task:'Relee tus primeras entradas del diario (semana 1). Cuanto avanzaste?'},
          {d:'MAR',t:20,task:'Realiza el Test Mental completo en MindEV-IA. Anota tu estado previo al test.'},
          {d:'MIE',t:20,task:'Realiza el Test Tecnico completo en MindEV-IA. Compara con el anterior.'},
          {d:'JUE',t:20,task:'Compara resultados: antes vs ahora por cada area. Calcula la mejora porcentual.'},
          {d:'VIE',t:20,task:'Define tus proximos 3 objetivos de desarrollo. Se especifico y medible.'},
          {d:'SAB',t:60,task:'Sesion de celebracion: juega con calidad, sin presion de resultado.'},
          {d:'DOM',t:30,task:'Redacta tu plan de los proximos 3 meses. Usa el tab Evolucion de MindEV-IA.'},
        ],
        res:["Dashboard de Evolucion MindEV-IA — tab 'Evolucion' (compara test 1 vs test 2)",
             "'Poker Routine: A Blueprint for Success' — Jonathan Little (PokerCoaching.com)"],
        milestone:'Test de re-evaluacion completado. Mejora documentada y plan de 3 meses redactado.',
      },
    ],
    pt: [
      { n:1, phase:t.phase1, color:'mental', theme:'Construir a Rotina de Estudo',
        focus:'Habitos (Area Critica)', obj:'Estabelecer uma rotina diaria de estudo consistente e um sistema de registro de sessoes.',
        days:[
          {d:'SEG',t:30,task:'Descreva sua rotina semanal de estudo: horarios, duracao e tipo de analise.'},
          {d:'TER',t:20,task:'Crie seu diario de sessoes. Primeira entrada: metas da semana e estado mental.'},
          {d:'QUA',t:25,task:"Leia cap. 1-2 de 'The Mental Game of Poker': fundamentos de habitos de estudo."},
          {d:'QUI',t:30,task:'Analise 5 maos pos-sessao com notas escritas: o que decidiu e por que.'},
          {d:'SEX',t:15,task:'Escreva suas 3 metas de melhora para este plano em local visivel.'},
          {d:'SAB',t:60,task:'Sessao de jogo com diario ativo: anote decisoes-chave em tempo real.'},
          {d:'DOM',t:20,task:'Revisao semanal: cumpriu a rotina? O que ajustar na proxima semana?'},
        ],
        res:["'The Mental Game of Poker' — Jared Tendler & Barry Carter (cap. 1-3)",
             'Pokerology.com — Guia de estudo sistematico para jogadores em desenvolvimento'],
        milestone:'7 entradas no diario de sessoes. Rotina aplicada 5 de 7 dias.',
      },
      { n:2, phase:t.phase1, color:'mental', theme:'Protocolo de Ativacao Pre-Sessao',
        focus:'Habitos (continuacao)', obj:'Criar e aplicar um protocolo de preparacao mental sistematico antes de cada sessao.',
        days:[
          {d:'SEG',t:20,task:'Crie seu checklist pre-sessao: estado fisico, mental, objetivos e stop-loss.'},
          {d:'TER',t:10,task:'Pratique tecnica de respiracao 4-7-8 durante 3 ciclos antes de jogar.'},
          {d:'QUA',t:15,task:'Defina limites de sessao: stop-loss (3 buy-ins) e duracao maxima (2 h).'},
          {d:'QUI',t:25,task:'Revisao de 5 maos criticas de semanas anteriores com notas de contexto emocional.'},
          {d:'SEX',t:45,task:'Sessao com checklist aplicado. Anote como se sente ao longo do jogo.'},
          {d:'SAB',t:20,task:'Analise a sessao de sexta: cumpriu o protocolo? Houve tilt? Quanto?'},
          {d:'DOM',t:15,task:'Ajuste o checklist com os aprendizados da semana. Versao 2.0.'},
        ],
        res:["'The Mental Game of Poker' cap. 4-5 (preparacao e rotinas)",
             "YouTube: 'Pre-Poker Session Routine' — Jonathan Little (Canal PokerCoaching)"],
        milestone:'Protocolo pre-sessao documentado e aplicado em todas as sessoes da semana.',
      },
      { n:3, phase:t.phase1, color:'mental', theme:'Identificar Padroes de Tilt',
        focus:'Gestao do Tilt', obj:'Mapear os tipos e gatilhos de tilt para antecipa-los e neutraliza-los.',
        days:[
          {d:'SEG',t:20,task:"Estude 'Os 7 Tipos de Tilt' de Jared Tendler. Identifique os seus."},
          {d:'TER',t:30,task:'Crie seu Mapa de Gatilhos: situacoes que provocam seu tilt.'},
          {d:'QUA',t:45,task:'Sessao de jogo: identifique momentos de tilt em tempo real e anote.'},
          {d:'QUI',t:25,task:'Analise 3 maos sob tilt: qual erro cometeu? Qual era a jogada correta?'},
          {d:'SEX',t:20,task:'Crie seu sinal de alerta pessoal: a frase ou sensacao que indica tilt iminente.'},
          {d:'SAB',t:45,task:"Aplique tecnica 'Pause Button': pare 60 seg ao identificar o gatilho."},
          {d:'DOM',t:20,task:'Revisao: quantos tilts detectou? Evitou algum? O que funcionou?'},
        ],
        res:["'The Mental Game of Poker' cap. 6-8 (tilt, tipos e causas)",
             "Upswing Poker: 'How to Deal with Bad Beats and Stop Tilting' (artigo gratuito)"],
        milestone:'Mapa de Gatilhos completo com pelo menos 5 gatilhos pessoais identificados.',
      },
      { n:4, phase:t.phase1, color:'mental', theme:'Tecnicas de Controle do Tilt',
        focus:'Gestao do Tilt (aplicacao)', obj:'Implementar tecnicas praticas para interromper o ciclo do tilt em tempo real.',
        days:[
          {d:'SEG',t:15,task:"Aprenda tecnica 'Breathing Reset': 4 respiracoes lentas ao sentir tilt."},
          {d:'TER',t:20,task:'Crie seu mantra anti-tilt pessoal (frase curta que te centra no processo).'},
          {d:'QUA',t:20,task:'Pratique visualizacao: imagine 5 min uma sessao perfeita de tomada de decisoes.'},
          {d:'QUI',t:45,task:'Sessao com mantra ativo: repita-o ao inicio e sempre que sentir pressao.'},
          {d:'SEX',t:25,task:'Analise 5 decisoes sob pressao desta semana. Quao equilibradas foram?'},
          {d:'SAB',t:30,task:"Roleplay com um colega: simule spots dificeis e pratique o 'pause button'."},
          {d:'DOM',t:20,task:'Journaling: melhorou seu controle vs semana 3? Qual tecnica funciona melhor?'},
        ],
        res:["'Emotional Agility' — Susan David (cap. sobre manejo de emocoes sob pressao)",
             "Podcast: 'The Mental Game Podcast' — Jared Tendler, episodio 'Tilt Control'"],
        milestone:'Reduzir em 50% as sessoes encerradas por tilt em comparacao com a semana 3.',
      },
      { n:5, phase:t.phase1, color:'mental', theme:'Consolidacao Mental',
        focus:'Integracao habitos + tilt', obj:'Automatizar as habilidades mentais e preparar a transicao para a fase tecnica.',
        days:[
          {d:'SEG',t:20,task:'Revisao completa de habitos: o que manter, o que melhorar, o que eliminar.'},
          {d:'TER',t:15,task:'Atualize seu protocolo pre-sessao com os aprendizados das 4 semanas.'},
          {d:'QUA',t:60,task:'Sessao de jogo com journal integrado: mental + decisoes tecnicas basicas.'},
          {d:'QUI',t:25,task:'Compare seu estado mental semana 1 vs semana 5. Escreva 3 melhoras concretas.'},
          {d:'SEX',t:20,task:'Defina 3 objetivos tecnicos para a Fase 2. Anote-os no plano.'},
          {d:'SAB',t:120,task:'Sessao longa (2h): aplique TUDO o que aprendeu na fase mental.'},
          {d:'DOM',t:25,task:"Sintese escrita: 'Meu perfil mental atual' — forcas, fraquezas e plano."},
        ],
        res:["'Poker Mindset: Your Secret Weapon' — Taylor Caby (artigo Cardrunners)",
             "Mental Game Podcast: episodio 'Sustaining Improvement Over Time'"],
        milestone:"Journal de 5 semanas completo + autoavaliacao com 70%+ de cumprimento.",
      },
      { n:6, phase:t.phase2, color:'technical', theme:'Linhas de Turn: Teoria',
        focus:'Linhas de Turn', obj:'Compreender a teoria de continuation bets, checks e linhas otimas no turn.',
        days:[
          {d:'SEG',t:25,task:'Estude frequencias de c-bet no turn: quando continuar, quando check-fold.'},
          {d:'TER',t:30,task:'Teoria de equity e protecao de range no turn. Analise 3 boards com solver.'},
          {d:'QUA',t:25,task:'Conceitos de barrel: double barrel vs check-call vs check-raise no turn.'},
          {d:'QUI',t:30,task:'Analise 10 maos de turn de pros (YouTube/RIO): justifique cada linha escolhida.'},
          {d:'SEX',t:20,task:'Quiz mental: diante de um turn card especifico, qual e sua linha e por que?'},
          {d:'SAB',t:45,task:'Sessao focada: comente em voz alta seu raciocinio em cada turno jogado.'},
          {d:'DOM',t:25,task:'Revisao de maos de turn da sessao de sabado com solver.'},
        ],
        res:["'Applications of No-Limit Hold'em' — Matthew Janda (cap. turn play)",
             "GTO+ ou PIO Solver — analise de frequencias otimas no turn por tipo de board"],
        milestone:'10 maos de turn analisadas com justificativa escrita da linha escolhida.',
      },
      { n:7, phase:t.phase2, color:'technical', theme:'Linhas de Turn: Aplicacao',
        focus:'Linhas de Turn (pratica)', obj:'Aplicar linhas de turn de forma consistente usando ranges reais das sessoes.',
        days:[
          {d:'SEG',t:25,task:'Analise 5 spots de turn OOP de suas sessoes recentes com solver.'},
          {d:'TER',t:25,task:'Analise 5 spots de turn IP de suas sessoes recentes com solver.'},
          {d:'QUA',t:30,task:'Construcao de ranges no turn: aprenda a balancear value e bluffs.'},
          {d:'QUI',t:45,task:'Sessao de jogo: marque todas as maos de turn para revisao posterior.'},
          {d:'SEX',t:30,task:'Revise as maos marcadas de quinta com solver. Meca seu desvio do otimo.'},
          {d:'SAB',t:45,task:'Workshop com colega: debata 3 spots de turn dificeis. Justifique sua linha.'},
          {d:'DOM',t:15,task:'Sintese: seus 3 erros mais frequentes no turn. Plano para corrigi-los.'},
        ],
        res:["Run It Once Elite: 'Turn Play Masterclass' (acesso gratuito primeiros 30 dias)",
             'PokerCoachingUniversity.com — modulo de linhas no turn (conteudo gratuito)'],
        milestone:'Consistencia em linha de turn maior que 70% segundo analise com solver.',
      },
      { n:8, phase:t.phase2, color:'technical', theme:'River Value: Sizing Otimo',
        focus:'River Value', obj:'Maximizar o valor no river escolhendo o sizing correto segundo a textura e o range.',
        days:[
          {d:'SEG',t:25,task:'Teoria de polarizacao de ranges no river: value, bluff e maos de showdown.'},
          {d:'TER',t:25,task:'Sizing do river: quando usar sizing pequeno, medio ou overbet.'},
          {d:'QUA',t:30,task:'Analise 10 maos de river value de jogadores de alto nivel (videos/solver).'},
          {d:'QUI',t:45,task:'Sessao focada em river bets: marque todas as decisoes de river.'},
          {d:'SEX',t:30,task:'Revisao com solver: escolheu o sizing correto? Calcule a diferenca de EV.'},
          {d:'SAB',t:25,task:'Estudo de bluff catching no river: frequencias e como se defender de overbets.'},
          {d:'DOM',t:20,task:'Lista de padroes de sizing vs tipo de board (seco, molhado, pareado, monotono).'},
        ],
        res:["'No-Limit Hold'em Theory and Practice' — Sklansky & Miller (cap. river decisions)",
             "YouTube: Poker Detox — 'River Sizing Masterclass' (gratuito, 45 min)"],
        milestone:'10 spots de river value analisados com sizing otimo documentado e justificado.',
      },
      { n:9, phase:t.phase2, color:'technical', theme:'River: Bluffs e Equilibrio',
        focus:'River Value (disciplina)', obj:'Construir um range de river equilibrado: value, bluffs e frequencias corretas.',
        days:[
          {d:'SEG',t:25,task:'Teoria de blocker bets no river: selecao de maos para bluff.'},
          {d:'TER',t:25,task:'Frequencias otimas de bluff por tipo de board. Quando voce sobre-bluffa?'},
          {d:'QUA',t:30,task:'Analise 5 spots onde sobre-bluffou nos ultimos 30 dias.'},
          {d:'QUI',t:30,task:'Analise 5 spots onde nao protegeu suficientemente seu range no river.'},
          {d:'SEX',t:45,task:'Sessao com foco em equilibrio river: nem value nem bluff demais.'},
          {d:'SAB',t:30,task:'Review completo de river plays da semana com solver. Meca sua frequencia real.'},
          {d:'DOM',t:20,task:'Journaling tecnico: melhorou seu EV estimado no river vs semana 8?'},
        ],
        res:["'Mastering Small Stakes No-Limit Hold'em' — Carter Gill (cap. river play)",
             "PokerCoaching.com: modulo de river strategy — 'Balancing Your River Range'"],
        milestone:'Percentual de bluffs no river entre 30-40% segundo analise de 20 maos do solver.',
      },
      { n:10, phase:t.phase3, color:'integration', theme:'Aplicacao Mental + Tecnica ao Vivo',
        focus:'Integracao (mental + turn + river)', obj:'Aplicar simultaneamente as habilidades mentais e tecnicas em sessoes reais.',
        days:[
          {d:'SEG',t:20,task:'Crie seu checklist integrado: mental (tilt, habitos) + tecnico (turn, river).'},
          {d:'TER',t:60,task:'Sessao de jogo com duplo foco: controle de tilt e qualidade de decisoes turn/river.'},
          {d:'QUA',t:25,task:'Revisao completa: houve tilt? Acertou as linhas turn/river? Qualidade: 1-10.'},
          {d:'QUI',t:30,task:'Analise 3 spots criticos com solver + notas sobre seu estado emocional no momento.'},
          {d:'SEX',t:60,task:'Segunda sessao da semana com gravacao de audio (raciocinio em voz alta).'},
          {d:'SAB',t:30,task:'Revisao da gravacao: detecte padroes de erro sob pressao emocional.'},
          {d:'DOM',t:20,task:'Ajuste o checklist para as 2 semanas finais com o que aprendeu.'},
        ],
        res:["Poker Bankroll Tracker app — registro integrado de sessoes",
             "Planilha propria: colunas mental/tecnico/resultado para medir correlacao"],
        milestone:'2 sessoes completas com journal integrado (mental + tecnico) e analise posterior.',
      },
      { n:11, phase:t.phase3, color:'integration', theme:'Sistema de Analise Pos-Sessao',
        focus:'Habitos de analise sustentaveis', obj:'Construir um sistema de analise pos-sessao eficiente e repetivel a longo prazo.',
        days:[
          {d:'SEG',t:20,task:'Crie seu modelo padrao de analise: campos fixos para cada sessao.'},
          {d:'TER',t:30,task:'Pratique analise completa de uma sessao recente usando o modelo.'},
          {d:'QUA',t:60,task:'Sessao de jogo (60 min) + analise imediata com modelo (30 min).'},
          {d:'QUI',t:25,task:'Identifique seus 3 padroes de erro mais frequentes das ultimas 11 semanas.'},
          {d:'SEX',t:30,task:'Trabalhe especificamente esses 3 erros com solver. Busque a solucao otima.'},
          {d:'SAB',t:60,task:'Sessao longa (60 min) + analise diferida no dia seguinte (planejada).'},
          {d:'DOM',t:20,task:'Avaliacao: seu sistema de analise e sustentavel? Quanto tempo leva? E util?'},
        ],
        res:["Modelo de analise de sessao MindEV-IA (disponivel no Dashboard)",
             "'The Course: Serious Hold'em Strategy For Smart Players' — Ed Miller"],
        milestone:'Sistema de analise documentado e aplicado consistentemente em 3 sessoes.',
      },
      { n:12, phase:t.phase3, color:'integration', theme:'Re-teste, Medicao e Projecao',
        focus:'Avaliacao do progresso real', obj:'Medir o progresso real do plano de 12 semanas e definir os proximos 3 meses.',
        days:[
          {d:'SEG',t:25,task:'Releia suas primeiras entradas do diario (semana 1). Quanto avancou?'},
          {d:'TER',t:20,task:'Realize o Teste Mental completo no MindEV-IA. Anote seu estado antes do teste.'},
          {d:'QUA',t:20,task:'Realize o Teste Tecnico completo no MindEV-IA. Compare com o anterior.'},
          {d:'QUI',t:20,task:'Compare resultados: antes vs agora por cada area. Calcule a melhora percentual.'},
          {d:'SEX',t:20,task:'Defina seus proximos 3 objetivos de desenvolvimento. Seja especifico e mensuravel.'},
          {d:'SAB',t:60,task:'Sessao de celebracao: jogue com qualidade, sem pressao de resultado.'},
          {d:'DOM',t:30,task:'Escreva seu plano dos proximos 3 meses. Use a aba Evolucao do MindEV-IA.'},
        ],
        res:["Dashboard de Evolucao MindEV-IA — aba 'Evolucao' (compara teste 1 vs teste 2)",
             "'Poker Routine: A Blueprint for Success' — Jonathan Little (PokerCoaching.com)"],
        milestone:'Teste de reavaliacao concluido. Melhora documentada e plano de 3 meses escrito.',
      },
    ],
    en: [
      { n:1, phase:t.phase1, color:'mental', theme:'Building the Study Routine',
        focus:'Habits (Critical Area)', obj:'Establish a consistent daily study routine and a session tracking system.',
        days:[
          {d:'MON',t:30,task:'Design your weekly study routine: schedule, duration and type of analysis.'},
          {d:'TUE',t:20,task:'Create your session journal. First entry: weekly goals and mental state.'},
          {d:'WED',t:25,task:"Read ch. 1-2 of 'The Mental Game of Poker': fundamentals of study habits."},
          {d:'THU',t:30,task:'Analyse 5 hands post-session with written notes: what you decided and why.'},
          {d:'FRI',t:15,task:'Write your 3 improvement goals for this plan and place them where you can see them.'},
          {d:'SAT',t:60,task:'Play session with active journal: note key decisions in real time.'},
          {d:'SUN',t:20,task:'Weekly review: did you follow the routine? What to adjust for next week?'},
        ],
        res:["'The Mental Game of Poker' — Jared Tendler & Barry Carter (ch. 1-3)",
             'Pokerology.com — Systematic study guide for developing players'],
        milestone:'7 entries completed in the session journal. Routine written and applied 5 of 7 days.',
      },
      { n:2, phase:t.phase1, color:'mental', theme:'Pre-Session Activation Protocol',
        focus:'Habits (continued)', obj:'Create and apply a systematic mental preparation protocol before each session.',
        days:[
          {d:'MON',t:20,task:'Design your pre-session checklist: physical state, mental state, goals and stop-loss.'},
          {d:'TUE',t:10,task:'Practise the 4-7-8 breathing technique for 3 cycles before playing.'},
          {d:'WED',t:15,task:'Set your session limits: stop-loss (3 buy-ins) and maximum duration (2 h).'},
          {d:'THU',t:25,task:'Review 5 critical hands from previous weeks with emotional context notes.'},
          {d:'FRI',t:45,task:'Session with checklist applied from the first moment. Note how you feel.'},
          {d:'SAT',t:20,task:"Analyse Friday's session: did you follow the protocol? Was there tilt? How much?"},
          {d:'SUN',t:15,task:'Update the checklist with the week\'s learnings. Version 2.0.'},
        ],
        res:["'The Mental Game of Poker' ch. 4-5 (preparation and routines)",
             "YouTube: 'Pre-Poker Session Routine' — Jonathan Little (PokerCoaching channel)"],
        milestone:'Pre-session protocol documented and applied in all sessions of the week.',
      },
      { n:3, phase:t.phase1, color:'mental', theme:'Identifying Tilt Patterns',
        focus:'Tilt Management', obj:'Map your own tilt types and triggers to anticipate and neutralise them.',
        days:[
          {d:'MON',t:20,task:"Study 'The 7 Types of Tilt' by Jared Tendler. Identify yours."},
          {d:'TUE',t:30,task:'Create your Trigger Map: situations that cause you to tilt (bad beats, bluffs, etc).'},
          {d:'WED',t:45,task:'Play session: identify tilt moments in real time and note them down.'},
          {d:'THU',t:25,task:'Analyse 3 hands played under tilt: what mistake did you make? What was correct?'},
          {d:'FRI',t:20,task:'Design your personal warning signal: the phrase or feeling that indicates imminent tilt.'},
          {d:'SAT',t:45,task:"Apply the 'Pause Button' technique: stop for 60 sec when you identify the trigger."},
          {d:'SUN',t:20,task:'Review: how many tilts did you detect? Did you avoid any? What worked?'},
        ],
        res:["'The Mental Game of Poker' ch. 6-8 (tilt, types and causes)",
             "Upswing Poker: 'How to Deal with Bad Beats and Stop Tilting' (free article)"],
        milestone:'Trigger Map completed with at least 5 personal triggers identified.',
      },
      { n:4, phase:t.phase1, color:'mental', theme:'Tilt Control Techniques',
        focus:'Tilt Management (application)', obj:'Implement practical techniques to interrupt the tilt cycle in real time.',
        days:[
          {d:'MON',t:15,task:"Learn the 'Breathing Reset' technique: 4 slow breaths when you feel tilt."},
          {d:'TUE',t:20,task:'Create your personal anti-tilt mantra (short phrase that centres you on the process).'},
          {d:'WED',t:20,task:'Practise visualisation: imagine 5 min of a perfect decision-making session.'},
          {d:'THU',t:45,task:'Session with active mantra: repeat it at the start and every time you feel pressure.'},
          {d:'FRI',t:25,task:'Analyse 5 decisions under pressure this week. How balanced were they?'},
          {d:'SAT',t:30,task:"Roleplay with a partner: simulate tough spots and practise the 'pause button'."},
          {d:'SUN',t:20,task:'Journaling: did your control improve vs week 3? Which technique works best for you?'},
        ],
        res:["'Emotional Agility' — Susan David (ch. on managing emotions under pressure)",
             "Podcast: 'The Mental Game Podcast' — Jared Tendler, episode 'Tilt Control'"],
        milestone:'Reduce by 50% sessions ended due to tilt compared to week 3.',
      },
      { n:5, phase:t.phase1, color:'mental', theme:'Mental Consolidation',
        focus:'Integrating habits + tilt', obj:'Automate mental skills and prepare the transition to the technical phase.',
        days:[
          {d:'MON',t:20,task:'Full habits review: what to keep, what to improve, what to eliminate.'},
          {d:'TUE',t:15,task:'Update your pre-session protocol with the learnings from the 4 weeks.'},
          {d:'WED',t:60,task:'Play session with integrated journal: mental + basic technical decisions.'},
          {d:'THU',t:25,task:'Compare your mental state week 1 vs week 5. Write 3 concrete improvements.'},
          {d:'FRI',t:20,task:'Define 3 technical goals for Phase 2. Note them in the plan.'},
          {d:'SAT',t:120,task:'Long session (2h): apply EVERYTHING learnt in the mental phase.'},
          {d:'SUN',t:25,task:"Written synthesis: 'My current mental profile' — strengths, weaknesses and plan."},
        ],
        res:["'Poker Mindset: Your Secret Weapon' — Taylor Caby (Cardrunners article)",
             "Mental Game Podcast: episode 'Sustaining Improvement Over Time'"],
        milestone:"5-week journal complete + self-assessment of habits with 70%+ compliance.",
      },
      { n:6, phase:t.phase2, color:'technical', theme:'Turn Lines: Theory',
        focus:'Turn Lines', obj:'Understand the theory of continuation bets, checks and optimal lines on the turn.',
        days:[
          {d:'MON',t:25,task:'Study turn c-bet frequencies: when to continue, when to check-fold.'},
          {d:'TUE',t:30,task:'Equity and range protection theory on the turn. Analyse 3 boards with solver.'},
          {d:'WED',t:25,task:'Barrel concepts: double barrel vs check-call vs check-raise on the turn.'},
          {d:'THU',t:30,task:'Analyse 10 turn hands from pros (YouTube/RIO): justify each line chosen.'},
          {d:'FRI',t:20,task:'Mental quiz: given a specific turn card, what is your line and why?'},
          {d:'SAT',t:45,task:'Focused session: narrate your reasoning aloud on every turn played.'},
          {d:'SUN',t:25,task:"Review Saturday's turn hands with solver."},
        ],
        res:["'Applications of No-Limit Hold'em' — Matthew Janda (ch. turn play)",
             "GTO+ or PIO Solver — analysis of optimal turn frequencies by board type"],
        milestone:'10 turn hands analysed with written justification of the line chosen.',
      },
      { n:7, phase:t.phase2, color:'technical', theme:'Turn Lines: Application',
        focus:'Turn Lines (practice)', obj:'Apply turn lines consistently using real ranges from your sessions.',
        days:[
          {d:'MON',t:25,task:'Analyse 5 OOP turn spots from your recent sessions with solver.'},
          {d:'TUE',t:25,task:'Analyse 5 IP turn spots from your recent sessions with solver.'},
          {d:'WED',t:30,task:'Turn range construction: learn to balance value and bluffs.'},
          {d:'THU',t:45,task:'Play session: tag all turn hands for later review.'},
          {d:'FRI',t:30,task:"Review Thursday's tagged hands with solver. Measure your deviation from optimal."},
          {d:'SAT',t:45,task:'Workshop with a partner: debate 3 tough turn spots. Justify your line.'},
          {d:'SUN',t:15,task:'Synthesis: your 3 most frequent errors on the turn. Plan to correct them.'},
        ],
        res:["Run It Once Elite: 'Turn Play Masterclass' (free first 30 days)",
             'PokerCoachingUniversity.com — turn lines module (free content)'],
        milestone:'Turn line consistency above 70% according to solver analysis.',
      },
      { n:8, phase:t.phase2, color:'technical', theme:'River Value: Optimal Sizing',
        focus:'River Value', obj:'Maximise value on the river by choosing the correct sizing based on texture and range.',
        days:[
          {d:'MON',t:25,task:'Range polarisation theory on the river: value, bluff and showdown hands.'},
          {d:'TUE',t:25,task:'River sizing: when to use small, medium or overbet sizing.'},
          {d:'WED',t:30,task:'Analyse 10 river value hands from high-level players (videos/solver).'},
          {d:'THU',t:45,task:'Focused session on river bets: tag all river decisions.'},
          {d:'FRI',t:30,task:'Solver review: did you choose the right sizing? Calculate the EV difference.'},
          {d:'SAT',t:25,task:'Study bluff catching on the river: frequencies and how to defend against overbets.'},
          {d:'SUN',t:20,task:'List sizing patterns vs board type (dry, wet, paired, monotone).'},
        ],
        res:["'No-Limit Hold'em Theory and Practice' — Sklansky & Miller (ch. river decisions)",
             "YouTube: Poker Detox — 'River Sizing Masterclass' (free, 45 min)"],
        milestone:'10 river value spots analysed with optimal sizing documented and justified.',
      },
      { n:9, phase:t.phase2, color:'technical', theme:'River: Bluffs and Balance',
        focus:'River Value (discipline)', obj:'Build a balanced river range: value, bluffs and correct frequencies.',
        days:[
          {d:'MON',t:25,task:'River blocker bet theory: hand selection for bluffing.'},
          {d:'TUE',t:25,task:'Optimal bluff frequencies by board type. When do you over-bluff?'},
          {d:'WED',t:30,task:'Analyse 5 spots where you over-bluffed in the last 30 days.'},
          {d:'THU',t:30,task:'Analyse 5 spots where you did not protect your range enough on the river.'},
          {d:'FRI',t:45,task:'Session focused on river balance: not too much value, not too much bluff.'},
          {d:'SAT',t:30,task:"Full review of the week's river plays with solver. Measure your actual frequency."},
          {d:'SUN',t:20,task:'Technical journaling: did your estimated river EV improve vs week 8?'},
        ],
        res:["'Mastering Small Stakes No-Limit Hold'em' — Carter Gill (ch. river play)",
             "PokerCoaching.com: river strategy module — 'Balancing Your River Range'"],
        milestone:'River bluff percentage between 30-40% according to solver analysis of 20 hands.',
      },
      { n:10, phase:t.phase3, color:'integration', theme:'Live Mental + Technical Application',
        focus:'Integration (mental + turn + river)', obj:'Simultaneously apply mental and technical skills in real sessions.',
        days:[
          {d:'MON',t:20,task:'Design your integrated checklist: mental (tilt, habits) + technical (turn, river).'},
          {d:'TUE',t:60,task:'Play session with dual focus: tilt control and turn/river decision quality.'},
          {d:'WED',t:25,task:'Full review: was there tilt? Did you get the turn/river lines right? Quality: 1-10.'},
          {d:'THU',t:30,task:'Analyse 3 critical spots with solver + notes on your emotional state at that moment.'},
          {d:'FRI',t:60,task:'Second session of the week with audio recording (reasoning aloud).'},
          {d:'SAT',t:30,task:'Recording review: detect error patterns under emotional pressure.'},
          {d:'SUN',t:20,task:'Adjust the checklist for the final 2 weeks based on what you learned.'},
        ],
        res:["Poker Bankroll Tracker app — integrated session tracking",
             "Own spreadsheet: mental/technical/result columns to measure correlation"],
        milestone:'2 complete sessions with integrated journal (mental + technical) and subsequent analysis.',
      },
      { n:11, phase:t.phase3, color:'integration', theme:'Post-Session Analysis System',
        focus:'Sustainable analysis habits', obj:'Build an efficient and repeatable post-session analysis system for the long term.',
        days:[
          {d:'MON',t:20,task:'Design your standard analysis template: fixed fields for each session.'},
          {d:'TUE',t:30,task:'Practise a full analysis of a recent session using the template.'},
          {d:'WED',t:60,task:'Play session (60 min) + immediate analysis with template (30 min).'},
          {d:'THU',t:25,task:'Identify your 3 most frequent error patterns from the last 11 weeks.'},
          {d:'FRI',t:30,task:'Work specifically on those 3 errors with solver. Find the optimal solution.'},
          {d:'SAT',t:60,task:'Long session (60 min) + deferred analysis the following day (planned).'},
          {d:'SUN',t:20,task:'Evaluation: is your analysis system sustainable? How long does it take? Is it useful?'},
        ],
        res:["MindEV-IA session analysis template (available in the Dashboard)",
             "'The Course: Serious Hold'em Strategy For Smart Players' — Ed Miller"],
        milestone:'Analysis system documented and consistently applied in 3 sessions.',
      },
      { n:12, phase:t.phase3, color:'integration', theme:'Re-test, Measurement and Projection',
        focus:'Measuring real progress', obj:'Measure the real progress of the 12-week plan and define the next 3 months.',
        days:[
          {d:'MON',t:25,task:'Re-read your first journal entries (week 1). How far have you come?'},
          {d:'TUE',t:20,task:'Complete the full Mental Test on MindEV-IA. Note your state beforehand.'},
          {d:'WED',t:20,task:'Complete the full Technical Test on MindEV-IA. Compare with the previous one.'},
          {d:'THU',t:20,task:'Compare results: before vs now for each area. Calculate the percentage improvement.'},
          {d:'FRI',t:20,task:'Define your next 3 development goals. Be specific and measurable.'},
          {d:'SAT',t:60,task:'Celebration session: play with quality, no pressure on results.'},
          {d:'SUN',t:30,task:'Write your 3-month plan. Use the Evolution tab in MindEV-IA.'},
        ],
        res:["MindEV-IA Evolution Dashboard — 'Evolution' tab (compares test 1 vs test 2)",
             "'Poker Routine: A Blueprint for Success' — Jonathan Little (PokerCoaching.com)"],
        milestone:'Re-evaluation test completed. Improvement documented and 3-month plan written.',
      },
    ],
  };
  return weeks[lang] || weeks.es;
}

// ── Helper compartido: obtiene datos del usuario para PDF y Excel ─────────────
async function _wbGetUserData() {
  const lang = (typeof I18N !== 'undefined') ? (I18N.lang || 'es') : 'es';
  const user = (typeof Api !== 'undefined') ? Api.currentUser() : null;

  let mentalSc = (typeof _dashMentalSc !== 'undefined') ? _dashMentalSc : null;
  let techSc   = (typeof _dashTechSc   !== 'undefined') ? _dashTechSc   : null;

  if (!mentalSc && !techSc && typeof Api !== 'undefined') {
    try {
      const data = await Api.get('/api/dashboard');
      const history = data.history || [];
      const mh = history.filter(s => !s.test_type || s.test_type === 'mental');
      const th = history.filter(s => s.test_type === 'technical');
      const gs = s => s ? (typeof s.scores === 'string' ? JSON.parse(s.scores) : s.scores) : null;
      mentalSc = gs(mh[0] || null);
      techSc   = gs(th[0] || null);
    } catch (e) { console.warn('[Workbook] No se pudieron obtener scores:', e); }
  }

  const mentalOv = (mentalSc && typeof getOverallScore === 'function')         ? getOverallScore(mentalSc)        : null;
  const techOv   = (techSc   && typeof getTechnicalOverallScore === 'function') ? getTechnicalOverallScore(techSc) : null;

  const now = new Date();
  const dateMap = {
    es: now.toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' }),
    pt: now.toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' }),
    en: now.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }),
  };

  return {
    lang,
    playerName: ((user?.nombre || user?.name || 'Usuario').toUpperCase()),
    dateStr:    dateMap[lang] || dateMap.es,
    mentalSc:   mentalSc || {},
    techSc:     techSc   || {},
    mentalOv:   mentalOv !== null ? mentalOv : 0,
    techOv:     techOv   !== null ? techOv   : 0,
    hasMental:  !!mentalSc,
    hasTech:    !!techSc,
  };
}

// ── Entrada pública — PDF ─────────────────────────────────────────────────────
async function generateWorkbook() {
  const btn = document.getElementById('wb-pdf-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ PDF'; }
  try {
    const d = await _wbGetUserData();
    await wbBuildPDF(d);
  } catch (e) {
    console.error('[Workbook PDF]', e);
    alert(I18N.isEN() ? 'Error generating PDF. Please try again.' : I18N.isPT() ? 'Erro ao gerar PDF. Tente novamente.' : 'Error al generar el PDF. Intenta de nuevo.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '📋 PDF'; }
  }
}

// ── Entrada pública — Excel ───────────────────────────────────────────────────
async function generateWorkbookExcel() {
  const btn = document.getElementById('wb-excel-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Excel'; }
  try {
    const d = await _wbGetUserData();
    await wbBuildExcel(d);
  } catch (e) {
    console.error('[Workbook Excel]', e);
    alert(I18N.isEN() ? 'Error generating Excel. Please try again.' : I18N.isPT() ? 'Erro ao gerar Excel. Tente novamente.' : 'Error al generar el Excel. Intenta de nuevo.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '📊 Excel'; }
  }
}

// (mantener compatibilidad con código viejo que busque wb-download-btn)
async function _wbGenerate() {
  const lang = (typeof I18N !== 'undefined') ? (I18N.lang || 'es') : 'es';
  const user = (typeof Api !== 'undefined') ? Api.currentUser() : null;

  let mentalSc = (typeof _dashMentalSc !== 'undefined') ? _dashMentalSc : null;
  let techSc   = (typeof _dashTechSc   !== 'undefined') ? _dashTechSc   : null;

  if (!mentalSc && !techSc && typeof Api !== 'undefined') {
    try {
      const data = await Api.get('/api/dashboard');
      const history = data.history || [];
      const mh = history.filter(s => !s.test_type || s.test_type === 'mental');
      const th = history.filter(s => s.test_type === 'technical');
      const gs = s => s ? (typeof s.scores === 'string' ? JSON.parse(s.scores) : s.scores) : null;
      mentalSc = gs(mh[0] || null);
      techSc   = gs(th[0] || null);
    } catch (e) { console.warn('[Workbook] No se pudieron obtener scores:', e); }
  }

  const mentalOv = (mentalSc && typeof getOverallScore === 'function')         ? getOverallScore(mentalSc)        : null;
  const techOv   = (techSc   && typeof getTechnicalOverallScore === 'function') ? getTechnicalOverallScore(techSc) : null;

  const now = new Date();
  const dateMap = {
    es: now.toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' }),
    pt: now.toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' }),
    en: now.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }),
  };

  const playerName = ((user?.nombre || user?.name || 'Usuario').toUpperCase());

  await wbBuildPDF({
    lang,
    playerName,
    dateStr:   dateMap[lang] || dateMap.es,
    mentalSc:  mentalSc  || {},
    techSc:    techSc    || {},
    mentalOv:  mentalOv  !== null ? mentalOv  : 0,
    techOv:    techOv    !== null ? techOv    : 0,
    hasMental: !!mentalSc,
    hasTech:   !!techSc,
  });
}

// ── Constructor del PDF ───────────────────────────────────────────────────────
async function wbBuildPDF({ lang, playerName, dateStr, mentalSc, techSc, mentalOv, techOv, hasMental, hasTech }) {
  const logoPng = await wbSvgToPng(WB_ICON_SVG, 384, 384);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });

  const W=210, H=297, ML=20, MR=15, MT=22, MB=20;
  const TW = W - ML - MR;
  let y = MT, pageNum = 1;
  const t = WB_T[lang] || WB_T.es;
  const weeks = wbGetWeeks(lang);

  const GOLD=[212,175,55], TEAL=[77,182,172], PURPLE=[129,140,248], DARK=[10,14,26];
  const NAVY=[15,23,42], SLATE=[51,65,85], MUTED=[100,116,139], WHITE=[255,255,255];
  const BLACK=[26,26,46], GREEN=[74,222,128], RED=[239,68,68], AMBER=[245,158,11];

  function scoreLevel(v) {
    if (v < 55) return { lbl: t.lvlCrit, c: RED };
    if (v < 65) return { lbl: t.lvlLow,  c: AMBER };
    if (v < 75) return { lbl: t.lvlMed,  c: [251,191,36] };
    if (v < 88) return { lbl: t.lvlHigh, c: TEAL };
    return              { lbl: t.lvlExc,  c: GREEN };
  }

  function txt(text, x, yw, size, style, color, align) {
    doc.setFontSize(size); doc.setFont('helvetica', style); doc.setTextColor(...color);
    doc.text(String(text), x, yw, align ? { align } : undefined);
  }

  function needsPage(h) {
    if (y + h > H - MB) {
      doc.addPage(); pageNum++;
      y = MT;
      drawHeader(); drawFooter();
      return true;
    }
    return false;
  }

  function drawHeader() {
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
    doc.line(ML, 10, W-MR, 10);
    doc.setFillColor(...DARK); doc.roundedRect(ML, 4, 22, 7, 1.5, 1.5, 'F');
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
    doc.roundedRect(ML, 4, 22, 7, 1.5, 1.5, 'S');
    txt('MindEV', ML+11, 9.2, 5.5, 'bold', GOLD, 'center');
    txt(`${t.pageOf} ${pageNum}`, W-MR, 9, 6, 'normal', MUTED, 'right');
    txt(playerName, W/2, 9, 5.5, 'normal', MUTED, 'center');
  }

  function drawFooter() {
    const fy = H - 8;
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
    doc.line(ML, fy-3, W-MR, fy-3);
    txt(t.url, ML, fy, 6, 'normal', MUTED, 'left');
    txt('MindEV-IA  ' + t.title, W/2, fy, 6, 'italic', MUTED, 'center');
    txt(dateStr, W-MR, fy, 6, 'normal', MUTED, 'right');
  }

  // ── Labels de categorías desde I18N (o fallback hardcoded) ──────────────────
  function getMentalLabel(key) {
    if (typeof I18N !== 'undefined') {
      const c = I18N.cats().find(x => x.key === key);
      if (c) return c.label;
    }
    const fb = { tolerancia:'Tolerance/Tolerancia', habitos:'Habits/Habitos', paciencia:'Patience/Paciencia',
      autocontrol:'Self-Control/Autocontrol', disciplina:'Discipline/Disciplina', resiliencia:'Resilience/Resiliencia',
      perseverancia:'Perseverance/Perseverancia', constancia:'Consistency/Constancia',
      mentalidad_crecimiento:'Growth Mindset', expectativas:'Expectations/Expectativas',
      gestion_tilt:'Tilt Management', concentracion:'Concentration/Concentracion' };
    return fb[key] || key;
  }

  function getTechLabel(key) {
    if (typeof I18N !== 'undefined') {
      const c = I18N.techCats().find(x => x.key === key);
      if (c) return c.label;
    }
    const fb = { rangos_preflop:'Preflop Ranges', juego_oop:'OOP Play', juego_ip:'IP Play',
      textura_flop:'Board Texture', lineas_turn:'Turn Lines', river_value:'River Value' };
    return fb[key] || key;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  PORTADA
  // ══════════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...DARK); doc.rect(0,0,W,H,'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(1.2);
  doc.roundedRect(8,8,W-16,H-16,4,4,'S');
  doc.setLineWidth(0.3);
  doc.roundedRect(11,11,W-22,H-22,3,3,'S');

  doc.setFillColor(...NAVY); doc.rect(11,11,W-22,84,'F');

  const iconSize = 38;
  doc.addImage(logoPng,'PNG', W/2-iconSize/2, 18, iconSize, iconSize);

  txt('MindEV', W/2, 70, 30, 'bold', GOLD, 'center');
  txt(t.tagline, W/2, 80, 9, 'normal', PURPLE, 'center');
  txt(WB_SLOGANS[lang], W/2, 90, 9.5, 'italic', TEAL, 'center');

  doc.setDrawColor(...GOLD); doc.setLineWidth(0.6);
  doc.line(ML+20,98,W-MR-20,98);

  txt(t.title.toUpperCase(), W/2, 112, 18, 'bold', [248,246,240], 'center');
  txt(t.subtitle, W/2, 122, 11, 'normal', [148,163,184], 'center');

  doc.setFillColor(20,30,55);
  doc.roundedRect(ML+10,134,TW-20,32,3,3,'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
  doc.roundedRect(ML+10,134,TW-20,32,3,3,'S');
  txt(t.player.toUpperCase(), W/2, 143, 7, 'normal', MUTED, 'center');
  txt(playerName, W/2, 153, 14, 'bold', [248,246,240], 'center');
  txt(`${t.generated}: ${dateStr}`, W/2, 162, 8, 'normal', MUTED, 'center');

  const chipW=65, chipH=16, chipGap=8;
  const chipX1=W/2-chipW-chipGap/2, chipX2=W/2+chipGap/2, chipY=176;

  doc.setFillColor(30,50,30);
  doc.roundedRect(chipX1,chipY,chipW,chipH,2,2,'F');
  doc.setDrawColor(...TEAL); doc.setLineWidth(0.4);
  doc.roundedRect(chipX1,chipY,chipW,chipH,2,2,'S');
  txt(t.mentalSec, chipX1+chipW/2, chipY+5.5, 7, 'normal', TEAL, 'center');
  txt(hasMental ? `${mentalOv}%` : t.noTest, chipX1+chipW/2, chipY+12, 11, 'bold', [248,246,240], 'center');

  doc.setFillColor(15,25,50);
  doc.roundedRect(chipX2,chipY,chipW,chipH,2,2,'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
  doc.roundedRect(chipX2,chipY,chipW,chipH,2,2,'S');
  txt(t.techSec, chipX2+chipW/2, chipY+5.5, 7, 'normal', GOLD, 'center');
  txt(hasTech ? `${techOv}%` : t.noTest, chipX2+chipW/2, chipY+12, 11, 'bold', [248,246,240], 'center');

  txt(lang==='en'?'12-WEEK PERSONALISED PLAN':lang==='pt'?'PLANO PERSONALIZADO DE 12 SEMANAS':'PLAN PERSONALIZADO DE 12 SEMANAS', W/2, 204, 9, 'bold', GOLD, 'center');

  // Áreas prioritarias dinámicas
  const weakList = [];
  if (hasMental) {
    const mCats = (typeof I18N !== 'undefined') ? I18N.cats() : [];
    const sorted = mCats.map(c => ({ label:c.label, val: mentalSc[c.key]||0 })).sort((a,b)=>a.val-b.val);
    sorted.slice(0,2).forEach(c => weakList.push(`${c.label} (${c.val}%)`));
  }
  if (hasTech) {
    const tCats = (typeof I18N !== 'undefined') ? I18N.techCats() : [];
    const sorted = tCats.map(c => ({ label:c.label, val: techSc[c.key]||0 })).sort((a,b)=>a.val-b.val);
    sorted.slice(0,2).forEach(c => weakList.push(`${c.label} (${c.val}%)`));
  }
  const weakStr = weakList.length ? weakList.join('  |  ') : '—';
  doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED);
  const wpLines = doc.splitTextToSize(`${t.priorityAreas}: ${weakStr}`, TW-20);
  wpLines.forEach((l,i) => doc.text(l, W/2, 212+i*5, {align:'center'}));

  const phases = lang==='en'
    ? ['Phase 1 — Mental (Wks 1-5)','Phase 2 — Technical (Wks 6-9)','Phase 3 — Integration (Wks 10-12)']
    : lang==='pt'
    ? ['Fase 1 — Mental (Sem. 1-5)','Fase 2 — Tecnica (Sem. 6-9)','Fase 3 — Integracao (Sem. 10-12)']
    : ['Fase 1 — Mental (Sem. 1-5)','Fase 2 — Tecnica (Sem. 6-9)','Fase 3 — Integracion (Sem. 10-12)'];
  const phC = [[77,182,172],[212,175,55],[129,140,248]];
  const phW = (TW-20-16)/3;
  phases.forEach((ph,i) => {
    const px = ML+10 + i*(phW+8);
    doc.setFillColor(...phC[i].map(v=>Math.round(v*0.25)));
    doc.roundedRect(px,228,phW,12,2,2,'F');
    doc.setDrawColor(...phC[i]); doc.setLineWidth(0.3);
    doc.roundedRect(px,228,phW,12,2,2,'S');
    doc.setFontSize(5.5); doc.setFont('helvetica','bold'); doc.setTextColor(...phC[i]);
    doc.text(ph, px+phW/2, 235.5, {align:'center'});
  });

  txt(t.url, W/2, 272, 8, 'normal', MUTED, 'center');
  doc.setLineWidth(0.3); doc.setDrawColor(...GOLD);
  doc.line(ML+30,275,W-MR-30,275);
  txt('www.mindev-ia.cl', W/2, 281, 7, 'normal', MUTED, 'center');

  // ══════════════════════════════════════════════════════════════════════════════
  //  PÁGINA 2 — RESUMEN DIAGNÓSTICO
  // ══════════════════════════════════════════════════════════════════════════════
  doc.addPage(); pageNum++;
  drawHeader(); drawFooter();
  y = MT;

  doc.setFillColor(...DARK);
  doc.roundedRect(ML,y,TW,10,2,2,'F');
  txt(t.diagTitle.toUpperCase(), ML+5, y+7, 11, 'bold', GOLD);
  y += 16;

  function drawScoreTable(sc, cats, sectionLabel, barColor, overall) {
    needsPage(60);
    doc.setFillColor(20,30,55);
    doc.roundedRect(ML,y,TW,8,2,2,'F');
    doc.setFillColor(...barColor);
    doc.roundedRect(ML,y,3,8,1,1,'F');
    txt(`${sectionLabel}  —  ${t.overall}: ${overall !== null ? overall+'%' : '—'}`, ML+8, y+5.5, 9, 'bold', barColor);
    y += 10;

    doc.setFillColor(...NAVY); doc.rect(ML,y,TW,6,'F');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(203,213,225);
    doc.text(t.area.toUpperCase(), ML+4, y+4.2);
    doc.text(t.score.toUpperCase(), ML+TW*0.62, y+4.2);
    doc.text(t.level.toUpperCase(), ML+TW*0.78, y+4.2);
    y += 6;

    const entries = cats.map(c => [c.key, c.label, sc[c.key]||0]).sort((a,b)=>a[2]-b[2]);
    entries.forEach(([key, label, val], idx) => {
      const rowH = 7;
      const bg = idx%2===0 ? [245,245,248] : [250,248,252];
      doc.setFillColor(...bg); doc.rect(ML,y,TW,rowH,'F');
      const lv = scoreLevel(val);
      doc.setFillColor(...lv.c.map(v=>Math.min(255,v+160)));
      doc.roundedRect(ML+TW*0.77,y+1.2,30,4.5,1,1,'F');
      doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...BLACK);
      doc.text(label, ML+4, y+5);
      doc.setFont('helvetica','bold'); doc.setTextColor(...lv.c);
      doc.text(val.toFixed(1)+'%', ML+TW*0.62, y+5);
      doc.setFontSize(6.5); doc.setFont('helvetica','bold');
      doc.setTextColor(...lv.c.map(v=>Math.max(0,v-60)));
      doc.text(lv.lbl, ML+TW*0.77+15, y+5, {align:'center'});
      doc.setFillColor(220,220,228);
      doc.rect(ML+TW*0.42,y+2.5,TW*0.17,2.5,'F');
      doc.setFillColor(...lv.c);
      doc.rect(ML+TW*0.42,y+2.5,TW*0.17*(val/100),2.5,'F');
      y += rowH;
    });
    y += 10;
  }

  const mCats = (typeof I18N !== 'undefined') ? I18N.cats() : [];
  const tCats = (typeof I18N !== 'undefined') ? I18N.techCats() : [];

  if (hasMental && mCats.length) drawScoreTable(mentalSc, mCats, t.mentalSec, TEAL, mentalOv);
  if (hasTech   && tCats.length) drawScoreTable(techSc,   tCats, t.techSec,   GOLD, techOv);

  // ── Radar de habilidades ─────────────────────────────────────────────────────
  if ((hasMental && mCats.length) || (hasTech && tCats.length)) {
    const radarH = 72, radarW = (TW - 8) / 2;
    needsPage(radarH + 16);

    doc.setFillColor(...DARK); doc.roundedRect(ML, y, TW, 8, 1.5, 1.5, 'F');
    doc.setFillColor(...TEAL); doc.roundedRect(ML, y, 3, 8, 1, 1, 'F');
    txt(lang==='en' ? 'SKILL RADAR' : 'RADAR DE HABILIDADES', ML + 8, y + 5.5, 9, 'bold', GOLD);
    y += 11;

    function shortLabel(lbl) { return lbl.length > 14 ? lbl.slice(0, 12) + '..' : lbl; }

    const rp = [];
    rp.push((hasMental && mCats.length)
      ? wbRadarPng(mCats.map(c => shortLabel(getMentalLabel(c.key))), mCats.map(c => mentalSc[c.key]||0), 'rgba(77,182,172,0.9)', 'rgba(77,182,172,0.18)', '#0a0e1a')
      : Promise.resolve(null));
    rp.push((hasTech && tCats.length)
      ? wbRadarPng(tCats.map(c => shortLabel(getTechLabel(c.key))), tCats.map(c => techSc[c.key]||0), 'rgba(212,175,55,0.9)', 'rgba(212,175,55,0.18)', '#0a0e1a')
      : Promise.resolve(null));

    const [mPng, tPng] = await Promise.all(rp);

    if (mPng && tPng) {
      doc.addImage(mPng, 'PNG', ML,              y, radarW, radarH);
      doc.addImage(tPng, 'PNG', ML + radarW + 8, y, radarW, radarH);
      txt(t.mentalSec, ML + radarW / 2,              y + radarH + 5, 6.5, 'bold', TEAL, 'center');
      txt(t.techSec,   ML + radarW + 8 + radarW / 2, y + radarH + 5, 6.5, 'bold', GOLD, 'center');
    } else if (mPng) {
      doc.addImage(mPng, 'PNG', ML + TW / 4, y, TW / 2, radarH);
      txt(t.mentalSec, W / 2, y + radarH + 5, 6.5, 'bold', TEAL, 'center');
    } else if (tPng) {
      doc.addImage(tPng, 'PNG', ML + TW / 4, y, TW / 2, radarH);
      txt(t.techSec,   W / 2, y + radarH + 5, 6.5, 'bold', GOLD, 'center');
    }
    y += radarH + 12;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  PÁGINAS DE SEMANAS
  // ══════════════════════════════════════════════════════════════════════════════
  weeks.forEach(wk => {
    doc.addPage(); pageNum++;
    drawHeader(); drawFooter();
    y = MT;

    const phColor = wk.color==='mental' ? TEAL : wk.color==='technical' ? GOLD : PURPLE;
    const phBg    = wk.color==='mental' ? [10,40,45] : wk.color==='technical' ? [40,35,10] : [25,20,50];

    doc.setFillColor(...phBg); doc.roundedRect(ML,y,TW,12,2,2,'F');
    doc.setFillColor(...phColor); doc.roundedRect(ML,y,4,12,2,2,'F');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...phColor);
    doc.text(wk.phase.toUpperCase(), ML+8, y+4.5);
    const wkTitle = `${t.wkLabel} ${wk.n}`;
    doc.setFontSize(10.5); doc.setFont('helvetica','bold'); doc.setTextColor(248,246,240);
    doc.text(`${wkTitle}  —  ${wk.theme.toUpperCase()}`, ML+8, y+10);
    y += 15;

    doc.setFontSize(7.5); doc.setFont('helvetica','italic'); doc.setTextColor(...phColor);
    doc.text(wk.focus, ML, y+4);
    y += 8;

    // Objetivo
    doc.setFillColor(245,248,252); doc.roundedRect(ML,y,TW,14,2,2,'F');
    doc.setFillColor(...phColor); doc.roundedRect(ML,y,3,14,1,1,'F');
    doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(...SLATE);
    doc.text(`${t.objective.toUpperCase()}:`, ML+6, y+4.5);
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...BLACK);
    const objLines = doc.splitTextToSize(wk.obj, TW-10);
    objLines.forEach((l,i) => doc.text(l, ML+6, y+9+i*4.5));
    y += Math.max(14, 9+objLines.length*4.5+3);
    y += 3;

    // Cabecera días
    doc.setFillColor(...NAVY); doc.rect(ML,y,TW,6,'F');
    doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(203,213,225);
    doc.text(lang==='en'?'DAY':lang==='pt'?'DIA':'DIA', ML+9, y+4);
    doc.text(lang==='en'?'TIME':lang==='pt'?'TEMPO':'TIEMPO', ML+22, y+4);
    doc.text(lang==='en'?'TASK / ACTIVITY':lang==='pt'?'TAREFA / ATIVIDADE':'TAREA / ACTIVIDAD', ML+40, y+4);
    doc.text(lang==='en'?'DONE':lang==='pt'?'FEITO':'HECHO', ML+TW-10, y+4);
    y += 6;

    // Filas de días
    wk.days.forEach((day, idx) => {
      const maxTw = TW - 52;
      const taskLines = doc.splitTextToSize(day.task, maxTw);
      const rowH = Math.max(8, taskLines.length*4.5+2);
      needsPage(rowH);
      const bg = idx%2===0 ? [252,252,255] : [246,246,252];
      doc.setFillColor(...bg); doc.rect(ML,y,TW,rowH,'F');
      doc.setDrawColor(...SLATE); doc.setLineWidth(0.5);
      doc.rect(ML+2,y+rowH/2-2,4,4);
      doc.setFillColor(...phColor.map(v=>Math.round(v*0.2)));
      doc.roundedRect(ML+8,y+rowH/2-2.5,12,5,1,1,'F');
      doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(...phColor);
      doc.text(day.d, ML+8+6, y+rowH/2+1.2, {align:'center'});
      doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...MUTED);
      doc.text(`${day.t}${t.min}`, ML+22, y+rowH/2+1);
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...BLACK);
      taskLines.forEach((l,li) => doc.text(l, ML+40, y+4+li*4.5));
      doc.setDrawColor(...MUTED); doc.setLineWidth(0.4);
      doc.roundedRect(ML+TW-11,y+rowH/2-2,4,4,0.5,0.5);
      doc.setDrawColor(220,220,230); doc.setLineWidth(0.2);
      doc.line(ML,y+rowH,ML+TW,y+rowH);
      y += rowH;
    });
    y += 5;

    // Recursos (altura dinámica)
    doc.setFontSize(7.5); doc.setFont('helvetica','normal');
    const allResLines = wk.res.map(r => doc.splitTextToSize('+ '+r, TW-12));
    let resTxtH = 0;
    allResLines.forEach((lines,i) => { resTxtH += lines.length*4.2; if (i<wk.res.length-1) resTxtH+=1.5; });
    const resH = Math.max(16, 8+resTxtH+3);
    needsPage(resH);
    doc.setFillColor(230,248,250); doc.roundedRect(ML,y,TW,resH,2,2,'F');
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.4);
    doc.roundedRect(ML,y,TW,resH,2,2,'S');
    doc.setFillColor(...TEAL); doc.roundedRect(ML,y,3,resH,1,1,'F');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...TEAL);
    doc.text(t.resources.toUpperCase(), ML+7, y+5);
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...BLACK);
    let resLineY = y+9.5;
    allResLines.forEach(lines => {
      lines.forEach((l,li) => doc.text(l, ML+7, resLineY+li*4.2));
      resLineY += lines.length*4.2+1.5;
    });
    y += resH+4;

    // Milestone
    const msLines = doc.splitTextToSize(wk.milestone, TW-14);
    const msH = Math.max(12, msLines.length*4.5+7);
    needsPage(msH);
    doc.setFillColor(230,255,240); doc.roundedRect(ML,y,TW,msH,2,2,'F');
    doc.setFillColor(...GREEN); doc.roundedRect(ML,y,3,msH,1,1,'F');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(21,128,61);
    doc.text(('> '+t.milestone).toUpperCase(), ML+7, y+5);
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(22,101,52);
    msLines.forEach((l,i) => doc.text(l, ML+7, y+10+i*4.5));
    y += msH+5;

    // Notas
    needsPage(22);
    doc.setFillColor(250,250,255); doc.roundedRect(ML,y,TW,22,2,2,'F');
    doc.setDrawColor(200,200,215); doc.setLineWidth(0.3);
    doc.roundedRect(ML,y,TW,22,2,2,'S');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...MUTED);
    doc.text(t.notes.toUpperCase(), ML+4, y+5);
    [11,15.5,20].forEach(off => {
      doc.setDrawColor(180,185,210); doc.setLineWidth(0.2);
      doc.line(ML+4,y+off,ML+TW-4,y+off);
    });
    y += 28;
  });

  // ══════════════════════════════════════════════════════════════════════════════
  //  ÚLTIMA PÁGINA — SEGUIMIENTO GLOBAL
  // ══════════════════════════════════════════════════════════════════════════════
  doc.addPage(); pageNum++;
  drawHeader(); drawFooter();
  y = MT;

  doc.setFillColor(...DARK); doc.roundedRect(ML,y,TW,10,2,2,'F');
  const trackerTitle = lang==='en'?'GLOBAL PROGRESS TRACKER':lang==='pt'?'ACOMPANHAMENTO GLOBAL DE PROGRESSO':'SEGUIMIENTO GLOBAL DE PROGRESO';
  txt(trackerTitle, ML+5, y+7, 11, 'bold', GOLD);
  y += 16;

  doc.setFillColor(...NAVY); doc.rect(ML,y,TW,7,'F');
  doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(203,213,225);
  doc.text(t.wkLabel, ML+3, y+5);
  doc.text(t.themeLabel, ML+22, y+5);
  doc.text(t.statusLabel+'(%)', ML+TW-50, y+5);
  y += 7;

  weeks.forEach((wk,idx) => {
    const phColor = wk.color==='mental' ? TEAL : wk.color==='technical' ? GOLD : PURPLE;
    const bg = idx%2===0 ? [248,250,255] : [242,245,252];
    doc.setFillColor(...bg); doc.rect(ML,y,TW,7,'F');
    doc.setFillColor(...phColor.map(v=>Math.round(v*0.25)));
    doc.roundedRect(ML+2,y+1,10,5,1,1,'F');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...phColor);
    doc.text(`${wk.n}`, ML+7, y+5, {align:'center'});
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(...BLACK);
    const shortTheme = doc.splitTextToSize(wk.theme, TW-70);
    doc.text(shortTheme[0], ML+22, y+5);
    for (let d=0; d<7; d++) {
      doc.setDrawColor(...MUTED); doc.setLineWidth(0.3);
      doc.rect(ML+TW-50+(d*6.5),y+1.5,5,4);
    }
    doc.setDrawColor(215,220,235); doc.setLineWidth(0.2);
    doc.line(ML,y+7,ML+TW,y+7);
    y += 7;
  });
  y += 10;

  // Cuadro re-test
  needsPage(35);
  doc.setFillColor(25,40,25); doc.roundedRect(ML,y,TW,30,3,3,'F');
  doc.setDrawColor(...GREEN); doc.setLineWidth(0.6);
  doc.roundedRect(ML,y,TW,30,3,3,'S');
  const retestTitle = lang==='en'?'RE-TEST DATE (Week 12)':lang==='pt'?'DATA DO RETESTE (Semana 12)':'FECHA DE RE-TEST (Semana 12)';
  txt(retestTitle, ML+6, y+8, 8.5, 'bold', GREEN);
  const retestNote = lang==='en'?'Complete the Mental + Technical tests on MindEV-IA and compare with your initial results.'
    :lang==='pt'?'Complete os testes Mental + Tecnico no MindEV-IA e compare com seus resultados iniciais.'
    :'Completa los tests Mental + Tecnico en MindEV-IA y compara con tus resultados iniciales.';
  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(134,239,172);
  doc.splitTextToSize(retestNote, TW-14).forEach((l,i) => doc.text(l, ML+6, y+14+i*4.5));
  const dateLabel = lang==='en'?'Planned date:':lang==='pt'?'Data planejada:':'Fecha planificada:';
  doc.setFontSize(7); doc.setTextColor(74,222,128);
  doc.text(dateLabel, ML+6, y+25);
  doc.setDrawColor(74,222,128); doc.setLineWidth(0.3);
  doc.line(ML+38,y+25,ML+TW-6,y+25);
  y += 36;

  // Frase motivacional
  needsPage(28);
  doc.setFillColor(240,242,255); doc.roundedRect(ML,y,TW,25,3,3,'F');
  doc.setDrawColor(...PURPLE); doc.setLineWidth(0.4);
  doc.roundedRect(ML,y,TW,25,3,3,'S');
  doc.setFontSize(9); doc.setFont('helvetica','italic'); doc.setTextColor(79,70,229);
  doc.splitTextToSize(t.backQuote, TW-14).forEach((l,i) => doc.text(l, W/2, y+9+i*5, {align:'center'}));
  txt(t.backAuthor, W/2, y+20, 7.5, 'bold', PURPLE, 'center');
  y += 31;

  txt(`MindEV-IA  —  ${t.url}`, W/2, y+8, 9, 'bold', GOLD, 'center');
  const subLine = lang==='en'?'Mental + Technical + AI Diagnostics for Poker Players'
    :lang==='pt'?'Diagnostico Mental + Tecnico + IA para Jogadores de Poker'
    :'Diagnostico Mental + Tecnico + IA para Jugadores de Poker';
  txt(subLine, W/2, y+14, 7, 'normal', MUTED, 'center');

  // Guardar
  const fileName = lang==='en' ? `MindEV_Control_Workbook_${playerName.split(' ')[0]}.pdf`
    : lang==='pt' ? `MindEV_Caderno_Controle_${playerName.split(' ')[0]}.pdf`
    : `MindEV_Cuadernillo_Control_${playerName.split(' ')[0]}.pdf`;
  doc.save(fileName);
}

// ═════════════════════════════════════════════════════════════════════════════
//  GENERADOR DE EXCEL (ExcelJS)
// ═════════════════════════════════════════════════════════════════════════════
async function wbBuildExcel({ lang, playerName, dateStr, mentalSc, techSc, mentalOv, techOv, hasMental, hasTech }) {
  const t     = WB_T[lang] || WB_T.es;
  const weeks = wbGetWeeks(lang);

  // ── Colores ARGB ──
  const C = {
    dark:     'FF0A0E1A', navy:     'FF0F172A', gold:     'FFD4AF37',
    teal:     'FF4DB6AC', purple:   'FF818CF8', green:    'FF4ADE80',
    red:      'FFEF4444', amber:    'FFF59E0B', yellow:   'FFFBBF24',
    white:    'FFFFFFFF', black:    'FF1A1A2E', muted:    'FF64748B',
    lightBg:  'FFF5F7FA', altBg:    'FFEEF0F5', readOnly: 'FFEBF0F8',
    mentalBg: 'FFE4F5F4', techBg:   'FFFDF4E0', intBg:    'FFF0EEFF',
    noteBg:   'FFFAFBFF',
    lvlCrit:  'FFFFE4E4', lvlLow:   'FFFFF3E4', lvlMed:   'FFFFF9D0',
    lvlHigh:  'FFE4F5F4', lvlExc:   'FFE4FFE9',
    lvlCritT: 'FFB91C1C', lvlLowT:  'FFB45309', lvlMedT:  'FF854D0E',
    lvlHighT: 'FF0D6E6A', lvlExcT:  'FF166534',
  };

  function phaseColor(color) {
    return color==='mental' ? C.teal : color==='technical' ? C.gold : C.purple;
  }
  function phaseBg(color) {
    return color==='mental' ? C.mentalBg : color==='technical' ? C.techBg : C.intBg;
  }
  function tabColor(color) {
    return color==='mental' ? { argb: C.teal } : color==='technical' ? { argb: C.gold } : { argb: C.purple };
  }

  function levelColors(v) {
    if (v < 55) return { bg: C.lvlCrit, fg: C.lvlCritT, lbl: t.lvlCrit };
    if (v < 65) return { bg: C.lvlLow,  fg: C.lvlLowT,  lbl: t.lvlLow  };
    if (v < 75) return { bg: C.lvlMed,  fg: C.lvlMedT,  lbl: t.lvlMed  };
    if (v < 88) return { bg: C.lvlHigh, fg: C.lvlHighT, lbl: t.lvlHigh };
    return              { bg: C.lvlExc,  fg: C.lvlExcT,  lbl: t.lvlExc  };
  }

  // ── Ayudas de estilo ──
  function fill(argb) { return { type:'pattern', pattern:'solid', fgColor:{ argb } }; }
  function font(bold, size, argb, italic) { return { bold:!!bold, size:size||10, color:{ argb }, italic:!!italic }; }
  function border(clr) {
    const s = { style:'thin', color:{ argb: clr||C.muted } };
    return { top:s, left:s, bottom:s, right:s };
  }
  function align(h, v, wrap) { return { horizontal:h||'left', vertical:v||'middle', wrapText:!!wrap }; }

  // ── Aplica estilo básico a una celda ──
  function sc(cell, opts) {
    if (opts.fill)   cell.fill      = opts.fill;
    if (opts.font)   cell.font      = opts.font;
    if (opts.border) cell.border    = opts.border;
    if (opts.align)  cell.alignment = opts.align;
  }

  // ── Fila de encabezado de marca en cada hoja ──
  function addBrandHeader(ws, lastCol) {
    const cols = lastCol || 'E';
    // Fila 1: fondo oscuro, "MindEV IA" dorado
    ws.mergeCells(`A1:${cols}1`);
    const h1 = ws.getCell('A1');
    h1.value = `MindEV IA  |  ${WB_SLOGANS[lang]}`;
    sc(h1, { fill:fill(C.dark), font:font(true,13,C.gold), align:align('center','middle') });
    ws.getRow(1).height = 26;
    // Fila 2: datos del jugador (teal tenue)
    ws.mergeCells(`A2:${cols}2`);
    const h2 = ws.getCell('A2');
    h2.value = `${t.player}: ${playerName}   |   ${t.generated}: ${dateStr}`;
    sc(h2, { fill:fill(C.navy), font:font(false,9,C.teal), align:align('center','middle') });
    ws.getRow(2).height = 18;
  }

  // ── Fila de sección (título de bloque) ──
  function addSectionRow(ws, row, lastCol, text, bgArgb, fgArgb, height) {
    ws.mergeCells(`A${row}:${lastCol}${row}`);
    const cell = ws.getCell(`A${row}`);
    cell.value = text;
    sc(cell, { fill:fill(bgArgb), font:font(true,10,fgArgb), align:align('center','middle') });
    ws.getRow(row).height = height || 20;
  }

  // ── Dropdown de estado (celda editable, desbloqueada) ──
  function addStatusDropdown(cell, defaultVal) {
    cell.value = defaultVal || (lang==='en' ? '○ Pending' : lang==='pt' ? '○ Pendente' : '○ Pendiente');
    cell.dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [lang==='en' ? '"✓ Done,○ Pending"'
                : lang==='pt' ? '"✓ Concluido,○ Pendente"'
                : '"✓ Ejecutado,○ Pendiente"'],
    };
    sc(cell, { fill:fill(C.noteBg), font:font(false,9,C.muted), align:align('center','middle'), border:border(C.muted) });
    cell.protection = { locked: false };
  }

  // ── Etiquetas de categorías ──
  function getMLabel(key) {
    if (typeof I18N !== 'undefined') { const c = I18N.cats().find(x=>x.key===key); if(c) return c.label; }
    return key;
  }
  function getTLabel(key) {
    if (typeof I18N !== 'undefined') { const c = I18N.techCats().find(x=>x.key===key); if(c) return c.label; }
    return key;
  }

  // ─────────────────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MindEV IA';
  wb.created = new Date();

  // ══════════════════════════════════════════════════════════════════════════
  //  HOJA 1 — DIAGNÓSTICO
  // ══════════════════════════════════════════════════════════════════════════
  const wsDx = wb.addWorksheet(
    lang==='en' ? 'Diagnostic' : lang==='pt' ? 'Diagnostico' : 'Diagnostico',
    { properties:{ tabColor:{ argb: C.gold } } }
  );
  wsDx.columns = [
    { key:'area',  width:32 }, { key:'score', width:10 },
    { key:'level', width:14 }, { key:'sp',    width:2  },
    { key:'prog',  width:18 },
    { key:'gap',   width:4  },              // F — separador
    { key:'r1', width:11 }, { key:'r2', width:11 },  // G, H
    { key:'r3', width:11 }, { key:'r4', width:11 },  // I, J
    { key:'r5', width:11 }, { key:'r6', width:11 },  // K, L
  ];

  addBrandHeader(wsDx, 'L');
  let dRow = 4;

  function drawScoreSection(ws, entries, labelFn, sectionLabel, barArgb, overall) {
    // Cabecera sección
    addSectionRow(ws, dRow, 'E', `${sectionLabel}  |  ${t.overall}: ${overall !== null ? overall+'%' : '—'}`, C.navy, barArgb, 22);
    dRow++;
    // Encabezados columna
    ['area','score','level','sp','prog'].forEach((k,i) => {
      const cell = ws.getRow(dRow).getCell(i+1);
      cell.value = [t.area, t.score, t.level, '', ''][i].toUpperCase();
      sc(cell, { fill:fill(C.dark), font:font(true,8,'FFE2E8F0'), align:align('center','middle'), border:border(C.gold) });
    });
    ws.getRow(dRow).height = 16;
    dRow++;
    // Filas de scores
    entries.forEach(([key, val], idx) => {
      const lv  = levelColors(val);
      const bg  = idx%2===0 ? C.lightBg : C.altBg;
      const row = ws.getRow(dRow);
      row.height = 18;
      // Area
      const cArea = row.getCell(1);
      cArea.value = labelFn(key);
      sc(cArea, { fill:fill(bg), font:font(false,9,C.black), align:align('left','middle'), border:border(C.muted) });
      // Score
      const cScore = row.getCell(2);
      cScore.value = val;
      cScore.numFmt = '0.0"%"';
      sc(cScore, { fill:fill(lv.bg), font:font(true,9,lv.fg), align:align('center','middle'), border:border(C.muted) });
      // Level badge
      const cLevel = row.getCell(3);
      cLevel.value = lv.lbl;
      sc(cLevel, { fill:fill(lv.bg), font:font(true,8,lv.fg), align:align('center','middle'), border:border(C.muted) });
      // Progress (text bar)
      const cProg = row.getCell(5);
      const bars = Math.round(val/100*16);
      cProg.value = '█'.repeat(bars) + '░'.repeat(16-bars) + ` ${val.toFixed(0)}%`;
      sc(cProg, { fill:fill(bg), font:font(false,8,lv.fg), align:align('left','middle') });
      dRow++;
    });
    // Fila promedio
    const rowOv = ws.getRow(dRow);
    rowOv.height = 18;
    const cOvLabel = rowOv.getCell(1);
    cOvLabel.value = t.overall.toUpperCase();
    sc(cOvLabel, { fill:fill(C.navy), font:font(true,9,barArgb), align:align('left','middle'), border:border(barArgb) });
    const cOvVal = rowOv.getCell(2);
    cOvVal.value = overall;
    cOvVal.numFmt = '0.0"%"';
    sc(cOvVal, { fill:fill(C.navy), font:font(true,10,barArgb), align:align('center','middle'), border:border(barArgb) });
    dRow += 2;
  }

  const mCats = (typeof I18N !== 'undefined') ? I18N.cats()     : [];
  const tCats = (typeof I18N !== 'undefined') ? I18N.techCats() : [];

  function shortLbl(l) { return l.length > 14 ? l.slice(0, 12) + '..' : l; }
  const radarImgW = 430; // px — cubre cols G-L (~6 cols × 72px)
  const rowPx     = 20;  // px por fila (aprox 18pt height)

  // ── Test Mental ──────────────────────────────────────────────────────────────
  const mentalRowStart = dRow;
  if (hasMental && mCats.length) {
    const entries = mCats.map(c=>[c.key, mentalSc[c.key]||0]).sort((a,b)=>a[1]-b[1]);
    drawScoreSection(wsDx, entries, getMLabel, t.mentalSec, C.teal, mentalOv);
  }
  const mentalRowEnd = dRow - 1;

  // ── Test Técnico ─────────────────────────────────────────────────────────────
  const techRowStart = dRow;
  if (hasTech && tCats.length) {
    const entries = tCats.map(c=>[c.key, techSc[c.key]||0]).sort((a,b)=>a[1]-b[1]);
    drawScoreSection(wsDx, entries, getTLabel, t.techSec, C.gold, techOv);
  }
  const techRowEnd = dRow - 1;

  // ── Radares a la derecha de cada sección (cols G–L) ──────────────────────────
  const rxlPromises = [
    (hasMental && mCats.length)
      ? wbRadarPng(mCats.map(c=>shortLbl(getMLabel(c.key))), mCats.map(c=>mentalSc[c.key]||0),
          'rgba(77,182,172,0.9)', 'rgba(77,182,172,0.18)', '#0a0e1a')
      : Promise.resolve(null),
    (hasTech && tCats.length)
      ? wbRadarPng(tCats.map(c=>shortLbl(getTLabel(c.key))), tCats.map(c=>techSc[c.key]||0),
          'rgba(212,175,55,0.9)', 'rgba(212,175,55,0.18)', '#0a0e1a')
      : Promise.resolve(null),
  ];
  const [mRadarPng, tRadarPng] = await Promise.all(rxlPromises);

  if (mRadarPng) {
    const mRows  = mentalRowEnd - mentalRowStart + 1;
    const mImgH  = mRows * rowPx;
    const mImgW  = Math.min(radarImgW, Math.round(mImgH * 1.35)); // proporcional
    const mId    = wb.addImage({ base64: mRadarPng.split(',')[1], extension: 'png' });
    // centrado vertical: tl en mentalRowStart (0-indexed), br en mentalRowEnd+1
    wsDx.addImage(mId, {
      tl: { col: 6, row: mentalRowStart - 1 },
      br: { col: 12, row: mentalRowEnd },
      editAs: 'oneCell',
    });
  }
  if (tRadarPng) {
    const tId = wb.addImage({ base64: tRadarPng.split(',')[1], extension: 'png' });
    wsDx.addImage(tId, {
      tl: { col: 6, row: techRowStart - 1 },
      br: { col: 12, row: techRowEnd },
      editAs: 'oneCell',
    });
  }

  // Proteger hoja diagnóstico (solo lectura)
  wsDx.protect('', { selectLockedCells:true, selectUnlockedCells:false });

  // ══════════════════════════════════════════════════════════════════════════
  //  HOJA SEGUIMIENTO — 2ª pestaña (después de Diagnóstico)
  // ══════════════════════════════════════════════════════════════════════════
  const trackerName = lang==='en' ? 'Tracker' : lang==='pt' ? 'Acompanhamento' : 'Seguimiento';
  const wsTk = wb.addWorksheet(trackerName, { properties:{ tabColor:{ argb: C.purple } } });

  const dayHdrs = t.days; // ['LUN','MAR','MIE','JUE','VIE','SAB','DOM']
  wsTk.columns = [
    { key:'wk',     width:6  },
    { key:'theme',  width:32 },
    { key:'phase',  width:14 },
    ...dayHdrs.map(() => ({ width:12 })),
  ];

  addBrandHeader(wsTk, String.fromCharCode(67 + dayHdrs.length)); // A..J

  const tkTitle = lang==='en' ? 'GLOBAL PROGRESS TRACKER'
    : lang==='pt' ? 'ACOMPANHAMENTO GLOBAL DE PROGRESSO'
    : 'SEGUIMIENTO GLOBAL DE PROGRESO';
  addSectionRow(wsTk, 3, String.fromCharCode(67+dayHdrs.length), tkTitle, C.dark, C.gold, 22);

  // Encabezados columna
  const tkHdrRow = wsTk.getRow(4);
  tkHdrRow.height = 18;
  [t.wkLabel, t.themeLabel, lang==='en'?'PHASE':lang==='pt'?'FASE':'FASE', ...dayHdrs].forEach((h,i) => {
    const cell = tkHdrRow.getCell(i+1);
    cell.value = h;
    sc(cell, { fill:fill(C.navy), font:font(true,9,'FFE2E8F0'), align:align('center','middle'), border:border(C.gold) });
  });
  wsTk.views = [{ state:'frozen', xSplit:0, ySplit:4 }];

  // Filas de semanas
  weeks.forEach((wk, idx) => {
    const r   = 5 + idx;
    const row = wsTk.getRow(r);
    row.height = 20;
    const phCol = phaseColor(wk.color);
    const bg    = idx%2===0 ? C.lightBg : C.altBg;

    // Num semana
    const cN = row.getCell(1);
    cN.value = wk.n;
    sc(cN, { fill:fill(phaseBg(wk.color)), font:font(true,9,phCol), align:align('center','middle'), border:border(C.muted) });

    // Tema
    const cTh = row.getCell(2);
    cTh.value = wk.theme;
    sc(cTh, { fill:fill(bg), font:font(false,9,C.black), align:align('left','middle'), border:border(C.muted) });

    // Fase
    const cPh = row.getCell(3);
    cPh.value = wk.color==='mental' ? (lang==='en'?'Mental':lang==='pt'?'Mental':'Mental')
      : wk.color==='technical' ? (lang==='en'?'Technical':lang==='pt'?'Tecnico':'Tecnico')
      : (lang==='en'?'Integration':lang==='pt'?'Integracao':'Integracion');
    sc(cPh, { fill:fill(phaseBg(wk.color)), font:font(false,8,phCol), align:align('center','middle'), border:border(C.muted) });

    // 7 dropdowns de días
    for (let d=0; d<7; d++) {
      addStatusDropdown(row.getCell(4+d));
    }
  });

  // Fila de re-test
  const reTestRow = 5 + weeks.length + 1;
  const lastTkCol = String.fromCharCode(67+dayHdrs.length);
  wsTk.mergeCells(`A${reTestRow}:${lastTkCol}${reTestRow}`);
  const reCell = wsTk.getCell(`A${reTestRow}`);
  const reNote = lang==='en'
    ? 'Week 12 RE-TEST — Complete the Mental + Technical tests on MindEV-IA and compare with your initial results.'
    : lang==='pt'
    ? 'RE-TESTE Semana 12 — Complete os testes Mental + Tecnico no MindEV-IA e compare com seus resultados iniciais.'
    : 'RE-TEST Semana 12 — Completa los tests Mental + Tecnico en MindEV-IA y compara con tus resultados iniciales.';
  reCell.value = reNote;
  sc(reCell, { fill:fill('FF1A2E1A'), font:font(false,9,'FF4ADE80'), align:align('left','middle',true), border:border('FF4ADE80') });
  wsTk.getRow(reTestRow).height = 30;
  reCell.protection = { locked: false };

  wsTk.protect('', { selectLockedCells:true, selectUnlockedCells:true,
    formatCells:false, insertRows:false, deleteRows:false });

  // ══════════════════════════════════════════════════════════════════════════
  //  HOJAS DE SEMANAS
  // ══════════════════════════════════════════════════════════════════════════
  const dayColHdr   = lang==='en' ? 'DAY'   : lang==='pt' ? 'DIA'    : 'DIA';
  const timeColHdr  = lang==='en' ? 'MIN'   : lang==='pt' ? 'MIN'    : 'MIN';
  const taskColHdr  = lang==='en' ? 'TASK / ACTIVITY' : lang==='pt' ? 'TAREFA / ATIVIDADE' : 'TAREA / ACTIVIDAD';
  const statusColHdr= lang==='en' ? 'STATUS' : lang==='pt' ? 'ESTADO' : 'ESTADO';

  weeks.forEach(wk => {
    const phCol  = phaseColor(wk.color);
    const phBgC  = phaseBg(wk.color);
    const tabC   = tabColor(wk.color);
    const sheetName = (lang==='en' ? `Wk.` : `Sem.`) + String(wk.n).padStart(2,'0');

    const ws = wb.addWorksheet(sheetName, { properties:{ tabColor: tabC } });
    ws.columns = [
      { key:'day',    width:8  },
      { key:'min',    width:6  },
      { key:'task',   width:52 },
      { key:'status', width:16 },
    ];

    // ── Encabezado marca ──
    addBrandHeader(ws, 'D');

    // ── Banda de fase ──
    addSectionRow(ws, 3, 'D', wk.phase.toUpperCase(), C.navy, phCol, 16);

    // ── Semana + Tema ──
    ws.mergeCells('A4:D4');
    const hWk = ws.getCell('A4');
    hWk.value = `${t.wkLabel} ${wk.n}  —  ${wk.theme.toUpperCase()}`;
    sc(hWk, { fill:fill(phBgC), font:font(true,11,phCol), align:align('center','middle') });
    ws.getRow(4).height = 24;

    // ── Focus ──
    ws.mergeCells('A5:D5');
    const hFocus = ws.getCell('A5');
    hFocus.value = wk.focus;
    sc(hFocus, { fill:fill(C.navy), font:font(false,9,phCol,true), align:align('center','middle') });
    ws.getRow(5).height = 16;

    // ── Objetivo (solo lectura) ──
    ws.mergeCells('A6:D6');
    const hObjLabel = ws.getCell('A6');
    hObjLabel.value = `${t.objective.toUpperCase()}: ${wk.obj}`;
    sc(hObjLabel, { fill:fill(C.readOnly), font:font(false,9,C.black), align:align('left','middle',true), border:border(phCol) });
    ws.getRow(6).height = 36;

    // ── Encabezados tabla de tareas ──
    const hdrRow = ws.getRow(7);
    hdrRow.height = 18;
    [dayColHdr, timeColHdr, taskColHdr, statusColHdr].forEach((lbl,i) => {
      const cell = hdrRow.getCell(i+1);
      cell.value = lbl;
      sc(cell, { fill:fill(C.dark), font:font(true,9,'FFE2E8F0'), align:align('center','middle'), border:border(C.gold) });
    });
    // Congelar encabezado
    ws.views = [{ state:'frozen', xSplit:0, ySplit:7 }];

    // ── Filas de tareas ──
    wk.days.forEach((day, idx) => {
      const r   = 8 + idx;
      const row = ws.getRow(r);
      row.height = 22;
      const bg  = idx%2===0 ? C.lightBg : C.altBg;

      // Día
      const cDay = row.getCell(1);
      cDay.value = day.d;
      sc(cDay, { fill:fill(phBgC), font:font(true,9,phCol), align:align('center','middle'), border:border(C.muted) });

      // Tiempo
      const cMin = row.getCell(2);
      cMin.value = day.t;
      cMin.numFmt = '0';
      sc(cMin, { fill:fill(bg), font:font(false,9,C.muted), align:align('center','middle'), border:border(C.muted) });

      // Tarea (solo lectura)
      const cTask = row.getCell(3);
      cTask.value = day.task;
      cTask.alignment = align('left','middle',true);
      sc(cTask, { fill:fill(bg), font:font(false,9,C.black), align:align('left','middle',true), border:border(C.muted) });

      // Estado — dropdown EDITABLE
      addStatusDropdown(row.getCell(4));
    });

    const afterTasks = 8 + wk.days.length; // row 15

    // ── Recursos (solo lectura) ──
    const resStartRow = afterTasks + 1;
    addSectionRow(ws, resStartRow, 'D', t.resources.toUpperCase(), C.teal+'44', C.teal, 16);
    wk.res.forEach((r, i) => {
      const rr = resStartRow + 1 + i;
      ws.mergeCells(`A${rr}:D${rr}`);
      const cell = ws.getCell(`A${rr}`);
      cell.value = '+ ' + r;
      sc(cell, { fill:fill(C.readOnly), font:font(false,9,C.black), align:align('left','middle',true), border:border(C.teal) });
      ws.getRow(rr).height = 20;
    });

    // ── Meta de la semana (solo lectura) ──
    const msRow = resStartRow + 1 + wk.res.length + 1;
    addSectionRow(ws, msRow, 'D', ('> '+t.milestone).toUpperCase(), 'FF166534'+'44', 'FF166534', 16);
    const msContentRow = msRow + 1;
    ws.mergeCells(`A${msContentRow}:D${msContentRow}`);
    const msCont = ws.getCell(`A${msContentRow}`);
    msCont.value = wk.milestone;
    sc(msCont, { fill:fill('FFE4FFE9'), font:font(false,9,'FF166534'), align:align('left','middle',true), border:border('FF166534') });
    ws.getRow(msContentRow).height = 30;

    // ── Notas y reflexiones (EDITABLE) ──
    const notesHdrRow = msContentRow + 2;
    addSectionRow(ws, notesHdrRow, 'D', t.notes.toUpperCase(), C.navy, C.muted, 16);
    for (let nr = notesHdrRow+1; nr <= notesHdrRow+4; nr++) {
      ws.mergeCells(`A${nr}:D${nr}`);
      const ncell = ws.getCell(`A${nr}`);
      ncell.value = '';
      sc(ncell, { fill:fill(C.noteBg), border:border(C.muted), align:align('left','middle',true) });
      ws.getRow(nr).height = 22;
      ncell.protection = { locked: false };
    }

    // Proteger hoja (status + notas quedan desbloqueados, el resto solo lectura)
    ws.protect('', { selectLockedCells:true, selectUnlockedCells:true,
      formatCells:false, insertRows:false, deleteRows:false });
  });

  // ── Descargar ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href     = url;
  a.download = lang==='en' ? `MindEV_Control_Workbook_${playerName.split(' ')[0]}.xlsx`
    : lang==='pt' ? `MindEV_Caderno_Controle_${playerName.split(' ')[0]}.xlsx`
    : `MindEV_Cuadernillo_Control_${playerName.split(' ')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
