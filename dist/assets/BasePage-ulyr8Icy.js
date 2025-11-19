/**
 * Базовый класс для всех страниц
 */
import { PageReadyManager } from '../utils/PageReady.js';
import {
  NavigationHelper,
  MenuButtonScrollHandler,
} from '../utils/Navigation.js';
// Критические компоненты - импортируем статически
import { ScrollToTopButton } from '../components/scroll/ScrollToTopButton.js';
import { ScrollManager } from '../components/scroll/ScrollManager.js';
import { LayoutManager } from '../layout/LayoutManager.js';
import { ThemeSwitcher } from '../components/index.js';
import { LanguageSwitcher } from '../components/index.js';
import { CustomCursor } from '../components/index.js';
import { LoadingIndicatorService } from '../services/LoadingIndicatorService.js';
// Некритические компоненты - загружаем динамически
// import { SvgLoader } from '../components/svg/SvgLoader.js';
// import { FluidBackground } from '../components/index.js';
import { loadData } from '../utils/DataLoader.js';
import { loadTemplate } from '../utils/TemplateLoader.js';

// Глобальные компоненты инициализируются один раз
let globalComponentsInitialized = false;

// Кеш для шаблонов (общий для всех страниц)
const templateCache = new Map();

export class BasePage {
  /**
   * @param {Object} config - Конфигурация страницы
   * @param {string} config.navigationSelector - Селектор навигационного контейнера
   * @param {string} config.imageSelector - Селектор для поиска изображений (по умолчанию 'img')
   */
  constructor(config = {}) {
    this.navigationSelector = config.navigationSelector || '';
    this.imageSelector = config.imageSelector || 'img';
    this.menuButtonScrollHandler = null;
    this.scrollToTopButton = null;
    this.scrollManager = null;
    this._svgLoader = null; // Ленивая инициализация
    this._svgLoaderPromise = null; // Промис для синхронизации загрузки
    this.layoutManager = null;
    this.loadingIndicator = null;
  }

  /**
   * Получает или создает экземпляр SvgLoader (ленивая загрузка)
   * @returns {Promise<SvgLoader>} Экземпляр SvgLoader
   */
  async getSvgLoader() {
    if (this._svgLoader) {
      return this._svgLoader;
    }
    
    // Если уже идет загрузка, ждем ее завершения
    if (this._svgLoaderPromise) {
      return this._svgLoaderPromise;
    }

    // Загружаем SvgLoader динамически, используем глобальный экземпляр
    this._svgLoaderPromise = (async () => {
      try {
        const { globalSvgLoader } = await import('../components/svg/SvgLoader.js');
        // Используем глобальный экземпляр для переиспользования кеша
        this._svgLoader = globalSvgLoader;
        return this._svgLoader;
      } catch (error) {
        console.error('Failed to load SvgLoader:', error);
        this._svgLoaderPromise = null;
        throw error;
      }
    })();

    return this._svgLoaderPromise;
  }

  /**
   * Синхронный геттер для обратной совместимости (возвращает null если еще не загружен)
   * @returns {SvgLoader|null}
   */
  get svgLoader() {
    return this._svgLoader || null;
  }

  /**
   * Инициализирует навигацию
   * @param {string} navigationSelector - Селектор навигационного контейнера
   */
  initNavigation(navigationSelector) {
    if (!navigationSelector) {
      return;
    }

    // Выделяем активную ссылку в навигации
    NavigationHelper.setActiveNavigationLink(navigationSelector);

    // Инициализируем обработчик прокрутки к навигации
    this.menuButtonScrollHandler = new MenuButtonScrollHandler(
      navigationSelector
    );
    this.menuButtonScrollHandler.init();
  }

  /**
   * Инициализирует кнопку "Наверх"
   */
  initScrollToTop() {
    this.scrollToTopButton = new ScrollToTopButton();
    this.scrollToTopButton.init();
  }

