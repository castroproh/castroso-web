# Informe de rediseño — CASTROSO.JPG

**Actualizado:** 17 de noviembre de 2026
**Implementación:** sitio estático generado con Node.js, HTML semántico, CSS propio y JavaScript vanilla; sin framework.

## Sistema visual conservado

- Paleta oficial: carbón `#08090B`, papel `#F2F0EA`, azul `#145BFF`, rojo `#E52B35`, verde `#187A50` y gris `#777777`.
- Tipografías Sora y JetBrains Mono servidas desde WOFF2 locales.
- Logos oficiales SVG y recursos vectoriales de marca existentes.
- Diseño responsive con estilos propios, navegación móvil, estados de foco y movimiento reducido.

## Arquitectura y páginas

`scripts/build.mjs` combina `data/site.json`, `data/projects.json` y `data/services.json`, copia `public/assets/` y genera la salida en `dist/`. El build actual produce diez documentos HTML:

- Inicio, listado de proyectos, servicios, estudio, contacto y privacidad.
- Páginas 404 y 500 estáticas.
- Detalle de `identidad-castroso` y `sistema-editorial`.

Los dos proyectos se muestran como trabajos vectoriales, con `fit: contain`, etiquetas y notas que aclaran que no son fotografías. Usan logos y gráficos SVG existentes; los JPG sintéticos de proyectos y su generador por defecto se retiraron para no presentar placeholders como trabajos reales.

## Interacciones y configuración

- Menú responsive hasta 860 px: apertura/cierre, foco inicial, cierre con Escape, clic exterior, cierre al navegar y restauración del scroll.
- Filtros de categoría y estado vacío del portafolio; paginación disponible para catálogos con más de nueve proyectos.
- Galería de proyectos con lightbox.
- Formularios de contacto y newsletter que no simulan éxito: el contacto no envía datos sin `FORMSPREE_ENDPOINT`; el newsletter queda deshabilitado sin `NEWSLETTER_ENDPOINT`.
- Enlaces desde servicios que precargan la categoría correspondiente cuando coincide con una opción del formulario.
- Canonical, Open Graph, JSON-LD, sitemap, robots, manifest y rutas ajustables con `BASE_PATH` y `SITE_URL`.

El aviso de privacidad aún contiene campos de información y revisión legal pendientes; consulta [PENDIENTES_PUBLICACION.md](PENDIENTES_PUBLICACION.md). El contenido de este informe describe la implementación del repositorio y no sustituye pruebas de publicación en GitHub Pages.

## Corrección de maquetación (fase 2)

Tras publicar la fase 1 se detectó en navegador que `main.css` conservaba selectores de una iteración anterior: el `build.mjs` generaba clases nuevas (`topbar`, `hero-grid`, `ticker`, `manifesto-*`, `discipline-row`, `studio-*`, `team-profile*`, `case-*`, `service-chapter`, `footer-top`, etc.) sin reglas asociadas, y el sitio compilaba sin maquetar.

En esta rama se reescribió `main.css` completo (~3.300 líneas) cubriendo todas las clases del generador — auditado clase por clase contra el HTML producido, sin clases sin regla. Además:

- Reset global `[hidden] { display: none !important }`: la paginación con `display: flex` anulaba el atributo `hidden` del filtrado.
- Marquees con `overflow: hidden`, pista duplicada al 50 % y separadores propios entre términos; `prefers-reduced-motion` respetado.
- SVG de proyectos con `object-fit: contain` sobre paneles con `aspect-ratio` (`.project-card-media`, `.project-cover`, `.gallery-link`); nunca recortados.
- Lightbox corregido en `main.js`: `preventDefault` en el enlace de galería (antes la página navegaba al SVG), el cover deja de contar como diapositiva y se eliminó el `<style>` inline que pisaba el diseño de la hoja principal.
- Leyendas de retrato con su rótulo inquebrantable y la función envolvente en límite de palabra.
- Rejilla de la historia de Estudio en tres columnas reales y sellos del hero sin solaparse.
- El prefill del formulario acepta además el id de servicio vía `serviceCategories` de `config.js`.

Validación de la fase: `npm ci`, `npm run build`, `npm run check` correctos; `scrollWidth = viewport` en 7 páginas × 11 anchos (375–1440 px); consola y red sin errores; menú móvil, filtros, lightbox y prefill verificados en navegador. Capturas en resoluciones de 375 a 1440 px.
