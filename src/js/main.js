// Динамические импорты для уменьшения initial bundle size
// Импортируем только текущую страницу, остальные загружаются по требованию
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
 * Использует динамические импорты для уменьшения initial bundle size
 * @returns {Promise<void>}
 */
async function initCurrentPage() {
  const path = window.location.pathname;
  const pageName = path.split('/').pop() || 'index.html';

  let pageInstance = null;
  let hideAllSlideElementsEarly = null;

  try {
    if (pageName === 'index.html' || pageName === '' || path === '/') {
      // Импортируем только главную страницу
      const { IndexPage, hideAllSlideElementsEarly: hideSlides } = await import('./pages/IndexPage.js');
      hideAllSlideElementsEarly = hideSlides;
      pageInstance = new IndexPage();
    } else if (pageName === 'projects.html') {
      const { ProjectsPage } = await import('./pages/ProjectsPage.js');
      pageInstance = new ProjectsPage();
    } else if (pageName === 'cv.html') {
      const { CVPage } = await import('./pages/CVPage.js');
      pageInstance = new CVPage();
    } else if (pageName === 'research.html') {
      const { ResearchPage } = await import('./pages/ResearchPage.js');
      pageInstance = new ResearchPage();
    } else if (pageName === 'community.html') {
      const { CommunityPage } = await import('./pages/CommunityPage.js');
      pageInstance = new CommunityPage();
    } else if (pageName === '404.html') {
      const { NotFoundPage } = await import('./pages/NotFoundPage.js');
      pageInstance = new NotFoundPage();
    }

    if (pageInstance) {
      await pageInstance.init();
      // Показываем контент с fade-in эффектом после инициализации страницы
      BasePage.updateFadeInElements();
    }
  } catch (error) {
    console.error('Ошибка при загрузке страницы:', error);
  }
  
  return hideAllSlideElementsEarly;
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
    const hideSlides = await initCurrentPage();
    // Скрываем элементы слайдов после загрузки страницы (только для главной страницы)
    if (hideSlides) {
      await hideSlides();
    }
  });
} else {
  // Если DOM уже готов, инициализируем сразу
  initCurrentPage().then((hideSlides) => {
    if (hideSlides) {
      hideSlides();
    }
  });
}
