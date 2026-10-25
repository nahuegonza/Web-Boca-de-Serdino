/**
 * Formularios de contacto y de empresas interesadas en ser sponsor.
 * La validación se comparte entre el navegador y el servidor; el servidor vuelve a validar todo.
 * Nada de lo que escribe la persona se guarda ni se registra en logs: solo se reenvía por email al club.
 */

export type TipoConsulta = 'contacto' | 'sponsor';

export interface DatosContacto {
  tipo: TipoConsulta;
  nombre: string;
  email: string;
  telefono?: string;
  empresa?: string;
  mensaje: string;
  /** Campo trampa: invisible para personas; si viene con texto, es un robot. */
  sitio_web?: string;
}

export type ErroresContacto = Partial<Record<'nombre' | 'email' | 'telefono' | 'empresa' | 'mensaje' | 'tipo', string>>;

const limpiar = (s: unknown) => (typeof s === 'string' ? s.replace(/\r\n?/g, '\n').trim() : '');
const unaLinea = (s: unknown) => limpiar(s).replace(/\s+/g, ' ');

export const LIMITES_CAMPOS = { nombre: 80, email: 120, telefono: 25, empresa: 100, mensaje: 2000 } as const;

export function normalizar(entrada: Record<string, unknown>): DatosContacto {
  return {
    tipo: entrada.tipo === 'sponsor' ? 'sponsor' : 'contacto',
    nombre: unaLinea(entrada.nombre),
    email: unaLinea(entrada.email).toLowerCase(),
    telefono: unaLinea(entrada.telefono),
    empresa: unaLinea(entrada.empresa),
    mensaje: limpiar(entrada.mensaje),
    sitio_web: unaLinea(entrada.sitio_web),
  };
}

export function validarContacto(d: DatosContacto): ErroresContacto {
  const e: ErroresContacto = {};
  if (d.nombre.length < 2) e.nombre = 'Escribí tu nombre.';
  else if (d.nombre.length > LIMITES_CAMPOS.nombre) e.nombre = `Hasta ${LIMITES_CAMPOS.nombre} caracteres.`;

  if (!d.email) e.email = 'Escribí tu email para que podamos responderte.';
  else if (d.email.length > LIMITES_CAMPOS.email || !/^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/.test(d.email)) e.email = 'Revisá el email: falta algo, por ejemplo nombre@gmail.com.';

  if (d.telefono && (d.telefono.length > LIMITES_CAMPOS.telefono || !/^[+\d][\d\s()-]{5,}$/.test(d.telefono))) e.telefono = 'Usá solo números, espacios y guiones.';

  if (d.tipo === 'sponsor') {
    if (!d.empresa || d.empresa.length < 2) e.empresa = 'Escribí el nombre del comercio o empresa.';
    else if (d.empresa.length > LIMITES_CAMPOS.empresa) e.empresa = `Hasta ${LIMITES_CAMPOS.empresa} caracteres.`;
  }

  if (d.mensaje.length < 10) e.mensaje = 'Contanos un poco más: al menos 10 caracteres.';
  else if (d.mensaje.length > LIMITES_CAMPOS.mensaje) e.mensaje = `Hasta ${LIMITES_CAMPOS.mensaje} caracteres.`;
  return e;
}

/* ---------- Servidor ---------- */

export interface Dependencias {
  /** Verifica el token de Turnstile. Devuelve true si es válido. */
  verificarTurnstile: (token: string, ip: string | null) => Promise<boolean>;
  /** Registra un intento y devuelve true si la IP superó el límite. */
  superoLimite: (ip: string | null) => Promise<boolean>;
  /** Envía el email al club. Lanza error si falla. */
  enviar: (correo: { asunto: string; texto: string; responderA: string }) => Promise<void>;
}

export interface Respuesta {
  estado: number;
  cuerpo: { ok: boolean; error?: string; errores?: ErroresContacto };
}

export const MENSAJES = {
  limite: 'Recibimos muchos mensajes desde tu conexión. Probá de nuevo en una hora o escribinos por WhatsApp.',
  robot: 'No pudimos verificar que sos una persona. Recargá la página y probá de nuevo.',
  envio: 'No pudimos enviar el mensaje. Probá de nuevo en unos minutos o escribinos por WhatsApp.',
  datos: 'Revisá los datos marcados.',
} as const;

export function armarCorreo(d: DatosContacto) {
  const asunto = d.tipo === 'sponsor' ? `Empresa interesada en ser sponsor: ${d.empresa}` : `Consulta desde el sitio: ${d.nombre}`;
  const lineas = [
    d.tipo === 'sponsor' ? 'Una empresa quiere sumarse como sponsor.' : 'Llegó una consulta desde el formulario de contacto.',
    '',
    `Nombre: ${d.nombre}`,
    d.empresa ? `Empresa: ${d.empresa}` : null,
    `Email: ${d.email}`,
    d.telefono ? `Teléfono: ${d.telefono}` : null,
    '',
    'Mensaje:',
    d.mensaje,
    '',
    '---',
    'Respondé este email para contestarle directamente.',
  ].filter((l): l is string => l !== null);
  // El asunto es una sola línea y sin caracteres de control.
  return { asunto: asunto.replace(/[\r\n\t]/g, ' ').slice(0, 150), texto: lineas.join('\n'), responderA: d.email };
}

export async function procesarContacto(entrada: Record<string, unknown>, ip: string | null, deps: Dependencias): Promise<Respuesta> {
  const datos = normalizar(entrada);

  // Robot: se responde "ok" para no darle pistas, pero no se envía nada.
  if (datos.sitio_web) return { estado: 200, cuerpo: { ok: true } };

  if (await deps.superoLimite(ip)) return { estado: 429, cuerpo: { ok: false, error: MENSAJES.limite } };

  const errores = validarContacto(datos);
  if (Object.keys(errores).length) return { estado: 400, cuerpo: { ok: false, error: MENSAJES.datos, errores } };

  const token = typeof entrada['cf-turnstile-response'] === 'string' ? entrada['cf-turnstile-response'] : '';
  if (!(await deps.verificarTurnstile(token, ip))) return { estado: 403, cuerpo: { ok: false, error: MENSAJES.robot } };

  try {
    await deps.enviar(armarCorreo(datos));
  } catch {
    return { estado: 502, cuerpo: { ok: false, error: MENSAJES.envio } };
  }
  return { estado: 200, cuerpo: { ok: true } };
}

/** Clave de límite: hash de la IP con una sal, nunca la IP en claro. */
export async function claveLimite(ip: string, sal: string, ventana: number): Promise<string> {
  const datos = new TextEncoder().encode(`${sal}:${ip}`);
  const hash = await crypto.subtle.digest('SHA-256', datos);
  const hex = [...new Uint8Array(hash)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `contacto:${ventana}:${hex}`;
}
