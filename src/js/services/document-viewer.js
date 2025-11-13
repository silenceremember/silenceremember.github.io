/**
 * Сервис для просмотра документов в модальном окне
 */

import { loadHTML } from '../layout.js';

let documentViewerModal = null;
let isInitialized = false;
let scrollPosition = 0;
let scrollLockElements = [];

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
  
  // Блокируем прокрутку на html и body
  const html = document.documentElement;
  const body = document.body;
  const pageWrapper = document.querySelector('.page-wrapper');
  
  scrollLockElements = [];
  
  // HTML элемент
  scrollLockElements.push({
    element: html,
    originalStyle: html.style.cssText,
    originalOverflow: html.style.overflow,
    originalPosition: html.style.position,
    originalTop: html.style.top,
    originalWidth: html.style.width
  });
  html.style.overflow = 'hidden';
  html.style.position = 'fixed';
  html.style.top = `-${scrollPosition}px`;
  html.style.width = '100%';
  
  // Body элемент
  scrollLockElements.push({
    element: body,
    originalStyle: body.style.cssText,
    originalOverflow: body.style.overflow,
    originalPosition: body.style.position,
    originalTop: body.style.top,
    originalWidth: body.style.width
  });
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${scrollPosition}px`;
  body.style.width = '100%';
  
  // Page wrapper (если есть)
  if (pageWrapper) {
    scrollLockElements.push({
      element: pageWrapper,
      originalStyle: pageWrapper.style.cssText,
      originalOverflow: pageWrapper.style.overflow
    });
    pageWrapper.style.overflow = 'hidden';
  }
  
  // Предотвращаем прокрутку через touch события на мобильных устройствах
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
 * Предотвращает прокрутку
 */
function preventScroll(e) {
  if (!documentViewerModal || documentViewerModal.hidden) {
    return;
  }
  
  // Разрешаем прокрутку внутри iframe-wrapper (где находится PDF)
  const iframeWrapper = documentViewerModal.querySelector('.document-viewer-iframe-wrapper');
  if (iframeWrapper && (iframeWrapper.contains(e.target) || e.target === iframeWrapper)) {
    return;
  }
  
  // Разрешаем прокрутку внутри iframe (PDF контент)
  const iframe = documentViewerModal.querySelector('.document-viewer-iframe');
  if (iframe && (iframe.contains(e.target) || e.target === iframe)) {
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
  const iframe = documentViewerModal.querySelector('.document-viewer-iframe');
  const loadingElement = documentViewerModal.querySelector('.document-viewer-loading');
  const errorElement = documentViewerModal.querySelector('.document-viewer-error');
  const errorLink = documentViewerModal.querySelector('.document-viewer-error-link');
  
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
      if (loadingElement) {
        loadingElement.hidden = true;
      }
      if (errorElement) {
        errorElement.hidden = true;
      }
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
    // Небольшая задержка для плавного закрытия
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const titleElement = documentViewerModal.querySelector('.document-viewer-title');
  const iframe = documentViewerModal.querySelector('.document-viewer-iframe');
  const downloadLink = documentViewerModal.querySelector('.document-viewer-download');
  const loadingElement = documentViewerModal.querySelector('.document-viewer-loading');
  const errorElement = documentViewerModal.querySelector('.document-viewer-error');
  const watermark = documentViewerModal.querySelector('.document-viewer-watermark');
  
  // Устанавливаем заголовок
  if (titleElement) {
    let displayTitle = title;
    if (isDraft && draftNote) {
      displayTitle = `${title} (${draftNote})`;
    }
    titleElement.textContent = displayTitle;
  }
  
  // Устанавливаем URL для iframe (используем Google Docs Viewer для PDF)
  if (iframe) {
    // Используем Google Docs Viewer для просмотра PDF
    const pdfUrl = url.startsWith('http') ? url : `/${url}`;
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(window.location.origin + pdfUrl)}&embedded=true`;
    iframe.src = viewerUrl;
  }
  
  // Устанавливаем ссылку для скачивания
  if (downloadLink) {
    downloadLink.href = url.startsWith('http') ? url : `/${url}`;
  }
  
  // Показываем вотермарку для черновика
  if (watermark) {
    watermark.style.display = isDraft ? 'block' : 'none';
  }
  
  // Показываем индикатор загрузки
  if (loadingElement) {
    loadingElement.hidden = false;
  }
  
  // Скрываем ошибку
  if (errorElement) {
    errorElement.hidden = true;
  }
  
  // Блокируем прокрутку страницы
  lockScroll();
  
  // Показываем модальное окно
  documentViewerModal.hidden = false;
  
  // Фокус на модальном окне для доступности
  documentViewerModal.focus();
}

/**
 * Закрывает модальное окно просмотра документа
 */
export function closeDocumentViewer() {
  if (!documentViewerModal) return;
  
  // Разблокируем прокрутку страницы
  unlockScroll();
  
  documentViewerModal.hidden = true;
  
  // Очищаем iframe для освобождения памяти
  const iframe = documentViewerModal.querySelector('.document-viewer-iframe');
  if (iframe) {
    iframe.src = '';
  }
  
  // Скрываем ошибку
  const errorElement = documentViewerModal.querySelector('.document-viewer-error');
  if (errorElement) {
    errorElement.hidden = true;
  }
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

