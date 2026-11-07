// ESLint 9, плоский конфиг. Запуск: npm run lint:js
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // Игра-пасхалка собрана и минифицирована отдельно, dist – результат сборки
    ignores: ['dist/**', 'node_modules/**', 'public/konami/**'],
  },
  js.configs.recommended,
  {
    files: ['src/js/**/*.js', 'public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, gtag: 'readonly', dataLayer: 'writable' },
    },
  },
  {
    // Классические скрипты из public подключаются тегом <script> без type="module"
    files: ['public/js/**/*.js'],
    languageOptions: { sourceType: 'script' },
  },
  {
    files: ['*.js', 'tools/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    rules: {
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
