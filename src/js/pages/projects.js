/**
 * Страница проектов - загрузка и отображение проектов из JSON
 */

import { loadHTML } from '../layout.js';
import { getRoleLabel } from '../utils/role-mapper.js';

// Константы для унифицированных анимаций карточек
const CARD_ANIMATION = {
  duration: '0.3s',
  timing: 'ease-in-out',
  translateYAppear: '10px',    // Начальное смещение при появлении (снизу)
  translateYDisappear: '-10px', // Конечное смещение при исчезновении (вверх)
  translateYFinal: '0',          // Финальная позиция
  timeout: 300                   // Таймаут в миллисекундах
};

// Загрузка компонентов
let projectCardTemplate = null;
let projectFiltersTemplate = null;

/**
 * Загружает шаблоны компонентов
 */
async function loadTemplates() {
  if (!projectCardTemplate) {
    try {
      const cardHTML = await loadHTML('/components/project-card.html');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cardHTML;
      projectCardTemplate = tempDiv.querySelector('.project-card') || tempDiv.firstElementChild;
      if (!projectCardTemplate) {
        console.error('Не удалось найти шаблон карточки проекта');
      }
    } catch (error) {
      console.error('Ошибка загрузки шаблона карточки:', error);
    }
  }
  if (!projectFiltersTemplate) {
    try {
      projectFiltersTemplate = await loadHTML('/components/project-filters.html');
    } catch (error) {
      console.error('Ошибка загрузки шаблона фильтров:', error);
    }
  }
}

/**
 * Загружает данные проектов из JSON
 */
async function loadProjectsData() {
  try {
    const response = await fetch('/data/projects.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error('Ошибка загрузки проектов:', error);
    return [];
  }
}

/**
 * Создает HTML для карточки проекта
 */
function createProjectCard(project) {
  if (!projectCardTemplate) return null;
  
  const card = projectCardTemplate.cloneNode(true);
  
  // Заполняем данные
  const title = card.querySelector('.project-card-title');
  const description = card.querySelector('.project-card-description');
  const image = card.querySelector('.project-card-image');
  const tags = card.querySelector('.project-card-tags');
  const status = card.querySelector('.project-card-status');
  const category = card.querySelector('.project-card-category');
  const type = card.querySelector('.project-card-type');
  const year = card.querySelector('.project-card-year');
  const role = card.querySelector('.project-card-role');
  
  if (title) title.textContent = project.title;
  if (description) description.textContent = project.description || '';
  if (image && project.media?.preview) {
    image.src = project.media.preview;
    image.alt = project.title;
  }
  
  // Теги
  if (tags && project.tags?.length) {
    tags.innerHTML = '';
    project.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'project-card-tag';
      tagEl.textContent = tag;
      tags.appendChild(tagEl);
    });
  }
  
  // Статус
  if (status) {
    status.textContent = project.status === 'completed' ? 'Готов' : 'В разработке';
    status.className = `project-card-status project-card-status-${project.status}`;
  }
  
  // Мета-информация
  // Скрываем категорию, так как карточки уже сгруппированы по категориям
  if (category) {
    category.style.display = 'none';
  }
  
  if (type) {
    const typeLabels = {
      'game': 'Игра',
      'document': 'Документ',
      'tool': 'Инструмент',
      'script': 'Скрипт'
    };
    type.textContent = typeLabels[project.type] || project.type;
  }
  
  // Добавляем звездочку для избранных проектов
  if (project.featured && title) {
    const starIcon = document.createElement('span');
    starIcon.className = 'project-card-star';
    starIcon.setAttribute('data-svg-src', 'assets/images/icon-star.svg');
    starIcon.setAttribute('aria-label', 'Избранный проект');
    title.appendChild(starIcon);
  }
  
  if (year && project.year) {
    year.textContent = project.year;
  }
  
  if (role) {
    role.textContent = getRoleLabel(project.role, false, project.teamName);
  }
  
  // Добавляем data-атрибут для фильтрации
  card.setAttribute('data-project-id', project.id);
  card.setAttribute('data-category', project.category);
  card.setAttribute('data-type', project.type);
  card.setAttribute('data-status', project.status);
  if (project.year) {
    card.setAttribute('data-year', project.year.toString());
  }
  
  // Обработчик клика для открытия деталей проекта
  // Вся карточка работает как кнопка
  card.addEventListener('click', (e) => {
    // Предотвращаем всплытие события от кнопки "Подробнее"
    // но все равно открываем детали проекта
    e.stopPropagation();
    openProjectDetails(project);
  });
  
  // Кнопка "Подробнее" также открывает детали проекта
  const detailsButton = card.querySelector('.project-card-button');
  if (detailsButton) {
    detailsButton.addEventListener('click', (e) => {
      e.stopPropagation();
      openProjectDetails(project);
    });
  }
  
  return card;
}

