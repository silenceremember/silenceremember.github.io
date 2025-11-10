import initCustomCursor from './components/custom-cursor';
import initSlidesManager from './components/slides';
import { initLayout } from './layout';

document.addEventListener('DOMContentLoaded', async () => {
  await initLayout();

  initCustomCursor();

  // Инициализируем слайдер только если на странице есть соответствующий контейнер
  if (document.querySelector('.slides-container')) {
    initSlidesManager();
  }

  // Добавляем fade-in анимацию для контента
  // В мобильном режиме header и footer не получают fade-in (управляются через transform)
  // В десктопном режиме все элементы получают fade-in
  const fadeInElements = new Set();
  
  const header = document.querySelector('.header');
  const footer = document.querySelector('.footer');
  const contentWrapper = document.querySelector('.content-wrapper');
  const main = document.querySelector('main');
  
  // Проверяем, находимся ли мы в мобильном режиме
  const isMobile = window.innerWidth <= 768;
  
  // В десктопном режиме добавляем header и footer
  if (!isMobile) {
    if (header) fadeInElements.add(header);
    if (footer) fadeInElements.add(footer);
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
