/**
 * Layout менеджер (обертка для обратной совместимости)
 */
import { LayoutManager } from './layout/LayoutManager.js';

const layoutManager = new LayoutManager();

export async function initLayout() {
  return layoutManager.init();
}

export async function loadHTML(url) {
  return layoutManager.loadHTML(url);
}
