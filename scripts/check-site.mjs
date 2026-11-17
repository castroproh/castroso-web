#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const basePath = (process.env.BASE_PATH ?? '/castroso-web/').replace(/\/+$/, '');
const siteUrl = (process.env.SITE_URL ?? 'https://castroproh.github.io').replace(/\/+$/, '');
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
expect(sitemapLocations.length === 6 + publishedProjects.length,
    `El sitemap debe contener ${6 + publishedProjects.length} URLs; contiene ${sitemapLocations.length}.`);
for (const location of sitemapLocations) {
    const url = new URL(location);
    expect(url.origin === new URL(siteUrl).origin, `Origen incorrecto en sitemap: ${location}`);
    expect(!basePath || url.pathname === basePath || url.pathname.startsWith(`${basePath}/`),
        `Falta BASE_PATH en sitemap: ${location}`);
}

const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
expect(robots.includes(`${siteUrl}${basePath}/sitemap.xml`), 'robots.txt no apunta al sitemap configurado.');
expect(!fs.existsSync(path.join(dist, '.env')), 'No se debe publicar dist/.env.');

if (errors.length) {
    console.error(`Fallaron ${errors.length} verificaciones:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Verificación correcta: ${htmlFiles.length} HTML, ${sitemapLocations.length} URLs en sitemap y ${urlReferences.length} referencias locales.`);
