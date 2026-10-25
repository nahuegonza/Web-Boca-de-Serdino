# ADR-001: Stack y gestor de contenidos (CMS) del sitio

**Estado:** Propuesto
**Fecha:** 2026-10-24
**Decisores:** Comisión directiva del Club Atlético Boca Juniors de Serodino + quien desarrolle la primera versión
**Relacionado:** documento "Arquitectura — Boca Juniors de Serdino Web" (diseño de sistema, 2026-10-24)

## Contexto

El club necesita un sitio oficial que centralice fixture, resultados, tabla, plantel, noticias, historia, pruebas y sponsors, hoy dispersos en Instagram (@clubboca_serodino).

Fuerzas que condicionan la decisión:

- **Quién carga:** integrantes de la comisión directiva sin perfil técnico, mayormente desde el celular.
- **Presupuesto:** cero o lo mínimo posible; solo se acepta pagar el dominio.
- **Volumen:** 10 a 100 visitas diarias, picos después de cada partido.
- **Datos de menores:** la inscripción a pruebas se deriva a WhatsApp (decidido), así que el sitio no guarda nombre, DNI, fecha de nacimiento, contacto de padres ni apto médico. Lo único sensible que queda en la web son las fotos de jugadores de inferiores.
- **Continuidad:** es muy probable que quien programe hoy no sea quien mantenga dentro de dos o tres años. El stack tiene que poder heredarlo otra persona sin documentación heroica.

Criterios de evaluación, en orden de peso:

1. Carga desde el celular para gente no técnica.
2. Costo mensual (ideal: USD 0).
3. Seguridad de los datos de menores (cuánto dato sensible puede terminar guardado y cuánta superficie de ataque hay).
4. Facilidad para que otra persona lo mantenga.
5. Performance.

## Decisión

**Astro (sitio estático) + Sanity (CMS gestionado, plan Free) + Cloudflare Pages (hosting, plan Free).**

Los editores cargan contenido en el panel web de Sanity; cada publicación dispara un webhook que regenera el sitio en Cloudflare Pages. No hay servidor ni base de datos propios. Costo recurrente: solo el dominio.

## Opciones consideradas

Se evaluaron las cuatro propuestas más Astro + Sanity, que surgió del diseño de sistema y combina el mejor editor de una opción con el hosting más simple de otra.

### Opción A: Next.js + Sanity

| Dimensión | Evaluación |
|---|---|
| Carga desde el celular | Buena: es el mismo panel de Sanity que en la opción E |
| Costo mensual | USD 0 con salvedades: el plan Hobby de Vercel prohíbe uso comercial, y un sitio con sponsors queda en zona gris; Vercel Pro cuesta USD 20 por usuario por mes. Correr Next.js en Cloudflare es posible, pero agrega un adaptador y configuración |
| Seguridad de datos de menores | Buena: no guarda datos personales |
| Mantenimiento por otra persona | Media: Next.js cambia de forma seguido (versiones mayores, modos de render) y es más framework del que este sitio necesita |
| Performance | Muy buena |
| Complejidad | Media |

**A favor:** editor de Sanity amigable; ecosistema enorme; deja la puerta abierta a funciones dinámicas.
**En contra:** la mejor opción de hosting gratuito para Next.js (Vercel) tiene restricción comercial; más piezas que mantener que la opción E sin ningún beneficio visible para el visitante.

### Opción B: Astro + Decap CMS

