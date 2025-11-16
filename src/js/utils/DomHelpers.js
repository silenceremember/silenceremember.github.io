/**
 * Хелпер для работы с DOM элементами
 * Предоставляет утилиты для управления видимостью и анимациями элементов
 */
export class DOMHelper {
  /**
   * Скрывает элементы с установкой начального состояния для анимации
   * @param {NodeList|Array<HTMLElement>} elements - Элементы для скрытия
   * @param {Object} options - Опции скрытия
   * @param {string} options.opacity - Начальная прозрачность (по умолчанию '0')
   * @param {string} options.transform - Начальное преобразование (по умолчанию 'translateY(10px)')
   * @param {boolean} options.important - Использовать !important (по умолчанию true)
   */
  static hideElementsForAnimation(elements, options = {}) {
    const config = {
      opacity: options.opacity || '0',
      transform: options.transform || 'translateY(10px)',
      important: options.important !== false,
    };

    const elementsArray = Array.isArray(elements)
      ? elements
      : Array.from(elements);

    elementsArray.forEach((element) => {
      if (element) {
        if (config.important) {
          element.style.setProperty('opacity', config.opacity, 'important');
          element.style.setProperty('transform', config.transform, 'important');
          element.style.setProperty('transition', 'none', 'important');
        } else {
          element.style.opacity = config.opacity;
          element.style.transform = config.transform;
          element.style.transition = 'none';
        }
      }
    });
  }

  /**
   * Проверяет, видим ли элемент
   * @param {HTMLElement} element - Элемент для проверки
   * @returns {boolean} true если элемент видим
   */
  static isElementVisible(element) {
    if (!element) return false;

    const computedStyle = window.getComputedStyle(element);
    const opacity = parseFloat(computedStyle.opacity);
    const visibility = computedStyle.visibility;
    const display = computedStyle.display;

    return opacity > 0.01 && visibility !== 'hidden' && display !== 'none';
  }

  /**
   * Принудительно вызывает reflow для применения стилей
   * @param {HTMLElement} element - Элемент для reflow
   */
  static forceReflow(element) {
    if (element) {
      void element.offsetHeight;
    }
  }

  /**
   * Убирает inline стили анимации с элементов
   * @param {NodeList|Array<HTMLElement>} elements - Элементы для очистки
   */
  static clearAnimationStyles(elements) {
    const elementsArray = Array.isArray(elements)
      ? elements
      : Array.from(elements);

    elementsArray.forEach((element) => {
      if (element) {
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
        element.style.removeProperty('transition');
      }
    });
  }
}
