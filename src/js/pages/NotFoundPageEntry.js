/**
 * Точка входа для страницы 404
 * Инициализирует NotFoundPage и обрабатывает события загрузки страницы
 */
import { NotFoundPage } from './NotFoundPage.js';

const notFoundPage = new NotFoundPage();

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    notFoundPage.init();
  });
} else {
  notFoundPage.init();
}

// Обработчик для случая загрузки страницы из кеша (bfcache)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    const ctaContent = document.querySelector('.cta-slide-content');
    if (ctaContent && ctaContent.children.length > 0) {
      setTimeout(() => {
        notFoundPage.initializeAnimations();
      }, 100);
    }
  }
});

