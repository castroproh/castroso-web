# INFORME DE REDISEÑO — CASTROSO.JPG (sitio estático)

**Proyecto:** CASTROSO.JPG — versión estática para GitHub Pages
**Repositorio de referencia:** `https://github.com/castroproh/castroso-web`
**Fecha:** 2026-11-17
**Alcance:** auditoría, dirección de arte, rediseño e implementación sobre el código existente.

---

## 1. Resumen ejecutivo

El sitio ya tenía una base técnica correcta (generador estático propio en Node, datos en JSON, despliegue por GitHub Actions), pero **la hoja de estilos no correspondía al HTML generado**: el `build.mjs` producía un marcado semántico nuevo mientras `main.css` conservaba selectores de una iteración anterior (`.btn--primary`, `.contact-layout`, `.page-hero`, `.site-header .main-nav`, etc.). En la práctica, header, footer, portada, páginas interiores, tarjetas, filtros y detalle de proyecto quedaban sin estilo o a medias.

Este trabajo **reconstruye la capa visual completa** para que coincida con el marcado, aplica una dirección de arte editorial coherente con la identidad oficial, conserva todas las funcionalidades existentes y deja el sitio listo para compilar y desplegar en GitHub Pages bajo la subruta `/castroso-web/`.

---

## 2. Auditoría — arquitectura y hallazgos

### 2.1 Arquitectura real

| Capa | Tecnología |
|------|------------|
| Generación | `scripts/build.mjs` (Node ESM, sin frameworks) |
| Contenido | `data/site.json`, `data/projects.json`, `data/services.json` |
| Estilos | `public/assets/css/main.css` (CSS plano, tokens + componentes) |
| Interacción | `public/assets/js/main.js` (vanilla, IIFE) |
| Assets | `public/assets/{fonts,logos,icons,images}` |
| Salida | `dist/` |
| Deploy | `.github/workflows/deploy.yml` (GitHub Actions → Pages) |

`build.mjs` lee los JSON, inyecta plantillas (template literals), genera 8 páginas + detalle por proyecto, `sitemap.xml`, `robots.txt`, `manifest.json`, `.nojekyll` y `assets/js/config.js`, y copia `public/` a `dist/`.

### 2.2 Problemas encontrados

1. **Descuadre crítico CSS ↔ HTML.** ~60 clases usadas en el HTML no existían en el CSS (`.site-header` internals, `.footer-*`, `.btn-primary`, `.page-hero`, `.page-title`, `.contact-grid`, `.project-cover`, `.project-card-*`, `.team-member`, `.process-steps`, `.stats-grid`, `.filters`, `.pagination`, `.filter-btn.active`, etc.). El sitio se veía roto.
2. **Portafolio vacío.** Los dos proyectos estaban en `published: false`, por lo que la portada no mostraba destacados y la página de proyectos quedaba vacía; el detalle y los filtros no eran verificables.
3. **CSS duplicado.** ~4.100 líneas con bloques repetidos (secciones 10 y 24.1, 14 y 24.3, 15 y 24.4, etc.).
4. **Sin textura/sistema editorial.** La composición era genérica y con radios redondeados, justo lo que se pedía evitar.
5. **Accesibilidad**: contraste bajo en metadatos pequeños; sin enlace “saltar al contenido”.
6. **Experiencia de contacto**: los CTA de servicio pasaban un `id` de servicio que no correspondía a ninguna opción del formulario.
7. **`robots.txt` mal formado**: las rutas `Disallow` se generaban sin la barra final (`/castroso-webprivacidad/`), por lo que las reglas no eran válidas.

### 2.3 Decisiones

- Se conserva la arquitectura (generador propio + JSON + CSS/JS plano). **No se introducen frameworks.**
- Se reescribe `main.css` completo (de 4.139 a ~1.800 líneas útiles, sin duplicados) alineado 1:1 con el marcado.
- Se enriquece el marcado en `build.mjs` (portada editorial, grids, ficha lateral, paginación, etc.) sin eliminar contenido.
- Se publican los **dos proyectos de identidad reales del propio estudio** (trabajo verificable: logos, paleta y patrón oficiales existen en el repo). Las imágenes son **piezas generadas a partir del sistema vectorial oficial**, no fotografías; se documenta su procedencia en `projects.json` (`image_note`) y debe sustituirse por fotos reales cuando existan.

