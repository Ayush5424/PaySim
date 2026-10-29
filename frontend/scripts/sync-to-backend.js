import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const targetDir = path.resolve(__dirname, '../../src/main/resources/static');
const backupDir = path.resolve(__dirname, '../../legacy-frontend-backup');

// 1. If legacy-frontend-backup doesn't exist yet, backup legacy files
if (!fs.existsSync(backupDir) && fs.existsSync(targetDir)) {
  console.log('Backing up legacy static files to legacy-frontend-backup...');
  fs.cpSync(targetDir, backupDir, { recursive: true });
}

// 2. Ensure targetDir exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 3. Clean target directory before copying new build
console.log('Cleaning static directory...');
const existingFiles = fs.readdirSync(targetDir);
for (const file of existingFiles) {
  fs.rmSync(path.join(targetDir, file), { recursive: true, force: true });
}

// 4. Copy new dist files
console.log('Copying production React build to src/main/resources/static...');
fs.cpSync(distDir, targetDir, { recursive: true });
console.log('Successfully synced React build to Spring Boot static resources!');
