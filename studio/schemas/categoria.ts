import { defineField, defineType } from 'sanity';

export const categoria = defineType({
  name: 'categoria',
  title: 'Categoría',
  type: 'document',
  fields: [
    defineField({ name: 'nombre', title: 'Nombre', type: 'string', description: 'Ej.: Primera, Reserva, Sub-15, Femenino.', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Dirección en la web',
      type: 'slug',
      description: 'Se completa solo desde el nombre (ej.: sub-15).',
      options: { source: 'nombre', maxLength: 40 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'orden', title: 'Orden en el selector', type: 'number', initialValue: 10, validation: (r) => r.integer().min(0) }),
    defineField({
      name: 'esMenores',
      title: '¿Es una categoría de menores?',
      type: 'boolean',
      description: 'Si está marcado, en la web los nombres se muestran como "Juan P." y las fotos solo con autorización.',
      initialValue: false,
    }),
    defineField({ name: 'activa', title: 'Mostrar en la web', type: 'boolean', initialValue: true }),
  ],
  orderings: [{ title: 'Orden', name: 'orden', by: [{ field: 'orden', direction: 'asc' }] }],
  preview: {
    select: { title: 'nombre', menores: 'esMenores', activa: 'activa' },
    prepare: ({ title, menores, activa }) => ({
      title,
      subtitle: [menores ? 'Menores' : null, activa === false ? 'Oculta' : null].filter(Boolean).join(', '),
    }),
  },
});
