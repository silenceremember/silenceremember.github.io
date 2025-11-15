/**
 * Общий модуль анимаций появления элементов
 * Унифицированные анимации для всех страниц сайта
 */

// Константы для унифицированных анимаций
export const ANIMATION_CONFIG = {
  duration: '0.3s',
  timing: 'ease-in-out',
  translateYAppear: '10px',    // Начальное смещение при появлении (снизу)
  translateYDisappear: '-10px', // Конечное смещение при исчезновении (вверх)
  translateYFinal: '0',          // Финальная позиция
  timeout: 300                   // Таймаут в миллисекундах
};

/**
 * Анимирует появление одного элемента
 * @param {HTMLElement} element - Элемент для анимации
 * @param {Object} options - Опции анимации
 * @param {string} options.duration - Длительность анимации (по умолчанию из ANIMATION_CONFIG)
 * @param {string} options.timing - Функция плавности (по умолчанию из ANIMATION_CONFIG)
 * @param {string} options.translateYAppear - Начальное смещение (по умолчанию из ANIMATION_CONFIG)
 * @param {string} options.translateYFinal - Финальное смещение (по умолчанию из ANIMATION_CONFIG)
 * @param {number} options.timeout - Таймаут для очистки стилей (по умолчанию из ANIMATION_CONFIG)
 * @param {boolean} options.skipInitialState - Пропустить установку начального состояния (если уже установлено)
 */
export function animateElementAppearance(element, options = {}) {
  if (!element) return;
  
  const config = {
    duration: options.duration || ANIMATION_CONFIG.duration,
    timing: options.timing || ANIMATION_CONFIG.timing,
    translateYAppear: options.translateYAppear || ANIMATION_CONFIG.translateYAppear,
    translateYFinal: options.translateYFinal || ANIMATION_CONFIG.translateYFinal,
    timeout: options.timeout || ANIMATION_CONFIG.timeout,
    skipInitialState: options.skipInitialState || false
  };
  
  // Убеждаемся, что элемент видим
  if (element.style.display === 'none') {
    element.style.display = '';
  }
  
  // Устанавливаем начальное состояние СИНХРОННО перед requestAnimationFrame
  if (!config.skipInitialState) {
    // Принудительно устанавливаем начальное состояние
    element.style.opacity = '0';
    element.style.transform = `translateY(${config.translateYAppear})`;
    element.style.transition = 'none';
    // Принудительный reflow для применения стилей
    void element.offsetHeight;
  }
  
  // Используем двойной requestAnimationFrame для синхронизации с браузером
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Убеждаемся, что начальное состояние установлено
      if (!config.skipInitialState) {
        element.style.opacity = '0';
        element.style.transform = `translateY(${config.translateYAppear})`;
        element.style.transition = 'none';
      } else {
        // Если skipInitialState: true, проверяем что начальное состояние действительно установлено
        // Проверяем computed style для точности
        const computedStyle = window.getComputedStyle(element);
        const computedOpacity = parseFloat(computedStyle.opacity);
        const inlineOpacity = element.style.opacity;
        const inlineTransform = element.style.transform;
        const inlineTransition = element.style.transition;
        
        // Если элемент видим или inline стили не установлены, устанавливаем начальное состояние
        if (computedOpacity > 0.01 || 
            !inlineOpacity || inlineOpacity === '' || 
            !inlineTransform || inlineTransform === '' ||
            (inlineTransition && inlineTransition !== 'none')) {
          // Используем setProperty для гарантии применения (может быть с !important если нужно)
          element.style.setProperty('opacity', '0', 'important');
          element.style.setProperty('transform', `translateY(${config.translateYAppear})`, 'important');
          element.style.setProperty('transition', 'none', 'important');
          // Принудительный reflow для применения стилей
          void element.offsetHeight;
        }
      }
      
      // Применяем анимацию
      requestAnimationFrame(() => {
        // Финальная проверка начального состояния перед анимацией
        const finalComputedStyle = window.getComputedStyle(element);
        const finalOpacity = parseFloat(finalComputedStyle.opacity);
        const finalInlineOpacity = element.style.opacity;
        const finalInlineTransform = element.style.transform;
        
        // Если элемент все еще видим или стили не установлены, устанавливаем начальное состояние
        if (finalOpacity > 0.01 || 
            !finalInlineOpacity || finalInlineOpacity === '' || 
            !finalInlineTransform || finalInlineTransform === '') {
          // Используем setProperty с !important для гарантии применения
          element.style.setProperty('opacity', '0', 'important');
          element.style.setProperty('transform', `translateY(${config.translateYAppear})`, 'important');
          element.style.setProperty('transition', 'none', 'important');
          // Принудительный reflow для применения стилей
          void element.offsetHeight;
        }
        
        // Устанавливаем transition и финальное состояние
        // Важно: сначала устанавливаем transition, затем делаем reflow, затем меняем значения
        // Убираем !important перед установкой transition для корректной работы анимации
        element.style.removeProperty('transition');
        element.style.transition = `opacity ${config.duration} ${config.timing}, transform ${config.duration} ${config.timing}`;
        // Принудительный reflow перед изменением opacity и transform для гарантии применения transition
        void element.offsetHeight;
        
        // Устанавливаем финальные значения одновременно (без !important для корректной анимации)
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
        element.style.opacity = '1';
        element.style.transform = `translateY(${config.translateYFinal})`;
        
        // Убираем inline стили после анимации
        setTimeout(() => {
          element.style.removeProperty('transform');
          element.style.removeProperty('opacity');
          element.style.removeProperty('transition');
        }, config.timeout);
      });
    });
  });
}

