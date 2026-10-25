/**
 * Acceso al CMS (Sanity). Todo el contenido del sitio sale de acá.
 *
 * - Sin PUBLIC_SANITY_PROJECT_ID, el sitio se construye vacío y muestra los estados "sin datos".
 * - Con DATOS_DE_PRUEBA=1 (solo desarrollo), usa src/datos-prueba/*.json para ver las páginas.
 * - Si el CMS falla durante el build, el build falla a propósito: Cloudflare Pages
 *   mantiene publicada la última versión buena en lugar de publicar un sitio vacío.
 */
import { createClient, type SanityClient } from '@sanity/client';
import type { Criterio, EstadoPartido } from './tabla';

export interface ImagenCMS {
  url: string;
  ancho: number;
  alto: number;
  alt?: string | null;
}

export interface Equipo {
  _id: string;
  nombre: string;
  nombreCorto?: string | null;
  esPropio?: boolean | null;
  escudo?: ImagenCMS | null;
}

export interface Gol {
  nombre: string;
  apellido?: string | null;
  equipo: 'local' | 'visitante';
  minuto?: number | null;
  enContra?: boolean | null;
}

export interface Partido {
  _id: string;
  fecha: number;
  diaHora?: string | null;
  cancha?: string | null;
  estado: EstadoPartido;
  golesLocal?: number | null;
  golesVisitante?: number | null;
  observacion?: string | null;
  goleadores?: Gol[] | null;
  local: Equipo | null;
  visitante: Equipo | null;
}

export interface Ajuste {
  puntos: number;
  motivo?: string | null;
  equipoId: string;
  equipoNombre?: string | null;
}

export interface Torneo {
  _id: string;
  nombre: string;
  temporada: number;
  puntosVictoria?: number | null;
  puntosEmpate?: number | null;
  criteriosDesempate?: Criterio[] | null;
  equipos?: Equipo[] | null;
  ajustes?: Ajuste[] | null;
  partidos?: Partido[] | null;
}

export interface Categoria {
  _id: string;
  nombre: string;
  slug: string;
  esMenores?: boolean | null;
  torneo?: Torneo | null;
}

export interface Configuracion {
  nombreClub?: string | null;
  escudo?: ImagenCMS | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  direccion?: string | null;
  horariosSecretaria?: string | null;
  descripcionSitio?: string | null;
  imagenCompartir?: ImagenCMS | null;
}

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID as string | undefined;
const dataset = (import.meta.env.PUBLIC_SANITY_DATASET as string | undefined) || 'production';
const usarDatosDePrueba = !projectId && process.env.DATOS_DE_PRUEBA === '1';

const cliente: SanityClient | null = projectId
  ? createClient({ projectId, dataset, apiVersion: '2025-02-19', useCdn: false, perspective: 'published' })
  : null;

const IMAGEN = `{ alt, "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height }`;
const EQUIPO = `{ _id, nombre, nombreCorto, esPropio, "escudo": escudo${IMAGEN} }`;

const CONSULTA_FIXTURE = `
*[_type == "categoria" && activa != false] | order(orden asc, nombre asc) {
  _id, nombre, "slug": slug.current, esMenores,
  "torneo": *[_type == "torneo" && categoria._ref == ^._id && estado == "enCurso"] | order(temporada desc, _createdAt desc)[0] {
    _id, nombre, temporada, puntosVictoria, puntosEmpate, criteriosDesempate,
    "equipos": equipos[]->${EQUIPO},
    "ajustes": ajustes[]{ puntos, motivo, "equipoId": equipo._ref, "equipoNombre": equipo->nombre },
    "partidos": *[_type == "partido" && torneo._ref == ^._id] | order(fecha asc, diaHora asc) {
      _id, fecha, diaHora, cancha, estado, golesLocal, golesVisitante, observacion,
      goleadores[]{ nombre, apellido, equipo, minuto, enContra },
      "local": local->${EQUIPO},
      "visitante": visitante->${EQUIPO}
    }
  }
}`;

const CONSULTA_CONFIGURACION = `*[_type == "configuracion" && _id == "configuracion"][0] {
  nombreClub, whatsapp, email, instagram, direccion, horariosSecretaria, descripcionSitio,
  "escudo": escudo${IMAGEN}, "imagenCompartir": imagenCompartir${IMAGEN}
}`;

async function datosDePrueba<T>(archivo: string): Promise<T> {
  const mod = await import(`../datos-prueba/${archivo}.json`);
  return mod.default as T;
}

// Se memoriza para que todas las páginas del build compartan una sola consulta.
let fixture: Promise<Categoria[]> | undefined;
let configuracion: Promise<Configuracion> | undefined;

export function obtenerFixture(): Promise<Categoria[]> {
  fixture ??= usarDatosDePrueba
    ? datosDePrueba<Categoria[]>('fixture')
    : cliente
      ? cliente.fetch<Categoria[]>(CONSULTA_FIXTURE)
      : Promise.resolve([]);
  return fixture;
}

export function obtenerConfiguracion(): Promise<Configuracion> {
  configuracion ??= usarDatosDePrueba
    ? datosDePrueba<Configuracion>('configuracion')
    : cliente
      ? cliente.fetch<Configuracion | null>(CONSULTA_CONFIGURACION).then((c) => c ?? {})
      : Promise.resolve({});
  return configuracion;
}
