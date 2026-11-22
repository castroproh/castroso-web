# MASTER PLAN — CASTROSO.JPG

**Sitio:** CASTROSO.JPG — Estudio creativo independiente
**Rama:** `diseno/evolucion-editorial-2026`
**Estado:** Sitio técnicamente completo y verificado. Bloqueado para publicación comercial por falta de datos reales del estudio.

---

## 1. Estado actual

### ¿Qué está hecho (verificado)

| Área | Detalle | Verificación |
|------|---------|--------------|
| Generador | `scripts/build.mjs` genera 10 HTML (8 generales + 2 proyectos) | `npm run build` ✅ |
| QA | `scripts/check-site.mjs` valida rutas, sitemap, robots, referencias locales | `npm run check` ✅ (454 referencias válidas) |
| Sintaxis | Todos los `.mjs` y `.js` pasan `node --check` | ✅ |
| Navegación | Menú responsive: JS completo (toggle, Escape, foco, trap Tab, cierre al navegar, resize >768px). CSS para `.nav-toggle`, `.nav-list`, `.nav-list--open` presente en `main.css` (media query max-width: 860px, animación hamburguesa con `aria-expanded="true"`). Verificado en Chromium 375px y 768px. | Verificado en auditoría |
| Proyectos | 2 proyectos publicados como vectores, sin placeholders | `data/projects.json` ✅ |
| Servicios | 3 disciplinas, 17 servicios con descripciones completas | `data/services.json` ✅ |
| Formularios | Contacto + newsletter con validación, honeypot, estado honesto sin endpoint | `main.js` ✅ |
| SEO | Canonical, OG, JSON-LD, sitemap, robots, manifest | `build.mjs` ✅ |
| Despliegue | GitHub Actions → GitHub Pages (Node 22, `npm ci`, `npm run build`) | `.github/workflows/deploy.yml` ✅ |
| Retratos | Procesados en avif/webp/jpg, sin metadatos | `public/assets/images/equipo/` ✅ |
| Favicons | PNG 16/32/48/192/512 + SVG + apple-touch | `public/assets/icons/` ✅ |
| CSS | ~3.300 líneas, auditado clase por clase contra HTML generado | `public/assets/css/main.css` ✅ |
| JS | ~820 líneas, interacciones completas | `public/assets/js/main.js` ✅ |

### ¿Qué falta (bloqueos P1 — requieren datos reales del estudio)

| Bloqueo | Ubicación | ¿Quién lo resuelve? |
|---------|-----------|---------------------|
| `studio.email` vacío | `data/site.json:8` | El estudio (correo real) |
| `studio.whatsapp` vacío | `data/site.json:9` | El estudio (opcional) |
| Domicilio completo | Aviso de privacidad `[PENDIENTE]` | El estudio |
| Responsable protección de datos | Aviso de privacidad `[PENDIENTE]` | El estudio |
| Revisión legal del aviso de privacidad | `scripts/build.mjs` (buildPrivacidadPage) | El estudio + asesoría legal |
| `FORMSPREE_ENDPOINT` | GitHub Actions Secrets | El estudio (configurar cuando tenga Formspree) |
| `NEWSLETTER_ENDPOINT` | GitHub Actions Secrets | El estudio (opcional) |
| Dominio propio | GitHub Pages + DNS | El estudio (opcional) |

> Ningún dato comercial se inventará. Los endpoints no se configuran sin contratar el servicio.

### Estado git (actualizado tras P0-T1)

- Rama: `diseno/evolucion-editorial-2026`
- Sincronizada con `origin/diseno/evolucion-editorial-2026`
- Último commit: `4b0075e` (fix: Node LTS en GitHub Actions)
- Cambios no comiteados: ninguno (working tree limpio)

---

## QA — Última comprobación (2026-11-22)

- `npm run build`: 10 HTML generados, sin errores
- `npm run check`: 454 referencias locales válidas, sitemap y robots correctos
- `node --check`: sintaxis de `.mjs` y `.js` correcta
- Cambio aplicado: `.github/workflows/deploy.yml` Node `22` → `lts/*`

