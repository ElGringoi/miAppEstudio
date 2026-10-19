# Estados y casos excepcionales

> Qué ve el usuario en cada pantalla cuando algo no es el "camino feliz". Toda pantalla nueva **tiene que** definir los 7 estados de abajo (regla del [contrato de agentes](../CONTRATO-AGENTES.md)).

## Los 7 estados obligatorios

| Estado | Cuándo | Qué se muestra (objetivo) | Componente |
|---|---|---|---|
| **Cargando** | primera carga sin caché | skeleton con la forma del contenido, no spinner a pantalla completa | `ui/Skeleton` |
| **Vacío** | carga ok, 0 elementos | ícono + 1 frase + 1 botón de acción ("Crear tu primera quest") | `ui/EmptyState` |
| **Error** | falla de lectura o permiso | mensaje en español + **Reintentar**; nunca un spinner infinito | `ui/ErrorState` |
| **Offline** | sin red | contenido de la caché + chip "Sin conexión, se sincroniza al volver" | `ui/OfflineBadge` |
| **Parcial** | llegó una parte | lo que hay + aviso de qué falta | aviso inline |
| **Sin permiso** | token vencido (Calendar) o sesión caída | qué pasó + botón para reconectar | aviso inline |
| **Éxito** | acción completada | toast con el resultado y **Deshacer** si se puede revertir | `ui/Toast` |

## Matriz pantalla × estado

✅ = resuelto · ⚠️ = parcial o mejorable · ❌ = no existe

| Pantalla | Cargando | Vacío | Error | Offline | Parcial | Sin permiso | Éxito |
|---|---|---|---|---|---|---|---|
| App (arranque) | ⚠️ spinner global en inglés `App.tsx:1976` | — | ❌ spinner infinito | ⚠️ caché de Firestore sin aviso | ❌ | ❌ | — |
| Dashboard | ⚠️ global | ✅ "Sin quests para hoy." `App.tsx:2582` | ❌ | ⚠️ sin aviso | — | — | ✅ toast XP |
| Calendario | ⚠️ global | ✅ "Sin quests para este día." `App.tsx:2763` | ⚠️ GCal solo en consola | ⚠️ | — | ❌ 401 de GCal en silencio `App.tsx:285-290` | ✅ |
| Gym | ⚠️ global | ⚠️ | ❌ | ⚠️ | — | — | ✅ |
| Atributos | ⚠️ global | ✅ "Sin libros aún." `App.tsx:3213` | ❌ | ⚠️ | — | — | ✅ |
| Quests | ⚠️ global | ✅ `App.tsx:3476` | ❌ | ⚠️ | — | — | ✅ |
| Misiones | ⚠️ global | ✅ `App.tsx:3648` | ❌ | ⚠️ | — | — | ✅ confetti |
| Billetera | ⚠️ global | ✅ "Sin transacciones aún." `App.tsx:3962` | ❌ | ⚠️ | — | — | ✅ |
| La Gaceta | ✅ skeleton | ✅ `Paginas.tsx:34` | ✅ respaldo | ✅ "Sin conexión…" `DiarioEdicion.tsx:208` | ❌ no muestra "degradada" | — | ✅ |
| Cerebro | ⚠️ global | ✅ `CerebroVacio` | ⚠️ toast | ⚠️ | — | — | ✅ |
| Chat | ✅ "pensando" | ✅ | ✅ cae a búsqueda local `useCerebroChat.ts:78` | ✅ mismo fallback | — | ⚠️ "Iniciá sesión" | ✅ |

**Lectura rápida:** el estado **Error** falta en casi toda la app. Es la prioridad número 1 de UX (ver [roadmap](../01-producto/roadmap.md)).

## Casos excepcionales (encontrados en el código)

