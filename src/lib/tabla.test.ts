import { describe, expect, it } from 'vitest';
import {
  calcularTabla,
  normalizarCriterios,
  partidoCuenta,
  type EquipoTabla,
  type PartidoTabla,
} from './tabla';

const BOCA: EquipoTabla = { id: 'boca', nombre: 'Boca de Serodino', esPropio: true };
const A: EquipoTabla = { id: 'a', nombre: 'Atlético A' };
const B: EquipoTabla = { id: 'b', nombre: 'Belgrano B' };
const C: EquipoTabla = { id: 'c', nombre: 'Central C' };

let n = 0;
const jugado = (localId: string, visitanteId: string, gl: number, gv: number): PartidoTabla => ({
  id: `p${++n}`,
  localId,
  visitanteId,
  estado: 'jugado',
  golesLocal: gl,
  golesVisitante: gv,
});

const fila = (r: ReturnType<typeof calcularTabla>, id: string) => {
  const f = r.filas.find((x) => x.equipo.id === id);
  if (!f) throw new Error(`No está ${id}`);
  return f;
};

describe('calcularTabla: conteo básico', () => {
  it('suma victoria, empate y derrota con PJ, PG, PE, PP, GF, GC, DG y Pts', () => {
    const r = calcularTabla([BOCA, A, B], [jugado('boca', 'a', 2, 1), jugado('b', 'boca', 0, 0), jugado('a', 'b', 3, 0)]);
    expect(fila(r, 'boca')).toMatchObject({ pj: 2, pg: 1, pe: 1, pp: 0, gf: 2, gc: 1, dg: 1, pts: 4 });
    expect(fila(r, 'a')).toMatchObject({ pj: 2, pg: 1, pe: 0, pp: 1, gf: 4, gc: 2, dg: 2, pts: 3 });
    expect(fila(r, 'b')).toMatchObject({ pj: 2, pg: 0, pe: 1, pp: 1, gf: 0, gc: 3, dg: -3, pts: 1 });
    expect(r.filas.map((f) => f.posicion)).toEqual([1, 2, 3]);
    expect(r.filas[0].equipo.id).toBe('boca');
    expect(r.avisos).toEqual([]);
  });

  it('un empate 0 a 0 suma un punto a cada uno', () => {
    const r = calcularTabla([A, B], [jugado('a', 'b', 0, 0)]);
    expect(fila(r, 'a')).toMatchObject({ pe: 1, pts: 1, dg: 0 });
    expect(fila(r, 'b')).toMatchObject({ pe: 1, pts: 1, dg: 0 });
  });

  it('incluye con ceros a un equipo del torneo que todavía no jugó', () => {
    const r = calcularTabla([BOCA, A, C], [jugado('boca', 'a', 1, 0)]);
    expect(fila(r, 'c')).toMatchObject({ pj: 0, pts: 0, gf: 0, gc: 0 });
    expect(r.filas).toHaveLength(3);
  });

  it('sin partidos devuelve a todos con ceros y sin avisos', () => {
    const r = calcularTabla([BOCA, A], []);
    expect(r.filas.every((f) => f.pj === 0 && f.pts === 0)).toBe(true);
    expect(r.avisos).toEqual([]);
  });

  it('respeta los puntos por victoria y empate de la liga', () => {
    const r = calcularTabla([A, B], [jugado('a', 'b', 1, 0)], { puntosVictoria: 2, puntosEmpate: 1 });
    expect(fila(r, 'a').pts).toBe(2);
  });
});

