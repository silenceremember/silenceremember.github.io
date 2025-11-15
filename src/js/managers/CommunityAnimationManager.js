/**
 * Менеджер анимаций страницы сообщества
 * Управляет анимациями появления элементов на странице сообщества
 */

import { animateSectionAppearance, animateElementsAppearance } from '../utils/animations.js';

/**
 * Класс для управления анимациями страницы сообщества
 */
export class CommunityAnimationManager {
  /**
   * Создает экземпляр менеджера анимаций сообщества
   */
  constructor() {
    // Селектор для всех секций сообщества
    this.sectionSelector = '.community-section';
    
    // Селектор для всех элементов внутри секций, которые нужно скрывать
    // НЕ скрываем контейнеры .community-social-links и .community-donations-links - они нужны для layout
    // Скрываем только карточки и другие элементы контента
    this.elementsSelector = 
      '.community-section-title, .community-card, .community-card-discord, ' +
      '.community-events-list, .community-event-item';
  }

  /**
   * Скрывает все элементы секций сообщества сразу с !important для предотвращения FOUC
   */
  hideAllCommunityElementsImmediately() {
    const allSections = document.querySelectorAll(this.sectionSelector);
    allSections.forEach(section => {
      if (section) {
        // Скрываем саму секцию
        section.style.setProperty('opacity', '0', 'important');
        section.style.setProperty('transform', 'translateY(10px)', 'important');
        section.style.setProperty('transition', 'none', 'important');
        
        // Скрываем все элементы внутри секции
        // НЕ скрываем контейнеры .community-social-links и .community-donations-links - они нужны для layout
        // Скрываем только карточки и другие элементы контента
        const elementsToHide = section.querySelectorAll(this.elementsSelector);
        
        elementsToHide.forEach(element => {
          if (element) {
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('transform', 'translateY(10px)', 'important');
            element.style.setProperty('transition', 'none', 'important');
          }
        });
      }
    });
  }

  /**
   * Инициализирует анимации всех секций сообщества после загрузки страницы
   * Все элементы появляются одновременно без задержек
   * Работает как при первой загрузке, так и при повторном посещении страницы
   */
  initializeAnimations() {
    // Скрываем все элементы сразу (включая те, что уже могут быть видимы при повторном посещении)
    this.hideAllCommunityElementsImmediately();
    
    // Принудительный reflow для применения стилей скрытия
    const firstSection = document.querySelector('.community-section');
    if (firstSection && firstSection.firstElementChild) {
      void firstSection.firstElementChild.offsetHeight;
    }
    
    // Используем двойной requestAnimationFrame для синхронизации с браузером
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Проверяем и при необходимости снова скрываем все элементы
        // Это важно при повторном посещении страницы
        const allSections = document.querySelectorAll(this.sectionSelector);
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
            // НЕ скрываем контейнеры .community-social-links и .community-donations-links - они нужны для layout
            const elementsToCheck = section.querySelectorAll(this.elementsSelector);
            
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
        
        // Принудительный reflow для применения стилей скрытия
        if (allSections.length > 0 && allSections[0].firstElementChild) {
          void allSections[0].firstElementChild.offsetHeight;
        }
        
        // Задержка перед запуском анимации для гарантии готовности
        // Увеличена задержка для лучшей синхронизации, как на главной странице
        setTimeout(() => {
          // Собираем все элементы для синхронной анимации
          const allElementsToAnimate = [];
          
          // Собираем все секции и их элементы
          allSections.forEach(section => {
            if (section && section.children.length > 0) {
              // Анимируем саму секцию
              animateSectionAppearance(section);
              
              // Собираем элементы секции
              const sectionTitle = section.querySelector('.community-section-title');
              if (sectionTitle) allElementsToAnimate.push(sectionTitle);
              
              // Карточки
              const cards = section.querySelectorAll('.community-card, .community-card-discord');
              cards.forEach(card => {
                if (card) allElementsToAnimate.push(card);
              });
              
              // Элементы событий
              const eventItems = section.querySelectorAll('.community-event-item');
              eventItems.forEach(item => {
                if (item) allElementsToAnimate.push(item);
              });
            }
          });
          
          // Принудительный reflow перед анимацией
          if (allElementsToAnimate.length > 0 && allElementsToAnimate[0]) {
            void allElementsToAnimate[0].offsetHeight;
          }
          
          // Анимируем все элементы одновременно без задержек
          // Используем skipInitialState: false, чтобы гарантировать установку начального состояния
          if (allElementsToAnimate.length > 0) {
            // Дополнительная проверка: убеждаемся, что элементы действительно скрыты перед анимацией
            allElementsToAnimate.forEach(element => {
              if (element) {
                const computedStyle = window.getComputedStyle(element);
                const opacity = parseFloat(computedStyle.opacity);
                // Если элемент все еще видим, снова скрываем его
                if (opacity > 0.01) {
                  element.style.setProperty('opacity', '0', 'important');
                  element.style.setProperty('transform', 'translateY(10px)', 'important');
                  element.style.setProperty('transition', 'none', 'important');
                }
              }
            });
            
            // Принудительный reflow перед анимацией
            if (allElementsToAnimate.length > 0 && allElementsToAnimate[0]) {
              void allElementsToAnimate[0].offsetHeight;
            }
            
            animateElementsAppearance(allElementsToAnimate, { skipInitialState: false });
          }
        }, 100); // Задержка как на главной странице
      });
    });
  }
}

