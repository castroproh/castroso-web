# CASTROSO.JPG — Sitio Estático para GitHub Pages

Sitio web del estudio creativo CASTROSO.JPG (Culiacán, Sinaloa, México) convertido a sitio estático compatible con GitHub Pages.

## 🎨 Identidad Visual

- **Paleta oficial**: Negro carbón (`#08090B`), Blanco papel (`#F2F0EA`), Azul eléctrico (`#145BFF`), Rojo intenso (`#E52B35`), Verde oscuro (`#187A50`), Gris fotocopia (`#777777`)
- **Tipografía**: Sora (principal) + JetBrains Mono (técnica) — archivos WOFF2 locales
- **Logotipos**: Isotipo, Logotipo, Imagotipo horizontal/vertical, Monograma (SVG oficiales)
- **Estilo**: Indie Experimental + Cyber Retro + Diseño Editorial + Underground

## 📁 Estructura del Proyecto

```
castroso-static/
├── src/                    # Código fuente (templates, partials, estilos)
├── public/                 # Assets estáticos
│   ├── assets/
│   │   ├── css/main.css    # Estilos completos (design tokens, componentes, páginas)
│   │   ├── js/main.js      # JS vanilla (nav, filtros, lightbox, formularios, animaciones)
│   │   ├── fonts/          # Sora + JetBrains Mono (WOFF2)
│   │   ├── logos/          # SVGs oficiales organizados por variante
│   │   ├── icons/          # Favicons generados (16, 32, 48, 180, 192, 512, SVG)
│   │   └── images/         # OG default, proyectos, patrones gráficos
├── data/                   # Contenido en JSON
│   ├── site.json           # Configuración del sitio, studio, SEO, navegación
│   ├── projects.json       # Portafolio (proyectos, categorías, metadata)
│   └── services.json       # Servicios (3 categorías, 13 servicios)
├── scripts/
│   ├── build.mjs           # Generador de sitio estático principal
│   ├── generate-favicons.mjs    # Genera favicons desde isotipo SVG
│   ├── generate-og.mjs          # Genera imagen OG (1200×630)
│   └── generate-project-images.mjs # Placeholders para proyectos
├── dist/                   # Salida de build (se publica en GitHub Pages)
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions para deploy automático
├── package.json
├── .gitignore
├── .nojekyll
├── CNAME                   # (opcional) Dominio personalizado
└── README.md
```

## 🚀 Instalación y Desarrollo Local

```bash
# 1. Clonar e instalar dependencias
cd castroso-static
npm install

# 2. Build para desarrollo (BASE_PATH vacío, SITE_URL local)
npm run build

# 3. Previsualizar
npm run preview
# Abre http://localhost:3000

# 4. Desarrollo con watch (build + serve)
npm run dev
```

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run build` | Build producción (BASE_PATH="", SITE_URL=https://castroso.jpg) |
| `npm run build:prod` | Build para GitHub Pages subdirectory (ej. `/repo-name/`) |
| `npm run preview` | Sirve `dist/` en puerto 3000 |
| `npm run dev` | Build + preview en un comando |

## 🔧 Configuración

### Variables de entorno para build

```bash
# Desarrollo local
BASE_PATH= SITE_URL=http://localhost:3000 npm run build

# GitHub Pages (subdirectorio /usuario/repo/)
BASE_PATH=/repo-name/ SITE_URL=https://usuario.github.io npm run build:prod

# Dominio personalizado
BASE_PATH= SITE_URL=https://castroso.jpg CUSTOM_DOMAIN=castroso.jpg npm run build
```

### Formulario de contacto (Formspree)

El formulario usa Formspree para procesamiento sin servidor:

1. Crear formulario en [formspree.io](https://formspree.io)
2. Obtener endpoint (ej. `https://formspree.io/f/xxxxxxxx`)
3. Configurar en GitHub Actions secrets:
   - `FORMSPREE_ENDPOINT` → endpoint del formulario principal
   - `NEWSLETTER_ENDPOINT` → endpoint opcional para newsletter

**Sin endpoint configurado**: El formulario muestra mensaje de demo y dirige a Instagram/correo.

### Newsletter (Footer)

Igual que contacto: requiere `NEWSLETTER_ENDPOINT` en secrets. Sin configurar, muestra invitación a Instagram.

## 📦 Despliegue en GitHub Pages

### 1. Preparar repositorio

```bash
git init
git add .
git commit -m "Initial commit: CASTROSO.JPG static site"
git branch -M main
git remote add origin https://github.com/USUARIO/REPO.git
git push -u origin main
```

### 2. Activar GitHub Pages

1. Ir a **Settings → Pages**
2. **Source**: "GitHub Actions"
3. El workflow `.github/workflows/deploy.yml` se ejecutará automáticamente en cada push a `main`

### 3. Configurar secrets (opcional)

En **Settings → Secrets and variables → Actions**:

| Secret | Descripción |
|--------|-------------|
| `FORMSPREE_ENDPOINT` | Endpoint Formspree para formulario contacto |
| `NEWSLETTER_ENDPOINT` | Endpoint Formspree para newsletter |

