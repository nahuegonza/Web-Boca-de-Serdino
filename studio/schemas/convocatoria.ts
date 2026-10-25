import { defineArrayMember, defineField, defineType } from 'sanity';

export const convocatoria = defineType({
  name: 'convocatoria',
  title: 'Prueba (convocatoria)',
  type: 'document',
  fields: [
    defineField({ name: 'activa', title: 'Inscripción abierta', type: 'boolean', description: 'Si está apagada, no se muestra en la web.', initialValue: true }),
    defineField({ name: 'categoria', title: 'Categoría', type: 'reference', to: [{ type: 'categoria' }], description: 'O escribí un nombre abajo si la categoría no existe.' }),
    defineField({ name: 'nombre', title: 'Nombre (si no elegiste categoría)', type: 'string', description: 'Ej.: Escuelita.' }),
    defineField({ name: 'anioDesde', title: 'Nacidos desde el año', type: 'number', validation: (r) => r.required().integer().min(1950).max(2100) }),
    defineField({ name: 'anioHasta', title: 'Hasta el año', type: 'number', validation: (r) => r.required().integer().min(1950).max(2100) }),
    defineField({
      name: 'genero',
      title: 'Para',
      type: 'string',
      options: { list: [{ title: 'Todos', value: 'mixto' }, { title: 'Varones', value: 'masculino' }, { title: 'Mujeres', value: 'femenino' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'mixto',
    }),
    defineField({ name: 'dias', title: 'Días', type: 'string', description: 'Ej.: Sábado 9 de noviembre, o Martes y jueves.' }),
    defineField({ name: 'horario', title: 'Horario', type: 'string', description: 'Ej.: 17 a 19 h.' }),
    defineField({ name: 'lugar', title: 'Lugar', type: 'string', initialValue: 'Cancha del club' }),
    defineField({
      name: 'queLlevar',
      title: 'Qué llevar',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      initialValue: ['Botines', 'Ropa deportiva', 'Agua'],
    }),
    defineField({ name: 'cupoAgotado', title: 'Cupo agotado', type: 'boolean', initialValue: false }),
  ],
  validation: (r) => r.custom((d: any) => (d?.categoria?._ref || d?.nombre ? true : 'Elegí una categoría o escribí un nombre.')),
  preview: {
    select: { cat: 'categoria.nombre', nombre: 'nombre', desde: 'anioDesde', hasta: 'anioHasta', activa: 'activa' },
    prepare: ({ cat, nombre, desde, hasta, activa }) => ({ title: cat || nombre || 'Prueba', subtitle: `${desde ?? '?'}–${hasta ?? '?'}${activa === false ? ', cerrada' : ''}` }),
  },
});
