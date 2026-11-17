# Guía — Crear repositorio en GitHub

Sitio: CASTROSO.JPG (estático, GitHub Pages)

## Requisitos
- Cuenta de GitHub
- Git instalado
- ZIP A (`castroso-static-final.zip`) descomprimido en carpeta local

## Pasos

1. **Crear repositorio en GitHub**
   - Ir a github.com → New repository
   - Nombre: ejemplo `castroso-static` (o `castroso.jpg`)
   - Público o privado
   - **No inicializar con README, .gitignore ni licencia** (el ZIP ya trae los suyos)
   - Crear repositorio

2. **Inicializar git localmente**
   ```bash
   cd castroso-static-final
   git init
   git branch -M main
   ```

3. **Subir el código**
   ```bash
   git add .
   git commit -m "Initial commit: CASTROSO.JPG static site"
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```

4. **Verificar**
   - Entrar al repositorio en GitHub y confirmar que aparecen `README.md`, `scripts/`, `data/`, `public/`, `.github/workflows/deploy.yml`.

---

> No comitees archivos con secretos (`.env`, `CNAME` forzado, claves API). Los endpoints de Formspree se configuran como Secrets de GitHub Actions, no en el código.
