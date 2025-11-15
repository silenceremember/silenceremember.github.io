/**
 * Страница резюме - загрузка и отображение данных из JSON
 * Формат: Классическое резюме согласно PLAN.md
 */

import { loadHTML } from '../layout.js';
import { loadData } from '../utils/data-loader.js';
import { initScrollToTop } from '../components/scroll-to-top.js';
import { animateElementAppearance, animateSectionAppearance, animateElementsAppearance } from '../utils/animations.js';

// Загрузка компонентов
let timelineTemplate = null;

/**
 * Ожидает загрузки всех шрифтов
 * @returns {Promise<void>}
 */
function waitForFontsLoaded() {
  return new Promise((resolve) => {
    // Проверяем поддержку Font Loading API
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        // Небольшая задержка для гарантии применения шрифтов
        setTimeout(resolve, 50);
      }).catch(() => {
        // В случае ошибки просто продолжаем
        resolve();
      });
    } else {
      // Если API не поддерживается, просто продолжаем
      // Используем небольшую задержку для гарантии загрузки шрифтов
      setTimeout(resolve, 200);
    }
  });
}

/**
 * Ожидает загрузки всех изображений на странице резюме
 * @returns {Promise<void>}
 */
function waitForImagesLoaded() {
  return new Promise((resolve) => {
    // Находим все изображения на странице резюме
    const images = document.querySelectorAll('.cv-page img');
    
    if (images.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;
    let resolved = false;

    // Функция для проверки завершения загрузки
    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= totalImages && !resolved) {
        resolved = true;
        // Небольшая дополнительная задержка для гарантии применения стилей
        setTimeout(resolve, 100);
      }
    };

    // Проверяем каждое изображение
    images.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        // Изображение уже загружено
        checkComplete();
      } else {
        // Ждем загрузки изображения
        img.addEventListener('load', checkComplete, { once: true });
        img.addEventListener('error', checkComplete, { once: true }); // Ошибка тоже считается завершением
      }
    });

    // Таймаут на случай, если изображения не загрузятся
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 3000); // Максимум 3 секунды ожидания
  });
}

/**
 * Ожидает полной готовности страницы, включая загрузку всех изображений и шрифтов
 * @returns {Promise<void>}
 */
function waitForPageReady() {
  return new Promise((resolve) => {
    // Если страница уже полностью загружена
    if (document.readyState === 'complete') {
      // Дополнительно проверяем загрузку всех критичных ресурсов
      Promise.all([
        waitForImagesLoaded(),
        waitForFontsLoaded()
      ]).then(() => resolve());
    } else {
      // Ждем события load
      window.addEventListener('load', () => {
        // После load проверяем загрузку всех критичных ресурсов
        Promise.all([
          waitForImagesLoaded(),
          waitForFontsLoaded()
        ]).then(() => resolve());
      }, { once: true });
    }
  });
}

/**
 * Скрывает все элементы секций резюме сразу с !important для предотвращения FOUC
 */
function hideAllCVElementsImmediately() {
  const allSections = document.querySelectorAll('.cv-section, #cv-download-section');
  allSections.forEach(section => {
    if (section) {
      // Скрываем саму секцию
      section.style.setProperty('opacity', '0', 'important');
      section.style.setProperty('transform', 'translateY(10px)', 'important');
      section.style.setProperty('transition', 'none', 'important');
      
      // Скрываем все элементы внутри секции
      const elementsToHide = section.querySelectorAll(
        '.cv-header-name, .cv-header-role, .cv-header-contacts-wrapper, .cv-header-about, .cv-about-text, .cv-header-photo-image, ' +
        '.cv-section-title, .cv-skills-grid, .cv-skill-category, ' +
        '.timeline-container, .cv-certificate-item, .cv-course-item, .cv-language-item, ' +
        '.cv-download-button'
      );
      
      elementsToHide.forEach(element => {
        if (element) {
          element.style.setProperty('opacity', '0', 'important');
          element.style.setProperty('transform', 'translateY(10px)', 'important');
          element.style.setProperty('transition', 'none', 'important');
        }
      });
      
      // Для timeline-container также скрываем все элементы внутри
      const timelineContainers = section.querySelectorAll('.timeline-container');
      timelineContainers.forEach(container => {
        if (container) {
          // Скрываем все элементы внутри контейнера
          const itemsInside = container.querySelectorAll('*');
          itemsInside.forEach(item => {
            if (item) {
              item.style.setProperty('opacity', '0', 'important');
              item.style.setProperty('transform', 'translateY(10px)', 'important');
              item.style.setProperty('transition', 'none', 'important');
            }
          });
        }
      });
    }
  });
}

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
 * Анимирует элементы секции резюме
 * Timeline контейнеры анимируются как единый блок
 */