/**
 * Анимирует появление массива элементов одновременно
 * @param {NodeList|Array<HTMLElement>} elements - Массив элементов для анимации
 * @param {Object} options - Опции анимации (см. animateElementAppearance)
 */
export function animateElementsAppearance(elements, options = {}) {
  if (!elements || elements.length === 0) return;
  
  const elementsArray = Array.isArray(elements) ? elements : Array.from(elements);
  const translateYAppear = options.translateYAppear || ANIMATION_CONFIG.translateYAppear;
  
  // Устанавливаем начальное состояние для всех элементов СИНХРОННО
  elementsArray.forEach(element => {
    if (element) {
      element.style.opacity = '0';
      element.style.transform = `translateY(${translateYAppear})`;
      element.style.transition = 'none';
    }
  });
  
  // Принудительный reflow для применения стилей
  if (elementsArray.length > 0 && elementsArray[0]) {
    void elementsArray[0].offsetHeight;
  }
  
  // Используем двойной requestAnimationFrame для синхронизации с браузером
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Убеждаемся, что начальное состояние установлено
      elementsArray.forEach(element => {
        if (element) {
          element.style.opacity = '0';
          element.style.transform = `translateY(${translateYAppear})`;
          element.style.transition = 'none';
        }
      });
      
      // Применяем анимацию одновременно для всех элементов
      requestAnimationFrame(() => {
        const config = {
          duration: options.duration || ANIMATION_CONFIG.duration,
          timing: options.timing || ANIMATION_CONFIG.timing,
          translateYFinal: options.translateYFinal || ANIMATION_CONFIG.translateYFinal,
          timeout: options.timeout || ANIMATION_CONFIG.timeout
        };
        
        elementsArray.forEach(element => {
          if (element) {
            element.style.transition = `opacity ${config.duration} ${config.timing}, transform ${config.duration} ${config.timing}`;
            element.style.opacity = '1';
            element.style.transform = `translateY(${config.translateYFinal})`;
          }
        });
        
        // Убираем inline стили после анимации
        setTimeout(() => {
          elementsArray.forEach(element => {
            if (element) {
              element.style.transform = '';
              element.style.opacity = '';
              element.style.transition = '';
            }
          });
        }, config.timeout);
      });
    });
  });
}

/**
 * Анимирует появление текстовых элементов с последовательной задержкой
 * @param {HTMLElement} container - Контейнер с текстовыми элементами
 * @param {string} selector - Селектор для поиска элементов
 * @param {Object} options - Опции анимации
 * @param {number} options.delay - Задержка между элементами в миллисекундах (по умолчанию 100)
 */
export function animateTextElements(container, selector, options = {}) {
  if (!container) return;
  
  const elements = container.querySelectorAll(selector);
  if (elements.length === 0) return;
  
  const delay = options.delay || 100;
  
  Array.from(elements).forEach((element, index) => {
    setTimeout(() => {
      animateElementAppearance(element, options);
    }, index * delay);
  });
}

/**
 * Анимирует появление секции с контентом
 * Используется для секций, которые содержат другие анимируемые элементы
 * @param {HTMLElement} section - Секция для анимации
 * @param {Object} options - Опции анимации
 */
export function animateSectionAppearance(section, options = {}) {
  if (!section) return;
  
  const config = {
    duration: options.duration || ANIMATION_CONFIG.duration,
    timing: options.timing || ANIMATION_CONFIG.timing,
    translateYAppear: options.translateYAppear || ANIMATION_CONFIG.translateYAppear,
    translateYFinal: options.translateYFinal || ANIMATION_CONFIG.translateYFinal,
    timeout: options.timeout || ANIMATION_CONFIG.timeout
  };
  
  // Убеждаемся, что секция видима
  section.style.visibility = 'visible';
  section.style.display = section.style.display || 'block';
  
  // Используем ту же логику, что и в animateElementAppearance для единообразия
  animateElementAppearance(section, config);
}

