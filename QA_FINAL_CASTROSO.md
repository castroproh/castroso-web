# QA FINAL — CASTROSO.JPG

**Proyecto:** CASTROSO.JPG — Sitio estático para GitHub Pages  
**Fase:** 5 — QA definitivo  
**Fecha:** 2026-11-22  
**Rama:** `diseno/evolucion-editorial-2026`  
**Commits:** 6 commits (4b0075e → a2c3aac)  
**Estado:** Build y check pasan. Sin despliegue.  
**Limitación:** Chromium no disponible en este entorno para pruebas visuales en navegador real.

---

## 1. RESULTADO DE BUILD Y CHECK

| Prueba | Comando | Resultado |
|--------|---------|-----------|
| Build | `npm run build` | ✅ 10 HTML generados sin errores |
| Check | `npm run check` | ✅ 455 referencias locales válidas, sitemap y robots correctos |
| Sintaxis JS | `node --check scripts/build.mjs` | ✅ Correcto |
| Sintaxis JS | `node --check public/assets/js/main.js` | ✅ Correcto |

**Páginas generadas (10):**

| Página | URL | Estado |
|--------|-----|--------|
| Inicio | `/` | ✅ Generada |
| Proyectos | `/proyectos/` | ✅ Generada |
| Proyecto: Identidad visual | `/proyectos/identidad-castroso/` | ✅ Generada |
| Proyecto: Sistema editorial | `/proyectos/sistema-editorial/` | ✅ Generada |
| Servicios | `/servicios/` | ✅ Generada |
| Estudio | `/estudio/` | ✅ Generada |
| Contacto | `/contacto/` | ✅ Generada |
| Privacidad | `/privacidad/` | ✅ Generada |
| 404 | `/404.html` | ✅ Generada |
| 500 | `/500.html` | ✅ Generada |

**Assets técnicos:** sitemap.xml, robots.txt, manifest.json, .nojekyll, config.js — todos generados correctamente.

---

## 2. RESULTADO POR PÁGINA

### Inicio (`/`)
- **Hero:** Título principal con tipografía Sora, kicker, descripción, CTA primario "Cuéntanos tu proyecto" (btn-primary btn-lg), CTA secundario "Ver el archivo" (link-arrow), 3 disciplinas listadas.
- **Manifiesto:** Sección con texto editorial, índice lateral, enlace al estudio.
- **Proyectos destacados:** 2 proyectos con tarjetas, enlace "Ver todos".
- **Servicios preview:** 3 disciplinas con filas tipo índice, conteo de servicios.
- **Estudio teaser:** 2 miembros del equipo con retratos reales, enlace "Conoce al equipo".
- **Cómo empezar (NUEVO):** 3 pasos (Contacto, Propuesta, Producción) con enlace "Iniciar una conversación".
- **CTA final:** Sección azul con "¿Hacemos algo que se recuerde?", botón "Empezar un proyecto", meta datos del estudio.
- **Ticker:** Cinta horizontal con disciplinas del estudio.

**Verificación:** Todos los elementos presentes en el HTML generado. CSS correspondiente verificado en `main.css` (líneas 1599-1650).

### Proyectos (`/proyectos/`)
- Page hero con conteo de proyectos y año.
- Toolbar con filtros (solo si hay ≥3 proyectos; actualmente 2 proyectos, filtros no aparecen — comportamiento correcto).
- Grid de tarjetas de proyecto (2 columnas en escritorio, 1 en móvil).
- Estado vacío si no hay proyectos.
- Paginación oculta si hay <9 proyectos (comportamiento honesto).

### Detalle de proyecto (`/proyectos/[slug]/`)
- Breadcrumb: Inicio / Proyectos / [Título].
- Categoría, título, año, disciplinas, meta (año, categoría, disciplinas).
- Cover de proyecto con badge si es vectorial.
- Caso de estudio con capítulos dinámicos (Introducción, Objetivo, Concepto, Dirección visual, Desarrollo, Aplicaciones, Resultado).
- Galería con lightbox.
- Créditos del proyecto.
- CTA "Quiero algo así" → contacto con categoría pre-seleccionada.
- Navegación prev/next entre proyectos.
- Enlace "Volver al archivo".

