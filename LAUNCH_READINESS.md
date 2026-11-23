# Lanzamiento CASTROSO.JPG — Readiness local

**Sitio:** CASTROSO.JPG — Estudio creativo independiente  
**Repositorio:** `castroproh/castroso-web`  
**Rama de trabajo:** `diseno/evolucion-editorial-2026` (7 commits por delante de `origin/main`)  
**Fecha de esta revisión:** 2026-11-23  
**Estado:** build ✅, check ✅, contrato de integración ✅, exportación estática para Pages ✅, QA real con Chromium completada ✅. **Publicación NO realizada.** Producción bloqueada por privacidad, contacto, dominio y autorizaciones humanas.  
**Publicación:** no realizada. No se activó GitHub Pages, no se hizo push/merge y no se configuró ningún endpoint.

---

## 1. Estado real del artefacto

| Elemento | Resultado actual |
|---|---|
| HTML generados | **10** páginas: inicio, proyectos, 2 fichas, servicios, estudio, contacto, privacidad, 404 y 500 |
| URLs en `sitemap.xml` | **7** (la portada, proyectos, servicios, estudio, contacto y 2 fichas) |
| Referencias locales verificadas | **457** |
| Archivos en `dist/` | **61** |
| Tamaño aproximado | **1.8 MB** |
| Base de Pages | `/castroso-web/` |
| Origen | `https://castroproh.github.io` |
| URL local de QA | `http://localhost:8765/castroso-web/` |

La cifra histórica de “11 HTML” no coincide con el build actual; el generador produce 10 HTML. La cifra de 456 referencias también quedó en 457 tras las correcciones de esta revisión.

### Comandos de verificación

```bash
npm run build
npm run check
npm run check:integration
npm run check:pages
# o todo junto:
npm run launch:check
```

Resultados de la última ejecución:

- `npm run check`: 10 HTML, 7 URLs, 457 referencias.
- `npm run check:integration`: 8 campos coinciden con Laravel; consentimiento y honeypot presentes; compuertas de captación protegidas.
- `npm run check:pages`: exportación válida; 10 HTML, 7 URLs, 61 archivos, 1.8 MB; sin PHP, `.env`, bases de datos ni secretos.
- Advertencia esperada: el aviso de privacidad conserva **10 marcadores `[PENDIENTE]`**.

`check:pages` también se ejecutó con el escenario de dominio propio (`castrosojpg.com`, base `/`) y pasó. Esto solo valida el build local; no compra ni configura el dominio.

---

## 2. Correcciones aplicadas en esta revisión

1. **Sitemap coherente con `noindex`:** se retiró `/privacidad/` del sitemap porque la página lleva `noindex` y `robots.txt` la excluye.
2. **JSON-LD corregido:** `Organization` y `WebSite` usan la URL canónica con base `/castroso-web/`, no la raíz del origen.
3. **Búsqueda ficticia eliminada:** se retiró `SearchAction` porque el sitio no tiene búsqueda interna.
4. **Formulario más honesto:** se quitaron las opciones de contacto “WhatsApp” y “Llamada” (no hay teléfono) y “Correo electrónico” como medio preferido (no hay correo comercial confirmado). Quedan “Instagram” y “Sin preferencia”.
5. **Aviso público corregido:** se sustituyó la nota interna “El envío externo solo debe activarse…” por un texto para visitantes que remite a Instagram cuando el envío no está disponible.
6. **Fallback sin JavaScript:** el formulario muestra un `noscript` con enlace a Instagram.
7. **Validador de exportación:** nuevo `scripts/check-pages-export.mjs`, ejecutado con `npm run check:pages`.
8. **Compuerta de despliegue:** el workflow bloquea el deploy si `dist/privacidad/index.html` conserva `[PENDIENTE]`, además de las dos aprobaciones manuales existentes.

Archivos principales modificados: `scripts/build.mjs`, `scripts/check-site.mjs`, `scripts/check-pages-export.mjs` (nuevo), `data/site.json`, `package.json`, `.github/workflows/deploy.yml`, `GUIA_ACTIVAR_PAGES.md` y `GUIA_DOMINIO_CASTROSO_JPG.md`.

---

## 3. QA visual y funcional

Se ejecutó navegador Chromium real vía CDP sobre el build local:

