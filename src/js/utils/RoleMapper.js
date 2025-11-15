/**
 * Унифицированный маппинг ролей для проектов
 * Используется на главной странице и в портфолио
 */

/**
 * Маппинг ролей на читаемые значения
 */
const ROLE_LABELS = {
  'solo': 'Соло',
  'team-lead': 'Тимлид',
  'team': 'В команде'
};

/**
 * Маппинг ролей для главной страницы (более детальные описания)
 */
const ROLE_LABELS_DETAILED = {
  'solo': 'Соло-разработчик',
  'team-lead': 'Гейм-дизайнер / Тимлид',
  'team': 'В команде'
};

/**
 * Получает читаемое название роли
 * @param {string} role - Код роли (solo, team-lead, team)
 * @param {boolean} detailed - Использовать детальное описание (для главной страницы)
 * @param {string} teamName - Название команды (опционально, для добавления в скобках)
 * @returns {string} Читаемое название роли
 */
export function getRoleLabel(role, detailed = false, teamName = null) {
  const labels = detailed ? ROLE_LABELS_DETAILED : ROLE_LABELS;
  let label = labels[role] || role;
  
  // Если есть название команды и роль team-lead, добавляем его в скобках
  if (teamName && role === 'team-lead' && detailed) {
    label = `${label} (команда ${teamName})`;
  }
  
  return label;
}

/**
 * Получает все доступные роли
 * @returns {string[]} Массив кодов ролей
 */
export function getAvailableRoles() {
  return Object.keys(ROLE_LABELS);
}

/**
 * Маппинг ролей на читаемые значения
 */
export { ROLE_LABELS };

/**
 * Маппинг ролей для главной страницы (более детальные описания)
 */
export { ROLE_LABELS_DETAILED };

