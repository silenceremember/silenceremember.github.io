/**
 * Менеджер анимаций CV страницы
 * Управляет анимациями появления элементов на странице резюме
 */

import {
  animateSectionAppearance,
  animateElementsAppearance,
} from '../utils/AnimationUtils.js';
import { BaseAnimationManager } from './BaseAnimationManager.js';

/**
 * Класс для управления анимациями CV страницы
 */
export class CVAnimationManager extends BaseAnimationManager {
  /**
   * Создает экземпляр менеджера анимаций CV
   */
  constructor() {
    super({
      sectionSelector: '.cv-section, #cv-download-section',
      elementsSelector:
        '.cv-header-name, .cv-header-role, .cv-header-contacts-wrapper, .cv-header-about, .cv-about-text, .cv-header-photo-image, ' +
        '.cv-section-title, .cv-skills-grid, .cv-skill-category, ' +
        '.timeline-container, .cv-certificate-item, .cv-course-item, .cv-language-item, ' +
        '.cv-download-button',
      animationDelay: 100,
    });
  }

  /**
   * Скрывает все элементы секций резюме сразу с !important для предотвращения FOUC
   */
  hideAllCVElementsImmediately() {
    // Используем базовый метод с дополнительной логикой для timeline-container
    this.hideAllElementsImmediately((section) => {
      // Для timeline-container также скрываем все элементы внутри
      const timelineContainers = section.querySelectorAll(
        '.timeline-container'
      );
      timelineContainers.forEach((container) => {
        if (container) {
          // Скрываем все элементы внутри контейнера
          const itemsInside = container.querySelectorAll('*');
          itemsInside.forEach((item) => {
            if (item) {
              item.style.setProperty('opacity', '0', 'important');
              item.style.setProperty(
                'transform',
                'translateY(10px)',
                'important'
              );
              item.style.setProperty('transition', 'none', 'important');
            }
          });
        }
      });
    });
  }

