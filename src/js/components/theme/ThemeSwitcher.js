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
    
    // Устанавливаем начальные стили явно
    this.moonIcon.style.opacity = '0';
    this.moonIcon.style.visibility = 'hidden';
    this.sunIcon.style.opacity = '0';
    this.sunIcon.style.visibility = 'hidden';

    this.themeButton.addEventListener('click', () => this.toggleTheme());

    // Применяем сохраненную тему при загрузке
    // Используем небольшую задержку, чтобы убедиться, что SVG загружены
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Применяем тему сразу
    this.applyTheme(savedTheme);
    
    // Также применяем после небольшой задержки на случай, если SVG еще загружаются
    setTimeout(() => {
      this.applyTheme(savedTheme);
    }, 100);
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

    // Добавляем класс active только к активной иконке
    if (theme === 'dark') {
      this.sunIcon.classList.add('active');
      // Убеждаемся, что moon скрыта
      this.moonIcon.style.opacity = '0';
      this.moonIcon.style.visibility = 'hidden';
      this.sunIcon.style.opacity = '1';
      this.sunIcon.style.visibility = 'visible';
    } else {
      this.moonIcon.classList.add('active');
      // Убеждаемся, что sun скрыта
      this.sunIcon.style.opacity = '0';
      this.sunIcon.style.visibility = 'hidden';
      this.moonIcon.style.opacity = '1';
      this.moonIcon.style.visibility = 'visible';
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
