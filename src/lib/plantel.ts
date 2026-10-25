/** Prepara el plantel para publicar, aplicando las reglas de menores. */
import type { CategoriaPlantel, ImagenCMS, Persona, Posicion } from './cms';
import { nombrePublico } from './nombres';

export const POSICIONES: { valor: Posicion; singular: string; plural: string }[] = [
  { valor: 'arquero', singular: 'Arquero', plural: 'Arqueros' },
  { valor: 'defensor', singular: 'Defensor', plural: 'Defensores' },
  { valor: 'mediocampista', singular: 'Mediocampista', plural: 'Mediocampistas' },
  { valor: 'delantero', singular: 'Delantero', plural: 'Delanteros' },
];

export interface PersonaPublica {
  id: string;
  nombre: string;
  numero: number | null;
  posicion: Posicion | null;
  posicionTexto: string | null;
  rol: string | null;
  /** null si no hay foto o si es menor sin autorización de imagen. */
  foto: ImagenCMS | null;
}

export interface GrupoPosicion {
  posicion: Posicion | 'sin-posicion';
  titulo: string;
  jugadores: PersonaPublica[];
}

export interface PlantelPublico {
  grupos: GrupoPosicion[];
  tecnicos: PersonaPublica[];
  totalJugadores: number;
}

/** Regla de publicación de fotos: mayores, siempre; menores, solo con autorización de imagen. */
export function puedeMostrarFoto(p: Pick<Persona, 'autorizacionImagen'>, esMenores: boolean): boolean {
  return !esMenores || p.autorizacionImagen === true;
}

export function personaPublica(p: Persona, esMenores: boolean): PersonaPublica {
  const pos = POSICIONES.find((x) => x.valor === p.posicion);
  return {
    id: p._id,
    // En menores nunca sale el apellido completo, aunque esté cargado en el CMS.
    nombre: nombrePublico(p.nombre, p.apellido, esMenores),
    numero: typeof p.numero === 'number' && p.numero >= 0 ? p.numero : null,
    posicion: pos?.valor ?? null,
    posicionTexto: pos?.singular ?? null,
    rol: p.rol?.trim() || null,
    foto: p.foto?.url && puedeMostrarFoto(p, esMenores) ? p.foto : null,
  };
}

export function prepararPlantel(c: CategoriaPlantel): PlantelPublico {
  const esMenores = !!c.esMenores;
  const personas = (c.personas ?? []).filter((p) => p && p.nombre);
  const jugadores = personas.filter((p) => p.tipo !== 'tecnico').map((p) => personaPublica(p, esMenores));
  const tecnicos = personas.filter((p) => p.tipo === 'tecnico').map((p) => personaPublica(p, esMenores));
  const porNumero = (a: PersonaPublica, b: PersonaPublica) =>
    (a.numero ?? 999) - (b.numero ?? 999) || a.nombre.localeCompare(b.nombre, 'es');

  const grupos: GrupoPosicion[] = POSICIONES.map((pos) => ({
    posicion: pos.valor,
    titulo: pos.plural,
    jugadores: jugadores.filter((j) => j.posicion === pos.valor).sort(porNumero),
  }));
  const sinPosicion = jugadores.filter((j) => !j.posicion).sort(porNumero);
  if (sinPosicion.length) grupos.push({ posicion: 'sin-posicion', titulo: 'Sin posición asignada', jugadores: sinPosicion });

  return { grupos: grupos.filter((g) => g.jugadores.length > 0), tecnicos, totalJugadores: jugadores.length };
}