/**
 * Открывает детальную страницу проекта
 */
function openProjectDetails(project) {
  console.log('Открытие проекта:', project.title);
  // TODO: Реализовать модальное окно с деталями проекта
}

/**
 * Инициализирует фильтры
 */
function initFilters(projects) {
  const filtersContainer = document.getElementById('projects-filters-container');
  if (!filtersContainer) return;
  
  // Получаем уникальные значения для фильтров
  const categories = [...new Set(projects.map(p => p.category))];
  const statuses = [...new Set(projects.map(p => p.status))];
  const years = [...new Set(projects.map(p => p.year).filter(Boolean).sort((a, b) => b - a))];
  
  // Вставляем фильтры
  if (projectFiltersTemplate) {
    filtersContainer.innerHTML = projectFiltersTemplate;
    
    // Подсчитываем проекты по годам для dropdown
    const yearCounts = {};
    projects.forEach(project => {
      if (project.year) {
        yearCounts[project.year] = (yearCounts[project.year] || 0) + 1;
      }
    });
    
    // Добавляем динамические опции по годам в dropdown
    const yearDropdownMenu = filtersContainer.querySelector('#project-filters-year-dropdown-menu');
    const yearDropdownButton = filtersContainer.querySelector('#project-filters-year-button');
    
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
      if (yearDropdownButton) {
        const updateYearDropdownWidth = () => {
          // Используем requestAnimationFrame для измерения после рендеринга
          requestAnimationFrame(() => {
            // Сохраняем текущие inline стили
            const buttonOriginalWidth = yearDropdownButton.style.width;
            const menuOriginalWidth = yearDropdownMenu.style.width;
            
            // Временно убираем inline стили для правильного измерения
            yearDropdownButton.style.width = '';
            yearDropdownMenu.style.width = '';
            
            // Временно показываем меню для измерения ширины
            const originalHidden = yearDropdownMenu.hidden;
            const originalDisplay = yearDropdownMenu.style.display;
            const originalVisibility = yearDropdownMenu.style.visibility;
            const originalPosition = yearDropdownMenu.style.position;
            const originalTop = yearDropdownMenu.style.top;
            const originalLeft = yearDropdownMenu.style.left;
            
            yearDropdownMenu.hidden = false;
            yearDropdownMenu.style.display = 'flex';
            yearDropdownMenu.style.visibility = 'hidden';
            yearDropdownMenu.style.position = 'absolute';
            yearDropdownMenu.style.top = '0';
            yearDropdownMenu.style.left = '0';
            
            // Находим максимальную ширину среди всех опций
            const options = yearDropdownMenu.querySelectorAll('.project-filters-year-option');
            let maxWidth = 0;
            options.forEach(option => {
              // Временно показываем опцию для измерения
              const optionDisplay = option.style.display;
              option.style.display = '';
              const width = option.scrollWidth || option.offsetWidth;
              option.style.display = optionDisplay;
              
              if (width > maxWidth) {
                maxWidth = width;
              }
            });
            
            // Также проверяем ширину самой кнопки (на случай если она шире)
            const buttonWidth = yearDropdownButton.scrollWidth || yearDropdownButton.offsetWidth;
            const finalWidth = Math.max(maxWidth, buttonWidth);
            
            // Возвращаем меню в исходное состояние
            yearDropdownMenu.hidden = originalHidden;
            yearDropdownMenu.style.display = originalDisplay;
            yearDropdownMenu.style.visibility = originalVisibility;
            yearDropdownMenu.style.position = originalPosition;
            yearDropdownMenu.style.top = originalTop;
            yearDropdownMenu.style.left = originalLeft;
            
            // Устанавливаем ширину для кнопки и меню (работает и в desktop, и в mobile)
            if (finalWidth > 0) {
              yearDropdownButton.style.width = `${finalWidth}px`;
              // В mobile режиме используем setProperty с important для переопределения CSS
              const isMobile = window.innerWidth <= 768;
              if (isMobile) {
                yearDropdownMenu.style.setProperty('width', `${finalWidth}px`, 'important');
                yearDropdownMenu.style.setProperty('min-width', '0', 'important');
              } else {
                yearDropdownMenu.style.width = `${finalWidth}px`;
              }
            } else {
              // Если что-то пошло не так, восстанавливаем оригинальные стили
              yearDropdownButton.style.width = buttonOriginalWidth;
              yearDropdownMenu.style.width = menuOriginalWidth;
            }
          });
        };
        
        // Устанавливаем ширину при инициализации
        updateYearDropdownWidth();
        
        // Обновляем ширину при изменении размера окна
        let resizeTimeout;
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(updateYearDropdownWidth, 100);
        });
      }
    }
    
    // Обновляем счетчики фильтров (для категорий и статусов)
    updateFilterCounts(projects);
    
    // Инициализируем фильтры
    initFilterButtons();
    // Инициализируем dropdown после создания опций
    initYearDropdown();
  }
}