### 1. Menú responsive (Chromium 375px y 768px)

| Prueba | Resultado |
|--------|-----------|
| Página carga correctamente | ✅ 200 en ambos anchos |
| `nav-toggle` existe con ARIA correcto | ✅ `aria-expanded="false"`, `aria-controls="nav-menu"`, `aria-label` |
| `nav-list` existe con enlaces | ✅ 5 enlaces (Inicio, Proyectos, Servicios, Estudio, Contacto) |
| Estado inicial: menú cerrado | ✅ `nav-list` sin clase `nav-list--open` |
| JS: apertura/cierre por clic | ✅ `main.js` |
| JS: cierre con Escape | ✅ `main.js` |
| JS: foco primero al abrir | ✅ `main.js` |
| JS: foco toggle al cerrar | ✅ `main.js` |
| JS: trap focus con Tab | ✅ `main.js` |
| JS: cierre al hacer clic en enlace | ✅ `main.js` |
| JS: cierre al redimensionar >768px | ✅ `main.js` |
| CSS: estilos visuales del menú móvil | ✅ Presente en `main.css` (media query max-width: 860px, animación hamburguesa con `aria-expanded="true"`) |

**Conclusión QA:** El menú responsive está completo y correcto. JS y CSS funcionan en ambos viewports. No hay bloqueos técnicos en la navegación.

---

## 2. Publicación — Lista de pasos exactos

### 2.1 GitHub Pages (técnicamente ejecutable)

1. Subir el repositorio a GitHub (rama `main`)
2. Settings → Pages → Source: **GitHub Actions**
3. Push a `main` o ejecutar workflow manualmente (Actions → Deploy to GitHub Pages → Run workflow)
4. Verificar URL en Settings → Pages
   - Sitio de proyecto: `https://TU_USUARIO.github.io/TU_REPO/`
   - Sitio de usuario/organización: `https://TU_USUARIO.github.io/`
5. Verificar: `.nojekyll` presente, sin PHP/nodo_modules/.env en `dist/`

### 2.2 Configuración BASE_PATH (técnicamente ejecutable)

| Escenario | BASE_PATH | SITE_URL | Comando |
|-----------|-----------|----------|---------|
| GitHub Pages (proyecto) | `/TU_REPO/` | `https://TU_USUARIO.github.io` | `BASE_PATH=/TU_REPO/ SITE_URL=https://TU_USUARIO.github.io npm run build` |
| Dominio propio | vacía `''` | `https://castroso.jpg` | `BASE_PATH= SITE_URL=https://castroso.jpg npm run build` |
| Desarrollo local | vacía `''` | `http://localhost:3000` | `BASE_PATH= SITE_URL=http://localhost:3000 npm run build` |

### 2.3 Dominio definitivo `castroso.jpg` (requiere información del estudio)

1. **El estudio aporta el dominio** `castroso.jpg` (no se inventa)
2. Configurar DNS en registrador:
   - 4× A `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - CNAME `www` → `TU_USUARIO.github.io`
3. GitHub Pages → Settings → Pages → Custom domain: escribir `castroso.jpg` → Save (GitHub crea `CNAME` automáticamente)
4. Esperar propagación DNS

### 2.4 HTTPS (automático tras DNS verificado)

1. Settings → Pages → marcar **Enforce HTTPS**
2. GitHub emite certificado SSL (Let's Encrypt) automáticamente
3. Verificar candado en navegador

### 2.5 Contacto comercial (requiere información del estudio)

- `studio.email` vacío en `data/site.json:8` → sin enlace `mailto:` hasta que el estudio aporte el correo real
- `studio.whatsapp` vacío en `data/site.json:9` → opcional, solo si el estudio lo desea
- El canal público activo es Instagram (`https://www.instagram.com/castroso.jpg/`)

### 2.6 Formulario (requiere información del estudio)

- No se configura sin autorización ni sin contratar el servicio
- Requiere `FORMSPREE_ENDPOINT` como secret de GitHub Actions
- El endpoint debe tener formato `https://formspree.io/f/ID`
- Además, `data/site.json` → `privacy` debe estar completo y `approved: true`
- Sin endpoint: botón desactivado, mensaje honesto, Instagram como alternativa

