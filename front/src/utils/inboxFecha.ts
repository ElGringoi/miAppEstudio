// Propone una fecha y hora a partir del texto de un mensaje ("el jueves asado
// con el cole", "mañana a las 20", "sábado 15 a las 21:30"). Es una ayuda: la
// propuesta siempre se confirma antes de crear el evento.

export interface PropuestaFecha { fecha: string; hora?: string }

const DIAS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

const aIso = (anio: number, mes: number, dia: number) =>
  `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

/** Día de la semana de una fecha ISO (en UTC para no depender de la zona). */
const diaSemana = (iso: string) => new Date(iso + 'T12:00:00Z').getUTCDay();

function sumarDias(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Hora a partir de "20hs", "20:30", "20.30", "a las 21". Solo horas válidas. */
function horaDe(t: string): string | undefined {
  const m = /\b(?:a las\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(?:hs\b|hrs\b|h\b|horas?\b)/.exec(t)
    ?? /\ba las\s+(\d{1,2})(?:[:.](\d{2}))?\b/.exec(t);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return undefined;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Fecha del texto relativa a `hoy` (YYYY-MM-DD). Sin fecha reconocible, undefined. */
function fechaDe(t: string, hoy: string): string | undefined {
  if (/\bpasado manana\b/.test(t)) return sumarDias(hoy, 2);
  if (/\bmanana\b/.test(t)) return sumarDias(hoy, 1);
  if (/\bhoy\b/.test(t)) return hoy;

  const dia = /\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/.exec(t);
  if (dia) {
    const delta = (DIAS[dia[1]] - diaSemana(hoy) + 7) % 7;
    return sumarDias(hoy, delta);
  }

  // "15/10" o "15/10/2026"
  const barra = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/.exec(t);
  // "15 de octubre"
  const deMes = /\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/.exec(t);
  const partes = barra
    ? { d: Number(barra[1]), m: Number(barra[2]), a: barra[3] ? Number(barra[3]) : undefined }
    : deMes
      ? { d: Number(deMes[1]), m: MESES[deMes[2]], a: undefined }
      : undefined;
  if (!partes || partes.m < 1 || partes.m > 12 || partes.d < 1 || partes.d > 31) return undefined;

  const anioHoy = Number(hoy.slice(0, 4));
  let fecha = aIso(partes.a ?? anioHoy, partes.m, partes.d);
  // Sin año: si ya pasó este año, es el del año que viene.
  if (!partes.a && fecha < hoy) fecha = aIso(anioHoy + 1, partes.m, partes.d);
  return fecha;
}

/**
 * Propone fecha y hora para un mensaje. Necesita al menos una fecha; la hora es
 * opcional. Devuelve undefined si el texto no tiene una fecha reconocible.
 */
export function proponerFecha(texto: string, hoy: string): PropuestaFecha | undefined {
  const t = normalizar(texto);
  const fecha = fechaDe(t, hoy);
  if (!fecha) return undefined;
  const hora = horaDe(t);
  return hora ? { fecha, hora } : { fecha };
}
