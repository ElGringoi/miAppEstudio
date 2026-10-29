# Criterios de aceptación

> Formato **Dado / Cuando / Entonces**. Describen el comportamiento **esperado**; los marcados con 🔧 hoy no se cumplen y tienen el caso en [estados-y-excepciones.md](../02-ux/estados-y-excepciones.md). Cada uno se puede convertir en un test (ver [estrategia-pruebas.md](estrategia-pruebas.md)).

## Sesión y carga

- **AC-SES-1** Dado que no hay sesión, cuando abro la app, entonces veo `LoginScreen` con "Entrar con Google".
- **AC-SES-2** Dado que inicié sesión, cuando cargan los datos, entonces veo el Dashboard en ≤ 3 s con red 4G.
- **AC-SES-3** 🔧 Dado que un listener falla por permisos, cuando carga la app, entonces veo un mensaje de error en español con "Reintentar" en ≤ 10 s (no un spinner infinito).
- **AC-SES-4** 🔧 Dado que cierro sesión, entonces se borran la caché de Firestore y el historial del chat del dispositivo.

## Dashboard

- **AC-DASH-1** Dado que tengo quests activas hoy, cuando abro el Dashboard, entonces las veo sin scroll en un celular de 375 × 812.
- **AC-DASH-2** Dado que no tengo quests para hoy, entonces veo "Sin quests para hoy." y un botón para crear una.
- **AC-DASH-3** Dado que son las 21:00 o más y no vi el cierre hoy, cuando abro la app, entonces aparece el modal de Cierre del día una sola vez por día.
- **AC-DASH-4** 🔧 Dado que son las 22:30 en Argentina, cuando guardo la reflexión, entonces la nota tiene la fecha de **hoy** en Argentina.

## Quests (hábitos)

- **AC-HAB-1** Dado un hábito diario de Fuerza con 20 XP y racha 0, cuando lo marco, entonces `fuerza.xp` sube 20 y veo "+20 XP".
- **AC-HAB-2** Dado una racha de 7 días, cuando lo marco, entonces suma `round(20 × 1,25) = 25` XP y el toast muestra el multiplicador.
- **AC-HAB-3** 🔧 Dado que lo marqué con racha 7 (+25), cuando lo desmarco, entonces el XP vuelve exactamente al valor anterior (−25).
- **AC-HAB-4** Dado un hábito `weekdays`, cuando es sábado, entonces no aparece como activo.
- **AC-HAB-5** Dado un hábito `once_week` hecho el lunes, cuando es jueves, entonces figura hecho.

## Calendario

- **AC-CAL-1** Dado una tarea `weekly` de los martes, cuando miro cualquier martes, entonces aparece; los otros días no.
- **AC-CAL-2** Dado que completo una tarea recurrente hoy, entonces solo queda marcada hoy (`completedDates` incluye solo la fecha de hoy).
- **AC-CAL-3** Dado que conecté Google Calendar, entonces veo sus eventos de −7 a +60 días junto a los propios.
- **AC-CAL-4** 🔧 Dado que el token de Google venció, cuando cargo el Calendario, entonces veo "Se venció la conexión con Google Calendar" y un botón "Reconectar".

## Gym

- **AC-GYM-1** Dado una rutina del día, cuando marco un ejercicio como hecho, entonces `fuerza.xp` sube 5 y `lastCompletedDate` es hoy.
- **AC-GYM-2** Dado un ejercicio con `restTimerSecs = 90`, cuando termino una serie, entonces arranca un timer de 90 s visible.
- **AC-GYM-3** Dado que desmarco el ejercicio, entonces `fuerza.xp` baja 5.

## Atributos (Biblioteca y Facultad)

- **AC-ATR-1** Dado un libro con `xpPorCapitulo = 10`, cuando marco un capítulo leído, entonces `inteligencia.xp` sube 10.
- **AC-ATR-2** Dado una tarea de facultad, cuando la completo, entonces suma 15 XP de Inteligencia; al descompletarla, resta 15.
- **AC-ATR-3** Dado un examen con nota 8 de 10, cuando la cargo, entonces suma `round(8 / 10 × 30) = 24` XP.
- **AC-ATR-4** Dado los 6 stats, entonces el radar muestra el nivel de cada uno y la clase según el stat dominante.

## Misiones

- **AC-MIS-1** Dado una misión B con prerequisito A sin completar, cuando toco B, entonces no se completa y veo "Completá las misiones prerequisito primero".
- **AC-MIS-2** Dado una misión con 2 de 4 hijas completas, entonces su progreso es 50 %.
- **AC-MIS-3** Dado una misión con costo, cuando la completo y acepto, entonces se crea **una** transacción de gasto con su monto y moneda.
- **AC-MIS-4** 🔧 Dado que borro una misión con hijas, entonces las hijas se borran o suben de nivel; ninguna queda invisible.
- **AC-MIS-5** 🔧 Dado que borro una misión que era prerequisito, entonces las que dependían de ella dejan de estar bloqueadas.

## Billetera

- **AC-BIL-1** Dado que cargo un gasto de $1.500 en "🍔 Comida", entonces aparece en el mes actual y descuenta del presupuesto de esa categoría.
- **AC-BIL-2** Dado un presupuesto del mes anterior, cuando toco "Copiar del mes anterior", entonces se crean los mismos presupuestos para el mes actual.
- **AC-BIL-3** Dado una meta de ahorro, cuando aporto $10.000, entonces `montoActual` sube exactamente 10.000.

## La Gaceta

- **AC-GAC-1** Dado que abro el Diario con red, entonces veo la edición de hoy (fecha de Argentina) en ≤ 5 s.
- **AC-GAC-2** Dado que no hay red y hay caché de hoy, entonces veo la caché y un aviso "Sin conexión".
- **AC-GAC-3** Dado que marco 👍 en una nota con tag `f1`, entonces sube `tagScores.f1` y las notas de F1 suben en el ranking.
- **AC-GAC-4** Dado que guardo una nota, entonces aparece en Guardados aunque la edición cambie al día siguiente (máx 300).
- **AC-GAC-5** 🔧 Dado que la edición vino degradada, entonces veo un chip "Edición parcial".

## Segundo Cerebro

- **AC-CER-1** Dado un ítem del inbox, cuando lo proceso como tarea, entonces se crea la tarea para hoy y el ítem queda procesado **en una sola operación** (o ambas cosas, o ninguna).
- **AC-CER-2** Dado que proceso como "persona" sin elegir persona, entonces veo "Elegí una persona" y no se guarda nada.
- **AC-CER-3** Dado que pregunto algo al chat y Groq responde, entonces veo la respuesta y queda en el historial.
- **AC-CER-4** Dado que Groq falla, entonces veo una respuesta armada con mis datos locales.
- **AC-CER-5** Dado que borro un grupo, entonces ninguna persona lo sigue teniendo en `grupos[]`.

## Ajustes

- **AC-AJU-1** Dado que toco "Conectar Google Calendar", cuando acepto el popup, entonces el estado pasa a "Conectado".
- **AC-AJU-2** 🔧 Dado que toco "Exportar datos", entonces el JSON incluye **todas** las colecciones.
