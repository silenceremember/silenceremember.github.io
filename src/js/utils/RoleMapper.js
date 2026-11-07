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
  // На карточках показываем только командные роли; «Соло» очевидно по умолчанию
  if (role === 'solo' && !detailed) return '';
  const roleKeyMap = {
    solo: detailed ? 'soloDetailed' : 'solo',
    'team-lead': detailed ? 'teamLeadDetailed' : 'teamLead',
    team: 'team',
    'art-director': 'artDirector',
    'game-designer': 'gameDesigner',
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

/**
 * Подпись в подвале карточки: командная роль и «В разработке», если проект не закончен
 */
export function getCardFooterLabel(project) {
  const parts = [getRoleLabel(project.role, false, project.teamName)];
  if (project.status === 'in-development') {
    parts.push(localization.t('projects.filters.statuses.inDevelopment'));
  }
  return parts.filter(Boolean).join(' · ');
}

/**
 * Ключ подписи ссылки карточки по месту назначения: кейс на сайте, Google Sites, документ и т. д.
 * @param {Object} project - Данные проекта
 * @returns {string} Ключ локализации
 */
export function getDetailsKey(project) {
  const links = project.links || {};
  if (links.case) return 'projects.card.details';
  const url = links.site || links.concept || links.presentation || links.document || '';
  if (url.includes('sites.google.com')) return 'projects.card.linkGoogleSites';
  if (links.site) return 'projects.card.linkSite';
  if (url.includes('/spreadsheets/')) return 'projects.card.linkSheet';
  if (url.includes('/presentation/')) return 'projects.card.linkSlides';
  if (url.includes('/document/')) return 'projects.card.linkDoc';
  return 'projects.card.detailsExternal';
}
