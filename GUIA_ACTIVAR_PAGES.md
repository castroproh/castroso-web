# Guía — Activar GitHub Pages

Sitio: CASTROSO.JPG · Repositorio: `castroproh/castroso-web`

> **No ejecutes esta guía durante la preparación.** Activar Pages, hacer push o desplegar requiere autorización expresa. Esta guía documenta el procedimiento para cuando exista esa autorización.

## 1. Requisitos previos

- Repositorio en GitHub y rama autorizada para publicar (hoy el trabajo está en `diseno/evolucion-editorial-2026`; la rama de publicación debe decidirse y autorizarse).
- Aviso de privacidad **sin** marcadores `[PENDIENTE]` y revisado por un adulto responsable/asesoría legal.
- Decisión sobre el receptor de formularios (si se activa). Si no existe, el sitio publica el contacto por Instagram y el formulario no envía.
- Ejecutar localmente y obtener todo en verde:

```bash
npm run launch:check
# build + check + contrato web-Laravel + check:pages
```

`check:pages` comprueba que `dist/` no contiene PHP, `.env`, bases de datos, logs, rutas locales ni endpoints de captación. También advierte si el aviso de privacidad sigue en borrador.

## 2. Configurar GitHub Pages

1. Ir a **Settings → Pages**.
2. En **Build and deployment → Source**, elegir **GitHub Actions**.
3. El workflow `.github/workflows/deploy.yml` se detecta automáticamente.
4. Configurar las variables de repositorio en **Settings → Secrets and variables → Actions → Variables** solo cuando corresponda:

| Variable | Uso | Valor seguro actual |
|---|---|---|
| `CUSTOM_DOMAIN` | Dominio propio; si está vacío se usa el sitio de proyecto | vacío |
| `RELEASE_APPROVED` | Segunda compuerta del deploy | vacío / `false` |
| `CONTACT_ENDPOINTS_ENABLED` | Habilita endpoint de contacto | `false` |
| `PUBLIC_LEADS_PRIVACY_APPROVED` | Confirma aviso de privacidad aprobado | `false` |
| `MAIN_LEADS_ENDPOINT` | Endpoint Laravel, solo si ambas compuertas son `true` | vacío |
| `FORMSPREE_ENDPOINT` | Alternativa externa, solo si ambas compuertas son `true` | vacío |

El endpoint `FORMSPREE_ENDPOINT` puede ir como *secret* si se prefiere, pero el build solo lo inyecta cuando `CONTACT_ENDPOINTS_ENABLED=true` **y** `PUBLIC_LEADS_PRIVACY_APPROVED=true`. **No configures estas banderas en `true` antes de la revisión legal.**

> El newsletter permanece desactivado. No hay endpoint de newsletter ni consentimiento secundario independiente en la interfaz.

## 3. Desplegar (solo con autorización)

1. Ejecutar manualmente **Actions → Build and deploy CASTROSO.JPG → Run workflow**.
2. Marcar `confirm_production_deploy=true` únicamente cuando la publicación esté autorizada.
3. El job de deploy solo corre si además `RELEASE_APPROVED=true`.
4. El workflow falla deliberadamente si `dist/privacidad/index.html` conserva `[PENDIENTE]`.
5. Verificar la URL que reporte GitHub Pages.

## 4. Comprobar que funciona

- `https://castroproh.github.io/castroso-web/` carga la portada.
- `/proyectos/`, `/servicios/`, `/estudio/`, `/contacto/`, `/privacidad/` responden.
- Las fichas `/proyectos/identidad-castroso/` y `/proyectos/sistema-editorial/` cargan.
- `/404.html` existe y GitHub Pages la sirve para rutas inexistentes.
- `dist/` contiene `.nojekyll` (desactiva Jekyll).
- `sitemap.xml` contiene 7 URLs y no incluye `/privacidad/` (es `noindex`).
- `robots.txt` apunta al sitemap correcto y excluye privacidad, 404 y 500.
- No hay `node_modules/`, `.env`, PHP, bases de datos ni logs en `dist/`.
- El formulario muestra el aviso de “no disponible” y ofrece Instagram mientras no haya endpoint aprobado.

## 5. Limitaciones conocidas de GitHub Pages

- No ejecuta PHP, Laravel ni Python. El panel Laravel necesita otro hosting.
- No permite configurar cabeceras HTTP personalizadas (CSP, HSTS, etc.) desde el repositorio. Se puede usar un `<meta>` CSP parcial, pero no sustituye cabeceras del servidor.
- `500.html` no se sirve automáticamente en Pages; solo se usa `404.html` para rutas inexistentes.
- Los formularios requieren un servicio externo o backend; sin él, no envían datos.
- El límite de tamaño del sitio y las políticas de uso son los de GitHub Pages; verificar antes de publicar si el sitio crece.

## 6. Rollback

Si algo falla después de un despliegue autorizado:

1. Revertir el commit de publicación en Git (no reescribir historial).
2. Volver a ejecutar el workflow con la versión anterior aprobada.
3. Si el problema es de dominio, corregir DNS y volver a verificar en **Settings → Pages**.
4. No desactivar HTTPS ni borrar el sitio como primera medida.
