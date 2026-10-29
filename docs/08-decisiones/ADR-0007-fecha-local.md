# ADR-0007: Usar la fecha "hoy" en hora de Argentina, no UTC

- **Estado:** ✅ aceptada e implementada en P1 (`front/src/utils/fecha.ts`)
- **Fecha:** 2026-10-19
- **Decide:** Gastón
- **Relacionado:** [estados-y-excepciones.md](../02-ux/estados-y-excepciones.md) casos 1 y 2, [rendimiento-confiabilidad.md](../06-calidad/rendimiento-confiabilidad.md)

## Contexto

`front/src/utils/constants.tsx:6-7`:

```ts
export const HOY = new Date().toISOString().slice(0, 10);
export const getToday = () => new Date().toISOString().slice(0, 10);
```

`toISOString()` es UTC. Argentina es UTC−3, así que **desde las 21:00 la app cree que ya es mañana**:

- Los hábitos del día aparecen sin marcar.
- La reflexión del Cierre del día (que se abre justo después de las 21:00) se guarda con la fecha de mañana (`App.tsx:1483`).
- Además, `HOY` se calcula una sola vez al cargar el módulo: si la app queda abierta pasada la medianoche, sigue en el día anterior.

La Gaceta ya resuelve esto bien con `hoyArgentina()` en `server/diario/fecha.ts`.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| A. Dejar UTC | nada que cambiar | bug diario después de las 21:00 |
| B. Hora local del dispositivo (`getFullYear/getMonth/getDate`) | simple; sigue al usuario si viaja | un dispositivo con zona mal configurada rompe las rachas |
| **C. Zona fija `America/Argentina/Buenos_Aires` con `Intl`** | igual que La Gaceta; un solo criterio en front y server | si Gastón viaja, "hoy" sigue siendo Argentina (aceptable) |

## Decisión

**C.** Un único helper `hoyLocal()` en `domain/fecha.ts` (reusando la lógica de `server/diario/fecha.ts`), recalculado al volver a la pestaña (`visibilitychange`). Se eliminan `HOY` y `getToday`.

## Consecuencias

- **Mejora:** rachas y cierre del día correctos de noche.
- **Cuesta:** los datos ya guardados entre las 21:00 y las 23:59 quedaron con la fecha del día siguiente. **No se migran** (son pocas fechas y corregirlas podría romper rachas); se documenta.
- **Hay que hacer:** test con `vi.setSystemTime('2026-10-19T23:30:00-03:00')` → `hoyLocal() === '2026-10-19'`. Fase P1 del [roadmap](../01-producto/roadmap.md).

## Cómo sabemos si salió bien

Marcar un hábito a las 23:30 hora argentina lo registra en la fecha de ese día (criterio AC-DASH-4).
