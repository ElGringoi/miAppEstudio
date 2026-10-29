# ADR-0003: Docs como código: Markdown + Mermaid + sitio HTML generado

- **Estado:** ✅ aceptada
- **Fecha:** 2026-10-19
- **Decide:** Gastón
- **Relacionado:** [docs/README.md](../README.md), `scripts/docs-site.mjs`, `scripts/imports.mjs`

## Contexto

No había documentación real: el README era el template de Vite y los docs del chat estaban desactualizados. Se pidió planificar antes de seguir codeando, con diagramas y un sistema de diseño, y que **los agentes de IA** puedan leer y respetar esa planificación.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| **A. Markdown + Mermaid en `docs/`** | versionado con el código; diff en los PRs; GitHub y VS Code lo renderizan; cualquier agente lo lee | diagramas menos lindos que una herramienta visual |
| B. Figma / FigJam / Miro | visual, colaborativo | fuera del repo, se desactualiza, los agentes no lo leen fácil |
| C. Notion | lindo para leer | fuera del repo; dos fuentes de verdad |

## Decisión

**A**, más una **página HTML generada** (`npm run docs:site` → `docs/site/index.html`) que junta todos los `.md` con los diagramas renderizados, para leer todo junto y compartirlo.

## Consecuencias

- **Mejora:** los docs viajan con el código y se revisan en el mismo PR.
- **Cuesta:** hay que mantener la sección "Hoy (as-is)" cuando cambia el código (regla en la Definition of Done del [contrato](../CONTRATO-AGENTES.md#6-definition-of-done)).
- **Reglas:**
  - El HTML se regenera, no se edita a mano.
  - El mapa de código ([archify.md](../04-arquitectura/archify.md)) se regenera con graphify + `scripts/imports.mjs`.

## Cómo sabemos si salió bien

Cada PR que cambia comportamiento toca al menos un `.md` de `docs/`; el sitio renderiza todos los diagramas sin error.
