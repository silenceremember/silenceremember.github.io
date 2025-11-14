/**
 * Страница 404 - анимации появления элементов
 */

import { animateElementAppearance, animateElementsAppearance } from '../utils/animations.js';

/**
 * Инициализирует страницу 404
 */
function init404Page() {
  const ctaContent = document.querySelector('.cta-slide-content');
  if (!ctaContent) return;
  
  // Сначала скрываем все элементы для анимации
  const title404 = ctaContent.querySelector('.main-content-name');
  const subtitle = ctaContent.querySelector('.main-content-title');
  const description = ctaContent.querySelector('.main-content-description');
  const buttons = ctaContent.querySelectorAll('.cta-button');
  
  [title404, subtitle, description].forEach(el => {
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'none';
    }
  });
  
  buttons.forEach(btn => {
    if (btn) {
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(10px)';
      btn.style.transition = 'none';
    }
  });
  
  // Плавное появление элементов последовательно
  // Используем двойной requestAnimationFrame для синхронизации с браузером
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Анимируем элементы последовательно с минимальной задержкой
      // Заголовок "404"
      if (title404) {
        animateElementAppearance(title404);
      }
      
      // Подзаголовок
      if (subtitle) {
        setTimeout(() => {
          animateElementAppearance(subtitle);
        }, 30);
      }
      
      // Описание
      if (description) {
        setTimeout(() => {
          animateElementAppearance(description);
        }, 60);
      }
      
      // Кнопки навигации одновременно
      if (buttons.length > 0) {
        setTimeout(() => {
          animateElementsAppearance(buttons);
        }, 90);
      }
    });
  });
}

// Инициализация при загрузке DOM
// Используем небольшую задержку для синхронизации с другими страницами
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init404Page, 50);
  });
} else {
  setTimeout(init404Page, 50);
}

