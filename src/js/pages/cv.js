/**
 * Страница резюме - загрузка и отображение данных из JSON
 * Формат: Классическое резюме согласно PLAN.md
 */

import { loadHTML } from '../layout.js';

// Константы для унифицированных анимаций элементов
const CARD_ANIMATION = {
  duration: '0.3s',
  timing: 'ease-in-out',
  translateYAppear: '10px',
  translateYDisappear: '-10px',
  translateYFinal: '0',
  timeout: 300
};

// Загрузка компонентов
let timelineTemplate = null;

/**
 * Загружает шаблон временной линии
 */
async function loadTemplates() {
  if (!timelineTemplate) {
    try {
      const timelineHTML = await loadHTML('/components/timeline.html');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = timelineHTML;
      timelineTemplate = tempDiv.querySelector('.timeline-item') || tempDiv.firstElementChild;
      if (!timelineTemplate) {
        console.error('Не удалось найти шаблон временной линии');
      }
    } catch (error) {
      console.error('Ошибка загрузки шаблона временной линии:', error);
    }
  }
}

/**
 * Загружает данные резюме из JSON
 */
async function loadCVData() {
  try {
    const response = await fetch('/data/cv.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка загрузки резюме:', error);
    return null;
  }
}

/**
 * Загружает данные сообщества для контактов
 */
async function loadCommunityData() {
  try {
    const response = await fetch('/data/community.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка загрузки данных сообщества:', error);
    return null;
  }
}

/**
 * Форматирует период для отображения
 */
function formatPeriod(period) {
  if (!period) return '';
  
  const start = period.start || '';
  const end = period.end || 'настоящее время';
  const duration = period.duration ? ` (${period.duration})` : '';
  
  return `${start} — ${end}${duration}`;
}

/**
 * Создает секцию заголовка с фото, контактами и "О себе"
 */
function createHeaderSection(communityData, aboutText, skills) {
  const section = document.createElement('div');
  section.className = 'cv-header';
  
  const headerContent = document.createElement('div');
  headerContent.className = 'cv-header-content';
  
  // Фото
  const photoContainer = document.createElement('div');
  photoContainer.className = 'cv-header-photo';
  
  const photo = document.createElement('img');
  photo.src = 'assets/images/portrait.jpg';
  photo.alt = 'Maxim Elchaninov';
  photo.className = 'cv-header-photo-image';
  photo.onerror = function() {
    this.src = 'assets/images/portrait-placeholder.svg';
  };
  photoContainer.appendChild(photo);
  headerContent.appendChild(photoContainer);
  
  // Верхняя часть: заголовок и подзаголовок (слева сверху)
  const topSection = document.createElement('div');
  topSection.className = 'cv-header-top';
  
  const nameTitle = document.createElement('h2');
  nameTitle.className = 'cv-header-name';
  nameTitle.textContent = 'MAXIM ELCHANINOV';
  
  const roleSubtitle = document.createElement('h3');
  roleSubtitle.className = 'cv-header-role';
  roleSubtitle.textContent = 'SYSTEM GAME DESIGNER';
  
  // Контакты под ролью
  const contactsWrapper = document.createElement('div');
  contactsWrapper.className = 'cv-header-contacts-wrapper';
  
  // Email ссылка
  const emailLink = document.createElement('a');
  emailLink.className = 'cv-header-contact-link';
  emailLink.href = 'mailto:slcrmmbr@gmail.com';
  emailLink.textContent = 'slcrmmbr@gmail.com';
  contactsWrapper.appendChild(emailLink);
  
  // Telegram ссылка
  const telegramLink = document.createElement('a');
  telegramLink.className = 'cv-header-contact-link';
  if (communityData && communityData.socialLinks && communityData.socialLinks.telegram && communityData.socialLinks.telegram !== 'https://t.me/...') {
    telegramLink.href = communityData.socialLinks.telegram;
  } else {
    telegramLink.href = 'https://t.me/silenceremember';
  }
  telegramLink.target = '_blank';
  telegramLink.rel = 'noopener noreferrer';
  telegramLink.textContent = 't.me/silenceremember';
  contactsWrapper.appendChild(telegramLink);
  
  topSection.appendChild(nameTitle);
  topSection.appendChild(roleSubtitle);
  topSection.appendChild(contactsWrapper);
  headerContent.appendChild(topSection);
  
  // "О себе" внутри cv-header-content, рядом с фото и контактами
  if (aboutText) {
    const aboutContainer = document.createElement('div');
    aboutContainer.className = 'cv-header-about';
    
    // Разделяем текст по двойному переносу строки
    const paragraphs = aboutText.trim().split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach((paragraph, index) => {
      const aboutTextEl = document.createElement('p');
      aboutTextEl.className = 'cv-about-text';
      aboutTextEl.textContent = paragraph.trim();
      aboutContainer.appendChild(aboutTextEl);
      
      // Добавляем декоративную линию между абзацами (но не после последнего)
      if (index < paragraphs.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'cv-about-divider';
        aboutContainer.appendChild(divider);
      }
    });
    
    headerContent.appendChild(aboutContainer);
  }
  
  section.appendChild(headerContent);
  
  // Раздел навыков сразу после cv-header-content
  if (skills) {
    const skillsGrid = createSkillsSection(skills);
    if (skillsGrid) {
      section.appendChild(skillsGrid);
    }
  }
  
  return section;
}

