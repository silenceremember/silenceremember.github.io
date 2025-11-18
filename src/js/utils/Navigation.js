/**
 * Хелпер для работы с навигацией
 */
export class NavigationHelper {
  /**
   * Выделяет активную страницу в навигации
   * @param {string} navSelector - Селектор навигационного контейнера
   */
  static setActiveNavigationLink(navSelector) {
    const navLinks = document.querySelectorAll(`${navSelector} .cta-button`);
    let currentPage = window.location.pathname.split('/').pop();
    
    // Обрабатываем главную страницу: '', '/', 'index.html'
    if (currentPage === '' || currentPage === 'index.html' || window.location.pathname === '/') {
      currentPage = 'index.html';
    }

    navLinks.forEach((link) => {
      const linkPage = link.getAttribute('href').split('/').pop();
      if (linkPage === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

/**
 * Обработчик прокрутки к навигации при клике на кнопку меню
 */
export class MenuButtonScrollHandler {
  /**
   * @param {string} navigationSelector - Селектор навигационной секции
   * @param {string} pageWrapperSelector - Селектор контейнера страницы (по умолчанию '.page-wrapper')
   */
  constructor(navigationSelector, pageWrapperSelector = '.page-wrapper') {
    this.navigationSelector = navigationSelector;
    this.pageWrapperSelector = pageWrapperSelector;
    this.menuButton = null;
    this.navigationSection = null;
    this.pageWrapper = null;
    this.isInitialized = false;
  }

  /**
   * Инициализирует обработчик
   */
  init() {
    if (this.isInitialized) return;

    this.navigationSection = document.querySelector(this.navigationSelector);
    this.pageWrapper = document.querySelector(this.pageWrapperSelector);

    if (!this.navigationSection || !this.pageWrapper) {
      return;
    }

    // Ждем появления кнопки меню (header загружается асинхронно)
    this.waitForMenuButton();
  }

  /**
   * Ожидает появления кнопки меню и добавляет обработчик
   */
  waitForMenuButton() {
    let retryCount = 0;
    const maxRetries = 20; // Максимум 1 секунда ожидания (20 * 50ms)

    const checkMenuButton = () => {
      this.menuButton = document.querySelector('.header-menu-button');

      if (!this.menuButton) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.warn('Кнопка меню не найдена после ожидания');
          return;
        }
        // Если кнопка еще не загружена, ждем и пробуем снова
        setTimeout(checkMenuButton, 50);
        return;
      }

      // Проверяем, не был ли уже добавлен обработчик
      const handlerKey = `${this.navigationSelector.replace(/[^a-zA-Z0-9]/g, '_')}_scroll_handler`;
      if (this.menuButton.dataset[handlerKey] === 'true') {
        return; // Обработчик уже добавлен
      }

      // Добавляем обработчик
      this.menuButton.addEventListener('click', () => {
        // Прокручиваем до самого низа страницы
        // Используем максимальное значение, чтобы учесть все элементы включая footer/header
        const maxScrollTop = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        );
        
        window.scrollTo({
          top: maxScrollTop,
          behavior: 'smooth',
        });
      });

      // Помечаем, что обработчик добавлен
      this.menuButton.dataset[handlerKey] = 'true';
      this.isInitialized = true;
    };

    checkMenuButton();
  }
}
