# ADR-0004: Estilo visual "Gremio" (claymorphism oscuro)

- **Estado:** ✅ aceptada
- **Fecha:** 2026-10-19
- **Decide:** Gastón (eligió entre 3 direcciones con mockup)
- **Relacionado:** [ui-ux-pro-max.md](../03-design-system/ui-ux-pro-max.md), [estilo-e-identidad.md](../03-design-system/estilo-e-identidad.md), [fundamentos.md](../03-design-system/fundamentos.md)

## Contexto

El estilo actual (Stitch "RPG Productivity & Study System", azul frío, solo oscuro) tiene buena paleta pero se aplica sin sistema: 234 botones a mano, 38 de ellos con contraste 3,17:1 (blanco sobre `#4d8eff`), sin tokens de radio ni sombra, y clases de modo claro mezcladas (`bg-white dark:bg-slate-900` 41 veces). Se usó **UI/UX Pro Max** para generar direcciones.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| A. Sistema (evolución del actual) | migración baja | poco distintivo |
| A + toques de B | identidad fuerte en momentos épicos | dos lenguajes que convivir |
| B. Ventana del Sistema (HUD) | máxima fantasía RPG | riesgo de accesibilidad alto según el catálogo; más trabajo |
| **C. Gremio (claymorphism + vibrant blocks, oscuro)** | lo que el catálogo recomienda para habit trackers; feedback táctil que refuerza el loop de XP; cálido de noche | migración alta (tokens, fuentes, forma de cards); claymorphism en oscuro es "condicional" en accesibilidad |

## Decisión

**C · Gremio.** Fondo marrón tostado `#17130f`, ámbar `#fbbf24` para acción y racha, verde `#34d399` para XP, Nunito + DM Sans, radios 14–28 px, botones con escalón que se hunde. La Gaceta conserva su identidad de papel.

## Consecuencias

- **Mejora:** identidad propia; botones accesibles por diseño (texto oscuro sobre color claro, todos ≥ 5,8:1); tokens completos (radios, sombras, movimiento, z-index).
- **Cuesta:**
  - Cambian todos los valores del `@theme`, las 2 fuentes de UI y la forma de todas las cards.
  - Salen Plus Jakarta Sans y Space Grotesk.
  - Hay que reemplazar los emojis estructurales (clases) por íconos.
- **Mitigación de accesibilidad:** bordes de controles en `outline` `#8a7660` (≥ 3,89:1), foco ámbar de 3 px, movimiento reducido obligatorio. Todos los pares medidos en [fundamentos.md](../03-design-system/fundamentos.md#1-color).
- **Hay que hacer:**
  1. Componentes base (`Button` primero).
  2. Nuevo `@theme`.
  3. Re-apuntar las paletas remapeadas.
  4. Migrar pantalla por pantalla.

  Es la fase P3 del [roadmap](../01-producto/roadmap.md).

## Cómo sabemos si salió bien

Lighthouse Accessibility ≥ 95 en móvil, 0 hex fuera de `index.css` en componentes de app, y Gastón usa la app de noche sin quejarse del brillo.
