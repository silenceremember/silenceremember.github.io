/**
 * Переключатель языка
 */
export class LanguageSwitcher {
  constructor() {
    this.languageButton = null;
    this.currentLanguage = 'ru';
    this.checkInterval = null;
  }

  /**
   * Инициализирует переключатель языка
   */
  init() {
    this.languageButton = document.querySelector('.header-language');
    if (!this.languageButton) return;

    this.applyLanguage(this.currentLanguage);
    this.languageButton.addEventListener('click', () => this.toggleLanguage());

    // Периодически проверяем и обновляем состояние после загрузки SVG
    this.checkInterval = setInterval(() => {
      const ruSvg = this.languageButton.querySelector('.language-icon-ru svg');
      const enSvg = this.languageButton.querySelector('.language-icon-en svg');
      
      if (ruSvg && enSvg) {
        this.applyLanguage(this.currentLanguage);
        clearInterval(this.checkInterval);
      }
    }, 50);

    // Останавливаем проверку через 2 секунды, если SVG не загрузились
    setTimeout(() => {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
    }, 2000);
  }

  /**
   * Применяет язык
   */
  applyLanguage(lang) {
    const ruIcon = this.languageButton.querySelector('.language-icon-ru');
    const enIcon = this.languageButton.querySelector('.language-icon-en');
    
    if (!ruIcon || !enIcon) return;

    const ruSvg = ruIcon.querySelector('svg') || ruIcon;
    const enSvg = enIcon.querySelector('svg') || enIcon;

    if (lang === 'ru') {
      ruSvg.style.display = 'block';
      enSvg.style.display = 'none';
    } else {
      ruSvg.style.display = 'none';
      enSvg.style.display = 'block';
    }
  }

  /**
   * Переключает язык
   */
  toggleLanguage() {
    this.currentLanguage = this.currentLanguage === 'ru' ? 'en' : 'ru';
    this.applyLanguage(this.currentLanguage);
  }
}

