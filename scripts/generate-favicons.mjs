#!/usr/bin/env node
/**
 * Genera favicons desde el SVG del isotipo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'public', 'assets', 'icons');
const SVG_SOURCE = path.join(ROOT, 'public', 'assets', 'logos', 'Isotipo', 'Isotipo_color.svg');

async function generateFavicons() {
    console.log('🎨 Generando favicons...');
    
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    
    const svgBuffer = fs.readFileSync(SVG_SOURCE);
    
    // Favicon 16x16
    await sharp(svgBuffer)
        .resize(16, 16)
        .png()
        .toFile(path.join(ICONS_DIR, 'favicon-16.png'));
    console.log('   ✅ favicon-16.png');
    
    // Favicon 32x32
    await sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toFile(path.join(ICONS_DIR, 'favicon-32.png'));
    console.log('   ✅ favicon-32.png');
    
    // Favicon 48x48
    await sharp(svgBuffer)
        .resize(48, 48)
        .png()
        .toFile(path.join(ICONS_DIR, 'favicon-48.png'));
    console.log('   ✅ favicon-48.png');
    
    // Apple touch icon 180x180
    await sharp(svgBuffer)
        .resize(180, 180)
        .png()
        .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
    console.log('   ✅ apple-touch-icon.png');
    
    // Manifest icons
    await sharp(svgBuffer)
        .resize(192, 192)
        .png()
        .toFile(path.join(ICONS_DIR, 'favicon-192.png'));
    console.log('   ✅ favicon-192.png');
    
    await sharp(svgBuffer)
        .resize(512, 512)
        .png()
        .toFile(path.join(ICONS_DIR, 'favicon-512.png'));
    console.log('   ✅ favicon-512.png');
    
    // Copy SVG as favicon.svg
    fs.copyFileSync(SVG_SOURCE, path.join(ICONS_DIR, 'favicon.svg'));
    console.log('   ✅ favicon.svg');
    
    console.log('\n✨ Favicons generados en public/assets/icons/');
}

generateFavicons().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});