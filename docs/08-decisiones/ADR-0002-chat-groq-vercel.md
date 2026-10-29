# ADR-0002: Chat del Segundo Cerebro con Groq desde una función de Vercel

- **Estado:** ✅ aceptada (registra el cambio del commit `6f4fa97` y el PR #31)
- **Fecha:** 2026-10-19
- **Decide:** Gastón
- **Relacionado:** [segundo-cerebro.md](../07-operaciones/segundo-cerebro.md), [modelo-amenazas.md](../05-seguridad/modelo-amenazas.md)

## Contexto

La fase 1 del chat usaba una Cloud Function de Firebase con la API de Claude (`SEGUNDO_CEREBRO_SETUP.md`). Se reemplazó por `api/cerebro-chat.ts` en Vercel llamando a Groq (`llama-3.3-70b-versatile`), y la Cloud Function se borró.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| A. Cloud Function + Claude | modelo más capaz | requiere plan Blaze de Firebase; otro lugar de deploy |
| **B. Vercel + Groq** (hoy) | mismo deploy que el front; Groq tiene capa gratis y responde rápido | modelo menos capaz; otro proveedor que recibe datos personales |
| C. LLM en el navegador | nada sale del dispositivo | pesado, lento en móviles |

## Decisión

**B.** La key vive solo en Vercel (`GROQ_API_KEY`); el cliente manda el ID token de Firebase.

## Consecuencias

- **Mejora:** un solo deploy; la key nunca llega al navegador (`lib/cerebro-api.ts:1-4`).
- **Cuesta:** Groq recibe fragmentos de notas y de personas ([privacidad.md](../05-seguridad/privacidad.md)). Hoy cualquier cuenta de Google con sesión válida puede usar el endpoint.
- **Hay que hacer:** verificar el token con firebase-admin + lista de uids permitidos + rate limit (P1); actualizar `.env.local.example`; borrar los setups viejos (hecho en este cambio).

## Cómo sabemos si salió bien

El chat responde en < 3 s y ningún pedido sin uid permitido llega a Groq (verificable en los logs de Vercel).

**Revisar si:** se quiere un modelo más capaz (cambiar `GROQ_MODEL` o de proveedor detrás de la misma función) o búsqueda semántica con embeddings.
