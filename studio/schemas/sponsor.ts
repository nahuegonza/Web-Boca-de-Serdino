import { defineField, defineType } from 'sanity';

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  fields: [
    defineField({ name: 'nombre', title: 'Nombre', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'nivel',
      title: 'Nivel',
      type: 'string',
      options: { list: [{ title: 'Principal', value: 'principal' }, { title: 'Oficial', value: 'oficial' }, { title: 'Colaborador', value: 'colaborador' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'oficial',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'PNG con fondo transparente o SVG. Sin logo, se muestra el nombre.',
      fields: [defineField({ name: 'alt', title: 'Descripción', type: 'string' })],
    }),
    defineField({ name: 'url', title: 'Sitio web o red social', type: 'url', validation: (r) => r.uri({ scheme: ['https', 'http'] }) }),
    defineField({ name: 'orden', title: 'Orden', type: 'number', description: 'Menor número, primero.', initialValue: 10 }),
    defineField({ name: 'activo', title: 'Mostrar en la web', type: 'boolean', initialValue: true }),
  ],
  orderings: [{ title: 'Orden', name: 'orden', by: [{ field: 'nivel', direction: 'asc' }, { field: 'orden', direction: 'asc' }] }],
  preview: { select: { title: 'nombre', subtitle: 'nivel', media: 'logo' } },
});

/** Documento único con la portada del sitio. */
export const inicio = defineType({
  name: 'inicio',
  title: 'Portada del sitio',
  type: 'document',
  fields: [
    defineField({
      name: 'imagenHero',
      title: 'Foto grande de la portada',
      type: 'image',
      description: 'Horizontal, de un partido o de la cancha. Mejor si la parte de abajo es oscura: ahí va el texto.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Descripción de la foto', type: 'string', validation: (r) => r.required() })],
    }),
    defineField({ name: 'bajada', title: 'Texto debajo del título (opcional)', type: 'string', description: 'Ej.: "La Reserva juega antes, a las 14:00."', validation: (r) => r.max(120) }),
  ],
  preview: { prepare: () => ({ title: 'Portada del sitio' }) },
});
