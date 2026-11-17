#!/usr/bin/env node
/**
 * Genera imágenes placeholder para proyectos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(ROOT, 'public', 'assets', 'images', 'projects');

const COLORS = {
    negro: '#08090B',
    papel: '#F2F0EA',
    azul: '#145BFF',
    rojo: '#E52B35',
    verde: '#187A50',
    gris: '#777777'
};

const projects = [
    { id: 'identidad-castroso', title: 'Identidad visual CASTROSO.JPG', color: COLORS.azul },
    { id: 'sistema-editorial', title: 'Sistema gráfico editorial', color: COLORS.rojo }
];

if (process.env.FORCE_PLACEHOLDERS !== '1') {
    console.error('Este generador está obsoleto y crea placeholders. Usa FORCE_PLACEHOLDERS=1 solo para pruebas temporales.');
    process.exit(1);
}

async function generateProjectImages() {
    console.log('📸 Generando imágenes placeholder para proyectos...');
    
    for (const project of projects) {
        const projectDir = path.join(PROJECTS_DIR, project.id);
        fs.mkdirSync(projectDir, { recursive: true });
        
        // Cover (800x600)
        await generateCover(projectDir, project);
        
        // OG image (1200x630)
        await generateOG(projectDir, project);
        
        // Gallery images (800x600)
        const galleryCount = project.id === 'identidad-castroso' ? 4 : 2;
        for (let i = 1; i <= galleryCount; i++) {
            await generateGallery(projectDir, project, i, galleryCount);
        }
        
        console.log(`   ✅ ${project.id}/`);
    }
    
    console.log('\n✨ Imágenes de proyectos generadas');
}

async function generateCover(dir, project) {
    const width = 800;
    const height = 600;
    
    const bg = await sharp({
        create: { width, height, channels: 3, background: COLORS.negro }
    }).jpeg({ quality: 85 }).toBuffer();
    
    const pattern = await createPattern(width, height, project.color);
    const logo = await createProjectTitle(project.title, width);
    
    await sharp(bg)
        .composite([
            { input: pattern, blend: 'overlay' },
            { input: logo, left: (width - 700) / 2, top: (height - 120) / 2 },
            { input: await createCoverLines(width, project.color), left: 0, top: height - 100 }
        ])
        .jpeg({ quality: 85 })
        .toFile(path.join(dir, 'cover.jpg'));
}

async function generateOG(dir, project) {
    const width = 1200;
    const height = 630;
    
    const bg = await sharp({
        create: { width, height, channels: 3, background: COLORS.negro }
    }).jpeg({ quality: 85 }).toBuffer();
    
    const pattern = await createPattern(width, height, project.color);
    const title = await createProjectTitle(project.title, width);
    
    await sharp(bg)
        .composite([
            { input: pattern, blend: 'overlay' },
            { input: title, left: (width - 900) / 2, top: 200 },
            { input: await createOGTagline(), left: 250, top: 350 },
            { input: await createBottomLine(width, project.color), left: 0, top: 580 }
        ])
        .jpeg({ quality: 85 })
        .toFile(path.join(dir, 'og.jpg'));
}

async function generateGallery(dir, project, index, total) {
    const width = 800;
    const height = 600;
    
    const bg = await sharp({
        create: { width, height, channels: 3, background: COLORS.negro }
    }).jpeg({ quality: 80 }).toBuffer();
    
    const pattern = await createPattern(width, height, project.color, 0.03);
    const label = await createGalleryLabel(`${project.title} — Vista ${index}/${total}`, width);
    
    await sharp(bg)
        .composite([
            { input: pattern, blend: 'overlay' },
            { input: label, left: (width - 600) / 2, top: (height - 80) / 2 }
        ])
        .jpeg({ quality: 80 })
        .toFile(path.join(dir, `${String(index).padStart(2, '0')}.jpg`));
}

function createPattern(width, height, accentColor, opacity = 0.05) {
    const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="${accentColor}" opacity="${opacity}"/>
        </pattern>
        <pattern id="lines" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="${accentColor}" stroke-width="0.3" opacity="${opacity}"/>
        </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)"/>
    <rect width="100%" height="100%" fill="url(#lines)"/>
</svg>`;
    return Buffer.from(svg);
}

function createCoverLines(width, color) {
    const svg = `
<svg width="${width}" height="100" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="50" x2="${width - 50}" y2="50" stroke="${color}" stroke-width="2" opacity="0.5"/>
    <line x1="80" y1="55" x2="${width - 80}" y2="55" stroke="${color}" stroke-width="1" opacity="0.3"/>
    <circle cx="${width / 2}" cy="50" r="4" fill="${COLORS.rojo}" opacity="0.8"/>
</svg>`;
    return Buffer.from(svg);
}

function createBottomLine(width, color) {
    const svg = `
<svg width="${width}" height="50" xmlns="http://www.w3.org/2000/svg">
    <line x1="100" y1="25" x2="${width - 100}" y2="25" stroke="${color}" stroke-width="1" opacity="0.3"/>
    <circle cx="${width / 2}" cy="25" r="3" fill="${COLORS.rojo}" opacity="0.8"/>
</svg>`;
    return Buffer.from(svg);
}

function createProjectTitle(title, maxWidth) {
    const words = title.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (testLine.length > 35) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    
    const lineHeight = 56;
    const totalHeight = lines.length * lineHeight;
    const startY = 100;
    
    const svg = `
<svg width="${maxWidth}" height="${totalHeight + 100}" xmlns="http://www.w3.org/2000/svg">
    ${lines.map((line, i) => `
    <text x="${maxWidth / 2}" y="${startY + i * lineHeight}" text-anchor="middle" font-family="Sora, sans-serif" font-size="42" font-weight="700" fill="${COLORS.papel}" letter-spacing="0.02em">${line}</text>
    `).join('')}
</svg>`;
    return Buffer.from(svg);
}

function createOGTagline() {
    const svg = `
<svg width="700" height="80" xmlns="http://www.w3.org/2000/svg">
    <text x="350" y="55" text-anchor="middle" font-family="Sora, sans-serif" font-size="32" font-weight="500" fill="${COLORS.gris}" letter-spacing="0.1em">CREA. EXPERIMENTA. COMPARTE.</text>
</svg>`;
    return Buffer.from(svg);
}

function createGalleryLabel(text, width) {
    const svg = `
<svg width="${width}" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect x="50" y="10" width="${width - 100}" height="60" fill="${COLORS.papel}" fill-opacity="0.1" stroke="${COLORS.gris}" stroke-opacity="0.3" stroke-width="1" rx="4"/>
    <text x="${width / 2}" y="50" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="16" fill="${COLORS.gris}">${text}</text>
</svg>`;
    return Buffer.from(svg);
}

generateProjectImages().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});