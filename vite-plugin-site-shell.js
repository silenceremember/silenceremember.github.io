/**
 * Оболочка страниц на этапе сборки и в dev-сервере:
 * - вставляет шапку и подвал из public/components прямо в HTML, чтобы навигация была без JS;
 * - отмечает активный пункт меню (class="active" и aria-current="page");
 * - объявляет Inter (вариативный 400–900, свои файлы) и запасной шрифт с метриками Inter,
 *   чтобы подмена шрифта не сдвигала текст, и добавляет preload кириллицы и латиницы.
 */
import { readFileSync } from 'fs';
import path from 'path';

const FONT_DIR = '/assets/fonts/inter';
const FACES = [
  ['cyrillic-ext', 'U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F'],
  ['cyrillic', 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116'],
  ['latin-ext', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['latin', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
];

// Метрики Arial под Inter: ширина и высота строки совпадают, текст не прыгает при подмене
const FALLBACK = `@font-face{font-family:'Inter Fallback';src:local('Arial'),local('Helvetica'),local('Liberation Sans');size-adjust:107.12%;ascent-override:90.44%;descent-override:22.52%;line-gap-override:0%}`;

const fontHead = () => {
  const faces = FACES.map(
    ([sub, range]) =>
      `@font-face{font-family:'Inter';font-style:normal;font-weight:400 900;font-display:swap;src:url(${FONT_DIR}/inter-var-${sub}.woff2) format('woff2');unicode-range:${range}}`
  ).join('');
  const preload = ['cyrillic', 'latin']
    .map((sub) => `<link rel="preload" href="${FONT_DIR}/inter-var-${sub}.woff2" as="font" type="font/woff2" crossorigin />`)
    .join('\n    ');
  return `${preload}\n    <style id="font-faces">${faces}${FALLBACK}</style>`;
};

const pageOf = (file) => {
  let name = path.basename(file || '');
  if (!name || name === 'index.html') return 'index.html';
  if (name.startsWith('case-')) return 'projects.html';
  return name;
};

const markActive = (header, page) =>
  header.replace(/<a href="([^"]+)" class="header-nav-item">/g, (m, href) => {
    const target = href === '/' ? 'index.html' : href.split('/').pop();
    return target === page
      ? `<a href="${href}" class="header-nav-item active" aria-current="page">`
      : m;
  });

// Без JS бургер не откроется: на телефоне пункты меню видны строкой с прокруткой вбок.
// Переключатель языка без JS не работает: прячем его
const NOSCRIPT_NAV = `<noscript><style>.header-language{display:none!important}@media (max-width:1023px){.header-menu-button{display:none!important}.header-nav{display:block!important;flex:1;min-width:0;margin-left:12px;overflow-x:auto;scrollbar-width:none}.header-nav-list{display:flex!important;justify-content:flex-start!important;width:max-content;gap:6px}.header-nav-list li{flex:none!important}.header-nav-item{min-height:44px!important;height:44px!important;padding:0 10px!important;font-size:12px!important}}</style></noscript>`;

export function siteShell({ publicDir }) {
  // SVG-иконки шапки и подвала сразу в HTML (SvgLoader их больше не подгружает): видны и без JS
  const inlineSvg = (html) =>
    html.replace(/<span\s+(?:class="([^"]*)"\s+)?data-svg-src="([^"]+)"\s*>\s*<\/span>/g, (m, cls, src) => {
      try {
        const svg = readFileSync(path.join(publicDir, src), 'utf8').replace(/<\?xml[^>]*>\s*/, '').trim();
        const extra = `${cls ? ` class="${cls}"` : ''} aria-hidden="true" focusable="false"`;
        return svg.replace(/^<svg/, `<svg${extra}`);
      } catch {
        return m;
      }
    });
  const read = (name) =>
    inlineSvg(readFileSync(path.join(publicDir, 'components', name), 'utf8').trim());
  return {
    name: 'site-shell',
    enforce: 'pre',
    transformIndexHtml(html, ctx) {
      const page = pageOf(ctx.filename || ctx.path);
      const header = markActive(read('header.html'), page);
      const footer = read('footer.html');
      // Критический CSS (один файл на все страницы) вместо метки в <head>
      const critical = readFileSync(path.join(path.dirname(publicDir), 'src', 'partials', 'critical.css'), 'utf8').trim();
      let out = html
        .replace("<!-- critical-css: вставляет vite-plugin-site-shell из src/partials/critical.css -->", () => `<style>${critical}</style>`)
        .replace(/<header class="header">\s*<\/header>/, `<header class="header">${header}</header>`)
        .replace(/<footer class="footer">\s*<\/footer>/, `<footer class="footer">${footer}</footer>`);
      // Фон с кольцами декоративный: скрыт от скринридеров
      out = out.replace('<div id="background-container"></div>', '<div id="background-container" aria-hidden="true"></div>');
      // У main всегда id="main", на всех страницах есть ссылка «К содержанию»
      out = out.replace(/<main class="content-wrapper"(?![^>]*\bid=)/, '<main class="content-wrapper" id="main"');
      if (!out.includes('class="skip-link"')) {
        out = out.replace(
          /(<body[^>]*>)/,
          `$1
    <a class="skip-link" href="#main"><span class="i18n-ru">К содержанию</span><span class="i18n-en" lang="en">Skip to content</span></a>`
        );
      }
      if (!out.includes('id="font-faces"')) {
        out = out.replace(/(<meta name="viewport"[^>]*>)/, `$1\n    ${fontHead()}\n    ${NOSCRIPT_NAV}`);
      }
      return out;
    },
  };
}
