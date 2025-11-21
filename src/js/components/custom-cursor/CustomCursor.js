/**
 * Кастомный курсор для интерактивного взаимодействия с элементами страницы
 */
export class CustomCursor {
  /**
   * Создает экземпляр кастомного курсора
   */
  constructor() {
    this.cursor = null;
    this.isHoverSupported = false;
    this.isTouching = false;
    this.touchTimeout = null;
    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.rafId = null;
    this.lastHoverCheck = 0;
    this.lastHoverCheckX = 0;
    this.lastHoverCheckY = 0;
    this.isHovering = false;
    this.isVisible = false;
    this.storageDebounceTimer = null;
    this.pendingStorageX = null;
    this.pendingStorageY = null;
    this.interactiveSelector =
      'a, button, .header-language, .header-theme, .social-link, .footer-decorative-square, .header-menu-button, .project-card, .research-card, .community-card';
    this.isInitialized = false;
    // Кэш для оптимизации проверки hover
    this.cachedInteractiveElement = null;
    this.hoverCheckThrottle = 100; // Увеличен с 16-50ms до 100ms для лучшей производительности
  }

  /**
   * Инициализирует кастомный курсор
   * Оптимизировано для быстрой загрузки при переходе на другую страницу
   */
  init() {
    // Предотвращаем повторную инициализацию
    if (this.isInitialized) {
      return;
    }

    // Пытаемся найти курсор сразу
    this.cursor = document.querySelector('.custom-cursor');
    this.isHoverSupported = window.matchMedia('(hover: hover)').matches;

    if (!this.cursor || !this.isHoverSupported) {
      if (this.cursor) this.cursor.style.display = 'none';
      return;
    }

    // Восстанавливаем позицию сразу (синхронно) для мгновенного отображения
    this.restorePosition();

    // Настраиваем обработчики
    this.setupTouchHandlers();
    this.setupMouseHandlers();
    this.setupBeforeUnload();

    this.isInitialized = true;
  }

  /**
   * Быстрая инициализация - только восстановление позиции
   * Используется для мгновенного отображения курсора при переходе на страницу
   */
  quickInit() {
    if (this.isInitialized) {
      return;
    }

    // Пытаемся найти курсор
    this.cursor = document.querySelector('.custom-cursor');
    this.isHoverSupported = window.matchMedia('(hover: hover)').matches;

    if (!this.cursor || !this.isHoverSupported) {
      if (this.cursor) this.cursor.style.display = 'none';
      return;
    }

    // Только восстановление позиции для мгновенного отображения
    this.restorePosition();
  }

  /**
   * Настраивает обработчики касаний
   */
  setupTouchHandlers() {
    window.addEventListener(
      'touchstart',
      () => {
        this.isTouching = true;
        this.cursor.classList.remove('visible');
        this.isVisible = false;
        clearTimeout(this.touchTimeout);
        this.touchTimeout = setTimeout(() => {
          this.isTouching = false;
        }, 500);
      },
      { passive: true }
    );
  }

