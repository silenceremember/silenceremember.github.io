/**
 * Инициализация темы при загрузке страницы
 * Выполняется синхронно для предотвращения мерцания (FOUC)
 * Устанавливает тему из localStorage и настраивает классы для страниц со скроллом
 */
(function () {
  // Регистрируем взаимодействие пользователя как можно раньше
  // Это предотвращает удаление состояния сайта Chrome в bounce tracking mitigation
  let userInteractionRegistered = false;
  const registerUserInteraction = () => {
    if (!userInteractionRegistered) {
      userInteractionRegistered = true;
      // Сохраняем флаг взаимодействия в sessionStorage
      try {
        sessionStorage.setItem('user_interaction', 'true');
      } catch (e) {
        // Игнорируем ошибки sessionStorage
      }
    }
  };
  
  // Регистрируем события пользователя сразу
  document.addEventListener('mousemove', registerUserInteraction, { passive: true, once: true });
  document.addEventListener('touchstart', registerUserInteraction, { passive: true, once: true });
  document.addEventListener('click', registerUserInteraction, { passive: true, once: true });
  document.addEventListener('keydown', registerUserInteraction, { passive: true, once: true });
  document.addEventListener('scroll', registerUserInteraction, { passive: true, once: true });
  
  const theme = localStorage.getItem('theme');
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Добавляем класс для скролла к html для страниц с прокруткой
  const pathname = window.location.pathname;
  const pagesWithScroll = [
    'research.html',
    'projects.html',
    'cv.html',
    'community.html',
  ];
  if (pagesWithScroll.some((page) => pathname.includes(page))) {
    document.documentElement.classList.add('page-with-scroll');
  }

  // Отключаем автоматическое восстановление позиции прокрутки браузером (для cv.html)
  if (pathname.includes('cv.html')) {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Оптимизированный сброс прокрутки без forced reflow
    // Используем requestAnimationFrame для батчинга операций
    function resetScroll() {
      requestAnimationFrame(() => {
        if (window.scrollTo) {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
        const pageWrapper = document.querySelector('.page-wrapper');
        if (pageWrapper) {
          pageWrapper.scrollTop = 0;
        }
      });
    }

    // Сбрасываем один раз сразу
    resetScroll();

    // Также сбрасываем после полной загрузки страницы (один раз)
    window.addEventListener('load', resetScroll, { once: true, passive: true });
  }
})();
