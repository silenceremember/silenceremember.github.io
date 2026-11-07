/**
 * Утилита для загрузки и парсинга HTML шаблонов
 * Унифицирует процесс загрузки шаблонов компонентов
 */

/**
 * Загружает HTML шаблон и возвращает элемент по селектору
 * @param {string} url - URL шаблона
 * @param {string} selector - CSS селектор для поиска элемента в шаблоне
 * @param {Function} loadHTMLFunction - Функция для загрузки HTML (обычно this.loadHTML из BasePage)
 * @returns {Promise<HTMLElement|null>} Найденный элемент или null если не найден
 * @throws {Error} Если loadHTMLFunction не предоставлена
 */
export async function loadTemplate(url, selector, loadHTMLFunction) {
  if (!loadHTMLFunction) {
    throw new Error('loadHTMLFunction is required');
  }

  try {
    const templateHTML = await loadHTMLFunction(url);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = templateHTML;

    const element = selector
      ? tempDiv.querySelector(selector) || tempDiv.firstElementChild
      : tempDiv.firstElementChild;

    if (!element) {
      console.error(
        `Не удалось найти элемент в шаблоне ${url} по селектору ${selector || 'firstElementChild'}`
      );
      return null;
    }

    return element;
  } catch (error) {
    console.error(`Ошибка загрузки шаблона ${url}:`, error);
    return null;
  }
}
