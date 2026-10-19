# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Descripción del Proyecto

**miAppEstudio** es una web app de productividad y estudio con gamificación al estilo RPG.

Módulos principales:
- **Dashboard:** hero stats, hábitos diarios, agenda del día, misiones activas
- **Calendar:** eventos y tareas con recurrencia + integración Google Calendar
- **Gym:** rutinas de entrenamiento (tabs: entreno / comida)
- **Attributes:** stats RPG con sub-módulos por stat (inteligencia → biblioteca/facultad; carisma → objetivos)
- **Habits (Quests):** hábitos con recurrencia y XP configurable
- **Missions:** árbol de misiones jerárquico (epic → milestone → task)
- **Settings:** configuración + conexión Google Calendar
- **Diario (La Gaceta):** edición diaria por páginas con noticias en vivo (RSS de medios + resultados deportivos), personalizada con 👍/👎 y guardados

**Estado:** Prototipo activo. Sin tests, sin CI/CD. Usa Firebase directamente desde el cliente.

**Directorio raíz del proyecto:** `package.json` y todo el código fuente están en la raíz del repo (directorio `front/src/`). No existe carpeta `web/`.

---

## Planificación y documentación

**Antes de cambiar algo, leer [`docs/CONTRATO-AGENTES.md`](docs/CONTRATO-AGENTES.md)**: roles, reglas no negociables, plantillas de handoff y Definition of Done para cualquier agente de IA.

`docs/` tiene la planificación completa (hoy vs objetivo): producto, UX, design system, arquitectura, seguridad, calidad, operaciones y decisiones (ADRs). Índice en [`docs/README.md`](docs/README.md). Para verlo todo junto con los diagramas: `npm run docs:site` → `docs/site/index.html`.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Vite 8 + React 19.2 |
| Lenguaje | TypeScript 6 (`strict` es el default de TS 6 y compila con 0 errores; no está declarado explícito en `tsconfig.app.json`) |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite` plugin, sin config file) |
| Animaciones | `motion/react` (standalone Motion, no framer-motion) |
| Gráficos | Recharts (RadarChart) |
| Auth | Firebase Auth — `signInWithPopup` con `GoogleAuthProvider` |
| Base de datos | Firestore (listeners en tiempo real con `onSnapshot`) |
| Utilidades | date-fns, lucide-react, clsx, tailwind-merge |

---

## Comandos de Desarrollo

```bash
npm run dev      # Dev server en http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # Preview del build de producción
```

Los comandos se ejecutan desde la raíz del repo (donde está `package.json`).

---

## Arquitectura

### Estructura de `front/src/`

```
front/src/
├── App.tsx              # Componente raíz: todo el estado global y lógica de negocio
├── index.css            # Tema global: @import "tailwindcss" + tokens @theme del sistema de diseño
├── main.tsx             # Entry point de Vite
├── types.ts             # Todos los tipos FS y UI (FSStatKey, FSHabito, Stat, etc.)
├── lib/
│   ├── firebase.ts      # Config Firebase (auth + db)
│   └── utils.ts         # cn() con clsx + tailwind-merge
├── utils/
│   ├── constants.tsx    # HOY, FS_KEYS, STAT_META, DIAS_CORTO, DIAS_LETRA, ESTADO_LIBRO_META, MATERIAL_ICON
│   └── helpers.ts       # xpLevel, statsFromDoc, buildTree, isHabitActiveToday/Done, habitRecurrenceLabel, youtubeEmbedUrl
└── components/
    ├── LoginScreen.tsx
    ├── MisionCard.tsx
    ├── ProgressBar.tsx
    ├── MissionNodeComp.tsx
    ├── CapituloRow.tsx      # Fila de capítulo en biblioteca
    └── EjercicioRow.tsx     # Fila de ejercicio en rutina gym
