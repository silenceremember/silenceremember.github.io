/**
 * Унифицированный маппинг ролей для проектов
 * Используется на главной странице и в портфолио
 */
import { localization } from './Localization.js';

/**
 * Получает читаемое название роли
 * @param {string} role - Код роли (solo, team-lead, team)
 * @param {boolean} detailed - Использовать детальное описание (для главной страницы)
 * @param {string} teamName - Название команды (опционально, для добавления в скобках)
 * @returns {string} Читаемое название роли
 */
export function getRoleLabel(role, detailed = false, teamName = null) {
  const roleKeyMap = {
    solo: detailed ? 'soloDetailed' : 'solo',
    'team-lead': detailed ? 'teamLeadDetailed' : 'teamLead',
    team: 'team',
  };
  
  const key = roleKeyMap[role];
  let label = key ? localization.t(`roles.${key}`) : role;

  // Если есть название команды и роль team-lead, добавляем его в скобках
  if (teamName && role === 'team-lead' && detailed) {
    const teamNameLabel = localization.t('roles.teamName');
    label = `${label} (${teamNameLabel} ${teamName})`;
  }

  return label;
}
