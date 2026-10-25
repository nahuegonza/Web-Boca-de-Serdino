import { describe, expect, it } from 'vitest';
import type { CategoriaPlantel, Persona } from './cms';
import { personaPublica, prepararPlantel, puedeMostrarFoto } from './plantel';

const foto = { url: 'https://cdn.sanity.io/x.jpg', ancho: 800, alto: 1000, alt: 'Foto' };
const persona = (extra: Partial<Persona>): Persona => ({ _id: Math.random().toString(36), tipo: 'jugador', nombre: 'Juan Martín', apellido: 'Pérez', ...extra });

describe('fotos de menores', () => {
  it('mayores: se muestra aunque no esté marcada la autorización', () => {
    expect(puedeMostrarFoto({ autorizacionImagen: false }, false)).toBe(true);
  });
  it('menores: solo con autorización explícita', () => {
    expect(puedeMostrarFoto({ autorizacionImagen: true }, true)).toBe(true);
    expect(puedeMostrarFoto({ autorizacionImagen: false }, true)).toBe(false);
    expect(puedeMostrarFoto({ autorizacionImagen: null }, true)).toBe(false);
    expect(puedeMostrarFoto({}, true)).toBe(false);
  });
  it('menor sin autorización: la foto no llega a la página', () => {
    expect(personaPublica(persona({ foto }), true).foto).toBeNull();
    expect(personaPublica(persona({ foto, autorizacionImagen: true }), true).foto).toEqual(foto);
  });
});

describe('nombres', () => {
  it('menores: nombre de pila e inicial', () => {
    expect(personaPublica(persona({}), true).nombre).toBe('Juan P.');
  });
  it('mayores: nombre completo', () => {
    expect(personaPublica(persona({}), false).nombre).toBe('Juan Martín Pérez');
  });
  it('técnicos de inferiores también siguen la regla de la categoría', () => {
    const p = prepararPlantel({ _id: 'c', nombre: 'Sub-13', slug: 'sub-13', esMenores: true, personas: [persona({ tipo: 'tecnico', rol: 'DT' })] });
    expect(p.tecnicos[0].nombre).toBe('Juan P.');
  });
});

describe('agrupado por posición', () => {
  const c: CategoriaPlantel = {
    _id: 'c', nombre: 'Primera', slug: 'primera', esMenores: false,
    personas: [
      persona({ nombre: 'Delantero', apellido: 'Dos', posicion: 'delantero', numero: 11 }),
      persona({ nombre: 'Delantero', apellido: 'Uno', posicion: 'delantero', numero: 9 }),
      persona({ nombre: 'Arquero', apellido: 'Uno', posicion: 'arquero', numero: 1 }),
      persona({ nombre: 'Nuevo', apellido: 'Jugador', posicion: null, numero: null }),
      persona({ tipo: 'tecnico', nombre: 'DT', apellido: 'Club', rol: 'Director técnico' }),
      persona({ nombre: '' }),
    ],
  };
  const p = prepararPlantel(c);
  it('ordena posiciones de arco a ataque y omite las vacías', () => {
    expect(p.grupos.map((g) => g.posicion)).toEqual(['arquero', 'delantero', 'sin-posicion']);
  });
  it('dentro de cada posición, por número', () => {
    expect(p.grupos[1].jugadores.map((j) => j.numero)).toEqual([9, 11]);
  });
  it('separa al cuerpo técnico e ignora registros sin nombre', () => {
    expect(p.tecnicos).toHaveLength(1);
    expect(p.totalJugadores).toBe(4);
  });
  it('número negativo o ausente queda vacío', () => {
    expect(personaPublica(persona({ numero: -3 }), false).numero).toBeNull();
  });
});
