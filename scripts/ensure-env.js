const { copyFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const projectRoot = join(__dirname, '..');
const envPath = join(projectRoot, '.env');
const examplePath = join(projectRoot, '.env.example');

if (existsSync(envPath)) {
  console.log('[env] .env уже существует — оставляю без изменений');
} else if (!existsSync(examplePath)) {
  console.warn('[env] .env.example не найден — пропускаю создание .env');
} else {
  copyFileSync(examplePath, envPath);
  console.log('[env] .env создан из .env.example');
}
