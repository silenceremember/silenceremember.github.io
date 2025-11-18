/**
 * Утилита для централизованного форматирования дат и периодов
 * Предоставляет статические методы для работы с датами в различных форматах
 */
export class DateFormatter {
  /**
   * Форматирует период для отображения
   * @param {Object} period - Объект периода с полями start, end, duration
   * @param {string} [period.start] - Начало периода (формат "YYYY-MM" или "YYYY")
   * @param {string} [period.end] - Конец периода (формат "YYYY-MM" или "YYYY", по умолчанию "настоящее время")
   * @param {string} [period.duration] - Длительность периода
   * @param {Object} [period.durationLocalized] - Локализованная длительность периода
   * @param {string} [lang] - Язык для локализации (по умолчанию 'ru')
   * @returns {string} Отформатированная строка периода в формате "start — end (duration)"
   */
  static formatPeriod(period, lang = 'ru') {
    if (!period) return '';

    let start = period.start || '';
    let end = period.end || (lang === 'en' ? 'present' : 'настоящее время');
    
    // Форматируем даты для английского языка
    if (lang === 'en') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Форматируем начальную дату
      if (start && start.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = start.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        start = `${monthNames[monthIndex]} ${year}`;
      } else if (start && start.match(/^\d{4}$/)) {
        start = start;
      }
      
      // Форматируем конечную дату
      if (end && end.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = end.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        end = `${monthNames[monthIndex]} ${year}`;
      } else if (end && end.match(/^\d{4}$/)) {
        end = end;
      }
    }
    
    // Используем локализованную продолжительность, если доступна
    let duration = '';
    if (period.durationLocalized && period.durationLocalized[lang]) {
      duration = ` (${period.durationLocalized[lang]})`;
    } else if (period.duration) {
      duration = ` (${period.duration})`;
    }

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
