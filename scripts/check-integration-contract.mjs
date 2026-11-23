#!/usr/bin/env node
/**
 * Verificación estática del contrato de captación sitio → Laravel.
 * No envía datos ni sustituye pruebas HTTP/E2E en un entorno real.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ecosystemRoot = path.resolve(siteRoot, '..');
const laravelCandidates = [
    process.env.CASTROSO_LARAVEL_PATH,
    path.join(ecosystemRoot, 'laravel'),
    path.join(os.homedir(), 'Downloads', 'Castroso.jpg_web-main'),
].filter(Boolean);
const laravelRoot = laravelCandidates.find(candidate =>
    fs.existsSync(path.join(candidate, 'routes', 'api.php'))
) || laravelCandidates[0];
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

function read(relativePath, root = siteRoot) {
    const file = path.join(root, relativePath);
    if (!fs.existsSync(file)) {
        errors.push(`No existe ${file}`);
        return '';
    }
    return fs.readFileSync(file, 'utf8');
}

const siteConfig = JSON.parse(read('data/site.json'));
const siteBuild = read('scripts/build.mjs');
const siteJs = read('public/assets/js/main.js');
const laravelController = read('app/Http/Controllers/PublicProspectController.php', laravelRoot);
const laravelConfig = read('config/castroso.php', laravelRoot);
const laravelCors = read('config/cors.php', laravelRoot);
const laravelRoutes = read('routes/api.php', laravelRoot);
const deployWorkflow = read('.github/workflows/deploy.yml');

const configuredFields = (siteConfig.contact?.form_fields || []).map(field => field.name);
const validationBlock = laravelController.match(/\$data\s*=\s*\$request->validate\(\s*\[([\s\S]*?)\n\s*\]\s*\);/);
expect(Boolean(validationBlock), 'No se pudo identificar el bloque de validación de PublicProspectController.');
const serverFields = validationBlock
    ? [...validationBlock[1].matchAll(/['"]([^'"]+)['"]\s*=>\s*\[/g)].map(match => match[1])
    : [];

for (const field of configuredFields) {
    expect(serverFields.includes(field), `El campo del formulario '${field}' no existe en la validación Laravel.`);
}

const requiredServerFields = ['nombre', 'email', 'proyecto_nombre', 'servicio', 'descripcion', 'privacy_consent'];
for (const field of requiredServerFields) {
    expect(serverFields.includes(field), `Laravel no valida el campo requerido '${field}'.`);
}

const honeypot = siteConfig.contact?.honeypot_field || 'website_url';
expect(serverFields.includes(honeypot), `Laravel no reconoce el honeypot '${honeypot}'.`);
expect(siteBuild.includes('name="privacy_consent"'), 'El formulario generado no contiene el consentimiento privacy_consent.');
expect(siteJs.includes('formData.delete(CONFIG.contact.honeypot_field)'), 'El formulario no elimina el campo honeypot antes de enviar.');
expect(siteJs.includes("CONFIG.contactEndpointsEnabled === true") && siteJs.includes("CONFIG.privacyApprovedForBuild === true"), 'El cliente no aplica el bloqueo doble de privacidad antes de enviar.');
expect(siteBuild.includes("process.env.PUBLIC_LEADS_PRIVACY_APPROVED === 'true'"), 'El build no exige aprobación de privacidad explícita.');
expect(siteBuild.includes("process.env.CONTACT_ENDPOINTS_ENABLED === 'true'"), 'El build no exige activación operacional explícita.');
expect(siteBuild.includes('const newsletterEndpoint = \'\''), 'El newsletter debe permanecer desactivado hasta contar con consentimiento secundario independiente.');
expect(/Route::post\('\/public\/prospects'/.test(laravelRoutes), 'La ruta POST /api/public/prospects no está declarada.');
expect(/'enabled'\s*=>\s*filter_var\(env\('PUBLIC_LEADS_ENABLED',\s*false\)/.test(laravelConfig), 'PUBLIC_LEADS_ENABLED debe ser configurable y falso por defecto.');
expect(/'privacy_approved'\s*=>\s*filter_var\(env\('PUBLIC_LEADS_PRIVACY_APPROVED',\s*false\)/.test(laravelConfig), 'PUBLIC_LEADS_PRIVACY_APPROVED debe ser configurable y falso por defecto.');
expect(laravelCors.includes("env('PUBLIC_LEADS_ALLOWED_ORIGINS', '')"), 'CORS no usa PUBLIC_LEADS_ALLOWED_ORIGINS.');
expect(/workflow_dispatch:/.test(deployWorkflow), 'El workflow debe permitir ejecución manual.');
expect(!/^\s*push:/m.test(deployWorkflow), 'El workflow no debe desplegar automáticamente mediante push.');
expect(deployWorkflow.includes('inputs.confirm_production_deploy == true') && deployWorkflow.includes("vars.RELEASE_APPROVED == 'true'"), 'El deploy debe exigir confirmación manual y RELEASE_APPROVED=true.');

if (errors.length) {
    console.error(`Contrato de integración: ${errors.length} problema(s)`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Contrato estático correcto: ${configuredFields.length} campos del formulario coinciden con Laravel; consentimiento y honeypot presentes; ambos bloqueos de captación siguen protegidos.`);
console.log('Alcance: comprobación estática. No se realizó una solicitud HTTP ni se activó la captación pública.');
