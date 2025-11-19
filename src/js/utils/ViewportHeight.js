/**
 * Утилита для корректной работы с высотой viewport на мобильных устройствах
 * 
 * Проблема:
 * На мобильных устройствах 100vh включает адресную строку браузера, которая
 * может быть видимой или скрытой. Это создает "порог" при скролле и проблемы
 * с позиционированием элементов.
 * 
 * Решение:
 * Используем современные viewport units (dvh - dynamic viewport height) с
 * JavaScript fallback для старых браузеров. dvh автоматически адаптируется
 * при скрытии/показе UI браузера.
 */

/**
 * Проверяет поддержку dvh (dynamic viewport height) в браузере
 * @returns {boolean} true если браузер поддерживает dvh
 */
function supportsDvh() {
  // Проверяем поддержку через CSS.supports API
  if (typeof CSS !== 'undefined' && CSS.supports) {
    return CSS.supports('height', '1dvh');
  }
  
  // Fallback проверка через создание тестового элемента
  try {
    const testElement = document.createElement('div');
    testElement.style.height = '1dvh';
    return testElement.style.height === '1dvh';
  } catch (e) {
    return false;
  }
}

/**
 * Устанавливает CSS переменную --vh-fallback на основе текущей высоты viewport
 * Используется для браузеров без поддержки dvh
 */
function setViewportHeightVariable() {
  // Получаем реальную высоту viewport в пикселях
  const vh = window.innerHeight * 0.01;
  
  // Устанавливаем CSS переменную
  // Значение в пикселях, но переменная используется как 1vh эквивалент
  document.documentElement.style.setProperty('--vh-fallback', `${vh}px`);
}

/**
 * Debounce функция для ограничения частоты вызовов
 * @param {Function} func - Функция для вызова
 * @param {number} wait - Время ожидания в миллисекундах
 * @returns {Function} Debounced функция
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Флаг инициализации
 */
let isInitialized = false;

/**
 * Debounced версия setViewportHeightVariable
 */
const debouncedSetViewportHeight = debounce(setViewportHeightVariable, 150);

/**
 * Инициализирует систему корректной работы с viewport height
 * Должна быть вызвана как можно раньше, до инициализации других компонентов
 * 
 * @returns {Object} Объект с информацией о поддержке dvh
 */
export function initViewportHeight() {
  if (isInitialized) {
    return {
      supportsDvh: supportsDvh(),
      message: 'Already initialized',
    };
  }

  const hasDvhSupport = supportsDvh();
  
  // Если браузер не поддерживает dvh, устанавливаем fallback
  if (!hasDvhSupport) {
    // Устанавливаем начальное значение сразу
    setViewportHeightVariable();
    
    // Обновляем при изменении размера окна
    // Используем debounce для оптимизации производительности
    window.addEventListener('resize', debouncedSetViewportHeight, { passive: true });
    
    // Также обновляем при изменении ориентации на мобильных
    if ('orientation' in window) {
      window.addEventListener('orientationchange', () => {
        // Небольшая задержка, чтобы браузер успел пересчитать размеры
        setTimeout(setViewportHeightVariable, 100);
      }, { passive: true });
    }
  } else {
    // Даже если dvh поддерживается, устанавливаем fallback значение
    // на случай, если понадобится для других расчетов
    setViewportHeightVariable();
    
    // И обновляем при resize для консистентности
    window.addEventListener('resize', debouncedSetViewportHeight, { passive: true });
  }
  
  isInitialized = true;
  
  return {
    supportsDvh: hasDvhSupport,
    message: hasDvhSupport 
      ? 'Using native dvh support' 
      : 'Using JavaScript fallback for viewport height',
  };
}

/**
 * Получает текущую высоту viewport в пикселях
 * Полезная утилита для компонентов, которым нужна реальная высота
 * 
 * @returns {number} Высота viewport в пикселях
 */
export function getViewportHeight() {
  return window.innerHeight;
}

/**
 * Получает текущую ширину viewport в пикселях
 * 
 * @returns {number} Ширина viewport в пикселях
 */
export function getViewportWidth() {
  return window.innerWidth;
}

/**
 * Проверяет, является ли устройство мобильным/планшетом
 * @returns {boolean} true если ширина < 1024px или высота < 900px
 */
export function isTabletMode() {
  return window.innerWidth < 1024 || window.innerHeight < 900;
}

// Экспортируем также функцию проверки поддержки dvh
export { supportsDvh };

