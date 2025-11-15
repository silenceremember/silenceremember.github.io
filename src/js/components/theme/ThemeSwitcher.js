/**
 * Переключатель темы
 */
export class ThemeSwitcher {
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

    this.themeButton.addEventListener('click', () => this.toggleTheme());

    // Применяем сохраненную тему при загрузке
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.applyTheme(savedTheme);
  }

  /**
   * Применяет тему
   */
  applyTheme(theme) {
    this.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      this.moonIcon.style.display = 'none';
      this.sunIcon.style.display = 'block';
    } else {
      this.moonIcon.style.display = 'block';
      this.sunIcon.style.display = 'none';
    }
  }

  /**
   * Переключает тему
   */
  toggleTheme() {
    const currentTheme = this.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    this.applyTheme(newTheme);
  }
}

