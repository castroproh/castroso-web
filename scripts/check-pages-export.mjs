#!/usr/bin/env node
/**
 * CASTROSO.JPG — Verificación de la exportación estática para GitHub Pages.
 *
 * Este script NO publica nada. Comprueba que dist/ sea un artefacto estático
 * seguro: sin PHP, sin secretos, sin rutas locales, sin bases de datos y con
 * la captación pública desactivada.
 *
 * Uso:
 *   npm run build && npm run check:pages
 *   CUSTOM_DOMAIN=castrosojpg.com BASE_PATH=/ SITE_URL=https://castrosojpg.com \
 *     npm run build && npm run check:pages
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const customDomain = String(process.env.CUSTOM_DOMAIN || '').trim().toLowerCase();
const basePath = (process.env.BASE_PATH ?? (customDomain ? '/' : '/castroso-web/')).replace(/\/+$/, '');
const siteUrl = (process.env.SITE_URL ?? (customDomain ? `https://${customDomain}` : 'https://castroproh.github.io')).replace(/\/+$/, '');
const expectedHome = `${siteUrl}${basePath}/`;
const errors = [];
const warnings = [];
const files = [];

function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) {
            errors.push(`Enlace simbólico no permitido en dist/: ${path.relative(dist, full)}`);
        } else if (entry.isDirectory()) {
            walk(full);
        } else {
            files.push(full);
        }
    }
}

function expect(condition, message) {
    if (!condition) errors.push(message);
}

if (!fs.existsSync(dist) || !fs.statSync(dist).isDirectory()) {
    console.error('No existe dist/. Ejecuta npm run build antes de npm run check:pages.');
    process.exit(1);
}
walk(dist);

const relative = files.map(file => path.relative(dist, file).split(path.sep).join('/'));

// 1. Archivos imprescindibles para Pages.
for (const required of ['index.html', '404.html', '.nojekyll', 'robots.txt', 'sitemap.xml', 'manifest.json', 'assets/js/config.js']) {
    expect(relative.includes(required), `Falta dist/${required}.`);
}

// 2. Nada de código de servidor, datos privados ni artefactos de desarrollo.
const forbiddenNames = [
    /(^|\/)\.env(\.|$)/i,
    /(^|\/)\.git(\/|$)/i,
    /(^|\/)node_modules(\/|$)/i,
    /(^|\/)vendor(\/|$)/i,
    /(^|\/)storage(\/|$)/i,
    /(^|\/)database(\/|$)/i,
    /(^|\/)tests?(\/|$)/i,
    /\.(php|phtml|phar|sqlite3?|sql|log|zip|docx?|xlsx?|pptx?|md)$/i,
    /(^|\/)composer\.(json|lock)$/i,
    /(^|\/)package(-lock)?\.json$/i,
    /(^|\/)artisan$/i
];
for (const file of relative) {
    for (const pattern of forbiddenNames) {
        expect(!pattern.test(file), `Archivo no publicable en dist/: ${file}`);
    }
}

// 3. Sin secretos ni rutas del equipo en ningún archivo de texto.
const textExtensions = /\.(html|css|js|json|xml|txt|webmanifest|svg)$/i;
const secretPatterns = [
    { pattern: /\/Users\/[^/\s"']+/i, label: 'ruta local /Users/' },
    { pattern: /[A-Z]:\\\\Users\\\\/i, label: 'ruta local de Windows' },
    { pattern: /APP_KEY\s*=\s*/i, label: 'APP_KEY' },
    { pattern: /(DB_PASSWORD|MAIL_PASSWORD|TAVILY_API_KEY|APP_SECRET|CLIENT_SECRET)\s*=\s*/i, label: 'credencial' },
    { pattern: /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/i, label: 'llave privada' },
    { pattern: /localhost:\d+/i, label: 'URL localhost' },
    { pattern: /127\.0\.0\.1/i, label: 'IP local' }
];
for (const file of files) {
    if (!textExtensions.test(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const { pattern, label } of secretPatterns) {
        if (pattern.test(text)) errors.push(`${path.relative(dist, file)} contiene ${label}.`);
    }
    if (/<\?php/i.test(text)) errors.push(`${path.relative(dist, file)} contiene código PHP.`);
    if (/<form[^>]+action=["']https?:/i.test(text)) errors.push(`${path.relative(dist, file)} envía un formulario a un endpoint externo.`);
}

// 4. HTML con metadatos y canonical coherentes.
const htmlFiles = files.filter(file => file.endsWith('.html'));
const expectedHtml = 8 + JSON.parse(fs.readFileSync(path.join(root, 'data/projects.json'), 'utf8'))
    .projects.filter(project => project.published !== false && project.draft !== true).length;
expect(htmlFiles.length === expectedHtml, `Se esperaban ${expectedHtml} HTML publicados; hay ${htmlFiles.length}.`);

for (const file of htmlFiles) {
    const name = path.relative(dist, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf8');
    expect(/<html[^>]+lang=/i.test(html), `${name}: falta el atributo lang.`);
    expect(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+/i.test(html) ||
        /<meta[^>]+content=["'][^"']+["'][^>]+name=["']description["']/i.test(html),
        `${name}: falta una meta description no vacía.`);
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
    expect(Boolean(canonical), `${name}: falta canonical.`);
    if (canonical) {
        expect(canonical.startsWith(expectedHome), `${name}: canonical fuera del sitio esperado (${canonical}).`);
    }
    if (name === '404.html' || name === '500.html' || name === 'privacidad/index.html') {
        expect(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html),
            `${name}: debe llevar noindex.`);
    }
    expect(!/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html) || name !== 'index.html',
        'index.html: la portada no debe ser noindex.');
}

// 5. Sitemap: todas las URL deben existir como archivo estático.
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
expect(sitemapLocations.length > 0, 'sitemap.xml no contiene URLs.');
for (const location of sitemapLocations) {
    expect(location.startsWith(expectedHome), `sitemap.xml: URL fuera del sitio esperado (${location}).`);
    const pathname = new URL(location).pathname;
    const relativePath = (basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname).replace(/^\/+/, '') || 'index.html';
    const target = relativePath.endsWith('/') ? `${relativePath}index.html` : relativePath;
    expect(relative.includes(target), `sitemap.xml: ${location} no tiene archivo estático (${target}).`);
    expect(!pathname.endsWith('/privacidad/'), 'sitemap.xml: /privacidad/ es noindex y no debe anunciarse.');
}

// 6. Configuración del navegador: captación apagada y sin endpoints.
const configSource = fs.readFileSync(path.join(dist, 'assets/js/config.js'), 'utf8');
const configMatch = configSource.match(/window\.CASTROSO_CONFIG\s*=\s*(\{[\s\S]*\});\s*$/);
expect(Boolean(configMatch), 'assets/js/config.js no contiene JSON válido.');
let runtimeConfig = null;
if (configMatch) {
    try { runtimeConfig = JSON.parse(configMatch[1]); } catch (error) {
        errors.push(`assets/js/config.js no es JSON válido: ${error.message}`);
    }
}
if (runtimeConfig) {
    expect(runtimeConfig.contactEndpointsEnabled === false,
        'contactEndpointsEnabled debe ser false en la exportación provisional.');
    expect(runtimeConfig.privacyApprovedForBuild === false,
        'privacyApprovedForBuild debe ser false hasta aprobar el aviso legal.');
    expect(!runtimeConfig.formspreeEndpoint && !runtimeConfig.mainLeadsEndpoint,
        'La exportación contiene un endpoint de formularios; no debe publicarse.');
    expect(runtimeConfig.newsletterEnabled === false && !runtimeConfig.newsletterEndpoint,
        'El newsletter debe permanecer desactivado.');
    expect(!JSON.stringify(runtimeConfig).match(/(TAVILY|API_KEY|SECRET|PASSWORD)/i),
        'La configuración pública contiene nombres de credenciales.');
}

// 7. Formulario de contacto: sin action externo y con consentimiento visible.
const contactHtml = fs.readFileSync(path.join(dist, 'contacto/index.html'), 'utf8');
expect(/id=["']contact-form["']/.test(contactHtml), 'contacto/index.html: falta el formulario.');
expect(/name=["']privacy_consent["']/.test(contactHtml), 'contacto/index.html: falta el consentimiento de privacidad.');
expect(/instagram\.com\/castroso\.jpg/i.test(contactHtml), 'contacto/index.html: falta el contacto provisional de Instagram.');
expect(!/<form[^>]+id=["']contact-form["'][^>]+action=["']https?:/i.test(contactHtml),
    'contacto/index.html: el formulario apunta a un endpoint externo.');

// 8. Aviso legal pendiente: advertencia explícita (el workflow bloquea el deploy).
const privacyHtml = fs.readFileSync(path.join(dist, 'privacidad/index.html'), 'utf8');
const pendingMarkers = (privacyHtml.match(/\[PENDIENTE/g) || []).length;
if (pendingMarkers > 0) {
    warnings.push(`El aviso de privacidad conserva ${pendingMarkers} marcadores [PENDIENTE]; el deploy debe permanecer bloqueado.`);
}

// 9. Tamaño y composición del artefacto.
const totalBytes = files.reduce((total, file) => total + fs.statSync(file).size, 0);
if (totalBytes > 500 * 1024 * 1024) warnings.push(`dist/ pesa ${(totalBytes / 1024 / 1024).toFixed(1)} MB; revisar límites de Pages.`);

if (errors.length) {
    console.error(`Fallaron ${errors.length} verificaciones de exportación estática:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
}

for (const warning of warnings) console.warn(`⚠️  ${warning}`);
console.log(`Exportación estática válida: ${htmlFiles.length} HTML, ${sitemapLocations.length} URLs, ${files.length} archivos, ${(totalBytes / 1024 / 1024).toFixed(1)} MB.`);
console.log(`Base: ${basePath || '/'} · Sitio: ${expectedHome}`);
console.log('Captación pública: desactivada · Endpoints: vacíos · Sin PHP, .env, bases de datos ni secretos.');
