/**
 * Фабрика для создания различных типов карточек
 */
import { getRoleLabel } from '../utils/RoleMapper.js';
import { StatusMapper } from '../utils/StatusMapper.js';
import { localization } from '../utils/Localization.js';

export class CardFactory {
  /**
   * Создает карточку проекта
   * @param {HTMLElement} template - Шаблон карточки
   * @param {Object} project - Данные проекта
   * @param {string} project.title - Название проекта
   * @param {string} project.description - Краткое описание проекта
   * @param {number} project.year - Год проекта
   * @param {string} project.status - Статус проекта
   * @param {string} project.category - Категория проекта
   * @param {string} project.type - Тип проекта
   * @param {string} project.role - Роль в проекте
   * @param {Array<string>} project.tags - Теги проекта
   * @param {Object} project.media - Медиа файлы проекта
   * @param {boolean} [project.featured] - Флаг избранного проекта
   * @param {number} [project.tier] - Тир проекта (2 для тир 2)
   * @param {boolean} [project.comingSoon] - Флаг "скоро"
   * @param {Function} onCardClick - Обработчик клика на карточку
   * @returns {HTMLElement} Созданная карточка
   */
  static createProjectCard(template, project, onCardClick) {
    if (!template) return null;

    const card = template.cloneNode(true);

    // Заполняем данные
    const title = card.querySelector('.project-card-title');
    const description = card.querySelector('.project-card-description');
    const image = card.querySelector('.project-card-image');
    const tags = card.querySelector('.project-card-tags');
    const status = card.querySelector('.project-card-status');
    const category = card.querySelector('.project-card-category');
    const type = card.querySelector('.project-card-type');
    const year = card.querySelector('.project-card-year');
    const role = card.querySelector('.project-card-role');

    if (title) {
      // Используем локализованную версию названия если доступна
      const lang = localization.getCurrentLanguage();
      if (project.titleLocalized && project.titleLocalized[lang]) {
        title.textContent = project.titleLocalized[lang];
      } else {
        title.textContent = project.title;
      }
    }
    if (description) {
      // Используем локализованную версию описания если доступна
      const lang = localization.getCurrentLanguage();
      if (project.descriptionLocalized && project.descriptionLocalized[lang]) {
        description.textContent = project.descriptionLocalized[lang];
      } else {
        description.textContent = project.description || '';
      }
    }
    if (image && project.media?.preview) {
      // Используем data-src для ленивой загрузки через Intersection Observer
      image.dataset.src = project.media.preview;
      image.alt = project.title;
      image.loading = 'lazy';
      image.decoding = 'async';
      // Устанавливаем placeholder для предотвращения layout shift
      image.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
      image.onerror = function () {
        this.src = 'assets/images/portrait-placeholder.svg';
      };
    }

    // Теги
    if (tags && project.tags?.length) {
      tags.innerHTML = '';
      project.tags.forEach((tag) => {
        const tagEl = document.createElement('span');
        tagEl.className = 'project-card-tag';
        tagEl.textContent = tag;
        tags.appendChild(tagEl);
      });
    }

    // Статус
    if (status) {
      const statusKey = project.status === 'completed' ? 'completed' : 'inDevelopment';
      status.textContent = localization.t(`projects.filters.statuses.${statusKey}`);
      status.className = `project-card-status project-card-status-${project.status}`;
    }

    // Мета-информация
    if (category) {
      category.style.display = 'none';
    }

    if (type) {
      const typeLabels = {
        game: localization.t('projects.card.types.game'),
        document: localization.t('projects.card.types.document'),
        tool: localization.t('projects.card.types.tool'),
        script: localization.t('projects.card.types.script'),
      };
      type.textContent = typeLabels[project.type] || project.type;
    }

    // Добавляем звездочку для избранных проектов (тир 1)
    if (project.featured && title) {
      const starIcon = document.createElement('span');
      starIcon.className = 'project-card-star';
      starIcon.setAttribute('data-svg-src', 'assets/images/icon-star.svg');
      starIcon.setAttribute('aria-label', localization.t('projects.card.featured'));
      title.appendChild(starIcon);
    }

    // Добавляем акцентный прочерк для тир 2 проектов
    if (project.tier === 2 && title) {
      const dividerIcon = document.createElement('span');
      dividerIcon.className = 'project-card-divider';
      dividerIcon.setAttribute('data-svg-src', 'assets/images/icon-divider-small.svg');
      dividerIcon.setAttribute('aria-label', localization.t('projects.card.tier2'));
      title.appendChild(dividerIcon);
    }

    if (year && project.year) {
      year.textContent = project.year;
    }

    if (role) {
      role.textContent = getRoleLabel(project.role, false, project.teamName);
    }

    // Добавляем data-атрибуты
    card.setAttribute('data-project-id', project.id);
    card.setAttribute('data-category', project.category);
    card.setAttribute('data-type', project.type);
    card.setAttribute('data-status', project.status);
    if (project.year) {
      card.setAttribute('data-year', project.year.toString());
    }

    // Обработчик клика
    card.addEventListener('click', (e) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        return;
      }
      e.stopPropagation();
      // Не открываем для проектов "скоро"
      if (!project.comingSoon && onCardClick) {
        onCardClick(project);
      }
    });

    // Кнопка "Подробнее" или "Скоро"
    const detailsButton = card.querySelector('.project-card-button');
    if (detailsButton) {
      // Если проект "скоро", меняем текст кнопки
      if (project.comingSoon) {
        detailsButton.textContent = localization.t('projects.card.comingSoon');
        detailsButton.disabled = true;
        detailsButton.setAttribute('aria-label', localization.t('projects.card.comingSoonAria'));
      }
      detailsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        // Не открываем для проектов "скоро"
        if (!project.comingSoon && onCardClick) {
          onCardClick(project);
        }
      });
    }

    return card;
  }

  /**
   * Создает карточку исследования
   * @param {HTMLElement} template - Шаблон карточки
   * @param {Object} publication - Данные публикации
   * @param {string} publication.title - Название публикации
   * @param {string} publication.type - Тип публикации
   * @param {string} publication.journal - Журнал публикации
   * @param {string} publication.location - Местоположение публикации
   * @param {string} publication.level - Уровень публикации
   * @param {Object} publication.links - Ссылки на документы
   * @param {Array<string>} publication.keywords - Ключевые слова
   * @param {string} publication.status - Статус публикации
   * @returns {HTMLElement} Созданная карточка
   */
  static createResearchCard(template, publication) {
    if (!template) return null;

    const card = template.cloneNode(true);

    // Заполняем данные
    const title = card.querySelector('.research-card-title');
    const type = card.querySelector('.research-card-type');
    const keywords = card.querySelector('.research-card-keywords');
    const button = card.querySelector('.research-card-button');

    if (title) {
      // Используем локализованную версию названия если доступна
      const lang = localization.getCurrentLanguage();
      if (publication.titleLocalized && publication.titleLocalized[lang]) {
        title.textContent = publication.titleLocalized[lang];
      } else {
        title.textContent = publication.title;
      }
    }

    // Журнал и уровень
    const journalWrapper = card.querySelector('.research-card-journal-wrapper');
    if (journalWrapper) {
      const journal = journalWrapper.querySelector('.research-card-journal');
      const level = journalWrapper.querySelector('.research-card-level');

      if (journal && publication.journal) {
        let journalText = publication.journal;
        if (publication.location) {
          journalText += ` (${publication.location})`;
        }
        journal.textContent = journalText;
      } else if (journal) {
        journal.style.display = 'none';
      }

      if (level && publication.level) {
        level.textContent = publication.level;
      } else if (level) {
        level.style.display = 'none';
      }

      const journalVisible =
        journal && publication.journal && journal.style.display !== 'none';
      const levelVisible =
        level && publication.level && level.style.display !== 'none';
      if (!journalVisible && !levelVisible) {
        journalWrapper.style.display = 'none';
      }
    }

    // Тип
    if (type) {
      type.textContent = StatusMapper.getTypeText(publication.type);
    }

    // Ключевые слова
    if (keywords && publication.keywords && publication.keywords.length > 0) {
      keywords.innerHTML = '';
      publication.keywords.forEach((keyword) => {
        const keywordEl = document.createElement('span');
        keywordEl.className = 'research-card-keyword';
        keywordEl.textContent = keyword;
        keywords.appendChild(keywordEl);
      });
    } else if (keywords) {
      keywords.style.display = 'none';
    }

    // Получаем URL для открытия из links
    const getPublicationUrl = () => {
      if (publication.links && Object.keys(publication.links).length > 0) {
        const firstLink = Object.values(publication.links)[0];
        if (firstLink) {
          return firstLink.startsWith('http') ? firstLink : `/${firstLink}`;
        }
      }
      return null;
    };

    const publicationUrl = getPublicationUrl();

    // Кнопка PDF
    if (button) {
      if (publicationUrl) {
        button.textContent = localization.t('research.card.read');
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(publicationUrl, '_blank', 'noopener,noreferrer');
        });
      } else {
        button.disabled = true;
        button.textContent = localization.t('projects.card.comingSoon');
        button.setAttribute('aria-label', localization.t('projects.card.comingSoonAria'));
      }
    }

    // Обработчик клика для открытия документа
    if (publicationUrl) {
      card.addEventListener('click', (e) => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          return;
        }
        e.stopPropagation();
        window.open(publicationUrl, '_blank', 'noopener,noreferrer');
      });
    } else {
      // Для исследований без ссылок предотвращаем открытие при клике
      card.addEventListener('click', (e) => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          return;
        }
        e.stopPropagation();
        // Не открываем для исследований без ссылок
      });
    }

    // Добавляем data-атрибуты
    card.setAttribute('data-research-id', publication.id);
    card.setAttribute('data-type', publication.type);
    card.setAttribute('data-status', publication.status);

    // Особый класс для ВКР
    if (publication.type === 'diploma') {
      card.classList.add('research-card-diploma');
    }

    // Оптимизация: динамически управляем will-change только во время hover анимации
    let hoverTimeout = null;
    card.addEventListener('mouseenter', () => {
      card.style.willChange = 'transform';
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
    });

    card.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        card.style.willChange = 'auto';
        hoverTimeout = null;
      }, 300);
    });

    return card;
  }

  /**
   * Создает карточку сообщества
   * @param {Object} config - Конфигурация карточки
   * @param {string} config.url - URL ссылки
   * @param {string} config.iconPath - Путь к иконке
   * @param {string} config.platformName - Название платформы
   * @param {string} config.ariaLabel - ARIA label
   * @param {string} config.description - Описание (опционально)
   * @param {string} config.subtitle - Подзаголовок (опционально)
   * @param {boolean} config.isDiscord - Использовать стиль Discord карточки
   * @returns {HTMLElement} Созданная карточка
   */
  static createCommunityCard(config) {
    const {
      url,
      iconPath,
      platformName,
      ariaLabel,
      description,
      subtitle,
      isDiscord,
    } = config;

    if (isDiscord) {
      return this.createDiscordCard(
        url,
        iconPath,
        platformName,
        ariaLabel,
        description,
        subtitle
      );
    }

    const card = document.createElement('a');
    card.href = url || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.className = 'community-card';
    card.setAttribute('aria-label', ariaLabel);

    const content = document.createElement('div');
    content.className = 'community-card-content';

    const title = document.createElement('h3');
    title.className = 'community-card-title';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'community-card-icon';

    const iconSpan = document.createElement('span');
    iconSpan.setAttribute('data-svg-src', iconPath);
    iconContainer.appendChild(iconSpan);

    title.appendChild(iconContainer);

    const titleText = document.createElement('span');
    titleText.className = 'community-card-title-text';
    titleText.textContent = platformName;
    title.appendChild(titleText);

    content.appendChild(title);

    if (subtitle) {
      const subtitleElement = document.createElement('p');
      subtitleElement.className = 'community-card-subtitle';
      subtitleElement.textContent = subtitle;
      content.appendChild(subtitleElement);
    }

    if (description) {
      const descriptionElement = document.createElement('p');
      descriptionElement.className = 'community-card-description';
      descriptionElement.textContent = description;
      content.appendChild(descriptionElement);
    }

    card.appendChild(content);

    return card;
  }

  /**
   * Создает карточку Discord с горизонтальной раскладкой
   */
  static createDiscordCard(
    url,
    iconPath,
    platformName,
    ariaLabel,
    description,
    subtitle
  ) {
    const card = document.createElement('a');
    card.href = url || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.className = 'community-card community-card-discord';
    card.setAttribute('aria-label', ariaLabel);

    const content = document.createElement('div');
    content.className = 'community-card-content';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'community-card-icon community-card-icon-left';

    const iconSpan = document.createElement('span');
    iconSpan.setAttribute('data-svg-src', iconPath);
    iconContainer.appendChild(iconSpan);

    content.appendChild(iconContainer);

    const textBlock = document.createElement('div');
    textBlock.className = 'community-card-text-block';

    const title = document.createElement('h3');
    title.className = 'community-card-title';

    const titleText = document.createElement('span');
    titleText.className = 'community-card-title-text';
    titleText.textContent = platformName;
    title.appendChild(titleText);

    textBlock.appendChild(title);

    if (subtitle) {
      const subtitleElement = document.createElement('p');
      subtitleElement.className = 'community-card-subtitle';
      subtitleElement.textContent = subtitle;
      textBlock.appendChild(subtitleElement);
    }

    if (description) {
      const descriptionElement = document.createElement('p');
      descriptionElement.className = 'community-card-description';
      descriptionElement.textContent = description;
      textBlock.appendChild(descriptionElement);
    }

    content.appendChild(textBlock);
    card.appendChild(content);

    return card;
  }
}
