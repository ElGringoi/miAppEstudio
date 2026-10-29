# Rendimiento y confiabilidad

## Hoy (as-is)

### Rendimiento

| Hallazgo | Medido / evidencia | Impacto |
|---|---|---|
| **Un solo bundle de JS** de 1629 KB (468 KB gzip) | `npm run build`, 2026-10-19; Vite avisa "chunks larger than 500 kB" | La primera carga en 4G baja todo: Recharts, Motion, La Gaceta, Billetera, aunque se abra solo el Dashboard |
| **20 listeners al arrancar** | `App.tsx:304-339` | 20 lecturas iniciales + una por cada cambio, en todas las colecciones, siempre |
| **`App.tsx` re-renderiza todo** | 88 `useState` en un componente; cualquier snapshot vuelve a calcular la lógica derivada de las 10 pantallas | Toques más lentos a medida que crecen los datos |
| Recharts y `react-calendar-heatmap` en el bundle principal | `package.json` | Pesan aunque no se vea Atributos |
| Fuentes de Google: 3 familias y 14 pesos en un pedido, con `preconnect` y `display=swap` | `index.html:8-10` | ✅ Sin bloqueo; Newsreader (6 pesos) solo la usa La Gaceta |
| La Gaceta: caché en memoria 30 min + CDN `s-maxage=1800, stale-while-revalidate=86400` | `server/diario/edicion.ts:205-216`, `api/edicion.ts:12-15` | ✅ Bien resuelto |
| La Gaceta: pool de 10 pedidos, 5 s por feed, presupuesto total 20 s | `server/diario/edicion.ts:137-140` | ✅ Acotado |

### Confiabilidad

| Hallazgo | Evidencia | Impacto |
|---|---|---|
| **Ningún `onSnapshot` tiene callback de error** | `App.tsx:304-339` | Un `permission-denied` o falta de cuota deja el spinner para siempre |
| **`dataReady` cuenta callbacks, no listeners** | `markLoaded`, `App.tsx:307-308` | Un listener que dispara dos veces (caché + servidor) puede completar el 19 antes que otro → pantalla con datos vacíos un instante |
| **"Hoy" es UTC** y se calcula una sola vez | `constants.tsx:6-7` | Después de las 21:00 de Argentina la app vive en mañana; si queda abierta de un día para otro, `HOY` no cambia |
| Asimetría de XP al desmarcar | `App.tsx:599` | Con racha, el XP total crece con marcar/desmarcar |
| Firestore con `persistentLocalCache` + multi-tab | `lib/firebase.ts:21` | ✅ La app funciona offline y sincroniza al volver |
| Escrituras compuestas atómicas | `writeBatch` en hábitos, inbox, grupos, tags (en lotes de 450); `runTransaction` en gym y libros | ✅ No quedan estados a medias |
| Chat con fallback local | `useCerebroChat.ts:78` | ✅ Si Groq cae, responde con datos propios |
| La Gaceta con 3 niveles de respaldo | caché local → `/api/edicion` → `diarioSeed` | ✅ Nunca queda vacía |
| Errores solo en `console.error` + toast de 3,5 s | ~90 llamadas a `showToast` | No hay registro de errores en producción |

## Objetivo (to-be)

### Rendimiento

| Cambio | Cómo | Meta |
|---|---|---|
| Code-splitting por pantalla | `React.lazy(() => import('./features/gym'))` + `Suspense` por tab | JS inicial ≤ 250 KB gzip ([R1](criterios-objetivos.md)) |
| Listeners por pantalla | `useColeccion` se suscribe al montar la feature y se desuscribe al salir; Dashboard solo `stats`, `habitos`, `tareas`, `eventos`, `misiones`, `rocas` | ≤ 6 listeners al arrancar |
| Estado por feature | sacar los 88 `useState` de `App.tsx` a cada feature | un snapshot de `transacciones` no re-renderiza Gym |
| Recharts lazy | importar solo en Atributos | −100 KB gzip aprox. (a confirmar con `vite-bundle-visualizer`) |
| Fuentes | recortar a los pesos usados; cargar Newsreader solo al abrir La Gaceta | menos KB de fuentes en la primera carga |

### Confiabilidad

| Cambio | Cómo |
|---|---|
| Error en cada listener | `onSnapshot(ref, onData, onError)`; `onError` pone el estado de la feature en `error` con el código |
| Carga por listener | `Set` de listeners que ya respondieron; listo cuando `size === total` |
| Fecha local única | `hoyLocal()` con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })`; recalcular en `visibilitychange` ([ADR-0007](../08-decisiones/ADR-0007-fecha-local.md)) |
| XP simétrico | guardar `xpPorFecha: { 'YYYY-MM-DD': n }` en el hábito y restar ese valor |
| Registro de errores | capturar `window.onerror` y errores de Firestore en una colección `errores` propia (o Sentry plan gratis) con fecha, pantalla y código |
| Indicador offline | `navigator.onLine` + eventos `online`/`offline` → chip global |

## Presupuestos (alertas)

| Recurso | Límite | Qué hacer si se pasa |
|---|---|---|
| JS inicial | 250 KB gzip | revisar el último import pesado en `vite-bundle-visualizer` |
| Lecturas de Firestore por día | 50 000 (plan Spark) | revisar listeners abiertos; ver [runbook](../07-operaciones/runbook.md) |
| Duración de `/api/edicion` | 30 s (`vercel.json`) | bajar `PRESUPUESTO_MS` o la cantidad de feeds |
| Tamaño de un doc | 1 MiB (límite de Firestore) | mover arrays embebidos a subcolecciones |
