import type { VistaPartido } from './fixture';

const ZONA = 'America/Argentina/Buenos_Aires';
const diaSemana = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, weekday: 'long' });
const fechaDia = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Días calendario (en Argentina) entre dos instantes. */
export function diasCalendario(desde: number, hasta: number): number {
  const dia = (t: number) => {
    const [d, m, a] = fechaDia.format(new Date(t)).split('/').map(Number);
    return Date.UTC(a, m - 1, d) / 86_400_000;
  };
  return dia(hasta) - dia(desde);
}

/**
 * Título del hero según el próximo partido de Primera.
 * Local: "El domingo jugamos en casa". Visitante: "El domingo visitamos a Rival".
 */
export function tituloHero(vista: VistaPartido | null, ahora = Date.now()): string {
  if (!vista) return 'Somos Boca de Serodino';
  const rival = vista.rival?.nombreCorto || vista.rival?.nombre || 'nuestro rival';
  const iso = vista.partido.diaHora;
  let cuando = 'Se viene';
  if (iso && !Number.isNaN(Date.parse(iso))) {
    const dias = diasCalendario(ahora, Date.parse(iso));
    const nombreDia = diaSemana.format(new Date(iso));
    cuando = dias <= 0 ? 'Hoy' : dias === 1 ? 'Mañana' : dias < 7 ? `El ${nombreDia}` : 'Se viene';
  }
  const accion = vista.condicion === 'local' ? 'jugamos en casa' : `visitamos a ${rival}`;
  return cuando === 'Se viene' ? `Se viene: ${vista.condicion === 'local' ? `${rival} en casa` : `visita a ${rival}`}` : `${cuando} ${accion}`;
}

/** Texto de la cuenta regresiva. null cuando ya pasó más de 2 horas del inicio. */
export function textoCuentaRegresiva(inicio: number, ahora = Date.now()): string | null {
  const ms = inicio - ahora;
  if (ms <= -2 * 60 * 60 * 1000) return null;
  if (ms <= 0) return 'Se está jugando';
  const min = Math.floor(ms / 60_000);
  const dias = Math.floor(min / 1440);
  const horas = Math.floor((min % 1440) / 60);
  const minutos = min % 60;
  if (dias >= 1) return `Faltan ${dias} ${dias === 1 ? 'día' : 'días'}${horas ? ` y ${horas} h` : ''}`;
  if (horas >= 1) return `Faltan ${horas} h${minutos ? ` ${minutos} min` : ''}`;
  return `Faltan ${Math.max(1, minutos)} min`;
}
