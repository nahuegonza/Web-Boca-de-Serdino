import { defineField, defineType } from 'sanity';

export const persona = defineType({
  name: 'persona',
  title: 'Jugador o técnico',
  type: 'document',
  fields: [
    defineField({
      name: 'tipo',
      title: 'Tipo',
      type: 'string',
      options: { list: [{ title: 'Jugador o jugadora', value: 'jugador' }, { title: 'Cuerpo técnico', value: 'tecnico' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'jugador',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'categoria', title: 'Categoría', type: 'reference', to: [{ type: 'categoria' }], validation: (r) => r.required() }),
    defineField({ name: 'nombre', title: 'Nombre', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'apellido',
      title: 'Apellido',
      type: 'string',
      description: 'En categorías de menores la web muestra solo la inicial ("Juan P.").',
    }),
    defineField({ name: 'numero', title: 'Número de camiseta', type: 'number', hidden: ({ document }) => document?.tipo === 'tecnico', validation: (r) => r.integer().min(0).max(99) }),
    defineField({
      name: 'posicion',
      title: 'Posición',
      type: 'string',
      hidden: ({ document }) => document?.tipo === 'tecnico',
      options: {
        list: [
          { title: 'Arquero', value: 'arquero' },
          { title: 'Defensor', value: 'defensor' },
          { title: 'Mediocampista', value: 'mediocampista' },
          { title: 'Delantero', value: 'delantero' },
        ],
        layout: 'radio',
      },
    }),
    defineField({ name: 'rol', title: 'Rol', type: 'string', description: 'Ej.: Director técnico, Preparador físico, Entrenador de arqueros.', hidden: ({ document }) => document?.tipo !== 'tecnico' }),
    defineField({
      name: 'foto',
      title: 'Foto',
      type: 'image',
      description: 'Vertical, de medio cuerpo. Si no hay, la web muestra el escudo.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Descripción', type: 'string', description: 'Ej.: "Juan con la camiseta titular". Para lectores de pantalla.' })],
    }),
    defineField({
      name: 'autorizacionImagen',
      title: 'Hay autorización escrita para publicar la foto',
      type: 'boolean',
      description: 'Obligatorio para menores: sin esta marca la foto no se publica. Guardá la autorización firmada en secretaría.',
      initialValue: false,
    }),
    defineField({ name: 'orden', title: 'Orden (opcional)', type: 'number', description: 'Para ordenar al cuerpo técnico. Menor número, primero.' }),
    defineField({ name: 'activo', title: 'Mostrar en la web', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { nombre: 'nombre', apellido: 'apellido', numero: 'numero', tipo: 'tipo', rol: 'rol', posicion: 'posicion', categoria: 'categoria.nombre', media: 'foto', activo: 'activo' },
    prepare: ({ nombre, apellido, numero, tipo, rol, posicion, categoria, media, activo }) => ({
      title: `${numero != null && tipo !== 'tecnico' ? `${numero}. ` : ''}${[nombre, apellido].filter(Boolean).join(' ')}`,
      subtitle: [categoria, tipo === 'tecnico' ? rol : posicion, activo === false ? 'Oculto' : null].filter(Boolean).join(', '),
      media,
    }),
  },
});
