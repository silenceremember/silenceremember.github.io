import initCustomCursor from './components/custom-cursor';
import initSlidesManager from './components/slides';
import { initLayout } from './layout';
import { initThemeSwitcher } from './components/theme-switcher';
import { initLanguageSwitcher } from './components/language-switcher';
import initSvgLoader from './components/svg-loader';
import { initScrollHandler } from './components/scroll';
import { debounce } from './utils/DebounceUtils.js';
import { IndexPage, hideAllSlideElementsEarly } from './pages/index.js';
import { ProjectsPage } from './pages/projects.js';
import { CVPage } from './pages/cv.js';
import { ResearchPage } from './pages/research.js';
import { CommunityPage } from './pages/community.js';


function updateFadeInElements() {
  const fadeInElements = new Set();
  const headerContent = document.querySelector('.header-content');
  const footerContent = document.querySelector('.footer-content');
  const contentWrapper = document.querySelector('.content-wrapper');
  const main = document.querySelector('main');
  const slidesContainer = document.querySelector('.slides-container');

  // Оптимизация: не используем will-change на больших элементах (content-wrapper, main)
  // так как они превышают бюджет памяти браузера
  if (headerContent) {
    fadeInElements.add(headerContent);
    // Убираем will-change для больших элементов - используем только transition
  }
  if (footerContent) {
    fadeInElements.add(footerContent);
    // Убираем will-change для больших элементов
  }

  if (contentWrapper) {
    fadeInElements.add(contentWrapper);
    // Не используем will-change на content-wrapper - слишком большой элемент
  }
  if (main && !fadeInElements.has(main)) {
    fadeInElements.add(main);
    // Не используем will-change на main - слишком большой элемент
  }

  // Если есть слайды в tablet-scroll-mode, убеждаемся что они видимы
  if (slidesContainer && slidesContainer.classList.contains('tablet-scroll-mode')) {
    const slides = slidesContainer.querySelectorAll('.slide');
    slides.forEach((slide) => {
      // В tablet-scroll-mode слайды должны быть видимы сразу
      slide.style.opacity = '1';
      slide.style.visibility = 'visible';
    });
  }

  // Используем двойной requestAnimationFrame для гарантии готовности стилей
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Минимальная задержка для предотвращения FOUC
      setTimeout(() => {
        fadeInElements.forEach((element) => {
          element.classList.add('fade-in-visible');
          // Не используем will-change для больших элементов - transition достаточно
        });
      }, 16); // ~1 frame при 60fps
    });
  });
}

/**
 * Определяет текущую страницу по URL
 */
function getCurrentPage() {
  const path = window.location.pathname.split('/').pop();
  if (path === '' || path === 'index.html' || !path) {
    return 'index';
  }
  // Убираем расширение .html если есть
  return path.replace(/\.html$/, '');
}

/**
 * Инициализирует соответствующую страницу
 */
async function initCurrentPage() {
  const currentPage = getCurrentPage();
  
  switch (currentPage) {
    case 'index':
      const slidesContainer = document.querySelector('.slides-container');
      if (slidesContainer) {
        initSlidesManager();
        const indexPage = new IndexPage();
        await indexPage.init();
      }
      break;
      
    case 'projects':
      const projectsPage = new ProjectsPage();
      await projectsPage.init();
      break;
      
    case 'cv':
      const cvPage = new CVPage();
      await cvPage.init();
      
      // Обработчик для случая загрузки страницы из кеша (bfcache)
      // Это важно для SPA-подобной навигации
      window.addEventListener('pageshow', (event) => {
        cvPage.handlePageshow(event);
      });
      break;
      
    case 'research':
      const researchPage = new ResearchPage();
      await researchPage.init();
      break;
      
    case 'community':
      const communityPage = new CommunityPage();
      await communityPage.init();
      
      // Обработчик для случая загрузки страницы из кеша (bfcache)
      // Это важно для SPA-подобной навигации
      window.addEventListener('pageshow', (event) => {
        communityPage.handlePageshow(event);
      });
      break;
      
    default:
      // Для других страниц (404) используем scroll handler
      if (document.body.classList.contains('page-404') || document.body.classList.contains('page-with-scroll')) {
        initScrollHandler('.page-wrapper');
      }
      break;
  }
}

async function onDomReady() {
  // Критические компоненты загружаем сразу
  await initLayout();
  await initSvgLoader();
  initThemeSwitcher();
  initLanguageSwitcher();

  initCustomCursor();

  // Инициализируем соответствующую страницу
  await initCurrentPage();

  updateFadeInElements();

  // Non-critical операции выполняем в idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      window.addEventListener('resize', debounce(updateFadeInElements, 200));
    }, { timeout: 2000 });
  } else {
    // Fallback для браузеров без requestIdleCallback
    setTimeout(() => {
      window.addEventListener('resize', debounce(updateFadeInElements, 200));
    }, 0);
  }
}

// Сразу скрываем элементы всех слайдов как можно раньше
// Это критично важно - нужно сделать до того как элементы станут видимыми
if (document.readyState === 'loading') {
  // Если DOM еще загружается, ждем DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    hideAllSlideElementsEarly();
    onDomReady();
  });
} else {
  // Если DOM уже готов, скрываем элементы сразу
  hideAllSlideElementsEarly();
  onDomReady();
}
