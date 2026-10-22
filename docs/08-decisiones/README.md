# Decisiones (ADR)

> Architecture Decision Records: una página por decisión importante, con el contexto en que se tomó. No se borran: si una decisión cambia, se escribe un ADR nuevo que **reemplaza** al viejo y se marca el viejo como "reemplazada por ADR-XXXX". Cuándo escribir uno: [contrato de agentes §5](../CONTRATO-AGENTES.md#5-cuándo-escribir-un-adr).

| ADR | Decisión | Estado | Fecha |
|---|---|---|---|
| [0001](ADR-0001-firebase-cliente.md) | Firebase directo desde el cliente, sin backend propio | ✅ aceptada | 2026-10-19 (registra lo existente) |
| [0002](ADR-0002-chat-groq-vercel.md) | Chat del Segundo Cerebro con Groq desde una función de Vercel | ✅ aceptada | 2026-10-19 (registra `6f4fa97`) |
| [0003](ADR-0003-docs-como-codigo.md) | Docs como código: Markdown + Mermaid + sitio HTML generado | ✅ aceptada | 2026-10-19 |
| [0004](ADR-0004-estilo-visual.md) | Estilo visual "Gremio" (claymorphism oscuro) | ✅ aceptada | 2026-10-19 |
| [0005](ADR-0005-partir-app-tsx.md) | Partir `App.tsx` en features + domain + data + ui | 📝 propuesta | 2026-10-19 |
| [0006](ADR-0006-firestore-rules.md) | Versionar `firestore.rules` y testearlas con el emulador | 📝 propuesta | 2026-10-19 |
| [0007](ADR-0007-fecha-local.md) | Fecha "hoy" en hora de Argentina, no UTC | ✅ aceptada (P1) | 2026-10-19 |

Estados: 📝 propuesta → ✅ aceptada → ♻️ reemplazada · ❌ rechazada.

Formato: [plantilla.md](plantilla.md).
