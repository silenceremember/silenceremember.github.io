/**
 * Утилита для работы с локализацией
 */
class Localization {
  constructor() {
    this.currentLanguage = 'ru';
    this.translations = {};
    this.listeners = new Set();
  }

  /**
   * Определяет, является ли пользователь из СНГ региона
   * @returns {boolean}
   */
  isUserFromCIS() {
    // Проверяем язык браузера
    const browserLang = navigator.language || navigator.userLanguage || '';
    const cisLangCodes = ['ru', 'uk', 'be', 'kk', 'uz', 'hy', 'az', 'ky', 'tg', 'tk', 'mo'];
    if (cisLangCodes.some(code => browserLang.toLowerCase().startsWith(code))) {
      return true;
    }

    // Проверяем список языков браузера
    if (navigator.languages) {
      for (const lang of navigator.languages) {
        if (cisLangCodes.some(code => lang.toLowerCase().startsWith(code))) {
          return true;
        }
      }
    }

    // Проверяем часовой пояс (CIS страны используют определенные таймзоны)
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const cisTimezones = [
        'Europe/Moscow',
        'Europe/Minsk',
        'Asia/Almaty',
        'Asia/Bishkek',
        'Asia/Yerevan',
        'Asia/Baku',
        'Europe/Chisinau',
        'Asia/Dushanbe',
        'Asia/Tashkent',
        'Asia/Ashgabat',
        'Europe/Kiev',
        'Europe/Kyiv'
      ];
      
      if (cisTimezones.includes(timezone)) {
        return true;
      }
    } catch (e) {
      // Если не удалось определить таймзону, продолжаем проверку
    }

    return false;
  }

  /**
   * Определяет язык по умолчанию на основе региона пользователя
   * @returns {string} 'ru' или 'en'
   */
  detectDefaultLanguage() {
    // Сначала проверяем сохраненный язык
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'ru' || savedLanguage === 'en') {
      return savedLanguage;
    }

    // Если язык не сохранен, определяем по региону
    return this.isUserFromCIS() ? 'ru' : 'en';
  }

  /**
   * Инициализирует локализацию
   * @param {string} lang - Язык (если не указан, определяется автоматически)
   */
  async init(lang = null) {
    // Если язык явно не указан, определяем автоматически
    if (!lang) {
      lang = this.detectDefaultLanguage();
    }
    
    this.currentLanguage = lang;
    await this.loadTranslations(this.currentLanguage);
  }

  /**
   * Загружает переводы для указанного языка
   * @param {string} lang - Код языка
   */
  async loadTranslations(lang) {
    try {
      const response = await fetch(`/data/locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${lang}`);
      }
      this.translations = await response.json();
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
      
      // Принудительно применяем стили для Firefox после смены языка
      // Это предотвращает изменение размеров шрифтов при переключении языка
      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        // Принудительно пересчитываем стили для всех элементов
        document.body.style.fontSize = getComputedStyle(document.body).fontSize;
        // Небольшая задержка для гарантии применения стилей
        requestAnimationFrame(() => {
          document.body.style.fontSize = '';
        });
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to Russian if English fails
      if (lang !== 'ru') {
        await this.loadTranslations('ru');
      }
    }
  }

  /**
   * Получает перевод по ключу
   * @param {string} key - Ключ перевода (например, "common.nav.home")
   * @param {Object} params - Параметры для подстановки
   * @returns {string} - Переведенный текст
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Подстановка параметров
    if (Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }

    return value;
  }

  /**
   * Получает текущий язык
   * @returns {string}
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Переключает язык
   * @param {string} lang - Новый язык
   */
  async switchLanguage(lang) {
    if (lang !== this.currentLanguage) {
      await this.loadTranslations(lang);
    }
  }

  /**
   * Подписывается на изменения языка
   * @param {Function} callback - Функция обратного вызова
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Уведомляет всех подписчиков об изменении языка
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentLanguage, this.translations);
      } catch (error) {
        console.error('Error in localization listener:', error);
      }
    });
  }
}

// Экспортируем singleton
export const localization = new Localization();