/**
 * Обновляет счетчики в фильтрах
 */
function updateFilterCounts(projects) {
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
function initFilterButtons() {
  const buttons = document.querySelectorAll('.project-filters-option');
  
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const parent = button.closest('[data-filter]');
      if (!parent) return;
      
      const type = parent.getAttribute('data-filter');
      const value = button.getAttribute('data-value');
      if (type && value) {
        toggleFilter(type, value, button);
      }
    });
  });
  
  // Кнопка сброса фильтров
  const resetButton = document.getElementById('project-filters-reset');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      clearAllFilters();
    });
  }
}

/**
 * Инициализирует dropdown для фильтра по году
 */
function initYearDropdown() {
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
    if (!year || year === '' || (activeFilters.year.length > 0 && activeFilters.year[0] === year)) {
      // Снимаем фильтр
      activeFilters.year = [];
      if (buttonLabel) buttonLabel.textContent = '—';
      if (buttonCount) {
        buttonCount.textContent = '0';
        buttonCount.style.display = 'none';
      }
      dropdownButton.classList.remove('has-count');
    } else {
      // Устанавливаем новый фильтр
      activeFilters.year = [year];
      if (buttonLabel) buttonLabel.textContent = yearLabel;
      if (buttonCount) {
        buttonCount.textContent = yearCount;
        buttonCount.style.display = 'flex';
      }
      dropdownButton.classList.add('has-count');
    }
    
    applyFilters();
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
 */
let activeFilters = {
  category: [],
  status: [],
  year: []
};

function toggleFilter(type, value, button) {
  if (!activeFilters[type]) {
    activeFilters[type] = [];
  }
  
  const index = activeFilters[type].indexOf(value);
  const isActive = index !== -1;
  
  if (isActive) {
    activeFilters[type].splice(index, 1);
    button.setAttribute('aria-pressed', 'false');
    button.classList.remove('active');
  } else {
    activeFilters[type].push(value);
    button.setAttribute('aria-pressed', 'true');
    button.classList.add('active');
  }
  
  applyFilters();
}

/**
 * Очищает все фильтры
 */
function clearAllFilters() {
  activeFilters = {
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
  
  applyFilters();
}

/**
 * Применяет фильтры и обновляет отображение
 */
function applyFilters() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  // Убеждаемся, что индикатор загрузки скрыт (на случай, если он остался)
  hideLoadingIndicator();
  
  // Проверяем, есть ли активные фильтры
  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);
  
  if (!hasActiveFilters) {
    // Если фильтров нет, группируем по разделам
    // Сбрасываем состояние развернутости при переключении на группировку
    expandedSections.clear();
    renderGroupedProjects();
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
    clearAllFilters();
  });
  sectionTitle.appendChild(resetButton);
  
  sectionHeader.appendChild(sectionTitle);
  sectionContainer.appendChild(sectionHeader);
  
  // Создаем сетку для проектов
  const sectionGrid = document.createElement('div');
  sectionGrid.className = 'projects-section-grid';
  
  // Фильтруем и добавляем карточки
  let visibleCount = 0;
  
  allProjects.forEach(project => {
    let visible = true;
    
    // Проверяем категорию
    if (visible && activeFilters.category.length > 0) {
      if (!activeFilters.category.includes(project.category)) {
        visible = false;
      }
    }
    
    // Проверяем статус
    if (visible && activeFilters.status.length > 0) {
      if (!activeFilters.status.includes(project.status)) {
        visible = false;
      }
    }
    
    // Проверяем год
    if (visible && activeFilters.year.length > 0) {
      if (project.year && !activeFilters.year.includes(project.year.toString())) {
        visible = false;
      }
    }
    
    // Добавляем только видимые карточки
    if (visible) {
      const originalCard = allProjectCards.get(project.id);
      if (originalCard) {
        const clonedCard = originalCard.cloneNode(true);
        // Устанавливаем начальное состояние для анимации ПЕРЕД добавлением в DOM
        clonedCard.style.opacity = '0';
        clonedCard.style.transform = 'translateY(10px)';
        clonedCard.style.transition = 'none'; // Отключаем transition для мгновенного применения начального состояния
        // Добавляем обработчик клика на всю карточку
        clonedCard.addEventListener('click', (e) => {
          e.stopPropagation();
          openProjectDetails(project);
        });
        // Добавляем обработчик на кнопку "Подробнее"
        const detailsButton = clonedCard.querySelector('.project-card-button');
        if (detailsButton) {
          detailsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openProjectDetails(project);
          });
        }
        sectionGrid.appendChild(clonedCard);
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
  
  // Плавное появление секции
  requestAnimationFrame(() => {
    sectionContainer.style.opacity = '0';
    sectionContainer.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      sectionContainer.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
      sectionContainer.style.opacity = '1';
      sectionContainer.style.transform = 'translateY(0)';
    });
  });
  
  // Плавное появление карточек одновременно
  // Используем двойной requestAnimationFrame для синхронизации с браузером
  // Первый RAF дает браузеру время применить начальное состояние
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const cards = sectionGrid.querySelectorAll('.project-card');
      cards.forEach((card) => {
        // Убеждаемся, что начальное состояние установлено
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        card.style.transition = 'none';
      });
      
      // Применяем анимацию одновременно для всех карточек
      requestAnimationFrame(() => {
        cards.forEach((card) => {
          card.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
        
        // Убираем inline стили после анимации, чтобы hover эффект работал
        setTimeout(() => {
          cards.forEach((card) => {
            card.style.transform = '';
            card.style.opacity = '';
            card.style.transition = '';
          });
        }, 300);
      });
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
        empty.style.opacity = '0';
        empty.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => {
          empty.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
          empty.style.opacity = '1';
          empty.style.transform = 'translateY(0)';
        });
      });
    } else {
      empty.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
      empty.style.opacity = '0';
      empty.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        empty.style.display = 'none';
      }, 300);
    }
  }
}

