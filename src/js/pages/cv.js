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
function createHeaderSection(communityData, aboutText) {
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
    
    // Весь текст одним блоком
    const aboutTextEl = document.createElement('p');
    aboutTextEl.className = 'cv-about-text';
    aboutTextEl.textContent = aboutText.trim();
    aboutContainer.appendChild(aboutTextEl);
    
    headerContent.appendChild(aboutContainer);
  }
  
  section.appendChild(headerContent);
  
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
  
  // Категории согласно PLAN.md
  const categories = [
    {
      key: 'gamedev',
      title: 'Геймдев и прототипирование',
      skills: skills.gamedev || []
    },
    {
      key: '2d-graphics',
      title: '2D графика',
      skills: skills['2d-graphics'] || []
    },
    {
      key: '3d-graphics',
      title: '3D графика',
      skills: skills['3d-graphics'] || []
    },
    {
      key: 'development',
      title: 'Разработка',
      skills: skills.development || []
    },
    {
      key: 'documentation',
      title: 'Документация',
      skills: skills.documentation || []
    },
    {
      key: 'project-management',
      title: 'Управление проектами',
      skills: skills['project-management'] || []
    },
    {
      key: 'additional',
      title: 'Дополнительно',
      skills: skills.additional || []
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
    const headerContent = createHeaderSection(communityData, cvData.about);
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
  
  // Секция "Навыки"
  const skillsSection = document.getElementById('cv-skills-section');
  if (skillsSection && cvData.skills) {
    const skillsTitle = document.createElement('h2');
    skillsTitle.className = 'cv-section-title';
    skillsTitle.textContent = 'Навыки';
    skillsSection.appendChild(skillsTitle);
    
    const skillsGrid = createSkillsSection(cvData.skills);
    if (skillsGrid) {
      skillsSection.appendChild(skillsGrid);
      animateElementAppearance(skillsSection);
    }
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
