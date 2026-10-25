# Sitio del Club Atlético Boca Juniors de Serodino

Sitio estático en [Astro](https://astro.build) con contenido en [Sanity](https://www.sanity.io) (plan gratuito) y hosting en Cloudflare Pages. La única pieza de servidor es una función de Cloudflare que reenvía los formularios de contacto por email. Decisiones en `docs/adr/`.

## Secciones

| Ruta | Qué muestra |
|---|---|
| `/` | Hero, próximo partido por categoría con cuenta regresiva, llamado a pruebas, último resultado, tabla, noticias y sponsors |
| `/fixture`, `/fixture/[categoria]` | Fixture por fecha, resultados con goleadores y tabla calculada |
| `/plantel`, `/plantel/[categoria]` | Jugadores por posición y cuerpo técnico |
| `/noticias` | Listado paginado, por categoría, nota con galería y compartir |
| `/historia` | Línea de tiempo, escudo y colores, fotos históricas, comisión directiva |
| `/pruebas` | Info de pruebas e inscripción por WhatsApp (fase 1) |
| `/sponsors`, `/contacto` | Sponsors por nivel, formularios y mapa |

## Estructura

| Carpeta | Qué hay |
|---|---|
| `src/pages` | Páginas. |
| `src/components` | Componentes del sistema de diseño "Boca de Serodino". |
| `src/lib` | Acceso al CMS (`cms.ts`) y la lógica de cada sección: tabla, fixture, plantel, noticias, historia, inscripción, contacto y Home. Todo con tests. |
| `src/styles` | `tokens.css` (único origen de valores), componentes y Tailwind v4 leyendo esos tokens. |
| `functions/api/contacto.ts` | Función de Cloudflare para los formularios de contacto y sponsors. |
| `src/datos-prueba` | Datos e imágenes ficticios **solo para desarrollo y CI**. Nunca llegan a un build de producción. |
| `studio` | Panel de carga (Sanity Studio). |
| `docs/adr` | Decisiones de arquitectura. |

## Desarrollo

```bash
npm install
npm test               # tests unitarios y de integración
npm run dev:prueba     # ver el sitio con datos e imágenes ficticios
npm run build:prueba   # build con datos ficticios (incluye optimización de imágenes)
npm run build          # build de producción (lee Sanity)
```

Sin `PUBLIC_SANITY_PROJECT_ID` el sitio se construye igual y muestra los estados "sin datos".

## Puesta en marcha (una sola vez)

1. **Sanity:** crear un proyecto gratuito en sanity.io/manage con el email institucional del club. Dataset `production`, público.
2. **Panel:** en `studio/`, `npm install` y `SANITY_STUDIO_PROJECT_ID=<id> npx sanity deploy`. Queda en `bocadeserodino.sanity.studio`. Invitar a los editores desde sanity.io/manage.
3. **Cloudflare Pages:** conectar este repositorio. Build command `npm run build`, output `dist`. Variables: `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET=production` y `SITE_URL`.
4. **Publicación automática:** en Cloudflare Pages crear un *Deploy Hook*. En Sanity (API > Webhooks) apuntar ese hook para crear, actualizar y borrar documentos. Guardar el mismo hook como secreto `CLOUDFLARE_DEPLOY_HOOK_URL` en GitHub para la reconstrucción diaria.
5. **Formularios de contacto y sponsors:**
   - **Email:** crear una cuenta gratuita en [Resend](https://resend.com) **con el email del club**. Sin dominio propio, Resend solo envía a la casilla de la cuenta, que es justo lo que se necesita. Guardar `RESEND_API_KEY` y `CONTACTO_DESTINO` (esa misma casilla) como secretos en Cloudflare Pages.
   - **Anti-spam:** en Cloudflare > Turnstile crear un widget para el dominio del sitio. Guardar `PUBLIC_TURNSTILE_SITE_KEY` como variable y `TURNSTILE_SECRET` como secreto.
   - **Límite de envíos:** crear un namespace de KV llamado `boca-limites` y vincularlo a Pages con el nombre `LIMITES`. Guardar un texto aleatorio como secreto `LIMITE_SAL`.
6. **Contenido inicial:** en el panel completar **Configuración del club** (WhatsApp con código de país, email, dirección), **Identidad del club** y **Portada del sitio**.

## Cargar un resultado desde el celular (menos de 1 minuto)

1. Abrir el panel y tocar **Cargar resultados**: aparecen los partidos ya empezados sin resultado.
2. Tocar el partido, marcar **Jugado** y escribir los goles de cada equipo. Goleadores, opcional.
3. Tocar **Publicar**. La tabla se recalcula sola; el sitio se actualiza en 1 a 3 minutos.

## Reglas de la tabla

- Solo suman los partidos **jugados** con resultado completo. Programados, suspendidos y postergados no suman.
- Puntos por victoria y empate, orden de desempate y ajustes por sanciones se configuran en cada **Torneo** del panel.
- Si dos equipos quedan iguales en todos los criterios, se ordenan alfabéticamente y se avisa al pie de la tabla.
- Si el CMS no responde durante el build, el build falla a propósito: Cloudflare mantiene la última versión buena.

## Datos de menores

- En categorías marcadas como **de menores**, los nombres se publican como "Juan P." y las fotos solo si está marcada la autorización de imagen.
- La inscripción a pruebas (fase 1) valida en el navegador y abre WhatsApp con un mensaje que solo lleva nombres de pila. No se guarda ni se envía nada a un servidor. La fase 2, con datos cifrados, está diseñada en `docs/adr/002-inscripcion-fase-2.md`.
- La función de contacto no guarda ni registra mensajes, nunca devuelve datos y anonimiza las IP del límite de envíos.

## Calidad

El CI corre los tests, el chequeo de tipos, el build sin CMS, el build con datos de prueba, el build del panel y Lighthouse en perfil móvil. Falla si el LCP supera 2,5 s o la accesibilidad baja de 95.
