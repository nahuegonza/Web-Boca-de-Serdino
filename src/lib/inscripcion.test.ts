import { describe, expect, it } from 'vitest';
import type { Convocatoria } from './cms';
import { armarMensaje, categoriaPorAnio, enlaceWhatsApp, nombreDePila, puedeSerMenor, validar, type DatosInscripcion } from './inscripcion';

const conv = (categoria: string, anioDesde: number, anioHasta: number, genero?: Convocatoria['genero']): Convocatoria => ({ _id: categoria, categoria, anioDesde, anioHasta, genero });
const convocatorias = [conv('Sub-13', 2013, 2014), conv('Sub-15', 2011, 2012), conv('Femenino Sub-15', 2011, 2012, 'femenino')];
const ANIO = 2026;

const base: DatosInscripcion = {
  nombreJugador: 'Juan Martín Pérez',
  anioNacimiento: '2012',
  nombreAdulto: 'Laura Gómez',
  vinculo: 'Madre',
  consentimientoDatos: true,
  autorizacionImagen: 'no',
};

describe('categoría por año de nacimiento', () => {
  it('encuentra la categoría por rango', () => {
    expect(categoriaPorAnio(2013, convocatorias)?.categoria).toBe('Sub-13');
    expect(categoriaPorAnio(2011, convocatorias)?.categoria).toBe('Sub-15');
  });
  it('acepta rangos cargados al revés', () => {
    expect(categoriaPorAnio(2012, [conv('Sub-15', 2012, 2011)])?.categoria).toBe('Sub-15');
  });
  it('prefiere la convocatoria del género elegido', () => {
    expect(categoriaPorAnio(2012, convocatorias, 'femenino')?.categoria).toBe('Femenino Sub-15');
    expect(categoriaPorAnio(2012, convocatorias, 'masculino')?.categoria).toBe('Sub-15');
  });
  it('sin convocatoria para ese año devuelve null', () => {
    expect(categoriaPorAnio(2005, convocatorias)).toBeNull();
    expect(categoriaPorAnio(Number.NaN, convocatorias)).toBeNull();
  });
});

describe('menores', () => {
  it('con solo el año, quien cumple 18 este año se trata como menor', () => {
    expect(puedeSerMenor(2008, ANIO)).toBe(true);
    expect(puedeSerMenor(2007, ANIO)).toBe(false);
  });
});

describe('validación', () => {
  it('datos completos: sin errores', () => {
    expect(validar(base, ANIO)).toEqual({});
  });
  it('pide adulto responsable para menores', () => {
    const e = validar({ ...base, nombreAdulto: '', vinculo: '' }, ANIO);
    expect(e.nombreAdulto).toBeDefined();
    expect(e.vinculo).toBeDefined();
  });
  it('no pide adulto para mayores', () => {
    expect(validar({ ...base, anioNacimiento: '2000', nombreAdulto: '', vinculo: '' }, ANIO)).toEqual({});
  });
  it('año inválido, vacío o fuera de rango', () => {
    expect(validar({ ...base, anioNacimiento: '' }, ANIO).anioNacimiento).toBeDefined();
    expect(validar({ ...base, anioNacimiento: '12' }, ANIO).anioNacimiento).toBeDefined();
    expect(validar({ ...base, anioNacimiento: '2025' }, ANIO).anioNacimiento).toBeDefined();
    expect(validar({ ...base, anioNacimiento: '1900' }, ANIO).anioNacimiento).toBeDefined();
  });
  it('consentimiento obligatorio y autorización de imagen con respuesta explícita', () => {
    const e = validar({ ...base, consentimientoDatos: false, autorizacionImagen: '' }, ANIO);
    expect(e.consentimientoDatos).toBeDefined();
    expect(e.autorizacionImagen).toBeDefined();
  });
  it('rechaza caracteres de código en el nombre', () => {
    expect(validar({ ...base, nombreJugador: '<script>' }, ANIO).nombreJugador).toBeDefined();
  });
});

describe('mensaje de WhatsApp', () => {
  const msj = armarMensaje(base, categoriaPorAnio(2012, convocatorias), ANIO);
  it('usa solo nombres de pila: nunca apellidos', () => {
    expect(msj).toContain('Jugador/a: Juan');
    expect(msj).not.toContain('Pérez');
    expect(msj).not.toContain('Martín');
    expect(msj).toContain('Escribe: Laura (madre)');
    expect(msj).not.toContain('Gómez');
  });
  it('incluye año, categoría y las dos respuestas de consentimiento', () => {
    expect(msj).toContain('Año de nacimiento: 2012');
    expect(msj).toContain('Categoría: Sub-15');
    expect(msj).toContain('Acepto que el club use estos datos');
    expect(msj).toContain('No autorizo fotos.');
  });
  it('sin categoría: "a confirmar"', () => {
    expect(armarMensaje({ ...base, anioNacimiento: '2005' }, null, ANIO)).toContain('Categoría: a confirmar');
  });
  it('arma el link solo con un número válido', () => {
    expect(enlaceWhatsApp('+54 9 3476 12-3456', 'Hola & chau')).toBe('https://wa.me/5493476123456?text=Hola%20%26%20chau');
    expect(enlaceWhatsApp('123', 'x')).toBeNull();
    expect(enlaceWhatsApp(null, 'x')).toBeNull();
  });
  it('nombre de pila', () => {
    expect(nombreDePila('  María  José  López ')).toBe('María');
  });
});
