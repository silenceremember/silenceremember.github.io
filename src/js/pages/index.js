/**
 * Инициализация главной страницы - загрузка featured проектов
 */

import { getRoleLabel } from '../utils/role-mapper.js';
import { loadData } from '../utils/data-loader.js';
import { animateTextElements, animateElementAppearance, animateElementsAppearance } from '../utils/animations.js';

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
 * Загружает background-image с оптимизацией через Intersection Observer
 * @param {HTMLElement} element - Элемент для установки background-image
 * @param {string} imageUrl - URL изображения
 * @param {boolean} isVisible - Виден ли элемент сразу
 */
function loadBackgroundImage(element, imageUrl, isVisible = false) {
  if (!element || !imageUrl) return;
  
  // Если элемент виден сразу, загружаем изображение немедленно
  if (isVisible) {
    element.style.backgroundImage = `url(${imageUrl})`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
    return;
  }
  
  // Используем Intersection Observer для ленивой загрузки
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = new Image();
        img.onload = () => {
          entry.target.style.backgroundImage = `url(${imageUrl})`;
          entry.target.style.backgroundSize = 'cover';
          entry.target.style.backgroundPosition = 'center';
        };
        img.src = imageUrl;
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '50px' // Начинаем загрузку за 50px до появления в viewport
  });
  
  observer.observe(element);
}

/**
 * Заполняет слайд проекта данными
 * @param {HTMLElement} slideElement - Элемент слайда
 * @param {Object} project - Данные проекта
 * @param {number} slideIndex - Индекс слайда (0-based)
 */
function populateProjectSlide(slideElement, project, slideIndex = 0) {
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
  const roleElement = slideElement.querySelector('.details-block:first-of-type .details-text');
  if (roleElement) {
    const roleLabel = getRoleLabel(project.role, true, project.teamName);
    roleElement.textContent = roleLabel;
  }

  // Ключевой вклад
  const contributionElement = slideElement.querySelector('.details-block:last-of-type .details-text');
  if (contributionElement && project.keyContribution) {
    contributionElement.textContent = project.keyContribution;
  }

  // Изображения (если есть preview) - оптимизированная загрузка
  if (project.media?.preview) {
    const projectPlaceholder = slideElement.querySelector('.project-placeholder');
    if (projectPlaceholder) {
      // Первый слайд виден сразу, остальные загружаем лениво
      const isFirstSlide = slideIndex === 0;
      loadBackgroundImage(projectPlaceholder, project.media.preview, isFirstSlide);
    }

    // Заполняем preview изображения с ленивой загрузкой
    const previewPlaceholders = slideElement.querySelectorAll('.preview-placeholder');
    if (project.media.screenshots && project.media.screenshots.length > 0) {
      previewPlaceholders.forEach((placeholder, index) => {
        if (index < project.media.screenshots.length) {
          // Preview изображения всегда загружаем лениво
          loadBackgroundImage(placeholder, project.media.screenshots[index], false);
        }
      });
    }
  }
}

/**
 * Инициализирует главную страницу
 */
async function initIndexPage() {
  // Проверяем, есть ли слайды проектов на странице
  const slidesContainer = document.querySelector('.slides-container');
  if (!slidesContainer) {
    return; // Не главная страница
  }

  // Находим все слайды проектов (начинаются с data-slide="1", так как "0" - главная информация)
  const projectSlides = Array.from(slidesContainer.querySelectorAll('.slide[data-slide]'))
    .filter(slide => {
      const slideIndex = parseInt(slide.getAttribute('data-slide'));
      return slideIndex > 0 && slideIndex < 4; // Слайды 1-3 для проектов, 4 - CTA
    })
    .sort((a, b) => {
      const indexA = parseInt(a.getAttribute('data-slide'));
      const indexB = parseInt(b.getAttribute('data-slide'));
      return indexA - indexB;
    });

  if (projectSlides.length === 0) {
    console.warn('Слайды проектов не найдены');
    return;
  }

  // Загружаем проекты
  const projects = await loadProjectsData();
  
  // Фильтруем featured проекты
  const featuredProjects = projects
    .filter(project => project.featured === true)
    .slice(0, projectSlides.length); // Берем только нужное количество

  if (featuredProjects.length === 0) {
    console.warn('Featured проекты не найдены');
    return;
  }

  // Заполняем слайды данными проектов
  featuredProjects.forEach((project, index) => {
    if (index < projectSlides.length) {
      populateProjectSlide(projectSlides[index], project, index);
    }
  });
  
  // Выделяем активную страницу в навигации
  setActiveNavigationLink();
  
  // Сначала скрываем элементы первого слайда для анимации
  const firstSlide = document.querySelector('.slide[data-slide="0"]');
  if (firstSlide) {
    const isTabletMode = window.innerWidth < 1024 || window.innerHeight < 900;
    if (!isTabletMode) {
      // Скрываем элементы перед анимацией
      const elementsToHide = firstSlide.querySelectorAll('.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image');
      elementsToHide.forEach(el => {
        if (el) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(10px)';
          el.style.transition = 'none';
        }
      });
      // Принудительный reflow для применения стилей
      if (elementsToHide.length > 0 && elementsToHide[0]) {
        void elementsToHide[0].offsetHeight;
      }
    }
  }
  
  // Анимируем первый слайд при загрузке (после заполнения данных)
  // Используем двойной requestAnimationFrame для синхронизации с браузером
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      animateFirstSlide();
      // Настраиваем анимации при переключении слайдов
      setupSlideAnimations();
    });
  });
}

