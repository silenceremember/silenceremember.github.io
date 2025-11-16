/**
 * Утилита для ленивой загрузки изображений через Intersection Observer
 * Оптимизирует загрузку изображений для улучшения производительности
 */

export class LazyImageLoader {
  /**
   * Создает экземпляр загрузчика изображений
   */
  constructor() {
    this.observer = null;
    this.observedImages = new WeakSet();
  }

  /**
   * Инициализирует Intersection Observer если еще не создан
   */
  initObserver() {
    if (this.observer) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const imageUrl = img.dataset.src;
            
            if (imageUrl) {
              // Загружаем изображение
              img.src = imageUrl;
              img.removeAttribute('data-src');
              
              // Убираем наблюдение после загрузки
              this.observer.unobserve(img);
              this.observedImages.delete(img);
            }
          }
        });
      },
      {
        rootMargin: '100px', // Начинаем загрузку за 100px до появления в viewport
        threshold: 0.01,
      }
    );
  }

  /**
   * Загружает изображение лениво
   * @param {HTMLImageElement} img - Элемент изображения с data-src атрибутом
   */
  loadImage(img) {
    if (!img || !img.dataset.src) return;

    // Если изображение уже загружается или загружено
    if (this.observedImages.has(img) || img.src && !img.dataset.src) {
      return;
    }

    // Инициализируем observer
    this.initObserver();

    // Начинаем наблюдение
    this.observer.observe(img);
    this.observedImages.add(img);
  }

  /**
   * Загружает все изображения с data-src на странице
   */
  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => this.loadImage(img));
  }

  /**
   * Отключает observer и очищает ресурсы
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observedImages = new WeakSet();
  }
}

// Создаем глобальный экземпляр для переиспользования
export const lazyImageLoader = new LazyImageLoader();

