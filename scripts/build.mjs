#!/usr/bin/env node
/**
 * CASTROSO.JPG — Static Site Generator
 * Genera sitio estático compatible con GitHub Pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const DIST = path.join(ROOT, 'dist');

const BASE_PATH = (process.env.BASE_PATH ?? '/castroso-web/').replace(/\/$/, '');
const SITE_URL = (process.env.SITE_URL ?? 'https://castroproh.github.io').replace(/\/$/, '');

function readJSON(file) {
    return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf-8'));
}

function readFile(file) {
    return fs.readFileSync(file, 'utf-8');
}

function writeFile(file, content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function asset(p) {
    const base = BASE_PATH.endsWith('/') ? BASE_PATH.slice(0, -1) : BASE_PATH;
    const path = p.startsWith('/') ? p : '/' + p;
    return base + path;
}

function e(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateStr, locale = 'es-MX') {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function slugify(str) {
    return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const siteConfig = readJSON('site.json');
const projectsData = readJSON('projects.json');
const servicesData = readJSON('services.json');

function validateData() {
    const warnings = [];
    const requiredProject = ['id', 'slug', 'title', 'category', 'cover', 'year'];
    
    if (!siteConfig.studio?.name) warnings.push('site.json: studio.name falta');
    if (!siteConfig.seo?.title) warnings.push('site.json: seo.title falta');
    if (!Array.isArray(projectsData.projects)) warnings.push('projects.json: projects no es un array');
    
    for (const project of projectsData.projects || []) {
        for (const field of requiredProject) {
            if (project[field] === undefined || project[field] === '') {
                warnings.push(`projects.json: '${project.slug || project.id}' le falta '${field}'`);
            }
        }
        const assets = [project.cover, project.meta?.og_image, ...(project.gallery || [])];
        for (const img of assets) {
            if (img && !fs.existsSync(path.join(PUBLIC, img))) {
                warnings.push(`projects.json: '${project.slug}' imagen no encontrada: ${img}`);
            }
        }
        if (project.published === false || project.draft === true) {
            warnings.push(`projects.json: '${project.slug}' marcado como borrador (no se publicará)`);
        }
    }
    
    let serviceCount = 0;
    for (const cat of servicesData.categories || []) {
        for (const svc of cat.services || []) {
            serviceCount++;
            if (!svc.id || !svc.name || !svc.description) {
                warnings.push(`services.json: servicio '${svc.id || 'sin-id'}' le falta nombre o descripción`);
            }
        }
    }
    if (serviceCount === 0) warnings.push('services.json: no hay servicios definidos');
    
    if (warnings.length > 0) {
        console.log('\n⚠ Validación de datos:');
        warnings.forEach(w => console.log(`   - ${w}`));
    } else {
        console.log('   ✅ Datos válidos');
    }
}

validateData();

const publishedProjects = projectsData.projects.filter(p => p.published !== false && p.draft !== true);
const draftProjects = projectsData.projects.filter(p => p.published === false || p.draft === true);
const allCategories = [...new Set(projectsData.projects.flatMap(p => p.categories || []))];

function normalizePath(href) {
    let h = String(href).replace('.php', '');
    if (h !== '/') h = h.replace(/\/+$/, '') + '/';
    return h;
}

function buildNavigation(currentPath) {
    const current = normalizePath(currentPath);
    return siteConfig.navigation.map(item => {
        const href = normalizePath(item.href);
        return {
            ...item,
            href: asset(href),
            active: href === current
        };
    }).map(item => `
        <li>
            <a href="${item.href}" class="nav-link${item.active ? ' active' : ''}" aria-current="${item.active ? 'page' : 'false'}">
                ${e(item.label)}
            </a>
        </li>
    `).join('');
}

function buildHeader(currentPage = '/') {
    const navItems = buildNavigation(currentPage);
    const logoPath = asset('/assets/logos/Imagotipo/Imagotipo_horizontal_color.svg');
    
    return `
<header class="site-header" role="banner">
    <div class="container header-inner">
        <a href="${asset('/')}" class="site-logo" aria-label="${e(siteConfig.studio.name)} - Inicio">
            <img src="${logoPath}" alt="" width="180" height="48" loading="lazy">
        </a>
        <nav class="main-nav" aria-label="Navegación principal">
            <button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Abrir menú">
                <span class="nav-toggle-icon" aria-hidden="true"></span>
            </button>
            <ul id="nav-menu" class="nav-list">
                ${navItems}
            </ul>
        </nav>
    </div>
</header>
`;
}

function buildFooter() {
    const year = new Date().getFullYear();
    const igUrl = siteConfig.studio.instagram;
    const email = siteConfig.studio.email || '';
    
    return `
<footer class="site-footer" role="contentinfo">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-brand">
                <img src="${asset('/assets/logos/Isotipo/Isotipo_color.svg')}" alt="" width="64" height="64" class="footer-logo">
                <p class="footer-tagline">${e(siteConfig.studio.tagline)}</p>
                <p class="footer-desc">${e(siteConfig.studio.description)}</p>
                <address class="footer-location">
                    ${e(siteConfig.studio.location)}
                </address>
            </div>
            <nav class="footer-nav" aria-label="Enlaces del sitio">
                <h3>Navegación</h3>
                <ul>
                    <li><a href="${asset('/')}">Inicio</a></li>
                    <li><a href="${asset('/proyectos/')}">Proyectos</a></li>
                    <li><a href="${asset('/servicios/')}">Servicios</a></li>
                    <li><a href="${asset('/estudio/')}">Estudio</a></li>
                    <li><a href="${asset('/contacto/')}">Contacto</a></li>
                </ul>
            </nav>
            <nav class="footer-nav" aria-label="Servicios">
                <h3>Servicios</h3>
                <ul>
                    <li><a href="${asset('/servicios/#diseno-grafico')}">Diseño gráfico</a></li>
                    <li><a href="${asset('/servicios/#fotografia')}">Fotografía</a></li>
                    <li><a href="${asset('/servicios/#audiovisual')}">Audiovisual</a></li>
                </ul>
            </nav>
            <div class="footer-contact">
                <h3>Contacto</h3>
                <ul>
                    <li><a href="${igUrl}" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                    ${email ? `<li><a href="mailto:${email}">Correo electrónico</a></li>` : ''}
                    ${siteConfig.studio.whatsapp ? `<li><a href="${siteConfig.studio.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>` : ''}
                </ul>
                <form class="newsletter-form" action="#" method="POST" data-formspree="newsletter">
                    <input type="hidden" name="_gotcha" value="" tabindex="-1" autocomplete="off">
                    <label for="newsletter-email" class="sr-only">Correo para newsletter</label>
                    <input type="email" id="newsletter-email" name="email" placeholder="Tu correo" required>
                    <button type="submit">Suscribirse</button>
                    <p class="form-disclaimer">Al suscribirte aceptas nuestra <a href="${asset('/privacidad/')}">política de privacidad</a>. Sin spam.</p>
                </form>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; ${year} ${e(siteConfig.studio.name)}. Todos los derechos reservados.</p>
            <p><a href="${asset('/privacidad/')}">Aviso de privacidad</a></p>
        </div>
    </div>
</footer>
`;
}

function buildSEOMeta(page) {
    const title = page.title ? `${e(page.title)} — ${e(siteConfig.studio.name)}` : siteConfig.seo.title;
    const description = page.description || siteConfig.seo.description;
    const url = page.url ? `${SITE_URL}${asset(page.url)}` : SITE_URL;
    const ogImage = page.ogImage ? `${SITE_URL}${asset(page.ogImage)}` : `${SITE_URL}${asset(siteConfig.seo.og_image)}`;
    const type = page.type || 'website';
    
    let meta = `
    <title>${title}</title>
    <meta name="description" content="${e(description)}">
    <meta name="keywords" content="${e(siteConfig.seo.keywords)}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${e(page.ogTitle || title)}">
    <meta property="og:description" content="${e(description)}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:site_name" content="${e(siteConfig.studio.name)}">
    <meta name="twitter:card" content="${siteConfig.seo.twitter_card}">
    <meta name="twitter:title" content="${e(page.ogTitle || title)}">
    <meta name="twitter:description" content="${e(description)}">
    <meta name="twitter:image" content="${ogImage}">`;
    
    if (page.jsonLd) {
        meta += `\n    <script type="application/ld+json">${JSON.stringify(page.jsonLd, null, 2)}</script>`;
    }
    
    return meta;
}

function buildProjectCard(project) {
    const href = asset(`/proyectos/${project.slug}/`);
    const cover = project.cover || '/assets/images/og-default.jpg';
    const categories = (project.categories || [project.category]).join(', ');
    
    return `
<article class="project-card" data-category="${e(project.category)}" data-project-slug="${e(project.slug)}">
    <a href="${href}" class="project-card-link" aria-label="Ver proyecto: ${e(project.title)}">
        <div class="project-card-image">
            <img src="${asset(cover)}" alt="" loading="lazy" width="400" height="300">
            <span class="project-card-category">${e(project.category)}</span>
        </div>
        <div class="project-card-content">
            <h3 class="project-card-title">${e(project.title)}</h3>
            <p class="project-card-meta">${e(categories)} · ${e(String(project.year))}</p>
        </div>
    </a>
</article>
`;
}

function buildServicesList() {
    return servicesData.categories.map(cat => {
        const services = cat.services.filter(s => s.active !== false);
        return `
        <section id="${cat.id}" class="services-category">
            <header class="category-header">
                <h2>${e(cat.name)}</h2>
                <p class="category-desc">${e(cat.description)}</p>
            </header>
            <div class="services-grid">
                ${services.map(svc => `
                <article class="service-card" data-service="${svc.id}">
                    <header class="service-header">
                        <h3>${e(svc.name)}</h3>
                        <span class="service-modalidad">${e(svc.modalidad)}</span>
                    </header>
                    <p class="service-desc">${e(svc.description)}</p>
                    <details class="service-includes">
                        <summary>Qué incluye</summary>
                        <ul>
                            ${svc.includes.map(i => `<li>${e(i)}</li>`).join('')}
                        </ul>
                    </details>
                    ${svc.examples.length > 0 ? `
                    <p class="service-examples">Ejemplo: ${svc.examples.map(e => e).join(', ')}</p>
                    ` : ''}
                    <a href="${asset('/contacto/')}?servicio=${svc.id}" class="btn btn-primary">${e(svc.cta_text)}</a>
                </article>
                `).join('')}
            </div>
        </section>
        `;
    }).join('');
}

function buildProjectFilters() {
    const cats = ['Todas', ...allCategories];
    return cats.map((cat, i) => `
        <button class="filter-btn${i === 0 ? ' active' : ''}" data-filter="${i === 0 ? 'all' : slugify(cat)}" aria-pressed="${i === 0 ? 'true' : 'false'}">
            ${e(cat)}
        </button>
    `).join('');
}

function buildProjectJSONLD(project) {
    return {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": project.title,
        "description": project.description,
        "image": `${SITE_URL}${asset(project.cover)}`,
        "datePublished": String(project.year),
        "creator": {
            "@type": "Organization",
            "name": siteConfig.studio.name
        },
        "genre": project.categories || [project.category],
        "url": `${SITE_URL}${asset('/proyectos/' + project.slug + '/')}`
    };
}

function buildOrganizationJSONLD() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": siteConfig.studio.name,
        "url": SITE_URL,
        "logo": `${SITE_URL}${asset('/assets/logos/Imagotipo/Imagotipo_horizontal_color.svg')}`,
        "sameAs": [siteConfig.studio.instagram].filter(Boolean),
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Culiacán",
            "addressRegion": "Sinaloa",
            "addressCountry": "MX"
        },
        "description": siteConfig.studio.description
    };
}

function buildWebSiteJSONLD() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteConfig.studio.name,
        "url": SITE_URL,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${SITE_URL}${asset('/proyectos/?q={search_term_string}')}`
            },
            "query-input": "required name=search_term_string"
        }
    };
}

function buildServiceJSONLD(service) {
    return {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": service.name,
        "description": service.description,
        "provider": {
            "@type": "Organization",
            "name": siteConfig.studio.name,
            "url": SITE_URL
        },
        "serviceType": service.modalidad,
        "areaServed": "MX",
        "availableChannel": {
            "@type": "ServiceChannel",
            "serviceUrl": `${SITE_URL}${asset('/contacto/')}?servicio=${service.id}`
        }
    };
}

function renderPage(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || '';
    });
}

const baseTemplate = (pageContent, pageMeta) => `<!DOCTYPE html>
<html lang="es-MX">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    ${buildSEOMeta(pageMeta)}
    <link rel="preload" as="font" type="font/woff2" crossorigin href="${asset('/assets/fonts/Sora-VariableFont_wght.woff2')}">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="${asset('/assets/fonts/JetBrainsMono-VariableFont_wght.woff2')}">
    <link rel="stylesheet" href="${asset('/assets/css/main.css')}">
    <link rel="icon" type="image/svg+xml" href="${asset('/assets/icons/favicon.svg')}">
    <link rel="icon" type="image/png" sizes="32x32" href="${asset('/assets/icons/favicon-32.png')}">
    <link rel="icon" type="image/png" sizes="16x16" href="${asset('/assets/icons/favicon-16.png')}">
    <link rel="apple-touch-icon" href="${asset('/assets/icons/apple-touch-icon.png')}">
    <link rel="manifest" href="${asset('/manifest.json')}">
</head>
<body>
    ${buildHeader(pageMeta.currentPage || '/')}
    <main id="main-content">
        ${pageContent}
    </main>
    ${buildFooter()}
    <script src="${asset('/assets/js/config.js')}"></script>
    <script src="${asset('/assets/js/main.js')}" defer></script>
</body>
</html>`;

async function build() {
    console.log('🏗️  Iniciando build de CASTROSO.JPG...');
    console.log(`   BASE_PATH: "${BASE_PATH}"`);
    console.log(`   SITE_URL: "${SITE_URL}"`);
    
    if (fs.existsSync(DIST)) {
        fs.rmSync(DIST, { recursive: true });
    }
    fs.mkdirSync(DIST, { recursive: true });
    
    // Copy public assets to dist root
    copyDir(PUBLIC, DIST);
    
    // Generate config.js for runtime
    const configJs = `window.CASTROSO_CONFIG = {
    basePath: "${BASE_PATH}",
    siteUrl: "${SITE_URL}",
    formspreeEndpoint: "${process.env.FORMSPREE_ENDPOINT || ''}",
    newsletterEndpoint: "${process.env.NEWSLETTER_ENDPOINT || ''}",
    studio: ${JSON.stringify(siteConfig.studio)},
    contact: ${JSON.stringify(siteConfig.contact)}
};`;
    writeFile(path.join(DIST, 'assets/js/config.js'), configJs);
    
    // Generate manifest.json
    const manifest = {
        name: siteConfig.studio.name,
        short_name: 'CASTROSO.JPG',
        description: siteConfig.seo.description,
        start_url: asset('/'),
        display: 'standalone',
        background_color: siteConfig.colors['blanco-papel'],
        theme_color: siteConfig.colors['negro-carbon'],
        icons: [
            { src: asset('/assets/icons/favicon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: asset('/assets/icons/favicon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
    };
    writeFile(path.join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    // Build pages
    const pages = [
        {
            file: 'index.html',
            currentPage: '/',
            title: '',
            description: '',
            url: '/',
            ogImage: siteConfig.seo.og_image,
            jsonLd: [buildOrganizationJSONLD(), buildWebSiteJSONLD()],
            content: buildHomePage()
        },
        {
            file: 'proyectos/index.html',
            currentPage: '/proyectos/',
            title: 'Proyectos',
            description: 'Portafolio de proyectos de CASTROSO.JPG: identidad visual, diseño editorial, digital, motion, ilustración y señalética.',
            url: '/proyectos/',
            ogImage: siteConfig.seo.og_image,
            jsonLd: [buildOrganizationJSONLD()],
            content: buildProyectosPage()
        },
        {
            file: 'servicios/index.html',
            currentPage: '/servicios/',
            title: 'Servicios',
            description: 'Servicios de diseño gráfico, fotografía y audiovisual de CASTROSO.JPG. Identidad visual, diseño editorial, web, reels, videoclips y más.',
            url: '/servicios/',
            ogImage: siteConfig.seo.og_image,
            jsonLd: [buildOrganizationJSONLD()],
            content: buildServiciosPage()
        },
        {
            file: 'estudio/index.html',
            currentPage: '/estudio/',
            title: 'Estudio',
            description: 'Conoce CASTROSO.JPG: estudio creativo independiente en Culiacán. Equipo, historia, valores y proceso de trabajo.',
            url: '/estudio/',
            ogImage: siteConfig.seo.og_image,
            jsonLd: [buildOrganizationJSONLD()],
            content: buildEstudioPage()
        },
        {
            file: 'contacto/index.html',
            currentPage: '/contacto/',
            title: 'Contacto',
            description: 'Contacta con CASTROSO.JPG para solicitar cotización o información. Diseño gráfico, fotografía, audiovisual desde Culiacán, Sinaloa.',
            url: '/contacto/',
            ogImage: siteConfig.seo.og_image,
            jsonLd: [buildOrganizationJSONLD()],
            content: buildContactoPage()
        },
        {
            file: 'privacidad/index.html',
            currentPage: '/privacidad/',
            title: 'Aviso de privacidad',
            description: 'Aviso de privacidad de CASTROSO.JPG. Información sobre tratamiento de datos personales, derechos ARCO y contacto.',
            url: '/privacidad/',
            ogImage: siteConfig.seo.og_image,
            jsonLd: [buildOrganizationJSONLD()],
            content: buildPrivacidadPage()
        },
        {
            file: '404.html',
            currentPage: '/404.html',
            title: 'Página no encontrada',
            description: 'La página que buscas no existe o ha sido movida.',
            url: '/404.html',
            ogImage: siteConfig.seo.og_image,
            jsonLd: [buildOrganizationJSONLD()],
            content: build404Page()
        },
        {
            file: '500.html',
            currentPage: '/500.html',
            title: 'Error del servidor',
            description: 'Ha ocurrido un error inesperado en el servidor.',
            url: '/500.html',
            ogImage: siteConfig.seo.og_image,
            jsonLd: [buildOrganizationJSONLD()],
            content: build500Page()
        }
    ];
    
    for (const page of pages) {
        const html = baseTemplate(page.content, page);
        writeFile(path.join(DIST, page.file), html);
        console.log(`   ✅ ${page.file}`);
    }
    
    // Build individual project pages
    for (const project of publishedProjects) {
        const projectPage = {
            file: `proyectos/${project.slug}/index.html`,
            currentPage: `/proyectos/${project.slug}/`,
            title: project.title,
            description: project.meta?.seo_description || project.description,
            url: `/proyectos/${project.slug}/`,
            ogImage: project.meta?.og_image || project.cover,
            type: 'article',
            jsonLd: [buildOrganizationJSONLD(), buildProjectJSONLD(project)],
            content: buildProyectoPage(project)
        };
        const html = baseTemplate(projectPage.content, projectPage);
        writeFile(path.join(DIST, projectPage.file), html);
        console.log(`   ✅ proyectos/${project.slug}/index.html`);
    }
    
    // Generate sitemap.xml
    generateSitemap();
    
    // Generate robots.txt
    generateRobots();
    
    // Generate .nojekyll
    writeFile(path.join(DIST, '.nojekyll'), '');
    
    // Generate CNAME if domain configured
    if (process.env.CUSTOM_DOMAIN) {
        writeFile(path.join(DIST, 'CNAME'), process.env.CUSTOM_DOMAIN);
    }
    
    console.log('\n✨ Build completado en dist/');
}

function buildHomePage() {
    const featuredProjects = publishedProjects.slice(0, 3);
    return `
<section class="hero" aria-labelledby="hero-title">
    <div class="container">
        <div class="hero-content">
            <h1 id="hero-title" class="hero-title animate-entrance">
                ${e(siteConfig.studio.name)}
            </h1>
            <p class="hero-tagline animate-entrance delay-1">${e(siteConfig.studio.tagline)}</p>
            <p class="hero-desc animate-entrance delay-2">${e(siteConfig.studio.description)}</p>
            <div class="hero-actions animate-entrance delay-3">
                <a href="${asset('/proyectos/')}" class="btn btn-primary">Ver proyectos</a>
                <a href="${asset('/contacto/')}" class="btn btn-outline">Contactar</a>
            </div>
        </div>
        <div class="hero-visual animate-entrance delay-4" aria-hidden="true">
            <img src="${asset('/assets/logos/Imagotipo/Imagotipo_horizontal_color.svg')}" alt="" width="400" height="120">
        </div>
    </div>
</section>

<section class="featured-projects" aria-labelledby="featured-title">
    <div class="container">
        <header class="section-header">
            <h2 id="featured-title">Proyectos destacados</h2>
            <a href="${asset('/proyectos/')}" class="btn btn-text">Ver todos los proyectos</a>
        </header>
        <div class="projects-grid" id="featured-grid">
            ${featuredProjects.map(p => buildProjectCard(p)).join('')}
        </div>
    </div>
</section>

<section class="services-preview" aria-labelledby="services-title">
    <div class="container">
        <header class="section-header">
            <h2 id="services-title">Servicios</h2>
            <a href="${asset('/servicios/')}" class="btn btn-text">Ver todos los servicios</a>
        </header>
        <div class="services-preview-grid">
            ${servicesData.categories.map(cat => `
            <article class="service-preview-card">
                <h3>${e(cat.name)}</h3>
                <p>${e(cat.description)}</p>
                <a href="${asset('/servicios/#' + cat.id)}" class="btn btn-text">Ver servicios</a>
            </article>
            `).join('')}
        </div>
    </div>
</section>

<section class="cta-section" aria-labelledby="cta-title">
    <div class="container">
        <h2 id="cta-title">¿Tienes un proyecto en mente?</h2>
        <p>Hablemos sobre tu idea y cómo podemos ayudarte a materializarla.</p>
        <a href="${asset('/contacto/')}" class="btn btn-primary btn-large">Solicitar cotización</a>
    </div>
</section>
`;
}

function buildProyectosPage() {
    return `
<section class="page-hero" aria-labelledby="page-title">
    <div class="container">
        <h1 id="page-title" class="page-title">Proyectos</h1>
        <p class="page-subtitle">Portafolio de trabajos seleccionados</p>
    </div>
</section>

<section class="projects-section" aria-labelledby="projects-list-title">
    <div class="container">
        <div class="projects-header">
            <h2 id="projects-list-title" class="sr-only">Lista de proyectos</h2>
            <div class="filters" role="group" aria-label="Filtrar por categoría">
                ${buildProjectFilters()}
            </div>
        </div>
        <div class="projects-grid" id="projects-grid">
            ${publishedProjects.map(p => buildProjectCard(p)).join('')}
        </div>
        <div class="projects-empty" id="projects-empty" hidden>
            <p>No hay proyectos en esta categoría.</p>
        </div>
        <nav class="pagination" id="pagination" aria-label="Paginación de proyectos" hidden>
            <button class="page-btn" data-page="prev" aria-label="Página anterior">Anterior</button>
            <span class="page-info" aria-live="polite"></span>
            <button class="page-btn" data-page="next" aria-label="Página siguiente">Siguiente</button>
        </nav>
    </div>
</section>

<script>
window.PROJECTS_DATA = ${JSON.stringify(publishedProjects)};
window.PROJECTS_PER_PAGE = 9;
</script>
`;
}

function buildProyectoPage(project) {
    const index = publishedProjects.findIndex(p => p.slug === project.slug);
    const prevProject = index > 0 ? publishedProjects[index - 1] : null;
    const nextProject = index >= 0 && index < publishedProjects.length - 1 ? publishedProjects[index + 1] : null;
    
    return `
<section class="project-hero" aria-labelledby="project-title" style="--project-color: ${project.meta?.color || siteConfig.colors['azul-electrico']};">
    <div class="container">
        <nav class="project-breadcrumb" aria-label="Ruta de navegación">
            <a href="${asset('/')}">Inicio</a>
            <span aria-hidden="true">/</span>
            <a href="${asset('/proyectos/')}">Proyectos</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">${e(project.title)}</span>
        </nav>
        <header class="project-header">
            <span class="project-category">${e(project.category)}</span>
            <h1 id="project-title" class="project-title">${e(project.title)}</h1>
            <div class="project-meta">
                <span>${e(String(project.year))}</span>
                ${project.categories?.map(c => `<span>${e(c)}</span>`).join('') || ''}
            </div>
        </header>
    </div>
    <div class="project-cover" aria-hidden="true">
        <img src="${asset(project.cover)}" alt="" loading="eager" width="1200" height="600">
    </div>
</section>

<section class="project-content" aria-labelledby="project-desc-title">
    <div class="container">
        <div class="project-main">
            <h2 id="project-desc-title" class="sr-only">Descripción del proyecto</h2>
            <div class="project-description">${e(project.description).replace(/\n/g, '<br>')}</div>
            
            ${project.gallery && project.gallery.length > 0 ? `
            <h2>Galería</h2>
            <div class="project-gallery" role="list" aria-label="Galería del proyecto">
                ${project.gallery.map((img, i) => `
                <figure class="gallery-item" role="listitem">
                    <a href="${asset(img)}" class="gallery-link" data-lightbox="${project.slug}" aria-label="Ver imagen ${i + 1} de ${project.gallery.length}">
                        <img src="${asset(img)}" alt="${e(project.title)} - Vista ${i + 1}" loading="lazy">
                    </a>
                </figure>
                `).join('')}
            </div>
            ` : ''}
            
            ${Object.keys(project.credits || {}).length > 0 ? `
            <h2>Créditos</h2>
            <dl class="project-credits">
                ${Object.entries(project.credits).map(([role, name]) => `
                <dt>${e(role.replace(/_/g, ' '))}</dt>
                <dd>${e(name)}</dd>
                `).join('')}
            </dl>
            ` : ''}
        </div>
        <aside class="project-sidebar">
            <div class="project-info-card">
                <h3>Información</h3>
                <dl>
                    <dt>Año</dt><dd>${e(String(project.year))}</dd>
                    <dt>Categoría</dt><dd>${e(project.category)}</dd>
                    ${project.categories ? `<dt>Etiquetas</dt><dd>${e(project.categories.join(', '))}</dd>` : ''}
                </dl>
            </div>
            <nav class="project-nav" aria-label="Navegación entre proyectos">
                ${prevProject ? `
                <a href="${asset('/proyectos/' + prevProject.slug + '/')}" class="project-nav-link prev">
                    <span class="project-nav-label">Proyecto anterior</span>
                    <span class="project-nav-title">${e(prevProject.title)}</span>
                </a>
                ` : ''}
                ${nextProject ? `
                <a href="${asset('/proyectos/' + nextProject.slug + '/')}" class="project-nav-link next">
                    <span class="project-nav-label">Siguiente proyecto</span>
                    <span class="project-nav-title">${e(nextProject.title)}</span>
                </a>
                ` : ''}
            </nav>
            <a href="${asset('/proyectos/')}" class="btn btn-outline btn-block">Volver al portafolio</a>
        </aside>
    </div>
</section>
`;
}

function buildServiciosPage() {
    return `
<section class="page-hero" aria-labelledby="page-title">
    <div class="container">
        <h1 id="page-title" class="page-title">Servicios</h1>
        <p class="page-subtitle">Diseño gráfico, fotografía y producción audiovisual</p>
    </div>
</section>

<section class="services-full" aria-labelledby="services-list-title">
    <div class="container">
        <h2 id="services-list-title" class="sr-only">Lista de servicios</h2>
        ${buildServicesList()}
    </div>
</section>

<section class="services-cta" aria-labelledby="services-cta-title">
    <div class="container">
        <h2 id="services-cta-title">¿No encuentras lo que buscas?</h2>
        <p>Cada proyecto es único. Cuéntanos qué necesitas y te haremos una propuesta a medida.</p>
        <a href="${asset('/contacto/')}" class="btn btn-primary">Solicitar cotización personalizada</a>
    </div>
</section>

<script>
window.SERVICES_DATA = ${JSON.stringify(servicesData)};
</script>
`;
}

function buildEstudioPage() {
    return `
<section class="page-hero" aria-labelledby="page-title">
    <div class="container">
        <h1 id="page-title" class="page-title">Estudio</h1>
        <p class="page-subtitle">${e(siteConfig.studio.description)}</p>
    </div>
</section>

<section class="studio-story" aria-labelledby="story-title">
    <div class="container">
        <h2 id="story-title">Nuestra historia</h2>
        <div class="story-content">
            <p>CASTROSO.JPG nace en Culiacán, Sinaloa, como un espacio de experimentación visual donde convergen el diseño gráfico, la fotografía y la producción audiovisual.</p>
            <p>Creemos en el poder de la imagen para comunicar, transformar y conectar. Cada proyecto es una oportunidad para explorar nuevos lenguajes visuales, mezclar disciplinas y crear piezas con identidad propia.</p>
            <p>Trabajamos con marcas, bandas, emprendimientos, artistas e instituciones que buscan una voz visual auténtica y memorable.</p>
        </div>
    </div>
</section>

<section class="studio-values" aria-labelledby="values-title">
    <div class="container">
        <h2 id="values-title">Valores</h2>
        <ul class="values-grid">
            <li><strong>Experimentación</strong><br>Probamos, fallamos, aprendemos y volvemos a intentar.</li>
            <li><strong>Honestidad visual</strong><br>No decoramos, comunicamos con intención.</li>
            <li><strong>Colaboración real</strong><br>Escuchamos, entendemos y construimos juntos.</li>
            <li><strong>Calidad artesanal</strong><br>Cuidamos cada detalle, del concepto a la entrega.</li>
        </ul>
    </div>
</section>

<section class="studio-team" aria-labelledby="team-title">
    <div class="container">
        <h2 id="team-title">Equipo</h2>
        <div class="team-grid">
            ${siteConfig.team.map(member => `
            <article class="team-member">
                <div class="member-avatar" aria-hidden="true">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="40" fill="${siteConfig.colors['azul-electrico']}"/>
                        <text x="40" y="50" text-anchor="middle" font-family="Sora, sans-serif" font-size="24" font-weight="700" fill="${siteConfig.colors['blanco-papel']}">${e(member.name.charAt(0))}</text>
                    </svg>
                </div>
                <h3>${e(member.name)}</h3>
                <ul class="member-roles">
                    ${member.roles.map(r => `<li>${e(r)}</li>`).join('')}
                </ul>
                <p class="member-desc">${e(member.description)}</p>
            </article>
            `).join('')}
        </div>
    </div>
</section>

<section class="studio-process" aria-labelledby="process-title">
    <div class="container">
        <h2 id="process-title">Proceso</h2>
        <ol class="process-steps">
            <li>
                <span class="step-number">01</span>
                <h3>Descubrimiento</h3>
                <p>Entrevista, investigación, análisis de competencia y definición de objetivos.</p>
            </li>
            <li>
                <span class="step-number">02</span>
                <h3>Concepto</h3>
                <p>Dirección de arte, moodboards, propuestas visuales y validación con el cliente.</p>
            </li>
            <li>
                <span class="step-number">03</span>
                <h3>Producción</h3>
                <p>Diseño, fotografía, grabación, edición, desarrollo y control de calidad.</p>
            </li>
            <li>
                <span class="step-number">04</span>
                <h3>Entrega</h3>
                <p>Archivos finales, guías de uso, capacitación y seguimiento post-entrega.</p>
            </li>
        </ol>
    </div>
</section>

<section class="studio-stats" aria-labelledby="stats-title">
    <div class="container">
        <h2 id="stats-title" class="sr-only">Estadísticas</h2>
        <ul class="stats-grid">
            <li><strong>2</strong><span>Integrantes</span></li>
            <li><strong>3</strong><span>Disciplinas</span></li>
            <li><strong>13</strong><span>Servicios</span></li>
            <li><strong>∞</strong><span>Posibilidades</span></li>
        </ul>
    </div>
</section>
`;
}

function buildContactoPage() {
    const fields = siteConfig.contact.form_fields;
    return `
<section class="page-hero" aria-labelledby="page-title">
    <div class="container">
        <h1 id="page-title" class="page-title">Contacto</h1>
        <p class="page-subtitle">Cuéntanos tu proyecto y te responderemos lo antes posible</p>
    </div>
</section>

<section class="contact-section" aria-labelledby="contact-form-title">
    <div class="container">
        <div class="contact-grid">
            <div class="contact-info">
                <h2 id="contact-form-title">Hablemos</h2>
                <p>Estamos en Culiacán, Sinaloa, pero trabajamos con clientes de todo México y el mundo.</p>
                <ul class="contact-methods">
                    <li>
                        <a href="${siteConfig.studio.instagram}" target="_blank" rel="noopener noreferrer">
                            <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            Instagram
                        </a>
                    </li>
                    ${siteConfig.studio.email ? `<li><a href="mailto:${siteConfig.studio.email}">Correo electrónico</a></li>` : ''}
                    ${siteConfig.studio.whatsapp ? `<li><a href="${siteConfig.studio.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>` : ''}
                </ul>
                <div class="contact-note">
                    <p><strong>Horario:</strong> Lun–Vie 10:00–19:00 (UTC-6)</p>
                    <p><strong>Tiempo de respuesta:</strong> 24–48h hábiles</p>
                </div>
            </div>
            <form class="contact-form" id="contact-form" novalidate>
                <input type="hidden" name="${siteConfig.contact.honeypot_field}" value="" tabindex="-1" autocomplete="off">
                ${fields.map(field => {
                    if (field.type === 'select') {
                        return `
                        <div class="form-group">
                            <label for="${field.name}">${e(field.label)}${field.required ? ' <span class="required" aria-hidden="true">*</span>' : ''}</label>
                            <select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
                                <option value="">Selecciona una opción</option>
                                ${field.options.map(opt => `<option value="${e(opt)}">${e(opt)}</option>`).join('')}
                            </select>
                        </div>
                        `;
                    } else if (field.type === 'textarea') {
                        return `
                        <div class="form-group">
                            <label for="${field.name}">${e(field.label)}${field.required ? ' <span class="required" aria-hidden="true">*</span>' : ''}</label>
                            <textarea id="${field.name}" name="${field.name}" rows="6" ${field.required ? 'required' : ''} placeholder="${e(field.placeholder || '')}"></textarea>
                        </div>
                        `;
                    } else {
                        return `
                        <div class="form-group">
                            <label for="${field.name}">${e(field.label)}${field.required ? ' <span class="required" aria-hidden="true">*</span>' : ''}</label>
                            <input type="${field.type}" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''} placeholder="${e(field.placeholder || '')}">
                        </div>
                        `;
                    }
                }).join('')}
                <button type="submit" class="btn btn-primary btn-block">${e(siteConfig.contact.submit_text)}</button>
                <p class="form-disclaimer">Al enviar aceptas nuestra <a href="${asset('/privacidad/')}">política de privacidad</a>. Tus datos no se comparten con terceros.</p>
                <div class="form-status" aria-live="polite" hidden></div>
            </form>
        </div>
    </div>
</section>

<script>
window.CONTACT_CONFIG = {
    endpoint: window.CASTROSO_CONFIG?.formspreeEndpoint || '',
    successMessage: ${JSON.stringify(siteConfig.contact.success_message)},
    errorMessage: ${JSON.stringify(siteConfig.contact.error_message)}
};
</script>
`;
}

function buildPrivacidadPage() {
    const studioName = siteConfig.studio.name;
    return `
<section class="page-hero" aria-labelledby="page-title">
    <div class="container">
        <h1 id="page-title" class="page-title">Aviso de privacidad</h1>
        <p class="page-subtitle">Información sobre el tratamiento de tus datos personales</p>
    </div>
</section>

<section class="privacy-content" aria-labelledby="privacy-title">
    <div class="container">
        <div class="privacy-notice">
            <strong>⚠ Aviso importante:</strong> Este aviso contiene campos marcados con <code>[PENDIENTE]</code> que deben completarse con asesoría legal antes de publicar en producción. Consulta la LFPDPPP (México).
        </div>
        
        <article class="privacy-section">
            <h2>1. Identidad y domicilio del responsable</h2>
            <p><strong>Responsable:</strong> ${e(studioName)}</p>
            <p><strong>Domicilio:</strong> [PENDIENTE: Domicilio completo para notificaciones]</p>
            <p><strong>Correo de contacto:</strong> [PENDIENTE: correo@dominio.com]</p>
        </article>
        
        <article class="privacy-section">
            <h2>2. Datos personales que recabamos</h2>
            <p>Recabamos únicamente los datos necesarios para atender solicitudes de contacto y cotización:</p>
            <ul>
                <li>Nombre completo</li>
                <li>Correo electrónico</li>
                <li>Nombre del negocio, banda o proyecto</li>
                <li>Servicio de interés</li>
                <li>Presupuesto aproximado (opcional)</li>
                <li>Descripción del proyecto</li>
                <li>Fecha estimada (opcional)</li>
                <li>Medio preferido de contacto (opcional)</li>
            </ul>
            <p>No recabamos datos sensibles (origen racial o étnico, salud, información genética, creencias religiosas, opinión política, preferencia sexual, etc.).</p>
        </article>
        
        <article class="privacy-section">
            <h2>3. Finalidades del tratamiento</h2>
            <h3>Finalidades primarias (necesarias para la relación):</h3>
            <ul>
                <li>Responder a solicitudes de información y cotización</li>
                <li>Comunicarnos para entender los requerimientos del proyecto</li>
                <li>Enviar propuestas comerciales y presupuestos</li>
                <li>Dar seguimiento a la relación comercial si se formaliza</li>
            </ul>
            <h3>Finalidades secundarias (requieren consentimiento):</h3>
            <ul>
                <li>Envío de newsletter o comunicaciones comerciales</li>
                <li>Inclusión en directorio de clientes</li>
            </ul>
        </article>
        
        <article class="privacy-section">
            <h2>4. Transferencias de datos</h2>
            <p>No transferimos tus datos personales a terceros, excepto:</p>
            <ul>
                <li>Cuando sea requerido por autoridad competente con fundamento legal</li>
                <li>Proveedores de servicios tecnológicos necesarios (hosting, email, formularios) bajo contratos de confidencialidad</li>
            </ul>
            <p>No vendemos, alquilamos ni compartimos tus datos con fines publicitarios de terceros.</p>
        </article>
        
        <article class="privacy-section">
            <h2>5. Derechos ARCO</h2>
            <p>Tienes derecho a:</p>
            <ul>
                <li><strong>Acceso:</strong> Conocer qué datos personales tenemos de ti</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Cancelación:</strong> Solicitar la eliminación de tus datos</li>
                <li><strong>Oposición:</strong> Oponerte al tratamiento para fines específicos</li>
            </ul>
            <h3>Cómo ejercer tus derechos:</h3>
            <p>Envía una solicitud por escrito a <code>[PENDIENTE: correo@dominio.com]</code> con:</p>
            <ul>
                <li>Tu nombre completo</li>
                <li>Copia de identificación oficial</li>
                <li>Descripción clara del derecho que deseas ejercer</li>
                <li>Cualquier documento que facilite la localización de tus datos</li>
            </ul>
            <p>Responderemos en un plazo máximo de 20 días hábiles según la LFPDPPP.</p>
        </article>
        
        <article class="privacy-section">
            <h2>6. Revocación del consentimiento</h2>
            <p>Puedes revocar tu consentimiento en cualquier momento enviando una solicitud al correo indicado. La revocación no tendrá efectos retroactivos.</p>
        </article>
        
        <article class="privacy-section">
            <h2>7. Uso de cookies y tecnologías similares</h2>
            <p>Nuestro sitio web utiliza:</p>
            <ul>
                <li><strong>Cookies técnicas necesarias:</strong> Para el funcionamiento del formulario</li>
                <li><strong>Cookies de análisis (opcional):</strong> Solo si aceptas, para medir tráfico</li>
            </ul>
            <p>Puedes configurar tu navegador para bloquear o eliminar cookies.</p>
        </article>
        
        <article class="privacy-section">
            <h2>8. Seguridad de la información</h2>
            <p>Implementamos medidas razonables para proteger tus datos:</p>
            <ul>
                <li>Comunicación cifrada mediante HTTPS/TLS</li>
                <li>Validación y sanitización de entradas</li>
                <li>Protección CSRF en formularios</li>
                <li>Campo honeypot anti-spam</li>
                <li>Limitación de tasa de envíos</li>
                <li>Acceso restringido a datos solo a personal autorizado</li>
            </ul>
        </article>
        
        <article class="privacy-section">
            <h2>9. Conservación de datos</h2>
            <ul>
                <li>Datos de formulario de contacto: 12 meses después del último contacto</li>
                <li>Datos de clientes activos: Duración de la relación + 5 años (requisitos fiscales)</li>
                <li>Logs de seguridad: 90 días</li>
            </ul>
        </article>
        
        <article class="privacy-section">
            <h2>10. Cambios al aviso de privacidad</h2>
            <p>Nos reservamos el derecho de modificar este aviso. Las versiones actualizadas se publicarán en esta URL con fecha de actualización.</p>
        </article>
        
        <article class="privacy-section">
            <h2>11. Contacto para dudas y ejercicios de derechos</h2>
            <ul>
                <li><strong>Correo:</strong> [PENDIENTE: correo@dominio.com]</li>
                <li><strong>Responsable de protección de datos:</strong> [PENDIENTE: Nombre]</li>
                <li><strong>Domicilio:</strong> [PENDIENTE: Domicilio completo]</li>
            </ul>
        </article>
        
        <div class="privacy-meta">
            <p><strong>Última actualización:</strong> ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Versión:</strong> 1.0</p>
            <p><strong>Debes completar este aviso con asesoría legal antes de poner el sitio en producción.</strong></p>
        </div>
    </div>
</section>
`;
}

function build404Page() {
    return `
<section class="error-page" aria-labelledby="error-title">
    <div class="container">
        <div class="error-content">
            <h1 id="error-title" class="error-code">404</h1>
            <h2 class="error-title">Página no encontrada</h2>
            <p class="error-desc">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
            <div class="error-actions">
                <a href="${asset('/')}" class="btn btn-primary">Volver al inicio</a>
                <a href="${asset('/proyectos/')}" class="btn btn-outline">Ver proyectos</a>
            </div>
        </div>
    </div>
</section>
`;
}

function build500Page() {
    return `
<section class="error-page" aria-labelledby="error-title">
    <div class="container">
        <div class="error-content">
            <h1 id="error-title" class="error-code">500</h1>
            <h2 class="error-title">Error del servidor</h2>
            <p class="error-desc">Lo sentimos, ha ocurrido un error inesperado al procesar la página.</p>
            <p class="error-desc">Este sitio se aloja en GitHub Pages como sitio estático; GitHub Pages no genera respuestas automáticas de error 500 del servidor.</p>
            <div class="error-actions">
                <a href="${asset('/')}" class="btn btn-primary">Volver al inicio</a>
                <a href="${asset('/proyectos/')}" class="btn btn-outline">Ver proyectos</a>
            </div>
        </div>
    </div>
</section>
`;
}

function generateSitemap() {
    const today = new Date().toISOString().split('T')[0];
    const urls = [
        { url: `${SITE_URL}${asset('/')}`, changefreq: 'weekly', priority: 1.0 },
        { url: `${SITE_URL}${asset('/proyectos/')}`, changefreq: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}${asset('/servicios/')}`, changefreq: 'monthly', priority: 0.8 },
        { url: `${SITE_URL}${asset('/estudio/')}`, changefreq: 'monthly', priority: 0.6 },
        { url: `${SITE_URL}${asset('/contacto/')}`, changefreq: 'yearly', priority: 0.5 },
        { url: `${SITE_URL}${asset('/privacidad/')}`, changefreq: 'yearly', priority: 0.3 },
    ];
    
    for (const project of publishedProjects) {
        urls.push({
            url: `${SITE_URL}${asset('/proyectos/' + project.slug + '/')}`,
            changefreq: 'monthly',
            priority: 0.7
        });
    }
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${e(u.url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    
    writeFile(path.join(DIST, 'sitemap.xml'), sitemap);
    console.log('   ✅ sitemap.xml');
}

function generateRobots() {
    const base = BASE_PATH ? BASE_PATH : '/';
    const robots = `User-agent: *
Allow: ${base}

Sitemap: ${SITE_URL}${asset('/sitemap.xml')}

# No indexar páginas legales y de error
Disallow: ${base}privacidad/
Disallow: ${base}404.html
Disallow: ${base}500.html`;
    writeFile(path.join(DIST, 'robots.txt'), robots);
    console.log('   ✅ robots.txt');
}

build().catch(err => {
    console.error('❌ Error en build:', err);
    process.exit(1);
});
