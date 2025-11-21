import { resolve } from 'path';
import { defineConfig } from 'vite';
import { promises as fs } from 'fs';
import path from 'path';
import { constants } from 'zlib';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import { vitePurgeCSS } from './vite-plugin-purgecss.js';
import webfontDownload from 'vite-plugin-webfont-dl';
import { createHtmlPlugin } from 'vite-plugin-html';
import { imagetools } from 'vite-imagetools';
import Inspect from 'vite-plugin-inspect';

export default defineConfig({
  base: '/',
  root: 'src',
  publicDir: '../public',
  resolve: {
    // Правильное разрешение путей для динамических импортов
    preserveSymlinks: false,
    // Правильная обработка расширений файлов
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  plugins: [
    {
      name: 'custom-404-plugin',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const cleanUrl = req.url.split('?')[0].split('#')[0];

          // Пропускаем внутренние пути Vite (HMR, клиент и т.д.)
          if (
            cleanUrl.startsWith('/@') ||
            cleanUrl.startsWith('/node_modules/')
          ) {
            return next();
          }

          // Устанавливаем правильный Content-Type для PDF файлов
          if (cleanUrl.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            return next();
          }

          // Пропускаем статические ресурсы (файлы с расширениями)
          if (cleanUrl.includes('.') && !cleanUrl.endsWith('.html')) {
            return next();
          }

          const rootPath = server.config.root;
          let filePath = path.join(rootPath, cleanUrl);

          if (cleanUrl.endsWith('/') || cleanUrl === '') {
            filePath = path.join(filePath, 'index.html');
          } else if (!path.extname(cleanUrl)) {
            filePath += '.html';
          }

          try {
            await fs.access(filePath);
            next();
          } catch (e) {
            try {
              const notFoundHtml = await fs.readFile(
                path.join(rootPath, '404.html'),
                'utf-8'
              );
              res.statusCode = 404;
              res.setHeader('Content-Type', 'text/html');
              res.end(await server.transformIndexHtml(req.url, notFoundHtml));
            } catch (error) {
              console.error('404.html not found', error);
              next(error);
            }
          }
        });
      },
    },
    // Compression plugin для генерации gzip и brotli версий
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Сжимать файлы больше 1KB
      deleteOriginFile: false, // Оставляем оригинальные файлы
      verbose: false, // Отключаем verbose для ускорения сборки
      compressOptions: {
        level: 6, // Баланс между скоростью и степенью сжатия (1-9, по умолчанию 9)
      },
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024, // Сжимать файлы больше 1KB
      deleteOriginFile: false, // Оставляем оригинальные файлы
      verbose: false, // Отключаем verbose для ускорения сборки
      compressOptions: {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: 4, // Баланс скорости и сжатия (1-11, по умолчанию 11)
        },
      },
    }),
    // Bundle analyzer для визуализации размера бандла
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // PurgeCSS для удаления неиспользуемых стилей
    vitePurgeCSS(),
    // Google Fonts - автоматическая загрузка и инлайн для устранения внешних запросов
    webfontDownload([
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap',
    ], {
      injectAsStyleTag: true,
      minifyCss: true,
      async: true,
      cache: true,
      proxy: false,
    }),
    // HTML минификация и оптимизация
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
      },
    }),
    // Оптимизация изображений
    imagetools(),
    // Vite plugin inspector для отладки и анализа
    Inspect(),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Оптимизация размера бандла
    minify: 'esbuild', // Используем esbuild (быстрее, Vite 7 не требует terser)
    // esbuild автоматически минифицирует и удаляет console.log в production
    cssMinify: true, // Встроенная минификация CSS
    // Порог для инлайна ассетов (4KB - оптимальный баланс между размером и количеством запросов)
    assetsInlineLimit: 4096,
    // Оптимизация chunk splitting
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        projects: resolve(__dirname, 'src/projects.html'),
        cv: resolve(__dirname, 'src/cv.html'),
        community: resolve(__dirname, 'src/community.html'),
        research: resolve(__dirname, 'src/research.html'),
        404: resolve(__dirname, 'src/404.html'),
      },
      output: {
        // Оптимизация для лучшего tree shaking и уменьшения размера
        generatedCode: {
          preset: 'es2015',
          constBindings: true,
        },
        // Компактный вывод для уменьшения размера
        compact: true,
        // Стратегия разделения чанков для лучшего кеширования и уменьшения unused JS
        manualChunks: (id) => {
          // Разделяем node_modules на отдельные чанки
          if (id.includes('node_modules')) {
            // Разделяем большие библиотеки для лучшего code splitting
            if (id.includes('three') || id.includes('cannon')) {
              return 'vendor-physics';
            }
            // Vite и его зависимости (если есть)
            if (id.includes('vite')) {
              return 'vite-vendor';
            }
            // Остальные vendor библиотеки
            return 'vendor';
          }
          // Разделяем страницы на отдельные чанки для lazy loading
          if (id.includes('/js/pages/') || id.includes('/pages/')) {
            const pageMatch = id.match(/\/(pages|js\/pages)\/([^/]+)\./);
            if (pageMatch) {
              const pageName = pageMatch[2];
              // Конвертируем PascalCase в kebab-case для имен чанков
              const kebabCase = pageName
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/^-/, '');
              return `page-${kebabCase}`;
            }
          }
          // Разделяем утилиты и компоненты для лучшего кеширования
          if (id.includes('/js/utils/')) {
            return 'utils';
          }
          // Разделяем компоненты на более мелкие чанки для лучшей производительности
          if (id.includes('/js/components/')) {
            // Критические компоненты (тема, язык, курсор) - загружаются сразу
            if (
              id.includes('/components/theme/') ||
              id.includes('/components/language/') ||
              id.includes('/components/custom-cursor/')
            ) {
              return 'components-core';
            }
            // Компоненты скролла - отдельный чанк
            if (id.includes('/components/scroll/')) {
              return 'components-scroll';
            }
            // Фоновые эффекты - большой компонент, отдельный чанк
            if (id.includes('/components/background-effect/')) {
              return 'components-background';
            }
            // SVG loader - отдельный чанк
            if (id.includes('/components/svg/')) {
              return 'components-svg';
            }
            // Остальные компоненты
            return 'components';
          }
          if (id.includes('/js/services/')) {
            return 'services';
          }
          // Общий layout код
          if (id.includes('/js/layout/')) {
            return 'layout';
          }
          // Менеджеры анимаций - могут быть большими, разделяем
          if (id.includes('/js/managers/') || id.includes('/managers/')) {
            return 'managers';
          }
          // Фабрики
          if (id.includes('/js/factories/')) {
            return 'factories';
          }
        },
        // Оптимизация имен файлов для кеширования
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          // Изображения
          if (
            /\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)
          ) {
            return `assets/images/[name]-[hash][extname]`;
          }
          
          // Шрифты
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          
          // CSS
          if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          
          // HTML файлы - НЕ обрабатываем через assetFileNames
          // Они должны быть либо entry points (обрабатываются Rollup),
          // либо находиться в public/ (копируются как есть)
          // Если HTML попал сюда, значит он импортируется как строка/модуль,
          // что не должно происходить с шаблонами страниц
          if (/\.html$/i.test(assetInfo.name)) {
            // Компоненты из public/components копируются напрямую
            // Не добавляем хеш к компонентам
            if (assetInfo.name.includes('component') ||
                assetInfo.name.includes('footer') ||
                assetInfo.name.includes('header') ||
                assetInfo.name.includes('timeline') ||
                assetInfo.name.includes('card') ||
                assetInfo.name.includes('filters') ||
                assetInfo.name.includes('gallery') ||
                assetInfo.name.includes('scroll')) {
              return `components/[name][extname]`;
            }
            // Остальные HTML (entry points) не должны попадать сюда
            // Но если попали - не добавляем хеш
            console.warn(`HTML file ${assetInfo.name} is being processed as asset - this may cause issues`);
            return `[name][extname]`;
          }
          
          // JSON и другие данные
          if (/\.(json|xml|txt)$/i.test(assetInfo.name)) {
            return `[name][extname]`;
          }
          
          // Все остальные файлы (но НЕ .js, они должны быть entry/chunk)
          // JS файлы НЕ должны попадать сюда - они обрабатываются через entryFileNames/chunkFileNames
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Оптимизация размера чанков
    chunkSizeWarningLimit: 200, // Уменьшено для более строгого контроля размера и лучшего code splitting
    // Включаем source maps только для production debugging (опционально)
    sourcemap: false,
    // Оптимизация tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
    // Оптимизация target для современных браузеров
    target: ['esnext', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    // Минификация CSS с оптимизацией
    cssCodeSplit: true,
    // Оптимизация для лучшей производительности
    reportCompressedSize: false, // Отключаем отчет о размере для ускорения сборки
  },
});
