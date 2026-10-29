# Runbook: qué hacer cuando algo falla

> Formato: **síntoma → causa probable → cómo verificar → arreglo**. Primero buscá el síntoma en la tabla de abajo y después andá a la sección.

| Síntoma | Sección |
|---|---|
| La app queda en "Loading hero data…" | [Firestore permission-denied](#firestore-permission-denied) |
| El chat responde raro o "con tus datos" siempre | [Groq caído o sin key](#groq-caído-o-sin-key) |
| La Gaceta muestra ensayos viejos o pocas notas | [La Gaceta degradada o vacía](#la-gaceta-degradada-o-vacía) |
| Desaparecieron los eventos de Google | [Token de Calendar vencido](#token-de-calendar-vencido) |
| Errores de "quota exceeded" | [Cuota de Firestore](#cuota-de-firestore) |
| El sitio no carga o da 404/500 tras un push | [Deploy roto](#deploy-roto-en-vercel) |

## Firestore permission-denied

- **Síntoma:** spinner "Loading hero data…" para siempre después de iniciar sesión.
- **Causa probable:** las reglas de Firestore rechazan alguna colección (por ejemplo, después de cambiar reglas en la consola). Como ningún `onSnapshot` tiene callback de error (`App.tsx:304-339`), la app nunca se entera.
- **Verificar:** DevTools → Console: buscar `FirebaseError: Missing or insufficient permissions`. Firebase Console → Firestore → Reglas: ver la fecha del último cambio.
- **Arreglo:** volver a la versión anterior de las reglas (la consola guarda historial) o aplicar la propuesta de [firestore-rules.md](../05-seguridad/firestore-rules.md). Solución de fondo: callback de error en cada listener (P1).

## Groq caído o sin key

- **Síntoma:** el chat siempre contesta con respuestas armadas desde las notas, sin redactar.
- **Causa probable:** `GROQ_API_KEY` vencida o no configurada, cuota de Groq agotada, o Groq caído.
- **Verificar:** DevTools → Network → `cerebro-chat`: el código (500 = falta key, 502 = error de Groq). Vercel → proyecto → Logs → filtrar por `/api/cerebro-chat`. Estado de Groq: [groqstatus.com](https://groqstatus.com).
- **Arreglo:** regenerar la key en Groq y actualizarla en Vercel → Environment Variables → Redeploy. Si es cuota, esperar el reset o cambiar `GROQ_MODEL` a uno más chico.

## La Gaceta degradada o vacía

- **Síntoma:** aviso "Sin conexión: edición de respaldo…" con red, o secciones con 0–1 notas.
- **Causa probable:** más de la mitad de los feeds fallaron, o ESPN/Jolpica no respondieron (`server/diario/edicion.ts:181-184`). La función cachea la edición degradada solo 60 s y vuelve a intentar.
- **Verificar:** abrir `https://mi-app-estudio-gamma.vercel.app/api/edicion` y mirar `fuentesOk` / `fuentesTotal`. Vercel Logs: buscar `[diario] no se pudo parsear`.
- **Arreglo:** si un medio cambió la URL del feed, actualizarla en `server/diario/fuentes.ts`. Si falla todo, revisar que la función no pase los 30 s (`vercel.json`).

## Token de Calendar vencido

- **Síntoma:** los eventos de Google desaparecen del Calendario sin aviso.
- **Causa probable:** el access token dura ~1 h (`gcal_token_exp` = ahora + 3500 s) y no hay refresh token. Un 401 lo borra en silencio (`App.tsx:285-290`). También se pierde al cerrar la pestaña (`sessionStorage`).
- **Verificar:** DevTools → Application → Session Storage: si no hay `gcal_token`, está desconectado.
- **Arreglo:** Ajustes → Conectar Google Calendar de nuevo. Solución de fondo: aviso "Se venció la conexión" + botón Reconectar (P2).

## Cuota de Firestore

- **Síntoma:** errores `resource-exhausted` o `quota exceeded` en la consola.
- **Causa probable:** plan Spark (gratis): 50 000 lecturas y 20 000 escrituras por día. Con 20 listeners abiertos, cada apertura de la app lee todas las colecciones completas.
- **Verificar:** Firebase Console → Firestore → Uso.
- **Arreglo inmediato:** esperar al reset diario (medianoche hora del Pacífico). De fondo: listeners por pantalla ([rendimiento-confiabilidad.md](../06-calidad/rendimiento-confiabilidad.md)).

## Deploy roto en Vercel

- **Síntoma:** la URL de producción da error o muestra una versión vieja.
- **Causa probable:** falló `tsc -b` o `vite build` en Vercel (por ejemplo, una dependencia no declarada o un error de tipos).
- **Verificar:** Vercel → Deployments → el último → Build Logs. Localmente: `npm ci` y después `npm run build`.
- **Arreglo:** Vercel → Deployments → el último que funcionó → **Promote to Production** (rollback inmediato). Después arreglar el build en una rama.

## Contactos y accesos

| Servicio | Consola |
|---|---|
| Vercel | vercel.com → proyecto `mi-app-estudio` |
| Firebase | console.firebase.google.com → proyecto de `VITE_FIREBASE_PROJECT_ID` |
| Groq | console.groq.com |
| Google Cloud (OAuth de Calendar) | console.cloud.google.com → APIs y servicios |
