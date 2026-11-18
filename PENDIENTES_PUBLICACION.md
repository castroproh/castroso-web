# Pendientes para la publicación comercial

El build y el despliegue técnico del sitio estático no dependen de los datos de esta lista. No habilites formularios ni presentes el aviso legal como aprobado hasta recibir y revisar la información correspondiente.

> Estado tras la fase 2: sitio maquetado y verificado (CSS alineado al HTML generado, QA en 11 anchos, interacciones y consola sin errores). Los pendientes de esta lista siguen sin datos reales y no se han inventado.

## Información que debe aportar el estudio

- `studio.email`: correo real para contacto y solicitudes ARCO.
- `studio.whatsapp`: URL real de WhatsApp Business, si se desea ofrecer ese canal.
- Domicilio completo para notificaciones del responsable de datos.
- Nombre de la persona responsable de protección de datos, si corresponde.
- Revisión legal del aviso de privacidad: finalidades, plazos de conservación, terceros que reciben datos, procedimientos y textos aplicables.
- Confirmar qué servicios externos usarán cookies o tecnologías de seguimiento; el sitio no integra analítica propia actualmente.

## Servicios que debe configurar el estudio

- `FORMSPREE_ENDPOINT`: endpoint real del formulario de contacto. Mientras esté vacío, el formulario valida localmente y no transmite datos.
- `NEWSLETTER_ENDPOINT`: endpoint real del newsletter, solo si se va a habilitar.
- Revisar los avisos y condiciones del proveedor elegido e incorporarlos al aviso de privacidad antes de activarlo. No se han creado cuentas ni endpoints externos.

## Medios y dominio

- Los dos proyectos publicados son trabajos de identidad/diseño gráfico y usan vectores oficiales ya existentes en `public/assets/`; no requieren fotografías para conservar su presentación actual. Para publicar otros proyectos fotográficos o audiovisuales, el estudio debe aportar sus medios originales definitivos.
- El dominio propio es opcional; solo si se decide usarlo habrá que aportar el dominio y configurar su DNS y GitHub Pages.

## Qué bloquea cada publicación

- **Deploy técnico:** ninguno de los datos anteriores; GitHub Pages puede desplegar el sitio estático.
- **Contacto comercial por formulario:** bloqueado hasta configurar `FORMSPREE_ENDPOINT`.
- **Newsletter:** bloqueado hasta configurar `NEWSLETTER_ENDPOINT`.
- **Publicación comercial completa:** bloqueada hasta completar los datos reales del responsable y aprobar el aviso de privacidad. El correo y WhatsApp son opcionales como canales, pero no deben inventarse.
