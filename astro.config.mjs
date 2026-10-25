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
  integrations: [sitemap()],
  image: {
    // Las imágenes del CMS se descargan y optimizan en el build (AVIF/WebP)
    // y se sirven desde Cloudflare, sin consumir el ancho de banda de Sanity.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  vite: {
    // El cast evita un choque de tipos entre la versión de Vite de Astro y la del plugin; en ejecución es compatible.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
