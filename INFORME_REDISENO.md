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
