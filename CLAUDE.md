# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Descripción del Proyecto

**miAppEstudio** es una web app de productividad y estudio con gamificación al estilo RPG.

Módulos principales:
- **Dashboard:** hero stats, hábitos diarios, agenda del día, misiones activas
- **Agenda/Tareas:** eventos y tareas con recurrencia
- **Gym:** rutinas de entrenamiento
- **RPG:** sistema de stats (fuerza, inteligencia, etc.) con misiones

**Estado:** Prototipo activo. Sin tests, sin CI/CD. Usa Firebase directamente desde el cliente.

**Directorio de trabajo:** Todo el código vive en `web/`. La raíz del repo solo contiene `.git/`, `.gitignore`, `CLAUDE.md`, y `web/`.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Vite 8 + React 19.2 |
| Lenguaje | TypeScript (modo estricto) |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite` plugin, sin config file) |
| Animaciones | `motion/react` (standalone Motion, no framer-motion) |
| Gráficos | Recharts (RadarChart) |
| Auth | Firebase Auth — `signInWithPopup` con `GoogleAuthProvider` |
| Base de datos | Firestore |
| Utilidades | date-fns, lucide-react, clsx, tailwind-merge |

---

## Comandos de Desarrollo

```bash
cd web
npm run dev    # Dev server en http://localhost:5173
npm run build  # Build de producción
npm run lint   # ESLint
```

---

## Arquitectura

### Estructura de `web/`

```
web/
├── src/
│   ├── App.tsx          # Componente principal (toda la UI)
│   ├── App.css          # Estilos globales + Tailwind import
│   ├── main.tsx         # Entry point de Vite
│   ├── lib/

│   │   ├── firebase.ts  # Config Firebase (auth + db)
│   │   └── utils.ts     # Utilidades (cn())
│   └── assets/
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig*.json
```

### Firebase

```ts
import { auth, db } from './lib/firebase';
```

Firestore: colecciones por usuario bajo `usuarios/{uid}/`:
- `eventos` — eventos de agenda
- `habitos` — hábitos diarios (campo `fechaCompletado: string`, `stat: StatKey`)
- `tareas` — tareas con recurrencia (`completedDates: string[]`)
- `rutinas` — rutinas de gym
- `stats` — stats RPG (`{ fuerza: { xp }, inteligencia: { xp }, ... }`)
- `misiones` — misiones RPG (flat list con `parentId`)

### Tailwind v4

No hay archivo `tailwind.config.*`. El plugin se configura solo en `vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite';
// ...plugins: [react(), tailwindcss()]
```
CSS usa `@import "tailwindcss"` en `App.css`.

### Tipos Firestore (en `App.tsx`)

```ts
type FSStatKey = 'fuerza' | 'inteligencia' | 'carisma' | 'agilidad' | 'resistencia' | 'sabiduria'
type FSHabito  = { id, nombre, stat: FSStatKey, fechaCompletado: string }
type FSTarea   = { id, titulo, hora?, recurrence, weekday?, date?, color, completedDates: string[] }
type FSMision  = { id, titulo, completada, parentId: string | null }
type FSStatsDoc = Record<FSStatKey, { xp: number }>
```

`import type { User } from 'firebase/auth'` — User es un tipo TS, debe importarse con `import type` para evitar SyntaxError en Vite.

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
