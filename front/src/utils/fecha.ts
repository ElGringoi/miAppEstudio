// Fechas de calendario (YYYY-MM-DD) en hora de Argentina. Es la única fuente de
// "hoy" de la app: toISOString() es UTC y desde las 21 h ya marca el día
// siguiente (ver docs/08-decisiones/ADR-0007-fecha-local.md).

import { diaArgentina, sumarDias } from '../../../server/diario/fecha';

export { sumarDias };

/** Hoy en Argentina, YYYY-MM-DD. */
export const hoyLocal = (): string => diaArgentina();

/** Fecha de calendario (en Argentina) de un Date: un instante o una medianoche local. */
export const isoDe = (d: Date): string => diaArgentina(d);

/** Día de semana de una fecha YYYY-MM-DD: 0 = domingo … 6 = sábado. */
export function diaSemanaIso(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

/** Lunes de la semana (lunes a domingo) que contiene la fecha. */
export function lunesDe(iso: string): string {
  return sumarDias(iso, -((diaSemanaIso(iso) + 6) % 7));
}
