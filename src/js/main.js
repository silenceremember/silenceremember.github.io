import initCustomCursor from './components/custom-cursor';
import initSlidesManager from './components/slides';
import { initLayout } from './layout';
import { initThemeSwitcher } from './components/theme-switcher';
import { initLanguageSwitcher } from './components/language-switcher';
import initSvgLoader from './components/svg-loader';
import { initScrollHandler } from './components/scroll';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function updateFadeInElements() {
  const fadeInElements = new Set();
  const headerContent = document.querySelector('.header-content');
  const footerContent = document.querySelector('.footer-content');
  const contentWrapper = document.querySelector('.content-wrapper');
  const main = document.querySelector('main');
  const slidesContainer = document.querySelector('.slides-container');

  if (headerContent) {
    fadeInElements.add(headerContent);
    headerContent.style.willChange = 'opacity';
  }
  if (footerContent) {
    fadeInElements.add(footerContent);
    footerContent.style.willChange = 'opacity';
  }

  if (contentWrapper) {
    fadeInElements.add(contentWrapper);
    contentWrapper.style.willChange = 'opacity';
  }
  if (main && !fadeInElements.has(main)) {
    fadeInElements.add(main);
    main.style.willChange = 'opacity';
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
          // Убираем will-change после анимации для оптимизации
          setTimeout(() => {
            element.style.willChange = 'auto';
          }, 300); // Длительность transition
        });
      }, 16); // ~1 frame при 60fps
    });
  });
}

async function onDomReady() {
  // Критические компоненты загружаем сразу
  await initLayout();
  await initSvgLoader();
  initThemeSwitcher();
  initLanguageSwitcher();

  initCustomCursor();

  if (document.querySelector('.slides-container')) {
    initSlidesManager();
  } else if (document.body.classList.contains('page-404') || document.body.classList.contains('page-with-scroll')) {
    initScrollHandler('.page-wrapper');
  }

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

document.addEventListener('DOMContentLoaded', onDomReady);
