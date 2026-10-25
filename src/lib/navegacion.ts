/** Secciones del menú. "lista: false" = todavía no publicada (no se muestra el link). */
export const SECCIONES = [
  { titulo: 'Fixture y tabla', href: '/fixture', lista: true },
  { titulo: 'Plantel', href: '/plantel', lista: true },
  { titulo: 'Noticias', href: '/noticias', lista: true },
  { titulo: 'Historia', href: '/historia', lista: true },
  { titulo: 'Pruebas', href: '/pruebas', lista: true },
  { titulo: 'Sponsors', href: '/sponsors', lista: true },
  { titulo: 'Contacto', href: '/contacto', lista: true },
] as const;

export const seccionesVisibles = () => SECCIONES.filter((s) => s.lista);
