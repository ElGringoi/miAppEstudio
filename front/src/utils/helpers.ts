import type { FSStatsDoc, FSMision, FSHabito, Stat, MissionNode } from '../types';
import { FS_KEYS, STAT_META } from './constants';
import { HOY } from './constants';

// Cada nivel requiere 100 XP más que el anterior: L1→L2=100, L2→L3=200, L3→L4=300...
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
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // lunes
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
