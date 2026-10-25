import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../functions/api/contacto';

const kv = () => {
  const m = new Map<string, string>();
  return { get: async (k: string) => m.get(k) ?? null, put: async (k: string, v: string) => void m.set(k, v), m };
};

const env = (extra = {}) => ({ TURNSTILE_SECRET: 's', RESEND_API_KEY: 'k', CONTACTO_DESTINO: 'club@ejemplo.com', LIMITES: kv(), ...extra });
const datos = { tipo: 'contacto', nombre: 'Ana', email: 'ana@ejemplo.com', mensaje: 'Quiero saber los horarios.', 'cf-turnstile-response': 'tok' };

const pedido = (cuerpo: unknown, headers: Record<string, string> = {}) =>
  new Request('https://club.pages.dev/api/contacto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://club.pages.dev', 'CF-Connecting-IP': '200.1.2.3', ...headers },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  });

const fetchFalso = (turnstileOk = true, resendOk = true) =>
  vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
    const u = String(url);
    if (u.includes('turnstile')) return new Response(JSON.stringify({ success: turnstileOk }));
    if (u.includes('resend')) return new Response('{}', { status: resendOk ? 200 : 500 });
    throw new Error(`fetch inesperado: ${u}`);
  });

afterEach(() => vi.unstubAllGlobals());

describe('función /api/contacto', () => {
  it('envía el email y responde ok', async () => {
    const f = fetchFalso();
    vi.stubGlobal('fetch', f);
    const r = await onRequestPost({ request: pedido(datos), env: env() });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    const llamadaResend = f.mock.calls.find((c) => String(c[0]).includes('resend'));
    expect(JSON.parse(String(llamadaResend?.[1]?.body)).to).toEqual(['club@ejemplo.com']);
  });

  it('sin JavaScript: redirige a una página sin datos en la URL', async () => {
    vi.stubGlobal('fetch', fetchFalso());
    const cuerpo = new URLSearchParams(datos as Record<string, string>).toString();
    const r = await onRequestPost({ request: pedido(cuerpo, { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' }), env: env() });
    expect(r.status).toBe(303);
    expect(r.headers.get('Location')).toBe('https://club.pages.dev/contacto/enviado');
  });

  it('rechaza pedidos desde otro sitio', async () => {
    const r = await onRequestPost({ request: pedido(datos, { Origin: 'https://malo.com' }), env: env() });
    expect(r.status).toBe(403);
  });

  it('rechaza cuerpos enormes o ilegibles', async () => {
    expect((await onRequestPost({ request: pedido({ ...datos, mensaje: 'x'.repeat(20_000) }), env: env() })).status).toBe(400);
    expect((await onRequestPost({ request: pedido('{no es json'), env: env() })).status).toBe(400);
  });

  it('corta al sexto envío en la hora y no guarda la IP en claro', async () => {
    vi.stubGlobal('fetch', fetchFalso());
    const e = env();
    const estados = [];
    for (let i = 0; i < 6; i++) estados.push((await onRequestPost({ request: pedido(datos), env: e })).status);
    expect(estados).toEqual([200, 200, 200, 200, 200, 429]);
    expect([...e.LIMITES.m.keys()].join()).not.toContain('200.1.2.3');
  });

  it('si Resend falla, responde 502 sin detalles', async () => {
    vi.stubGlobal('fetch', fetchFalso(true, false));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await onRequestPost({ request: pedido(datos), env: env() });
    expect(r.status).toBe(502);
    expect(JSON.stringify(await r.json())).not.toContain('Ana');
  });

  it('Turnstile inválido: 403', async () => {
    vi.stubGlobal('fetch', fetchFalso(false));
    expect((await onRequestPost({ request: pedido(datos), env: env() })).status).toBe(403);
  });
});
