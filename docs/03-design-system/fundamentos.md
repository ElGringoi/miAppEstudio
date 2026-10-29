# Fundamentos: los 8 aspectos

> Los 8 aspectos del lenguaje visual del Gremio, cada uno con sus tokens. Al final está el bloque `@theme` propuesto para reemplazar el de `front/src/index.css`. Los ratios de contraste están **medidos** con la fórmula de WCAG 2.2.

| # | Aspecto | Resumen |
|---|---|---|
| 1 | [Color](#1-color) | marrón tostado + ámbar de acción + verde de XP |
| 2 | [Tipografía](#2-tipografía) | Nunito (títulos y números) + DM Sans (texto) |
| 3 | [Espaciado y grilla](#3-espaciado-y-grilla) | base 4 px, grilla de 4/8/12 columnas |
| 4 | [Forma](#4-forma) | radios gordos 14–28 px, bordes de 2–3 px |
| 5 | [Elevación](#5-elevación) | escalón inferior + brillo interno (clay) |
| 6 | [Iconografía](#6-iconografía) | lucide, trazo 2,25, sin emojis estructurales |
| 7 | [Imagen e ilustración](#7-imagen-e-ilustración) | insignias, fichas, arte generado de La Gaceta |
| 8 | [Movimiento](#8-movimiento) | resortes cortos que "aplastan"; detalle en [movimiento.md](movimiento.md) |

---

## 1. Color

### Superficies (de más profunda a más alta)

| Token | Hex | Uso |
|---|---|---|
| `surface-container-lowest` | `#110e0b` | pozos: inputs, track de barras |
| `surface` | `#17130f` | fondo de página |
| `surface-container-low` | `#1d1813` | sidebar, bottom nav, contenedor de tabs |
| `surface-container` | `#221c16` | cards |
| `surface-container-high` | `#2b241c` | card elevada, botón secundario, hover |
| `surface-container-highest` | `#362d23` | modal, popover, chip activo |
| `outline-variant` | `#3a2f24` | borde grueso **decorativo** de cards (no necesita contraste) |
| `outline` | `#8a7660` | borde de **controles** (inputs, chips): 4,26:1 sobre `surface`, 3,89:1 sobre card |

### Texto

| Token | Hex | Sobre `surface` | Sobre card | Uso |
|---|---|---|---|---|
| `on-surface` | `#fff7ed` | 17,40 | — | texto principal |
| `on-surface-variant` | `#d6c7b4` | 11,16 | 9,25 (high) | texto secundario |
| `on-surface-muted` | `#a8977f` | 6,51 | 5,94 | hints, metadatos, placeholder |

### Roles

| Rol | Color | Texto encima (`on-*`) | Ratio `on` | Escalón (ledge) | Uso |
|---|---|---|---|---|---|
| `primary` | `#fbbf24` ámbar | `#1c1206` | 11,05 | `#b45309` | acción principal, racha, foco |
| `primary-hover` | `#fcd34d` | `#1c1206` | 12,79 | | |
| `secondary` | `#34d399` verde | `#052e1f` | 7,71 | `#047857` | XP, completar, éxito |
| `tertiary` | `#c4b5fd` violeta | `#2e1065` | 8,25 | `#6d28d9` | épico: misiones épicas, rangos altos |
| `danger` | `#f87171` | `#450a0a` | 5,84 | `#991b1b` | borrar, errores destructivos |
| `error` (texto) | `#fca5a5` | — | 8,88 sobre card | | mensajes de error |
| `warning` | `#fb923c` naranja | `#431407` | — | | avisos (8,16 como texto) |
| `info` | `#7dd3fc` | `#082f49` | — | | información (11,08 como texto) |

Los colores por stat están en [estilo-e-identidad.md](estilo-e-identidad.md#color-por-stat).

### Reglas de color

1. **Texto oscuro sobre color claro.** Todo botón relleno usa su `on-*` oscuro. Nunca blanco sobre ámbar o verde (el error de hoy: blanco sobre `#4d8eff` = 3,17:1 en 38 botones).
2. **Un color, un significado.** Ámbar = actuar / racha. Verde = XP / éxito. Violeta = épico. Rojo = destruir.
3. **Nunca solo color:** estado completado = check + color; error = ícono + texto.
4. **Prohibido el hex suelto** en componentes: solo tokens (criterio [C5](../06-calidad/criterios-objetivos.md)).

---

## 2. Tipografía

| Familia | Rol | Pesos | Por qué |
|---|---|---|---|
| **Nunito** | títulos, números grandes (nivel, XP), botones | 700, 800, 900 | redonda y gorda: es la voz del estilo clay |
| **DM Sans** | texto, labels, inputs, datos | 400, 500, 700 | muy legible en tamaños chicos; cifras tabulares con `tabular-nums` (confirmar en la migración; si fallan, los números van en Nunito) |
| Newsreader | solo La Gaceta | sin cambios | sub-marca |

Salen **Plus Jakarta Sans** y **Space Grotesk**. Carga: un solo pedido a Google Fonts con `display=swap` (como hoy, `index.html:10`).

### Escala (mobile-first)

| Token | Tamaño / interlineado | Familia y peso | Uso |
|---|---|---|---|
| `text-display` | 40 / 44 | Nunito 900 | número de nivel |
| `text-title-lg` | 28 / 34 | Nunito 800 | título de pantalla |
| `text-title` | 22 / 28 | Nunito 800 | título de card / modal |
| `text-title-sm` | 18 / 24 | Nunito 700 | subtítulo, nombre de quest destacada |
| `text-body` | 16 / 24 | DM Sans 400 | texto (mínimo en móvil) |
| `text-body-sm` | 14 / 20 | DM Sans 400–500 | texto secundario, filas de lista |
| `text-label` | 13 / 16 | DM Sans 700, `tabular-nums` | chips, XP, fechas, contadores |
| `text-caption` | 12 / 16 | DM Sans 500 | metadatos (piso absoluto: nada < 12 px) |

Reglas: números siempre con `tabular-nums`; nada de mayúsculas sostenidas en frases (sí en labels de ≤ 3 palabras con `tracking-wide`); largo de línea 35–60 caracteres en móvil.

---

## 3. Espaciado y grilla

Base **4 px**. Densidad "estándar" (UI/UX Pro Max `--density 7`).

| Token | px | Uso típico |
|---|---|---|
| `space-1` | 4 | ícono ↔ texto |
| `space-2` | 8 | separación mínima entre controles táctiles |
| `space-3` | 12 | padding de chip, gap de lista |
| `space-4` | 16 | padding de card en móvil, gutter lateral |
| `space-5` | 20 | padding de card en desktop |
| `space-6` | 24 | entre bloques de una pantalla |
| `space-8` | 32 | entre secciones |
| `space-12` | 48 | aire arriba de títulos de pantalla |

| Breakpoint | Ancho | Columnas | Gutter | Navegación |
|---|---|---|---|---|
| móvil | < 768 | 4 | 16 | bottom nav 5 ítems + "Más" |
| tablet `md` | ≥ 768 | 8 | 24 | sidebar compacta (íconos + label) |
| desktop `lg` | ≥ 1024 | 12 | 24 | sidebar completa `w-64` |
| ancho `xl` | ≥ 1440 | 12 | 32 | contenido máx. `max-w-6xl` centrado |

---

## 4. Forma

| Token | Radio | Uso |
|---|---|---|
| `radius-sm` | 10 px | checkbox de quest, tags chicos |
| `radius-md` | 14 px | inputs, icon buttons |
| `radius-lg` | 16 px | botones |
| `radius-xl` | 22 px | cards |
| `radius-2xl` | 28 px | modales, bottom sheets |
| `radius-full` | 9999 px | chips, insignias de rango, avatar |

Bordes: **3 px** `outline-variant` en cards (decorativo), **2 px** `outline` en controles (funcional, ≥ 3:1). Los bordes de 0,5–1 px no existen en el Gremio.

---

## 5. Elevación

El clay se construye con dos sombras: un **escalón** sólido abajo (el "grosor" del bloque) y un **brillo interno** arriba.

| Token | Valor | Uso |
|---|---|---|
| `shadow-card` | `inset 0 2px 0 rgb(255 247 237 / 0.06), 0 8px 24px rgb(0 0 0 / 0.45)` | cards |
| `shadow-raised` | `inset 0 2px 0 rgb(255 247 237 / 0.08), 0 12px 32px rgb(0 0 0 / 0.55)` | modal, popover |
| `ledge-*` | `0 4px 0 0 <escalón del rol>` | botones rellenos (se hunde al apretar) |
| `ledge-pressed` | `0 1px 0 0 <escalón>` + `translateY(3px)` | estado presionado |

Niveles: página (`surface`) → card (`container` + `shadow-card`) → card elevada (`container-high`) → modal (`container-highest` + `shadow-raised` + scrim `rgb(0 0 0 / 0.6)`). Máximo **dos** capas flotantes a la vez.

---

## 6. Iconografía

- **Librería: `lucide-react`** (ya instalada). UI/UX Pro Max sugiere Phosphor por defecto; se queda lucide para no sumar dependencia, con trazo **2,25** para que combine con el estilo gordo.
- Tamaños: `icon-sm` 16, `icon-md` 20, `icon-lg` 24, `icon-xl` 32 (insignias).
- **Sin emojis estructurales:** navegación, clases (⚔️ 🔮 → íconos), estados y botones van con SVG. Los emojis quedan solo como **contenido elegido por el usuario**: avatar de persona, ícono de grupo, categoría de gasto.
- Ícono decorativo junto a texto → `aria-hidden="true"`. Botón solo-ícono → `aria-label`.

---

## 7. Imagen e ilustración

| Pieza | Descripción |
|---|---|
| **Insignia de rango** | círculo de 48–64 px, borde 3 px del color del rango, letra en Nunito 900 |
| **Ficha de stat** | cuadrado redondeado 40 px, fondo `color del stat / 15 %`, ícono del stat |
| **Logros** | medallas redondas con ícono; bloqueadas en `surface-container-high` con candado |
| **Estados vacíos** | ícono grande (48 px) dentro de una ficha clay + frase + botón |
| **La Gaceta** | arte generado por nota (`utils/diarioArte.ts`), sin cambios |

Sin fotos de stock, sin gradientes de fondo, sin texturas.

---

## 8. Movimiento

Los bloques **se aplastan y rebotan**: resortes cortos, nada que tarde más de 400 ms salvo la celebración de nivel. Tokens, catálogo y reglas de movimiento reducido en [movimiento.md](movimiento.md).

---

## Bloque `@theme` propuesto

Reemplaza los tokens de `front/src/index.css`. Se mantienen los **nombres** de superficie y rol que ya usa el código nuevo (`surface-container`, `primary`, `on-primary`…), así la migración cambia valores y no clases. Las paletas remapeadas (`slate`, `blue`, `emerald`…) se re-apuntan a estos tonos en la misma migración y después se borran.

```css
@theme {
  --font-sans:    'DM Sans', system-ui, sans-serif;
  --font-display: 'Nunito', 'DM Sans', system-ui, sans-serif;

  /* Superficies */
  --color-surface-container-lowest: #110e0b;
  --color-surface:                  #17130f;
  --color-surface-container-low:    #1d1813;
  --color-surface-container:        #221c16;
  --color-surface-container-high:   #2b241c;
  --color-surface-container-highest:#362d23;
  --color-outline-variant:          #3a2f24;
  --color-outline:                  #8a7660;

  /* Texto */
  --color-on-surface:         #fff7ed;
  --color-on-surface-variant: #d6c7b4;
  --color-on-surface-muted:   #a8977f;

  /* Roles */
  --color-primary:        #fbbf24;
  --color-primary-hover:  #fcd34d;
  --color-on-primary:     #1c1206;
  --color-primary-ledge:  #b45309;
  --color-secondary:      #34d399;
  --color-on-secondary:   #052e1f;
  --color-secondary-ledge:#047857;
  --color-tertiary:       #c4b5fd;
  --color-on-tertiary:    #2e1065;
  --color-tertiary-ledge: #6d28d9;
  --color-danger:         #f87171;
  --color-on-danger:      #450a0a;
  --color-danger-ledge:   #991b1b;
  --color-error:          #fca5a5;
  --color-warning:        #fb923c;
  --color-info:           #7dd3fc;

  /* Stats */
  --color-stat-fuerza:       #f87171;
  --color-stat-salud:        #f472b6;
  --color-stat-inteligencia: #60a5fa;
  --color-stat-agilidad:     #22d3ee;
  --color-stat-carisma:      #facc15;
  --color-stat-fe:           #a78bfa;

  /* Forma */
  --radius-sm:  10px;
  --radius-md:  14px;
  --radius-lg:  16px;
  --radius-xl:  22px;
  --radius-2xl: 28px;

  /* Elevación */
  --shadow-card:   inset 0 2px 0 rgb(255 247 237 / 0.06), 0 8px 24px rgb(0 0 0 / 0.45);
  --shadow-raised: inset 0 2px 0 rgb(255 247 237 / 0.08), 0 12px 32px rgb(0 0 0 / 0.55);

  /* Movimiento (ver movimiento.md) */
  --duration-instant: 100ms;
  --duration-fast:    160ms;
  --duration-base:    240ms;
  --duration-slow:    400ms;
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in:     cubic-bezier(0.55, 0, 1, 0.45);
  --ease-squish: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Capas (no son tokens de Tailwind: variables comunes) */
:root {
  --z-base: 0;  --z-sticky: 10;  --z-nav: 20;  --z-overlay: 40;
  --z-modal: 50; --z-toast: 60;  --z-levelup: 70;
}
```
