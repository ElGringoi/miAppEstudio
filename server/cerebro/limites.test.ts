import { describe, expect, it } from 'vitest';
import { crearLimitador, largoBody, limitarContexto, uidPermitido, uidsPermitidos } from './limites';

describe('uids permitidos', () => {
  it('sin ALLOWED_UIDS no se restringe', () => {
    expect(uidsPermitidos(undefined)).toBeNull();
    expect(uidsPermitidos('  ')).toBeNull();
    expect(uidPermitido('cualquiera', null)).toBe(true);
  });

  it('con ALLOWED_UIDS solo pasan esos', () => {
    const p = uidsPermitidos(' abc , def,');
    expect([...(p ?? [])]).toEqual(['abc', 'def']);
    expect(uidPermitido('abc', p)).toBe(true);
    expect(uidPermitido('xyz', p)).toBe(false);
  });
});

describe('crearLimitador', () => {
  it('deja pasar hasta el máximo por ventana y después corta', () => {
    const puede = crearLimitador(3, 60_000);
    expect([0, 1, 2].map(i => puede('u', 1000 + i))).toEqual([true, true, true]);
    expect(puede('u', 1010)).toBe(false);
    expect(puede('otro', 1010)).toBe(true);
  });

  it('vuelve a dejar pasar cuando se vence la ventana', () => {
    const puede = crearLimitador(1, 60_000);
    expect(puede('u', 0)).toBe(true);
    expect(puede('u', 59_999)).toBe(false);
    expect(puede('u', 60_000)).toBe(true);
  });
});

describe('largoBody y limitarContexto', () => {
  it('mide el body serializado', () => {
    expect(largoBody({ a: 'x' })).toBe(9);
    expect(largoBody(undefined)).toBe(2);
  });

  it('recorta cada lista del contexto a 5', () => {
    const notas = Array.from({ length: 8 }, (_, i) => ({ contenido: String(i) }));
    const r = limitarContexto({ notas, personas: [] });
    expect(r.notas).toHaveLength(5);
    expect(r.personas).toEqual([]);
  });
});
