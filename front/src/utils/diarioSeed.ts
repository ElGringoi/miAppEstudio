export interface DiarioArticulo {
  id: string;
  titulo: string;
  contenido: string;
  tags: string[];
  fuente?: string;
  seccion?: 'deporte' | 'entretenimiento';
  subseccion?: string;
  /**
   * YYYY-MM-DD — cuándo se escribió. Solo la llevan los artículos de
   * actualidad: los ensayos atemporales no envejecen y la dejan vacía.
   * scoreArticulos la usa para que lo nuevo suba solo.
   */
  fecha?: string;
}

export const ARTICULOS: DiarioArticulo[] = [
  {
    id: 'art-01',
    titulo: 'El mes en que los modelos dejaron de esperarse entre sí',
    contenido: 'Septiembre de 2026 va a quedar como el mes en que el ritmo de la industria de la inteligencia artificial dejó de medirse en trimestres y pasó a medirse en horas. El 22 de septiembre Anthropic presentó Claude Opus 5.5. Unos noventa minutos después, OpenAI anunció GPT-6 Sol y GPT-6 Luna. No fue casualidad: fue una decisión de calendario, y dice más sobre el estado de la competencia que cualquier benchmark.\n\nEn tres semanas se acumularon más de media docena de modelos de frontera. Google sumó Gemini 3.8 Live, orientado a voz en tiempo real. Los GPT-6 llegaron con un argumento incómodo para el resto del mercado: cuestan alrededor de la mitad que sus versiones anteriores y rinden mejor. Cuando el precio baja y la capacidad sube al mismo tiempo, lo que se mueve no es solo el ranking de modelos, sino qué productos se vuelven viables.\n\nLo más interesante del mes, sin embargo, no fue un lanzamiento. Varios de los CEOs de las principales empresas del sector pidieron públicamente frenar el ritmo de desarrollo. Es un gesto difícil de leer. Puede ser una preocupación genuina por la seguridad, puede ser una forma de levantar la escalera después de haber subido, o pueden ser las dos cosas a la vez. Lo concreto es que la misma semana en que pedían frenar, lanzaron.',
    tags: ['ia', 'tecnología', 'modelos', 'industria', 'futuro'],
    fuente: 'Coberturas de lanzamientos de modelos — septiembre de 2026',
    fecha: '2026-10-05',
  },
  {
    id: 'art-02',
    titulo: 'Por qué los LLMs no "entienden" pero igual funcionan',
    contenido: 'Los modelos de lenguaje como GPT o Claude no tienen comprensión en el sentido humano. No tienen experiencias, no sienten confusión ni curiosidad. Son, en esencia, maquinarias estadísticas entrenadas para predecir el siguiente token más probable dado un contexto. Y sin embargo, los resultados son sorprendentemente coherentes.\n\nEl debate filosófico aquí es fascinante: ¿puede haber inteligencia sin comprensión? John Searle argumentó que no, con su famoso experimento mental de la "habitación china". Pero los resultados prácticos de los LLMs desafían esa intuición. Quizás la comprensión sea, en parte, un epifenómeno de la predicción a escala.\n\nLo que sí es claro es que estas herramientas amplifican la cognición humana de formas sin precedentes. Saber usarlas bien —con pensamiento crítico, con prompts precisos y con validación activa— se está convirtiendo en la nueva alfabetización del siglo XXI.',
    tags: ['ia', 'inteligencia artificial', 'tecnología', 'filosofía'],
    fuente: 'Research: Attention is All You Need — Vaswani et al.',
  },
  {
    id: 'art-03',
    titulo: 'El sistema de bloques de tiempo que usa Cal Newport',
    contenido: 'Cal Newport, profesor en Georgetown y autor de "Deep Work", no usa listas de tareas. Usa un cuaderno donde cada día bloquea el tiempo en franjas horarias específicas. No una lista de cosas por hacer, sino un mapa de cuándo va a hacer cada cosa.\n\nLa diferencia es crucial. Una lista de tareas te dice qué; el bloqueo de tiempo te obliga a decidir cuándo y cuánto. Eso fuerza el realismo: si tu lista tiene doce ítems pero solo tenés seis horas, el bloqueo te hace ver que algo no va a entrar. Mejor decidirlo vos que que el caos lo decida por vos.\n\nNewport propone también bloques de "captura" al final del día para revisar qué entró y qué no, y re-planificar el siguiente. Es un sistema de planificación que vive en tensión productiva con la realidad, en lugar de ignorarla.',
    tags: ['productividad', 'gestión del tiempo', 'trabajo profundo'],
    fuente: 'Cal Newport — Deep Work',
  },
  {
    id: 'art-04',
    titulo: 'Inflación, expectativas y la trampa de la política monetaria',
    contenido: 'Una de las ideas más contraintuitivas en economía es que las expectativas de inflación son, en sí mismas, inflacionarias. Si los trabajadores esperan que los precios suban un 10%, pedirán aumentos de salario acordes. Si los empresarios esperan que los costos suban, adelantarán aumentos de precios. El resultado: la inflación se autocumple.\n\nEs por eso que los bancos centrales, como la Reserva Federal o el Banco Central Europeo, dedican tanto esfuerzo a la comunicación. No solo suben tasas para encarecer el crédito; también hablan para anclar las expectativas. La credibilidad del banco central es tan importante como sus herramientas.\n\nEn Argentina, donde las expectativas están desancladas hace décadas, este mecanismo se ve en toda su complejidad. La indexación salarial, los contratos en dólares y la dolarización de precios son, en parte, síntomas de un sistema de expectativas que aprendió a desconfiar de la moneda local.',
    tags: ['economía', 'macroeconomía', 'argentina', 'política monetaria'],
    fuente: 'Mishkin — The Economics of Money, Banking and Financial Markets',
  },
  {
    id: 'art-05',
    titulo: 'El efecto Dunning-Kruger: por qué los novatos creen que lo saben todo',
    contenido: 'En 1999, David Dunning y Justin Kruger publicaron un paper que describía algo que todos intuimos pero pocas veces nombramos: las personas incompetentes en una habilidad tienden a sobreestimar sistemáticamente su competencia. No porque sean arrogantes, sino porque carecen de la metacognición necesaria para ver sus propios errores.\n\nLo paradójico es que el conocimiento experto lleva a la humildad. Cuanto más sabés de un campo, más consciente sos de la vastedad de lo que no sabés. Los mejores científicos, artistas y estrategas tienden a hablar con más incertidumbre, no con menos.\n\nLa aplicación práctica es doble: en primero lugar, buscá activamente feedback externo sobre áreas donde te sentís muy seguro. En segundo lugar, tomá con escepticismo la confianza extrema, especialmente en quien recién empieza en un campo. La verdadera expertise a menudo viene disfrazada de duda.',
    tags: ['psicología', 'aprendizaje', 'metacognición', 'sesgos cognitivos'],
    fuente: 'Dunning & Kruger — Unskilled and Unaware of It (1999)',
  },
  {
    id: 'art-06',
    titulo: 'El entrenamiento de fuerza y la longevidad: lo que dice la ciencia',
    contenido: 'Durante décadas se asoció el envejecimiento con la pérdida inevitable de músculo. Hoy sabemos que gran parte de esa pérdida es opcional. La sarcopenia, la reducción de masa muscular con la edad, se puede ralentizar dramáticamente con entrenamiento de resistencia constante, incluso iniciado a los 60 o 70 años.\n\nPero los beneficios van más allá del aspecto físico. El músculo es un órgano metabólicamente activo: mejora la sensibilidad a la insulina, modula la inflamación sistémica y tiene efectos directos en la salud cerebral vía mioquinas, moléculas que el músculo libera durante el ejercicio y que cruzan la barrera hematoencefálica.\n\nEl investigador Peter Attia lo resume bien: si querés vivir bien a los 80, entrenás para eso hoy. El objetivo no es parecer atlético a los 30, sino ser funcional e independiente a los 85. Ese cambio de perspectiva transforma por qué y cómo entrenamos.',
    tags: ['fitness', 'salud', 'longevidad', 'entrenamiento de fuerza'],
    fuente: 'Peter Attia — Outlive',
  },
  {
    id: 'art-07',
    titulo: 'Heráclito y el río que nunca es el mismo',
    contenido: 'Heráclito de Éfeso, el filósofo griego del siglo V a.C. conocido como "el oscuro", dejó una frase que resuena a través de los siglos: "Nadie se baña dos veces en el mismo río". La idea es simple y profunda: todo fluye, todo cambia. El río no es el mismo porque el agua es distinta. Y tú tampoco sos el mismo porque sos parte del cambio.\n\nEsta visión del mundo como flujo permanente —el logos como principio ordenador del cambio— anticipó ideas que hoy reaparecen en termodinámica, biología y sistemas complejos. El universo no es una colección de cosas fijas sino de procesos en curso.\n\nPara la vida cotidiana, Heráclito ofrece una herramienta poderosa: aceptar el cambio como la condición, no como la excepción. La rigidez —en planes, en identidades, en certezas— es lo que rompe. La adaptabilidad es la única constancia que tiene sentido cultivar.',
    tags: ['filosofía', 'historia', 'filosofía antigua', 'cambio'],
    fuente: 'Heráclito — Fragmentos (edición Kirk y Raven)',
  },
  {
    id: 'art-08',
    titulo: 'Agentes de IA: de chatbots a sistemas que actúan en el mundo',
    contenido: 'El siguiente salto en inteligencia artificial no son modelos más grandes sino agentes más autónomos. Un agente de IA puede recibir un objetivo de alto nivel, descomponerlo en pasos, ejecutar cada uno usando herramientas —búsqueda web, código, APIs— y adaptar su plan en función de los resultados intermedios.\n\nEstas arquitecturas ya existen: AutoGPT, LangGraph, OpenAI Agents, y el ecosistema de MCP (Model Context Protocol) de Anthropic permiten construir flujos donde el modelo no solo responde preguntas sino que toma acciones reales en sistemas externos. La frontera entre software y AI se vuelve borrosa.\n\nLas implicaciones son enormes para la productividad individual y empresarial. Tareas que hoy requieren horas de trabajo humano —investigación, síntesis, generación de reportes, ejecución de workflows complejos— se pueden delegar a sistemas que trabajan en paralelo, sin pausa y a escala. La pregunta ya no es si esto va a pasar, sino cuán rápido.',
    tags: ['ia', 'agentes', 'tecnología', 'productividad'],
    fuente: 'Anthropic — Claude Agent SDK Documentation',
  },
  {
    id: 'art-09',
    titulo: 'La regla de las 2 horas de concentración profunda',
    contenido: 'Investigaciones sobre el rendimiento cognitivo sugieren que la mayoría de las personas no puede sostener trabajo verdaderamente profundo —el tipo que requiere toda la atención y produce los mejores resultados— por más de cuatro horas al día. Y muchos lo sobreestiman: en la práctica, dos horas de concentración real es lo que se puede sostener de forma consistente.\n\nEl error más común no es no tener tiempo para concentrarse. Es fragmentar ese tiempo en pedazos de 20 minutos entre notificaciones, mails y reuniones. El costo del cambio de contexto no es solo los minutos perdidos; es el tiempo que tarda el cerebro en volver al estado de flujo profundo, que puede ser entre 15 y 25 minutos.\n\nLa estrategia más efectiva es simple y difícil: proteger un bloque ininterrumpido de 90 a 120 minutos cada mañana para el trabajo más importante del día. Sin teléfono, sin correo, sin Slack. Todo lo demás —incluyendo reuniones— entra después de ese bloque.',
    tags: ['productividad', 'concentración', 'trabajo profundo', 'gestión del tiempo'],
    fuente: 'Anders Ericsson — Peak; Cal Newport — Deep Work',
  },
  {
    id: 'art-10',
    titulo: 'El mercado de capitales y el inversor promedio: por qué casi nadie le gana al índice',
    contenido: 'Uno de los datos más incómodos de las finanzas es que el 90% de los fondos de inversión activamente gestionados no logra superar al índice de referencia (como el S&P 500) en períodos de 15 o más años. Esto no es porque los gestores sean malos: es porque el mercado incorpora información muy rápidamente, y batirlo consistentemente requiere ventajas informativas que son ilegales o imposibles de mantener.\n\nJohn Bogle, el fundador de Vanguard, popularizó la solución: si no podés ganarle al mercado, sé el mercado. Los fondos indexados replican el índice completo con comisiones mínimas, y la evidencia muestra que a largo plazo superan a la mayoría de las alternativas activas por el simple efecto del costo compuesto.\n\nPara el inversor individual, la conclusión es liberadora: no necesitás análisis sofisticado ni seguir el mercado hora a hora. Una estrategia de inversión pasiva, diversificada y automatizada, sostenida durante décadas, supera estadísticamente a casi cualquier alternativa activa.',
    tags: ['economía', 'inversión', 'finanzas personales', 'mercados'],
    fuente: 'John Bogle — The Little Book of Common Sense Investing',
  },
  {
    id: 'art-11',
    titulo: 'La neurociencia del hábito: cómo el cerebro automatiza comportamientos',
    contenido: 'En el centro del cerebro hay una estructura llamada ganglio basal que juega un papel clave en la formación de hábitos. Cuando repetís un comportamiento lo suficiente en un contexto consistente, los ganglios basales empiezan a "chunkearlo": lo comprimen en una secuencia automática que requiere mucho menos energía cognitiva que la primera vez.\n\nEsto explica por qué los hábitos son tan difíciles de romper: no desaparecen del cerebro, quedan codificados. Lo que sí podés cambiar es la respuesta ante el disparador. El loop hábito (disparador → rutina → recompensa) permanece; pero podés intervenir en la rutina.\n\nCharles Duhigg y James Clear documentaron extensamente que la clave para instalar un nuevo hábito no es la motivación sino la fricción. Reducir la fricción para el hábito deseado (dejar las zapatillas listas, tener el libro en la mesita) y aumentarla para el indeseado es más efectivo que cualquier discurso motivacional.',
    tags: ['psicología', 'hábitos', 'neurociencia', 'comportamiento'],
    fuente: 'Charles Duhigg — El poder del hábito; James Clear — Atomic Habits',
  },
  {
    id: 'art-12',
    titulo: 'El método científico como herramienta de pensamiento cotidiano',
    contenido: 'El método científico no es solo para laboratorios. Es una forma de relacionarse con la incertidumbre que puede aplicarse a casi cualquier área de la vida. La idea central: formular una hipótesis, diseñar una prueba que podría refutarla, ejecutar esa prueba y actualizar las creencias según el resultado.\n\nKarl Popper lo formuló con claridad: una afirmación científica no es la que puede probarse verdadera, sino la que puede probarse falsa. La falsabilidad es el criterio. Cuando alguien hace una afirmación que no puede ser refutada por ningún dato posible, eso no es ciencia ni pensamiento riguroso: es dogma.\n\nEn la vida práctica, esto se traduce en una postura intelectual: "¿Qué evidencia me haría cambiar de opinión?" Si no tenés una respuesta a esa pregunta, es probable que estés creyendo algo por razones que no son epistémicas. Y eso vale para política, salud, negocios o cualquier dominio donde importa tener razón.',
    tags: ['ciencia', 'epistemología', 'pensamiento crítico', 'filosofía'],
    fuente: 'Karl Popper — La lógica de la investigación científica',
  },
  {
    id: 'art-13',
    titulo: 'El Imperio Romano y las lecciones de una caída que tardó 500 años',
    contenido: 'Edward Gibbon, en su monumental "Historia de la decadencia y caída del Imperio Romano", identificó múltiples causas de su colapso: la corrupción de las instituciones políticas, la degradación del ejército, las presiones externas de las migraciones, las crisis económicas y los conflictos internos. Lo notable es que ninguna causa fue sola suficiente.\n\nLo que los historiadores modernos han destacado es que Roma no cayó de golpe. Fue un proceso de siglos, con momentos de recuperación y decadencia, donde cada generación creía estar viviendo en un período de normalidad. La caída del Imperio fue gradual hasta que no lo fue más.\n\nLa lección no es pesimista sino práctica: los sistemas complejos rara vez colapsan por una sola causa. Y los indicadores de deterioro están disponibles mucho antes del colapso final, si uno sabe dónde mirar. Eso vale tanto para civilizaciones como para organizaciones, economías y vidas individuales.',
    tags: ['historia', 'historia antigua', 'sistemas complejos', 'geopolítica'],
    fuente: 'Edward Gibbon — The History of the Decline and Fall of the Roman Empire',
  },
  {
    id: 'art-14',
    titulo: 'La paradoja de la elección y el costo cognitivo de las opciones',
    contenido: 'Barry Schwartz documentó en "La paradoja de la elección" un fenómeno contraintuitivo: más opciones no producen más felicidad. Producen más parálisis, más arrepentimiento anticipado y, paradójicamente, menos satisfacción con la elección final. Esto se debe en parte a que cada opción elegida implica la renuncia a todas las demás.\n\nEl costo cognitivo de decidir es real y medible. Los jueces toman peores decisiones al final del día. Los consumidores compran menos cuando hay más opciones en la góndola. Los equipos creativos producen más cuando tienen restricciones que cuando tienen libertad total. Las restricciones paradójicamente liberan.\n\nLa solución práctica es diseñar sistemas que reduzcan las decisiones cotidianas. Steve Jobs usaba el mismo outfit todos los días. Obama limitaba las decisiones triviales para preservar energía mental. En productividad esto se llama "decidir por adelantado": elegir las reglas antes del juego, no durante.',
    tags: ['psicología', 'toma de decisiones', 'productividad', 'bienestar'],
    fuente: 'Barry Schwartz — La paradoja de la elección',
  },
  {
    id: 'art-15',
    titulo: 'La programación como pensamiento: por qué aprender a codificar cambia la mente',
    contenido: 'Aprender a programar no es principalmente aprender una sintaxis. Es aprender una forma de descomponer problemas: tomar algo grande y ambiguo, dividirlo en pasos precisos y ejecutables, y razonar sobre qué puede salir mal en cada uno. Es una forma de pensar que se transfiere a otros dominios.\n\nSeymour Papert, el pionero de la educación computacional del MIT, hablaba de "pensar con computadoras". La programación, bien enseñada, desarrolla depuración sistemática (debugging), pensamiento recursivo y la capacidad de abstraer patrones. Habilidades que tienen valor mucho más allá del código.\n\nHoy, con herramientas de IA que generan código, el valor de saber programar no desaparece: se transforma. No necesitás saber la sintaxis de memoria, pero sí entender qué estás pidiendo, por qué puede fallar, y cómo verificar que funciona. El pensamiento computacional se vuelve más necesario, no menos.',
    tags: ['tecnología', 'programación', 'aprendizaje', 'ia'],
    fuente: 'Seymour Papert — Mindstorms',
  },
  {
    id: 'art-16',
    titulo: 'Friedrich Nietzsche y el eterno retorno como herramienta de vida',
    contenido: 'Nietzsche propuso un experimento mental que llamó "el eterno retorno": imaginar que tu vida se va a repetir infinitas veces, exactamente igual, en cada detalle. ¿Cómo cambiaría eso tus decisiones actuales? ¿Elegirías esta vida de nuevo? ¿Y de nuevo, y de nuevo?\n\nNo se trata de una afirmación cosmológica sino de una herramienta ética. Si la perspectiva de repetir una elección infinitamente te resulta insoportable, quizás esa elección no es la tuya. Si podés decir sí sin vacilar, eso es lo que Nietzsche llamaría amor fati: amor al propio destino.\n\nLo que hace poderoso este marco es que evita el autoengaño. Es fácil justificar cualquier decisión presente con planes futuros vagos. El eterno retorno elimina ese escape: solo cuenta lo que hacés ahora, no lo que prometés hacer después.',
    tags: ['filosofía', 'nietzsche', 'ética', 'mentalidad'],
    fuente: 'Friedrich Nietzsche — Así habló Zaratustra',
  },
  {
    id: 'art-17',
    titulo: 'El sueño como herramienta de rendimiento: lo que 20 años de investigación muestran',
    contenido: 'Matthew Walker, neurocientífico de UC Berkeley, documentó con rigor algo que intuitivamente sabemos pero sistemáticamente ignoramos: el sueño no es tiempo muerto. Es cuando el cerebro consolida la memoria, elimina residuos metabólicos tóxicos (incluyendo beta-amiloide, asociado al Alzheimer) y regula el sistema emocional.\n\nLos estudios muestran que con seis horas de sueño durante diez días, el rendimiento cognitivo decae al nivel de dos noches sin dormir, pero las personas no lo perciben subjetivamente. El sueño insuficiente afecta el juicio sobre el propio estado, creando una falsa confianza.\n\nLas implicaciones prácticas son directas: dormir menos para trabajar más no es eficiente; es autosabotaje. Un atleta que duerme 10 horas mejora su tiempo de reacción, su precisión y su recuperación más que cualquier suplemento. Para trabajo cognitivo, el ROI del sueño supera al de cualquier hack de productividad.',
    tags: ['salud', 'sueño', 'neurociencia', 'rendimiento'],
    fuente: 'Matthew Walker — Por qué dormimos',
  },
  {
    id: 'art-18',
    titulo: 'La revolución industrial del software: cómo la IA cambia el trabajo del desarrollador',
    contenido: 'El código generado por IA ya supera el 30% de las contribuciones en algunas empresas de software. Este número va a subir. Pero la narrativa de "los programadores van a desaparecer" malinterpreta qué hace valioso a un desarrollador senior: no es la capacidad de recordar sintaxis, sino entender sistemas, arquitecturas, trade-offs y consecuencias.\n\nLo que la IA está haciendo es eliminar el trabajo de bajo valor —escribir código boilerplate, buscar en documentación, generar tests básicos— y amplificar el trabajo de alto valor: diseño de sistemas, decisiones de arquitectura, razonamiento sobre consecuencias. Los mejores ingenieros son más productivos que nunca.\n\nEl peligro real no es para los buenos desarrolladores, sino para los mediocres. La IA democratiza las habilidades de nivel medio y hace que el diferencial de calidad entre un desarrollador competente y uno excepcional sea más visible y valorado que antes.',
    tags: ['ia', 'tecnología', 'programación', 'futuro del trabajo'],
    fuente: 'GitHub Copilot Impact Research 2024',
  },
  {
    id: 'art-19',
    titulo: 'La historia de la escritura y cómo transformó la mente humana',
    contenido: 'La escritura tiene aproximadamente 5.000 años, surgiendo independientemente en Mesopotamia, China y Mesoamérica. No fue inventada para literatura ni historia: fue creada por contadores, para registrar transacciones comerciales. Los primeros textos cuneiformes son listas de bienes y deudas.\n\nLo que la escritura hizo no fue solo permitir almacenar información fuera del cerebro. Transformó el pensamiento mismo. Walter Ong argumentó que la escritura hace posible pensar en nuevas formas: permite revisar lo dicho, estructurar argumentos lineales, crear ficciones complejas y razonar sobre razonamiento. La filosofía griega fue posible gracias a la escritura alfabética.\n\nHoy estamos al comienzo de otra transición cognitiva, con la IA como sistema de externalización del pensamiento. Así como la escritura cambió qué podía pensar la mente humana, la IA puede cambiar otra vez los límites de lo pensable. La pregunta es: ¿en qué dirección?',
    tags: ['historia', 'cognición', 'escritura', 'filosofía'],
    fuente: 'Walter Ong — Oralidad y escritura; Jack Goody — La domesticación del pensamiento salvaje',
  },
  {
    id: 'art-20',
    titulo: 'Por qué el VO2 máximo predice la longevidad mejor que casi cualquier otro marcador',
    contenido: 'El VO2 máximo, la medida de cuánto oxígeno puede procesar tu cuerpo durante el ejercicio máximo, resulta ser uno de los predictores más robustos de mortalidad a largo plazo. Estudios con cientos de miles de sujetos muestran que pasar del cuartil inferior al superior de VO2 máximo reduce el riesgo de muerte por todas las causas en más del 40%.\n\nNo se trata solo de salud cardiovascular. Un VO2 máximo alto está correlacionado con mejor función cognitiva en la vejez, menor riesgo de demencia y mejor resiliencia metabólica. El corazón y el cerebro se conectan profundamente a través de la capacidad aeróbica.\n\nLa buena noticia es que el VO2 máximo es muy entrenable, incluyendo en personas mayores. El entrenamiento por intervalos de alta intensidad (HIIT) es el más eficiente para mejorarlo, pero incluso el cardio moderado consistente produce mejoras significativas. Si solo pudieras hacer una cosa por tu salud a largo plazo, mejorar tu capacidad aeróbica es una apuesta muy sólida.',
    tags: ['fitness', 'salud', 'longevidad', 'entrenamiento'],
    fuente: 'Peter Attia — Outlive; JAMA Network Open 2022',
  },
  {
    id: 'art-21',
    titulo: 'Adam Smith y la mano invisible: lo que la gente entiende mal',
    contenido: 'Adam Smith acuñó el concepto de la "mano invisible" en La riqueza de las naciones para describir cómo el interés propio de los individuos puede, bajo ciertas condiciones, producir resultados benéficos para la sociedad. Lo que se olvida es que Smith era también el autor de "La teoría de los sentimientos morales", donde argumentaba que la empatía y los vínculos sociales son la base de cualquier sociedad funcional.\n\nSm no era el apóstol del mercado desregulado que los libertarios invocan. Fue explícitamente crítico del poder monopólico, de los acuerdos de precios entre empresarios y de los efectos sociales de la división del trabajo llevada al extremo. Su pensamiento era más matizado que el eslogan que se heredó.\n\nLa lección relevante: leer a los pensadores originales en lugar de sus versiones simplificadas. El mapa conceptual que muchos tienen de Smith, Keynes o Marx está más basado en caricaturas que en los textos. Las ideas complejas se empobrecen al comprimirse.',
    tags: ['economía', 'historia económica', 'pensamiento crítico', 'filosofía'],
    fuente: 'Adam Smith — La riqueza de las naciones; La teoría de los sentimientos morales',
  },
  {
    id: 'art-22',
    titulo: 'Espartanos, disciplina y el mito de la autarquía',
    contenido: 'Esparta es el modelo que cita quien quiere hablar de disciplina, austeridad y fortaleza. Lo que el mito omite: la sociedad espartana dependía completamente de una población esclavizada —los ilotas— que los superaba en número seis a uno. La "libertad" espartana fue construida sobre una de las formas más brutales de esclavitud del mundo antiguo.\n\nEl sistema educativo espartano, el agoge, producía soldados extraordinarios. También producía una sociedad que no generó filosofía, arte, literatura, ciencia ni comercio significativos. Atenas, con todo su caos democrático, produjo el legado intelectual que todavía vivimos.\n\nLa lección histórica no es que la disciplina es mala, sino que la disciplina sin diversidad de objetivos produce un tipo muy estrecho de excelencia. El equilibrio entre rigor y apertura es lo que genera civilizaciones sostenibles, no el maximalismo de un solo valor.',
    tags: ['historia', 'historia antigua', 'filosofía', 'liderazgo'],
    fuente: 'Paul Cartledge — The Spartans',
  },
  {
    id: 'art-23',
    titulo: 'Flow: la psicología del estado óptimo de experiencia',
    contenido: 'Mihaly Csikszentmihalyi estudió durante décadas qué hace que las actividades humanas se sientan significativas. Su hallazgo central: las experiencias más positivas ocurren cuando el nivel de desafío de una tarea está calibrado al nivel de habilidad de la persona. Ni tan fácil que aburra, ni tan difícil que genere ansiedad.\n\nA ese estado lo llamó "flow" o experiencia óptima: completa absorción en la tarea, pérdida de la noción del tiempo, ausencia de consciencia del yo, y una sensación de control y competencia. Los videojuegos están diseñados para inducirlo constantemente; los sistemas de XP y niveles son mecanismos de calibración de desafío.\n\nPara inducir flow en trabajo y estudio: definir objetivos claros, eliminar distracciones, asegurarse de que la tarea esté en el rango de dificultad correcto y comprometerse completamente. La gamificación de hábitos no es trivial: responde a principios psicológicos profundos sobre qué hace significativa la experiencia.',
    tags: ['psicología', 'flow', 'motivación', 'productividad'],
    fuente: 'Mihaly Csikszentmihalyi — Flow: The Psychology of Optimal Experience',
  },
  {
    id: 'art-24',
    titulo: 'Cómo los sesgos cognitivos afectan las decisiones de inversión',
    contenido: 'Daniel Kahneman documentó que los inversores individuales cometen sistemáticamente los mismos errores. El sesgo de disponibilidad les hace sobreponderar eventos recientes. El sesgo de confirmación los lleva a buscar información que corrobora sus posiciones. La aversión a las pérdidas los hace mantener posiciones perdedoras más tiempo del racional y vender ganadores demasiado pronto.\n\nEl resultado es el "equity premium puzzle" amplificado: los inversores activos tienden a rendir significativamente por debajo del mercado incluso cuando el mercado en sí rinde bien. La causa principal no es mala información sino psicología mal calibrada.\n\nLa solución de diseño es automática: reglas que operan sin intervención emocional en cada decisión. Dollar-cost averaging (invertir una suma fija en intervalos regulares), límites predefinidos de pérdida, y portfolios que no requieren rebalanceo frecuente son herramientas que protegen al inversor de su propio cerebro.',
    tags: ['economía', 'finanzas personales', 'psicología', 'sesgos cognitivos'],
    fuente: 'Daniel Kahneman — Pensar rápido, pensar despacio',
  },
  {
    id: 'art-25',
    titulo: 'Cuánto afecta realmente la nutrición al rendimiento cognitivo',
    contenido: 'El cerebro consume aproximadamente el 20% del gasto energético total del cuerpo, a pesar de representar solo el 2% del peso. La glucosa es su combustible primario, pero la calidad y estabilidad de ese suministro importa tanto como la cantidad. Los picos y caídas glucémicas producen variaciones en la atención y la toma de decisiones que son medibles.\n\nLos ácidos grasos omega-3, especialmente el DHA, son constituyentes estructurales de las membranas neuronales. La deficiencia de omega-3 se asocia con mayor riesgo de depresión, deterioro cognitivo y déficits de atención. Los países con mayor consumo de pescado muestran consistentemente mejores marcadores de salud mental en estudios epidemiológicos.\n\nLa creatina, conocida como suplemento de gym, tiene efectos cognitivos documentados: mejora el rendimiento en tareas que requieren memoria de trabajo y velocidad de procesamiento, especialmente bajo condiciones de privación de sueño o alta demanda cognitiva. El cerebro usa fosfocreatina como sistema de reserva energética.',
    tags: ['salud', 'nutrición', 'rendimiento', 'neurociencia'],
    fuente: 'Huberman Lab — Nutrition & Brain Performance; Gomez-Pinilla 2008',
  },
  {
    id: 'art-26',
    titulo: 'La revolución de Copérnico: por qué cambiar el marco lo cambia todo',
    contenido: 'En 1543, Nicolás Copérnico publicó "De revolutionibus orbium coelestium" proponiendo un modelo heliocéntrico del sistema solar. No fue la primera vez que alguien sugirió que la Tierra giraba alrededor del Sol; Aristarco lo había propuesto en el siglo III a.C. Lo que hizo Copérnico fue construir un modelo matemático completo y funcional.\n\nLo revolucionario no fue el dato sino el marco. El geocentrismo no era solo una teoría astronómica; era una metáfora del orden cósmico, con el ser humano en el centro. El heliocentrismo descentró a la humanidad del universo y abrió la puerta al método científico moderno. Kant llamó a su propia revolución filosófica la "revolución copernicana" porque reconocía un cambio de perspectiva del mismo orden.\n\nLa lección aplicada: los cambios de marco cognitivo son más transformadores que los nuevos datos dentro del mismo marco. Antes de buscar más información, preguntate si el marco desde donde analizás un problema es el correcto.',
    tags: ['ciencia', 'historia de la ciencia', 'epistemología', 'pensamiento crítico'],
    fuente: 'Thomas Kuhn — La estructura de las revoluciones científicas',
  },
  {
    id: 'art-27',
    titulo: 'Victor Frankl y la búsqueda de sentido en la adversidad',
    contenido: 'Victor Frankl sobrevivió cuatro campos de concentración nazis, incluyendo Auschwitz. Su obra "El hombre en busca de sentido" nació de esa experiencia. La tesis central: los seres humanos pueden soportar casi cualquier "cómo" si encuentran un "por qué". El sentido no elimina el sufrimiento, pero lo transforma en algo tolerable.\n\nFrankl desarrolló la logoterapia: una corriente psicológica centrada en la voluntad de sentido. A diferencia del freudismo (que ponía el placer como motivación central) o del adlerismo (el poder), Frankl argumentaba que la búsqueda de significado es la fuerza motivacional primaria del ser humano.\n\nLo que resulta más práctico de su obra es la distinción entre sufrimiento inevitable y sufrimiento elegido. No todo el dolor puede evitarse. Pero la actitud hacia ese dolor es, en última instancia, una elección. Frankl no lo plantea como optimismo fácil sino como la última libertad que nadie puede quitarte.',
    tags: ['psicología', 'filosofía', 'resiliencia', 'mentalidad'],
    fuente: 'Viktor Frankl — El hombre en busca de sentido',
  },
  {
    id: 'art-28',
    titulo: 'La Revolución Francesa y los peligros de los absolutos ideológicos',
    contenido: 'La Revolución Francesa comenzó con los ideales más elevados de la Ilustración: libertad, igualdad, fraternidad. Terminó con el Terror, miles de guillotinados y Napoleón. La trayectoria de la revolución es uno de los estudios de caso más analizados en ciencia política sobre cómo los movimientos idealmente motivados pueden derivar en autoritarismo.\n\nEdmund Burke, el primer gran pensador conservador moderno, advirtió desde el principio: las instituciones evolucionadas tienen una sabiduría implícita que los planes racionales a priori no pueden capturar. Destruir lo existente para construir lo perfecto desde cero es más arriesgado de lo que parece, porque los imprevistos son inevitables y la complejidad social no se domina con voluntad.\n\nNo es un argumento contra el cambio: es un argumento por la humildad epistémica en el cambio. Las transformaciones sostenibles suelen ser graduales y preservan más de lo que destruyen. Las que intentan reconstruir la sociedad desde cero tienden a devorar a sus propios hijos.',
    tags: ['historia', 'política', 'filosofía', 'ciencias sociales'],
    fuente: 'Edmund Burke — Reflexiones sobre la revolución en Francia; Simon Schama — Citizens',
  },
  {
    id: 'art-29',
    titulo: 'Intervalos vs. cardio continuo: qué dice la evidencia',
    contenido: 'El entrenamiento por intervalos de alta intensidad (HIIT) se volvió popular por una razón válida: produce adaptaciones similares al cardio continuo en mucho menos tiempo. Cuatro minutos de intervalos 4x4 (4 minutos al 90% + 3 de recuperación activa, repetido 4 veces) producen mejoras de VO2 máximo comparables a 45 minutos de cardio moderado.\n\nPero el cardio de zona 2 —donde podés mantener una conversación pero no cantar— tiene beneficios distintos que los intervalos no replican completamente. La zona 2 optimiza la función mitocondrial, la capacidad de oxidar grasas y la eficiencia cardíaca de base. Los mejores atletas de resistencia pasan el 80% de su tiempo en zona 2 y solo el 20% en alta intensidad.\n\nLa estrategia óptima para la mayoría: 2-3 sesiones de zona 2 de 40-60 minutos por semana como base, más 1-2 sesiones de HIIT. El HIIT sin base aeróbica suficiente tiene rendimientos decrecientes y mayor riesgo de lesión. La base importa.',
    tags: ['fitness', 'entrenamiento', 'salud', 'cardio'],
    fuente: 'Seiler & Tønnessen — Intervals, Thresholds, and Long Slow Distance; Peter Attia — Outlive',
  },
  {
    id: 'art-30',
    titulo: 'El Renacimiento como lección sobre cómo florecen las ideas',
    contenido: 'El Renacimiento italiano no surgió de la nada. Fue el resultado de condiciones específicas: el mecenazgo de los Medici que financiaba artistas e intelectuales, la confluencia de saberes que llegaron con los refugiados del Imperio Bizantino caído, la invención de la imprenta que multiplicó la circulación de ideas, y ciudades-estado con suficiente autonomía para tolerar la experimentación.\n\nLeonardo da Vinci es el símbolo de esa era: científico, artista, ingeniero, filósofo. Su amplitud no era una rareza de genio sobrehumano; era un producto de su ambiente. En Florencia, cruzar disciplinas era valorado, no sancionado. La síntesis entre arte y ciencia era un signo de sofisticación, no de distracción.\n\nEl Renacimiento sugiere que las condiciones materiales y culturales de una época importan tanto como los individuos que produce. Los genios no surgen en el vacío: necesitan patronos, pares, herramientas y libertad. Crear el ambiente correcto es tan importante como encontrar las personas correctas.',
    tags: ['historia', 'historia del arte', 'creatividad', 'ciencia'],
    fuente: 'Giorgio Vasari — Las vidas de los artistas; Walter Isaacson — Leonardo da Vinci',
  },
  {
    id: 'art-31',
    titulo: 'Por qué los videojuegos son el medio más complejo del siglo XXI',
    contenido: 'Los videojuegos combinan lo que ningún otro medio puede: narrativa, música, arte visual, mecánicas sistémicas y agencia del jugador, todo simultáneamente. Un juego como Dark Souls no solo te cuenta una historia de decadencia y perseverancia; te hace experimentarla a través del gameplay. Cada muerte es narrativa encarnada.\n\nLos diseñadores de juegos trabajan con sistemas de feedback que los psicólogos envidian. La curva de dificultad ideal —los psicólogos la llaman "flow" de Csikszentmihalyi— está incorporada en el diseño cuando funciona bien: lo suficientemente desafiante para no aburrirte, lo suficientemente asequible para no frustrarte.\n\nLa crítica de que los videojuegos son escapismo barato ignora que la literatura también lo es. Lo que importa es qué valores transmite el medio, qué experiencias construye y qué habilidades desarrolla. Los mejores juegos enseñan pensamiento sistémico, tolerancia al fracaso, perseverancia y toma de decisiones bajo presión. No está mal para el "entretenimiento".',
    tags: ['gaming', 'entretenimiento', 'diseño', 'psicología', 'cultura'],
    fuente: 'Mihaly Csikszentmihalyi — Flow; Raph Koster — A Theory of Fun for Game Design',
  },
  {
    id: 'art-32',
    titulo: 'El universo observable: qué sabemos y qué probablemente nunca sabremos',
    contenido: 'El universo observable tiene un diámetro de unos 93.000 millones de años luz. "Observable" es la clave: es lo que podemos ver dado que la luz ha tenido 13.800 millones de años para llegar a nosotros. Pero el universo total podría ser infinitamente más grande — quizás infinito.\n\nLas estrellas que observamos hoy no muestran cómo son ahora; muestran cómo eran cuando emitieron esa luz. El sol que vemos tiene 8 minutos de retraso. Andrómeda tiene 2,5 millones de años de retraso. Miramos el universo como un arqueólogo que solo puede estudiar registros fósiles, nunca el presente.\n\nLo que es aún más perturbador: el 95% del universo es materia y energía oscura, que no interactúan con la luz. Las detectamos solo por sus efectos gravitacionales. En términos de lo que podemos percibir directamente, somos ciegos al 95% de lo que existe. La humildad científica no es una actitud: es la respuesta correcta a los hechos.',
    tags: ['astronomía', 'ciencia', 'física', 'cosmología'],
    fuente: 'Carl Sagan — El mundo y sus demonios; Neil deGrasse Tyson — Astrophysics for People in a Hurry',
  },
  {
    id: 'art-33',
    titulo: 'La música como lenguaje universal: mito y realidad',
    contenido: 'La idea de que la música es un lenguaje universal es poderosa pero parcialmente incorrecta. Hay elementos que parecen transculturales: el ritmo, la respuesta emocional básica a ciertos intervalos armónicos, la función de la música en rituales y celebraciones. Pero la gramática musical —qué secuencias suenan "resueltas", qué escalas generan qué emociones— varía enormemente entre culturas.\n\nLo que sí es universal es la función: todas las culturas conocidas usan la música para marcar transiciones (nacimientos, muertes, matrimonios), coordinar esfuerzo colectivo (canciones de trabajo) y regular el estado emocional. La música es tecnología social antigua, anterior a la escritura por decenas de miles de años.\n\nLo interesante de la teoría de la evolución musical es que la música pudo haber precedido al lenguaje articulado. Darwin especuló que los ancestros humanos podían cantar antes de hablar. Si es así, nuestro cerebro musical es más antiguo que nuestro cerebro lingüístico — lo que explica por qué la música llega a lugares donde las palabras no alcanzan.',
    tags: ['música', 'cultura', 'neurociencia', 'evolución', 'psicología'],
    fuente: 'Daniel Levitin — This Is Your Brain on Music; Robin Dunbar — Friends',
  },
  {
    id: 'art-34',
    titulo: 'Evolución como algoritmo: por qué la selección natural es tan poderosa',
    contenido: 'La evolución por selección natural es uno de los algoritmos más poderosos que existen. No tiene objetivo, no tiene diseñador y no anticipa el futuro, pero produce soluciones de una complejidad y elegancia que los ingenieros humanos difícilmente alcanzan. El ojo humano, el sonar del murciélago, la navegación de las aves migratorias: todos surgieron sin intención.\n\nEl secreto del algoritmo es simple: variación aleatoria + selección no aleatoria + tiempo = adaptación acumulativa. Lo que hace poderosa a la selección natural no es la aleatoriedad de las mutaciones sino la no-aleatoriedad de la selección: los organismos que sobreviven y se reproducen más pasan sus genes. Es un filtro ciego pero eficientísimo.\n\nRichard Dawkins propuso que el gen, no el organismo, es la unidad de selección. Los organismos son "máquinas de supervivencia" que los genes construyen para propagarse. Esta inversión de perspectiva explica comportamientos que parecen paradójicos desde la perspectiva del individuo, como el altruismo entre parientes (ayudar a un hermano es ayudar al 50% de tus genes).',
    tags: ['evolución', 'biología', 'ciencia', 'genética'],
    fuente: 'Richard Dawkins — El gen egoísta; Charles Darwin — El origen de las especies',
  },
  {
    id: 'art-35',
    titulo: 'Arte contemporáneo: por qué parece difícil y cómo aproximarse',
    contenido: 'Una queja frecuente sobre el arte contemporáneo es "yo podría haberlo hecho". La respuesta honesta es: sí, físicamente muchas veces podrías. Pero no se te ocurrió. El arte conceptual se desplazó del "cómo" al "qué": la idea, el contexto, la pregunta son la obra. El objeto físico es solo el vehículo.\n\nLa incomodidad ante el arte contemporáneo suele venir de una expectativa de belleza o habilidad técnica que el arte moderno deliberadamente abandonó. El movimiento comenzó con Duchamp: en 1917 presentó un urinario como escultura ("Fountain"). La provocación fue el punto. ¿Qué convierte un objeto en arte? ¿La institución que lo valida? ¿La intención del artista? ¿Tu experiencia al verlo?\n\nUna estrategia para acercarse: antes de evaluar si te gusta, preguntá qué pregunta está haciendo la obra. No tiene que responderte; solo tiene que interesarte la pregunta. Desde ahí, la incomodidad puede convertirse en curiosidad.',
    tags: ['arte', 'cultura', 'filosofía', 'creatividad'],
    fuente: 'Arthur Danto — La transfiguración del lugar común; Alain de Botton — Art as Therapy',
  },
  {
    id: 'art-36',
    titulo: 'Meditación de atención plena: qué dice realmente la neurociencia',
    contenido: 'La meditación mindfulness tiene tanto hype que vale la pena ir a la evidencia. Lo que está bien respaldado: reduce el estrés percibido y los síntomas de ansiedad leve a moderada, comparable a fármacos en algunos estudios. Mejora la regulación emocional, específicamente la capacidad de no reaccionar automáticamente ante estímulos negativos. Aumenta la densidad de materia gris en la corteza prefrontal y reduce el volumen de la amígdala con práctica sostenida.\n\nLo que está exagerado: no es una panacea. La depresión severa, el trastorno de pánico o el PTSD necesitan tratamientos específicos; el mindfulness como adjunto puede ayudar, pero no reemplaza. Y los efectos dependen mucho de la calidad de la práctica: meditación informal de 2 minutos vs. retiros de 10 días son experiencias muy distintas.\n\nLa forma más directa de empezar: 10 minutos diarios de atención a la respiración, sin app, sin guía. Solo sentarse, cerrar los ojos y cuando la mente divague (va a divagar), volver. La práctica no es dejar de pensar; es notar que pensaste y volver. Esa vuelta repetida es el ejercicio.',
    tags: ['meditación', 'salud mental', 'neurociencia', 'hábitos', 'bienestar'],
    fuente: 'Jon Kabat-Zinn — Full Catastrophe Living; Harris — Waking Up',
  },
  {
    id: 'art-37',
    titulo: 'La democracia liberal y sus amenazas contemporáneas',
    contenido: 'La democracia liberal no es el estado natural de las sociedades humanas. Es un invento reciente, frágil, que requiere instituciones específicas para sobrevivir: estado de derecho independiente del poder político, libertad de prensa, elecciones competitivas, protecciones de minorías. Cuando alguno de esos componentes falla, el sistema se degrada.\n\nLo que los politólogos llaman "erosión democrática" es diferente a los golpes de Estado clásicos. Los regímenes que se vuelven autoritarios en el siglo XXI raramente llegan al poder con tanques. Llegan por elecciones democráticas, luego debilitan gradualmente las instituciones de control: cooptan cortes, capturan medios, cambian reglas electorales. Es legal pero no democrático.\n\nLa defensa de la democracia requiere que los ciudadanos valoren el sistema no solo cuando gana "su" candidato. Es fácil ser demócrata cuando el resultado te favorece. La prueba real es aceptar la derrota y confiar en el proceso. Esa confianza, cuando se erosiona, es muy difícil de reconstruir.',
    tags: ['democracia', 'política', 'ciencias sociales', 'historia'],
    fuente: 'Steven Levitsky & Daniel Ziblatt — Cómo mueren las democracias; Timothy Snyder — Sobre la tiranía',
  },
  {
    id: 'art-38',
    titulo: 'La belleza matemática: por qué los matemáticos hablan de elegancia',
    contenido: 'Los matemáticos usan la palabra "elegante" con una frecuencia que confunde a los de afuera. Una demostración elegante no es solo correcta; es inevitablemente correcta. Cada paso sigue del anterior de forma que parece la única posibilidad. Cuando Euclides demostró que hay infinitos números primos en cinco líneas, no produjo solo un resultado: produjo una pieza de pensamiento puro que no ha necesitado corrección en 2.300 años.\n\nLa ecuación de Euler, e^(iπ) + 1 = 0, es considerada la más bella de las matemáticas porque conecta cinco constantes fundamentales (e, i, π, 1, 0) de forma completamente inesperada. No fue diseñada para ser bella; emergió de la estructura de las matemáticas. La belleza fue un descubrimiento, no una creación.\n\nHardy argumentó que las matemáticas son descubrimiento, no invención: los matemáticos exploran un territorio que existe independientemente de ellos. Si es así, la belleza matemática es la textura de ese territorio: hay rutas elegantes y rutas tortuosas hacia la misma verdad, y los matemáticos desarrollan el gusto para distinguirlas.',
    tags: ['matemáticas', 'filosofía', 'ciencia', 'lógica'],
    fuente: 'G.H. Hardy — A Mathematician\'s Apology; Paul Lockhart — A Mathematician\'s Lament',
  },
  {
    id: 'art-39',
    titulo: 'Arquitectura como filosofía materializada',
    contenido: 'Los edificios no son solo contenedores. Son ideas materializadas sobre cómo los humanos deben relacionarse entre sí, con la naturaleza y con el tiempo. La catedral gótica comunicaba la grandeza divina a través de la escala y la luz. El Bauhaus comunicaba que la distinción entre arte y producción industrial era artificial. El Pompidou expuso sus estructuras al exterior porque su arquitectura argumentaba que la funcionalidad no debía ocultarse.\n\nLa arquitectura brutalista —hormigón masivo, formas geométricas duras— fue pensada como democrática: materiales baratos para edificios públicos accesibles. Hoy muchos de esos edificios son amados y detestados en igual medida. El problema no fue la ideología sino que el hormigón expuesto envejece mal en climas húmedos: la filosofía era noble, la materialidad falló.\n\nLo que distingue a la gran arquitectura de la funcional: la gran arquitectura cambia cómo te sentís en el espacio. El Panteón en Roma, con su óculo abierto al cielo, produce una experiencia casi religiosa aunque sea solo estructura y piedra. El espacio tiene poder emocional, y los arquitectos son los que lo diseñan.',
    tags: ['arquitectura', 'arte', 'filosofía', 'diseño', 'historia'],
    fuente: 'Alain de Botton — La arquitectura de la felicidad; Le Corbusier — Hacia una arquitectura',
  },
  {
    id: 'art-40',
    titulo: 'Naturaleza y salud mental: la evidencia de los espacios verdes',
    contenido: 'Los estudios sobre exposición a la naturaleza y salud mental son sorprendentemente consistentes. Pasar 20 minutos en un parque reduce el cortisol significativamente. Caminar en bosques (los japoneses llaman "shinrin-yoku" o baño de bosque) baja la presión arterial, el ritmo cardíaco y los marcadores de estrés de forma medible. Las ciudades con más espacios verdes per cápita tienen menores tasas de depresión ajustadas por ingreso.\n\nLos mecanismos propuestos son varios: la teoría de la restauración de la atención argumenta que la naturaleza exige "atención fascinada" involuntaria —watching a pájaro— que descansa la atención dirigida que usamos en el trabajo. Otros proponen que los fitoncidas (compuestos orgánicos que liberan los árboles) tienen efectos directos sobre el sistema inmune y el ánimo.\n\nLo práctico: si vivís en ciudad, priorizar parques y zonas arboladas en tus rutas cotidianas produce beneficios mesurables. No es romanticismo pastoral; es higiene mental respaldada por datos. El contacto regular con naturaleza no es lujo: es necesidad biológica que la urbanización moderna ha dificultado.',
    tags: ['naturaleza', 'salud mental', 'bienestar', 'ciencia', 'psicología'],
    fuente: 'Florence Williams — The Nature Fix; E.O. Wilson — Biophilia',
  },
  {
    id: 'art-41',
    titulo: 'La fotografía como forma de ver: más allá del botón',
    contenido: 'Hacer una foto buena no es apretar un botón; es elegir qué incluir y qué excluir del encuadre. Esa decisión —el frame— es el pensamiento visual. Cartier-Bresson llamó al "momento decisivo" al instante en que la composición, el movimiento y el significado convergen. No es suerte; es anticipación entrenada.\n\nSontag argumentó que la fotografía masificó la recolección de imágenes pero también banalizó la experiencia: cuando todo se convierte en fotografía potencial, se deja de vivir para registrar. La pregunta "¿me saco una foto aquí?" interrumpe la presencia. La fotografía como práctica consciente es lo contrario: requiere atención total al momento para capturarlo.\n\nLo que distingue al fotógrafo del que "saca fotos": la intención. ¿Qué querés decir con esta imagen? ¿Qué sentís tú ante esto que querés transmitir? Cuando tenés respuesta a esas preguntas, la técnica —apertura, velocidad, composición— se convierte en herramienta para un fin, no en fin en sí misma.',
    tags: ['fotografía', 'arte', 'creatividad', 'cultura', 'percepción'],
    fuente: 'Susan Sontag — Sobre la fotografía; Henri Cartier-Bresson — The Decisive Moment',
  },
  {
    id: 'art-42',
    titulo: 'Relaciones interpersonales: lo que la psicología sabe sobre conexión',
    contenido: 'El Estudio de Desarrollo Adulto de Harvard siguió a cientos de personas durante más de 80 años para entender qué produce vidas buenas. Resultado más robusto: la calidad de las relaciones interpersonales es el predictor más fuerte de felicidad, salud física y longevidad. Más que ingresos, más que fama, más que logros profesionales.\n\nLo que distingue relaciones que nutren de las que drenan no es la ausencia de conflictos. Gottman, el investigador de parejas, puede predecir el divorcio con alta precisión observando cómo las parejas manejan el desacuerdo. El predictor más fuerte de ruptura no es el conflicto en sí sino la presencia de cuatro patrones: crítica al carácter del otro (no al comportamiento), desprecio, actitud defensiva y stonewalling (cerrarse). Las relaciones que duran tienen estos patrones bajo control.\n\nLa amistad profunda se construye con tiempo acumulado, vulnerabilidad recíproca y presencia repetida. No es un logro; es una práctica. La tecnología facilita el contacto superficial a escala pero no reemplaza lo que construyen dos personas sentadas frente a frente sin distracción.',
    tags: ['relaciones', 'psicología', 'bienestar', 'ciencias sociales'],
    fuente: 'Robert Waldinger — The Good Life; John Gottman — The Seven Principles for Making Marriage Work',
  },
  {
    id: 'art-43',
    titulo: 'Deporte como laboratorio de presión: lecciones de los atletas de élite',
    contenido: 'Los atletas de élite son los sujetos de estudio más visibles de la psicología del rendimiento. Sus fracasos y triunfos ocurren en público, bajo presión extrema, y dejan datos claros sobre qué funciona. Una observación consistente: el rendimiento máximo no viene del pensamiento consciente sino de su suspensión.\n\nEl "análisis paralítico" —overthinking en el momento de la ejecución— es el enemigo del alto rendimiento. Los golfistas que analizan su swing consciente mientras golpean empeoran. Los basquetbolistas que "piensan" los tiros libres los fallan más. La maestría se construye practicando hasta que los movimientos son automáticos; luego la mente consciente tiene que hacerse a un lado.\n\nLa psicología del deporte moderna trabaja mucho con "rutinas de pre-rendimiento": secuencias ritualizadas que llevan la mente a un estado de activación óptima. No son superstición; son tecnología de la atención. El ritual desconecta de pensamientos ajenos y ancla en el presente. Lo que hace Michael Jordan antes de tirar o Federer antes de sacar cumple esa función: no es magia, es preparación mental sistematizada.',
    tags: ['deporte', 'psicología', 'rendimiento', 'hábitos', 'salud'],
    fuente: 'Tim Gallwey — The Inner Game of Tennis; Matthew Syed — Bounce',
  },
  {
    id: 'art-44',
    titulo: 'Cripto más allá de la especulación: qué resuelve y qué no',
    contenido: 'Las criptomonedas generan dos grupos igualmente irracionales: los creyentes que ven en Bitcoin la salvación financiera y los escépticos que ven solo fraude. La realidad técnica es más interesante y más modesta que ambos extremos.\n\nLo que Bitcoin genuinamente resuelve: el problema del doble gasto en transacciones digitales sin autoridad central. Antes de Satoshi, no había forma de enviar valor digital sin confiar en un intermediario. La blockchain es una solución elegante a ese problema de teoría de juegos. También es útil para transferencias internacionales donde los sistemas bancarios tradicionales son lentos y caros, especialmente para personas sin acceso a servicios financieros formales.\n\nLo que no resuelve bien: ser reserva de valor estable (la volatilidad lo hace impracticable como moneda), escalar a transacciones de consumo masivo (el throughput de Bitcoin es irrisorio comparado con Visa), o ser un sistema inherentemente descentralizado (la minería está altamente concentrada). El caso de uso más sólido sigue siendo transferencia de valor transfronteriza y hedge especulativo, no el reemplazo del sistema financiero global.',
    tags: ['cripto', 'tecnología', 'economía', 'finanzas', 'blockchain'],
    fuente: 'Satoshi Nakamoto — Bitcoin Whitepaper; Saifedean Ammous — The Bitcoin Standard',
  },
  {
    id: 'art-45',
    titulo: 'La paradoja del tiempo libre: por qué el ocio no se disfruta solo',
    contenido: 'Las encuestas de bienestar muestran algo contraintuitivo: las personas reportan mayor satisfacción durante actividades estructuradas —trabajo, deportes, hobbies— que durante tiempo libre no estructurado. El aburrimiento, la procrastinación y la rumiación tienden a llenar el vacío del tiempo sin forma. El "disfrute puro" que imaginamos al soñar con vacaciones infinitas rara vez se materializa.\n\nCsikszentmihalyi encontró que el flow —el estado de absorción total y satisfacción— ocurre más frecuentemente en el trabajo que en el tiempo libre, a pesar de que los mismos sujetos decían preferir tener más tiempo libre. La paradoja es que el flow requiere desafío y habilidad en equilibrio, y el trabajo provee ese equilibrio estructuralmente mientras que el tiempo libre exige que el individuo lo construya por sí mismo.\n\nImplicación práctica: el tiempo libre bien disfrutado necesita estructura elegida. No hace falta que sea productiva; puede ser completamente lúdica. Pero "ver lo que hay en Netflix" generalmente produce menos satisfacción que elegir una película específica, preparar palomitas y verla con alguien. La intención y la estructura importan incluso en el juego.',
    tags: ['psicología', 'productividad', 'bienestar', 'filosofía', 'hábitos'],
    fuente: 'Mihaly Csikszentmihalyi — Flow; Bertrand Russell — El elogio de la ociosidad',
  },
  {
    id: 'art-46',
    titulo: 'La economía argentina mira 2027 con la inflación como única bandera',
    contenido: 'Septiembre cerró con una inflación mensual que las proyecciones del Banco Central ubicaban en torno al 1,8 por ciento. Se mantiene debajo del 2, pero no logró perforar el dato de agosto, que había sido el más bajo en más de un año. El acumulado de los primeros ocho meses se ubicó alrededor del 21 por ciento, y las consultoras proyectan un cierre de año cerca del 30.\n\nEn el frente cambiario, las estimaciones del mercado venían marcando una suba gradual del dólar hacia fin de año. El Banco Central aflojó el ritmo de compras durante septiembre, en lo que se leyó como una decisión para no empujar el tipo de cambio más de la cuenta.\n\nLo que ordena todas estas decisiones es el calendario político: el Gobierno apunta a llegar a las elecciones de 2027 con una inflación anual en torno al 20 por ciento y el dólar controlado. Es una apuesta con un costo conocido —sostener el tipo de cambio tiene consecuencias sobre reservas y sobre actividad— y con un premio claro. Vale leer los números de los próximos meses con eso en mente: no son solo datos, son una estrategia.',
    tags: ['economía', 'argentina', 'inflación', 'política'],
    fuente: 'Relevamiento de Expectativas de Mercado del BCRA e INDEC — proyecciones de septiembre de 2026',
    fecha: '2026-10-05',
  },
  {
    id: 'art-47',
    titulo: 'Neptuno cumple 180 años de descubierto y una sonda vuelve a usar la Tierra como honda',
    contenido: 'El 23 de septiembre se cumplieron 180 años del descubrimiento de Neptuno, y conviene recordar cómo fue: no lo encontraron mirando, lo encontraron calculando. Las irregularidades en la órbita de Urano no cerraban, alguien hizo las cuentas de dónde tendría que estar el cuerpo que las explicara, apuntaron el telescopio ahí y estaba. Es uno de los episodios más limpios de la historia de la ciencia: la matemática señaló un lugar del cielo y resultó que no estaba vacío.\n\nPocos días después, el 26, Neptuno alcanzó su oposición, el momento del año en que está más cerca y mejor iluminado desde la Tierra. Sigue sin verse a simple vista, pero es cuando un telescopio modesto tiene su mejor chance.\n\nY el 29 la sonda JUICE, en camino a las lunas heladas de Júpiter, hizo una nueva asistencia gravitatoria sobre la Tierra. La maniobra consiste en pasar cerca de un planeta para robarle un poco de su movimiento orbital y salir despedido con más velocidad sin gastar combustible. Es gratis en términos de propulsión y carísima en términos de paciencia: hay que esperar años a que los planetas estén donde se los necesita.',
    tags: ['ciencia', 'astronomía', 'espacio', 'historia'],
    fuente: 'Agencia Espacial Europea — misión JUICE; efemérides astronómicas de septiembre de 2026',
    fecha: '2026-10-05',
  },

  // ── DEPORTE ────────────────────────────────────────────────────────────────
  {
    id: 'dep-01',
    titulo: 'La selección después de Messi: una era que empieza sin el que la definió',
    contenido: 'El 30 de septiembre, en Córdoba, Argentina le ganó 4-0 a Bolivia. Marcaron Lautaro Martínez, Nico Paz, Cristian Romero y José López. El resultado importa menos que el contexto: fue el primer partido de la selección tras el Mundial y tras el retiro de Lionel Messi del equipo nacional.\n\nLa ventana FIFA se completa con dos amistosos más en el Monumental: Burkina Faso el 3 de octubre y Benín el 6. Tres partidos como local en poco más de una semana, pensados menos para ganar que para empezar a responder una pregunta que no tiene atajo: cómo se juega sin el futbolista alrededor del cual se organizó el equipo durante casi dos décadas.\n\nLos goles del debut dan una pista de por dónde puede ir la respuesta. Lautaro desde el lugar del nueve, Nico Paz asomando como el intérprete de la pelota entre líneas, Romero apareciendo en el área rival, José López sumándose desde afuera. No hay un reemplazante de Messi y buscarlo sería el error. Hay, en cambio, una distribución distinta de la responsabilidad: lo que antes resolvía uno, ahora tiene que salir de varios.',
    tags: ['deporte', 'futbol', 'argentina', 'selección'],
    fuente: 'Coberturas de la fecha FIFA — septiembre y octubre de 2026',
    seccion: 'deporte',
    subseccion: 'futbol',
    fecha: '2026-10-05',
  },
  {
    id: 'dep-02',
    titulo: 'Las Leonas campeonas del mundo y un oro doble en los Suramericanos',
    contenido: 'El hockey argentino cerró un 2026 que difícilmente se repita. Las Leonas se consagraron campeonas del Mundial, y Los Leones se quedaron con el bronce en el suyo. Dos medallas mundiales en la misma temporada, en un deporte donde la diferencia entre el podio y el cuarto puesto se juega en detalles.\n\nEn septiembre llegó el cierre: los Juegos Suramericanos de Santa Fe, del 13 al 22. Las Leonas le ganaron 5-0 a Chile y Los Leones 3-1 al mismo rival, con lo que los dos seleccionados se colgaron el oro el mismo día. Para Los Leones fue además el quinto título continental consecutivo.\n\nVale la pena detenerse en lo que significa sostener esto. El hockey argentino no tiene el presupuesto del fútbol ni su estructura de clubes profesionales, y sin embargo lleva décadas produciendo jugadoras y jugadores capaces de competirle a Países Bajos, Bélgica y Alemania. Lo que hay detrás no es una generación dorada que apareció por suerte: es un sistema de clubes y de formación que viene funcionando desde hace mucho y que rara vez aparece en la conversación cuando se habla de deporte argentino.',
    tags: ['deporte', 'hockey', 'argentina', 'mundial', 'suramericanos'],
    fuente: 'Confederación Argentina de Hockey y coberturas de los Juegos Suramericanos 2026',
    seccion: 'deporte',
    subseccion: 'hockey',
    fecha: '2026-10-05',
  },
  {
    id: 'dep-03',
    titulo: 'De UFC 331 a UFC 333: un octubre con dos cinturones en juego',
    contenido: 'Septiembre dejó dos funciones que valieron la pena. En UFC 331, el 19, Marlon "Chito" Vera volvió a ganar por nocaut técnico ante Charles Jourdain. Una semana después, el 26, Raúl Rosas Jr. cerró su pelea con Raoni Barcelos por KO técnico en el quinto asalto, a falta de poco más de un minuto para la campana final.\n\nOctubre arranca fuerte. El 3, en Salt Lake City, UFC 332 pone en juego el cinturón vacante de peso mosca femenino entre Natalia Silva y Wang Cong. En la misma cartelera aparece un cruce generacional que da para mucho: Deiveson Figueiredo contra Payton Talbott, el ex campeón frente a uno de los prospectos que la empresa viene empujando.\n\nPero la fecha del mes es el 24 en Abu Dabi. UFC 333 junta dos peleas de título en la misma noche: Alexander Volkanovski defiende el pluma ante Movsar Evloev, y Petr Yan se cruza por tercera vez con Merab Dvalishvili por el gallo. Las trilogías en MMA tienen algo particular: a la tercera ya no quedan secretos tácticos, y lo que define suele ser quién se adaptó mejor a lo que el otro ya sabe que va a hacer.',
    tags: ['deporte', 'mma', 'ufc', 'octubre 2026'],
    fuente: 'Carteleras oficiales de UFC — septiembre y octubre de 2026',
    seccion: 'deporte',
    subseccion: 'mma',
    fecha: '2026-10-05',
  },
  {
    id: 'dep-04',
    titulo: 'Jiu-Jitsu Brasileño: el ajedrez del suelo',
    contenido: 'El jiujitsu brasileño (BJJ) es un arte marcial que parte de una premisa contraintuitiva: en el suelo, la técnica vence al tamaño. Un practicante con buena técnica puede neutralizar y someter a un oponente más grande y fuerte. Esa promesa lo hace único entre los deportes de combate y explica su explosivo crecimiento global.\n\nEl BJJ tiene una profundidad técnica que lo asemeja al ajedrez. Cada posición tiene sus variantes, sus contraataques y sus respuestas. La guardia, el montado, el half guard, la espalda: cada una es un juego de posición en sí misma con décadas de desarrollo técnico acumulado. Los jugadores de alto nivel piensan tres o cuatro movimientos hacia adelante, igual que un ajedrecista.\n\nMás allá del aspecto marcial, la comunidad del BJJ tiene algo peculiar: el ego se somete rápidamente a la realidad del mat. Podés ser el más exitoso del mundo fuera del tatami; si no entrenás y tu técnica es mala, alguien más pequeño te va a dominar. Esa humildad forzada es parte de lo que atrae a profesionales exitosos al deporte.',
    tags: ['deporte', 'jiujitsu', 'artes marciales', 'técnica'],
    fuente: 'Gracie Academy; Gordon Ryan Technique Library',
    seccion: 'deporte',
    subseccion: 'jiujitsu',
  },
  {
    id: 'dep-05',
    titulo: 'Coello y Tapia se quedaron con París, el Major más exigente del año',
    contenido: 'El Premier Padel de septiembre tuvo su punto más alto en París, del 8 al 13. El France Major, tercer Major de la temporada, se juega bajo techo en Roland Garros, y esa condición cambia el deporte: sin viento ni sol, la pelota viaja más previsible, los puntos se alargan y el desgaste físico pesa más que el golpe ganador.\n\nArturo Coello y Agustín Tapia se llevaron el título. En el camino dejaron un cuadro que no dio respiro: Augsburger y Lebrón, Di Nenno y Navarro —que necesitaron tres sets para sacarse de encima a Stupaczuk y Sanz—, y Galán y Chingotto, que venían de ganar el Madrid P1 a comienzos de mes. En el femenino, Triay y Brea se quedaron con Madrid.\n\nLa escena argentina sigue siendo determinante. Tapia, Di Nenno, Navarro, Stupaczuk, Chingotto, Brea: la nómina de los primeros puestos del ranking está poblada de jugadores formados acá. En un deporte que explotó comercialmente en España, buena parte del talento que lo sostiene sigue saliendo de canchas argentinas.',
    tags: ['deporte', 'padel', 'premier padel', 'argentina'],
    fuente: 'Premier Padel — resultados de la temporada 2026',
    seccion: 'deporte',
    subseccion: 'padel',
    fecha: '2026-10-05',
  },
  {
    id: 'dep-06',
    titulo: 'Psicología del tenis: el punto entre puntos',
    contenido: 'El tenis es quizás el deporte mental por excelencia. A diferencia de los deportes de equipo donde la responsabilidad se distribuye, en el tenis cada punto es exclusivamente tuyo. No hay compañero al que culpar, no hay entrenador que entre al campo durante el partido. Esa soledad es parte de lo que lo hace psicológicamente tan desafiante.\n\nTim Gallwey, en "El juego interior del tenis", identificó que el mayor enemigo del jugador es su propio diálogo interno. El "yo 1" (la mente consciente crítica) interfiere con el "yo 2" (el cuerpo entrenado). Cuando la mente crítica está activa durante la ejecución, el rendimiento baja. Las instrucciones mentales —"codo arriba", "mirar la pelota"— fragmentan el movimiento que debería ser fluido.\n\nLo que separa a los grandes tenistas no es tanto la técnica (en el top 100 es notablemente pareja) sino la gestión emocional entre puntos. Federer tenía un ritual de 20 segundos entre cada punto. Djokovic hace ejercicios de respiración. Ese tiempo —que reglamentariamente existe— es donde se ganan o pierden los sets. Cómo llegás al siguiente punto define cuánto pesan los anteriores.',
    tags: ['deporte', 'tenis', 'psicología', 'mentalidad', 'rendimiento'],
    fuente: 'Tim Gallwey — El juego interior del tenis; Brad Gilbert — Winning Ugly',
    seccion: 'deporte',
    subseccion: 'tenis',
  },
  {
    id: 'dep-07',
    titulo: 'Nutrición del artista marcial: corte de peso y recuperación',
    contenido: 'El corte de peso es una de las prácticas más controvertidas y peligrosas del deporte de combate. Los peleadores bajan 5 a 10 kg en los días previos al pesaje mediante restricción de fluidos y carbohidratos, luego intentan recuperarlos en las horas siguientes. El resultado: entran a la jaula deshidratados, con depósitos de glucógeno incompletos y cognitivamente comprometidos.\n\nLa evidencia científica es clara: los cortes extremos perjudican el rendimiento y son un riesgo de salud serio. Sin embargo, la presión competitiva hace que pocos los abandonen unilateralmente. Las organizaciones más serias —como el UFC— implementaron controles de hidratación y en algunos casos eliminaron los pesajes el día anterior para reducir los incentivos del corte.\n\nLa nutrición óptima para el artista marcial fuera del periodo de corte prioriza: proteína alta para preservar masa muscular en déficit calórico, carbohidratos estratégicamente ubicados alrededor del entrenamiento, y grasas de calidad para la síntesis hormonal. La hidratación constante y el sueño son tan importantes como la alimentación. El atleta que llega al campamento en su peso natural y bien nutrido tiene una ventaja sobre quien hace el corte extremo, independientemente del nivel técnico.',
    tags: ['deporte', 'mma', 'nutrición', 'salud', 'rendimiento'],
    fuente: 'George Lockhart — Nutrition for Combat Sports; UFC Performance Institute',
    seccion: 'deporte',
    subseccion: 'mma',
  },
  {
    id: 'dep-08',
    titulo: 'Sinner cierra septiembre arriba y Zverev se lleva el US Open',
    contenido: 'El US Open terminó el 13 de septiembre con Alexander Zverev campeón, el título grande que le venía faltando a una carrera que llevaba años sostenida en el top del ranking sin un major. Para un jugador que acumuló finales perdidas y lesiones en los peores momentos, cerrar ese pendiente cambia cómo se lee todo lo anterior.\n\nAun así, el número uno al cierre del mes siguió siendo Jannik Sinner. Es una de esas situaciones que muestran lo que el ranking ATP mide en realidad: no quién jugó mejor dos semanas, sino quién sostuvo el nivel durante cincuenta y dos. Se puede ganar el torneo más visible del año y seguir segundo, porque el sistema premia la constancia por encima del pico.\n\nLa gira asiática del final de septiembre repartió: Alejandro Davidovich Fokina se quedó con Chengdu y Daniil Medvedev con Hangzhou. Son torneos que la narrativa suele saltear, pero es ahí donde se juntan los puntos que después explican por qué alguien llega a fin de año arriba.',
    tags: ['deporte', 'tenis', 'atp', 'us open'],
    fuente: 'ATP Tour — resultados y ranking de septiembre de 2026',
    seccion: 'deporte',
    subseccion: 'tenis',
    fecha: '2026-10-05',
  },

  // ── ENTRETENIMIENTO ────────────────────────────────────────────────────────
  {
    id: 'ent-01',
    titulo: 'Temporada de otoño 2026: 43 series y un calendario que no afloja',
    contenido: 'La temporada de otoño llegó a Crunchyroll con 43 series entre estrenos y regresos, más cinco que vienen arrastrándose desde el verano. Los estrenos se reparten hasta el 16 de octubre, con lo cual la primera quincena del mes es básicamente una avalancha.\n\nLos dos pesos pesados comparten semana. The Apothecary Diaries estrenó su tercera temporada el 2 de octubre, y Black Clover volvió con la segunda al día siguiente. Entre los debuts aparecen Firefly Wedding, The Vermilion Mask y Overgeared, y también se sumó Dragon Ball Super: Beerus al catálogo.\n\nLa pregunta que deja una temporada así no es qué mirar sino cómo. Cuarenta y tres series semanales es más de lo que cualquier persona con un trabajo puede seguir, y la estrategia de las plataformas de inundar el calendario tiene un costo: series buenas que pasan desapercibidas porque estrenaron la misma semana que un regreso esperado. Vale más elegir tres y verlas bien que tener veinte a medio empezar.',
    tags: ['entretenimiento', 'anime', 'crunchyroll', 'otoño 2026'],
    fuente: 'Calendario de estrenos de Crunchyroll — temporada de otoño 2026',
    seccion: 'entretenimiento',
    subseccion: 'anime',
    fecha: '2026-10-05',
  },
  {
    id: 'ent-02',
    titulo: 'Netflix en octubre: Florence Pugh, un thriller de Affleck y una comedia argentina',
    contenido: 'El mes abre con dos cosas distintas. Al Este del Edén, miniserie de siete episodios con Florence Pugh, adapta el clásico de Steinbeck de 1952. Y el 1 de octubre entró al catálogo La sustancia, el body horror con Demi Moore y Margaret Qualley que dio que hablar en su paso por cines.\n\nEl 9 llega Animales, dirigida por Ben Affleck: un thriller sobre los límites morales de la desesperación. El mismo día estrena Doctora X, la versión coreana de la serie japonesa. Y el 7 había arrancado El círculo, la serie mexicana basada en Los corruptores de Jorge Zepeda Patterson.\n\nPara el público local hay un estreno que vale marcar: Lo dejamos acá, comedia dramática argentina sobre un psicoanalista pragmático, el 16 de octubre. Cierra el mes la cuarta parte de Lupin, el 23, junto a la sátira española Grande de España. Entre lo propio y lo licenciado, Netflix mueve cerca de cuarenta títulos en el mes.',
    tags: ['entretenimiento', 'netflix', 'estrenos', 'octubre 2026'],
    fuente: 'Calendario de estrenos de Netflix — octubre de 2026',
    seccion: 'entretenimiento',
    subseccion: 'netflix',
    fecha: '2026-10-05',
  },
  {
    id: 'ent-03',
    titulo: 'Pixar y la regla de los 3 actos: cómo construir emoción duradera',
    contenido: 'Pixar ha producido algunas de las películas más emocionalmente poderosas de las últimas décadas con animación para toda la familia. El secreto no es la tecnología sino la estructura narrativa y la profundidad de los personajes. Cada película de Pixar sigue una variación del esquema "pero/por lo tanto" en lugar del "y entonces": los eventos no simplemente ocurren; cada uno surge del anterior como consecuencia causal.\n\nLa apertura de Up —los primeros diez minutos sin diálogo que cuentan toda una vida— es un estudio magistral de economía narrativa y construcción emocional. Disney Classic hubiera mostrado ese montaje con canciones y diálogos explicativos. Pixar confió en que las imágenes y la música de Michael Giacchino podían hacer el trabajo sin palabras. Esa confianza en el espectador es lo que distingue su approach.\n\nBrenda Chapman, Pete Docter, Andrew Stanton —los directores históricos de Pixar— comparten una filosofía: las mejores historias empiezan con una pregunta emocional verdadera, no con una premisa de concepto. "¿Qué pasa si los juguetes tienen vida?" es concepto. "¿Qué significa crecer y desprenderse de lo que fuiste?" es la pregunta que hace que Toy Story 3 funcione para adultos que eran niños cuando salió la primera.',
    tags: ['entretenimiento', 'disney', 'narrativa', 'creatividad', 'cine'],
    fuente: 'Ed Catmull — Creativity Inc.; Pixar Storytelling Rules',
    seccion: 'entretenimiento',
    subseccion: 'disney',
  },
  {
    id: 'ent-04',
    titulo: 'El octubre más cargado del año, y todavía falta GTA 6',
    contenido: 'Octubre de 2026 junta en cuatro semanas más lanzamientos grandes que algunos años enteros. El 6 llega Gears of War: E-Day, la precuela que Microsoft viene preparando hace rato. El 9, Dragon\'s Dogma 2: Dark Arisen suma la expansión que el juego original pedía a gritos. El 15 aparece Castlevania: Belmont\'s Curse, y el 16 Capcom lleva los remakes de Resident Evil 2, 3 y 4 a Switch 2.\n\nLa segunda mitad no baja: Call of Duty: Modern Warfare 4 el 23, y Phantom Blade Zero el 29, el action chino que viene mostrándose desde hace años y que finalmente tiene fecha. A eso se le suma Ace Combat 8 a comienzos de mes.\n\nY todo esto es, en los hechos, el último mes para ponerse al día: Rockstar lanza GTA 6 el 19 de noviembre. La lógica de la industria es transparente — nadie quiere competir con eso, así que todo lo que podía salir antes se amontonó en octubre. Para el jugador el problema deja de ser qué comprar y pasa a ser qué va a quedar sin terminar.',
    tags: ['entretenimiento', 'videojuegos', 'octubre 2026', 'gta 6', 'lanzamientos'],
    fuente: 'Calendarios de lanzamientos de la industria — octubre y noviembre de 2026',
    seccion: 'entretenimiento',
    subseccion: 'videojuegos',
    fecha: '2026-10-05',
  },
  {
    id: 'ent-05',
    titulo: 'Los regresos de otoño: dos temporadas que la comunidad venía esperando',
    contenido: 'Hay temporadas que se definen por los estrenos y otras por los regresos. Esta es de las segundas. The Apothecary Diaries volvió el 2 de octubre con su tercera temporada, y Black Clover con la segunda prácticamente en paralelo.\n\nLo de The Apothecary Diaries es particular dentro del panorama actual. Es una serie construida sobre deducción, veneno y política palaciega, donde la protagonista resuelve problemas con conocimiento de farmacología en vez de con poder. En un mercado dominado por escalas de poder y peleas, funciona casi como un policial de época, y esa diferencia es buena parte de por qué conectó.\n\nEntre los debuts el que más expectativa arrastra es Firefly Wedding, junto a The Vermilion Mask y Overgeared. Y si hay algo que esta temporada deja claro es que el regreso de una serie querida arrastra más audiencia que casi cualquier estreno nuevo: la fidelidad, en anime, pesa más que la novedad.',
    tags: ['entretenimiento', 'anime', 'crunchyroll', 'otoño 2026', 'regresos'],
    fuente: 'Guía de anime de Crunchyroll — otoño 2026',
    seccion: 'entretenimiento',
    subseccion: 'anime',
    fecha: '2026-10-05',
  },
  {
    id: 'ent-06',
    titulo: 'El Nintendo Direct de septiembre: la Switch 2 sale a buscar el catálogo que le falta',
    contenido: 'El 9 de septiembre Nintendo hizo un Direct de unos 45 minutos dedicado casi por completo a la Switch 2, y la estrategia quedó a la vista: en vez de apostar todo a exclusivos propios, la consola salió a buscar los juegos grandes que se perdió.\n\nCapcom confirmó Monster Hunter Wilds para el 4 de diciembre y los remakes de Resident Evil 2, 3 y 4. Square Enix anunció Final Fantasy VII Revelation para abril. ATLUS puso Persona 4 Revival en mayo. CD Projekt mostró The Witcher 3 Remastered corriendo en la consola, con una mejora visual que sorprendió. Se sumaron además Tomb Raider: Legacy of Atlantis, Stellar Blade Complete Edition y Kingdom Come: Deliverance II.\n\nLo propio también apareció: un Kirby nuevo en 3D, Kirby and the World Beyond, para la primavera de 2027. Pero el peso del Direct estuvo en los ports y las remasterizaciones, y eso cuenta una historia. La Switch original se construyó sobre la idea de que podías llevarte un juego grande a cualquier lado; la Switch 2 parece estar apostando a lo mismo, solo que esta vez con los juegos que antes no entraban.',
    tags: ['entretenimiento', 'consolas', 'nintendo', 'switch 2', 'septiembre 2026'],
    fuente: 'Nintendo Direct — 9 de septiembre de 2026',
    seccion: 'entretenimiento',
    subseccion: 'consolas',
    fecha: '2026-10-05',
  },
  {
    id: 'ent-07',
    titulo: 'Crunchyroll y el problema de tener demasiado',
    contenido: 'La temporada de otoño le dio a Crunchyroll 43 series simultáneas, con estrenos escalonados hasta el 16 de octubre. Es, otra vez, el catálogo más grande que la plataforma tuvo en una temporada, y la cifra viene creciendo año a año sin pausa.\n\nEl crecimiento tiene una explicación clara: la plataforma consolidó derechos que antes estaban repartidos, y el anime dejó de ser un nicho para volverse una categoría que las grandes plataformas pelean. Lo que antes había que buscar en rincones raros de internet hoy llega subtitulado y doblado el mismo día que en Japón.\n\nPero la abundancia trae su propio problema, y es de descubrimiento. Con 43 series por temporada, el cuello de botella dejó de ser el acceso y pasó a ser la atención. Las series que no arrancan con una comunidad detrás o un nombre reconocido tienen muy poco margen: si no enganchan en los primeros dos episodios, quedan enterradas debajo de cuarenta más. La paradoja es que mientras más hay, más difícil se vuelve que algo nuevo encuentre su público.',
    tags: ['entretenimiento', 'crunchyroll', 'anime', 'streaming', 'otoño 2026'],
    fuente: 'Catálogo de Crunchyroll — temporada de otoño 2026',
    seccion: 'entretenimiento',
    subseccion: 'crunchyroll',
    fecha: '2026-10-05',
  },
  {
    id: 'ent-08',
    titulo: 'VisionQuest abre la Fase Seis de Marvel con la pregunta más interesante que tenían a mano',
    contenido: 'El 14 de octubre Disney+ estrena VisionQuest, y la serie entra oficialmente como parte de la Fase Seis del universo Marvel. Arranca con dos episodios y después sigue semanal hasta completar ocho.\n\nLa premisa es la más prometedora que Marvel tuvo en televisión desde hace un buen rato: Visión vive escondido, tratando de entender quién es, y lo hace conversando con distintas personalidades de IA integradas en su propia programación. Cuando le ponen precio a su cabeza, huye con un adolescente que podría ser su hijo reencarnado.\n\nQue este material llegue en 2026 no es casual. Un androide que intenta averiguar si lo que recuerda lo constituye, hablando con versiones de sí mismo que corren adentro suyo, es una historia que hace cinco años se leía como ciencia ficción y hoy se lee como una discusión bastante literal. Marvel no suele ir a buscar estos temas de frente; cuando lo hizo —WandaVision es el antecedente obvio, y también sobre Visión— le salió de lo mejor que tiene.',
    tags: ['entretenimiento', 'disney', 'marvel', 'series', 'octubre 2026'],
    fuente: 'Disney+ — calendario de estrenos de octubre de 2026',
    seccion: 'entretenimiento',
    subseccion: 'disney',
    fecha: '2026-10-05',
  },
];

