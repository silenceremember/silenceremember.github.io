/**
 * Менеджер фильтров проектов
 * Управляет фильтрацией проектов по категориям
 */

import {
  animateElementsAppearance,
  animateElementAppearance,
} from '../utils/AnimationUtils.js';
import { LayoutManager } from '../layout/LayoutManager.js';
import { lazyImageLoader } from '../utils/LazyImageLoader.js';
import { localization } from '../utils/Localization.js';

const layoutManager = new LayoutManager();
const loadHTML = (url) => layoutManager.loadHTML(url);

/**
 * Класс для управления фильтрами проектов
 */
export class ProjectFiltersManager {
  /**
   * @param {Array<Object>} projects - Массив всех проектов
   * @param {Map<string, HTMLElement>} allProjectCards - Map всех созданных карточек проектов
   * @param {Object} callbacks - Объект с callback функциями
   * @param {Function} callbacks.onCardClick - Обработчик клика на карточку проекта
   * @param {Function} callbacks.onRenderGrouped - Callback для рендеринга сгруппированных проектов
   * @param {Function} callbacks.onHideLoading - Callback для скрытия индикатора загрузки
   * @param {Function} callbacks.onExpandedSectionsClear - Callback для очистки развернутых секций
   */
  constructor(projects, allProjectCards, callbacks = {}) {
    this.projects = projects;
    this.allProjectCards = allProjectCards;
    this.onCardClick = callbacks.onCardClick || (() => {});
    this.onRenderGrouped = callbacks.onRenderGrouped || (async () => {});
    this.onHideLoading = callbacks.onHideLoading || (async () => {});
    this.onExpandedSectionsClear =
      callbacks.onExpandedSectionsClear || (() => {});

    /** @type {Object<string, Array<string>>} */
    this.activeFilters = {
      category: [],
    };

    /** @type {string|null} */
    this.projectFiltersTemplate = null;

    /** @type {boolean} */
    this.isApplyingFilters = false;
  }

