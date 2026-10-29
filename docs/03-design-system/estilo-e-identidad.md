# Estilo e identidad visual

> **Decisión (2026-10-19): dirección C · Gremio.** Claymorphism + Vibrant & Block-based, adaptado a modo oscuro. Elegida por Gastón entre 3 direcciones generadas con [UI/UX Pro Max](ui-ux-pro-max.md). Registro: [ADR-0004](../08-decisiones/ADR-0004-estilo-visual.md).

## La idea en una frase

**La app es la sala del gremio:** un lugar cálido, de bloques gordos y táctiles, donde cada quest completada se siente como apretar un botón de verdad y ver subir la barra.

| Es | No es |
|---|---|
| Cálido: marrones tostados, ámbar de racha, verde de progreso | Frío: azul tecnológico, neón, glassmorphism |
| Táctil: botones con "escalón" que se hunden al tocarlos | Plano: botones sin respuesta física |
| Gordo y redondo: radios de 16–28 px, bordes de 2–3 px | Fino y técnico: hairlines de 0,5 px, esquinas cortadas |
| Juego de mesa / Duolingo nocturno | Dashboard de oficina |
| Oscuro siempre (uso de noche, cierre del día) | Modo claro (fuera de alcance) |

## Por qué C

1. **El corazón de la app son las rachas y los hábitos**, y el catálogo de UI/UX Pro Max recomienda para "Habit Tracker" exactamente este estilo: *Claymorphism + Vibrant & Block-based*, con paleta "ámbar de racha + verde de progreso".
2. **El feedback físico** (botón que se hunde, barra que rebota) refuerza el loop "una acción, una recompensa visible" de la [visión](../01-producto/vision.md).
3. **Se lee bien de noche:** fondo marrón muy oscuro en vez de negro azulado; contraste de texto 17,4:1.

**Costo asumido:** es la dirección de migración más alta (tokens, fuentes y forma de todas las cards). Se hace por etapas, ver [roadmap](../01-producto/roadmap.md) fase P3.

## Identidad

### Nombre

Hoy conviven tres nombres: **miAppEstudio** (repo, `package.json` dice `web`), **Questflow** (`docs/INBOX_AGENTE.md`, título del Diario) y **La Gaceta** (el Diario).

Propuesta:

| Uso | Nombre |
|---|---|
| Producto (lo que ve Gastón) | **Questflow** |
| Repo y carpeta | `miAppEstudio` (no se toca) |
| Sección de noticias | **La Gaceta**: sub-marca con identidad propia de papel |

> Pendiente de confirmar por Gastón. Hasta entonces la UI dice "Questflow" solo donde ya lo dice.

### Personaje y progresión

Se mantiene todo el sistema actual (`front/src/utils/constants.tsx`); cambia cómo se ve.

| Elemento | Hoy | En el Gremio |
|---|---|---|
| Rangos E → D → C → B → A → S → SS → Monarch | texto de color | **insignia redonda** con borde grueso; color por rango y la letra en Nunito 900 |
| Clases (Guerrero, Mago, Paladín…) | emoji (⚔️, 🔮) | **ícono SVG** de lucide en una ficha redonda; el emoji se va (regla del catálogo: no emojis como íconos estructurales) |
| Nivel | número | número grande en Nunito 900 dentro de una ficha ámbar |
| XP | barra fina | barra gruesa (10–12 px) verde, con brillo interno arriba |
| Racha | número | **llama** (`Flame` de lucide) ámbar + número; a partir de 7 días la ficha suma borde ámbar |

### Color por stat

Cada stat tiene un color fijo que se usa en su ícono, su barra y sus chips. Todos con contraste ≥ 6:1 sobre las cards.

| Stat | Abrev. | Color | Ícono lucide |
|---|---|---|---|
| Fuerza | FUE | `#f87171` rojo | `Dumbbell` |
| Salud | SAL | `#f472b6` rosa | `Heart` |
| Inteligencia | INT | `#60a5fa` azul | `Brain` |
| Agilidad | AGI | `#22d3ee` cian | `Zap` |
| Carisma | CAR | `#facc15` amarillo | `Sparkles` |
| Fe | FE | `#a78bfa` violeta | `Star` |

El verde (`#34d399`) queda reservado a **XP y éxito**, y el ámbar (`#fbbf24`) a **acción principal y racha**, para que no se confundan con un stat.

### Voz

La voz pasa de "el Sistema" a **compañero de gremio**: cálido, en vos, que celebra sin exagerar. Detalle y glosario en [ux-writing.md](../02-ux/ux-writing.md).

| Situación | Ejemplo |
|---|---|
| Quest completada | "+25 XP INT · racha de 8" (la llama va como ícono SVG al lado, no como emoji) |
| Subir de nivel | "¡Nivel 24! Inteligencia sigue creciendo." |
| Vacío | "Todavía no hay quests. Creá la primera y arrancá la racha." |
| Error | "No se pudo guardar. Revisá la conexión y probá de nuevo." |

### La Gaceta (sub-marca)

La Gaceta **no** adopta el Gremio: mantiene su identidad de diario impreso (`front/src/components/diario/estilos.ts`): papel `#f4f1ea`, tinta `#141414`, bordó `#7a1f2b`, Newsreader. Es la única superficie clara de la app y eso la hace sentir "otro lugar", a propósito. Lo único que comparte con el resto: foco visible, áreas táctiles de 44 px y la regla de movimiento reducido.

## Referencias del catálogo

- Estilo: `Claymorphism` + `Vibrant & Block-based` (UI/UX Pro Max, dominio `style`).
- Producto: `Habit Tracker` (dominio `product`).
- Tipografía: `Nunito` + `DM Sans` (design system generado con `habit tracker streak gamification dark`).
- Riesgo de accesibilidad del estilo según el catálogo: **condicional** en oscuro. Se mitiga con los pares medidos en [fundamentos.md](fundamentos.md) y las reglas de [accesibilidad-responsive.md](accesibilidad-responsive.md).
