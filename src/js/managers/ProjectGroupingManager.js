/**
 * Менеджер группировки и отображения проектов по категориям
 * @module managers/ProjectGroupingManager
 */

import {
  ANIMATION_CONFIG,
  animateElementsAppearance,
} from '../utils/AnimationUtils.js';
import { SvgLoader } from '../components/index.js';
import { lazyImageLoader } from '../utils/LazyImageLoader.js';
import { localization } from '../utils/Localization.js';

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

    /** @type {Map<string, Array<number>>} */
    this.activeTimeouts = new Map(); // Хранит активные таймауты для каждой категории

    /** @type {Map<string, boolean>} */
    this.isAnimating = new Map(); // Флаг анимации для каждой категории

    // Константа для анимаций карточек (для обратной совместимости)
    this.CARD_ANIMATION = ANIMATION_CONFIG;
  }

  /**
   * Останавливает все текущие анимации на карточках принудительно
   * @param {Array<HTMLElement>} cards - Массив карточек
   * @private
   */
  _stopAllAnimations(cards) {
    cards.forEach((card) => {
      if (!card || !card.parentNode) return;
      
      // Принудительно останавливаем все CSS transitions с !important
      card.style.setProperty('transition', 'none', 'important');
      
      // Получаем текущее computed состояние элемента
      const computedStyle = window.getComputedStyle(card);
      const currentOpacity = computedStyle.opacity;
      const currentTransform = computedStyle.transform;
      
      // Принудительно применяем текущее состояние без анимации
      card.style.setProperty('opacity', currentOpacity, 'important');
      card.style.setProperty('transform', currentTransform, 'important');
      
      // Принудительный reflow для применения стилей
      void card.offsetHeight;
    });
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

    // Защита от множественных одновременных вызовов
    if (this.isAnimating.get(category)) {
      return;
    }

    // Отменяем все предыдущие таймауты для этой категории
    const timeouts = this.activeTimeouts.get(category) || [];
    timeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.activeTimeouts.set(category, []);

    const isExpanded = this.expandedSections.has(category);
    
    // Находим карточки для анимации
    // Атрибут data-hidden-card устанавливается сразу при разворачивании,
    // поэтому можем использовать единый способ поиска
    const hiddenCards = Array.from(
      section.querySelectorAll(
        '[data-hidden-card="true"], .project-card-hidden'
      )
    ).filter((card) => card && card.parentNode);

    // Устанавливаем флаг анимации
    this.isAnimating.set(category, true);

    if (isExpanded) {
      // Сворачиваем с плавной анимацией - все карточки одновременно
      // Сначала принудительно останавливаем все текущие анимации
      this._stopAllAnimations(hiddenCards);

      // Устанавливаем стили для анимации исчезновения
      hiddenCards.forEach((card) => {
        // Убираем !important перед установкой transition для корректной работы анимации
        card.style.removeProperty('transition');
        card.style.removeProperty('opacity');
        card.style.removeProperty('transform');
        
        // Устанавливаем transition и начальное состояние
        card.style.transition = `opacity ${this.CARD_ANIMATION.duration} ${this.CARD_ANIMATION.timing}, transform ${this.CARD_ANIMATION.duration} ${this.CARD_ANIMATION.timing}`;
        
        // Принудительный reflow перед изменением значений
        void card.offsetHeight;
        
        // Устанавливаем финальное состояние для анимации исчезновения
        card.style.opacity = '0';
        card.style.transform = `translateY(${ANIMATION_CONFIG.translateYDisappear})`;
      });

      // Сохраняем ID таймаута для возможной отмены
      const timeoutId = setTimeout(() => {
        // Проверяем, что анимация все еще актуальна
        if (!this.isAnimating.get(category)) {
          return;
        }

        hiddenCards.forEach((card) => {
          if (!card || !card.parentNode) return;
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
        // Сбрасываем флаг анимации
        this.isAnimating.set(category, false);
        // Удаляем таймаут из списка активных
        const activeTimeouts = this.activeTimeouts.get(category) || [];
        const index = activeTimeouts.indexOf(timeoutId);
        if (index > -1) {
          activeTimeouts.splice(index, 1);
        }
      }, this.CARD_ANIMATION.timeout);

      // Сохраняем ID таймаута
      const activeTimeouts = this.activeTimeouts.get(category) || [];
      activeTimeouts.push(timeoutId);
      this.activeTimeouts.set(category, activeTimeouts);

      this.expandedSections.delete(category);
      button.setAttribute('aria-expanded', 'false');
      button.querySelector('.projects-section-expand-text').textContent =
        localization.t('projects.filters.showAll');
    } else {
      // Разворачиваем с плавной анимацией - все карточки одновременно
      // Сначала принудительно останавливаем все текущие анимации
      this._stopAllAnimations(hiddenCards);

      // Подготавливаем карточки для анимации появления
      hiddenCards.forEach((card) => {
        // Убираем класс, который может влиять на видимость
        card.classList.remove('project-card-hidden');
        // Устанавливаем атрибут сразу, чтобы карточки можно было найти при сворачивании
        card.setAttribute('data-hidden-card', 'true');
        // Устанавливаем display
        card.style.display = '';
        
        // Убираем !important перед установкой начального состояния
        card.style.removeProperty('opacity');
        card.style.removeProperty('transform');
        card.style.removeProperty('transition');
        card.style.removeProperty('visibility');
        
        // Устанавливаем начальное состояние для анимации СИНХРОННО
        card.style.opacity = '0';
        card.style.transform = `translateY(${ANIMATION_CONFIG.translateYAppear})`;
        card.style.transition = 'none';
      });

      // Принудительный reflow для применения начального состояния
      if (hiddenCards.length > 0 && hiddenCards[0]) {
        void hiddenCards[0].offsetHeight;
      }

      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Проверяем, что анимация все еще актуальна (не была отменена)
          if (!this.isAnimating.get(category)) {
            return;
          }

          // Применяем анимацию одновременно для всех карточек напрямую
          if (hiddenCards.length > 0) {
            hiddenCards.forEach((card) => {
              if (!card || !card.parentNode) return;
              
              // Убеждаемся, что начальное состояние установлено
              const computedStyle = window.getComputedStyle(card);
              const computedOpacity = parseFloat(computedStyle.opacity);
              
              if (computedOpacity > 0.01) {
                card.style.opacity = '0';
                card.style.transform = `translateY(${ANIMATION_CONFIG.translateYAppear})`;
                card.style.transition = 'none';
                void card.offsetHeight;
              }
            });

            // Принудительный reflow перед установкой transition
            if (hiddenCards.length > 0 && hiddenCards[0]) {
              void hiddenCards[0].offsetHeight;
            }

            // Устанавливаем transition и запускаем анимацию
            requestAnimationFrame(() => {
              // Проверяем актуальность еще раз
              if (!this.isAnimating.get(category)) {
                return;
              }

              hiddenCards.forEach((card) => {
                if (!card || !card.parentNode) return;
                
                // Устанавливаем transition
                card.style.removeProperty('transition');
                card.style.transition = `opacity ${this.CARD_ANIMATION.duration} ${this.CARD_ANIMATION.timing}, transform ${this.CARD_ANIMATION.duration} ${this.CARD_ANIMATION.timing}`;
              });

              // Принудительный reflow перед изменением значений
              if (hiddenCards.length > 0 && hiddenCards[0]) {
                void hiddenCards[0].offsetHeight;
              }

              // Устанавливаем финальные значения для анимации появления
              hiddenCards.forEach((card) => {
                if (!card || !card.parentNode) return;
                card.style.removeProperty('opacity');
                card.style.removeProperty('transform');
                card.style.opacity = '1';
                card.style.transform = `translateY(${ANIMATION_CONFIG.translateYFinal})`;
              });

              // Убираем inline стили после анимации
              const timeoutId = setTimeout(() => {
                // Проверяем актуальность еще раз
                if (!this.isAnimating.get(category)) {
                  return;
                }

                hiddenCards.forEach((card) => {
                  if (!card || !card.parentNode) return;
                  card.style.removeProperty('transform');
                  card.style.removeProperty('opacity');
                  card.style.removeProperty('transition');
                });
                
                // Сбрасываем флаг анимации
                this.isAnimating.set(category, false);
                // Удаляем таймаут из списка активных
                const activeTimeouts = this.activeTimeouts.get(category) || [];
                const index = activeTimeouts.indexOf(timeoutId);
                if (index > -1) {
                  activeTimeouts.splice(index, 1);
                }
              }, ANIMATION_CONFIG.timeout);

              // Сохраняем ID таймаута
              const activeTimeouts = this.activeTimeouts.get(category) || [];
              activeTimeouts.push(timeoutId);
              this.activeTimeouts.set(category, activeTimeouts);
            });
          } else {
            // Если карточек нет, сразу сбрасываем флаг
            this.isAnimating.set(category, false);
          }
        });
      });
      this.expandedSections.add(category);
      button.setAttribute('aria-expanded', 'true');
      button.querySelector('.projects-section-expand-text').textContent =
        localization.t('projects.filters.hide');
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
    // Разделяем на тиры:
    // Тир 1: featured: true
    // Тир 2: tier === 2
    // Тир 3: остальные
    const tier1Projects = allCategoryProjects.filter((p) => p.featured);
    const tier2Projects = allCategoryProjects.filter((p) => !p.featured && p.tier === 2);
    const tier3Projects = allCategoryProjects.filter((p) => !p.featured && p.tier !== 2);
    
    // Сортируем каждый тир по дате (year) - сначала более новые
    const sortByDate = (a, b) => {
      const yearA = a.year || 0;
      const yearB = b.year || 0;
      return yearB - yearA; // Сортировка по убыванию (новые сначала)
    };
    
    tier1Projects.sort(sortByDate);
    tier2Projects.sort(sortByDate);
    tier3Projects.sort(sortByDate);
    
    // Объединяем тир 2 и тир 3 для скрытых проектов (тир 2 должны быть выше)
    const hiddenProjects = [...tier2Projects, ...tier3Projects];

    // Если нет отмеченных проектов, показываем все
    const hasFeatured = tier1Projects.length > 0;
    const projectsToShow = hasFeatured ? tier1Projects : allCategoryProjects;
    const hasMoreProjects = hasFeatured && hiddenProjects.length > 0;

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
      expandButton.setAttribute('aria-label', localization.t('projects.filters.showAllAria'));
      expandButton.innerHTML = `
        <span class="projects-section-expand-text">${localization.t('projects.filters.showAll')}</span>
        <span class="projects-section-expand-count">${allCategoryProjects.length}</span>
      `;
      expandButton.addEventListener('click', () => {
        this.toggleSectionExpansion(category, expandButton, hiddenProjects);
      });
      sectionTitle.appendChild(expandButton);
    }

    sectionHeader.appendChild(sectionTitle);
    sectionContainer.appendChild(sectionHeader);

    // Создаем контейнер для проектов раздела
    const sectionGrid = document.createElement('div');
    sectionGrid.className = 'projects-section-grid';

    // Добавляем отмеченные проекты (или все, если нет отмеченных)
    projectsToShow.forEach((project) => {
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
          // Не открываем для проектов "скоро"
          if (!project.comingSoon) {
            this.onCardClick(project);
          }
        });
        // Добавляем обработчик на кнопку "Подробнее"
        const detailsButton = clonedCard.querySelector('.project-card-button');
        if (detailsButton) {
          detailsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            // Не открываем для проектов "скоро"
            if (!project.comingSoon) {
              this.onCardClick(project);
            }
          });
        }
        sectionGrid.appendChild(clonedCard);
        
        // Инициализируем ленивую загрузку изображения для карточки
        const cardImage = clonedCard.querySelector('img[data-src]');
        if (cardImage) {
          lazyImageLoader.loadImage(cardImage);
        }
      }
    });

    // Добавляем скрытые проекты (если есть) - сначала тир 2, затем тир 3
    if (hasMoreProjects) {
      hiddenProjects.forEach((project) => {
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
            // Не открываем для проектов "скоро"
            if (!project.comingSoon) {
              this.onCardClick(project);
            }
          });
          // Добавляем обработчик на кнопку "Подробнее"
          const detailsButton = clonedCard.querySelector(
            '.project-card-button'
          );
          if (detailsButton) {
            detailsButton.addEventListener('click', (e) => {
              e.stopPropagation();
              // Не открываем для проектов "скоро"
              if (!project.comingSoon) {
                this.onCardClick(project);
              }
            });
          }
          sectionGrid.appendChild(clonedCard);
          
          // Инициализируем ленивую загрузку изображения для скрытой карточки
          const cardImage = clonedCard.querySelector('img[data-src]');
          if (cardImage) {
            lazyImageLoader.loadImage(cardImage);
          }
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

    // Отменяем все активные анимации и таймауты перед новым рендерингом
    this.activeTimeouts.forEach((timeouts, category) => {
      timeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    });
    this.activeTimeouts.clear();
    this.isAnimating.clear();

    // Сбрасываем состояние развернутости при новом рендеринге
    this.expandedSections.clear();

    // Скрываем индикатор загрузки перед рендерингом (если есть и виден)
    // Проверяем видимость перед вызовом, чтобы избежать лишних задержек
    const loadingElement = document.getElementById('projects-loading');
    if (loadingElement) {
      const computedStyle = window.getComputedStyle(loadingElement);
      const isVisible =
        computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        parseFloat(computedStyle.opacity) > 0.01;
      if (isVisible) {
        await this.onHideLoading();
      }
    }

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
        research: [],
      };

      this.projects.forEach((project) => {
        if (grouped[project.category]) {
          grouped[project.category].push(project);
        }
      });

      // Заголовки разделов
      const sectionTitles = {
        games: localization.t('projects.filters.categories.games'),
        tools: localization.t('projects.filters.categories.tools'),
        research: localization.t('projects.filters.categories.research'),
      };

      // Отображаем каждый раздел
      const categories = Object.keys(grouped);
      categories.forEach((category) => {
        const allCategoryProjects = grouped[category];
        if (allCategoryProjects.length === 0) return;

        const section = this.createSection(
          category,
          allCategoryProjects,
          sectionTitles
        );
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
                  const allCards = grid.querySelectorAll(
                    '.project-card:not(.project-card-hidden)'
                  );
                  if (allCards.length > 0) {
                    animateElementsAppearance(allCards);
                  }
                });
              });
            });
          });
        });
      });

      // Загружаем SVG для звездочек асинхронно после рендеринга (не блокируем основной поток)
      // Используем requestIdleCallback для неблокирующей загрузки с разбивкой на микрозадачи
      // Используем глобальный экземпляр для переиспользования кеша
      const loadSvgAsync = async () => {
        try {
          const { globalSvgLoader } = await import('../components/svg/SvgLoader.js');
          const svgLoader = globalSvgLoader;
          // Разбиваем загрузку на микрозадачи для избежания long tasks
          await new Promise((resolve) => {
            if (window.requestIdleCallback) {
              requestIdleCallback(() => {
                svgLoader.init().then(resolve).catch(resolve);
              }, { timeout: 2000 });
            } else {
              setTimeout(() => {
                svgLoader.init().then(resolve).catch(resolve);
              }, 0);
            }
          });
        } catch (error) {
          console.error('Ошибка загрузки SVG:', error);
        } finally {
          this.isRendering = false;
        }
      };
      
      // Используем requestIdleCallback для отложенной загрузки
      if (window.requestIdleCallback) {
        requestIdleCallback(loadSvgAsync, { timeout: 2000 });
      } else {
        setTimeout(loadSvgAsync, 100);
      }
    } catch (error) {
      console.error('Ошибка при рендеринге проектов:', error);
      this.isRendering = false;
    }
  }
}
