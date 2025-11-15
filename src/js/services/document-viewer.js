/**
 * Сервис для просмотра документов в модальном окне
 */

import { loadHTML } from '../layout.js';

let documentViewerModal = null;
let isInitialized = false;
let scrollPosition = 0;
let scrollLockElements = [];
let selectionLockElements = [];
// Кэшированные элементы для оптимизации производительности
let iframeWrapper = null;
let iframe = null;
let interactiveElements = null;
let pageWrapper = null;

/**
 * Загружает SVG иконку
 */
async function loadSvg(element) {
  const svgUrl = element.getAttribute('data-svg-src');
  if (!svgUrl) return;

  try {
    const response = await fetch(svgUrl);
    if (!response.ok) return;

    const svgText = await response.text();
    const svgNode = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
    
    // Сохраняем оригинальные классы из placeholder'а
    const originalClass = element.getAttribute('class') || '';
    svgNode.setAttribute('class', originalClass);
    
    // Удаляем width и height, чтобы размеры задавались через CSS
    svgNode.removeAttribute('width');
    svgNode.removeAttribute('height');
    
    // Сохраняем data-атрибут для идентификации (если нужен)
    if (element.hasAttribute('data-svg-src')) {
      svgNode.setAttribute('data-loaded', 'true');
    }
    
    element.parentNode.replaceChild(svgNode, element);
  } catch (error) {
    console.error('Ошибка при загрузке SVG:', error);
  }
}

/**
 * Загружает все SVG иконки в компоненте
 */
async function loadSvgIcons() {
  if (!documentViewerModal) return;
  
  const svgPlaceholders = documentViewerModal.querySelectorAll('[data-svg-src]');
  const promises = Array.from(svgPlaceholders).map(loadSvg);
  await Promise.all(promises);
}

/**
 * Блокирует прокрутку страницы
 */
function lockScroll() {
  // Сохраняем текущую позицию скролла
  scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
  
  // Кэшируем pageWrapper при первом использовании
  if (!pageWrapper) {
    pageWrapper = document.querySelector('.page-wrapper');
  }
  
  // Блокируем прокрутку на html и body
  const html = document.documentElement;
  const body = document.body;
  
  scrollLockElements = [];
  
  // Сохраняем оригинальные стили синхронно
  scrollLockElements.push({
    element: html,
    originalStyle: html.style.cssText,
    originalOverflow: html.style.overflow,
    originalPosition: html.style.position,
    originalTop: html.style.top,
    originalWidth: html.style.width
  });
  
  scrollLockElements.push({
    element: body,
    originalStyle: body.style.cssText,
    originalOverflow: body.style.overflow,
    originalPosition: body.style.position,
    originalTop: body.style.top,
    originalWidth: body.style.width
  });
  
  // Page wrapper (если есть)
  if (pageWrapper) {
    scrollLockElements.push({
      element: pageWrapper,
      originalStyle: pageWrapper.style.cssText,
      originalOverflow: pageWrapper.style.overflow
    });
  }
  
  // Используем CSS класс для блокировки прокрутки - это более производительно
  html.classList.add('document-viewer-scroll-locked');
  body.classList.add('document-viewer-scroll-locked');
  
  // Батчим применение изменений стилей через requestAnimationFrame для уменьшения рефлоу
  requestAnimationFrame(() => {
    // Применяем изменения к html и body одновременно для уменьшения рефлоу
    html.style.top = `-${scrollPosition}px`;
    body.style.top = `-${scrollPosition}px`;
    
    // Page wrapper (если есть)
    if (pageWrapper) {
      pageWrapper.style.overflow = 'hidden';
    }
  });
  
  // Предотвращаем прокрутку через touch события на мобильных устройствах
  // Добавляем обработчики сразу, чтобы предотвратить прокрутку до применения стилей
  document.addEventListener('touchmove', preventScroll, { passive: false });
  document.addEventListener('wheel', preventScroll, { passive: false });
}

/**
 * Разблокирует прокрутку страницы
 */
