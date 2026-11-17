#!/usr/bin/env node
/**
 * Genera imagen Open Graph por defecto (1200x630)
 * Composición gráfica con identidad CASTROSO.JPG
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'public', 'assets', 'images', 'og-default.jpg');
const LOGOS_DIR = path.join(ROOT, 'public', 'assets', 'logos');

const COLORS = {
    negro: '#08090B',
    papel: '#F2F0EA',
    azul: '#145BFF',
    rojo: '#E52B35',
    verde: '#187A50',
    gris: '#777777'
};

async function generateOGImage() {
    console.log('🖼️  Generando imagen Open Graph (1200x630)...');
    
    const width = 1200;
    const height = 630;
    
    // Fondo base: negro carbón
    const background = await sharp({
        create: {
            width,
            height,
            channels: 3,
            background: COLORS.negro
        }
    }).jpeg({ quality: 90 }).toBuffer();
    
    // Cargar logos
    const imagotipoBuffer = fs.readFileSync(path.join(LOGOS_DIR, 'Imagotipo', 'Imagotipo_horizontal_color.svg'));
    const isotipoBuffer = fs.readFileSync(path.join(LOGOS_DIR, 'Isotipo', 'Isotipo_color.svg'));
    const patronBuffer = fs.readFileSync(path.join(ROOT, 'public', 'assets', 'images', 'Patron_derivado_del_isotipo.svg'));
    
    // Convertir logos a PNG con tamaño adecuado
    const imagotipo = await sharp(imagotipoBuffer)
        .resize(600, null)
        .png()
        .toBuffer();
    
    const isotipo = await sharp(isotipoBuffer)
        .resize(120, 120)
        .png()
        .toBuffer();
    
    // Crear patrón de fondo sutil
    const pattern = await sharp(patronBuffer)
        .resize(width, height, { fit: 'fill' })
        .modulate({ brightness: 0.05, saturation: 0 })
        .png()
        .toBuffer();
    
    // Componer imagen final
    const composite = [
        // Patrón sutil de fondo
        { input: pattern, blend: 'overlay' },
        // Líneas decorativas de acento
        { input: await createAccentLines(width, height) },
        // Imagotipo horizontal centrado
        { input: imagotipo, left: (width - 600) / 2, top: 180 },
        // Tagline
        { input: await createTextImage('CREA. EXPERIMENTA. COMPARTE.', 48, COLORS.gris), left: 200, top: 350 },
        // Isotipo pequeño abajo
        { input: isotipo, left: (width - 120) / 2, top: 450 },
        // Línea decorativa final
        { input: await createBottomLine(width), left: 0, top: 580 }
    ];
    
    await sharp(background)
        .composite(composite)
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(OUTPUT);
    
    console.log('   ✅ og-default.jpg (1200x630)');
    console.log('\n✨ Imagen Open Graph generada');
}

function createAccentLines(width, height) {
    const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="${COLORS.azul}" stroke-width="0.5" opacity="0.15"/>
        </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    <!-- Línea horizontal azul -->
    <line x1="200" y1="330" x2="1000" y2="330" stroke="${COLORS.azul}" stroke-width="2" opacity="0.6"/>
    <!-- Línea horizontal roja -->
    <line x1="250" y1="334" x2="950" y2="334" stroke="${COLORS.rojo}" stroke-width="1" opacity="0.4"/>
    <!-- Línea horizontal verde -->
    <line x1="300" y1="338" x2="900" y2="338" stroke="${COLORS.verde}" stroke-width="0.5" opacity="0.3"/>
</svg>`;
    return Buffer.from(svg);
}

function createTextImage(text, fontSize, color) {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="80">
    <style>
        @font-face {
            font-family: 'Sora';
            src: url('https://cdn.jsdelivr.net/fontsource/fonts/sora@latest/latin-wght-normal.woff2') format('woff2');
        }
    </style>
    <text x="400" y="55" text-anchor="middle" font-family="Sora, sans-serif" font-size="${fontSize}" font-weight="600" fill="${color}" letter-spacing="0.15em">${text}</text>
</svg>`;
    return Buffer.from(svg);
}

function createBottomLine(width) {
    const svg = `
<svg width="${width}" height="50" xmlns="http://www.w3.org/2000/svg">
    <line x1="200" y1="25" x2="${width - 200}" y2="25" stroke="${COLORS.azul}" stroke-width="1" opacity="0.3"/>
    <circle cx="${width / 2}" cy="25" r="3" fill="${COLORS.rojo}" opacity="0.8"/>
</svg>`;
    return Buffer.from(svg);
}

generateOGImage().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});