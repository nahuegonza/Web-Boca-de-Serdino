/**
 * Inscripción a pruebas, fase 1 (ADR-001): todo ocurre en el navegador.
 * El formulario valida y arma un mensaje de WhatsApp con datos mínimos; nada se envía ni se guarda en un servidor.
 * El texto del mensaje viaja en el link de WhatsApp, por eso nunca incluye apellidos, documentos ni contactos.
 */
import type { Convocatoria } from './cms';

export interface DatosInscripcion {
  nombreJugador: string;
  anioNacimiento: string;
  genero?: string;
  posicion?: string;
  nombreAdulto?: string;
  vinculo?: string;
  consentimientoDatos: boolean;
  autorizacionImagen?: 'si' | 'no' | '';
}

export type Errores = Partial<Record<keyof DatosInscripcion, string>>;

export const EDAD_MAYORIA = 18;

const limpiar = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();

/** Solo el primer nombre: nunca se arma el mensaje con apellido aunque lo escriban. */
export const nombreDePila = (s: string | undefined | null) => limpiar(s).split(' ')[0] ?? '';

/** Un año de nacimiento solo dice si en algún momento del año cumple menos de 18: se trata como menor. */
export function puedeSerMenor(anio: number, anioActual = new Date().getFullYear()): boolean {
  return anioActual - anio <= EDAD_MAYORIA;
}

/** Busca la convocatoria abierta que corresponde al año (y al género, si la convocatoria lo distingue). */
export function categoriaPorAnio(anio: number, convocatorias: Convocatoria[], genero?: string): Convocatoria | null {
  if (!Number.isInteger(anio)) return null;
  const candidatas = convocatorias.filter((c) => {
    const desde = Math.min(c.anioDesde, c.anioHasta);
    const hasta = Math.max(c.anioDesde, c.anioHasta);
    return anio >= desde && anio <= hasta;
  });
  if (!candidatas.length) return null;
  const porGenero = genero ? candidatas.find((c) => c.genero === genero) : undefined;
  return porGenero ?? candidatas.find((c) => !c.genero || c.genero === 'mixto') ?? candidatas[0];
}

export function validar(d: DatosInscripcion, anioActual = new Date().getFullYear()): Errores {
  const e: Errores = {};
  const nombre = limpiar(d.nombreJugador);
  if (!nombre) e.nombreJugador = 'Escribí el nombre del jugador o jugadora.';
  else if (nombre.length > 40) e.nombreJugador = 'El nombre es demasiado largo. Con el nombre de pila alcanza.';
  else if (/[<>{}\\]/.test(nombre)) e.nombreJugador = 'Usá solo letras y espacios.';

  const anioTxt = limpiar(d.anioNacimiento);
  const anio = Number(anioTxt);
  if (!anioTxt) e.anioNacimiento = 'Escribí el año de nacimiento, por ejemplo 2012.';
  else if (!/^\d{4}$/.test(anioTxt) || anio > anioActual - 3 || anio < anioActual - 60) {
    e.anioNacimiento = `Escribí un año entre ${anioActual - 60} y ${anioActual - 3}.`;
  }

  if (!e.anioNacimiento && puedeSerMenor(anio, anioActual)) {
    if (!limpiar(d.nombreAdulto)) e.nombreAdulto = 'Para menores, escribí el nombre de la madre, el padre o la persona a cargo.';
    else if (limpiar(d.nombreAdulto).length > 40) e.nombreAdulto = 'Con el nombre de pila alcanza.';
    if (!limpiar(d.vinculo)) e.vinculo = 'Elegí el vínculo con el jugador o jugadora.';
  }

  if (!d.consentimientoDatos) e.consentimientoDatos = 'Para seguir, aceptá que el club use estos datos solo para organizar la prueba.';
  if (d.autorizacionImagen !== 'si' && d.autorizacionImagen !== 'no') e.autorizacionImagen = 'Elegí si autorizás o no las fotos.';
  return e;
}

export function armarMensaje(d: DatosInscripcion, convocatoria: Convocatoria | null, anioActual = new Date().getFullYear()): string {
  const anio = Number(limpiar(d.anioNacimiento));
  const menor = puedeSerMenor(anio, anioActual);
  const lineas = [
    '¡Hola! Quiero anotarme a las pruebas de Boca de Serodino.',
    `Jugador/a: ${nombreDePila(d.nombreJugador)}`,
    `Año de nacimiento: ${anio}`,
    `Categoría: ${convocatoria ? convocatoria.categoria : 'a confirmar'}`,
  ];
  if (limpiar(d.posicion)) lineas.push(`Posición: ${limpiar(d.posicion)}`);
  if (menor && limpiar(d.nombreAdulto)) lineas.push(`Escribe: ${nombreDePila(d.nombreAdulto)} (${limpiar(d.vinculo).toLowerCase()})`);
  lineas.push('Acepto que el club use estos datos solo para organizar la prueba.');
  lineas.push(d.autorizacionImagen === 'si' ? 'Autorizo fotos durante la prueba.' : 'No autorizo fotos.');
  return lineas.join('\n');
}

/** Número en formato internacional, solo dígitos (el que carga el club en el CMS). */
export function enlaceWhatsApp(numero: string | null | undefined, texto: string): string | null {
  const limpio = (numero ?? '').replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(limpio)) return null;
  return `https://wa.me/${limpio}?text=${encodeURIComponent(texto)}`;
}
