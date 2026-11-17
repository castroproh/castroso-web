# Guía — Conectar dominio castroso.jpg

Sitio: CASTROSO.JPG — Dominio personalizado en GitHub Pages

> **Importante:** No comitees un archivo `CNAME` antes de configurar el DNS. GitHub Pages lo genera automáticamente cuando añades el dominio en Settings → Pages.

## 1. Configurar DNS (en tu registrador de dominios)

Registros para el dominio raíz `castroso.jpg`:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | 185.199.108.153 | Automático |
| A | @ | 185.199.109.153 | Automático |
| A | @ | 185.199.110.153 | Automático |
| A | @ | 185.199.111.153 | Automático |
| CNAME | www | TU_USUARIO.github.io | Automático |

## 2. Añadir el dominio en GitHub Pages

1. Repositorio → Settings → Pages
2. Custom domain: escribe `castroso.jpg` → Save
3. GitHub crea/actualiza el archivo `CNAME` en `dist/` con el contenido `castroso.jpg`
4. Aparece un aviso de verificación DNS; esperar propagación (puede tardar minutos u horas)

## 3. Activar HTTPS

1. En la misma página Settings → Pages
2. Marcar **Enforce HTTPS** ✅ (aparece tras verificar el DNS)
3. GitHub emite el certificado SSL automáticamente (Let's Encrypt)

## 4. Construir con el dominio propio (local)

```bash
BASE_PATH= SITE_URL=https://castroso.jpg npm run build
```

Esto genera URLs canónicas y sitemap apuntando a `https://castroso.jpg/`. No uses `CUSTOM_DOMAIN` a menos que quieras forzar la generación de `CNAME` en un build local.

## 5. Verificación

- `https://castroso.jpg/` carga con HTTPS
- `https://www.castroso.jpg/` redirige (si configuraste el CNAME de www)
- El certificado SSL es válido (candado en el navegador)
- `sitemap.xml` y `robots.txt` usan `https://castroso.jpg/`

## Solución de problemas

| Problema | Solución |
|----------|----------|
| "DNS no verificado" | Esperar a que propaguen los registros A y CNAME |
| HTTPS no activa | Esperar verificación DNS; luego marcar Enforce HTTPS |
| Sitio no carga en `castroso.jpg` | Confirmar que los 4 registros A apuntan a las IPs de GitHub Pages |
| CNAME conflictivo | Eliminar cualquier `CNAME` commitado en el repo; dejar que GitHub Pages lo gestione |
