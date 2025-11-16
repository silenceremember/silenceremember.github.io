/**
 * Менеджер анимаций страницы сообщества
 * Управляет анимациями появления элементов на странице сообщества
 */

import {
  animateSectionAppearance,
  animateElementsAppearance,
} from '../utils/AnimationUtils.js';
import { BaseAnimationManager } from './BaseAnimationManager.js';

/**
 * Класс для управления анимациями страницы сообщества
 */
export class CommunityAnimationManager extends BaseAnimationManager {
  /**
   * Создает экземпляр менеджера анимаций сообщества
   */
  constructor() {
    super({
      sectionSelector: '.community-section',
      elementsSelector:
        '.community-section-title, .community-card, .community-card-discord, ' +
        '.community-events-list, .community-event-item',
      animationDelay: 100,
    });
  }

  /**
   * Скрывает все элементы секций сообщества сразу с !important для предотвращения FOUC
   */
  hideAllCommunityElementsImmediately() {
    // Используем базовый метод - дополнительная логика не требуется
    this.hideAllElementsImmediately();
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
    this.forceReflow(document.querySelector('.community-section'));

    // Используем двойной requestAnimationFrame для синхронизации с браузером
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Проверяем и при необходимости снова скрываем все элементы
        // Это важно при повторном посещении страницы
        this.recheckAndHideElements();

        // Принудительный reflow для применения стилей скрытия
        const allSections = document.querySelectorAll(this.sectionSelector);
        if (allSections.length > 0 && allSections[0].firstElementChild) {
          void allSections[0].firstElementChild.offsetHeight;
        }

        // Задержка перед запуском анимации для гарантии готовности
        setTimeout(() => {
          // Собираем все элементы для синхронной анимации
          const allElementsToAnimate = [];

          // Собираем все секции и их элементы
          allSections.forEach((section) => {
            if (section && section.children.length > 0) {
              // Анимируем саму секцию
              animateSectionAppearance(section);

              // Собираем элементы секции
              const sectionTitle = section.querySelector(
                '.community-section-title'
              );
              if (sectionTitle) allElementsToAnimate.push(sectionTitle);

              // Карточки
              const cards = section.querySelectorAll(
                '.community-card, .community-card-discord'
              );
              cards.forEach((card) => {
                if (card) allElementsToAnimate.push(card);
              });

              // Элементы событий
              const eventItems = section.querySelectorAll(
                '.community-event-item'
              );
              eventItems.forEach((item) => {
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
            allElementsToAnimate.forEach((element) => {
              if (element) {
                const computedStyle = window.getComputedStyle(element);
                const opacity = parseFloat(computedStyle.opacity);
                // Если элемент все еще видим, снова скрываем его
                if (opacity > 0.01) {
                  element.style.setProperty('opacity', '0', 'important');
                  element.style.setProperty(
                    'transform',
                    'translateY(10px)',
                    'important'
                  );
                  element.style.setProperty('transition', 'none', 'important');
                }
              }
            });

            // Принудительный reflow перед анимацией
            if (allElementsToAnimate.length > 0 && allElementsToAnimate[0]) {
              void allElementsToAnimate[0].offsetHeight;
            }

            animateElementsAppearance(allElementsToAnimate, {
              skipInitialState: false,
            });
          }
        }, this.animationDelay);
      });
    });
  }
}
