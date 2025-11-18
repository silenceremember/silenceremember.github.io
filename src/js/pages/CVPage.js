/**
 * Страница резюме - загрузка и отображение данных из JSON
 * Формат: Классическое резюме согласно PLAN.md
 */

import { BasePage } from './BasePage.js';
import { DateFormatter } from '../utils/DateFormatter.js';
import { CVAnimationManager } from '../managers/CVAnimationManager.js';
import { localization } from '../utils/Localization.js';

/**
 * Класс страницы резюме
 */
export class CVPage extends BasePage {
  /**
   * Создает экземпляр страницы резюме
   */
  constructor() {
    super({
      navigationSelector: '.cv-navigation',
      imageSelector: '.cv-page img',
    });
    this.animationManager = null; // Загружается лениво
    this.timelineTemplate = null;
    this.cvData = null; // Сохраняем для обновления при смене языка
  }

  /**
   * Инициализирует менеджер анимаций (ленивая загрузка)
   */
  async initAnimationManager() {
    if (!this.animationManager) {
      this.animationManager = new CVAnimationManager();
    }
    return this.animationManager;
  }

  /**
   * Загружает шаблон временной линии
   */
  async loadTemplates() {
    // Всегда перезагружаем шаблон, чтобы убедиться, что он валиден
    this.timelineTemplate = await this.loadPageTemplate(
      '/components/timeline.html',
      '.timeline-item',
      false // Не используем кеш для timeline, так как он может изменяться
    );
    return this.timelineTemplate;
  }

  /**
   * Загружает данные резюме из JSON
   */
  async loadCVData() {
    return this.loadPageData('/data/cv.json', {}, null);
  }

  /**
   * Загружает данные сообщества для контактов
   */
  async loadCommunityData() {
    return this.loadPageData('/data/community.json', {}, null);
  }

  /**
   * Создает секцию заголовка с фото, контактами и "О себе"
   */
  createHeaderSection(communityData, aboutText, skills) {
    const section = document.createElement('div');
    section.className = 'cv-header';

    const headerContent = document.createElement('div');
    headerContent.className = 'cv-header-content';

    // Фото
    const photoContainer = document.createElement('div');
    photoContainer.className = 'cv-header-photo';

    const photo = document.createElement('img');
    photo.src = 'assets/images/portrait-cv.webp';
    photo.alt = 'Maxim Elchaninov';
    photo.className = 'cv-header-photo-image';
    photo.decoding = 'async';
    photo.loading = 'eager';
    photo.fetchPriority = 'high';
    // Оптимизация: добавляем width и height для предотвращения layout shift
    photo.setAttribute('width', '200');
    photo.setAttribute('height', '300');
    photo.onerror = function () {
      this.src = 'assets/images/portrait-placeholder.svg';
    };
    photoContainer.appendChild(photo);
    headerContent.appendChild(photoContainer);

    // Верхняя часть: заголовок и подзаголовок (слева сверху)
    const topSection = document.createElement('div');
    topSection.className = 'cv-header-top';

    const nameTitle = document.createElement('h2');
    nameTitle.className = 'cv-header-name';
    nameTitle.textContent = localization.t('cv.name');

    const roleSubtitle = document.createElement('h3');
    roleSubtitle.className = 'cv-header-role';
    roleSubtitle.textContent = localization.t('cv.role');

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
    if (
      communityData &&
      communityData.socialLinks &&
      communityData.socialLinks.telegram &&
      communityData.socialLinks.telegram !== 'https://t.me/...'
    ) {
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
      const paragraphs = aboutText
        .trim()
        .split('\n\n')
        .filter((p) => p.trim());

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
      const skillsGrid = this.createSkillsSection(skills);
      if (skillsGrid) {
        section.appendChild(skillsGrid);
      }
    }

    return section;
  }

