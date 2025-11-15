/**
 * Инициализирует переключатель языка (обертка для обратной совместимости)
 */
import { LanguageSwitcher } from './language/LanguageSwitcher.js';

const languageSwitcher = new LanguageSwitcher();

export function initLanguageSwitcher() {
  languageSwitcher.init();
}