/**
 * Создает элемент временной линии для опыта работы
 */
function createWorkExperienceItem(work) {
  if (!timelineTemplate) return null;
  
  const item = timelineTemplate.cloneNode(true);
  
  const period = item.querySelector('.timeline-period');
  const title = item.querySelector('.timeline-title');
  const subtitle = item.querySelector('.timeline-subtitle');
  const description = item.querySelector('.timeline-description');
  const list = item.querySelector('.timeline-list');
  const tags = item.querySelector('.timeline-tags');
  
  // Период
  if (period && work.period) {
    period.textContent = formatPeriod(work.period);
  }
  
  // Заголовок - должность
  if (title) {
    title.textContent = work.position || '';
  }
  
  // Подзаголовок - компания
  if (subtitle) {
    subtitle.textContent = work.company || '';
  }
  
  // Описание - акцент на оптимизации процессов
  if (description) {
    description.textContent = 'Оптимизация рабочих процессов и решение технических проблем';
    description.style.display = 'block';
  }
  
  // Скрываем список и теги для упрощенного формата
  if (list) list.style.display = 'none';
  if (tags) tags.style.display = 'none';
  
  item.setAttribute('data-cv-id', work.id || '');
  item.setAttribute('data-type', 'work');
  
  return item;
}

/**
 * Создает элемент образования
 */
function createEducationItem(edu) {
  if (!timelineTemplate) return null;
  
  const item = timelineTemplate.cloneNode(true);
  
  const period = item.querySelector('.timeline-period');
  const title = item.querySelector('.timeline-title');
  const subtitle = item.querySelector('.timeline-subtitle');
  const description = item.querySelector('.timeline-description');
  const list = item.querySelector('.timeline-list');
  const tags = item.querySelector('.timeline-tags');
  
  // Период
  if (period && edu.period) {
    period.textContent = formatPeriod(edu.period);
  }
  
  // Заголовок - направление
  if (title) {
    title.textContent = edu.direction || '';
  }
  
  // Подзаголовок - учреждение и степень
  if (subtitle) {
    const institution = edu.institutionShort || edu.institution || '';
    const degree = edu.degree ? `, ${edu.degree}` : '';
    subtitle.textContent = `${institution}${degree}`;
    if (edu.location) {
      subtitle.textContent += ` (${edu.location})`;
    }
  }
  
  // Описание - статус
  if (description) {
    const statusText = edu.status === 'in-progress' ? 'В процессе' : 'Завершено';
    description.textContent = statusText;
    description.style.display = 'block';
  }
  
  // Скрываем список и теги
  if (list) list.style.display = 'none';
  if (tags) tags.style.display = 'none';
  
  item.setAttribute('data-cv-id', edu.id || '');
  item.setAttribute('data-type', 'education');
  
  return item;
}

/**
 * Создает секцию навыков согласно PLAN.md
 */
