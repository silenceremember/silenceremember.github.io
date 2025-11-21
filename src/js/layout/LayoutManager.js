/**
 * Менеджер layout страницы
 * Управляет загрузкой и отображением header, footer и других компонентов макета
 */
import { NavigationHelper } from '../utils/Navigation.js';

// Кеш для HTML шаблонов (общий для всех экземпляров)
const htmlCache = new Map();
// Активные запросы для дедупликации
const pendingRequests = new Map();

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
   * Загружает HTML из URL с кешированием и дедупликацией запросов
   * @param {string} url - URL для загрузки HTML
   * @returns {Promise<string>} HTML содержимое
   * @throws {Error} Если загрузка не удалась
   */
  async loadHTML(url) {
    // Проверяем кеш
    if (htmlCache.has(url)) {
      return Promise.resolve(htmlCache.get(url));
    }

    // Проверяем, есть ли уже активный запрос для этого URL
    if (pendingRequests.has(url)) {
      return pendingRequests.get(url);
    }

    // Создаем новый запрос
    // Не используем keepalive для HTML, так как это может помешать использованию preloaded ресурсов
    const requestPromise = fetch(url, {
      priority: 'high',
      headers: {
        'Cache-Control': 'max-age=300', // 5 минут
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load HTML from ${url}`);
        }
        const html = await response.text();
        // Сохраняем в кеш
        htmlCache.set(url, html);
        return html;
      })
      .catch((error) => {
        console.error(`Ошибка загрузки HTML из ${url}:`, error);
        throw error;
      })
      .finally(() => {
        // Удаляем из активных запросов после завершения
        pendingRequests.delete(url);
      });

    // Сохраняем промис для дедупликации
    pendingRequests.set(url, requestPromise);

    return requestPromise;
  }

  /**
   * Устанавливает активную ссылку в навигации
   */
  setActiveNavLink() {
    const navLinks = document.querySelectorAll('.header-nav-item');
    let currentPage = window.location.pathname.split('/').pop();
    
    // Обрабатываем главную страницу: '', '/', 'index.html'
    if (currentPage === '' || currentPage === 'index.html' || window.location.pathname === '/') {
      currentPage = 'index.html';
    }

    navLinks.forEach((link) => {
      let linkPage = link.getAttribute('href').split('/').pop();
      
      // Обрабатываем главную страницу для href="/"
      if (linkPage === '' || link.getAttribute('href') === '/' || linkPage === 'index.html') {
        linkPage = 'index.html';
      }
      
      if (linkPage === currentPage) {
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
