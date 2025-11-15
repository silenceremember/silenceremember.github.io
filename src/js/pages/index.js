/**
 * Инициализация главной страницы - загрузка featured проектов
 */

import { getRoleLabel } from '../utils/role-mapper.js';
import { loadData } from '../utils/DataLoader.js';
import { initScrollToTop } from '../components/scroll-to-top.js';
import { SlideAnimationManager } from '../managers/SlideAnimationManager.js';

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
    // Используем Image для предзагрузки перед установкой background-image
    const img = new Image();
    img.loading = 'eager';
    img.fetchPriority = 'high';
    img.onload = () => {
      element.style.backgroundImage = `url(${imageUrl})`;
      element.style.backgroundSize = 'cover';
      element.style.backgroundPosition = 'center';
    };
    img.src = imageUrl;
    return;
  }
  
  // Используем Intersection Observer для ленивой загрузки с оптимизацией
  // Создаем один общий observer для всех элементов (если еще не создан)
  if (!window.backgroundImageObserver) {
    window.backgroundImageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const imageUrl = entry.target.dataset.bgImage;
          if (imageUrl) {
            const img = new Image();
            img.loading = 'lazy';
            img.decoding = 'async';
            img.onload = () => {
              entry.target.style.backgroundImage = `url(${imageUrl})`;
              entry.target.style.backgroundSize = 'cover';
              entry.target.style.backgroundPosition = 'center';
            };
            img.onerror = () => {
              console.warn(`Failed to load background image: ${imageUrl}`);
            };
            img.src = imageUrl;
            // Удаляем data-атрибут после загрузки
            delete entry.target.dataset.bgImage;
          }
          window.backgroundImageObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px', // Увеличено для более ранней загрузки
      threshold: 0.01 // Начинаем загрузку при 1% видимости
    });
  }
  
  // Сохраняем URL в data-атрибуте для observer
  element.dataset.bgImage = imageUrl;
  window.backgroundImageObserver.observe(element);
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
  
  // Инициализируем кнопку "Наверх"
  initScrollToTop();
  
  // Создаем менеджер анимаций слайдов
  const slideAnimationManager = new SlideAnimationManager(slidesContainer);
  
  // Ждем полной загрузки страницы и всех критичных ресурсов перед запуском анимации
  waitForPageReady().then(() => {
    slideAnimationManager.initializeFirstSlideAnimation();
  });
}

/**
 * Ожидает полной готовности страницы, включая загрузку всех изображений и шрифтов
 * @returns {Promise<void>}
 */
function waitForPageReady() {
  return new Promise((resolve) => {
    // Если страница уже полностью загружена
    if (document.readyState === 'complete') {
      // Дополнительно проверяем загрузку всех критичных ресурсов
      Promise.all([
        waitForImagesLoaded(),
        waitForFontsLoaded()
      ]).then(() => resolve());
    } else {
      // Ждем события load
      window.addEventListener('load', () => {
        // После load проверяем загрузку всех критичных ресурсов
        Promise.all([
          waitForImagesLoaded(),
          waitForFontsLoaded()
        ]).then(() => resolve());
      }, { once: true });
    }
  });
}

/**
 * Ожидает загрузки всех шрифтов
 * @returns {Promise<void>}
 */
function waitForFontsLoaded() {
  return new Promise((resolve) => {
    // Проверяем поддержку Font Loading API
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        // Небольшая задержка для гарантии применения шрифтов
        setTimeout(resolve, 50);
      }).catch(() => {
        // В случае ошибки просто продолжаем
        resolve();
      });
    } else {
      // Если API не поддерживается, просто продолжаем
      // Используем небольшую задержку для гарантии загрузки шрифтов
      setTimeout(resolve, 200);
    }
  });
}

/**
 * Ожидает загрузки всех изображений на первом слайде
 * @returns {Promise<void>}
 */
function waitForImagesLoaded() {
  return new Promise((resolve) => {
  const firstSlide = document.querySelector('.slide[data-slide="0"]');
    if (!firstSlide) {
      resolve();
      return;
    }

    // Находим все изображения на первом слайде
    const images = firstSlide.querySelectorAll('img');
    
    if (images.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;
    let resolved = false;

    // Функция для проверки завершения загрузки
    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= totalImages && !resolved) {
        resolved = true;
        // Небольшая дополнительная задержка для гарантии применения стилей
        setTimeout(resolve, 100);
      }
    };

    // Проверяем каждое изображение
    images.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        // Изображение уже загружено
        checkComplete();
      } else {
        // Ждем загрузки изображения
        img.addEventListener('load', checkComplete, { once: true });
        img.addEventListener('error', checkComplete, { once: true }); // Ошибка тоже считается завершением
      }
    });

    // Таймаут на случай, если изображения не загрузятся
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 3000); // Максимум 3 секунды ожидания
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

/**
 * Скрывает элементы всех слайдов сразу при загрузке DOM
 * Это предотвращает видимость элементов до начала анимации
 * Вызывается как можно раньше, до полной инициализации страницы
 */
function hideAllSlideElementsEarly() {
  const slidesContainer = document.querySelector('.slides-container');
  if (!slidesContainer) return;
  
  try {
    const slideAnimationManager = new SlideAnimationManager(slidesContainer);
    slideAnimationManager.hideAllSlideElementsImmediately();
  } catch (error) {
    // Если контейнер еще не готов, игнорируем ошибку
    console.warn('Could not hide slide elements early:', error);
  }
}

// Сразу скрываем элементы всех слайдов как можно раньше
// Это критично важно - нужно сделать до того как элементы станут видимыми
if (document.readyState === 'loading') {
  // Если DOM еще загружается, ждем DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    hideAllSlideElementsEarly();
    initIndexPage();
  });
} else {
  // Если DOM уже готов, скрываем элементы сразу
  hideAllSlideElementsEarly();
  initIndexPage();
}

export default initIndexPage;

