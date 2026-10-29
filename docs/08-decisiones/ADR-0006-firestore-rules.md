# ADR-0006: Versionar `firestore.rules` y testearlas con el emulador

- **Estado:** 📝 propuesta
- **Fecha:** 2026-10-19
- **Decide:** Gastón
- **Relacionado:** [firestore-rules.md](../05-seguridad/firestore-rules.md), [modelo-amenazas.md](../05-seguridad/modelo-amenazas.md), [ADR-0001](ADR-0001-firebase-cliente.md)

## Contexto

Por [ADR-0001](ADR-0001-firebase-cliente.md), las reglas de Firestore son la **única** defensa de los datos. Hoy:

- No existen en el repo ni en el historial de git; solo viven en la consola.
- El repo es público.
- Cualquier cuenta de Google puede iniciar sesión.

Si las reglas actuales son `request.auth != null`, cualquiera con una cuenta de Google lee las personas, finanzas y notas de Gastón.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| A. Seguir editando en la consola | nada que cambiar | invisibles, sin revisión, sin tests, sin historial en el repo |
| **B. `firestore.rules` en el repo + tests con emulador + deploy desde el repo** | revisables en PR; tests automáticos; historial | hay que instalar `firebase-tools` y aprender el emulador |

## Decisión

**B.** Primero copiar las reglas actuales tal cual (15 min) para tener línea base; después aplicar la propuesta de [firestore-rules.md](../05-seguridad/firestore-rules.md) con sus 11 tests.

## Consecuencias

- **Mejora:** la seguridad se puede auditar; los cambios de esquema y de reglas viajan juntos.
- **Cuesta:**
  - Todo cambio de esquema exige tocar reglas y tests.
  - El deploy de reglas pasa a ser un paso explícito (`firebase deploy --only firestore:rules`).
- **Hay que hacer:** fase P0 (copiar y revisar) y P1 (validaciones + tests) del [roadmap](../01-producto/roadmap.md).

## Cómo sabemos si salió bien

Criterio [S2](../06-calidad/criterios-objetivos.md#confiabilidad-y-seguridad): existe `firestore.rules` y los 11 casos pasan; un usuario B no puede leer `usuarios/A/**`.
