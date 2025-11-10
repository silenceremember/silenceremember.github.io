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
  // Собираем все элементы, которые нужно анимировать
  const fadeInElements = new Set();
  
  const header = document.querySelector('.header');
  const footer = document.querySelector('.footer');
  const contentWrapper = document.querySelector('.content-wrapper');
  const main = document.querySelector('main');
  
  if (header) fadeInElements.add(header);
  if (footer) fadeInElements.add(footer);
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
