# CHANGELOG — CASTROSO.JPG

Todos los cambios notables al sitio y al repositorio se documentan aquí.

## [No publicado] — 2026-11-22

### Añadido
- `@font-face` para Sora y JetBrains Mono (WOFF2 locales) con `font-display: swap` en `public/assets/css/main.css`. Evita FOIT y hace efectiva la precarga de fuentes existente en el HTML.
- Atributo `aria-hidden="true"` en el isotipo decorativo del footer en `scripts/build.mjs`.
- Sección "Cómo empezar" en la portada con 3 pasos para trabajar con el estudio (`scripts/build.mjs`, `public/assets/css/main.css`).
- Pre-cotización de servicio específico: URL `?servicio_especifico=` desde tarjetas de servicio al formulario de contacto (`scripts/build.mjs`).
- Pre-llenado de descripción en formulario de contacto cuando llega `servicio_especifico` por URL (`public/assets/js/main.js`).

### Modificado
- `public/assets/css/main.css`: +22 líneas (tipografías locales) + estilos sección Cómo empezar.
- `scripts/build.mjs`: +1 línea (accesibilidad isotipo footer) + CTA de contacto primario en hero + sección Cómo empezar + parámetro `servicio_especifico` en CTAs de servicio.
- `public/assets/js/main.js`: `initContactPrefill` maneja `servicio_especifico` y pre-llena campo de descripción.
- `.github/workflows/deploy.yml`: `node-version` de `'22'` a `'lts/*'` para coincidir con el entorno local (Node 26).

### Verificado
- `npm run build`: 10 HTML generados (index, proyectos, servicios, estudio, contacto, privacidad, 404, 500, 2 proyectos).
- `npm run check`: 455 referencias locales válidas, sitemap y robots correctos.
- `node --check`: sintaxis de `.mjs` y `.js` correcta.

### Pendiente (bloqueos comerciales — requiere datos del estudio)
- `studio.email` vacío en `data/site.json`.
- `studio.whatsapp` vacío en `data/site.json`.
- Aviso de privacidad sin datos reales (`responsible_name`, `legal_address`, `contact_email`, `public_copy`, `approved_date`).
- `FORMSPREE_ENDPOINT` y `NEWSLETTER_ENDPOINT` no configurados en GitHub Actions Secrets.
- No hay `CHANGELOG.md` previo a esta entrada.

### No se ha hecho
- No se ha creado cuenta en Formspree.
- No se ha configurado endpoint de formulario.
- No se ha desplegado en GitHub Pages.
- No se ha configurado dominio propio `castroso.jpg`.
- No se han inventado precios, clientes, testimonios ni datos legales.
