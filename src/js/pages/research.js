/**
 * Страница исследований - загрузка и отображение публикаций из JSON в виде карточек
 */

import { loadHTML } from '../layout.js';
import { openDocument } from '../services/document-viewer.js';
import { loadData } from '../utils/data-loader.js';
import { initScrollToTop } from '../components/scroll-to-top.js';

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
 * Загружает данные исследований из JSON с кешированием
 */
async function loadResearchData() {
  try {
    const data = await loadData('/data/research.json');
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
  const type = card.querySelector('.research-card-type');
  const keywords = card.querySelector('.research-card-keywords');
  const button = card.querySelector('.research-card-button');
  
  if (title) title.textContent = publication.title;
  
  // Журнал и уровень (РИНЦ/SCOPUS) вместе
  const journalWrapper = card.querySelector('.research-card-journal-wrapper');
  if (journalWrapper) {
    const journal = journalWrapper.querySelector('.research-card-journal');
    const level = journalWrapper.querySelector('.research-card-level');
    
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
    
    // Уровень (РИНЦ/SCOPUS) рядом с журналом
    if (level && publication.level) {
      level.textContent = publication.level;
    } else if (level) {
      level.style.display = 'none';
    }
    
    // Скрываем обертку, если и журнал, и уровень скрыты
    const journalVisible = journal && publication.journal && journal.style.display !== 'none';
    const levelVisible = level && publication.level && level.style.display !== 'none';
    if (!journalVisible && !levelVisible) {
      journalWrapper.style.display = 'none';
    }
  }
  
  // Тип
  if (type) {
    type.textContent = getTypeText(publication.type);
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
  
  // Обработчик клика для открытия документа
  // Вся карточка работает как кнопка
  if (publication.pdf_url) {
    card.addEventListener('click', (e) => {
      // Проверяем, был ли выделен текст - если да, не открываем карточку
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        return;
      }
      // Предотвращаем всплытие события от кнопки "ЧИТАТЬ"
      // но все равно открываем документ
      e.stopPropagation();
      openDocument({
        url: publication.pdf_url,
        title: publication.title,
        isDraft: publication.status === 'in-progress',
        draftNote: publication.status === 'in-progress' ? 'Черновик' : null
      });
    });
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
 * Скрывает индикатор загрузки с плавной анимацией
 */
function hideLoadingIndicator() {
  return new Promise((resolve) => {
    const loadingElement = document.getElementById('research-loading');
    if (!loadingElement) {
      resolve();
      return;
    }
    
    const publicationsSection = document.getElementById('research-publications-section');
    const vkrSection = document.getElementById('research-vkr-section');
    const sections = [];
    if (publicationsSection) sections.push(publicationsSection);
    if (vkrSection) sections.push(vkrSection);
    
    // Убеждаемся, что loading элемент имеет transition для анимации
    // Устанавливаем transition явно, чтобы гарантировать анимацию
    loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    
    // Убеждаемся, что начальное состояние видимо (на случай если были inline стили)
    loadingElement.style.opacity = '1';
    loadingElement.style.transform = 'translateY(0)';
    
    // Используем requestAnimationFrame для гарантии применения начального состояния
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Теперь применяем скрытие с анимацией
        loadingElement.style.opacity = '0';
        loadingElement.style.transform = 'translateY(-10px)';
      });
    });
    
    // Ждем завершения fadeout анимации loading элемента
    setTimeout(() => {
      if (loadingElement.parentNode) {
        loadingElement.remove();
      }
      
      // Восстанавливаем видимость секций, но не показываем их с анимацией здесь
      // Анимация будет применена в initResearchPage после добавления контента
      sections.forEach(section => {
        // Убеждаемся, что секция видима
        section.style.visibility = 'visible';
        // Устанавливаем opacity: 0 для анимации появления контента
        section.style.opacity = '0';
        // Не устанавливаем transition здесь, он будет установлен в initResearchPage
      });
      
      resolve();
    }, 300);
  });
}

/* ============================================
 * DEBUG FUNCTIONS - Удалить после тестирования
 * ============================================ */

/**
 * Показывает индикатор загрузки (для дебага - клавиша R)
 */
