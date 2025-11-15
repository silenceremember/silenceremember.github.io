/**
 * Инициализирует кнопку "Наверх" (обертка для обратной совместимости)
 */
import { ScrollToTopButton } from './scroll/ScrollToTopButton.js';

const scrollToTopButton = new ScrollToTopButton();

export function initScrollToTop() {
  scrollToTopButton.init();
}
