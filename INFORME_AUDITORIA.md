# INFORME DE AUDITORÍA — CASTROSO.JPG (Sitio estático)

**Proyecto:** CASTROSO.JPG — Sitio estático para GitHub Pages  
**Origen:** ZIP 1 (`castroso-static`)  
**Fecha de auditoría:** 2026-11-16  
**Entorno:** Node v26.8.1, npm 11.19.0  
**Estado:** Producción-ready (páginas estáticas, sin backend)

> **Nota:** este informe corresponde a una auditoría anterior. Para el rediseño integral y el estado actual del sitio, ver `INFORME_REDISENO.md`.

---

## 1. Resumen ejecutivo

El sitio fuente (ZIP 1) ya generaba correctamente 9 páginas estáticas + sitemap + robots. La auditoría detectó y corrigió problemas de escasez de seguridad (escapado de entidades HTML, filtros de proyectos borrador, activos rotos en subruta `BASE_PATH`), navegación activa incorrecta, plantillas de proyecto sin `data-project-slug`, ausencia de página `500.html`, y URLs de navegación con sufijo `.php` heredados. Se añadieron tipografías web con licencia OFL (Sora + JetBrains Mono), se documentaron todos los datos pendientes y se preparó la entrega en dos ZIP: **A (fuente)** y **B (dist)**.

---

## 2. Alcance de la auditoría

| Elemento | Resultado |
|----------|-----------|
| 8 páginas HTML (`/`, `/proyectos/`, `/servicios/`, `/estudio/`, `/contacto/`, `/privacidad/`, `/404.html`, `/500.html`) | Generadas y verificadas |
| `sitemap.xml`, `robots.txt`, `manifest.json`, `.nojekyll` | Generados y verificados |
| Assets: CSS, JS, fuentes WOFF2, iconos, logos, imágenes OG/proyectos | Copiados y accesibles |
| Build con `BASE_PATH=''` y `BASE_PATH=/repositorio/` | Rutas corregidas, 0 enlaces con prefijo erróneo |
| Enlaces rotos (audit de 8 páginas) | Solo `#` y `?servicio=` (intencionales); 0 objetivos reales faltantes |
| `mailto:` condicional (`studio.email` vacío → sin enlace) | Implementado |
| CNAME | No se comite (solo vía `CUSTOM_DOMAIN` env) |

---

## 3. Cambios realizados

### 3.1 `scripts/build.mjs` (reescritura parcial)
- `e()` escapa `&amp;` primero, luego `<`, `>`, `"`, `'`, evitando doble escape.
- `BASE_PATH` y `SITE_URL` normalizados (se elimina barra final).
- Filtro de proyectos: `published !== false && draft !== true` (proyectos borrador no se generan ni publican).
- Función `validateData()`: valida `site.json`, `projects.json`, `services.json` y emite advertencias (no falla el build).
- `buildNavigation()` con `normalizePath()`: estados `active` correctos en home y páginas internas.
- `buildProjectCard()` añade atributo `data-project-slug`.
- `buildProyectoPage()`: navegación prev/next mediante índice limpio del array filtrado.
- Nueva `build500Page()` que genera `dist/500.html` (GitHub Pages no asigna respuestas 500 automáticas).
- `robots.txt`: rutas `Disallow` prefijadas con `BASE_PATH`.
- Enlaces `mailto:` condicionales: solo si `siteConfig.studio.email` no está vacío.

### 3.2 `data/projects.json`
- Añadido `"published": false` a ambos proyectos de ejemplo (`identidad-castroso`, `sistema-editorial`) porque sus imágenes son placeholders generados, no fotografías definitivas.

### 3.3 `data/site.json`
- Navegación: sufijo `.php` eliminado; trailing slashes normalizados.

### 3.4 `public/assets/css/main.css`
- Añadidos `@font-face` para Sora y JetBrains Mono (variables WOFF2 locales) con `font-display: swap`.

### 3.5 `public/assets/fonts/`
- `Sora-VariableFont_wght.woff2`, `JetBrainsMono-VariableFont_wght.ttf` (convertido a WOFF2 por el build si aplica) + licencias OFL: `LICENSE-SORA.txt`, `LICENSE-JETBRAINS-MONO.txt`.

### 3.6 `.github/workflows/deploy.yml`
- `node-version: '20'` → `'lts/*'` (compatibilidad con Node 26 local y GitHub Actions).