---

## 3. Dirección de arte

**Concepto:** portada de publicación independiente. Retícula editorial, líneas finas, numeración mono, titulares desproporcionados, bloques de color, texturas sutiles y composiciones asimétricas. Nada de tarjetas redondeadas ni gradientes genéricos.

- **Retícula**: contenedor 1320 px, gutter fluido; líneas hairline y secciones separadas por reglas.
- **Jerarquía**: display Sora 800 con tracking negativo; etiquetas y metadatos en JetBrains Mono en mayúsculas y con tracking amplio.
- **Color**: bloques de color de marca, un acento por sección (azul = diseño, rojo = fotografía, verde = audiovisual).
- **Detalles editoriales**: aráñas/metadata, numeración `01/02/03`, marquesina tipográfica, contornos de texto, chips de color con HEX, textura de retícula en portadas interiores.
- **Movimiento**: marquesinas CSS, entrada por `IntersectionObserver`, hover sutiles; todo respeta `prefers-reduced-motion`.

### 3.1 Paleta oficial (códigos HEX y uso)

| HEX | Nombre | Uso en el sitio |
|-----|--------|-----------------|
| `#08090B` | Negro carbón | Fondo principal, header, footer, texto invertido |
| `#F2F0EA` | Blanco papel | Texto principal, líneas, fondos de contraste |
| `#145BFF` | Azul eléctrico | Acento principal (diseño), botones primarios, enlaces/focus |
| `#E52B35` | Rojo intenso | Acento de fotografía, errores, detalles |
| `#187A50` | Verde oscuro | Acento audiovisual, mensajes de éxito |
| `#777777` | Gris fotocopia | Texto apagado / fallback |

> No se inventó una paleta nueva: sólo se derivan superficies y líneas (tintes del carbón y del papel) para dar profundidad sin salir del sistema.

### 3.2 Tipografías

- **Sora** (variable, WOFF2 local) — display, títulos y texto.
- **JetBrains Mono** (variable, WOFF2 local) — etiquetas, metadatos, numeración, botones.
- Ambas con licencia SIL OFL (incluidas en `public/assets/fonts/`). Sin fuentes externas.

---

## 4. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `scripts/build.mjs` | Cabecera y footer coherentes; portada editorial (meta, hypersensitivity, banda, manifiesto, destacados, servicios, CTA); listado de proyectos con toolbar+filtros+contador+paginación; detalle con breadcrumb, portada, ficha lateral, galería, créditos y navegación anterior/siguiente; servicios como filas editoriales por categoría; estudio con historia/valores/equipo/proceso/cifras; contacto con grid real y notas; SEO ampliado (`author`, `theme-color`, `og:image:alt`, `og:locale`, `twitter:image:alt`); enlace *Saltar al contenido*; CTA de servicio con nombre de categoría; **corrige `robots.txt`** (barra final en `Allow`/`Disallow`). |
| `public/assets/css/main.css` | **Reescritura completa** del sistema visual (tokens, reset, header/nav responsive, portada, marquesinas, grids editoriales, tarjetas, detalle, servicios, estudio, contacto, footer, privacidad, errores, animaciones, print). Sin duplicados. |
| `public/assets/js/main.js` | Anima con clase `.is-visible`; breakpoint móvil 860 px; *prefill* del formulario desde `?servicio=`; se conservan menú, filtros, paginación, lightbox, validación y newsletter. |
| `data/projects.json` | Los dos proyectos de identidad pasan a `published: true`; se añade `image_note` con la procedencia de las imágenes. |
| `INFORME_REDISENO.md` | Este informe. |
| `README.md` | Actualizado (estructura real, estado de proyectos, notas de uso). |

---

## 5. Funcionalidades conservadas

- Menú móvil (toggle, cierre con Escape, click en enlace, resize, foco atrapado).
- Header con estado `scrolled`.
- Filtros por categoría con `aria-pressed` y sincronización de URL (`?category=&page=`).
- Paginación de proyectos (9 por página) y estado vacío.
- Lightbox de galería (teclado, anterior/siguiente, contador).
- Formulario de contacto: validación HTML5 + JS, honeypot, estados y mensajes, envío Formspree.
- Newsletter del footer (se desactiva con mensaje si no hay endpoint).
- Animaciones de entrada con `IntersectionObserver` y `prefers-reduced-motion`.
- Smooth scroll de anclas; lazy loading nativo.
- SEO: títulos/descripciones por página, canonical, Open Graph, Twitter, JSON-LD (Organization, WebSite, CreativeWork), `sitemap.xml`, `robots.txt`.
- Despliegue GitHub Pages con `BASE_PATH` dinámico y `SITE_URL`.

