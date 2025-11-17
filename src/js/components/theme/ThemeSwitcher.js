/**
 * Переключатель темы оформления (светлая/темная)
 */
export class ThemeSwitcher {
  /**
   * Создает экземпляр переключателя темы
   */
  constructor() {
    this.themeButton = null;
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

    // Проверяем наличие иконок
    const { moonIcon, sunIcon } = this.getIcons();
    if (!moonIcon || !sunIcon) {
      console.warn('Theme icons not found', { moonIcon, sunIcon });
      return;
    }

    this.themeButton.addEventListener('click', () => this.toggleTheme());

    // Применяем сохраненную тему при загрузке
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.applyTheme(savedTheme);
  }

  /**
   * Получает актуальные элементы иконок из DOM
   * Это необходимо, так как SVG загружаются асинхронно и заменяют span элементы
   */
  getIcons() {
    if (!this.themeButton) {
      return { moonIcon: null, sunIcon: null };
    }
    
    // Ищем элементы каждый раз, так как они могут быть заменены после загрузки SVG
    const moonIcon = this.themeButton.querySelector('.theme-icon-moon');
    const sunIcon = this.themeButton.querySelector('.theme-icon-sun');
    
    return { moonIcon, sunIcon };
  }

  /**
   * Применяет тему оформления
   * @param {string} theme - Название темы ('light' или 'dark')
   */
  applyTheme(theme) {
    // Получаем актуальные элементы иконок из DOM
    const { moonIcon, sunIcon } = this.getIcons();
    
    if (!moonIcon || !sunIcon) {
      console.warn('Theme icons not found', { moonIcon, sunIcon });
      return;
    }

    this.documentElement.setAttribute('data-theme', theme);
    
    // Определяем, какая иконка должна быть активна
    const activeIcon = theme === 'dark' ? sunIcon : moonIcon;
    const inactiveIcon = theme === 'dark' ? moonIcon : sunIcon;
    
    // Очищаем все inline стили для обеих иконок перед применением изменений
    moonIcon.style.removeProperty('opacity');
    moonIcon.style.removeProperty('visibility');
    moonIcon.style.removeProperty('display');
    sunIcon.style.removeProperty('opacity');
    sunIcon.style.removeProperty('visibility');
    sunIcon.style.removeProperty('display');
    
    // Убираем класс active с обеих иконок
    moonIcon.classList.remove('active');
    sunIcon.classList.remove('active');

    // Принудительно пересчитываем стили для применения изменений
    void moonIcon.offsetHeight;
    void sunIcon.offsetHeight;

    // Явно скрываем неактивную иконку через inline стили с important
    inactiveIcon.style.setProperty('opacity', '0', 'important');
    inactiveIcon.style.setProperty('visibility', 'hidden', 'important');
    
    // Добавляем класс active к активной иконке
    activeIcon.classList.add('active');
    
    // Явно показываем активную иконку через inline стили с important
    activeIcon.style.setProperty('opacity', '1', 'important');
    activeIcon.style.setProperty('visibility', 'visible', 'important');
    activeIcon.style.setProperty('display', 'flex', 'important');
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
