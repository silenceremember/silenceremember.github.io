/**
 * Загрузчик SVG иконок для динамической подгрузки векторной графики
 */
export class SvgLoader {
  /**
   * Создает экземпляр загрузчика SVG
   */
  constructor() {
    this.loadedElements = new WeakSet();
  }

  /**
   * Загружает SVG для элемента
   * @param {HTMLElement} element - Элемент с атрибутом data-svg-src
   * @returns {Promise<void>}
   */
  async loadSvg(element) {
    const svgUrl = element.getAttribute('data-svg-src');
    if (!svgUrl) return;

    // Проверяем, что элемент все еще в DOM
    if (!element.parentNode) {
      return;
    }

    // Проверяем, не был ли элемент уже обработан
    if (
      element.hasAttribute('data-svg-loaded') ||
      this.loadedElements.has(element)
    ) {
      return;
    }

    try {
      const response = await fetch(svgUrl);
      if (!response.ok) return;

      const svgText = await response.text();
      const svgNode = new DOMParser().parseFromString(
        svgText,
        'image/svg+xml'
      ).documentElement;

      // Проверяем еще раз, что элемент все еще в DOM перед заменой
      if (!element.parentNode) {
        return;
      }

      // Переносим классы и атрибуты с placeholder'а на SVG-элемент
      const classes = element.getAttribute('class');
      if (classes) {
        svgNode.setAttribute('class', classes);
      }

      // Удаляем width и height для иконок языка, чтобы размеры задавались через CSS
      if (
        element.classList.contains('language-icon-ru') ||
        element.classList.contains('language-icon-en')
      ) {
        svgNode.removeAttribute('width');
        svgNode.removeAttribute('height');
      }

      // Заменяем элемент на SVG
      element.parentNode.replaceChild(svgNode, element);
      // Помечаем SVG как загруженный
      svgNode.setAttribute('data-svg-loaded', 'true');
      this.loadedElements.add(svgNode);
    } catch (error) {
      console.error('Ошибка при загрузке SVG:', error);
    }
  }

  /**
   * Инициализирует загрузку всех SVG элементов на странице батчами
   * @returns {Promise<void>}
   */
  async init() {
    // Находим только элементы, которые еще не были обработаны
    const svgPlaceholders = Array.from(
      document.querySelectorAll('[data-svg-src]:not([data-svg-loaded])')
    ).filter((element) => element.parentNode); // Фильтруем элементы, которые еще в DOM

    if (svgPlaceholders.length === 0) return;

    // Загружаем SVG батчами для оптимизации производительности
    const batchSize = 10;
    for (let i = 0; i < svgPlaceholders.length; i += batchSize) {
      const batch = svgPlaceholders.slice(i, i + batchSize);
      const promises = batch.map((element) => this.loadSvg(element));
      await Promise.allSettled(promises);
      
      // Небольшая задержка между батчами для неблокирующей обработки
      if (i + batchSize < svgPlaceholders.length) {
        await new Promise((resolve) => {
          if (window.requestIdleCallback) {
            requestIdleCallback(() => resolve(), { timeout: 50 });
          } else {
            setTimeout(resolve, 0);
          }
        });
      }
    }
  }
}