function animateCVSection(section, options = {}) {
  if (!section) return;
  
  const delay = options.delay || 0;
  
  setTimeout(() => {
    // Собираем все элементы для синхронной анимации
    const elementsToAnimate = [];
    
    // Заголовок секции
    const sectionTitle = section.querySelector('.cv-section-title');
    if (sectionTitle) {
      elementsToAnimate.push(sectionTitle);
    }
    
    // Timeline контейнеры анимируются как единый блок
    // При анимации контейнера элементы внутри тоже станут видимыми
    const timelineContainers = section.querySelectorAll('.timeline-container');
    timelineContainers.forEach(container => {
      if (container) {
        elementsToAnimate.push(container);
      }
    });
    
    // Элементы сертификатов, курсов, языков
    const certificateItems = section.querySelectorAll('.cv-certificate-item');
    certificateItems.forEach(item => {
      if (item) elementsToAnimate.push(item);
    });
    
    const courseItems = section.querySelectorAll('.cv-course-item');
    courseItems.forEach(item => {
      if (item) elementsToAnimate.push(item);
    });
    
    const languageItems = section.querySelectorAll('.cv-language-item');
    languageItems.forEach(item => {
      if (item) elementsToAnimate.push(item);
    });
    
    // Кнопка скачивания
    const downloadButton = section.querySelector('.cv-download-button');
    if (downloadButton) {
      elementsToAnimate.push(downloadButton);
    }
    
    // Анимируем саму секцию
    animateSectionAppearance(section);
    
    // Сначала убираем inline стили с элементов внутри timeline-контейнеров
    // чтобы они стали видимыми вместе с контейнером при анимации
    timelineContainers.forEach(container => {
      if (container) {
        const itemsInside = container.querySelectorAll('*');
        itemsInside.forEach(item => {
          if (item) {
            // Переопределяем стили с !important, устанавливая их без !important
            // Это позволяет элементам наследовать видимость от контейнера
            item.style.setProperty('opacity', '', '');
            item.style.setProperty('transform', '', '');
            item.style.setProperty('transition', '', '');
            // Затем удаляем свойства
            item.style.removeProperty('opacity');
            item.style.removeProperty('transform');
            item.style.removeProperty('transition');
          }
        });
      }
    });
    
    // Принудительный reflow для применения изменений
    if (timelineContainers.length > 0 && timelineContainers[0]) {
      void timelineContainers[0].offsetHeight;
    }
    
    // Анимируем все элементы синхронно (одновременно)
    if (elementsToAnimate.length > 0) {
      animateElementsAppearance(elementsToAnimate, { skipInitialState: true });
    }
  }, delay);
}

/**
 * Анимирует элементы заголовка резюме
 * Все элементы анимируются синхронно (одновременно)
 */
function animateCVHeader(headerSection) {
  if (!headerSection) return;
  
  // Анимируем саму секцию
  animateSectionAppearance(headerSection);
  
  // Собираем все элементы для синхронной анимации
  const elementsToAnimate = [];
  
  const name = headerSection.querySelector('.cv-header-name');
  const role = headerSection.querySelector('.cv-header-role');
  const contacts = headerSection.querySelector('.cv-header-contacts-wrapper');
  const photo = headerSection.querySelector('.cv-header-photo-image');
  const aboutContainer = headerSection.querySelector('.cv-header-about');
  const aboutTexts = headerSection.querySelectorAll('.cv-about-text');
  const skillsGrid = headerSection.querySelector('.cv-skills-grid');
  const skillCategories = headerSection.querySelectorAll('.cv-skill-category');
  
  // Добавляем основные элементы
  if (name) elementsToAnimate.push(name);
  if (role) elementsToAnimate.push(role);
  if (contacts) elementsToAnimate.push(contacts);
  if (photo) elementsToAnimate.push(photo);
  
  // Добавляем контейнер "О себе"
  if (aboutContainer) elementsToAnimate.push(aboutContainer);
  
  // Добавляем тексты "О себе"
  aboutTexts.forEach(text => {
    if (text) elementsToAnimate.push(text);
  });
  
  // Добавляем сетку навыков
  if (skillsGrid) elementsToAnimate.push(skillsGrid);
  
  // Добавляем категории навыков
  skillCategories.forEach(category => {
    if (category) elementsToAnimate.push(category);
  });
  
  // Анимируем все элементы синхронно (одновременно)
  if (elementsToAnimate.length > 0) {
    animateElementsAppearance(elementsToAnimate, { skipInitialState: true });
  }
}

