import { PurgeCSS } from 'purgecss';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Vite plugin для PurgeCSS
 * Удаляет неиспользуемые CSS стили после сборки
 */
export function vitePurgeCSS(options = {}) {
  return {
    name: 'vite-plugin-purgecss',
    apply: 'build', // Only run during build, not dev
    enforce: 'post',
    async generateBundle(opts, bundle) {
      // Получаем все CSS файлы из бандла
      const cssFiles = Object.keys(bundle).filter(
        (fileName) => fileName.endsWith('.css') && !fileName.includes('.map')
      );

      if (cssFiles.length === 0) return;

      // Получаем все HTML и JS файлы для анализа контента
      const htmlFiles = Object.keys(bundle).filter(
        (fileName) => fileName.endsWith('.html')
      );
      const jsFiles = Object.keys(bundle).filter(
        (fileName) => fileName.endsWith('.js') && !fileName.includes('.map')
      );

      // Создаем список контента для PurgeCSS
      const content = [];
      
      // Добавляем HTML контент
      for (const fileName of htmlFiles) {
        const file = bundle[fileName];
        if (file.type === 'asset') {
          content.push({
            raw: file.source.toString(),
            extension: 'html',
          });
        }
      }
      
      // Добавляем JS контент
      for (const fileName of jsFiles) {
        const file = bundle[fileName];
        if (file.type === 'chunk') {
          content.push({
            raw: file.code,
            extension: 'js',
          });
        }
      }

      // Настройки PurgeCSS
      const purgeCSSOptions = {
        content,
        safelist: {
          standard: [
            /^fade-/,
            /^slide-/,
            /^scroll-/,
            /^theme-/,
            /^lang-/,
            /^active$/,
            /^visible$/,
            /^hidden$/,
            /^loading$/,
            /^loaded$/,
            /^error$/,
            /^success$/,
            /^warning$/,
            /^info$/,
            'show',
            'hide',
            'open',
            'close',
            'disabled',
            'enabled',
            'page-wrapper',
            'page-with-scroll',
            'fluid-background-canvas',
            'decorative-line-horizontal',
            'custom-cursor',
            'container',
            ...(options.safelist?.standard || []),
          ],
          deep: [
            /data-theme/,
            /data-lang/,
            /data-i18n/,
            /\[data-/,
            ...(options.safelist?.deep || []),
          ],
          greedy: [
            /^custom-cursor/,
            /^fluid-background/,
            /^community-/,
            /^cv-/,
            /^project-/,
            /^research-/,
            /^timeline-/,
            /^media-gallery/,
            /^filters-/,
            /^cta-/,
            /^section-/,
            /^loading-/,
            /^social-/,
            /^header/,
            /^footer/,
            /^content-/,
            ...(options.safelist?.greedy || []),
          ],
        },
        defaultExtractor: (content) => {
          // Более агрессивный экстрактор для классов
          const classes = content.match(/[A-Za-z0-9-_:/]+/g) || [];
          return classes;
        },
        ...options,
      };

      // Обрабатываем каждый CSS файл
      for (const fileName of cssFiles) {
        const file = bundle[fileName];
        
        if (file.type === 'asset') {
          try {
            const purgeCSSResult = await new PurgeCSS().purge({
              ...purgeCSSOptions,
              css: [
                {
                  raw: file.source.toString(),
                },
              ],
            });

            if (purgeCSSResult && purgeCSSResult[0]) {
              const purgedCSS = purgeCSSResult[0].css;
              const originalSize = file.source.length;
              const purgedSize = purgedCSS.length;
              const savedSize = originalSize - purgedSize;
              const savedPercent = ((savedSize / originalSize) * 100).toFixed(2);

              console.log(
                `\n✨ PurgeCSS optimized ${fileName}:\n` +
                  `   Original: ${(originalSize / 1024).toFixed(2)} KB → Purged: ${(purgedSize / 1024).toFixed(2)} KB\n` +
                  `   Saved: ${(savedSize / 1024).toFixed(2)} KB (${savedPercent}%)`
              );

              // Обновляем файл в бандле
              file.source = purgedCSS;
            }
          } catch (error) {
            console.warn(`PurgeCSS warning for ${fileName}:`, error.message);
          }
        }
      }
    },
  };
}

