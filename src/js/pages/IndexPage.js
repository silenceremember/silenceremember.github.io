/**
 * Страница главной страницы - загрузка featured проектов
 */

import { BasePage } from './BasePage.js';
import { getRoleLabel } from '../utils/RoleMapper.js';
import { SlidesManager } from '../components/index.js';
import { backgroundImageService } from '../services/BackgroundImageService.js';
import { PageReadyManager } from '../utils/PageReady.js';
import { SlideAnimationManager } from '../managers/SlideAnimationManager.js';
import { localization } from '../utils/Localization.js';

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
    this.featuredProjects = []; // Сохраняем для обновления при смене языка
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
      // Используем локализованную версию названия если доступна
      const lang = localization.getCurrentLanguage();
      let titleText = project.title;
      if (project.titleLocalized && project.titleLocalized[lang]) {
        titleText = project.titleLocalized[lang];
      }
      titleElement.textContent = titleText.toUpperCase();
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
      // Используем локализованную версию если доступна
      const lang = localization.getCurrentLanguage();
      if (project.keyContributionLocalized && project.keyContributionLocalized[lang]) {
        contributionElement.textContent = project.keyContributionLocalized[lang];
      } else {
        contributionElement.textContent = project.keyContribution;
      }
    }

    // Изображения (если есть preview) - оптимизированная загрузка
    if (project.media?.preview) {
      const projectPlaceholder = slideElement.querySelector(
        '.project-placeholder'
      );
      if (projectPlaceholder) {
        // Проверяем, находимся ли мы в tablet/mobile режиме
        const isTabletMode = this.slidesContainer?.classList.contains('tablet-scroll-mode') ||
          window.innerWidth < 1024 || window.innerHeight < 900;
        
        // В tablet режиме все слайды видимы - загружаем все изображения сразу
        // В desktop режиме: первый слайд загружаем сразу, остальные - лениво
        const isVisible = isTabletMode || slideIndex === 0;
        backgroundImageService.loadBackgroundImage(
          projectPlaceholder,
          project.media.preview,
          isVisible
        );
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
   * Загружает изображение для слайда проекта при переключении
   * Вызывается при переключении на слайд, чтобы загрузить изображение принудительно
   * @param {number} slideIndex - Индекс слайда (1-3 для проектов)
   */
  loadSlideImage(slideIndex) {
    // slideIndex 1-3 соответствуют проектам (слайды 1-3)
    if (slideIndex < 1 || slideIndex > 3) return;

    const projectIndex = slideIndex - 1; // Индекс в массиве проектов (0-based)
    const project = this.featuredProjects[projectIndex];
    if (!project || !project.media?.preview) return;

    const slideElement = this.slidesContainer?.querySelector(
      `.slide[data-slide="${slideIndex}"]`
    );
    if (!slideElement) return;

    const projectPlaceholder = slideElement.querySelector('.project-placeholder');
    if (!projectPlaceholder) return;

    // Проверяем, не загружено ли уже изображение
    const bgImage = projectPlaceholder.style.backgroundImage;
    if (bgImage && bgImage !== 'none' && bgImage.includes(project.media.preview)) {
      return; // Изображение уже загружено
    }

    // Отключаем наблюдение за элементом, если оно было установлено
    // Это нужно, чтобы избежать конфликтов с Intersection Observer
    backgroundImageService.unobserve(projectPlaceholder);

    // Удаляем data-атрибут, если он есть (чтобы не загружать дважды)
    if (projectPlaceholder.dataset.bgImage) {
      delete projectPlaceholder.dataset.bgImage;
    }

    // Принудительно загружаем изображение (isVisible=true)
    backgroundImageService.loadBackgroundImage(
      projectPlaceholder,
      project.media.preview,
      true
    );
  }

  /**
   * Инициализирует менеджер анимаций слайдов (ленивая загрузка)
   */
  async initSlideAnimationManager() {
    if (!this.slidesContainer) {
      return;
    }

    if (!this.slideAnimationManager) {
      this.slideAnimationManager = new SlideAnimationManager(this.slidesContainer);
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
    
    // Подписываемся на переключение слайдов для загрузки изображений
    this.setupSlideImageLoading();
    
    const projectsData = await projectsDataPromise;

    // Скрываем индикатор загрузки и ждем завершения fadeout
    await this.loadingIndicator.hide();

    // Фильтруем featured проекты
    this.featuredProjects = projectsData.filter(
      (project) => project.featured === true
    );

    // Заполняем слайды данными проектов
    this.populateProjectSlides(this.featuredProjects);

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

    // Подписываемся на изменения языка
    this.languageChangeHandler = () => {
      this.updateContentLanguage();
    };
    this.updateContentLanguage();
    window.addEventListener('languageChanged', this.languageChangeHandler);
  }

  /**
   * Настраивает загрузку изображений при переключении слайдов
   */
  setupSlideImageLoading() {
    if (!this.slidesContainer) return;

    // Наблюдаем за изменениями активного слайда (для desktop режима)
    const slideObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const slide = mutation.target;
          if (
            slide.classList.contains('active') &&
            slide.classList.contains('slide')
          ) {
            const slideIndex = parseInt(slide.getAttribute('data-slide'));
            // Загружаем изображение для проектных слайдов (1-3) только в desktop режиме
            if (slideIndex >= 1 && slideIndex <= 3) {
              const isTabletMode = this.slidesContainer.classList.contains('tablet-scroll-mode');
              if (!isTabletMode) {
                this.loadSlideImage(slideIndex);
              }
            }
          }
        }
      });
    });

    // Наблюдаем за контейнером для отслеживания переключения режима
    const containerObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const container = mutation.target;
          if (container === this.slidesContainer) {
            const isTabletMode = container.classList.contains('tablet-scroll-mode');
            // Если переключились в tablet режим, загружаем все изображения
            if (isTabletMode) {
              this.loadAllSlideImages();
            }
          }
        }
      });
    });

    // Наблюдаем за всеми слайдами
    const slides = this.slidesContainer.querySelectorAll('.slide');
    slides.forEach((slide) => {
      slideObserver.observe(slide, {
        attributes: true,
        attributeFilter: ['class'],
      });
    });

    // Наблюдаем за контейнером для отслеживания режима
    containerObserver.observe(this.slidesContainer, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Сохраняем observers для очистки
    this.slideImageObserver = slideObserver;
    this.containerImageObserver = containerObserver;

    // Если уже в tablet режиме при инициализации, загружаем все изображения
    if (this.slidesContainer.classList.contains('tablet-scroll-mode')) {
      this.loadAllSlideImages();
    }
  }

  /**
   * Загружает все изображения слайдов (для tablet режима)
   */
  loadAllSlideImages() {
    // Загружаем изображения для всех проектных слайдов (1-3)
    for (let slideIndex = 1; slideIndex <= 3; slideIndex++) {
      this.loadSlideImage(slideIndex);
    }
  }

  /**
   * Обновляет язык динамического контента
   */
  updateContentLanguage() {
    // Обновляем роли и ключевые вклады в слайдах проектов
    const projectSlides = this.getProjectSlides();
    projectSlides.forEach((slide, index) => {
      const project = this.featuredProjects[index];
      if (!project) return;

      // Обновляем заголовок проекта
      const titleElement = slide.querySelector('.project-title');
      if (titleElement) {
        const lang = localization.getCurrentLanguage();
        let titleText = project.title;
        if (project.titleLocalized && project.titleLocalized[lang]) {
          titleText = project.titleLocalized[lang];
        }
        titleElement.textContent = titleText.toUpperCase();
      }

      // Обновляем роль
      const roleElement = slide.querySelector(
        '.details-block:first-of-type .details-text'
      );
      if (roleElement) {
        roleElement.textContent = getRoleLabel(project.role, true, project.teamName);
      }

      // Обновляем ключевой вклад (берется из JSON, но может быть локализован)
      const contributionElement = slide.querySelector(
        '.details-block:last-of-type .details-text'
      );
      if (contributionElement && project.keyContribution) {
        // Если есть локализованная версия, используем её
        const lang = localization.getCurrentLanguage();
        if (project.keyContributionLocalized && project.keyContributionLocalized[lang]) {
          contributionElement.textContent = project.keyContributionLocalized[lang];
        } else {
          contributionElement.textContent = project.keyContribution;
        }
      }
    });
  }

  /**
   * Очищает ресурсы
   */
  cleanup() {
    if (this.languageChangeHandler) {
      window.removeEventListener('languageChanged', this.languageChangeHandler);
    }
    if (this.slideImageObserver) {
      this.slideImageObserver.disconnect();
      this.slideImageObserver = null;
    }
    if (this.containerImageObserver) {
      this.containerImageObserver.disconnect();
      this.containerImageObserver = null;
    }
    super.cleanup?.();
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
    // Используем статический импорт для надежности в production
    const slideAnimationManager = new SlideAnimationManager(slidesContainer);
    slideAnimationManager.hideAllSlideElementsImmediately();
  } catch (error) {
    // Если контейнер еще не готов, игнорируем ошибку
    console.warn('Could not hide slide elements early:', error);
  }
}
