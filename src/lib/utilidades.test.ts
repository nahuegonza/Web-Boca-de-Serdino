import { describe, expect, it } from 'vitest';
import { nombrePublico } from './nombres';
import { diaCorto, diaLargo, horaCorta, isoValido } from './fechas';

describe('nombrePublico', () => {
  it('mayores: nombre y apellido completos', () => {
    expect(nombrePublico('Juan Martín', 'Pérez', false)).toBe('Juan Martín Pérez');
  });
  it('menores: solo nombre de pila e inicial del apellido', () => {
    expect(nombrePublico('Juan Martín', 'pérez', true)).toBe('Juan P.');
    expect(nombrePublico('  Sofía ', 'de la Torre', true)).toBe('Sofía D.');
  });
  it('menores sin apellido: solo el nombre de pila', () => {
    expect(nombrePublico('Lucas', '', true)).toBe('Lucas');
  });
  it('tolera datos vacíos', () => {
    expect(nombrePublico(null, undefined, true)).toBe('');
  });
});

describe('fechas en horario argentino', () => {
  // 3 de noviembre de 2026, 16:00 en Argentina = 19:00 UTC
  const iso = '2026-11-03T19:00:00Z';
  it('día largo', () => expect(diaLargo(iso)).toBe('Martes 3 de noviembre'));
  it('día corto', () => expect(diaCorto(iso)).toMatch(/^Mar 3 nov/));
  it('hora en formato 24 h', () => expect(horaCorta(iso)).toBe('16:00'));
  it('un partido a la medianoche de Argentina no se corre de día', () => {
    expect(diaLargo('2026-11-08T03:00:00Z')).toBe('Domingo 8 de noviembre');
    expect(horaCorta('2026-11-08T03:00:00Z')).toBe('00:00');
  });
  it('sin fecha: texto de "a confirmar"', () => {
    expect(diaLargo(null)).toBe('Fecha a confirmar');
    expect(diaCorto('no-es-fecha')).toBe('A confirmar');
    expect(horaCorta(undefined)).toBe('');
    expect(isoValido('')).toBeUndefined();
  });
});
