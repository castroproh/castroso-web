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
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const DIST = path.join(ROOT, 'dist');

function normalizeCustomDomain(rawValue) {
    const value = String(rawValue || '').trim().toLowerCase();
    if (!value) return '';
    if (value.includes('://') || value.includes('/') || value.includes(':') || value.includes('?') || value.includes('#')) {
        throw new Error('CUSTOM_DOMAIN debe contener únicamente un hostname, sin protocolo, ruta ni puerto.');
    }
    const url = new URL(`https://${value}`);
    const hostnamePattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    if (url.hostname !== value || !hostnamePattern.test(value)) {
        throw new Error('CUSTOM_DOMAIN no es un hostname válido.');
    }
    return value;
}

function normalizeBasePath(rawValue) {
    const value = String(rawValue ?? '').trim();
    if (value === '') return '';
    if (value.includes('..') || value.includes('?') || value.includes('#')) {
        throw new Error('BASE_PATH contiene segmentos o caracteres no permitidos.');
    }
    const leading = value.startsWith('/') ? value : `/${value}`;
    return `${leading.replace(/\/+$/, '')}/`;
}

function normalizeSiteUrl(rawValue) {
    const parsed = new URL(String(rawValue || ''));
    const isLocalHttp = process.env.NODE_ENV !== 'production' && parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !isLocalHttp) {
        throw new Error('SITE_URL debe usar HTTPS (HTTP solo está permitido en localhost durante desarrollo).');
    }
    if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
        throw new Error('SITE_URL debe ser un origen HTTPS, sin credenciales, ruta, query ni fragmento.');
    }
    return parsed.origin;
}

function securePublicEndpoint(rawValue, label) {
    const value = String(rawValue || '').trim();
    if (!value) return '';
    const parsed = new URL(value);
    const isLocalHttp = process.env.NODE_ENV !== 'production' && parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !isLocalHttp) {
        throw new Error(`${label} debe usar HTTPS (HTTP solo está permitido en localhost durante desarrollo).`);
    }
    if (parsed.username || parsed.password || parsed.hash || parsed.search) {
        throw new Error(`${label} no puede contener credenciales, query strings ni fragmentos URL.`);
    }
    return parsed.toString();
}

const CUSTOM_DOMAIN = normalizeCustomDomain(process.env.CUSTOM_DOMAIN);
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH ?? (CUSTOM_DOMAIN ? '/' : '/castroso-web/'));
const SITE_URL = normalizeSiteUrl(process.env.SITE_URL ?? (CUSTOM_DOMAIN ? `https://${CUSTOM_DOMAIN}` : 'https://castroproh.github.io'));

// Los endpoints que transmiten datos personales permanecen desactivados por defecto.
// Para habilitarlos en un build de producción se requieren DOS banderas explícitas:
// consentimiento/revisión legal registrada y activación operacional aprobada.
const privacyApprovedForBuild = process.env.PUBLIC_LEADS_PRIVACY_APPROVED === 'true';
const contactEndpointsEnabled = privacyApprovedForBuild && process.env.CONTACT_ENDPOINTS_ENABLED === 'true';
const formspreeEndpoint = contactEndpointsEnabled
    ? securePublicEndpoint(process.env.FORMSPREE_ENDPOINT, 'FORMSPREE_ENDPOINT')
    : '';
const mainLeadsEndpoint = contactEndpointsEnabled
    ? securePublicEndpoint(process.env.MAIN_LEADS_ENDPOINT, 'MAIN_LEADS_ENDPOINT')
    : '';
// El newsletter implica una finalidad secundaria y no tiene todavía un consentimiento
// independiente en la interfaz: no se inyecta endpoint hasta implementar ese consentimiento.
const newsletterEndpoint = '';

function readJSON(file) {
    return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf-8'));
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
    const clean = p.startsWith('/') ? p : '/' + p;
    return base + clean;
}

