# CASTROSO.JPG

Sitio estático del estudio creativo CASTROSO.JPG. Un generador Node.js crea las páginas HTML desde datos JSON y copia los recursos de `public/`; GitHub Pages publica el directorio `dist/`.

## Requisitos

- Node.js 22 o superior (el workflow de publicación usa Node 22).
- npm.

## Instalación, build y preview

```sh
npm ci
BASE_PATH= SITE_URL=http://localhost:3000 npm run build
npm run preview
```

Abre `http://localhost:3000/`. Para revisar enlaces y recursos del build local:

```sh
BASE_PATH= SITE_URL=http://localhost:3000 npm run check
```

Para GitHub Pages como sitio de proyecto, usa:

```sh
npm run build:prod
npm run check
```

Ese build configura `BASE_PATH=/castroso-web/` y `SITE_URL=https://castroproh.github.io`. `BASE_PATH` es el prefijo del repositorio en las rutas de páginas, assets, canonical, sitemap y robots; `SITE_URL` es el origen público. Ambos pueden ajustarse como variables de entorno para otros despliegues. `npm run dev` compila y sirve el sitio local; `npm run preview` sirve el `dist/` ya generado.

## Arquitectura

```text
data/
  site.json                 Datos del estudio, navegación y contacto
  projects.json             Proyectos, metadatos y rutas de medios
  services.json             Categorías y servicios
scripts/
  build.mjs                 Generador del sitio estático
  check-site.mjs             Comprueba salida, rutas y recursos
  generate-favicons.mjs      Genera iconos de marca
  generate-og.mjs            Genera el Open Graph general
  generate-project-images.mjs Generador antiguo de placeholders, desactivado
public/
  assets/css/main.css
  assets/js/main.js
  assets/fonts/              Sora y JetBrains Mono (WOFF2 y licencias)
  assets/icons/
  assets/images/
  assets/logos/
.github/workflows/deploy.yml Build y publicación de GitHub Pages
dist/                        Salida generada, ignorada por Git
```

El build genera ocho páginas generales (`/`, proyectos, servicios, estudio, contacto, privacidad, `404.html` y `500.html`) más una página de detalle por cada proyecto publicado. Los dos proyectos actuales, `identidad-castroso` y `sistema-editorial`, están publicados como trabajos vectoriales y utilizan recursos SVG existentes; no son fotografías. No se deben regenerar ni publicar los antiguos JPG de placeholder. `scripts/generate-project-images.mjs` solo se ejecuta de forma explícita con `FORCE_PLACEHOLDERS=1` para pruebas temporales.

Los JSON son la fuente de contenido. En `projects.json`, `published` controla si se genera una ficha; `media_type`, `fit`, `image_label` e `image_note` describen sus medios. Conserva los nombres de archivos y rutas existentes, y no agregues datos comerciales o imágenes no confirmados.

## Formularios y datos por completar

El formulario de contacto valida campos en el navegador, pero no transmite datos mientras `FORMSPREE_ENDPOINT` esté vacío; informa claramente que el envío no está activo. El newsletter también requiere `NEWSLETTER_ENDPOINT`. No agregues endpoints ficticios ni simules envíos exitosos.

Antes de habilitar envíos o completar la publicación comercial, consulta [PENDIENTES_PUBLICACION.md](PENDIENTES_PUBLICACION.md). El aviso de privacidad contiene campos pendientes de información real y revisión legal; no debe considerarse aprobado para uso comercial.

## GitHub Pages y dominio propio

`.github/workflows/deploy.yml` ejecuta `npm ci`, `npm run build` en Node 22 y despliega `dist/` con GitHub Pages al actualizar `main` o iniciar manualmente el workflow.

Los endpoints de Formspree se configuran como **Actions Secrets**:
- `FORMSPREE_ENDPOINT` (contacto; requerido para recibir solicitudes).
- `NEWSLETTER_ENDPOINT` (newsletter; opcional).

No se requiere un deploy manual paralelo.

El dominio propio es opcional. El workflow admite la **Actions repository variable** `CUSTOM_DOMAIN`:
- Si está vacía o no existe, conserva la URL actual `https://castroproh.github.io/castroso-web/`.
- Si contiene `castroso.jpg`, compila con `BASE_PATH` vacío, `SITE_URL=https://castroso.jpg` y genera `dist/CNAME`.

Configura `CUSTOM_DOMAIN` únicamente después de registrar el dominio, preparar los DNS y agregar `castroso.jpg` en Settings → Pages. Sigue [GUIA_DOMINIO_CASTROSO_JPG.md](GUIA_DOMINIO_CASTROSO_JPG.md). No guardes endpoints, contraseñas ni tokens en archivos versionados.
