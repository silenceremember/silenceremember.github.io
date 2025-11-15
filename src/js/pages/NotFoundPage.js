/**
 * Страница 404 (Not Found)
 * Отображает сообщение об ошибке и навигационные ссылки
 */
import { BasePage } from './BasePage.js';
import { DOMHelper } from '../utils/DomHelpers.js';
import { animateElementsAppearance } from '../utils/AnimationUtils.js';

export class NotFoundPage extends BasePage {
  /**
   * @param {Object} config - Конфигурация страницы (наследуется от BasePage)
   */
  constructor() {
    super({
      navigationSelector: '',
      imageSelector: '.page-404 img'
    });
    /** @type {HTMLElement|null} Контейнер с контентом страницы 404 */
    this.ctaContent = null;
  }

  /**
   * Получает контейнер с контентом страницы 404
   * @returns {HTMLElement|null} Элемент контейнера или null если не найден
   */
  getCtaContent() {
    if (!this.ctaContent) {
      this.ctaContent = document.querySelector('.cta-slide-content');
    }
    return this.ctaContent;
  }

  /**
   * Получает все элементы страницы 404 для анимации
   * @returns {Array<HTMLElement>} Массив элементов для анимации
   */
  getElementsToAnimate() {
    const ctaContent = this.getCtaContent();
    if (!ctaContent) return [];

    const title404 = ctaContent.querySelector('.main-content-name');
    const subtitle = ctaContent.querySelector('.main-content-title');
    const description = ctaContent.querySelector('.main-content-description');
    const buttons = ctaContent.querySelectorAll('.cta-button');

    return [title404, subtitle, description, ...buttons].filter(Boolean);
  }

  /**
   * Скрывает все элементы страницы 404 для предотвращения мерцания
   * Вызывается сразу при загрузке DOM
   */
  hideAllElementsImmediately() {
    const elementsToHide = this.getElementsToAnimate();
    if (elementsToHide.length > 0) {
      DOMHelper.hideElementsForAnimation(elementsToHide);
    }
  }

  /**
   * Инициализирует анимации появления элементов страницы 404
   * Использует двойной requestAnimationFrame для синхронизации с браузером
   */
  initializeAnimations() {
    const ctaContent = this.getCtaContent();
    if (!ctaContent) return;

    // Скрываем элементы перед анимацией
    this.hideAllElementsImmediately();

    // Принудительный reflow для применения стилей
    if (ctaContent.firstElementChild) {
      DOMHelper.forceReflow(ctaContent.firstElementChild);
    }

    // Используем двойной requestAnimationFrame для синхронизации
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const elementsToAnimate = this.getElementsToAnimate();

        // Дополнительная проверка и скрытие видимых элементов
        elementsToAnimate.forEach(element => {
          if (element && DOMHelper.isElementVisible(element)) {
            DOMHelper.hideElementsForAnimation([element]);
          }
        });

        // Принудительный reflow перед анимацией
        if (ctaContent.firstElementChild) {
          DOMHelper.forceReflow(ctaContent.firstElementChild);
        }

        // Запускаем анимацию с небольшой задержкой для стабильности
        setTimeout(() => {
          if (elementsToAnimate.length > 0) {
            // Принудительный reflow перед анимацией
            DOMHelper.forceReflow(elementsToAnimate[0]);

            // Убеждаемся, что все элементы скрыты перед анимацией
            elementsToAnimate.forEach(element => {
              if (element && DOMHelper.isElementVisible(element)) {
                DOMHelper.hideElementsForAnimation([element]);
              }
            });

            // Запускаем анимацию появления всех элементов одновременно
            animateElementsAppearance(elementsToAnimate, { skipInitialState: false });
          }
        }, 100);
      });
    });
  }

  /**
   * Инициализирует страницу 404
   * Скрывает элементы сразу, затем ждет готовности страницы и запускает анимации
   * @returns {Promise<void>}
   */
  async init() {
    // Скрываем элементы сразу при инициализации
    this.hideAllElementsImmediately();

    // Ждем готовности страницы (загрузка изображений и шрифтов)
    await this.waitForPageReady();

    // Запускаем анимации появления элементов
    this.initializeAnimations();
  }
}

