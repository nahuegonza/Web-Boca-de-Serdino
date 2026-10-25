/**
 * POST /api/contacto (Cloudflare Pages Function).
 * Recibe los formularios de contacto y de sponsors, aplica anti-spam y reenvía por email al club.
 * No guarda los mensajes, no los registra en logs y nunca devuelve datos de la persona.
 *
 * Variables (Cloudflare Pages > Settings > Variables and secrets):
 *   TURNSTILE_SECRET   secreto de Turnstile (obligatorio en producción)
 *   RESEND_API_KEY     clave de Resend para enviar el email
 *   CONTACTO_DESTINO   casilla del club que recibe los mensajes
 *   CONTACTO_REMITENTE opcional; por defecto "Sitio Boca de Serodino <onboarding@resend.dev>"
 *   LIMITE_SAL         texto aleatorio para anonimizar las IP del límite de envíos
 * Binding KV: LIMITES (namespace para contar envíos por hora).
 */
import { claveLimite, procesarContacto, type Dependencias } from '../../src/lib/contacto';

interface KV {
  get(clave: string): Promise<string | null>;
  put(clave: string, valor: string, opciones?: { expirationTtl?: number }): Promise<void>;
}

interface Entorno {
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  CONTACTO_DESTINO?: string;
  CONTACTO_REMITENTE?: string;
  LIMITE_SAL?: string;
  LIMITES?: KV;
}

interface Contexto {
  request: Request;
  env: Entorno;
}

const MAX_BYTES = 12_000;
const MAX_POR_HORA = 5;

const json = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });

async function leerCuerpo(req: Request): Promise<Record<string, unknown> | null> {
  const tipo = req.headers.get('Content-Type') ?? '';
  const texto = await req.text();
  if (texto.length > MAX_BYTES) return null;
  if (tipo.includes('application/json')) {
    try {
      const v = JSON.parse(texto);
      return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  }
  if (tipo.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(texto));
  return null;
}

function dependencias(env: Entorno): Dependencias {
  return {
    async verificarTurnstile(token, ip) {
      if (!env.TURNSTILE_SECRET) {
        console.warn('contacto: falta TURNSTILE_SECRET; se omite la verificación');
        return true;
      }
      if (!token) return false;
      const cuerpo = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
      if (ip) cuerpo.set('remoteip', ip);
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: cuerpo });
      if (!r.ok) return false;
      const datos = (await r.json()) as { success?: boolean };
      return datos.success === true;
    },

    async superoLimite(ip) {
      if (!env.LIMITES || !ip) return false;
      const ventana = Math.floor(Date.now() / 3_600_000);
      const clave = await claveLimite(ip, env.LIMITE_SAL ?? 'boca-serodino', ventana);
      const cantidad = Number((await env.LIMITES.get(clave)) ?? '0');
      if (cantidad >= MAX_POR_HORA) return true;
      await env.LIMITES.put(clave, String(cantidad + 1), { expirationTtl: 3_700 });
      return false;
    },

    async enviar({ asunto, texto, responderA }) {
      if (!env.RESEND_API_KEY || !env.CONTACTO_DESTINO) throw new Error('email no configurado');
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.CONTACTO_REMITENTE || 'Sitio Boca de Serodino <onboarding@resend.dev>',
          to: [env.CONTACTO_DESTINO],
          reply_to: responderA,
          subject: asunto,
          text: texto,
        }),
      });
      // Solo se registra el código, nunca el contenido.
      if (!r.ok) {
        console.error(`contacto: Resend respondió ${r.status}`);
        throw new Error('envío fallido');
      }
    },
  };
}

export async function onRequestPost({ request, env }: Contexto): Promise<Response> {
  // Solo se aceptan envíos desde el propio sitio.
  const origen = request.headers.get('Origin');
  if (origen && new URL(origen).host !== new URL(request.url).host) return json(403, { ok: false, error: 'Origen no permitido.' });

  const conJs = (request.headers.get('Accept') ?? '').includes('application/json');
  const entrada = await leerCuerpo(request);
  if (!entrada) return json(400, { ok: false, error: 'No pudimos leer el formulario. Recargá la página y probá de nuevo.' });

  const ip = request.headers.get('CF-Connecting-IP');
  const resultado = await procesarContacto(entrada, ip, dependencias(env));

  if (conJs) return json(resultado.estado, resultado.cuerpo);
  // Sin JavaScript: se redirige a una página de resultado, sin datos en la dirección.
  const destino = new URL(resultado.cuerpo.ok ? '/contacto/enviado' : '/contacto/no-enviado', request.url);
  return Response.redirect(destino.toString(), 303);
}

export const onRequest = () => json(405, { ok: false, error: 'Método no permitido.' });
