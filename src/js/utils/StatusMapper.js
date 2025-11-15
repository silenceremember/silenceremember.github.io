/**
 * Утилита для маппинга статусов и типов на русский язык
 */
export class StatusMapper {
  /**
   * Получает текст статуса на русском языке
   * @param {string} status - Код статуса
   * @returns {string} Текст статуса на русском или исходный код, если маппинг не найден
   */
  static getStatusText(status) {
    const statusMap = {
      'published': 'Опубликовано',
      'in-publication': 'На стадии публикации',
      'in-progress': 'В процессе написания'
    };
    return statusMap[status] || status;
  }

  /**
   * Получает текст типа на русском языке
   * @param {string} type - Код типа
   * @returns {string} Текст типа на русском или исходный код, если маппинг не найден
   */
  static getTypeText(type) {
    const typeMap = {
      'thesis': 'Тезисы',
      'article': 'Статья',
      'diploma': 'Дипломная работа'
    };
    return typeMap[type] || type;
  }
}

