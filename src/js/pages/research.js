/**
 * Страница исследований - загрузка и отображение публикаций из JSON
 */

import { openDocument } from '../services/document-viewer.js';

/**
 * Загружает данные исследований из JSON
 */
async function loadResearchData() {
  try {
    const response = await fetch('/data/research.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.publications || [];
  } catch (error) {
    console.error('Ошибка загрузки исследований:', error);
    return [];
  }
}

/**
 * Извлекает год из даты публикации
 */
function getYearFromDate(date) {
  if (date.year) {
    return date.year;
  }
  if (date.start) {
    return new Date(date.start).getFullYear();
  }
  if (date.end) {
    return new Date(date.end).getFullYear();
  }
  return null;
}

/**
 * Форматирует дату для отображения
 */
function formatDate(date) {
  if (!date) return '';
  
  if (date.year) {
    return date.year.toString();
  }
  
  if (date.start && date.end) {
    const startDate = new Date(date.start);
    const endDate = new Date(date.end);
    
    // Если даты в одном месяце
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.getDate()}.${String(startDate.getMonth() + 1).padStart(2, '0')}.${startDate.getFullYear()} — ${endDate.getDate()}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${endDate.getFullYear()}`;
    }
    
    return `${startDate.getDate()}.${String(startDate.getMonth() + 1).padStart(2, '0')}.${startDate.getFullYear()} — ${endDate.getDate()}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${endDate.getFullYear()}`;
  }
  
  if (date.start) {
    const startDate = new Date(date.start);
    return `${startDate.getDate()}.${String(startDate.getMonth() + 1).padStart(2, '0')}.${startDate.getFullYear()}`;
  }
  
  return '';
}

/**
 * Получает текст статуса на русском
 */
function getStatusText(status) {
  const statusMap = {
    'published': 'Опубликовано',
    'in-publication': 'На стадии публикации',
    'in-progress': 'В процессе написания'
  };
  return statusMap[status] || status;
}

/**
 * Получает текст типа публикации на русском
 */
function getTypeText(type) {
  const typeMap = {
    'thesis': 'Тезисы',
    'article': 'Статья',
    'diploma': 'Дипломная работа'
  };
  return typeMap[type] || type;
}

/**
 * Создает HTML элемент для ВКР
 */
function createVKRElement(vkr) {
  const vkrSection = document.createElement('div');
  vkrSection.className = 'research-vkr';
  
  const title = document.createElement('h2');
  title.className = 'research-section-title';
  title.textContent = 'Квалификационная работа';
  vkrSection.appendChild(title);
  
  const vkrContent = document.createElement('div');
  vkrContent.className = 'research-publication research-publication-vkr';
  
  const publicationTitle = document.createElement('h3');
  publicationTitle.className = 'research-publication-title';
  publicationTitle.textContent = vkr.title;
  vkrContent.appendChild(publicationTitle);
  
  const publicationMeta = document.createElement('div');
  publicationMeta.className = 'research-publication-meta';
  
  // Авторы
  if (vkr.authors && vkr.authors.length > 0) {
    const authorsEl = document.createElement('div');
    authorsEl.className = 'research-publication-authors';
    authorsEl.textContent = vkr.authors.join(', ');
    publicationMeta.appendChild(authorsEl);
  }
  
  // Тип и статус
  const typeStatusEl = document.createElement('div');
  typeStatusEl.className = 'research-publication-type-status';
  
  const typeEl = document.createElement('span');
  typeEl.className = 'research-publication-type';
  typeEl.textContent = getTypeText(vkr.type);
  typeStatusEl.appendChild(typeEl);
  
  const statusEl = document.createElement('span');
  statusEl.className = 'research-publication-status research-publication-status-in-progress';
  statusEl.textContent = getStatusText(vkr.status);
  typeStatusEl.appendChild(statusEl);
  
  publicationMeta.appendChild(typeStatusEl);
  
  // Примечание о черновике
  if (vkr.status === 'in-progress') {
    const draftNote = document.createElement('div');
    draftNote.className = 'research-publication-draft-note';
    draftNote.textContent = 'Черновик. Доступна только первая глава. Остальные главы доступны по запросу.';
    publicationMeta.appendChild(draftNote);
  }
  
  vkrContent.appendChild(publicationMeta);
  
  // Кнопка просмотра PDF
  if (vkr.pdf_url) {
    const pdfButton = document.createElement('button');
    pdfButton.className = 'research-publication-pdf-button';
    pdfButton.textContent = 'Читать первую главу (PDF)';
    pdfButton.addEventListener('click', () => {
      openDocument({
        url: vkr.pdf_url,
        title: vkr.title,
        isDraft: true,
        draftNote: 'Черновик'
      });
    });
    vkrContent.appendChild(pdfButton);
  }
  
  vkrSection.appendChild(vkrContent);
  
  return vkrSection;
}

/**
 * Создает HTML элемент для публикации
 */
function createPublicationElement(publication) {
  const publicationEl = document.createElement('article');
  publicationEl.className = 'research-publication';
  
  // Заголовок
  const title = document.createElement('h3');
  title.className = 'research-publication-title';
  title.textContent = publication.title;
  publicationEl.appendChild(title);
  
  // Мета-информация
  const meta = document.createElement('div');
  meta.className = 'research-publication-meta';
  
  // Авторы
  if (publication.authors && publication.authors.length > 0) {
    const authorsEl = document.createElement('div');
    authorsEl.className = 'research-publication-authors';
    authorsEl.textContent = publication.authors.join(', ');
    meta.appendChild(authorsEl);
  }
  
  // Журнал/Конференция и место
  const journalInfo = [];
  if (publication.journal) {
    journalInfo.push(publication.journal);
  }
  if (publication.location) {
    journalInfo.push(`(${publication.location})`);
  }
  
  if (journalInfo.length > 0) {
    const journalEl = document.createElement('div');
    journalEl.className = 'research-publication-journal';
    journalEl.textContent = journalInfo.join(' ');
    meta.appendChild(journalEl);
  }
  
  // Дата и страницы
  const dateYear = getYearFromDate(publication.date);
  const dateText = formatDate(publication.date);
  
  const dateInfo = [];
  if (dateText) {
    dateInfo.push(dateText);
  }
  if (publication.pages) {
    dateInfo.push(`С. ${publication.pages}`);
  }
  
  if (dateInfo.length > 0) {
    const dateEl = document.createElement('div');
    dateEl.className = 'research-publication-date';
    dateEl.textContent = dateInfo.join(', ');
    meta.appendChild(dateEl);
  }
  
  // Статус и уровень
  const statusLevelEl = document.createElement('div');
  statusLevelEl.className = 'research-publication-status-level';
  
  const statusEl = document.createElement('span');
  statusEl.className = `research-publication-status research-publication-status-${publication.status}`;
  statusEl.textContent = getStatusText(publication.status);
  statusLevelEl.appendChild(statusEl);
  
  if (publication.level) {
    const levelEl = document.createElement('span');
    levelEl.className = 'research-publication-level';
    levelEl.textContent = publication.level;
    statusLevelEl.appendChild(levelEl);
  }
  
  meta.appendChild(statusLevelEl);
  
  publicationEl.appendChild(meta);
  
  // Кнопка просмотра PDF (если есть)
  if (publication.pdf_url) {
    const pdfButton = document.createElement('button');
    pdfButton.className = 'research-publication-pdf-button';
    pdfButton.textContent = 'Читать тезисы (PDF)';
    pdfButton.addEventListener('click', () => {
      openDocument({
        url: publication.pdf_url,
        title: publication.title,
        isDraft: false
      });
    });
    publicationEl.appendChild(pdfButton);
  }
  
  // Аннотация (раскрывается по клику)
  if (publication.abstract) {
    const abstractContainer = document.createElement('div');
    abstractContainer.className = 'research-publication-abstract-container';
    
    const abstractToggle = document.createElement('button');
    abstractToggle.className = 'research-publication-abstract-toggle';
    abstractToggle.textContent = 'Показать аннотацию';
    abstractToggle.setAttribute('aria-expanded', 'false');
    
    const abstract = document.createElement('div');
    abstract.className = 'research-publication-abstract';
    abstract.hidden = true;
    abstract.textContent = publication.abstract;
    
    abstractToggle.addEventListener('click', () => {
      const isExpanded = abstractToggle.getAttribute('aria-expanded') === 'true';
      abstract.hidden = isExpanded;
      abstractToggle.setAttribute('aria-expanded', !isExpanded);
      abstractToggle.textContent = isExpanded ? 'Показать аннотацию' : 'Скрыть аннотацию';
    });
    
    abstractContainer.appendChild(abstractToggle);
    abstractContainer.appendChild(abstract);
    publicationEl.appendChild(abstractContainer);
  }
  
  // Ключевые слова (опционально)
  if (publication.keywords && publication.keywords.length > 0) {
    const keywordsEl = document.createElement('div');
    keywordsEl.className = 'research-publication-keywords';
    keywordsEl.innerHTML = `<strong>Ключевые слова:</strong> ${publication.keywords.join(', ')}`;
    publicationEl.appendChild(keywordsEl);
  }
  
  return publicationEl;
}

/**
 * Группирует публикации по годам
 */
function groupPublicationsByYear(publications) {
  const grouped = {};
  
  publications.forEach(pub => {
    const year = getYearFromDate(pub.date);
    if (!year) return;
    
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(pub);
  });
  
  return grouped;
}

/**
 * Скрывает индикатор загрузки
 */
function hideLoadingIndicator() {
  const loadingElement = document.getElementById('research-loading');
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    setTimeout(() => {
      loadingElement.remove();
    }, 300);
  }
}

/**
 * Инициализирует кнопку "Наверх"
 */
function initScrollToTop() {
  const scrollToTopButton = document.getElementById('scroll-to-top');
  if (!scrollToTopButton) return;
  
  const footer = document.querySelector('.footer');
  const pageWrapper = document.querySelector('.page-wrapper');
  
  let lastScrollTop = 0;
  let hideTimeout = null;
  let isAnimating = false;
  
  function isTabletMode() {
    return window.innerWidth <= 768;
  }
  
  function getScrollElement() {
    return isTabletMode() && pageWrapper ? pageWrapper : window;
  }
  
  function getScrollTop() {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      return window.pageYOffset || document.documentElement.scrollTop;
    } else {
      return scrollElement.scrollTop;
    }
  }
  
  function updateButtonPosition() {
    if (!footer) {
      scrollToTopButton.classList.remove('footer-hidden');
      return;
    }
    
    const isFooterHidden = footer.classList.contains('hidden');
    
    if (isFooterHidden) {
      scrollToTopButton.classList.add('footer-hidden');
    } else {
      scrollToTopButton.classList.remove('footer-hidden');
    }
  }
  
  function showButton() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
      isAnimating = false;
    }
    
    if (scrollToTopButton.classList.contains('visible') && !isAnimating) {
      updateButtonPosition();
      return;
    }
    
    isAnimating = true;
    
    if (scrollToTopButton.style.display === 'none') {
      scrollToTopButton.style.display = 'flex';
      updateButtonPosition();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToTopButton.classList.add('visible');
          setTimeout(() => {
            isAnimating = false;
          }, 300);
        });
      });
    } else {
      updateButtonPosition();
      scrollToTopButton.classList.add('visible');
      setTimeout(() => {
        isAnimating = false;
      }, 300);
    }
  }
  
  function hideButton() {
    if (!scrollToTopButton.classList.contains('visible') && scrollToTopButton.style.display === 'none') {
      return;
    }
    
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    
    isAnimating = true;
    scrollToTopButton.classList.remove('visible');
    
    hideTimeout = setTimeout(() => {
      if (!scrollToTopButton.classList.contains('visible')) {
        scrollToTopButton.style.display = 'none';
      }
      isAnimating = false;
      hideTimeout = null;
    }, 300);
  }
  
  function handleScroll() {
    const scrollTop = getScrollTop();
    const isScrollingUp = scrollTop < lastScrollTop;
    const isAtTop = scrollTop <= 0;
    
    if (isScrollingUp && !isAtTop) {
      showButton();
    } else {
      hideButton();
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    
    requestAnimationFrame(() => {
      updateButtonPosition();
    });
  }
  
  scrollToTopButton.addEventListener('click', () => {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      scrollElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
  
  if (footer) {
    const footerObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        updateButtonPosition();
      });
    });
    
    footerObserver.observe(footer, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  function setupScrollListener() {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    }
  }
  
  function updateScrollListener() {
    window.removeEventListener('scroll', handleScroll);
    if (pageWrapper) {
      pageWrapper.removeEventListener('scroll', handleScroll);
    }
    lastScrollTop = getScrollTop();
    setupScrollListener();
  }
  
  setupScrollListener();
  
  window.addEventListener('resize', () => {
    updateScrollListener();
    handleScroll();
  });
  
  lastScrollTop = getScrollTop();
  handleScroll();
  updateButtonPosition();
}

/**
 * Инициализирует страницу исследований
 */
async function initResearchPage() {
  // Загружаем данные
  const publications = await loadResearchData();
  
  // Скрываем индикатор загрузки
  hideLoadingIndicator();
  
  if (publications.length === 0) {
    const publicationsSection = document.getElementById('research-publications-section');
    if (publicationsSection) {
      publicationsSection.innerHTML = '<p>Публикации не найдены.</p>';
    }
    return;
  }
  
  // Разделяем ВКР и публикации
  const vkr = publications.find(pub => pub.type === 'diploma');
  const regularPublications = publications.filter(pub => pub.type !== 'diploma');
  
  // Отображаем ВКР
  if (vkr) {
    const vkrSection = document.getElementById('research-vkr-section');
    if (vkrSection) {
      const vkrElement = createVKRElement(vkr);
      vkrSection.appendChild(vkrElement);
    }
  }
  
  // Сортируем публикации по дате (от новых к старым)
  regularPublications.sort((a, b) => {
    const yearA = getYearFromDate(a.date) || 0;
    const yearB = getYearFromDate(b.date) || 0;
    
    if (yearB !== yearA) {
      return yearB - yearA; // От новых к старым
    }
    
    // Если год одинаковый, сортируем по дате начала
    if (a.date?.start && b.date?.start) {
      return new Date(b.date.start) - new Date(a.date.start);
    }
    
    return 0;
  });
  
  // Группируем по годам
  const groupedPublications = groupPublicationsByYear(regularPublications);
  const years = Object.keys(groupedPublications).sort((a, b) => parseInt(b) - parseInt(a));
  
  // Отображаем публикации
  const publicationsSection = document.getElementById('research-publications-section');
  if (publicationsSection && years.length > 0) {
    years.forEach(year => {
      // Заголовок года
      const yearHeader = document.createElement('h2');
      yearHeader.className = 'research-year-header';
      yearHeader.textContent = year;
      publicationsSection.appendChild(yearHeader);
      
      // Публикации года
      groupedPublications[year].forEach(publication => {
        const publicationEl = createPublicationElement(publication);
        publicationsSection.appendChild(publicationEl);
      });
    });
  }
  
  // Инициализируем кнопку "Наверх"
  initScrollToTop();
  
  // Загружаем SVG для кнопки "Наверх"
  const svgLoaderModule = await import('../components/svg-loader.js');
  if (svgLoaderModule.default) {
    await svgLoaderModule.default();
  }
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResearchPage);
} else {
  initResearchPage();
}

