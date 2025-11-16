/**
 * Базовый класс для менеджеров анимаций
 * Содержит общую логику для всех менеджеров анимаций страниц
 */

import { ANIMATION_CONFIG } from '../utils/AnimationUtils.js';

/**
 * Базовый класс для управления анимациями страниц
 */
export class BaseAnimationManager {
  /**
   * Создает экземпляр базового менеджера анимаций
   * @param {Object} config - Конфигурация менеджера
   * @param {string} config.sectionSelector - Селектор для секций страницы
   * @param {string} config.elementsSelector - Селектор для элементов внутри секций
   */
  constructor(config) {
    this.sectionSelector = config.sectionSelector;
    this.elementsSelector = config.elementsSelector;
    this.animationDelay = config.animationDelay || 100; // Задержка перед запуском анимации
  }

  /**
   * Скрывает все элементы секций сразу с !important для предотвращения FOUC
   * @param {Function} customHideLogic - Дополнительная логика скрытия элементов (опционально)
   */
  hideAllElementsImmediately(customHideLogic = null) {
    const allSections = document.querySelectorAll(this.sectionSelector);
    allSections.forEach((section) => {
      if (section) {
        // Скрываем саму секцию
        section.style.setProperty('opacity', '0', 'important');
        section.style.setProperty(
          'transform',
          `translateY(${ANIMATION_CONFIG.translateYAppear})`,
          'important'
        );
        section.style.setProperty('transition', 'none', 'important');

        // Скрываем все элементы внутри секции
        const elementsToHide = section.querySelectorAll(this.elementsSelector);

        elementsToHide.forEach((element) => {
          if (element) {
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty(
              'transform',
              `translateY(${ANIMATION_CONFIG.translateYAppear})`,
              'important'
            );
            element.style.setProperty('transition', 'none', 'important');
          }
        });

        // Выполняем дополнительную логику скрытия, если она предоставлена
        if (customHideLogic && typeof customHideLogic === 'function') {
          customHideLogic(section);
        }
      }
    });
  }

  /**
   * Проверяет и при необходимости снова скрывает элементы
   * Используется при повторном посещении страницы
   */
  recheckAndHideElements() {
    const allSections = document.querySelectorAll(this.sectionSelector);
    allSections.forEach((section) => {
      if (section) {
        const computedStyle = window.getComputedStyle(section);
        const opacity = parseFloat(computedStyle.opacity);
        // Если секция видима, снова скрываем её
        if (opacity > 0.01) {
          section.style.setProperty('opacity', '0', 'important');
          section.style.setProperty(
            'transform',
            `translateY(${ANIMATION_CONFIG.translateYAppear})`,
            'important'
          );
          section.style.setProperty('transition', 'none', 'important');
        }

        // Проверяем и скрываем элементы внутри секции
        const elementsToCheck = section.querySelectorAll(this.elementsSelector);

        elementsToCheck.forEach((element) => {
          if (element) {
            const elementComputedStyle = window.getComputedStyle(element);
            const elementOpacity = parseFloat(elementComputedStyle.opacity);
            // Если элемент видим, снова скрываем его
            if (elementOpacity > 0.01) {
              element.style.setProperty('opacity', '0', 'important');
              element.style.setProperty(
                'transform',
                `translateY(${ANIMATION_CONFIG.translateYAppear})`,
                'important'
              );
              element.style.setProperty('transition', 'none', 'important');
            }
          }
        });
      }
    });
  }

  /**
   * Принудительный reflow для применения стилей
   * @param {HTMLElement} element - Элемент для проверки reflow
   */
  forceReflow(element = null) {
    if (element && element.firstElementChild) {
      void element.firstElementChild.offsetHeight;
    } else {
      const firstSection = document.querySelector(this.sectionSelector);
      if (firstSection && firstSection.firstElementChild) {
        void firstSection.firstElementChild.offsetHeight;
      }
    }
  }

  /**
   * Базовый метод инициализации анимаций
   * Должен быть переопределен в дочерних классах
   * @abstract
   */
  initializeAnimations() {
    throw new Error(
      'initializeAnimations() must be implemented in child class'
    );
  }
}

