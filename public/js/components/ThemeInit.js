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
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
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

    // Сбрасываем прокрутку в начало при загрузке страницы
    // Контент загрузится асинхронно, поэтому нужно подождать
    // Используем несколько попыток, чтобы убедиться, что прокрутка сброшена
    function resetScroll() {
      if (window.scrollTo) {
        window.scrollTo(0, 0);
      }
      const pageWrapper = document.querySelector('.page-wrapper');
      if (pageWrapper) {
        pageWrapper.scrollTop = 0;
      }
    }

    // Сбрасываем сразу
    resetScroll();

    // Сбрасываем после небольшой задержки, чтобы переопределить возможное восстановление браузером
    setTimeout(resetScroll, 0);
    setTimeout(resetScroll, 10);
    setTimeout(resetScroll, 50);

    // Также сбрасываем после полной загрузки страницы
    window.addEventListener('load', function () {
      setTimeout(resetScroll, 0);
      setTimeout(resetScroll, 100);
    });
  }
})();
