/**
 * Страница проектов - загрузка и отображение проектов из JSON
 */

import { BasePage } from './BasePage.js';
import { CardFactory } from '../factories/CardFactory.js';
import { ProjectFiltersManager } from '../managers/ProjectFiltersManager.js';
import { ProjectGroupingManager } from '../managers/ProjectGroupingManager.js';
import { PageReadyManager } from '../utils/PageReady.js';
import { lazyImageLoader } from '../utils/LazyImageLoader.js';

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
      window.open(project.links.site, '_blank');
      return;
    }
    
    // Если есть другие ссылки, открываем первую доступную
    if (project.links && Object.keys(project.links).length > 0) {
      const firstLink = Object.values(project.links)[0];
      if (firstLink) {
        window.open(firstLink, '_blank');
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
  }
}
