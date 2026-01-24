/**
 * Общий модуль анимаций появления элементов
 * Унифицированные анимации для всех страниц сайта
 */

/**
 * Получает значение CSS переменной из root элемента
 * @param {string} variableName - Имя CSS переменной (без --)
 * @param {string} defaultValue - Значение по умолчанию, если переменная не найдена
 * @returns {string} Значение переменной
 */
function getCSSVariable(variableName, defaultValue) {
  if (typeof window === 'undefined' || !document.documentElement) {
    return defaultValue;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${variableName}`)
    .trim();
  return value || defaultValue;
}

/**
 * Конвертирует CSS значение времени (например, "0.3s") в миллисекунды
 * @param {string} timeValue - Значение времени в формате CSS (например, "0.3s")
 * @returns {number} Значение в миллисекундах
 */
function cssTimeToMs(timeValue) {
  const match = timeValue.match(/^([\d.]+)(s|ms)$/);
  if (!match) return 300; // Значение по умолчанию
  const value = parseFloat(match[1]);
  const unit = match[2];
  return unit === 's' ? value * 1000 : value;
}

// Константы для унифицированных анимаций
// Значения синхронизированы с CSS переменными из _variables.scss
export const ANIMATION_CONFIG = {
  // Получаем значения из CSS переменных при первом обращении
  get duration() {
    return getCSSVariable('transition-duration-base', '0.3s');
  },
  get timing() {
    return getCSSVariable('timing-function-ease-in-out', 'ease-in-out');
  },
  translateYAppear: '10px', // Начальное смещение при появлении (снизу)
  translateYDisappear: '-10px', // Конечное смещение при исчезновении (вверх)
  translateYFinal: '0', // Финальная позиция
  get timeout() {
    // Таймаут в миллисекундах, синхронизирован с duration
    return cssTimeToMs(this.duration);
  },
};

/**
 * Анимирует появление одного элемента
 *
 * ОПТИМИЗАЦИЯ: Убраны forced reflow (void offsetHeight) и заменены на
 * цепочку RAF для естественного применения стилей браузером.
 * Используется батчинг read/write операций для предотвращения layout thrashing.
 *
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
    translateYAppear:
      options.translateYAppear || ANIMATION_CONFIG.translateYAppear,
    translateYFinal:
      options.translateYFinal || ANIMATION_CONFIG.translateYFinal,
    timeout: options.timeout || ANIMATION_CONFIG.timeout,
    skipInitialState: options.skipInitialState || false,
  };

  // Убеждаемся, что элемент видим
  if (element.style.display === 'none') {
    element.style.display = '';
  }

  // WRITE фаза: Устанавливаем начальное состояние синхронно
  if (!config.skipInitialState) {
    element.style.opacity = '0';
    element.style.transform = `translateY(${config.translateYAppear})`;
    element.style.transition = 'none';
  }

  // ОПТИМИЗАЦИЯ: Используем цепочку RAF вместо forced reflow
  // RAF 1: Регистрация начальных стилей
  requestAnimationFrame(() => {
    // RAF 2: Подтверждение применения начальных стилей
    requestAnimationFrame(() => {
      // READ фаза: Проверяем состояние элемента если skipInitialState
      let needsInitialState = false;
      if (config.skipInitialState) {
        const inlineOpacity = element.style.opacity;
        const inlineTransform = element.style.transform;
        const inlineTransition = element.style.transition;
        
        needsInitialState =
          !inlineOpacity ||
          inlineOpacity === '' ||
          !inlineTransform ||
          inlineTransform === '' ||
          (inlineTransition && inlineTransition !== 'none');
      }
      
      // WRITE фаза: Применяем начальное состояние если нужно
      if (needsInitialState) {
        element.style.setProperty('opacity', '0', 'important');
        element.style.setProperty(
          'transform',
          `translateY(${config.translateYAppear})`,
          'important'
        );
        element.style.setProperty('transition', 'none', 'important');
      }

      // RAF 3: Применение transition
      requestAnimationFrame(() => {
        // WRITE фаза: Устанавливаем transition
        element.style.removeProperty('transition');
        element.style.transition = `opacity ${config.duration} ${config.timing}, transform ${config.duration} ${config.timing}`;
        
        // RAF 4: Применение финальных значений
        requestAnimationFrame(() => {
          // WRITE фаза: Устанавливаем финальные значения
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
  });
}

/**
 * Анимирует появление массива элементов одновременно
 *
 * ОПТИМИЗАЦИЯ: Убраны forced reflow (void offsetHeight) и заменены на
 * цепочку RAF. Используется батчинг read/write операций.
 *
 * @param {NodeList|Array<HTMLElement>} elements - Массив элементов для анимации
 * @param {Object} options - Опции анимации (см. animateElementAppearance)
 */
export function animateElementsAppearance(elements, options = {}) {
  if (!elements || elements.length === 0) return;

  const elementsArray = Array.isArray(elements)
    ? elements
    : Array.from(elements);
  const translateYAppear =
    options.translateYAppear || ANIMATION_CONFIG.translateYAppear;
  const skipInitialState = options.skipInitialState || false;

  // WRITE фаза: Устанавливаем начальное состояние для всех элементов (если не пропущено)
  if (!skipInitialState) {
    elementsArray.forEach((element) => {
      if (element) {
        element.style.setProperty('opacity', '0', 'important');
        element.style.setProperty(
          'transform',
          `translateY(${translateYAppear})`,
          'important'
        );
        element.style.setProperty('transition', 'none', 'important');
      }
    });
  }

  // ОПТИМИЗАЦИЯ: Используем цепочку RAF вместо forced reflow
  // RAF 1: Регистрация начальных стилей
  requestAnimationFrame(() => {
    // RAF 2: Подтверждение применения начальных стилей
    requestAnimationFrame(() => {
      // READ фаза: Проверяем состояние элементов если skipInitialState
      // Батчим все READ операции перед WRITE
      const elementsNeedingInitialState = [];
      
      if (skipInitialState) {
        elementsArray.forEach((element) => {
          if (element) {
            const inlineOpacity = element.style.opacity;
            const inlineTransform = element.style.transform;
            
            if (
              !inlineOpacity ||
              inlineOpacity === '' ||
              !inlineTransform ||
              inlineTransform === ''
            ) {
              elementsNeedingInitialState.push(element);
            }
          }
        });
      }
      
      // WRITE фаза: Применяем начальное состояние к элементам, которым нужно
      elementsNeedingInitialState.forEach((element) => {
        element.style.setProperty('opacity', '0', 'important');
        element.style.setProperty(
          'transform',
          `translateY(${translateYAppear})`,
          'important'
        );
        element.style.setProperty('transition', 'none', 'important');
      });

      // RAF 3: Применение transition
      requestAnimationFrame(() => {
        const config = {
          duration: options.duration || ANIMATION_CONFIG.duration,
          timing: options.timing || ANIMATION_CONFIG.timing,
          translateYFinal:
            options.translateYFinal || ANIMATION_CONFIG.translateYFinal,
          timeout: options.timeout || ANIMATION_CONFIG.timeout,
        };

        // WRITE фаза: Устанавливаем transition для всех элементов
        elementsArray.forEach((element) => {
          if (element) {
            element.style.removeProperty('transition');
            element.style.transition = `opacity ${config.duration} ${config.timing}, transform ${config.duration} ${config.timing}`;
          }
        });

        // RAF 4: Применение финальных значений
        requestAnimationFrame(() => {
          // WRITE фаза: Устанавливаем финальные значения для всех элементов
          elementsArray.forEach((element) => {
            if (element) {
              element.style.removeProperty('opacity');
              element.style.removeProperty('transform');
              element.style.opacity = '1';
              element.style.transform = `translateY(${config.translateYFinal})`;
            }
          });

          // Убираем inline стили после анимации
          setTimeout(() => {
            elementsArray.forEach((element) => {
              if (element) {
                element.style.removeProperty('transform');
                element.style.removeProperty('opacity');
                element.style.removeProperty('transition');
              }
            });
          }, config.timeout);
        });
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
    translateYAppear:
      options.translateYAppear || ANIMATION_CONFIG.translateYAppear,
    translateYFinal:
      options.translateYFinal || ANIMATION_CONFIG.translateYFinal,
    timeout: options.timeout || ANIMATION_CONFIG.timeout,
  };

  // Убеждаемся, что секция видима
  section.style.visibility = 'visible';
  section.style.display = section.style.display || 'block';

  // Используем ту же логику, что и в animateElementAppearance для единообразия
  animateElementAppearance(section, config);
}