/**
 * Анимирует появление элементов первого слайда
 */
function animateFirstSlide() {
  const firstSlide = document.querySelector('.slide[data-slide="0"]');
  if (!firstSlide) return;
  
  // Проверяем, не в режиме планшета ли мы
  const isTabletMode = window.innerWidth < 1024 || window.innerHeight < 900;
  if (isTabletMode) {
    // В режиме планшета анимации не нужны, так как используется скролл
    return;
  }
  
  // Анимируем текстовые элементы последовательно с минимальной задержкой
  const textElements = [
    '.main-content-name',
    '.main-content-tagline',
    '.main-content-title',
    '.cv-about-text'
  ];
  
  textElements.forEach((selector, index) => {
    const element = firstSlide.querySelector(selector);
    if (element) {
      // Используем минимальную задержку для последовательности (30ms между элементами)
      setTimeout(() => {
        animateElementAppearance(element);
      }, index * 30);
    }
  });
  
  // Анимируем портрет после текстовых элементов
  const portrait = firstSlide.querySelector('.portrait-image');
  if (portrait) {
    setTimeout(() => {
      animateElementAppearance(portrait);
    }, textElements.length * 30);
  }
}

/**
 * Настраивает анимации при переключении слайдов
 */
function setupSlideAnimations() {
  const slidesContainer = document.querySelector('.slides-container');
  if (!slidesContainer) return;
  
  // Проверяем, не в режиме планшета ли мы
  const isTabletMode = window.innerWidth < 1024 || window.innerHeight < 900;
  if (isTabletMode) {
    // В режиме планшета анимации не нужны, так как используется скролл
    return;
  }
  
  // Наблюдаем за изменениями активного слайда
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const slide = mutation.target;
        if (slide.classList.contains('active') && slide.classList.contains('slide')) {
          animateSlideContent(slide);
        }
      }
    });
  });
  
  // Наблюдаем за всеми слайдами
  const slides = slidesContainer.querySelectorAll('.slide');
  slides.forEach(slide => {
    observer.observe(slide, {
      attributes: true,
      attributeFilter: ['class']
    });
  });
}

/**
 * Анимирует содержимое слайда при его активации
 */
function animateSlideContent(slide) {
  const slideIndex = parseInt(slide.getAttribute('data-slide'));
  
  // Пропускаем первый слайд (он анимируется при загрузке)
  if (slideIndex === 0) return;
  
  // Используем requestAnimationFrame для синхронизации
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // CTA слайд (слайд 4)
      if (slideIndex === 4) {
        const title = slide.querySelector('.section-title');
        const buttons = slide.querySelectorAll('.cta-button');
        const divider = slide.querySelector('.cta-divider');
        
        if (title) {
          animateElementAppearance(title);
        }
        
        if (buttons.length > 0) {
          setTimeout(() => {
            animateElementsAppearance(buttons);
          }, 50);
        }
        
        if (divider) {
          setTimeout(() => {
            animateElementAppearance(divider);
          }, 100);
        }
        
        return;
      }
      
      // Проектные слайды (слайды 1-3)
      const elementsToAnimate = [
        '.section-title',
        '.project-title',
        '.project-meta',
        '.project-placeholder',
        '.details-block'
      ];
      
      elementsToAnimate.forEach((selector, index) => {
        const elements = slide.querySelectorAll(selector);
        if (elements.length > 0) {
          setTimeout(() => {
            animateElementsAppearance(elements);
          }, index * 30);
        }
      });
      
      // Анимируем preview изображения с небольшой задержкой
      const previewPlaceholders = slide.querySelectorAll('.preview-placeholder');
      if (previewPlaceholders.length > 0) {
        setTimeout(() => {
          animateElementsAppearance(previewPlaceholders);
        }, elementsToAnimate.length * 30);
      }
    });
  });
}

/**
 * Выделяет активную страницу в навигации #cta-section
 */
function setActiveNavigationLink() {
  const navLinks = document.querySelectorAll('#cta-section .cta-buttons:first-of-type .cta-button');
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

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIndexPage);
} else {
  initIndexPage();
}

export default initIndexPage;