function createSkillsSection(skills) {
  if (!skills) return null;
  
  const section = document.createElement('div');
  section.className = 'cv-skills-grid';
  
  // Категории навыков
  const categories = [
    {
      key: 'design-prototyping',
      title: 'ДИЗАЙН И ПРОТОТИПИРОВАНИЕ',
      description: 'Основной инструментарий для создания и проверки игрового опыта',
      skills: skills['design-prototyping'] || []
    },
    {
      key: 'technical-scripting',
      title: 'ТЕХНИЧЕСКИЕ НАВЫКИ И СКРИПТИНГ',
      description: 'Языки и технологии для реализации систем и проведения исследований',
      skills: skills['technical-scripting'] || []
    },
    {
      key: 'design-documentation',
      title: 'ДИЗАЙН-ДОКУМЕНТАЦИЯ',
      description: 'Инструменты для описания и визуализации геймдизайнерских решений',
      skills: skills['design-documentation'] || []
    },
    {
      key: 'production-collaboration',
      title: 'ПРОИЗВОДСТВО И СОВМЕСТНАЯ РАБОТА',
      description: 'Стандарты индустрии для управления версиями и задачами',
      skills: skills['production-collaboration'] || []
    },
    {
      key: 'asset-creation',
      title: 'СОЗДАНИЕ АССЕТОВ',
      description: 'Вспомогательные навыки для визуализации прототипов',
      skills: skills['asset-creation'] || []
    }
  ];
  
  categories.forEach(category => {
    if (category.skills.length === 0) return;
    
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'cv-skill-category';
    
    const categoryTitle = document.createElement('h3');
    categoryTitle.className = 'cv-skill-category-title';
    categoryTitle.textContent = category.title;
    categoryDiv.appendChild(categoryTitle);
    
    if (category.description) {
      const categoryDescription = document.createElement('p');
      categoryDescription.className = 'cv-skill-category-description';
      categoryDescription.textContent = category.description;
      categoryDiv.appendChild(categoryDescription);
    }
    
    const skillsList = document.createElement('div');
    skillsList.className = 'cv-skill-list';
    
    category.skills.forEach(skill => {
      const skillTag = document.createElement('span');
      skillTag.className = 'cv-skill-tag';
      skillTag.textContent = skill;
      skillsList.appendChild(skillTag);
    });
    
    categoryDiv.appendChild(skillsList);
    section.appendChild(categoryDiv);
  });
  
  return section;
}

/**
 * Создает секцию сертификатов
 */
function createCertificatesSection(certificates) {
  if (!certificates || certificates.length === 0) return null;
  
  const section = document.createElement('div');
  section.className = 'cv-certificates-list';
  
  certificates.forEach(cert => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cv-certificate-item';
    
    const title = document.createElement('h4');
    title.className = 'cv-certificate-title';
    title.textContent = cert.title || '';
    itemDiv.appendChild(title);
    
    const meta = document.createElement('div');
    meta.className = 'cv-certificate-meta';
    
    const organization = document.createElement('span');
    organization.className = 'cv-certificate-organization';
    organization.textContent = cert.organization || '';
    meta.appendChild(organization);
    
    if (cert.year) {
      const year = document.createElement('span');
      year.className = 'cv-certificate-year';
      year.textContent = cert.year.toString();
      meta.appendChild(year);
    }
    
    itemDiv.appendChild(meta);
    
    // Кнопка "Подробнее"
    const detailsButton = document.createElement('button');
    detailsButton.className = 'cv-certificate-button';
    detailsButton.textContent = 'Подробнее';
    
    if (cert.url) {
      detailsButton.addEventListener('click', () => {
        window.open(cert.url, '_blank', 'noopener,noreferrer');
      });
    } else {
      // Если URL нет, можно показать alert или сделать кнопку неактивной
      detailsButton.disabled = true;
      detailsButton.title = 'Информация о сертификате недоступна';
    }
    
    itemDiv.appendChild(detailsButton);
    section.appendChild(itemDiv);
  });
  
  return section;
}

/**
 * Создает секцию курсов
 */
function createCoursesSection(courses) {
  if (!courses || courses.length === 0) return null;
  
  const section = document.createElement('div');
  section.className = 'cv-courses-list';
  
  courses.forEach(course => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cv-course-item';
    
    const title = document.createElement('h4');
    title.className = 'cv-course-title';
    title.textContent = course.title || '';
    itemDiv.appendChild(title);
    
    const meta = document.createElement('div');
    meta.className = 'cv-course-meta';
    
    const organization = document.createElement('span');
    organization.className = 'cv-course-organization';
    organization.textContent = course.organization || '';
    meta.appendChild(organization);
    
    if (course.year) {
      const year = document.createElement('span');
      year.className = 'cv-course-year';
      year.textContent = course.year.toString();
      meta.appendChild(year);
    }
    
    itemDiv.appendChild(meta);
    section.appendChild(itemDiv);
  });
  
  return section;
}

/**
 * Создает секцию языков
 */
function createLanguagesSection(languages) {
  if (!languages || languages.length === 0) return null;
  
  const section = document.createElement('div');
  section.className = 'cv-languages-list';
  
  languages.forEach(lang => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cv-language-item';
    
    const language = document.createElement('h4');
    language.className = 'cv-language-name';
    language.textContent = lang.language || '';
    itemDiv.appendChild(language);
    
    if (lang.level) {
      const level = document.createElement('span');
      level.className = 'cv-language-level';
      level.textContent = lang.level;
      itemDiv.appendChild(level);
    }
    
    section.appendChild(itemDiv);
  });
  
  return section;
}

