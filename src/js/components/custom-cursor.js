const initCustomCursor = () => {
  const cursor = document.querySelector('.custom-cursor');

  // Проверяем, поддерживает ли устройство ховер (не тачскрин)
  const isHoverSupported = window.matchMedia('(hover: hover)').matches;

  if (!cursor || !isHoverSupported) {
    if (cursor) cursor.style.display = 'none';
    return;
  }

  let isTouching = false;
  let touchTimeout;

  window.addEventListener(
    'touchstart',
    () => {
      isTouching = true;
      cursor.classList.remove('visible');
      isVisible = false;
      // After a touch, we want to ignore mousemove for a bit
      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => {
        isTouching = false;
      }, 500);
    },
    { passive: true }
  );

  // Оптимизация: Переменные состояния для RAF и throttling
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = null;
  let lastHoverCheck = 0;
  let lastHoverCheckX = 0;
  let lastHoverCheckY = 0;
  let isHovering = false;
  let isVisible = false;
  let storageDebounceTimer = null;
  let pendingStorageX = null;
  let pendingStorageY = null;

  const interactiveSelector =
    'a, button, .header-language, .header-theme, .social-link, .footer-decorative-square, .header-menu-button, .project-card, .research-card, .document-viewer-button, .document-viewer-error-link';

  // Оптимизация: Функция обновления позиции через RAF
  const updateCursorPosition = () => {
    currentX = targetX;
    currentY = targetY;
    // Используем left/top для позиционирования, transform остается в CSS для центрирования
    // Это работает быстрее чем изменение transform полностью
    cursor.style.left = `${currentX}px`;
    cursor.style.top = `${currentY}px`;
    rafId = null;
  };

  // Оптимизация: Debounced сохранение в sessionStorage
  const savePositionToStorage = (x, y) => {
    pendingStorageX = x;
    pendingStorageY = y;
    clearTimeout(storageDebounceTimer);
    storageDebounceTimer = setTimeout(() => {
      if (pendingStorageX !== null && pendingStorageY !== null) {
        sessionStorage.setItem('cursorX', String(pendingStorageX));
        sessionStorage.setItem('cursorY', String(pendingStorageY));
        pendingStorageX = null;
        pendingStorageY = null;
      }
    }, 500);
  };

  // Оптимизация: Throttled проверка hover состояния
  const checkHoverState = (x, y) => {
    const now = performance.now();
    // Проверяем не чаще раза в 100мс или если позиция изменилась значительно (>10px)
    const distanceMoved = Math.abs(x - lastHoverCheckX) + Math.abs(y - lastHoverCheckY);
    if (now - lastHoverCheck < 100 && distanceMoved < 10) {
      return;
    }

    lastHoverCheck = now;
    lastHoverCheckX = x;
    lastHoverCheckY = y;

    // Проверяем, находится ли курсор над iframe
    const elementUnderCursor = document.elementFromPoint(x, y);
    const isOverIframe = elementUnderCursor && (
      elementUnderCursor.closest('.document-viewer-iframe-wrapper') ||
      elementUnderCursor.closest('.document-viewer-iframe') ||
      elementUnderCursor.tagName === 'IFRAME' ||
      elementUnderCursor.classList.contains('document-viewer-iframe-wrapper') ||
      elementUnderCursor.classList.contains('document-viewer-iframe')
    );

    // Если курсор над iframe, скрываем кастомный курсор
    if (isOverIframe) {
      if (isVisible) {
        cursor.classList.remove('visible');
        isVisible = false;
      }
      if (isHovering) {
        cursor.classList.remove('hover');
        isHovering = false;
      }
      return;
    }

    // Показываем курсор если скрыт
    if (!isVisible) {
      cursor.classList.add('visible');
      isVisible = true;
    }

    // Проверяем hover состояние для интерактивных элементов
    const isInteractive = elementUnderCursor && elementUnderCursor.closest(interactiveSelector);
    if (isInteractive && !isHovering) {
      cursor.classList.add('hover');
      isHovering = true;
    } else if (!isInteractive && isHovering) {
      cursor.classList.remove('hover');
      isHovering = false;
    }
  };

  // Get last known position from session storage
  const lastX = sessionStorage.getItem('cursorX');
  const lastY = sessionStorage.getItem('cursorY');

  if (lastX && lastY) {
    const x = Number(lastX);
    const y = Number(lastY);
    targetX = x;
    targetY = y;
    currentX = x;
    currentY = y;
    // Устанавливаем начальную позицию через left/top
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    cursor.classList.add('visible');
    isVisible = true;

    // Check if the initial position is over an interactive element
    // We need a small delay for the DOM to be ready for elementFromPoint
    setTimeout(() => {
      checkHoverState(x, y);
    }, 100);
  }

  // Оптимизированный обработчик mousemove
  window.addEventListener('mousemove', (e) => {
    if (isTouching) {
      return;
    }

    const x = e.clientX;
    const y = e.clientY;

    // Обновляем целевую позицию (это быстро, без DOM операций)
    targetX = x;
    targetY = y;

    // Показываем курсор при первом движении мыши
    if (!isVisible) {
      cursor.classList.add('visible');
      isVisible = true;
    }

    // Запускаем RAF для обновления визуальной позиции (если еще не запущен)
    if (!rafId) {
      rafId = requestAnimationFrame(updateCursorPosition);
    }

    // Throttled проверка hover состояния
    checkHoverState(x, y);

    // Debounced сохранение в sessionStorage
    savePositionToStorage(x, y);
  }, { passive: true });

  // Сохраняем позицию при выгрузке страницы
  window.addEventListener('beforeunload', () => {
    if (pendingStorageX !== null && pendingStorageY !== null) {
      sessionStorage.setItem('cursorX', String(pendingStorageX));
      sessionStorage.setItem('cursorY', String(pendingStorageY));
    } else if (targetX !== 0 || targetY !== 0) {
      sessionStorage.setItem('cursorX', String(targetX));
      sessionStorage.setItem('cursorY', String(targetY));
    }
  });
};

export default initCustomCursor;
