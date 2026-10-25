// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// URL pública del sitio: se usa en canonical, Open Graph y sitemap.
const SITE_URL = process.env.SITE_URL || 'https://bocadeserodino.pages.dev';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    // Las páginas de resultado de formularios y la 404 no van al sitemap (además llevan noindex).
    sitemap({ filter: (pagina) => !/\/(contacto\/(enviado|no-enviado)|404)/.test(pagina) }),
  ],
  image: {
    // Las imágenes del CMS se descargan y optimizan en el build (AVIF/WebP)
    // y se sirven desde Cloudflare, sin consumir el ancho de banda de Sanity.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      // Solo con datos de prueba: servidor local de imágenes ficticias (scripts/build-prueba.mjs).
      ...(process.env.DATOS_DE_PRUEBA === '1' ? [{ protocol: 'http', hostname: 'localhost', port: '4400' }] : []),
    ],
  },
  vite: {
    // El cast evita un choque de tipos entre la versión de Vite de Astro y la del plugin; en ejecución es compatible.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
