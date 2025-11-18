/**
 * Страница 404 (Not Found)
 * Отображает сообщение об ошибке и навигационные ссылки
 */
import { BasePage } from './BasePage.js';
import { DOMHelper } from '../utils/DomHelpers.js';
import { animateElementsAppearance } from '../utils/AnimationUtils.js';
import { localization } from '../utils/Localization.js';

export class NotFoundPage extends BasePage {
  /**
   * @param {Object} config - Конфигурация страницы (наследуется от BasePage)
   */
  constructor() {
    super({
      navigationSelector: '',
      imageSelector: '.page-404 img',
    });
    /** @type {HTMLElement|null} Контейнер с контентом страницы 404 */
    this.ctaContent = null;
    /** @type {Function|null} Обработчик изменения языка */
    this.languageChangeHandler = null;
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
        elementsToAnimate.forEach((element) => {
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
            elementsToAnimate.forEach((element) => {
              if (element && DOMHelper.isElementVisible(element)) {
                DOMHelper.hideElementsForAnimation([element]);
              }
            });

            // Запускаем анимацию появления всех элементов одновременно
            animateElementsAppearance(elementsToAnimate, {
              skipInitialState: false,
            });
          }
        }, 100);
      });
    });
  }

  /**
   * Обновляет язык контента страницы 404
   */
  updateContentLanguage() {
    // Явно обновляем элементы с data-i18n атрибутами
    // Это гарантирует, что элементы обновятся даже если они были скрыты
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`Found ${elements.length} elements with data-i18n`);
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const text = localization.t(key);
        console.log(`Key: ${key}, Translation: ${text}, Current text: ${element.textContent}`);
        
        // Обновляем текст только если перевод найден и отличается от ключа
        if (text && text !== key) {
          element.textContent = text;
          console.log(`Updated element with key ${key} to "${text}"`);
        } else if (text === key) {
          // Если перевод не найден, оставляем fallback текст из HTML
          console.warn(`Translation not found for key: ${key}, keeping fallback text`);
        }
      }
    });
  }

  /**
   * Обработчик изменения языка
   */
  languageChangeHandler = () => {
    this.updateContentLanguage();
  };

  /**
   * Инициализирует страницу 404
   * Скрывает элементы сразу, затем ждет готовности страницы и запускает анимации
   * @returns {Promise<void>}
   */
  async init() {
    // Инициализируем базовые компоненты (header, footer, навигация и т.д.)
    await this.initBase();

    // Подписываемся на событие изменения языка
    window.addEventListener('languageChanged', this.languageChangeHandler);

    // Небольшая задержка для гарантии загрузки локализации
    // Обновляем контент сразу после загрузки для правильной локализации
    // Это гарантирует, что элементы будут переведены до того, как они будут скрыты
    // Используем несколько requestAnimationFrame для гарантии готовности DOM
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Проверяем, что переводы загружены
          // Проверяем несколько раз с небольшими задержками
          let attempts = 0;
          const maxAttempts = 10;
          const checkTranslations = () => {
            const testTranslation = localization.t('404.heading');
            if (testTranslation && testTranslation !== '404.heading') {
              // Переводы загружены, обновляем контент
              this.updateContentLanguage();
              resolve();
            } else if (attempts < maxAttempts) {
              // Переводы еще не загружены, ждем еще немного
              attempts++;
              setTimeout(checkTranslations, 50);
            } else {
              // Превышено количество попыток, все равно обновляем
              console.warn('Translations may not be loaded, updating anyway');
              this.updateContentLanguage();
              resolve();
            }
          };
          checkTranslations();
        });
      });
    });

    // Инициализируем сервис индикатора загрузки
    this.initLoadingIndicator('notfound-loading', 'notfound-loading-container');
    this.loadingIndicator.show();

    // Скрываем элементы сразу при инициализации
    this.hideAllElementsImmediately();

    // Скрываем индикатор загрузки и ждем завершения fadeout
    await this.loadingIndicator.hide();

    // Ждем готовности страницы (загрузка изображений и шрифтов)
    await this.waitForPageReady();

    // Повторно обновляем контент после загрузки страницы на случай, если локализация загрузилась позже
    // Используем небольшую задержку для гарантии, что все элементы в DOM
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.updateContentLanguage();
          resolve();
        });
      });
    });

    // Запускаем анимации появления элементов
    this.initializeAnimations();
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    if (this.languageChangeHandler) {
      window.removeEventListener('languageChanged', this.languageChangeHandler);
    }
  }
}
