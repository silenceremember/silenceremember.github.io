/**
 * Страница проектов - загрузка и отображение проектов из JSON
 */

import { BasePage } from './BasePage.js';
import { CardFactory } from '../factories/CardFactory.js';
import { ProjectFiltersManager } from '../managers/ProjectFiltersManager.js';
import { ProjectGroupingManager } from '../managers/ProjectGroupingManager.js';
import { PageReadyManager } from '../utils/PageReady.js';
import { lazyImageLoader } from '../utils/LazyImageLoader.js';
import { localization } from '../utils/Localization.js';
import { getRoleLabel } from '../utils/RoleMapper.js';

/**
 * Класс страницы проектов
 */
export class ProjectsPage extends BasePage {
  /**
   * Создает экземпляр страницы проектов
   */
  constructor() {
    super({
      navigationSelector: '.projects-navigation',
      imageSelector: '.project-card-image',
    });
    this.filtersManager = null;
    this.groupingManager = null;
    this.projectCardTemplate = null;
    this.allProjects = [];
    this.allProjectCards = new Map();
  }

  /**
   * Загружает шаблон проекта
   */
  async loadProjectTemplate() {
    if (!this.projectCardTemplate) {
      this.projectCardTemplate = await this.loadPageTemplate(
        '/components/project-card.html',
        '.project-card'
      );
    }
    return this.projectCardTemplate;
  }

  /**
   * Загружает данные проектов из JSON
   */
  async loadProjectsData() {
    const projects = await this.loadPageDataArray('/data/projects.json', 'projects', []);
    // Автоматически устанавливаем "скоро" для проектов без ссылок
    return this.autoSetComingSoon(projects);
  }

  /**
   * Автоматически устанавливает comingSoon: true для проектов без ссылок
   * @param {Array<Object>} projects - Массив проектов
   * @returns {Array<Object>} Массив проектов с обновленным статусом comingSoon
   */
  autoSetComingSoon(projects) {
    return projects.map(project => {
      // Если comingSoon уже явно установлен, не меняем его
      if (project.comingSoon === true || project.comingSoon === false) {
        return project;
      }
      
      // Проверяем наличие ссылок
      const hasLinks = project.links && 
        typeof project.links === 'object' && 
        Object.keys(project.links).length > 0 &&
        Object.values(project.links).some(link => link && typeof link === 'string' && link.trim().length > 0);
      
      // Если ссылок нет, устанавливаем comingSoon: true
      if (!hasLinks) {
        return { ...project, comingSoon: true };
      }
      
      return project;
    });
  }

