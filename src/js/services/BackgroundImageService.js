/**
 * Сервис для ленивой загрузки фоновых изображений через Intersection Observer
 * Оптимизирует загрузку изображений для улучшения производительности
 */
export class BackgroundImageService {
  /**
   * Создает экземпляр сервиса фоновых изображений
   */
  constructor() {
    this.observer = null;
    this.observedElements = new WeakSet();
  }

  /**
   * Инициализирует Intersection Observer если еще не создан
   * Observer отслеживает видимость элементов и загружает изображения при появлении в viewport
   */
  initObserver() {
    if (this.observer) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imageUrl = entry.target.dataset.bgImage;
            if (imageUrl) {
              this.loadBackgroundImage(entry.target, imageUrl);
              // Удаляем data-атрибут после загрузки
              delete entry.target.dataset.bgImage;
            }
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Увеличено для более ранней загрузки
        threshold: 0.01, // Начинаем загрузку при 1% видимости
      }
    );
  }

  /**
   * Загружает background-image для элемента
   * @param {HTMLElement} element - Элемент для установки background-image
   * @param {string} imageUrl - URL изображения
   * @param {boolean} isVisible - Виден ли элемент сразу (если true, загружает немедленно)
   */
  loadBackgroundImage(element, imageUrl, isVisible = false) {
    if (!element || !imageUrl) return;

    // Если элемент виден сразу, загружаем изображение немедленно
    if (isVisible) {
      // Используем Image для предзагрузки перед установкой background-image
      const img = new Image();
      img.loading = 'eager';
      img.fetchPriority = 'high';
      img.onload = () => {
        element.style.backgroundImage = `url(${imageUrl})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
      };
      img.onerror = () => {
        console.warn(`Failed to load background image: ${imageUrl}`);
      };
      img.src = imageUrl;
      return;
    }

    // Используем Intersection Observer для ленивой загрузки
    this.initObserver();

    // Сохраняем URL в data-атрибуте для observer
    element.dataset.bgImage = imageUrl;

    // Наблюдаем за элементом только если еще не наблюдаем
    if (!this.observedElements.has(element)) {
      this.observer.observe(element);
      this.observedElements.add(element);
    }
  }

  /**
   * Отключает наблюдение за элементом
   * @param {HTMLElement} element - Элемент для отключения наблюдения
   */
  unobserve(element) {
    if (this.observer && element) {
      this.observer.unobserve(element);
      this.observedElements.delete(element);
    }
  }

  /**
   * Отключает observer и очищает ресурсы
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observedElements = new WeakSet();
  }
}

// Создаем глобальный экземпляр для переиспользования
export const backgroundImageService = new BackgroundImageService();
