// Динамические импорты для уменьшения initial bundle size
// Импортируем только текущую страницу, остальные загружаются по требованию
import { BasePage } from './pages/BasePage.js';
import { CustomCursor } from './components/index.js';

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

// Убираем index.html из URL для чистых URL
// Это нужно для GitHub Pages, который автоматически добавляет index.html
(function cleanIndexHtmlFromUrl() {
  const cleanUrl = () => {
    const path = window.location.pathname;
    if (path === '/index.html' || path.endsWith('/index.html')) {
      const cleanPath = path.replace(/\/index\.html$/, '/') || '/';
      const newUrl = cleanPath + window.location.search + window.location.hash;
      // Используем replace вместо push, чтобы не добавлять запись в историю
      window.history.replaceState(null, '', newUrl);
    }
  };
  
  // Очищаем URL при загрузке страницы
  cleanUrl();
  
  // Очищаем URL при изменении истории (назад/вперед)
  window.addEventListener('popstate', cleanUrl);
  
  // Очищаем URL периодически (на случай, если GitHub Pages добавляет index.html после загрузки)
  // Используем MutationObserver для отслеживания изменений в DOM, которые могут указывать на изменение URL
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      cleanUrl();
    });
    // Начинаем наблюдение за изменениями в document
    if (document.body) {
      observer.observe(document.body, { childList: false, subtree: false });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: false, subtree: false });
      });
    }
  }
})();

// Перехватываем клики по ссылкам на главную страницу
// Используем прямой переход на / вместо стандартной навигации для предотвращения добавления index.html
(function interceptHomePageLinks() {
  const handleLinkClick = (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    // Проверяем, ведет ли ссылка на главную страницу
    if (href === '/' || href === '' || href === '/index.html' || href.endsWith('/index.html')) {
      // Проверяем, что это не внешняя ссылка
      if (!href.includes('://') && (href.startsWith('/') || href === '')) {
        e.preventDefault();
        const targetPath = '/';
        const hash = link.hash || '';
        const newUrl = targetPath + hash;
        // Используем прямой переход, чтобы гарантировать загрузку страницы
        window.location.href = newUrl;
      }
    }
  };
  
  // Добавляем обработчик на document для делегирования событий
  // Используем capture phase для перехвата до других обработчиков
  document.addEventListener('click', handleLinkClick, true);
})();

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
  const pageName = path.split('/').pop() || '';

  let pageInstance = null;
  let hideAllSlideElementsEarly = null;

  try {
    if (pageName === '' || pageName === 'index.html' || path === '/') {
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
  document.addEventListener('DOMContentLoaded', quickInitCursor, { once: true });
}

// Инициализация при загрузке DOM
// Используем requestIdleCallback для неблокирующей инициализации
const initPageAsync = async () => {
  const hideSlides = await initCurrentPage();
  // Скрываем элементы слайдов после загрузки страницы (только для главной страницы)
  if (hideSlides) {
    await hideSlides();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Используем requestIdleCallback для неблокирующей инициализации
    if (window.requestIdleCallback) {
      requestIdleCallback(initPageAsync, { timeout: 2000 });
    } else {
      // Fallback для браузеров без requestIdleCallback
      setTimeout(initPageAsync, 0);
    }
  });
} else {
  // Если DOM уже готов, используем requestIdleCallback
  if (window.requestIdleCallback) {
    requestIdleCallback(initPageAsync, { timeout: 2000 });
  } else {
    setTimeout(initPageAsync, 0);
  }
}
