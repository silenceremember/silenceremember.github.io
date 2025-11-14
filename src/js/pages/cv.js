/**
 * Страница резюме - загрузка и отображение данных из JSON
 * Формат: Классическое резюме согласно PLAN.md
 */

import { loadHTML } from '../layout.js';
import { loadData } from '../utils/data-loader.js';
import { initScrollToTop } from '../components/scroll-to-top.js';
import { animateElementAppearance, animateSectionAppearance } from '../utils/animations.js';

// Загрузка компонентов
let timelineTemplate = null;

/**
 * Загружает шаблон временной линии
 */
async function loadTemplates() {
  // Всегда перезагружаем шаблон, чтобы убедиться, что он валиден
  try {
    const timelineHTML = await loadHTML('/components/timeline.html');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = timelineHTML;
    timelineTemplate = tempDiv.querySelector('.timeline-item') || tempDiv.firstElementChild;
    if (!timelineTemplate) {
      console.error('Не удалось найти шаблон временной линии');
      timelineTemplate = null;
    }
  } catch (error) {
    console.error('Ошибка загрузки шаблона временной линии:', error);
    timelineTemplate = null;
  }
}

/**
 * Загружает данные резюме из JSON с кешированием
 */
async function loadCVData() {
  try {
    const data = await loadData('/data/cv.json');
    return data;
  } catch (error) {
    console.error('Ошибка загрузки резюме:', error);
    return null;
  }
}

/**
 * Загружает данные сообщества для контактов с кешированием
 */