/**
 * Создает кнопку скачивания PDF
 */
function createDownloadButton() {
  const section = document.createElement('div');
  section.className = 'cv-download-wrapper';
  
  const button = document.createElement('a');
  button.className = 'cv-download-button cta-button';
  button.href = '#';
  button.textContent = 'Скачать CV в PDF';
  button.addEventListener('click', (e) => {
    e.preventDefault();
    // TODO: Реализовать генерацию/скачивание PDF
    console.log('Скачивание PDF резюме');
    alert('Функция скачивания PDF будет реализована позже');
  });
  
  section.appendChild(button);
  return section;
}

/**
 * Скрывает индикатор загрузки
 */
function hideLoadingIndicator() {
  const loadingElement = document.getElementById('cv-loading');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
    setTimeout(() => {
      if (loadingElement.parentNode) {
        loadingElement.remove();
      }
    }, 300);
  }
}

/* ============================================
 * DEBUG FUNCTIONS - Удалить после тестирования
 * ============================================ */

/**
 * Показывает индикатор загрузки (для дебага - клавиша R)
 */
function showLoadingIndicator() {
  const container = document.querySelector('.cv-page');
  if (!container) return;
  
  // Проверяем, есть ли уже индикатор загрузки
  let loadingElement = document.getElementById('cv-loading');
  
  if (!loadingElement) {
    // Создаем новый индикатор загрузки
    loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.id = 'cv-loading';
    loadingElement.innerHTML = `
      <div class="loading-squares">
        <div class="loading-square"></div>
        <div class="loading-square"></div>
        <div class="loading-square"></div>
      </div>
    `;
    // Очищаем контейнер и добавляем индикатор в начало
    const sections = container.querySelectorAll('.cv-section');
    sections.forEach(section => section.remove());
    container.insertBefore(loadingElement, container.firstChild);
  } else {
    // Если индикатор уже есть, очищаем контейнер и показываем его
    const sections = container.querySelectorAll('.cv-section');
    sections.forEach(section => section.remove());
    container.insertBefore(loadingElement, container.firstChild);
  }
  
  // Убираем класс hidden и показываем с анимацией
  loadingElement.classList.remove('hidden');
  loadingElement.style.display = '';
  loadingElement.style.opacity = '0';
  loadingElement.style.transform = 'translateY(10px)';
  
  requestAnimationFrame(() => {
    loadingElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    loadingElement.style.opacity = '1';
    loadingElement.style.transform = 'translateY(0)';
  });
  
  console.log('🔍 [DEBUG] Индикатор загрузки показан (клавиша R)');
}

/**
 * Выделяет активную страницу в навигации
 */
function setActiveNavigationLink() {
  const navLinks = document.querySelectorAll('.cv-navigation .cta-button');
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
  const navigationSection = document.querySelector('.cv-navigation');
  const pageWrapper = document.querySelector('.page-wrapper');
  
  if (!menuButton || !navigationSection || !pageWrapper) {
    return;
  }
  
  menuButton.addEventListener('click', () => {
    const isTabletMode = window.innerWidth < 1024;
    
    if (isTabletMode) {
      const wrapperRect = pageWrapper.getBoundingClientRect();
      const navRect = navigationSection.getBoundingClientRect();
      const scrollTop = pageWrapper.scrollTop;
      const targetPosition = scrollTop + navRect.top - wrapperRect.top;
      
      pageWrapper.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
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
    return window.innerWidth < 1024;
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
 * Анимирует появление элемента
 */
function animateElementAppearance(element) {
  element.style.opacity = '0';
  element.style.transform = 'translateY(10px)';
  element.style.transition = 'none';
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      
      setTimeout(() => {
        element.style.transform = '';
        element.style.opacity = '';
        element.style.transition = '';
      }, 300);
    });
  });
}

/**
 * Инициализирует страницу резюме
 */
