/**
 * Cálculo de la tabla de posiciones a partir de los resultados.
 *
 * Función pura: no lee el CMS ni la fecha actual. Recibe equipos, partidos,
 * reglas y ajustes, y devuelve las filas ordenadas más una lista de avisos
 * sobre datos que se ignoraron (para mostrarlos en el CMS o en el build).
 */

export type EstadoPartido = 'programado' | 'jugado' | 'suspendido' | 'postergado';

export type Criterio =
  | 'puntos'
  | 'diferencia'
  | 'golesFavor'
  | 'golesContra'
  | 'ganados'
  | 'enfrentamientoDirecto';

export const CRITERIOS_POR_DEFECTO: Criterio[] = [
  'puntos',
  'diferencia',
  'golesFavor',
  'enfrentamientoDirecto',
];

export interface EquipoTabla {
  id: string;
  nombre: string;
  esPropio?: boolean;
}

export interface PartidoTabla {
  id: string;
  localId: string;
  visitanteId: string;
  estado: EstadoPartido;
  golesLocal?: number | null;
  golesVisitante?: number | null;
}

export interface AjustePuntos {
  equipoId: string;
  /** Positivo o negativo. Ej.: -3 por sanción del tribunal de la liga. */
  puntos: number;
  motivo?: string;
}

export interface ReglasTabla {
  puntosVictoria?: number;
  puntosEmpate?: number;
  criterios?: Criterio[];
}

export interface FilaTabla {
  posicion: number;
  equipo: EquipoTabla;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  /** Suma de ajustes manuales aplicados (0 si no hay). */
  ajuste: number;
  pts: number;
  /** true si quedó igualado en todos los criterios con otro equipo. */
  empateSinDesempate: boolean;
}

export interface ResultadoTabla {
  filas: FilaTabla[];
  avisos: string[];
}

interface Acumulado {
  equipo: EquipoTabla;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  ajuste: number;
}

const esGolValido = (g: unknown): g is number =>
  typeof g === 'number' && Number.isInteger(g) && g >= 0;

/** Normaliza la lista de criterios: sin repetidos y con "puntos" siempre primero. */
export function normalizarCriterios(criterios?: Criterio[] | null): Criterio[] {
  const lista = criterios && criterios.length > 0 ? criterios : CRITERIOS_POR_DEFECTO;
  const unicos = lista.filter((c, i) => lista.indexOf(c) === i && c !== 'puntos');
  return ['puntos', ...unicos];
}

/** Un partido cuenta para la tabla solo si se jugó y tiene un resultado válido. */
export function partidoCuenta(p: PartidoTabla): boolean {
  return (
    p.estado === 'jugado' &&
    p.localId !== p.visitanteId &&
    esGolValido(p.golesLocal) &&
    esGolValido(p.golesVisitante)
  );
}

