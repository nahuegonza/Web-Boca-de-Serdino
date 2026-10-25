import type { CategoriaNoticia, NoticiaResumen, TextoRico } from './cms';

export const CATEGORIAS_NOTICIA: { valor: CategoriaNoticia; titulo: string; slug: string }[] = [
  { valor: 'futbol', titulo: 'Fútbol', slug: 'futbol' },
  { valor: 'inferiores', titulo: 'Inferiores', slug: 'inferiores' },
  { valor: 'institucional', titulo: 'Institucional', slug: 'institucional' },
  { valor: 'eventos', titulo: 'Eventos', slug: 'eventos' },
];

export const NOTICIAS_POR_PAGINA = 9;

export const tituloCategoria = (c: CategoriaNoticia | null | undefined) =>
  CATEGORIAS_NOTICIA.find((x) => x.valor === c)?.titulo ?? 'Noticias';

/** Las N más recientes ya publicadas (fecha pasada), sin depender del orden de entrada. */
export function ultimasNoticias<T extends Pick<NoticiaResumen, 'fecha'>>(noticias: T[], cantidad = 3, ahora = Date.now()): T[] {
  return noticias
    .filter((n) => n.fecha && Date.parse(n.fecha) <= ahora)
    .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha))
    .slice(0, cantidad);
}

/** Texto plano de un bloque de Portable Text (para descripciones y lectores). */
export function textoPlano(bloques: TextoRico | null | undefined, max = 160): string {
  const texto = (bloques ?? [])
    .filter((b) => b._type === 'block')
    .map((b) => ((b.children as Array<{ text?: string }> | undefined) ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  // Si el corte cae justo al final de una palabra, se conserva; si no, se retrocede al último espacio.
  const palabraCompleta = texto.charAt(max - 1) === ' ';
  const ultimoEspacio = corte.lastIndexOf(' ');
  return `${palabraCompleta || ultimoEspacio <= 0 ? corte : corte.slice(0, ultimoEspacio)}…`;
}

/** Divide el cuerpo en tramos de texto e imágenes, para optimizar cada imagen por separado. */
export type Tramo = { tipo: 'texto'; bloques: TextoRico } | { tipo: 'imagen'; bloque: Record<string, unknown> };

export function dividirCuerpo(cuerpo: TextoRico | null | undefined): Tramo[] {
  const tramos: Tramo[] = [];
  for (const b of cuerpo ?? []) {
    if (b._type === 'image') {
      if (b.url) tramos.push({ tipo: 'imagen', bloque: b });
      continue;
    }
    const ultimo = tramos.at(-1);
    if (ultimo?.tipo === 'texto') ultimo.bloques.push(b);
    else tramos.push({ tipo: 'texto', bloques: [b] });
  }
  return tramos;
}

/** Links para compartir. El texto va codificado; nunca incluye datos personales. */
export function enlacesCompartir(url: string, titulo: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(titulo);
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://x.com/intent/post?text=${t}&url=${u}`,
  };
}

/** Acepta solo links de publicaciones o reels de Instagram; devuelve la URL limpia para el embed oficial. */
export function urlEmbedInstagram(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (!/^(www\.)?instagram\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(?:[A-Za-z0-9._]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    return m ? `https://www.instagram.com/${m[1]}/${m[2]}/` : null;
  } catch {
    return null;
  }
}