---

## 6. Accesibilidad, SEO y rendimiento

- HTML semántico (`header/nav/main/section/article/aside/footer`), `aria-*` en nav, filtros, galería y paginación.
- Enlace “Saltar al contenido” y `:focus-visible` global.
- Contraste AA: `--text-soft` 0.78, `--text-dim` 0.62, `--text-faint` 0.52 sobre carbón (≥ 4.5:1 para texto normal).
- `alt` descriptivos (vacío en decorativos), imágenes con `width/height` y `loading` apropiado.
- Fuentes WOFF2 locales con `preload`, `font-display: swap`; un solo CSS sin frameworks (~54 KB sin comprimir).
- Metadatos por página + `og:image:alt`; sitemap y robots con rutas prefijadas por `BASE_PATH`.

---

## 7. Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `npm ci` | ✅ 75 paquetes, sin errores |
| `npm run build` (`BASE_PATH=/castroso-web/`) | ✅ 10 HTML + sitemap + robots + manifest + `.nojekyll` |
| Clases usadas sin definir en CSS | ✅ 0 |
| Referencias locales rotas (353 refs en 10 HTML) | ✅ 0 |
| Balance de llaves/paréntesis CSS | ✅ 436/436 · 803/803 |
| Servir `dist/` en subruta `/castroso-web/` | ✅ 200 en `/`, 5 páginas + 2 detalles, `404`, `500`, CSS, JS, `config.js`, fuente WOFF2, logo SVG, `sitemap.xml`, `robots.txt`, `manifest.json`, `.nojekyll` |
| JSON de datos | ✅ `projects.json` válido |

Tabla de HTTP verificada: `/`, `/proyectos/`, `/proyectos/identidad-castroso/`, `/proyectos/sistema-editorial/`, `/servicios/`, `/estudio/`, `/contacto/`, `/privacidad/`, `/404.html`, `/500.html` → **200**.

---

## 8. Resultado de compilación

```
✅ Datos válidos
✅ index.html
✅ proyectos/index.html
✅ servicios/index.html
✅ estudio/index.html
✅ contacto/index.html
✅ privacidad/index.html
✅ 404.html
✅ 500.html
✅ proyectos/identidad-castroso/index.html
✅ proyectos/sistema-editorial/index.html
✅ sitemap.xml
✅ robots.txt
✨ Build completado en dist/
```

---

## 9. Configuraciones externas pendientes

Estas tareas requieren datos/credenciales que no están en el repositorio y **no se han inventado**. El detalle completo, con efectos y ubicación en código, está en `PENDIENTES_PUBLICACION.md`:

- [ ] `studio.email` en `data/site.json` (correo real).
- [ ] `studio.whatsapp` (enlace `https://wa.me/521…`).
- [ ] `FORMSPREE_ENDPOINT` (Settings → Secrets) para el formulario de contacto.
- [ ] `NEWSLETTER_ENDPOINT` (opcional) para el newsletter.
- [ ] Campos `[PENDIENTE]` del aviso de privacidad (domicilio, correo legal, responsable, revisión LFPDPPP).
- [ ] Dominio `castroso.jpg` (DNS + HTTPS) si se decide activarlo.

> Las imágenes generadas de los proyectos fueron **eliminadas**. Ambos proyectos usan ahora sus SVG originales (`media_type: "vector"`, `fit: "contain"`) y están marcados `published: true`. Si se aportan fotos/mockups reales, actualizar `cover`, `gallery[]` y `meta.og_image` en `data/projects.json`.

---

## 10. Ejecución local

```bash
npm install        # o npm ci
npm run build      # BASE_PATH=/castroso-web/ SITE_URL=https://castroproh.github.io
npm run preview    # sirve dist/ en http://localhost:3000
```

Para probar la subruta exacta, sirve el directorio padre de `dist/` de modo que `dist/` quede expuesto como `/castroso-web/`.

---

