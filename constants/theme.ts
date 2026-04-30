// Design tokens — estilo Questflow (tema claro)
export const colors = {
  bg:           '#f8fafc',
  card:         '#ffffff',
  cardAlt:      '#f1f5f9',
  border:       '#e2e8f0',
  borderLight:  '#f1f5f9',
  text:         '#0f172a',
  textSec:      '#64748b',
  textMuted:    '#94a3b8',
  accent:       '#2563eb',
  accentLight:  '#eff6ff',
  accentMid:    '#dbeafe',
  error:        '#ef4444',
  success:      '#10b981',
  stat: {
    fuerza:       '#ef4444',
    inteligencia: '#3b82f6',
    carisma:      '#eab308',
    agilidad:     '#10b981',
    resistencia:  '#a855f7',
    sabiduria:    '#f59e0b',
  } as Record<string, string>,
};

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 99,
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  h:   32,
  hh:  48,
};

export const font = {
  xs:      11,
  sm:      12,
  md:      14,
  base:    16,
  lg:      18,
  xl:      20,
  xxl:     24,
  title:   28,
  display: 32,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  blue: {
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
};
