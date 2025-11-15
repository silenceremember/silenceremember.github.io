/**
 * Инициализирует обработчик скролла (обертка для обратной совместимости)
 */
import { ScrollManager } from './scroll/ScrollManager.js';

export function initScrollHandler(scrollContainerSelector, isTabletModeCallback) {
  const scrollManager = new ScrollManager(scrollContainerSelector, isTabletModeCallback);
  scrollManager.init();
}
