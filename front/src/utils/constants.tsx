import React from 'react';
import { Dumbbell, Heart, Brain, Zap, Sparkles, Star } from 'lucide-react';
import type { FSStatKey, EstadoLibro, TipoMaterial, Stat } from '../types';

export const HOY = new Date().toISOString().slice(0, 10);
export const CATEGORIAS_GASTO   = ['🍔 Comida', '🚗 Transporte', '🏠 Vivienda', '💊 Salud', '📚 Educación', '🎮 Ocio', '🛒 Compras', '📦 Otro'];
export const CATEGORIAS_INGRESO = ['💼 Trabajo', '💻 Freelance', '📈 Inversión', '🎁 Regalo', '📦 Otro'];
export const FS_KEYS: FSStatKey[] = ['fuerza', 'salud', 'inteligencia', 'agilidad', 'carisma', 'fe'];
export const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DIAS_LETRA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export const STAT_META: Record<FSStatKey, Omit<Stat, 'value' | 'max' | 'level'>> = {
  fuerza:       { name: 'Fuerza',        icon: <Dumbbell className="w-4 h-4" />, color: 'bg-red-500',     shortName: 'STR', description: 'Rendimiento físico y entrenamiento.' },
  salud:        { name: 'Salud',         icon: <Heart    className="w-4 h-4" />, color: 'bg-rose-500',    shortName: 'SAL', description: 'Bienestar físico y hábitos de vida.'  },
  inteligencia: { name: 'Inteligencia',  icon: <Brain    className="w-4 h-4" />, color: 'bg-blue-500',    shortName: 'INT', description: 'Aprendizaje y resolución de problemas.' },
  agilidad:     { name: 'Agilidad',      icon: <Zap      className="w-4 h-4" />, color: 'bg-emerald-500', shortName: 'AGI', description: 'Velocidad, reflejos y precisión.'      },
  carisma:      { name: 'Carisma',       icon: <Sparkles className="w-4 h-4" />, color: 'bg-yellow-500',  shortName: 'CHA', description: 'Comunicación y liderazgo.'            },
  fe:           { name: 'Fe',            icon: <Star     className="w-4 h-4" />, color: 'bg-violet-500',  shortName: 'FE',  description: 'Propósito, espiritualidad y valores.'  },
};

export const ESTADO_LIBRO_META: Record<EstadoLibro, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
  leyendo:   { label: 'Leyendo',   color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  leido:     { label: 'Leído',     color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
};

export const MATERIAL_ICON: Record<TipoMaterial, React.ReactNode> = {
  nota:   <span className="text-xs">📝</span>,
  video:  <span className="text-xs">🎥</span>,
  enlace: <span className="text-xs">🔗</span>,
};

export const CLASS_META: Record<string, { icon: string; color: string; desc: string }> = {
  'Sin clase':         { icon: '❓', color: 'text-slate-400',   desc: 'Tu camino aún no está definido.' },
  'Aventurero':        { icon: '🗡️', color: 'text-slate-500',   desc: 'Equilibrado y versátil.' },
  'Guerrero':          { icon: '⚔️', color: 'text-red-500',     desc: 'Maestro de la fuerza física.' },
  'Mago':              { icon: '🔮', color: 'text-blue-500',    desc: 'Domina el conocimiento y la magia.' },
  'Espadachín Mágico': { icon: '✨', color: 'text-purple-500',  desc: 'Combina fuerza y magia en perfecta armonía.' },
  'Asesino':           { icon: '🗡️', color: 'text-emerald-500', desc: 'Veloz y letal.' },
  'Tanque':            { icon: '🛡️', color: 'text-rose-500',    desc: 'Resistente e irrompible.' },
  'Bardo':             { icon: '🎭', color: 'text-yellow-500',  desc: 'Líder e inspirador de aliados.' },
  'Paladín':           { icon: '⚡', color: 'text-violet-500',  desc: 'Guiado por la fe y el propósito.' },
};

export const RANK_META: Record<string, { color: string; label: string; next: number }> = {
  'E':       { color: 'text-slate-400',   label: 'E-Rank',  next: 10 },
  'D':       { color: 'text-green-500',   label: 'D-Rank',  next: 20 },
  'C':       { color: 'text-blue-500',    label: 'C-Rank',  next: 30 },
  'B':       { color: 'text-purple-500',  label: 'B-Rank',  next: 40 },
  'A':       { color: 'text-orange-500',  label: 'A-Rank',  next: 50 },
  'S':       { color: 'text-yellow-500',  label: 'S-Rank',  next: 60 },
  'SS':      { color: 'text-red-500',     label: 'SS-Rank', next: 70 },
  'Monarch': { color: 'text-violet-400',  label: 'Monarch', next: Infinity },
};
