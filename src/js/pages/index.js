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
  
  // Ждем полной загрузки страницы и всех критичных ресурсов перед запуском анимации
  waitForPageReady().then(() => {
    initializeFirstSlideAnimation();
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
 * Инициализирует анимацию первого слайда после полной загрузки страницы
 */
function initializeFirstSlideAnimation() {
  const firstSlide = document.querySelector('.slide[data-slide="0"]');
  if (firstSlide) {
    const isTabletMode = window.innerWidth < 1024 || window.innerHeight < 900;
    if (!isTabletMode) {
      // Элементы уже скрыты функцией hideFirstSlideElementsImmediately()
      // Проверяем, что начальное состояние установлено и запускаем анимацию
      const elementsToAnimate = firstSlide.querySelectorAll('.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image');
      
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Проверяем, что все элементы скрыты (на всякий случай)
          elementsToAnimate.forEach(el => {
            if (el) {
              const computedStyle = window.getComputedStyle(el);
              const opacity = parseFloat(computedStyle.opacity);
              // Если элемент видим, устанавливаем начальное состояние снова
              if (opacity > 0.01) {
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty('transform', 'translateY(10px)', 'important');
                el.style.setProperty('transition', 'none', 'important');
              }
            }
          });
          
          // Небольшая задержка перед запуском анимации для гарантии готовности
          setTimeout(() => {
            // Запускаем анимацию
            animateFirstSlide();
            // Настраиваем анимации при переключении слайдов
            setupSlideAnimations();
          }, 100); // 100ms задержка для гарантии применения стилей и готовности страницы
        });
      });
    } else {
      // В режиме планшета просто настраиваем анимации для других слайдов
      setupSlideAnimations();
    }
  } else {
    // Если первого слайда нет, просто настраиваем анимации
    setupSlideAnimations();
  }
}

/**
 * Анимирует появление элементов первого слайда при первой загрузке
 * Использует ту же логику, что и animateSlideContent для единообразия
 */
function animateFirstSlide() {
  const firstSlide = document.querySelector('.slide[data-slide="0"]');
  if (!firstSlide) return;
  
  // Используем ту же функцию анимации, что и для переключения слайдов
  // Это гарантирует одинаковое поведение
  animateSlideContent(firstSlide);
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
 * Скрывает элементы слайда перед анимацией
 * @param {HTMLElement} slide - Элемент слайда
 */
function hideSlideElementsBeforeAnimation(slide) {
  const slideIndex = parseInt(slide.getAttribute('data-slide'));
  
  // Первый слайд (слайд 0)
  if (slideIndex === 0) {
    const elementsToHide = slide.querySelectorAll('.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image');
    elementsToHide.forEach(el => {
      if (el) {
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('transform', 'translateY(10px)', 'important');
        el.style.setProperty('transition', 'none', 'important');
      }
    });
    return;
  }
  
  // CTA слайд (слайд 4)
  if (slideIndex === 4) {
    const elementsToHide = slide.querySelectorAll('.section-title, .cta-button, .cta-divider');
    elementsToHide.forEach(el => {
      if (el) {
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('transform', 'translateY(10px)', 'important');
        el.style.setProperty('transition', 'none', 'important');
      }
    });
    return;
  }
  
  // Проектные слайды (слайды 1-3)
  const elementsToHide = slide.querySelectorAll('.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder');
  elementsToHide.forEach(el => {
    if (el) {
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('transform', 'translateY(10px)', 'important');
      el.style.setProperty('transition', 'none', 'important');
    }
  });
}

/**
 * Анимирует содержимое слайда при его активации
 */
function animateSlideContent(slide) {
  const slideIndex = parseInt(slide.getAttribute('data-slide'));
  
  // Проверяем, не в режиме планшета ли мы
  const isTabletMode = window.innerWidth < 1024 || window.innerHeight < 900;
  if (isTabletMode) {
    return;
  }
  
  // Скрываем элементы слайда перед анимацией
  hideSlideElementsBeforeAnimation(slide);
  
  // Принудительный reflow для применения стилей
  if (slide.firstElementChild) {
    void slide.firstElementChild.offsetHeight;
  }
  
  // Используем requestAnimationFrame для синхронизации
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Небольшая задержка для гарантии применения стилей скрытия
      setTimeout(() => {
      // Первый слайд (слайд 0)
      if (slideIndex === 0) {
        const textElements = [
          '.main-content-name',
          '.main-content-tagline',
          '.main-content-title',
          '.cv-about-text'
        ];
        
        textElements.forEach((selector, index) => {
          const element = slide.querySelector(selector);
          if (element) {
            setTimeout(() => {
              animateElementAppearance(element, { skipInitialState: true });
            }, index * 30);
          }
        });
        
        const portrait = slide.querySelector('.portrait-image');
        if (portrait) {
          setTimeout(() => {
            animateElementAppearance(portrait, { skipInitialState: true });
          }, textElements.length * 30);
        }
        return;
      }
      
      // CTA слайд (слайд 4)
      if (slideIndex === 4) {
        const title = slide.querySelector('.section-title');
        const buttons = slide.querySelectorAll('.cta-button');
        const divider = slide.querySelector('.cta-divider');
        
        if (title) {
          animateElementAppearance(title, { skipInitialState: true });
        }
        
        if (buttons.length > 0) {
          setTimeout(() => {
            buttons.forEach((button, index) => {
              setTimeout(() => {
                animateElementAppearance(button, { skipInitialState: true });
              }, index * 30);
            });
          }, 50);
        }
        
        if (divider) {
          setTimeout(() => {
            animateElementAppearance(divider, { skipInitialState: true });
          }, 100 + (buttons.length * 30));
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
            elements.forEach(element => {
              animateElementAppearance(element, { skipInitialState: true });
            });
          }, index * 30);
        }
      });
      
      // Анимируем preview изображения с небольшой задержкой
      const previewPlaceholders = slide.querySelectorAll('.preview-placeholder');
      if (previewPlaceholders.length > 0) {
        setTimeout(() => {
          previewPlaceholders.forEach(placeholder => {
            animateElementAppearance(placeholder, { skipInitialState: true });
          });
        }, elementsToAnimate.length * 30);
      }
      }, 50); // 50ms задержка для гарантии применения стилей скрытия
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

/**
 * Скрывает элементы первого слайда сразу при загрузке DOM
 * Это предотвращает видимость элементов до начала анимации
 */
function hideFirstSlideElementsImmediately() {
  const firstSlide = document.querySelector('.slide[data-slide="0"]');
  if (firstSlide) {
    const isTabletMode = window.innerWidth < 1024 || window.innerHeight < 900;
    if (!isTabletMode) {
      const elementsToHide = firstSlide.querySelectorAll('.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image');
      elementsToHide.forEach(el => {
        if (el) {
          // Скрываем элементы сразу с высоким приоритетом
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('transform', 'translateY(10px)', 'important');
          el.style.setProperty('transition', 'none', 'important');
        }
      });
    }
  }
}

// Сразу скрываем элементы первого слайда как можно раньше
// Это критично важно - нужно сделать до того как элементы станут видимыми
if (document.readyState === 'loading') {
  // Если DOM еще загружается, ждем DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    hideFirstSlideElementsImmediately();
    initIndexPage();
  });
} else {
  // Если DOM уже готов, скрываем элементы сразу
  hideFirstSlideElementsImmediately();
  initIndexPage();
}

export default initIndexPage;

