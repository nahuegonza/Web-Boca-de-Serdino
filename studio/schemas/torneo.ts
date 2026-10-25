import { defineArrayMember, defineField, defineType } from 'sanity';

export const CRITERIOS = [
  { title: 'Puntos', value: 'puntos' },
  { title: 'Diferencia de gol', value: 'diferencia' },
  { title: 'Goles a favor', value: 'golesFavor' },
  { title: 'Menos goles en contra', value: 'golesContra' },
  { title: 'Partidos ganados', value: 'ganados' },
  { title: 'Resultado entre sí (enfrentamiento directo)', value: 'enfrentamientoDirecto' },
];

export const torneo = defineType({
  name: 'torneo',
  title: 'Torneo',
  type: 'document',
  groups: [
    { name: 'datos', title: 'Datos', default: true },
    { name: 'reglas', title: 'Reglas de la tabla' },
  ],
  fields: [
    defineField({ name: 'nombre', title: 'Nombre', type: 'string', description: 'Ej.: Apertura 2027.', group: 'datos', validation: (r) => r.required() }),
    defineField({ name: 'temporada', title: 'Temporada (año)', type: 'number', group: 'datos', initialValue: () => new Date().getFullYear(), validation: (r) => r.required().integer().min(2000) }),
    defineField({ name: 'categoria', title: 'Categoría', type: 'reference', to: [{ type: 'categoria' }], group: 'datos', validation: (r) => r.required() }),
    defineField({
      name: 'estado',
      title: 'Estado',
      type: 'string',
      group: 'datos',
      options: { list: [{ title: 'En curso', value: 'enCurso' }, { title: 'Finalizado', value: 'finalizado' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'enCurso',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'equipos',
      title: 'Equipos del torneo',
      type: 'array',
      group: 'datos',
      description: 'Todos los equipos que juegan, incluido el nuestro. La tabla los muestra aunque no hayan jugado.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'equipo' }] })],
      validation: (r) => r.unique().min(2),
    }),
    defineField({ name: 'puntosVictoria', title: 'Puntos por partido ganado', type: 'number', group: 'reglas', initialValue: 3, validation: (r) => r.required().integer().min(0) }),
    defineField({ name: 'puntosEmpate', title: 'Puntos por empate', type: 'number', group: 'reglas', initialValue: 1, validation: (r) => r.required().integer().min(0) }),
    defineField({
      name: 'criteriosDesempate',
      title: 'Orden de desempate',
      type: 'array',
      group: 'reglas',
      description: 'Arrastrá para ordenar según el reglamento de la liga. "Puntos" siempre va primero.',
      of: [defineArrayMember({ type: 'string', options: { list: CRITERIOS } })],
      initialValue: ['puntos', 'diferencia', 'golesFavor', 'enfrentamientoDirecto'],
      validation: (r) => r.unique(),
    }),
    defineField({
      name: 'ajustes',
      title: 'Ajustes de puntos',
      type: 'array',
      group: 'reglas',
      description: 'Sanciones o bonificaciones del tribunal de la liga. Usá números negativos para descontar.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'ajuste',
          fields: [
            defineField({ name: 'equipo', title: 'Equipo', type: 'reference', to: [{ type: 'equipo' }], validation: (r) => r.required() }),
            defineField({ name: 'puntos', title: 'Puntos', type: 'number', validation: (r) => r.required().integer() }),
            defineField({ name: 'motivo', title: 'Motivo', type: 'string', description: 'Se muestra al pie de la tabla.', validation: (r) => r.required() }),
          ],
          preview: {
            select: { equipo: 'equipo.nombre', puntos: 'puntos', motivo: 'motivo' },
            prepare: ({ equipo, puntos, motivo }) => ({ title: `${equipo ?? 'Equipo'}: ${puntos > 0 ? '+' : ''}${puntos ?? 0} pts`, subtitle: motivo }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'nombre', categoria: 'categoria.nombre', temporada: 'temporada', estado: 'estado' },
    prepare: ({ title, categoria, temporada, estado }) => ({
      title: `${categoria ?? ''} ${title ?? ''}`.trim(),
      subtitle: `${temporada ?? ''}${estado === 'finalizado' ? ', finalizado' : ''}`,
    }),
  },
});
