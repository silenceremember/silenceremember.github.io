/**
 * Менеджер группировки и отображения проектов по категориям
 * @module managers/ProjectGroupingManager
 */

import { ANIMATION_CONFIG, animateElementsAppearance } from '../utils/AnimationUtils.js';

/**
 * Класс для управления группировкой и отображением проектов
 */
export class ProjectGroupingManager {
  /**
   * Создает экземпляр ProjectGroupingManager
   * @param {Array<Object>} projects - Массив проектов для отображения
   * @param {Map<string, HTMLElement>} allProjectCards - Map карточек проектов (id -> card element)
   * @param {Object} callbacks - Объект с callback функциями
   * @param {Function} callbacks.onCardClick - Функция обработки клика по карточке проекта
   * @param {Function} callbacks.onHideLoading - Функция скрытия индикатора загрузки
   */
  constructor(projects, allProjectCards, callbacks = {}) {
    this.projects = projects || [];
    this.allProjectCards = allProjectCards || new Map();
    this.onCardClick = callbacks.onCardClick || (() => {});
    this.onHideLoading = callbacks.onHideLoading || (() => Promise.resolve());
    
    /** @type {Set<string>} */
    this.expandedSections = new Set();
    
    /** @type {boolean} */
    this.isRendering = false;
    
    // Константа для анимаций карточек (для обратной совместимости)
    this.CARD_ANIMATION = ANIMATION_CONFIG;
  }