/**
 * Инициализирует анимации всех секций резюме после загрузки страницы
 * Все элементы появляются одновременно без задержек
 * Работает как при первой загрузке, так и при повторном посещении страницы
 */
function initializeCVAnimations() {
  // Скрываем все элементы сразу (включая те, что уже могут быть видимы при повторном посещении)
  hideAllCVElementsImmediately();
  
  // Принудительный reflow для применения стилей скрытия
  const firstSection = document.querySelector('.cv-section');
  if (firstSection && firstSection.firstElementChild) {
    void firstSection.firstElementChild.offsetHeight;
  }
  
  // Используем двойной requestAnimationFrame для синхронизации с браузером
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Проверяем и при необходимости снова скрываем все элементы
      // Это важно при повторном посещении страницы
      const allSections = document.querySelectorAll('.cv-section, #cv-download-section');
      allSections.forEach(section => {
        if (section) {
          const computedStyle = window.getComputedStyle(section);
          const opacity = parseFloat(computedStyle.opacity);
          // Если секция видима, снова скрываем её
          if (opacity > 0.01) {
            section.style.setProperty('opacity', '0', 'important');
            section.style.setProperty('transform', 'translateY(10px)', 'important');
            section.style.setProperty('transition', 'none', 'important');
          }
          
          // Проверяем и скрываем элементы внутри секции
          const elementsToCheck = section.querySelectorAll(
            '.cv-header-name, .cv-header-role, .cv-header-contacts-wrapper, .cv-header-about, .cv-about-text, .cv-header-photo-image, ' +
            '.cv-section-title, .cv-skills-grid, .cv-skill-category, ' +
            '.timeline-container, .cv-certificate-item, .cv-course-item, .cv-language-item, ' +
            '.cv-download-button'
          );
          
          elementsToCheck.forEach(element => {
            if (element) {
              const elementComputedStyle = window.getComputedStyle(element);
              const elementOpacity = parseFloat(elementComputedStyle.opacity);
              // Если элемент видим, снова скрываем его
              if (elementOpacity > 0.01) {
                element.style.setProperty('opacity', '0', 'important');
                element.style.setProperty('transform', 'translateY(10px)', 'important');
                element.style.setProperty('transition', 'none', 'important');
              }
            }
          });
        }
      });
      
      // Небольшая задержка перед запуском анимации для гарантии готовности
      setTimeout(() => {
        // Собираем все элементы для синхронной анимации
        const allElementsToAnimate = [];
        
        // Элементы заголовка
        const headerSection = document.getElementById('cv-header-section');
        if (headerSection && headerSection.children.length > 0) {
          const name = headerSection.querySelector('.cv-header-name');
          const role = headerSection.querySelector('.cv-header-role');
          const contacts = headerSection.querySelector('.cv-header-contacts-wrapper');
          const photo = headerSection.querySelector('.cv-header-photo-image');
          const aboutContainer = headerSection.querySelector('.cv-header-about');
          const aboutTexts = headerSection.querySelectorAll('.cv-about-text');
          const skillsGrid = headerSection.querySelector('.cv-skills-grid');
          const skillCategories = headerSection.querySelectorAll('.cv-skill-category');
          
          if (name) allElementsToAnimate.push(name);
          if (role) allElementsToAnimate.push(role);
          if (contacts) allElementsToAnimate.push(contacts);
          if (photo) allElementsToAnimate.push(photo);
          if (aboutContainer) allElementsToAnimate.push(aboutContainer);
          aboutTexts.forEach(text => {
            if (text) allElementsToAnimate.push(text);
          });
          if (skillsGrid) allElementsToAnimate.push(skillsGrid);
          skillCategories.forEach(category => {
            if (category) allElementsToAnimate.push(category);
          });
          
          // Анимируем саму секцию заголовка
          animateSectionAppearance(headerSection);
        }
        
        // Элементы остальных секций
        const sections = [
          document.getElementById('cv-work-section'),
          document.getElementById('cv-education-section'),
          document.getElementById('cv-certificates-section'),
          document.getElementById('cv-courses-section'),
          document.getElementById('cv-languages-section'),
          document.getElementById('cv-download-section')
        ];
        
        sections.forEach(section => {
          if (section && section.children.length > 0) {
            // Анимируем саму секцию
            animateSectionAppearance(section);
            
            // Собираем элементы секции
            const sectionTitle = section.querySelector('.cv-section-title');
            if (sectionTitle) allElementsToAnimate.push(sectionTitle);
            
            // Timeline контейнеры
            const timelineContainers = section.querySelectorAll('.timeline-container');
            timelineContainers.forEach(container => {
              if (container) {
                allElementsToAnimate.push(container);
                
                // Убираем inline стили с элементов внутри контейнера
                const itemsInside = container.querySelectorAll('*');
                itemsInside.forEach(item => {
                  if (item) {
                    item.style.setProperty('opacity', '', '');
                    item.style.setProperty('transform', '', '');
                    item.style.setProperty('transition', '', '');
                    item.style.removeProperty('opacity');
                    item.style.removeProperty('transform');
                    item.style.removeProperty('transition');
                  }
                });
              }
            });
            
            // Элементы сертификатов, курсов, языков
            const certificateItems = section.querySelectorAll('.cv-certificate-item');
            certificateItems.forEach(item => {
              if (item) allElementsToAnimate.push(item);
            });
            
            const courseItems = section.querySelectorAll('.cv-course-item');
            courseItems.forEach(item => {
              if (item) allElementsToAnimate.push(item);
            });
            
            const languageItems = section.querySelectorAll('.cv-language-item');
            languageItems.forEach(item => {
              if (item) allElementsToAnimate.push(item);
            });
            
            // Кнопка скачивания
            const downloadButton = section.querySelector('.cv-download-button');
            if (downloadButton) {
              allElementsToAnimate.push(downloadButton);
            }
          }
        });
        
        // Принудительный reflow перед анимацией
        if (allElementsToAnimate.length > 0 && allElementsToAnimate[0]) {
          void allElementsToAnimate[0].offsetHeight;
        }
        
        // Анимируем все элементы одновременно без задержек
        // Используем skipInitialState: false, чтобы гарантировать установку начального состояния
        if (allElementsToAnimate.length > 0) {
          animateElementsAppearance(allElementsToAnimate, { skipInitialState: false });
        }
      }, 100);
    });
  });
}