async function initCVPage() {
  // Загружаем шаблоны
  await loadTemplates();
  
  // Загружаем данные
  const cvData = await loadCVData();
  const communityData = await loadCommunityData();
  
  // Скрываем индикатор загрузки
  hideLoadingIndicator();
  
  if (!cvData) {
    const headerSection = document.getElementById('cv-header-section');
    if (headerSection) {
      headerSection.innerHTML = '<p>Не удалось загрузить данные резюме.</p>';
    }
    return;
  }
  
  // Секция "Заголовок с фото, контактами и "О себе""
  const headerSection = document.getElementById('cv-header-section');
  if (headerSection) {
    const headerContent = createHeaderSection(communityData, cvData.about, cvData.skills);
    if (headerContent) {
      headerSection.appendChild(headerContent);
      animateElementAppearance(headerSection);
    }
  }
  
  // Секция "О себе" - скрываем, так как она теперь в заголовке
  const aboutSection = document.getElementById('cv-about-section');
  if (aboutSection) {
    aboutSection.style.display = 'none';
  }
  
  // Секция "Опыт работы"
  const workSection = document.getElementById('cv-work-section');
  if (workSection && cvData.workExperience && cvData.workExperience.length > 0) {
    const workTitle = document.createElement('h2');
    workTitle.className = 'cv-section-title';
    workTitle.textContent = 'Опыт работы';
    workSection.appendChild(workTitle);
    
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container timeline-work';
    
    cvData.workExperience.forEach((work, index) => {
      const timelineItem = createWorkExperienceItem(work);
      if (timelineItem) {
        setTimeout(() => {
          animateElementAppearance(timelineItem);
        }, index * 100);
        timelineContainer.appendChild(timelineItem);
      }
    });
    
    workSection.appendChild(timelineContainer);
    animateElementAppearance(workSection);
  }
  
  // Секция "Образование"
  const educationSection = document.getElementById('cv-education-section');
  if (educationSection && cvData.education && cvData.education.length > 0) {
    const educationTitle = document.createElement('h2');
    educationTitle.className = 'cv-section-title';
    educationTitle.textContent = 'Образование';
    educationSection.appendChild(educationTitle);
    
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container timeline-education';
    
    cvData.education.forEach((edu, index) => {
      const timelineItem = createEducationItem(edu);
      if (timelineItem) {
        setTimeout(() => {
          animateElementAppearance(timelineItem);
        }, index * 100);
        timelineContainer.appendChild(timelineItem);
      }
    });
    
    educationSection.appendChild(timelineContainer);
    animateElementAppearance(educationSection);
  }
  
  // Секция "Навыки" - скрываем, так как она теперь в заголовке
  const skillsSection = document.getElementById('cv-skills-section');
  if (skillsSection) {
    skillsSection.style.display = 'none';
  }
  
  // Секция "Сертификаты"
  const certificatesSection = document.getElementById('cv-certificates-section');
  if (certificatesSection && cvData.certificates && cvData.certificates.length > 0) {
    const certificatesTitle = document.createElement('h2');
    certificatesTitle.className = 'cv-section-title';
    certificatesTitle.textContent = 'Сертификаты';
    certificatesSection.appendChild(certificatesTitle);
    
    const certificatesList = createCertificatesSection(cvData.certificates);
    if (certificatesList) {
      certificatesSection.appendChild(certificatesList);
      animateElementAppearance(certificatesSection);
    }
  }
  
  // Секция "Курсы"
  const coursesSection = document.getElementById('cv-courses-section');
  if (coursesSection && cvData.courses && cvData.courses.length > 0) {
    const coursesTitle = document.createElement('h2');
    coursesTitle.className = 'cv-section-title';
    coursesTitle.textContent = 'Курсы';
    coursesSection.appendChild(coursesTitle);
    
    const coursesList = createCoursesSection(cvData.courses);
    if (coursesList) {
      coursesSection.appendChild(coursesList);
      animateElementAppearance(coursesSection);
    }
  }
  
  // Секция "Языки"
  const languagesSection = document.getElementById('cv-languages-section');
  if (languagesSection && cvData.languages && cvData.languages.length > 0) {
    const languagesTitle = document.createElement('h2');
    languagesTitle.className = 'cv-section-title';
    languagesTitle.textContent = 'Языки';
    languagesSection.appendChild(languagesTitle);
    
    const languagesList = createLanguagesSection(cvData.languages);
    if (languagesList) {
      languagesSection.appendChild(languagesList);
      animateElementAppearance(languagesSection);
    }
  }
  
  // Кнопка скачивания PDF
  const downloadSection = document.getElementById('cv-download-section');
  if (downloadSection) {
    const downloadButton = createDownloadButton();
    downloadSection.appendChild(downloadButton);
    animateElementAppearance(downloadSection);
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
  document.addEventListener('DOMContentLoaded', initCVPage);
} else {
  initCVPage();
}

/* ============================================
 * DEBUG KEYBOARD HANDLERS - Удалить после тестирования
 * ============================================ */
document.addEventListener('keydown', (e) => {
  // Показываем индикатор загрузки по клавише R
  if (e.key === 'r' || e.key === 'R') {
    // Предотвращаем стандартное поведение только если не в поле ввода
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      showLoadingIndicator();
    }
  }
});
