import type { FSStatsDoc, FSMision, FSHabito, FSRoca, Stat, MissionNode, FSStatKey } from '../types';
import type { HabitRecurrence } from '../types';
import { FS_KEYS, STAT_META } from './constants';
import { hoyLocal, sumarDias, diaSemanaIso, lunesDe } from './fecha';

// Cada nivel requiere 100 XP más que el anterior: L1→L2=100, L2→L3=200...
export function xpLevel(totalXp: number) {
  let level = 1;
  let xpForNext = 100;
  let remaining = totalXp;
  while (remaining >= xpForNext) {
    remaining -= xpForNext;
    level++;
    xpForNext += 100;
  }
  return { level, xpInLevel: remaining, xpForNext };
}

export function statsFromDoc(fsDoc: FSStatsDoc | null): Stat[] {
  return FS_KEYS.map(key => {
    const xp = fsDoc?.[key]?.xp ?? 0;
    const { level, xpInLevel, xpForNext } = xpLevel(xp);
    return { ...STAT_META[key], value: xpInLevel, max: xpForNext, level };
  });
}

export function buildTree(misiones: FSMision[]): MissionNode {
  const empty: MissionNode = { id: 'root', title: 'My Missions', type: 'epic', progress: 0, children: [] };
  if (!misiones.length) return empty;

  const completedIds = new Set(misiones.filter(m => m.completada).map(m => m.id));

  function node(m: FSMision, depth: number): MissionNode {
    const kids = misiones.filter(c => c.parentId === m.id).sort((a, b) => a.orden - b.orden).map(c => node(c, depth + 1));
    const prog = kids.length ? Math.round(kids.filter(k => k.progress === 100).length / kids.length * 100) : m.completada ? 100 : 0;
    const bloqueada = (m.prerequisitos ?? []).some(pid => !completedIds.has(pid));
    return {
      id: m.id, title: m.titulo,
      type: depth === 0 ? 'epic' : depth === 1 ? 'milestone' : 'task',
      progress: prog,
      children: kids.length ? kids : undefined,
      prioridad: m.prioridad,
      descripcion: m.descripcion,
      prerequisitos: m.prerequisitos,
      costoMonto: m.costoMonto,
      costoMoneda: m.costoMoneda,
      bloqueada,
    };
  }

  const roots = misiones.filter(m => !m.parentId).sort((a, b) => a.orden - b.orden);
  if (!roots.length) return empty;
  if (roots.length === 1) return node(roots[0], 0);
  const children = roots.map(r => node(r, 1));
  return { id: 'root', title: 'My Missions', type: 'epic', progress: Math.round(children.reduce((s, c) => s + c.progress, 0) / children.length), children };
}

export function youtubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
}

// `hoy` es parámetro para poder testear; por defecto es hoy en Argentina.
export function isDateInCurrentWeek(dateStr: string, hoy: string = hoyLocal()): boolean {
  const lunes = lunesDe(hoy);
  return dateStr >= lunes && dateStr <= sumarDias(lunes, 6);
}

export function isHabitActiveToday(h: FSHabito, hoy: string = hoyLocal()): boolean {
  const dow = diaSemanaIso(hoy);
  const rec = h.recurrence ?? 'daily';
  if (rec === 'daily')     return true;
  if (rec === 'weekdays')  return dow >= 1 && dow <= 5;
  if (rec === 'once_week') return true;
  if (rec === 'weekly')    return (h.diasSemana ?? []).includes(dow);
  return true;
}

export function isHabitDoneToday(h: FSHabito, hoy: string = hoyLocal()): boolean {
  if (h.recurrence === 'once_week') {
    return (h.completedDates ?? []).some(d => isDateInCurrentWeek(d, hoy));
  }
  if (h.fechaCompletado === hoy) return true;
  return (h.completedDates ?? []).includes(hoy);
}

