import { defineArrayMember, defineField, defineType } from 'sanity';

const textoSimple = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [{ title: 'Párrafo', value: 'normal' }],
        lists: [],
        marks: { decorators: [{ title: 'Negrita', value: 'strong' }, { title: 'Cursiva', value: 'em' }], annotations: [] },
      }),
    ],
  });

const fotoConAlt = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'image',
    options: { hotspot: true },
    fields: [defineField({ name: 'alt', title: 'Descripción de la foto', type: 'string', validation: (r) => r.max(140) })],
  });

/** Documento único: identidad del club. */
export const identidad = defineType({
  name: 'identidad',
  title: 'Identidad del club',
  type: 'document',
  fields: [
    defineField({ name: 'anioFundacion', title: 'Año de fundación', type: 'number', validation: (r) => r.integer().min(1850).max(2100) }),
    textoSimple('introduccion', 'Introducción de la historia', 'Dos o tres párrafos que abren la página de Historia.'),
    fotoConAlt('escudo', 'Escudo', 'Preferentemente SVG o PNG con fondo transparente.'),
    textoSimple('significadoEscudo', 'Qué significa el escudo'),
    defineField({
      name: 'colores',
      title: 'Colores del club',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'color',
          fields: [
            defineField({ name: 'nombre', title: 'Nombre', type: 'string', description: 'Ej.: Azul.', validation: (r) => r.required() }),
            defineField({
              name: 'hex',
              title: 'Código de color',
              type: 'string',
              description: 'Formato #RRGGBB. Ej.: #0B2E73.',
              validation: (r) => r.required().regex(/^#[0-9A-Fa-f]{6}$/, { name: 'color' }).error('Usá el formato #RRGGBB.'),
            }),
            defineField({ name: 'significado', title: 'Significado', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'nombre', subtitle: 'hex' } },
        }),
      ],
    }),
    defineField({ name: 'periodoComision', title: 'Período de la comisión directiva actual', type: 'string', description: 'Ej.: 2025-2027.' }),
  ],
  preview: { prepare: () => ({ title: 'Identidad del club' }) },
});

export const hito = defineType({
  name: 'hito',
  title: 'Hito de la historia',
  type: 'document',
  fields: [
    defineField({ name: 'anio', title: 'Año', type: 'number', validation: (r) => r.required().integer().min(1850).max(2100) }),
    defineField({ name: 'titulo', title: 'Título', type: 'string', description: 'Ej.: Fundación del club, Campeones del Apertura, Inauguración de la cancha.', validation: (r) => r.required().max(90) }),
    defineField({ name: 'texto', title: 'Texto', type: 'text', rows: 4 }),
    fotoConAlt('foto', 'Foto (opcional)'),
  ],
  orderings: [{ title: 'Año', name: 'anio', by: [{ field: 'anio', direction: 'asc' }] }],
  preview: { select: { anio: 'anio', titulo: 'titulo', media: 'foto' }, prepare: ({ anio, titulo, media }) => ({ title: `${anio ?? '?'}: ${titulo ?? ''}`, media }) },
});

export const fotoHistorica = defineType({
  name: 'fotoHistorica',
  title: 'Foto histórica',
  type: 'document',
  fields: [
    fotoConAlt('imagen', 'Foto'),
    defineField({ name: 'anio', title: 'Año (aproximado)', type: 'number', validation: (r) => r.integer().min(1850).max(2100) }),
    defineField({ name: 'epigrafe', title: 'Epígrafe', type: 'string', description: 'Quiénes aparecen o qué se ve.', validation: (r) => r.max(200) }),
  ],
  validation: (r) => r.custom((doc: any) => (doc?.imagen?.asset ? true : 'Subí la foto.')),
  orderings: [{ title: 'Año', name: 'anio', by: [{ field: 'anio', direction: 'asc' }] }],
  preview: { select: { anio: 'anio', epigrafe: 'epigrafe', media: 'imagen' }, prepare: ({ anio, epigrafe, media }) => ({ title: epigrafe || 'Foto histórica', subtitle: anio ? String(anio) : undefined, media }) },
});

export const miembroComision = defineType({
  name: 'miembroComision',
  title: 'Integrante de la comisión',
  type: 'document',
  fields: [
    defineField({ name: 'cargo', title: 'Cargo', type: 'string', description: 'Ej.: Presidente, Secretaria, Tesorero, Vocal.', validation: (r) => r.required() }),
    defineField({ name: 'nombre', title: 'Nombre y apellido', type: 'string', validation: (r) => r.required() }),
    fotoConAlt('foto', 'Foto (opcional)'),
    defineField({ name: 'orden', title: 'Orden', type: 'number', description: 'Menor número, primero (Presidente = 1).', initialValue: 10 }),
    defineField({ name: 'activo', title: 'Integra la comisión actual', type: 'boolean', initialValue: true }),
  ],
  orderings: [{ title: 'Orden', name: 'orden', by: [{ field: 'orden', direction: 'asc' }] }],
  preview: { select: { title: 'nombre', subtitle: 'cargo', media: 'foto' } },
});
