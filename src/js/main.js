// Динамические импорты для уменьшения initial bundle size
// Импортируем только текущую страницу, остальные загружаются по требованию
import { BasePage } from './pages/BasePage.js';
import './konami-trigger.js';
import './home-index.js';
import './case-lightbox.js';
import './new-tab-note.js';
import { CustomCursor } from './components/custom-cursor/CustomCursor.js';
import { initViewportHeight } from './utils/ViewportHeight.js';
import { getPerformanceMonitor } from './services/PerformanceMonitor.js';

// Инициализируем viewport height как можно раньше для корректной работы на мобильных
// Это критически важно, так как CSS переменные используются до загрузки DOM
initViewportHeight();

// Предотвращаем восстановление позиции скролла браузером
// Это критически важно для mobile/tablet, где header и footer скроллятся с контентом
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Гарантируем, что страница всегда загружается с верхней позиции
// Делаем это как можно раньше, до любой инициализации
window.scrollTo(0, 0);
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;

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
  let pageName = path.split('/').pop() || 'index.html';
  if (!pageName.includes('.')) pageName += '.html';

  let pageInstance = null;

  try {
    if (document.body.classList.contains('page-404') || pageName === '404.html') {
      // 404: GitHub Pages отдаёт 404.html по любому несуществующему адресу, поэтому смотрим на класс body
      const { NotFoundPage } = await import('./pages/NotFoundPage.js');
      const notFoundPage = new NotFoundPage();
      pageInstance = notFoundPage;
      // Страница из bfcache: перезапускаем анимации
      window.addEventListener('pageshow', (event) => {
        const ctaContent = document.querySelector('.cta-slide-content');
        if (event.persisted && ctaContent && ctaContent.children.length > 0) {
          setTimeout(() => notFoundPage.initializeAnimations(), 100);
        }
      });
    } else if (document.body.classList.contains('static-page')) {
      const { StaticPage } = await import('./pages/StaticPage.js');
      pageInstance = new StaticPage();
    } else if (pageName === 'projects.html') {
      const { ProjectsPage } = await import('./pages/ProjectsPage.js');
      pageInstance = new ProjectsPage();
    } else if (pageName === 'cv.html') {
      const { CVPage } = await import('./pages/CVPage.js');
      pageInstance = new CVPage();
    } else if (pageName === 'research.html') {
      const { ResearchPage } = await import('./pages/ResearchPage.js');
      pageInstance = new ResearchPage();
    } else if (pageName.startsWith('case-') || pageName === 'services.html') {
      const { StaticPage } = await import('./pages/StaticPage.js');
      pageInstance = new StaticPage();
    }

    if (pageInstance) {
      await pageInstance.init();
      // Показываем контент с fade-in эффектом после инициализации страницы
      BasePage.updateFadeInElements();
    }
  } catch (error) {
    console.error('Ошибка при загрузке страницы:', error);
  }
}

// Регистрируем взаимодействие пользователя для предотвращения удаления состояния Chrome
// Это важно для bounce tracking mitigation в Chrome
(function registerEarlyUserInteraction() {
  let interactionRegistered = false;
  const markInteraction = () => {
    if (!interactionRegistered) {
      interactionRegistered = true;
      try {
        sessionStorage.setItem('user_interaction_registered', Date.now().toString());
      } catch (e) {
        // Игнорируем ошибки sessionStorage
      }
    }
  };
  
  // Регистрируем события как можно раньше
  if (document.readyState !== 'loading') {
    document.addEventListener('mousemove', markInteraction, { passive: true, once: true });
    document.addEventListener('touchstart', markInteraction, { passive: true, once: true });
    document.addEventListener('click', markInteraction, { passive: true, once: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.addEventListener('mousemove', markInteraction, { passive: true, once: true });
      document.addEventListener('touchstart', markInteraction, { passive: true, once: true });
      document.addEventListener('click', markInteraction, { passive: true, once: true });
    }, { once: true });
  }
})();

// Быстрая инициализация курсора как можно раньше
// Пытаемся инициализировать сразу, если DOM уже готов
if (document.readyState !== 'loading') {
  quickInitCursor();
} else {
  // Если DOM еще загружается, ждем DOMContentLoaded, но инициализируем как можно раньше
  document.addEventListener('DOMContentLoaded', quickInitCursor, { once: true, passive: true });
}

// Инициализация при загрузке DOM
// Используем requestIdleCallback для неблокирующей инициализации
const initPageAsync = async () => {
  await initCurrentPage();
};

// Оптимизированная инициализация страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Используем requestAnimationFrame для немедленной инициализации без блокировки
    requestAnimationFrame(() => {
      if (window.requestIdleCallback) {
        requestIdleCallback(initPageAsync, { timeout: 1000 });
      } else {
        initPageAsync();
      }
    });
  }, { once: true, passive: true });
} else {
  // Если DOM уже готов, инициализируем немедленно
  requestAnimationFrame(() => {
    if (window.requestIdleCallback) {
      requestIdleCallback(initPageAsync, { timeout: 1000 });
    } else {
      initPageAsync();
    }
  });
}

// Инициализация Performance Monitor
// Только в режиме разработки: в продакшене консоль чистая
if (!import.meta.env.DEV) {
  // ничего не делаем
} else if (window.requestIdleCallback) {
  requestIdleCallback(() => {
    const performanceMonitor = getPerformanceMonitor();
    performanceMonitor.init();
  }, { timeout: 2000 });
} else {
  // Fallback для браузеров без requestIdleCallback
  setTimeout(() => {
    const performanceMonitor = getPerformanceMonitor();
    performanceMonitor.init();
  }, 2000);
}
