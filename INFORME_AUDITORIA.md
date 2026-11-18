# Informe de auditoría — CASTROSO.JPG

**Fecha:** 17 de noviembre de 2026
**Alcance:** revisión del generador, recursos del sitio, interacciones principales, enlaces locales y build estático. Este informe registra solo comprobaciones realizadas en esta revisión; no certifica una auditoría WCAG ni un despliegue en GitHub Pages.

## Hallazgos corregidos

- El menú tenía controlador HTML/JavaScript, pero la hoja de estilos no definía el header, el botón ni el estado de navegación móvil. Se incorporaron estilos para escritorio y menú móvil hasta 860 px, estado accesible del botón, cierre con Escape, clic exterior, foco en el primer enlace, cierre al navegar y restauración del scroll.
- El formulario de contacto podía intentar enviar a `form.action` aunque no existiera un endpoint real. Ahora valida los campos, asocia los errores con `aria-describedby` y, si falta `FORMSPREE_ENDPOINT`, muestra un aviso sin iniciar una petición ni afirmar que el mensaje se envió.
- Los dos proyectos reales estaban marcados como borradores y solo tenían imágenes JPG generadas con texto de muestra. Se publican como proyectos vectoriales con logos e ilustraciones SVG ya existentes, `fit: contain`, explicación textual de los medios y sus páginas individuales. Se retiraron los JPG placeholder y el generador ya no los crea salvo activación explícita de prueba.
- El listado de servicios usa `filter-btn`, pero la hoja de estilos existente definía `.filter-btn--active`; se añadió el estilo para la clase `.active` que aplica el JavaScript.
- El aviso de privacidad afirmaba medidas de seguridad, cookies, transferencias y plazos de retención no verificables en este sitio estático. Se aclaró que el envío de formularios está deshabilitado sin endpoint y que el tratamiento por servicios externos y los plazos deben confirmarse antes de activarlos.

## Build y comprobaciones automatizadas

En Node.js 26.8.1/npm 11.19.0 se ejecutaron `npm ci`, `npm run build:prod`, `npm run check`, `node --check` sobre los scripts JavaScript y `git diff --check`. El build generó 10 HTML (8 páginas generales y 2 fichas de proyecto); el chequeo confirmó 8 URLs de sitemap y 363 referencias locales válidas.

Se revisó la salida de `dist/` para comprobar páginas de error, manifest, robots, sitemap, `.nojekyll`, configuración runtime, prefijos de rutas, recursos SVG publicados y presencia de ambos proyectos. El workflow existente usa Node 22, `npm ci`, `npm run build`, sube `dist/` y despliega con `actions/deploy-pages@v4`; no se modificó.

## Interacciones y límites de verificación

Headless Chrome verificó 10 páginas a 375, 390, 768, 860, 1024, 1280, 1366 y 1440 px: sin overflow horizontal, navegación visible según breakpoint y sin imágenes rotas. También se probaron apertura/cierre del menú y restauración del scroll con Escape, filtro de proyectos, acordeón de servicios y newsletter deshabilitado, prellenado por servicio, validación de campos obligatorios y estado honesto del formulario sin endpoint (sin petición de red), además de ajuste vectorial `contain` y apertura/cierre del lightbox con Escape.

El HTML compilado confirma ocho campos del formulario con etiquetas asociadas, cinco obligatorios, opciones requeridas/opcionales, honeypot y estado anunciado. No se probó el formato de email inválido, paginación (el catálogo actual tiene solo dos proyectos), el resultado visual de cada filtro ni envíos a servicios externos: los endpoints no están configurados, por lo que ningún envío real se puede ni se debe simular. Tampoco se calculó contraste WCAG ni se midió cada área táctil en navegador; hace falta una auditoría dedicada para esos puntos. Las alertas de contraste sobre texto decorativo dibujado solo con contorno requieren inspeccionar nodo y método antes de clasificarse como texto funcional.

No se ejecutó el workflow remoto de GitHub Actions ni se verificó un deploy publicado; la consulta a la API de Actions expiró por timeout. El dominio y el formulario de contacto no están disponibles para comprobarse en producción.

## Pendiente antes de operación comercial

El deploy estático no requiere servicios comerciales. La recepción de consultas requiere que el estudio aporte y configure `FORMSPREE_ENDPOINT`; el newsletter, si se desea, requiere `NEWSLETTER_ENDPOINT`. También hacen falta `studio.email`/`studio.whatsapp` si el estudio quiere esos canales, domicilio y responsable reales, revisión legal de los campos `[PENDIENTE]` y plazos/terceros aplicables. Estos datos no se han inventado. Un dominio propio es opcional.