| Dimensión | Evaluación |
|---|---|
| Carga desde el celular | Débil: la interfaz de Decap no está pensada para pantallas chicas y la comunidad la parchea con CSS externo ([responsive-decap](https://github.com/hithismani/responsive-decap)) |
| Costo mensual | USD 0: el contenido vive en el repositorio de Git |
| Seguridad de datos de menores | Buena: no guarda datos personales |
| Mantenimiento por otra persona | Media: requiere configurar un proxy de autenticación OAuth y que cada editor tenga cuenta de GitHub o similar |
| Performance | Muy buena |
| Complejidad | Media |

**A favor:** gratis y sin proveedor de CMS; el contenido queda versionado en Git; proyecto activo (última versión 3.10.0, enero de 2026, según [decapcms.org](https://decapcms.org/docs/update-the-cms-version/)).
**En contra:** falla justo en el criterio de mayor peso (celular, no técnicos); pedirle cuenta de GitHub a la comisión directiva es una barrera real.

### Opción C: Next.js + Supabase con panel propio

| Dimensión | Evaluación |
|---|---|
| Carga desde el celular | Tan buena como se la programe: el panel hay que construirlo desde cero |
| Costo mensual | USD 0 en papel, pero los proyectos gratuitos de Supabase se pausan tras 7 días sin actividad ([fuente](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)); en receso de temporada el sitio se caería. El plan Pro cuesta USD 25 por mes |
| Seguridad de datos de menores | La más riesgosa: tener base de datos propia invita a guardar inscripciones, y la protección depende de reglas de acceso (RLS) escritas a mano |
| Mantenimiento por otra persona | Baja: es software a medida; quien herede el sitio hereda el panel, la base y sus bugs |
| Performance | Buena |
| Complejidad | Alta |

**A favor:** máxima flexibilidad; habilitaría a futuro socios, cuotas o inscripciones propias.
**En contra:** semanas extra de desarrollo para replicar lo que un CMS ya resuelve; la pausa por inactividad rompe el costo cero; mayor superficie de ataque y responsabilidad legal (Ley 25.326) si se terminan guardando datos de menores.

### Opción D: WordPress administrado (WordPress.com)

| Dimensión | Evaluación |
|---|---|
| Carga desde el celular | Muy buena: app oficial y editor conocido por mucha gente |
| Costo mensual | No es cero: el plan gratuito no admite plugins ni dominio propio; Personal cuesta USD 4 por mes pagando anual (USD 9 mensual) y Business USD 25 por mes anual ([fuente](https://eseospace.com/blog/wordpress-com-plans/)) |
| Seguridad de datos de menores | Media: los plugins de formularios facilitan empezar a guardar datos sin querer, y cada plugin suma superficie de ataque |
| Mantenimiento por otra persona | Alta: hay muchísima gente que sabe WordPress, incluso en la zona |
| Performance | Media: depende del tema y de los plugins |
| Complejidad | Baja |

**A favor:** la opción más fácil de entender para cualquiera; editor muy probado en celular; actualizaciones automáticas en la versión administrada.
**En contra:** costo anual permanente; fixture y tabla de posiciones se modelan mal sin plugins o campos personalizados; el diseño "tipo Boca" con tipografía fuerte y fotos grandes depende de temas pagos o de mucha configuración.

### Opción E: Astro + Sanity (recomendada)

| Dimensión | Evaluación |
|---|---|
| Carga desde el celular | Buena: panel web con formularios a medida (por ejemplo, cargar un resultado son dos campos). A validar con una prueba piloto en el celular de los editores |
| Costo mensual | USD 0: Sanity Free incluye 20 usuarios y 10.000 documentos ([fuente](https://dev.to/mr_manushukla/15-a-seat-plus-the-build-what-a-sanity-and-astro-content-platform-costs-in-2026-2j3p)); Cloudflare Pages Free da tráfico estático ilimitado y 500 builds por mes ([fuente](https://developers.cloudflare.com/pages/platform/limits)) |
| Seguridad de datos de menores | Buena: no guarda datos personales; el sitio publicado es HTML estático, sin servidor que atacar |
| Mantenimiento por otra persona | Alta: Astro es simple de leer, el contenido está en un servicio gestionado y no hay infraestructura que actualizar |
| Performance | Muy buena: HTML estático e imágenes optimizadas en el build, servidos desde el CDN |
| Complejidad | Baja a media |

**A favor:** cumple los cinco criterios sin pagar nada; el panel se adapta exactamente al modelo del club (partidos, tabla, plantel, sponsors); si Sanity desaparece, el sitio publicado sigue online.
**En contra:** depende de un proveedor externo para editar; el plan Free trae solo 2 roles de permisos ([fuente](https://www.costbench.com/software/headless-cms/sanity/)); cada cambio tarda 1 a 3 minutos en verse.

## Análisis de trade-offs

| Criterio (peso) | A. Next.js + Sanity | B. Astro + Decap | C. Next.js + Supabase | D. WordPress.com | E. Astro + Sanity |
|---|---|---|---|---|---|
| Celular, no técnicos (alto) | Buena | Débil | Depende | Muy buena | Buena |
| Costo USD 0 (alto) | Con salvedades | Sí | No en la práctica | No (USD 48+/año) | Sí |
| Datos de menores (alto) | Buena | Buena | Riesgosa | Media | Buena |
| Mantenimiento futuro (medio) | Media | Media | Baja | Alta | Alta |
| Performance (bajo) | Muy buena | Muy buena | Buena | Media | Muy buena |

- **E frente a D (la alternativa real).** WordPress gana en familiaridad y en editor móvil. E gana en costo cero, en performance y en que el modelo de datos del club (partidos, tablas) está hecho a medida en vez de forzado con plugins. Si la comisión prefiere pagar unos USD 50 por año a cambio de algo que "todo el mundo conoce", D es una opción legítima y segunda en la lista.
- **E frente a A.** Mismo editor; la diferencia es solo el framework y el hosting. Astro genera exactamente lo que este sitio necesita (páginas de contenido) con menos piezas y sin la restricción comercial de Vercel.
- **E frente a B.** Mismo framework; Decap ahorra el proveedor de CMS, pero a costa del criterio más importante: que la comisión pueda cargar desde el celular sin cuentas técnicas.
- **C queda descartada** para la v1: paga en complejidad, en costo (pausa o USD 25 por mes) y en riesgo legal por capacidades que hoy nadie pidió.

## Consecuencias

**Se vuelve más fácil:**

- Publicar un resultado o una noticia desde el celular en un formulario con los campos justos.
- Mantener el costo en el dominio y nada más.
- Pasarle el proyecto a otra persona: el código es chico y no hay servidores.
- Que el sitio aguante picos de tráfico sin hacer nada.

**Se vuelve más difícil:**

- Cualquier función dinámica en tiempo real (resultados minuto a minuto, login de socios, pagos): requeriría sumar funciones serverless o revisar este ADR.
- Separar permisos finos entre editores mientras se use el plan Free de Sanity.
- Cambios inmediatos: siempre hay 1 a 3 minutos de rebuild.

**A revisar más adelante:**

- Si los builds pasan de 10 minutos o de 300 por mes (límite: 500).
- Si Sanity cambia los límites o el precio del plan Free.
- Si el club decide guardar inscripciones propias o cobrar cuotas: eso es un ADR nuevo, con la Ley 25.326 como requisito de entrada.

## Acciones

1. [ ] Crear un email institucional del club (por ejemplo, comision@ o prensa@) y registrar con él dominio, Cloudflare, Sanity y el repositorio de código.
2. [ ] Prueba piloto de 30 minutos: dos editores cargan un resultado y una noticia con foto desde su celular en un Sanity de prueba. Si falla, reevaluar la opción D antes de seguir.
3. [ ] Confirmar en la página de precios de Sanity cuáles son los 2 roles del plan Free.
4. [ ] Definir los esquemas de Sanity según el modelo de datos del diseño de sistema (12 tipos de documento).
5. [ ] Montar el sitio Astro en Cloudflare Pages con el webhook de publicación desde Sanity.
6. [ ] Acordar con la comisión la política de fotos de menores (autorización del adulto responsable, sin edad exacta ni escuela).
7. [ ] Escribir un README de traspaso: accesos, cómo publicar, cómo restaurar.

## Fuentes

Consultadas el 2026-10-24.

- [Sanity: costos del plan Free con Astro (dev.to)](https://dev.to/mr_manushukla/15-a-seat-plus-the-build-what-a-sanity-and-astro-content-platform-costs-in-2026-2j3p)
- [Sanity: planes y roles (CostBench)](https://www.costbench.com/software/headless-cms/sanity/)
- [Cloudflare Pages: límites del plan Free](https://developers.cloudflare.com/pages/platform/limits)
- [Decap CMS: versiones](https://decapcms.org/docs/update-the-cms-version/)
- [responsive-decap: parche móvil para Decap](https://github.com/hithismani/responsive-decap)
- [Supabase: precios y pausa por inactividad (Jetadmin)](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)
- [WordPress.com: planes y precios, octubre 2026](https://eseospace.com/blog/wordpress-com-plans/)
- [Vercel Hobby: restricción de uso comercial (AE Server)](https://www.aeserver.com/free-vs-paid-web-hosting/)
