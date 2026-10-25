import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Partido. Los campos de resultado van primero para que cargar un resultado
 * desde el celular sea: abrir el partido, tocar "Jugado", escribir dos números, Publicar.
 */
const esJugado = ({ document }: { document?: Record<string, unknown> }) => document?.estado !== 'jugado';

const golRequeridoSiJugado = (r: any) =>
  r.integer().min(0).max(99).custom((valor: unknown, ctx: any) =>
    ctx.document?.estado === 'jugado' && (valor === undefined || valor === null) ? 'Cargá los goles para marcarlo como jugado.' : true,
  );

export const partido = defineType({
  name: 'partido',
  title: 'Partido',
  type: 'document',
  fields: [
    defineField({
      name: 'estado',
      title: 'Estado',
      type: 'string',
      options: {
        list: [
          { title: 'Programado', value: 'programado' },
          { title: 'Jugado', value: 'jugado' },
          { title: 'Suspendido', value: 'suspendido' },
          { title: 'Postergado', value: 'postergado' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'programado',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'golesLocal', title: 'Goles del local', type: 'number', hidden: esJugado, validation: golRequeridoSiJugado }),
    defineField({ name: 'golesVisitante', title: 'Goles del visitante', type: 'number', hidden: esJugado, validation: golRequeridoSiJugado }),
    defineField({
      name: 'goleadores',
      title: 'Goleadores (opcional)',
      type: 'array',
      hidden: esJugado,
      description: 'En categorías de menores, la web muestra solo nombre de pila e inicial del apellido.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'gol',
          fields: [
            defineField({ name: 'nombre', title: 'Nombre', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'apellido', title: 'Apellido', type: 'string' }),
            defineField({
              name: 'equipo',
              title: 'Equipo',
              type: 'string',
              options: { list: [{ title: 'Local', value: 'local' }, { title: 'Visitante', value: 'visitante' }], layout: 'radio', direction: 'horizontal' },
              validation: (r) => r.required(),
            }),
            defineField({ name: 'minuto', title: 'Minuto', type: 'number', validation: (r) => r.integer().min(1).max(130) }),
            defineField({ name: 'enContra', title: 'En contra', type: 'boolean', initialValue: false }),
          ],
          preview: {
            select: { nombre: 'nombre', apellido: 'apellido', minuto: 'minuto', equipo: 'equipo' },
            prepare: ({ nombre, apellido, minuto, equipo }) => ({
              title: [nombre, apellido].filter(Boolean).join(' '),
              subtitle: [equipo === 'local' ? 'Local' : 'Visitante', minuto ? `${minuto}'` : null].filter(Boolean).join(', '),
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'observacion',
      title: 'Motivo o aclaración',
      type: 'string',
      description: 'Ej.: "Por lluvia, nueva fecha a confirmar". Se muestra en la web.',
      hidden: ({ document }) => document?.estado !== 'suspendido' && document?.estado !== 'postergado',
    }),
    defineField({ name: 'torneo', title: 'Torneo', type: 'reference', to: [{ type: 'torneo' }], validation: (r) => r.required() }),
    defineField({ name: 'fecha', title: 'Número de fecha', type: 'number', validation: (r) => r.required().integer().min(1) }),
    defineField({ name: 'diaHora', title: 'Día y hora', type: 'datetime', options: { timeStep: 15 } }),
    defineField({
      name: 'local',
      title: 'Local',
      type: 'reference',
      to: [{ type: 'equipo' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'visitante',
      title: 'Visitante',
      type: 'reference',
      to: [{ type: 'equipo' }],
      validation: (r) =>
        r.required().custom((valor: any, ctx: any) =>
          valor?._ref && valor._ref === ctx.document?.local?._ref ? 'El visitante no puede ser el mismo equipo que el local.' : true,
        ),
    }),
    defineField({ name: 'cancha', title: 'Cancha', type: 'string', description: 'Ej.: "Cancha de Boca, Serodino".' }),
  ],
  orderings: [
    { title: 'Fecha del torneo', name: 'fecha', by: [{ field: 'fecha', direction: 'asc' }, { field: 'diaHora', direction: 'asc' }] },
    { title: 'Más recientes', name: 'recientes', by: [{ field: 'diaHora', direction: 'desc' }] },
  ],
  preview: {
    select: { local: 'local.nombre', visitante: 'visitante.nombre', gl: 'golesLocal', gv: 'golesVisitante', estado: 'estado', fecha: 'fecha', diaHora: 'diaHora', categoria: 'torneo.categoria.nombre' },
    prepare: ({ local, visitante, gl, gv, estado, fecha, diaHora, categoria }) => {
      const marcador = estado === 'jugado' ? `${local ?? '?'} ${gl ?? '-'} – ${gv ?? '-'} ${visitante ?? '?'}` : `${local ?? '?'} vs ${visitante ?? '?'}`;
      const dia = diaHora ? new Date(diaHora).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' }) : 'sin día';
      const etiqueta = estado === 'suspendido' ? 'Suspendido' : estado === 'postergado' ? 'Postergado' : null;
      return { title: marcador, subtitle: [categoria, fecha ? `Fecha ${fecha}` : null, dia, etiqueta].filter(Boolean).join(', ') };
    },
  },
});
