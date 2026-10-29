import { describe, expect, it } from 'vitest';
import type { FSHabito, FSMision, FSRoca, FSStatsDoc } from '../types';
import {
  assignClass, buildTree, calcMainLevel, calcStreak, calcToggleHabito, calcXpBySource, calcXpPerDay,
  diasHasta, habitRecurrenceLabel, isDateInCurrentWeek, isHabitActiveToday, isHabitDoneToday, isImageUrl,
  mesAnterior, planBorrarMision, proximaOcurrencia, rankFromLevel, saldoPendientes, statsFromDoc,
  streakMultiplier, xpLevel, youtubeEmbedUrl,
} from './helpers';
import { sumarDias } from './fecha';

// Semana de referencia: lunes 2026-10-19 a domingo 2026-10-25.
const LUNES = '2026-10-19';
const JUEVES = '2026-10-22';
const SABADO = '2026-10-24';

const habito = (over: Partial<FSHabito> = {}): FSHabito => ({
  id: 'h1', nombre: 'Leer', stat: 'inteligencia', fechaCompletado: null, ...over,
});
const dias = (desde: string, n: number) => Array.from({ length: n }, (_, i) => sumarDias(desde, -i));
const stats = (xp: Partial<Record<keyof FSStatsDoc, number>>): FSStatsDoc => ({
  fuerza: { xp: xp.fuerza ?? 0 }, salud: { xp: xp.salud ?? 0 }, inteligencia: { xp: xp.inteligencia ?? 0 },
  agilidad: { xp: xp.agilidad ?? 0 }, carisma: { xp: xp.carisma ?? 0 }, fe: { xp: xp.fe ?? 0 },
});

describe('xpLevel', () => {
  it('cada nivel cuesta 100 XP más que el anterior', () => {
    expect(xpLevel(0)).toEqual({ level: 1, xpInLevel: 0, xpForNext: 100 });
    expect(xpLevel(99).level).toBe(1);
    expect(xpLevel(100)).toEqual({ level: 2, xpInLevel: 0, xpForNext: 200 });
    expect(xpLevel(299)).toEqual({ level: 2, xpInLevel: 199, xpForNext: 200 });
    expect(xpLevel(300).level).toBe(3);
  });
});

describe('streakMultiplier', () => {
  it('sube a los 7, 14 y 30 días', () => {
    expect(streakMultiplier(6)).toBe(1);
    expect(streakMultiplier(7)).toBe(1.25);
    expect(streakMultiplier(14)).toBe(1.5);
    expect(streakMultiplier(30)).toBe(2);
  });
});

describe('calcStreak', () => {
  it('cuenta días seguidos hasta hoy', () => {
    expect(calcStreak(dias(JUEVES, 5), 'daily', JUEVES)).toBe(5);
  });

  it('si hoy no está hecho, la racha sigue viva desde ayer', () => {
    expect(calcStreak(dias(sumarDias(JUEVES, -1), 3), 'daily', JUEVES)).toBe(3);
  });

  it('un hueco corta la racha', () => {
    expect(calcStreak([JUEVES, sumarDias(JUEVES, -2)], 'daily', JUEVES)).toBe(1);
  });

  it('sin fechas da 0', () => {
    expect(calcStreak([], 'daily', JUEVES)).toBe(0);
  });

  it('los días hábiles no cortan la racha el fin de semana', () => {
    // lun 12 a vie 16 + lun 19: 6 días hábiles seguidos
    const hechos = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', LUNES];
    expect(calcStreak(hechos, 'weekdays', LUNES)).toBe(6);
    // el sábado 17 (sin hacer, no toca) la racha de la semana sigue en 5
    expect(calcStreak(hechos.slice(0, 5), 'weekdays', '2026-10-17')).toBe(5);
  });

  it('semanal: semanas seguidas, viva desde la semana anterior si esta falta', () => {
    const hechos = ['2026-10-06', '2026-10-14', '2026-10-21'];
    expect(calcStreak(hechos, 'once_week', JUEVES)).toBe(3);
    expect(calcStreak(['2026-10-06', '2026-10-14'], 'once_week', JUEVES)).toBe(2);
    expect(calcStreak(['2026-09-29', '2026-10-14'], 'once_week', JUEVES)).toBe(1);
  });
});

