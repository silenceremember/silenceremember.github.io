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
});
