/** Secciones del menú. "lista: false" = todavía no publicada (no se muestra el link). */
export const SECCIONES = [
  { titulo: 'Fixture y tabla', href: '/fixture', lista: true },
  { titulo: 'Plantel', href: '/plantel', lista: false },
  { titulo: 'Noticias', href: '/noticias', lista: false },
  { titulo: 'Historia', href: '/historia', lista: false },
  { titulo: 'Pruebas', href: '/pruebas', lista: false },
  { titulo: 'Sponsors', href: '/sponsors', lista: false },
  { titulo: 'Contacto', href: '/contacto', lista: false },
] as const;

export const seccionesVisibles = () => SECCIONES.filter((s) => s.lista);
