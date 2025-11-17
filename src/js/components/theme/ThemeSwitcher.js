/**
 * Переключатель темы оформления (светлая/темная)
 */
export class ThemeSwitcher {
  /**
   * Создает экземпляр переключателя темы
   */
  constructor() {
    this.themeButton = null;
    this.moonIcon = null;
    this.sunIcon = null;
    this.documentElement = document.documentElement;
  }

  /**
   * Инициализирует переключатель темы
   */
  init() {
    this.themeButton = document.querySelector('.header-theme');
    if (!this.themeButton) {
      console.warn('Theme button not found');
      return;
    }

    this.moonIcon = this.themeButton.querySelector('.theme-icon-moon');
    this.sunIcon = this.themeButton.querySelector('.theme-icon-sun');

    if (!this.moonIcon || !this.sunIcon) {
      console.warn('Theme icons not found', { moonIcon: this.moonIcon, sunIcon: this.sunIcon });
      return;
    }

    // Убеждаемся, что начальное состояние установлено правильно
    this.moonIcon.classList.remove('active');
    this.sunIcon.classList.remove('active');

    this.themeButton.addEventListener('click', () => this.toggleTheme());

    // Применяем сохраненную тему при загрузке
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.applyTheme(savedTheme);
  }

  /**
   * Применяет тему оформления
   * @param {string} theme - Название темы ('light' или 'dark')
   */
  applyTheme(theme) {
    if (!this.moonIcon || !this.sunIcon) {
      console.warn('Theme icons not found');
      return;
    }

    this.documentElement.setAttribute('data-theme', theme);
    
    // Убираем класс active со всех иконок явно
    this.moonIcon.classList.remove('active');
    this.sunIcon.classList.remove('active');

    // Принудительно пересчитываем стили для применения изменений
    void this.moonIcon.offsetHeight;
    void this.sunIcon.offsetHeight;

    // Добавляем класс active только к активной иконке синхронно
    if (theme === 'dark') {
      this.sunIcon.classList.add('active');
      console.log('Applied dark theme, sun icon active', {
        moonHasActive: this.moonIcon.classList.contains('active'),
        sunHasActive: this.sunIcon.classList.contains('active'),
        moonOpacity: window.getComputedStyle(this.moonIcon).opacity,
        sunOpacity: window.getComputedStyle(this.sunIcon).opacity
      });
    } else {
      this.moonIcon.classList.add('active');
      console.log('Applied light theme, moon icon active', {
        moonHasActive: this.moonIcon.classList.contains('active'),
        sunHasActive: this.sunIcon.classList.contains('active'),
        moonOpacity: window.getComputedStyle(this.moonIcon).opacity,
        sunOpacity: window.getComputedStyle(this.sunIcon).opacity
      });
    }
  }

  /**
   * Переключает тему
   */
  toggleTheme() {
    const currentTheme =
      this.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    this.applyTheme(newTheme);
  }
}
