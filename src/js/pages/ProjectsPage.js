/**
 * Страница проектов - загрузка и отображение проектов из JSON
 */

import { BasePage } from './BasePage.js';
import { loadData } from '../utils/DataLoader.js';
import { CardFactory } from '../factories/CardFactory.js';
import { ProjectFiltersManager } from '../managers/ProjectFiltersManager.js';
import { ProjectGroupingManager } from '../managers/ProjectGroupingManager.js';
import { loadTemplate } from '../utils/TemplateLoader.js';

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
      this.projectCardTemplate = await loadTemplate(
        '/components/project-card.html',
        '.project-card',
        (url) => this.loadHTML(url)
      );
    }
    return this.projectCardTemplate;
  }

  /**
   * Загружает данные проектов из JSON
   */
  async loadProjectsData() {
    try {
      const data = await loadData('/data/projects.json');
      return data.projects || [];
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
      return [];
    }
  }

  /**
   * Открывает детальную страницу проекта
   */
  openProjectDetails(project) {
    // TODO: Реализовать модальное окно с деталями проекта
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
   * Инициализация страницы
   */
  async init() {
    await this.initBase();

    // Инициализируем сервис индикатора загрузки
    this.initLoadingIndicator('projects-loading', 'projects-loading-container');
    this.loadingIndicator.show();

    // Загружаем шаблон проекта
    await this.loadProjectTemplate();

    // Загружаем проекты
    const projects = await this.loadProjectsData();

    // Скрываем индикатор загрузки и ждем завершения fadeout
    await this.loadingIndicator.hide();

    if (projects.length === 0) {
      return;
    }

    // Сохраняем проекты для группировки
    this.allProjects = projects;

    // Создаем карточки проектов и сохраняем их
    projects.forEach((project) => {
      const card = CardFactory.createProjectCard(
        this.projectCardTemplate,
        project,
        (project) => this.openProjectDetails(project)
      );
      if (card) {
        this.allProjectCards.set(project.id, card);
      }
    });

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

    // Инициализируем фильтры
    await this.initFilters(projects);

    // Отображаем проекты с группировкой (без фильтров)
    await this.renderGroupedProjects();

    // Ждем полной загрузки страницы перед завершением инициализации
    await this.waitForPageReady();
  }
}
