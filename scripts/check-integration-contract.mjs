#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const expect = (ok, message) => { if (!ok) errors.push(message); };
const read = (file, label) => {
  try { return fs.readFileSync(file, 'utf8'); }
  catch (e) { errors.push('No se pudo leer ' + label + ': ' + file + ' (' + e.code + ')'); return ''; }
};
const json = (file, label) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { errors.push(label + ' no es JSON válido: ' + e.message); return null; }
};

const contract = json(path.join(root, 'contracts/laravel-public-prospect-contract.json'), 'Contrato versionado');
const site = json(path.join(root, 'data/site.json'), 'data/site.json');
const build = read(path.join(root, 'scripts/build.mjs'), 'scripts/build.mjs');
const client = read(path.join(root, 'public/assets/js/main.js'), 'main.js');
const workflow = read(path.join(root, '.github/workflows/deploy.yml'), 'deploy.yml');

const required = Array.isArray(contract?.campos_obligatorios) ? contract.campos_obligatorios : [];
const optional = Array.isArray(contract?.campos_opcionales) ? contract.campos_opcionales : [];
const rules = contract?.validaciones || {};
expect(required.length > 0, 'El contrato no contiene campos_obligatorios válidos.');
expect(Array.isArray(contract?.campos_obligatorios), 'campos_obligatorios debe ser un arreglo.');
expect(Array.isArray(contract?.campos_opcionales), 'campos_opcionales debe ser un arreglo.');
expect(contract?.metodo === 'POST', 'El método del contrato debe ser POST.');
expect(typeof contract?.ruta_laravel === 'string' && contract.ruta_laravel.startsWith('/'), 'ruta_laravel no es válida.');

const req = new Set(required);
const opt = new Set(optional);
expect(req.size === required.length, 'Hay campos obligatorios duplicados.');
expect(opt.size === optional.length, 'Hay campos opcionales duplicados.');
for (const field of required) {
  expect(typeof field === 'string' && field.length > 0, 'Hay un campo obligatorio vacío.');
  expect(!opt.has(field), 'El campo ' + field + ' aparece como obligatorio y opcional.');
  expect(Object.hasOwn(rules, field), 'Falta validación para ' + field + '.');
  if (Object.hasOwn(rules, field)) expect(rules[field].requerido === true, field + ' está en campos_obligatorios pero requerido no es true.');
}
for (const field of optional) {
  expect(typeof field === 'string' && field.length > 0, 'Hay un campo opcional vacío.');
  expect(Object.hasOwn(rules, field), 'Falta validación para el campo opcional ' + field + '.');
  if (Object.hasOwn(rules, field)) expect(rules[field].requerido === false, field + ' está en campos_opcionales pero requerido no es false.');
}

