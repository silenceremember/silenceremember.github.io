/**
 * Инициализирует загрузчик SVG (обертка для обратной совместимости)
 */
import { SvgLoader } from './svg/SvgLoader.js';

const svgLoader = new SvgLoader();

export default async function initSvgLoader() {
  return svgLoader.init();
}
