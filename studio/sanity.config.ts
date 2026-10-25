import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { esESLocale } from '@sanity/locale-es-es';
import { schemaTypes } from './schemas';
import { structure } from './structure';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || '';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

export default defineConfig({
  name: 'boca-serodino',
  title: 'Boca de Serodino',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), esESLocale()],
  schema: {
    types: schemaTypes,
    // "Configuración del club" es un documento único: no se crea desde "Nuevo".
    templates: (templates) => templates.filter((t) => t.schemaType !== 'configuracion'),
  },
  document: {
    actions: (acciones, ctx) =>
      ctx.schemaType === 'configuracion' ? acciones.filter((a) => a.action !== 'duplicate' && a.action !== 'delete' && a.action !== 'unpublish') : acciones,
  },
});