/**
 * Скрывает индикатор загрузки с плавной анимацией
 */
function hideLoadingIndicator() {
  const loadingElement = document.getElementById('projects-loading');
  if (!loadingElement) return;
  
  // Добавляем класс для анимации скрытия
  loadingElement.classList.add('hidden');
  
  // Удаляем элемент после завершения анимации
  setTimeout(() => {
    if (loadingElement.parentNode) {
      loadingElement.remove();
    }
  }, 300);
}

/* ============================================
 * DEBUG FUNCTIONS - Удалить после тестирования
 * ============================================ */

/**
 * Показывает индикатор загрузки (для дебага - клавиша R)
 */
function showLoadingIndicator() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  // Скрываем сообщение об отсутствии проектов
  const emptyElement = document.getElementById('projects-empty');
  if (emptyElement) {
    emptyElement.style.display = 'none';
  }
  
  // Проверяем, есть ли уже индикатор загрузки
  let loadingElement = document.getElementById('projects-loading');
  
  if (!loadingElement) {
    // Создаем новый индикатор загрузки
    loadingElement = document.createElement('div');
    loadingElement.className = 'projects-loading';
    loadingElement.id = 'projects-loading';
    loadingElement.innerHTML = `
      <div class="projects-loading-squares">
        <div class="projects-loading-square"></div>
        <div class="projects-loading-square"></div>
        <div class="projects-loading-square"></div>
      </div>
    `;
    grid.innerHTML = '';
    grid.appendChild(loadingElement);
  } else {
    // Если индикатор уже есть, просто очищаем grid и показываем его
    grid.innerHTML = '';
    grid.appendChild(loadingElement);
  }
  
  // Убираем класс hidden и показываем с анимацией
  loadingElement.classList.remove('hidden');
  loadingElement.style.display = '';
  loadingElement.style.opacity = '0';
  loadingElement.style.transform = 'translateY(10px)';
  
  requestAnimationFrame(() => {
    loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    loadingElement.style.opacity = '1';
    loadingElement.style.transform = 'translateY(0)';
  });
  
  console.log('🔍 [DEBUG] Индикатор загрузки показан (клавиша R)');
}

