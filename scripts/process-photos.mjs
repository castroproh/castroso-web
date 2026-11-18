#!/usr/bin/env node
/**
 * CASTROSO.JPG — Procesamiento de retratos del estudio
 *
 * Fuente: assets-originals/equipo/*.jpeg
 * Salida: public/assets/images/equipo/*-{width}.{avif,webp,jpg}
 *
 * Reglas:
 *  - No se alteran rostros ni cuerpos.
 *  - Sólo recorte editorial 4:5, corrección de exposición/contraste y B&N.
 *  - Se eliminan todos los metadatos (EXIF/GPS/ICC) al exportar.
 *  - No se generan imágenes con IA.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'assets-originals', 'equipo');
const OUTPUT_DIR = path.join(ROOT, 'public', 'assets', 'images', 'equipo');

const PHOTOS = [
    {
        id: 'mateo',
        source: 'mateo-original.jpeg',
        widths: [480, 720, 960, 1200],
        brightness: 1.02,
        // Recorte 4:5 conservando rostro y teléfono dentro del encuadre.
        crop: { width: 1200, height: 1500, left: 0, top: 50 }
    },
    {
        id: 'santiel',
        source: 'santiel-original.jpeg',
        widths: [480, 720, 800],
        brightness: 1.08,
        // Recorte 4:5 hacia la izquierda: quita el rótulo del fondo y centra el retrato.
        crop: { width: 800, height: 1000, left: 0, top: 100 }
    }
];

const FORMATS = [
    { ext: 'avif', options: { quality: 58, effort: 6 } },
    { ext: 'webp', options: { quality: 80, effort: 5 } },
    { ext: 'jpg', options: { quality: 84, mozjpeg: true } }
];

async function processPhoto(photo) {
    const sourcePath = path.join(SOURCE_DIR, photo.source);
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`No existe el original: ${sourcePath}`);
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    for (const width of photo.widths) {
        const height = Math.round(width * 1.25);
        const base = sharp(sourcePath)
            .rotate()
            .extract({
                left: photo.crop.left,
                top: photo.crop.top,
                width: photo.crop.width,
                height: photo.crop.height
            })
            .resize(width, height, { fit: 'cover', position: 'centre' })
            .greyscale()
            .normalise({ lower: 0.5, upper: 99.5 })
            .linear(1.07, -7)
            .modulate({ brightness: photo.brightness || 1.025 })
            .sharpen({ sigma: 0.7, m1: 0.4, m2: 0.8 });

        for (const format of FORMATS) {
            const output = path.join(OUTPUT_DIR, `${photo.id}-${width}.${format.ext}`);
            await base
                .clone()
                .toFormat(format.ext, format.options)
                .toFile(output);
        }

        console.log(`   ✅ ${photo.id}-${width}`);
    }
}

async function verifyOutputs() {
    const files = fs.readdirSync(OUTPUT_DIR).filter((file) => /\.(avif|webp|jpg)$/.test(file));
    let withMetadata = 0;

    for (const file of files) {
        const filePath = path.join(OUTPUT_DIR, file);
        const meta = await sharp(filePath).metadata();
        if (meta.exif || meta.icc || meta.xmp || meta.iptc) {
            withMetadata += 1;
            console.warn(`   ⚠ Metadatos detectados: ${file}`);
        }
    }

    if (withMetadata === 0) {
        console.log(`   ✅ ${files.length} archivos sin EXIF/ICC/XMP/IPTC`);
    }
}

async function main() {
    console.log('🖼️  Procesando retratos de Mateo y Santiel...');
    for (const photo of PHOTOS) {
        await processPhoto(photo);
    }
    await verifyOutputs();
    console.log('\n✨ Retratos listos en public/assets/images/equipo/');
}

main().catch((error) => {
    console.error('❌ Error procesando retratos:', error);
    process.exit(1);
});