### Servicios (`/servicios/`)
- Page hero con conteo total de servicios y disciplinas.
- Índice de disciplinas con navegación por anclas.
- 3 capítulos: Diseño gráfico, Fotografía, Audiovisual.
- Cada servicio con: código, nombre, modalidad, descripción, "Qué incluye" (acordeón), ejemplos, CTA "Cotizar" con `servicio_especifico` en URL.
- CTA final "Solicitar cotización".

### Estudio (`/estudio/`)
- Page hero con título, lead, ubicación.
- Diptico con retratos de Mateo y Santiel (fotos reales).
- Historia del estudio en 3 párrafos.
- Valores: 4 valores con índice numérico.
- Equipo: 2 miembros con nombre, roles, descripción, retrato real.
- Proceso: 4 pasos (Descubrimiento, Concepto, Producción, Entrega).
- Stats: 2 integrantes, 3 disciplinas, 13 servicios, ∞ posibilidades.

### Contacto (`/contacto/`)
- Page hero con subtítulo y nota sobre Instagram.
- Aside con métodos de contacto: Instagram (siempre), Correo (si `studio.email`), WhatsApp (si `studio.whatsapp`), ubicación Culiacán.
- Enlaces rápidos a disciplinas de servicio.
- Formulario con 8 campos: nombre, email, proyecto, servicio, presupuesto, descripción, fecha estimada, medio contacto.
- Honeypot `website_url` presente.
- Validación HTML5 + JS en tiempo real.
- Botón de envío con estado de carga.
- Mensaje honesto si no hay `FORMSPREE_ENDPOINT` configurado.
- Pre-llenado de servicio por URL (`?servicio=` y `?servicio_especifico=`).

### Privacidad (`/privacidad/`)
- Aviso importante con campos `[PENDIENTE]` visibles.
- 11 secciones del aviso LFPDPPP.
- Estado "en preparación" honesto.
- No se inventan datos legales.

### 404 (`/404.html`)
- Código de error grande, título, descripción.
- Botones: "Volver al inicio", "Ver proyectos".
- Branding consistente.

### 500 (`/500.html`)
- Código de error 500, título, descripción.
- Nota sobre GitHub Pages como sitio estático.
- Botones de recuperación.

---

## 3. RESULTADO POR RESOLUCIÓN

**Limitación:** Chromium no disponible en este entorno para pruebas visuales en navegador real. Las siguientes verificaciones se realizaron mediante análisis estático del CSS y HTML generado.

### Breakpoints CSS implementados

| Breakpoint | Uso | Verificado |
|------------|-----|------------|
| 1024px | Tablet landscape / escritorio pequeño | ✅ En múltiples componentes |
| 860px | Menú móvil, hero | ✅ Nav-toggle, nav-list, hero |
| 768px | Tablet portrait | ✅ Contacto, estudio, procesos, stats |
| 640px | Móvil grande | ✅ Section-head, contacto, valores, proceso, stats, cómo empezar |
| 560px | Móvil medio | ✅ Disciplinas, footer, servicios, caso de estudio |
| 480px | Móvil pequeño | ✅ Hero portraits, hero actions |

### Componentes responsive verificados

| Componente | Escritorio (≥1024px) | Tablet (768-1024px) | Móvil (<768px) |
|------------|---------------------|---------------------|-----------------|
| Menú navegación | Horizontal, 5 enlaces | Horizontal | Menú hamburguesa fijo, trap focus |
| Hero | 2 columnas (texto + retratos) | 2 columnas ajustadas | 1 columna, retratos apilados |
| Cómo empezar | 3 columnas (steps-grid) | 2 columnas | 1 columna |
| Proyectos | Grid automático | Grid automático | 1 columna |
| Servicios | 3 columnas índice | Índice adaptado | 1 columna índice |
| Contacto | 2 columnas (aside + form) | 1 columna | 1 columna |
| Estudio | Diptico 2 columnas | Diptico 2 columnas | 1 columna, retratos apilados |
| Footer | 4 columnas | 2 columnas | 1 columna |

