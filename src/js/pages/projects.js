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
  if (category) {
    const categoryLabels = {
      'featured': 'Избранное',
      'skillbox': 'Skillbox',
      'ranhigs-gamedesign': 'РАНХиГС',
      'ranhigs-narrative': 'РАНХиГС',
      'jam': 'Джем',
      'tools': 'Инструмент',
      'scripts': 'Скрипт'
    };
    category.textContent = categoryLabels[project.category] || project.category;
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
  card.addEventListener('click', () => {
    openProjectDetails(project);
  });
  
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
  const types = [...new Set(projects.map(p => p.type))];
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
  // Подсчитываем проекты по типам, статусам и годам
  const typeCounts = {};
  const statusCounts = {};
  const yearCounts = {};
  
  projects.forEach(project => {
    typeCounts[project.type] = (typeCounts[project.type] || 0) + 1;
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
    
    if (filterType === 'type') {
      count = typeCounts[value] || 0;
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
  type: [],
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
    type: [],
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
  const cards = document.querySelectorAll('.project-card');
  let visibleCount = 0;
  
  cards.forEach(card => {
    let visible = true;
    
    // Проверяем тип
    if (visible && activeFilters.type.length > 0) {
      const cardType = card.getAttribute('data-type');
      if (!activeFilters.type.includes(cardType)) {
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
  const resultsCount = document.getElementById('project-filters-results');
  const resultsCountText = document.querySelector('.project-filters-results-count');
  if (resultsCountText) {
    resultsCountText.textContent = visibleCount;
  }
  
  // Проверяем, есть ли активные фильтры
  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);
  
  // Показываем/скрываем кнопку результатов только если есть активные фильтры
  if (resultsCount) {
    resultsCount.hidden = !hasActiveFilters;
  }
  
  // Показываем сообщение об отсутствии проектов
  const empty = document.getElementById('projects-empty');
  if (empty) {
    empty.style.display = visibleCount === 0 ? '' : 'none';
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
  
  // Инициализируем фильтры
  initFilters(projects);
  
  // Отображаем проекты
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  // Очищаем загрузку
  grid.innerHTML = '';
  
  projects.forEach(project => {
    const card = createProjectCard(project);
    if (card) {
      grid.appendChild(card);
    }
  });
  
  // Обновляем счетчик
  const resultsText = document.getElementById('projects-results-count');
  if (resultsText) {
    resultsText.textContent = projects.length;
  }
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectsPage);
} else {
  initProjectsPage();
}
