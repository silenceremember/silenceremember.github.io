import { resolve } from 'path';
import { defineConfig } from 'vite';
import { promises as fs } from 'fs';
import path from 'path';
import viteCompression from 'vite-plugin-compression';

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
      verbose: true,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024, // Сжимать файлы больше 1KB
      deleteOriginFile: false, // Оставляем оригинальные файлы
      verbose: true,
    }),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Оптимизация размера бандла
    minify: 'esbuild', // Используем esbuild для быстрой минификации
    cssMinify: true,
    // Порог для инлайна ассетов (4KB - меньше будут инлайниться)
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
        // Стратегия разделения чанков для лучшего кеширования
        manualChunks: (id) => {
          // Разделяем node_modules на отдельные чанки
          if (id.includes('node_modules')) {
            // Vite и его зависимости (если есть)
            if (id.includes('vite')) {
              return 'vite-vendor';
            }
            // Остальные vendor библиотеки
            return 'vendor';
          }
          // Разделяем страницы на отдельные чанки для лучшего кеширования
          if (id.includes('/js/pages/')) {
            const pageName = id.split('/js/pages/')[1].split('.')[0];
            // Конвертируем PascalCase в kebab-case для имен чанков
            const kebabCase = pageName
              .replace(/([A-Z])/g, '-$1')
              .toLowerCase()
              .replace(/^-/, '');
            return `page-${kebabCase}`;
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
          if (id.includes('/js/managers/')) {
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
          if (
            /\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)
          ) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Оптимизация размера чанков
    chunkSizeWarningLimit: 500, // Уменьшено для более строгого контроля размера
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
