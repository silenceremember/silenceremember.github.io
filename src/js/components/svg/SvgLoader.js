/**
 * Загрузчик SVG иконок
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
   */
  async loadSvg(element) {
    const svgUrl = element.getAttribute('data-svg-src');
    if (!svgUrl) return;

    // Проверяем, что элемент все еще в DOM
    if (!element.parentNode) {
      return;
    }

    // Проверяем, не был ли элемент уже обработан
    if (element.hasAttribute('data-svg-loaded') || this.loadedElements.has(element)) {
      return;
    }

    try {
      const response = await fetch(svgUrl);
      if (!response.ok) return;

      const svgText = await response.text();
      const svgNode = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
      
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
      if (element.classList.contains('language-icon-ru') || element.classList.contains('language-icon-en')) {
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
   * Инициализирует загрузку всех SVG
   */
  async init() {
    // Находим только элементы, которые еще не были обработаны
    const svgPlaceholders = document.querySelectorAll('[data-svg-src]:not([data-svg-loaded])');
    if (svgPlaceholders.length === 0) return;
    
    const promises = Array.from(svgPlaceholders)
      .filter(element => element.parentNode) // Фильтруем элементы, которые еще в DOM
      .map(element => this.loadSvg(element));
    
    await Promise.allSettled(promises);
  }
}

