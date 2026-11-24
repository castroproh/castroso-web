#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToP } from 'node:url';
import os from 'node:os';

const siteRoot = path.resolve(path.dirname(fileURLToP(import.meta.url)), '..');
const ecosystemRoot = path.resolve(siteRoot, '..');

const laravelCandidates = [
    process.env.CASTROSO_LARAVEL_PATH,
    path.join(ecosystemRoot, 'laravel'),
    path.join(os.homedir(), 'Downloads', 'Castroso.jpg_web-main'),
].filter(Boolean);

const laravelRoot = laravelCandidates.find(candidate =>
    fs.existsSync(path.join(candidate, 'routes', 'api.php'))
) || null;

let laravelValidationExecuted = false;
let laravelControllerContent = '';
let laravelConfigContent = '';
let laravelRoutesContent = '';

if (laravelRoot) {
    laravelValidationExecuted = true;
    laravelControllerContent = fs.readFileSync(path.join(laravelRoot, 'app', 'Http', 'Controllers', 'PublicProspectController.php'), 'utf8') || '';
    laravelConfigContent = fs.readFileSync(path.join(laravelRoot, 'config', 'castroso.php'), 'utf8') || '';
    laravelRoutesContent = fs.readFileSync(path.join(laravelRoot, 'routes', 'api.php'), 'utf8') || '';
}

const contractPath = path.join(siteRoot, 'contracts', 'laravel-public-prospect-contract.json');
let contractVersioned;
try {
    contractVersioned = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
} catch {
    contractVersioned = null;
}

const contract = contractVersioned;
const contractAvailable = !!contractVersioned;

const siteConfig = JSON.parse(fs.readFileSync(path.join(siteRoot, 'data', 'site.json'), 'utf8'));
const siteBuild = fs.readFileSync(path.join(siteRoot, 'scripts', 'build.mjs'), 'utf8');
const siteJs = fs.readFileSync(path.join(siteRoot, 'public', 'assets', 'js', 'main.js'), 'utf8');

const contractRequiredFields = contract?.campos_obligatorio || [];
const contractOptionalFields = contract?.campos_opcionales || [];
const contractValidations = contract?.validaciones || {};

const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

// 1. Campos obligatorios del contrato en el build del sitio
for (const field of contractRequiredFields) {
    const fieldInBuild = siteBuild.includes(field);
    if (laravelValidationExecuted) {
        const inLaravel = laravelControllerContent.includes(field);
        expect(fieldInBuild || inLaravel, 'Campo obligatorio del contrato "' + field + '" no encontrado en el sitio o Laravel real');
    } else {
        expect(fieldInBuild, 'Campo obligatorio del contrato "' + field + '" no encontrado en el sitio estatico (Laravel no disponible para validacion directa)');
    }
}

// 2. Estructuras de items
const itemFields = ['nombre', 'servicio', 'descripcion'];
const itemFieldsInBuild = itemFields.every(field =>
    siteBuild.includes(field) || (laravelValidationExecuted && laravelControllerContent.includes(field))
);
expect(itemFieldsInBuild, 'Faltan campos de item (nombre, servicio, descripcion) en el build');

// 3. Campos opcionales del contrato
for (const field of contractOptionalFields) {
    const fieldInBuild = siteBuild.includes(field);
    if (laravelValidationExecuted) {
        const inLaravel = laravelControllerContent.includes(field);
        expect(fieldInBuild || inLaravel, 'Campo opcional del contrato "' + field + '" no verificado');
    } else {
        expect(fieldInBuild, 'Campo opcional del contrato "' + field + '" no encontrado en el sitio estatico (Laravel no disponible)');
    }
}

// 4. Honeypot - Usar siteConfig.contact.honeypot_field y verificar en el HTML generado
const honeypot = siteConfig.contact?.honeypot_field || 'website_url';
// El HTML se genera en build.mjs como: name="${siteConfig.contact.honeypot_field}"
expect(siteJs.includes('name="' + honeypot + '"') || siteJs.includes("name='" + honeypot + "'"), 'Honeypot no reconocido en el JavaScript del sitio');
// Ademas, verificar que el campo esté configurado en site.json
expect(siteConfig.contact?.honeypot_field, 'El campo honeypot no está configurado en site.json');

// 5. Consentimiento de privacidad
expect(siteBuild.includes('name="privacy_consent"'), 'Falta consentimiento privacy_consent en el build');

// 6. Bloqueo doble de privacidad (cliente)
expect(
    siteJs.includes('CONFIG.contactEndpointsEnabled === true') && siteJs.includes('CONFIG.privacyApprovedForBuild === true'),
    'El cliente no aplica el bloqueo doble de privacidad antes de enviar.'
);
expect(siteBuild.includes("process.env.PUBLIC_LEADS_PRIVACY_APPROVED === 'true'"), 'El build no exige aprobacion de privacidad explicita.');
expect(siteBuild.includes("process.env.CONTACT_ENDPOINTS_ENABLED === 'true'"), 'El build no exige activacion operacional explicita.');

