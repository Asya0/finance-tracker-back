/**
 * Создаёт .env из .env.example, если .env ещё нет.
 * Запускается автоматически перед стартом проекта (npm-хуки prestart*).
 *
 * Существующий .env никогда не перезаписывается — там могут быть
 * реальные секреты и строка подключения к базе.
 */
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
