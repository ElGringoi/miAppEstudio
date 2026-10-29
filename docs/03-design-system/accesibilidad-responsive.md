# Accesibilidad y responsive

> Objetivo: **WCAG 2.2 nivel AA** en toda la app. Medición: [criterios A1–A7](../06-calidad/criterios-objetivos.md#accesibilidad-y-ux).

## Hoy (as-is)

| Tema | Estado | Evidencia |
|---|---|---|
| Contraste de texto | ✅ los tokens de texto pasan (14,4:1) | [ui-ux-pro-max.md](ui-ux-pro-max.md#hallazgo-de-contraste-en-la-app-actual) |
| Contraste de botones | ❌ blanco sobre azul / verde / rojo: 3,1–3,2:1 | 38 botones `bg-blue-600 text-white` |
| Foco visible | ❌ `focus:outline-none` 68 veces; 0 utilidades `focus-visible:` | grep en `front/src` |
| Modales | ❌ sin `role="dialog"`, sin Escape, sin foco atrapado | `components/Modal.tsx` |
| Toast | ❌ sin live region | `App.tsx:1991` |
| ARIA | ⚠️ ~60 atributos, casi todos en La Gaceta; `App.tsx` tiene 4 | |
| Áreas táctiles | ⚠️ La Gaceta usa 44 px; botones de ícono de 32 px y chips de 28 px en el resto | `Modal.tsx:44`, `App.tsx:3461` |
| Movimiento reducido | ⚠️ solo en La Gaceta | `diario/estilos.ts:135` |
| Teclado | ⚠️ Enter/Escape en ediciones inline, flechas en La Gaceta; el resto depende del orden del DOM | |
| Idioma | ⚠️ `index.html:2` declara `lang="es-AR"` (bien), pero quedan textos en inglés en la UI | [ux-writing.md](../02-ux/ux-writing.md#inconsistencias-encontradas) |
| Breakpoints | ⚠️ casi solo `md` (94 usos); `sm` 5, `lg` 5, `xl` 0 | |
| Navegación móvil | ⚠️ bottom bar con 5 de 10 tabs; el resto en un menú hamburguesa | `App.tsx:2287` |

## Objetivo (to-be)

### Checklist por componente (definición de "accesible")

| Componente | Requisitos |
|---|---|
| Todo control | ≥ 44 × 44 px (o área extendida), 8 px de separación, foco visible 3 px `primary` con offset 2 px, nombre accesible |
| Botón | `<button>` real; `aria-busy` al cargar; texto o `aria-label` |
| Checkbox de quest | `role="checkbox"` + `aria-checked`; Espacio lo marca |
| Chip de filtro | `aria-pressed`; check visible además del color |
| Tabs | `role="tablist"` / `tab` / `tabpanel`, flechas ← → mueven, `aria-selected` |
| Modal | `role="dialog"` + `aria-modal` + `aria-labelledby`; Escape cierra; foco atrapado; foco vuelve al disparador |
| Toast | `role="status"` `aria-live="polite"`; errores `role="alert"`; no roba foco; ≥ 4 s; pausa al hover/foco |
| Input | `<label>` visible; error con `aria-describedby` + `aria-invalid`; `inputmode` / `type` correctos (monto → `inputmode="decimal"`) |
| Barra de XP | `role="progressbar"` + `aria-valuenow/min/max` + texto visible |
| Ícono decorativo | `aria-hidden="true"` |
| Gráfico (radar) | resumen en texto ("Inteligencia nivel 12, la más alta") + tabla alternativa |
| Navegación | `aria-current="page"` en el tab activo; link "Saltar al contenido" |
| Cambio de pantalla | foco al `<h1>` de la pantalla nueva |

### Contraste

Todos los pares del Gremio están medidos en [fundamentos.md](fundamentos.md#1-color). Mínimos que se exigen:

| Elemento | Mínimo | Peor par del Gremio |
|---|---|---|
| Texto normal | 4,5:1 | `on-danger` sobre `danger` 5,84 |
| Texto grande (≥ 24 px o 19 px bold) | 3:1 | — |
| Bordes de controles y foco | 3:1 | `outline` sobre card 3,89 |
| Íconos con significado | 3:1 | colores de stat ≥ 6,09 |

### Responsive

| Ancho | Layout | Navegación | Qué cambia |
|---|---|---|---|
| **375–767 (móvil, diseño base)** | 1 columna, gutter 16 | **bottom nav**: Hoy · Quests · Misiones · Cerebro · **Más** (sheet con Calendario, Gym, Atributos, Billetera, La Gaceta, Ajustes) | modales → bottom sheets; botón flotante "Captura rápida" al Inbox; listas de ancho completo |
| 768–1023 (tablet) | 2 columnas en Dashboard | sidebar compacta 80 px con ícono + label chico | modales centrados |
| ≥ 1024 (desktop) | 12 columnas, contenido `max-w-6xl` | sidebar completa 256 px (colapsable a 80) | atajos de teclado: `N` nueva quest, `/` buscar en Cerebro |
| Horizontal en móvil | igual que móvil | bottom nav se mantiene | sin contenido tapado |

Reglas:

1. **Mobile-first:** las clases sin prefijo son de móvil; `md:` y `lg:` agregan.
2. `min-h-dvh` en vez de `min-h-screen` (barra de direcciones móvil).
3. `padding-bottom: calc(72px + env(safe-area-inset-bottom))` en el contenido para que la bottom nav no tape nada.
4. Sin scroll horizontal en ningún ancho (salvo carruseles explícitos con controles).
5. Texto de inputs ≥ 16 px.
6. Probar siempre en **375 × 812** y **1440 × 900**.

### Cómo se verifica

| Herramienta | Qué | Cuándo |
|---|---|---|
| Lighthouse (móvil) | Accessibility ≥ 95 | por fase del roadmap |
| axe DevTools | 0 violaciones serias/críticas | cada PR de UI |
| Teclado solo | recorrer Dashboard → completar quest → abrir y cerrar modal | cada PR de UI |
| Lector de pantalla (NVDA en Windows) | completar quest y escuchar el toast | por fase |
| `prefers-reduced-motion` (DevTools → Rendering) | nada se traslada ni rebota | cada PR con animación |
