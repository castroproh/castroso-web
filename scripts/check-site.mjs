#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const customDomain = String(process.env.CUSTOM_DOMAIN || '').trim().toLowerCase();
const basePath = (process.env.BASE_PATH ?? (customDomain ? '/' : '/castroso-web/')).replace(/\/+$/, '');
const siteUrl = (process.env.SITE_URL ?? (customDomain ? `https://${customDomain}` : 'https://castroproh.github.io')).replace(/\/+$/, '');
const errors = [];
const htmlFiles = [];
const urlReferences = [];

function collectFiles(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) collectFiles(file);
        else {
            if (file.endsWith('.html')) htmlFiles.push(file);
            if (file.endsWith('.css')) {
                const css = fs.readFileSync(file, 'utf8');
                for (const match of css.matchAll(/url\((?:["']?)([^"')]+)(?:["']?)\)/g)) {
                    if (!match[1].startsWith('data:')) {
                        urlReferences.push({ source: file, url: match[1] });
                    }
                }
            }
        }
    }
}

function checkReference(sourceFile, rawUrl) {
    if (!rawUrl || rawUrl.startsWith('#')) return;

    let url;
    try {
        const sourcePath = `${basePath}/${path.relative(dist, sourceFile).split(path.sep).join('/')}`
            .replace(/\/+/g, '/');
        const sourceUrl = new URL(sourcePath, 'https://site.invalid');
        url = new URL(rawUrl, sourceUrl);
    } catch {
        errors.push(`${path.relative(dist, sourceFile)}: URL inválida '${rawUrl}'`);
        return;
    }

    if (url.origin !== 'https://site.invalid') return;

    let outputPath = decodeURIComponent(url.pathname);
    if (basePath) {
        if (outputPath !== basePath && !outputPath.startsWith(`${basePath}/`)) {
            errors.push(`${path.relative(dist, sourceFile)}: falta BASE_PATH en '${rawUrl}'`);
            return;
        }
        outputPath = outputPath.slice(basePath.length);
    }

    outputPath = outputPath.replace(/^\/+/, '');
    if (!outputPath || outputPath.endsWith('/')) outputPath += 'index.html';
    const target = path.resolve(dist, outputPath);
    if (!target.startsWith(`${dist}${path.sep}`) || !fs.existsSync(target)) {
        errors.push(`${path.relative(dist, sourceFile)}: destino local ausente '${rawUrl}'`);
    }
}

function expect(condition, message) {
    if (!condition) errors.push(message);
}

if (!fs.existsSync(dist)) {
    console.error('No existe dist/. Ejecuta npm run build antes de npm run check.');
    process.exit(1);
}

collectFiles(dist);
const projects = JSON.parse(fs.readFileSync(path.join(root, 'data/projects.json'), 'utf8')).projects;
const publishedProjects = projects.filter(project => project.published !== false && project.draft !== true);
expect(htmlFiles.length === 8 + publishedProjects.length,
    `Se esperaban ${8 + publishedProjects.length} HTML; se encontraron ${htmlFiles.length}.`);

for (const requiredFile of ['404.html', '500.html', 'manifest.json', 'robots.txt', 'sitemap.xml', '.nojekyll', 'assets/js/config.js']) {
    expect(fs.existsSync(path.join(dist, requiredFile)), `Falta dist/${requiredFile}.`);
}

for (const project of publishedProjects) {
    expect(project.media_type === 'vector' && project.fit === 'contain',
        `${project.slug}: el proyecto debe declararse vectorial y usar contain.`);
    expect(Boolean(project.image_label && project.image_note),
        `${project.slug}: faltan image_label o image_note.`);
    for (const image of [project.cover, project.meta?.og_image, ...(project.gallery || [])]) {
        if (image) expect(fs.existsSync(path.join(root, 'public', image)),
            `${project.slug}: falta el recurso ${image}.`);
    }
    expect(!`${project.cover} ${(project.gallery || []).join(' ')}`.includes('/projects/'),
        `${project.slug}: aún referencia imágenes placeholder generadas.`);
}

for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
        urlReferences.push({ source: htmlFile, url: match[1] });
    }
}

