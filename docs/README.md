# Documentación de miAppEstudio

> Planificación completa de la app **antes de seguir codeando**. Cada doc tiene dos partes: **Hoy (as-is)**, fiel al código con citas `archivo:línea`, y **Objetivo (to-be)**. La diferencia entre las dos es el [roadmap](01-producto/roadmap.md).
>
> Relevado el **2026-10-19** sobre el commit `353aa7f`. Para leer todo junto con los diagramas renderizados: `npm run docs:site` y abrir `docs/site/index.html`.

## Por dónde empezar

| Si sos… | Leé primero |
|---|---|
| Gastón | [roadmap](01-producto/roadmap.md) → [estilo e identidad](03-design-system/estilo-e-identidad.md) → [estados y excepciones](02-ux/estados-y-excepciones.md) |
| Un agente de IA | **[CONTRATO-AGENTES.md](CONTRATO-AGENTES.md)** → [`CLAUDE.md`](../CLAUDE.md) → el doc de lo que vas a tocar |
| Alguien nuevo | [visión](01-producto/vision.md) → [arquitectura](04-arquitectura/arquitectura.md) → [archify](04-arquitectura/archify.md) |

## Carpetas

| Carpeta | Contenido |
|---|---|
| [01-producto](01-producto/) | [visión](01-producto/vision.md) · [casos de uso](01-producto/casos-de-uso.md) · [mapa de producto](01-producto/mapa-producto.md) · [roadmap](01-producto/roadmap.md) |
| [02-ux](02-ux/) | [journeys](02-ux/journeys.md) · [flujos](02-ux/flujos.md) · [estados y excepciones](02-ux/estados-y-excepciones.md) · [UX writing](02-ux/ux-writing.md) |
| [03-design-system](03-design-system/) | [UI/UX Pro Max](03-design-system/ui-ux-pro-max.md) · [estilo e identidad](03-design-system/estilo-e-identidad.md) · [fundamentos (8 aspectos)](03-design-system/fundamentos.md) · [componentes](03-design-system/componentes.md) · [movimiento](03-design-system/movimiento.md) · [accesibilidad y responsive](03-design-system/accesibilidad-responsive.md) |
| [04-arquitectura](04-arquitectura/) | [arquitectura C4](04-arquitectura/arquitectura.md) · [archify](04-arquitectura/archify.md) · [datos ER](04-arquitectura/datos-er.md) · [clases](04-arquitectura/clases.md) · [secuencias](04-arquitectura/secuencias.md) · [estados](04-arquitectura/estados.md) · [carpetas objetivo](04-arquitectura/carpetas-objetivo.md) |
| [05-seguridad](05-seguridad/) | [modelo de amenazas](05-seguridad/modelo-amenazas.md) · [reglas de Firestore](05-seguridad/firestore-rules.md) · [privacidad](05-seguridad/privacidad.md) |
| [06-calidad](06-calidad/) | [criterios objetivos](06-calidad/criterios-objetivos.md) · [estrategia de pruebas](06-calidad/estrategia-pruebas.md) · [criterios de aceptación](06-calidad/criterios-aceptacion.md) · [rendimiento y confiabilidad](06-calidad/rendimiento-confiabilidad.md) |
| [07-operaciones](07-operaciones/) | [entornos y deploy](07-operaciones/entornos-y-deploy.md) · [Segundo Cerebro](07-operaciones/segundo-cerebro.md) · [runbook](07-operaciones/runbook.md) |
| [08-decisiones](08-decisiones/) | [índice de ADRs](08-decisiones/README.md) · [plantilla](08-decisiones/plantilla.md) · ADR-0001 … ADR-0007 |
| raíz | [CONTRATO-AGENTES.md](CONTRATO-AGENTES.md) · [INBOX_AGENTE.md](INBOX_AGENTE.md) (contrato del agente Gmail, ya existía) |

## Pedido → archivo

### Diagramas