  /**
   * Анимирует элементы секции резюме
   * Timeline контейнеры анимируются как единый блок
   * @param {HTMLElement} section - Секция для анимации
   * @param {Object} options - Опции анимации
   * @param {number} options.delay - Задержка перед анимацией в миллисекундах
   */
  animateCVSection(section, options = {}) {
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
      const timelineContainers = section.querySelectorAll(
        '.timeline-container'
      );
      timelineContainers.forEach((container) => {
        if (container) {
          elementsToAnimate.push(container);
        }
      });

      // Элементы сертификатов, курсов, языков
      const certificateItems = section.querySelectorAll('.cv-certificate-item');
      certificateItems.forEach((item) => {
        if (item) elementsToAnimate.push(item);
      });

      const courseItems = section.querySelectorAll('.cv-course-item');
      courseItems.forEach((item) => {
        if (item) elementsToAnimate.push(item);
      });

      const languageItems = section.querySelectorAll('.cv-language-item');
      languageItems.forEach((item) => {
        if (item) elementsToAnimate.push(item);
      });

      // Кнопки скачивания
      const downloadButtons = section.querySelectorAll('.cv-download-button');
      downloadButtons.forEach((button) => {
        elementsToAnimate.push(button);
      });

      // Анимируем саму секцию
      animateSectionAppearance(section);

      // Сначала убираем inline стили с элементов внутри timeline-контейнеров
      // чтобы они стали видимыми вместе с контейнером при анимации
      timelineContainers.forEach((container) => {
        if (container) {
          const itemsInside = container.querySelectorAll('*');
          itemsInside.forEach((item) => {
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
        animateElementsAppearance(elementsToAnimate, {
          skipInitialState: true,
        });
      }
    }, delay);
  }

  /**
   * Анимирует элементы заголовка резюме
   * Все элементы анимируются синхронно (одновременно)
   * @param {HTMLElement} headerSection - Секция заголовка для анимации
   */
  animateCVHeader(headerSection) {
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
    const skillCategories =
      headerSection.querySelectorAll('.cv-skill-category');

    // Добавляем основные элементы
    if (name) elementsToAnimate.push(name);
    if (role) elementsToAnimate.push(role);
    if (contacts) elementsToAnimate.push(contacts);
    if (photo) elementsToAnimate.push(photo);

    // Добавляем контейнер "О себе"
    if (aboutContainer) elementsToAnimate.push(aboutContainer);

    // Добавляем тексты "О себе"
    aboutTexts.forEach((text) => {
      if (text) elementsToAnimate.push(text);
    });

    // Добавляем сетку навыков
    if (skillsGrid) elementsToAnimate.push(skillsGrid);

    // Добавляем категории навыков
    skillCategories.forEach((category) => {
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
  initializeAnimations() {
    // Скрываем все элементы сразу (включая те, что уже могут быть видимы при повторном посещении)
    this.hideAllCVElementsImmediately();

    // Используем двойной requestAnimationFrame для синхронизации с браузером
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Проверяем и при необходимости снова скрываем все элементы
        // Это важно при повторном посещении страницы
        this.recheckAndHideElements();

        // Задержка перед запуском анимации для гарантии готовности
        setTimeout(() => {
          // Кешируем секцию заголовка один раз
          const headerSection = document.getElementById('cv-header-section');
          
          // Оптимизация: собираем все элементы для синхронной анимации за один проход
          const allElementsToAnimate = [];
          const sectionsToAnimate = [];

          // Элементы заголовка
          if (headerSection && headerSection.children.length > 0) {
            sectionsToAnimate.push(headerSection);
            
            // Кешируем селекторы заголовка
            const name = headerSection.querySelector('.cv-header-name');
            const role = headerSection.querySelector('.cv-header-role');
            const contacts = headerSection.querySelector(
              '.cv-header-contacts-wrapper'
            );
            const photo = headerSection.querySelector('.cv-header-photo-image');
            const aboutContainer =
              headerSection.querySelector('.cv-header-about');
            const aboutTexts = headerSection.querySelectorAll('.cv-about-text');
            const skillsGrid = headerSection.querySelector('.cv-skills-grid');
            const skillCategories =
              headerSection.querySelectorAll('.cv-skill-category');

            if (name) allElementsToAnimate.push(name);
            if (role) allElementsToAnimate.push(role);
            if (contacts) allElementsToAnimate.push(contacts);
            if (photo) allElementsToAnimate.push(photo);
            if (aboutContainer) allElementsToAnimate.push(aboutContainer);
            allElementsToAnimate.push(...aboutTexts);
            if (skillsGrid) allElementsToAnimate.push(skillsGrid);
            allElementsToAnimate.push(...skillCategories);
          }

          // Элементы остальных секций - оптимизация: используем кешированные секции
          const sectionIds = [
            'cv-work-section',
            'cv-education-section',
            'cv-certificates-section',
            'cv-courses-section',
            'cv-languages-section',
            'cv-download-section',
          ];

          sectionIds.forEach((id) => {
            const section = document.getElementById(id);
            if (section && section.children.length > 0) {
              sectionsToAnimate.push(section);

              // Собираем элементы секции
              const sectionTitle = section.querySelector('.cv-section-title');
              if (sectionTitle) allElementsToAnimate.push(sectionTitle);

              // Timeline контейнеры
              const timelineContainers = section.querySelectorAll(
                '.timeline-container'
              );
              timelineContainers.forEach((container) => {
                if (container) {
                  allElementsToAnimate.push(container);

                  // Убираем inline стили с элементов внутри контейнера
                  // Оптимизация: используем batch DOM операции
                  const itemsInside = container.querySelectorAll('*');
                  itemsInside.forEach((item) => {
                    if (item) {
                      item.style.removeProperty('opacity');
                      item.style.removeProperty('transform');
                      item.style.removeProperty('transition');
                    }
                  });
                }
              });

              // Собираем элементы секции пакетно
              const certificateItems = section.querySelectorAll(
                '.cv-certificate-item'
              );
              const courseItems = section.querySelectorAll('.cv-course-item');
              const languageItems =
                section.querySelectorAll('.cv-language-item');
              const downloadButtons = section.querySelectorAll(
                '.cv-download-button'
              );

              allElementsToAnimate.push(
                ...certificateItems,
                ...courseItems,
                ...languageItems,
                ...downloadButtons
              );
            }
          });

          // Оптимизация: один принудительный reflow вместо нескольких
          if (allElementsToAnimate.length > 0) {
            // Анимируем секции
            sectionsToAnimate.forEach((section) => {
              animateSectionAppearance(section);
            });

            // Принудительный reflow один раз перед анимацией элементов
            void allElementsToAnimate[0].offsetHeight;

            // Анимируем все элементы одновременно
            // Оптимизация: убрана избыточная проверка opacity для каждого элемента
            // (hideAllCVElementsImmediately уже установила нужные стили)
            animateElementsAppearance(allElementsToAnimate, {
              skipInitialState: false,
            });
          }
        }, this.animationDelay);
      });
    });
  }
}
