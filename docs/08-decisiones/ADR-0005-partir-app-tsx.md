# ADR-0005: Partir `App.tsx` en features + domain + data + ui

- **Estado:** 📝 propuesta
- **Fecha:** 2026-10-19
- **Decide:** Gastón
- **Relacionado:** [carpetas-objetivo.md](../04-arquitectura/carpetas-objetivo.md), [archify.md](../04-arquitectura/archify.md), [clases.md](../04-arquitectura/clases.md)

## Contexto

`App.tsx` tiene **4744 líneas** (36 % del front), 88 `useState`, 20 listeners, ~70 handlers y 12 formularios. Concentra estado, datos, reglas de XP y 10 pantallas. Cualquier cambio toca el mismo archivo, los conflictos entre ramas son seguros y no se puede testear la lógica sin montar toda la app. `CLAUDE.md` documenta este patrón como intencional ("No hay custom hooks"), pero ya existe `hooks/useCerebroChat.ts`.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| A. Dejarlo así | cero trabajo | cada feature nueva empeora el problema |
| B. Reescribir con router + store global (Zustand/Redux) | arquitectura "de libro" | reescritura grande; riesgo alto; dependencias nuevas |
| **C. Partir por etapas en `features/`, `domain/`, `data/`, `ui/`** | cada paso deja la app andando; se testea `domain/` enseguida; sin dependencias nuevas | lleva varios PRs |

## Decisión

**C**, en el orden de [carpetas-objetivo.md](../04-arquitectura/carpetas-objetivo.md#orden-de-migración-cada-paso-deja-la-app-andando), con la regla **"mover, no cambiar"** en cada PR. Sin router por ahora (el `tab` en estado alcanza; deep links quedan para después).

## Consecuencias

- **Mejora:** archivos ≤ 400 líneas; tests de la lógica; listeners por pantalla (menos lecturas, arranque más rápido); code-splitting por feature.
- **Cuesta:** 7 pasos, cada uno un PR. Se actualiza `CLAUDE.md` ("Patrón de App.tsx" y "Lo que no existe").
- **Hay que hacer:** fase P2 del [roadmap](../01-producto/roadmap.md).

## Cómo sabemos si salió bien

`App.tsx` < 150 líneas, ningún archivo > 400, JS inicial ≤ 250 KB gzip, ≤ 6 listeners al arrancar.
