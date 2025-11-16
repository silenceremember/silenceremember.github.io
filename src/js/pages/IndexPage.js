/**
 * Страница главной страницы - загрузка featured проектов
 */

import { BasePage } from './BasePage.js';
import { getRoleLabel } from '../utils/RoleMapper.js';
import { SlidesManager } from '../components/index.js';
import { backgroundImageService } from '../services/BackgroundImageService.js';
import { PageReadyManager } from '../utils/PageReady.js';

/**
 * Класс для главной страницы
 */
export class IndexPage extends BasePage {
  /**
   * Создает экземпляр страницы главной страницы
   */
  constructor() {
    super({
      navigationSelector: '#cta-section',
      imageSelector: '.slide[data-slide="0"] img',
    });
    this.slideAnimationManager = null;
    this.slidesContainer = null;
    this.slidesManager = null;
  }

  /**
   * Загружает данные проектов из JSON
   * @returns {Promise<Array>} Массив проектов
   */
  async loadProjectsData() {
    return this.loadPageDataArray('/data/projects.json', 'projects', []);
  }

  /**
   * Находит слайды проектов на странице
   * @returns {Array<HTMLElement>} Массив элементов слайдов проектов
   */
  getProjectSlides() {
    if (!this.slidesContainer) {
      return [];
    }

    return Array.from(
      this.slidesContainer.querySelectorAll('.slide[data-slide]')
    )
      .filter((slide) => {
        const slideIndex = parseInt(slide.getAttribute('data-slide'));
        return slideIndex > 0 && slideIndex < 4; // Слайды 1-3 для проектов, 4 - CTA
      })
      .sort((a, b) => {
        const indexA = parseInt(a.getAttribute('data-slide'));
        const indexB = parseInt(b.getAttribute('data-slide'));
        return indexA - indexB;
      });
  }

  /**
   * Заполняет слайд проекта данными
   * @param {HTMLElement} slideElement - Элемент слайда
   * @param {Object} project - Данные проекта
   * @param {number} slideIndex - Индекс слайда (0-based)
   */
  populateProjectSlide(slideElement, project, slideIndex = 0) {
    // Заголовок проекта
    const titleElement = slideElement.querySelector('.project-title');
    if (titleElement) {
      titleElement.textContent = project.title.toUpperCase();
    }

    // Мета-информация (жанр и платформа)
    const metaElement = slideElement.querySelector('.project-meta');
    if (metaElement && project.displayMeta) {
      const spans = metaElement.querySelectorAll('span');
      if (spans.length >= 2) {
        spans[0].textContent = project.displayMeta.genre;
        spans[1].textContent = project.displayMeta.platform;
      }
    }

    // Роль
    const roleElement = slideElement.querySelector(
      '.details-block:first-of-type .details-text'
    );
    if (roleElement) {
      const roleLabel = getRoleLabel(project.role, true, project.teamName);
      roleElement.textContent = roleLabel;
    }

    // Ключевой вклад
    const contributionElement = slideElement.querySelector(
      '.details-block:last-of-type .details-text'
    );
    if (contributionElement && project.keyContribution) {
      contributionElement.textContent = project.keyContribution;
    }

    // Изображения (если есть preview) - оптимизированная загрузка
    if (project.media?.preview) {
      const projectPlaceholder = slideElement.querySelector(
        '.project-placeholder'
      );
      if (projectPlaceholder) {
        // Первый слайд виден сразу, остальные загружаем лениво
        const isFirstSlide = slideIndex === 0;
        backgroundImageService.loadBackgroundImage(
          projectPlaceholder,
          project.media.preview,
          isFirstSlide
        );
      }

      // Заполняем preview изображения с ленивой загрузкой
      const previewPlaceholders = slideElement.querySelectorAll(
        '.preview-placeholder'
      );
      if (project.media.screenshots && project.media.screenshots.length > 0) {
        previewPlaceholders.forEach((placeholder, index) => {
          if (index < project.media.screenshots.length) {
            // Preview изображения всегда загружаем лениво
            backgroundImageService.loadBackgroundImage(
              placeholder,
              project.media.screenshots[index],
              false
            );
          }
        });
      }
    }
  }