function unlockScroll() {
  // Удаляем обработчики событий сначала
  document.removeEventListener('touchmove', preventScroll);
  document.removeEventListener('wheel', preventScroll);
  
  // Убираем CSS класс для блокировки прокрутки
  const html = document.documentElement;
  const body = document.body;
  html.classList.remove('document-viewer-scroll-locked');
  body.classList.remove('document-viewer-scroll-locked');
  
  // Восстанавливаем стили для всех элементов
  scrollLockElements.forEach(({ element, originalStyle, originalOverflow, originalPosition, originalTop, originalWidth }) => {
    if (originalStyle) {
      element.style.cssText = originalStyle;
    } else {
      element.style.overflow = originalOverflow || '';
      element.style.position = originalPosition || '';
      element.style.top = originalTop || '';
      element.style.width = originalWidth || '';
    }
  });
  
  scrollLockElements = [];
  
  // Восстанавливаем позицию скролла после небольшой задержки
  // чтобы стили успели примениться
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollPosition);
  });
}

/**
 * Блокирует выделение текста на странице
 */
function lockSelection() {
  // Сначала сбрасываем любое активное выделение
  if (window.getSelection) {
    const selection = window.getSelection();
    if (selection.removeAllRanges) {
      selection.removeAllRanges();
    }
  }
  if (document.selection && document.selection.empty) {
    document.selection.empty();
  }
  
  const html = document.documentElement;
  const body = document.body;
  
  selectionLockElements = [];
  
  // Сохраняем оригинальные стили синхронно
  selectionLockElements.push({
    element: html,
    originalUserSelect: html.style.userSelect,
    originalWebkitUserSelect: html.style.webkitUserSelect,
    originalMozUserSelect: html.style.mozUserSelect,
    originalMsUserSelect: html.style.msUserSelect
  });
  
  selectionLockElements.push({
    element: body,
    originalUserSelect: body.style.userSelect,
    originalWebkitUserSelect: body.style.webkitUserSelect,
    originalMozUserSelect: body.style.mozUserSelect,
    originalMsUserSelect: body.style.msUserSelect
  });
  
  // Батчим применение изменений стилей через requestAnimationFrame для уменьшения рефлоу
  requestAnimationFrame(() => {
    // Применяем изменения к html и body одновременно для уменьшения рефлоу
    html.style.userSelect = 'none';
    html.style.webkitUserSelect = 'none';
    html.style.mozUserSelect = 'none';
    html.style.msUserSelect = 'none';
    
    body.style.userSelect = 'none';
    body.style.webkitUserSelect = 'none';
    body.style.mozUserSelect = 'none';
    body.style.msUserSelect = 'none';
  });
  
  // Добавляем обработчики событий для предотвращения выделения
  // Добавляем обработчики сразу, чтобы предотвратить выделение до применения стилей
  document.addEventListener('selectstart', preventSelection, false);
  document.addEventListener('dragstart', preventSelection, false);
  document.addEventListener('contextmenu', preventSelection, false);
}

/**
 * Разблокирует выделение текста на странице
 */
function unlockSelection() {
  // Удаляем обработчики событий
  document.removeEventListener('selectstart', preventSelection, false);
  document.removeEventListener('dragstart', preventSelection, false);
  document.removeEventListener('contextmenu', preventSelection, false);
  
  // Восстанавливаем стили для всех элементов
  selectionLockElements.forEach(({ 
    element, 
    originalUserSelect, 
    originalWebkitUserSelect, 
    originalMozUserSelect, 
    originalMsUserSelect 
  }) => {
    element.style.userSelect = originalUserSelect || '';
    element.style.webkitUserSelect = originalWebkitUserSelect || '';
    element.style.mozUserSelect = originalMozUserSelect || '';
    element.style.msUserSelect = originalMsUserSelect || '';
  });
  
  selectionLockElements = [];
  
  // Очищаем любое активное выделение
  if (window.getSelection) {
    const selection = window.getSelection();
    if (selection.removeAllRanges) {
      selection.removeAllRanges();
    }
  }
  if (document.selection && document.selection.empty) {
    document.selection.empty();
  }
}

/**
 * Предотвращает выделение текста
 */