### 4. Dominio personalizado (opcional — solo después de configurar DNS)

**No comites un archivo `CNAME` forzando el dominio antes de configurarlo.** GitHub Pages genera el `CNAME` automáticamente cuando añades el dominio en Settings → Pages.

1. Crea el repositorio y sube el código (ver guía incluida).
2. Configura los registros DNS de `castroso.jpg` (ver `GUIA_DOMINIO.md`).
3. En GitHub: Settings → Pages → Custom domain → escribe `castroso.jpg` → Save. GitHub crea el `CNAME` y activa HTTPS automáticamente.
4. Cuando tengas el dominio activo, puedes construir con:
   ```bash
   BASE_PATH= SITE_URL=https://castroso.jpg npm run build
   ```
   (sin `CUSTOM_DOMAIN`, el build no genera `CNAME`).

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | usuario.github.io |

## 🏗️ Cómo funciona el Build

El script `scripts/build.mjs`:

1. **Lee JSON** (`site.json`, `projects.json`, `services.json`)
2. **Procesa templates** (JavaScript template literals en el script)
3. **Genera páginas estáticas**:
   - `index.html` — Home con hero, proyectos destacados, servicios preview, CTA
   - `proyectos/index.html` — Grid con filtros, paginación, estado vacío
   - `proyectos/[slug]/index.html` — Detalle por proyecto (galería, créditos, nav prev/next)
   - `servicios/index.html` — 3 categorías, 13 servicios, acordeones, JSON-LD Service
   - `estudio/index.html` — Historia, valores, equipo, proceso 4 pasos, stats
   - `contacto/index.html` — Formulario validado, honeypot, Formspree AJAX
   - `privacidad/index.html` — Aviso LFPDPPP 11 secciones
   - `404.html` — Página de error con branding
   - `500.html` — Recurso visual estático de error (GitHub Pages no asigna respuestas automáticas 500)
4. **Genera assets técnicos**:
   - `sitemap.xml` (páginas + proyectos publicados)
   - `robots.txt`
   - `manifest.json` (PWA ready)
   - `.nojekyll` (desactiva Jekyll en GitHub Pages)
   - `CNAME` (si `CUSTOM_DOMAIN` definido)
   - `assets/js/config.js` (config runtime: BASE_PATH, endpoints, studio data)
5. **Copia assets** (`public/assets/*` → `dist/assets/*`)

## 📄 Páginas y Funcionalidades

| Página | URL | Funcionalidades clave |
|--------|-----|----------------------|
| Inicio | `/` | Hero, proyectos destacados, servicios preview, CTA |
| Proyectos | `/proyectos/` | Filtros por categoría, paginación (9/pág), estado vacío |
| Proyecto | `/proyectos/[slug]/` | Galería lightbox, metadata, créditos, nav prev/next, JSON-LD CreativeWork |
| Servicios | `/servicios/` | 3 categorías, 13 servicios, acordeones, JSON-LD Service |
| Estudio | `/estudio/` | Historia, valores, equipo, proceso, stats |
| Contacto | `/contacto/` | Formulario HTML5 + JS validation, honeypot, Formspree, toast messages |
| Privacidad | `/privacidad/` | 11 secciones LFPDPPP, campos `[PENDIENTE]` documentados |
| 404 | `/404.html` | Branding, enlaces de recuperación |
| 500 | `/500.html` | Recurso estático de error (GitHub Pages no genera 500 automáticos) |

## ♿ Accesibilidad

- Semántica HTML5 correcta (`header`, `nav`, `main`, `footer`, `article`, `section`, `aside`)
- ARIA labels en navegación, formularios, lightbox, paginación
- Focus visible en todos los elementos interactivos
- Trap focus en menú móvil y lightbox
- Navegación por teclado completa
- `prefers-reduced-motion` respetado
- Contraste WCAG AA en colores de marca
- `sr-only` para etiquetas solo screen readers
- `alt` descriptivos en imágenes (vacío en decorativas)

## 🔍 SEO

- Meta tags dinámicos por página
- Open Graph + Twitter Cards
- JSON-LD: Organization, WebSite, CreativeWork (proyectos), Service (servicios)
- Canonical URLs con `SITE_URL` + `BASE_PATH`
- `sitemap.xml` generado en build
- `robots.txt` con reglas básicas
- Imagen OG por defecto + por proyecto

## 🎯 Rendimiento

- Fuentes WOFF2 locales con `preload`
- CSS único (~40KB gzipped) sin frameworks
- JS modular (~25KB gzipped) sin dependencias
- Imágenes lazy loading nativo (`loading="lazy"`)
- `IntersectionObserver` para animaciones de entrada
- Cache headers via GitHub Pages (inmutable para assets con hash en nombre si se añade build step)

## 📋 Datos Pendientes (Antes de Producción)

