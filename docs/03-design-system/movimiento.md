# Interacciones y animaciones

> En el Gremio los bloques **se aplastan y rebotan**. Cada animación responde a una acción del usuario o a un cambio de estado; nada se mueve "porque sí". Librería: `motion/react` (ya instalada).

## Hoy (as-is)

| Patrón | Dónde | Valores |
|---|---|---|
| Cambio de tab | `App.tsx:2418` (`AnimatePresence mode="wait"`) | `opacity 0, y 20` → `y -20` al salir |
| Modal | `Modal.tsx:22` | `scale 0.95, y 16` |
| Toast | `App.tsx:1991` | `y 16` |
| Level up | `App.tsx:2180` | resorte `stiffness 300, damping 20` + confetti |
| Indicador de bottom nav | `App.tsx:2300` | `layoutId`, resorte 500/40 |
| Listas | `App.tsx:2974`, `App.tsx:3506` | `layout`, `whileHover 1.01`, `whileTap 0.99` |
| Barras de progreso | 7 lugares | `width` 0,5–1 s `easeOut` |
| Expandir | `DetalleOrigen.tsx`, `MissionNodeComp.tsx` | `height` a `auto` |
| Spinners | varios | rotación 1 s lineal |

Problemas:

1. **`prefers-reduced-motion` solo se respeta en el skeleton de La Gaceta** (`diario/estilos.ts:135`).
2. Las barras animan `width` (provoca reflow); conviene `scaleX`.
3. Duraciones y resortes distintos en cada lugar; no hay tokens.
4. El confetti (`canvas-confetti`) se dispara igual con movimiento reducido.

## Objetivo (to-be)

### Tokens

| Token | Valor | Uso |
|---|---|---|
| `duration-instant` | 100 ms | feedback de toque (hundirse) |
| `duration-fast` | 160 ms | hover, chips, salida de elementos |
| `duration-base` | 240 ms | entrada de tabs, toasts, expandir |
| `duration-slow` | 400 ms | barra de XP, bottom sheet |
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | entradas |
| `ease-in` | `cubic-bezier(0.55, 0, 1, 0.45)` | salidas |
| `ease-squish` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | rebote leve (check, número de XP) |
| `spring-press` | `{ type: 'spring', stiffness: 600, damping: 30 }` | soltar un botón |
| `spring-pop` | `{ type: 'spring', stiffness: 400, damping: 18 }` | insignias, level up |
| `spring-layout` | `{ type: 'spring', stiffness: 500, damping: 40 }` | indicadores con `layoutId` (como hoy) |

Reglas del catálogo de UI/UX Pro Max que se adoptan:

- Animar solo `transform` y `opacity`.
- La salida dura ~65 % de la entrada.
- Máximo 1–2 elementos animados a la vez por vista.
- Toda animación se puede interrumpir; nunca bloquea un toque.
- Escalonar listas de 30–40 ms por ítem, con un tope de 6 ítems escalonados.

### Catálogo

| Momento | Animación | Tokens |
|---|---|---|
| **Tocar un botón** | baja 3 px + `scale 0.98`, el escalón se achica; al soltar vuelve con resorte | `duration-instant` · `spring-press` |
| **Completar quest** | el check se llena (`scale 0 → 1` con rebote) · "+25 XP" sube 16 px y se desvanece · la barra de XP crece (`scaleX`) | `ease-squish` 240 ms · 600 ms · `duration-slow` |
| **Racha que sube** | la llama hace un "pop" (`scale 1 → 1,2 → 1`) | `spring-pop` |
| **Subir de nivel** | overlay: insignia entra con `scale 0.6 → 1` + giro de 8°, número cuenta hacia arriba, confetti corto (80 partículas) | `spring-pop` · máx 1,2 s · se cierra con un toque |
| **Subir de rango** | igual que nivel + la insignia de rango cambia de color con crossfade | |
| **Cambiar de tab** | crossfade + `y 8 → 0` al entrar, `opacity` al salir | `duration-base` / `duration-fast` |
| **Abrir modal / sheet** | móvil: sube desde abajo; desktop: `scale 0.96 → 1` + fade, desde el botón que lo abrió | `duration-slow` / `duration-base` |
| **Toast** | entra desde abajo `y 16 → 0`; sale con fade | `duration-base` / `duration-fast` |
| **Expandir detalle** | contenido con `opacity` + `y 4`; la altura con `layout` de motion (no `height: auto` animado a mano) | `duration-base` |
| **Pasar página en La Gaceta** | sin cambios (tiene su propio sistema) | |
| **Cargar** | skeleton con pulso de opacidad 0,6 ↔ 1 cada 1,2 s; spinner solo dentro de botones | |

### Movimiento reducido (obligatorio)

Con `prefers-reduced-motion: reduce`:

| Animación | Queda como |
|---|---|
| Traslados, escalas, giros, rebotes | **se eliminan**: cambio de estado inmediato o fade ≤ 120 ms |
| Barra de XP | salta al valor final |
| Confetti | **no se dispara**; el overlay de level up aparece con fade |
| Skeleton | sin pulso (bloque fijo) |
| Indicadores con `layoutId` | sin resorte (`duration: 0`) |

Implementación: `MotionConfig reducedMotion="user"` en la raíz de la app + chequear `useReducedMotion()` antes de llamar a `confetti()`. En CSS:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Hápticos (móvil)

`navigator.vibrate(10)` al completar una quest y `vibrate([20, 40, 20])` al subir de nivel, solo si el usuario no tiene movimiento reducido y el navegador lo soporta. Opción para apagarlos en Ajustes.
