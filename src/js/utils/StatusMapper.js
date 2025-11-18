/**
 * Утилита для маппинга статусов и типов публикаций на русский язык
 */
import { localization } from './Localization.js';

export class StatusMapper {
  /**
   * Получает текст статуса на текущем языке
   * @param {string} status - Код статуса
   * @returns {string} Текст статуса на текущем языке или исходный код, если маппинг не найден
   */
  static getStatusText(status) {
    const statusKeyMap = {
      published: 'published',
      'in-publication': 'inPublication',
      'in-progress': 'inProgress',
    };
    const key = statusKeyMap[status];
    if (key) {
      return localization.t(`research.statuses.${key}`);
    }
    return status;
  }

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
    };
    const key = typeKeyMap[type];
    if (key) {
      return localization.t(`research.types.${key}`);
    }
    return type;
  }
}
