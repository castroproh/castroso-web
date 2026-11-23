import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ecosystemRoot = path.resolve(siteRoot, '..');

// Cargar contrato versionado DESDE EL JSON
const contractPath = path.join(siteRoot, 'contracts', 'laravel-public-prospect-contract.json');
let contractVersioned;
try {
    contractVersioned = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
} catch {
    contractVersioned = null;
}

const contract = contractVersioned;
const contractAvailable = !!contractVersioned;

// Determinar si Laravel esta disponible localmente
const laravelCandidates = [
    process.env.CASTROSO_LARAVEL_PATH,
    path.join(ecosystemRoot, 'laravel'),
    path.join(os.homedir(), 'Downloads', 'Castroso.jpg_web-main'),
].filter(Boolean);

const laravelRoot = laravelCandidates.find(candidate =>
    fs.existsSync(path.join(candidate, 'routes', 'api.php'))
) || laravelCandidates[0];

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

// ... [more content will be added] ...const errors = [];const errors = [];
