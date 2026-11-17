# Guía — Activar GitHub Pages

Sitio: CASTROSO.JPG

## Requisito previo
Repositorio subido a GitHub (ver `GUIA_REPOSITORIO_GITHUB.md`) y al menos un push a la rama `main`.

## Pasos

1. **Ir a Settings → Pages**
   - En tu repositorio de GitHub: Settings → Pages (menú lateral, sección Code and automation)

2. **Elegir fuente de despliegue**
   - Build and deployment → Source: **GitHub Actions**
   - El workflow `.github/workflows/deploy.yml` se detecta automáticamente

3. **Desplegar**
   - Hacer un push a `main` o ejecutar el workflow manualmente (pestaña Actions → Deploy to GitHub Pages → Run workflow)
   - El workflow construye `dist/` y lo publica

4. **Verificar la URL**
   - Aparece en Settings → Pages y en el resumen del despliegue (environment `github-pages`)
   - Sitio de usuario/organización: `https://TU_USUARIO.github.io/`
   - Sitio de proyecto: `https://TU_USUARIO.github.io/TU_REPO/`

## Configuración de secrets (opcional, para Formspree)

En Settings → Secrets and variables → Actions agregar:

| Secret | Valor | Ejemplo |
|--------|-------|---------|
| `FORMSPREE_ENDPOINT` | Endpoint del formulario contacto | `https://formspree.io/f/xxxxxxxx` |
| `NEWSLETTER_ENDPOINT` | Endpoint del newsletter (opcional) | `https://formspree.io/f/yyyyyyyy` |

Sin estos secrets, el formulario muestra un mensaje de demo y dirige a Instagram/correo.

## Comprobar que funciona

- `https://TU_USUARIO.github.io/TU_REPO/` carga la home
- `/proyectos/`, `/servicios/`, `/estudio/`, `/contacto/`, `/privacidad/` responden 200
- `/404.html` y `/500.html` existen
- `dist/` contiene `.nojekyll` (desactiva Jekyll)
- No hay `node_modules/`, `.env`, ni archivos PHP en `dist/`
