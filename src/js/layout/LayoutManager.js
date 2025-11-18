/**
 * Менеджер layout страницы
 * Управляет загрузкой и отображением header, footer и других компонентов макета
 */
import { NavigationHelper } from '../utils/Navigation.js';

export class LayoutManager {
  /**
   * Создает экземпляр менеджера layout
   */
  constructor() {
    this.headerElement = null;
    this.footerElement = null;
    this.scrollToTopContainer = null;
  }

  /**
   * Загружает HTML из URL
   * @param {string} url - URL для загрузки HTML
   * @returns {Promise<string>} HTML содержимое
   * @throws {Error} Если загрузка не удалась
   */
  async loadHTML(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load HTML from ${url}`);
    }
    return response.text();
  }

  /**
   * Устанавливает активную ссылку в навигации
   */
  setActiveNavLink() {
    const navLinks = document.querySelectorAll('.header-nav-item');
    let currentPage = window.location.pathname.split('/').pop() || '';

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      // Проверяем, является ли текущая страница главной
      const isCurrentPageHome = currentPage === '' || window.location.pathname === '/';
      // Проверяем, является ли ссылка на главную страницу
      const isLinkToHome = href === '/' || href === '';
      
      if ((isCurrentPageHome && isLinkToHome) || (href && href.split('/').pop() === currentPage && currentPage !== '')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Инициализирует layout страницы
   * Загружает header, footer и другие компоненты
   * @returns {Promise<void>}
   */
  async init() {
    this.headerElement = document.querySelector('header.header');
    this.footerElement = document.querySelector('footer.footer');
    this.scrollToTopContainer = document.querySelector(
      '#scroll-to-top-container'
    );

    // Используем Promise.all для параллельной загрузки компонентов
    const loadPromises = [
      this.headerElement
        ? this.loadHTML('/components/header.html')
        : Promise.resolve(null),
      this.footerElement
        ? this.loadHTML('/components/footer.html')
        : Promise.resolve(null),
    ];

    // Загружаем кнопку "наверх" для страниц с классом page-with-scroll
    if (
      document.body.classList.contains('page-with-scroll') &&
      this.scrollToTopContainer
    ) {
      loadPromises.push(this.loadHTML('/components/scroll-to-top.html'));
    } else {
      loadPromises.push(Promise.resolve(null));
    }

    const [headerHTML, footerHTML, scrollToTopHTML] =
      await Promise.all(loadPromises);

    if (this.headerElement && headerHTML) {
      this.headerElement.innerHTML = headerHTML;
      this.setActiveNavLink();
    }

    if (this.footerElement && footerHTML) {
      this.footerElement.innerHTML = footerHTML;
    }

    if (this.scrollToTopContainer && scrollToTopHTML) {
      this.scrollToTopContainer.innerHTML = scrollToTopHTML;
    }
  }
}