### Posibles problemas visuales (no verificados en navegador real)

| Problema | Probabilidad | Mitigación |
|----------|-------------|------------|
| Desbordamiento en 320px | Baja | `--gutter: clamp(1.15rem, 4vw, 3rem)` se adapta |
| Texto cortado en hero (4.2rem en móvil) | Baja | `clamp()` usado en títulos |
| Botones difíciles de pulsar | Baja | Padding mínimo 0.9rem 1.6rem, touch target ≥44px implícito |

**Recomendación:** Verificar visualmente en Chromium real antes del despliegue en las 7 resoluciones solicitadas (320, 375, 390, 768, 1024, 1280, 1440px).

---

## 4. PRUEBAS FUNCIONALES

### Enlaces internos
| Tipo | Estado | Verificación |
|------|--------|--------------|
| Navegación principal | ✅ | 5 enlaces con `aria-current="page"` en activo |
| Enlaces footer | ✅ | Índice, disciplinas, contacto, privacidad |
| Enlaces de servicio → contacto | ✅ | Con `?servicio=` y `?servicio_especifico=` |
| Enlaces de proyecto → contacto | ✅ | Con `?servicio=` (categoría del proyecto) |
| Enlaces prev/next proyecto | ✅ | Solo si hay proyecto anterior/siguiente |
| Enlaces redes sociales | ✅ | Instagram con `target="_blank" rel="noopener noreferrer"` |
| Enlaces mailto: | ⚠️ | Solo si `studio.email` está configurado (vacío) |
| Enlaces WhatsApp | ⚠️ | Solo si `studio.whatsapp` está configurado (vacío) |

### Menú de navegación
| Función | Estado | Implementación |
|---------|--------|----------------|
| Toggle abrir/cerrar | ✅ | JS `initMobileNav()`, `aria-expanded` |
| Cierre con Escape | ✅ | `handleKeydown()` |
| Trap focus (Tab) | ✅ | Primer/último elemento enfocable |
| Cierre al clic en enlace | ✅ | Cada enlace llama `closeMenu()` |
| Cierre al resize >768px | ✅ | `handleResize()` debounced |
| Foco primero al abrir | ✅ | `setTimeout` 100ms, primer enlace |

### Filtros de proyectos
| Función | Estado |
|---------|--------|
| Filtrar por categoría | ✅ (no aparece con <3 proyectos, comportamiento correcto) |
| Sincronización URL | No implementada (no requerida con pocos proyectos) |

### Paginación
| Función | Estado |
|---------|--------|
| Paginación proyectos | ✅ Renderizada pero oculta (`hidden`) con <9 proyectos |

### Lightbox
| Función | Estado |
|---------|--------|
| Abrir galería | ✅ Click en `.gallery-link` o `[data-lightbox] img` |
| Navegar prev/next | ✅ Botones con flechas |
| Cerrar con Escape | ✅ `handleLightboxKeydown()` |
| Cerrar con clic fuera | ✅ Overlay con `data-lightbox-close` |
| Foco en cierre | ✅ Botón de cierre recibe foco |

### Formulario de contacto
| Función | Estado |
|---------|--------|
| Validación HTML5 | ✅ `required` en campos obligatorios |
| Validación JS en tiempo real | ✅ `blur` y `input` events |
| Honeypot | ✅ Campo `website_url` oculto |
| Pre-llenado servicio por URL | ✅ `servicio` y `servicio_especifico` |
| Estado de carga al enviar | ✅ Spinner + `disabled` |
| Mensaje sin endpoint | ✅ Advertencia honesta, no simula éxito |
| Toast éxito/error | ✅ `form-status` con `aria-live="polite"` |

---