  /**
   * Инициализирует менеджер скролла для страниц с прокруткой
   */
  initScrollManager() {
    // Инициализируем ScrollManager для страниц с классом page-with-scroll
    // (projects, research, cv, community) или для страницы 404 в tablet режиме
    const isScrollPage = document.body.classList.contains('page-with-scroll');
    const is404Page = document.body.classList.contains('page-404');
    
    if (isScrollPage || is404Page) {
      this.scrollManager = new ScrollManager('.page-wrapper', (isTablet) => {
        // Callback для уведомления об изменении режима планшета
        // Можно использовать для дополнительной логики при необходимости
      });
      this.scrollManager.init();
      
      // Двусторонняя связь между ScrollManager и ScrollToTopButton
      if (this.scrollToTopButton) {
        this.scrollToTopButton.setScrollManager(this.scrollManager);
        this.scrollManager.setScrollToTopButton(this.scrollToTopButton);
      }
    }
  }

  /**
   * Гарантирует, что страница загружается с верхней позиции скролла
   * Особенно важно для mobile/tablet, где header и footer теперь скроллятся с контентом
   */
  ensureScrollAtTop() {
    // Проверяем, нужно ли скроллить к верху (для всех устройств)
    if (window.pageYOffset > 0 || document.documentElement.scrollTop > 0) {
      window.scrollTo(0, 0);
    }
    
    // Дополнительная проверка для page-wrapper на случай, если там есть скролл
    const pageWrapper = document.querySelector('.page-wrapper');
    if (pageWrapper && pageWrapper.scrollTop > 0) {
      pageWrapper.scrollTop = 0;
    }
  }

  /**
   * Инициализирует глобальные компоненты (вызывается один раз)
   */
  static async initGlobalComponents() {
    if (globalComponentsInitialized) {
      return;
    }

    // Критические компоненты загружаем сразу
    const layoutManager = new LayoutManager();
    await layoutManager.init();

    const themeSwitcher = new ThemeSwitcher();
    themeSwitcher.init();

    const languageSwitcher = new LanguageSwitcher();
    await languageSwitcher.init();

    // Используем глобальный экземпляр курсора из main.js, если он доступен
    // Иначе создаем новый и инициализируем полностью
    if (typeof window !== 'undefined' && window.__globalCustomCursor) {
      const customCursor = window.__globalCustomCursor;
      if (!customCursor.isInitialized) {
        customCursor.init();
      }
    } else {
      const customCursor = new CustomCursor();
      customCursor.init();
      if (typeof window !== 'undefined') {
        window.__globalCustomCursor = customCursor;
      }
    }

    // Некритические компоненты загружаем асинхронно после критических
    // Используем requestIdleCallback для неблокирующей загрузки
    const loadNonCriticalComponents = async () => {
      try {
        // Динамически импортируем некритические компоненты
        // Используем глобальный экземпляр SvgLoader для переиспользования кеша
        const [{ globalSvgLoader }, { FluidBackground }] = await Promise.all([
          import('../components/svg/SvgLoader.js'),
          import('../components/index.js').then(m => ({ FluidBackground: m.FluidBackground })),
        ]);

        // Используем глобальный экземпляр для единого кеша
        await globalSvgLoader.init();

        // Initialize fluid background with a small delay to ensure canvas is in DOM
        // Оптимизация: уменьшена вложенность requestAnimationFrame
        const fluidBackground = new FluidBackground();
        // Use requestAnimationFrame to ensure canvas is rendered
        requestAnimationFrame(() => {
          fluidBackground.init();
        });
      } catch (error) {
        console.warn('Failed to load non-critical components:', error);
      }
    };

    // Загружаем некритические компоненты в idle time
    if (window.requestIdleCallback) {
      requestIdleCallback(loadNonCriticalComponents, { timeout: 3000 });
    } else {
      setTimeout(loadNonCriticalComponents, 100);
    }

    globalComponentsInitialized = true;
  }

