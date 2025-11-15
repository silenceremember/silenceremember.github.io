/**
 * Менеджер фильтров проектов
 * Управляет фильтрацией проектов по категориям, статусам и годам
 */

import { CardFactory } from '../factories/CardFactory.js';
import { ANIMATION_CONFIG, animateElementsAppearance, animateElementAppearance } from '../utils/AnimationUtils.js';
import { loadHTML } from '../layout.js';

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
    this.onExpandedSectionsClear = callbacks.onExpandedSectionsClear || (() => {});
    
    /** @type {Object<string, Array<string>>} */
    this.activeFilters = {
      category: [],
      status: [],
      year: []
    };
    
    /** @type {string|null} */
    this.savedYearButtonWidth = null;
    
    /** @type {string|null} */
    this.projectFiltersTemplate = null;
  }

  /**
   * Инициализирует фильтры
   * @param {Array<Object>} projects - Массив проектов для инициализации фильтров
   */
  async init(projects) {
    if (projects) {
      this.projects = projects;
    }
    
    const filtersContainer = document.getElementById('projects-filters-container');
    if (!filtersContainer) return;
    
    // Загружаем шаблон фильтров, если еще не загружен
    if (!this.projectFiltersTemplate) {
      try {
        this.projectFiltersTemplate = await loadHTML('/components/project-filters.html');
      } catch (error) {
        console.error('Ошибка загрузки шаблона фильтров:', error);
        return;
      }
    }
    
    // Сохраняем ширину кнопки года перед пересозданием фильтров (если она существует)
    const existingYearButton = filtersContainer.querySelector('#project-filters-year-button');
    if (existingYearButton && existingYearButton.style.width) {
      this.savedYearButtonWidth = existingYearButton.style.width;
    }
    
    // Получаем уникальные значения для фильтров
    const categories = [...new Set(this.projects.map(p => p.category))];
    const statuses = [...new Set(this.projects.map(p => p.status))];
    const years = [...new Set(this.projects.map(p => p.year).filter(Boolean).sort((a, b) => b - a))];
    
    // Вставляем фильтры
    if (this.projectFiltersTemplate) {
      filtersContainer.innerHTML = this.projectFiltersTemplate;
      
      // Находим контейнер фильтров для анимации
      const filtersContent = filtersContainer.querySelector('.project-filters-content');
      
      // Устанавливаем начальное состояние для всей секции фильтров ДО любых операций
      // Это предотвращает мерцание кнопки года и других элементов
      if (filtersContent) {
        filtersContent.style.opacity = '0';
        filtersContent.style.transform = 'translateY(10px)';
        filtersContent.style.transition = 'none';
        // Принудительный reflow для применения начального состояния
        void filtersContent.offsetHeight;
      }
      
      // Подсчитываем проекты по годам для dropdown
      const yearCounts = {};
      this.projects.forEach(project => {
        if (project.year) {
          yearCounts[project.year] = (yearCounts[project.year] || 0) + 1;
        }
      });
      
      // Добавляем динамические опции по годам в dropdown
      const yearDropdownMenu = filtersContainer.querySelector('#project-filters-year-dropdown-menu');
      const yearDropdownButton = filtersContainer.querySelector('#project-filters-year-button');
      
      // Флаг для отслеживания, была ли запущена анимация фильтров
      let filtersAnimationStarted = false;
      
      if (yearDropdownMenu) {
        // Добавляем опцию с прочерком для отмены выбора года
        const dashOption = document.createElement('button');
        dashOption.className = 'project-filters-year-option project-filters-year-option-dash';
        dashOption.type = 'button';
        dashOption.setAttribute('data-value', '');
        dashOption.innerHTML = `
          <span class="project-filters-year-option-label">—</span>
          <span class="project-filters-year-option-count" style="display: none;"></span>
        `;
        yearDropdownMenu.appendChild(dashOption);
        
        // Добавляем опции по годам
        years.forEach(year => {
          const option = document.createElement('button');
          option.className = 'project-filters-year-option';
          option.type = 'button';
          option.setAttribute('data-value', year.toString());
          option.innerHTML = `
            <span class="project-filters-year-option-label">${year}</span>
            <span class="project-filters-year-option-count">${yearCounts[year] || 0}</span>
          `;
          yearDropdownMenu.appendChild(option);
        });
        
        // Устанавливаем ширину кнопки равной самому широкому элементу в dropdown
        // Ширина устанавливается один раз при инициализации и не меняется при изменении размера окна
        if (yearDropdownButton) {
          let fixedButtonWidth = null; // Сохраняем фиксированную ширину
          let shouldCalculateWidth = true; // Флаг для определения, нужно ли пересчитывать ширину
          
          // Если есть сохраненная ширина из предыдущей инициализации, применяем ее сразу
          if (this.savedYearButtonWidth) {
            const widthValue = parseFloat(this.savedYearButtonWidth);
            if (widthValue > 0) {
              yearDropdownButton.style.width = this.savedYearButtonWidth;
              yearDropdownButton.style.minWidth = this.savedYearButtonWidth;
              yearDropdownButton.style.maxWidth = this.savedYearButtonWidth;
              yearDropdownMenu.style.width = this.savedYearButtonWidth;
              const isMobile = window.innerWidth < 1024;
              if (isMobile) {
                yearDropdownMenu.style.setProperty('width', this.savedYearButtonWidth, 'important');
                yearDropdownMenu.style.setProperty('min-width', '0', 'important');
              }
              fixedButtonWidth = widthValue;
              // Кнопка уже видима, не нужно скрывать/показывать и пересчитывать
              shouldCalculateWidth = false;
            }
          }
          
          // Пересчитываем ширину только если она не была восстановлена из сохраненного значения
          if (shouldCalculateWidth) {
            const calculateYearDropdownWidth = () => {
              // Используем двойной requestAnimationFrame для гарантии завершения рендеринга
              return new Promise((resolve) => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    // Сохраняем текущие inline стили
                    const buttonOriginalWidth = yearDropdownButton.style.width;
                    const menuOriginalWidth = yearDropdownMenu.style.width;
                    
                    // Временно убираем inline стили для правильного измерения
                    yearDropdownButton.style.width = '';
                    yearDropdownMenu.style.width = '';
                    
                    // Создаем временный контейнер вне viewport для точного измерения
                    // Это гарантирует, что измерение не зависит от текущего размера окна
                    const tempContainer = document.createElement('div');
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.visibility = 'hidden';
                    tempContainer.style.top = '-9999px';
                    tempContainer.style.left = '-9999px';
                    tempContainer.style.display = 'flex';
                    tempContainer.style.flexDirection = 'column';
                    tempContainer.style.width = 'auto';
                    tempContainer.style.height = 'auto';
                    tempContainer.style.overflow = 'visible';
                    document.body.appendChild(tempContainer);
                    
                    // Клонируем меню и опции для измерения
                    const clonedMenu = yearDropdownMenu.cloneNode(true);
                    clonedMenu.hidden = false;
                    clonedMenu.style.display = 'flex';
                    clonedMenu.style.flexDirection = 'column';
                    clonedMenu.style.visibility = 'visible';
                    clonedMenu.style.position = 'static';
                    clonedMenu.style.width = 'auto';
                    clonedMenu.style.minWidth = 'auto';
                    clonedMenu.style.maxWidth = 'none';
                    clonedMenu.style.maxHeight = 'none';
                    clonedMenu.style.overflow = 'visible';
                    tempContainer.appendChild(clonedMenu);
                    
                    // Находим максимальную ширину среди всех опций
                    const options = clonedMenu.querySelectorAll('.project-filters-year-option');
                    let maxWidth = 0;
                    
                    if (options.length === 0) {
                      // Если опций нет, удаляем временный контейнер и возвращаем 0
                      document.body.removeChild(tempContainer);
                      yearDropdownButton.style.width = buttonOriginalWidth;
                      yearDropdownMenu.style.width = menuOriginalWidth;
                      resolve(0);
                      return;
                    }
                    
                    options.forEach(option => {
                      // Временно сбрасываем любые inline стили для правильного измерения
                      const originalWidth = option.style.width;
                      const originalDisplay = option.style.display;
                      option.style.width = 'auto';
                      option.style.display = 'flex';
                      
                      // Используем getBoundingClientRect для более точного измерения
                      // включая padding и border
                      const rect = option.getBoundingClientRect();
                      const width = rect.width;
                      
                      // Восстанавливаем оригинальные стили
                      option.style.width = originalWidth;
                      option.style.display = originalDisplay;
                      
                      if (width > maxWidth) {
                        maxWidth = width;
                      }
                    });
                    
                    // Удаляем временный контейнер
                    document.body.removeChild(tempContainer);
                    
                    // Возвращаем кнопку и меню в исходное состояние
                    yearDropdownButton.style.width = buttonOriginalWidth;
                    yearDropdownMenu.style.width = menuOriginalWidth;
                    
                    resolve(maxWidth);
                  });
                });
              });
            };
            
            const setYearDropdownWidth = (width) => {
              if (width > 0) {
                // Устанавливаем фиксированную ширину для кнопки
                yearDropdownButton.style.width = `${width}px`;
                yearDropdownButton.style.minWidth = `${width}px`;
                yearDropdownButton.style.maxWidth = `${width}px`;
                
                // Устанавливаем ширину для меню
                yearDropdownMenu.style.width = `${width}px`;
                // В mobile режиме используем setProperty с important для переопределения CSS
                const isMobile = window.innerWidth < 1024;
                if (isMobile) {
                  yearDropdownMenu.style.setProperty('width', `${width}px`, 'important');
                  yearDropdownMenu.style.setProperty('min-width', '0', 'important');
                }
                
                fixedButtonWidth = width;
                
                // Сохраняем ширину для следующей инициализации
                this.savedYearButtonWidth = `${width}px`;
              }
            };
            
            // Устанавливаем ширину при инициализации один раз
            // Используем дополнительную задержку для гарантии полного рендеринга после hideLoadingIndicator
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTimeout(() => {
                  calculateYearDropdownWidth().then((maxWidth) => {
                    setYearDropdownWidth(maxWidth);
                    // После установки ширины запускаем анимацию фильтров
                    // Это гарантирует, что кнопка года не будет мерцать
                    if (filtersContent && !filtersAnimationStarted) {
                      filtersAnimationStarted = true;
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          animateElementAppearance(filtersContent);
                        });
                      });
                    }
                  });
                }, 50); // Небольшая задержка для гарантии рендеринга
              });
            });
          } else {
            // Если ширина уже была восстановлена, сразу запускаем анимацию фильтров
            if (filtersContent && !filtersAnimationStarted) {
              filtersAnimationStarted = true;
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  animateElementAppearance(filtersContent);
                });
              });
            }
          }
        } else {
          // Если кнопка года не найдена, запускаем анимацию фильтров сразу
          if (filtersContent && !filtersAnimationStarted) {
            filtersAnimationStarted = true;
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                animateElementAppearance(filtersContent);
              });
            });
          }
        }
      } else {
        // Если dropdown меню не найдено, запускаем анимацию фильтров сразу
        if (filtersContent && !filtersAnimationStarted) {
          filtersAnimationStarted = true;
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              animateElementAppearance(filtersContent);
            });
          });
        }
      }
    }
    
    // Обновляем счетчики фильтров (для категорий и статусов)
    this.updateFilterCounts(this.projects);
    
    // Инициализируем фильтры
    this.initFilterButtons();
    // Инициализируем dropdown после создания опций
    this.initYearDropdown();
  }

  /**
   * Обновляет счетчики в фильтрах
   * @param {Array<Object>} projects - Массив проектов для подсчета
   */
  updateFilterCounts(projects) {
    // Подсчитываем проекты по категориям и статусам
    const categoryCounts = {};
    const statusCounts = {};
    
    projects.forEach(project => {
      categoryCounts[project.category] = (categoryCounts[project.category] || 0) + 1;
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
    });
    
    // Обновляем счетчики для категорий и статусов
    document.querySelectorAll('.project-filters-option').forEach(button => {
      const value = button.getAttribute('data-value');
      const countEl = button.querySelector('.project-filters-option-count');
      if (!countEl) return;
      
      const parent = button.closest('[data-filter]');
      if (!parent) return;
      
      const filterType = parent.getAttribute('data-filter');
      let count = 0;
      
      if (filterType === 'category') {
        count = categoryCounts[value] || 0;
      } else if (filterType === 'status') {
        count = statusCounts[value] || 0;
      }
      
      countEl.textContent = count;
    });
  }

  /**
   * Инициализирует кнопки фильтров
   */
  initFilterButtons() {
    const buttons = document.querySelectorAll('.project-filters-option');
    
    buttons.forEach(button => {
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
    
    // Кнопка сброса фильтров
    const resetButton = document.getElementById('project-filters-reset');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
  }

  /**
   * Инициализирует dropdown для фильтра по году
   */
  initYearDropdown() {
    const dropdownButton = document.getElementById('project-filters-year-button');
    const dropdownMenu = document.getElementById('project-filters-year-dropdown-menu');
    
    if (!dropdownButton || !dropdownMenu) {
      console.warn('Dropdown элементы не найдены');
      return;
    }
    
    // Открытие/закрытие dropdown
    dropdownButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = dropdownButton.getAttribute('aria-expanded') === 'true';
      const newExpandedState = !isExpanded;
      
      dropdownButton.setAttribute('aria-expanded', newExpandedState);
      
      if (newExpandedState) {
        // Открываем меню с анимацией
        dropdownMenu.hidden = false;
        // Очищаем inline стили для правильного позиционирования из CSS
        dropdownMenu.style.top = '';
        dropdownMenu.style.left = '';
        // Устанавливаем начальное состояние
        dropdownMenu.style.opacity = '0';
        // Запускаем анимацию появления быстрее, как у карточек
        requestAnimationFrame(() => {
          dropdownMenu.style.transition = 'opacity 0.15s ease-in-out';
          dropdownMenu.style.opacity = '1';
        });
      } else {
        // Закрываем меню с анимацией
        dropdownMenu.style.transition = 'opacity 0.15s ease-in-out';
        dropdownMenu.style.opacity = '0';
        setTimeout(() => {
          dropdownMenu.hidden = true;
          // Очищаем inline стили после анимации
          dropdownMenu.style.opacity = '';
          dropdownMenu.style.transition = '';
        }, 150);
      }
    });
    
    // Закрытие dropdown при клике вне его
    const handleDocumentClick = (e) => {
      if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownButton.setAttribute('aria-expanded', 'false');
        dropdownMenu.style.transition = 'opacity 0.15s ease-in-out';
        dropdownMenu.style.opacity = '0';
        setTimeout(() => {
          dropdownMenu.hidden = true;
          // Очищаем inline стили после анимации
          dropdownMenu.style.opacity = '';
          dropdownMenu.style.transition = '';
        }, 150);
      }
    };
    
    // Используем capture фазу для правильной обработки кликов
    document.addEventListener('click', handleDocumentClick, true);
    
    // Обработка выбора года
    const handleYearOptionClick = (option) => {
      const year = option.getAttribute('data-value');
      const yearLabelEl = option.querySelector('.project-filters-year-option-label');
      const yearCountEl = option.querySelector('.project-filters-year-option-count');
      
      // Извлекаем текст и счетчик
      const yearLabel = yearLabelEl ? yearLabelEl.textContent.trim() : year;
      const yearCount = yearCountEl && yearCountEl.style.display !== 'none' 
        ? yearCountEl.textContent.trim() 
        : '0';
      
      // Обновляем кнопку dropdown
      const buttonLabel = dropdownButton.querySelector('.project-filters-year-button-label');
      const buttonCount = dropdownButton.querySelector('.project-filters-year-button-count');
      
      // Закрываем dropdown с анимацией
      dropdownButton.setAttribute('aria-expanded', 'false');
      dropdownMenu.style.transition = 'opacity 0.15s ease-in-out';
      dropdownMenu.style.opacity = '0';
      setTimeout(() => {
        dropdownMenu.hidden = true;
        // Очищаем inline стили после анимации
        dropdownMenu.style.opacity = '';
        dropdownMenu.style.transition = '';
      }, 150);
      
      // Если выбран прочерк (пустое значение) или тот же год, снимаем фильтр
      if (!year || year === '' || (this.activeFilters.year.length > 0 && this.activeFilters.year[0] === year)) {
        // Снимаем фильтр
        this.activeFilters.year = [];
        if (buttonLabel) buttonLabel.textContent = '—';
        if (buttonCount) {
          buttonCount.textContent = '0';
          buttonCount.style.display = 'none';
        }
        dropdownButton.classList.remove('has-count');
      } else {
        // Устанавливаем новый фильтр
        this.activeFilters.year = [year];
        if (buttonLabel) buttonLabel.textContent = yearLabel;
        if (buttonCount) {
          buttonCount.textContent = yearCount;
          buttonCount.style.display = 'flex';
        }
        dropdownButton.classList.add('has-count');
      }
      
      this.applyFilters();
    };
    
    // Добавляем обработчики событий на опции (используем делегирование событий)
    dropdownMenu.addEventListener('click', (e) => {
      const option = e.target.closest('.project-filters-year-option');
      if (option) {
        e.stopPropagation();
        handleYearOptionClick(option);
      }
    });
  }

  /**
   * Переключает фильтр
   * @param {string} type - Тип фильтра ('category', 'status', 'year')
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
   * Очищает все фильтры
   */
  clearAllFilters() {
    this.activeFilters = {
      category: [],
      status: [],
      year: []
    };
    
    // Сбрасываем все кнопки
    document.querySelectorAll('.project-filters-option').forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.classList.remove('active');
    });
    
    // Сбрасываем dropdown года
    const dropdownButton = document.getElementById('project-filters-year-button');
    const dropdownMenu = document.getElementById('project-filters-year-dropdown-menu');
    if (dropdownButton) {
      const buttonLabel = dropdownButton.querySelector('.project-filters-year-button-label');
      const buttonCount = dropdownButton.querySelector('.project-filters-year-button-count');
      if (buttonLabel) buttonLabel.textContent = '—';
      if (buttonCount) {
        buttonCount.textContent = '0';
        buttonCount.style.display = 'none';
      }
      dropdownButton.classList.remove('has-count');
      dropdownButton.setAttribute('aria-expanded', 'false');
    }
    if (dropdownMenu) {
      dropdownMenu.style.transition = 'opacity 0.3s ease-in-out';
      dropdownMenu.style.opacity = '0';
      setTimeout(() => {
        dropdownMenu.hidden = true;
        // Очищаем inline стили после анимации
        dropdownMenu.style.opacity = '';
        dropdownMenu.style.transition = '';
      }, 300);
    }
    
    this.applyFilters();
  }

  /**
   * Применяет фильтры и обновляет отображение
   */
  async applyFilters() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    
    // Убеждаемся, что индикатор загрузки скрыт (на случай, если он остался)
    await this.onHideLoading();
    
    // Проверяем, есть ли активные фильтры
    const hasActiveFilters = Object.values(this.activeFilters).some(arr => arr.length > 0);
    
    if (!hasActiveFilters) {
      // Если фильтров нет, группируем по разделам
      // Сбрасываем состояние развернутости при переключении на группировку
      this.onExpandedSectionsClear();
      await this.onRenderGrouped();
      return;
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
    titleContainer.textContent = 'НАЙДЕНО ПРОЕКТОВ';
    sectionTitle.appendChild(titleContainer);
    
    // Добавляем счетчик
    const countElement = document.createElement('span');
    countElement.className = 'project-filters-option-count';
    countElement.textContent = '0';
    sectionTitle.appendChild(countElement);
    
    // Добавляем кнопку "Сбросить"
    const resetButton = document.createElement('button');
    resetButton.className = 'projects-section-expand';
    resetButton.id = 'project-filters-reset';
    resetButton.setAttribute('aria-label', 'Сбросить фильтры');
    const resetButtonText = document.createElement('span');
    resetButtonText.className = 'projects-section-expand-text';
    resetButtonText.textContent = 'Сбросить';
    resetButton.appendChild(resetButtonText);
    resetButton.addEventListener('click', () => {
      this.clearAllFilters();
    });
    sectionTitle.appendChild(resetButton);
    
    sectionHeader.appendChild(sectionTitle);
    sectionContainer.appendChild(sectionHeader);
    
    // Создаем сетку для проектов
    const sectionGrid = document.createElement('div');
    sectionGrid.className = 'projects-section-grid';
    
    // Фильтруем и добавляем карточки
    let visibleCount = 0;
    
    this.projects.forEach(project => {
      let visible = true;
      
      // Проверяем категорию
      if (visible && this.activeFilters.category.length > 0) {
        if (!this.activeFilters.category.includes(project.category)) {
          visible = false;
        }
      }
      
      // Проверяем статус
      if (visible && this.activeFilters.status.length > 0) {
        if (!this.activeFilters.status.includes(project.status)) {
          visible = false;
        }
      }
      
      // Проверяем год
      if (visible && this.activeFilters.year.length > 0) {
        if (project.year && !this.activeFilters.year.includes(project.year.toString())) {
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
            this.onCardClick(project);
          });
          // Добавляем обработчик на кнопку "Подробнее"
          const detailsButton = card.querySelector('.project-card-button');
          if (detailsButton) {
            detailsButton.addEventListener('click', (e) => {
              e.stopPropagation();
              this.onCardClick(project);
            });
          }
        }
        
        if (card) {
          sectionGrid.appendChild(card);
          visibleCount++;
        }
      }
    });
    
    // Обновляем счетчик
    countElement.textContent = visibleCount;
    
    // Добавляем сетку в контейнер секции
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
    requestAnimationFrame(async () => {
      try {
        const svgLoaderModule = await import('../components/svg-loader.js');
        if (svgLoaderModule.default) {
          await svgLoaderModule.default();
        }
      } catch (error) {
        console.error('Ошибка загрузки SVG:', error);
      }
    });
    
    // Показываем сообщение об отсутствии проектов
    const empty = document.getElementById('projects-empty');
    if (empty) {
      if (visibleCount === 0) {
        empty.style.display = '';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            animateElementAppearance(empty);
          });
        });
      } else {
        empty.style.transition = `opacity ${ANIMATION_CONFIG.duration} ${ANIMATION_CONFIG.timing}, transform ${ANIMATION_CONFIG.duration} ${ANIMATION_CONFIG.timing}`;
        empty.style.opacity = '0';
        empty.style.transform = ANIMATION_CONFIG.translateYDisappear;
        setTimeout(() => {
          empty.style.display = 'none';
        }, ANIMATION_CONFIG.timeout);
      }
    }
  }
}

