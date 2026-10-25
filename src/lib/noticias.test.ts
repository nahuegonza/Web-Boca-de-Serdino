import { describe, expect, it } from 'vitest';
import { dividirCuerpo, enlacesCompartir, textoPlano, tituloCategoria, ultimasNoticias, urlEmbedInstagram } from './noticias';

const bloque = (text: string) => ({ _type: 'block', style: 'normal', children: [{ _type: 'span', text }] });

describe('últimas noticias', () => {
  const ns = [
    { id: 'a', fecha: '2026-10-01T10:00:00Z' },
    { id: 'b', fecha: '2026-10-20T10:00:00Z' },
    { id: 'c', fecha: '2026-10-10T10:00:00Z' },
    { id: 'd', fecha: '2026-10-15T10:00:00Z' },
    { id: 'futura', fecha: '2027-01-01T10:00:00Z' },
  ];
  it('devuelve las 3 más recientes y excluye las programadas a futuro', () => {
    expect(ultimasNoticias(ns, 3, Date.parse('2026-10-25T00:00:00Z')).map((n) => n.id)).toEqual(['b', 'd', 'c']);
  });
  it('con menos de 3 devuelve las que hay', () => {
    expect(ultimasNoticias(ns.slice(0, 1), 3, Date.parse('2026-10-25T00:00:00Z'))).toHaveLength(1);
  });
});

describe('texto del cuerpo', () => {
  it('une los bloques y corta en una palabra completa', () => {
    const t = textoPlano([bloque('La Primera ganó'), bloque('en un partido muy intenso')], 30);
    expect(t).toBe('La Primera ganó en un partido…');
    expect(t.length).toBeLessThanOrEqual(30);
  });
  it('ignora imágenes y vacíos', () => {
    expect(textoPlano([{ _type: 'image', url: 'x' }], 50)).toBe('');
    expect(textoPlano(null)).toBe('');
  });
  it('divide texto e imágenes en tramos', () => {
    const tramos = dividirCuerpo([bloque('a'), bloque('b'), { _type: 'image', url: 'u' }, bloque('c'), { _type: 'image' }]);
    expect(tramos.map((t) => t.tipo)).toEqual(['texto', 'imagen', 'texto']);
  });
});

describe('compartir', () => {
  it('codifica título y URL', () => {
    const e = enlacesCompartir('https://club.ar/noticias/a b', 'Ganamos 2–1 & seguimos');
    expect(e.whatsapp).toBe('https://wa.me/?text=Ganamos%202%E2%80%931%20%26%20seguimos%20https%3A%2F%2Fclub.ar%2Fnoticias%2Fa%20b');
    expect(e.facebook).toContain('u=https%3A%2F%2Fclub.ar');
    expect(e.x).toContain('text=Ganamos');
  });
});

describe('Instagram', () => {
  it('acepta posts y reels, con o sin usuario y parámetros', () => {
    expect(urlEmbedInstagram('https://www.instagram.com/p/ABC_123/?igsh=xyz')).toBe('https://www.instagram.com/p/ABC_123/');
    expect(urlEmbedInstagram('https://instagram.com/clubboca_serodino/reel/Zz9/')).toBe('https://www.instagram.com/reel/Zz9/');
  });
  it('rechaza otros sitios, perfiles y basura', () => {
    expect(urlEmbedInstagram('https://www.instagram.com/clubboca_serodino/')).toBeNull();
    expect(urlEmbedInstagram('https://evil.com/p/ABC/')).toBeNull();
    expect(urlEmbedInstagram('javascript:alert(1)')).toBeNull();
    expect(urlEmbedInstagram('')).toBeNull();
  });
});

describe('categorías', () => {
  it('nombre visible', () => {
    expect(tituloCategoria('futbol')).toBe('Fútbol');
    expect(tituloCategoria(null)).toBe('Noticias');
  });
});
