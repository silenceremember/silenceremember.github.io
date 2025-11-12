/**
 * Страница исследований - загрузка и отображение публикаций из JSON в виде карточек
 */

import { loadHTML } from '../layout.js';
import { openDocument } from '../services/document-viewer.js';

// Константы для унифицированных анимаций карточек
const CARD_ANIMATION = {
  duration: '0.3s',
  timing: 'ease-in-out',
  translateYAppear: '10px',
  translateYDisappear: '-10px',
  translateYFinal: '0',
  timeout: 300
};

// Загрузка компонентов
let researchCardTemplate = null;

/**
 * Загружает шаблон карточки исследования
 */
async function loadTemplates() {
  if (!researchCardTemplate) {
    try {
      const cardHTML = await loadHTML('/components/research-card.html');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cardHTML;
      researchCardTemplate = tempDiv.querySelector('.research-card') || tempDiv.firstElementChild;
      if (!researchCardTemplate) {
        console.error('Не удалось найти шаблон карточки исследования');
      }
    } catch (error) {
      console.error('Ошибка загрузки шаблона карточки:', error);
    }
  }
}

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
 * Создает HTML для карточки исследования
 */
function createResearchCard(publication) {
  if (!researchCardTemplate) return null;
  
  const card = researchCardTemplate.cloneNode(true);
  
  // Заполняем данные
  const title = card.querySelector('.research-card-title');
  const authors = card.querySelector('.research-card-authors');
  const journal = card.querySelector('.research-card-journal');
  const status = card.querySelector('.research-card-status');
  const level = card.querySelector('.research-card-level');
  const type = card.querySelector('.research-card-type');
  const description = card.querySelector('.research-card-description');
  const descriptionContainer = card.querySelector('.research-card-description-container');
  const abstractToggle = card.querySelector('.research-card-abstract-toggle');
  const keywords = card.querySelector('.research-card-keywords');
  const button = card.querySelector('.research-card-button');
  
  if (title) title.textContent = publication.title;
  
  // Авторы
  if (authors && publication.authors && publication.authors.length > 0) {
    authors.textContent = publication.authors.join(', ');
  } else if (authors) {
    authors.style.display = 'none';
  }
  
  // Журнал
  if (journal && publication.journal) {
    let journalText = publication.journal;
    if (publication.location) {
      journalText += ` (${publication.location})`;
    }
    journal.textContent = journalText;
  } else if (journal) {
    journal.style.display = 'none';
  }
  
  // Статус - скрываем
  if (status) {
    status.style.display = 'none';
  }
  
  // Уровень
  if (level && publication.level) {
    level.textContent = publication.level;
  } else if (level) {
    level.style.display = 'none';
  }
  
  // Тип
  if (type) {
    type.textContent = getTypeText(publication.type);
  }
  
  // Аннотация - скрываем
  if (descriptionContainer) {
    descriptionContainer.style.display = 'none';
  }
  
  // Ключевые слова
  if (keywords && publication.keywords && publication.keywords.length > 0) {
    keywords.innerHTML = '';
    publication.keywords.forEach(keyword => {
      const keywordEl = document.createElement('span');
      keywordEl.className = 'research-card-keyword';
      keywordEl.textContent = keyword;
      keywords.appendChild(keywordEl);
    });
  } else if (keywords) {
    keywords.style.display = 'none';
  }
  
  // Кнопка PDF
  if (button) {
    if (publication.pdf_url) {
      button.textContent = publication.type === 'diploma' ? 'ЧИТАТЬ ГЛАВУ' : 'ЧИТАТЬ';
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        openDocument({
          url: publication.pdf_url,
          title: publication.title,
          isDraft: publication.status === 'in-progress',
          draftNote: publication.status === 'in-progress' ? 'Черновик' : null
        });
      });
    } else {
      button.disabled = true;
      button.textContent = 'СКОРО';
    }
  }
  
  // Добавляем data-атрибуты
  card.setAttribute('data-research-id', publication.id);
  card.setAttribute('data-type', publication.type);
  card.setAttribute('data-status', publication.status);
  
  // Особый класс для ВКР
  if (publication.type === 'diploma') {
    card.classList.add('research-card-vkr');
  }
  
  return card;
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
    loadingElement.classList.add('hidden');
    setTimeout(() => {
      if (loadingElement.parentNode) {
        loadingElement.remove();
      }
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
  // Загружаем шаблоны
  await loadTemplates();
  
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
      const vkrTitle = document.createElement('h2');
      vkrTitle.className = 'research-section-title';
      vkrTitle.textContent = 'Квалификационная работа';
      vkrSection.appendChild(vkrTitle);
      
      const vkrGrid = document.createElement('div');
      vkrGrid.className = 'research-grid research-grid-vkr';
      
      const vkrCard = createResearchCard(vkr);
      if (vkrCard) {
        vkrCard.style.opacity = '0';
        vkrCard.style.transform = 'translateY(10px)';
        vkrCard.style.transition = 'none';
        vkrGrid.appendChild(vkrCard);
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            vkrCard.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            vkrCard.style.opacity = '1';
            vkrCard.style.transform = 'translateY(0)';
            
            setTimeout(() => {
              vkrCard.style.transform = '';
              vkrCard.style.opacity = '';
              vkrCard.style.transition = '';
            }, 300);
          });
        });
      }
      
      vkrSection.appendChild(vkrGrid);
    }
  }
  
  // Сортируем публикации по дате (от новых к старым)
  regularPublications.sort((a, b) => {
    const yearA = getYearFromDate(a.date) || 0;
    const yearB = getYearFromDate(b.date) || 0;
    
    if (yearB !== yearA) {
      return yearB - yearA;
    }
    
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
      
      // Сетка для карточек года
      const yearGrid = document.createElement('div');
      yearGrid.className = 'research-grid';
      
      // Добавляем карточки
      groupedPublications[year].forEach(publication => {
        const card = createResearchCard(publication);
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          card.style.transition = 'none';
          yearGrid.appendChild(card);
        }
      });
      
      publicationsSection.appendChild(yearGrid);
      
      // Анимация появления карточек
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const cards = yearGrid.querySelectorAll('.research-card');
          cards.forEach((card) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            card.style.transition = 'none';
          });
          
          requestAnimationFrame(() => {
            cards.forEach((card) => {
              card.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
            
            setTimeout(() => {
              cards.forEach((card) => {
                card.style.transform = '';
                card.style.opacity = '';
                card.style.transition = '';
              });
            }, 300);
          });
        });
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
