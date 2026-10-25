import { categoria } from './categoria';
import { configuracion } from './configuracion';
import { convocatoria } from './convocatoria';
import { equipo } from './equipo';
import { fotoHistorica, hito, identidad, miembroComision } from './historia';
import { noticia } from './noticia';
import { partido } from './partido';
import { persona } from './persona';
import { inicio, sponsor } from './sponsor';
import { torneo } from './torneo';

export const schemaTypes = [
  partido, torneo, equipo, categoria, persona, noticia, convocatoria,
  hito, fotoHistorica, miembroComision, identidad, sponsor, inicio, configuracion,
];

/** Documentos únicos: se editan desde el menú, no se crean ni se borran. */
export const UNICOS = ['configuracion', 'identidad', 'inicio'];
