import { describe, expect, it } from 'vitest';
import { aniosDeVida, colorSeguro, coloresValidos, lineaDeTiempo } from './historia';

describe('colores', () => {
  it('acepta solo #RRGGBB', () => {
    expect(colorSeguro('#0b2e73')).toBe('#0B2E73');
    expect(colorSeguro('red')).toBeNull();
    expect(colorSeguro('#FFF')).toBeNull();
    expect(colorSeguro('#000000;background:url(x)')).toBeNull();
    expect(colorSeguro(null)).toBeNull();
  });
  it('descarta colores inválidos o sin nombre', () => {
    expect(coloresValidos([{ nombre: 'Azul', hex: '#0B2E73' }, { nombre: 'Malo', hex: 'blue' }, { nombre: '', hex: '#FFFFFF' }])).toHaveLength(1);
  });
});

describe('línea de tiempo', () => {
  const h = (anio: number, titulo = `Hito ${anio}`) => ({ _id: String(anio), anio, titulo });
  it('ordena por año', () => {
    expect(lineaDeTiempo([h(1990), h(1950), h(2010)]).map((x) => x.anio)).toEqual([1950, 1990, 2010]);
  });
  it('agrega la fundación si falta como hito', () => {
    expect(lineaDeTiempo([h(1990)], 1935)[0]).toMatchObject({ anio: 1935, titulo: 'Fundación del club' });
  });
  it('no la duplica si ya está', () => {
    expect(lineaDeTiempo([h(1935, 'Fundación')], 1935)).toHaveLength(1);
  });
  it('ignora hitos sin título o año', () => {
    expect(lineaDeTiempo([{ _id: 'x', anio: Number.NaN, titulo: 'x' }, { _id: 'y', anio: 2000, titulo: '' }])).toHaveLength(0);
  });
  it('años de vida', () => {
    expect(aniosDeVida(1935, new Date('2026-10-25'))).toBe(91);
    expect(aniosDeVida(null)).toBeNull();
  });
});
