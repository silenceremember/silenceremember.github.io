/**
 * Кастомный курсор
 */
export class CustomCursor {
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
    this.interactiveSelector = 'a, button, .header-language, .header-theme, .social-link, .footer-decorative-square, .header-menu-button, .project-card, .research-card';
  }

  /**
   * Инициализирует кастомный курсор
   */
  init() {
    this.cursor = document.querySelector('.custom-cursor');
    this.isHoverSupported = window.matchMedia('(hover: hover)').matches;

    if (!this.cursor || !this.isHoverSupported) {
      if (this.cursor) this.cursor.style.display = 'none';
      return;
    }

    this.setupTouchHandlers();
    this.restorePosition();
    this.setupMouseHandlers();
    this.setupBeforeUnload();
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
   */
  restorePosition() {
    const lastX = sessionStorage.getItem('cursorX');
    const lastY = sessionStorage.getItem('cursorY');

    if (lastX && lastY) {
      const x = Number(lastX);
      const y = Number(lastY);
      this.targetX = x;
      this.targetY = y;
      this.currentX = x;
      this.currentY = y;
      this.cursor.style.left = `${x}px`;
      this.cursor.style.top = `${y}px`;
      this.cursor.classList.add('visible');
      this.isVisible = true;

      // Проверяем hover состояние для начальной позиции
      setTimeout(() => {
        this.checkHoverState(x, y);
      }, 100);
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
   */
  savePositionToStorage(x, y) {
    this.pendingStorageX = x;
    this.pendingStorageY = y;
    clearTimeout(this.storageDebounceTimer);
    this.storageDebounceTimer = setTimeout(() => {
      if (this.pendingStorageX !== null && this.pendingStorageY !== null) {
        sessionStorage.setItem('cursorX', String(this.pendingStorageX));
        sessionStorage.setItem('cursorY', String(this.pendingStorageY));
        this.pendingStorageX = null;
        this.pendingStorageY = null;
      }
    }, 500);
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
   * Проверяет hover состояние с throttling
   */
  checkHoverState(x, y) {
    const now = performance.now();
    const distanceMoved = Math.abs(x - this.lastHoverCheckX) + Math.abs(y - this.lastHoverCheckY);
    if (now - this.lastHoverCheck < 50 && distanceMoved < 5) {
      return;
    }

    this.lastHoverCheck = now;
    this.lastHoverCheckX = x;
    this.lastHoverCheckY = y;

    const elementUnderCursor = document.elementFromPoint(x, y);

    if (!this.isVisible) {
      this.cursor.classList.add('visible');
      this.isVisible = true;
    }

    const isInteractive = elementUnderCursor && elementUnderCursor.closest(this.interactiveSelector);
    if (isInteractive && !this.isHovering) {
      this.cursor.classList.add('hover');
      this.isHovering = true;
    } else if (!isInteractive && this.isHovering) {
      this.cursor.classList.remove('hover');
      this.isHovering = false;
    }
  }

  /**
   * Настраивает обработчики мыши
   */
  setupMouseHandlers() {
    window.addEventListener('mousemove', (e) => {
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
    }, { passive: true });
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

