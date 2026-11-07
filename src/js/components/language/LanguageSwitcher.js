/**
 * Переключатель языка интерфейса
 */
import { localization } from '../../utils/Localization.js';

export class LanguageSwitcher {
  /**
   * Создает экземпляр переключателя языка
   */
  constructor() {
    this.languageButton = null;
    this.checkInterval = null;
    this.unsubscribe = null;
  }

  /**
   * Инициализирует переключатель языка
   */
  async init() {
    // Инициализируем локализацию
    await localization.init();
    
    this.languageButton = document.querySelector('.header-language');
    if (!this.languageButton) return;

    this.applyLanguage(localization.getCurrentLanguage());
    // Две кнопки «RU» и «EN»: нажатие на текущий язык ничего не меняет
    this.languageButton.querySelectorAll('.header-language-option').forEach((option) => {
      option.addEventListener('click', () => {
        const lang = option.dataset.lang;
        if (lang && lang !== localization.getCurrentLanguage()) {
          localization.switchLanguage(lang);
        }
      });
    });

    // Подписываемся на изменения языка
    this.unsubscribe = localization.subscribe((lang) => {
      this.applyLanguage(lang);
      this.updatePageContent();
    });

    // Обновляем контент страницы при инициализации
    this.updatePageContent();
  }

  /**
   * Применяет язык интерфейса
   * @param {string} lang - Код языка ('ru' или 'en')
   */
  applyLanguage(lang) {
    if (!this.languageButton) return;

    // Текущий язык виден текстом (белый) и отмечен aria-pressed; второй серый
    this.languageButton.querySelectorAll('.header-language-option').forEach((option) => {
      const current = option.dataset.lang === lang;
      option.classList.toggle('active', current);
      option.setAttribute('aria-pressed', String(current));
    });

    // Подпись группы называет текущий язык и язык, на который переключит вторая кнопка
    const label = localization.t('common.aria.languageSwitch');
    if (label && label !== 'common.aria.languageSwitch') {
      this.languageButton.setAttribute('aria-label', label);
    }
  }

  /**
   * Переключает язык
   */
  async toggleLanguage() {
    const currentLang = localization.getCurrentLanguage();
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    await localization.switchLanguage(newLang);
  }

