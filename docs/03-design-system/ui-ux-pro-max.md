# Relevamiento con UI/UX Pro Max

> Salida del skill **UI/UX Pro Max** (catálogo local de 79 estilos, 192 paletas, 74 pares tipográficos y 119 reglas UX), corrido el 2026-10-19. Es **insumo**, no decisión: la decisión está en [estilo-e-identidad.md](estilo-e-identidad.md) y en [ADR-0004](../08-decisiones/ADR-0004-estilo-visual.md).

## Búsquedas hechas

| # | Búsqueda | Modo | Resultado principal | ¿Sirve? |
|---|---|---|---|---|
| 1 | `gamified productivity RPG dark` | `--design-system` | Flat Design, teal + naranja, Inter, fondo claro | ❌ genérico, patrón de landing, fondo claro |
| 2 | `habit tracker gamification` | `--domain product` | Habit Tracker → **Claymorphism + Vibrant & Block-based**; paleta "ámbar de racha + verde de progreso" | ✅ dirección C |
| 3 | `gaming dark fantasy` | `--domain product` | Gaming → 3D & Hyperrealism + Retro-Futurism, neón | ⚠️ demasiado pesado para una app diaria |
| 4 | `dark gaming neon`, `cyberpunk HUD` | `--domain style` | Cyberpunk UI; **HUD / Sci-Fi FUI** (riesgo de accesibilidad: alto) | ✅ dirección B, con mitigaciones |
| 5 | `dark mode OLED` | `--domain style` | **Dark Mode (OLED)**: negro profundo, acentos vivos, glow mínimo, contraste 7:1 | ✅ base de la dirección A |
| 6 | `habit tracker streak gamification dark` | `--design-system --density 7` | Claymorphism, Nunito + DM Sans, sombras dobles, radios 16–24 px | ✅ dirección C |
| 7 | `sci-fi HUD dashboard dark game` | `--design-system --density 7` | HUD / Sci-Fi FUI, fondo `#0B0B10`, Share Tech Mono + Fira Code | ✅ dirección B (pero monoespaciada en el cuerpo de texto no) |
| 8 | `productivity dashboard dark mode OLED` | `--design-system --density 7` | Glassmorphism oscuro, Fira Code + Fira Sans | ⚠️ el blur cuesta en móviles de gama baja |
| 9 | `gaming futuristic display` | `--domain typography` | Russo One + Chakra Petch ("Gaming Bold") | ✅ opción de labels para B |

Reglas del skill que aplican a cualquier dirección (prioridad 1–3 del skill):

- Contraste de texto ≥ 4,5:1; foco visible de 2–4 px; nada de quitar el outline sin reemplazo.
- Áreas táctiles ≥ 44 × 44 px con 8 px de separación.
- **No usar emojis como íconos estructurales** (navegación, controles); sí como contenido elegido por el usuario (avatar de persona, categoría de gasto).
- Un solo CTA primario por pantalla.
- `prefers-reduced-motion` obligatorio; animar solo `transform` y `opacity`.
- Skeletons en vez de spinners bloqueantes para esperas de más de 1 s.
- Bottom nav con 5 ítems como máximo, ícono + texto.

## Hallazgo de contraste en la app actual

Medido con la fórmula de WCAG 2.2 sobre los tokens reales de `front/src/index.css`:

| Par | Ratio | AA texto (4,5) |
|---|---|---|
| `on-surface` `#dfe2f1` sobre `surface` `#0f131d` | 14,40 | ✅ |
| `on-surface-variant` `#c2c6d6` sobre `surface-container` `#1c1f2a` | 9,65 | ✅ |
| `primary` `#adc6ff` sobre `surface` | 10,87 | ✅ |
| `outline` `#8c909f` sobre `surface` | 5,84 | ✅ |
| `outline-variant` `#424754` sobre `surface` (bordes) | 2,00 | ❌ (< 3:1 para bordes de controles) |
| **Botón primario actual: blanco sobre `blue-600` `#4d8eff`** | **3,17** | ❌ — **38 botones** (`bg-blue-600 text-white`) |
| Botón de plata: blanco sobre `emerald-600` `#00a572` | 3,17 | ❌ |
| Botón de peligro: blanco sobre `red-500` `#f2645a` | 3,11 | ❌ |
| `on-primary` `#002e6a` sobre `primary` `#adc6ff` | 7,69 | ✅ ← el par correcto para botones |

**Conclusión:** la paleta es buena; el problema es cómo se usa en los botones. Texto oscuro sobre el color claro (`on-primary` sobre `primary`) arregla los tres casos sin cambiar la identidad.

## Las 3 direcciones evaluadas

| | A · Sistema (evolución) | B · Ventana del Sistema (HUD) | C · Gremio (clay) |
|---|---|---|---|
| Estilo del catálogo | Dark Mode (OLED) + superficies tonales | HUD / Sci-Fi FUI | Claymorphism + Vibrant & Block-based (adaptado a oscuro) |
| Fondo | `#0f131d` (actual) | `#0b0b10` | `#17130f` cálido |
| Acento principal | `#adc6ff` azul claro | `#38bdf8` cian holográfico | `#fbbf24` ámbar de racha |
| XP / éxito | `#4edea3` | `#38bdf8` + `#a78bfa` | `#34d399` |
| Tipografía | Plus Jakarta Sans + Space Grotesk (actual) | Plus Jakarta Sans (cuerpo) + Chakra Petch (labels y números) | Nunito (títulos) + DM Sans (cuerpo) |
| Forma | radios 12–16 px, sin bordes, profundidad por capas | esquinas cortadas, bordes de 1 px que brillan | radios 20–24 px, bordes gruesos, sombra doble |
| Contraste texto / fondo | 14,4 | 18,8 | 17,4 |
| Contraste del acento como texto | 10,9 | 9,2 | 11,1 |
| Riesgo de accesibilidad (catálogo) | bajo | **alto** (glow, animaciones, bordes finos de 2,8:1) | condicional |
| Costo de migración | **bajo**: mismos tokens, arreglar botones y sumar radios/sombras | medio: tokens nuevos + clip-path + 1 fuente nueva | alto: tokens, fuentes y todas las cards |
| Encaja con | lo que ya existe, uso diario largo | la fantasía de "el Sistema" (rangos E→Monarch) | hábitos y rachas tipo Duolingo |
