import { afterEach, describe, expect, it, vi } from 'vitest';
import { diaSemanaIso, hoyLocal, isoDe, lunesDe, sumarDias } from './fecha';

afterEach(() => { vi.useRealTimers(); });

describe('hoyLocal', () => {
  it('a las 23:30 de Argentina sigue siendo el mismo día (en UTC ya es mañana)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-19T23:30:00-03:00'));
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-10-20');
    expect(hoyLocal()).toBe('2026-10-19');
  });

  it('pasada la medianoche de Argentina cambia de día', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T00:05:00-03:00'));
    expect(hoyLocal()).toBe('2026-10-20');
  });
});

describe('isoDe', () => {
  it('convierte un instante a la fecha de Argentina', () => {
    expect(isoDe(new Date('2026-10-20T01:00:00Z'))).toBe('2026-10-19');
  });
});

describe('diaSemanaIso y lunesDe', () => {
  it('devuelve el día de semana (0 = domingo)', () => {
    expect(diaSemanaIso('2026-10-18')).toBe(0);
    expect(diaSemanaIso('2026-10-19')).toBe(1);
    expect(diaSemanaIso('2026-10-24')).toBe(6);
  });

  it('el lunes de un domingo es el lunes anterior', () => {
    expect(lunesDe('2026-10-25')).toBe('2026-10-19');
    expect(lunesDe('2026-10-19')).toBe('2026-10-19');
    expect(lunesDe('2026-10-26')).toBe('2026-10-26');
  });

  it('sumarDias cruza meses y años', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01');
    expect(sumarDias('2026-01-01', -1)).toBe('2025-12-31');
  });
});
