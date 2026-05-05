// QuestFlow Design System — Slate/Blue con acentos por stat
export const QF = {
  colors: {
    // Fondos
    bg: '#0f172a',         // slate-900
    surface: '#1e293b',    // slate-800
    card: '#1e293b',
    cardBorder: '#334155', // slate-700
    elevated: '#293548',

    // Texto
    textPrimary: '#f1f5f9',   // slate-100
    textSecondary: '#94a3b8', // slate-400
    textMuted: '#475569',     // slate-600

    // Acento principal
    accent: '#3b82f6',     // blue-500
    accentDim: '#1d4ed8',  // blue-700
    accentGlow: 'rgba(59,130,246,0.2)',

    // Stats
    stats: {
      fuerza:      { main: '#ef4444', dim: '#7f1d1d', glow: 'rgba(239,68,68,0.25)' },
      inteligencia:{ main: '#3b82f6', dim: '#1e3a8a', glow: 'rgba(59,130,246,0.25)' },
      carisma:     { main: '#a855f7', dim: '#4a1772', glow: 'rgba(168,85,247,0.25)' },
      agilidad:    { main: '#22c55e', dim: '#14532d', glow: 'rgba(34,197,94,0.25)' },
      resistencia: { main: '#f97316', dim: '#7c2d12', glow: 'rgba(249,115,22,0.25)' },
      sabiduria:   { main: '#eab308', dim: '#713f12', glow: 'rgba(234,179,8,0.25)' },
    },

    // Estado
    success: '#22c55e',
    warning: '#eab308',
    danger:  '#ef4444',
    overlay: 'rgba(0,0,0,0.6)',
  },

  radius: {
    sm:  8,
    md:  12,
    lg:  16,
    xl:  20,
    xxl: 24,
    xxxl: 32,
    full: 999,
  },

  spacing: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
  },

  font: {
    xs: 11, sm: 12, md: 14, base: 16, lg: 18, xl: 20, xxl: 24, title: 28, display: 34,
  },

  statLabels: {
    fuerza:       { label: 'STR', full: 'Fuerza',       icon: '⚔️' },
    inteligencia: { label: 'INT', full: 'Inteligencia',  icon: '🧠' },
    carisma:      { label: 'CHA', full: 'Carisma',       icon: '✨' },
    agilidad:     { label: 'AGI', full: 'Agilidad',      icon: '⚡' },
    resistencia:  { label: 'RES', full: 'Resistencia',   icon: '🛡️' },
    sabiduria:    { label: 'WIS', full: 'Sabiduría',     icon: '📖' },
  } as const,
} as const;

export type StatKey = keyof typeof QF.statLabels;

export function xpToLevel(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const progress = (xp % 100) / 100;
  return { level, progress, xpInLevel: xp % 100 };
}
