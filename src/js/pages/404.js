/**
 * Страница 404 - анимации появления элементов
 */

import { animateElementAppearance, animateElementsAppearance, animateSectionAppearance } from '../utils/animations.js';

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
 * Ожидает загрузки всех изображений на странице 404
 * @returns {Promise<void>}
 */
function waitForImagesLoaded() {
  return new Promise((resolve) => {
    // Находим все изображения на странице 404
    const images = document.querySelectorAll('.page-404 img');
    
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
 * Скрывает все элементы страницы 404 сразу с !important для предотвращения FOUC
 */
function hideAll404ElementsImmediately() {
  const ctaContent = document.querySelector('.cta-slide-content');
  if (!ctaContent) return;
  
  const title404 = ctaContent.querySelector('.main-content-name');
  const subtitle = ctaContent.querySelector('.main-content-title');
  const description = ctaContent.querySelector('.main-content-description');
  const buttons = ctaContent.querySelectorAll('.cta-button');
  
  [title404, subtitle, description].forEach(el => {
    if (el) {
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('transform', 'translateY(10px)', 'important');
      el.style.setProperty('transition', 'none', 'important');
    }
  });
  
  buttons.forEach(btn => {
    if (btn) {
      btn.style.setProperty('opacity', '0', 'important');
      btn.style.setProperty('transform', 'translateY(10px)', 'important');
      btn.style.setProperty('transition', 'none', 'important');
    }
  });
}

/**
 * Инициализирует анимации всех элементов страницы 404 после загрузки страницы
 * Все элементы появляются одновременно без задержек
 * Работает как при первой загрузке, так и при повторном посещении страницы
 */
function initialize404Animations() {
  const ctaContent = document.querySelector('.cta-slide-content');
  if (!ctaContent) return;
  
  // Скрываем все элементы сразу (включая те, что уже могут быть видимы при повторном посещении)
  hideAll404ElementsImmediately();
  
  // Принудительный reflow для применения стилей скрытия
  if (ctaContent.firstElementChild) {
    void ctaContent.firstElementChild.offsetHeight;
  }
  
  // Используем двойной requestAnimationFrame для синхронизации с браузером
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Проверяем и при необходимости снова скрываем все элементы
      // Это важно при повторном посещении страницы
      const title404 = ctaContent.querySelector('.main-content-name');
      const subtitle = ctaContent.querySelector('.main-content-title');
      const description = ctaContent.querySelector('.main-content-description');
      const buttons = ctaContent.querySelectorAll('.cta-button');
      
      [title404, subtitle, description, ...buttons].forEach(el => {
        if (el) {
          const computedStyle = window.getComputedStyle(el);
          const opacity = parseFloat(computedStyle.opacity);
          // Если элемент видим, снова скрываем его
          if (opacity > 0.01) {
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('transform', 'translateY(10px)', 'important');
            el.style.setProperty('transition', 'none', 'important');
          }
        }
      });
      
      // Принудительный reflow для применения стилей скрытия
      if (ctaContent.firstElementChild) {
        void ctaContent.firstElementChild.offsetHeight;
      }
      
      // Задержка перед запуском анимации для гарантии готовности
      // Увеличена задержка для лучшей синхронизации, как на главной странице
      setTimeout(() => {
        // Собираем все элементы для синхронной анимации
        const allElementsToAnimate = [];
        
        if (title404) allElementsToAnimate.push(title404);
        if (subtitle) allElementsToAnimate.push(subtitle);
        if (description) allElementsToAnimate.push(description);
        buttons.forEach(btn => {
          if (btn) allElementsToAnimate.push(btn);
        });
        
        // Принудительный reflow перед анимацией
        if (allElementsToAnimate.length > 0 && allElementsToAnimate[0]) {
          void allElementsToAnimate[0].offsetHeight;
        }
        
        // Анимируем все элементы одновременно без задержек
        // Используем skipInitialState: false, чтобы гарантировать установку начального состояния
        if (allElementsToAnimate.length > 0) {
          // Дополнительная проверка: убеждаемся, что элементы действительно скрыты перед анимацией
          allElementsToAnimate.forEach(element => {
            if (element) {
              const computedStyle = window.getComputedStyle(element);
              const opacity = parseFloat(computedStyle.opacity);
              // Если элемент все еще видим, снова скрываем его
              if (opacity > 0.01) {
                element.style.setProperty('opacity', '0', 'important');
                element.style.setProperty('transform', 'translateY(10px)', 'important');
                element.style.setProperty('transition', 'none', 'important');
              }
            }
          });
          
          // Принудительный reflow перед анимацией
          if (allElementsToAnimate.length > 0 && allElementsToAnimate[0]) {
            void allElementsToAnimate[0].offsetHeight;
          }
          
          animateElementsAppearance(allElementsToAnimate, { skipInitialState: false });
        }
      }, 100); // Задержка как на главной странице
    });
  });
}

/**
 * Инициализирует страницу 404
 */
function init404Page() {
  // Скрываем все элементы сразу для предотвращения FOUC
  hideAll404ElementsImmediately();
  
  // Ждем полной загрузки страницы и запускаем анимации
  // Анимация запускается каждый раз при загрузке страницы (как при первой загрузке, так и при повторном посещении)
  waitForPageReady().then(() => {
    initialize404Animations();
  });
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init404Page);
} else {
  init404Page();
}

// Обработчик для случая загрузки страницы из кеша (bfcache)
// Это важно для SPA-подобной навигации
window.addEventListener('pageshow', (event) => {
  // Если страница загружена из кеша, перезапускаем анимацию
  if (event.persisted) {
    const ctaContent = document.querySelector('.cta-slide-content');
    if (ctaContent && ctaContent.children.length > 0) {
      // Небольшая задержка для гарантии готовности DOM
      setTimeout(() => {
        initialize404Animations();
      }, 100);
    }
  }
});