for (const reference of urlReferences) checkReference(reference.source, reference.url);

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
expect(sitemapLocations.length === 5 + publishedProjects.length,
    `El sitemap debe contener ${5 + publishedProjects.length} URLs; contiene ${sitemapLocations.length}.`);
for (const location of sitemapLocations) {
    const url = new URL(location);
    expect(url.origin === new URL(siteUrl).origin, `Origen incorrecto en sitemap: ${location}`);
    expect(!basePath || url.pathname === basePath || url.pathname.startsWith(`${basePath}/`),
        `Falta BASE_PATH en sitemap: ${location}`);
    expect(!url.pathname.endsWith('/privacidad/'),
        `La página /privacidad/ es noindex y no debe aparecer en el sitemap: ${location}`);
}

const homeHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const homeJsonLd = [...homeHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(match => {
        try { return JSON.parse(match[1]); } catch { return null; }
    }).filter(Boolean);
const homeUrl = `${siteUrl}${basePath}/`;
for (const node of homeJsonLd) {
    if (['Organization', 'WebSite'].includes(node['@type'])) {
        expect(node.url === homeUrl, `JSON-LD ${node['@type']} debe usar la URL canónica '${homeUrl}'; usa '${node.url}'.`);
    }
}
expect(!/SearchAction|search_term_string/.test(homeHtml),
    'El JSON-LD no debe declarar una búsqueda interna que el sitio no ofrece.');

const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
const expectedRootPath = basePath ? `${basePath}/` : '/';
expect(robots.includes(`Allow: ${expectedRootPath}`), `robots.txt debe permitir la raíz '${expectedRootPath}'.`);
expect(robots.includes(`${siteUrl}${basePath}/sitemap.xml`), 'robots.txt no apunta al sitemap configurado.');
expect(robots.includes(`Disallow: ${expectedRootPath}privacidad/`), 'robots.txt no excluye la ruta de privacidad.');
expect(!fs.existsSync(path.join(dist, '.env')), 'No se debe publicar dist/.env.');

const runtimeConfigSource = fs.readFileSync(path.join(dist, 'assets/js/config.js'), 'utf8');
const runtimeConfigMatch = runtimeConfigSource.match(/window\.CASTROSO_CONFIG\s*=\s*(\{[\s\S]*\});\s*$/);
expect(Boolean(runtimeConfigMatch), 'assets/js/config.js no contiene una configuración JSON válida.');
if (runtimeConfigMatch) {
    try {
        const runtimeConfig = JSON.parse(runtimeConfigMatch[1]);
        const endpointsAllowed = process.env.PUBLIC_LEADS_PRIVACY_APPROVED === 'true'
            && process.env.CONTACT_ENDPOINTS_ENABLED === 'true';
        expect(runtimeConfig.contactEndpointsEnabled === endpointsAllowed,
            'La bandera de endpoints del bundle no coincide con las dos compuertas del build.');
        if (!endpointsAllowed) {
            expect(!runtimeConfig.formspreeEndpoint && !runtimeConfig.mainLeadsEndpoint,
                'El bundle contiene un endpoint de contacto sin ambas aprobaciones.');
        }
        expect(runtimeConfig.newsletterEnabled === false && runtimeConfig.newsletterEndpoint === '',
            'El newsletter debe permanecer desactivado hasta tener consentimiento secundario independiente.');
    } catch (error) {
        errors.push(`assets/js/config.js no es JSON válido: ${error.message}`);
    }
}

if (customDomain) {
    const cnamePath = path.join(dist, 'CNAME');
    expect(fs.existsSync(cnamePath), 'Falta dist/CNAME para el dominio personalizado.');
    if (fs.existsSync(cnamePath)) {
        expect(fs.readFileSync(cnamePath, 'utf8').trim() === customDomain, 'El contenido de dist/CNAME no coincide con CUSTOM_DOMAIN.');
    }
} else {
    expect(!fs.existsSync(path.join(dist, 'CNAME')), 'No debe generarse CNAME cuando CUSTOM_DOMAIN está vacío.');
}

if (errors.length) {
    console.error(`Fallaron ${errors.length} verificaciones:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Verificación correcta: ${htmlFiles.length} HTML, ${sitemapLocations.length} URLs en sitemap y ${urlReferences.length} referencias locales.`);