export function habitRecurrenceLabel(recurrence: string, diasSemana: number[], diasCorto: string[]): string {
  if (recurrence === 'daily')     return 'Todos los días';
  if (recurrence === 'weekdays')  return 'Lun — Vie';
  if (recurrence === 'once_week') return '1× por semana';
  if (recurrence === 'weekly') {
    const sorted = [...diasSemana].sort((a, b) => a - b);
    return sorted.map(d => diasCorto[d]).join(', ') || 'Sin días';
  }
  return '';
}

// ── Streak: días consecutivos completados ────────────────────────────────────
export function calcStreak(
  completedDates: string[] = [],
  recurrence: HabitRecurrence = 'daily',
  hoy: string = hoyLocal(),
): number {
  if (!completedDates.length) return 0;

  if (recurrence === 'daily' || recurrence === 'weekdays') {
    const dateSet = new Set(completedDates);
    // Los hábitos de días hábiles no cortan la racha el fin de semana.
    const cuenta = (iso: string) => {
      const dow = diaSemanaIso(iso);
      return recurrence === 'daily' || (dow >= 1 && dow <= 5);
    };
    let dia = hoy;
    // Si hoy no está completo, la racha sigue viva desde ayer
    if (!dateSet.has(dia)) dia = sumarDias(dia, -1);

    let streak = 0;
    for (let i = 0; i < 400; i++) {
      if (!cuenta(dia)) { dia = sumarDias(dia, -1); continue; }
      if (!dateSet.has(dia)) break;
      streak++;
      dia = sumarDias(dia, -1);
    }
    return streak;
  }

  // Semanal: semanas consecutivas (lunes a domingo) con al menos una fecha.
  // Igual que en los diarios, si esta semana todavía no está hecha la racha
  // sigue viva desde la semana anterior.
  const semanas = new Set(completedDates.map(lunesDe));
  let esperada = lunesDe(hoy);
  if (!semanas.has(esperada)) esperada = sumarDias(esperada, -7);
  let streak = 0;
  while (semanas.has(esperada)) {
    streak++;
    esperada = sumarDias(esperada, -7);
  }
  return streak;
}

// ── Nivel principal (promedio de todos los stats) ────────────────────────────
export function calcMainLevel(stats: FSStatsDoc | null): { level: number; xpTotal: number } {
  if (!stats) return { level: 1, xpTotal: 0 };
  let totalXp = 0;
  let totalLevel = 0;
  for (const key of FS_KEYS) {
    const xp = stats[key]?.xp ?? 0;
    const { level } = xpLevel(xp);
    totalXp += xp;
    totalLevel += level;
  }
  return { level: Math.max(1, Math.floor(totalLevel / FS_KEYS.length)), xpTotal: totalXp };
}

// ── Rango por nivel principal ────────────────────────────────────────────────
export function rankFromLevel(level: number): string {
  if (level < 10) return 'E';
  if (level < 20) return 'D';
  if (level < 30) return 'C';
  if (level < 40) return 'B';
  if (level < 50) return 'A';
  if (level < 60) return 'S';
  if (level < 70) return 'SS';
  return 'Monarch';
}

// ── Clase según distribución de stats ────────────────────────────────────────
export function assignClass(stats: FSStatsDoc | null): string {
  if (!stats) return 'Sin clase';
  const levels = {
    fuerza:       xpLevel(stats.fuerza?.xp ?? 0).level,
    inteligencia: xpLevel(stats.inteligencia?.xp ?? 0).level,
    agilidad:     xpLevel(stats.agilidad?.xp ?? 0).level,
    salud:        xpLevel(stats.salud?.xp ?? 0).level,
    carisma:      xpLevel(stats.carisma?.xp ?? 0).level,
    fe:           xpLevel(stats.fe?.xp ?? 0).level,
  };
  const maxLevel = Math.max(...Object.values(levels));
  if (maxLevel <= 1) return 'Aventurero';

  const thresh = maxLevel * 0.75;
  const highFuerza = levels.fuerza >= thresh;
  const highInt    = levels.inteligencia >= thresh;

  // Espadachín mágico: ambas dentro del 75% del máximo
  if (highFuerza && highInt) return 'Espadachín Mágico';

  // Clase por stat dominante
  const top = (Object.entries(levels) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
  switch (top) {
    case 'fuerza':       return 'Guerrero';
    case 'inteligencia': return 'Mago';
    case 'agilidad':     return 'Asesino';
    case 'salud':        return 'Tanque';
    case 'carisma':      return 'Bardo';
    case 'fe':           return 'Paladín';
    default:             return 'Aventurero';
  }
}

// ── Multiplicador de XP según racha ─────────────────────────────────────────
export function streakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7)  return 1.25;
  return 1.0;
}

