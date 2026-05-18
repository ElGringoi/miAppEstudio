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

**Estado:** Prototipo activo. Sin tests, sin CI/CD. Usa Firebase directamente desde el cliente.

**Directorio raíz del proyecto:** `package.json` y todo el código fuente están en la raíz del repo (directorio `front/src/`). No existe carpeta `web/`.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Vite 8 + React 19.2 |
| Lenguaje | TypeScript 6 (modo estricto) |
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
├── App.css              # Estilos globales + @import "tailwindcss"
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
    ├── StatCard.tsx
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

Los componentes en `components/` son presentacionales puros; los componentes en `utils/` son helpers de lógica pura. No hay custom hooks.

### Firebase

```ts
import { auth, db } from './lib/firebase';
```

Todas las colecciones viven bajo `usuarios/{uid}/`:

| Colección | Tipo | Notas |
|---|---|---|
| `stats/main` | `FSStatsDoc` | Doc único; `{ fuerza: { xp }, salud: { xp }, ... }` |
| `habitos` | `FSHabito[]` | `completedDates: string[]` para recurrencia semanal |
| `eventos` | `FSEvento[]` | — |
| `tareas` | `FSTarea[]` | `completedDates: string[]` |
| `misiones` | `FSMision[]` | Flat list con `parentId` y `orden` |
| `rutinas` | `FSRutina[]` | Ejercicios embebidos en el doc |
| `libros` | `FSLibro[]` | Capítulos embebidos; `xpPorCapitulo` configurable |
| `materias` | `FSMateria[]` | Materiales, tareas y exámenes embebidos |
| `diario` | `FSEntradaDiario[]` | UI pendiente de implementar |
| `objetivos_cha` | `FSObjetivoCHA[]` | Objetivos de Carisma |

### Tipos (en `types.ts`)

```ts
type FSStatKey = 'fuerza' | 'salud' | 'inteligencia' | 'agilidad' | 'carisma' | 'fe'
```

`import type { User } from 'firebase/auth'` — siempre `import type` para evitar SyntaxError en Vite.

### Sistema de XP / Niveles

Progresión incremental: cada nivel requiere 100 XP más que el anterior (L1→L2: 100, L2→L3: 200, …). Implementado en `helpers.ts:xpLevel()`.

### Google Calendar

Integración opcional. El token OAuth se obtiene vía `reauthenticateWithPopup` con scope `calendar.readonly` y se almacena en `localStorage` con expiración (`gcal_token` + `gcal_token_exp`). Se usa para mostrar eventos en la vista Calendar junto a los eventos propios de Firestore.

### Tailwind v4

Sin `tailwind.config.*`. Plugin configurado en `vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite';
// plugins: [react(), tailwindcss()]
```
CSS usa `@import "tailwindcss"` en `App.css`.

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
- Variables de entorno (`.env`)
- Backend propio / REST API
- i18n
- Custom hooks (toda la lógica está en `App.tsx`)
