# Diagramas de secuencia

> Diagrama ④. Las 6 interacciones que cruzan una frontera de red. Cada una cita el código que la implementa.

## Hoy (as-is)

### 1. Login y carga de datos

Código: `front/src/App.tsx:260` (auth) y `App.tsx:302-339` (listeners).

```mermaid
sequenceDiagram
  autonumber
  actor G as Gastón
  participant SPA as App (navegador)
  participant AU as Firebase Auth
  participant FS as Firestore
  G->>SPA: abre la app
  SPA->>AU: onAuthStateChanged
  alt sin sesión
    AU-->>SPA: user = null
    SPA-->>G: LoginScreen
    G->>SPA: Entrar con Google
    SPA->>AU: signInWithPopup(GoogleAuthProvider)
    AU-->>SPA: user
  else con sesión guardada
    AU-->>SPA: user
  end
  SPA-->>G: spinner "Loading hero data…"
  par 20 listeners
    SPA->>FS: onSnapshot(stats/main)
    SPA->>FS: onSnapshot(habitos, misiones, tareas, …)
  end
  FS-->>SPA: primer snapshot de cada uno (desde caché local si hay)
  Note over SPA: dataReady cuando llegan 19 callbacks.<br/>Sin callback de error: si falla un permiso, el spinner no se va.
  SPA-->>G: Dashboard
```

### 2. Completar un hábito (XP atómico)

Código: `toggleHabit`, `App.tsx:585-623`.

```mermaid
sequenceDiagram
  autonumber
  actor G as Gastón
  participant SPA as App
  participant H as helpers.ts
  participant FS as Firestore
  G->>SPA: toca el hábito
  SPA->>H: isHabitActiveToday / isHabitDoneToday
  H-->>SPA: activo, no hecho
  SPA->>H: calcStreak + streakMultiplier
  H-->>SPA: racha 8, ×1.25
  SPA->>SPA: xpFinal = round(xpValue × mult)
  SPA->>FS: writeBatch: habitos/id.completedDates + stats/main.stat.xp increment(+xp)
  FS-->>SPA: commit ok (local primero, después servidor)
  alt subió de nivel
    SPA-->>G: overlay de level up + confetti
  else
    SPA-->>G: toast "+25 XP FUE (×1.25)"
  end
  FS-->>SPA: onSnapshot actualiza habitos y stats
```

### 3. Chat del Segundo Cerebro

Código: `hooks/useCerebroChat.ts:31-110`, `lib/cerebro-api.ts:20-41`, `api/cerebro-chat.ts:98-169`.

```mermaid
sequenceDiagram
  autonumber
  actor G as Gastón
  participant CH as CerebroChat + useCerebroChat
  participant BU as cerebro-busqueda.ts
  participant API as Vercel /api/cerebro-chat
  participant IT as Identity Toolkit
  participant GQ as Groq
  G->>CH: escribe una pregunta
  CH->>BU: buscarRelevantes(pregunta)
  BU-->>CH: top 3 notas, personas y grupos
  CH->>API: POST {userMessage, history ≤10, contexto} + Bearer ID token
  API->>IT: accounts:lookup(idToken)
  IT-->>API: 200 válido
  API->>GQ: chat/completions (GROQ_API_KEY, llama-3.3-70b)
  alt Groq responde
    GQ-->>API: mensaje
    API-->>CH: {success: true, message}
  else error o sin key
    API-->>CH: 4xx o 5xx
    CH->>BU: responderConMisDatos(pregunta)
    BU-->>CH: respuesta armada con datos locales
  end
  CH-->>G: respuesta (historial en localStorage)
```

### 4. Edición diaria de La Gaceta

Código: `utils/edicion.ts:250-296` (cliente), `api/edicion.ts`, `server/diario/edicion.ts:132-216`.