function preventSelection(e) {
  if (!documentViewerModal || documentViewerModal.hidden) {
    return;
  }
  
  const target = e.target;
  
  // Быстрая проверка: если target является интерактивным элементом напрямую
  if (target.tagName === 'BUTTON' || target.tagName === 'A' || 
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Разрешаем выделение внутри iframe-wrapper и iframe (PDF контент)
  // Используем кэшированные элементы для оптимизации производительности
  if (iframeWrapper && (iframeWrapper === target || iframeWrapper.contains(target))) {
    return;
  }
  
  if (iframe && (iframe === target || iframe.contains(target))) {
    return;
  }
  
  // Разрешаем выделение внутри самого модального окна (кнопки, заголовки и т.д.)
  if (documentViewerModal.contains(target)) {
    // Разрешаем выделение только для интерактивных элементов (кнопки, ссылки)
    // Используем прямое итерирование NodeList без Array.from() для оптимизации
    if (interactiveElements) {
      for (let i = 0; i < interactiveElements.length; i++) {
        if (interactiveElements[i].contains(target)) {
          return;
        }
      }
    }
  }
  
  // Блокируем выделение для всего остального
  e.preventDefault();
  return false;
}

/**
 * Предотвращает прокрутку
 */
function preventScroll(e) {
  if (!documentViewerModal || documentViewerModal.hidden) {
    return;
  }
  
  const target = e.target;
  
  // Ранний выход: проверяем target напрямую перед contains() для оптимизации
  // Разрешаем прокрутку внутри iframe-wrapper (где находится PDF)
  if (iframeWrapper && (iframeWrapper === target || iframeWrapper.contains(target))) {
    return;
  }
  
  // Разрешаем прокрутку внутри iframe (PDF контент)
  if (iframe && (iframe === target || iframe.contains(target))) {
    return;
  }
  
  // Блокируем прокрутку для всего остального (включая backdrop и другие элементы)
  e.preventDefault();
  e.stopPropagation();
  return false;
}

/**
 * Загружает и инициализирует компонент document-viewer
 */
async function initDocumentViewer() {
  if (isInitialized) return;
  
  try {
    // Загружаем HTML компонента
    const viewerHTML = await loadHTML('/components/document-viewer.html');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = viewerHTML;
    documentViewerModal = tempDiv.querySelector('.document-viewer-modal');
    
    if (!documentViewerModal) {
      throw new Error('Не удалось найти компонент document-viewer');
    }
    
    // Добавляем в body
    document.body.appendChild(documentViewerModal);
    
    // Загружаем SVG иконки
    await loadSvgIcons();
    
    // Инициализируем обработчики событий
    setupEventHandlers();
    
    isInitialized = true;
  } catch (error) {
    console.error('Ошибка инициализации document-viewer:', error);
  }
}

/**
 * Настраивает обработчики событий для модального окна
 */
function setupEventHandlers() {
  if (!documentViewerModal) return;
  
  const backdrop = documentViewerModal.querySelector('.document-viewer-backdrop');
  const closeButton = documentViewerModal.querySelector('.document-viewer-close');
  const fullscreenButton = documentViewerModal.querySelector('.document-viewer-fullscreen');
  const downloadLink = documentViewerModal.querySelector('.document-viewer-download');
  const loadingElement = documentViewerModal.querySelector('.document-viewer-loading');
  const errorElement = documentViewerModal.querySelector('.document-viewer-error');
  const errorLink = documentViewerModal.querySelector('.document-viewer-error-link');
  
  // Кэшируем элементы для оптимизации производительности
  iframeWrapper = documentViewerModal.querySelector('.document-viewer-iframe-wrapper');
  iframe = documentViewerModal.querySelector('.document-viewer-iframe');
  interactiveElements = documentViewerModal.querySelectorAll('button, a, input, textarea');
  
  // Закрытие по клику на backdrop
  if (backdrop) {
    backdrop.addEventListener('click', closeDocumentViewer);
  }
  
  // Закрытие по кнопке закрытия
  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.currentTarget.blur();
      closeDocumentViewer();
    });
  }
  
  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !documentViewerModal.hidden) {
      closeDocumentViewer();
    }
  });
  
  // Полноэкранный режим
  if (fullscreenButton) {
    fullscreenButton.addEventListener('click', (e) => {
      e.currentTarget.blur();
      toggleFullscreen();
    });
  }
  
  // Сброс hover при клике на ссылку скачивания
  if (downloadLink) {
    downloadLink.addEventListener('click', (e) => {
      e.currentTarget.blur();
    });
  }
  
  // Обработка загрузки iframe
  if (iframe) {
    iframe.addEventListener('load', () => {
      // Скрываем индикатор загрузки с плавной анимацией
      if (loadingElement) {
        // Убеждаемся, что loading элемент имеет transition для анимации
        loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        
        // Убеждаемся, что начальное состояние видимо
        loadingElement.style.opacity = '1';
        loadingElement.style.transform = 'translateY(0)';
        
        // Используем requestAnimationFrame для гарантии применения начального состояния
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Применяем скрытие с анимацией
            loadingElement.style.opacity = '0';
            loadingElement.style.transform = 'translateY(-10px)';
            
            // Ждем завершения анимации перед скрытием элемента
            setTimeout(() => {
              loadingElement.hidden = true;
              loadingElement.style.opacity = '';
              loadingElement.style.transform = '';
              loadingElement.style.transition = '';
            }, 300);
          });
        });
      }
      
      if (errorElement) {
        errorElement.hidden = true;
      }
      
      // Показываем iframe плавно после скрытия loading
      setTimeout(() => {
        iframe.classList.add('loaded');
      }, 300);
    });
    
    iframe.addEventListener('error', () => {
      if (loadingElement) {
        loadingElement.hidden = true;
      }
      if (errorElement) {
        errorElement.hidden = false;
        if (errorLink && downloadLink) {
          errorLink.href = downloadLink.href;
        }
      }
      // Убираем класс loaded при ошибке
      iframe.classList.remove('loaded');
    });
  }
}

