# Privacidad

> Qué datos personales guarda la app, dónde quedan, quién más los ve y cómo se borran. Aplica la Ley 25.326 de Protección de Datos Personales (Argentina) como referencia de buenas prácticas, aunque hoy la app la usa una sola persona.

## Hoy (as-is)

### Inventario de datos sensibles

| Dato | Dónde vive | Sensibilidad | Nota |
|---|---|---|---|
| Teléfono, email, notas, deudas de **otras personas** | `personas` (`types.ts:88-110`) | **Alta** — son datos de terceros | Nunca dieron consentimiento |
| Movimientos de plata, sueldo, ahorros | `transacciones`, `sueldos_meta`, `metas_ahorro` | **Alta** | |
| Notas personales y reflexiones del cierre del día | `diario` | **Alta** | |
| Mails de Gmail (asunto, remitente, texto) | `inbox` (los escribe el agente) | **Alta** | Contenido de terceros |
| Hábitos, entrenamiento, estudio | `habitos`, `rutinas`, `libros`, `materias` | Media | Puede revelar salud o religión (stat **Fe**) |
| Gustos de noticias | `diario_prefs` | Baja | |
| Perfil de Google (nombre, foto, email) | Firebase Auth | Media | |

### Dónde quedan copias

| Lugar | Qué | Se borra al cerrar sesión |
|---|---|---|
| Firestore (Google Cloud) | todo | — |
| IndexedDB del navegador (`persistentLocalCache`, `lib/firebase.ts:21`) | copia completa de todas las colecciones | ❌ no |
| `localStorage.cerebro_chat_history` | conversaciones con el chat | ❌ no |
| `localStorage` caché de La Gaceta | noticias (no personal) | ❌ no |
| `localStorage.cierre_dia_YYYY-MM-DD` | flag | ❌ no |
| `sessionStorage.gcal_token` | token de Calendar | ✅ al cerrar la pestaña |

### Qué sale a terceros

| Tercero | Qué recibe | Cuándo | Código |
|---|---|---|---|
| **Groq** | Pregunta + historial (≤ 10 mensajes) + top 3 notas (500 caracteres c/u), personas (nombre, notas 300 caracteres, tags, último contacto) y grupos | Cada pregunta al chat | `api/cerebro-chat.ts:52-79` |
| Google Calendar | El access token, para leer eventos | Al conectar | `App.tsx:280-299` |
| Medios RSS / ESPN / Jolpica | Nada personal (los pide el servidor) | Cada edición | `server/diario/` |
| Vercel | Logs de las funciones (pueden incluir errores con texto) | Cada pedido a `/api/*` | `console.error` en `api/` |

### Retención

- `completedDates` de hábitos y tareas se recortan a **90 días** (`App.tsx:595-596`). Es el único límite de retención que existe.
- Todo lo demás se guarda para siempre hasta que se borra a mano.

### Exportar y borrar

- **Exportar** (`exportarDatos` en `App.tsx`) baja un JSON con **las 20 fuentes** de datos y `schemaVersion` (desde P1; antes eran 5).
- **Borrar cuenta:** no existe.

## Objetivo (to-be)

| Principio | Cambio concreto |
|---|---|
| Minimización | El chat manda a Groq solo lo necesario; las personas van **sin** teléfono ni email (hoy ya se excluyen: `ContextoCerebro`, `types.ts:211-216`). Agregar un switch "No mandar personas al chat". |
| Transparencia | Pantalla en Ajustes: "Qué datos salen de la app" con esta tabla resumida. |
| Control local | Al cerrar sesión: `clearIndexedDbPersistence(db)` + borrar `cerebro_chat_history` y flags. |
| Portabilidad | Exportar **todas** las colecciones en un JSON con `schemaVersion`. |
| Derecho al olvido | "Borrar mi cuenta": borra `usuarios/{uid}/**` en batches de 450 y después el usuario de Auth. |
| Terceros | Personas: campo opcional "consentimiento" o al menos no guardar teléfono/email si no se usan. |
| Logs | No loguear contenido de mensajes en `api/cerebro-chat.ts`; solo códigos de error. |

## Acciones

| Prioridad | Acción | Esfuerzo |
|---|---|---|
| P1 | Limpiar IndexedDB y `localStorage` al cerrar sesión | 30 min |
| P1 | Exportar todas las colecciones | 1 h |
| P2 | Borrar cuenta completa | 2 h |
| P2 | Switch "No mandar personas al chat" + pantalla de transparencia | 1 h |