### 3.7 `README.md`
- Documentados: página `500.html`, proyectos borrador (`published: false`), fuentes + licencias OFL, regla de no comitear `CNAME`, secrets Formspree, checklist de build/Pages actualizado.

---

## 4. Resultados de pruebas (build)

Comando: `npm run build` (Node 26.8.1, `npm ci` previo OK)

| Prueba | Resultado |
|--------|-----------|
| Build por defecto (`BASE_PATH=''`) | ✅ Éxito, `dist/` generado |
| Build con `BASE_PATH=/repositorio/` | ✅ 0 enlaces con prefijo erróneo; canonical/sitemap/robots con prefijo correcto |
| Servir `dist/` en localhost:3101 (root) | ✅ 200 en `/`, `/contacto/`, `/404.html`, `/500.html`, `/manifest.json`, `/sitemap.xml`, `/robots.txt` |
| Servir `dist/` en localhost:3102 (`/repositorio/`) | `serve` no monta subruta; verificado por inspección de prefijos en HTML (0 fallos) |
| Generadores de assets (`favicons`, `og`, `project-images`) | ✅ Todos generan sin errores |
| Auditoría de enlaces (8 páginas HTML) | ✅ 0 objetivos reales faltantes; solo `#` y `?servicio=` (intencionales) |

---

## 5. Datos pendientes antes de producción

| Categoría | Campo | Detalle |
|-----------|-------|---------|
| Legales (privacidad) | Domicilio notificaciones | `[PENDIENTE]` en `privacidad/index.html` |
| Legales | Correo contacto legal | `[PENDIENTE]` |
| Legales | Responsable protección datos | `[PENDIENTE]` |
| Legales | Asesoría LFPDPPP | Pendiente revisión legal |
| Contacto (`site.json`) | `studio.email` | Vacío → sin `mailto:` hasta configurar |
| Contacto (`site.json`) | `studio.whatsapp` | Vacío |
| Formspree | `FORMSPREE_ENDPOINT` | Crear formulario contacto en formspree.io |
| Formspree | `NEWSLETTER_ENDPOINT` | Opcional, para newsletter del footer |
| Imágenes proyectos | `identidad-castroso` / `sistema-editorial` | Reemplazar placeholders por fotos reales; marcar `"published": true` |
| Dominio `castroso.jpg` | DNS (A ×4 + CNAME www) | Configurar antes de activar en GitHub Pages |
| Dominio | HTTPS | Activar "Enforce HTTPS" en GitHub Pages tras DNS |

---

## 6. Entregables

| Archivo | Contenido |
|---------|-----------|
| `castroso-static-final.zip` | ZIP A: fuente completa (excluye `node_modules/`, `dist/`, `.git`, secretos) |
| `castroso-static-dist.zip` | ZIP B: contenido de `dist/` listo para subir a GitHub Pages |
| `INFORME_AUDITORIA.md` | Este informe |
| `GUIA_REPOSITORIO_GITHUB.md` | Crear y subir repositorio |
| `GUIA_SUBIR_PROYECTO.md` | Subir proyecto (ZIP A o ZIP B) |
| `GUIA_ACTIVAR_PAGES.md` | Activar GitHub Pages |
| `GUIA_DOMINIO_CASTROSO_JPG.md` | Conectar dominio `castroso.jpg` |
| `GUIA_FORMSPREE.md` | Configurar Formspree (contacto + newsletter) |
| `README.md` | Documentación actualizada del sitio |

---

## 7. Notas técnicas

- No se comitea ningún `CNAME` ni `.env`. Los secretos (`FORMSPREE_ENDPOINT`, `NEWSLETTER_ENDPOINT`) van solo en GitHub Actions Secrets.
- `npm run preview` (`npx serve dist -p 3000`) funciona en Node v26.8.1 (verificado: `/` y `/assets/css/main.css` responden 200).
- GitHub Pages como **sitio de usuario/organización** (`usuario.github.io`): `BASE_PATH=`. Como **proyecto** (`usuario.github.io/repo/`): `BASE_PATH=/repositorio/` y `SITE_URL=https://usuario.github.io`.
- Estado posterior al rediseño: ambos proyectos están marcados `"published": true` y generan `/proyectos/[slug]/`; sus imágenes generadas fueron eliminadas y se usan los SVG originales. Ver `INFORME_REDISENO.md` y `PENDIENTES_PUBLICACION.md`.

---

**— Fin del informe —**
