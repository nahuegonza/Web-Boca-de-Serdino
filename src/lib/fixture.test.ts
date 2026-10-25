import { describe, expect, it } from 'vitest';
import type { Categoria, Partido } from './cms';
import { agruparPorFecha, equipoPropio, proximoPartido, resultadosPropios, tablaDeCategoria, vistaDesdeNosotros } from './fixture';
import datos from '../datos-prueba/fixture.json';

const categorias = datos as unknown as Categoria[];
const primera = categorias[0];
const partidos = primera.torneo!.partidos as Partido[];

describe('vista desde nuestro equipo', () => {
  it('detecta local o visitante, rival y resultado', () => {
    const v = vistaDesdeNosotros(partidos.find((p) => p._id === 'p3')!, 'boca')!;
    expect(v).toMatchObject({ condicion: 'visitante', golesPropios: 1, golesRival: 1, resultado: 'empato' });
    expect(v.rival?._id).toBe('rb');
  });
  it('un partido ajeno devuelve null', () => {
    expect(vistaDesdeNosotros(partidos.find((p) => p._id === 'p2')!, 'boca')).toBeNull();
  });
  it('suspendido: sin resultado', () => {
    expect(vistaDesdeNosotros(partidos.find((p) => p._id === 'p5')!, 'boca')!.resultado).toBeNull();
  });
});

describe('fixture por fecha', () => {
  it('separa nuestro partido de los otros y marca fecha libre', () => {
    const fechas = agruparPorFecha(partidos, 'boca');
    expect(fechas.map((f) => f.numero)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(fechas[0].nuestro?.partido._id).toBe('p1');
    expect(fechas[0].otros.map((p) => p._id)).toEqual(['p2']);
    expect(fechas[5].nuestro).toBeNull(); // fecha 6: libre
  });
  it('sin equipo propio, todos van a "otros"', () => {
    const fechas = agruparPorFecha(partidos, null);
    expect(fechas.every((f) => f.nuestro === null)).toBe(true);
  });
});

describe('próximo partido', () => {
  it('es el primero programado desde ahora, no el suspendido', () => {
    const v = proximoPartido(partidos, 'boca', Date.parse('2026-10-25T12:00:00Z'));
    expect(v?.partido._id).toBe('p7');
  });
  it('sigue mostrando el partido durante las 2 horas en que se juega', () => {
    const v = proximoPartido(partidos, 'boca', Date.parse('2026-11-01T20:00:00Z'));
    expect(v?.partido._id).toBe('p7');
  });
  it('null cuando no quedan partidos', () => {
    expect(proximoPartido(partidos, 'boca', Date.parse('2027-01-01T00:00:00Z'))).toBeNull();
  });
});

describe('resultados y tabla de la categoría', () => {
  it('lista nuestros jugados del más reciente al más viejo', () => {
    expect(resultadosPropios(partidos, 'boca').map((v) => v.partido._id)).toEqual(['p3', 'p1']);
  });
  it('encuentra nuestro equipo', () => {
    expect(equipoPropio(primera)?._id).toBe('boca');
  });
  it('calcula la tabla con los partidos jugados y aplica el ajuste', () => {
    const t = tablaDeCategoria(categorias[2])!; // Sub-15, con -3 a Rival B
    const b = t.filas.find((f) => f.equipo.id === 's2')!;
    expect(b).toMatchObject({ pts: -3, ajuste: -3 });
    expect(t.filas[0].equipo.esPropio).toBe(true);
  });
  it('categoría sin torneo: sin tabla', () => {
    expect(tablaDeCategoria(categorias[3])).toBeNull();
  });
});