describe('calcularTabla: partidos que no cuentan', () => {
  it('ignora partidos programados, suspendidos y postergados', () => {
    const partidos: PartidoTabla[] = [
      { id: 'x1', localId: 'boca', visitanteId: 'a', estado: 'programado' },
      { id: 'x2', localId: 'boca', visitanteId: 'a', estado: 'suspendido', golesLocal: 1, golesVisitante: 0 },
      { id: 'x3', localId: 'boca', visitanteId: 'a', estado: 'postergado' },
    ];
    const r = calcularTabla([BOCA, A], partidos);
    expect(fila(r, 'boca').pj).toBe(0);
    expect(fila(r, 'a').pj).toBe(0);
    expect(r.avisos).toEqual([]);
  });

  it('un suspendido con goles cargados (el parcial) no suma', () => {
    const r = calcularTabla([BOCA, A], [{ id: 's', localId: 'boca', visitanteId: 'a', estado: 'suspendido', golesLocal: 2, golesVisitante: 0 }]);
    expect(fila(r, 'boca').pts).toBe(0);
  });

  it('avisa e ignora un jugado sin resultado', () => {
    const r = calcularTabla([BOCA, A], [{ id: 'sin', localId: 'boca', visitanteId: 'a', estado: 'jugado', golesLocal: 1, golesVisitante: null }]);
    expect(fila(r, 'boca').pj).toBe(0);
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0]).toContain('sin');
  });

  it('avisa e ignora goles negativos o con decimales', () => {
    const r = calcularTabla([A, B], [
      { id: 'neg', localId: 'a', visitanteId: 'b', estado: 'jugado', golesLocal: -1, golesVisitante: 0 },
      { id: 'dec', localId: 'a', visitanteId: 'b', estado: 'jugado', golesLocal: 1.5, golesVisitante: 0 },
    ]);
    expect(fila(r, 'a').pj).toBe(0);
    expect(r.avisos).toHaveLength(2);
  });

  it('avisa e ignora un partido de un equipo contra sí mismo', () => {
    const r = calcularTabla([A], [jugado('a', 'a', 1, 1)]);
    expect(fila(r, 'a').pj).toBe(0);
    expect(r.avisos).toHaveLength(1);
  });

  it('partidoCuenta coincide con las reglas', () => {
    expect(partidoCuenta(jugado('a', 'b', 0, 0))).toBe(true);
    expect(partidoCuenta({ id: 'z', localId: 'a', visitanteId: 'b', estado: 'suspendido', golesLocal: 0, golesVisitante: 0 })).toBe(false);
  });
});

describe('calcularTabla: ajustes manuales (sanciones)', () => {
  it('descuenta puntos y los informa en la columna de ajuste', () => {
    const r = calcularTabla([A, B], [jugado('a', 'b', 2, 0)], {}, [{ equipoId: 'a', puntos: -3, motivo: 'Incidentes' }]);
    expect(fila(r, 'a')).toMatchObject({ pts: 0, ajuste: -3, pg: 1 });
  });

  it('permite un total negativo', () => {
    const r = calcularTabla([A, B], [jugado('a', 'b', 0, 1)], {}, [{ equipoId: 'a', puntos: -6 }]);
    expect(fila(r, 'a').pts).toBe(-6);
    expect(r.filas.at(-1)?.equipo.id).toBe('a');
  });

  it('suma varios ajustes del mismo equipo', () => {
    const r = calcularTabla([A], [], {}, [{ equipoId: 'a', puntos: -3 }, { equipoId: 'a', puntos: 1 }]);
    expect(fila(r, 'a')).toMatchObject({ ajuste: -2, pts: -2 });
  });

  it('un descuento puede cambiar el orden', () => {
    const r = calcularTabla([A, B], [jugado('a', 'b', 1, 0), jugado('b', 'a', 0, 0)], {}, [{ equipoId: 'a', puntos: -3 }]);
    // A tiene 4 pts - 3 = 1; B tiene 1 pt. Empatan en puntos; desempata la diferencia de gol (A +1).
    expect(r.filas.map((f) => f.equipo.id)).toEqual(['a', 'b']);
    const r2 = calcularTabla([A, B], [jugado('a', 'b', 1, 0)], {}, [{ equipoId: 'a', puntos: -4 }]);
    expect(r2.filas.map((f) => f.equipo.id)).toEqual(['b', 'a']);
  });

  it('avisa e ignora ajustes de equipos que no están o con puntos no enteros', () => {
    const r = calcularTabla([A], [], {}, [{ equipoId: 'zz', puntos: -3 }, { equipoId: 'a', puntos: 0.5 }]);
    expect(fila(r, 'a').pts).toBe(0);
    expect(r.avisos).toHaveLength(2);
  });
});

