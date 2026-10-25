import { describe, expect, it } from 'vitest';
import type { VistaPartido } from './fixture';
import { diasCalendario, textoCuentaRegresiva, tituloHero } from './home';

const vista = (condicion: 'local' | 'visitante', diaHora: string | null): VistaPartido => ({
  partido: { _id: 'p', fecha: 1, estado: 'programado', diaHora, local: null, visitante: null },
  rival: { _id: 'r', nombre: 'Rival de Prueba', nombreCorto: 'Rival' },
  condicion,
  golesPropios: null,
  golesRival: null,
  resultado: null,
});

// Sábado 31 de octubre de 2026, 10:00 en Argentina
const SABADO = Date.parse('2026-10-31T13:00:00Z');

describe('título del hero', () => {
  it('local, al otro día', () => {
    expect(tituloHero(vista('local', '2026-11-01T19:00:00Z'), SABADO)).toBe('Mañana jugamos en casa');
  });
  it('visitante, en la semana: nombra el día y al rival', () => {
    expect(tituloHero(vista('visitante', '2026-11-04T23:00:00Z'), SABADO)).toBe('El miércoles visitamos a Rival');
  });
  it('el mismo día', () => {
    expect(tituloHero(vista('local', '2026-10-31T19:00:00Z'), SABADO)).toBe('Hoy jugamos en casa');
  });
  it('a más de una semana o sin día: "Se viene"', () => {
    expect(tituloHero(vista('local', '2026-11-20T19:00:00Z'), SABADO)).toBe('Se viene: Rival en casa');
    expect(tituloHero(vista('visitante', null), SABADO)).toBe('Se viene: visita a Rival');
  });
  it('sin partido', () => {
    expect(tituloHero(null)).toBe('Somos Boca de Serodino');
  });
  it('los días se cuentan en horario argentino, no en UTC', () => {
    // 23:30 del sábado en Argentina ya es domingo en UTC; el partido del domingo es "mañana".
    expect(diasCalendario(Date.parse('2026-11-01T02:30:00Z'), Date.parse('2026-11-01T19:00:00Z'))).toBe(1);
  });
});

describe('cuenta regresiva', () => {
  const inicio = Date.parse('2026-11-01T19:00:00Z');
  it('días y horas', () => {
    expect(textoCuentaRegresiva(inicio, inicio - (2 * 24 + 3) * 3_600_000)).toBe('Faltan 2 días y 3 h');
    expect(textoCuentaRegresiva(inicio, inicio - 24 * 3_600_000)).toBe('Faltan 1 día');
  });
  it('horas y minutos', () => {
    expect(textoCuentaRegresiva(inicio, inicio - (3 * 60 + 15) * 60_000)).toBe('Faltan 3 h 15 min');
    expect(textoCuentaRegresiva(inicio, inicio - 30_000)).toBe('Faltan 1 min');
  });
  it('durante el partido y después', () => {
    expect(textoCuentaRegresiva(inicio, inicio + 30 * 60_000)).toBe('Se está jugando');
    expect(textoCuentaRegresiva(inicio, inicio + 3 * 3_600_000)).toBeNull();
  });
});