/**
 * Показывает сообщение об отсутствии проектов (для дебага - клавиша E)
 */
function showEmptyProjectsMessage() {
  const grid = document.getElementById('projects-grid');
  const emptyElement = document.getElementById('projects-empty');
  
  if (!grid || !emptyElement) return;
  
  // Скрываем индикатор загрузки
  hideLoadingIndicator();
  
  // Очищаем grid
  grid.innerHTML = '';
  
  // Показываем сообщение об отсутствии проектов
  emptyElement.style.display = '';
  emptyElement.style.opacity = '0';
  emptyElement.style.transform = 'translateY(10px)';
  
  requestAnimationFrame(() => {
    emptyElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    emptyElement.style.opacity = '1';
    emptyElement.style.transform = 'translateY(0)';
  });
  
  console.log('🔍 [DEBUG] Сообщение об отсутствии проектов показано (клавиша E)');
}

/**
 * Группирует и отображает проекты по разделам
 */
let allProjects = [];
let allProjectCards = new Map();
let isRendering = false;
const expandedSections = new Set();

/**
 * Переключает развернутость раздела
 */
function toggleSectionExpansion(category, button, hiddenProjects) {
  const section = document.querySelector(`[data-category="${category}"]`);
  if (!section) return;
  
  const isExpanded = expandedSections.has(category);
  // Находим карточки по data-атрибуту или по классу
  const hiddenCards = Array.from(section.querySelectorAll('[data-hidden-card="true"], .project-card-hidden'));
  
  if (isExpanded) {
    // Сворачиваем с плавной анимацией - все карточки одновременно
    hiddenCards.forEach((card) => {
      card.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out, transform 0.3s ease-in-out';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-10px)';
    });
    setTimeout(() => {
      hiddenCards.forEach((card) => {
        card.style.display = 'none';
        // Убираем inline стили и возвращаем класс после анимации
        card.style.transform = '';
        card.style.opacity = '';
        card.style.transition = '';
        card.classList.add('project-card-hidden');
        card.setAttribute('data-hidden-card', 'true');
      });
    }, 300);
    expandedSections.delete(category);
    button.setAttribute('aria-expanded', 'false');
    button.querySelector('.projects-section-expand-text').textContent = 'Показать все';
  } else {
    // Разворачиваем с плавной анимацией - все карточки одновременно
    hiddenCards.forEach((card) => {
      card.style.display = '';
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      card.style.transition = 'none'; // Отключаем transition для мгновенного применения начального состояния
    });
    requestAnimationFrame(() => {
      hiddenCards.forEach((card) => {
        card.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
      // Убираем inline стили после анимации, чтобы hover эффект работал
      setTimeout(() => {
        hiddenCards.forEach((card) => {
          card.style.transform = '';
          card.style.opacity = '';
          card.style.transition = '';
          card.classList.remove('project-card-hidden');
          // Сохраняем data-атрибут для возможности найти карточку при сворачивании
          card.setAttribute('data-hidden-card', 'true');
        });
      }, 300);
    });
    expandedSections.add(category);
    button.setAttribute('aria-expanded', 'true');
    button.querySelector('.projects-section-expand-text').textContent = 'Скрыть';
  }
}

function renderGroupedProjects() {
  // Защита от повторных вызовов
  if (isRendering) {
    console.warn('renderGroupedProjects уже выполняется');
    return;
  }
  
  const grid = document.getElementById('projects-grid');
  if (!grid) {
    console.warn('Сетка проектов не найдена');
    return;
  }
  
  // Проверяем, что карточки созданы
  if (allProjectCards.size === 0) {
    console.warn('Карточки проектов еще не созданы');
    return;
  }
  
  isRendering = true;
  
  // Скрываем индикатор загрузки перед рендерингом
  hideLoadingIndicator();
  
  // Сбрасываем состояние развернутости при новом рендеринге
  expandedSections.clear();
  
  try {
    // Очищаем сетку (индикатор загрузки уже удален через hideLoadingIndicator)
    grid.innerHTML = '';
    grid.className = 'projects-grid';
    
    // Группируем проекты по категориям
    const grouped = {
      games: [],
      tools: [],
      research: []
    };
    
    allProjects.forEach(project => {
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
    categories.forEach((category, sectionIndex) => {
      const allCategoryProjects = grouped[category];
      if (allCategoryProjects.length === 0) return;
      
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
          toggleSectionExpansion(category, expandButton, otherProjects);
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
        const originalCard = allProjectCards.get(project.id);
        if (originalCard) {
          const clonedCard = originalCard.cloneNode(true);
          // Устанавливаем начальное состояние для анимации ПЕРЕД добавлением в DOM
          clonedCard.style.opacity = '0';
          clonedCard.style.transform = 'translateY(10px)';
          clonedCard.style.transition = 'none'; // Отключаем transition для мгновенного применения начального состояния
          // Добавляем обработчик клика на всю карточку
          clonedCard.addEventListener('click', (e) => {
            e.stopPropagation();
            openProjectDetails(project);
          });
          // Добавляем обработчик на кнопку "Подробнее"
          const detailsButton = clonedCard.querySelector('.project-card-button');
          if (detailsButton) {
            detailsButton.addEventListener('click', (e) => {
              e.stopPropagation();
              openProjectDetails(project);
            });
          }
          sectionGrid.appendChild(clonedCard);
        }
      });
      
      // Добавляем скрытые проекты (если есть)
      if (hasMoreProjects) {
        otherProjects.forEach(project => {
          const originalCard = allProjectCards.get(project.id);
          if (originalCard) {
            const clonedCard = originalCard.cloneNode(true);
            clonedCard.classList.add('project-card-hidden');
            clonedCard.setAttribute('data-hidden-card', 'true');
            clonedCard.style.display = 'none';
            // Устанавливаем начальное состояние для анимации (на случай если карточка будет показана)
            clonedCard.style.opacity = '0';
            clonedCard.style.transform = 'translateY(10px)';
            clonedCard.style.transition = 'none';
            // Добавляем обработчик клика на всю карточку
            clonedCard.addEventListener('click', (e) => {
              e.stopPropagation();
              openProjectDetails(project);
            });
            // Добавляем обработчик на кнопку "Подробнее"
            const detailsButton = clonedCard.querySelector('.project-card-button');
            if (detailsButton) {
              detailsButton.addEventListener('click', (e) => {
                e.stopPropagation();
                openProjectDetails(project);
              });
            }
            sectionGrid.appendChild(clonedCard);
          }
        });
      }
      
      sectionContainer.appendChild(sectionGrid);
      grid.appendChild(sectionContainer);
      
      // Плавное появление секции
      requestAnimationFrame(() => {
        sectionContainer.style.opacity = '0';
        sectionContainer.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => {
          sectionContainer.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
          sectionContainer.style.opacity = '1';
          sectionContainer.style.transform = 'translateY(0)';
        });
      });
      
      // Плавное появление карточек одновременно
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      // Первый RAF дает браузеру время применить начальное состояние
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const sectionCards = sectionGrid.querySelectorAll('.project-card:not(.project-card-hidden)');
          sectionCards.forEach((card) => {
            // Убеждаемся, что начальное состояние установлено
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            card.style.transition = 'none';
          });
          
          // Применяем анимацию одновременно для всех карточек
          requestAnimationFrame(() => {
            sectionCards.forEach((card) => {
              card.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
            
            // Убираем inline стили после анимации, чтобы hover эффект работал
            setTimeout(() => {
              sectionCards.forEach((card) => {
                card.style.transform = '';
                card.style.opacity = '';
                card.style.transition = '';
              });
            }, 300);
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
        isRendering = false;
      }
    });
  } catch (error) {
    console.error('Ошибка при рендеринге проектов:', error);
    isRendering = false;
  }
}

/**
 * Инициализация страницы
 */
async function initProjectsPage() {
  // Загружаем шаблоны
  await loadTemplates();
  
  // Загружаем проекты
  const projects = await loadProjectsData();
  
  // Скрываем индикатор загрузки
  hideLoadingIndicator();
  
  if (projects.length === 0) {
    const grid = document.getElementById('projects-grid');
    if (grid) {
      grid.innerHTML = '<p>Проекты не найдены.</p>';
    }
    return;
  }
  
  // Сохраняем проекты для группировки
  allProjects = projects;
  
  // Инициализируем фильтры
  initFilters(projects);
  
  // Создаем карточки проектов и сохраняем их
  projects.forEach(project => {
    const card = createProjectCard(project);
    if (card) {
      allProjectCards.set(project.id, card);
    }
  });
  
  // Отображаем проекты с группировкой (без фильтров)
  renderGroupedProjects();
  
  // Загружаем SVG для звездочек
  const svgLoaderModule = await import('../components/svg-loader.js');
  if (svgLoaderModule.default) {
    svgLoaderModule.default();
  }
  
  // Инициализируем кнопку "Наверх"
  initScrollToTop();
  
  // Инициализируем обработчик кнопки меню для прокрутки до навигации
  initMenuButtonScroll();
}

/**
 * Инициализирует обработчик кнопки меню для прокрутки до навигации в tablet режиме
 */
function initMenuButtonScroll() {
  const menuButton = document.querySelector('.header-menu-button');
  const navigationSection = document.querySelector('.projects-navigation');
  const pageWrapper = document.querySelector('.page-wrapper');
  
  if (!menuButton || !navigationSection || !pageWrapper) {
    return;
  }
  
  menuButton.addEventListener('click', () => {
    // Проверяем, находимся ли мы в tablet режиме (max-width: 768px)
    const isTabletMode = window.innerWidth <= 768;
    
    if (isTabletMode) {
      // Вычисляем позицию навигационного меню относительно page-wrapper
      const wrapperRect = pageWrapper.getBoundingClientRect();
      const navRect = navigationSection.getBoundingClientRect();
      const scrollTop = pageWrapper.scrollTop;
      const targetPosition = scrollTop + navRect.top - wrapperRect.top;
      
      // Прокручиваем до навигационного меню
      pageWrapper.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
}

/**
 * Инициализирует кнопку "Наверх"
 */
function initScrollToTop() {
  const scrollToTopButton = document.getElementById('scroll-to-top');
  if (!scrollToTopButton) return;
  
  const footer = document.querySelector('.footer');
  const pageWrapper = document.querySelector('.page-wrapper');
  
  // Отслеживаем предыдущую позицию скролла для определения направления
  let lastScrollTop = 0;
  
  // Определяем, находимся ли мы в tablet режиме
  function isTabletMode() {
    return window.innerWidth <= 768;
  }
  
  // Получаем элемент для скролла
  function getScrollElement() {
    return isTabletMode() && pageWrapper ? pageWrapper : window;
  }
  
  // Получаем текущую позицию скролла
  function getScrollTop() {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      return window.pageYOffset || document.documentElement.scrollTop;
    } else {
      return scrollElement.scrollTop;
    }
  }
  
  // Отслеживаем таймеры для управления анимациями
  let hideTimeout = null;
  let isAnimating = false;
  
  // Функция для обновления позиции кнопки в зависимости от состояния футера
  function updateButtonPosition() {
    if (!footer) {
      // Если футера нет, убираем класс footer-hidden (используем стандартную позицию)
      scrollToTopButton.classList.remove('footer-hidden');
      return;
    }
    
    // Проверяем, скрыт ли футер
    const isFooterHidden = footer.classList.contains('hidden');
    
    // Обновляем позицию только если кнопка видна или если она не в процессе анимации скрытия
    // Это предотвращает резкое изменение позиции во время анимации
    if (isFooterHidden) {
      scrollToTopButton.classList.add('footer-hidden');
    } else {
      scrollToTopButton.classList.remove('footer-hidden');
    }
  }
  
  // Показывает кнопку с анимацией
  function showButton() {
    // Отменяем таймер скрытия, если он активен
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
      // Сбрасываем флаг анимации, так как мы прерываем анимацию скрытия
      isAnimating = false;
    }
    
    // Если кнопка уже видна и не анимируется, просто обновляем позицию
    if (scrollToTopButton.classList.contains('visible') && !isAnimating) {
      updateButtonPosition();
      return;
    }
    
    isAnimating = true;
    
    if (scrollToTopButton.style.display === 'none') {
      scrollToTopButton.style.display = 'flex';
      // Сначала обновляем позицию до показа, чтобы избежать визуального скачка
      updateButtonPosition();
      // Ждем один кадр, чтобы браузер успел применить display и позицию, затем добавляем класс для анимации
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToTopButton.classList.add('visible');
          // Сбрасываем флаг анимации после завершения transition
          setTimeout(() => {
            isAnimating = false;
          }, 300);
        });
      });
    } else {
      // Если элемент уже видим, обновляем позицию перед добавлением класса
      updateButtonPosition();
      scrollToTopButton.classList.add('visible');
      // Сбрасываем флаг анимации после завершения transition
      setTimeout(() => {
        isAnimating = false;
      }, 300);
    }
  }
  
  // Скрывает кнопку с анимацией
  function hideButton() {
    // Если кнопка уже скрыта, ничего не делаем
    if (!scrollToTopButton.classList.contains('visible') && scrollToTopButton.style.display === 'none') {
      return;
    }
    
    // Отменяем предыдущий таймер скрытия, если он есть
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    
    isAnimating = true;
    
    // Сначала убираем класс для анимации исчезновения
    scrollToTopButton.classList.remove('visible');
    
    // Убираем display после завершения анимации
    hideTimeout = setTimeout(() => {
      if (!scrollToTopButton.classList.contains('visible')) {
        scrollToTopButton.style.display = 'none';
      }
      isAnimating = false;
      hideTimeout = null;
    }, 300);
  }
  
  // Обработчик скролла
  function handleScroll() {
    const scrollTop = getScrollTop();
    const isScrollingUp = scrollTop < lastScrollTop;
    const isAtTop = scrollTop <= 0;
    
    // Кнопка показывается только когда:
    // 1. Прокручиваем вверх (isScrollingUp)
    // 2. И не в самом верху страницы (!isAtTop)
    if (isScrollingUp && !isAtTop) {
      showButton();
    } else {
      // Скрываем кнопку когда:
      // - Прокручиваем вниз
      // - Или в самом верху страницы
      hideButton();
    }
    
    // Обновляем предыдущую позицию скролла
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    
    // Обновляем позицию кнопки в зависимости от состояния футера
    // Откладываем обновление позиции, чтобы оно происходило после изменения видимости
    requestAnimationFrame(() => {
      updateButtonPosition();
    });
  }
  
  // Обработчик клика - плавный скролл наверх
  scrollToTopButton.addEventListener('click', () => {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      scrollElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
  
  // Наблюдаем за изменениями класса футера
  if (footer) {
    const footerObserver = new MutationObserver(() => {
      // Откладываем обновление позиции для синхронизации с анимациями
      requestAnimationFrame(() => {
        updateButtonPosition();
      });
    });
    
    footerObserver.observe(footer, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  // Добавляем обработчик скролла в зависимости от режима
  function setupScrollListener() {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    }
  }
  
  // Удаляем старые обработчики и добавляем новые
  function updateScrollListener() {
    window.removeEventListener('scroll', handleScroll);
    if (pageWrapper) {
      pageWrapper.removeEventListener('scroll', handleScroll);
    }
    // Обновляем lastScrollTop при переключении режима
    lastScrollTop = getScrollTop();
    setupScrollListener();
  }
  
  // Инициализируем обработчик скролла
  setupScrollListener();
  
  // Обновляем обработчик при изменении размера окна
  window.addEventListener('resize', () => {
    updateScrollListener();
    handleScroll();
  });
  
  // Инициализируем lastScrollTop при первой загрузке
  lastScrollTop = getScrollTop();
  
  // Проверяем начальное состояние
  handleScroll();
  updateButtonPosition();
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectsPage);
} else {
  initProjectsPage();
}

/* ============================================
 * DEBUG KEYBOARD HANDLERS - Удалить после тестирования
 * ============================================ */
document.addEventListener('keydown', (e) => {
  // Показываем индикатор загрузки по клавише R
  if (e.key === 'r' || e.key === 'R') {
    // Предотвращаем стандартное поведение только если не в поле ввода
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      showLoadingIndicator();
    }
  }
  
  // Показываем сообщение об отсутствии проектов по клавише E
  if (e.key === 'e' || e.key === 'E') {
    // Предотвращаем стандартное поведение только если не в поле ввода
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      showEmptyProjectsMessage();
    }
  }
});
