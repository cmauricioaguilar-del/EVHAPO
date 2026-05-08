// ─── Opciones reutilizables ───────────────────────────────────────────────────

function opt(label, value, points) { return { label, value, points }; }

// ─── Categorías del Test Técnico ──────────────────────────────────────────────

const TECHNICAL_CATEGORIES = [
  {
    key: 'rangos_preflop',
    label: 'Rangos Pre-Flop',
    icon: '🃏',
    color: '#1565C0',
    description: 'Conocimiento de rangos de apertura, 3-bet, 4-bet y calling ranges según posición y número de jugadores.',
    questions: [
      {
        id: 201,
        text: 'En una mesa de 9 jugadores, ¿desde qué posición deberías tener el rango de apertura MÁS cerrado?',
        options: [
          opt('UTG (Under the Gun)', 'a', 10),
          opt('CO (Cut-Off)', 'b', 0),
          opt('BTN (Button)', 'c', 0),
          opt('SB (Small Blind)', 'd', 0),
        ],
      },
      {
        id: 202,
        text: 'Tienes ATo en CO. El HJ abre a 3BB, todos foldean. ¿Cuál es la acción más equilibrada (GTO)?',
        options: [
          opt('3-bet o fold — ATo no es mano para cold call en CO', 'a', 10),
          opt('Llamar siempre — ATo es demasiado fuerte para foldear', 'b', 0),
          opt('Foldear siempre — ATo es demasiado débil frente a HJ', 'c', 0),
          opt('Subir siempre a 9BB — tenemos ventaja de posición', 'd', 0),
        ],
      },
      {
        id: 203,
        text: '¿Qué son los "blockers" y para qué sirven en la decisión de 3-bet bluff?',
        options: [
          opt('Cartas que reducen la probabilidad de que el rival tenga manos fuertes del mismo rango', 'a', 10),
          opt('Manos que bloquean el bote para no pagar demasiado', 'b', 0),
          opt('Jugadas defensivas para evitar que el rival haga raise', 'c', 0),
          opt('Posiciones que "bloquean" el acceso a la mano al resto de jugadores', 'd', 0),
        ],
      },
      {
        id: 204,
        text: 'Tienes KQo en BTN. UTG abre 3BB, todos foldean. ¿Cuál es la acción correcta?',
        options: [
          opt('3-bet o fold según el tendencia del rival — KQo es marginal vs UTG', 'a', 10),
          opt('Llamar siempre — KQo juega bien en posición', 'b', 0),
          opt('Subir siempre — KQo domina el rango de UTG', 'c', 0),
          opt('Foldear siempre — KQo no vale nada frente a UTG', 'd', 0),
        ],
      },
      {
        id: 205,
        text: '¿Qué significa "cold call" en el pre-flop?',
        options: [
          opt('Llamar un raise sin haber puesto fichas previas en el bote', 'a', 10),
          opt('Llamar una apuesta con una mano muy fuerte para disimular', 'b', 0),
          opt('Hacer call en el big blind cuando no hay raise', 'c', 0),
          opt('Igualar la apuesta desde el small blind', 'd', 0),
        ],
      },
      {
        id: 206,
        text: '¿En qué situación es correcto hacer un 4-bet como bluff?',
        options: [
          opt('Con manos que tienen buenos blockers (ej. A5s, A4s) y poca equity si nos llaman', 'a', 10),
          opt('Siempre que tengamos una mano de medio par o mejor', 'b', 0),
          opt('Cuando estamos fuera de posición y queremos ganar el bote preflop', 'c', 0),
          opt('Solo cuando tenemos nuts como AA o KK para maximizar valor', 'd', 0),
        ],
      },
      {
        id: 207,
        text: 'En una mesa de 6 jugadores (6-max), el rango de apertura desde BTN debería ser aproximadamente:',
        options: [
          opt('40-50% de manos — el BTN es la posición más ventajosa', 'a', 10),
          opt('15-20% de manos — hay que ser selectivo siempre', 'b', 0),
          opt('70-80% de manos — en BTN puedes abrir casi todo', 'c', 0),
          opt('Solo manos premium (AA, KK, QQ, AK) — el riesgo es alto', 'd', 0),
        ],
      },
      {
        id: 208,
        text: '¿Qué ventaja tiene el BB al defenderse vs. un open del BTN?',
        options: [
          opt('Ya tiene 1BB invertido, por lo que el precio del call es menor y puede defender más amplio', 'a', 10),
          opt('El BB siempre tiene ventaja posicional sobre el BTN', 'b', 0),
          opt('El BB puede hacer squeeze con cualquier mano porque tiene posición', 'c', 0),
          opt('No tiene ninguna ventaja; el BTN siempre domina al BB', 'd', 0),
        ],
      },
    ],
    tips: [
      'Estudia los rangos de apertura por posición con solvers como GTO Wizard o aplicaciones de rangos.',
      'Empieza memorizando los rangos de BTN, CO y BB — son las posiciones con más volumen de manos.',
      'Entiende la diferencia entre RFI (raise first in), 3-bet y cold call antes de memorizar rangos.',
      'Practica con quizzes de rangos diariamente: 10 minutos al día hacen la diferencia en semanas.',
      'Los rangos varían según el tipo de mesa (6-max, 9-max) y la dinámica de los rivales.',
    ],
  },

  {
    key: 'juego_ip',
    label: 'Juego en Posición (IP)',
    icon: '🎯',
    color: '#00695C',
    description: 'Comprensión de las ventajas posicionales, líneas de juego y estrategias cuando se actúa después del rival.',
    questions: [
      {
        id: 209,
        text: '¿Cuál es la principal ventaja táctica de jugar en posición (IP)?',
        options: [
          opt('Actuar último permite tomar decisiones con más información sobre la mano del rival', 'a', 10),
          opt('Puedes apostar más grande porque el rival no puede verte', 'b', 0),
          opt('Tienes acceso a más manos ganadoras en posición', 'c', 0),
          opt('Puedes farolear más porque el rival no espera apuesta', 'd', 0),
        ],
      },
      {
        id: 210,
        text: 'Eres BTN, el BB checkea en un flop A-7-2 rainbow. ¿Cuál es la estrategia más equilibrada?',
        options: [
          opt('Apostar frecuente con tamaño pequeño (25-33% pot) — este flop favorece al BTN', 'a', 10),
          opt('Checkear siempre para no arriesgar — el rival puede tener al As', 'b', 0),
          opt('Apostar grande (75% pot) con toda tu gama para presionar', 'c', 0),
          opt('Solo apostar si tienes el As o mejor — el resto es peligroso', 'd', 0),
        ],
      },
      {
        id: 211,
        text: '¿Qué es un "delayed c-bet" (continuation bet retrasada)?',
        options: [
          opt('Checkear el flop en posición y apostar el turn cuando el rival también checkea', 'a', 10),
          opt('Hacer c-bet en el flop y luego bajar el tamaño en el turn', 'b', 0),
          opt('Esperar hasta el river para hacer la primera apuesta', 'c', 0),
          opt('Subir la apuesta del rival en el turn después de haber llamado en el flop', 'd', 0),
        ],
      },
      {
        id: 212,
        text: 'Tienes KK en posición. El flop viene J-T-9 con dos palos. El rival apuesta 2/3 pot. ¿Cuál es la mejor acción?',
        options: [
          opt('Llamar — tenemos una mano fuerte pero el board es muy húmedo y arriesgado para subir', 'a', 10),
          opt('Foldear siempre — KK sin set es demasiado débil en este board', 'b', 0),
          opt('Subir all-in inmediatamente — KK es muy fuerte', 'c', 0),
          opt('Subir small para "sondear" la fuerza del rival', 'd', 0),
        ],
      },
      {
        id: 213,
        text: '¿Cuándo es más correcto hacer un "check-back" (checkear en posición) en el flop?',
        options: [
          opt('Con manos de medio par o draws débiles para controlar el bote y llegar al turn', 'a', 10),
          opt('Nunca — siempre hay que apostar en posición para aprovechar la ventaja', 'b', 0),
          opt('Solo cuando tienes la mano más fuerte posible (nuts)', 'c', 0),
          opt('Siempre que el rival haya mostrado debilidad antes del flop', 'd', 0),
        ],
      },
      {
        id: 214,
        text: 'Estás en BTN vs SB. El SB hace check-raise en el flop. ¿Qué indica generalmente esta línea?',
        options: [
          opt('Una mano fuerte (set, dos pares) o un draw muy potente — el SB protege su rango', 'a', 10),
          opt('Siempre es un farol — nadie tiene algo real tan rápido', 'b', 0),
          opt('Una mano débil intentando robar el bote antes del turn', 'c', 0),
          opt('Solo indica que el SB tiene el As y quiere valor', 'd', 0),
        ],
      },
      {
        id: 215,
        text: 'En posición, tu rival checkea el turn después de check-callear el flop. Tienes aire total. ¿Cuándo apostar?',
        options: [
          opt('Cuando el turn es una carta que puede asustar al rival (scare card) y tienes fold equity', 'a', 10),
          opt('Siempre — si chequeó dos veces es que tiene mano débil', 'b', 0),
          opt('Nunca — con aire no se apuesta dos veces seguidas', 'c', 0),
          opt('Solo si el bote es pequeño y el riesgo es bajo', 'd', 0),
        ],
      },
      {
        id: 216,
        text: '¿Qué es una "probe bet" y cuándo se usa?',
        options: [
          opt('Apuesta del jugador OOP en el turn cuando el jugador IP chequeó el flop', 'a', 10),
          opt('Una apuesta pequeña para ver si el rival "reacciona" con información', 'b', 0),
          opt('Una sobre-apuesta en el river para maximizar valor con nuts', 'c', 0),
          opt('La primera apuesta que hace el PFR en el flop', 'd', 0),
        ],
      },
    ],
    tips: [
      'Aprovecha el botón: en BTN puedes abrir hasta un 45-50% de manos en mesas de 6-max.',
      'Aprende a hacer "range advantage": identifica qué tableros favorecen a tu rango vs el del rival.',
      'Practica el delayed c-bet: es una herramienta muy potente y subutilizada por jugadores intermedios.',
      'En posición no siempre hay que apostar — el check-back estratégico protege tu rango.',
      'Estudia los tamaños de apuesta óptimos por tipo de tablero: no es lo mismo A-high seco que J-T-9 húmedo.',
    ],
  },

  {
    key: 'juego_oop',
    label: 'Juego Fuera de Posición (OOP)',
    icon: '🛡️',
    color: '#6A1B9A',
    description: 'Estrategias y líneas de juego cuando se actúa antes que el rival, incluyendo check-raise, donk bet y gestión del rango.',
    questions: [
      {
        id: 217,
        text: '¿Cuál es el principal desafío de jugar fuera de posición (OOP)?',
        options: [
          opt('Actuar primero limita la información disponible y obliga a revelar la fuerza de tu mano antes', 'a', 10),
          opt('Fuera de posición solo puedes jugar manos premium', 'b', 0),
          opt('No puedes hacer bluff porque el rival siempre sabe que tienes aire', 'c', 0),
          opt('Las apuestas cuestan más cuando estás OOP', 'd', 0),
        ],
      },
      {
        id: 218,
        text: 'Desde el BB, llamaste el open del BTN. El flop viene K-8-2 rainbow. ¿Qué estrategia es más equilibrada?',
        options: [
          opt('Check la mayoría del rango — el BTN tiene ventaja de rango en este flop alto', 'a', 10),
          opt('Apostar siempre con cualquier mano para mostrar fuerza', 'b', 0),
          opt('Foldear si no tienes al rey — el riesgo es muy alto', 'c', 0),
          opt('Hacer check-raise con todo el rango para equilibrar', 'd', 0),
        ],
      },
      {
        id: 219,
        text: '¿Qué es un "donk bet"?',
        options: [
          opt('Apostar fuera de posición en el flop cuando el rival fue el que abrió preflop (PFR)', 'a', 10),
          opt('Una apuesta muy grande hecha sin sentido estratégico', 'b', 0),
          opt('Una apuesta mínima para ver si el rival sube', 'c', 0),
          opt('La primera apuesta del jugador en posición en el flop', 'd', 0),
        ],
      },
      {
        id: 220,
        text: 'OOP, el flop viene 6-6-9 rainbow. El rival abrió desde CO. ¿Qué rango se beneficia de un donk bet?',
        options: [
          opt('Manos con 6 (trips), nines, y algunos draws — tableros paired favorecen al que llamó', 'a', 10),
          opt('Solo se hace donk con bluffs totales para confundir', 'b', 0),
          opt('Nunca se hace donk en tableros paired — es una jugada muy avanzada', 'c', 0),
          opt('Solo con la mano más fuerte posible para maximizar valor', 'd', 0),
        ],
      },
      {
        id: 221,
        text: '¿Qué significa "polarizar tu rango" cuando apuestas OOP?',
        options: [
          opt('Apostar con manos muy fuertes (value) o muy débiles (bluff), eliminando el medio', 'a', 10),
          opt('Dividir tu rango exactamente al 50% entre calls y raises', 'b', 0),
          opt('Jugar todas tus manos de la misma manera para no dar información', 'c', 0),
          opt('Usar tamaños de apuesta diferentes según la posición del rival', 'd', 0),
        ],
      },
      {
        id: 222,
        text: 'Tienes A5s OOP. El flop viene J-T-4 con dos palos de tu palo (tienes flush draw + gutshot). ¿Qué haces?',
        options: [
          opt('Check-raise — tienes mucha equity y es una excelente mano para semi-bluff', 'a', 10),
          opt('Foldear — los draws fuera de posición no valen la pena', 'b', 0),
          opt('Llamar siempre — A5s es demasiado débil para subir', 'c', 0),
          opt('Apostar small para "proteger" tu draw', 'd', 0),
        ],
      },
      {
        id: 223,
        text: '¿Por qué es importante tener "nut advantage" cuando juegas OOP?',
        options: [
          opt('Tener las mejores manos posibles te permite defender mejor tu rango y apostar con más frecuencia', 'a', 10),
          opt('El nut advantage solo importa en el river, no cuando juegas OOP', 'b', 0),
          opt('El nut advantage no tiene importancia real en el juego moderno', 'c', 0),
          opt('Solo importa en torneos, no en cash games', 'd', 0),
        ],
      },
      {
        id: 224,
        text: 'Check-raise desde OOP en un flop seco (A-7-2 rainbow). ¿Qué rango lo representa correctamente?',
        options: [
          opt('Sets, dos pares, y algunos bluffs con buena equity — el rango es muy polarizado', 'a', 10),
          opt('Solo bluffs — nadie hace check-raise con manos fuertes en flops secos', 'b', 0),
          opt('Siempre indica al As con kicker fuerte', 'c', 0),
          opt('Es una jugada sin sentido estratégico en flops secos', 'd', 0),
        ],
      },
    ],
    tips: [
      'Aprende los conceptos de "range advantage" y "nut advantage" — son clave para decidir cuándo apostar OOP.',
      'El check-raise es tu arma principal OOP: úsalo con draws fuertes y manos de valor para equilibrar.',
      'Estudia en qué tableros puedes hacer donk bet con sentido y en cuáles debes solo checkear.',
      'OOP debes ser más selectivo con las manos que juegas — la desventaja posicional tiene un coste real.',
      'Practica identificar si tienes "range advantage" o "nut advantage" antes de cada decisión OOP.',
    ],
  },

  {
    key: 'textura_flop',
    label: 'Textura del Flop',
    icon: '🎴',
    color: '#E65100',
    description: 'Análisis del tablero del flop: clasificación por humedad, coordenación, ventaja de rango y tamaños de apuesta óptimos.',
    questions: [
      {
        id: 225,
        text: '¿Qué es un flop "monotone"?',
        options: [
          opt('Un flop donde las tres cartas son del mismo palo', 'a', 10),
          opt('Un flop donde no hay posibilidades de draw', 'b', 0),
          opt('Un flop con tres cartas seguidas del mismo valor', 'c', 0),
          opt('Un flop donde solo hay una carta de cada palo', 'd', 0),
        ],
      },
      {
        id: 226,
        text: 'Flop: A♥-7♦-2♣ (rainbow, sin draws). ¿Cómo clasificarías este tablero?',
        options: [
          opt('Seco y estático — pocas manos cambian de valor en el turn o river', 'a', 10),
          opt('Húmedo y dinámico — muchos draws posibles', 'b', 0),
          opt('Conectado — hay straight draws evidentes', 'c', 0),
          opt('Paired — el As duplica las posibilidades', 'd', 0),
        ],
      },
      {
        id: 227,
        text: 'Flop: J♣-T♣-9♥. ¿Cuál es el principal impacto estratégico de este tablero?',
        options: [
          opt('Es muy dinámico — muchos draws de color y escalera cambian el valor de las manos en cada calle', 'a', 10),
          opt('Solo el que tiene la J domina el tablero', 'b', 0),
          opt('Es un tablero estático donde el farol es inútil', 'c', 0),
          opt('Solo sirve a manos muy fuertes como sets o escaleras hechas', 'd', 0),
        ],
      },
      {
        id: 228,
        text: '¿En general, quién se beneficia más de los flops bajos y conectados (ej. 6-5-4)?',
        options: [
          opt('El jugador que llamó preflop (caller) — tiene más manos conectadas en su rango', 'a', 10),
          opt('El que abrió preflop (PFR) — siempre tiene ventaja de rango', 'b', 0),
          opt('El BTN independientemente de si abrió o llamó', 'c', 0),
          opt('Ninguno — estos tableros son neutros para ambos jugadores', 'd', 0),
        ],
      },
      {
        id: 229,
        text: 'En un flop Q-J-5 con dos palos (semi-húmedo), ¿qué tamaño de c-bet es más equilibrado para el PFR?',
        options: [
          opt('33-50% del bote — tamaño mediano equilibra valor y protección', 'a', 10),
          opt('Siempre over-bet (+100%) para presionar los draws', 'b', 0),
          opt('Siempre apuesta mínima (min-bet) para ahorrar fichas', 'c', 0),
          opt('No se apuesta en flops semi-húmedos — demasiado peligroso', 'd', 0),
        ],
      },
      {
        id: 230,
        text: '¿Qué es un flop "paired" y cómo afecta la estrategia?',
        options: [
          opt('Un flop con dos cartas del mismo valor (ej. A-A-7) — beneficia al rango del PFR y complica los draws', 'a', 10),
          opt('Un flop donde ambos jugadores tienen par — el bote se divide', 'b', 0),
          opt('Un tablero donde hay exactamente dos palos distintos', 'c', 0),
          opt('Un tablero que favorece siempre al jugador OOP', 'd', 0),
        ],
      },
      {
        id: 231,
        text: 'Flop: K♠-K♦-2♣. ¿Quién suele tener ventaja de rango en este tablero?',
        options: [
          opt('El PFR (quien abrió preflop) — tiene más Kx en su rango de apertura', 'a', 10),
          opt('Siempre el BB — tiene acceso a cualquier K por precio', 'b', 0),
          opt('El jugador en posición siempre, independientemente del rango', 'c', 0),
          opt('Nadie — los tableros paired son siempre neutros', 'd', 0),
        ],
      },
      {
        id: 232,
        text: 'En un flop muy húmedo (muchos draws de color y escalera), ¿cuál es la estrategia más correcta?',
        options: [
          opt('Apostar grande con value para negar equity a los draws y proteger la mano', 'a', 10),
          opt('Siempre checkear — los tableros húmedos son demasiado peligrosos', 'b', 0),
          opt('Apostar pequeño para no perder muchas fichas si el rival tiene draw', 'c', 0),
          opt('Ir all-in inmediatamente con cualquier par para maximizar fold equity', 'd', 0),
        ],
      },
    ],
    tips: [
      'Aprende a clasificar cada tablero antes de decidir: ¿es seco o húmedo? ¿estático o dinámico?',
      'Estudia cómo cada tablero interactúa con los rangos de apertura de cada posición.',
      'El tamaño de apuesta en el flop debe reflejar la humedad del tablero: tableros secos → apuestas pequeñas; húmedos → apuestas grandes.',
      'Practica identificar quién tiene "range advantage" en cada flop según las posiciones del hand.',
      'Usa solvers para ver cómo los mejores jugadores del mundo apuestan en distintos tipos de tablero.',
    ],
  },

  {
    key: 'lineas_turn',
    label: 'Turn: Líneas de Juego',
    icon: '↩️',
    color: '#558B2F',
    description: 'Estrategias en el turn: double barrel, check-raise, scare cards, pot control y gestión de equity en la segunda calle del post-flop.',
    questions: [
      {
        id: 233,
        text: '¿Qué es el "double barrel" en el turn?',
        options: [
          opt('Apostar por segunda vez consecutiva en el turn después de haber apostado en el flop', 'a', 10),
          opt('Subir dos veces el tamaño de apuesta del rival en el flop', 'b', 0),
          opt('Hacer c-bet en el flop y luego check-raise en el turn', 'c', 0),
          opt('Apostar en el river con dos outs o menos', 'd', 0),
        ],
      },
      {
        id: 234,
        text: 'Hiciste c-bet en el flop y te llamaron. El turn es una carta blank (sin draws nuevos). ¿Cuándo continuar apostando?',
        options: [
          opt('Con manos de value fuerte y con bluffs que tienen equity (draws) o buena fold equity', 'a', 10),
          opt('Siempre — si apostaste en el flop hay que dar continuidad', 'b', 0),
          opt('Nunca — el double barrel es demasiado caro y predecible', 'c', 0),
          opt('Solo si tienes la mano más fuerte posible del board', 'd', 0),
        ],
      },
      {
        id: 235,
        text: '¿Qué significa "recoger equity" (pick up equity) en el turn?',
        options: [
          opt('Cuando una carta del turn mejora tu mano o tu draw, aumentando tus posibilidades de ganar', 'a', 10),
          opt('Hacer apuestas pequeñas para acumular bote antes del river', 'b', 0),
          opt('Calcular el equity exacto de tu mano con la calculadora', 'c', 0),
          opt('Cuando el rival checkea y tú puedes ver el river gratis', 'd', 0),
        ],
      },
      {
        id: 236,
        text: 'Tu rival hizo check-call en el flop y ahora hace check-raise en el turn. ¿Qué indica generalmente?',
        options: [
          opt('Una mano muy fuerte — el check-raise en el turn suele ser de value (set, dos pares, straight)', 'a', 10),
          opt('Siempre un farol — nadie tiene algo tan fuerte tan rápido', 'b', 0),
          opt('Una mano débil intentando robar el bote antes del river', 'c', 0),
          opt('El rival tiene aire y quiere verte foldear antes del river', 'd', 0),
        ],
      },
      {
        id: 237,
        text: '¿Qué es una "scare card" en el turn y cómo cambia la estrategia?',
        options: [
          opt('Una carta que completa draws posibles o empareja el tablero, generando más incertidumbre', 'a', 10),
          opt('Una carta que siempre beneficia al rival independientemente de su mano', 'b', 0),
          opt('El As cuando aparece en el turn — siempre asusta al que no lo tiene', 'c', 0),
          opt('Una carta que hace que ningún jugador quiera apostar', 'd', 0),
        ],
      },
      {
        id: 238,
        text: 'Tienes un flush draw en el turn con 9 outs. El bote es $100 y el rival apuesta $60. ¿Es correcto llamar?',
        options: [
          opt('Sí — tienes aprox. 18% de equity en el turn y el precio del call ($60/$160=37.5%) no es suficiente, pero puedes llamar si tienes implied odds', 'a', 10),
          opt('Sí siempre — los flush draws siempre valen la pena llamar', 'b', 0),
          opt('No nunca — los draws nunca justifican el call', 'c', 0),
          opt('Solo si el rival es muy agresivo y está farolando siempre', 'd', 0),
        ],
      },
      {
        id: 239,
        text: '¿Cuándo es óptimo hacer un check-raise en el turn siendo OOP?',
        options: [
          opt('Con manos muy fuertes o semi-bluffs con mucha equity para proteger el rango y ganar valor', 'a', 10),
          opt('Solo cuando tienes aire total para robar el bote', 'b', 0),
          opt('Siempre que el rival haya apostado en el flop — es señal de debilidad', 'c', 0),
          opt('Nunca — el check-raise en el turn es solo para jugadores avanzados', 'd', 0),
        ],
      },
      {
        id: 240,
        text: 'Apostaste el flop y chequeaste el turn. Tu rival apuesta. Tienes top pair con kicker débil. ¿Qué haces?',
        options: [
          opt('Depende del sizing y del rival — generalmente call para llegar al river y evaluar', 'a', 10),
          opt('Siempre foldear — si chequeaste el turn es que tienes mano débil', 'b', 0),
          opt('Siempre subir para "defenderte" — muéstrale que tienes mano', 'c', 0),
          opt('Ir all-in — top pair siempre es suficiente para jugar por toda la pila', 'd', 0),
        ],
      },
    ],
    tips: [
      'Estudia el concepto de "turn barreling frequencies" — no hay que apostar el turn siempre, sino con el rango correcto.',
      'Identifica qué cartas del turn mejoran tu rango y cuáles mejoran el rango del rival.',
      'Las scare cards pueden ser oportunidades de bluff — si una carta asusta al rival, puede que te ayude a tomar el bote.',
      'El check-raise en el turn es una jugada de alto impacto — úsala con manos fuertes y semi-bluffs poderosos.',
      'Aprende los conceptos de "implied odds" y "reverse implied odds" para las decisiones con draws.',
    ],
  },

  {
    key: 'river_value',
    label: 'River: Value Bet y Líneas',
    icon: '💰',
    color: '#B71C1C',
    description: 'Decisiones finales en el river: sizing del value bet, identificación de bluffs, lectura de líneas anteriores y gestión del bote.',
    questions: [
      {
        id: 241,
        text: '¿Qué es una "thin value bet" en el river?',
        options: [
          opt('Apostar con una mano marginalmente ganadora esperando que el rival llame con manos peores', 'a', 10),
          opt('Una apuesta pequeña para no perder muchas fichas si el rival tiene mejor mano', 'b', 0),
          opt('Apostar solo cuando estás seguro de tener la mejor mano posible', 'c', 0),
          opt('Una apuesta de valor que el rival no puede ver venir', 'd', 0),
        ],
      },
      {
        id: 242,
        text: 'Llegaste al river con la mano nut (mejor mano posible). El bote es $200. ¿Qué tamaño de value bet es generalmente más correcto?',
        options: [
          opt('Depende del rango del rival — si tiene manos con las que llama grande, over-bet o 75-100% pot', 'a', 10),
          opt('Siempre apuesta mínima para asegurarte de que te llamen', 'b', 0),
          opt('Siempre all-in — con la mejor mano siempre hay que maximizar', 'c', 0),
          opt('No apuestes — el rival se irá si apuestas con la nut', 'd', 0),
        ],
      },
      {
        id: 243,
        text: '¿Cuándo es correcto hacer bluff en el river?',
        options: [
          opt('Cuando tienes fold equity suficiente, una historia coherente de juego y el rival puede foldear manos fuertes', 'a', 10),
          opt('Siempre que hayas perdido mucho en la sesión — necesitas recuperar', 'b', 0),
          opt('Solo cuando tienes aire total y nunca pudiste conectar', 'c', 0),
          opt('Nunca — el bluff en el river es siempre un error', 'd', 0),
        ],
      },
      {
        id: 244,
        text: 'El river llega y tienes segunda pareja. Tu rival apuesta el 75% del bote. ¿Qué indica su línea de juego?',
        options: [
          opt('Una mano fuerte — una apuesta grande en el river suele ser polarizada hacia value o bluff, rara vez mano mediana', 'a', 10),
          opt('Siempre es un farol — nadie apuesta grande con mano real en el river', 'b', 0),
          opt('Tiene exactamente segunda pareja como tú — quiere empatar el bote', 'c', 0),
          opt('No podemos saber nada — el river es siempre aleatorio', 'd', 0),
        ],
      },
      {
        id: 245,
        text: 'Tienes KK en un board A-high (A-8-4-2-7). El flop y turn fueron pasivos. ¿Cuál es tu línea en el river?',
        options: [
          opt('Value bet mediano o thin value — KK es posiblemente bueno pero no podemos apostar grande con miedo al As', 'a', 10),
          opt('Siempre check-fold — KK sin set en board con As es mano perdida', 'b', 0),
          opt('All-in siempre — KK es demasiado fuerte para ser cauteloso', 'c', 0),
          opt('Foldear si el rival apuesta cualquier tamaño — el As siempre está ahí', 'd', 0),
        ],
      },
      {
        id: 246,
        text: '¿Qué es el "pot control" y cuándo se aplica en el river?',
        options: [
          opt('Estrategia de mantener el bote pequeño con manos medianas para evitar situaciones difíciles', 'a', 10),
          opt('Calcular exactamente el tamaño del bote para decidir si apostar', 'b', 0),
          opt('Controlar las emociones cuando el bote es muy grande', 'c', 0),
          opt('Técnica para evitar que el rival suba el bote en el river', 'd', 0),
        ],
      },
      {
        id: 247,
        text: 'Tu rival ha sido pasivo en flop y turn, y de repente apuesta over-bet (más del 100% del bote) en el river. ¿Qué indica?',
        options: [
          opt('Rango muy polarizado — mano muy fuerte (nuts) o farol desesperado; rara vez mano mediana', 'a', 10),
          opt('Siempre tiene la mejor mano — el over-bet es señal de nuts', 'b', 0),
          opt('Siempre está farolando — el over-bet es señal de desesperación', 'c', 0),
          opt('No tiene ningún significado — el sizing del river es aleatorio', 'd', 0),
        ],
      },
      {
        id: 248,
        text: '¿Qué significa "blocker bet" en el river?',
        options: [
          opt('Apuesta pequeña OOP para controlar el tamaño del bote y evitar una apuesta grande del rival', 'a', 10),
          opt('Apostar con cartas que bloquean los draws del rival', 'b', 0),
          opt('Bluff de gran tamaño para forzar fold del rival', 'c', 0),
          opt('Apuesta de valor que el rival no puede ignorar', 'd', 0),
        ],
      },
    ],
    tips: [
      'Practica identificar la "polaridad" de las apuestas del river: ¿el sizing indica value o bluff?',
      'Aprende cuándo hacer thin value bet — es la habilidad que más diferencia a los jugadores intermedios de los avanzados.',
      'El pot control en el river es clave con manos medianas — protege tu rango y tu stack.',
      'Estudia las "river lines" coherentes: ¿qué manos justifican la historia que mostraste en flop y turn?',
      'Desarrolla el hábito de leer la línea completa del rival antes de decidir en el river.',
    ],
  },
];

