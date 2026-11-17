# Guía — Formspree (contacto y newsletter)

Sitio: CASTROSO.JPG — Formularios sin servidor con Formspree

## 1. Crear el formulario de contacto

1. Ir a https://formspree.io y crear cuenta (gratis)
2. New form → poner nombre (ej. "Contacto CASTROSO.JPG")
3. Recibir endpoint: `https://formspree.io/f/xxxxxxxx`
4. Copiar el endpoint

## 2. Crear el formulario de newsletter (opcional)

1. Nuevo form en Formspree (ej. "Newsletter CASTROSO.JPG")
2. Copiar endpoint: `https://formspree.io/f/yyyyyyyy`

## 3. Configurar en GitHub Actions Secrets

Repositorio → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Valor | Obligatorio |
|--------|-------|-------------|
| `FORMSPREE_ENDPOINT` | `https://formspree.io/f/xxxxxxxx` | Sí (contacto) |
| `NEWSLETTER_ENDPOINT` | `https://formspree.io/f/yyyyyyyy` | No (newsletter) |

Estos valores se inyectan en el build mediante el workflow `.github/workflows/deploy.yml` y se escriben en `dist/assets/js/config.js`.

## 4. Construir localmente con Formspree (pruebas)

```bash
FORMSPREE_ENDPOINT=https://formspree.io/f/xxxxxxxx \
NEWSLETTER_ENDPOINT=https://formspree.io/f/yyyyyyyy \
npm run build
```

Sin endpoint configurado, el formulario de contacto muestra el mensaje de demo y dirige a Instagram/correo (ya definido en `data/site.json`).

## 5. Cómo funciona el formulario

- HTML5 validation (campos requeridos, tipo email, select, textarea, date)
- Honeypot (`website_url`): si se rellena, el envío se descarta (spam)
- Envío por AJAX al endpoint Formspree
- Toast de éxito / error según respuesta
- Mensajes de éxito y error personalizables en `data/site.json` → `contact.success_message` / `contact.error_message`

## 6. Campos del formulario

Definidos en `data/site.json` → `contact.form_fields`:

| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | text | Sí |
| email | email | Sí |
| proyecto_nombre | text | Sí |
| servicio | select | Sí |
| presupuesto | select | No |
| descripcion | textarea | Sí |
| fecha_estimada | date | No |
| medio_contacto | select | No |

## 7. Límites del plan gratuito de Formspree

- Hasta 50 envíos/mes (plan gratuito)
- Spam protection incluida (honeybadger/captcha opcional)
- Para más volumen, pasar a plan de pago en formspree.io
