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
  latitud?: number | null;
  longitud?: number | null;
  instagramDestacados?: string[] | null;
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
  latitud, longitud, instagramDestacados,
  nombreClub, whatsapp, email, instagram, direccion, horariosSecretaria, descripcionSitio,
  "escudo": escudo${IMAGEN}, "imagenCompartir": imagenCompartir${IMAGEN}
}`;

/* ---------- Tipos de las demás secciones ---------- */

/** Bloques de texto enriquecido (Portable Text) tal como los devuelve Sanity. */
export type TextoRico = Array<Record<string, unknown>>;

export type Posicion = 'arquero' | 'defensor' | 'mediocampista' | 'delantero';

export interface Persona {
  _id: string;
  tipo: 'jugador' | 'tecnico';
  nombre: string;
  apellido?: string | null;
  numero?: number | null;
  posicion?: Posicion | null;
  rol?: string | null;
  autorizacionImagen?: boolean | null;
  foto?: ImagenCMS | null;
}

export interface CategoriaPlantel {
  _id: string;
  nombre: string;
  slug: string;
  esMenores?: boolean | null;
  personas: Persona[];
}

export type CategoriaNoticia = 'futbol' | 'inferiores' | 'institucional' | 'eventos';

export interface NoticiaResumen {
  _id: string;
  titulo: string;
  slug: string;
  fecha: string;
  categoria: CategoriaNoticia;
  resumen?: string | null;
  imagen?: ImagenCMS | null;
}

export interface Noticia extends NoticiaResumen {
  cuerpo?: TextoRico | null;
  galeria?: ImagenCMS[] | null;
}

export interface Hito {
  _id: string;
  anio: number;
  titulo: string;
  texto?: string | null;
  foto?: ImagenCMS | null;
}

export interface FotoHistorica {
  _id: string;
  anio?: number | null;
  epigrafe?: string | null;
  imagen: ImagenCMS;
}

export interface MiembroComision {
  _id: string;
  cargo: string;
  nombre: string;
  foto?: ImagenCMS | null;
}

export interface ColorClub {
  nombre: string;
  hex: string;
  significado?: string | null;
}

export interface Identidad {
  anioFundacion?: number | null;
  introduccion?: TextoRico | null;
  escudo?: ImagenCMS | null;
  significadoEscudo?: TextoRico | null;
  colores?: ColorClub[] | null;
  periodoComision?: string | null;
}

export interface Historia {
  identidad: Identidad;
  hitos: Hito[];
  fotos: FotoHistorica[];
  comision: MiembroComision[];
}

export type NivelSponsor = 'principal' | 'oficial' | 'colaborador';

export interface Sponsor {
  _id: string;
  nombre: string;
  nivel: NivelSponsor;
  url?: string | null;
  logo?: ImagenCMS | null;
}

export interface Convocatoria {
  _id: string;
  categoria: string;
  anioDesde: number;
  anioHasta: number;
  genero?: 'mixto' | 'masculino' | 'femenino' | null;
  dias?: string | null;
  horario?: string | null;
  lugar?: string | null;
  queLlevar?: string[] | null;
  cupoAgotado?: boolean | null;
}

export interface Inicio {
  imagenHero?: ImagenCMS | null;
  bajada?: string | null;
}

/* ---------- Consultas ---------- */

const CONSULTA_PLANTEL = `
*[_type == "categoria" && activa != false] | order(orden asc, nombre asc) {
  _id, nombre, "slug": slug.current, esMenores,
  "personas": *[_type == "persona" && activo != false && categoria._ref == ^._id] | order(tipo asc, orden asc, numero asc, apellido asc) {
    _id, tipo, nombre, apellido, numero, posicion, rol, autorizacionImagen, "foto": foto${IMAGEN}
  }
}`;

const NOTICIA_RESUMEN = `_id, titulo, "slug": slug.current, fecha, categoria, resumen, "imagen": imagenPrincipal${IMAGEN}`;

const CONSULTA_NOTICIAS = `*[_type == "noticia" && defined(slug.current) && fecha <= now()] | order(fecha desc) {
  ${NOTICIA_RESUMEN},
  cuerpo[]{ ..., _type == "image" => { "url": asset->url, "ancho": asset->metadata.dimensions.width, "alto": asset->metadata.dimensions.height, alt, epigrafe } },
  "galeria": galeria[]${IMAGEN}
}`;

const CONSULTA_HISTORIA = `{
  "identidad": coalesce(*[_type == "identidad" && _id == "identidad"][0] {
    anioFundacion, introduccion, significadoEscudo, colores[]{ nombre, hex, significado }, periodoComision,
    "escudo": escudo${IMAGEN}
  }, {}),
  "hitos": *[_type == "hito"] | order(anio asc, _createdAt asc) { _id, anio, titulo, texto, "foto": foto${IMAGEN} },
  "fotos": *[_type == "fotoHistorica" && defined(imagen.asset)] | order(anio asc, _createdAt asc) { _id, anio, epigrafe, "imagen": imagen${IMAGEN} },
  "comision": *[_type == "miembroComision" && activo != false] | order(orden asc, _createdAt asc) { _id, cargo, nombre, "foto": foto${IMAGEN} }
}`;

const CONSULTA_SPONSORS = `*[_type == "sponsor" && activo != false] | order(orden asc, nombre asc) {
  _id, nombre, nivel, url, "logo": logo${IMAGEN}
}`;

const CONSULTA_CONVOCATORIAS = `*[_type == "convocatoria" && activa == true] | order(anioDesde desc) {
  _id, "categoria": coalesce(categoria->nombre, nombre), anioDesde, anioHasta, genero, dias, horario, lugar, queLlevar, cupoAgotado
}`;

const CONSULTA_INICIO = `*[_type == "inicio" && _id == "inicio"][0] { bajada, "imagenHero": imagenHero${IMAGEN} }`;

/* ---------- Acceso ---------- */

async function datosDePrueba<T>(archivo: string): Promise<T> {
  const mod = await import(`../datos-prueba/${archivo}.json`);
  return mod.default as T;
}

// Cada consulta se memoriza: todas las páginas del build comparten un solo pedido al CMS.
const cache = new Map<string, Promise<unknown>>();

function consultar<T>(clave: string, groq: string, vacio: T): Promise<T> {
  if (!cache.has(clave)) {
    const pedido = usarDatosDePrueba
      ? datosDePrueba<T>(clave)
      : cliente
        ? cliente.fetch<T | null>(groq).then((r) => r ?? vacio)
        : Promise.resolve(vacio);
    cache.set(clave, pedido);
  }
  return cache.get(clave) as Promise<T>;
}

export const obtenerFixture = () => consultar<Categoria[]>('fixture', CONSULTA_FIXTURE, []);
export const obtenerConfiguracion = () => consultar<Configuracion>('configuracion', CONSULTA_CONFIGURACION, {});
export const obtenerPlantel = () => consultar<CategoriaPlantel[]>('plantel', CONSULTA_PLANTEL, []);
export const obtenerNoticias = () => consultar<Noticia[]>('noticias', CONSULTA_NOTICIAS, []);
export const obtenerHistoria = () =>
  consultar<Historia>('historia', CONSULTA_HISTORIA, { identidad: {}, hitos: [], fotos: [], comision: [] });
export const obtenerSponsors = () => consultar<Sponsor[]>('sponsors', CONSULTA_SPONSORS, []);
export const obtenerConvocatorias = () => consultar<Convocatoria[]>('convocatorias', CONSULTA_CONVOCATORIAS, []);
export const obtenerInicio = () => consultar<Inicio>('inicio', CONSULTA_INICIO, {});
