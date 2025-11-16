/**
 * Утилита для централизованного форматирования дат и периодов
 */
export class DateFormatter {
  /**
   * Форматирует период для отображения
   * @param {Object} period - Объект периода с полями start, end, duration
   * @param {string} [period.start] - Начало периода
   * @param {string} [period.end] - Конец периода (по умолчанию "настоящее время")
   * @param {string} [period.duration] - Длительность периода
   * @returns {string} Отформатированная строка периода в формате "start — end (duration)"
   */
  static formatPeriod(period) {
    if (!period) return '';
    
    const start = period.start || '';
    const end = period.end || 'настоящее время';
    const duration = period.duration ? ` (${period.duration})` : '';
    
    return `${start} — ${end}${duration}`;
  }

  /**
   * Форматирует дату для отображения
   * @param {Object} date - Объект даты с полями year, start, end
   * @param {number} [date.year] - Год
   * @param {string} [date.start] - Начальная дата (ISO строка)
   * @param {string} [date.end] - Конечная дата (ISO строка)
   * @returns {string} Отформатированная строка даты
   */
  static formatDate(date) {
    if (!date) return '';
    
    if (date.year) {
      return date.year.toString();
    }
    
    if (date.start && date.end) {
      const startDate = new Date(date.start);
      const endDate = new Date(date.end);
      
      return `${startDate.getDate()}.${String(startDate.getMonth() + 1).padStart(2, '0')}.${startDate.getFullYear()} — ${endDate.getDate()}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${endDate.getFullYear()}`;
    }
    
    if (date.start) {
      const startDate = new Date(date.start);
      return `${startDate.getDate()}.${String(startDate.getMonth() + 1).padStart(2, '0')}.${startDate.getFullYear()}`;
    }
    
    return '';
  }

  /**
   * Извлекает год из объекта даты
   * @param {Object} date - Объект даты с полями year, start, end
   * @param {number} [date.year] - Год
   * @param {string} [date.start] - Начальная дата (ISO строка)
   * @param {string} [date.end] - Конечная дата (ISO строка)
   * @returns {number|null} Год или null, если год не может быть извлечен
   */
  static getYearFromDate(date) {
    if (date.year) {
      return date.year;
    }
    if (date.start) {
      return new Date(date.start).getFullYear();
    }
    if (date.end) {
      return new Date(date.end).getFullYear();
    }
    return null;
  }
}


