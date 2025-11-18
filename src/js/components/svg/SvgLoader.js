/**
 * Загрузчик SVG иконок для динамической подгрузки векторной графики
 * Оптимизирован с кешированием и дедупликацией запросов
 */
export class SvgLoader {
  /**
   * Создает экземпляр загрузчика SVG
   */
  constructor() {
    this.loadedElements = new WeakSet();
    // Кеш для загруженных SVG (URL -> SVG текст)
    this.svgCache = new Map();
    // Активные запросы для дедупликации (URL -> Promise)
    this.pendingRequests = new Map();
  }

  /**
   * Загружает SVG из URL с кешированием и дедупликацией
   * @param {string} svgUrl - URL SVG файла
   * @returns {Promise<string>} SVG текст
   */
  async fetchSvg(svgUrl) {
    // Нормализуем URL (сохраняем как есть, но убираем дублирующие слеши)
    const normalizedUrl = svgUrl.replace(/^\/+/, '/');

    // Проверяем кеш
    if (this.svgCache.has(normalizedUrl)) {
      return this.svgCache.get(normalizedUrl);
    }

    // Проверяем активные запросы (дедупликация)
    if (this.pendingRequests.has(normalizedUrl)) {
      return this.pendingRequests.get(normalizedUrl);
    }

    // Создаем новый запрос
    const fetchPromise = fetch(normalizedUrl, {
      cache: 'default',
      headers: {
        'Cache-Control': 'max-age=3600', // 1 час
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.status}`);
        }
        const svgText = await response.text();
        // Сохраняем в кеш
        this.svgCache.set(normalizedUrl, svgText);
        return svgText;
      })
      .catch((error) => {
        console.error(`Ошибка при загрузке SVG из ${normalizedUrl}:`, error);
        throw error;
      })
      .finally(() => {
        // Удаляем из активных запросов
        this.pendingRequests.delete(normalizedUrl);
      });

    // Сохраняем промис для дедупликации
    this.pendingRequests.set(normalizedUrl, fetchPromise);

    return fetchPromise;
  }

  /**
   * Создает SVG элемент из текста
   * @param {string} svgText - SVG текст
   * @param {HTMLElement} originalElement - Оригинальный элемент для копирования атрибутов
   * @returns {SVGElement} SVG элемент
   */
  createSvgElement(svgText, originalElement) {
    const svgNode = new DOMParser().parseFromString(
      svgText,
      'image/svg+xml'
    ).documentElement;

    // Переносим классы и атрибуты с placeholder'а на SVG-элемент
    const classes = originalElement.getAttribute('class');
    if (classes) {
      svgNode.setAttribute('class', classes);
    }

    // Удаляем width и height для иконок языка, чтобы размеры задавались через CSS
    if (
      originalElement.classList.contains('language-icon-ru') ||
      originalElement.classList.contains('language-icon-en')
    ) {
      svgNode.removeAttribute('width');
      svgNode.removeAttribute('height');
    }

    return svgNode;
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
      // Загружаем SVG с кешированием
      const svgText = await this.fetchSvg(svgUrl);

      // Проверяем еще раз, что элемент все еще в DOM перед заменой
      if (!element.parentNode) {
        return;
      }

      // Создаем SVG элемент
      const svgNode = this.createSvgElement(svgText, element);

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
   * Оптимизировано: сначала собираем уникальные URL, затем загружаем их параллельно
   * @returns {Promise<void>}
   */
  async init() {
    // Находим только элементы, которые еще не были обработаны
    const svgPlaceholders = Array.from(
      document.querySelectorAll('[data-svg-src]:not([data-svg-loaded])')
    ).filter((element) => element.parentNode); // Фильтруем элементы, которые еще в DOM

    if (svgPlaceholders.length === 0) return;

    // Группируем элементы по URL для оптимизации загрузки
    const urlToElements = new Map();
    svgPlaceholders.forEach((element) => {
      const url = element.getAttribute('data-svg-src');
      if (!url) return;
      // Нормализуем URL (сохраняем как есть, но убираем дублирующие слеши)
      const normalizedUrl = url.replace(/^\/+/, '/');
      if (!urlToElements.has(normalizedUrl)) {
        urlToElements.set(normalizedUrl, []);
      }
      urlToElements.get(normalizedUrl).push(element);
    });

    // Загружаем уникальные SVG параллельно
    const uniqueUrls = Array.from(urlToElements.keys());
    const loadPromises = uniqueUrls.map((url) => this.fetchSvg(url));
    
    // Ждем загрузки всех уникальных SVG
    await Promise.allSettled(loadPromises);

    // Теперь применяем загруженные SVG к элементам батчами
    const batchSize = 20; // Увеличиваем размер батча, так как SVG уже в кеше
    for (let i = 0; i < svgPlaceholders.length; i += batchSize) {
      const batch = svgPlaceholders.slice(i, i + batchSize);
      // Загружаем SVG для батча (теперь это быстро, так как они в кеше)
      const promises = batch.map((element) => this.loadSvg(element));
      await Promise.allSettled(promises);
      
      // Небольшая задержка между батчами для неблокирующей обработки
      if (i + batchSize < svgPlaceholders.length) {
        await new Promise((resolve) => {
          if (window.requestIdleCallback) {
            requestIdleCallback(() => resolve(), { timeout: 16 });
          } else {
            setTimeout(resolve, 0);
          }
        });
      }
    }
  }
}

// Создаем глобальный экземпляр для переиспользования
// Это позволяет использовать единый кеш для всех SVG на странице
export const globalSvgLoader = new SvgLoader();
