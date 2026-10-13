// Fechas en hora de Argentina. HOY (utils/constants.tsx) usa UTC y desde las
// 21 h ya marca el día siguiente; el diario usa estas funciones en su lugar.

const ZONA = 'America/Argentina/Buenos_Aires';

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
});

/** YYYY-MM-DD del instante dado, en Argentina. */
export function diaArgentina(instante: Date | number = Date.now()): string {
  return formatoDia.format(instante);
}

export function hoyArgentina(): string {
  return diaArgentina();
}

/** Suma días a una fecha YYYY-MM-DD (aritmética de calendario, sin zona). */
export function sumarDias(iso: string, n: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + n));
  return f.toISOString().slice(0, 10);
}

/** Hora HH:MM en Argentina. */
export function horaArgentina(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));
}

/** Día de semana abreviado en mayúsculas ("SÁB") en Argentina. */
export function diaSemanaArgentina(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, weekday: 'short' })
    .format(new Date(iso))
    .replace('.', '')
    .toUpperCase();
}
