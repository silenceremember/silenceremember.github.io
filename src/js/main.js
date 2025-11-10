import initCustomCursor from './components/custom-cursor';
import initSlidesManager from './components/slides';
import { initLayout } from './layout';
import { initThemeSwitcher } from './components/theme-switcher';

document.addEventListener('DOMContentLoaded', async () => {
  await initLayout();
  initThemeSwitcher();

  initCustomCursor();

  // Инициализируем слайдер только если на странице есть соответствующий контейнер
  if (document.querySelector('.slides-container')) {
    initSlidesManager();
  }

  // Добавляем fade-in анимацию для контента
  // В мобильном режиме header и footer не получают fade-in (управляются через transform)
  // В десктопном режиме все элементы получают fade-in
  const fadeInElements = new Set();
  
  const headerContent = document.querySelector('.header-content');
  const footerContent = document.querySelector('.footer-content');
  const contentWrapper = document.querySelector('.content-wrapper');
  const main = document.querySelector('main');
  
  // Проверяем, находимся ли мы в мобильном режиме
  const isMobile = window.innerWidth <= 768;
  
  // В десктопном режиме добавляем header и footer
  if (!isMobile) {
    if (headerContent) fadeInElements.add(headerContent);
    if (footerContent) fadeInElements.add(footerContent);
  }
  
  // content-wrapper и main всегда получают fade-in
  if (contentWrapper) fadeInElements.add(contentWrapper);
  if (main && !fadeInElements.has(main)) fadeInElements.add(main);

  // Используем requestAnimationFrame для плавного появления
  // Небольшая задержка для предотвращения мерцания
  requestAnimationFrame(() => {
    setTimeout(() => {
      fadeInElements.forEach(element => {
        element.classList.add('fade-in-visible');
      });
    }, 10);
  });
});
