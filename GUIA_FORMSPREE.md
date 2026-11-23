# Guía — Endpoint de contacto (Formspree o Laravel)

Sitio: CASTROSO.JPG.

## Estado actual

La captación pública permanece desactivada. El build solo incluye un endpoint de contacto cuando ambas compuertas están explícitamente habilitadas:

- `CONTACT_ENDPOINTS_ENABLED=true`
- `PUBLIC_LEADS_PRIVACY_APPROVED=true`

Además, la URL debe ser HTTPS. Si falta cualquiera de estas condiciones, el endpoint no se incluye en el JavaScript público.

El newsletter permanece desactivado hasta que la interfaz tenga un consentimiento independiente y el aviso de privacidad incluya esa finalidad secundaria.

## Elegir proveedor

Se puede evaluar un endpoint propio en Laravel o un proveedor externo como Formspree. Antes de elegir un proveedor externo, la persona adulta responsable del estudio debe revisar las condiciones vigentes, el tratamiento y almacenamiento de datos, transferencias, retención, seguridad, cuenta y cualquier coste asociado. No se presupone que exista un plan gratuito ni se contrata ningún servicio en esta guía.

No añadir credenciales privadas al JavaScript. Un endpoint de formulario que se publica en el navegador es visible para visitantes; nunca debe incluir tokens de administración o secretos.

## Configuración cuando exista aprobación

Si se usa Formspree, su URL real se guarda como secreto de GitHub Actions `FORMSPREE_ENDPOINT`. Si se usa Laravel, se define `MAIN_LEADS_ENDPOINT` como URL HTTPS real del endpoint `/api/public/prospects`.

Las dos variables de activación se deben establecer solo después de:

1. Aprobar legalmente el aviso de privacidad final.
2. Confirmar el proveedor y sus condiciones de tratamiento de datos.
3. Configurar el endpoint HTTPS real.
4. Configurar CORS y la allowlist exacta del origen publicado, si se utiliza Laravel.
5. Ejecutar pruebas de staging con datos sintéticos y comprobar la recepción interna.
6. Obtener la autorización operativa para activar la captación.

## Newsletter

No crear ni configurar un endpoint de newsletter todavía. El footer no tiene un consentimiento secundario independiente para esa finalidad. El build deja `newsletterEndpoint` vacío aunque exista `NEWSLETTER_ENDPOINT` en el entorno.

## Campos del formulario

Definidos en `data/site.json` → `contact.form_fields`:

| Campo | Tipo | Requerido |
|---|---|---|
| nombre | text | Sí |
| email | email | Sí |
| proyecto_nombre | text | Sí |
| servicio | select | Sí |
| presupuesto | select | No |
| descripcion | textarea | Sí |
| fecha_estimada | date | No |
| medio_contacto | select | No |

El formulario también incluye `privacy_consent` y el honeypot configurado en `contact.honeypot_field`.

## Pruebas locales

Las pruebas del build pueden usar endpoints HTTPS sintéticos solo para comprobar el comportamiento del generador; no deben enviarse solicitudes ni datos reales. La prueba estática `npm run check:integration` compara campos con Laravel, pero no sustituye una prueba HTTP/E2E en staging.