describe('isDateInCurrentWeek', () => {
  it('va de lunes a domingo', () => {
    expect(isDateInCurrentWeek(LUNES, JUEVES)).toBe(true);
    expect(isDateInCurrentWeek('2026-10-25', JUEVES)).toBe(true);
    expect(isDateInCurrentWeek('2026-10-18', JUEVES)).toBe(false);
    expect(isDateInCurrentWeek('2026-10-26', JUEVES)).toBe(false);
  });
});

describe('isHabitActiveToday', () => {
  it('días hábiles: no el sábado', () => {
    expect(isHabitActiveToday(habito({ recurrence: 'weekdays' }), SABADO)).toBe(false);
    expect(isHabitActiveToday(habito({ recurrence: 'weekdays' }), JUEVES)).toBe(true);
  });

  it('semanal con días elegidos', () => {
    const h = habito({ recurrence: 'weekly', diasSemana: [1, 3] });
    expect(isHabitActiveToday(h, LUNES)).toBe(true);
    expect(isHabitActiveToday(h, JUEVES)).toBe(false);
  });

  it('diario y una vez por semana: siempre', () => {
    expect(isHabitActiveToday(habito({ recurrence: 'daily' }), SABADO)).toBe(true);
    expect(isHabitActiveToday(habito({ recurrence: 'once_week' }), SABADO)).toBe(true);
  });
});

describe('isHabitDoneToday', () => {
  it('diario: solo si hoy está en completedDates', () => {
    expect(isHabitDoneToday(habito({ completedDates: [JUEVES] }), JUEVES)).toBe(true);
    expect(isHabitDoneToday(habito({ completedDates: [LUNES] }), JUEVES)).toBe(false);
  });

  it('una vez por semana: cualquier día de esta semana cuenta', () => {
    expect(isHabitDoneToday(habito({ recurrence: 'once_week', completedDates: [LUNES] }), JUEVES)).toBe(true);
    expect(isHabitDoneToday(habito({ recurrence: 'once_week', completedDates: ['2026-10-18'] }), JUEVES)).toBe(false);
  });

  it('respeta el campo viejo fechaCompletado', () => {
    expect(isHabitDoneToday(habito({ fechaCompletado: JUEVES }), JUEVES)).toBe(true);
  });
});

