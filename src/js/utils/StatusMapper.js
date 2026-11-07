/**
 * Утилита для маппинга статусов и типов публикаций на русский язык
 */
import { localization } from './Localization.js';

export class StatusMapper {

  /**
   * Получает текст типа на текущем языке
   * @param {string} type - Код типа
   * @returns {string} Текст типа на текущем языке или исходный код, если маппинг не найден
   */
  static getTypeText(type) {
    const typeKeyMap = {
      thesis: 'thesis',
      article: 'article',
      diploma: 'diploma',
      certificate: 'certificate',
    };
    const key = typeKeyMap[type];
    if (key) {
      return localization.t(`research.types.${key}`);
    }
    return type;
  }
}
