import type { ColorClub, Hito } from './cms';

/** Solo se aceptan colores #RRGGBB: el valor va a un atributo style y no debe permitir otra cosa. */
export function colorSeguro(hex: string | null | undefined): string | null {
  return typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex.trim()) ? hex.trim().toUpperCase() : null;
}

export function coloresValidos(colores: ColorClub[] | null | undefined): (ColorClub & { hex: string })[] {
  return (colores ?? [])
    .filter((c) => c?.nombre)
    .map((c) => ({ ...c, hex: colorSeguro(c.hex) }))
    .filter((c): c is ColorClub & { hex: string } => c.hex !== null);
}

/** Ordena los hitos por año y agrega el de fundación si la comisión cargó el año pero no el hito. */
export function lineaDeTiempo(hitos: Hito[], anioFundacion?: number | null): Hito[] {
  const ordenados = [...hitos].filter((h) => h?.titulo && Number.isInteger(h.anio)).sort((a, b) => a.anio - b.anio);
  if (anioFundacion && !ordenados.some((h) => h.anio === anioFundacion)) {
    ordenados.unshift({ _id: 'fundacion', anio: anioFundacion, titulo: 'Fundación del club', texto: null, foto: null });
  }
  return ordenados;
}

export function aniosDeVida(anioFundacion: number | null | undefined, hoy = new Date()): number | null {
  if (!anioFundacion) return null;
  const anios = hoy.getFullYear() - anioFundacion;
  return anios >= 0 ? anios : null;
}
