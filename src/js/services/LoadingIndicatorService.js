/**
 * Сервис для управления индикаторами загрузки с анимацией
 */
import { ANIMATION_CONFIG } from '../utils/AnimationUtils.js';

export class LoadingIndicatorService {
  /**
   * @param {string} loadingId - ID элемента индикатора загрузки
   * @param {string} containerId - ID контейнера для индикатора
   */
  constructor(loadingId, containerId) {
    this.loadingId = loadingId;
    this.containerId = containerId;
    this.loadingElement = null;
    this.container = null;
  }

  /**
   * Инициализирует сервис
   */
  init() {
    this.loadingElement = document.getElementById(this.loadingId);
    this.container = document.getElementById(this.containerId);
  }

  /**
   * Скрывает индикатор загрузки с плавной анимацией
   * @returns {Promise<void>}
   */
  hide() {
    return new Promise((resolve) => {
      if (!this.loadingElement) {
        this.init();
      }

      if (!this.loadingElement) {
        resolve();
        return;
      }
      
      // Проверяем, виден ли индикатор загрузки
      const computedStyle = window.getComputedStyle(this.loadingElement);
      const isVisible = computedStyle.display !== 'none' && 
                       computedStyle.visibility !== 'hidden' &&
                       parseFloat(computedStyle.opacity) > 0.01;
      
      // Если индикатор уже скрыт, сразу разрешаем промис
      if (!isVisible) {
        // Убеждаемся, что элемент удален
        if (this.loadingElement.parentNode) {
          this.loadingElement.remove();
        }
        // Восстанавливаем видимость container, если нужно
        if (this.container) {
          this.container.style.visibility = '';
          this.container.style.opacity = '';
        }
        resolve();
        return;
      }
      
      const shouldHideContent = this.container && this.container.contains(this.loadingElement);
      
      // Убеждаемся, что loading элемент имеет transition для анимации
      this.loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
      
      // Убеждаемся, что начальное состояние видимо
      this.loadingElement.style.opacity = '1';
      this.loadingElement.style.transform = 'translateY(0)';
      
      // Используем requestAnimationFrame для гарантии применения начального состояния
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Теперь применяем скрытие с анимацией
          this.loadingElement.style.opacity = '0';
          this.loadingElement.style.transform = 'translateY(-10px)';
        });
      });
      
      // Ждем завершения fadeout анимации loading элемента
      setTimeout(() => {
        // Теперь скрываем container (если нужно) и удаляем loading элемент
        if (shouldHideContent && this.container) {
          this.container.style.opacity = '0';
          this.container.style.visibility = 'hidden';
        }
        
        if (this.loadingElement.parentNode) {
          this.loadingElement.remove();
        }
        
        // Восстанавливаем видимость container, но не показываем его с анимацией здесь
        if (shouldHideContent && this.container) {
          this.container.style.visibility = '';
          this.container.style.opacity = '0';
        }
        
        resolve();
      }, 300);
    });
  }

  /**
   * Показывает индикатор загрузки с анимацией
   */
  show() {
    if (!this.container) {
      this.init();
    }

    if (!this.container) return;
    
    // Проверяем, есть ли уже индикатор загрузки
    let loadingElement = document.getElementById(this.loadingId);
    
    // Проверяем, есть ли контент в container
    const hasContent = this.container.children.length > 0 && 
      (!loadingElement || this.container.children.length > 1 || !this.container.contains(loadingElement));
    
    if (hasContent) {
      // Если есть контент, плавно скрываем его перед показом loading
      this.container.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateY(0)';
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.container.style.opacity = '0';
          this.container.style.transform = 'translateY(-10px)';
        });
      });
      
      setTimeout(() => {
        this.createAndShowLoading();
      }, 300);
    } else {
      // Если контента нет, просто показываем loading с анимацией
      this.createAndShowLoading();
    }
  }

  /**
   * Создает и показывает индикатор загрузки
   */
  createAndShowLoading() {
    let loadingElement = document.getElementById(this.loadingId);
    
    // Если индикатор уже есть в контейнере, не очищаем контейнер
    const loadingExistsInContainer = loadingElement && this.container && this.container.contains(loadingElement);
    
    if (!loadingElement) {
      loadingElement = document.createElement('div');
      loadingElement.className = 'loading';
      loadingElement.id = this.loadingId;
      loadingElement.innerHTML = `
        <div class="loading-squares">
          <div class="loading-square"></div>
          <div class="loading-square"></div>
          <div class="loading-square"></div>
        </div>
      `;
    }
    
    if (this.container) {
      // Очищаем контейнер только если индикатор еще не находится в нем
      if (!loadingExistsInContainer) {
        this.container.innerHTML = '';
        this.container.appendChild(loadingElement);
      }
      this.container.style.opacity = '0';
      this.container.style.transform = '';
      this.container.style.visibility = 'visible';
    }
    
    // Убираем класс hidden если он есть
    loadingElement.classList.remove('hidden');
    loadingElement.style.display = '';
    
    // Показываем loading с анимацией
    loadingElement.style.opacity = '0';
    loadingElement.style.transform = 'translateY(10px)';
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        loadingElement.style.opacity = '1';
        loadingElement.style.transform = 'translateY(0)';
        
        // Показываем container с анимацией
        if (this.container) {
          this.container.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
          this.container.style.opacity = '1';
          this.container.style.transform = 'translateY(0)';
          setTimeout(() => {
            this.container.style.opacity = '';
            this.container.style.transform = '';
            this.container.style.transition = '';
          }, 300);
        }
      });
    });
    
    this.loadingElement = loadingElement;
  }
}

