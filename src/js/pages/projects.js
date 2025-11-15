/**
 * Страница проектов - загрузка и отображение проектов из JSON
 */

import { loadHTML } from '../layout.js';
import { getRoleLabel } from '../utils/role-mapper.js';
import { loadData } from '../utils/data-loader.js';
import { ANIMATION_CONFIG, animateElementsAppearance, animateElementAppearance } from '../utils/AnimationUtils.js';
import { ProjectFiltersManager } from '../managers/ProjectFiltersManager.js';
import { ProjectGroupingManager } from '../managers/ProjectGroupingManager.js';

// Для обратной совместимости
const CARD_ANIMATION = ANIMATION_CONFIG;

// Загрузка компонентов
let projectCardTemplate = null;
let projectFiltersTemplate = null;

// Менеджер фильтров
let filtersManager = null;

// Менеджер группировки проектов
let groupingManager = null;

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
 * Загружает данные проектов из JSON с кешированием
 */
async function loadProjectsData() {
  try {
    const data = await loadData('/data/projects.json');
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
    // Оптимизация: lazy loading для изображений карточек
    if (!image.hasAttribute('loading')) {
      image.loading = 'lazy';
    }
    if (!image.hasAttribute('decoding')) {
      image.decoding = 'async';
    }
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
    // Проверяем, был ли выделен текст - если да, не открываем карточку
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }
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
async function initFilters(projects) {
  if (!filtersManager) {
    filtersManager = new ProjectFiltersManager(
      projects,
      allProjectCards,
      {
        onCardClick: openProjectDetails,
        onRenderGrouped: renderGroupedProjects,
        onHideLoading: hideLoadingIndicator,
        onExpandedSectionsClear: () => {
          if (groupingManager) {
            groupingManager.expandedSections.clear();
          }
        }
      }
    );
  } else {
    filtersManager.projects = projects;
    filtersManager.allProjectCards = allProjectCards;
  }
  
  await filtersManager.init(projects);
}

/**
 * Скрывает индикатор загрузки с плавной анимацией
 */
function hideLoadingIndicator() {
  return new Promise((resolve) => {
    const loadingElement = document.getElementById('projects-loading');
    if (!loadingElement) {
      resolve();
      return;
    }
    
    const grid = document.getElementById('projects-grid');
    const shouldHideContent = grid && grid.contains(loadingElement);
    
    // Убеждаемся, что loading элемент имеет transition для анимации
    // Устанавливаем transition явно, чтобы гарантировать анимацию
    loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    
    // Убеждаемся, что начальное состояние видимо (на случай если были inline стили)
    loadingElement.style.opacity = '1';
    loadingElement.style.transform = 'translateY(0)';
    
    // Используем requestAnimationFrame для гарантии применения начального состояния
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Теперь применяем скрытие с анимацией
        loadingElement.style.opacity = '0';
        loadingElement.style.transform = 'translateY(-10px)';
      });
    });
    
    // Ждем завершения fadeout анимации loading элемента
    setTimeout(() => {
      // Теперь скрываем grid (если нужно) и удаляем loading элемент
      if (shouldHideContent && grid) {
        grid.style.opacity = '0';
        grid.style.visibility = 'hidden';
      }
      
      if (loadingElement.parentNode) {
        loadingElement.remove();
      }
      
      // Восстанавливаем видимость grid, но не показываем его с анимацией здесь
      // Анимация будет применена в renderGroupedProjects после добавления контента
      if (shouldHideContent && grid) {
        grid.style.visibility = '';
        grid.style.opacity = '0';
        // Не устанавливаем transition здесь, он будет установлен в renderGroupedProjects
      }
      
      resolve();
    }, 300);
  });
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
  
  // Проверяем, есть ли контент в grid (кроме loading элемента)
  // Контент есть, если есть дочерние элементы и это не только loading
  const hasContent = grid.children.length > 0 && 
    (!loadingElement || grid.children.length > 1 || !grid.contains(loadingElement));
  
  if (hasContent) {
    // Если есть контент, плавно скрываем его перед показом loading
    // Используем ту же анимацию, что и для loading (opacity + transform)
    grid.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    grid.style.opacity = '1';
    grid.style.transform = 'translateY(0)';
    
    // Используем requestAnimationFrame для гарантии применения начального состояния
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Применяем скрытие с анимацией (как у loading при скрытии)
        grid.style.opacity = '0';
        grid.style.transform = 'translateY(-10px)';
      });
    });
    
    setTimeout(() => {
      // После скрытия контента создаем или используем loading элемент
      if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.className = 'loading projects-loading';
        loadingElement.id = 'projects-loading';
        loadingElement.innerHTML = `
          <div class="loading-squares">
            <div class="loading-square"></div>
            <div class="loading-square"></div>
            <div class="loading-square"></div>
          </div>
        `;
      }
      
      grid.innerHTML = '';
      grid.style.opacity = '0';
      grid.style.transform = '';
      grid.style.visibility = 'visible';
      grid.appendChild(loadingElement);
      
      // Убираем класс hidden если он есть
      loadingElement.classList.remove('hidden');
      loadingElement.style.display = '';
      
      // Показываем loading с анимацией
      loadingElement.style.opacity = '0';
      loadingElement.style.transform = 'translateY(10px)';
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
          loadingElement.style.opacity = '1';
          loadingElement.style.transform = 'translateY(0)';
          
          // Показываем grid с анимацией
          grid.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
          grid.style.opacity = '1';
          grid.style.transform = 'translateY(0)';
          setTimeout(() => {
            grid.style.opacity = '';
            grid.style.transform = '';
            grid.style.transition = '';
          }, 300);
        });
      });
    }, 300);
  } else {
    // Если контента нет, просто показываем loading с анимацией
    if (!loadingElement) {
      loadingElement = document.createElement('div');
      loadingElement.className = 'loading projects-loading';
      loadingElement.id = 'projects-loading';
      loadingElement.innerHTML = `
        <div class="loading-squares">
          <div class="loading-square"></div>
          <div class="loading-square"></div>
          <div class="loading-square"></div>
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
    
    // Убеждаемся, что grid видим
    grid.style.opacity = '';
    grid.style.visibility = '';
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        loadingElement.style.opacity = '1';
        loadingElement.style.transform = 'translateY(0)';
      });
    });
  }
  
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
 * Глобальные переменные для проектов
 */
let allProjects = [];
let allProjectCards = new Map();

/**
 * Функция-обертка для renderGroupedProjects из менеджера группировки
 */
async function renderGroupedProjects() {
  if (!groupingManager) {
    console.warn('Менеджер группировки не инициализирован');
    return;
  }
  await groupingManager.renderGroupedProjects();
}

/**
 * Инициализация страницы
 */
async function initProjectsPage() {
  // Загружаем шаблоны
  await loadTemplates();
  
  // Загружаем проекты
  const projects = await loadProjectsData();
  
  // Скрываем индикатор загрузки и ждем завершения fadeout
  await hideLoadingIndicator();
  
  if (projects.length === 0) {
    const grid = document.getElementById('projects-grid');
    if (grid) {
      grid.innerHTML = '<h2 class="projects-empty-title">ПРОЕКТЫ НЕ НАЙДЕНЫ</h2><p class="projects-empty-subtitle">ПОПРОБУЙТЕ ИЗМЕНИТЬ ФИЛЬТРЫ</p>';
    }
    return;
  }
  
  // Сохраняем проекты для группировки
  allProjects = projects;
  
  // Создаем карточки проектов и сохраняем их
  projects.forEach(project => {
    const card = createProjectCard(project);
    if (card) {
      allProjectCards.set(project.id, card);
    }
  });
  
  // Инициализируем менеджер группировки
  if (!groupingManager) {
    groupingManager = new ProjectGroupingManager(
      allProjects,
      allProjectCards,
      {
        onCardClick: openProjectDetails,
        onHideLoading: hideLoadingIndicator
      }
    );
  } else {
    groupingManager.projects = allProjects;
    groupingManager.allProjectCards = allProjectCards;
  }
  
  // Инициализируем фильтры
  await initFilters(projects);
  
  // Отображаем проекты с группировкой (без фильтров)
  await renderGroupedProjects();
  
  // Загружаем SVG для звездочек
  const svgLoaderModule = await import('../components/svg-loader.js');
  if (svgLoaderModule.default) {
    svgLoaderModule.default();
  }
  
  // Инициализируем кнопку "Наверх"
  initScrollToTop();
  
  // Инициализируем обработчик кнопки меню для прокрутки до навигации
  initMenuButtonScroll();
  
  // Выделяем активную страницу в навигации
  setActiveNavigationLink();
}

/**
 * Выделяет активную страницу в навигации projects-navigation
 */
function setActiveNavigationLink() {
  const navLinks = document.querySelectorAll('.projects-navigation .cta-button');
  let currentPage = window.location.pathname.split('/').pop();
  if (currentPage === '' || currentPage === 'index.html') {
    currentPage = 'index.html';
  }

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
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
    // Проверяем, находимся ли мы в tablet режиме (max-width: 1023px)
    const isTabletMode = window.innerWidth < 1024;
    
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
    return window.innerWidth < 1024;
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
    
    // Убеждаемся, что элемент видим
    if (scrollToTopButton.style.display === 'none') {
      scrollToTopButton.style.display = 'flex';
    }
    
    // Убираем класс visible, если он был, чтобы сбросить состояние для анимации
    scrollToTopButton.classList.remove('visible');
    
    // Обновляем позицию до показа
    updateButtonPosition();
    
    // Ждем кадр, чтобы браузер успел применить начальное состояние (opacity: 0), затем добавляем класс для анимации
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToTopButton.classList.add('visible');
        // Сбрасываем флаг анимации после завершения transition
        setTimeout(() => {
          isAnimating = false;
        }, 300);
      });
    });
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

// Флаг для отслеживания состояния загрузки
let isLoading = false;
let loadTimeout = null;

document.addEventListener('keydown', (e) => {
  // Предотвращаем стандартное поведение только если не в поле ввода
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Показываем индикатор загрузки по клавише R
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    showLoadingIndicator();
  }
  
  // Показываем сообщение об отсутствии проектов по клавише E
  if (e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    showEmptyProjectsMessage();
  }
  
  // Инициируем загрузку страницы по клавише T (с задержкой 1 секунда)
  if (e.key === 't' || e.key === 'T') {
    e.preventDefault();
    
    // Если загрузка уже идет, отменяем предыдущий таймер и перезапускаем
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
    
    // Показываем loading с анимацией
    showLoadingIndicator();
    
    // Устанавливаем флаг загрузки
    isLoading = true;
    
    // Ждем 1 секунду и запускаем загрузку
    loadTimeout = setTimeout(async () => {
      loadTimeout = null;
      try {
        await initProjectsPage();
      } finally {
        isLoading = false;
      }
    }, 1000);
  }
});