```mermaid
sequenceDiagram
  autonumber
  actor G as Gastón
  participant SPA as DiarioEdicion
  participant LS as localStorage
  participant CDN as CDN de Vercel
  participant FN as /api/edicion
  participant SRC as RSS + ESPN + Jolpica
  G->>SPA: abre Diario
  SPA->>LS: leerEdicionCache()
  LS-->>SPA: edición de hoy o nada
  SPA-->>G: muestra caché o seed de respaldo
  SPA->>CDN: GET /api/edicion (timeout 30 s)
  alt CDN tiene copia fresca (≤30 min)
    CDN-->>SPA: edición
  else
    CDN->>FN: invoca la función
    FN->>FN: caché en memoria vigente y de hoy?
    FN->>SRC: ~28 feeds en pool de 10 (5 s c/u) + deportes, presupuesto 20 s
    SRC-->>FN: XML + JSON (algunos pueden fallar)
    FN->>FN: parsear, deduplicar, completar imágenes, marcar degradada
    FN-->>CDN: edición + Cache-Control (1800 s o 60 s si degradada)
    CDN-->>SPA: edición
  end
  SPA->>SPA: elegirEdicion(actual, nueva)
  SPA->>LS: guarda caché
  SPA-->>G: edición rankeada por gustos (tagScores)
```

### 5. Conectar Google Calendar

Código: `connectGCal`, `App.tsx:1784-1799` y el fetch en `App.tsx:280-299`.

```mermaid
sequenceDiagram
  autonumber
  actor G as Gastón
  participant SPA as App
  participant AU as Firebase Auth
  participant SS as sessionStorage
  participant GC as Google Calendar API
  G->>SPA: Ajustes, Conectar Calendar
  SPA->>AU: reauthenticateWithPopup(scope calendar.readonly)
  AU-->>SPA: accessToken (sin refresh token)
  SPA->>SS: gcal_token + gcal_token_exp = ahora + 3500 s
  SPA->>GC: GET events (-7 días a +60 días, máx 500)
  alt 200
    GC-->>SPA: items
    SPA-->>G: eventos de Google junto a los propios
  else 401 token vencido
    GC-->>SPA: 401
    SPA->>SS: borra el token
    SPA-->>G: sin aviso, desaparecen los eventos de Google
  end
```

### 6. Agente Gmail → Inbox → procesar

Código: `docs/INBOX_AGENTE.md` (contrato del agente) y `procesarInbox`, `App.tsx:1669-1726`.

```mermaid
sequenceDiagram
  autonumber
  participant AG as Agente externo
  participant FS as Firestore
  participant SPA as App
  actor G as Gastón
  AG->>FS: set inbox/gmail-id (Admin SDK, saltea las reglas)
  FS-->>SPA: onSnapshot(inbox) trae el ítem nuevo
  SPA-->>G: contador en Inbox
  G->>SPA: procesar como tarea, misión, nota, idea, persona o grupo
  SPA->>FS: writeBatch: crea destino + inbox.procesado = true
  alt commit ok
    FS-->>SPA: ok
    SPA-->>G: toast "Guardado como tarea"
  else falla
    FS-->>SPA: error
    SPA-->>G: toast "Error al procesar el ítem" (no queda nada a medias)
  end
```

## Objetivo (to-be)

Lo que cambia en cada secuencia:

| # | Cambio |
|---|---|
| 1 | Cada listener tiene callback de error → pantalla de error con "Reintentar". Los listeners se abren por feature, no todos al login. |
| 2 | El cálculo pasa a `CasoCompletarHabito` (ver [clases.md](clases.md)). La fecha sale de `hoyLocal()`, no de UTC. |
| 3 | El backend verifica que el token sea **del proyecto** (`aud`/`iss`) con firebase-admin, no solo que sea válido. Límite de pedidos por usuario. |
| 4 | Sin cambios de fondo. Mostrar "edición parcial" cuando `degradada` sea true. |
| 5 | Ante 401: avisar "Se venció la conexión con Calendar" con botón para reconectar. |
| 6 | El agente escribe con un esquema validado (mismo conversor que la app). |
