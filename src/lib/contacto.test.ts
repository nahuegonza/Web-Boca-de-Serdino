import { describe, expect, it, vi } from 'vitest';
import { armarCorreo, claveLimite, MENSAJES, normalizar, procesarContacto, validarContacto, type Dependencias } from './contacto';

const valido = { tipo: 'contacto', nombre: 'Ana López', email: 'Ana@Gmail.com ', mensaje: 'Quería saber los horarios de la escuelita.', 'cf-turnstile-response': 'tok' };

const deps = (extra: Partial<Dependencias> = {}): Dependencias => ({
  verificarTurnstile: vi.fn(async () => true),
  superoLimite: vi.fn(async () => false),
  enviar: vi.fn(async () => {}),
  ...extra,
});

describe('validación compartida', () => {
  it('datos válidos', () => {
    expect(validarContacto(normalizar(valido))).toEqual({});
  });
  it('normaliza email y espacios', () => {
    const d = normalizar({ ...valido, nombre: '  Ana   López ' });
    expect(d.email).toBe('ana@gmail.com');
    expect(d.nombre).toBe('Ana López');
  });
  it('marca cada campo inválido', () => {
    const e = validarContacto(normalizar({ tipo: 'sponsor', nombre: 'A', email: 'sin-arroba', telefono: 'llamame', mensaje: 'hola' }));
    expect(Object.keys(e).sort()).toEqual(['email', 'empresa', 'mensaje', 'nombre', 'telefono']);
  });
  it('acepta teléfonos argentinos comunes', () => {
    expect(validarContacto(normalizar({ ...valido, telefono: '+54 9 3476 15-123456' })).telefono).toBeUndefined();
  });
  it('límite de largo del mensaje', () => {
    expect(validarContacto(normalizar({ ...valido, mensaje: 'x'.repeat(2001) })).mensaje).toBeDefined();
  });
  it('tipo desconocido se trata como contacto', () => {
    expect(normalizar({ ...valido, tipo: 'admin' }).tipo).toBe('contacto');
  });
});

describe('procesar en el servidor', () => {
  it('envía y responde ok sin devolver datos', async () => {
    const d = deps();
    const r = await procesarContacto(valido, '1.2.3.4', d);
    expect(r).toEqual({ estado: 200, cuerpo: { ok: true } });
    expect(d.enviar).toHaveBeenCalledOnce();
    expect(JSON.stringify(r)).not.toContain('Ana');
  });

  it('honeypot: responde ok pero no envía ni consulta el límite', async () => {
    const d = deps();
    const r = await procesarContacto({ ...valido, sitio_web: 'http://spam' }, '1.2.3.4', d);
    expect(r.cuerpo.ok).toBe(true);
    expect(d.enviar).not.toHaveBeenCalled();
    expect(d.superoLimite).not.toHaveBeenCalled();
  });

  it('límite superado: 429 antes de validar o enviar', async () => {
    const d = deps({ superoLimite: vi.fn(async () => true) });
    const r = await procesarContacto(valido, '1.2.3.4', d);
    expect(r.estado).toBe(429);
    expect(r.cuerpo.error).toBe(MENSAJES.limite);
    expect(d.enviar).not.toHaveBeenCalled();
  });

  it('datos inválidos: 400 con errores por campo, sin verificar Turnstile', async () => {
    const d = deps();
    const r = await procesarContacto({ ...valido, email: 'x' }, null, d);
    expect(r.estado).toBe(400);
    expect(r.cuerpo.errores?.email).toBeDefined();
    expect(d.verificarTurnstile).not.toHaveBeenCalled();
  });

  it('Turnstile inválido: 403 y no envía', async () => {
    const d = deps({ verificarTurnstile: vi.fn(async () => false) });
    const r = await procesarContacto(valido, '1.2.3.4', d);
    expect(r.estado).toBe(403);
    expect(d.enviar).not.toHaveBeenCalled();
  });

  it('falla del email: 502 con mensaje genérico', async () => {
    const d = deps({ enviar: vi.fn(async () => { throw new Error('API caída con datos sensibles'); }) });
    const r = await procesarContacto(valido, '1.2.3.4', d);
    expect(r.estado).toBe(502);
    expect(r.cuerpo.error).toBe(MENSAJES.envio);
    expect(JSON.stringify(r)).not.toContain('sensibles');
  });
});

describe('email al club', () => {
  it('asunto en una sola línea y responder a quien escribió', () => {
    const c = armarCorreo(normalizar({ tipo: 'sponsor', nombre: 'Juan', empresa: 'Corralón\nBcc: x@y.com', email: 'j@x.com', mensaje: 'Queremos sumarnos este año.' }));
    expect(c.asunto).not.toMatch(/[\r\n]/);
    expect(c.responderA).toBe('j@x.com');
    expect(c.texto).toContain('Queremos sumarnos');
  });
});

describe('clave de límite', () => {
  it('no contiene la IP y es estable', async () => {
    const a = await claveLimite('200.1.2.3', 'sal', 1);
    expect(a).not.toContain('200.1.2.3');
    expect(a).toBe(await claveLimite('200.1.2.3', 'sal', 1));
    expect(a).not.toBe(await claveLimite('200.1.2.3', 'sal', 2));
  });
});