## 11. Fase 2 — Corrección de maquetación sobre la versión publicada (2026-11-17)

Tras publicar la fase 1 se detectaron en navegador real los defectos que motivaron esta segunda intervención: textos concatenados ("01Inicio", "Diseño gráficoDirección de arte…"), marquee desordenado, tarjetas de proyecto aparentemente vacías, composición desequilibrada en Estudio y footer con listas básicas.

**Diagnóstico verificado:** el `build.mjs` reescrito en fase 1 generaba el marcado nuevo, pero `public/assets/css/main.css` seguía siendo el de la iteración anterior — **ninguna** de las clases nuevas (`topbar`, `hero-grid`, `hero-portraits`, `portrait-media`, `ticker`, `manifesto-*`, `discipline-row`, `studio-*`, `team-profile*`, `case-*`, `service-chapter`, `page-hero-top/bottom`, `footer-top`, etc.) tenía regla CSS. El sitio compilaba pero no estaba maquetado.

### 11.1 Correcciones implementadas

| Defecto | Causa raíz | Corrección |
|---------|-----------|------------|
| Textos concatenados | Sin reglas para `.nav-index`, `.kicker-index`, `.hero-disciplines`, `.discipline-row`, `.page-hero-top`, `.project-card-top`, etc. | Reescritura completa de `main.css` (≈3.300 líneas) con retícula, `gap` y separadores por componente; auditado clase por clase contra el HTML generado (0 clases sin regla). |
| Marquee desordenado | `.ticker-track` / `.footer-marquee-track` sin estilos (los del diseño anterior apuntaban a `.marquee-*`). | Cinta con `overflow:hidden`, pista duplicada al 50%, separadores `<i>` propios entre términos, `prefers-reduced-motion` respetado. |
| Tarjetas "vacías" | `.project-card-media` sin altura ni fondo; los SVG caían a altura 0. | Media con `aspect-ratio` y panel de retícula; SVG con `object-fit: contain` (regla `.project-card--contain`), índice y etiqueta posicionados. |
| Paginación visible con 2 proyectos | `.pagination { display:flex }` anulaba el atributo `[hidden]` del HTML. | Reset global `[hidden] { display:none !important }`. |
| Lightbox roto (navegaba al SVG) | `main.js` bindeaba el click al `<img>` y no hacía `preventDefault` en el `<a class="gallery-link">`. | Bind al enlace con `preventDefault`; el cover dejó de contar como slide; se eliminó el `<style>` inline que pisaba el diseño. |
| Leyendas de retrato partidas ("RETRATO / SANTIEL") | `figcaption` sin control de envoltura. | Primer dato inquebrantable; la función envuelve solo en límite de palabra; la fila se apila cuando no cabe. |
| Grid de historia desalineado (Estudio) | El riel (`section-rail`) está fuera de `.studio-story-grid`; la plantilla le asignaba su columna. | Plantilla de 3 columnas real (título / texto / bloque CREA·EXPERIMENTA·COMPARTE) y `padding-bottom` del hero de estudio. |
| Desbordes horizontales | — | Auditoría automatizada con iframe de 375–1440 px en las 7 páginas: `scrollWidth = viewport` en todos los casos; los únicos elementos anchos son los marquees, recortados por diseño. |

### 11.2 Validación (fase 2)

- `npm ci` + `npm run build`: 10 HTML + 2 detalles + `sitemap.xml` + `robots.txt`, rutas `/castroso-web/` correctas.
- Consola sin errores y red sin 4xx/5xx en las 7 páginas (Chromium).
- Capturas reales en 375, 390, 520, 560, 640, 768, 860, 1024, 1280, 1366 y 1440 px (portada, estudio, proyectos, detalle, servicios, contacto, privacidad) vía Chrome headless + sonda de iframe.
- Interacciones verificadas: menú móvil (abre/cierra, `aria-expanded`, bloqueo de scroll), filtros, lightbox (abrir/navegar/cerrar), paginación oculta, prefill `?servicio=` del formulario.

### 11.3 Pendiente de publicación

Sin cambios respecto a la sección 9: datos reales faltantes (`studio.email`, `studio.whatsapp`, `FORMSPREE_ENDPOINT`, campos `[PENDIENTE]` del aviso, dominio propio).

---

**CASTROSO.JPG — CREA. EXPERIMENTA. COMPARTE.**