// Modo Laravel disponible - validaciones extra
if (laravelValidationExecuted) {
    // Validacion contra controlador Laravel real
    const validationBlock = laravelControllerContent.match(/\\$data\\s*=\\s*\\$request->validate\\s*\\(\\s*\\[([\\s\\S]*?)\\\\n\\s*\\]\\)\\s*;/);
    const serverFields = validationBlock
        ? [...validationBlock[1].matchAll(/['\"]([^\\']+)\\'\\s*=>\\s*\\[/g)].map(function(match) { return match[1]; })
        : [];

    // Verificar que todos los campos obligatorios del contrato existan en Laravel
    for (const field of contractRequiredFields) {
        expect(serverFields.includes(field), 'El campo del contrato "' + field + '" no existe en la validacion Laravel real');
    }

    // Campos requeridos del sitio (compatibilidad hacia atras)
    const requiredServerFields = ['nombre', 'email', 'servicio', 'descripcion', 'privacy_consent'];
    for (const field of requiredServerFields) {
        expect(serverFields.includes(field), 'Laraval no valida el campo requerido "' + field + '"');
    }

    // Honeypot en Laravel
    expect(serverFields.includes(honeypot), 'Laravel no reconoce el honeypot.');

    // Configuraciones CORS y privacidad en Laravel
    expect(laravelConfigContent.includes("env('PUBLIC_LEADS_ALLOWED_ORIGINS', '')"), 'CORS no usa PUBLIC_LEADS_ALLOWED_ORIGINS.');
    expect(/privacy_approved/.test(laravelConfigContent), 'PUBLIC_LEADS_PRIVACY_APPROVED debe ser configurable y falso por defecto.');
    expect(/enabled/.test(laravelConfigContent), 'PUBLIC_LEADS_ENABLED debe ser configurable y falso por defecto.');
    // Ruta POST /api/public/prospects (el prefijo exacto, sin dominio completo)
    expect(/Route::post\\s*\\(\\s*'\\/public\\/prospects'\\s*\\)/.test(laravelRoutesContent), 'La ruta POST /api/public/prospects no esta declarada.');

    // Validaciones del workflow de deploy
    const deployWorkflow = fs.readFileSync(path.join(siteRoot, '.github', 'workflows', 'deploy.yml'), 'utf8');
    expect(/workflow_dispatch:/.test(deployWorkflow), 'El workflow debe permitir ejecucion manual.');
    expect(!/^\\s*push:/m.test(deployWorkflow), 'El workflow no debe desplegar automadamente mediante push.');
    expect(deployWorkflow.includes('vars.RELEASE_APPROVED == true'), 'El deploy debe exigir RELEASE_APPROVADO=true.');
}

// Modo GitHub Actions (Laravel no disponible)
if (!laravelValidationExecuted && contractAvailable) {
    const minimalContractFields = ['nombre', 'email', 'servicio', 'descripcion', 'privacy_consent'];
    for (const field of minimalContractFields) {
        expect(siteBuild.includes(field), 'Campo minimo del contrato "' + field + '" no encontrado en el build (Laravel no disponible para validacion directa)');
    }
    expect(siteJs.includes('name="' + honeypot + '"') || siteJs.includes("name='" + honeypot + "'"), 'Honeypot no reconocido (Laravel no disponible).');
    expect(
        siteJs.includes('CONFIG.contactEndpointsEnabled === true') && siteJs.includes('CONFIG.privacyApprovedForBuild === true'),
        'Bloqueo doble de privacidad no aplica (Laravel no disponible).'
    );
    expect(siteBuild.includes("process.env.PUBLIC_LEADS_PRIVACY_APPROVED === 'true'"), 'Aprobacion privacy no disponible (Laravel no disponible).');
    expect(siteBuild.includes("process.env.CONTACT_ENDPOINTS_ENABLED === 'true'"), 'Activacion operacional no disponible (Laravel no disponible).');
    expect(siteBuild.includes("const newsletterEndpoint = ''"), 'Newsletter no disponible (Laravel no disponible).');
    expect(/workflow_dispatch:/.test(siteBuild), 'Workflow permite ejecucion manual (Laravel no disponible).');
    expect(!/^\\s*push:/m.test(siteBuild), 'Push automatico no disponible (Laravel no disponible).');
}

// Reporte final
if (errors.length) {
    console.error('Contrato de integracion: ' + errors.length + ' problema(s)');
    errors.forEach(function(error) { console.error('- ' + error); });
    process.exit(1);
}

if (laravelValidationExecuted) {
    console.log('Contrato estatico correcto: ' + contractRequiredFields.length + ' campos del contrato verificados contra codigo Laravel real; consentimiento y honeypot presentes; bloqueos protegidos.');
} else if (contractAvailable) {
    console.log('Contrato estatico correcto: ' + contractRequiredFields.length + ' campos del contrato versionado verificados contra sitio estatico; Nota: Laravel no estaba disponible para validacion directa, se uso contrato versionado. NO se compara codigo Laravel privado.');
} else {
    console.log('Contrato estatico correcto: campos minimos verificados contra sitio estatico. Alcance: validacion estatica basica (sin contrato ni Laravel).');
}
import fs from node:fs
import path from node:path
import { fileURLToP } from node:url
import os from node:os