  /**
   * Обновляет контент страницы в соответствии с текущим языком
   */
  updatePageContent() {
    const lang = localization.getCurrentLanguage();
    
    // Обновляем навигацию в header
    this.updateNavigation();
    
    // Обновляем элементы с data-i18n атрибутами
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (!key) return;
      const text = localization.t(key);
      // Обновляем только если перевод найден и отличается от ключа
      if (text && text !== key) {
        element.textContent = text;
      }
    });

    // Обновляем атрибуты с data-i18n-attr
    document.querySelectorAll('[data-i18n-attr]').forEach(element => {
      const attrData = element.getAttribute('data-i18n-attr');
      const [attr, key] = attrData.split(':');
      const text = localization.t(key);
      if (text && attr) {
        element.setAttribute(attr, text);
      }
    });

    // Обновляем атрибуты title с data-i18n-attr-title
    document.querySelectorAll('[data-i18n-attr-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-attr-title');
      const text = localization.t(key);
      if (text) {
        element.setAttribute('title', text);
      }
    });

    // Обновляем title и meta description
    this.updateMetaTags();

    // Вызываем событие для обновления динамического контента страниц
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: lang }
    }));
  }

  /**
   * Обновляет навигацию
   */
  updateNavigation() {
    const navItems = document.querySelectorAll('.header-nav-item');
    const navKeys = ['common.nav.home', 'common.nav.portfolio', 'common.nav.services', 'common.nav.research', 'common.nav.cv'];
    
    navItems.forEach((item, index) => {
      if (navKeys[index]) {
        const text = localization.t(navKeys[index]);
        if (text) {
          item.textContent = text;
        }
      }
    });

    // Обновляем навигацию в CTA кнопках
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
      // Подписи по адресу меняем только в навигационных блоках, не в CTA с собственным текстом
      if (!button.closest('[class*="navigation"]')) return;
      const href = button.getAttribute('href');
      if (href) {
        const keyMap = {
          'index.html': 'common.nav.home',
          'projects.html': 'common.nav.portfolio',
          'research.html': 'common.nav.research',
          'cv.html': 'common.nav.cv',
          'services.html': 'common.nav.services',
          'community.html': 'common.nav.services'
        };
        const page = href === '/' ? 'index.html' : href.split('/').pop();
        const key = keyMap[page];
        if (key) {
          const text = localization.t(key);
          if (text) {
            button.textContent = text;
          }
        }
      }
    });
  }

  /**
   * Обновляет meta теги страницы
   */
  updateMetaTags() {
    const path = window.location.pathname;
    let pageName = path.split('/').pop() || 'index.html';
    if (!pageName.includes('.')) pageName += '.html';
    
    let titleKey = '';
    let descKey = '';
    
    const lang = localization.getCurrentLanguage();
    const isEn = lang === 'en';

    // Alt картинок статических страниц: RU в alt, EN в data-alt-en
    document.querySelectorAll('img[data-alt-en]').forEach((img) => {
      if (img.dataset.altRu === undefined) img.dataset.altRu = img.getAttribute('alt') || '';
      img.setAttribute('alt', isEn ? img.dataset.altEn : img.dataset.altRu);
    });

    // Картинки с отдельной английской версией
    document.querySelectorAll('img[data-src-en]').forEach((img) => {
      if (img.dataset.srcRu === undefined) img.dataset.srcRu = img.getAttribute('src');
      img.setAttribute('src', isEn ? img.dataset.srcEn : img.dataset.srcRu);
    });
    document.querySelectorAll('a[data-href-en]').forEach((link) => {
      if (link.dataset.hrefRu === undefined) link.dataset.hrefRu = link.getAttribute('href');
      link.setAttribute('href', isEn ? link.dataset.hrefEn : link.dataset.hrefRu);
    });

    // aria статичных компонентов
    const menuOpen = document.querySelector('.header.menu-open');
    const ariaMap = [
      ['.header-menu-button', menuOpen ? 'common.aria.menuClose' : 'common.aria.menu'],
      ['.scroll-to-top', 'common.buttons.scrollToTop'],
    ];
    ariaMap.forEach(([selector, key]) => {
      const label = localization.t(key);
      if (label && label !== key) {
        document.querySelectorAll(selector).forEach((el) => el.setAttribute('aria-label', label));
      }
    });

    // Статические страницы хранят заголовок и описание на двух языках в <html>
    const root = document.documentElement;
    if (root.dataset.titleEn) {
      document.title = isEn ? root.dataset.titleEn : root.dataset.titleRu;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', isEn ? root.dataset.descEn : root.dataset.descRu);
      const ogMap = {
        'meta[property="og:title"]': isEn ? root.dataset.titleEn : root.dataset.titleRu,
        'meta[name="twitter:title"]': isEn ? root.dataset.titleEn : root.dataset.titleRu,
        'meta[property="og:description"]': isEn ? root.dataset.descEn : root.dataset.descRu,
        'meta[name="twitter:description"]': isEn ? root.dataset.descEn : root.dataset.descRu,
      };
      Object.entries(ogMap).forEach(([selector, value]) => {
        document.querySelector(selector)?.setAttribute('content', value);
      });
      return;
    }

    if (pageName === 'index.html' || pageName === '' || path === '/') {
      descKey = 'index.meta_description';
    } else if (pageName === 'projects.html') {
      titleKey = 'projects.meta_title';
      descKey = 'projects.description';
    } else if (pageName === 'research.html') {
      titleKey = 'research.meta_title';
      descKey = 'research.description';
    } else if (pageName === 'cv.html') {
      titleKey = 'cv.meta_title';
      descKey = 'cv.description';
    } else if (pageName === 'community.html') {
      titleKey = 'community.meta_title';
      descKey = 'community.description';
    } else if (pageName === '404.html' || document.body.classList.contains('page-404')) {
      titleKey = '404.title';
      descKey = '404.message'; // Using message for description on 404
    }

    if (titleKey) {
      const pageTitle = localization.t(titleKey);
      if (pageTitle) {
        document.title = pageTitle + ' | ' + localization.t('common.siteName');
      }
    } else {
      document.title = localization.t('common.siteName') + ': ' + localization.t('common.siteRole');
    }

    if (descKey) {
      const desc = localization.t(descKey);
      if (desc) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', desc);
        }
      }
    }
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.languageButton) {
      this.languageButton.removeEventListener('click', () => this.toggleLanguage());
    }
  }
}