/**
 * Инициализирует страницу резюме
 */
async function initCVPage() {
  // Скрываем все элементы сразу для предотвращения FOUC
  hideAllCVElementsImmediately();
  
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
    // Скрываем секции для анимации с !important
    section.style.setProperty('opacity', '0', 'important');
    section.style.setProperty('transform', 'translateY(10px)', 'important');
    section.style.setProperty('transition', 'none', 'important');
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
      // Скрываем элементы заголовка сразу
      hideAllCVElementsImmediately();
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
      // Скрываем элементы секции сразу
      hideAllCVElementsImmediately();
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
      // Скрываем элементы секции сразу
      hideAllCVElementsImmediately();
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
      // Скрываем элементы секции сразу
      hideAllCVElementsImmediately();
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
      // Скрываем элементы секции сразу
      hideAllCVElementsImmediately();
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
      // Скрываем элементы секции сразу
      hideAllCVElementsImmediately();
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
      // Скрываем элементы секции сразу
      hideAllCVElementsImmediately();
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
  
  // Ждем полной загрузки страницы и запускаем анимации
  // Анимация запускается каждый раз при загрузке страницы (как при первой загрузке, так и при повторном посещении)
  waitForPageReady().then(() => {
    initializeCVAnimations();
  });
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCVPage);
} else {
  initCVPage();
}

