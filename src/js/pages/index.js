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
 * Работает как в desktop, так и в tablet/mobile режимах
 */
function initializeFirstSlideAnimation() {
  const slidesContainer = document.querySelector('.slides-container');
  if (!slidesContainer) {
    setupSlideAnimations();
    return;
  }
  
  const isTabletMode = slidesContainer.classList.contains('tablet-scroll-mode');
  const slides = slidesContainer.querySelectorAll('.slide');
  
  // Скрываем элементы всех слайдов перед анимацией
  slides.forEach(slide => {
    hideSlideElementsBeforeAnimation(slide);
  });
  
  // Принудительный reflow для применения стилей скрытия
  if (slides.length > 0 && slides[0].firstElementChild) {
    void slides[0].firstElementChild.offsetHeight;
      }
  
  // Используем двойной requestAnimationFrame для синхронизации с браузером
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Проверяем, что все элементы скрыты (на всякий случай)
      slides.forEach(slide => {
        const slideIndex = parseInt(slide.getAttribute('data-slide'));
        let elementsToCheck = [];
        
        if (slideIndex === 0) {
          elementsToCheck = slide.querySelectorAll('.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image');
        } else if (slideIndex === 4) {
          elementsToCheck = slide.querySelectorAll('.section-title, .cta-button, .cta-divider');
        } else {
          elementsToCheck = slide.querySelectorAll('.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder');
        }
        
        elementsToCheck.forEach(el => {
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
      });
      
      // Небольшая задержка перед запуском анимации для гарантии готовности
      setTimeout(() => {
        // Анимация запускается только при первой загрузке страницы
        // При переключении между режимами анимация не проигрывается
        
        if (isTabletMode) {
          // В tablet режиме анимируем все слайды одновременно только при первой загрузке
          // lastKnownMode будет null только при первой загрузке
          if (lastKnownMode === null) {
            lastKnownMode = isTabletMode;
            restartAnimationsOnModeChange();
          }
        } else {
          // В desktop режиме анимируем только первый слайд при первой загрузке
          if (lastKnownMode === null) {
            lastKnownMode = isTabletMode;
          }
          if (lastActiveSlideIndex === null) {
            lastActiveSlideIndex = 0; // Первый слайд
      animateFirstSlide();
          }
        }
      // Настраиваем анимации при переключении слайдов
      setupSlideAnimations();
      }, 100); // 100ms задержка для гарантии применения стилей и готовности страницы
    });
  });
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

// Переменные для отслеживания состояния режима и предотвращения множественных вызовов
let lastKnownMode = null;
let animationTimeout = null;
let isAnimating = false;
let debounceTimeout = null;
let lastActiveSlideIndex = null;
let slideAnimationTimeout = null;
let isModeSwitching = false; // Флаг переключения режима

/**
 * Перезапускает анимации для видимых слайдов при переключении режимов
 * Запускается только при реальном переключении между desktop и tablet/mobile
 */
