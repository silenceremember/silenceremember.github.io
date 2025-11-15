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
   * Инициализирует базовые компоненты страницы
   */
  async initBase() {
    // Инициализируем навигацию
    if (this.navigationSelector) {
      NavigationHelper.setActiveNavigationLink(this.navigationSelector);
      
      // Инициализируем обработчик прокрутки к навигации
      this.menuButtonScrollHandler = new MenuButtonScrollHandler(this.navigationSelector);
      this.menuButtonScrollHandler.init();
    }

    // Инициализируем кнопку "Наверх"
    this.scrollToTopButton = new ScrollToTopButton();
    this.scrollToTopButton.init();

    // Загружаем SVG иконки
    await this.svgLoader.init();
  }

  /**
   * Ожидает готовности страницы
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