// ── Marcar / desmarcar un hábito ─────────────────────────────────────────────
// Guarda cuánto XP dio cada fecha (xpPorFecha) para que desmarcar reste
// exactamente eso, aunque el multiplicador de racha haya cambiado.
export interface CambioHabito {
  yaHecho: boolean;
  completedDates: string[];
  xpPorFecha: Record<string, number>;
  /** XP a sumar (positivo) o restar (negativo) al stat. */
  delta: number;
  mult: number;
}

export const DIAS_HISTORIAL = 90;

export function calcToggleHabito(h: FSHabito, hoy: string = hoyLocal()): CambioHabito {
  const prev = h.completedDates ?? (h.fechaCompletado ? [h.fechaCompletado] : []);
  const base = h.xpValue ?? 20;
  const xpPrev = { ...(h.xpPorFecha ?? {}) };
  const yaHecho = isHabitDoneToday(h, hoy);
  let fechas: string[];
  let delta: number;
  let mult = 1;

  if (yaHecho) {
    const quitar = new Set(h.recurrence === 'once_week'
      ? prev.filter(d => isDateInCurrentWeek(d, hoy))
      : [hoy]);
    delta = -[...quitar].filter(d => prev.includes(d)).reduce((s, d) => s + (xpPrev[d] ?? base), 0);
    // Hecho solo por el campo viejo fechaCompletado: se resta el XP base, como antes.
    if (delta === 0) delta = -base;
    fechas = prev.filter(d => !quitar.has(d));
  } else {
    mult = streakMultiplier(calcStreak(prev, h.recurrence ?? 'daily', hoy));
    const xp = Math.round(base * mult);
    delta = xp;
    fechas = [...prev, hoy];
    xpPrev[hoy] = xp;
  }

  const corte = sumarDias(hoy, -DIAS_HISTORIAL);
  const completedDates = fechas.filter(d => d >= corte);
  const xpPorFecha = Object.fromEntries(
    Object.entries(xpPrev).filter(([d]) => completedDates.includes(d)),
  );
  return { yaHecho, completedDates, xpPorFecha, delta, mult };
}

// ── Borrar una misión sin dejar referencias colgadas ─────────────────────────
export interface PlanBorrado {
  /** La misión y todas sus descendientes. */
  borrar: string[];
  /** Misiones que tenían alguna borrada como prerequisito, con la lista limpia. */
  prerequisitos: { id: string; prerequisitos: string[] }[];
  /** Rocas que la tenían vinculada, con la lista limpia. */
  rocas: { id: string; linkedMisionIds: string[] }[];
}

export function planBorrarMision(misiones: FSMision[], id: string, rocas: FSRoca[] = []): PlanBorrado {
  const borrar = new Set<string>([id]);
  // Descendientes a cualquier profundidad (con tope por si hubiera un ciclo).
  for (let cambio = true, vueltas = 0; cambio && vueltas < 1000; vueltas++) {
    cambio = false;
    for (const m of misiones) {
      if (m.parentId && borrar.has(m.parentId) && !borrar.has(m.id)) { borrar.add(m.id); cambio = true; }
    }
  }
  const prerequisitos = misiones
    .filter(m => !borrar.has(m.id) && (m.prerequisitos ?? []).some(p => borrar.has(p)))
    .map(m => ({ id: m.id, prerequisitos: (m.prerequisitos ?? []).filter(p => !borrar.has(p)) }));
  const rocasLimpias = rocas
    .filter(r => (r.linkedMisionIds ?? []).some(p => borrar.has(p)))
    .map(r => ({ id: r.id, linkedMisionIds: (r.linkedMisionIds ?? []).filter(p => !borrar.has(p)) }));
  return { borrar: [...borrar], prerequisitos, rocas: rocasLimpias };
}

