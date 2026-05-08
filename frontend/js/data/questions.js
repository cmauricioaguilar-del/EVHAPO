const FREQ = [
  { label: 'Siempre',      value: 'siempre',      points: 10 },
  { label: 'Casi siempre', value: 'casi_siempre', points: 8  },
  { label: 'A veces',      value: 'a_veces',      points: 5  },
  { label: 'Casi nunca',   value: 'casi_nunca',   points: 2  },
  { label: 'Nunca',        value: 'nunca',         points: 0  },
];
const FREQ_R = [
  { label: 'Nunca',        value: 'nunca',         points: 10 },
  { label: 'Casi nunca',   value: 'casi_nunca',   points: 8  },
  { label: 'A veces',      value: 'a_veces',      points: 5  },
  { label: 'Casi siempre', value: 'casi_siempre', points: 2  },
  { label: 'Siempre',      value: 'siempre',      points: 0  },
];
const SLEEP_H = [
  { label: '7 a 8 horas',       value: '7_8h',    points: 10 },
  { label: '6 a 7 horas',       value: '6_7h',    points: 7  },
  { label: 'Más de 8 horas',    value: 'mas_8h',  points: 5  },
  { label: '5 a 6 horas',       value: '5_6h',    points: 3  },
  { label: 'Menos de 5 horas',  value: 'menos5h', points: 0  },
];
const STRESS = [
  { label: 'Muy bajo',  value: 'muy_bajo',  points: 10 },
  { label: 'Bajo',      value: 'bajo',      points: 8  },
  { label: 'Moderado',  value: 'moderado',  points: 5  },
  { label: 'Alto',      value: 'alto',      points: 2  },
  { label: 'Muy alto',  value: 'muy_alto',  points: 0  },
];

