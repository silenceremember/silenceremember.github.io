/**
 * Статическая страница (кейсы, услуги): контент уже в HTML,
 * JS подключает только общие компоненты (шапка, подвал, тема, язык).
 */
import { BasePage } from './BasePage.js';

export class StaticPage extends BasePage {
  constructor() {
    super({
      navigationSelector: '.page-navigation',
      imageSelector: '.case-page img',
    });
  }

  async init() {
    await this.initBase();
  }
}
