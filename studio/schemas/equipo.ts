import { defineField, defineType } from 'sanity';

export const equipo = defineType({
  name: 'equipo',
  title: 'Equipo',
  type: 'document',
  fields: [
    defineField({ name: 'nombre', title: 'Nombre', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'nombreCorto', title: 'Nombre corto', type: 'string', description: 'Para celulares (ej.: "Boca"). Hasta 14 letras.', validation: (r) => r.max(14) }),
    defineField({
      name: 'escudo',
      title: 'Escudo',
      type: 'image',
      description: 'PNG con fondo transparente o SVG. Si no hay, se muestra un escudo vacío.',
      fields: [defineField({ name: 'alt', title: 'Descripción', type: 'string', initialValue: 'Escudo' })],
    }),
    defineField({
      name: 'esPropio',
      title: 'Es Boca de Serodino',
      type: 'boolean',
      description: 'Marcalo solo en nuestro equipo: es el que se resalta en la tabla.',
      initialValue: false,
    }),
    defineField({ name: 'localidad', title: 'Localidad', type: 'string' }),
  ],
  preview: {
    select: { title: 'nombre', media: 'escudo', propio: 'esPropio', localidad: 'localidad' },
    prepare: ({ title, media, propio, localidad }) => ({ title, media, subtitle: propio ? 'Nuestro equipo' : localidad }),
  },
});
