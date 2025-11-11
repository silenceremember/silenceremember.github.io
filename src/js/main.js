import initCustomCursor from './components/custom-cursor';
import initSlidesManager from './components/slides';
import { initLayout } from './layout';
import { initThemeSwitcher } from './components/theme-switcher';
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

  if (headerContent) fadeInElements.add(headerContent);
  if (footerContent) fadeInElements.add(footerContent);

  if (contentWrapper) fadeInElements.add(contentWrapper);
  if (main && !fadeInElements.has(main)) fadeInElements.add(main);

  requestAnimationFrame(() => {
    setTimeout(() => {
      fadeInElements.forEach((element) => {
        element.classList.add('fade-in-visible');
      });
    }, 10);
  });
}

async function onDomReady() {
  await initLayout();
  await initSvgLoader();
  initThemeSwitcher();

  initCustomCursor();

  if (document.querySelector('.slides-container')) {
    initSlidesManager();
  } else if (document.body.classList.contains('page-404') || document.body.classList.contains('page-with-scroll')) {
    initScrollHandler('.page-wrapper');
  }

  updateFadeInElements();

  window.addEventListener('resize', debounce(updateFadeInElements, 200));
}

document.addEventListener('DOMContentLoaded', onDomReady);
