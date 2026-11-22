# Guía — Conectar dominio castroso.jpg

Sitio: CASTROSO.JPG — Dominio personalizado en GitHub Pages.

**No actives el dominio en el workflow hasta tener acceso al registrador y poder configurar el DNS.** La variable `CUSTOM_DOMAIN` queda vacía para mantener el sitio en su URL actual.

## 1. Configurar DNS en el registrador

Para el dominio raíz `castroso.jpg`, crea estos cuatro registros:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | 185.199.108.153 | Automático |
| A | @ | 185.199.109.153 | Automático |
| A | @ | 185.199.110.153 | Automático |
| A | @ | 185.199.111.153 | Automático |

Para `www.castroso.jpg`, crea:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| CNAME | www | castroproh.github.io | Automático |

No borres otros registros que el proveedor use para correo u otros servicios sin comprobar antes para qué sirven.

## 2. Añadir el dominio en GitHub Pages

1. Abre el repositorio `castroproh/castroso-web`.
2. Ve a **Settings → Pages**.
3. En **Custom domain**, escribe `castroso.jpg` y guarda.
4. Espera a que GitHub verifique el DNS.

## 3. Configurar el workflow para el dominio propio

Después de configurar el DNS y agregar el dominio en Pages:

1. Ve a **Settings → Secrets and variables → Actions → Variables**.
2. Crea una variable de repositorio:
   - Nombre: `CUSTOM_DOMAIN`
   - Valor: `castroso.jpg`
3. Ejecuta **Actions → Deploy CASTROSO.JPG to GitHub Pages → Run workflow**, o espera al siguiente push a `main`.

El workflow detecta esa variable y construye el sitio con:
- `BASE_PATH=` (vacío)
- `SITE_URL=https://castroso.jpg`
- `dist/CNAME` con el contenido `castroso.jpg`

Si `CUSTOM_DOMAIN` no existe o está vacía, el workflow conserva automáticamente la URL de proyecto `https://castroproh.github.io/castroso-web/`.

## 4. Activar HTTPS

Cuando GitHub haya verificado el DNS y emitido el certificado, vuelve a **Settings → Pages** y activa **Enforce HTTPS**. No declares el dominio listo hasta que cargue con un certificado válido.

## 5. Verificación final

- `https://castroso.jpg/` carga el sitio.
- `https://www.castroso.jpg/` apunta al dominio canónico según la configuración de GitHub Pages.
- El certificado HTTPS es válido.
- `https://castroso.jpg/sitemap.xml` usa el dominio propio.
- `https://castroso.jpg/robots.txt` apunta al sitemap del dominio propio.
- El último workflow de GitHub Actions termina con éxito.

## Volver a la URL anterior

Para volver a la URL de GitHub Pages del proyecto, elimina la variable `CUSTOM_DOMAIN` en **Settings → Secrets and variables → Actions → Variables**, retira el dominio personalizado de **Settings → Pages** y vuelve a ejecutar el workflow. Hazlo solo si realmente quieres revertir el dominio.