function e(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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

function pad(num) {
    return String(num).padStart(2, '0');
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

    for (const member of siteConfig.team || []) {
        if (!member.photo) {
            warnings.push(`site.json: '${member.name}' no tiene retrato`);
            continue;
        }
        for (const width of member.photo.widths || []) {
            for (const ext of ['avif', 'webp', 'jpg']) {
                const file = path.join(PUBLIC, `${member.photo.base}-${width}.${ext}`);
                if (!fs.existsSync(file)) {
                    warnings.push(`site.json: retrato no encontrado: ${member.photo.base}-${width}.${ext}`);
                }
            }
        }
    }

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
        if (project.gallery_notes && project.gallery_notes.length !== (project.gallery || []).length) {
            warnings.push(`projects.json: '${project.slug}' gallery_notes no coincide con gallery`);
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
const allCategories = [...new Set(publishedProjects.flatMap(p => p.categories || [p.category]))];
const team = siteConfig.team || [];

/* --------------------------------------------------------------------------
   Helpers de presentación
   -------------------------------------------------------------------------- */

function accentFor(category) {
    const c = String(category || '').toLowerCase();
    if (c.includes('foto')) return siteConfig.colors['rojo-intenso'];
    if (c.includes('audio')) return siteConfig.colors['verde-oscuro'];
    return siteConfig.colors['azul-electrico'];
}

function countServices(category) {
    return (category.services || []).filter(service => service.active !== false).length;
}

function teamMember(name) {
    return team.find(member => member.name === name) || {};
}

function normalizePath(href) {
    let h = String(href).replace('.php', '');
    if (h !== '/') h = h.replace(/\/+$/, '') + '/';
    return h;
}

function buildPicture(photo, options = {}) {
    if (!photo || !photo.base) return '';
    const widths = photo.widths || [480, 720];
    const fallback = widths[widths.length - 1];
    const { sizes = '100vw', className = '', imgClass = '', loading = 'lazy', fetchPriority = '', alt = '' } = options;
    const srcset = (ext) => widths
        .map(width => `${asset(`${photo.base}-${width}.${ext}`)} ${width}w`)
        .join(', ');

    return `<picture class="${className}">
        <source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">
        <source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">
        <img class="${imgClass}" src="${asset(`${photo.base}-${fallback}.jpg`)}" srcset="${srcset('jpg')}" sizes="${sizes}" width="${photo.width}" height="${photo.height}" alt="${e(alt || photo.alt || '')}" loading="${loading}" decoding="async"${fetchPriority ? ` fetchpriority="${fetchPriority}"` : ''} style="object-position:${photo.focus || '50% 50%'}">
    </picture>`;
}

function buildTeamPortrait(member, options = {}) {
    const photo = buildPicture(member.photo, {
        sizes: options.sizes || '(max-width: 860px) 100vw, 40vw',
        className: 'portrait-media',
        loading: options.loading || 'lazy',
        fetchPriority: options.fetchPriority || '',
        alt: member.photo?.alt || `${member.name}, ${member.roles?.[0] || 'integrante'} de CASTROSO.JPG`
    });

    return `<figure class="portrait ${options.className || ''}">
        ${photo}
        <figcaption class="portrait-caption">
            <span>${e(member.photo?.caption || `Retrato / ${member.name}`)}</span>
            <span>${e((member.roles || []).slice(0, 2).join(' / '))}</span>
        </figcaption>
    </figure>`;
}

function buildNavigation(currentPath) {
    const current = normalizePath(currentPath);
    return siteConfig.navigation.map((item, index) => {
        const href = normalizePath(item.href);
        return {
            ...item,
            href: asset(href),
            active: href === current,
            index: index + 1
        };
    }).map(item => `
        <li class="nav-item">
            <a href="${item.href}" class="nav-link${item.active ? ' active' : ''}"${item.active ? ' aria-current="page"' : ''}>
                <span class="nav-index" aria-hidden="true">${pad(item.index)}</span>
                <span>${e(item.label)}</span>
            </a>
        </li>
    `).join('');
}

function buildTopbar() {
    return `
<div class="topbar">
    <div class="container topbar-inner">
        <span class="topbar-item">Estudio creativo independiente</span>
        <span class="topbar-item topbar-item--center">${e(siteConfig.studio.location)}</span>
        <span class="topbar-item">Edición 2026</span>
    </div>
</div>`;
}

function buildHeader(currentPage = '/') {
    const navItems = buildNavigation(currentPage);
    const logoPath = asset('/assets/logos/Imagotipo/Imagotipo_horizontal_color.svg');

    return `
<header class="site-header" role="banner">
    <div class="container header-inner">
        <a href="${asset('/')}" class="site-logo" aria-label="${e(siteConfig.studio.name)} — Inicio">
            <img src="${logoPath}" alt="${e(siteConfig.studio.name)}" width="180" height="37">
        </a>
        <nav class="main-nav" aria-label="Navegación principal">
            <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Abrir menú">
                <span class="nav-toggle-icon" aria-hidden="true"></span>
            </button>
            <ul id="nav-menu" class="nav-list">
                ${navItems}
                <li class="nav-item nav-item--cta">
                    <a href="${asset('/contacto/')}" class="btn btn-primary btn-sm">Hablemos</a>
                </li>
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
    const whatsapp = siteConfig.studio.whatsapp || '';

    return `
<footer class="site-footer" role="contentinfo">
    <div class="container">
        <div class="footer-top">
            <div class="footer-brand">
                <a href="${asset('/')}" class="footer-logo-link" aria-label="${e(siteConfig.studio.name)} — Inicio">
                    <img src="${asset('/assets/logos/Isotipo/Isotipo_color.svg')}" alt="" aria-hidden="true" width="64" height="38" class="footer-logo" loading="lazy">
                </a>
                <p class="footer-tagline">${e(siteConfig.studio.tagline)}</p>
                <p class="footer-desc">${e(siteConfig.studio.description)}</p>
                <address class="footer-location">${e(siteConfig.studio.location)}</address>
            </div>
            <nav class="footer-nav" aria-label="Enlaces del sitio">
                <h2 class="footer-heading">Índice</h2>
                <ul>
                    <li><a href="${asset('/')}">Inicio</a></li>
                    <li><a href="${asset('/proyectos/')}">Proyectos</a></li>
                    <li><a href="${asset('/servicios/')}">Servicios</a></li>
                    <li><a href="${asset('/estudio/')}">Estudio</a></li>
                    <li><a href="${asset('/contacto/')}">Contacto</a></li>
                </ul>
            </nav>
            <nav class="footer-nav" aria-label="Disciplinas">
                <h2 class="footer-heading">Disciplinas</h2>
                <ul>
                    <li><a href="${asset('/servicios/#diseno-grafico')}">Diseño gráfico</a></li>
                    <li><a href="${asset('/servicios/#fotografia')}">Fotografía</a></li>
                    <li><a href="${asset('/servicios/#audiovisual')}">Audiovisual</a></li>
                </ul>
            </nav>
            <div class="footer-contact">
                <h2 class="footer-heading">Contacto</h2>
                <ul>
                    <li><a href="${igUrl}" target="_blank" rel="noopener noreferrer">Instagram <span aria-hidden="true">↗</span></a></li>
                    ${email ? `<li><a href="mailto:${email}">Correo electrónico</a></li>` : ''}
                    ${whatsapp ? `<li><a href="${whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>` : ''}
                </ul>
                <a href="${asset('/contacto/')}" class="footer-cta">Iniciar un proyecto <span aria-hidden="true">→</span></a>
                <form class="newsletter-form" action="#" method="POST" data-formspree="newsletter" aria-label="Suscripción al newsletter">
                    <input type="hidden" name="_gotcha" value="" tabindex="-1" autocomplete="off">
                    <label for="newsletter-email" class="sr-only">Correo para newsletter</label>
                    <input type="email" id="newsletter-email" name="email" placeholder="Tu correo" required>
                    <button type="submit" class="btn btn-outline btn-sm">Suscribirse</button>
                    <p class="form-disclaimer">Al suscribirte aceptas nuestra <a href="${asset('/privacidad/')}">política de privacidad</a>. Sin spam.</p>
                </form>
            </div>
        </div>
        <div class="footer-marquee" aria-hidden="true">
            <div class="footer-marquee-track">
                <span>${e(siteConfig.studio.tagline)}</span><span>${e(siteConfig.studio.tagline)}</span>
                <span>${e(siteConfig.studio.tagline)}</span><span>${e(siteConfig.studio.tagline)}</span>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; ${year} ${e(siteConfig.studio.name)}. Todos los derechos reservados.</p>
            <p class="footer-legal"><a href="${asset('/privacidad/')}">Aviso de privacidad</a></p>
            <a href="#main-content" class="footer-top-link">Volver arriba <span aria-hidden="true">↑</span></a>
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
    const ogAlt = page.ogAlt || `${e(siteConfig.studio.name)} — ${e(siteConfig.studio.tagline)}`;
    const robots = page.robots || 'index,follow';

    let meta = `
    <title>${title}</title>
    <meta name="description" content="${e(description)}">
    <meta name="keywords" content="${e(siteConfig.seo.keywords)}">
    <meta name="author" content="${e(siteConfig.studio.name)}">
    <meta name="robots" content="${robots}">
    <meta name="theme-color" content="${siteConfig.colors['negro-carbon']}">
    <meta name="color-scheme" content="dark light">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${e(page.ogTitle || title)}">
    <meta property="og:description" content="${e(description)}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:alt" content="${ogAlt}">
    <meta property="og:site_name" content="${e(siteConfig.studio.name)}">
    <meta property="og:locale" content="es_MX">
    <meta name="twitter:card" content="${siteConfig.seo.twitter_card}">
    <meta name="twitter:title" content="${e(page.ogTitle || title)}">
    <meta name="twitter:description" content="${e(description)}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="twitter:image:alt" content="${ogAlt}">`;

    if (page.jsonLd) {
        meta += `\n    <script type="application/ld+json">${JSON.stringify(page.jsonLd, null, 2)}</script>`;
    }

    return meta;
}

function buildSectionHead({ eyebrow, title, link, linkLabel, id }) {
    return `
<header class="section-head">
    <div class="section-head-title">
        <span class="eyebrow">${e(eyebrow)}</span>
        <h2${id ? ` id="${id}"` : ''}>${title}</h2>
    </div>
    ${link ? `<a class="link-arrow" href="${link}">${e(linkLabel || 'Ver más')} <span aria-hidden="true">→</span></a>` : ''}
</header>`;
}

function buildProjectCard(project, index = 0, variant = 'archive') {
    const href = asset(`/proyectos/${project.slug}/`);
    const cover = project.cover || '/assets/images/og-default.jpg';
    const categories = (project.categories || [project.category]).join(' · ');
    const accent = accentFor(project.category);
    const containClass = project.fit === 'contain' ? ' project-card--contain' : '';
    const summary = project.summary || project.description;

    return `
<article class="project-card project-card--${variant}${containClass}" data-category="${e(project.category)}" data-project-slug="${e(project.slug)}" style="--accent:${accent}">
    <a href="${href}" class="project-card-link" aria-label="Ver proyecto: ${e(project.title)}">
        <div class="project-card-media">
            <img src="${asset(cover)}" alt="${e(project.title)} — ${e(project.image_label || 'portada')}" loading="lazy" width="1200" height="900">
            <span class="project-card-index" aria-hidden="true">${pad(index + 1)}</span>
            <span class="project-card-tag">${e(project.category)}</span>
        </div>
        <div class="project-card-body">
            <div class="project-card-top">
                <span>${e(categories)}</span>
                <span>${e(String(project.year))}</span>
            </div>
            <h3 class="project-card-title">${e(project.title)}</h3>
            <p class="project-card-summary">${e(summary)}</p>
            <span class="project-card-cta">Ver caso <span aria-hidden="true">↗</span></span>
        </div>
    </a>
</article>
`;
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
        "url": `${SITE_URL}${asset('/')}`,
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
        "url": `${SITE_URL}${asset('/')}`,
        "inLanguage": "es-MX"
    };
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
<body class="${pageMeta.bodyClass || ''}">
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    ${buildTopbar()}
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

    copyDir(PUBLIC, DIST);

    const clientConfig = {
        basePath: BASE_PATH,
        siteUrl: SITE_URL,
        formspreeEndpoint,
        mainLeadsEndpoint,
        newsletterEndpoint,
        contactEndpointsEnabled,
        privacyApprovedForBuild,
        newsletterEnabled: false,
        serviceCategories: Object.fromEntries(servicesData.categories.flatMap(category =>
            category.services.map(service => [service.id, category.name])
        )),
        studio: siteConfig.studio,
        contact: siteConfig.contact,
    };
    const configJs = `window.CASTROSO_CONFIG = ${JSON.stringify(clientConfig)};\n`;
    writeFile(path.join(DIST, 'assets/js/config.js'), configJs);

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

    const pages = [
        {
            file: 'index.html',
            currentPage: '/',
            title: '',
            description: '',
            url: '/',
            ogImage: siteConfig.seo.og_image,
            bodyClass: 'page-home',
            jsonLd: [buildOrganizationJSONLD(), buildWebSiteJSONLD()],
            content: buildHomePage()
        },
        {
            file: 'proyectos/index.html',
            currentPage: '/proyectos/',
            title: 'Proyectos',
            description: 'Archivo de proyectos de CASTROSO.JPG: identidad visual, sistema editorial y construcción de imagen desde Culiacán, Sinaloa.',
            url: '/proyectos/',
            ogImage: siteConfig.seo.og_image,
            bodyClass: 'page-projects',
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
            bodyClass: 'page-services',
            jsonLd: [buildOrganizationJSONLD()],
            content: buildServiciosPage()
        },
        {
            file: 'estudio/index.html',
            currentPage: '/estudio/',
            title: 'Estudio',
            description: 'Conoce CASTROSO.JPG: estudio creativo independiente en Culiacán. Mateo y Santiel, su forma de trabajo, principios y proceso.',
            url: '/estudio/',
            ogImage: siteConfig.seo.og_image,
            bodyClass: 'page-studio',
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
            bodyClass: 'page-contact',
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
            bodyClass: 'page-legal',
            robots: 'noindex,follow',
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
            bodyClass: 'page-error',
            robots: 'noindex,follow',
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
            bodyClass: 'page-error',
            robots: 'noindex,follow',
            jsonLd: [buildOrganizationJSONLD()],
            content: build500Page()
        }
    ];

    for (const page of pages) {
        const html = baseTemplate(page.content, page);
        writeFile(path.join(DIST, page.file), html);
        console.log(`   ✅ ${page.file}`);
    }

    for (const project of publishedProjects) {
        const projectPage = {
            file: `proyectos/${project.slug}/index.html`,
            currentPage: `/proyectos/${project.slug}/`,
            title: project.title,
            description: project.meta?.seo_description || project.description,
            url: `/proyectos/${project.slug}/`,
            ogImage: project.meta?.og_image || project.cover,
            ogAlt: `${project.title} — ${siteConfig.studio.name}`,
            bodyClass: 'page-project',
            type: 'article',
            jsonLd: [buildOrganizationJSONLD(), buildProjectJSONLD(project)],
            content: buildProyectoPage(project)
        };
        const html = baseTemplate(projectPage.content, projectPage);
        writeFile(path.join(DIST, projectPage.file), html);
        console.log(`   ✅ proyectos/${project.slug}/index.html`);
    }

    generateSitemap();
    generateRobots();
    writeFile(path.join(DIST, '.nojekyll'), '');

    if (CUSTOM_DOMAIN) {
        writeFile(path.join(DIST, 'CNAME'), `${CUSTOM_DOMAIN}\n`);
    }

    console.log('\n✨ Build completado en dist/');
}

/* --------------------------------------------------------------------------
   HOME
   -------------------------------------------------------------------------- */

function buildHomePage() {
    const featured = publishedProjects.slice(0, 2);
    const mateo = teamMember('Mateo');
    const santiel = teamMember('Santiel');
    const categories = servicesData.categories.map(category => ({
        ...category,
        activeServices: (category.services || []).filter(service => service.active !== false)
    }));
    const tickerItems = ['Diseño gráfico', 'Dirección de arte', 'Fotografía', 'Audiovisual', 'Diseño web', 'Creación independiente'];
    const ticker = [...tickerItems, ...tickerItems].map(item => `<span>${e(item)}</span><i aria-hidden="true"></i>`).join('');

    return `
<section class="hero hero--home" aria-labelledby="hero-title">
    <div class="container hero-grid">
        <div class="hero-copy">
            <div class="hero-kicker">
                <span class="kicker-index">01</span>
                <span>Estudio creativo independiente</span>
            </div>
            <h1 id="hero-title" class="hero-title">
                <span class="hero-line">Ideas que</span>
                <span class="hero-line">se vuelven</span>
                <span class="hero-line hero-line--accent">imagen<span class="hero-dot">.</span></span>
            </h1>
            <p class="hero-lead">Diseño gráfico, dirección de arte, fotografía y producción audiovisual desde Culiacán, Sinaloa. Construimos piezas con intención para marcas, artistas y proyectos que buscan una voz propia.</p>
            <div class="hero-actions">
                <a class="btn btn-primary btn-lg" href="${asset('/contacto/')}">Cuéntanos tu proyecto <span aria-hidden="true">→</span></a>
                <a class="link-arrow" href="${asset('/proyectos/')}">Ver el archivo <span aria-hidden="true">↗</span></a>
            </div>
            <ul class="hero-disciplines" aria-label="Disciplinas del estudio">
                <li><span>01</span> Diseño gráfico</li>
                <li><span>02</span> Fotografía</li>
                <li><span>03</span> Audiovisual</li>
            </ul>
        </div>
        <div class="hero-portraits">
            ${buildTeamPortrait(mateo, { className: 'portrait--primary', sizes: '(max-width: 860px) 48vw, 32vw', loading: 'eager', fetchPriority: 'high' })}
            ${buildTeamPortrait(santiel, { className: 'portrait--secondary', sizes: '(max-width: 860px) 40vw, 24vw', loading: 'eager' })}
            <span class="hero-stamp" aria-hidden="true">CASTROSO.JPG<br>ESTUDIO / 2026</span>
        </div>
    </div>
    <div class="container hero-foot">
        <a class="hero-scroll" href="#manifiesto">
            <span class="hero-scroll-label">Crea. Experimenta. Comparte.</span>
            <span class="hero-scroll-icon" aria-hidden="true">↓</span>
        </a>
        <span class="hero-location">Culiacán, Sinaloa — MX / 24.8091° N · 107.3940° O</span>
    </div>
</section>

<div class="ticker" aria-hidden="true">
    <div class="ticker-track">${ticker}</div>
</div>

<section id="manifiesto" class="manifesto section--paper" aria-labelledby="manifesto-title">
    <div class="container manifesto-grid">
        <div class="section-rail">
            <span class="rail-index">01</span>
            <span class="rail-label">Manifiesto</span>
        </div>
        <div class="manifesto-main">
            <h2 id="manifesto-title">No hacemos ruido.<br>Hacemos <em>imagen</em>.</h2>
            <div class="manifesto-cols">
                <p>CASTROSO.JPG es un estudio creativo independiente en Culiacán, Sinaloa. Nos movemos entre el diseño gráfico, la fotografía y el audiovisual con una misma idea: construir piezas que se sientan vivas, con intención y carácter.</p>
                <p>Trabajamos con marcas, bandas, proyectos culturales y gente que tiene algo que decir. Escuchamos, entendemos y construimos juntos, del concepto a la entrega.</p>
            </div>
            <a class="link-arrow" href="${asset('/estudio/')}">Conoce el estudio <span aria-hidden="true">→</span></a>
        </div>
        <aside class="manifesto-aside" aria-label="Datos del estudio">
            <div class="manifesto-block">
                <span class="mono">Archivo</span>
                <strong>JPG</strong>
                <span class="mono">Culiacán, Sin.<br>México</span>
            </div>
            <ul class="manifesto-list">
                ${categories.map(category => `
                <li><span>${e(category.name)}</span><span>${pad(countServices(category))}</span></li>`).join('')}
            </ul>
        </aside>
    </div>
</section>

<section class="featured-projects" aria-labelledby="featured-title">
    <div class="container">
        ${buildSectionHead({
            eyebrow: '02 / Archivo',
            title: 'Proyectos',
            link: asset('/proyectos/'),
            linkLabel: 'Ver todos',
            id: 'featured-title'
        })}
        <div class="projects-grid projects-grid--featured">
            ${featured.map((project, index) => buildProjectCard(project, index, 'feature')).join('')}
        </div>
    </div>
</section>

<section class="services-preview" aria-labelledby="services-title">
    <div class="container">
        ${buildSectionHead({
            eyebrow: '03 / Disciplinas',
            title: 'Qué hacemos',
            link: asset('/servicios/'),
            linkLabel: 'Ver servicios',
            id: 'services-title'
        })}
        <div class="discipline-list">
            ${categories.map((category, index) => `
            <a class="discipline-row" href="${asset('/servicios/#' + category.id)}" style="--accent:${accentFor(category.name)}">
                <span class="discipline-index">${pad(index + 1)}</span>
                <span class="discipline-name">${e(category.name)}</span>
                <span class="discipline-desc">${e(category.description)}</span>
                <span class="discipline-count">${pad(countServices(category))} servicios</span>
                <span class="discipline-arrow" aria-hidden="true">↗</span>
            </a>`).join('')}
        </div>
    </div>
</section>

<section class="studio-teaser section--paper" aria-labelledby="studio-teaser-title">
    <div class="container">
        ${buildSectionHead({
            eyebrow: '04 / Estudio',
            title: 'Dos personas.<br>Una forma de mirar.',
            link: asset('/estudio/'),
            linkLabel: 'Conoce al equipo',
            id: 'studio-teaser-title'
        })}
        <div class="studio-teaser-grid">
            <div class="studio-teaser-copy">
                <p class="studio-lead">Detrás de CASTROSO.JPG hay dos personas que trabajan entre disciplina y disciplina: diseño, imagen y sonido.</p>
                <ul class="team-mini-list">
                    <li>
                        <span class="team-mini-index">01</span>
                        <div>
                            <strong>${e(mateo.name)}</strong>
                            <span>${e((mateo.roles || []).join(' / '))}</span>
                        </div>
                    </li>
                    <li>
                        <span class="team-mini-index">02</span>
                        <div>
                            <strong>${e(santiel.name)}</strong>
                            <span>${e((santiel.roles || []).join(' / '))}</span>
                        </div>
                    </li>
                </ul>
                <a class="link-arrow" href="${asset('/contacto/')}">Trabaja con nosotros <span aria-hidden="true">→</span></a>
            </div>
            ${buildTeamPortrait(mateo, { className: 'portrait--teaser portrait--teaser-a', sizes: '(max-width: 860px) 46vw, 28vw' })}
            ${buildTeamPortrait(santiel, { className: 'portrait--teaser portrait--teaser-b', sizes: '(max-width: 860px) 46vw, 28vw' })}
        </div>
    </div>
</section>

<section class="how-to-start" aria-labelledby="how-to-start-title">
    <div class="container">
        ${buildSectionHead({
            eyebrow: '04.5 / Cómo empezar',
            title: 'Tres pasos para trabajar juntos',
            link: asset('/contacto/'),
            linkLabel: 'Iniciar una conversación',
            id: 'how-to-start-title'
        })}
        <div class="steps-grid">
            <div class="step">
                <span class="step-num">01</span>
                <h3>Contacto</h3>
                <p>Escríbenos por el formulario, Instagram o WhatsApp. Cuéntanos qué necesitas y en qué rango de inversión piensas.</p>
            </div>
            <div class="step">
                <span class="step-num">02</span>
                <h3>Propuesta</h3>
                <p>Te enviamos una propuesta con alcance, entregables, tiempos y costo. Sin sorpresas ni letras chicas.</p>
            </div>
            <div class="step">
                <span class="step-num">03</span>
                <h3>Producción</h3>
                <p>Diseñamos, fotografiamos, grabamos o desarrollamos. Entregamos archivos finales y guías de uso.</p>
            </div>
        </div>
    </div>
</section>

<section class="cta-section" aria-labelledby="cta-title">
    <div class="container cta-grid">
        <div class="cta-copy">
            <span class="eyebrow">05 / Contacto</span>
            <h2 id="cta-title">¿Hacemos algo<br>que se recuerde?</h2>
            <p>Cuéntanos qué tienes en mente. Podemos empezar con una identidad, una sesión de fotos, un video o una conversación.</p>
            <a class="btn btn-paper" href="${asset('/contacto/')}">Empezar un proyecto <span aria-hidden="true">→</span></a>
        </div>
        <div class="cta-meta">
            <span class="mono">Culiacán, Sinaloa</span>
            <a href="${siteConfig.studio.instagram}" target="_blank" rel="noopener noreferrer">@castroso.jpg <span aria-hidden="true">↗</span></a>
            <span class="mono">Crea. Experimenta. Comparte.</span>
        </div>
    </div>
</section>
`;
}

/* --------------------------------------------------------------------------
   PROYECTOS
   -------------------------------------------------------------------------- */

function buildProyectosPage() {
    const total = publishedProjects.length;
    return `
<section class="page-hero page-hero--archive" aria-labelledby="page-title">
    <div class="container">
        <div class="page-hero-top">
            <span class="eyebrow">Archivo / ${new Date().getFullYear()}</span>
            <span class="mono">${pad(total)} ${total === 1 ? 'proyecto' : 'proyectos'}</span>
        </div>
        <h1 id="page-title" class="page-title">Proyectos</h1>
        <div class="page-hero-bottom">
            <p class="page-subtitle">Identidad, sistema editorial y construcción de imagen. Una selección de trabajos reales del estudio, con sus recursos originales.</p>
            <p class="page-hero-note">Cada proyecto se documenta con lo que existe: piezas, decisiones y criterios de uso. Sin métricas inventadas.</p>
        </div>
    </div>
</section>

<section class="projects-section" aria-labelledby="projects-list-title">
    <div class="container">
        <div class="projects-toolbar">
            <h2 id="projects-list-title" class="sr-only">Lista de proyectos</h2>
            <div class="filters" role="group" aria-label="Filtrar por categoría">
                ${buildProjectFilters()}
            </div>
            <p class="projects-count" aria-live="polite">${pad(total)} ${total === 1 ? 'proyecto' : 'proyectos'}</p>
        </div>
        <div class="projects-grid projects-grid--archive" id="projects-grid">
            ${publishedProjects.map((project, index) => buildProjectCard(project, index, 'archive')).join('')}
        </div>
        <div class="projects-empty" id="projects-empty" hidden>
            <p class="eyebrow">Sin resultados</p>
            <p>No hay proyectos en esta categoría. Prueba con otra o ve el archivo completo.</p>
            <a href="${asset('/proyectos/')}" class="link-arrow">Ver todos <span aria-hidden="true">→</span></a>
        </div>
        <nav class="pagination" id="pagination" aria-label="Paginación de proyectos" hidden>
            <button class="page-btn" data-page="prev" aria-label="Página anterior">← Anterior</button>
            <span class="page-info" aria-live="polite"></span>
            <button class="page-btn" data-page="next" aria-label="Página siguiente">Siguiente →</button>
        </nav>
    </div>
</section>

<script>
window.PROJECTS_DATA = ${JSON.stringify(publishedProjects).replace(/</g, '\\u003c')};
window.PROJECTS_PER_PAGE = 9;
</script>
`;
}

function buildProyectoPage(project) {
    const index = publishedProjects.findIndex(item => item.slug === project.slug);
    const prevProject = index > 0 ? publishedProjects[index - 1] : null;
    const nextProject = index >= 0 && index < publishedProjects.length - 1 ? publishedProjects[index + 1] : null;
    const accent = accentFor(project.category);
    const categories = project.categories || [project.category];
    const caseStudy = project.case_study || {};
    const chapters = [
        { id: 'introduccion', title: 'Introducción', body: caseStudy.intro || project.description },
        { id: 'objetivo', title: 'Objetivo', body: caseStudy.objective },
        { id: 'concepto', title: 'Concepto', body: caseStudy.concept },
        { id: 'direccion-visual', title: 'Dirección visual', body: caseStudy.visual_direction },
        { id: 'desarrollo', title: 'Desarrollo', body: caseStudy.development },
        { id: 'aplicaciones', title: 'Aplicaciones', body: caseStudy.applications },
        { id: 'resultado', title: 'Resultado', body: caseStudy.result }
    ].filter(chapter => chapter.body);

    const chapterMarkup = chapters.map((chapter, chapterIndex) => `
        <section class="case-section" id="${chapter.id}" aria-labelledby="${chapter.id}-title">
            <div class="case-section-head">
                <span class="case-num" aria-hidden="true">${pad(chapterIndex + 1)}</span>
                <h2 id="${chapter.id}-title">${e(chapter.title)}</h2>
            </div>
            <div class="case-section-body">
                <p>${e(chapter.body)}</p>
            </div>
        </section>
    `).join('');

    const gallery = project.gallery && project.gallery.length > 0 ? `
        <div class="case-gallery-wrap">
            <div class="case-gallery-head">
                <h2 class="eyebrow">Galería / recursos originales</h2>
                <span class="mono">${pad(project.gallery.length)} piezas</span>
            </div>
            <div class="project-gallery" role="list" aria-label="Galería del proyecto">
                ${project.gallery.map((img, i) => `
                <figure class="gallery-item" role="listitem">
                    <a href="${asset(img)}" class="gallery-link" data-lightbox="${project.slug}" aria-label="Ver imagen ${i + 1} de ${project.gallery.length}">
                        <img src="${asset(img)}" alt="${e(project.title)} — ${e((project.gallery_notes || [])[i] || project.image_label || 'imagen')}" loading="lazy" width="1200" height="900">
                        <span class="gallery-index" aria-hidden="true">${pad(i + 1)}</span>
                    </a>
                    <figcaption>${e((project.gallery_notes || [])[i] || `${project.image_label || 'Pieza'} ${i + 1}`)}</figcaption>
                </figure>
                `).join('')}
            </div>
        </div>` : '';

    return `
<article class="project-detail" style="--accent:${accent}">
    <header class="project-hero">
        <div class="container">
            <nav class="breadcrumb" aria-label="Ruta de navegación">
                <a href="${asset('/')}">Inicio</a>
                <span aria-hidden="true">/</span>
                <a href="${asset('/proyectos/')}">Proyectos</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">${e(project.title)}</span>
            </nav>
            <div class="project-header-grid">
                <div class="project-header-main">
                    <span class="project-category">${e(project.category)}</span>
                    <h1 class="project-title">${e(project.title)}</h1>
                </div>
                <div class="project-header-meta">
                    <p class="project-summary">${e(project.summary || project.description)}</p>
                    <dl class="project-meta-list">
                        <div><dt>Año</dt><dd>${e(String(project.year))}</dd></div>
                        <div><dt>Categoría</dt><dd>${e(project.category)}</dd></div>
                        <div><dt>Disciplinas</dt><dd>${categories.map(e).join(' · ')}</dd></div>
                    </dl>
                </div>
            </div>
        </div>
        <figure class="project-cover">
            <img src="${asset(project.cover)}" alt="${e(project.title)} — ${e(project.image_label || 'imagen principal')}" width="1600" height="1000" loading="eager">
            ${project.media_type === 'vector' ? `<figcaption class="project-cover-badge">${e(project.image_label || 'Pieza vectorial')}</figcaption>` : ''}
        </figure>
    </header>

    ${project.image_note ? `
    <div class="container">
        <p class="project-media-note"><strong>${e(project.image_label || 'Nota')}</strong> ${e(project.image_note)}</p>
    </div>` : ''}

    <section class="case-study" aria-label="Caso de estudio">
        <div class="container case-layout">
            <aside class="case-aside">
                <div class="case-toc">
                    <span class="eyebrow">Caso de estudio</span>
                    <ol>
                        ${chapters.map((chapter, chapterIndex) => `<li><a href="#${chapter.id}"><span>${pad(chapterIndex + 1)}</span>${e(chapter.title)}</a></li>`).join('')}
                    </ol>
                </div>
                <a href="${asset('/contacto/')}?servicio=${encodeURIComponent(project.category)}" class="btn btn-primary btn-block">Quiero algo así <span aria-hidden="true">→</span></a>
                <a href="${asset('/proyectos/')}" class="link-arrow">← Volver al archivo</a>
            </aside>

            <div class="case-body">
                ${chapterMarkup}
                ${gallery}

                ${Object.keys(project.credits || {}).length > 0 ? `
                <div class="case-credits">
                    <h2 class="eyebrow">Créditos</h2>
                    <dl class="project-credits">
                        ${Object.entries(project.credits).map(([role, name]) => `
                        <div class="credit">
                            <dt class="credit-label">${e(role.replace(/_/g, ' '))}</dt>
                            <dd class="credit-value">${e(name)}</dd>
                        </div>
                        `).join('')}
                    </dl>
                </div>` : ''}
            </div>
        </div>
    </section>

    <nav class="project-pagination" aria-label="Navegación entre proyectos">
        <div class="container project-pagination-inner">
            ${prevProject ? `
            <a href="${asset('/proyectos/' + prevProject.slug + '/')}" class="project-nav-link prev">
                <span class="project-nav-label">← Anterior</span>
                <span class="project-nav-title">${e(prevProject.title)}</span>
            </a>` : '<span class="project-nav-spacer"></span>'}
            ${nextProject ? `
            <a href="${asset('/proyectos/' + nextProject.slug + '/')}" class="project-nav-link next">
                <span class="project-nav-label">Siguiente →</span>
                <span class="project-nav-title">${e(nextProject.title)}</span>
            </a>` : '<span class="project-nav-spacer"></span>'}
        </div>
    </nav>
</article>
`;
}

/* --------------------------------------------------------------------------
   SERVICIOS
   -------------------------------------------------------------------------- */

function serviceCode(categoryName, index) {
    const c = String(categoryName || '').toLowerCase();
    const prefix = c.includes('foto') ? 'F' : c.includes('audio') ? 'A' : 'D';
    return `${prefix}-${pad(index + 1)}`;
}

function buildServicesList() {
    return servicesData.categories.map((category, categoryIndex) => {
        const services = (category.services || []).filter(service => service.active !== false);
        const accent = accentFor(category.name);
        return `
        <section id="${category.id}" class="service-chapter" style="--accent:${accent}" aria-labelledby="${category.id}-title">
            <div class="service-chapter-grid">
                <header class="service-chapter-head">
                    <span class="chapter-index" aria-hidden="true">${pad(categoryIndex + 1)}</span>
                    <h2 id="${category.id}-title">${e(category.name)}</h2>
                    <p>${e(category.description)}</p>
                    <span class="chapter-count">${pad(services.length)} servicios</span>
                </header>
                <div class="service-ledger">
                    ${services.map((service, serviceIndex) => `
                    <article class="service-item" data-service="${service.id}">
                        <div class="service-item-head">
                            <span class="service-code" aria-hidden="true">${serviceCode(category.name, serviceIndex)}</span>
                            <div class="service-item-title">
                                <h3>${e(service.name)}</h3>
                                <span class="service-modalidad">${e(service.modalidad)}</span>
                            </div>
                        </div>
                        <p class="service-desc">${e(service.description)}</p>
                        <details class="service-includes">
                            <summary>Qué incluye</summary>
                            <ul>${(service.includes || []).map(item => `<li>${e(item)}</li>`).join('')}</ul>
                        </details>
                        ${service.examples && service.examples.length > 0 ? `<p class="service-examples"><span>Ejemplo</span> ${service.examples.map(e).join(' · ')}</p>` : ''}
                        <a href="${asset('/contacto/')}?servicio=${encodeURIComponent(category.name)}&servicio_especifico=${encodeURIComponent(service.name)}" class="link-arrow service-cta">Cotizar <span aria-hidden="true">→</span></a>
                    </article>
                    `).join('')}
                </div>
            </div>
        </section>
        `;
    }).join('');
}

function buildServiciosPage() {
    const totalServices = servicesData.categories.reduce((total, category) => total + countServices(category), 0);
    return `
<section class="page-hero page-hero--services" aria-labelledby="page-title">
    <div class="container">
        <div class="page-hero-top">
            <span class="eyebrow">Lo que hacemos</span>
            <span class="mono">${pad(totalServices)} servicios / ${pad(servicesData.categories.length)} disciplinas</span>
        </div>
        <h1 id="page-title" class="page-title">Servicios</h1>
        <div class="page-hero-bottom">
            <p class="page-subtitle">Diseño gráfico, fotografía y producción audiovisual. Cada proyecto se cotiza según alcance, tiempos y uso.</p>
            <p class="page-hero-note">Un mismo estudio para pensar la identidad, producir la imagen y llevarla a los soportes correctos.</p>
        </div>
    </div>
</section>

<section class="services-full" aria-labelledby="services-list-title">
    <div class="container">
        <h2 id="services-list-title" class="sr-only">Lista de servicios</h2>
        <nav class="services-index" aria-label="Índice de disciplinas">
            ${servicesData.categories.map((category, index) => `
            <a href="#${category.id}" style="--accent:${accentFor(category.name)}">
                <span class="services-index-num">${pad(index + 1)}</span>
                <span>${e(category.name)}</span>
                <span class="services-index-count">${pad(countServices(category))}</span>
            </a>`).join('')}
        </nav>
        ${buildServicesList()}
        <p class="services-note-text">${e(servicesData.note || '')}</p>
    </div>
</section>

<section class="services-cta" aria-labelledby="services-cta-title">
    <div class="container cta-grid">
        <div class="cta-copy">
            <span class="eyebrow">A medida</span>
            <h2 id="services-cta-title">¿No encuentras lo que buscas?</h2>
            <p>También armamos propuestas que cruzan disciplinas: una identidad que se mueve, una sesión que se vuelve catálogo, un video que ordena la marca.</p>
            <a href="${asset('/contacto/')}" class="btn btn-paper">Solicitar cotización <span aria-hidden="true">→</span></a>
        </div>
        <div class="cta-meta">
            <span class="mono">Del concepto a la entrega</span>
            <span class="mono">Diseño / Foto / Audiovisual</span>
        </div>
    </div>
</section>

<script>
window.SERVICES_DATA = ${JSON.stringify(servicesData).replace(/</g, '\\u003c')};
</script>
`;
}

/* --------------------------------------------------------------------------
   ESTUDIO
   -------------------------------------------------------------------------- */

function buildEstudioPage() {
    const mateo = teamMember('Mateo');
    const santiel = teamMember('Santiel');
    const teamProfiles = [
        { member: mateo, index: 0, reverse: false },
        { member: santiel, index: 1, reverse: true }
    ];

    return `
<section class="studio-hero" aria-labelledby="page-title">
    <div class="container">
        <div class="page-hero-top">
            <span class="eyebrow">Estudio / ${new Date().getFullYear()}</span>
            <span class="mono">${e(siteConfig.studio.location)}</span>
        </div>
        <h1 id="page-title" class="studio-title">Dos personas.<br>Una forma<br>de mirar.</h1>
        <div class="studio-hero-bottom">
            <p class="studio-hero-lead">${e(siteConfig.studio.description)}</p>
            <span class="mono">${pad(team.length)} integrantes / ${pad(servicesData.categories.length)} disciplinas / ${pad(servicesData.categories.reduce((total, category) => total + countServices(category), 0))} servicios</span>
        </div>
    </div>
    <div class="container studio-diptych">
        ${buildTeamPortrait(mateo, { className: 'studio-diptych-item studio-diptych-item--a', sizes: '(max-width: 860px) 50vw, 50vw', loading: 'eager', fetchPriority: 'high' })}
        ${buildTeamPortrait(santiel, { className: 'studio-diptych-item studio-diptych-item--b', sizes: '(max-width: 860px) 50vw, 50vw', loading: 'eager' })}
    </div>
</section>

<section class="studio-story section--paper" aria-labelledby="story-title">
    <div class="container">
        <div class="section-rail">
            <span class="rail-index">01</span>
            <span class="rail-label">Historia</span>
        </div>
        <div class="studio-story-grid">
            <div class="studio-story-head">
                <h2 id="story-title">Un archivo que se sigue escribiendo.</h2>
            </div>
            <div class="studio-story-body">
                <p class="story-lead">CASTROSO.JPG nace en Culiacán, Sinaloa, como un espacio de experimentación visual donde convergen el diseño gráfico, la fotografía y la producción audiovisual.</p>
                <p>Creemos en el poder de la imagen para comunicar, transformar y conectar. Cada proyecto es una oportunidad para explorar nuevos lenguajes visuales, mezclar disciplinas y crear piezas con identidad propia.</p>
                <p>Trabajamos con marcas, bandas, emprendimientos, artistas e instituciones que buscan una voz visual auténtica y memorable.</p>
            </div>
            <div class="studio-story-mark" aria-hidden="true">
                <span>CREA.</span>
                <span>EXPERIMENTA.</span>
                <span>COMPARTE.</span>
            </div>
        </div>
    </div>
</section>

<section class="studio-team" aria-labelledby="team-title">
    <div class="container">
        <header class="section-head section-head--studio">
            <div class="section-head-title">
                <span class="eyebrow">02 / Equipo</span>
                <h2 id="team-title">Las personas<br>detrás del archivo.</h2>
            </div>
            <p class="section-head-note">Dos integrantes, disciplinas complementarias y una misma obsesión por la imagen bien hecha.</p>
        </header>
        <div class="team-profiles">
            ${teamProfiles.map(({ member, index, reverse }) => `
            <article class="team-profile${reverse ? ' team-profile--reverse' : ''}" id="${slugify(member.name)}">
                <div class="team-profile-media">
                    ${buildTeamPortrait(member, { className: 'team-profile-portrait', sizes: '(max-width: 860px) 100vw, 42vw' })}
                    <span class="team-profile-index" aria-hidden="true">${pad(index + 1)} / ${pad(team.length)}</span>
                </div>
                <div class="team-profile-body">
                    <span class="eyebrow">Integrante ${pad(index + 1)}</span>
                    <h3 class="team-profile-name">${e(member.name)}</h3>
                    <p class="team-profile-desc">${e(member.description)}</p>
                    <ul class="team-roles">
                        ${(member.roles || []).map(role => `<li>${e(role)}</li>`).join('')}
                    </ul>
                    <a href="${asset('/proyectos/')}" class="link-arrow">Ver el archivo <span aria-hidden="true">→</span></a>
                </div>
            </article>`).join('')}
        </div>
    </div>
</section>

<section class="studio-values section--paper" aria-labelledby="values-title">
    <div class="container">
        <div class="section-rail">
            <span class="rail-index">03</span>
            <span class="rail-label">Principios</span>
        </div>
        <header class="section-head">
            <div class="section-head-title">
                <h2 id="values-title">Cómo trabajamos</h2>
            </div>
            <p class="section-head-note">Cuatro principios que sostienen el proceso, no sólo el resultado.</p>
        </header>
        <ol class="values-grid">
            <li class="value-item">
                <span class="value-num" aria-hidden="true">01</span>
                <h3>Experimentación</h3>
                <p>Probamos, fallamos, aprendemos y volvemos a intentar.</p>
            </li>
            <li class="value-item">
                <span class="value-num" aria-hidden="true">02</span>
                <h3>Honestidad visual</h3>
                <p>No decoramos: comunicamos con intención.</p>
            </li>
            <li class="value-item">
                <span class="value-num" aria-hidden="true">03</span>
                <h3>Colaboración real</h3>
                <p>Escuchamos, entendemos y construimos juntos.</p>
            </li>
            <li class="value-item">
                <span class="value-num" aria-hidden="true">04</span>
                <h3>Calidad artesanal</h3>
                <p>Cuidamos cada detalle, del concepto a la entrega.</p>
            </li>
        </ol>
    </div>
</section>

<section class="studio-process" aria-labelledby="process-title">
    <div class="container">
        <header class="section-head">
            <div class="section-head-title">
                <span class="eyebrow">04 / Método</span>
                <h2 id="process-title">Proceso</h2>
            </div>
            <p class="section-head-note">Un método claro. La flexibilidad suficiente para adaptarlo a cada proyecto.</p>
        </header>
        <ol class="process-steps">
            <li class="process-step">
                <span class="step-number" aria-hidden="true">01</span>
                <h3>Descubrimiento</h3>
                <p>Entrevista, investigación, análisis de competencia y definición de objetivos.</p>
            </li>
            <li class="process-step">
                <span class="step-number" aria-hidden="true">02</span>
                <h3>Concepto</h3>
                <p>Dirección de arte, moodboards, propuestas visuales y validación con el cliente.</p>
            </li>
            <li class="process-step">
                <span class="step-number" aria-hidden="true">03</span>
                <h3>Producción</h3>
                <p>Diseño, fotografía, grabación, edición, desarrollo y control de calidad.</p>
            </li>
            <li class="process-step">
                <span class="step-number" aria-hidden="true">04</span>
                <h3>Entrega</h3>
                <p>Archivos finales, guías de uso, capacitación y seguimiento post-entrega.</p>
            </li>
        </ol>
    </div>
</section>

<section class="studio-stats" aria-labelledby="stats-title">
    <div class="container">
        <h2 id="stats-title" class="sr-only">Estudio en cifras</h2>
        <ul class="stats-grid">
            <li><strong>02</strong><span>Integrantes</span></li>
            <li><strong>03</strong><span>Disciplinas</span></li>
            <li><strong>${pad(servicesData.categories.reduce((total, category) => total + countServices(category), 0))}</strong><span>Servicios</span></li>
            <li><strong>01</strong><span>Estudio</span></li>
        </ul>
    </div>
</section>

<section class="services-cta" aria-labelledby="studio-cta-title">
    <div class="container cta-grid">
        <div class="cta-copy">
            <span class="eyebrow">Hablemos</span>
            <h2 id="studio-cta-title">¿Te gustaría trabajar con nosotros?</h2>
            <p>Cuéntanos qué tienes en mente. Nos interesa entender el proyecto antes de proponer una solución.</p>
            <a href="${asset('/contacto/')}" class="btn btn-paper">Escríbenos <span aria-hidden="true">→</span></a>
        </div>
        <div class="cta-meta">
            <a href="${siteConfig.studio.instagram}" target="_blank" rel="noopener noreferrer">@castroso.jpg <span aria-hidden="true">↗</span></a>
            <span class="mono">${e(siteConfig.studio.location)}</span>
        </div>
    </div>
</section>
`;
}

/* --------------------------------------------------------------------------
   CONTACTO
   -------------------------------------------------------------------------- */

function buildContactoPage() {
    const fields = siteConfig.contact.form_fields;
    const igUrl = siteConfig.studio.instagram;
    const halfFields = new Set(['nombre', 'email', 'servicio', 'presupuesto', 'fecha_estimada', 'medio_contacto']);
    const autocompleteMap = {
        nombre: 'name',
        email: 'email',
        proyecto_nombre: 'organization',
        descripcion: 'off'
    };

    const fieldMarkup = fields.map(field => {
        const requiredAttr = field.required ? 'required' : '';
        const reqMark = field.required ? ' <span class="required" aria-hidden="true">*</span>' : '';
        const groupClass = `form-group${halfFields.has(field.name) ? ' form-group--half' : ''}`;
        const autocomplete = autocompleteMap[field.name] ? ` autocomplete="${autocompleteMap[field.name]}"` : '';

        if (field.type === 'select') {
            return `
            <div class="${groupClass}">
                <label class="form-label" for="${field.name}">${e(field.label)}${reqMark}</label>
                <select class="form-input" id="${field.name}" name="${field.name}" ${requiredAttr}>
                    <option value="">Selecciona una opción</option>
                    ${field.options.map(opt => `<option value="${e(opt)}">${e(opt)}</option>`).join('')}
                </select>
            </div>`;
        }
        if (field.type === 'textarea') {
            return `
            <div class="${groupClass}">
                <label class="form-label" for="${field.name}">${e(field.label)}${reqMark}</label>
                <textarea class="form-input" id="${field.name}" name="${field.name}" rows="6" ${requiredAttr} placeholder="${e(field.placeholder || '')}"></textarea>
            </div>`;
        }
        return `
            <div class="${groupClass}">
                <label class="form-label" for="${field.name}">${e(field.label)}${reqMark}</label>
                <input class="form-input" type="${field.type}" id="${field.name}" name="${field.name}" ${requiredAttr} placeholder="${e(field.placeholder || '')}"${autocomplete}>
            </div>`;
    }).join('');

    return `
<section class="page-hero page-hero--contact" aria-labelledby="page-title">
    <div class="container">
        <div class="page-hero-top">
            <span class="eyebrow">Contacto</span>
            <span class="mono">Culiacán, Sinaloa — MX</span>
        </div>
        <h1 id="page-title" class="page-title">Hablemos</h1>
        <div class="page-hero-bottom">
            <p class="page-subtitle">Cuéntanos qué quieres construir. Revisamos cada mensaje y respondemos con una propuesta clara.</p>
            <p class="page-hero-note">También puedes escribirnos por Instagram si prefieres una conversación rápida.</p>
        </div>
    </div>
</section>

<section class="contact-section" aria-labelledby="contact-form-title">
    <div class="container contact-grid">
        <aside class="contact-info">
            <span class="eyebrow">01 / Datos</span>
            <h2 id="contact-form-title">Empecemos.</h2>
            <p class="contact-intro">Estamos en Culiacán, Sinaloa, pero trabajamos con proyectos de todo México y el mundo.</p>
            <ul class="contact-methods">
                <li class="contact-method">
                    <span class="contact-method-icon" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </span>
                    <span class="contact-method-content">
                        <span class="contact-method-label">Instagram</span>
                        <a href="${igUrl}" target="_blank" rel="noopener noreferrer">@castroso.jpg</a>
                    </span>
                </li>
                ${siteConfig.studio.email ? `
                <li class="contact-method">
                    <span class="contact-method-icon" aria-hidden="true">@</span>
                    <span class="contact-method-content">
                        <span class="contact-method-label">Correo</span>
                        <a href="mailto:${siteConfig.studio.email}">${e(siteConfig.studio.email)}</a>
                    </span>
                </li>` : ''}
                ${siteConfig.studio.whatsapp ? `
                <li class="contact-method">
                    <span class="contact-method-icon" aria-hidden="true">✆</span>
                    <span class="contact-method-content">
                        <span class="contact-method-label">WhatsApp</span>
                        <a href="${siteConfig.studio.whatsapp}" target="_blank" rel="noopener noreferrer">Escríbenos</a>
                    </span>
                </li>` : ''}
            </ul>
            <div class="contact-location">
                <span class="mono">Base</span>
                <address>${e(siteConfig.studio.location)}</address>
            </div>
            <div class="contact-links">
                <span class="mono">Prefieres empezar por</span>
                <ul>
                    <li><a href="${asset('/servicios/#diseno-grafico')}">Diseño gráfico</a></li>
                    <li><a href="${asset('/servicios/#fotografia')}">Fotografía</a></li>
                    <li><a href="${asset('/servicios/#audiovisual')}">Audiovisual</a></li>
                </ul>
            </div>
        </aside>

        <div class="contact-form-wrap">
            <div class="contact-form-head">
                <span class="eyebrow">02 / Formulario</span>
                <p>Los campos marcados con <span class="required">*</span> son obligatorios.</p>
            </div>
            <form class="contact-form" id="contact-form" method="post" novalidate>
                <input type="hidden" name="${siteConfig.contact.honeypot_field}" value="" tabindex="-1" autocomplete="off">
                ${fieldMarkup}
                <label class="form-field form-field--consent"><input type="checkbox" name="privacy_consent" value="yes" required> <span>He leído y acepto el <a href="${asset('/privacidad/')}">aviso de privacidad</a>.</span></label>
                <button type="submit" class="btn btn-primary btn-block">${e(siteConfig.contact.submit_text)} <span aria-hidden="true">→</span></button>
                <p class="form-disclaimer">Al enviar aceptas nuestra <a href="${asset('/privacidad/')}">política de privacidad</a>. Si el envío no está disponible, puedes escribirnos por Instagram y con gusto revisamos tu proyecto.</p>
                <div class="form-status" aria-live="polite" hidden></div>
                <noscript>
                    <p class="form-disclaimer">El formulario necesita JavaScript. Si prefieres, escríbenos por <a href="${igUrl}" target="_blank" rel="noopener noreferrer">Instagram (@castroso.jpg)</a>.</p>
                </noscript>
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

/* --------------------------------------------------------------------------
   PRIVACIDAD
   -------------------------------------------------------------------------- */

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
            <p>El formulario solicita únicamente los datos necesarios para atender consultas y cotizaciones. Mientras no se configure un endpoint, el sitio no envía esos datos. Si se activa el newsletter, también se solicitará un correo electrónico.</p>
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
            <p>Cuando se configure un endpoint de formularios, el proveedor que lo procese recibirá los datos enviados. Deben completarse aquí su identidad, condiciones y medidas aplicables antes de activar los envíos.</p>
            <ul>
                <li>Cuando sea requerido por autoridad competente con fundamento legal</li>
                <li>Proveedores de servicios tecnológicos necesarios, conforme a sus avisos y acuerdos aplicables</li>
            </ul>
            <p>No se afirma que un proveedor externo esté configurado actualmente.</p>
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
            <p>El sitio no integra actualmente herramientas propias de analítica ni una plataforma de gestión de cookies. Verifica los servicios de hosting y formularios que se configuren antes de publicar este aviso.</p>
            <ul>
                <li><strong>Servicios externos:</strong> Sus tecnologías y cookies deberán documentarse si se añaden o activan.</li>
            </ul>
        </article>
        
        <article class="privacy-section">
            <h2>8. Seguridad de la información</h2>
            <p>Este sitio estático no almacena solicitudes en un servidor propio. La protección y el tratamiento del envío dependerán del hosting y del proveedor de formularios que se configure.</p>
            <ul>
                <li>El formulario aplica validación en el navegador; el proveedor deberá validar también los datos recibidos.</li>
                <li>Incluye un campo honeypot, que no sustituye controles del proveedor.</li>
                <li>La disponibilidad de HTTPS depende de la configuración de GitHub Pages.</li>
            </ul>
        </article>
        
        <article class="privacy-section">
            <h2>9. Conservación de datos</h2>
            <ul>
                <li>Datos enviados por formularios: [PENDIENTE: proveedor y plazo de conservación aplicable]</li>
                <li>Datos asociados a una relación comercial: [PENDIENTE: definir plazos con asesoría legal]</li>
                <li>Registros del hosting y de formularios: [PENDIENTE: confirmar políticas de cada proveedor]</li>
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

/* --------------------------------------------------------------------------
   ERRORES
   -------------------------------------------------------------------------- */

function build404Page() {
    return `
<section class="error-page" aria-labelledby="error-title">
    <div class="container error-content">
        <p class="error-code" aria-hidden="true">404</p>
        <span class="eyebrow">Archivo no encontrado</span>
        <h1 id="error-title" class="error-title">Esta página no está en el archivo.</h1>
        <p class="error-desc">Puede que el enlace haya cambiado o que la pieza todavía no exista. Vuelve al inicio o revisa los proyectos publicados.</p>
        <div class="error-actions">
            <a href="${asset('/')}" class="btn btn-primary">Volver al inicio</a>
            <a href="${asset('/proyectos/')}" class="btn btn-outline">Ver proyectos</a>
        </div>
    </div>
</section>
`;
}

function build500Page() {
    return `
<section class="error-page" aria-labelledby="error-title">
    <div class="container error-content">
        <p class="error-code" aria-hidden="true">500</p>
        <span class="eyebrow">Error del servidor</span>
        <h1 id="error-title" class="error-title">Algo se rompió en el proceso.</h1>
        <p class="error-desc">Ha ocurrido un error inesperado al procesar la página.</p>
        <p class="error-desc">Este sitio se aloja en GitHub Pages como sitio estático; GitHub Pages no genera respuestas automáticas de error 500 del servidor.</p>
        <div class="error-actions">
            <a href="${asset('/')}" class="btn btn-primary">Volver al inicio</a>
            <a href="${asset('/proyectos/')}" class="btn btn-outline">Ver proyectos</a>
        </div>
    </div>
</section>
`;
}

/* --------------------------------------------------------------------------
   SITEMAP / ROBOTS
   -------------------------------------------------------------------------- */

function generateSitemap() {
    const today = new Date().toISOString().split('T')[0];
    const urls = [
        { url: `${SITE_URL}${asset('/')}`, changefreq: 'weekly', priority: 1.0 },
        { url: `${SITE_URL}${asset('/proyectos/')}`, changefreq: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}${asset('/servicios/')}`, changefreq: 'monthly', priority: 0.8 },
        { url: `${SITE_URL}${asset('/estudio/')}`, changefreq: 'monthly', priority: 0.6 },
        { url: `${SITE_URL}${asset('/contacto/')}`, changefreq: 'yearly', priority: 0.5 }
    ];
    // La página /privacidad/ se publica con noindex y robots.txt la excluye.
    // Por coherencia, no debe anunciarse en el sitemap.

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
    const basePrefix = BASE_PATH.replace(/\/+$/, '');
    const rootPath = `${basePrefix}/`;
    const robots = `User-agent: *
Allow: ${rootPath}

Sitemap: ${SITE_URL}${asset('/sitemap.xml')}

# No indexar páginas legales y de error
Disallow: ${rootPath}privacidad/
Disallow: ${rootPath}404.html
Disallow: ${rootPath}500.html`;
    writeFile(path.join(DIST, 'robots.txt'), robots);
    console.log('   ✅ robots.txt');
}

build().catch(err => {
    console.error('❌ Error en build:', err);
    process.exit(1);
});
