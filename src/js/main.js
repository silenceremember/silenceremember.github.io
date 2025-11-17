import { IndexPage, hideAllSlideElementsEarly } from './pages/IndexPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { CVPage } from './pages/CVPage.js';
import { ResearchPage } from './pages/ResearchPage.js';
import { CommunityPage } from './pages/CommunityPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { BasePage } from './pages/BasePage.js';
import { CustomCursor } from './components/index.js';

/**
 * Быстрая инициализация курсора при загрузке страницы
 * Восстанавливает позицию из sessionStorage сразу для мгновенного отображения
 */
function quickInitCursor() {
  if (!window.__globalCustomCursor) {
    const cursor = new CustomCursor();
    // Быстрая инициализация - только восстановление позиции
    cursor.quickInit();
    // Сохраняем в глобальной переменной для переиспользования
    window.__globalCustomCursor = cursor;
  }
}

/**
 * Определяет текущую страницу и инициализирует соответствующий класс
 * @returns {Promise<void>}
 */
async function initCurrentPage() {
  const path = window.location.pathname;
  const pageName = path.split('/').pop() || 'index.html';

  let pageInstance = null;

  if (pageName === 'index.html' || pageName === '' || path === '/') {
    pageInstance = new IndexPage();
  } else if (pageName === 'projects.html') {
    pageInstance = new ProjectsPage();
  } else if (pageName === 'cv.html') {
    pageInstance = new CVPage();
  } else if (pageName === 'research.html') {
    pageInstance = new ResearchPage();
  } else if (pageName === 'community.html') {
    pageInstance = new CommunityPage();
  } else if (pageName === '404.html') {
    pageInstance = new NotFoundPage();
  }

  if (pageInstance) {
    await pageInstance.init();
    // Показываем контент с fade-in эффектом после инициализации страницы
    BasePage.updateFadeInElements();
  }
}

// Быстрая инициализация курсора как можно раньше
// Пытаемся инициализировать сразу, если DOM уже готов
if (document.readyState !== 'loading') {
  quickInitCursor();
} else {
  // Если DOM еще загружается, ждем DOMContentLoaded, но инициализируем как можно раньше
  document.addEventListener('DOMContentLoaded', quickInitCursor, { once: true });
}

// Инициализация при загрузке DOM
// Скрывает элементы слайдов как можно раньше для предотвращения FOUC
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    // Сразу скрываем элементы всех слайдов как можно раньше (только для главной страницы)
    await hideAllSlideElementsEarly();
    initCurrentPage();
  });
} else {
  // Если DOM уже готов, скрываем элементы сразу
  hideAllSlideElementsEarly().then(() => {
    initCurrentPage();
  });
}