const EVHAPO_CATEGORIES = [
  {
    key: 'tolerancia',
    label: 'Tolerancia',
    icon: '🤝',
    color: '#4CAF50',
    description: 'Capacidad de aceptar y respetar las diferencias de los demás, y manejar situaciones desafiantes con calma y comprensión.',
    questions: [
      { id: 1,  text: '¿Soy capaz de escuchar y respetar las opiniones y puntos de vista de los demás, incluso si difieren de los míos?', options: FREQ },
      { id: 2,  text: '¿Puedo mantener la calma y la compostura en situaciones de conflicto o tensión?', options: FREQ },
      { id: 3,  text: '¿Suelo tratar a las personas de manera justa e imparcial, sin prejuicios ni favoritismos?', options: FREQ },
      { id: 4,  text: '¿Estoy dispuesto/a a ceder o comprometerme en situaciones en las que no puedo obtener exactamente lo que quiero?', options: FREQ },
      { id: 5,  text: '¿Muestro comprensión (empatía) hacia las personas que están pasando por dificultades o problemas?', options: FREQ },
      { id: 6,  text: '¿Trato de resolver desacuerdos o conflictos a través del diálogo y la comunicación abierta en lugar de recurrir a la confrontación?', options: FREQ },
      { id: 7,  text: '¿Soy capaz de aceptar críticas constructivas sin reaccionar de manera defensiva?', options: FREQ },
      { id: 8,  text: '¿Mantengo una mente abierta y estoy dispuesto/a a aprender de nuevas experiencias y perspectivas?', options: FREQ },
      { id: 9,  text: '¿Trato a las personas con respeto y cortesía, independientemente de su origen, género, religión u orientación sexual?', options: FREQ },
      { id: 10, text: '¿Estoy dispuesto/a a admitir mis errores y disculparme cuando sea necesario?', options: FREQ },
    ],
    tips: [
      'Practica la escucha activa: enfócate completamente en el otro antes de responder.',
      'Antes de reaccionar, respira profundo y pregúntate: ¿esto importa a largo plazo?',
      'Lleva un diario de situaciones donde perdiste la paciencia y analiza los patrones.',
      'Exponte conscientemente a perspectivas diferentes a las tuyas.',
      'Practica el rol de "abogado del diablo": defiende posiciones contrarias para entenderlas.',
    ],
  },
  {
    key: 'habitos',
    label: 'Hábitos',
    icon: '💪',
    color: '#2196F3',
    description: 'Rutinas y comportamientos relacionados con la salud física, el descanso y la organización personal que sostienen tu rendimiento.',
    questions: [
      { id: 11, text: '¿Consumes alimentos saludables (frutas, verduras, proteínas) de manera regular?', options: FREQ },
      { id: 12, text: '¿Consumes alimentos procesados, comida chatarra o en exceso?', options: FREQ_R },
      { id: 13, text: '¿Realizas actividad física o ejercicio de manera regular?', options: FREQ },
      { id: 14, text: '¿Mantienes una rutina de ejercicio constante durante la semana?', options: FREQ },
      { id: 15, text: '¿Cuántas horas duermes en promedio por noche?', options: SLEEP_H },
      { id: 16, text: '¿Te sientes descansado/a y recuperado/a cuando te levantas?', options: FREQ },
      { id: 17, text: '¿Mantienes un horario de sueño regular (te acuestas y te levantas a la misma hora)?', options: FREQ },
      { id: 18, text: '¿Dedicas tiempo suficiente a actividades productivas y metas personales o profesionales?', options: FREQ },
      { id: 19, text: '¿Planificas tus tareas por escrito o utilizas listas de pendientes para organizarte?', options: FREQ },
      { id: 20, text: '¿Mantienes comunicación regular y significativa con amigos y familiares?', options: FREQ },
      { id: 21, text: '¿Participas en redes o comunidades que te aportan valor y crecimiento personal?', options: FREQ },
    ],
    tips: [
      'Implementa la regla de los 2 minutos: si una tarea tarda menos de 2 minutos, hazla ahora.',
      'Establece una rutina de sueño fija: acuéstate y levántate a la misma hora todos los días.',
      'Planifica tus comidas semanalmente para evitar decisiones impulsivas poco saludables.',
      'Usa la técnica Pomodoro: 25 minutos de trabajo, 5 de descanso.',
      'Establece una "hora digital off" al menos 1 hora antes de dormir.',
    ],
  },
  {
    key: 'concentracion',
    label: 'Concentración',
    icon: '🎯',
    color: '#FF9800',
    description: 'Capacidad de mantener el foco y la atención plena durante el juego y en situaciones de alta demanda cognitiva.',
    questions: [
      { id: 22, text: '¿Te distraes con facilidad cuando estás realizando una tarea importante?', options: FREQ_R },
      { id: 23, text: '¿Puedes mantener tu atención en una tarea durante periodos prolongados de tiempo?', options: FREQ },
      { id: 24, text: '¿Con qué frecuencia revisas el teléfono o redes sociales mientras trabajas o juegas?', options: FREQ_R },
      { id: 25, text: '¿Tienes dificultades para mantener el foco cuando enfrentas tareas complejas o desafiantes?', options: FREQ_R },
      { id: 26, text: '¿Las preocupaciones personales o problemas externos interrumpen tu concentración durante el juego?', options: FREQ_R },
      { id: 27, text: '¿El entorno (ruido, personas u otras distracciones) afecta negativamente tu concentración?', options: FREQ_R },
      { id: 28, text: '¿Practicas técnicas de relajación, meditación o mindfulness para mejorar tu concentración?', options: FREQ },
      { id: 29, text: '¿Duermes las horas suficientes para mantener tu concentración y rendimiento al día siguiente?', options: FREQ },
      { id: 30, text: '¿Cómo evalúas tu nivel de estrés general en tu vida cotidiana?', options: STRESS },
    ],
    tips: [
      'Practica meditación de atención plena (mindfulness) al menos 10 minutos al día.',
      'Crea un ambiente de juego libre de distracciones: teléfono en silencio, notificaciones desactivadas.',
      'Utiliza técnicas de visualización antes de cada sesión para entrar en estado de flujo.',
      'Haz ejercicio aeróbico regularmente: mejora el flujo sanguíneo al cerebro.',
      'Practica juegos de memoria o puzzles para entrenar tu capacidad atencional.',
    ],
  },
  {
    key: 'expectativas',
    label: 'Expectativas',
    icon: '🌟',
    color: '#9C27B0',
    description: 'Creencias sobre el futuro y capacidad de mantener una perspectiva optimista y realista sobre el desarrollo personal.',
    questions: [
      { id: 31, text: '¿Creo que puedo alcanzar mis metas personales y profesionales si me esfuerzo lo suficiente?', options: FREQ },
      { id: 32, text: '¿Tengo expectativas positivas sobre mi vida en el futuro?', options: FREQ },
      { id: 33, text: '¿Espero que las personas que me rodean actúen con honestidad y justicia hacia mí?', options: FREQ },
      { id: 34, text: '¿Tengo expectativas positivas sobre las relaciones que establezco con los demás?', options: FREQ },
      { id: 35, text: '¿Creo que podré tener éxito en mi carrera o área de desarrollo profesional?', options: FREQ },
      { id: 36, text: '¿Creo que tendré mejores oportunidades de crecimiento personal y profesional en el futuro?', options: FREQ },
      { id: 37, text: '¿Espero mantener una buena salud física y mental a lo largo de mi vida?', options: FREQ },
      { id: 38, text: '¿Tengo una perspectiva positiva sobre mi calidad de vida en general?', options: FREQ },
    ],
    tips: [
      'Escribe diariamente 3 cosas positivas que ocurrieron: entrena tu cerebro al optimismo.',
      'Define metas SMART (específicas, medibles, alcanzables, relevantes, con tiempo definido).',
      'Celebra los pequeños logros: cada paso cuenta en el camino a la excelencia.',
      'Rodéate de personas con mentalidad de crecimiento que te impulsen.',
      'Lee biografías de jugadores exitosos para inspirarte y calibrar expectativas.',
    ],
  },
  {
    key: 'disciplina',
    label: 'Disciplina',
    icon: '⚡',
    color: '#F44336',
    description: 'Capacidad de mantener rutinas consistentes, resistir la procrastinación y actuar en alineación con los objetivos a largo plazo.',
    questions: [
      { id: 39, text: '¿Establezco metas claras y específicas para guiar mis acciones diarias?', options: FREQ },
      { id: 40, text: '¿Mantengo el enfoque en mis proyectos o tareas hasta completarlos exitosamente?', options: FREQ },
      { id: 41, text: '¿Planifico mis días con anticipación y sigo un horario o rutina establecida?', options: FREQ },
      { id: 42, text: '¿Evito posponer tareas importantes aunque no tenga ganas de realizarlas en ese momento?', options: FREQ },
      { id: 43, text: '¿Mantengo la motivación y el esfuerzo cuando enfrento obstáculos en el camino a mis metas?', options: FREQ },
      { id: 44, text: '¿Soy consistente en mis tareas y rutinas diarias, incluso cuando es difícil o incómodo?', options: FREQ },
      { id: 45, text: '¿Establezco límites claros para proteger mi tiempo, energía y recursos?', options: FREQ },
      { id: 46, text: '¿Mantengo la calma y el control emocional en situaciones de presión o dificultad?', options: FREQ },
      { id: 47, text: '¿Planifico a largo plazo y tomo decisiones pensando en el impacto sobre mis metas futuras?', options: FREQ },
      { id: 48, text: '¿Mantengo la determinación y el esfuerzo cuando las tareas se vuelven monótonas o poco motivadoras?', options: FREQ },
    ],
    tips: [
      'Usa el método "Eat the frog": comienza el día con la tarea más difícil o importante.',
      'Diseña tu entorno para el éxito: elimina las tentaciones que te desvían de tus metas.',
      'Crea un sistema de recompensas para celebrar el cumplimiento de tu rutina.',
      'Practica decir NO a las actividades que no se alinean con tus objetivos de poker.',
      'Lleva un registro de horas de estudio y práctica para mantener la accountability.',
    ],
  },
  {
    key: 'paciencia',
    label: 'Paciencia',
    icon: '⏳',
    color: '#00BCD4',
    description: 'Habilidad para esperar serenamente resultados, tolerar la incertidumbre y mantener la compostura bajo presión.',
    questions: [
      { id: 49, text: '¿Puedo esperar con calma cuando algo no ocurre tan rápido como quisiera, sin sentirme frustrado/a?', options: FREQ },
      { id: 50, text: '¿Mantengo la tranquilidad cuando enfrento demoras o retrasos inesperados?', options: FREQ },
      { id: 51, text: '¿Puedo manejar situaciones de incertidumbre o información ambigua sin impacientarme?', options: FREQ },
      { id: 52, text: '¿Enfrento la incertidumbre sin entrar en pánico ni tomar decisiones apresuradas?', options: FREQ },
      { id: 53, text: '¿Gestiono la frustración de manera constructiva cuando las cosas no salen como espero?', options: FREQ },
      { id: 54, text: '¿Puedo resolver problemas complejos sin perder la compostura ni el control emocional?', options: FREQ },
      { id: 55, text: '¿Recibo las críticas o comentarios negativos sin ponerme a la defensiva?', options: FREQ },
      { id: 56, text: '¿Acepto los comentarios negativos como una oportunidad de aprendizaje y mejora personal?', options: FREQ },
    ],
    tips: [
      'Practica la meditación de "observación": mira tus pensamientos sin reaccionar a ellos.',
      'Cuando sientas impaciencia, cuenta hasta 10 lentamente y respira antes de actuar.',
      'Estudia la teoría de la varianza: comprende que los resultados a corto plazo son impredecibles.',
      'Lleva un diario de emociones durante tus sesiones para identificar patrones de impaciencia.',
      'Practica juegos que requieran esperar el momento justo para actuar (ajedrez, etc.).',
    ],
  },
  {
    key: 'resiliencia',
    label: 'Resiliencia',
    icon: '🔄',
    color: '#607D8B',
    description: 'Capacidad de adaptarse y recuperarse ante situaciones adversas, manteniendo una perspectiva de aprendizaje y crecimiento.',
    questions: [
      { id: 57, text: '¿Soy capaz de adaptarme a situaciones difíciles o inesperadas con relativa facilidad?', options: FREQ },
      { id: 58, text: '¿Busco soluciones creativas e innovadoras cuando enfrento problemas complejos?', options: FREQ },
      { id: 59, text: '¿Mantengo una actitud positiva y constructiva cuando enfrento adversidades o contratiempos?', options: FREQ },
      { id: 60, text: '¿Me recupero rápidamente de las decepciones, fracasos o situaciones difíciles?', options: FREQ },
      { id: 61, text: '¿Aprendo y me beneficio activamente de las críticas constructivas que recibo?', options: FREQ },
      { id: 62, text: '¿Veo las dificultades y contratiempos como oportunidades de aprendizaje y crecimiento?', options: FREQ },
      { id: 63, text: '¿Cuento con relaciones de apoyo sólidas que me ayudan a superar los momentos difíciles?', options: FREQ },
      { id: 64, text: '¿Mantengo la calma en situaciones de alto estrés y evito tomar decisiones impulsivas?', options: FREQ },
      { id: 65, text: '¿Persisto ante las dificultades y no me doy por vencido/a fácilmente frente a los obstáculos?', options: FREQ },
      { id: 66, text: '¿Establezco metas realistas y trabajo de manera consistente y disciplinada para alcanzarlas?', options: FREQ },
    ],
    tips: [
      'Después de cada sesión, analiza los errores sin juicio: ¿qué aprendiste?',
      'Desarrolla un ritual de "reset": una actividad que te ayude a salir del tilt rápidamente.',
      'Construye una red de jugadores con mentalidad similar para compartir experiencias.',
      'Practica el reencuadre cognitivo: ¿cómo vería esta situación alguien con más experiencia?',
      'Lleva un registro de tus malas rachas anteriores y cómo las superaste.',
    ],
  },
  {
    key: 'constancia',
    label: 'Constancia',
    icon: '📈',
    color: '#795548',
    description: 'Persistencia en el esfuerzo a lo largo del tiempo, manteniendo el compromiso con los objetivos más allá de la motivación momentánea.',
    questions: [
      { id: 67, text: '¿Mantengo el compromiso con mis metas a largo plazo, incluso cuando el camino se vuelve difícil?', options: FREQ },
      { id: 68, text: '¿Continúo trabajando en mis proyectos a pesar de los obstáculos o dificultades significativas?', options: FREQ },
      { id: 69, text: '¿Sigo adelante con mis objetivos aunque el proceso se vuelva tedioso, aburrido o rutinario?', options: FREQ },
      { id: 70, text: '¿Mantengo la determinación y el esfuerzo a pesar de los fracasos o retrocesos temporales?', options: FREQ },
      { id: 71, text: '¿Tengo una rutina diaria estructurada que me ayuda a avanzar consistentemente hacia mis metas?', options: FREQ },
      { id: 72, text: '¿Gestiono mi tiempo y recursos de manera disciplinada para lograr mis objetivos?', options: FREQ },
      { id: 73, text: '¿Evito posponer las tareas importantes para mi desarrollo personal o profesional?', options: FREQ },
      { id: 74, text: '¿Mantengo el enfoque y la productividad incluso en días donde la motivación es baja?', options: FREQ },
      { id: 75, text: '¿Distingues claramente entre lo urgente y lo importante para priorizar correctamente tus tareas?', options: FREQ },
    ],
    tips: [
      'Establece metas de proceso (horas de estudio/semana) no solo de resultado (ganancias).',
      'Usa la técnica del "Habit Stacking": une un nuevo hábito a uno ya establecido.',
      'Crea un tablero visual de tus metas donde puedas ver tu progreso diariamente.',
      'Comprométete públicamente con tus objetivos: la accountability social aumenta la constancia.',
      'Divide los grandes objetivos en micro-metas semanales para mantener el momentum.',
    ],
  },
  {
    key: 'perseverancia',
    label: 'Perseverancia',
    icon: '🏆',
    color: '#FF5722',
    description: 'Determinación para continuar a pesar de los fracasos, asumiendo responsabilidad y aprendiendo de cada experiencia.',
    questions: [
      { id: 76, text: '¿Mantengo el enfoque en mis tareas y proyectos a largo plazo sin perderme en distracciones?', options: FREQ },
      { id: 77, text: '¿Mantengo la motivación y el entusiasmo cuando enfrento dificultades o retrocesos?', options: FREQ },
      { id: 78, text: '¿Establezco metas claras, específicas y alcanzables que me impulsen a seguir adelante?', options: FREQ },
      { id: 79, text: '¿Asumo la responsabilidad de mis acciones y decisiones, incluso cuando los resultados no son los esperados?', options: FREQ },
      { id: 80, text: '¿Cuando fracaso, lo veo como una oportunidad de aprendizaje y lo intento de nuevo con más información?', options: FREQ },
      { id: 81, text: '¿Busco soluciones creativas y alternativas en lugar de rendirme cuando enfrento obstáculos?', options: FREQ },
      { id: 82, text: '¿Mantengo la calma y la paciencia cuando las cosas no salen como esperaba?', options: FREQ },
      { id: 83, text: '¿Persisto en mis objetivos a pesar de las críticas externas o la falta de apoyo de otros?', options: FREQ },
      { id: 84, text: '¿Mantengo una actitud positiva y esperanzadora incluso cuando enfrento desafíos o adversidades?', options: FREQ },
      { id: 85, text: '¿Continúas trabajando y esforzándote cuando las tareas se vuelven repetitivas o monótonas?', options: FREQ },
    ],
    tips: [
      'Reencuadra el fracaso: cada mano perdida es información valiosa, no un fracaso personal.',
      'Lee sobre el concepto de "Grit" de Angela Duckworth: la pasión y perseverancia superan al talento.',
      'Establece un "por qué" profundo: ¿cuál es tu motivación más poderosa para ser un gran jugador?',
      'Crea afirmaciones positivas específicas al poker y repítelas cada mañana.',
      'Documenta tu progreso: ver el avance acumulado te dará fuerzas en los momentos difíciles.',
    ],
  },
  {
    key: 'autocontrol',
    label: 'Autocontrol Emocional',
    icon: '🧠',
    color: '#3F51B5',
    description: 'Capacidad de gestionar emociones intensas, evitar reacciones impulsivas y tomar decisiones racionales bajo presión.',
    questions: [
      { id: 86, text: 'Puedo controlar mi enojo y evitar reaccionar impulsivamente cuando me siento frustrado o irritado.', options: FREQ },
      { id: 87, text: 'Sé cómo calmarme cuando estoy enojado/a y puedo expresar mis emociones de manera constructiva.', options: FREQ },
      { id: 88, text: 'Puedo lidiar con situaciones estresantes sin que mi ansiedad se vuelva abrumadora o paralizante.', options: FREQ },
      { id: 89, text: 'Tengo estrategias efectivas para reducir la ansiedad cuando la siento (respiración profunda, meditación, etc.).', options: FREQ },
      { id: 90, text: 'Puedo manejar la tristeza, el dolor y la frustración de manera saludable sin que afecten mi desempeño.', options: FREQ },
      { id: 91, text: 'Soy capaz de encontrar formas de recuperarme emocionalmente después de experiencias negativas o dolorosas.', options: FREQ },
      { id: 92, text: 'Puedo pensar antes de actuar y evitar decisiones impulsivas que puedan tener consecuencias negativas.', options: FREQ },
      { id: 93, text: 'Tengo la capacidad de posponer la gratificación inmediata y tomar decisiones pensando en el largo plazo.', options: FREQ },
      { id: 94, text: 'Mantengo el control emocional en situaciones de alta presión, como en manos clave del poker o decisiones críticas.', options: FREQ },
    ],
    tips: [
      'Implementa la regla de los 10 segundos antes de cualquier decisión importante en la mesa.',
      'Aprende técnicas de respiración: inhala 4s, retén 4s, exhala 4s (respiración cuadrada).',
      'Practica el "stop loss emocional": define un umbral de pérdida tras el cual te retiras de la sesión.',
      'Estudia el concepto de "tilt" y sus variantes para reconocerlo antes de que afecte tu juego.',
      'Trabaja con un coach mental o psicólogo deportivo especializado en alta competencia.',
    ],
  },
];