function showLoadingIndicator() {
  const publicationsSection = document.getElementById('research-publications-section');
  const vkrSection = document.getElementById('research-vkr-section');
  
  if (!publicationsSection) return;
  
  // Проверяем, есть ли уже индикатор загрузки
  let loadingElement = document.getElementById('research-loading');
  
  // Проверяем, есть ли контент в секциях
  const hasContent = (publicationsSection.children.length > 0 && 
    (!loadingElement || publicationsSection.children.length > 1 || !publicationsSection.contains(loadingElement))) ||
    (vkrSection && vkrSection.children.length > 0);
  
  if (hasContent) {
    // Если есть контент, плавно скрываем его перед показом loading
    // Используем ту же анимацию, что и для loading (opacity + transform)
    const sectionsToHide = [];
    if (publicationsSection && publicationsSection.children.length > 0 && 
        (!loadingElement || publicationsSection.children.length > 1 || !publicationsSection.contains(loadingElement))) {
      sectionsToHide.push(publicationsSection);
    }
    if (vkrSection && vkrSection.children.length > 0) {
      sectionsToHide.push(vkrSection);
    }
    
    sectionsToHide.forEach(section => {
      section.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    });
    
    // Используем requestAnimationFrame для гарантии применения начального состояния
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Применяем скрытие с анимацией (как у loading при скрытии)
        sectionsToHide.forEach(section => {
          section.style.opacity = '0';
          section.style.transform = 'translateY(-10px)';
        });
      });
    });
    
    setTimeout(() => {
      // После скрытия контента создаем или используем loading элемент
      if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.id = 'research-loading';
        loadingElement.innerHTML = `
          <div class="loading-squares">
            <div class="loading-square"></div>
            <div class="loading-square"></div>
            <div class="loading-square"></div>
          </div>
        `;
      }
      
      // Очищаем секции и добавляем loading
      if (publicationsSection) {
        publicationsSection.innerHTML = '';
        publicationsSection.style.opacity = '0';
        publicationsSection.style.visibility = 'visible';
        publicationsSection.appendChild(loadingElement);
      }
      if (vkrSection) {
        vkrSection.innerHTML = '';
      }
      
      // Убираем класс hidden если он есть
      loadingElement.classList.remove('hidden');
      loadingElement.style.display = '';
      
      // Показываем loading с анимацией
      loadingElement.style.opacity = '0';
      loadingElement.style.transform = 'translateY(10px)';
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
          loadingElement.style.opacity = '1';
          loadingElement.style.transform = 'translateY(0)';
          
          // Показываем publicationsSection с анимацией
          if (publicationsSection) {
            publicationsSection.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            publicationsSection.style.opacity = '1';
            publicationsSection.style.transform = 'translateY(0)';
            setTimeout(() => {
              publicationsSection.style.opacity = '';
              publicationsSection.style.transform = '';
              publicationsSection.style.transition = '';
            }, 300);
          }
        });
      });
    }, 300);
  } else {
    // Если контента нет, просто показываем loading с анимацией
    if (!loadingElement) {
      loadingElement = document.createElement('div');
      loadingElement.className = 'loading';
      loadingElement.id = 'research-loading';
      loadingElement.innerHTML = `
        <div class="loading-squares">
          <div class="loading-square"></div>
          <div class="loading-square"></div>
          <div class="loading-square"></div>
        </div>
      `;
      publicationsSection.innerHTML = '';
      publicationsSection.appendChild(loadingElement);
    } else {
      // Если индикатор уже есть, просто очищаем секцию и показываем его
      publicationsSection.innerHTML = '';
      publicationsSection.appendChild(loadingElement);
    }
    
    // Убираем класс hidden и показываем с анимацией
    loadingElement.classList.remove('hidden');
    loadingElement.style.display = '';
    loadingElement.style.opacity = '0';
    loadingElement.style.transform = 'translateY(10px)';
    
    // Убеждаемся, что секция видима
    publicationsSection.style.opacity = '';
    publicationsSection.style.visibility = '';
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        loadingElement.style.opacity = '1';
        loadingElement.style.transform = 'translateY(0)';
      });
    });
  }
  
  console.log('🔍 [DEBUG] Индикатор загрузки показан (клавиша R)');
}

/**
 * Выделяет активную страницу в навигации research-navigation
 */