// ── XP ganado por stat (fuentes de XP) ──────────────────────────────────────
export function calcXpBySource(habitos: FSHabito[], statKey: FSStatKey): { nombre: string; xpTotal: number; veces: number }[] {
  return habitos
    .filter(h => h.stat === statKey)
    .map(h => ({
      nombre: h.nombre,
      xpTotal: (h.completedDates?.length ?? 0) * (h.xpValue ?? 20),
      veces: h.completedDates?.length ?? 0,
    }))
    .filter(h => h.veces > 0)
    .sort((a, b) => b.xpTotal - a.xpTotal);
}

// ── XP ganado por día (últimos N días, de completedDates de hábitos) ─────────
export function calcXpPerDay(
  habitos: FSHabito[],
  days: number,
  hoy: string = hoyLocal(),
): { date: string; xp: number }[] {
  const result: { date: string; xp: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dateStr = sumarDias(hoy, -i);
    let xp = 0;
    for (const h of habitos) {
      if ((h.completedDates ?? []).includes(dateStr)) {
        xp += h.xpValue ?? 20;
      }
    }
    result.push({ date: dateStr, xp });
  }
  return result;
}

// ─── Segundo Cerebro ──────────────────────────────────────────────────────────

export function shortDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

/** Días desde hoy (en Argentina) hasta una fecha ISO. Negativo si ya pasó. */
export function diasHasta(iso: string, hoy: string = hoyLocal()): number {
  const t = (s: string) => { const [a, m, d] = s.split('-').map(Number); return Date.UTC(a, m - 1, d); };
  return Math.round((t(iso) - t(hoy)) / 86400000);
}

/**
 * Próxima ocurrencia de una fecha clave.
 * Si es anual, salta al año que viene cuando ya pasó este año.
 * Devuelve la fecha ISO y cuántos días faltan (null si no es anual y ya pasó).
 */
export function proximaOcurrencia(fecha: string, anual: boolean, hoy: string = hoyLocal()): { iso: string; dias: number } | null {
  if (!anual) {
    const dias = diasHasta(fecha, hoy);
    return dias >= 0 ? { iso: fecha, dias } : null;
  }
  const [, mes, dia] = fecha.split('-');
  let año = Number(hoy.slice(0, 4));
  let iso = `${año}-${mes}-${dia}`;
  if (diasHasta(iso, hoy) < 0) { año += 1; iso = `${año}-${mes}-${dia}`; }
  return { iso, dias: diasHasta(iso, hoy) };
}

/**
 * Saldo de pendientes agrupado por moneda. Ignora los saldados y los que no
 * tienen monto (favores). Positivo = me deben, negativo = le debo.
 */
export function saldoPendientes(
  pendientes: { direccion: 'le_debo' | 'me_debe'; monto?: number; moneda?: string; saldado: boolean }[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of pendientes) {
    if (p.saldado || !Number.isFinite(p.monto)) continue;
    const m = p.moneda ?? 'ARS';
    out[m] = (out[m] ?? 0) + (p.direccion === 'me_debe' ? p.monto! : -p.monto!);
  }
  return out;
}

// ─── Billetera ────────────────────────────────────────────────────────────────

/** 'YYYY-MM' → el mes anterior, cruzando bien el cambio de año. */
export function mesAnterior(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return m === 1
    ? `${a - 1}-12`
    : `${a}-${String(m - 1).padStart(2, '0')}`;
}