function restartAnimationsOnModeChange() {
  const slidesContainer = document.querySelector('.slides-container');
  if (!slidesContainer) return;
  
  const isTabletMode = slidesContainer.classList.contains('tablet-scroll-mode');
  
  // Проверка изменения режима уже выполнена в observer
  // Просто запускаем анимацию
  
  // Если анимация уже выполняется, отменяем предыдущую
  if (isAnimating) {
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      animationTimeout = null;
    }
    // Не возвращаемся, продолжаем с новой анимацией
  }
  
  isAnimating = true;
  
  const slides = slidesContainer.querySelectorAll('.slide');
  
  // Минимальная задержка для гарантии применения изменений режима
  animationTimeout = setTimeout(() => {
    if (isTabletMode) {
      // В tablet режиме все слайды видимы - анимируем все элементы одновременно
      // НЕ скрываем элементы, если они уже видимы, чтобы избежать мерцания
      const allElementsToAnimate = [];
      
      // Собираем все элементы всех слайдов для одновременной анимации
      slides.forEach(slide => {
        // Проверяем, что слайд видим
        const style = window.getComputedStyle(slide);
        if (style.opacity !== '0' && style.visibility !== 'hidden') {
          const slideIndex = parseInt(slide.getAttribute('data-slide'));
          
          // Собираем элементы в зависимости от типа слайда
          if (slideIndex === 0) {
            // Первый слайд
            const textElements = slide.querySelectorAll('.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text');
            const portrait = slide.querySelector('.portrait-image');
            allElementsToAnimate.push(...Array.from(textElements));
            if (portrait) allElementsToAnimate.push(portrait);
          } else if (slideIndex === 4) {
            // CTA слайд
            const title = slide.querySelector('.section-title');
            const buttons = slide.querySelectorAll('.cta-button');
            const divider = slide.querySelector('.cta-divider');
            if (title) allElementsToAnimate.push(title);
            allElementsToAnimate.push(...Array.from(buttons));
            if (divider) allElementsToAnimate.push(divider);
          } else {
            // Проектные слайды (1-3)
            const elements = slide.querySelectorAll('.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder');
            allElementsToAnimate.push(...Array.from(elements));
          }
        }
      });
      
      // Проверяем, какие элементы нужно анимировать (только те, что еще не видимы)
      const elementsToAnimate = allElementsToAnimate.filter(element => {
        if (!element) return false;
        const computedStyle = window.getComputedStyle(element);
        const opacity = parseFloat(computedStyle.opacity);
        const inlineOpacity = element.style.opacity;
        const inlineTransform = element.style.transform;
        
        // Если элемент уже полностью видим и не имеет inline стилей скрытия, не анимируем его
        if (opacity >= 0.99 && (!inlineOpacity || inlineOpacity === '' || inlineOpacity === '1') && 
            (!inlineTransform || inlineTransform === '' || inlineTransform.includes('translateY(0'))) {
          return false;
        }
        
        // Анимируем элемент, если он не полностью видим или имеет inline стили скрытия
        return true;
      });
      
      // Если есть элементы для анимации, скрываем их перед анимацией
      if (elementsToAnimate.length > 0) {
        elementsToAnimate.forEach(element => {
          element.style.setProperty('opacity', '0', 'important');
          element.style.setProperty('transform', 'translateY(10px)', 'important');
          element.style.setProperty('transition', 'none', 'important');
        });
        
        // Принудительный reflow для применения стилей скрытия
        if (elementsToAnimate.length > 0 && elementsToAnimate[0]) {
          void elementsToAnimate[0].offsetHeight;
        }
      }
      
      // Анимируем все элементы одновременно только если есть элементы для анимации
      // Если все элементы уже видимы, не запускаем анимацию, чтобы избежать мерцания
      if (elementsToAnimate.length > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Используем animateElementsAppearance для одновременной анимации всех элементов
            animateElementsAppearance(elementsToAnimate, { skipInitialState: true });
          });
  });
      } else {
        // Если все элементы уже видимы, просто сбрасываем флаг без анимации
        isAnimating = false;
        animationTimeout = null;
      }
    } else {
      // В desktop режиме анимируем только активный слайд
      // Скрываем элементы активного слайда перед анимацией
      const activeSlide = slidesContainer.querySelector('.slide.active');
      if (activeSlide) {
        hideSlideElementsBeforeAnimation(activeSlide);
        
        // Принудительный reflow для применения стилей скрытия
        if (activeSlide.firstElementChild) {
          void activeSlide.firstElementChild.offsetHeight;
        }
        
        // Используем requestAnimationFrame для синхронизации
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            animateSlideContent(activeSlide);
          });
        });
      }
    }
    
    // Сбрасываем флаг после завершения анимации
    setTimeout(() => {
      isAnimating = false;
      animationTimeout = null;
    }, 500); // Время анимации + запас
  }, 50); // Минимальная задержка для гарантии применения изменений режима
}

/**
 * Настраивает анимации при переключении слайдов
 * Работает как в desktop, так и в tablet/mobile режимах
 */
