# PENDIENTES DE PUBLICACIÓN — CASTROSO.JPG

**Fecha:** 2026-11-17
**Alcance:** datos que faltan para producción y que **no se han inventado** en el repositorio.
**Estado actual:** sitio estático completo y funcional; sin estos datos, algunas funciones se omiten o muestran un aviso en lugar de simular éxito.

---

## 1. Datos del estudio (`data/site.json`)

| Campo | Valor actual | Efecto | Cómo completar |
|-------|--------------|--------|----------------|
| `studio.email` | `""` (vacío) | No se renderiza enlace `mailto:` en footer ni en contacto. | Escribir el correo real en `data/site.json`. |
| `studio.whatsapp` | `""` (vacío) | No se renderiza enlace de WhatsApp. | Escribir `https://wa.me/521XXXXXXXXXX` en `data/site.json`. |
| `studio.instagram` | `https://www.instagram.com/castroso.jpg/` | ✅ Funcional. | — |
| `studio.location` | `Culiacán, Sinaloa, México` | ✅ Funcional. | — |

> Si se añaden otros perfiles (Behance, LinkedIn, TikTok, YouTube), agregarlos en `site.json` y en el footer/estudio.

## 2. Formularios

| Elemento | Estado actual | Acción |
|----------|---------------|--------|
| Formulario de contacto | Sin endpoint. Al enviar muestra: “El envío de mensajes no está disponible temporalmente. Escríbenos por Instagram mientras lo habilitamos.” **No simula éxito.** | Crear formulario en Formspree → copiar endpoint → añadir **GitHub Actions Secret** `FORMSPREE_ENDPOINT`. Ver `GUIA_FORMSPREE.md`. |
| Newsletter | `action="#"`, sin endpoint. Muestra aviso y enlace a Instagram. | Opcional. Añadir secret `NEWSLETTER_ENDPOINT` si se decide activar. |

- Honeypot configurado: campo `website_url` (`contact.honeypot_field`).
- Mensajes configurables: `contact.success_message` / `contact.error_message`.

## 3. Aviso de privacidad (`/privacidad/`)

Campos marcados visiblemente con `[PENDIENTE]` que requieren revisión legal (LFPDPPP, México):

- [ ] **Domicilio completo** para notificaciones.
- [ ] **Correo de contacto legal**.
- [ ] **Responsable de protección de datos** (nombre).
- [ ] Revisión y validación final del texto por asesoría legal.

Ubicación en código: `scripts/build.mjs` → `buildPrivacidadPage()` (líneas con `[PENDIENTE]`).

## 4. Contenido visual

| Elemento | Estado actual | Acción (opcional) |
|----------|---------------|-------------------|
| Portadas de proyectos | Originales vectoriales (SVG) de cada proyecto, mostrados con `object-fit: contain` y nota de que son piezas gráficas, no fotografías. | Si se dispone de fotos/mockups reales, sustituir `cover`, `gallery[]` y `meta.og_image` en `data/projects.json`. |
| Imágenes de equipo | Iniciales sobre fondo (sin fotos). | Opcional: aportar retratos reales. |
| OG default | `/assets/images/og-default.jpg` generado. | ✅ Listo. |

## 5. Dominio y despliegue

| Elemento | Estado | Acción |
|----------|--------|--------|
| Repositorio | `castroproh/castroso-web`, rama `main`. | — |
| GitHub Pages | Workflow `deploy.yml` (Node 22, `npm ci`, `npm run build`, `deploy-pages`). | Activar Pages → GitHub Actions. Ver `GUIA_ACTIVAR_PAGES.md`. |
| `BASE_PATH` / `SITE_URL` | Se derivan de secrets/variables del workflow (`/castroso-web/`, `https://castroproh.github.io`). | Ajustar si cambia el nombre del repo. |
| Dominio `castroso.jpg` | Sin `CNAME`. | Opcional: configurar DNS + HTTPS y `CUSTOM_DOMAIN`. Ver `GUIA_DOMINIO_CASTROSO_JPG.md`. |

## 6. Verificaciones pendientes de credenciales

No fue posible validar en entorno real (requieren credenciales):

- Envío real del formulario con `FORMSPREE_ENDPOINT` configurado.
- Envío real del newsletter con `NEWSLETTER_ENDPOINT` configurado.
- Dominio propio y certificado HTTPS.

---

**Nota:** el build y las interacciones locales (menú, filtros, validación, estados sin endpoint) están verificados con Chrome headless y `npm ci`/`npm run build` en Node v26.8.1. Ver `INFORME_REDISENO.md`.