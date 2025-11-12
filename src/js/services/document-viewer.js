/**
 * Сервис для просмотра документов в модальном окне
 */

import { loadHTML } from '../layout.js';

let documentViewerModal = null;
let isInitialized = false;

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
    closeButton.addEventListener('click', closeDocumentViewer);
  }
  
  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !documentViewerModal.hidden) {
      closeDocumentViewer();
    }
  });
  
  // Полноэкранный режим
  if (fullscreenButton) {
    fullscreenButton.addEventListener('click', toggleFullscreen);
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
  
  // Показываем модальное окно
  documentViewerModal.hidden = false;
  document.body.style.overflow = 'hidden'; // Блокируем скролл body
  
  // Фокус на модальном окне для доступности
  documentViewerModal.focus();
}

/**
 * Закрывает модальное окно просмотра документа
 */
export function closeDocumentViewer() {
  if (!documentViewerModal) return;
  
  documentViewerModal.hidden = true;
  document.body.style.overflow = ''; // Восстанавливаем скролл body
  
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
  
  const isFullscreen = documentViewerModal.classList.contains('fullscreen');
  
  if (isFullscreen) {
    documentViewerModal.classList.remove('fullscreen');
  } else {
    documentViewerModal.classList.add('fullscreen');
  }
}

