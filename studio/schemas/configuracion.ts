import { defineField, defineType } from 'sanity';

/** Documento único con los datos generales del club (header, footer, SEO). */
export const configuracion = defineType({
  name: 'configuracion',
  title: 'Configuración del club',
  type: 'document',
  fields: [
    defineField({ name: 'nombreClub', title: 'Nombre del club', type: 'string', initialValue: 'Club Atlético Boca Juniors de Serodino', validation: (r) => r.required() }),
    defineField({ name: 'escudo', title: 'Escudo', type: 'image', fields: [defineField({ name: 'alt', title: 'Descripción', type: 'string', initialValue: 'Escudo del club' })] }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp del club',
      type: 'string',
      description: 'Con código de país y área, sin espacios ni signos. Ej.: 5493476123456.',
      validation: (r) => r.regex(/^\d{10,15}$/, { name: 'número' }).error('Solo números, entre 10 y 15 dígitos.'),
    }),
    defineField({ name: 'email', title: 'Email', type: 'string', validation: (r) => r.email() }),
    defineField({ name: 'instagram', title: 'Instagram', type: 'url', initialValue: 'https://www.instagram.com/clubboca_serodino/' }),
    defineField({ name: 'direccion', title: 'Dirección de la cancha', type: 'string' }),
    defineField({ name: 'latitud', title: 'Latitud de la cancha', type: 'number', initialValue: -32.6045, validation: (r) => r.min(-90).max(90) }),
    defineField({ name: 'longitud', title: 'Longitud de la cancha', type: 'number', initialValue: -60.94404, validation: (r) => r.min(-180).max(180) }),
    defineField({
      name: 'instagramDestacados',
      title: 'Publicaciones de Instagram para mostrar en Noticias',
      type: 'array',
      of: [{ type: 'url' }],
      description: 'Pegá el link de cada publicación o reel (hasta 6).',
      validation: (r) => r.max(6),
    }),
    defineField({ name: 'horariosSecretaria', title: 'Horarios de secretaría', type: 'text', rows: 3 }),
    defineField({ name: 'descripcionSitio', title: 'Descripción para Google y redes', type: 'text', rows: 3, validation: (r) => r.max(160) }),
    defineField({ name: 'imagenCompartir', title: 'Imagen al compartir en redes', type: 'image', description: '1200 × 630 px.' }),
  ],
  preview: { prepare: () => ({ title: 'Configuración del club' }) },
});
