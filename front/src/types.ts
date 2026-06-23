import type { ReactNode } from 'react';

// ─── Firestore types ──────────────────────────────────────────────────────────

export type FSStatKey = 'fuerza' | 'salud' | 'inteligencia' | 'agilidad' | 'carisma' | 'fe';
export type FSStatsDoc = Record<FSStatKey, { xp: number }>;
export type HabitRecurrence = 'daily' | 'weekdays' | 'once_week' | 'weekly';
export type FSHabito  = { id: string; nombre: string; stat: FSStatKey; fechaCompletado: string | null; xpValue?: number; recurrence?: HabitRecurrence; diasSemana?: number[]; completedDates?: string[] };
export type FSEvento  = { id: string; titulo: string; hora?: string; fecha: string };
export type FSMision  = { id: string; titulo: string; completada: boolean; parentId: string | null; orden: number };
export type FSTarea   = { id: string; titulo: string; hora?: string; recurrence: 'once' | 'daily' | 'weekly'; weekday?: number; date?: string; color: string; completedDates: string[] };
export type GCalEvent = { id: string; summary?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } };
export type FSEjercicio = { id: string; nombre: string; series?: number; reps?: string; notas?: string; mediaUrl?: string; lastCompletedDate: string | null };
export type FSRutina    = { id: string; nombre: string; diasSemana: number[]; ejercicios: FSEjercicio[]; orden: number };
export type EstadoLibro = 'leyendo' | 'leido' | 'pendiente';
export type FSCapitulo  = { id: string; numero: number; titulo?: string; leido: boolean; notas?: string };
export type FSLibro     = { id: string; titulo: string; autor?: string; estado: EstadoLibro; capitulos: FSCapitulo[]; xpPorCapitulo: number };
export type TipoMaterial = 'nota' | 'video' | 'enlace';
export type FSMaterial  = { id: string; tipo: TipoMaterial; titulo: string; contenido?: string; url?: string };
export type FSTareaFac  = { id: string; titulo: string; fecha?: string; completada: boolean };
export type FSExamen    = { id: string; titulo: string; fecha?: string; nota?: number; notaMax: number };
export type FSMateria   = { id: string; nombre: string; color: string; materiales: FSMaterial[]; tareas: FSTareaFac[]; examenes: FSExamen[] };
export type FSEntradaDiario = { id: string; fecha: string; titulo?: string; contenido: string };
export type FSObjetivoCHA   = { id: string; titulo: string; completado: boolean; orden: number };
export type FSTransaccion   = { id: string; descripcion: string; monto: number; tipo: 'ingreso' | 'gasto'; categoria: string; fecha: string };
export type LogroId =
  | 'primera_quest' | 'racha_7' | 'racha_30' | 'nivel_5' | 'nivel_10'
  | 'primer_libro' | 'primer_examen' | 'todos_hoy' | 'xp_100_dia';
export type FSLogro = { id: LogroId; fecha: string };

// ─── UI types ─────────────────────────────────────────────────────────────────

export type TabId = 'dashboard' | 'calendar' | 'gym' | 'attributes' | 'habits' | 'missions' | 'billetera' | 'settings';
export interface Stat { name: string; value: number; max: number; level: number; icon: ReactNode; color: string; description: string; shortName: string; }
export interface Habit { id: string; name: string; stat: FSStatKey; icon: ReactNode; completed: boolean; activeToday: boolean; attribute: string; xpValue: number; recurrence: HabitRecurrence; diasSemana: number[]; }
export interface MissionNode { id: string; title: string; type: 'epic' | 'milestone' | 'task'; progress: number; children?: MissionNode[]; }
export interface Task { id: string; title: string; time: string; color: string; completed: boolean; recurrence: 'once' | 'daily' | 'weekly'; weekday?: number; date?: string; completedDates: string[]; }