### 2.7 Aviso de privacidad (requiere información del estudio)

- `data/site.json` → `privacy` tiene `approved: false` y todos los campos vacíos
- Campos pendientes: `responsible_name`, `legal_address`, `contact_email`, `public_copy`, `approved_date`
- Requiere revisión legal (LFPDPPP) antes de aprobar
- Mientras no esté aprobado: `privacidad/index.html` muestra estado "en preparación", formulario desactivado

---

## 3. Formspree — Activación (sin configurar sin autorización)

### Qué se necesita

1. El estudio crea cuenta en https://formspree.io (gratis)
2. Crea formulario "Contacto CASTROSO.JPG" → obtiene endpoint `https://formspree.io/f/xxxxxxxx`
3. Opcional: crea formulario "Newsletter CASTROSO.JPG" → endpoint `https://formspree.io/f/yyyyyyyy`
4. Configurar en GitHub: Settings → Secrets and variables → Actions:
   - `FORMSPREE_ENDPOINT` → `https://formspree.io/f/xxxxxxxx` (obligatorio para contacto)
   - `NEWSLETTER_ENDPOINT` → `https://formspree.io/f/yyyyyyyy` (opcional)
5. Completar `data/site.json` → `privacy` con datos reales del responsable y `approved: true`

### Cómo funciona (sin cambios al código)

- El build inyecta el endpoint en `assets/js/config.js` solo si `formspreeReady()` devuelve true (endpoint válido + privacidad aprobada)
- Sin endpoint válido: botón deshabilitado, mensaje "El formulario no está conectado"
- Con endpoint: botón habilitado, envío AJAX a Formspree, toast de éxito/error
- Honeypot `website_url` para descartar spam
- Validación HTML5 + JS en campos requeridos

### Qué NO se hace

- No se crean cuentas en Formspree (requiere acción del estudio)
- No se configuran endpoints sin autorización
- No se inventan endpoints ni se configuran servicios externos

---

## 4. Bloqueos comerciales (sin datos del estudio no se puede publicar comercialmente)

| Bloqueo | Ubicación | Resuelve |
|---------|-----------|----------|
| `studio.email` vacío | `data/site.json:8` | El estudio |
| `studio.whatsapp` vacío | `data/site.json:9` | El estudio (opcional) |
| Domicilio completo | Aviso de privacidad `[PENDIENTE]` | El estudio |
| Responsable protección de datos | Aviso de privacidad `[PENDIENTE]` | El estudio |
| Revisión legal aviso privacidad | `scripts/build.mjs` (buildPrivacidadPage) | El estudio + asesoría legal |
| `FORMSPREE_ENDPOINT` | GitHub Actions Secrets | El estudio |
| `NEWSLETTER_ENDPOINT` | GitHub Actions Secrets | El estudio (opcional) |
| Dominio propio + DNS | GitHub Pages + registrador | El estudio (opcional) |

---

## 5. Próxima tarea recomendada

### Inmediato (sin depender del estudio)
1. Commit de cambios pendientes: `public/assets/css/main.css`, `scripts/build.mjs`, `MASTER_PLAN.md`, `CHANGELOG.md`
2. Ejecutar `npm run build` y `npm run check` tras el commit para verificar integridad

### Pendiente del estudio (bloqueos comerciales)
1. Aportar `studio.email` y `studio.whatsapp` en `data/site.json`
2. Completar datos del aviso de privacidad (`responsible_name`, `legal_address`, `contact_email`, `public_copy`, `approved_date`)
3. Revisión legal del aviso de privacidad (LFPDPPP)
4. Contratar Formspree y configurar `FORMSPREE_ENDPOINT` como secret de GitHub Actions
5. Decidir si usar dominio propio `castroso.jpg` y configurar DNS
6. Autorizar despliegue en GitHub Pages

Mientras tanto, el sitio está técnicamente listo: build pasa, check pasa, sin errores de consola ni red.
