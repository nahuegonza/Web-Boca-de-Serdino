import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { esESLocale } from '@sanity/locale-es-es';
import { schemaTypes, UNICOS } from './schemas';
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
    // Los documentos únicos no se crean desde "Nuevo".
    templates: (templates) => templates.filter((t) => !UNICOS.includes(t.schemaType)),
  },
  document: {
    actions: (acciones, ctx) =>
      UNICOS.includes(ctx.schemaType) ? acciones.filter((a) => a.action !== 'duplicate' && a.action !== 'delete' && a.action !== 'unpublish') : acciones,
  },
});