  /**
   * Заполняет слайды проектов данными
   * @param {Array<Object>} featuredProjects - Массив featured проектов
   */
  populateProjectSlides(featuredProjects) {
    const projectSlides = this.getProjectSlides();

    if (projectSlides.length === 0) {
      console.warn('Слайды проектов не найдены');
      return;
    }

    // Берем только нужное количество проектов
    const projectsToShow = featuredProjects.slice(0, projectSlides.length);

    if (projectsToShow.length === 0) {
      console.warn('Featured проекты не найдены');
      return;
    }

    // Заполняем слайды данными проектов
    projectsToShow.forEach((project, index) => {
      if (index < projectSlides.length) {
        this.populateProjectSlide(projectSlides[index], project, index);
      }
    });
  }

  /**
   * Инициализирует менеджер анимаций слайдов (ленивая загрузка)
   */
  async initSlideAnimationManager() {
    if (!this.slidesContainer) {
      return;
    }

    if (!this.slideAnimationManager) {
      this.slideAnimationManager = await this.loadAnimationManager(
        '../managers/SlideAnimationManager.js',
        [this.slidesContainer]
      );
    }
    return this.slideAnimationManager;
  }

  /**
   * Инициализирует главную страницу
   */
  async init() {
    // Проверяем, есть ли слайды проектов на странице
    this.slidesContainer = document.querySelector('.slides-container');
    if (!this.slidesContainer) {
      return; // Не главная страница
    }

    // Инициализируем базовые компоненты (навигация, scroll-to-top, SVG)
    await this.initBase();

    // Инициализируем сервис индикатора загрузки
    this.initLoadingIndicator('index-loading', 'index-loading-container');
    this.loadingIndicator.show();

    // Параллельная загрузка данных и инициализация менеджера слайдов
    const projectsDataPromise = this.loadProjectsData();
    
    // Инициализируем менеджер слайдов сразу (не блокирует загрузку данных)
    this.slidesManager = new SlidesManager();
    this.slidesManager.init();
    
    const projectsData = await projectsDataPromise;

    // Скрываем индикатор загрузки и ждем завершения fadeout
    await this.loadingIndicator.hide();

    // Фильтруем featured проекты
    const featuredProjects = projectsData.filter(
      (project) => project.featured === true
    );

    // Заполняем слайды данными проектов
    this.populateProjectSlides(featuredProjects);

    // Инициализируем менеджер анимаций слайдов (ленивая загрузка)
    await this.initSlideAnimationManager();

    // Не ждем загрузки всех изображений - ждем только критичные (шрифты и первое изображение)
    // Остальные изображения загружаются лениво через BackgroundImageService
    await PageReadyManager.waitForFontsLoaded();
    
    // Небольшая задержка для гарантии готовности первого слайда
    await new Promise((resolve) => requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    }));

    if (this.slideAnimationManager) {
      this.slideAnimationManager.initializeFirstSlideAnimation();
    }
  }
}

/**
 * Скрывает элементы всех слайдов сразу при загрузке DOM
 * Это критично важно - нужно сделать до того как элементы станут видимыми
 * Вызывается как можно раньше, до полной инициализации страницы
 */
export async function hideAllSlideElementsEarly() {
  const slidesContainer = document.querySelector('.slides-container');
  if (!slidesContainer) return;

  try {
    // Используем динамический импорт для ленивой загрузки
    const { SlideAnimationManager } = await import(
      '../managers/SlideAnimationManager.js'
    );
    const slideAnimationManager = new SlideAnimationManager(slidesContainer);
    slideAnimationManager.hideAllSlideElementsImmediately();
  } catch (error) {
    // Если контейнер еще не готов, игнорируем ошибку
    console.warn('Could not hide slide elements early:', error);
  }
}
