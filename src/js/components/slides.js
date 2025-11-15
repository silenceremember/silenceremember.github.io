/**
 * Инициализирует менеджер слайдов (обертка для обратной совместимости)
 */
import { SlidesManager } from './slides/SlidesManager.js';

const slidesManager = new SlidesManager();

export default function initSlidesManager() {
  slidesManager.init();
}
