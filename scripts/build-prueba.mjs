/**
 * Build con datos ficticios (solo desarrollo y CI).
 * Levanta un servidor local que imita al CDN de imágenes del CMS, construye el sitio y lo apaga.
 * Así se prueba la optimización real de imágenes sin depender de Sanity.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { basename, join } from 'node:path';

const PUERTO = 4400;
const carpeta = new URL('../src/datos-prueba/imagenes/', import.meta.url);

const servidor = createServer(async (req, res) => {
  try {
    const nombre = basename(decodeURIComponent((req.url ?? '/').split('?')[0]));
    const datos = await readFile(join(carpeta.pathname, nombre));
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(datos);
  } catch {
    res.writeHead(404);
    res.end();
  }
});

servidor.listen(PUERTO, () => {
  const args = process.argv.slice(2);
  const comando = args[0] === 'dev' ? ['astro', 'dev'] : args[0] === 'preview' ? ['astro', 'preview'] : ['astro', 'build'];
  const hijo = spawn('npx', comando, { stdio: 'inherit', env: { ...process.env, DATOS_DE_PRUEBA: '1' } });
  hijo.on('exit', (codigo) => {
    servidor.close();
    process.exit(codigo ?? 1);
  });
});