### Legales (`privacidad/index.html` — campos `[PENDIENTE]`)
- [ ] Domicilio completo para notificaciones
- [ ] Correo de contacto legal
- [ ] Nombre del responsable de protección de datos
- [ ] Asesoría legal para cumplimiento LFPDPPP

### Contacto (`site.json`)
- [ ] `studio.email` — Correo real del estudio
- [ ] `studio.whatsapp` — Número WhatsApp Business (formato: `https://wa.me/521XXXXXXXXXX`)

### Formspree
- [ ] Crear formulario contacto → `FORMSPREE_ENDPOINT`
- [ ] Crear formulario newsletter → `NEWSLETTER_ENDPOINT` (opcional)

### Imágenes de proyectos reales

Los dos proyectos de ejemplo (`identidad-castroso`, `sistema-editorial`) están marcados como **borradores** (`"published": false`) porque sus imágenes son gráficos generados (`scripts/generate-project-images.mjs`), no fotografías definitivas. No aparecen públicamente.

- [ ] Reemplazar placeholders en `public/assets/images/projects/[slug]/` con fotos reales (cover, 01.jpg..., og.jpg)
- [ ] Actualizar `projects.json` con `cover`, `gallery[]`, `meta.og_image` reales
- [ ] Marcar proyectos reales con `"published": true` para que se generen y publiquen

### Dominio
- [ ] Configurar DNS para `castroso.jpg`
- [ ] Activar HTTPS en GitHub Pages
- [ ] Verificar `CNAME` en repo

## 🧪 Testing Checklist

### Build
- [ ] `npm ci` + `npm run build` → `dist/` generado sin errores
- [ ] `BASE_PATH=/repositorio/ SITE_URL=https://usuario.github.io npm run build` → rutas correctas para GitHub Pages como proyecto
- [ ] `BASE_PATH= SITE_URL=https://castroso.jpg npm run build` → rutas correctas para dominio propio
- [ ] Verificar `dist/assets/` tiene css, js, fonts, icons, images, logos
- [ ] `.nojekyll` presente; `dist/` sin PHP, node_modules, .env

### Páginas
- [ ] `/` — Hero, proyectos, servicios, CTA
- [ ] `/proyectos/` — Filtros, paginación, cards
- [ ] `/proyectos/[slug]/` — Galería, créditos, nav, JSON-LD
- [ ] `/servicios/` — 3 categorías, 13 servicios, acordeones
- [ ] `/estudio/` — Historia, valores, equipo, proceso, stats
- [ ] `/contacto/` — Formulario valida, honeypot, envío demo
- [ ] `/privacidad/` — 11 secciones, `[PENDIENTE]` visibles
- [ ] `/404.html` — Branding, enlaces recuperación

### Assets
- [ ] Fuentes WOFF2 cargan (`/assets/fonts/*.woff2`)
- [ ] Logos SVG escalan correctamente
- [ ] Favicons en `/assets/icons/`
- [ ] OG image 1200×630 en `/assets/images/og-default.jpg`
- [ ] Imágenes proyectos en `/assets/images/projects/[slug]/`

### JavaScript
- [ ] Menú móvil abre/cierra (teclado + click outside + resize)
- [ ] Filtros proyectos funcionan + URL sync
- [ ] Paginación proyectos funciona
- [ ] Lightbox galería (click, teclado, swipe)
- [ ] Formulario valida HTML5 + JS + honeypot
- [ ] Toast mensajes éxito/error
- [ ] Scroll suave anclas
- [ ] Animaciones entrada (IntersectionObserver)
- [ ] `prefers-reduced-motion` desactiva animaciones

### SEO
- [ ] Títulos y descriptions únicos por página
- [ ] Canonical URLs correctas
- [ ] Open Graph / Twitter Cards
- [ ] JSON-LD válido (validar en [schema.org validator](https://validator.schema.org/))
- [ ] `sitemap.xml` incluye todas las URLs
- [ ] `robots.txt` accesible

### GitHub Pages
- [ ] Deploy automático en push a `main` (`.github/workflows/deploy.yml`)
- [ ] Despliegue manual con `workflow_dispatch`
- [ ] Funciona en `https://usuario.github.io/repo/`
- [ ] Funciona en `https://castroso.jpg/` (tras configurar DNS)
- [ ] `.nojekyll` presente; no hay PHP, `.env`, `node_modules`, secretos en `dist/`
- [ ] `CNAME` solo si GitHub Pages lo creó tras configurar el dominio personalizado

## 📝 Licencia

Código: MIT — Identidad visual: propiedad de CASTROSO.JPG (SVG oficiales sin modificar).
Tipografías: Sora y JetBrains Mono bajo SIL Open Font License 1.1 (ver `public/assets/fonts/LICENSE-*.txt`).

## 🤝 Créditos

## 🤝 Créditos

- **Dirección de arte / Diseño / Desarrollo**: Mateo
- **Fotografía / Producción audiovisual**: Santiel
- **Identidad visual**: CASTROSO.JPG (manual oficial)

---

**CASTROSO.JPG — CREA. EXPERIMENTA. COMPARTE.**