- Páginas: inicio, proyectos, servicios, estudio, contacto, privacidad y 404.
- Resoluciones: **360, 390, 768, 1024 y 1440 px**.
- Total: **35 combinaciones página/viewport**.
- Resultado estructural: **0** desbordamientos horizontales, imágenes rotas, enlaces vacíos, IDs duplicados, saltos de encabezado, botones sin nombre o inputs sin etiqueta.
- Consola: **0** excepciones/errores.
- Formulario: validación de 6 campos obligatorios, consentimiento y honeypot presentes; envío vacío no muestra mensaje; envío completo muestra “El envío de mensajes no está disponible temporalmente…” y **no transmite datos**.
- Configuración del navegador: `contactEndpointsEnabled=false`, `privacyApprovedForBuild=false`, endpoints vacíos, newsletter desactivado.
- Filtros: `all`, `identidad-visual`, `diseno-grafico`, `diseno-editorial`; filtro y restauración funcionan.
- Lightbox: abre, muestra la imagen y cierra.
- Menú móvil: `aria-expanded`, clase `nav-list--open` y bloqueo de scroll funcionan; Escape cierra.
- Privacidad: 10 `[PENDIENTE]`, `noindex` y advertencia visible.

Capturas y datos: `/Users/castrohernandez/CASTROSO_AGENT_REPORTES/qa_visual_2026-11-23/`.

La QA automatizada no sustituye la aprobación visual subjetiva de Mateo/Santiel. Las capturas están disponibles para revisión humana.

---

## 4. Bloqueos de publicación

| Bloqueo | Estado | Responsable |
|---|---|---|
| Aviso de privacidad con 10 `[PENDIENTE]` | Bloqueante legal | Mateo + asesoría legal |
| Sin correo comercial confirmado | Bloqueante de contacto | Mateo |
| Sin teléfono/WhatsApp comercial | No se usa; no inventar | Mateo |
| Sin endpoint de formulario aprobado | Bloqueante de captación | Mateo + revisión técnica/legal |
| Sin autorización de publicación | Bloqueante absoluto | Mateo/adulto responsable |
| Dominio definitivo sin decidir | Bloqueante de dominio | Mateo |
| Rama no fusionada a `main` | Bloqueante de despliegue | Mateo |
| Aprobación visual subjetiva pendiente | Revisión humana | Mateo/Santiel |

`castroso.jpg` **no es un dominio registrable** porque `.jpg` no es un TLD delegado. La marca puede conservar “.JPG”, pero el sitio necesita un dominio real; las alternativas (`castrosojpg.com`, `.mx`, `.studio`, etc.) están sin comprar y sin aprobar.

---

## 5. Publicación (solo con autorización)

El workflow no se dispara con `push`. Se ejecuta manualmente desde **Actions → Build and deploy CASTROSO.JPG → Run workflow**. Para desplegar hacen falta:

1. Input `confirm_production_deploy=true`.
2. Variable de repositorio `RELEASE_APPROVED=true`.
3. Aviso de privacidad sin `[PENDIENTE]`.
4. `npm run launch:check` en verde en el entorno del workflow.

Sin las dos aprobaciones, el workflow construye y valida, pero no despliega. No se debe activar ninguna variable durante esta preparación.

### Dominio propio (cuando exista)

1. Adquirir el dominio con autorización y verificar titularidad.
2. Configurar **Settings → Pages → Custom domain** antes de crear DNS.
3. Crear los registros que GitHub indique para el dominio elegido; no usar comodines.
4. Configurar `CUSTOM_DOMAIN` y ejecutar el workflow en modo build/verificación.
5. Activar **Enforce HTTPS** cuando GitHub confirme el certificado.

La guía detallada está en `GUIA_DOMINIO_CASTROSO_JPG.md`.

---

## 6. Privacidad y captación

- `public_leads.enabled=false`.
- `public_leads.privacy_approved=false`.
- `CONTACT_ENDPOINTS_ENABLED` y `PUBLIC_LEADS_PRIVACY_APPROVED` deben permanecer en `false`.
- El formulario no tiene `action` externo y no envía datos.
- El contacto público disponible es Instagram: `https://www.instagram.com/castroso.jpg/`.
- No se inventaron correos, teléfonos, domicilios, precios, clientes, testimonios ni resultados.

El aviso de privacidad sigue siendo un borrador. No se declara cumplimiento legal. La LFPDPPP vigente (2025) y la autoridad actual deben confirmarse con asesoría legal antes de publicar; no se afirma que el texto actual cumpla.

---

## 7. Limitaciones conocidas de GitHub Pages

- No ejecuta PHP, Laravel ni Python.
- No permite cabeceras HTTP personalizadas desde el repositorio; una CSP por `<meta>` es parcial.
- `500.html` no se sirve automáticamente; solo `404.html` cubre rutas inexistentes.
- El formulario necesita un proveedor externo o backend; sin él no envía.
- Los límites de tamaño y uso son los de GitHub Pages; verificar antes de publicar.
- El panel Laravel requiere hosting compatible aparte.

---

## 8. Decisión pendiente

No publicar, no comprar dominios, no configurar pagos, no enviar mensajes y no activar captación sin autorización expresa de Mateo y del adulto responsable. La revisión legal del aviso de privacidad y la aprobación del endpoint son condiciones previas.
