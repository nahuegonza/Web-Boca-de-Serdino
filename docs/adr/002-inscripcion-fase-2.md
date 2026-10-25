# ADR-002: Inscripción a pruebas con datos guardados (fase 2)

**Estado:** Propuesto, postergado
**Fecha:** 2026-10-25
**Decisores:** Comisión directiva + quien mantenga el sitio
**Relacionado:** ADR-001 (stack y CMS)

## Contexto

La fase 1 (en producción) arma un mensaje de WhatsApp en el navegador con datos mínimos y no guarda nada. Es la opción con menos riesgo para datos de menores.

El pedido original incluía guardar las inscripciones cifradas, con acceso solo para el coordinador, aviso por email y confirmación a la familia. Eso convierte al club en responsable de una base de datos con datos de menores. En Argentina implica la Ley 25.326 de protección de datos personales:

- Registrar la base ante la Agencia de Acceso a la Información Pública (AAIP).
- Designar un responsable.
- Informar la finalidad y responder pedidos de acceso, rectificación y supresión.
- Tomar medidas de seguridad acordes.

Este ADR deja escrito cómo hacerlo, para cuando la comisión lo decida.

## Decisión propuesta (cuando se active)

Usar Cloudflare (el mismo proveedor del hosting), sin servidores propios:

| Pieza | Elección | Por qué |
|---|---|---|
| Recepción | Cloudflare Pages Function `POST /api/inscripcion` | El mismo despliegue; plan gratis de 100.000 pedidos por día. |
| Anti-spam | Honeypot + Cloudflare Turnstile verificado en el servidor + límite por IP en KV (5 por hora) | Igual que el formulario de contacto, ya implementado. |
| Almacenamiento | Cloudflare D1, con cada inscripción cifrada antes de guardarla | Los datos nunca quedan legibles en la base. |
| Cifrado | Cifrado híbrido con la clave pública del coordinador (RSA-OAEP + AES-GCM, Web Crypto) | El servidor solo puede cifrar; para descifrar hace falta la clave privada, que guarda el coordinador. Si alguien obtiene la base o el código, no puede leer nada. |
| Acceso | Página `/coordinacion` protegida con Cloudflare Access (email del coordinador, código de un solo uso) | Sin contraseñas propias. La clave privada se carga solo en el navegador del coordinador para descifrar. |
| Avisos | Email al coordinador ("hay una inscripción nueva", sin datos) y a la familia (confirmación sin datos del menor) | Ningún dato sensible viaja por email. |
| Retención | Borrado automático a los 90 días de la prueba (tarea programada) | Minimización exigida por la ley. |

Reglas que no se negocian:

- Nunca loguear el cuerpo del pedido.
- Nunca poner datos en URLs ni en respuestas de la API: la API responde solo `{ ok: true }` o un código de error.
- No pedir datos que no hagan falta para la prueba. El DNI y el apto médico se piden en persona el día de la prueba.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| A. Seguir solo con WhatsApp (fase 1) | Cero datos guardados, cero costo, cero obligaciones de registro | Las inscripciones quedan en el celular de quien atiende el WhatsApp; cuesta llevar la cuenta |
| B. Google Forms del club | Fácil de usar | Datos de menores en una planilla sin cifrar, compartible por error |
| C. Cloudflare con cifrado (esta propuesta) | Datos cifrados, acceso solo del coordinador, costo probable USD 0 | Más código que mantener; obliga a registrar la base y a tener un responsable |

## Consecuencias

- **Se vuelve más fácil:** llevar la lista de inscriptos por categoría y avisar a todos de un cambio de horario.
- **Se vuelve más difícil:** el mantenimiento. Si se pierde la clave privada, las inscripciones guardadas no se pueden leer (es el precio del cifrado real).
- **Condiciones para activarla:** base registrada en la AAIP, responsable designado por la comisión, texto de consentimiento revisado por alguien con formación legal.

## Acciones (cuando la comisión lo apruebe)

1. [ ] Designar responsable y registrar la base en la AAIP.
2. [ ] Generar el par de claves del coordinador y guardar la privada fuera de la computadora del club.
3. [ ] Implementar la función, D1 y la página protegida con Cloudflare Access.
4. [ ] Escribir los tests: validación, cifrado y descifrado, límite de envíos y que ninguna respuesta incluya datos.
5. [ ] Actualizar el formulario: enviar al servidor en lugar de abrir WhatsApp.
