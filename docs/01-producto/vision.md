# Visión del producto

## El problema

Estudiar, entrenar, leer, ordenar la plata y cuidar los vínculos son cosas que se hacen **todos los días** y cuyo progreso **no se ve**. Las apps sueltas (un tracker de hábitos, un calendario, una de gastos, una de notas) reparten la información y ninguna premia el esfuerzo acumulado.

## La propuesta

**miAppEstudio convierte la vida diaria en un personaje de RPG que sube de nivel.**

- Cada hábito, capítulo leído, ejercicio o tarea de la facultad **suma XP a un stat** (Fuerza, Salud, Inteligencia, Agilidad, Carisma, Fe).
- Los stats arman un **nivel principal**, un **rango** (E → D → C → B → A → S → SS → Monarch) y una **clase** (Guerrero, Mago, Paladín…).
- Todo vive en **una sola app**: agenda, gimnasio, estudio, misiones, finanzas, un diario de noticias y un "Segundo Cerebro" para notas y personas.

## Usuario

Hoy es una app **de un solo usuario** (Gastón): estudiante universitario en Argentina que entrena, lee y quiere ordenar su semana. Usa la app en el celular durante el día y en la compu para planificar.

Lo que necesita de la app:

| Necesidad | Cómo la cubre la app |
|---|---|
| Arrancar sin fricción | Dashboard con lo de hoy: hábitos, agenda y misiones activas |
| Ver progreso | XP, niveles, rachas, heatmap, radar de stats |
| Pasos chicos y concretos | Misiones partidas en épica → hito → tarea |
| Cerrar el día | Modal de "Cierre del día" después de las 21:00 con reflexión |
| No perder lo que llega | Inbox que junta capturas propias y mails (agente Gmail) |
| Informarse sin scrollear infinito | La Gaceta: una edición diaria con fin, personalizada |

## Módulos

| Módulo | Tab | Para qué |
|---|---|---|
| Dashboard | `dashboard` | Resumen del día, bitácora, rocas semanales |
| Calendario | `calendar` | Eventos y tareas con recurrencia + Google Calendar |
| Gym | `gym` | Rutinas, series, timer de descanso, mapa muscular, comida |
| Atributos | `attributes` | Radar de stats; Inteligencia → Biblioteca y Facultad |
| Quests | `habits` | Hábitos con recurrencia y XP configurable |
| Misiones | `missions` | Árbol de objetivos con prerequisitos y costo |
| Billetera | `billetera` | Ingresos, gastos, presupuestos, metas de ahorro |
| Diario (La Gaceta) | `diario` | Edición diaria de 8 páginas con noticias y deportes en vivo |
| Segundo Cerebro | `cerebro` | Inbox, notas, ideas, personas, grupos y chat con IA |
| Ajustes | `settings` | Perfil, Google Calendar, exportar datos |

Detalle visual: [mapa-producto.md](mapa-producto.md). Casos de uso: [casos-de-uso.md](casos-de-uso.md).

## Principios de producto

1. **Una acción, una recompensa visible.** Todo lo que se completa muestra su XP en menos de 1 segundo.
2. **Lo de hoy primero.** La pantalla de inicio responde "¿qué hago ahora?" sin scroll en el celular.
3. **Nada se pierde.** Si falla la red, la app sigue andando con la caché local y lo dice.
4. **Terminar es parte del diseño.** La Gaceta tiene última página; el día tiene cierre.
5. **Los datos son del usuario.** Se pueden exportar completos y borrar (ver [privacidad](../05-seguridad/privacidad.md)).

## Métricas de éxito (para un solo usuario)

| Métrica | Cómo se mide | Meta |
|---|---|---|
| Días activos por semana | días con al menos 1 hábito o tarea completada | ≥ 6 |
| Racha más larga activa | `calcStreak` del mejor hábito | ≥ 30 días |
| Cierre del día usado | días con reflexión guardada / días activos | ≥ 50 % |
| Inbox al día | ítems sin procesar con más de 3 días | 0 |
| Tiempo a la primera acción | abrir la app → primer toque útil | ≤ 5 s |

## Fuera de alcance (por ahora)

- Multiusuario, social, rankings entre personas.
- App nativa (se usa como web app en el celular).
- Backend propio (ver [ADR-0001](../08-decisiones/ADR-0001-firebase-cliente.md)).