describe('calcularTabla: desempate', () => {
  // A y B terminan con 3 pts. A le ganó a B, pero B tiene mejor diferencia de gol.
  const partidos = () => [jugado('a', 'b', 1, 0), jugado('b', 'c', 5, 0), jugado('c', 'a', 1, 0)];

  it('por defecto: puntos, diferencia, goles a favor, enfrentamiento directo', () => {
    const r = calcularTabla([A, B, C], partidos());
    // A: 3 pts, DG 0. B: 3 pts, DG +4. C: 3 pts, DG -4.
    expect(r.filas.map((f) => f.equipo.id)).toEqual(['b', 'a', 'c']);
  });

  it('con enfrentamiento directo primero cambia el orden entre los empatados', () => {
    const r = calcularTabla([A, B], [jugado('a', 'b', 1, 0), jugado('b', 'a', 0, 0)], {
      criterios: ['puntos', 'enfrentamientoDirecto', 'diferencia'],
    });
    expect(fila(r, 'a').pts).toBe(4);
    expect(r.filas[0].equipo.id).toBe('a');

    // Dos equipos igualados en puntos: A ganó el partido entre ellos, B tiene mejor DG.
    const empatados = [jugado('a', 'b', 1, 0), jugado('b', 'c', 6, 0), jugado('a', 'c', 0, 1), jugado('c', 'b', 1, 0)];
    const h2h = calcularTabla([A, B, C], empatados, { criterios: ['puntos', 'enfrentamientoDirecto', 'diferencia'] });
    const dg = calcularTabla([A, B, C], empatados, { criterios: ['puntos', 'diferencia', 'enfrentamientoDirecto'] });
    expect(fila(h2h, 'a').pts).toBe(fila(h2h, 'b').pts);
    expect(h2h.filas.findIndex((f) => f.equipo.id === 'a')).toBeLessThan(h2h.filas.findIndex((f) => f.equipo.id === 'b'));
    expect(dg.filas.findIndex((f) => f.equipo.id === 'b')).toBeLessThan(dg.filas.findIndex((f) => f.equipo.id === 'a'));
  });

  it('el enfrentamiento directo entre tres usa solo los partidos entre ellos', () => {
    // Entre ellos: A le gana a B, B le gana a C, A empata con C (A 4, B 3, C 1 entre sí).
    // Contra rivales distintos: A pierde con X, B empata con Y, C le gana a Z. Total: 4 cada uno.
    const ps = [
      jugado('a', 'b', 1, 0), jugado('b', 'c', 1, 0), jugado('a', 'c', 0, 0),
      jugado('x', 'a', 1, 0), jugado('b', 'y', 0, 0), jugado('c', 'z', 3, 0),
    ];
    const X = { id: 'x', nombre: 'X' }, Y = { id: 'y', nombre: 'Y' }, Z = { id: 'z', nombre: 'Z' };
    const r = calcularTabla([A, B, C, X, Y, Z], ps, { criterios: ['puntos', 'enfrentamientoDirecto'] });
    expect([fila(r, 'a').pts, fila(r, 'b').pts, fila(r, 'c').pts]).toEqual([4, 4, 4]);
    expect(r.filas.slice(0, 3).map((f) => f.equipo.id)).toEqual(['a', 'b', 'c']);
  });

  it('goles en contra: menos es mejor', () => {
    // A y B: 1 pt cada uno. A recibió 2 goles, B ninguno.
    const r = calcularTabla([A, B, C], [jugado('a', 'c', 2, 2), jugado('b', 'c', 0, 0)], { criterios: ['puntos', 'golesContra'] });
    const ids = r.filas.map((f) => f.equipo.id);
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('a'));
  });

  it('agrega "puntos" primero aunque la liga no lo cargue y quita repetidos', () => {
    expect(normalizarCriterios(['diferencia', 'diferencia', 'golesFavor'])).toEqual(['puntos', 'diferencia', 'golesFavor']);
    expect(normalizarCriterios([])).toEqual(['puntos', 'diferencia', 'golesFavor', 'enfrentamientoDirecto']);
    expect(normalizarCriterios(['golesFavor', 'puntos'])).toEqual(['puntos', 'golesFavor']);
  });

  it('empate total: orden alfabético y marca empateSinDesempate', () => {
    const r = calcularTabla([C, A, B], [jugado('a', 'b', 1, 1)]);
    // A y B: 1 pt, DG 0, GF 1, empate entre sí. C: 0 pts.
    expect(r.filas.slice(0, 2).map((f) => f.equipo.id)).toEqual(['a', 'b']);
    expect(fila(r, 'a').empateSinDesempate).toBe(true);
    expect(fila(r, 'b').empateSinDesempate).toBe(true);
    expect(fila(r, 'c').empateSinDesempate).toBe(false);
  });

  it('es determinista sin importar el orden de entrada', () => {
    const ps = partidos();
    const r1 = calcularTabla([A, B, C], ps).filas.map((f) => f.equipo.id);
    const r2 = calcularTabla([C, B, A], [...ps].reverse()).filas.map((f) => f.equipo.id);
    expect(r1).toEqual(r2);
  });
});

describe('calcularTabla: datos incompletos', () => {
  it('suma a un equipo que aparece en partidos pero no en la lista del torneo, con aviso', () => {
    const r = calcularTabla([A], [jugado('a', 'nuevo', 0, 2)]);
    expect(fila(r, 'nuevo')).toMatchObject({ pts: 3, pj: 1 });
    expect(r.avisos).toHaveLength(1);
  });

  it('marca a nuestro equipo con esPropio para resaltarlo', () => {
    const r = calcularTabla([BOCA, A], [jugado('boca', 'a', 0, 1)]);
    expect(fila(r, 'boca').equipo.esPropio).toBe(true);
  });
});
