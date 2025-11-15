/**
 * Базовый класс для всех страниц
 */
import { PageReadyManager } from '../utils/PageReady.js';
import { NavigationHelper, MenuButtonScrollHandler } from '../utils/Navigation.js';
import { ScrollToTopButton } from '../components/scroll/ScrollToTopButton.js';
import { SvgLoader } from '../components/svg/SvgLoader.js';
import { LayoutManager } from '../layout/LayoutManager.js';
import { ThemeSwitcher } from '../components/index.js';
import { LanguageSwitcher } from '../components/index.js';
import { CustomCursor } from '../components/index.js';

// Глобальные компоненты инициализируются один раз
let globalComponentsInitialized = false;

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
   * Инициализирует глобальные компоненты (вызывается один раз)
   */
  static async initGlobalComponents() {
    if (globalComponentsInitialized) {
      return;
    }

    // Критические компоненты загружаем сразу
    const layoutManager = new LayoutManager();
    await layoutManager.init();
    
    const svgLoader = new SvgLoader();
    await svgLoader.init();
    
    const themeSwitcher = new ThemeSwitcher();
    themeSwitcher.init();
    
    const languageSwitcher = new LanguageSwitcher();
    languageSwitcher.init();

    const customCursor = new CustomCursor();
    customCursor.init();

    globalComponentsInitialized = true;
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

    // Если есть слайды в tablet-scroll-mode, убеждаемся что они видимы
    if (slidesContainer && slidesContainer.classList.contains('tablet-scroll-mode')) {
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
    // Инициализируем глобальные компоненты (если еще не инициализированы)
    await BasePage.initGlobalComponents();

    // Инициализируем навигацию
    if (this.navigationSelector) {
      this.initNavigation(this.navigationSelector);
    }

    // Инициализируем кнопку "Наверх"
    this.initScrollToTop();

    // Загружаем SVG иконки (уже загружены глобально, но оставляем для совместимости)
    await this.svgLoader.init();
  }

  /**
   * Загружает HTML шаблон
   * @param {string} url - URL шаблона
   * @returns {Promise<string>} HTML содержимое шаблона
   */
  async loadHTML(url) {
    const layoutManager = new LayoutManager();
    return layoutManager.loadHTML(url);
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

