/**
 * Страница исследований - загрузка и отображение публикаций из JSON в виде карточек
 */

import { BasePage } from './BasePage.js';
import { LayoutManager } from '../layout/LayoutManager.js';
import { loadData } from '../utils/DataLoader.js';
import { CardFactory } from '../factories/CardFactory.js';
import { LoadingIndicatorService } from '../services/LoadingIndicatorService.js';
import { DateFormatter } from '../utils/DateFormatter.js';
import { ANIMATION_CONFIG as CARD_ANIMATION, animateElementsAppearance, animateSectionAppearance, animateElementAppearance } from '../utils/AnimationUtils.js';

const layoutManager = new LayoutManager();
const loadHTML = (url) => layoutManager.loadHTML(url);

/**
 * Класс страницы исследований
 */
export class ResearchPage extends BasePage {
  constructor() {
    super({
      navigationSelector: '.research-navigation',
      imageSelector: '.research-card img'
    });
    this.loadingIndicator = null;
    this.researchCardTemplate = null;
  }

  /**
   * Загружает шаблон карточки исследования
   */
  async loadResearchCardTemplate() {
    if (!this.researchCardTemplate) {
      try {
        const cardHTML = await loadHTML('/components/research-card.html');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        this.researchCardTemplate = tempDiv.querySelector('.research-card') || tempDiv.firstElementChild;
        if (!this.researchCardTemplate) {
          console.error('Не удалось найти шаблон карточки исследования');
        }
      } catch (error) {
        console.error('Ошибка загрузки шаблона карточки:', error);
      }
    }
    return this.researchCardTemplate;
  }

  /**
   * Загружает данные исследований из JSON с кешированием
   */
  async loadResearchData() {
    try {
      const data = await loadData('/data/research.json');
      return data.publications || [];
    } catch (error) {
      console.error('Ошибка загрузки исследований:', error);
      return [];
    }
  }

  /**
   * Группирует публикации по годам
   */
  groupPublicationsByYear(publications) {
    const grouped = {};
    
    publications.forEach(pub => {
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
    this.loadingIndicator = new LoadingIndicatorService('research-loading', 'research-publications-section');
    this.loadingIndicator.init();

    // Загружаем шаблон карточки исследования
    await this.loadResearchCardTemplate();
    
    // Загружаем данные
    const publications = await this.loadResearchData();
    
    // Скрываем индикатор загрузки и ждем завершения fadeout
    await this.loadingIndicator.hide();
    
    // Получаем секции и готовим их к анимации появления
    const publicationsSection = document.getElementById('research-publications-section');
    const vkrSection = document.getElementById('research-vkr-section');
    
    // Убеждаемся, что секции готовы к анимации появления
    if (publicationsSection) {
      publicationsSection.style.visibility = 'visible';
      if (!publicationsSection.style.opacity || publicationsSection.style.opacity === '') {
        publicationsSection.style.opacity = '0';
      }
    }
    if (vkrSection) {
      vkrSection.style.visibility = 'visible';
      if (!vkrSection.style.opacity || vkrSection.style.opacity === '') {
        vkrSection.style.opacity = '0';
      }
    }
    
    if (publications.length === 0) {
      if (publicationsSection) {
        publicationsSection.innerHTML = '<p>Публикации не найдены.</p>';
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
        
        const vkrCard = CardFactory.createResearchCard(this.researchCardTemplate, vkr);
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
            const sectionOpacity = vkrSection.style.opacity;
            if (sectionOpacity === '0' || !sectionOpacity || sectionOpacity === '') {
              animateSectionAppearance(vkrSection);
            }
            
            if (vkrCard) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  animateElementAppearance(vkrCard);
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
    const groupedPublications = this.groupPublicationsByYear(regularPublications);
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
          const card = CardFactory.createResearchCard(this.researchCardTemplate, publication);
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
          if (sectionOpacity === '0' || !sectionOpacity || sectionOpacity === '') {
            animateSectionAppearance(publicationsSection);
          }
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const allCards = publicationsSection.querySelectorAll('.research-card');
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
    if (vkrSection && !vkr) {
      const sectionOpacity = vkrSection.style.opacity;
      if (sectionOpacity === '0' && vkrSection.children.length === 0) {
        vkrSection.style.visibility = 'hidden';
      }
    }
  }
}