  /**
   * Восстанавливает позицию курсора из sessionStorage
   * Оптимизировано для мгновенного отображения
   */
  restorePosition() {
    try {
    const lastX = sessionStorage.getItem('cursorX');
    const lastY = sessionStorage.getItem('cursorY');

    if (lastX && lastY) {
      const x = Number(lastX);
      const y = Number(lastY);
        
        // Проверяем валидность координат
        if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
          return;
        }

      this.targetX = x;
      this.targetY = y;
      this.currentX = x;
      this.currentY = y;
        
        // Устанавливаем позицию сразу для мгновенного отображения
      this.cursor.style.left = `${x}px`;
      this.cursor.style.top = `${y}px`;
      this.cursor.classList.add('visible');
      this.isVisible = true;

        // Проверяем hover состояние для начальной позиции с минимальной задержкой
        // Используем requestAnimationFrame вместо setTimeout для лучшей производительности
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
        this.checkHoverState(x, y);
          });
        });
      }
    } catch (error) {
      // Игнорируем ошибки доступа к sessionStorage (например, в приватном режиме)
      console.warn('Failed to restore cursor position:', error);
    }
  }

  /**
   * Обновляет позицию курсора через RAF
   */
  updateCursorPosition() {
    this.currentX = this.targetX;
    this.currentY = this.targetY;
    this.cursor.style.left = `${this.currentX}px`;
    this.cursor.style.top = `${this.currentY}px`;
    this.rafId = null;
  }

  /**
   * Сохраняет позицию в sessionStorage с debounce
   * Оптимизировано: увеличен debounce до 1000ms для снижения нагрузки
   * @param {number} x - Координата X курсора
   * @param {number} y - Координата Y курсора
   */
  savePositionToStorage(x, y) {
    this.pendingStorageX = x;
    this.pendingStorageY = y;
    clearTimeout(this.storageDebounceTimer);
    this.storageDebounceTimer = setTimeout(() => {
      if (this.pendingStorageX !== null && this.pendingStorageY !== null) {
        try {
          sessionStorage.setItem('cursorX', String(this.pendingStorageX));
          sessionStorage.setItem('cursorY', String(this.pendingStorageY));
        } catch (error) {
          // Игнорируем ошибки sessionStorage
        }
        this.pendingStorageX = null;
        this.pendingStorageY = null;
      }
    }, 1000); // Увеличено с 500ms до 1000ms
  }

  /**
   * Скрывает курсор
   */
  hideCursor() {
    if (this.isVisible) {
      this.cursor.classList.remove('visible');
      this.isVisible = false;
    }
    if (this.isHovering) {
      this.cursor.classList.remove('hover');
      this.isHovering = false;
    }
  }

  /**
   * Показывает курсор
   */
  showCursor() {
    if (!this.isVisible && !this.isTouching) {
      this.cursor.classList.add('visible');
      this.isVisible = true;
    }
  }

  /**
   * Проверяет hover состояние с оптимизированным throttling
   * Оптимизировано: увеличен throttling интервал и добавлено кэширование
   * @param {number} x - Координата X курсора
   * @param {number} y - Координата Y курсора
   */
  checkHoverState(x, y) {
    const now = performance.now();
    const distanceMoved =
      Math.abs(x - this.lastHoverCheckX) + Math.abs(y - this.lastHoverCheckY);
    
    // Оптимизированный throttling: увеличен интервал для снижения CPU usage
    // Проверяем только при значительном перемещении курсора
    if (now - this.lastHoverCheck < this.hoverCheckThrottle && distanceMoved < 10) {
      return;
    }

    this.lastHoverCheck = now;
    this.lastHoverCheckX = x;
    this.lastHoverCheckY = y;

    // Используем elementFromPoint только если курсор видим
    if (!this.isVisible) {
      this.cursor.classList.add('visible');
      this.isVisible = true;
    }

    // Оптимизация: проверяем hover только если курсор видим
    try {
      const elementUnderCursor = document.elementFromPoint(x, y);
      
      // Используем кэш: если элемент не изменился, пропускаем проверку
      if (elementUnderCursor === this.cachedInteractiveElement) {
        return;
      }
      
      this.cachedInteractiveElement = elementUnderCursor;
      
      const isInteractive =
        elementUnderCursor &&
        elementUnderCursor.closest(this.interactiveSelector);
      
      if (isInteractive && !this.isHovering) {
        this.cursor.classList.add('hover');
        this.isHovering = true;
      } else if (!isInteractive && this.isHovering) {
        this.cursor.classList.remove('hover');
        this.isHovering = false;
      }
    } catch (error) {
      // Игнорируем ошибки elementFromPoint (может быть вне viewport)
    }
  }

  /**
   * Настраивает обработчики мыши
   */
  setupMouseHandlers() {
    window.addEventListener(
      'mousemove',
      (e) => {
        if (this.isTouching) {
          return;
        }

        const x = e.clientX;
        const y = e.clientY;

        this.targetX = x;
        this.targetY = y;

        if (!this.isVisible) {
          this.cursor.classList.add('visible');
          this.isVisible = true;
        }

        if (!this.rafId) {
          this.rafId = requestAnimationFrame(() => this.updateCursorPosition());
        }

        this.checkHoverState(x, y);
        this.savePositionToStorage(x, y);
      },
      { passive: true }
    );
  }

  /**
   * Настраивает сохранение позиции при выгрузке страницы
   */
  setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (this.pendingStorageX !== null && this.pendingStorageY !== null) {
        sessionStorage.setItem('cursorX', String(this.pendingStorageX));
        sessionStorage.setItem('cursorY', String(this.pendingStorageY));
      } else if (this.targetX !== 0 || this.targetY !== 0) {
        sessionStorage.setItem('cursorX', String(this.targetX));
        sessionStorage.setItem('cursorY', String(this.targetY));
      }
    });
  }
}
