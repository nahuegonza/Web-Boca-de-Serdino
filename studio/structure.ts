import type { StructureResolver } from 'sanity/structure';

/**
 * Menú del panel, ordenado por lo que más se usa. Lo primero es "Cargar resultados":
 * los partidos ya empezados que siguen como programados. Así, el domingo a la noche se carga todo en un minuto.
 */
const unico = (S: Parameters<StructureResolver>[0], tipo: string, titulo: string) =>
  S.listItem().title(titulo).id(tipo).child(S.document().schemaType(tipo).documentId(tipo).title(titulo));

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
      S.documentTypeListItem('noticia').title('Noticias'),
      S.divider(),
      S.listItem()
        .title('Fútbol')
        .id('futbol')
        .child(
          S.list()
            .title('Fútbol')
            .items([
              S.documentTypeListItem('partido').title('Todos los partidos'),
              S.documentTypeListItem('torneo').title('Torneos'),
              S.documentTypeListItem('equipo').title('Equipos'),
              S.documentTypeListItem('categoria').title('Categorías'),
              S.documentTypeListItem('persona').title('Plantel y cuerpo técnico'),
            ]),
        ),
      S.documentTypeListItem('convocatoria').title('Pruebas'),
      S.documentTypeListItem('sponsor').title('Sponsors'),
      S.listItem()
        .title('Historia')
        .id('historia')
        .child(
          S.list()
            .title('Historia')
            .items([
              unico(S, 'identidad', 'Identidad del club'),
              S.documentTypeListItem('hito').title('Línea de tiempo'),
              S.documentTypeListItem('fotoHistorica').title('Fotos históricas'),
              S.documentTypeListItem('miembroComision').title('Comisión directiva'),
            ]),
        ),
      S.divider(),
      unico(S, 'inicio', 'Portada del sitio'),
      unico(S, 'configuracion', 'Configuración del club'),
    ]);