  /**
   * Инициализирует фильтры
   * @param {Array<Object>} projects - Массив проектов для инициализации фильтров
   */
  async init(projects) {
    if (projects) {
      this.projects = projects;
    }
    this.ensureStatusRegion();

    const filtersContainer = document.getElementById(
      'projects-filters-container'
    );
    if (!filtersContainer) return;

    // Загружаем шаблон фильтров, если еще не загружен
    if (!this.projectFiltersTemplate) {
      try {
        this.projectFiltersTemplate = await loadHTML(
          '/components/project-filters.html'
        );
      } catch (error) {
        console.error('Ошибка загрузки шаблона фильтров:', error);
        return;
      }
    }

    // Вставляем фильтры
    if (this.projectFiltersTemplate) {
      filtersContainer.innerHTML = this.projectFiltersTemplate;
      // Шаблон вставляется после общего прохода i18n: переводим его подписи сразу
      filtersContainer.querySelectorAll('[data-i18n]').forEach((el) => {
        const text = localization.t(el.getAttribute('data-i18n'));
        if (text && text !== el.getAttribute('data-i18n')) el.textContent = text;
      });

      // Находим контейнер фильтров для анимации
      const filtersContent = filtersContainer.querySelector(
        '.project-filters-content'
      );

      // Начальное состояние блока фильтров до появления
      if (filtersContent) {
        filtersContent.style.opacity = '0';
        filtersContent.style.transform = 'translateY(10px)';
        filtersContent.style.transition = 'none';
        // Принудительный reflow для применения начального состояния
        void filtersContent.offsetHeight;
      }

      // Плавное появление блока фильтров
      if (filtersContent) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            animateElementAppearance(filtersContent);
          });
        });
      }
    }

    // Обновляем счетчики фильтров (для категорий и статусов)
    this.updateFilterCounts(this.projects);

    // Инициализируем фильтры
    this.initFilterButtons();
  }

  /**
   * Обновляет счетчики в фильтрах
   * @param {Array<Object>} projects - Массив проектов для подсчета
   */
  updateFilterCounts(projects) {
    // Подсчитываем проекты по категориям
    const categoryCounts = {};

    projects.forEach((project) => {
      categoryCounts[project.category] =
        (categoryCounts[project.category] || 0) + 1;
    });

    // Обновляем счетчики категорий
    document.querySelectorAll('.project-filters-option').forEach((button) => {
      const value = button.getAttribute('data-value');
      const countEl = button.querySelector('.project-filters-option-count');
      if (!countEl) return;

      const parent = button.closest('[data-filter]');
      if (!parent) return;

      const filterType = parent.getAttribute('data-filter');
      let count = 0;

      if (filterType === 'category') {
        count = categoryCounts[value] || 0;
      }

      countEl.textContent = count;
    });
  }

  /**
   * Инициализирует кнопки фильтров
   */
  initFilterButtons() {
    const buttons = document.querySelectorAll('.project-filters-option');

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const parent = button.closest('[data-filter]');
        if (!parent) return;

        const type = parent.getAttribute('data-filter');
        const value = button.getAttribute('data-value');
        if (type && value) {
          this.toggleFilter(type, value, button);
        }
      });
    });
  }

  /**
   * Переключает фильтр
   * @param {string} type - Тип фильтра ('category')
   * @param {string} value - Значение фильтра
   * @param {HTMLElement} button - Кнопка фильтра
   */
  toggleFilter(type, value, button) {
    if (!this.activeFilters[type]) {
      this.activeFilters[type] = [];
    }

    const index = this.activeFilters[type].indexOf(value);
    const isActive = index !== -1;

    if (isActive) {
      this.activeFilters[type].splice(index, 1);
      button.setAttribute('aria-pressed', 'false');
      button.classList.remove('active');
    } else {
      this.activeFilters[type].push(value);
      button.setAttribute('aria-pressed', 'true');
      button.classList.add('active');
    }

    this.applyFilters();
  }

  /**
   * Постоянная невидимая область role="status" вне сетки: скринридер слышит, сколько кейсов найдено
   */
  ensureStatusRegion() {
    if (document.getElementById('projects-status')) return;
    const page = document.querySelector('.projects-page');
    if (!page) return;
    const status = document.createElement('p');
    status.id = 'projects-status';
    status.className = 'visually-hidden';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    page.appendChild(status);
  }

  /**
   * Сообщает число найденных кейсов в область role="status"
   * @param {number} count - Число видимых карточек
   */
  announceCount(count) {
    const status = document.getElementById('projects-status');
    if (status) status.textContent = `${localization.t('projects.filters.found')}: ${count}`;
  }

  /**
   * Очищает все фильтры
   */
  clearAllFilters() {
    this.activeFilters = {
      category: [],
    };

    // Сбрасываем все кнопки
    document.querySelectorAll('.project-filters-option').forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.classList.remove('active');
    });

    this.applyFilters();
  }

  /**
   * Применяет фильтры и обновляет отображение
   */
  async applyFilters() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    // Защита от множественных одновременных вызовов
    if (this.isApplyingFilters) {
      return;
    }
    this.isApplyingFilters = true;

    try {
      // Проверяем, есть ли активные фильтры
      const hasActiveFilters = Object.values(this.activeFilters).some(
        (arr) => arr.length > 0
      );

      if (!hasActiveFilters) {
        // Если фильтров нет, группируем по разделам
        // Сбрасываем состояние развернутости при переключении на группировку
        this.onExpandedSectionsClear();

        // Проверяем, есть ли индикатор загрузки перед его скрытием
        // Делаем это только если действительно нужно (индикатор виден)
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

        await this.onRenderGrouped();
        this.announceCount(this.projects.length);
        return;
      }

      // Проверяем, есть ли индикатор загрузки перед его скрытием
      const loadingElement = document.getElementById('projects-loading');
      if (loadingElement) {
        // Убеждаемся, что индикатор загрузки скрыт (на случай, если он остался)
        await this.onHideLoading();
      }

      // Если есть фильтры, создаем структуру с заголовком и сеткой в одном контейнере
      // Очищаем grid и создаем структуру projects-section
      grid.innerHTML = '';
      grid.className = 'projects-grid';

      // Создаем контейнер секции для результатов фильтров
      const sectionContainer = document.createElement('div');
      sectionContainer.className = 'projects-section';

      // Создаем заголовок секции
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'projects-section-header';

      const sectionTitle = document.createElement('h2');
      sectionTitle.className = 'projects-section-title';
      sectionTitle.id = 'project-filters-results';

      // Создаем контейнер для названия
      const titleContainer = document.createElement('span');
      titleContainer.className = 'projects-section-title-text';
      titleContainer.textContent = localization.t('projects.filters.found');
      sectionTitle.appendChild(titleContainer);

      // Добавляем счетчик
      const countElement = document.createElement('span');
      countElement.className = 'project-filters-option-count';
      countElement.textContent = '0';
      sectionTitle.appendChild(countElement);

      // Добавляем кнопку "Сбросить"
      const resetButton = document.createElement('button');
      resetButton.className = 'projects-section-expand';

      const resetButtonText = document.createElement('span');
      resetButtonText.className = 'projects-section-expand-text';
      resetButtonText.textContent = localization.t('projects.filters.reset');
      resetButton.appendChild(resetButtonText);
      resetButton.type = 'button';
      resetButton.addEventListener('click', () => {
        this.clearAllFilters();
        // Кнопка исчезает вместе с результатами: фокус на первый фильтр, а не на body
        document.querySelector('.project-filters-option')?.focus();
      });

      // «Сбросить» рядом с заголовком, а не внутри h2
      sectionHeader.appendChild(sectionTitle);
      sectionHeader.appendChild(resetButton);
      sectionContainer.appendChild(sectionHeader);

      // Создаем сетку для проектов
      const sectionGrid = document.createElement('div');
      sectionGrid.className = 'projects-section-grid';

      // Фильтруем и добавляем карточки
      let visibleCount = 0;

      this.projects.forEach((project) => {
        let visible = true;

        // Проверяем категорию
        if (visible && this.activeFilters.category.length > 0) {
          if (!this.activeFilters.category.includes(project.category)) {
            visible = false;
          }
        }


        // Добавляем только видимые карточки
        if (visible) {
          // Используем CardFactory для создания карточки, если есть шаблон
          // Иначе клонируем из существующих карточек
          let card = null;
          const originalCard = this.allProjectCards.get(project.id);

          if (originalCard) {
            // Клонируем существующую карточку
            card = originalCard.cloneNode(true);
            
            // Сбрасываем атрибуты data-svg-loaded для клонированных SVG элементов,
            // чтобы они загрузились заново для клонированной карточки
            // Сначала обрабатываем элементы с data-svg-loaded
            card.querySelectorAll('[data-svg-loaded]').forEach((svgElement) => {
              svgElement.removeAttribute('data-svg-loaded');
            });
            
            // Затем обрабатываем SVG элементы, которые были заменены на SVG, но не имеют data-svg-src
            card.querySelectorAll('.project-card-star, .project-card-divider').forEach((iconElement) => {
              // Если это уже SVG элемент без data-svg-src, нужно восстановить span
              if (iconElement.tagName === 'svg' && !iconElement.hasAttribute('data-svg-src')) {
                const classes = iconElement.className.baseVal || iconElement.className;
                const isString = typeof classes === 'string';
                const isStar = isString && classes.includes('project-card-star');
                const isDivider = isString && classes.includes('project-card-divider');
                
                if (isStar || isDivider) {
                  const newSpan = document.createElement('span');
                  newSpan.className = isStar ? 'project-card-star' : 'project-card-divider';
                  newSpan.setAttribute('data-svg-src', isStar 
                    ? '/assets/images/icon-star.svg' 
                    : '/assets/images/icon-divider-small.svg');
                  if (iconElement.parentNode) {
                    iconElement.parentNode.replaceChild(newSpan, iconElement);
                  }
                }
              } else if (iconElement.tagName === 'SPAN' && iconElement.hasAttribute('data-svg-src')) {
                // Если это span с data-svg-src, убеждаемся что data-svg-loaded удален
                iconElement.removeAttribute('data-svg-loaded');
              }
            });
            
            // Устанавливаем начальное состояние для анимации ПЕРЕД добавлением в DOM
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            card.style.transition = 'none'; // Отключаем transition для мгновенного применения начального состояния
            // Добавляем обработчик клика на всю карточку
            card.addEventListener('click', (e) => {
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
            const detailsButton = card.querySelector('.project-card-button');
            if (detailsButton) {
              detailsButton.addEventListener('click', (e) => {
                e.stopPropagation();
                // Ссылка <a> открывается сама
                if (detailsButton.tagName === 'A') return;
                // Не открываем для проектов "скоро"
                if (!project.comingSoon) {
                  this.onCardClick(project);
                }
              });
            }
          }

          if (card) {
            sectionGrid.appendChild(card);
            
            // Инициализируем ленивую загрузку изображения для карточки
            const cardImage = card.querySelector('img[data-src]');
            if (cardImage) {
              lazyImageLoader.loadImage(cardImage);
            }
            
            visibleCount++;
          }
        }
      });

      // Обновляем счетчик
      countElement.textContent = visibleCount;
      this.announceCount(visibleCount);

      // Добавляем сетку в контейнер секции
      if (visibleCount === 0) {
        const empty = document.createElement('p');
        empty.className = 'projects-empty-state';
        empty.textContent = localization.t('projects.filters.empty');
        sectionContainer.appendChild(empty);
      }
      sectionContainer.appendChild(sectionGrid);

      // Добавляем секцию в grid
      grid.appendChild(sectionContainer);

      // Плавное появление карточек одновременно
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const cards = sectionGrid.querySelectorAll('.project-card');
          if (cards.length > 0) {
            animateElementsAppearance(cards);
          }
        });
      });

      // Загружаем SVG для звездочек после добавления карточек
      // Используем глобальный экземпляр для переиспользования кеша
      requestAnimationFrame(async () => {
        try {
          const { globalSvgLoader } = await import('../components/svg/SvgLoader.js');
          await globalSvgLoader.init();
        } catch (error) {
          console.error('Ошибка загрузки SVG:', error);
        }
      });
    } finally {
      // Сбрасываем флаг после завершения применения фильтров
      this.isApplyingFilters = false;
    }
  }

  /**
   * Уничтожение компонента и освобождение ресурсов
   * Предотвращает накопление listeners при SPA-навигации
   */
  destroy() {
    // Сброс состояния
    this.activeFilters = {
      category: [],
    };
    this.projectFiltersTemplate = null;
    this.isApplyingFilters = false;
  }
}