describe('calcXpPerDay', () => {
  it('suma el xpValue de cada hábito hecho por día', () => {
    const hs = [habito({ xpValue: 10, completedDates: [JUEVES] }), habito({ id: 'h2', completedDates: [JUEVES, LUNES] })];
    const r = calcXpPerDay(hs, 4, JUEVES);
    expect(r.map(x => x.date)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', JUEVES]);
    expect(r[0].xp).toBe(20);
    expect(r[3].xp).toBe(30);
  });
});

describe('nivel principal, rango y clase', () => {
  it('sin stats es nivel 1', () => {
    expect(calcMainLevel(null)).toEqual({ level: 1, xpTotal: 0 });
  });

  it('el nivel principal es el piso del promedio de los 6 niveles', () => {
    // inteligencia 300 XP = nivel 3, el resto nivel 1 → (3 + 5) / 6 = 1,33 → 1
    expect(calcMainLevel(stats({ inteligencia: 300 })).level).toBe(1);
  });

  it('rango cada 10 niveles', () => {
    expect(rankFromLevel(9)).toBe('E');
    expect(rankFromLevel(10)).toBe('D');
    expect(rankFromLevel(69)).toBe('SS');
    expect(rankFromLevel(70)).toBe('Monarch');
  });

  it('la clase sale del stat dominante', () => {
    expect(assignClass(null)).toBe('Sin clase');
    expect(assignClass(stats({}))).toBe('Aventurero');
    expect(assignClass(stats({ inteligencia: 1000 }))).toBe('Mago');
    expect(assignClass(stats({ fuerza: 1000, inteligencia: 900 }))).toBe('Espadachín Mágico');
  });
});

describe('calcToggleHabito', () => {
  it('marcar con racha de 7 suma 25 y desmarcar resta exactamente 25', () => {
    const h = habito({ completedDates: dias(sumarDias(JUEVES, -1), 7) });
    const marcar = calcToggleHabito(h, JUEVES);
    expect(marcar).toMatchObject({ yaHecho: false, delta: 25, mult: 1.25 });
    expect(marcar.xpPorFecha[JUEVES]).toBe(25);

    const desmarcar = calcToggleHabito({ ...h, completedDates: marcar.completedDates, xpPorFecha: marcar.xpPorFecha }, JUEVES);
    expect(desmarcar.yaHecho).toBe(true);
    expect(desmarcar.delta).toBe(-25);
    expect(desmarcar.completedDates).not.toContain(JUEVES);
    expect(desmarcar.xpPorFecha[JUEVES]).toBeUndefined();
  });

  it('sin xpPorFecha guardado (hábitos viejos) resta el XP base', () => {
    const h = habito({ xpValue: 30, completedDates: [JUEVES] });
    expect(calcToggleHabito(h, JUEVES).delta).toBe(-30);
  });

  it('hecho solo por el campo viejo fechaCompletado también se desmarca', () => {
    const h = habito({ fechaCompletado: JUEVES, completedDates: [] });
    expect(calcToggleHabito(h, JUEVES)).toMatchObject({ yaHecho: true, delta: -20 });
  });

  it('una vez por semana: desmarcar saca la fecha de esta semana', () => {
    const h = habito({ recurrence: 'once_week', completedDates: ['2026-10-12', LUNES], xpPorFecha: { [LUNES]: 20 } });
    const r = calcToggleHabito(h, JUEVES);
    expect(r).toMatchObject({ yaHecho: true, delta: -20, completedDates: ['2026-10-12'] });
  });

  it('recorta el historial a 90 días', () => {
    const vieja = sumarDias(JUEVES, -91);
    const h = habito({ completedDates: [vieja], xpPorFecha: { [vieja]: 20 } });
    const r = calcToggleHabito(h, JUEVES);
    expect(r.completedDates).toEqual([JUEVES]);
    expect(Object.keys(r.xpPorFecha)).toEqual([JUEVES]);
  });
});

describe('planBorrarMision', () => {
  const m = (over: Partial<FSMision>): FSMision => ({ id: 'x', titulo: 'x', completada: false, parentId: null, orden: 0, ...over });
  const misiones = [
    m({ id: 'a' }),
    m({ id: 'b', parentId: 'a' }),
    m({ id: 'c', parentId: 'b' }),
    m({ id: 'd', prerequisitos: ['c', 'z'] }),
    m({ id: 'e' }),
  ];

  it('borra la misión y todas sus descendientes', () => {
    expect(planBorrarMision(misiones, 'a').borrar.sort()).toEqual(['a', 'b', 'c']);
  });

  it('saca las borradas de los prerequisitos de otras', () => {
    expect(planBorrarMision(misiones, 'a').prerequisitos).toEqual([{ id: 'd', prerequisitos: ['z'] }]);
  });

  it('saca las borradas de las rocas', () => {
    const rocas: FSRoca[] = [
      { id: 'r1', titulo: 'R', progreso: 0, meta: 1, semana: '2026-W43', linkedMisionIds: ['b', 'e'] },
      { id: 'r2', titulo: 'R2', progreso: 0, meta: 1, semana: '2026-W43', linkedMisionIds: ['e'] },
    ];
    expect(planBorrarMision(misiones, 'a', rocas).rocas).toEqual([{ id: 'r1', linkedMisionIds: ['e'] }]);
  });

  it('una misión suelta solo se borra a sí misma', () => {
    expect(planBorrarMision(misiones, 'e')).toEqual({ borrar: ['e'], prerequisitos: [], rocas: [] });
  });
});

describe('fechas clave y pendientes', () => {
  it('diasHasta cuenta días de calendario', () => {
    expect(diasHasta('2026-10-25', JUEVES)).toBe(3);
    expect(diasHasta('2026-10-21', JUEVES)).toBe(-1);
  });

  it('una fecha anual que ya pasó salta al año que viene', () => {
    expect(proximaOcurrencia('1999-10-21', true, JUEVES)).toEqual({ iso: '2027-10-21', dias: 364 });
    expect(proximaOcurrencia('1999-10-30', true, JUEVES)).toEqual({ iso: '2026-10-30', dias: 8 });
    expect(proximaOcurrencia('2026-10-01', false, JUEVES)).toBeNull();
  });

  it('saldo por moneda: me deben suma, le debo resta, saldados y favores no cuentan', () => {
    expect(saldoPendientes([
      { direccion: 'me_debe', monto: 1000, saldado: false },
      { direccion: 'le_debo', monto: 300, saldado: false },
      { direccion: 'me_debe', monto: 50, moneda: 'USD', saldado: false },
      { direccion: 'me_debe', monto: 999, saldado: true },
      { direccion: 'le_debo', saldado: false },
    ])).toEqual({ ARS: 700, USD: 50 });
  });

  it('mesAnterior cruza el año', () => {
    expect(mesAnterior('2026-01')).toBe('2025-12');
    expect(mesAnterior('2026-10')).toBe('2026-09');
  });
});

describe('otros helpers', () => {
  it('youtubeEmbedUrl reconoce los tres formatos', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(youtubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(youtubeEmbedUrl('https://example.com')).toBeNull();
  });

  it('isImageUrl', () => {
    expect(isImageUrl('https://x.com/a.PNG?w=2')).toBe(true);
    expect(isImageUrl('https://x.com/a.pdf')).toBe(false);
  });

  it('habitRecurrenceLabel', () => {
    const dc = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    expect(habitRecurrenceLabel('daily', [], dc)).toBe('Todos los días');
    expect(habitRecurrenceLabel('weekly', [3, 1], dc)).toBe('Lun, Mié');
    expect(habitRecurrenceLabel('weekly', [], dc)).toBe('Sin días');
  });

  it('statsFromDoc arma los 6 stats con su nivel', () => {
    const s = statsFromDoc(stats({ fuerza: 150 }));
    expect(s).toHaveLength(6);
    expect(s[0]).toMatchObject({ name: 'Fuerza', level: 2, value: 50, max: 200 });
  });

  it('calcXpBySource ordena por XP y saca los que no se hicieron', () => {
    const hs = [
      habito({ id: 'a', nombre: 'A', completedDates: [LUNES] }),
      habito({ id: 'b', nombre: 'B', xpValue: 50, completedDates: [LUNES, JUEVES] }),
      habito({ id: 'c', nombre: 'C', completedDates: [] }),
      habito({ id: 'd', nombre: 'D', stat: 'fuerza', completedDates: [LUNES] }),
    ];
    expect(calcXpBySource(hs, 'inteligencia')).toEqual([
      { nombre: 'B', xpTotal: 100, veces: 2 },
      { nombre: 'A', xpTotal: 20, veces: 1 },
    ]);
  });
});

describe('buildTree', () => {
  const m = (over: Partial<FSMision>): FSMision => ({ id: 'x', titulo: 'x', completada: false, parentId: null, orden: 0, ...over });

  it('sin misiones devuelve la raíz vacía', () => {
    expect(buildTree([]).children).toEqual([]);
  });

  it('el progreso es la parte de hijas completas', () => {
    const arbol = buildTree([
      m({ id: 'a', titulo: 'Épica' }),
      m({ id: 'b', parentId: 'a', completada: true }),
      m({ id: 'c', parentId: 'a', orden: 1 }),
    ]);
    expect(arbol.id).toBe('a');
    expect(arbol.progress).toBe(50);
    expect(arbol.children?.map(c => c.type)).toEqual(['milestone', 'milestone']);
  });

  it('una misión con prerequisito sin completar queda bloqueada', () => {
    const arbol = buildTree([m({ id: 'a' }), m({ id: 'b', orden: 1, prerequisitos: ['a'] })]);
    const b = arbol.children?.find(c => c.id === 'b');
    expect(b?.bloqueada).toBe(true);
  });
});
