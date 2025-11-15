/**
 * Инициализирует переключатель темы (обертка для обратной совместимости)
 */
import { ThemeSwitcher } from './theme/ThemeSwitcher.js';

const themeSwitcher = new ThemeSwitcher();

export function initThemeSwitcher() {
  themeSwitcher.init();
}