/**
 * Открывает документ в модальном окне
 * @param {Object} options - Параметры документа
 * @param {string} options.url - URL документа (PDF)
 * @param {string} options.title - Заголовок документа
 * @param {boolean} options.isDraft - Флаг черновика (для ВКР)
 * @param {string} options.draftNote - Примечание о черновике
 */
export async function openDocument({ url, title, isDraft = false, draftNote = 'Черновик' }) {
  // Инициализируем компонент, если еще не инициализирован
  await initDocumentViewer();
  
  if (!documentViewerModal) {
    console.error('Document viewer не инициализирован');
    return;
  }
  
  // Если модальное окно уже открыто, сначала закрываем его
  if (!documentViewerModal.hidden) {
    closeDocumentViewer();
    // Ждем завершения анимации закрытия (соответствует --transition-duration-fast: 0.2s)
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  const titleElement = documentViewerModal.querySelector('.document-viewer-title');
  const downloadLink = documentViewerModal.querySelector('.document-viewer-download');
  const loadingElement = documentViewerModal.querySelector('.document-viewer-loading');
  const errorElement = documentViewerModal.querySelector('.document-viewer-error');
  const watermark = documentViewerModal.querySelector('.document-viewer-watermark');
  
  // Обновляем кэш элементов на случай, если DOM изменился
  if (!iframeWrapper || !iframe || !interactiveElements) {
    iframeWrapper = documentViewerModal.querySelector('.document-viewer-iframe-wrapper');
    iframe = documentViewerModal.querySelector('.document-viewer-iframe');
    interactiveElements = documentViewerModal.querySelectorAll('button, a, input, textarea');
  }
  
  // Устанавливаем заголовок
  if (titleElement) {
    let displayTitle = title;
    if (isDraft && draftNote) {
      displayTitle = `${title} (${draftNote})`;
    }
    titleElement.textContent = displayTitle;
  }
  
  // Устанавливаем URL для iframe (используем встроенный PDF viewer браузера)
  // Используем кэшированный элемент для оптимизации производительности
  if (iframe) {
    // Сбрасываем класс loaded перед загрузкой нового документа
    iframe.classList.remove('loaded');
    
    // Используем встроенный PDF viewer браузера вместо Google Docs Viewer
    // Это устраняет CSP предупреждения от Google Docs Viewer и работает быстрее
    const pdfUrl = url.startsWith('http') ? url : `/${url}`;
    const fullPdfUrl = pdfUrl.startsWith('http') ? pdfUrl : `${window.location.origin}${pdfUrl}`;
    
    // Устанавливаем type для правильной обработки PDF браузером
    iframe.setAttribute('type', 'application/pdf');
    
    // Прямая загрузка PDF в iframe - браузер использует встроенный viewer
    // Это устраняет все CSP предупреждения, так как PDF загружается напрямую
    iframe.src = fullPdfUrl;
    
    // Убираем sandbox, если он был установлен ранее (для корректной работы PDF viewer)
    iframe.removeAttribute('sandbox');
  }
  
  // Устанавливаем ссылку для скачивания
  if (downloadLink) {
    downloadLink.href = url.startsWith('http') ? url : `/${url}`;
  }
  
  // Показываем вотермарку для черновика
  if (watermark) {
    watermark.style.display = isDraft ? 'block' : 'none';
  }
  
  // Скрываем ошибку
  if (errorElement) {
    errorElement.hidden = true;
  }
  
  // Показываем модальное окно сначала для оптимизации порядка операций
  documentViewerModal.hidden = false;
  
  // Батчим все изменения стилей через requestAnimationFrame для уменьшения рефлоу
  requestAnimationFrame(() => {
    // Показываем индикатор загрузки с плавной анимацией
    if (loadingElement) {
      loadingElement.hidden = false;
      loadingElement.style.opacity = '0';
      loadingElement.style.transform = 'translateY(10px)';
      loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
      
      requestAnimationFrame(() => {
        loadingElement.style.opacity = '1';
        loadingElement.style.transform = 'translateY(0)';
      });
    }
    
    // Запускаем анимацию появления модального окна
    documentViewerModal.classList.add('visible');
    
    // Блокируем прокрутку страницы и выделение текста после показа модального окна
    lockScroll();
    lockSelection();
    
    // Фокус на модальном окне для доступности
    documentViewerModal.focus();
  });
}

/**
 * Закрывает модальное окно просмотра документа
 */
export function closeDocumentViewer() {
  if (!documentViewerModal) return;
  
  // Убираем класс visible для запуска анимации исчезновения
  documentViewerModal.classList.remove('visible');
  
  // Разблокируем прокрутку страницы после завершения анимации (соответствует --transition-duration-fast: 0.2s)
  setTimeout(() => {
    unlockScroll();
    unlockSelection();
    documentViewerModal.hidden = true;
    
    // Очищаем iframe для освобождения памяти
    // Используем кэшированный элемент для оптимизации производительности
    if (iframe) {
      iframe.src = '';
      iframe.classList.remove('loaded');
    }
    
    // Скрываем ошибку
    const errorElement = documentViewerModal.querySelector('.document-viewer-error');
    if (errorElement) {
      errorElement.hidden = true;
    }
  }, 200); // Ждем завершения анимации (соответствует --transition-duration-fast: 0.2s)
}

/**
 * Переключает полноэкранный режим
 */
function toggleFullscreen() {
  if (!documentViewerModal) return;
  
  const fullscreenButton = documentViewerModal.querySelector('.document-viewer-fullscreen');
  if (!fullscreenButton) return;
  
  // Ищем иконки по классам (они могут быть span или svg после загрузки)
  const fullscreenIcon = fullscreenButton.querySelector('.document-viewer-icon-fullscreen') || 
                         fullscreenButton.querySelector('svg[class*="fullscreen"]:not([class*="exit"])');
  const fullscreenExitIcon = fullscreenButton.querySelector('.document-viewer-icon-fullscreen-exit') || 
                             fullscreenButton.querySelector('svg[class*="fullscreen-exit"]');
  
  const isFullscreen = documentViewerModal.classList.contains('fullscreen');
  
  if (isFullscreen) {
    documentViewerModal.classList.remove('fullscreen');
    // Переключаем иконки
    if (fullscreenIcon) {
      fullscreenIcon.style.display = 'flex';
    }
    if (fullscreenExitIcon) {
      fullscreenExitIcon.style.display = 'none';
    }
    fullscreenButton.setAttribute('aria-label', 'Полноэкранный режим');
    fullscreenButton.setAttribute('title', 'Полноэкранный режим');
  } else {
    documentViewerModal.classList.add('fullscreen');
    // Переключаем иконки
    if (fullscreenIcon) {
      fullscreenIcon.style.display = 'none';
    }
    if (fullscreenExitIcon) {
      fullscreenExitIcon.style.display = 'flex';
    }
    fullscreenButton.setAttribute('aria-label', 'Выйти из полноэкранного режима');
    fullscreenButton.setAttribute('title', 'Выйти из полноэкранного режима');
  }
}

