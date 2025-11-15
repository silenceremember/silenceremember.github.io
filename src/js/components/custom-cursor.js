/**
 * Инициализирует кастомный курсор (обертка для обратной совместимости)
 */
import { CustomCursor } from './custom-cursor/CustomCursor.js';

const customCursor = new CustomCursor();

export default function initCustomCursor() {
  customCursor.init();
}