/**
 * Ventaja por frescura. Un artículo recién escrito arranca con 12 puntos y
 * los pierde de forma lineal a lo largo de 45 días; después no suma nada.
 * Los atemporales (sin `fecha`) no reciben bonus, así que la actualidad sube
 * sola sin que haya que tocar el orden a mano cada vez.
 */
function bonusNovedad(fecha: string | undefined, hoy: number): number {
  if (!fecha) return 0;
  const t = new Date(fecha + 'T00:00:00').getTime();
  if (Number.isNaN(t)) return 0;
  const dias = (hoy - t) / 86400000;
  if (dias < 0 || dias > 45) return 0;
  return 12 * (1 - dias / 45);
}

export function scoreArticulos(
  articulos: DiarioArticulo[],
  tagScores: Record<string, number>,
  reactions: Record<string, string>,
): DiarioArticulo[] {
  const hoy = Date.now();
  const general = articulos.filter(a => !a.seccion);
  const scored = general.map(a => {
    const score = a.tags.reduce((s, t) => s + (tagScores[t] ?? 0), 0)
                + bonusNovedad(a.fecha, hoy);
    return { a, score };
  });
  scored.sort((x, y) => y.score - x.score);
  const unreacted = scored.filter(x => !reactions[x.a.id]);
  const reacted   = scored.filter(x =>  reactions[x.a.id]);
  return [...unreacted, ...reacted].map(x => x.a);
}
