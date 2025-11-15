/**
 * Инициализация темы при загрузке страницы
 * Выполняется синхронно для предотвращения мерцания
 */
(function() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // Добавляем класс для скролла к html для страниц с прокруткой
  const pathname = window.location.pathname;
  const pagesWithScroll = ['research.html', 'projects.html', 'cv.html', 'community.html'];
  if (pagesWithScroll.some(page => pathname.includes(page))) {
    document.documentElement.classList.add('page-with-scroll');
  }
  
  // Отключаем автоматическое восстановление позиции прокрутки браузером (для cv.html)
  if (pathname.includes('cv.html')) {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }
})();

