# ADR-0001: Usar Firebase directo desde el cliente, sin backend propio

- **Estado:** ✅ aceptada (registra cómo está construida la app)
- **Fecha:** 2026-10-19
- **Decide:** Gastón
- **Relacionado:** [arquitectura.md](../04-arquitectura/arquitectura.md), [ADR-0006](ADR-0006-firestore-rules.md)

## Contexto

La app es de **un solo usuario**. Todo se lee y escribe desde el navegador con el SDK de Firestore (`front/src/App.tsx`, 20 listeners `onSnapshot`), con caché offline multi-pestaña (`lib/firebase.ts:21`). Las únicas funciones de servidor son `api/edicion.ts` y `api/cerebro-chat.ts` en Vercel.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| **A. Firebase desde el cliente** (hoy) | tiempo real y offline gratis; sin servidor que operar; plan Spark gratis | la seguridad depende 100 % de las reglas; la lógica de XP vive en el cliente |
| B. Backend propio (API + DB) | validación en el servidor; lógica centralizada | hay que operarlo y pagarlo; se pierde el offline gratis; reescribir todo |
| C. Firebase + Cloud Functions para escrituras sensibles | XP calculado en el servidor | más latencia en cada quest; plan Blaze (pago); complejidad |

## Decisión

Seguimos con **A**. Para un usuario, el beneficio de un backend no paga su costo.

## Consecuencias

- **Mejora:** arranque y uso offline instantáneos; cero infraestructura.
- **Cuesta:** las reglas de Firestore son la única defensa → [ADR-0006](ADR-0006-firestore-rules.md) es obligatorio. Un usuario podría editar su propio XP desde la consola del navegador (aceptado: no hay competencia entre usuarios).
- **Hay que hacer:** reglas versionadas con validación de tipos; capa `data/` con conversores ([ADR-0005](ADR-0005-partir-app-tsx.md)).

## Cómo sabemos si salió bien

Los 11 tests de reglas del emulador pasan ([firestore-rules.md](../05-seguridad/firestore-rules.md)) y las lecturas diarias quedan por debajo del 50 % de la cuota gratis.

**Revisar esta decisión si:** la app pasa a tener más de un usuario real, o aparecen rankings entre personas.
