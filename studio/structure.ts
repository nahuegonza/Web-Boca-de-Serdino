import type { StructureResolver } from 'sanity/structure';

/**
 * Menú del panel. Lo primero es "Cargar resultados": los partidos ya empezados
 * que siguen como programados. Así, el domingo a la noche se carga todo en un minuto.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Boca de Serodino')
    .items([
      S.listItem()
        .title('Cargar resultados')
        .id('cargar-resultados')
        .child(
          S.documentList()
            .title('Partidos sin resultado')
            .schemaType('partido')
            .filter('_type == "partido" && estado == "programado" && defined(diaHora) && dateTime(diaHora) < dateTime(now())')
            .defaultOrdering([{ field: 'diaHora', direction: 'desc' }]),
        ),
      S.listItem()
        .title('Próximos partidos')
        .id('proximos')
        .child(
          S.documentList()
            .title('Próximos partidos')
            .schemaType('partido')
            .filter('_type == "partido" && estado == "programado" && (!defined(diaHora) || dateTime(diaHora) >= dateTime(now()))')
            .defaultOrdering([{ field: 'diaHora', direction: 'asc' }]),
        ),
      S.divider(),
      S.documentTypeListItem('partido').title('Todos los partidos'),
      S.documentTypeListItem('torneo').title('Torneos'),
      S.documentTypeListItem('equipo').title('Equipos'),
      S.documentTypeListItem('categoria').title('Categorías'),
      S.divider(),
      S.listItem()
        .title('Configuración del club')
        .id('configuracion')
        .child(S.document().schemaType('configuracion').documentId('configuracion')),
    ]);