// ─── Lógica de puntuación técnica ─────────────────────────────────────────────

function calculateTechnicalScores(answers) {
  const scores = {};
  for (const cat of TECHNICAL_CATEGORIES) {
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

function getTechnicalOverallScore(scores) {
  const vals = Object.values(scores);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
}

function getTechnicalLevel(pct) {
  if (pct >= 85) return { label: 'PROFESIONAL',  cls: 'level-profesional',  desc: '¡Conocimiento técnico de élite! Estás al nivel de jugadores de alto rendimiento.' };
  if (pct >= 70) return { label: 'AVANZADO',      cls: 'level-avanzado',     desc: 'Sólido conocimiento técnico con pequeñas áreas de mejora para llegar al nivel profesional.' };
  if (pct >= 50) return { label: 'INTERMEDIO',    cls: 'level-intermedio',   desc: 'Base técnica correcta con oportunidades importantes de profundización.' };
  if (pct >= 30) return { label: 'BAJO',           cls: 'level-bajo',         desc: 'Conocimientos básicos presentes, pero con brechas técnicas significativas a trabajar.' };
  return          { label: 'PRINCIPIANTE', cls: 'level-principiante', desc: 'Gran recorrido de aprendizaje por delante. ¡Este diagnóstico es el punto de partida!' };
}