## 5. ACCESIBILIDAD (WCAG 2.2 AA)

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Skip to content | ✅ | `.skip-link` en todas las páginas |
| Semántica HTML5 | ✅ | `header`, `nav`, `main`, `footer`, `article`, `section`, `aside` |
| ARIA labels | ✅ | Navegación, formularios, lightbox, paginación |
| `aria-current="page"` | ✅ | Enlace activo en menú |
| `aria-expanded` | ✅ | Botón menú móvil |
| `aria-controls` | ✅ | Botón menú → nav-menu |
| `aria-labelledby` | ✅ | Todas las secciones con título |
| `aria-describedby` | ✅ | Campos con errores de validación |
| `aria-invalid` | ✅ | Campos de formulario |
| `aria-live="polite"` | ✅ | `form-status` para mensajes |
| Focus visible | ✅ | `:focus-visible` con outline azul eléctrico |
| Contraste WCAG AA | ✅ | Negro carbón (#08090B) + blanco papel (#F2F0EA) |
| `prefers-reduced-motion` | ✅ | Animaciones desactivadas |
| `lang="es-MX"` | ✅ | En `<html>` |
| `alt` en imágenes | ✅ | Descriptivo en contenido, vacío en decorativas |
| `aria-hidden="true"` | ✅ | Elementos decorativos (isotipo footer, iconos) |
| Touch target ≥44px | ⚠️ | No medido en navegador real |

### Accesibilidad pendiente (requiere verificación en navegador real)

| Elemento | Acción |
|----------|--------|
| Navegación por teclado completa | Verificar en Chromium real |
| Lectores de pantalla | Verificar con NVDA/JAWS/VoiceOver |
| Contraste exacto | Verificar con herramienta de contraste |
| Focus visible en todos los elementos | Verificar en navegador real |

---

## 6. SEGURIDAD

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Secretos expuestos | ✅ | No hay API keys, secretos ni .env en `dist/` |
| `FORMSPREE_ENDPOINT` | ✅ | Empty string, no expuesto |
| `NEWSLETTER_ENDPOINT` | ✅ | Empty string, no expuesto |
| Honeypot | ✅ | Campo `website_url` en formulario |
| Validación de entrada | ✅ | HTML5 + JS en campos requeridos |
| `rel="noopener noreferrer"` | ✅ | En todos los enlaces `target="_blank"` |
| CSP | ⚠️ | No implementada (no requerida para sitio estático simple) |
| HTTPS | ⚠️ | Gestionado por GitHub Pages, no por el código |
| Dependencias | ✅ | Solo font-source, sharp, serve (devDependencies) |
| No se expone `node_modules` | ✅ | No copiado a `dist/` |
| No se expone `.env` | ✅ | No existe en el repositorio |

---

## 7. RENDIMIENTO

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Fuentes WOFF2 locales | ✅ | Sora + JetBrains Mono con `font-display: swap` |
| Preload de fuentes | ✅ | `rel="preload"` en `<head>` |
| CSS único | ✅ | ~3.400 líneas, sin frameworks |
| JS vanilla | ✅ | ~820 líneas, sin dependencias de runtime |
| Imágenes lazy loading | ✅ | `loading="lazy"` en imágenes |
| `loading="eager"` en cover | ✅ | Solo en cover de proyecto (viewport inmediato) |
| IntersectionObserver | ✅ | Animaciones de entrada solo al entrar en viewport |
| `.nojekyll` | ✅ | Desactiva Jekyll en GitHub Pages |
| manifest.json (PWA) | ✅ | `display: standalone` |
| sitemap.xml | ✅ | 8 URLs con prioridades y changefreq |
| robots.txt | ✅ | Reglas correctas, barras presentes |

---

## 8. ERRORES ENCONTRADOS

### Corregidos en esta sesión

| # | Error | Severidad | Corrección | Archivo |
|---|-------|-----------|------------|---------|
| 1 | Node version desalineada (22 en CI vs 26 local) | Medio | Cambiado a `lts/*` | `.github/workflows/deploy.yml` |

### No corregidos (requieren datos del estudio)

| # | Problema | Severidad | Ubicación | Por qué no se corrige |
|---|----------|-----------|-----------|----------------------|
| 1 | `studio.email` vacío | Alto | `data/site.json:8` | Requiere correo real del estudio |
| 2 | `studio.whatsapp` vacío | Medio | `data/site.json:9` | Requiere número real |
| 3 | `FORMSPREE_ENDPOINT` no configurado | Alto | GitHub Actions Secrets | Requiere cuenta Formspree |
| 4 | Privacidad LFPDPPP incompleta | Alto | `data/site.json:privacy` | Requiere datos legales + asesoría |
| 5 | Dominio `castroso.jpg` no configurado | Medio | Externo | Requiere DNS + GitHub Pages |

### No verificados (Chromium no disponible)

| # | Problema | Severidad | Nota |
|---|----------|-----------|------|
| 1 | Desbordamientos visuales | Medio | No se pudo probar en navegador real |
| 2 | Textos cortados | Bajo | `clamp()` mitigado, pero no verificado |
| 3 | Touch targets | Bajo | No medido en dispositivo real |
| 4 | Contraste exacto | Bajo | Colores WCAG AA teóricamente, no verificados |

---

## 9. CORRECCIONES NECESARIAS

### Inmediatas (sin depender del estudio)

Ninguna crítica pendiente. Todos los cambios de código están implementados y verificados.

### Pendientes del estudio (bloqueos comerciales)

| # | Acción | Responsable | Estimado |
|---|--------|-------------|----------|
| 1 | Aportar `studio.email` en `data/site.json` | El estudio | 15 min |
| 2 | Aportar `studio.whatsapp` en `data/site.json` | El estudio | 15 min |
| 3 | Completar privacidad LFPDPPP | El estudio + legal | 1-2 semanas |
| 4 | Contratar Formspree + configurar `FORMSPREE_ENDPOINT` | El estudio | 1 hora |
| 5 | Configurar dominio `castroso.jpg` (DNS + GitHub Pages) | El estudio | 1-3 días |
| 6 | Verificación visual en Chromium (7 resoluciones) | QA | 2 horas |

---

## 10. DICTAMEN FINAL

### Clasificación general

| Área | Puntuación | Estado |
|------|-----------|--------|
| Build y generación | 10/10 | ✅ Aprobado |
| Referencias locales (check) | 10/10 | ✅ Aprobado |
| Sintaxis JS | 10/10 | ✅ Aprobado |
| SEO (meta, JSON-LD, sitemap, robots) | 9/10 | ✅ Aprobado |
| Accesibilidad (estructural) | 9/10 | ✅ Aprobado (pendiente verificación en navegador) |
| Seguridad | 9/10 | ✅ Aprobado |
| Rendimiento | 9/10 | ✅ Aprobado |
| Responsive CSS | 8/10 | ⚠️ Aprobado teóricamente, pendiente verificación visual |
| Conversión (CRO) | 7/10 | ✅ Mejoras implementadas, pendiente datos del estudio |
| Comercial (formulario funcional) | 3/10 | ⚠️ Bloqueado por `FORMSPREE_ENDPOINT` y datos de contacto |

**Puntuación global: 8.1/10**

### Veredicto

**EL SITIO ESTÁ TÉCNICAMENTE LISTO PARA DESPLIEGUE.** Todos los tests de build, check y sintaxis pasan. El código es limpio, consistente y seguro.

**NO ESTÁ COMERCIALMENTE LISTO** hasta que el estudio aporte:
1. Correo electrónico real (`studio.email`)
2. Datos legales del aviso de privacidad (LFPDPPP)
3. Endpoint de Formspree configurado
4. (Opcional) WhatsApp y dominio propio

### Recomendación de próximo paso

1. **Verificación visual en Chromium real** en las 7 resoluciones solicitadas (320, 375, 390, 768, 1024, 1280, 1440px) antes del despliegue.
2. **El estudio aporta los datos bloqueantes** (email, privacidad, Formspree).
3. **Despliegue en GitHub Pages** tras autorización explícita.

**No se ha realizado push ni despliegue.** Todos los cambios están en la rama local `diseno/evolucion-editorial-2026`, 6 commits adelante de origin.

---

**— Fin del QA final —**

*Este informe se basa en análisis estático del código generado. Las pruebas visuales en navegador real (Chromium) no pudieron ejecutarse debido a que Chromium no está disponible en este entorno.*