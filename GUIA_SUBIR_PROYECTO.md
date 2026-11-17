# Guía — Subir el proyecto

Dos formas de entregar el sitio a GitHub: desde el ZIP A (fuente, con build en GitHub Actions) o desde el ZIP B (`dist/`, ya construido).

## Opción A — ZIP A (fuente, recomendada)

Contiene `scripts/build.mjs`, `data/`, `public/`. GitHub Actions ejecuta el build y despliega a Pages.

```bash
# 1. Descomprimir ZIP A
unzip castroso-static-final.zip -d castroso-static-final
cd castroso-static-final

# 2. Instalar dependencias localmente (opcional, para previsualizar)
npm ci

# 3. Construir y previsualizar localmente
npm run build
./node_modules/.bin/serve dist -p 3000   # http://localhost:3000

# 4. Subir a GitHub
git init && git branch -M main
git add .
git commit -m "Initial commit: CASTROSO.JPG static site"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

El workflow `.github/workflows/deploy.yml` se ejecuta en cada push a `main`: instala dependencias, construye `dist/` y lo publica en GitHub Pages.

## Opción B — ZIP B (dist ya construido)

Contiene solo el contenido de `dist/`. Úsalo si no quieres ejecutar el build en GitHub (por ejemplo, subir los archivos estáticos directamente a otra plataforma de hosting estático).

```bash
unzip castroso-static-dist.zip -d castroso-static-dist
cd castroso-static-dist
# Subir el contenido de esta carpeta a tu hosting estático
```

> La Opción B **no incluye** GitHub Actions ni el workflow de despliegue automático. Para GitHub Pages con deploy automático usa la Opción A.

## Variables de entorno del build

| Variable | Valor por defecto | Uso |
|----------|-------------------|-----|
| `BASE_PATH` | `''` | Prefijo de ruta. Para sitio de usuario: `''`. Para proyecto: `/TU_REPO/` |
| `SITE_URL` | `http://localhost:3000` | URL base para canonical, sitemap, OG |
| `FORMSPREE_ENDPOINT` | vacía | Endpoint Formspree del formulario contacto |
| `NEWSLETTER_ENDPOINT` | vacía | Endpoint Formspree del newsletter (opcional) |
| `CUSTOM_DOMAIN` | vacía | Si se define, se genera `CNAME` en `dist/` |

Ejemplo para GitHub Pages como proyecto:
```bash
BASE_PATH=/TU_REPO/ SITE_URL=https://TU_USUARIO.github.io npm run build
```

Ejemplo para dominio propio `castroso.jpg`:
```bash
BASE_PATH= SITE_URL=https://castroso.jpg npm run build
```
