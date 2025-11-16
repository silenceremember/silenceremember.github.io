/**
 * Страница исследований - загрузка и отображение публикаций из JSON в виде карточек
 */

import { BasePage } from './BasePage.js';
import { CardFactory } from '../factories/CardFactory.js';
import { DateFormatter } from '../utils/DateFormatter.js';
import {
  animateElementsAppearance,
  animateSectionAppearance,
  animateElementAppearance,
} from '../utils/AnimationUtils.js';

/**
 * Класс страницы исследований
 */
export class ResearchPage extends BasePage {
  /**
   * Создает экземпляр страницы исследований
   */
  constructor() {
    super({
      navigationSelector: '.research-navigation',
      imageSelector: '.research-card img',
    });
    this.researchCardTemplate = null;
  }

  /**
   * Загружает шаблон исследования
   */
  async loadResearchTemplate() {
    if (!this.researchCardTemplate) {
      this.researchCardTemplate = await this.loadPageTemplate(
        '/components/research-card.html',
        '.research-card'
      );
    }
    return this.researchCardTemplate;
  }

  /**
   * Загружает данные исследований из JSON
   */
  async loadResearchData() {
    return this.loadPageDataArray('/data/research.json', 'publications', []);
  }

  /**
   * Группирует публикации по годам
   */
  groupPublicationsByYear(publications) {
    const grouped = {};

    publications.forEach((pub) => {
      const year = DateFormatter.getYearFromDate(pub.date);
      if (!year) return;

      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(pub);
    });

    return grouped;
  }

  /**
   * Инициализация страницы
   */
  async init() {
    await this.initBase();

    // Инициализируем сервис индикатора загрузки
    this.initLoadingIndicator(
      'research-loading',
      'research-loading-container'
    );
    this.loadingIndicator.show();

    // Загружаем шаблон исследования
    await this.loadResearchTemplate();

    // Загружаем данные
    const publications = await this.loadResearchData();

    // Скрываем индикатор загрузки и ждем завершения fadeout
    await this.loadingIndicator.hide();

    // Получаем секции и готовим их к анимации появления
    const publicationsSection = document.getElementById(
      'research-publications-section'
    );
    const diplomaSection = document.getElementById('research-diploma-section');

    // Убеждаемся, что секции готовы к анимации появления
    if (publicationsSection) {
      publicationsSection.style.visibility = 'visible';
      if (
        !publicationsSection.style.opacity ||
        publicationsSection.style.opacity === ''
      ) {
        publicationsSection.style.opacity = '0';
      }
    }
    if (diplomaSection) {
      diplomaSection.style.visibility = 'visible';
      if (!diplomaSection.style.opacity || diplomaSection.style.opacity === '') {
        diplomaSection.style.opacity = '0';
      }
    }

    if (publications.length === 0) {
      if (publicationsSection) {
        publicationsSection.innerHTML = '<p>Публикации не найдены.</p>';
        const sectionOpacity = publicationsSection.style.opacity;
        if (
          sectionOpacity === '0' ||
          !sectionOpacity ||
          sectionOpacity === ''
        ) {
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
    const diploma = publications.find((pub) => pub.type === 'diploma');
    const regularPublications = publications.filter(
      (pub) => pub.type !== 'diploma'
    );

    // Отображаем ВКР
    if (diploma) {
      if (diplomaSection) {
        const diplomaTitle = document.createElement('h2');
        diplomaTitle.className = 'research-section-title';
        diplomaTitle.textContent = 'Квалификационная работа';
        diplomaSection.appendChild(diplomaTitle);

        const diplomaGrid = document.createElement('div');
        diplomaGrid.className = 'research-grid research-grid-diploma';

        const diplomaCard = CardFactory.createResearchCard(
          this.researchCardTemplate,
          diploma
        );
        if (diplomaCard) {
          diplomaCard.style.opacity = '0';
          diplomaCard.style.transform = 'translateY(10px)';
          diplomaCard.style.transition = 'none';
          diplomaGrid.appendChild(diplomaCard);
        }

        diplomaSection.appendChild(diplomaGrid);

        // Плавное появление diplomaSection с контентом, затем карточки
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const sectionOpacity = diplomaSection.style.opacity;
            if (
              sectionOpacity === '0' ||
              !sectionOpacity ||
              sectionOpacity === ''
            ) {
              animateSectionAppearance(diplomaSection);
            }

            if (diplomaCard) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  animateElementAppearance(diplomaCard);
                });
              });
            }
          });
        });
      }
    }

    // Сортируем публикации по дате (от новых к старым)
    regularPublications.sort((a, b) => {
      const yearA = DateFormatter.getYearFromDate(a.date) || 0;
      const yearB = DateFormatter.getYearFromDate(b.date) || 0;

      if (yearB !== yearA) {
        return yearB - yearA;
      }

      if (a.date?.start && b.date?.start) {
        return new Date(b.date.start) - new Date(a.date.start);
      }

      return 0;
    });

    // Группируем по годам
    const groupedPublications =
      this.groupPublicationsByYear(regularPublications);
    const years = Object.keys(groupedPublications).sort(
      (a, b) => parseInt(b) - parseInt(a)
    );

    // Отображаем публикации
    if (publicationsSection && years.length > 0) {
      years.forEach((year) => {
        // Заголовок года
        const yearHeader = document.createElement('h2');
        yearHeader.className = 'research-year-header';
        yearHeader.textContent = year;
        publicationsSection.appendChild(yearHeader);

        // Сетка для карточек года
        const yearGrid = document.createElement('div');
        yearGrid.className = 'research-grid';

        // Добавляем карточки
        groupedPublications[year].forEach((publication) => {
          const card = CardFactory.createResearchCard(
            this.researchCardTemplate,
            publication
          );
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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const sectionOpacity = publicationsSection.style.opacity;
          if (
            sectionOpacity === '0' ||
            !sectionOpacity ||
            sectionOpacity === ''
          ) {
            animateSectionAppearance(publicationsSection);
          }

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const allCards =
                publicationsSection.querySelectorAll('.research-card');
              if (allCards.length > 0) {
                animateElementsAppearance(allCards);
              }
            });
          });
        });
      });
    } else if (publicationsSection) {
      const sectionOpacity = publicationsSection.style.opacity;
      if (sectionOpacity === '0' || !sectionOpacity || sectionOpacity === '') {
        animateSectionAppearance(publicationsSection);
      }
    }

    // Если ВКР нет, но секция существует, убеждаемся что она видима (или скрыта, если пустая)
    if (diplomaSection && !diploma) {
      const sectionOpacity = diplomaSection.style.opacity;
      if (sectionOpacity === '0' && diplomaSection.children.length === 0) {
        diplomaSection.style.visibility = 'hidden';
      }
    }

    // Ждем полной загрузки страницы перед завершением инициализации
    await this.waitForPageReady();
  }
}
