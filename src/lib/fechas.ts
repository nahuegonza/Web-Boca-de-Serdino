/** Fechas siempre en horario de Argentina, sin depender de la zona del servidor de build. */
const ZONA = 'America/Argentina/Buenos_Aires';

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, ...opts });

const largo = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const corto = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const hora = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });

const valida = (iso?: string | null): iso is string => !!iso && !Number.isNaN(Date.parse(iso));

const capitalizar = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

/** "Domingo 3 de noviembre" */
export function diaLargo(iso?: string | null): string {
  return valida(iso) ? capitalizar(largo.format(new Date(iso)).replace(',', '')) : 'Fecha a confirmar';
}

/** "Dom 3 nov" */
export function diaCorto(iso?: string | null): string {
  if (!valida(iso)) return 'A confirmar';
  return capitalizar(corto.format(new Date(iso)).replace(/[.,]/g, '').replace(/\s+/g, ' '));
}

/** "16:00" */
export function horaCorta(iso?: string | null): string {
  return valida(iso) ? hora.format(new Date(iso)) : '';
}

/** Para el atributo datetime de <time>. */
export function isoValido(iso?: string | null): string | undefined {
  return valida(iso) ? new Date(iso).toISOString() : undefined;
}