function setActiveNavigationLink() {
  const navLinks = document.querySelectorAll('.research-navigation .cta-button');
  let currentPage = window.location.pathname.split('/').pop();
  if (currentPage === '' || currentPage === 'index.html') {
    currentPage = 'index.html';
  }

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Инициализирует обработчик кнопки меню для прокрутки до навигации в tablet режиме
 */
function initMenuButtonScroll() {
  const menuButton = document.querySelector('.header-menu-button');
  const navigationSection = document.querySelector('.research-navigation');
  const pageWrapper = document.querySelector('.page-wrapper');
  
  if (!menuButton || !navigationSection || !pageWrapper) {
    return;
  }
  
  menuButton.addEventListener('click', () => {
    // Проверяем, находимся ли мы в tablet режиме (max-width: 1023px)
    const isTabletMode = window.innerWidth < 1024;
    
    if (isTabletMode) {
      // Вычисляем позицию навигационного меню относительно page-wrapper
      const wrapperRect = pageWrapper.getBoundingClientRect();
      const navRect = navigationSection.getBoundingClientRect();
      const scrollTop = pageWrapper.scrollTop;
      const targetPosition = scrollTop + navRect.top - wrapperRect.top;
      
      // Прокручиваем до навигационного меню
      pageWrapper.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
}

/**
 * Инициализирует страницу исследований
 */
async function initResearchPage() {
  // Загружаем шаблоны
  await loadTemplates();
  
  // Загружаем данные
  const publications = await loadResearchData();
  
  // Скрываем индикатор загрузки и ждем завершения fadeout
  await hideLoadingIndicator();
  
  // Получаем секции и готовим их к анимации появления
  const publicationsSection = document.getElementById('research-publications-section');
  const vkrSection = document.getElementById('research-vkr-section');
  
  // Убеждаемся, что секции готовы к анимации появления
  // Если секции были скрыты через hideLoadingIndicator, они уже имеют opacity: 0
  if (publicationsSection) {
    // Убеждаемся, что секция видима
    publicationsSection.style.visibility = 'visible';
    // Если opacity не установлена или пустая, устанавливаем для анимации
    if (!publicationsSection.style.opacity || publicationsSection.style.opacity === '') {
      publicationsSection.style.opacity = '0';
    }
  }
  if (vkrSection) {
    // Убеждаемся, что секция видима
    vkrSection.style.visibility = 'visible';
    // Если opacity не установлена или пустая, устанавливаем для анимации
    if (!vkrSection.style.opacity || vkrSection.style.opacity === '') {
      vkrSection.style.opacity = '0';
    }
  }
  
  if (publications.length === 0) {
    if (publicationsSection) {
      publicationsSection.innerHTML = '<p>Публикации не найдены.</p>';
      // Показываем секцию с анимацией, если она была скрыта
      const sectionOpacity = publicationsSection.style.opacity;
      if (sectionOpacity === '0' || !sectionOpacity || sectionOpacity === '') {
        publicationsSection.style.transition = 'opacity 0.3s ease-in-out';
        publicationsSection.style.opacity = '1';
        setTimeout(() => {
          publicationsSection.style.opacity = '';
          publicationsSection.style.transition = '';
        }, 300);
      }
      publicationsSection.style.visibility = '';
    }
    return;
  }
  
  // Разделяем ВКР и публикации
  const vkr = publications.find(pub => pub.type === 'diploma');
  const regularPublications = publications.filter(pub => pub.type !== 'diploma');
  
  // Отображаем ВКР
  if (vkr) {
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
      }
      
      vkrSection.appendChild(vkrGrid);
      
      // Плавное появление vkrSection с контентом, затем карточки
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Сначала показываем vkrSection с анимацией (если он был скрыт)
          const sectionOpacity = vkrSection.style.opacity;
          // Показываем секцию с анимацией, если opacity установлена в 0 или не установлена
          if (sectionOpacity === '0' || !sectionOpacity || sectionOpacity === '') {
            vkrSection.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            vkrSection.style.opacity = '1';
            vkrSection.style.transform = 'translateY(0)';
            
            setTimeout(() => {
              vkrSection.style.opacity = '';
              vkrSection.style.transform = '';
              vkrSection.style.transition = '';
            }, 300);
          }
          
          // Затем анимируем карточку ВКР
          if (vkrCard) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                vkrCard.style.opacity = '0';
                vkrCard.style.transform = `translateY(${CARD_ANIMATION.translateYAppear})`;
                vkrCard.style.transition = 'none';
                
                requestAnimationFrame(() => {
                  vkrCard.style.transition = `opacity ${CARD_ANIMATION.duration} ${CARD_ANIMATION.timing}, transform ${CARD_ANIMATION.duration} ${CARD_ANIMATION.timing}`;
                  vkrCard.style.opacity = '1';
                  vkrCard.style.transform = `translateY(${CARD_ANIMATION.translateYFinal})`;
                  
                  setTimeout(() => {
                    vkrCard.style.transform = '';
                    vkrCard.style.opacity = '';
                    vkrCard.style.transition = '';
                  }, CARD_ANIMATION.timeout);
                });
              });
            });
          }
        });
      });
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
    });
    
    // Плавное появление publicationsSection с контентом, затем карточек
    // Используем двойной requestAnimationFrame для синхронизации с браузером
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Сначала показываем publicationsSection с анимацией (если он был скрыт)
        const sectionOpacity = publicationsSection.style.opacity;
        // Показываем секцию с анимацией, если opacity установлена в 0 или не установлена
        if (sectionOpacity === '0' || !sectionOpacity || sectionOpacity === '') {
          publicationsSection.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
          publicationsSection.style.opacity = '1';
          publicationsSection.style.transform = 'translateY(0)';
          
          setTimeout(() => {
            publicationsSection.style.opacity = '';
            publicationsSection.style.transform = '';
            publicationsSection.style.transition = '';
          }, 300);
        }
        
        // Затем анимируем карточки
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const allCards = publicationsSection.querySelectorAll('.research-card');
            allCards.forEach((card) => {
              // Убеждаемся, что начальное состояние установлено
              card.style.opacity = '0';
              card.style.transform = `translateY(${CARD_ANIMATION.translateYAppear})`;
              card.style.transition = 'none';
            });
            
            // Применяем анимацию одновременно для всех карточек
            requestAnimationFrame(() => {
              allCards.forEach((card) => {
                card.style.transition = `opacity ${CARD_ANIMATION.duration} ${CARD_ANIMATION.timing}, transform ${CARD_ANIMATION.duration} ${CARD_ANIMATION.timing}`;
                card.style.opacity = '1';
                card.style.transform = `translateY(${CARD_ANIMATION.translateYFinal})`;
              });
              
              // Убираем inline стили после анимации, чтобы hover эффект работал
              setTimeout(() => {
                allCards.forEach((card) => {
                  card.style.transform = '';
                  card.style.opacity = '';
                  card.style.transition = '';
                });
              }, CARD_ANIMATION.timeout);
            });
          });
        });
      });
    });
  } else if (publicationsSection) {
    // Если публикаций нет, но секция существует, убеждаемся что она видима
    const sectionOpacity = publicationsSection.style.opacity;
    if (sectionOpacity === '0' || !sectionOpacity || sectionOpacity === '') {
      publicationsSection.style.transition = 'opacity 0.3s ease-in-out';
      publicationsSection.style.opacity = '1';
      setTimeout(() => {
        publicationsSection.style.opacity = '';
        publicationsSection.style.transition = '';
      }, 300);
    }
  }
  
  // Если ВКР нет, но секция существует, убеждаемся что она видима (или скрыта, если пустая)
  if (vkrSection && !vkr) {
    // Если секция пустая, можно оставить её скрытой или показать пустой
    // Но если она была скрыта через hideLoadingIndicator, нужно убедиться что она видима
    const sectionOpacity = vkrSection.style.opacity;
    if (sectionOpacity === '0' && vkrSection.children.length === 0) {
      // Если секция пустая и скрыта, можно оставить её скрытой
      vkrSection.style.visibility = 'hidden';
    }
  }
  
  // Инициализируем кнопку меню для прокрутки до навигации
  initMenuButtonScroll();
  
  // Инициализируем кнопку "Наверх"
  initScrollToTop();
  
  // Выделяем активную страницу в навигации
  setActiveNavigationLink();
  
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

/* ============================================
 * DEBUG KEYBOARD HANDLERS - Удалить после тестирования
 * ============================================ */

// Флаг для отслеживания состояния загрузки
let isLoading = false;
let loadTimeout = null;

document.addEventListener('keydown', (e) => {
  // Предотвращаем стандартное поведение только если не в поле ввода
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Показываем индикатор загрузки по клавише R
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    showLoadingIndicator();
  }
  
  // Инициируем загрузку страницы по клавише T (с задержкой 1 секунда)
  if (e.key === 't' || e.key === 'T') {
    e.preventDefault();
    
    // Если загрузка уже идет, отменяем предыдущий таймер и перезапускаем
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
    
    // Показываем loading с анимацией
    showLoadingIndicator();
    
    // Устанавливаем флаг загрузки
    isLoading = true;
    
    // Ждем 1 секунду и запускаем загрузку
    loadTimeout = setTimeout(async () => {
      loadTimeout = null;
      try {
        await initResearchPage();
      } finally {
        isLoading = false;
      }
    }, 1000);
  }
});
