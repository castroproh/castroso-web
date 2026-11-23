# Guía — Dominio personalizado para CASTROSO.JPG

**Estado:** guía de preparación. No se ha comprado ningún dominio, no se ha modificado DNS y no se ha activado GitHub Pages desde esta revisión.

## 1. Aclaración indispensable: `castroso.jpg` no es un dominio

`.jpg` **no es un TLD delegado** en la zona raíz de IANA. Por eso `castroso.jpg` **no se puede registrar** como dominio. El nombre de la marca puede seguir siendo CASTROSO.JPG (el “.JPG” funciona como guiño visual), pero el sitio necesita un dominio real.

Alternativas a evaluar con un registrador (la disponibilidad y el precio deben verificarse al momento de comprar):

| Opción | Ventaja | Nota |
|---|---|---|
| `castrosojpg.com` | Universal, fácil de recordar | Verificar disponibilidad y renovación |
| `castrosojpg.mx` | Identidad mexicana | Puede requerir datos fiscales; verificar requisitos |
| `castrosojpg.studio` | Coherente con “estudio creativo” | Suele costar más que .com |
| `castrosojpg.design` | Coherente con diseño | Suele costar más que .com |
| `castrosojpg.art` | Coherente con lo editorial/experimental | Suele costar más que .com |

**Decisión pendiente de Mateo.** No se compra ni se reserva nada sin autorización expresa de un adulto responsable.

## 2. Antes de empezar

- Confirmar que la persona responsable tiene acceso administrativo al registrador y a la cuenta de GitHub.
- Para compra, cuenta y cualquier compromiso de pago debe intervenir una persona adulta autorizada.
- Confirmar que el repositorio correcto es `castroproh/castroso-web` y que GitHub Pages se publicará mediante GitHub Actions.
- Verificar el dominio personalizado desde GitHub antes de crear registros DNS, siguiendo la recomendación de GitHub contra la apropiación de dominios.
- No crear registros DNS comodín (`*`).
- No copiar valores DNS de otro proveedor: confirmarlos en la documentación oficial y en **Settings → Pages** al momento de configurar.

## 3. Orden recomendado (cuando exista dominio aprobado)

1. Adquirir el dominio con autorización y verificar la titularidad.
2. En GitHub: **Settings → Pages** → origen **GitHub Actions**.
3. Introducir el dominio en **Custom domain** y guardar; completar la verificación que solicite GitHub.
4. Crear en el registrador los registros que GitHub indique. Para un dominio apex, GitHub documenta registros `A`; también puede admitir `ALIAS`/`ANAME` según el proveedor:

   | Tipo | Nombre | Valor |
   |---|---|---|
   | A | @ | `185.199.108.153` |
   | A | @ | `185.199.109.153` |
   | A | @ | `185.199.110.153` |
   | A | @ | `185.199.111.153` |

   Opcionalmente pueden añadirse los registros `AAAA` IPv6 que muestre la documentación oficial de GitHub Pages. Confirmar los valores en **Settings → Pages** antes de guardarlos.

5. Para `www.tudominio.com`, crear un registro `CNAME` que apunte a `castroproh.github.io` (sin el nombre del repositorio), después de confirmar el destino en GitHub Pages.
6. Esperar propagación y verificar con `dig tudominio.com A +noall +answer`, `dig tudominio.com AAAA +noall +answer` y `dig www.tudominio.com +noall +answer`.
7. Configurar en GitHub **Settings → Secrets and variables → Actions → Variables**:
   - `CUSTOM_DOMAIN=tudominio.com`
   - `RELEASE_APPROVED=true` **solo** cuando exista autorización expresa de publicación.
8. Ejecutar el workflow en modo build/verificación sin aprobar el despliegue. El job de deploy requiere el input manual `confirm_production_deploy=true` **y** la variable `RELEASE_APPROVED=true`.
9. Activar **Enforce HTTPS** solo cuando GitHub confirme que el certificado está disponible.

## 4. Comprobación local del build con dominio propio

Desde la carpeta del sitio:

```bash
CUSTOM_DOMAIN=castrosojpg.com BASE_PATH=/ SITE_URL=https://castrosojpg.com NODE_ENV=production npm run launch:check
```

Esto solo genera y comprueba archivos locales (`dist/`); no modifica DNS, GitHub ni el sitio público. El build escribe `dist/CNAME` cuando `CUSTOM_DOMAIN` es válido y cambia las rutas a la raíz.

Para el sitio de proyecto sin dominio propio:

```bash
npm run launch:check
# BASE_PATH=/castroso-web/ · SITE_URL=https://castroproh.github.io
```

## 5. Publicación

El workflow actual **no se ejecuta al hacer push**. Solo se inicia desde **Actions → Build and deploy CASTROSO.JPG → Run workflow**. Aunque el build termine correctamente, el despliegue se omite salvo que se cumplan las dos compuertas:

- Input `confirm_production_deploy=true` en esa ejecución manual.
- Variable de repositorio `RELEASE_APPROVED=true` establecida por quien autoriza el lanzamiento.

Además, el workflow bloquea el deploy si el aviso de privacidad conserva marcadores `[PENDIENTE]`.

No hagas push, no ejecutes el workflow de producción ni cambies DNS durante esta preparación.

## 6. Verificación posterior al despliegue autorizado

- Abrir `https://tudominio.com/` y `https://www.tudominio.com/`.
- Confirmar la redirección del subdominio secundario, si se configuró.
- Verificar HTTPS y el certificado.
- Revisar `/sitemap.xml`, `/robots.txt`, canonical y Open Graph.
- Navegar por todas las páginas y fichas de proyecto.
- Comprobar los formularios únicamente después de completar privacidad, endpoint y pruebas en staging.

## 7. Referencia oficial

Consultar la documentación vigente de GitHub: [Administrar un dominio personalizado para GitHub Pages](https://docs.github.com/es/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