const formFields = Array.isArray(site?.contact?.form_fields) ? site.contact.form_fields : [];
const formNames = new Set(formFields.map((f) => f?.name).filter(Boolean));
for (const field of required) {
  if (field === 'privacy_consent' || field === site?.contact?.honeypot_field) continue;
  expect(formNames.has(field), 'Falta el campo obligatorio ' + field + ' en contact.form_fields.');
}
for (const field of formFields) {
  expect(typeof field.name === 'string' && field.name.length > 0, 'Hay un campo de formulario sin name.');
  if (field.required === true) expect(req.has(field.name), 'El formulario marca " + field.name + " como obligatorio pero el contrato no.");
}

const honeypot = site?.contact?.honeypot_field;
expect(typeof honeypot === 'string' && honeypot.length > 0, 'contact.honeypot_field no está configurado.');
expect(build.includes('siteConfig.contact.honeypot_field'), 'build.mjs no genera el honeypot desde site.json.');
expect(client.includes('CONFIG.contact?.honeypot_field') && client.includes('form.querySelector'), 'main.js no localiza el honeypot configurado.');
expect(client.includes('honeypotField.value'), 'main.js no comprueba el valor del honeypot.');

expect(build.includes('name="privacy_consent"'), 'El formulario no incluye privacy_consent.');
expect(build.includes("process.env.PUBLIC_LEADS_PRIVACY_APPROVED === 'true'"), 'Falta el bloqueo PUBLIC_LEADS_PRIVACY_APPROVED.');
expect(build.includes("process.env.CONTACT_ENDPOINTS_ENABLED === 'true'"), 'Falta el bloqueo CONTACT_ENDPOINTS_ENABLED.');
expect(client.includes('CONFIG.contactEndpointsEnabled === true') && client.includes('CONFIG.privacyApprovedForBuild === true'), 'main.js no exige los dos bloqueos de privacidad.');
expect(build.includes("const newsletterEndpoint = '';"), 'El newsletter no está desactivado explícitamente.');

expect(/workflow_dispatch\\s*:/.test(workflow), 'El workflow no tiene workflow_dispatch.');
expect(!/^  push\s*:/m.test(workflow), 'El workflow contiene un trigger push.');
const deploy = workflow.split(/^  deploy\s*:\s*$/m)[1] || '';
expect(deploy.length > 0, 'No existe el job deploy.');
expect(deploy.includes('inputs.confirm_production_deploy == true'), 'El deploy no exige confirmación manual.');
expect(deploy.includes("vars.RELEASE_APPROVED == 'true'"), 'El deploy no exige RELEASE_APPROVED=true.');
expect(/pages:\s*write/.test(deploy), 'pages: write no está limitado al job deploy.');
expect(/id-token:\s*write/.test(deploy), 'id-token: write no está limitado al job deploy.');

// Laravel solo se inspecciona cuando existe routes/api.php.
const skipLaravel = process.env.CASTROSO_SKIP_LARAVEL === 'true';
const candidates = [
  process.env.CASTROSO_LARAVEL_PATH,
  path.resolve(root, '..', 'laravel'),
  path.join(os.homedir(), 'Downloads', 'Castroso.jpg_web-main'),
  path.join(os.homedir(), 'Downloads', 'Castroso.jpg_web'),
].filter(Boolean);
const laravelRoot = skipLaravel ? null : candidates.find((p) => fs.existsSync(path.join(p, 'routes/api.php'))) || null;
if (process.env.CASTROSO_LARAVEL_PATH && !skipLaravel && !laravelRoot) {
  errors.push('CASTROSO_LARAVEL_PATH no contiene routes/api.php.');
}
let laravelCompared = false;
if (laravelRoot) {
  const controller = read(path.join(laravelRoot, 'app/Http/Controllers/PublicProspectController.php'), 'controlador Laravel');
  const routes = read(path.join(laravelRoot, 'routes/api.php'), 'rutas Laravel');
  const block = controller.match(/\$[A-Za-z_][A-Za-z0-9_]*\s*=\s*\$request->validate\s*\(\s*\[([\s\S]*?)\]\s*\)\s*;/);
  expect(Boolean(block), 'No se encontró el bloque $request->validate([...]) en el controlador Laravel.');
  if (block) {
    const serverFields = new Set([...block[1].matchAll(/['"]([A-Za-z0-9_]+)['"]\s*=>\s*\[/g)].map((m) => m[1]));
    for (const field of [...required, ...optional, 'privacy_consent', honeypot]) {
      expect(serverFields.has(field), 'Laravel no valida el campo ' + field + ' declarado/esperado.');
    }
  }
  const routeRegex = new RegExp("Route\\s*::\\s*post\\s*\\(\\s*['\"]" + contract.ruta_laravel.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + "['\"]");
  expect(routeRegex.test(routes), 'Laravel no declara POST ' + contract.ruta_laravel + ' en routes/api.php.');
  laravelCompared = true;
}

// Si dist existe (después de npm run build), valida el HTML generado.
const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  const htmlFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
    }
  };
  walk(dist);
  const found = htmlFiles.some((file) => fs.readFileSync(file, 'utf8').includes('name="' + honeypot + '"'));
  expect(found, 'El HTML generado en dist no contiene name="' + honeypot + '".');
}

if (errors.length) {
  console.error('Contrato de integración: ' + errors.length + ' problema(s)');
  errors.forEach((error) => console.error('- ' + error));
  process.exit(1);
}
if (laravelCompared) console.log('Contrato comprobado contra el sitio estático y Laravel local.');
else {
  console.log('Contrato comprobado contra el sitio estático y el JSON versionado.');
  console.log('Comparación directa con Laravel no ejecutada: Laravel no está disponible en este entorno.');
}
