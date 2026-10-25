/**
 * Nombre que se publica en el sitio.
 * En categorías de menores: solo nombre de pila e inicial del apellido ("Juan P.").
 */
export function nombrePublico(nombre: string | null | undefined, apellido: string | null | undefined, esMenor: boolean): string {
  const n = (nombre ?? '').trim().replace(/\s+/g, ' ');
  const a = (apellido ?? '').trim().replace(/\s+/g, ' ');
  if (!esMenor) return [n, a].filter(Boolean).join(' ');
  const pila = n.split(' ')[0] ?? '';
  const inicial = a ? `${a.charAt(0).toLocaleUpperCase('es')}.` : '';
  return [pila, inicial].filter(Boolean).join(' ');
}
