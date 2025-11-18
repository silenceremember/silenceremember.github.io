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

    const ruIcon = this.languageButton.querySelector('.language-icon-ru');
    const enIcon = this.languageButton.querySelector('.language-icon-en');
    
    // Убеждаемся, что начальное состояние установлено правильно
    if (ruIcon && enIcon) {
      ruIcon.classList.remove('active');
      enIcon.classList.remove('active');
    }

    this.applyLanguage(localization.getCurrentLanguage());
    this.languageButton.addEventListener('click', () => this.toggleLanguage());

    // Подписываемся на изменения языка
    this.unsubscribe = localization.subscribe((lang) => {
      this.applyLanguage(lang);
      this.updatePageContent();
    });

    // Периодически проверяем и обновляем состояние после загрузки SVG
    this.checkInterval = setInterval(() => {
      const ruSvg = this.languageButton.querySelector('.language-icon-ru svg');
      const enSvg = this.languageButton.querySelector('.language-icon-en svg');

      if (ruSvg && enSvg) {
        this.applyLanguage(localization.getCurrentLanguage());
        clearInterval(this.checkInterval);
      }
    }, 50);

    // Останавливаем проверку через 2 секунды, если SVG не загрузились
    setTimeout(() => {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
    }, 2000);

    // Обновляем контент страницы при инициализации
    this.updatePageContent();
  }

  /**
   * Применяет язык интерфейса
   * @param {string} lang - Код языка ('ru' или 'en')
   */
  applyLanguage(lang) {
    const ruIcon = this.languageButton?.querySelector('.language-icon-ru');
    const enIcon = this.languageButton?.querySelector('.language-icon-en');

    if (!ruIcon || !enIcon) return;

    // Убираем класс active со всех иконок
    ruIcon.classList.remove('active');
    enIcon.classList.remove('active');

    // Добавляем класс active только к активной иконке
    if (lang === 'ru') {
      ruIcon.classList.add('active');
    } else {
      enIcon.classList.add('active');
    }

    // Обновляем aria-label
    if (this.languageButton) {
      const label = localization.t('common.aria.languageSwitch');
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
    const navKeys = ['common.nav.home', 'common.nav.portfolio', 'common.nav.research', 'common.nav.cv', 'common.nav.community'];
    
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
      const href = button.getAttribute('href');
      if (href) {
        const keyMap = {
          'index.html': 'common.nav.home',
          'projects.html': 'common.nav.portfolio',
          'research.html': 'common.nav.research',
          'cv.html': 'common.nav.cv',
          'community.html': 'common.nav.community'
        };
        const key = keyMap[href];
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
    const pageName = path.split('/').pop() || 'index.html';
    
    let titleKey = '';
    let descKey = '';
    
    if (pageName === 'index.html' || pageName === '' || path === '/') {
      titleKey = 'index.meta_title';
      descKey = 'index.meta_description';
    } else if (pageName === 'projects.html') {
      titleKey = 'projects.title';
      descKey = 'projects.description';
    } else if (pageName === 'research.html') {
      titleKey = 'research.title';
      descKey = 'research.description';
    } else if (pageName === 'cv.html') {
      titleKey = 'cv.title';
      descKey = 'cv.description';
    } else if (pageName === 'community.html') {
      titleKey = 'community.title';
      descKey = 'community.description';
    } else if (pageName === '404.html') {
      titleKey = '404.title';
      descKey = '404.description';
    }

    if (titleKey) {
      const title = localization.t(titleKey);
      if (title) {
        document.title = title;
      }
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
