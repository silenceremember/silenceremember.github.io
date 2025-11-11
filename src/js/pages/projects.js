/**
 * Страница проектов - загрузка и отображение проектов из JSON
 */

import { loadHTML } from '../layout.js';

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
    const roleLabels = {
      'solo': 'Соло',
      'team-lead': 'Тимлид',
      'team': 'В команде'
    };
    role.textContent = roleLabels[project.role] || project.role;
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
    
    // Обновляем счетчики фильтров
    updateFilterCounts(projects);
    
    // Добавляем динамические фильтры по годам
    const yearOptions = filtersContainer.querySelector('[data-filter="year"]');
    if (yearOptions) {
      years.forEach(year => {
        const button = document.createElement('button');
        button.className = 'project-filters-option';
        button.setAttribute('data-value', year.toString());
        button.setAttribute('aria-pressed', 'false');
        button.innerHTML = `
          <span class="project-filters-option-label">${year}</span>
          <span class="project-filters-option-count">0</span>
        `;
        yearOptions.appendChild(button);
      });
    }
    
    // Инициализируем фильтры
    initFilterButtons();
  }
}

/**
 * Обновляет счетчики в фильтрах
 */
function updateFilterCounts(projects) {
  // Подсчитываем проекты по категориям, статусам и годам
  const categoryCounts = {};
  const statusCounts = {};
  const yearCounts = {};
  
  projects.forEach(project => {
    categoryCounts[project.category] = (categoryCounts[project.category] || 0) + 1;
    statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
    if (project.year) {
      yearCounts[project.year] = (yearCounts[project.year] || 0) + 1;
    }
  });
  
  // Обновляем счетчики
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
    } else if (filterType === 'year') {
      count = yearCounts[value] || 0;
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
  
  // Кнопка результатов (сброс фильтров)
  const resultsButton = document.getElementById('project-filters-results');
  if (resultsButton) {
    resultsButton.addEventListener('click', () => {
      clearAllFilters();
    });
  }
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
  
  // Скрываем кнопку результатов
  const resultsButton = document.getElementById('project-filters-results');
  if (resultsButton) {
    resultsButton.hidden = true;
  }
  
  applyFilters();
}

/**
 * Применяет фильтры и обновляет отображение
 */
function applyFilters() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  // Проверяем, есть ли активные фильтры
  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);
  
  // Обновляем видимость кнопки результатов в зависимости от наличия активных фильтров
  const resultsCount = document.getElementById('project-filters-results');
  if (resultsCount) {
    resultsCount.hidden = !hasActiveFilters;
  }
  
  if (!hasActiveFilters) {
    // Если фильтров нет, группируем по разделам
    // Сбрасываем состояние развернутости при переключении на группировку
    expandedSections.clear();
    renderGroupedProjects();
    return;
  }
  
  // Если есть фильтры, показываем отфильтрованные проекты в обычной сетке
  // Сначала переключаемся на обычную сетку если была группировка
  if (grid.querySelector('.projects-section-title')) {
    // Очищаем группировку и создаем обычную сетку
    grid.innerHTML = '';
    grid.className = 'projects-grid';
    
    // Добавляем все карточки с обработчиками событий
    allProjects.forEach(project => {
      const originalCard = allProjectCards.get(project.id);
      if (originalCard) {
        const clonedCard = originalCard.cloneNode(true);
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
        grid.appendChild(clonedCard);
      }
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
  }
  
  const cards = document.querySelectorAll('.project-card');
  let visibleCount = 0;
  
  cards.forEach(card => {
    let visible = true;
    
    // Проверяем категорию
    if (visible && activeFilters.category.length > 0) {
      const cardCategory = card.getAttribute('data-category');
      if (!activeFilters.category.includes(cardCategory)) {
        visible = false;
      }
    }
    
    // Проверяем статус
    if (visible && activeFilters.status.length > 0) {
      const cardStatus = card.getAttribute('data-status');
      if (!activeFilters.status.includes(cardStatus)) {
        visible = false;
      }
    }
    
    // Проверяем год
    if (visible && activeFilters.year.length > 0) {
      const cardYear = card.getAttribute('data-year');
      if (cardYear && !activeFilters.year.includes(cardYear)) {
        visible = false;
      }
    }
    
    // Показываем/скрываем карточку
    if (visible) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Обновляем счетчик результатов
  const resultsCountText = document.querySelector('.project-filters-results-count');
  if (resultsCountText) {
    resultsCountText.textContent = visibleCount;
  }
  
  // Показываем сообщение об отсутствии проектов
  const empty = document.getElementById('projects-empty');
  if (empty) {
    empty.style.display = visibleCount === 0 ? '' : 'none';
  }
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
  const hiddenCards = Array.from(section.querySelectorAll('.project-card-hidden'));
  
  if (isExpanded) {
    // Сворачиваем
    hiddenCards.forEach(card => {
      card.style.display = 'none';
    });
    expandedSections.delete(category);
    button.setAttribute('aria-expanded', 'false');
    button.querySelector('.projects-section-expand-text').textContent = 'Показать все';
  } else {
    // Разворачиваем
    hiddenCards.forEach(card => {
      card.style.display = '';
      // Небольшая задержка для плавного появления
      requestAnimationFrame(() => {
        card.style.opacity = '1';
      });
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
  
  // Сбрасываем состояние развернутости при новом рендеринге
  expandedSections.clear();
  
  try {
    // Очищаем сетку
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
    Object.keys(grouped).forEach(category => {
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
            clonedCard.style.display = 'none';
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
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectsPage);
} else {
  initProjectsPage();
}
