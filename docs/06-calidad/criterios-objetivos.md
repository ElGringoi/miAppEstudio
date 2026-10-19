# Criterios objetivos de calidad

> Números, no opiniones. Cada criterio dice **cómo se mide**, **cuánto da hoy** y **la meta**. Un PR que empeora un número sin justificarlo no se mergea (regla del [contrato de agentes](../CONTRATO-AGENTES.md)).

Línea base medida el **2026-10-19** sobre el commit `353aa7f`.

## Código

| # | Criterio | Cómo se mide | Hoy | Meta |
|---|---|---|---|---|
| C1 | Errores de lint | `npm run lint` | **24** (11 `no-unused-vars`, 8 `no-explicit-any`, 4 `set-state-in-effect`, 1 `refs`) en `App.tsx` (13) y `CerebroPersonas.tsx` (11) | **0** |
| C2 | Errores de TypeScript en modo estricto | `npx tsc -p tsconfig.app.json --noEmit --strict` | **0** (TS 6 ya trae `strict` por defecto, pero no está declarado en `tsconfig.app.json`) | 0, con `"strict": true` explícito |
| C3 | Build | `npm run build` | ✅ pasa (con `npm install` al día) | pasa |
| C4 | Archivo más grande de `front/src` | `wc -l` | **4744** (`App.tsx`) | ≤ 400 por archivo, `App.tsx` ≤ 150 |
| C5 | Colores hex fuera de `index.css` | ver comando abajo | **108** | 0 en componentes de app (La Gaceta y Recharts pueden usar tokens propios declarados en un solo archivo) |
| C6 | Usos de `any` | `grep -rn ": any\|as any" front/src` | 8 reportados por lint | 0 |
| C7 | Cobertura de `domain/` (hoy `helpers.ts`) | `vitest run --coverage` | **0 %** (no hay tests) | ≥ 80 % líneas |

Comando de C5:

```bash
grep -rEo "#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b" front/src --include=*.tsx --include=*.ts | wc -l
```

## Rendimiento

| # | Criterio | Cómo se mide | Hoy | Meta |
|---|---|---|---|---|
| R1 | JS inicial (gzip) | `npm run build`, archivo `dist/assets/index-*.js` | **468 KB** gzip (1629 KB sin comprimir), **un solo chunk** | ≤ 250 KB gzip para la primera pantalla |
| R2 | CSS (gzip) | idem, `index-*.css` | 13,8 KB | ≤ 20 KB |
| R3 | LCP en móvil | Lighthouse móvil (throttling por defecto) sobre producción | a medir | ≤ 2,5 s |
| R4 | INP | Chrome DevTools → Performance, tocar un hábito | a medir | ≤ 200 ms |
| R5 | CLS | Lighthouse | a medir | ≤ 0,1 |
| R6 | Lighthouse Performance móvil | Lighthouse | a medir | ≥ 85 |
| R7 | Listeners abiertos al arrancar | contar `onSnapshot` | **20** | ≤ 6 (los de la pantalla actual) |

## Accesibilidad y UX

| # | Criterio | Cómo se mide | Hoy | Meta |
|---|---|---|---|---|
| A1 | Lighthouse Accessibility móvil | Lighthouse | a medir | ≥ 95 |
| A2 | Contraste de texto | axe DevTools / tokens | sin auditar | AA: 4,5:1 texto normal, 3:1 texto grande y bordes de controles |
| A3 | Área táctil mínima | inspección + axe | La Gaceta ya usa 44 px; resto sin auditar | ≥ 44 × 44 px |
| A4 | Foco visible | `grep -c "focus-visible:" -r front/src` | **0** utilidades `focus-visible:` (solo `.gaceta :focus-visible`) | todos los controles |
| A5 | Modales accesibles | revisar `Modal.tsx` | sin `role="dialog"`, sin Escape, sin foco atrapado | los tres |
| A6 | Pantallas con los 7 estados | [matriz](../02-ux/estados-y-excepciones.md) | Error ❌ en 9 de 11 | 11 de 11 |
| A7 | Textos en inglés en la UI | revisión manual + [ux-writing](../02-ux/ux-writing.md) | 7 encontrados | 0 |

## Confiabilidad y seguridad

| # | Criterio | Cómo se mide | Hoy | Meta |
|---|---|---|---|---|
| S1 | `onSnapshot` con callback de error | `grep` | **0 de 20** | 20 de 20 |
| S2 | Reglas de Firestore en el repo con tests | existe `firestore.rules` + tests del emulador | ❌ | ✅ con los 11 casos de [firestore-rules.md](../05-seguridad/firestore-rules.md) |
| S3 | Secretos con prefijo `VITE_` (salvo Firebase web config) | `grep VITE_ .env.local.example` | 1 (`VITE_CLAUDE_API_KEY`) | 0 |
| S4 | `.env` ignorado por git | `git check-ignore .env` | ❌ | ✅ |
| S5 | Flujos E2E críticos en verde | Playwright | 0 de 5 | 5 de 5 |

## Cómo se usa

1. Antes de abrir un PR: correr C1, C2, C3 y, si tocó UI, A4–A6.
2. Una vez por fase del [roadmap](../01-producto/roadmap.md): medir R1–R7 y A1–A3 y actualizar la columna "Hoy" de esta página.
3. Cuando haya CI, C1–C3, C7, S2 y S5 corren solos en cada PR ([estrategia de pruebas](estrategia-pruebas.md)).