async function loadCommunityData() {
  try {
    const data = await loadData('/data/community.json');
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
  photo.decoding = 'async';
  photo.loading = 'eager';
  photo.fetchPriority = 'high';
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
  emailLink.href = 'mailto:slcrmmbr@outlook.com';
  emailLink.textContent = 'slcrmmbr@outlook.com';
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
 * Инициализирует страницу резюме
 */
async function initCVPage() {
  // Загружаем шаблоны
  await loadTemplates();
  
  // Загружаем данные
  const cvData = await loadCVData();
  const communityData = await loadCommunityData();
  
  if (!cvData) {
    const headerSection = document.getElementById('cv-header-section');
    if (headerSection) {
      headerSection.innerHTML = '<p>Не удалось загрузить данные резюме.</p>';
      headerSection.style.display = 'block';
      headerSection.style.visibility = 'visible';
      headerSection.style.opacity = '';
    }
    return;
  }
  
  // ОЧИЩАЕМ все секции перед заполнением
  const allSections = document.querySelectorAll('.cv-section, #cv-download-section');
  allSections.forEach(section => {
    section.innerHTML = '';
    section.style.display = '';
    section.style.visibility = '';
    // Скрываем секции для анимации
    section.style.opacity = '0';
    section.style.transform = 'translateY(10px)';
    section.style.transition = 'none';
  });
  
  // Секция "Заголовок с фото, контактами и "О себе""
  const headerSection = document.getElementById('cv-header-section');
  if (headerSection) {
    // Секция уже скрыта в начале функции (opacity: 0, translateY(10px))
    headerSection.style.display = 'block';
    headerSection.style.visibility = 'visible';
    // Убеждаемся, что секция скрыта для анимации
    headerSection.style.opacity = '0';
    headerSection.style.transform = 'translateY(10px)';
    headerSection.style.transition = 'none';
    
    const headerContent = createHeaderSection(communityData, cvData.about, cvData.skills);
    if (headerContent) {
      // Секция уже очищена в начале функции, просто добавляем контент
      headerSection.appendChild(headerContent);
      
      // Плавное появление секции с контентом
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          headerSection.setAttribute('data-animated', 'true');
          animateSectionAppearance(headerSection);
        });
      });
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
    // Сначала показываем секцию, чтобы CSS :empty не скрывал её
    workSection.style.display = 'block';
    workSection.style.visibility = 'visible';
    // Секция уже очищена в начале функции
    const workTitle = document.createElement('h2');
    workTitle.className = 'cv-section-title';
    workTitle.textContent = 'Опыт работы';
    workSection.appendChild(workTitle);
    
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container timeline-work';
    
    let hasItems = false;
    const timelineItems = [];
    cvData.workExperience.forEach((work) => {
      const timelineItem = createWorkExperienceItem(work);
      if (timelineItem) {
        hasItems = true;
        timelineItems.push(timelineItem);
        timelineContainer.appendChild(timelineItem);
      }
    });
    
    if (hasItems) {
      workSection.appendChild(timelineContainer);
      // Убеждаемся, что секция видима после добавления контента
      workSection.style.visibility = 'visible';
      
      // Плавное появление секции с контентом, затем элементов timeline
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Анимируем секцию
          workSection.setAttribute('data-animated', 'true');
          animateSectionAppearance(workSection);
          
          // Затем анимируем элементы timeline
          if (timelineItems.length > 0) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                animateElementsAppearance(timelineItems);
              });
            });
          }
        });
      });
    } else {
      workSection.style.display = 'none';
    }
  }
  
  // Секция "Образование"
  const educationSection = document.getElementById('cv-education-section');
  if (educationSection && cvData.education && cvData.education.length > 0) {
    // Сначала показываем секцию, чтобы CSS :empty не скрывал её
    educationSection.style.display = 'block';
    educationSection.style.visibility = 'visible';
    // Секция уже очищена в начале функции
    const educationTitle = document.createElement('h2');
    educationTitle.className = 'cv-section-title';
    educationTitle.textContent = 'Образование';
    educationSection.appendChild(educationTitle);
    
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container timeline-education';
    
    let hasItems = false;
    const timelineItems = [];
    cvData.education.forEach((edu) => {
      const timelineItem = createEducationItem(edu);
      if (timelineItem) {
        hasItems = true;
        timelineItems.push(timelineItem);
        timelineContainer.appendChild(timelineItem);
      }
    });
    
    if (hasItems) {
      educationSection.appendChild(timelineContainer);
      // Убеждаемся, что секция видима после добавления контента
      educationSection.style.visibility = 'visible';
      
      // Плавное появление секции с контентом, затем элементов timeline
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Анимируем секцию
          educationSection.setAttribute('data-animated', 'true');
          animateSectionAppearance(educationSection);
          
          // Затем анимируем элементы timeline
          if (timelineItems.length > 0) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                animateElementsAppearance(timelineItems);
              });
            });
          }
        });
      });
    } else {
      educationSection.style.display = 'none';
    }
  }
  
  // Секция "Навыки" - скрываем, так как она теперь в заголовке
  const skillsSection = document.getElementById('cv-skills-section');
  if (skillsSection) {
    skillsSection.style.display = 'none';
  }
  
  // Секция "Сертификаты"
  const certificatesSection = document.getElementById('cv-certificates-section');
  if (certificatesSection && cvData.certificates && cvData.certificates.length > 0) {
    // Сначала показываем секцию, чтобы CSS :empty не скрывал её
    certificatesSection.style.display = 'block';
    certificatesSection.style.visibility = 'visible';
    // Секция уже очищена в начале функции
    const certificatesTitle = document.createElement('h2');
    certificatesTitle.className = 'cv-section-title';
    certificatesTitle.textContent = 'Сертификаты';
    certificatesSection.appendChild(certificatesTitle);
    
    const certificatesList = createCertificatesSection(cvData.certificates);
    if (certificatesList) {
      certificatesSection.appendChild(certificatesList);
      // Убеждаемся, что секция видима после добавления контента
      certificatesSection.style.visibility = 'visible';
      
      // Плавное появление секции с контентом
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          certificatesSection.setAttribute('data-animated', 'true');
          animateSectionAppearance(certificatesSection);
        });
      });
    } else {
      certificatesSection.style.display = 'none';
    }
  }
  
  // Секция "Курсы"
  const coursesSection = document.getElementById('cv-courses-section');
  if (coursesSection && cvData.courses && cvData.courses.length > 0) {
    // Сначала показываем секцию, чтобы CSS :empty не скрывал её
    coursesSection.style.display = 'block';
    coursesSection.style.visibility = 'visible';
    // Секция уже очищена в начале функции
    const coursesTitle = document.createElement('h2');
    coursesTitle.className = 'cv-section-title';
    coursesTitle.textContent = 'Курсы';
    coursesSection.appendChild(coursesTitle);
    
    const coursesList = createCoursesSection(cvData.courses);
    if (coursesList) {
      coursesSection.appendChild(coursesList);
      // Убеждаемся, что секция видима после добавления контента
      coursesSection.style.visibility = 'visible';
      
      // Плавное появление секции с контентом
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          coursesSection.setAttribute('data-animated', 'true');
          animateSectionAppearance(coursesSection);
        });
      });
    } else {
      coursesSection.style.display = 'none';
    }
  }
  
  // Секция "Языки"
  const languagesSection = document.getElementById('cv-languages-section');
  if (languagesSection && cvData.languages && cvData.languages.length > 0) {
    // Сначала показываем секцию, чтобы CSS :empty не скрывал её
    languagesSection.style.display = 'block';
    languagesSection.style.visibility = 'visible';
    // Секция уже очищена в начале функции
    const languagesTitle = document.createElement('h2');
    languagesTitle.className = 'cv-section-title';
    languagesTitle.textContent = 'Языки';
    languagesSection.appendChild(languagesTitle);
    
    const languagesList = createLanguagesSection(cvData.languages);
    if (languagesList) {
      languagesSection.appendChild(languagesList);
      // Убеждаемся, что секция видима после добавления контента
      languagesSection.style.visibility = 'visible';
      
      // Плавное появление секции с контентом
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          languagesSection.setAttribute('data-animated', 'true');
          animateSectionAppearance(languagesSection);
        });
      });
    } else {
      languagesSection.style.display = 'none';
    }
  }
  
  // Кнопка скачивания PDF
  const downloadSection = document.getElementById('cv-download-section');
  if (downloadSection) {
    // Сначала показываем секцию, чтобы CSS :empty не скрывал её
    downloadSection.style.display = 'block';
    downloadSection.style.visibility = 'visible';
    // Секция уже очищена в начале функции
    const downloadButton = createDownloadButton();
    if (downloadButton) {
      downloadSection.appendChild(downloadButton);
      // Убеждаемся, что секция видима после добавления контента
      downloadSection.style.visibility = 'visible';
      
      // Плавное появление секции с контентом
      // Используем двойной requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          downloadSection.setAttribute('data-animated', 'true');
          animateSectionAppearance(downloadSection);
        });
      });
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
  
  
  // Убеждаемся, что прокрутка остается в начале после загрузки контента
  // Это предотвращает "прыжки" при обновлении страницы
  // Используем несколько попыток с задержками, чтобы переопределить возможное восстановление браузером
  function ensureScrollAtTop() {
    const isTabletMode = window.innerWidth < 1024;
    const scrollElement = isTabletMode 
      ? document.querySelector('.page-wrapper')
      : window;
    
    if (scrollElement === window) {
      window.scrollTo(0, 0);
    } else if (scrollElement) {
      scrollElement.scrollTop = 0;
    }
  }
  
  // Сбрасываем прокрутку несколько раз с задержками
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ensureScrollAtTop();
      setTimeout(ensureScrollAtTop, 0);
      setTimeout(ensureScrollAtTop, 50);
      setTimeout(ensureScrollAtTop, 100);
      setTimeout(ensureScrollAtTop, 200);
    });
  });
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCVPage);
} else {
  initCVPage();
}

