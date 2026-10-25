import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // El panel queda en https://bocadeserodino.sanity.studio (gratis en Sanity).
  studioHost: 'bocadeserodino',
});