  /**
   * Переключает развернутость раздела
   * @param {string} category - Категория раздела
   * @param {HTMLElement} button - Кнопка переключения
   * @param {Array<Object>} hiddenProjects - Массив скрытых проектов
   */
  toggleSectionExpansion(category, button, hiddenProjects) {
    const section = document.querySelector(`[data-category="${category}"]`);
    if (!section) return;
    
    const isExpanded = this.expandedSections.has(category);
    // Находим карточки по data-атрибуту или по классу
    const hiddenCards = Array.from(section.querySelectorAll('[data-hidden-card="true"], .project-card-hidden'));
    
    if (isExpanded) {
      // Сворачиваем с плавной анимацией - все карточки одновременно
      hiddenCards.forEach((card) => {
        card.style.transition = `opacity ${this.CARD_ANIMATION.duration} ${this.CARD_ANIMATION.timing}, transform ${this.CARD_ANIMATION.duration} ${this.CARD_ANIMATION.timing}, visibility ${this.CARD_ANIMATION.duration} ${this.CARD_ANIMATION.timing}`;
        card.style.opacity = '0';
        card.style.transform = `translateY(${ANIMATION_CONFIG.translateYDisappear})`;
      });
      setTimeout(() => {
        hiddenCards.forEach((card) => {
          card.style.display = 'none';
          // Полностью очищаем все inline стили после анимации для чистого состояния при следующем показе
          card.style.removeProperty('opacity');
          card.style.removeProperty('transform');
          card.style.removeProperty('transition');
          card.style.removeProperty('visibility');
          // Возвращаем класс и атрибут
          card.classList.add('project-card-hidden');
          card.setAttribute('data-hidden-card', 'true');
        });
      }, this.CARD_ANIMATION.timeout);
      this.expandedSections.delete(category);
      button.setAttribute('aria-expanded', 'false');
      button.querySelector('.projects-section-expand-text').textContent = 'Показать все';
    } else {
      // Разворачиваем с плавной анимацией - все карточки одновременно
      // Сначала полностью очищаем все inline стили и классы, которые могут мешать анимации
      hiddenCards.forEach((card) => {
        // Очищаем все inline стили, которые могли остаться от предыдущих анимаций
        card.style.removeProperty('opacity');
        card.style.removeProperty('transform');
        card.style.removeProperty('transition');
        card.style.removeProperty('visibility');
        // Убираем класс, который может влиять на видимость
        card.classList.remove('project-card-hidden');
        // Устанавливаем display, но пока оставляем карточку невидимой для правильной инициализации анимации
        card.style.display = '';
        // Устанавливаем начальное состояние для анимации СИНХРОННО
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        card.style.transition = 'none';
      });
      
      // Принудительный reflow для применения начального состояния
      if (hiddenCards.length > 0 && hiddenCards[0]) {
        void hiddenCards[0].offsetHeight;
      }
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Применяем анимацию одновременно для всех карточек
          if (hiddenCards.length > 0) {
            // Используем skipInitialState: true, так как мы уже установили начальное состояние
            animateElementsAppearance(hiddenCards, { skipInitialState: true });
            // Убираем атрибут после анимации (класс уже убран выше)
            setTimeout(() => {
              hiddenCards.forEach((card) => {
                card.setAttribute('data-hidden-card', 'true');
              });
            }, ANIMATION_CONFIG.timeout);
          }
        });
      });
      this.expandedSections.add(category);
      button.setAttribute('aria-expanded', 'true');
      button.querySelector('.projects-section-expand-text').textContent = 'Скрыть';
    }
  }

  /**
   * Создает секцию проектов
   * @param {string} category - Категория секции
   * @param {Array<Object>} allCategoryProjects - Все проекты категории
   * @param {Object} sectionTitles - Объект с заголовками секций
   * @returns {HTMLElement} Элемент секции
   */
  createSection(category, allCategoryProjects, sectionTitles) {
    // Разделяем на отмеченные и неотмеченные
    const featuredProjects = allCategoryProjects.filter(p => p.featured);
    const otherProjects = allCategoryProjects.filter(p => !p.featured);
    
    // Если нет отмеченных проектов, показываем все
    const hasFeatured = featuredProjects.length > 0;
    const projectsToShow = hasFeatured ? featuredProjects : allCategoryProjects;
    const hasMoreProjects = hasFeatured && otherProjects.length > 0;
    
    // Создаем контейнер раздела
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'projects-section';
    sectionContainer.setAttribute('data-category', category);
    
    // Устанавливаем начальное состояние для анимации (как в исследованиях)
    sectionContainer.style.opacity = '0';
    sectionContainer.style.transform = 'translateY(10px)';
    sectionContainer.style.transition = 'none';
    
    // Создаем заголовок раздела с кнопкой
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'projects-section-header';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'projects-section-title';
    
    // Создаем контейнер для названия и кнопки
    const titleContainer = document.createElement('span');
    titleContainer.className = 'projects-section-title-text';
    titleContainer.textContent = sectionTitles[category];
    sectionTitle.appendChild(titleContainer);
    
    // Добавляем кнопку "Показать все" рядом с названием если есть скрытые проекты
    if (hasMoreProjects) {
      const expandButton = document.createElement('button');
      expandButton.className = 'projects-section-expand';
      expandButton.setAttribute('aria-expanded', 'false');
      expandButton.setAttribute('aria-label', 'Показать все проекты');
      expandButton.innerHTML = `
        <span class="projects-section-expand-text">Показать все</span>
        <span class="projects-section-expand-count">${allCategoryProjects.length}</span>
      `;
      expandButton.addEventListener('click', () => {
        this.toggleSectionExpansion(category, expandButton, otherProjects);
      });
      sectionTitle.appendChild(expandButton);
    }
    
    sectionHeader.appendChild(sectionTitle);
    sectionContainer.appendChild(sectionHeader);
    
    // Создаем контейнер для проектов раздела
    const sectionGrid = document.createElement('div');
    sectionGrid.className = 'projects-section-grid';
    
    // Добавляем отмеченные проекты (или все, если нет отмеченных)
    projectsToShow.forEach(project => {
      const originalCard = this.allProjectCards.get(project.id);
      if (originalCard) {
        const clonedCard = originalCard.cloneNode(true);
        // Устанавливаем начальное состояние для анимации ПЕРЕД добавлением в DOM
        clonedCard.style.opacity = '0';
        clonedCard.style.transform = 'translateY(10px)';
        clonedCard.style.transition = 'none'; // Отключаем transition для мгновенного применения начального состояния
        // Добавляем обработчик клика на всю карточку
        clonedCard.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onCardClick(project);
        });
        // Добавляем обработчик на кнопку "Подробнее"
        const detailsButton = clonedCard.querySelector('.project-card-button');
        if (detailsButton) {
          detailsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onCardClick(project);
          });
        }
        sectionGrid.appendChild(clonedCard);
      }
    });
    
    // Добавляем скрытые проекты (если есть)
    if (hasMoreProjects) {
      otherProjects.forEach(project => {
        const originalCard = this.allProjectCards.get(project.id);
        if (originalCard) {
          const clonedCard = originalCard.cloneNode(true);
          clonedCard.classList.add('project-card-hidden');
          clonedCard.setAttribute('data-hidden-card', 'true');
          clonedCard.style.display = 'none';
          // Устанавливаем начальное состояние для анимации (на случай если карточка будет показана)
          clonedCard.style.opacity = '0';
          clonedCard.style.transition = 'none';
          // Добавляем обработчик клика на всю карточку
          clonedCard.addEventListener('click', (e) => {
            // Проверяем, был ли выделен текст - если да, не открываем карточку
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
              return;
            }
            e.stopPropagation();
            this.onCardClick(project);
          });
          // Добавляем обработчик на кнопку "Подробнее"
          const detailsButton = clonedCard.querySelector('.project-card-button');
          if (detailsButton) {
            detailsButton.addEventListener('click', (e) => {
              e.stopPropagation();
              this.onCardClick(project);
            });
          }
          sectionGrid.appendChild(clonedCard);
        }
      });
    }
    
    sectionContainer.appendChild(sectionGrid);
    return sectionContainer;
  }

  /**
   * Отображает проекты с группировкой по категориям
   * @returns {Promise<void>}
   */
  async renderGroupedProjects() {
    // Защита от повторных вызовов
    if (this.isRendering) {
      console.warn('renderGroupedProjects уже выполняется');
      return;
    }
    
    const grid = document.getElementById('projects-grid');
    if (!grid) {
      console.warn('Сетка проектов не найдена');
      return;
    }
    
    // Проверяем, что карточки созданы
    if (this.allProjectCards.size === 0) {
      console.warn('Карточки проектов еще не созданы');
      return;
    }
    
    this.isRendering = true;
    
    // Сбрасываем состояние развернутости при новом рендеринге
    this.expandedSections.clear();
    
    // Скрываем индикатор загрузки перед рендерингом (если есть)
    await this.onHideLoading();
    
    try {
      // Очищаем сетку (индикатор загрузки уже удален через onHideLoading)
      grid.innerHTML = '';
      grid.className = 'projects-grid';
      
      // Убеждаемся, что grid готов к анимации появления
      // Если grid был скрыт через onHideLoading, он уже имеет opacity: 0
      // Если opacity не установлена, устанавливаем её в 0 для плавного появления
      if (!grid.style.opacity || grid.style.opacity === '') {
        grid.style.opacity = '0';
      }
      grid.style.visibility = 'visible';
      
      // Группируем проекты по категориям
      const grouped = {
        games: [],
        tools: [],
        research: []
      };
      
      this.projects.forEach(project => {
        if (grouped[project.category]) {
          grouped[project.category].push(project);
        }
      });
      
      // Заголовки разделов
      const sectionTitles = {
        games: 'Игровые проекты',
        tools: 'Инструменты',
        research: 'Исследования'
      };
      
      // Отображаем каждый раздел
      const categories = Object.keys(grouped);
      categories.forEach((category) => {
        const allCategoryProjects = grouped[category];
        if (allCategoryProjects.length === 0) return;
        
        const section = this.createSection(category, allCategoryProjects, sectionTitles);
        grid.appendChild(section);
      });
      
      // Плавное появление grid с контентом, затем секций с заголовками, затем карточек
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Сначала показываем grid с анимацией (если он был скрыт)
          const gridOpacity = grid.style.opacity;
          // Показываем grid с анимацией, если opacity установлена в 0 или не установлена
          if (gridOpacity === '0' || !gridOpacity || gridOpacity === '') {
            grid.style.transition = `opacity ${ANIMATION_CONFIG.duration} ${ANIMATION_CONFIG.timing}, transform ${ANIMATION_CONFIG.duration} ${ANIMATION_CONFIG.timing}`;
            grid.style.opacity = '1';
            grid.style.transform = 'translateY(0)';
            
            setTimeout(() => {
              grid.style.opacity = '';
              grid.style.transform = '';
              grid.style.transition = '';
            }, ANIMATION_CONFIG.timeout);
          }
          
          // Затем анимируем секции с заголовками (как в исследованиях)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const allSections = grid.querySelectorAll('.projects-section');
              if (allSections.length > 0) {
                animateElementsAppearance(allSections);
              }
              
              // Затем анимируем карточки
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  const allCards = grid.querySelectorAll('.project-card:not(.project-card-hidden)');
                  if (allCards.length > 0) {
                    animateElementsAppearance(allCards);
                  }
                });
              });
            });
          });
        });
      });
      
      // Загружаем SVG для звездочек после рендеринга
      requestAnimationFrame(async () => {
        try {
          const svgLoaderModule = await import('../components/svg-loader.js');
          if (svgLoaderModule.default) {
            await svgLoaderModule.default();
          }
        } catch (error) {
          console.error('Ошибка загрузки SVG:', error);
        } finally {
          this.isRendering = false;
        }
      });
    } catch (error) {
      console.error('Ошибка при рендеринге проектов:', error);
      this.isRendering = false;
    }
  }
}