| # | Pedido | Dónde |
|---|---|---|
| 1 | Diagrama de flujo | [02-ux/flujos.md](02-ux/flujos.md) (5 flujos) |
| 2 | Diagrama de estados | [04-arquitectura/estados.md](04-arquitectura/estados.md) (6 objetos) |
| 3 | Diagrama entidad-relación | [04-arquitectura/datos-er.md](04-arquitectura/datos-er.md) (4 diagramas, 17 colecciones + 3 docs) |
| 4 | Diagrama de secuencia | [04-arquitectura/secuencias.md](04-arquitectura/secuencias.md) (6 secuencias) |
| 5 | Diagrama de arquitectura | [04-arquitectura/arquitectura.md](04-arquitectura/arquitectura.md) (C4 nivel 1 y 2, hoy y objetivo) |
| 6 | Diagrama de clases | [04-arquitectura/clases.md](04-arquitectura/clases.md) |
| 7 | Diagrama de casos de uso | [01-producto/casos-de-uso.md](01-producto/casos-de-uso.md) (16 casos) |
| 8 | Diagrama de producto y experiencia | [01-producto/mapa-producto.md](01-producto/mapa-producto.md) + [02-ux/journeys.md](02-ux/journeys.md) |
| 9 | (vino vacío) | — |
| 10 | Archify | [04-arquitectura/archify.md](04-arquitectura/archify.md) (graphify + grafo de imports) |

### Diseño

| # | Pedido | Dónde |
|---|---|---|
| 1 | UI/UX Pro Max | [03-design-system/ui-ux-pro-max.md](03-design-system/ui-ux-pro-max.md) |
| 2 | Qué estilo vamos a usar | [estilo-e-identidad.md](03-design-system/estilo-e-identidad.md) + [ADR-0004](08-decisiones/ADR-0004-estilo-visual.md): **Gremio** |
| 3 | Identidad visual | [estilo-e-identidad.md](03-design-system/estilo-e-identidad.md#identidad) |
| 4 | Los 8 aspectos | [fundamentos.md](03-design-system/fundamentos.md) |
| 5 | Design system | [fundamentos.md](03-design-system/fundamentos.md#bloque-theme-propuesto) + [componentes.md](03-design-system/componentes.md) |
| 6 | Interacciones y animaciones | [movimiento.md](03-design-system/movimiento.md) |
| 7 | Diseño de los botones | [componentes.md § Botones](03-design-system/componentes.md#botones) |
| 8 | Accesibilidad y responsive | [accesibilidad-responsive.md](03-design-system/accesibilidad-responsive.md) |

### Ingeniería y calidad

| # | Pedido | Dónde |
|---|---|---|
| 1 | Arquitectura y datos | [04-arquitectura/](04-arquitectura/) |
| 2 | Seguridad y privacidad | [05-seguridad/](05-seguridad/) |
| 3 | Rendimiento y confiabilidad | [06-calidad/rendimiento-confiabilidad.md](06-calidad/rendimiento-confiabilidad.md) |
| 4 | Pruebas y criterios de aceptación | [estrategia-pruebas.md](06-calidad/estrategia-pruebas.md) + [criterios-aceptacion.md](06-calidad/criterios-aceptacion.md) |

### Transversales

| Pedido | Dónde |
|---|---|
| Contrato de diseño entre agentes de IA | [CONTRATO-AGENTES.md](CONTRATO-AGENTES.md) |
| Estados y casos excepcionales | [02-ux/estados-y-excepciones.md](02-ux/estados-y-excepciones.md) |
| Criterios objetivos de calidad | [06-calidad/criterios-objetivos.md](06-calidad/criterios-objetivos.md) |
| Organización en carpetas | esta página (01-producto … 08-decisiones) |

## Los 5 hallazgos más importantes

1. **Seguridad:** las reglas de Firestore no están en el repo, el repo es público y cualquier cuenta de Google puede iniciar sesión → [P0 del roadmap](01-producto/roadmap.md#p0--seguridad-urgente--1-hora).
2. **Confiabilidad:** ningún `onSnapshot` tiene callback de error → si falla un permiso, la app queda en un spinner para siempre.
3. **Fecha UTC:** desde las 21:00 de Argentina la app cree que es mañana ([ADR-0007](08-decisiones/ADR-0007-fecha-local.md)).
4. **Contraste:** los 38 botones principales tienen 3,17:1 (blanco sobre azul); el mínimo es 4,5:1.
5. **Arquitectura:** `App.tsx` es el 36 % del front (4744 líneas); bundle único de 468 KB gzip ([ADR-0005](08-decisiones/ADR-0005-partir-app-tsx.md)).

## Cómo mantener esto vivo

- Si un cambio de código hace falsa una sección "Hoy", se actualiza en el mismo PR (Definition of Done del [contrato](CONTRATO-AGENTES.md#6-definition-of-done)).
- Decisión nueva → ADR nuevo en [08-decisiones](08-decisiones/).
- Mapa de código → regenerar [archify](04-arquitectura/archify.md#cómo-actualizar).
- Sitio HTML → `npm run docs:site` (no se edita a mano).