  /**
   * Открывает детальную страницу проекта
   */
  openProjectDetails(project) {
    // Не открываем для проектов "скоро"
    if (project.comingSoon) {
      return;
    }
    
    // Если есть ссылка на сайт, открываем её
    if (project.links && project.links.site) {
      window.open(project.links.site, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Если есть другие ссылки, открываем первую доступную
    if (project.links && Object.keys(project.links).length > 0) {
      const firstLink = Object.values(project.links)[0];
      if (firstLink) {
        window.open(firstLink, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    
    // TODO: Реализовать модальное окно с деталями проекта для проектов без ссылок
  }

  /**
   * Инициализирует фильтры
   */
  async initFilters(projects) {
    if (!this.filtersManager) {
      this.filtersManager = new ProjectFiltersManager(
        projects,
        this.allProjectCards,
        {
          onCardClick: (project) => this.openProjectDetails(project),
          onRenderGrouped: () => this.renderGroupedProjects(),
          onHideLoading: () => this.loadingIndicator.hide(),
          onExpandedSectionsClear: () => {
            if (this.groupingManager) {
              this.groupingManager.expandedSections.clear();
            }
          },
        }
      );
    } else {
      this.filtersManager.projects = projects;
      this.filtersManager.allProjectCards = this.allProjectCards;
    }

    await this.filtersManager.init(projects);
  }

  /**
   * Функция-обертка для renderGroupedProjects из менеджера группировки
   */
  async renderGroupedProjects() {
    if (!this.groupingManager) {
      console.warn('Менеджер группировки не инициализирован');
      return;
    }
    await this.groupingManager.renderGroupedProjects();
  }

  /**
   * Создает карточки проектов батчами для оптимизации производительности
   * @param {Array<Object>} projects - Массив проектов
   * @param {number} batchSize - Размер батча (по умолчанию 10)
   * @returns {Promise<void>}
   */
  async createProjectCardsBatched(projects, batchSize = 10) {
    return new Promise((resolve) => {
      let index = 0;

      const processBatch = () => {
        const end = Math.min(index + batchSize, projects.length);
        
        for (let i = index; i < end; i++) {
          const project = projects[i];
          const card = CardFactory.createProjectCard(
            this.projectCardTemplate,
            project,
            (project) => this.openProjectDetails(project)
          );
          if (card) {
            this.allProjectCards.set(project.id, card);
          }
        }

        index = end;

        if (index < projects.length) {
          // Используем requestIdleCallback для неблокирующей обработки
          if (window.requestIdleCallback) {
            requestIdleCallback(processBatch, { timeout: 100 });
          } else {
            setTimeout(processBatch, 0);
          }
        } else {
          resolve();
        }
      };

      processBatch();
    });
  }

  /**
   * Инициализация страницы
   */
  async init() {
    await this.initBase();

    // Инициализируем сервис индикатора загрузки
    this.initLoadingIndicator('projects-loading', 'projects-loading-container');
    this.loadingIndicator.show();

    // Параллельная загрузка шаблона и данных для ускорения
    const [projects] = await Promise.all([
      this.loadProjectsData(),
      this.loadProjectTemplate(),
    ]);
    
    // Скрываем индикатор загрузки сразу после загрузки данных (не ждем создания карточек)
    // Это улучшает воспринимаемую производительность
    const hideLoadingPromise = this.loadingIndicator.hide();

    if (projects.length === 0) {
      return;
    }

    // Сохраняем проекты для группировки
    this.allProjects = projects;

    // Ждем завершения скрытия индикатора загрузки параллельно с созданием карточек
    await Promise.all([
      hideLoadingPromise,
      this.createProjectCardsBatched(projects),
    ]);

    // Инициализируем менеджер группировки
    if (!this.groupingManager) {
      this.groupingManager = new ProjectGroupingManager(
        this.allProjects,
        this.allProjectCards,
        {
          onCardClick: (project) => this.openProjectDetails(project),
          onHideLoading: () => this.loadingIndicator.hide(),
        }
      );
    } else {
      this.groupingManager.projects = this.allProjects;
      this.groupingManager.allProjectCards = this.allProjectCards;
    }

    // Параллельная инициализация фильтров и рендеринг проектов
    const [renderPromise] = await Promise.all([
      this.renderGroupedProjects(),
      this.initFilters(projects), // Инициализируем фильтры параллельно
    ]);

    // Инициализируем ленивую загрузку изображений для всех карточек после рендеринга
    // Изображения уже начали загружаться в renderGroupedProjects, но убеждаемся что все обработаны
    requestAnimationFrame(() => {
      lazyImageLoader.loadAllImages();
    });

    // Не ждем загрузки всех изображений - они загружаются лениво
    // Ждем только критичные ресурсы (шрифты и базовые изображения)
    await PageReadyManager.waitForFontsLoaded();

    // Подписываемся на изменения языка
    this.languageChangeHandler = () => {
      this.updateContentLanguage();
    };
    this.updateContentLanguage();
    window.addEventListener('languageChanged', this.languageChangeHandler);
  }

  /**
   * Обновляет язык динамического контента
   */
  updateContentLanguage() {
    // Обновляем карточки проектов
    this.allProjectCards.forEach((card, projectId) => {
      const project = this.allProjects.find(p => p.id === projectId);
      if (project) {
        // Обновляем название
        const title = card.querySelector('.project-card-title');
        if (title) {
          const lang = localization.getCurrentLanguage();
          if (project.titleLocalized && project.titleLocalized[lang]) {
            title.textContent = project.titleLocalized[lang];
          } else {
            title.textContent = project.title;
          }
        }

        // Обновляем описание
        const description = card.querySelector('.project-card-description');
        if (description) {
          const lang = localization.getCurrentLanguage();
          if (project.descriptionLocalized && project.descriptionLocalized[lang]) {
            description.textContent = project.descriptionLocalized[lang];
          } else {
            description.textContent = project.description || '';
          }
        }

        // Обновляем статус
        const status = card.querySelector('.project-card-status');
        if (status) {
          const statusKey = project.status === 'completed' ? 'completed' : 'inDevelopment';
          status.textContent = localization.t(`projects.filters.statuses.${statusKey}`);
        }

        // Обновляем тип
        const type = card.querySelector('.project-card-type');
        if (type && project.type) {
          const typeLabels = {
            game: localization.t('projects.card.types.game'),
            document: localization.t('projects.card.types.document'),
            tool: localization.t('projects.card.types.tool'),
            script: localization.t('projects.card.types.script'),
          };
          type.textContent = typeLabels[project.type] || project.type;
        }

        // Обновляем роль
        const role = card.querySelector('.project-card-role');
        if (role) {
          role.textContent = getRoleLabel(project.role, false, project.teamName);
        }

        // Обновляем кнопку
        const button = card.querySelector('.project-card-button');
        if (button) {
          if (project.comingSoon) {
            button.textContent = localization.t('projects.card.comingSoon');
            button.setAttribute('aria-label', localization.t('projects.card.comingSoonAria'));
          } else {
            const buttonText = button.querySelector('span[data-i18n]') || button;
            if (buttonText.textContent) {
              buttonText.textContent = localization.t('projects.card.details');
            }
            button.setAttribute('aria-label', localization.t('projects.card.detailsAria'));
          }
        }
      }
    });

    // Обновляем фильтры через менеджер фильтров
    if (this.filtersManager) {
      // Обновляем заголовки групп фильтров - находим по родительским элементам
      const filtersContent = document.querySelector('.project-filters-content');
      if (filtersContent) {
        const filterGroups = filtersContent.querySelectorAll('.project-filters-group');
        filterGroups.forEach((group, index) => {
          const title = group.querySelector('.project-filters-group-title');
          if (title) {
            // Определяем тип фильтра по data-filter атрибуту дочернего элемента
            const filterOptions = group.querySelector('[data-filter]');
            if (filterOptions) {
              const filterType = filterOptions.getAttribute('data-filter');
              const keyMap = {
                'category': 'projects.filters.category',
                'status': 'projects.filters.status',
                'year': 'projects.filters.year',
              };
              if (keyMap[filterType]) {
                title.textContent = localization.t(keyMap[filterType]);
              }
            } else {
              // Если нет data-filter, используем data-i18n
              const key = title.getAttribute('data-i18n');
              if (key) {
                title.textContent = localization.t(key);
              }
            }
          }
        });
      }

      // Также обновляем через data-i18n на всякий случай
      document.querySelectorAll('.project-filters-group-title').forEach(title => {
        const key = title.getAttribute('data-i18n');
        if (key) {
          title.textContent = localization.t(key);
        }
      });

      // Обновляем метки опций фильтров
      document.querySelectorAll('.project-filters-option-label').forEach(label => {
        const key = label.getAttribute('data-i18n');
        if (key) {
          label.textContent = localization.t(key);
        } else {
          // Обновляем по data-value если нет data-i18n
          const button = label.closest('.project-filters-option');
          if (button) {
            const value = button.getAttribute('data-value');
            const filterType = button.closest('[data-filter]')?.getAttribute('data-filter');
            
            if (filterType === 'category') {
              const categoryMap = {
                'games': 'projects.filters.categories.games',
                'tools': 'projects.filters.categories.tools',
                'research': 'projects.filters.categories.research',
              };
              if (categoryMap[value]) {
                label.textContent = localization.t(categoryMap[value]);
              }
            } else if (filterType === 'status') {
              const statusMap = {
                'completed': 'projects.filters.statuses.completed',
                'in-development': 'projects.filters.statuses.inDevelopment',
              };
              if (statusMap[value]) {
                label.textContent = localization.t(statusMap[value]);
              }
            }
          }
        }
      });

      // Обновляем кнопку сброса
      const resetButton = document.getElementById('project-filters-reset');
      if (resetButton) {
        const resetButtonText = resetButton.querySelector('.projects-section-expand-text');
        if (resetButtonText) {
          resetButtonText.textContent = localization.t('projects.filters.reset');
        }
        resetButton.setAttribute('aria-label', localization.t('projects.filters.resetAria'));
      }

      const foundText = document.querySelector('#project-filters-results .projects-section-title-text');
      if (foundText) {
        foundText.textContent = localization.t('projects.filters.found');
      }
    }

    // Обновляем группировку через менеджер группировки
    if (this.groupingManager) {
      // Обновляем заголовки секций
      const sectionTitles = {
        games: localization.t('projects.filters.categories.games'),
        tools: localization.t('projects.filters.categories.tools'),
        research: localization.t('projects.filters.categories.research'),
      };

      document.querySelectorAll('.projects-section-title-text').forEach(titleEl => {
        const section = titleEl.closest('.projects-section');
        if (section) {
          const category = section.getAttribute('data-category');
          if (category && sectionTitles[category]) {
            titleEl.textContent = sectionTitles[category];
          }
        }
      });

      // Кнопки "Показать все" / "Скрыть" обновляются
      document.querySelectorAll('.projects-section-expand-text').forEach(textEl => {
        const button = textEl.closest('.projects-section-expand');
        if (button && button.getAttribute('aria-expanded') === 'true') {
          textEl.textContent = localization.t('projects.filters.hide');
        } else if (button) {
          textEl.textContent = localization.t('projects.filters.showAll');
        }
      });
    }
  }

  /**
   * Очищает ресурсы
   */
  cleanup() {
    if (this.languageChangeHandler) {
      window.removeEventListener('languageChanged', this.languageChangeHandler);
    }
    super.cleanup?.();
  }
}
