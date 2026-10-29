# Carpetas objetivo y cómo partir `App.tsx`

> Cómo pasar de un `App.tsx` de 4744 líneas a features independientes, **sin reescribir la app**. Decisión: [ADR-0005](../08-decisiones/ADR-0005-partir-app-tsx.md).

## Hoy (as-is)

```
front/src/
├── App.tsx          4744  estado de 10 tabs, 88 useState, 20 listeners, ~70 handlers, 12 formularios
├── components/      31 archivos + diario/ (presentacionales, reciben props de App)
├── hooks/           useCerebroChat.ts (único hook)
├── lib/             firebase.ts, utils.ts (cn), cerebro-api.ts
├── utils/           helpers, constants, edicion, diarioSeed, cerebro-busqueda, markdown, muscleMap, diarioArte
└── types.ts         todos los tipos
```

## Objetivo (to-be)

```
front/src/
├── app/
│   ├── AppShell.tsx         layout, sidebar, bottom nav, toasts, level-up
│   ├── navegacion.ts        NAV, PAGE_TITLE (hoy App.tsx:74-91)
│   └── providers.tsx        AuthProvider, UsuarioProvider (uid)
├── features/
│   ├── dashboard/           Dashboard.tsx + widgets (Bitácora, Rocas)
│   ├── habitos/             Quests: lista, formulario, heatmap
│   ├── misiones/            árbol, formulario, prerequisitos
│   ├── calendario/          agenda semanal + Google Calendar
│   ├── gym/                 entreno, comida, BodyMap, timer
│   ├── atributos/           radar, biblioteca, facultad
│   ├── billetera/           transacciones, presupuestos, metas
│   ├── diario/              La Gaceta (ya casi aislada)
│   ├── cerebro/             inbox, notas, personas, grupos, chat (ya casi aislado)
│   └── ajustes/
│       cada feature: Pantalla.tsx, componentes/, useFeature.ts, index.ts
├── domain/                  funciones puras + *.test.ts
│   ├── xp.ts                xpLevel, nivelPrincipal, rango, clase, multiplicador
│   ├── recurrencia.ts       activoHoy, hechoHoy, racha
│   ├── misiones.ts          buildTree, bloqueada
│   └── fecha.ts             hoyLocal() — reemplaza HOY/getToday UTC
├── data/
│   ├── firestore.ts         instancia + rutas tipadas usuarios/{uid}/...
│   ├── conversores.ts       withConverter por colección (validación)
│   ├── repos/               habitos.ts, misiones.ts, stats.ts, …
│   └── useColeccion.ts      hook genérico: { datos, estado, error }
├── ui/                      Button, IconButton, Chip, SegmentedTabs, Card, Modal, Toast, EmptyState, Spinner, FormField
├── shared/                  (o raíz /shared) tipos y fechas que usan front y server
└── main.tsx
```

## Orden de migración (cada paso deja la app andando)

| Paso | Qué se mueve | Riesgo | Cómo se verifica |
|---|---|---|---|
| 1 | `domain/` con las funciones de `helpers.ts` + tests Vitest | bajo | tests verdes, `App.tsx` importa desde `domain/` |
| 2 | `ui/` con `Button`, `Modal`, `Toast`, `EmptyState` (ver [componentes](../03-design-system/componentes.md)) | bajo | capturas antes/después iguales |
| 3 | `data/useColeccion` con callback de error, usado por 1 colección | medio | forzar un permission-denied y ver la pantalla de error |
| 4 | `features/diario` y `features/cerebro` (ya casi aisladas) | bajo | navegar las dos tabs |
| 5 | `features/habitos` + `features/misiones` | medio | E2E: completar hábito suma XP |
| 6 | El resto de features, una por PR | medio | E2E de cada módulo |
| 7 | `App.tsx` queda como `AppShell` < 150 líneas | — | `wc -l` |

Regla para cada PR de migración: **mover, no cambiar**. Primero se mueve el código tal cual; los arreglos (fecha local, asimetría de XP) van en PRs aparte.

## Convenciones de nombres

- Carpetas y archivos de feature en español, como el resto del código (`habitos/`, `misiones/`).
- Componentes en `PascalCase.tsx`, hooks `useAlgo.ts`, funciones puras `camelCase` en `domain/`.
- Un `index.ts` por feature que exporta solo la pantalla; lo interno no se importa desde afuera.
- Imports relativos con extensión `.js` dentro de `api/`, `server/` y `shared/` (proyecto ESM, ver `CLAUDE.md`).