export function calcularTabla(
  equipos: EquipoTabla[],
  partidos: PartidoTabla[],
  reglas: ReglasTabla = {},
  ajustes: AjustePuntos[] = [],
): ResultadoTabla {
  const pv = reglas.puntosVictoria ?? 3;
  const pe = reglas.puntosEmpate ?? 1;
  const criterios = normalizarCriterios(reglas.criterios);
  const avisos: string[] = [];

  const tabla = new Map<string, Acumulado>();
  const asegurar = (id: string, nombre?: string): Acumulado => {
    let fila = tabla.get(id);
    if (!fila) {
      fila = { equipo: { id, nombre: nombre ?? id }, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, ajuste: 0 };
      tabla.set(id, fila);
    }
    return fila;
  };

  for (const e of equipos) {
    if (!tabla.has(e.id)) tabla.set(e.id, { equipo: e, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, ajuste: 0 });
  }

  const validos: PartidoTabla[] = [];
  for (const p of partidos) {
    if (p.estado !== 'jugado') continue; // programado, suspendido y postergado no suman
    if (p.localId === p.visitanteId) {
      avisos.push(`Partido ${p.id}: local y visitante son el mismo equipo; se ignoró.`);
      continue;
    }
    if (!esGolValido(p.golesLocal) || !esGolValido(p.golesVisitante)) {
      avisos.push(`Partido ${p.id}: está marcado como jugado pero falta el resultado o no es válido; se ignoró.`);
      continue;
    }
    if (!tabla.has(p.localId) || !tabla.has(p.visitanteId)) {
      avisos.push(`Partido ${p.id}: incluye un equipo que no está en el torneo; se sumó igual a la tabla.`);
    }
    validos.push(p);

    const local = asegurar(p.localId);
    const visita = asegurar(p.visitanteId);
    const gl = p.golesLocal;
    const gv = p.golesVisitante;
    local.pj++;
    visita.pj++;
    local.gf += gl;
    local.gc += gv;
    visita.gf += gv;
    visita.gc += gl;
    if (gl > gv) {
      local.pg++;
      visita.pp++;
    } else if (gl < gv) {
      visita.pg++;
      local.pp++;
    } else {
      local.pe++;
      visita.pe++;
    }
  }

  for (const a of ajustes) {
    if (!Number.isInteger(a.puntos)) {
      avisos.push(`Ajuste de ${a.equipoId}: los puntos deben ser un número entero; se ignoró.`);
      continue;
    }
    const fila = tabla.get(a.equipoId);
    if (!fila) {
      avisos.push(`Ajuste de ${a.equipoId}: el equipo no está en el torneo; se ignoró.`);
      continue;
    }
    fila.ajuste += a.puntos;
  }

  const puntos = (f: Acumulado) => f.pg * pv + f.pe * pe + f.ajuste;

  // Puntos obtenidos solo en los partidos entre los equipos del grupo empatado.
  const puntosEntreSi = (grupo: Acumulado[]): Map<string, number> => {
    const ids = new Set(grupo.map((f) => f.equipo.id));
    const pts = new Map<string, number>(grupo.map((f) => [f.equipo.id, 0]));
    for (const p of validos) {
      if (!ids.has(p.localId) || !ids.has(p.visitanteId)) continue;
      const gl = p.golesLocal as number;
      const gv = p.golesVisitante as number;
      if (gl > gv) pts.set(p.localId, (pts.get(p.localId) ?? 0) + pv);
      else if (gl < gv) pts.set(p.visitanteId, (pts.get(p.visitanteId) ?? 0) + pv);
      else {
        pts.set(p.localId, (pts.get(p.localId) ?? 0) + pe);
        pts.set(p.visitanteId, (pts.get(p.visitanteId) ?? 0) + pe);
      }
    }
    return pts;
  };

  const sinDesempate = new Set<string>();
  const alfabetico = (a: Acumulado, b: Acumulado) =>
    a.equipo.nombre.localeCompare(b.equipo.nombre, 'es', { sensitivity: 'base' });

  const ordenar = (grupo: Acumulado[], i: number): Acumulado[] => {
    if (grupo.length <= 1) return grupo;
    if (i >= criterios.length) {
      grupo.forEach((f) => sinDesempate.add(f.equipo.id));
      return [...grupo].sort(alfabetico);
    }
    const criterio = criterios[i];
    const h2h = criterio === 'enfrentamientoDirecto' ? puntosEntreSi(grupo) : null;
    const clave = (f: Acumulado): number => {
      switch (criterio) {
        case 'puntos':
          return puntos(f);
        case 'diferencia':
          return f.gf - f.gc;
        case 'golesFavor':
          return f.gf;
        case 'golesContra':
          return -f.gc; // menos goles en contra es mejor
        case 'ganados':
          return f.pg;
        case 'enfrentamientoDirecto':
          return h2h?.get(f.equipo.id) ?? 0;
      }
    };
    const ordenado = [...grupo].sort((a, b) => clave(b) - clave(a));
    const resultado: Acumulado[] = [];
    let inicio = 0;
    for (let j = 1; j <= ordenado.length; j++) {
      if (j === ordenado.length || clave(ordenado[j]) !== clave(ordenado[inicio])) {
        resultado.push(...ordenar(ordenado.slice(inicio, j), i + 1));
        inicio = j;
      }
    }
    return resultado;
  };

  const filas = ordenar([...tabla.values()], 0).map<FilaTabla>((f, idx) => ({
    posicion: idx + 1,
    equipo: f.equipo,
    pj: f.pj,
    pg: f.pg,
    pe: f.pe,
    pp: f.pp,
    gf: f.gf,
    gc: f.gc,
    dg: f.gf - f.gc,
    ajuste: f.ajuste,
    pts: puntos(f),
    empateSinDesempate: sinDesempate.has(f.equipo.id),
  }));

  return { filas, avisos };
}
