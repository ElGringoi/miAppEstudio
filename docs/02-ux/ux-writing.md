# UX writing: voz, tono y microcopy

## Voz

La app habla como **un compañero de gremio** (dirección visual C · Gremio, [ADR-0004](../08-decisiones/ADR-0004-estilo-visual.md)): cálido, directo, en español rioplatense (vos), que celebra los logros sin exagerar y usa vocabulario de juego cuando suma y no cuando confunde.

| Es | No es |
|---|---|
| Directo: "Completá las misiones prerequisito primero" | Vago: "Hubo un problema" |
| Rioplatense: "Metele", "Elegí", "Tocá" | Neutro forzado: "Seleccione" |
| Juego con medida: "+25 XP FUE", "Quest", "Rango C" | Juego en todo: "¡Oh, valiente aventurero!" |
| Español en toda la UI | Mezclado: "Loading hero data…", "My Missions" |

## Glosario (una palabra por concepto)

| Concepto | Palabra en la UI | No usar |
|---|---|---|
| Hábito recurrente | **Quest** | hábito (solo en docs), task |
| Objetivo con pasos | **Misión** (épica → hito → tarea) | goal, objetivo |
| Puntos de experiencia | **XP** | puntos, exp |
| Atributo del personaje | **Stat** en código, **atributo** en UI, abreviatura `FUE/SAL/INT/AGI/CAR/FE` | mezclar STR con SAL |
| Edición de noticias | **La Gaceta** | "El Questflow", "Diario personal" |
| Notas, personas, inbox | **Segundo Cerebro** | Cerebro a secas en títulos |
| Plata | **Billetera** | Treasury |

### Inconsistencias encontradas

| Dónde | Hoy | Cambiar a |
|---|---|---|
| `App.tsx:1976` | "Loading hero data…" | "Cargando tu personaje…" |
| `helpers.ts:27`, `helpers.ts:54` | "My Missions" | "Mis misiones" |
| `App.tsx:90` (`PAGE_TITLE.diario`) | "El Questflow" | "La Gaceta" |
| `App.tsx:102` (subtítulo de diario) | "Tu diario personal de progreso" | "Tu edición del día" |
| `constants.tsx:30` (`STAT_META.fuerza.shortName`) | "STR" (inglés) junto a "SAL", "FE" | "FUE" |
| `App.tsx:731`, `App.tsx:737`, `App.tsx:4256` | "Treasury" | "Billetera" |
| `constants.tsx:62-70` | "E-Rank", "S-Rank" | "Rango E", "Rango S" (o dejar en inglés a propósito y documentarlo) |

## Patrones de microcopy

| Situación | Patrón | Ejemplo |
|---|---|---|
| Éxito con XP | `+{xp} XP {STAT}` + multiplicador si hay | "+25 XP FUE (×1,25)" |
| Éxito simple | Pasado + objeto | "Gasto registrado" |
| Error | Qué falló + qué hacer | "No se pudo guardar la quest. Revisá la conexión y probá de nuevo." |
| Vacío | Qué falta + acción | "Sin quests todavía. Creá la primera y empezá a sumar XP." |
| Confirmación destructiva | Qué se pierde, verbo en el botón | "¿Borrar la misión y sus 3 sub-misiones?" → **Borrar** / Cancelar |
| Offline | Qué pasa + tranquilidad | "Sin conexión. Tus cambios se guardan y se sincronizan al volver." |
| Botones | Verbo en infinitivo, máx 3 palabras | "Guardar", "Crear quest", "Reconectar" |

## Reglas

1. Números con formato argentino: `1.234,50` (`toLocaleString('es-AR')`), coma decimal también en multiplicadores.
2. Fechas cortas: "lun 19 oct"; relativas cuando ayuda: "hace 2 días".
3. Emojis solo como ícono de contenido (categorías, avatares), nunca en mensajes de error.
4. Nada de mayúsculas sostenidas en frases; sí en labels cortos con `font-label` (ver [fundamentos](../03-design-system/fundamentos.md)).
