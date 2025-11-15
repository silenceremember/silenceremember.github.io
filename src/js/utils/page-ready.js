/**
 * Менеджер ожидания готовности страницы
 * Управляет ожиданием загрузки шрифтов, изображений и полной готовности страницы
 */
export class PageReadyManager {
  /**
   * Ожидает загрузки всех шрифтов
   * @returns {Promise<void>}
   */
  static waitForFontsLoaded() {
    return new Promise((resolve) => {
      // Проверяем поддержку Font Loading API
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          // Небольшая задержка для гарантии применения шрифтов
          setTimeout(resolve, 50);
        }).catch(() => {
          // В случае ошибки просто продолжаем
          resolve();
        });
      } else {
        // Если API не поддерживается, просто продолжаем
        // Используем небольшую задержку для гарантии загрузки шрифтов
        setTimeout(resolve, 200);
      }
    });
  }

  /**
   * Ожидает загрузки всех изображений в указанном контейнере
   * @param {string} selector - Селектор для поиска изображений
   * @returns {Promise<void>}
   */
  static waitForImagesLoaded(selector = 'img') {
    return new Promise((resolve) => {
      // Находим все изображения
      const images = document.querySelectorAll(selector);
      
      if (images.length === 0) {
        resolve();
        return;
      }

      let loadedCount = 0;
      const totalImages = images.length;
      let resolved = false;

      // Функция для проверки завершения загрузки
      const checkComplete = () => {
        loadedCount++;
        if (loadedCount >= totalImages && !resolved) {
          resolved = true;
          // Небольшая дополнительная задержка для гарантии применения стилей
          setTimeout(resolve, 100);
        }
      };

      // Проверяем каждое изображение
      images.forEach((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          // Изображение уже загружено
          checkComplete();
        } else {
          // Ждем загрузки изображения
          img.addEventListener('load', checkComplete, { once: true });
          img.addEventListener('error', checkComplete, { once: true }); // Ошибка тоже считается завершением
        }
      });

      // Таймаут на случай, если изображения не загрузятся
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, 3000); // Максимум 3 секунды ожидания
    });
  }

  /**
   * Ожидает полной готовности страницы, включая загрузку всех изображений и шрифтов
   * @param {string} imageSelector - Селектор для поиска изображений (по умолчанию 'img')
   * @returns {Promise<void>}
   */
  static waitForPageReady(imageSelector = 'img') {
    return new Promise((resolve) => {
      // Если страница уже полностью загружена
      if (document.readyState === 'complete') {
        // Дополнительно проверяем загрузку всех критичных ресурсов
        Promise.all([
          this.waitForImagesLoaded(imageSelector),
          this.waitForFontsLoaded()
        ]).then(() => resolve());
      } else {
        // Ждем события load
        window.addEventListener('load', () => {
          // После load проверяем загрузку всех критичных ресурсов
          Promise.all([
            this.waitForImagesLoaded(imageSelector),
            this.waitForFontsLoaded()
          ]).then(() => resolve());
        }, { once: true });
      }
    });
  }
}

