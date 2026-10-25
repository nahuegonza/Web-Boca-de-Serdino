import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Editor simple, pensado para el celular: párrafos, un nivel de subtítulo,
 * negrita, cursiva, links, listas e imágenes. Nada más.
 */
const imagenConAlt = (name: string, title: string) =>
  defineArrayMember({
    type: 'image',
    name,
    title,
    options: { hotspot: true },
    fields: [
      defineField({ name: 'alt', title: 'Descripción de la foto', type: 'string', description: 'Qué se ve. Para lectores de pantalla y Google.', validation: (r) => r.required().max(140) }),
      defineField({ name: 'epigrafe', title: 'Epígrafe (opcional)', type: 'string' }),
    ],
  });

export const noticia = defineType({
  name: 'noticia',
  title: 'Noticia',
  type: 'document',
  fields: [
    defineField({ name: 'titulo', title: 'Título', type: 'string', validation: (r) => r.required().max(90).warning('Hasta 90 letras se lee completo en el celular.') }),
    defineField({
      name: 'slug',
      title: 'Dirección en la web',
      type: 'slug',
      description: 'Tocá "Generar" para crearla desde el título.',
      options: { source: 'titulo', maxLength: 80 },
      validation: (r) => r.required().custom((s: any) => (s?.current && /^\d+$/.test(s.current) ? 'No puede ser solo un número.' : true)),
    }),
    defineField({ name: 'fecha', title: 'Fecha de publicación', type: 'datetime', initialValue: () => new Date().toISOString(), description: 'Si ponés una fecha futura, la noticia aparece ese día.', validation: (r) => r.required() }),
    defineField({
      name: 'categoria',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          { title: 'Fútbol', value: 'futbol' },
          { title: 'Inferiores', value: 'inferiores' },
          { title: 'Institucional', value: 'institucional' },
          { title: 'Eventos', value: 'eventos' },
        ],
        layout: 'radio',
      },
      initialValue: 'futbol',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'imagenPrincipal',
      title: 'Foto principal',
      type: 'image',
      options: { hotspot: true },
      description: 'Horizontal. Es la que se ve en el listado y al compartir.',
      fields: [defineField({ name: 'alt', title: 'Descripción de la foto', type: 'string', validation: (r) => r.required().max(140) })],
    }),
    defineField({ name: 'resumen', title: 'Resumen', type: 'text', rows: 3, description: 'Una o dos líneas. Se usa en el listado y en Google.', validation: (r) => r.max(200) }),
    defineField({
      name: 'cuerpo',
      title: 'Texto',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Párrafo', value: 'normal' },
            { title: 'Subtítulo', value: 'h2' },
          ],
          lists: [
            { title: 'Lista', value: 'bullet' },
            { title: 'Lista numerada', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Negrita', value: 'strong' },
              { title: 'Cursiva', value: 'em' },
            ],
            annotations: [
              defineArrayMember({
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [defineField({ name: 'href', title: 'Dirección', type: 'url', validation: (r) => r.uri({ scheme: ['http', 'https', 'mailto'] }) })],
              }),
            ],
          },
        }),
        imagenConAlt('image', 'Foto'),
      ],
    }),
    defineField({
      name: 'galeria',
      title: 'Galería de fotos',
      type: 'array',
      of: [imagenConAlt('image', 'Foto')],
      options: { layout: 'grid' },
      description: 'Para menores, subí solo fotos con autorización de imagen.',
    }),
  ],
  orderings: [{ title: 'Más recientes', name: 'fechaDesc', by: [{ field: 'fecha', direction: 'desc' }] }],
  preview: {
    select: { title: 'titulo', fecha: 'fecha', categoria: 'categoria', media: 'imagenPrincipal' },
    prepare: ({ title, fecha, categoria, media }) => ({
      title,
      media,
      subtitle: [categoria, fecha ? new Date(fecha).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : null].filter(Boolean).join(', '),
    }),
  },
});