function setupSlideAnimations() {
  const slidesContainer = document.querySelector('.slides-container');
  if (!slidesContainer) return;
  
  // Наблюдаем за изменениями активного слайда
  const slideObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const slide = mutation.target;
        if (slide.classList.contains('active') && slide.classList.contains('slide')) {
          const slideIndex = parseInt(slide.getAttribute('data-slide'));
          
          // Если это тот же слайд, не запускаем анимацию повторно
          if (lastActiveSlideIndex === slideIndex && lastActiveSlideIndex !== null) {
            return;
          }
          
          // Если происходит переключение режима, не запускаем анимацию
          if (isModeSwitching) {
            // Просто обновляем индекс активного слайда и делаем элементы видимыми
            lastActiveSlideIndex = slideIndex;
            showActiveSlideElements();
            return;
          }
          
          // Отменяем предыдущий таймер, если он есть
          if (slideAnimationTimeout) {
            clearTimeout(slideAnimationTimeout);
            slideAnimationTimeout = null;
          }
          
          // Обновляем последний активный слайд
          lastActiveSlideIndex = slideIndex;
          
          // Небольшая задержка для гарантии применения изменений класса и debounce
          slideAnimationTimeout = setTimeout(() => {
          animateSlideContent(slide);
            slideAnimationTimeout = null;
          }, 100); // Увеличена задержка для debounce
        }
      }
    });
  });
  
  // Наблюдаем за всеми слайдами
  const slides = slidesContainer.querySelectorAll('.slide');
  slides.forEach(slide => {
    slideObserver.observe(slide, {
      attributes: true,
      attributeFilter: ['class']
    });
  });
  
  /**
   * Делает все элементы всех слайдов видимыми при переключении в tablet режим
   * Убирает inline стили скрытия, чтобы элементы стали видимыми без анимации
   */
  function showAllSlideElements() {
    const slides = slidesContainer.querySelectorAll('.slide');
    slides.forEach(slide => {
      const slideIndex = parseInt(slide.getAttribute('data-slide'));
      let elementsToShow = [];
      
      if (slideIndex === 0) {
        elementsToShow = slide.querySelectorAll('.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image');
      } else if (slideIndex === 4) {
        elementsToShow = slide.querySelectorAll('.section-title, .cta-button, .cta-divider');
      } else {
        elementsToShow = slide.querySelectorAll('.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder');
      }
      
      elementsToShow.forEach(element => {
        if (element) {
          // Убираем все inline стили скрытия, чтобы элементы стали видимыми
          element.style.removeProperty('opacity');
          element.style.removeProperty('transform');
          element.style.removeProperty('transition');
        }
      });
    });
  }

  /**
   * Делает элементы активного слайда видимыми при переключении из tablet в desktop
   * Убирает inline стили скрытия без анимации
   */
  function showActiveSlideElements() {
    const activeSlide = slidesContainer.querySelector('.slide.active');
    if (!activeSlide) return;
    
    const slideIndex = parseInt(activeSlide.getAttribute('data-slide'));
    let elementsToShow = [];
    
    if (slideIndex === 0) {
      elementsToShow = activeSlide.querySelectorAll('.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image');
    } else if (slideIndex === 4) {
      elementsToShow = activeSlide.querySelectorAll('.section-title, .cta-button, .cta-divider');
    } else {
      elementsToShow = activeSlide.querySelectorAll('.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder');
    }
    
    elementsToShow.forEach(element => {
      if (element) {
        // Убираем все inline стили скрытия, чтобы элементы стали видимыми
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
        element.style.removeProperty('transition');
      }
    });
  }

  // Наблюдаем за изменениями режима (tablet-scroll-mode) на контейнере
  // Только для отслеживания состояния, без запуска анимации при переключении режимов
  const containerObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target === slidesContainer) {
          const currentMode = slidesContainer.classList.contains('tablet-scroll-mode');
          const modeChanged = lastKnownMode !== currentMode;
          
          // При переключении из tablet в desktop делаем элементы активного слайда видимыми без анимации
          // Это должно быть обработано ПЕРВЫМ, до любых других операций
          if (modeChanged && currentMode === false && lastKnownMode === true) {
            // Устанавливаем флаг переключения режима СИНХРОННО, до любых изменений DOM
            isModeSwitching = true;
            
            // Отменяем любые запланированные анимации слайдов
            if (slideAnimationTimeout) {
              clearTimeout(slideAnimationTimeout);
              slideAnimationTimeout = null;
            }
            
            // Обновляем lastKnownMode сразу, чтобы предотвратить повторные срабатывания
            lastKnownMode = currentMode;
            
            // Сразу делаем элементы активного слайда видимыми
            showActiveSlideElements();
            
            // Небольшая задержка для гарантии применения изменений режима
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                // Убеждаемся, что элементы видимы
                showActiveSlideElements();
                
                // Сбрасываем флаг после достаточной задержки, чтобы перекрыть возможные вызовы анимации
                setTimeout(() => {
                  isModeSwitching = false;
                }, 500); // Увеличена задержка для гарантии
              });
            });
            
            return; // Выходим, чтобы не обрабатывать другие случаи
          }
          
          // При переключении в tablet режим делаем все элементы видимыми
          if (modeChanged && currentMode === true) {
            // Устанавливаем флаг переключения режима
            isModeSwitching = true;
            
            // Обновляем lastKnownMode сразу
            lastKnownMode = currentMode;
            
            // Небольшая задержка для гарантии применения изменений режима
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                showAllSlideElements();
                
                // Сбрасываем флаг после небольшой задержки
                setTimeout(() => {
                  isModeSwitching = false;
                }, 200);
              });
            });
            
            return; // Выходим, чтобы не обновлять lastKnownMode повторно
          }
          
          // Обновляем lastKnownMode при изменении режима (если не было обработано выше)
          if (modeChanged) {
            lastKnownMode = currentMode;
          }
        }
      }
    });
  });
  
  // Наблюдаем за контейнером слайдов для отслеживания переключения режимов
  containerObserver.observe(slidesContainer, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  // Инициализируем начальное состояние режима
  lastKnownMode = slidesContainer.classList.contains('tablet-scroll-mode');
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
 * Работает как в desktop, так и в tablet/mobile режимах
 */
function animateSlideContent(slide) {
  // Если происходит переключение режима, не запускаем анимацию
  if (isModeSwitching) {
    return;
  }
  
  const slideIndex = parseInt(slide.getAttribute('data-slide'));
  
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
 * Скрывает элементы всех слайдов сразу при загрузке DOM
 * Это предотвращает видимость элементов до начала анимации
 * Работает как в desktop, так и в tablet/mobile режимах
 */
function hideAllSlideElementsImmediately() {
  const slidesContainer = document.querySelector('.slides-container');
  if (!slidesContainer) return;
  
  const slides = slidesContainer.querySelectorAll('.slide');
  
  // Скрываем элементы всех слайдов
  slides.forEach(slide => {
    const slideIndex = parseInt(slide.getAttribute('data-slide'));
    let elementsToHide = [];
    
    if (slideIndex === 0) {
      elementsToHide = slide.querySelectorAll('.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image');
    } else if (slideIndex === 4) {
      elementsToHide = slide.querySelectorAll('.section-title, .cta-button, .cta-divider');
    } else {
      elementsToHide = slide.querySelectorAll('.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder');
    }
    
    elementsToHide.forEach(el => {
      if (el) {
        // Скрываем элементы сразу с высоким приоритетом
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('transform', 'translateY(10px)', 'important');
        el.style.setProperty('transition', 'none', 'important');
      }
    });
  });
}

// Сразу скрываем элементы всех слайдов как можно раньше
// Это критично важно - нужно сделать до того как элементы станут видимыми
if (document.readyState === 'loading') {
  // Если DOM еще загружается, ждем DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    hideAllSlideElementsImmediately();
    initIndexPage();
  });
} else {
  // Если DOM уже готов, скрываем элементы сразу
  hideAllSlideElementsImmediately();
  initIndexPage();
}

export default initIndexPage;