function calculateScores(answers) {
  const scores = {};
  for (const cat of EVHAPO_CATEGORIES) {
    let catScore = 0, catMax = 0;
    for (const q of cat.questions) {
      const ans = answers[q.id];
      if (ans !== undefined) {
        const opt = q.options.find(o => o.value === ans);
        if (opt) catScore += opt.points;
        catMax += 10;
      }
    }
    scores[cat.key] = catMax > 0 ? Math.round((catScore / catMax) * 100 * 10) / 10 : 0;
  }
  return scores;
}

function getOverallScore(scores) {
  const vals = Object.values(scores);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
}

function getLevel(pct) {
  if (pct >= 85) return { label: 'ÉLITE', cls: 'level-elite', desc: 'Mentalidad de jugador de alto rendimiento. ¡Estás al más alto nivel!' };
  if (pct >= 70) return { label: 'AVANZADO', cls: 'level-avanzado', desc: 'Fortalezas sólidas con pequeñas áreas de mejora para llegar a la élite.' };
  if (pct >= 50) return { label: 'INTERMEDIO', cls: 'level-intermedio', desc: 'Base sólida con oportunidades de mejora significativas.' };
  return { label: 'EN DESARROLLO', cls: 'level-basico', desc: 'Gran potencial de crecimiento. ¡Este diagnóstico es el primer paso!' };
}
