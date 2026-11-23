#!/usr/bin/env node
/** 
 * Verificacion estatica del contrato de captacion sitio -> Laravel.
 * No envia datos ni sustituye pruebas HTTP/E2E en un entorno real.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ecosystemRoot = path.resolve(siteRoot, '..');