/**
 * Базовый класс для всех страниц
 */
import { PageReadyManager } from '../utils/page-ready.js';
import { NavigationHelper, MenuButtonScrollHandler } from '../utils/navigation.js';
import { ScrollToTopButton } from '../components/scroll/ScrollToTopButton.js';
import { SvgLoader } from '../components/svg/SvgLoader.js';

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
    this.svgLoader = new SvgLoader();
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
    this.menuButtonScrollHandler = new MenuButtonScrollHandler(navigationSelector);
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
   * Инициализирует базовые компоненты страницы
   */
  async initBase() {
    // Инициализируем навигацию
    if (this.navigationSelector) {
      this.initNavigation(this.navigationSelector);
    }

    // Инициализируем кнопку "Наверх"
    this.initScrollToTop();

    // Загружаем SVG иконки
    await this.svgLoader.init();
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

