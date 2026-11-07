import { PurgeCSS } from 'purgecss';
import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';

/**
 * Vite plugin для PurgeCSS: после сборки убирает из CSS правила для классов,
 * которых нет ни в собранных HTML и JS, ни в файлах из public, которые страница
 * получает во время работы (шаблоны компонентов, данные JSON, SVG-иконки).
 * Игра-пасхалка (public/konami) приносит свои стили и сюда не входит.
 */

// Файлы из public, которые подгружаются в браузере и тоже содержат классы
const PUBLIC_CONTENT = [
  ['components', /\.html$/],
  ['data', /\.json$/],
  ['js', /\.js$/],
  // SVG-иконки, которые SvgLoader вставляет в страницу (классы путей у кнопки «Наверх»)
  ['assets/images', /\.svg$/, false],
];

function publicContent(publicDir) {
  const files = [];
  const walk = (dir, re, deep = true) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (deep) walk(p, re, deep); }
      else if (re.test(e.name)) files.push(p);
    }
  };
  for (const [sub, re, deep] of PUBLIC_CONTENT) walk(path.join(publicDir, sub), re, deep !== false);
  return files.map((f) => ({ raw: readFileSync(f, 'utf8'), extension: path.extname(f).slice(1) }));
}

export function vitePurgeCSS(options = {}) {
  const { publicDir, safelist = {} } = options;
  return {
    name: 'vite-plugin-purgecss',
    apply: 'build', // Only run during build, not dev
    enforce: 'post',
    async generateBundle(opts, bundle) {
      const cssFiles = Object.keys(bundle).filter(
        (fileName) => fileName.endsWith('.css') && !fileName.includes('.map')
      );
      if (cssFiles.length === 0) return;

      // Контент: собранные HTML и JS-чанки плюс файлы из public, которые грузятся во время работы
      const content = [];
      for (const fileName of Object.keys(bundle)) {
        const file = bundle[fileName];
        if (fileName.endsWith('.html') && file.type === 'asset') {
          content.push({ raw: file.source.toString(), extension: 'html' });
        } else if (fileName.endsWith('.js') && file.type === 'chunk') {
          content.push({ raw: file.code, extension: 'js' });
        }
      }
      if (publicDir) content.push(...publicContent(publicDir));

      const purgeCSSOptions = {
        content,
        safelist: {
          // Только классы, которые JS собирает из частей: в исходниках их целиком нет
          standard: [
            /^project-card-status-/, // CardFactory: `project-card-status-${project.status}`
            ...(safelist.standard || []),
          ],
          deep: [...(safelist.deep || [])],
          // Правило :focus-visible без класса PurgeCSS иначе выбрасывает
          greedy: [/focus-visible/, ...(safelist.greedy || [])],
        },
        defaultExtractor: (text) => text.match(/[A-Za-z0-9-_:/]+/g) || [],
      };

      for (const fileName of cssFiles) {
        const file = bundle[fileName];
        if (file.type !== 'asset') continue;
        try {
          const [result] = await new PurgeCSS().purge({
            ...purgeCSSOptions,
            css: [{ raw: file.source.toString() }],
          });
          if (result) {
            const before = file.source.length;
            const after = result.css.length;
            console.log(
              `\n✨ PurgeCSS ${fileName}: ${(before / 1024).toFixed(2)} KB → ${(after / 1024).toFixed(2)} KB` +
                ` (−${(((before - after) / before) * 100).toFixed(2)}%)`
            );
            file.source = result.css;
          }
        } catch (error) {
          console.warn(`PurgeCSS warning for ${fileName}:`, error.message);
        }
      }
    },
  };
}