  /**
   * Ленивая загрузка менеджера анимаций (deprecated - используйте статические импорты)
   * @deprecated Этот метод больше не используется, так как все менеджеры теперь импортируются статически
   * @param {string} managerPath - Путь к модулю менеджера (например, '../managers/CVAnimationManager.js')
   * @param {Array} constructorArgs - Аргументы для конструктора менеджера (опционально)
   * @returns {Promise<any>} Экземпляр менеджера анимаций
   */
  async loadAnimationManager(managerPath, constructorArgs = []) {
    console.warn('loadAnimationManager is deprecated. Use static imports instead.');
    return null;
  }

  /**
   * Обновляет элементы для fade-in анимации
   */
  static updateFadeInElements() {
    const fadeInElements = new Set();
    const headerContent = document.querySelector('.header-content');
    const footerContent = document.querySelector('.footer-content');
    const contentWrapper = document.querySelector('.content-wrapper');
    const main = document.querySelector('main');
    const slidesContainer = document.querySelector('.slides-container');
    const decorativeLines = document.querySelectorAll('.decorative-line-horizontal');

    if (headerContent) {
      fadeInElements.add(headerContent);
    }
    if (footerContent) {
      fadeInElements.add(footerContent);
    }

    if (contentWrapper) {
      fadeInElements.add(contentWrapper);
    }
    if (main && !fadeInElements.has(main)) {
      fadeInElements.add(main);
    }

    // Добавляем декоративные линии
    decorativeLines.forEach((line) => {
      fadeInElements.add(line);
    });

    // Если есть слайды в tablet-scroll-mode, убеждаемся что они видимы
    if (
      slidesContainer &&
      slidesContainer.classList.contains('tablet-scroll-mode')
    ) {
      const slides = slidesContainer.querySelectorAll('.slide');
      slides.forEach((slide) => {
        slide.style.opacity = '1';
        slide.style.visibility = 'visible';
      });
    }

    // Используем двойной requestAnimationFrame для гарантии готовности стилей
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          fadeInElements.forEach((element) => {
            element.classList.add('fade-in-visible');
          });
        }, 16); // ~1 frame при 60fps
      });
    });
  }

  /**
   * Инициализирует базовые компоненты страницы
   */
  async initBase() {
    // Гарантируем, что страница загружается с верхней позиции
    this.ensureScrollAtTop();
    
    // Инициализируем глобальные компоненты (если еще не инициализированы)
    await BasePage.initGlobalComponents();

    // Инициализируем навигацию
    if (this.navigationSelector) {
      this.initNavigation(this.navigationSelector);
    }

    // Инициализируем кнопку "Наверх"
    this.initScrollToTop();

    // Инициализируем менеджер скролла для страниц с прокруткой
    this.initScrollManager();
  }

  /**
   * Получает или создает экземпляр LayoutManager
   * @returns {LayoutManager} Экземпляр LayoutManager
   */
  getLayoutManager() {
    if (!this.layoutManager) {
      this.layoutManager = new LayoutManager();
    }
    return this.layoutManager;
  }

  /**
   * Загружает HTML шаблон
   * @param {string} url - URL шаблона
   * @returns {Promise<string>} HTML содержимое шаблона
   */
  async loadHTML(url) {
    const layoutManager = this.getLayoutManager();
    return layoutManager.loadHTML(url);
  }

  /**
   * Инициализирует индикатор загрузки
   * @param {string} loadingId - ID элемента индикатора загрузки
   * @param {string} containerId - ID контейнера для индикатора
   * @returns {LoadingIndicatorService} Экземпляр LoadingIndicatorService
   */
  initLoadingIndicator(loadingId, containerId) {
    this.loadingIndicator = new LoadingIndicatorService(loadingId, containerId);
    this.loadingIndicator.init();
    return this.loadingIndicator;
  }

  /**
   * Унифицированный метод для загрузки JSON данных с обработкой ошибок
   * @param {string} url - URL для загрузки данных
   * @param {Object} options - Опции для загрузки (по умолчанию {})
   * @param {*} defaultValue - Значение по умолчанию при ошибке (по умолчанию null)
   * @returns {Promise<any>} Загруженные данные или defaultValue при ошибке
   */
  async loadPageData(url, options = {}, defaultValue = null) {
    try {
      const data = await loadData(url, options);
      return data;
    } catch (error) {
      console.error(`Ошибка загрузки данных из ${url}:`, error);
      return defaultValue;
    }
  }

  /**
   * Унифицированный метод для загрузки JSON данных с извлечением свойства
   * @param {string} url - URL для загрузки данных
   * @param {string} property - Имя свойства для извлечения (например, 'projects', 'publications')
   * @param {Array} defaultValue - Значение по умолчанию при ошибке (по умолчанию [])
   * @returns {Promise<Array>} Массив данных или defaultValue при ошибке
   */
  async loadPageDataArray(url, property, defaultValue = []) {
    try {
      const data = await loadData(url);
      return data[property] || defaultValue;
    } catch (error) {
      console.error(`Ошибка загрузки данных из ${url}:`, error);
      return defaultValue;
    }
  }

  /**
   * Унифицированный метод для загрузки шаблонов с кешированием
   * @param {string} url - URL шаблона
   * @param {string} selector - CSS селектор для поиска элемента в шаблоне
   * @param {boolean} useCache - Использовать кеш (по умолчанию true)
   * @returns {Promise<HTMLElement|null>} Найденный элемент или null если не найден
   */
  async loadPageTemplate(url, selector, useCache = true) {
    // Проверяем кеш
    if (useCache && templateCache.has(url)) {
      const cachedTemplate = templateCache.get(url);
      // Клонируем шаблон для переиспользования
      return cachedTemplate.cloneNode(true);
    }

    try {
      const template = await loadTemplate(url, selector, (url) =>
        this.loadHTML(url)
      );

      if (template && useCache) {
        // Сохраняем в кеш оригинальный шаблон
        templateCache.set(url, template.cloneNode(true));
      }

      return template;
    } catch (error) {
      console.error(`Ошибка загрузки шаблона ${url}:`, error);
      return null;
    }
  }

  /**
   * Очищает кеш шаблонов (может быть полезно при обновлении данных)
   * @param {string} url - URL шаблона для очистки (опционально, если не указан - очищает весь кеш)
   */
  static clearTemplateCache(url = null) {
    if (url) {
      templateCache.delete(url);
    } else {
      templateCache.clear();
    }
  }

  /**
   * Создает базовую секцию с заголовком
   * @param {Object} config - Конфигурация секции
   * @param {string} config.className - CSS класс секции
   * @param {string} config.title - Текст заголовка
   * @param {string} config.titleClassName - CSS класс заголовка (по умолчанию 'section-title')
   * @param {string} config.titleTag - HTML тег для заголовка (по умолчанию 'h2')
   * @returns {HTMLElement} Созданная секция
   */
  createSectionWithTitle(config) {
    const {
      className,
      title,
      titleClassName = 'section-title',
      titleTag = 'h2',
    } = config;

    const section = document.createElement('div');
    section.className = className;

    if (title) {
      const titleElement = document.createElement(titleTag);
      titleElement.className = titleClassName;
      titleElement.textContent = title;
      section.appendChild(titleElement);
    }

    return section;
  }

  /**
   * Ожидает готовности страницы
   * Использует PageReadyManager для ожидания загрузки изображений и шрифтов
   */
  async waitForPageReady() {
    return PageReadyManager.waitForPageReady(this.imageSelector);
  }

  /**
   * Инициализирует страницу (переопределяется в дочерних классах)
   */
  async init() {
    await this.initBase();
  }
}