  /**
   * Создает элемент временной линии для опыта работы
   */
  createWorkExperienceItem(work) {
    if (!this.timelineTemplate) return null;

    const item = this.timelineTemplate.cloneNode(true);

    const period = item.querySelector('.timeline-period');
    const title = item.querySelector('.timeline-title');
    const subtitle = item.querySelector('.timeline-subtitle');
    const description = item.querySelector('.timeline-description');
    const list = item.querySelector('.timeline-list');
    const tags = item.querySelector('.timeline-tags');

    // Период
    if (period && work.period) {
      const lang = localization.getCurrentLanguage();
      period.textContent = DateFormatter.formatPeriod(work.period, lang);
    }

    // Заголовок - должность
    if (title) {
      const lang = localization.getCurrentLanguage();
      if (work.positionLocalized && work.positionLocalized[lang]) {
        title.textContent = work.positionLocalized[lang];
      } else {
        title.textContent = work.position || '';
      }
    }

    // Подзаголовок - компания
    if (subtitle) {
      const lang = localization.getCurrentLanguage();
      if (work.companyLocalized && work.companyLocalized[lang]) {
        subtitle.textContent = work.companyLocalized[lang];
      } else {
        subtitle.textContent = work.company || '';
      }
    }

    // Описание - акцент на оптимизации процессов
    if (description) {
      description.textContent = localization.t('cv.workDescription');
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
  createEducationItem(edu) {
    if (!this.timelineTemplate) return null;

    const item = this.timelineTemplate.cloneNode(true);

    const period = item.querySelector('.timeline-period');
    const title = item.querySelector('.timeline-title');
    const subtitle = item.querySelector('.timeline-subtitle');
    const description = item.querySelector('.timeline-description');
    const list = item.querySelector('.timeline-list');
    const tags = item.querySelector('.timeline-tags');

    // Период
    if (period && edu.period) {
      const lang = localization.getCurrentLanguage();
      period.textContent = DateFormatter.formatPeriod(edu.period, lang);
    }

    // Заголовок - направление
    if (title) {
      const lang = localization.getCurrentLanguage();
      if (edu.directionLocalized && edu.directionLocalized[lang]) {
        title.textContent = edu.directionLocalized[lang];
      } else {
        title.textContent = edu.direction || '';
      }
    }

    // Подзаголовок - учреждение и степень
    if (subtitle) {
      const lang = localization.getCurrentLanguage();
      let institution = '';
      // Сначала проверяем локализованное сокращенное название
      if (edu.institutionShortLocalized && edu.institutionShortLocalized[lang]) {
        institution = edu.institutionShortLocalized[lang];
      } else if (edu.institutionLocalized && edu.institutionLocalized[lang]) {
        institution = edu.institutionLocalized[lang];
      } else {
        institution = edu.institutionShort || edu.institution || '';
      }
      
      // Всегда добавляем запятую перед степенью
      const degree = edu.degreeLocalized && edu.degreeLocalized[lang]
        ? `, ${edu.degreeLocalized[lang]}`
        : (edu.degree ? `, ${edu.degree}` : '');
      subtitle.textContent = `${institution}${degree}`;
      if (edu.location) {
        const location = edu.locationLocalized && edu.locationLocalized[lang]
          ? edu.locationLocalized[lang]
          : edu.location;
        subtitle.textContent += ` (${location})`;
      }
    }

    // Описание - статус
    if (description) {
      const statusKey = edu.status === 'in-progress' ? 'inProgress' : 'completed';
      description.textContent = localization.t(`cv.status.${statusKey}`);
      description.style.display = 'block';
    }

    // Скрываем список и теги
    if (list) list.style.display = 'none';
    if (tags) tags.style.display = 'none';

    item.setAttribute('data-cv-id', edu.id || '');
    item.setAttribute('data-type', 'education');
    if (edu.status) {
      item.setAttribute('data-status', edu.status);
    }

    return item;
  }

  /**
   * Создает секцию навыков согласно PLAN.md
   */
  createSkillsSection(skills) {
    if (!skills) return null;

    const section = document.createElement('div');
    section.className = 'cv-skills-grid';

    // Категории навыков
    const categories = [
      {
        key: 'design-prototyping',
        titleKey: 'cv.skills.categories.designPrototyping.title',
        descriptionKey: 'cv.skills.categories.designPrototyping.description',
        skills: skills['design-prototyping'] || [],
      },
      {
        key: 'technical-scripting',
        titleKey: 'cv.skills.categories.technicalScripting.title',
        descriptionKey: 'cv.skills.categories.technicalScripting.description',
        skills: skills['technical-scripting'] || [],
      },
      {
        key: 'design-documentation',
        titleKey: 'cv.skills.categories.designDocumentation.title',
        descriptionKey: 'cv.skills.categories.designDocumentation.description',
        skills: skills['design-documentation'] || [],
      },
      {
        key: 'production-collaboration',
        titleKey: 'cv.skills.categories.productionCollaboration.title',
        descriptionKey: 'cv.skills.categories.productionCollaboration.description',
        skills: skills['production-collaboration'] || [],
      },
      {
        key: 'asset-creation',
        titleKey: 'cv.skills.categories.assetCreation.title',
        descriptionKey: 'cv.skills.categories.assetCreation.description',
        skills: skills['asset-creation'] || [],
      },
    ];

    categories.forEach((category) => {
      if (category.skills.length === 0) return;

      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'cv-skill-category';

      const categoryTitle = document.createElement('h3');
      categoryTitle.className = 'cv-skill-category-title';
      categoryTitle.textContent = localization.t(category.titleKey);
      categoryDiv.appendChild(categoryTitle);

      if (category.descriptionKey) {
        const categoryDescription = document.createElement('p');
        categoryDescription.className = 'cv-skill-category-description';
        categoryDescription.textContent = localization.t(category.descriptionKey);
        categoryDiv.appendChild(categoryDescription);
      }

      const skillsList = document.createElement('div');
      skillsList.className = 'cv-skill-list';

      category.skills.forEach((skill) => {
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
  createCertificatesSection(certificates) {
    if (!certificates || certificates.length === 0) return null;

    const section = document.createElement('div');
    section.className = 'cv-certificates-list';

    certificates.forEach((cert) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cv-certificate-item';

      const title = document.createElement('h3');
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
      detailsButton.textContent = localization.t('cv.buttons.details');

      if (cert.url) {
        detailsButton.addEventListener('click', () => {
          window.open(cert.url, '_blank', 'noopener,noreferrer');
        });
      } else {
        // Если URL нет, можно показать alert или сделать кнопку неактивной
        detailsButton.disabled = true;
        detailsButton.title = localization.t('cv.certificateUnavailable');
      }

      itemDiv.appendChild(detailsButton);
      section.appendChild(itemDiv);
    });

    return section;
  }

  /**
   * Создает секцию курсов
   */
  createCoursesSection(courses) {
    if (!courses || courses.length === 0) return null;

    const section = document.createElement('div');
    section.className = 'cv-courses-list';

    courses.forEach((course) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cv-course-item';
      itemDiv.setAttribute('data-course-id', course.id || '');

      const title = document.createElement('h3');
      title.className = 'cv-course-title';
      const lang = localization.getCurrentLanguage();
      if (course.titleLocalized && course.titleLocalized[lang]) {
        title.textContent = course.titleLocalized[lang];
      } else {
        title.textContent = course.title || '';
      }
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
  createLanguagesSection(languages) {
    if (!languages || languages.length === 0) return null;

    const section = document.createElement('div');
    section.className = 'cv-languages-list';

    languages.forEach((langData) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cv-language-item';
      itemDiv.setAttribute('data-language', langData.language || '');

      const language = document.createElement('h3');
      language.className = 'cv-language-name';
      const currentLang = localization.getCurrentLanguage();
      if (langData.languageLocalized && langData.languageLocalized[currentLang]) {
        language.textContent = langData.languageLocalized[currentLang];
      } else {
        language.textContent = langData.language || '';
      }
      itemDiv.appendChild(language);

      if (langData.level) {
        const level = document.createElement('span');
        level.className = 'cv-language-level';
        if (langData.levelLocalized && langData.levelLocalized[currentLang]) {
          level.textContent = langData.levelLocalized[currentLang];
        } else {
          level.textContent = langData.level;
        }
        itemDiv.appendChild(level);
      }

      section.appendChild(itemDiv);
    });

    return section;
  }

  /**
   * Создает кнопки скачивания PDF
   */
  createDownloadButton() {
    const section = document.createElement('div');
    section.className = 'cv-download-wrapper';

    // Кнопка для русской версии
    const buttonRU = document.createElement('a');
    buttonRU.className = 'cv-download-button cta-button';
    buttonRU.href = 'https://docs.google.com/document/d/15toQDK1N_Tt6c8jg8v8mfzUBjL0Xi34xeVMMH5x_Jns/edit?usp=sharing';
    buttonRU.textContent = localization.t('cv.buttons.downloadRU');
    buttonRU.target = '_blank';

    // Кнопка для английской версии
    const buttonEN = document.createElement('a');
    buttonEN.className = 'cv-download-button cta-button';
    buttonEN.href = 'https://docs.google.com/document/d/1XUQqdlww_pMwcZ04OSdwZJq9leMMBnhE9d7yyT_5LTQ/edit?tab=t.0';
    buttonEN.textContent = localization.t('cv.buttons.downloadEN');
    buttonEN.target = '_blank';

    section.appendChild(buttonRU);
    section.appendChild(buttonEN);
    return section;
  }

  /**
   * Создает секцию опыта работы
   */
  createWorkSection(cvData) {
    const workSection = document.getElementById('cv-work-section');
    if (
      !workSection ||
      !cvData.workExperience ||
      cvData.workExperience.length === 0
    ) {
      return;
    }

    // Сначала показываем секцию, чтобы CSS :empty не скрывал её
    workSection.style.display = 'block';
    workSection.style.visibility = 'visible';
    // Секция уже очищена в начале функции
    const workTitle = document.createElement('h2');
    workTitle.className = 'cv-section-title';
    workTitle.textContent = localization.t('cv.sections.workExperience');
    workSection.appendChild(workTitle);

    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container timeline-work';

    let hasItems = false;
    cvData.workExperience.forEach((work) => {
      const timelineItem = this.createWorkExperienceItem(work);
      if (timelineItem) {
        hasItems = true;
        timelineContainer.appendChild(timelineItem);
      }
    });

    if (hasItems) {
      workSection.appendChild(timelineContainer);
      // Убеждаемся, что секция видима после добавления контента
      workSection.style.visibility = 'visible';
      // Скрытие элементов будет выполнено один раз в конце
    } else {
      workSection.style.display = 'none';
    }
  }

  /**
   * Создает секцию образования
   */
  createEducationSection(cvData) {
    const educationSection = document.getElementById('cv-education-section');
    if (
      !educationSection ||
      !cvData.education ||
      cvData.education.length === 0
    ) {
      return;
    }

    // Сначала показываем секцию, чтобы CSS :empty не скрывал её
    educationSection.style.display = 'block';
    educationSection.style.visibility = 'visible';
    // Секция уже очищена в начале функции
    const educationTitle = document.createElement('h2');
    educationTitle.className = 'cv-section-title';
    educationTitle.textContent = localization.t('cv.sections.education');
    educationSection.appendChild(educationTitle);

    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container timeline-education';

    let hasItems = false;
    cvData.education.forEach((edu) => {
      const timelineItem = this.createEducationItem(edu);
      if (timelineItem) {
        hasItems = true;
        timelineContainer.appendChild(timelineItem);
      }
    });

    if (hasItems) {
      educationSection.appendChild(timelineContainer);
      // Убеждаемся, что секция видима после добавления контента
      educationSection.style.visibility = 'visible';
      // Скрытие элементов будет выполнено один раз в конце
    } else {
      educationSection.style.display = 'none';
    }
  }

  /**
   * Убеждается, что прокрутка остается в начале после загрузки контента
   */
  ensureScrollAtTop() {
    const isTabletMode = window.innerWidth < 1024 || window.innerHeight < 900;
    const scrollElement = isTabletMode
      ? document.querySelector('.page-wrapper')
      : window;

    if (scrollElement === window) {
      window.scrollTo(0, 0);
    } else if (scrollElement) {
      scrollElement.scrollTop = 0;
    }
  }

  /**
   * Инициализирует страницу резюме
   */
  async init() {
    await this.initBase();

    // Подписываемся на изменения языка
    this.languageChangeHandler = () => {
      this.updateContentLanguage();
    };
    window.addEventListener('languageChanged', this.languageChangeHandler);

    // Инициализируем сервис индикатора загрузки
    this.initLoadingIndicator('cv-loading', 'cv-loading-container');
    this.loadingIndicator.show();

    // Загружаем менеджер анимаций лениво
    await this.initAnimationManager();

    // Параллельная загрузка шаблонов и данных для ускорения
    const [cvData, communityData, timelineTemplate] = await Promise.all([
      this.loadCVData(),
      this.loadCommunityData(),
      this.loadTemplates(),
    ]);
    this.cvData = cvData; // Сохраняем для обновления при смене языка

    // Скрываем индикатор загрузки и ждем завершения fadeout
    await this.loadingIndicator.hide();

    if (!cvData) {
      const headerSection = document.getElementById('cv-header-section');
      if (headerSection) {
        headerSection.innerHTML = `<p>${localization.t('cv.errors.loadFailed')}</p>`;
        headerSection.style.display = 'block';
        headerSection.style.visibility = 'visible';
        headerSection.style.opacity = '';
      }
      return;
    }

    // ОЧИЩАЕМ все секции перед заполнением
    const allSections = document.querySelectorAll(
      '.cv-section, #cv-download-section'
    );
    allSections.forEach((section) => {
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

      const headerContent = this.createHeaderSection(
        communityData,
        cvData.about,
        cvData.skills
      );
      if (headerContent) {
        // Секция уже очищена в начале функции, просто добавляем контент
        headerSection.appendChild(headerContent);
        // Скрытие элементов будет выполнено один раз в конце
      }
    }

    // Секция "О себе" - скрываем, так как она теперь в заголовке
    const aboutSection = document.getElementById('cv-about-section');
    if (aboutSection) {
      aboutSection.style.display = 'none';
    }

    // Секция "Опыт работы"
    this.createWorkSection(cvData);

    // Секция "Образование"
    this.createEducationSection(cvData);

    // Секция "Навыки" - скрываем, так как она теперь в заголовке
    const skillsSection = document.getElementById('cv-skills-section');
    if (skillsSection) {
      skillsSection.style.display = 'none';
    }

    // Секция "Сертификаты"
    const certificatesSection = document.getElementById(
      'cv-certificates-section'
    );
    if (
      certificatesSection &&
      cvData.certificates &&
      cvData.certificates.length > 0
    ) {
      // Сначала показываем секцию, чтобы CSS :empty не скрывал её
      certificatesSection.style.display = 'block';
      certificatesSection.style.visibility = 'visible';
      // Секция уже очищена в начале функции
      const certificatesTitle = document.createElement('h2');
      certificatesTitle.className = 'cv-section-title';
      certificatesTitle.textContent = localization.t('cv.sections.certificates');
      certificatesSection.appendChild(certificatesTitle);

      const certificatesList = this.createCertificatesSection(
        cvData.certificates
      );
      if (certificatesList) {
        certificatesSection.appendChild(certificatesList);
        // Убеждаемся, что секция видима после добавления контента
        certificatesSection.style.visibility = 'visible';
        // Скрытие элементов будет выполнено один раз в конце
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
      coursesTitle.textContent = localization.t('cv.sections.courses');
      coursesSection.appendChild(coursesTitle);

      const coursesList = this.createCoursesSection(cvData.courses);
      if (coursesList) {
        coursesSection.appendChild(coursesList);
        // Убеждаемся, что секция видима после добавления контента
        coursesSection.style.visibility = 'visible';
        // Скрытие элементов будет выполнено один раз в конце
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
      languagesTitle.textContent = localization.t('cv.sections.languages');
      languagesSection.appendChild(languagesTitle);

      const languagesList = this.createLanguagesSection(cvData.languages);
      if (languagesList) {
        languagesSection.appendChild(languagesList);
        // Убеждаемся, что секция видима после добавления контента
        languagesSection.style.visibility = 'visible';
        // Скрытие элементов будет выполнено один раз в конце
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
      const downloadButton = this.createDownloadButton();
      if (downloadButton) {
        downloadSection.appendChild(downloadButton);
        // Убеждаемся, что секция видима после добавления контента
        downloadSection.style.visibility = 'visible';
        // Скрытие элементов будет выполнено один раз в конце
      }
    }

    // Скрываем все элементы один раз после создания всего контента
    if (this.animationManager) {
      this.animationManager.hideAllCVElementsImmediately();
    }

    // Убеждаемся, что прокрутка остается в начале после загрузки контента
    // Оптимизация: используем двойной requestAnimationFrame для надежности
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.ensureScrollAtTop();
      });
    });

    // Обновляем язык контента для правильного отображения при начальной загрузке
    this.updateContentLanguage();

    // Ждем полной загрузки страницы и запускаем анимации
    // Анимация запускается каждый раз при загрузке страницы (как при первой загрузке, так и при повторном посещении)
    await this.waitForPageReady();
    if (this.animationManager) {
      this.animationManager.initializeAnimations();
    }
  }

  /**
   * Обработчик для случая загрузки страницы из кеша (bfcache)
   * Это важно для SPA-подобной навигации
   */
  handlePageshow(event) {
    // Если страница загружена из кеша, перезапускаем анимацию
    if (event.persisted) {
      const headerSection = document.getElementById('cv-header-section');
      if (headerSection && headerSection.children.length > 0) {
        // Небольшая задержка для гарантии готовности DOM
        setTimeout(async () => {
          await this.initAnimationManager();
          if (this.animationManager) {
            this.animationManager.initializeAnimations();
          }
        }, 100);
      }
    }
  }

  /**
   * Обновляет язык динамического контента
   */
  updateContentLanguage() {
    // Обновляем заголовки секций
    const sectionTitles = {
      'cv-work-section': 'cv.sections.workExperience',
      'cv-education-section': 'cv.sections.education',
      'cv-skills-section': 'cv.sections.skills',
      'cv-certificates-section': 'cv.sections.certificates',
      'cv-courses-section': 'cv.sections.courses',
      'cv-languages-section': 'cv.sections.languages',
    };

    Object.entries(sectionTitles).forEach(([sectionId, titleKey]) => {
      const section = document.getElementById(sectionId);
      if (section) {
        const titleElement = section.querySelector('.cv-section-title');
        if (titleElement) {
          titleElement.textContent = localization.t(titleKey);
        }
      }
    });

    // Обновляем кнопки загрузки PDF
    const downloadButtons = document.querySelectorAll('.cv-download-button');
    downloadButtons.forEach((button, index) => {
      if (index === 0) {
        button.textContent = localization.t('cv.buttons.downloadRU');
      } else if (index === 1) {
        button.textContent = localization.t('cv.buttons.downloadEN');
      }
    });

    // Статусы образования обновляются в блоке выше вместе с другими полями

    // Обновляем категории навыков
    document.querySelectorAll('.cv-skill-category-title').forEach((title, index) => {
      const categoryKeys = [
        'cv.skills.categories.designPrototyping.title',
        'cv.skills.categories.technicalScripting.title',
        'cv.skills.categories.designDocumentation.title',
        'cv.skills.categories.productionCollaboration.title',
        'cv.skills.categories.assetCreation.title',
      ];
      if (categoryKeys[index]) {
        title.textContent = localization.t(categoryKeys[index]);
      }
    });

    document.querySelectorAll('.cv-skill-category-description').forEach((desc, index) => {
      const categoryKeys = [
        'cv.skills.categories.designPrototyping.description',
        'cv.skills.categories.technicalScripting.description',
        'cv.skills.categories.designDocumentation.description',
        'cv.skills.categories.productionCollaboration.description',
        'cv.skills.categories.assetCreation.description',
      ];
      if (categoryKeys[index]) {
        desc.textContent = localization.t(categoryKeys[index]);
      }
    });

    // Обновляем кнопки "Подробнее"
    document.querySelectorAll('.cv-certificate-button').forEach(button => {
      button.textContent = localization.t('cv.buttons.details');
    });

    // Обновляем текст "О себе"
    if (this.cvData && this.cvData.about) {
      const aboutContainer = document.querySelector('.cv-header-about');
      if (aboutContainer) {
        const lang = localization.getCurrentLanguage();
        let aboutText = '';
        if (this.cvData.aboutLocalized && this.cvData.aboutLocalized[lang]) {
          aboutText = this.cvData.aboutLocalized[lang];
        } else {
          aboutText = this.cvData.about;
        }

        // Обновляем параграфы
        const paragraphs = aboutText.trim().split('\n\n').filter((p) => p.trim());
        const existingParagraphs = aboutContainer.querySelectorAll('.cv-about-text');
        paragraphs.forEach((paragraph, index) => {
          if (existingParagraphs[index]) {
            existingParagraphs[index].textContent = paragraph.trim();
          }
        });
      }
    }

    // Обновляем названия проектов/компаний в опыте работы
    document.querySelectorAll('[data-type="work"]').forEach(item => {
      const workId = item.getAttribute('data-cv-id');
      if (workId && this.cvData && this.cvData.workExperience) {
        const work = this.cvData.workExperience.find(w => w.id === workId);
        if (work) {
          const lang = localization.getCurrentLanguage();
          
          // Обновляем период
          const period = item.querySelector('.timeline-period');
          if (period && work.period) {
            period.textContent = DateFormatter.formatPeriod(work.period, lang);
          }
          
          const title = item.querySelector('.timeline-title');
          if (title) {
            if (work.positionLocalized && work.positionLocalized[lang]) {
              title.textContent = work.positionLocalized[lang];
            } else {
              title.textContent = work.position || '';
            }
          }

          const subtitle = item.querySelector('.timeline-subtitle');
          if (subtitle) {
            if (work.companyLocalized && work.companyLocalized[lang]) {
              subtitle.textContent = work.companyLocalized[lang];
            } else {
              subtitle.textContent = work.company || '';
            }
          }

          // Обновляем описание
          const description = item.querySelector('.timeline-description');
          if (description) {
            description.textContent = localization.t('cv.workDescription');
          }
        }
      }
    });

    // Обновляем названия в образовании
    document.querySelectorAll('[data-type="education"]').forEach(item => {
      const eduId = item.getAttribute('data-cv-id');
      if (eduId && this.cvData && this.cvData.education) {
        const edu = this.cvData.education.find(e => e.id === eduId);
        if (edu) {
          const lang = localization.getCurrentLanguage();
          
          // Обновляем период
          const period = item.querySelector('.timeline-period');
          if (period && edu.period) {
            period.textContent = DateFormatter.formatPeriod(edu.period, lang);
          }
          
          const title = item.querySelector('.timeline-title');
          if (title) {
            if (edu.directionLocalized && edu.directionLocalized[lang]) {
              title.textContent = edu.directionLocalized[lang];
            } else {
              title.textContent = edu.direction || '';
            }
          }

          const subtitle = item.querySelector('.timeline-subtitle');
          if (subtitle) {
            let institution = '';
            // Сначала проверяем локализованное сокращенное название
            if (edu.institutionShortLocalized && edu.institutionShortLocalized[lang]) {
              institution = edu.institutionShortLocalized[lang];
            } else if (edu.institutionLocalized && edu.institutionLocalized[lang]) {
              institution = edu.institutionLocalized[lang];
            } else {
              institution = edu.institutionShort || edu.institution || '';
            }
            
            // Всегда добавляем запятую перед степенью
            const degree = edu.degreeLocalized && edu.degreeLocalized[lang]
              ? `, ${edu.degreeLocalized[lang]}`
              : (edu.degree ? `, ${edu.degree}` : '');
            subtitle.textContent = `${institution}${degree}`;
            if (edu.location) {
              const location = edu.locationLocalized && edu.locationLocalized[lang]
                ? edu.locationLocalized[lang]
                : edu.location;
              subtitle.textContent += ` (${location})`;
            }
          }

          // Обновляем статус
          const description = item.querySelector('.timeline-description');
          if (description && edu.status) {
            const statusKey = edu.status === 'in-progress' ? 'inProgress' : 'completed';
            description.textContent = localization.t(`cv.status.${statusKey}`);
          }
        }
      }
    });

    // Обновляем курсы
    if (this.cvData && this.cvData.courses) {
      document.querySelectorAll('.cv-course-item').forEach(item => {
        const courseId = item.getAttribute('data-course-id');
        if (courseId) {
          const course = this.cvData.courses.find(c => c.id === courseId);
          if (course) {
            const lang = localization.getCurrentLanguage();
            const title = item.querySelector('.cv-course-title');
            if (title) {
              if (course.titleLocalized && course.titleLocalized[lang]) {
                title.textContent = course.titleLocalized[lang];
              } else {
                title.textContent = course.title || '';
              }
            }
          }
        }
      });
    }

    // Обновляем языки
    if (this.cvData && this.cvData.languages) {
      document.querySelectorAll('.cv-language-item').forEach(item => {
        const languageName = item.getAttribute('data-language');
        if (languageName) {
          const langData = this.cvData.languages.find(l => l.language === languageName);
          if (langData) {
            const lang = localization.getCurrentLanguage();
            const languageElement = item.querySelector('.cv-language-name');
            if (languageElement) {
              if (langData.languageLocalized && langData.languageLocalized[lang]) {
                languageElement.textContent = langData.languageLocalized[lang];
              } else {
                languageElement.textContent = langData.language || '';
              }
            }
            const levelElement = item.querySelector('.cv-language-level');
            if (levelElement && langData.level) {
              if (langData.levelLocalized && langData.levelLocalized[lang]) {
                levelElement.textContent = langData.levelLocalized[lang];
              } else {
                levelElement.textContent = langData.level;
              }
            }
          }
        }
      });
    }
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    if (this.languageChangeHandler) {
      window.removeEventListener('languageChanged', this.languageChangeHandler);
    }
  }
}