```

### Patrón de App.tsx

`App.tsx` es un único componente gigante con:
1. **Estado Firestore** — un `useState` por colección, poblado via `onSnapshot`
2. **Estado UI** — `tab` (navegación principal), modals, forms
3. **Handlers async** — todas las escrituras a Firestore
4. **Render condicional por tab** — `{tab === 'dashboard' && (...)}`

Los componentes en `components/` son presentacionales puros; los componentes en `utils/` son helpers de lógica pura. El único custom hook es `hooks/useCerebroChat.ts` (chat del Segundo Cerebro).

Este patrón es el **estado actual**, no el objetivo: el plan para partir `App.tsx` en `features/`, `domain/`, `data/` y `ui/` está en [ADR-0005](docs/08-decisiones/ADR-0005-partir-app-tsx.md) y [`docs/04-arquitectura/carpetas-objetivo.md`](docs/04-arquitectura/carpetas-objetivo.md).

### Firebase

```ts
import { auth, db } from './lib/firebase';
```

Todas las colecciones viven bajo `usuarios/{uid}/`:

| Colección | Tipo | Notas |
|---|---|---|
| `stats/main` | `FSStatsDoc` | Doc único; `{ fuerza: { xp }, salud: { xp }, ... }` |
| `habitos` | `FSHabito[]` | `completedDates: string[]` para recurrencia semanal |
| `eventos` | `FSEvento[]` | `detalle?` (qué es) y `origen?` (de dónde vino), se ven al expandir |
| `tareas` | `FSTarea[]` | `completedDates: string[]`; `detalle?` y `origen?` (los carga el Segundo Cerebro) |
| `misiones` | `FSMision[]` | Flat list con `parentId` y `orden` |
| `rutinas` | `FSRutina[]` | Ejercicios embebidos en el doc |
| `libros` | `FSLibro[]` | Capítulos embebidos; `xpPorCapitulo` configurable |
| `materias` | `FSMateria[]` | Materiales, tareas y exámenes embebidos |
| `diario` | `FSEntradaDiario[]` | Notas; se editan desde Segundo Cerebro |
| `diario_prefs/main` | `FSDiarioPrefs` | Doc único: reacciones, tagScores, guardados, deportes/equipos. Escribir siempre con `setDoc(..., { merge: true })` |
| `objetivos_cha` | `FSObjetivoCHA[]` | Objetivos de Carisma |
| `cerebro_prefs/main` | `{ relaciones: FSRelacion[] }` | Tipos de relación de Personas editables; si no existe se usa `RELACION_META`. Escribir con `setDoc(..., { merge: true })` |

### Tipos (en `types.ts`)

```ts
type FSStatKey = 'fuerza' | 'salud' | 'inteligencia' | 'agilidad' | 'carisma' | 'fe'
```

`import type { User } from 'firebase/auth'` — siempre `import type` para evitar SyntaxError en Vite.

### Sistema de XP / Niveles

Progresión incremental: cada nivel requiere 100 XP más que el anterior (L1→L2: 100, L2→L3: 200, …). Implementado en `helpers.ts:xpLevel()`.

### Google Calendar

Integración opcional. El token OAuth se obtiene vía `reauthenticateWithPopup` con scope `calendar.readonly` y se almacena en `sessionStorage` con expiración (`gcal_token` + `gcal_token_exp` = ahora + 3500 s; no hay refresh token y se pierde al cerrar la pestaña). Se usa para mostrar eventos en la vista Calendar junto a los eventos propios de Firestore.

### Tailwind v4

Sin `tailwind.config.*`. Plugin configurado en `vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite';
// plugins: [react(), tailwindcss()]
```
CSS usa `@import "tailwindcss"` en `index.css` (lo importa `main.tsx`; `App.css` no se usa).

### Sistema de diseño

Basado en el diseño de Stitch "RPG Productivity & Study System". **Solo modo oscuro** (`<html class="dark">`).

- Tokens en el bloque `@theme` de `index.css`: `surface`, `surface-container-{lowest,low,,high,highest}`, `on-surface`, `on-surface-variant`, `outline`, `primary` / `primary-container`, `secondary` (XP, éxito), `tertiary` (épico), `error`, `warning`.
- Fuentes: `font-sans` = Plus Jakarta Sans (texto), `font-label` = Space Grotesk (números, chips, labels; usar `tabular-nums`).
- Las paletas `slate`, `blue`, `emerald`/`green`, `violet`/`purple` y `red` están remapeadas a esos tonos para que el código viejo herede el look. **Código nuevo: usar los tokens semánticos**, no `slate-*`/`blue-*`.
- Profundidad con capas de superficie y sombras, no con bordes. Recharts usa hex fijos: alinearlos con los tokens.
- **Dirección aprobada para migrar: "Gremio"** (claymorphism oscuro, ámbar + verde, Nunito + DM Sans), ver [ADR-0004](docs/08-decisiones/ADR-0004-estilo-visual.md) y [`docs/03-design-system/`](docs/03-design-system/). La migración es la fase P3 del roadmap; hasta entonces, el código nuevo usa los tokens semánticos actuales (mantienen sus nombres) y el componente `Button` cuando exista. Botones rellenos: texto oscuro (`on-primary`) sobre el color claro, nunca `text-white` sobre `blue-600` (contraste 3,17:1).

---

## Convenciones

- **UI en español**, comentarios en español
- Solo componentes funcionales, TypeScript estricto (evitar `any`)
- Mensajes de commit en español, estilo informal: "Agrego X", "Corrijo Y"
- Sin prefijos convencionales (`feat:`, `fix:`, etc.)
- Rama principal: `main`

---

## Lo Que No Existe

- Tests
- CI/CD
- `firestore.rules` en el repo (las reglas viven solo en la consola de Firebase; ver [ADR-0006](docs/08-decisiones/ADR-0006-firestore-rules.md))
- Backend propio (solo dos funciones serverless en Vercel: `api/edicion.ts`, ver abajo, y `api/cerebro-chat.ts`, chat con Groq, ver [`docs/07-operaciones/segundo-cerebro.md`](docs/07-operaciones/segundo-cerebro.md))
- i18n

Variables de entorno: sí existen. `VITE_FIREBASE_*` (config web, va al navegador) en `.env.local`, y `GROQ_API_KEY` / `GROQ_MODEL` **solo en Vercel**. Ejemplo en `.env.local.example`. Nunca un secreto con prefijo `VITE_`.

---

## Diario: edición en vivo

- `api/edicion.ts` — función serverless de Vercel (`GET /api/edicion`). Cacheada en el CDN 30 min (`s-maxage`), igual para todos los usuarios.
- `server/diario/` — lógica compartida: `fuentes.ts` (feeds por sección), `xml.ts` (parser RSS/Atom con `fast-xml-parser`), `red.ts` (timeouts, pool), `deportes.ts` (ESPN + Jolpica F1), `edicion.ts` (armado), `tipos.ts` y `fecha.ts` (también los usa el cliente).
- En `npm run dev` la misma ruta la sirve un middleware de `vite.config.ts`. Imports relativos dentro de `api/` y `server/` con extensión `.js` (proyecto ESM).
- Cliente: `front/src/utils/edicion.ts` (caché local, respaldo con `diarioSeed.ts`, ranking y selección por página) y `front/src/components/diario/` (piezas y páginas).

