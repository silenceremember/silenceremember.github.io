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
    if (!this.themeButton) return;

    this.moonIcon = this.themeButton.querySelector('.theme-icon-moon');
    this.sunIcon = this.themeButton.querySelector('.theme-icon-sun');

    if (!this.moonIcon || !this.sunIcon) return;

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
    this.documentElement.setAttribute('data-theme', theme);
    
    // Убираем класс active со всех иконок
    if (this.moonIcon) {
      this.moonIcon.classList.remove('active');
    }
    if (this.sunIcon) {
      this.sunIcon.classList.remove('active');
    }

    // Добавляем класс active только к активной иконке
    if (theme === 'dark') {
      if (this.sunIcon) {
        this.sunIcon.classList.add('active');
      }
    } else {
      if (this.moonIcon) {
        this.moonIcon.classList.add('active');
      }
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
