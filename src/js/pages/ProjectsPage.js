/**
 * Страница проектов - загрузка и отображение проектов из JSON
 */

import { BasePage } from './BasePage.js';
import { LayoutManager } from '../layout/LayoutManager.js';
import { loadData } from '../utils/DataLoader.js';
import { CardFactory } from '../factories/CardFactory.js';
import { LoadingIndicatorService } from '../services/LoadingIndicatorService.js';
import { ProjectFiltersManager } from '../managers/ProjectFiltersManager.js';
import { ProjectGroupingManager } from '../managers/ProjectGroupingManager.js';

const layoutManager = new LayoutManager();
const loadHTML = (url) => layoutManager.loadHTML(url);

/**
 * Класс страницы проектов
 */
export class ProjectsPage extends BasePage {
  constructor() {
    super({
      navigationSelector: '.projects-navigation',
      imageSelector: '.project-card-image'
    });
    this.filtersManager = null;
    this.groupingManager = null;
    this.loadingIndicator = null;
    this.projectCardTemplate = null;
    this.allProjects = [];
    this.allProjectCards = new Map();
  }

  /**
   * Загружает шаблон карточки проекта
   */
  async loadProjectCardTemplate() {
    if (!this.projectCardTemplate) {
      try {
        const cardHTML = await loadHTML('/components/project-card.html');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        this.projectCardTemplate = tempDiv.querySelector('.project-card') || tempDiv.firstElementChild;
        if (!this.projectCardTemplate) {
          console.error('Не удалось найти шаблон карточки проекта');
        }
      } catch (error) {
        console.error('Ошибка загрузки шаблона карточки:', error);
      }
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
    console.log('Открытие проекта:', project.title);
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
          }
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
    this.loadingIndicator = new LoadingIndicatorService('projects-loading', 'projects-grid');
    this.loadingIndicator.init();

    // Загружаем шаблон карточки проекта
    await this.loadProjectCardTemplate();
    
    // Загружаем проекты
    const projects = await this.loadProjectsData();
    
    // Скрываем индикатор загрузки и ждем завершения fadeout
    await this.loadingIndicator.hide();
    
    if (projects.length === 0) {
      const grid = document.getElementById('projects-grid');
      if (grid) {
        grid.innerHTML = '<h2 class="projects-empty-title">ПРОЕКТЫ НЕ НАЙДЕНЫ</h2><p class="projects-empty-subtitle">ПОПРОБУЙТЕ ИЗМЕНИТЬ ФИЛЬТРЫ</p>';
      }
      return;
    }
    
    // Сохраняем проекты для группировки
    this.allProjects = projects;
    
    // Создаем карточки проектов и сохраняем их
    projects.forEach(project => {
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
          onHideLoading: () => this.loadingIndicator.hide()
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
  }
}

