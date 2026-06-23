import type { FSStatsDoc, FSMision, FSHabito, Stat, MissionNode } from '../types';
import type { HabitRecurrence } from '../types';
import { FS_KEYS, STAT_META } from './constants';
import { HOY } from './constants';

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

  function node(m: FSMision, depth: number): MissionNode {
    const kids = misiones.filter(c => c.parentId === m.id).sort((a, b) => a.orden - b.orden).map(c => node(c, depth + 1));
    const prog = kids.length ? Math.round(kids.filter(k => k.progress === 100).length / kids.length * 100) : m.completada ? 100 : 0;
    return { id: m.id, title: m.titulo, type: depth === 0 ? 'epic' : depth === 1 ? 'milestone' : 'task', progress: prog, children: kids.length ? kids : undefined };
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

function getWeekStart(): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isDateInCurrentWeek(dateStr: string): boolean {
  const weekStart = getWeekStart();
  const weekEnd   = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const d = new Date(dateStr + 'T00:00:00');
  return d >= weekStart && d < weekEnd;
}

export function isHabitActiveToday(h: FSHabito): boolean {
  const dow = new Date().getDay();
  const rec = h.recurrence ?? 'daily';
  if (rec === 'daily')     return true;
  if (rec === 'weekdays')  return dow >= 1 && dow <= 5;
  if (rec === 'once_week') return true;
  if (rec === 'weekly')    return (h.diasSemana ?? []).includes(dow);
  return true;
}

export function isHabitDoneToday(h: FSHabito): boolean {
  if (h.recurrence === 'once_week') {
    return (h.completedDates ?? []).some(d => isDateInCurrentWeek(d));
  }
  if (h.fechaCompletado === HOY) return true;
  return (h.completedDates ?? []).includes(HOY);
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
export function calcStreak(completedDates: string[] = [], recurrence: HabitRecurrence = 'daily'): number {
  if (!completedDates.length) return 0;

  if (recurrence === 'daily' || recurrence === 'weekdays') {
    const dateSet = new Set(completedDates);
    let streak = 0;
    const check = new Date();

    // Si hoy no está completo, el streak sigue vivo desde ayer
    if (!dateSet.has(check.toISOString().slice(0, 10))) {
      check.setDate(check.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const str = check.toISOString().slice(0, 10);
      if (dateSet.has(str)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  // Semanal: contar semanas consecutivas con al menos una fecha
  const weekOf = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // lunes
    return date.toISOString().slice(0, 10);
  };
  const weeks = [...new Set(completedDates.map(weekOf))].sort().reverse();
  let streak = 0;
  const todayWeek = weekOf(new Date().toISOString().slice(0, 10));
  let expected = todayWeek;
  for (const w of weeks) {
    if (w === expected) {
      streak++;
      const d = new Date(expected + 'T00:00:00');
      d.setDate(d.getDate() - 7);
      expected = d.toISOString().slice(0, 10);
    } else break;
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

// ── XP ganado por día (últimos N días, de completedDates de hábitos) ─────────
export function calcXpPerDay(
  habitos: FSHabito[],
  days: number
): { date: string; xp: number }[] {
  const result: { date: string; xp: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
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
