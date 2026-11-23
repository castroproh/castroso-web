# Pendientes para la publicación comercial

El build y el despliegue técnico del sitio no dependen de los datos comerciales indicados abajo. No habilites formularios ni presentes el aviso legal como aprobado hasta recibir y revisar la información correspondiente.

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
- Definir y aprobar los precios, alcances, tiempos, límites de revisiones y condiciones de pago de los servicios antes de publicar tarifas.
- Confirmar capacidad y entregables de los paquetes mensuales antes de ofrecerlos como retainers.
- No publicar testimonios, métricas de ROI ni casos de éxito sin autorización y evidencia real.

## Medios y dominio

- Los dos proyectos publicados son trabajos de identidad/diseño gráfico y usan vectores oficiales ya existentes en `public/assets/`; no requieren fotografías para conservar su presentación actual. Para publicar otros proyectos fotográficos o audiovisuales, el estudio debe aportar sus medios originales definitivos.
- El dominio propio es opcional. Para activarlo, sigue `GUIA_DOMINIO_CASTROSO_JPG.md`; el workflow admite la variable de repositorio `CUSTOM_DOMAIN=castroso.jpg` una vez preparado el DNS y configurado GitHub Pages.

## Qué bloquea cada publicación

- **Deploy técnico:** puede funcionar con la URL de GitHub Pages actual.
- **Contacto comercial por formulario:** bloqueado hasta configurar `FORMSPREE_ENDPOINT`.
- **Newsletter:** bloqueado hasta configurar `NEWSLETTER_ENDPOINT`.
- **Publicación comercial completa:** bloqueada hasta completar los datos reales del responsable y aprobar el aviso de privacidad. El correo y WhatsApp son opcionales como canales, pero no deben inventarse.
- **Precios públicos y retainer mensual:** bloqueados hasta aprobar internamente importes y entregables. No se deben generar tarifas ni compromisos a partir de estimaciones no confirmadas.
