/** Lógica de presentación del fixture desde el punto de vista de nuestro equipo. */
import type { Categoria, Equipo, Partido } from './cms';
import { calcularTabla, type ResultadoTabla } from './tabla';

export type Condicion = 'local' | 'visitante';
export type Resultado = 'gano' | 'empato' | 'perdio';

export interface VistaPartido {
  partido: Partido;
  rival: Equipo | null;
  condicion: Condicion;
  golesPropios: number | null;
  golesRival: number | null;
  resultado: Resultado | null;
}

export interface FechaFixture {
  numero: number;
  nuestro: VistaPartido | null;
  otros: Partido[];
}

export const equipoPropio = (c: Categoria): Equipo | null =>
  c.torneo?.equipos?.find((e) => e?.esPropio) ??
  c.torneo?.partidos?.flatMap((p) => [p.local, p.visitante]).find((e) => e?.esPropio) ??
  null;

export function vistaDesdeNosotros(p: Partido, propioId: string): VistaPartido | null {
  const esLocal = p.local?._id === propioId;
  const esVisita = p.visitante?._id === propioId;
  if (!esLocal && !esVisita) return null;
  const jugado = p.estado === 'jugado' && p.golesLocal != null && p.golesVisitante != null;
  const gp = jugado ? (esLocal ? p.golesLocal! : p.golesVisitante!) : null;
  const gr = jugado ? (esLocal ? p.golesVisitante! : p.golesLocal!) : null;
  return {
    partido: p,
    rival: esLocal ? p.visitante : p.local,
    condicion: esLocal ? 'local' : 'visitante',
    golesPropios: gp,
    golesRival: gr,
    resultado: gp == null || gr == null ? null : gp > gr ? 'gano' : gp < gr ? 'perdio' : 'empato',
  };
}

export function agruparPorFecha(partidos: Partido[], propioId: string | null): FechaFixture[] {
  const mapa = new Map<number, FechaFixture>();
  for (const p of partidos) {
    const f = mapa.get(p.fecha) ?? { numero: p.fecha, nuestro: null, otros: [] };
    const vista = propioId ? vistaDesdeNosotros(p, propioId) : null;
    if (vista && !f.nuestro) f.nuestro = vista;
    else f.otros.push(p);
    mapa.set(p.fecha, f);
  }
  return [...mapa.values()].sort((a, b) => a.numero - b.numero);
}

/** Próximo partido nuestro: el primero programado desde ahora; si no tienen día, el primero sin día. */
export function proximoPartido(partidos: Partido[], propioId: string, ahora = Date.now()): VistaPartido | null {
  const nuestros = partidos.filter((p) => p.estado === 'programado' && (p.local?._id === propioId || p.visitante?._id === propioId));
  const conDia = nuestros
    .filter((p) => p.diaHora && Date.parse(p.diaHora) >= ahora - 2 * 60 * 60 * 1000)
    .sort((a, b) => Date.parse(a.diaHora!) - Date.parse(b.diaHora!));
  const elegido = conDia[0] ?? nuestros.find((p) => !p.diaHora) ?? null;
  return elegido ? vistaDesdeNosotros(elegido, propioId) : null;
}

/** Nuestros partidos jugados, del más reciente al más viejo. */
export function resultadosPropios(partidos: Partido[], propioId: string): VistaPartido[] {
  return partidos
    .map((p) => vistaDesdeNosotros(p, propioId))
    .filter((v): v is VistaPartido => !!v && v.resultado !== null)
    .sort((a, b) => b.partido.fecha - a.partido.fecha || Date.parse(b.partido.diaHora ?? '0') - Date.parse(a.partido.diaHora ?? '0'));
}

export function tablaDeCategoria(c: Categoria): ResultadoTabla | null {
  const t = c.torneo;
  if (!t) return null;
  const equipos = (t.equipos ?? []).filter(Boolean).map((e) => ({ id: e._id, nombre: e.nombreCorto || e.nombre, esPropio: !!e.esPropio }));
  const partidos = (t.partidos ?? [])
    .filter((p) => p.local && p.visitante)
    .map((p) => ({ id: p._id, localId: p.local!._id, visitanteId: p.visitante!._id, estado: p.estado, golesLocal: p.golesLocal, golesVisitante: p.golesVisitante }));
  // Nombres para equipos que aparecen en partidos pero no en la lista del torneo
  const nombres = new Map((t.partidos ?? []).flatMap((p) => [p.local, p.visitante]).filter((e): e is Equipo => !!e).map((e) => [e._id, e]));
  const resultado = calcularTabla(
    equipos,
    partidos,
    { puntosVictoria: t.puntosVictoria ?? 3, puntosEmpate: t.puntosEmpate ?? 1, criterios: t.criteriosDesempate ?? undefined },
    (t.ajustes ?? []).map((a) => ({ equipoId: a.equipoId, puntos: a.puntos, motivo: a.motivo ?? undefined })),
  );
  for (const f of resultado.filas) {
    const e = nombres.get(f.equipo.id);
    if (e && f.equipo.nombre === f.equipo.id) f.equipo = { id: e._id, nombre: e.nombreCorto || e.nombre, esPropio: !!e.esPropio };
  }
  if (resultado.avisos.length) console.warn(`[tabla ${c.nombre}]`, ...resultado.avisos);
  return resultado;
}
