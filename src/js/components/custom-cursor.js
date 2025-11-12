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
      // After a touch, we want to ignore mousemove for a bit
      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => {
        isTouching = false;
      }, 500);
    },
    { passive: true }
  );

  // Get last known position from session storage
  const lastX = sessionStorage.getItem('cursorX');
  const lastY = sessionStorage.getItem('cursorY');

  const interactiveSelector =
    'a, button, .header-language, .header-theme, .social-link, .footer-decorative-square, .header-menu-button';

  if (lastX && lastY) {
    const x = Number(lastX);
    const y = Number(lastY);
    cursor.style.top = `${y}px`;
    cursor.style.left = `${x}px`;
    cursor.classList.add('visible'); // Make it visible

    // Check if the initial position is over an interactive element
    // We need a small delay for the DOM to be ready for elementFromPoint
    setTimeout(() => {
      const elementUnderCursor = document.elementFromPoint(x, y);
      if (
        elementUnderCursor &&
        elementUnderCursor.closest(interactiveSelector)
      ) {
        cursor.classList.add('hover');
      }
    }, 100);
  }

  window.addEventListener('mousemove', (e) => {
    if (isTouching) {
      return;
    }

    const x = e.clientX;
    const y = e.clientY;

    // Позиционируем курсор через top и left
    cursor.style.top = `${y}px`;
    cursor.style.left = `${x}px`;

    // Save position to session storage
    sessionStorage.setItem('cursorX', String(x));
    sessionStorage.setItem('cursorY', String(y));

    // Make it visible on first move
    if (!cursor.classList.contains('visible')) {
      cursor.classList.add('visible');
    }

    // We also need to check hover state on mouse move
    const elementUnderCursor = document.elementFromPoint(x, y);
    if (elementUnderCursor && elementUnderCursor.closest(interactiveSelector)) {
      if (!cursor.classList.contains('hover')) {
        cursor.classList.add('hover');
      }
    } else {
      if (cursor.classList.contains('hover')) {
        cursor.classList.remove('hover');
      }
    }
  });
};

export default initCustomCursor;
