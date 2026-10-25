# Sitio del Club Atlético Boca Juniors de Serodino

Sitio estático en [Astro](https://astro.build) con contenido en [Sanity](https://www.sanity.io) (plan gratuito) y hosting en Cloudflare Pages. Decisión documentada en el ADR-001.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `src/pages` | Páginas. Hoy: inicio provisorio, `/fixture` y `/fixture/[categoria]`. |
| `src/components` | Componentes del sistema de diseño "Boca de Serodino". |
| `src/lib` | Datos del CMS (`cms.ts`), cálculo de la tabla (`tabla.ts`), fixture, fechas y nombres. Con tests. |
| `src/styles` | `tokens.css` (único origen de valores), componentes y Tailwind v4 leyendo esos tokens. |
| `src/datos-prueba` | Datos ficticios **solo para desarrollo**. Nunca se usan si hay un proyecto de Sanity configurado. |
| `studio` | Panel de carga (Sanity Studio) con esquemas y la vista "Cargar resultados". |

## Desarrollo

```bash
npm install
npm test                         # tests unitarios (tabla, fixture, fechas, nombres)
DATOS_DE_PRUEBA=1 npm run dev    # ver el sitio con datos ficticios
npm run build                    # build de producción
```

Sin `PUBLIC_SANITY_PROJECT_ID` el sitio se construye igual y muestra los estados "sin datos".

## Puesta en marcha (una sola vez)

1. **Sanity:** crear un proyecto gratuito en sanity.io/manage con el email institucional del club. Dataset `production`, público.
2. **Panel:** en `studio/`, `npm install` y `SANITY_STUDIO_PROJECT_ID=<id> npx sanity deploy`. Queda en `bocadeserodino.sanity.studio`. Invitar a los editores desde sanity.io/manage.
3. **Cloudflare Pages:** conectar este repositorio. Build command `npm run build`, output `dist`. Variables: `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET=production` y `SITE_URL`.
4. **Publicación automática:** en Cloudflare Pages crear un *Deploy Hook*. En Sanity (API > Webhooks) apuntar ese hook para crear, actualizar y borrar documentos. Guardar el mismo hook como secreto `CLOUDFLARE_DEPLOY_HOOK_URL` en GitHub para la reconstrucción diaria.

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

- En categorías marcadas como **de menores**, los nombres se publican como "Juan P.". No se guardan fechas de nacimiento ni contactos.
- La inscripción a pruebas (fase 1) arma un mensaje de WhatsApp y no guarda datos. Ver ADR-001.