| # | Caso | Qué pasa hoy | Qué debería pasar | Dónde |
|---|---|---|---|---|
| 1 | Usar la app después de las 21:00 de Argentina | `HOY` y `getToday()` son UTC → ya es "mañana": hábitos de hoy aparecen sin marcar, la reflexión del cierre queda con la fecha de mañana | Fecha local `America/Argentina/Buenos_Aires` en un solo helper | `constants.tsx:6-7` |
| 2 | Dejar la app abierta pasada la medianoche | `HOY` se calcula **una vez** al cargar el módulo; queda fijo en el día viejo | Recalcular la fecha al volver a la pestaña (`visibilitychange`) | `constants.tsx:6` |
| 3 | Marcar y desmarcar un hábito con racha ≥ 7 | Suma `xp × 1,25` y resta `xp × 1`: queda XP de más | Restar lo que se sumó | `App.tsx:599` |
| 4 | Hábito con racha y más de 90 días | `completedDates` se recorta a 90 días; rachas de más de 90 días se cortan en el cálculo | Guardar `rachaActual` en el doc o recortar a 400 días | `App.tsx:595-596` |
| 5 | Borrar una misión que es prerequisito de otra | La otra queda **bloqueada para siempre** | Limpiar `prerequisitos` en el mismo batch | `deleteMision` `App.tsx:750` |
| 5b | Borrar una misión con sub-misiones | Pide confirmación pero borra **solo la madre**; las hijas quedan con un `parentId` que no existe (huérfanas, fuera del árbol) | Borrar en cascada o subir las hijas un nivel, en un batch | `deleteMision` `App.tsx:750-766` |
| 6 | Borrar una nota linkeada a una persona | El link queda colgado | Limpiar `links` de personas y grupos | `deleteEntradaDiario` `App.tsx:1557` |
| 7 | Un listener falla (permisos, cuota) | `dataReady` nunca llega a 19 → spinner infinito | Callback de error → estado Error | `App.tsx:304-339` |
| 8 | `cerebro_prefs` no cuenta para `dataReady` y `diario_prefs` sí | Inconsistente; `markLoaded` cuenta callbacks, no listeners: un listener que dispara 2 veces puede completar el conteo antes que otro | Contar listeners únicos con un `Set` | `App.tsx:307-308` |
| 9 | Token de Google Calendar vencido | Se borra sin aviso; los eventos de Google desaparecen | Aviso "Se venció la conexión" + Reconectar | `App.tsx:285-290` |
| 10 | Groq caído o sin `GROQ_API_KEY` | El chat responde con búsqueda local (bien) | Además, avisar "Respuesta sin IA" | `useCerebroChat.ts:78` |
| 11 | En `npm run dev` el chat nunca llega a Groq | No hay middleware para `/api/cerebro-chat` | Agregar middleware o documentarlo | `vite.config.ts` |
| 12 | Edición de La Gaceta degradada | Se muestra como si estuviera completa | Chip "Edición parcial" | `server/diario/edicion.ts:181-184` |
| 13 | Dos pestañas abiertas | Firestore multi-tab sincroniza; el modal de Cierre del día puede salir en las dos | Flag de `localStorage` leído también al abrir el modal | `App.tsx:343-351` |
| 14 | Misión con costo: completar y luego cancelar el diálogo | La misión queda completa sin gasto (bien); si se descompleta y recompleta, pregunta de nuevo y puede duplicar el gasto | Guardar `transaccionId` en la misión | `App.tsx:729-739` |
| 15 | Reflexión del cierre con `area: 'general'` | `'general'` no es un `EntradaArea` válido; la nota no aparece en ningún filtro PARA | Usar `'areas'` o un campo `tipo` tipado | `App.tsx:1485` |
| 16 | Exportar datos | Solo exporta hábitos, misiones, eventos, stats y transacciones (5 de 20) | Exportar todo | `exportarDatos` `App.tsx:1802` |
| 17 | Doc de Firestore cerca de 1 MiB | `setsLog`, `capitulos` y `materiales` crecen dentro del doc padre | Subcolección al pasar un umbral | `types.ts:25-34` |

## Cómo usar esta página

- **Diseñador:** cada pantalla nueva entrega los 7 estados en el mockup.
- **Implementador:** cada caso de la tabla tiene que tener un test o un criterio de aceptación antes de cerrarse (ver [criterios-aceptacion.md](../06-calidad/criterios-aceptacion.md)).
- **Revisor:** si una pantalla no tiene estado Error, el PR no pasa.
