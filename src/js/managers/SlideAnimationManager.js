/**
 * Менеджер анимаций слайдов на главной странице
 * Управляет анимациями появления элементов при переключении слайдов и смене режимов
 */

import {
  animateElementAppearance,
  animateElementsAppearance,
} from '../utils/AnimationUtils.js';

/**
 * Класс для управления анимациями слайдов
 */
export class SlideAnimationManager {
  /**
   * Создает экземпляр менеджера анимаций слайдов
   * @param {HTMLElement} slidesContainer - Контейнер со слайдами
   */
  constructor(slidesContainer) {
    if (!slidesContainer) {
      throw new Error('slidesContainer is required');
    }

    this.slidesContainer = slidesContainer;

    // Состояние для отслеживания режима и предотвращения множественных вызовов
    this.lastKnownMode = null;
    this.animationTimeout = null;
    this.isAnimating = false;
    this.debounceTimeout = null;
    this.lastActiveSlideIndex = null;
    this.slideAnimationTimeout = null;
    this.isModeSwitching = false;

    // Observers для отслеживания изменений
    this.slideObserver = null;
    this.containerObserver = null;
  }

  /**
   * Инициализирует анимацию первого слайда после полной загрузки страницы
   * Работает как в desktop, так и в tablet/mobile режимах
   */
  initializeFirstSlideAnimation() {
    if (!this.slidesContainer) {
      this.setupSlideAnimations();
      return;
    }

    const isTabletMode =
      this.slidesContainer.classList.contains('tablet-scroll-mode');
    const slides = this.slidesContainer.querySelectorAll('.slide');

    // Скрываем элементы всех слайдов перед анимацией
    slides.forEach((slide) => {
      this.hideSlideElementsBeforeAnimation(slide);
    });

    // Принудительный reflow для применения стилей скрытия
    if (slides.length > 0 && slides[0].firstElementChild) {
      void slides[0].firstElementChild.offsetHeight;
    }

    // Используем двойной requestAnimationFrame для синхронизации с браузером
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Проверяем, что все элементы скрыты (на всякий случай)
        slides.forEach((slide) => {
          const slideIndex = parseInt(slide.getAttribute('data-slide'));
          let elementsToCheck = [];

          if (slideIndex === 0) {
            elementsToCheck = slide.querySelectorAll(
              '.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image'
            );
          } else if (slideIndex === 4) {
            elementsToCheck = slide.querySelectorAll(
              '.section-title, .cta-button, .cta-divider'
            );
          } else {
            elementsToCheck = slide.querySelectorAll(
              '.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder'
            );
          }

          elementsToCheck.forEach((el) => {
            if (el) {
              const computedStyle = window.getComputedStyle(el);
              const opacity = parseFloat(computedStyle.opacity);
              // Если элемент видим, устанавливаем начальное состояние снова
              if (opacity > 0.01) {
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty(
                  'transform',
                  'translateY(10px)',
                  'important'
                );
                el.style.setProperty('transition', 'none', 'important');
              }
            }
          });
        });

        // Небольшая задержка перед запуском анимации для гарантии готовности
        setTimeout(() => {
          // Анимация запускается только при первой загрузке страницы
          // При переключении между режимами анимация не проигрывается

          if (isTabletMode) {
            // В tablet режиме анимируем все слайды одновременно только при первой загрузке
            // lastKnownMode будет null только при первой загрузке
            if (this.lastKnownMode === null) {
              this.lastKnownMode = isTabletMode;
              this.restartAnimationsOnModeChange();
            }
          } else {
            // В desktop режиме анимируем только первый слайд при первой загрузке
            if (this.lastKnownMode === null) {
              this.lastKnownMode = isTabletMode;
            }
            if (this.lastActiveSlideIndex === null) {
              this.lastActiveSlideIndex = 0; // Первый слайд
              this.animateFirstSlide();
            }
          }
          // Настраиваем анимации при переключении слайдов
          this.setupSlideAnimations();
        }, 100); // 100ms задержка для гарантии применения стилей и готовности страницы
      });
    });
  }

  /**
   * Анимирует появление элементов первого слайда при первой загрузке
   * Использует ту же логику, что и animateSlideContent для единообразия
   */
  animateFirstSlide() {
    const firstSlide = this.slidesContainer.querySelector(
      '.slide[data-slide="0"]'
    );
    if (!firstSlide) return;

    // Используем ту же функцию анимации, что и для переключения слайдов
    // Это гарантирует одинаковое поведение
    this.animateSlideContent(firstSlide);
  }

  /**
   * Перезапускает анимации для видимых слайдов при переключении режимов
   * Запускается только при реальном переключении между desktop и tablet/mobile
   */
  restartAnimationsOnModeChange() {
    if (!this.slidesContainer) return;

    const isTabletMode =
      this.slidesContainer.classList.contains('tablet-scroll-mode');

    // Проверка изменения режима уже выполнена в observer
    // Просто запускаем анимацию

    // Если анимация уже выполняется, отменяем предыдущую
    if (this.isAnimating) {
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
      }
      // Не возвращаемся, продолжаем с новой анимацией
    }

    this.isAnimating = true;

    const slides = this.slidesContainer.querySelectorAll('.slide');

    // Минимальная задержка для гарантии применения изменений режима
    this.animationTimeout = setTimeout(() => {
      if (isTabletMode) {
        // В tablet режиме все слайды видимы - анимируем все элементы одновременно
        // НЕ скрываем элементы, если они уже видимы, чтобы избежать мерцания
        const allElementsToAnimate = [];

        // Собираем все элементы всех слайдов для одновременной анимации
        slides.forEach((slide) => {
          // Проверяем, что слайд видим
          const style = window.getComputedStyle(slide);
          if (style.opacity !== '0' && style.visibility !== 'hidden') {
            const slideIndex = parseInt(slide.getAttribute('data-slide'));

            // Собираем элементы в зависимости от типа слайда
            if (slideIndex === 0) {
              // Первый слайд
              const textElements = slide.querySelectorAll(
                '.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text'
              );
              const portrait = slide.querySelector('.portrait-image');
              allElementsToAnimate.push(...Array.from(textElements));
              if (portrait) allElementsToAnimate.push(portrait);
            } else if (slideIndex === 4) {
              // CTA слайд
              const title = slide.querySelector('.section-title');
              const buttons = slide.querySelectorAll('.cta-button');
              const divider = slide.querySelector('.cta-divider');
              if (title) allElementsToAnimate.push(title);
              allElementsToAnimate.push(...Array.from(buttons));
              if (divider) allElementsToAnimate.push(divider);
            } else {
              // Проектные слайды (1-3)
              const elements = slide.querySelectorAll(
                '.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder'
              );
              allElementsToAnimate.push(...Array.from(elements));
            }
          }
        });

        // Проверяем, какие элементы нужно анимировать (только те, что еще не видимы)
        const elementsToAnimate = allElementsToAnimate.filter((element) => {
          if (!element) return false;
          const computedStyle = window.getComputedStyle(element);
          const opacity = parseFloat(computedStyle.opacity);
          const inlineOpacity = element.style.opacity;
          const inlineTransform = element.style.transform;

          // Если элемент уже полностью видим и не имеет inline стилей скрытия, не анимируем его
          if (
            opacity >= 0.99 &&
            (!inlineOpacity || inlineOpacity === '' || inlineOpacity === '1') &&
            (!inlineTransform ||
              inlineTransform === '' ||
              inlineTransform.includes('translateY(0'))
          ) {
            return false;
          }

          // Анимируем элемент, если он не полностью видим или имеет inline стили скрытия
          return true;
        });

        // Если есть элементы для анимации, скрываем их перед анимацией
        if (elementsToAnimate.length > 0) {
          elementsToAnimate.forEach((element) => {
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty(
              'transform',
              'translateY(10px)',
              'important'
            );
            element.style.setProperty('transition', 'none', 'important');
          });

          // Принудительный reflow для применения стилей скрытия
          if (elementsToAnimate.length > 0 && elementsToAnimate[0]) {
            void elementsToAnimate[0].offsetHeight;
          }
        }

        // Анимируем все элементы одновременно только если есть элементы для анимации
        // Если все элементы уже видимы, не запускаем анимацию, чтобы избежать мерцания
        if (elementsToAnimate.length > 0) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Используем animateElementsAppearance для одновременной анимации всех элементов
              animateElementsAppearance(elementsToAnimate, {
                skipInitialState: true,
              });
            });
          });
        } else {
          // Если все элементы уже видимы, просто сбрасываем флаг без анимации
          this.isAnimating = false;
          this.animationTimeout = null;
        }
      } else {
        // В desktop режиме анимируем только активный слайд
        // Скрываем элементы активного слайда перед анимацией
        const activeSlide = this.slidesContainer.querySelector('.slide.active');
        if (activeSlide) {
          this.hideSlideElementsBeforeAnimation(activeSlide);

          // Принудительный reflow для применения стилей скрытия
          if (activeSlide.firstElementChild) {
            void activeSlide.firstElementChild.offsetHeight;
          }

          // Используем requestAnimationFrame для синхронизации
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this.animateSlideContent(activeSlide);
            });
          });
        }
      }

      // Сбрасываем флаг после завершения анимации
      setTimeout(() => {
        this.isAnimating = false;
        this.animationTimeout = null;
      }, 500); // Время анимации + запас
    }, 50); // Минимальная задержка для гарантии применения изменений режима
  }

  /**
   * Настраивает анимации при переключении слайдов
   * Работает как в desktop, так и в tablet/mobile режимах
   */
  setupSlideAnimations() {
    if (!this.slidesContainer) return;

    // Наблюдаем за изменениями активного слайда
    this.slideObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const slide = mutation.target;
          if (
            slide.classList.contains('active') &&
            slide.classList.contains('slide')
          ) {
            const slideIndex = parseInt(slide.getAttribute('data-slide'));

            // Если это тот же слайд, не запускаем анимацию повторно
            if (
              this.lastActiveSlideIndex === slideIndex &&
              this.lastActiveSlideIndex !== null
            ) {
              return;
            }

            // Если происходит переключение режима, не запускаем анимацию
            if (this.isModeSwitching) {
              // Просто обновляем индекс активного слайда и делаем элементы видимыми
              this.lastActiveSlideIndex = slideIndex;
              this.showActiveSlideElements();
              return;
            }

            // Отменяем предыдущий таймер, если он есть
            if (this.slideAnimationTimeout) {
              clearTimeout(this.slideAnimationTimeout);
              this.slideAnimationTimeout = null;
            }

            // Обновляем последний активный слайд
            this.lastActiveSlideIndex = slideIndex;

            // Небольшая задержка для гарантии применения изменений класса и debounce
            this.slideAnimationTimeout = setTimeout(() => {
              this.animateSlideContent(slide);
              this.slideAnimationTimeout = null;
            }, 100); // Увеличена задержка для debounce
          }
        }
      });
    });

    // Наблюдаем за всеми слайдами
    const slides = this.slidesContainer.querySelectorAll('.slide');
    slides.forEach((slide) => {
      this.slideObserver.observe(slide, {
        attributes: true,
        attributeFilter: ['class'],
      });
    });

    // Наблюдаем за изменениями режима (tablet-scroll-mode) на контейнере
    // Только для отслеживания состояния, без запуска анимации при переключении режимов
    this.containerObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const target = mutation.target;
          if (target === this.slidesContainer) {
            const currentMode =
              this.slidesContainer.classList.contains('tablet-scroll-mode');
            const modeChanged = this.lastKnownMode !== currentMode;

            // При переключении из tablet в desktop делаем элементы активного слайда видимыми без анимации
            // Это должно быть обработано ПЕРВЫМ, до любых других операций
            if (
              modeChanged &&
              currentMode === false &&
              this.lastKnownMode === true
            ) {
              // Устанавливаем флаг переключения режима СИНХРОННО, до любых изменений DOM
              this.isModeSwitching = true;

              // Отменяем любые запланированные анимации слайдов
              if (this.slideAnimationTimeout) {
                clearTimeout(this.slideAnimationTimeout);
                this.slideAnimationTimeout = null;
              }

              // Обновляем lastKnownMode сразу, чтобы предотвратить повторные срабатывания
              this.lastKnownMode = currentMode;

              // Сразу делаем элементы активного слайда видимыми
              this.showActiveSlideElements();

              // Небольшая задержка для гарантии применения изменений режима
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  // Убеждаемся, что элементы видимы
                  this.showActiveSlideElements();

                  // Сбрасываем флаг после достаточной задержки, чтобы перекрыть возможные вызовы анимации
                  setTimeout(() => {
                    this.isModeSwitching = false;
                  }, 500); // Увеличена задержка для гарантии
                });
              });

              return; // Выходим, чтобы не обрабатывать другие случаи
            }

            // При переключении в tablet режим делаем все элементы видимыми
            if (modeChanged && currentMode === true) {
              // Устанавливаем флаг переключения режима
              this.isModeSwitching = true;

              // Обновляем lastKnownMode сразу
              this.lastKnownMode = currentMode;

              // Небольшая задержка для гарантии применения изменений режима
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  this.showAllSlideElements();

                  // Сбрасываем флаг после небольшой задержки
                  setTimeout(() => {
                    this.isModeSwitching = false;
                  }, 200);
                });
              });

              return; // Выходим, чтобы не обновлять lastKnownMode повторно
            }

            // Обновляем lastKnownMode при изменении режима (если не было обработано выше)
            if (modeChanged) {
              this.lastKnownMode = currentMode;
            }
          }
        }
      });
    });

    // Наблюдаем за контейнером слайдов для отслеживания переключения режимов
    this.containerObserver.observe(this.slidesContainer, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Инициализируем начальное состояние режима
    this.lastKnownMode =
      this.slidesContainer.classList.contains('tablet-scroll-mode');
  }

  /**
   * Делает все элементы всех слайдов видимыми при переключении в tablet режим
   * Убирает inline стили скрытия, чтобы элементы стали видимыми без анимации
   * @private
   */
  showAllSlideElements() {
    const slides = this.slidesContainer.querySelectorAll('.slide');
    slides.forEach((slide) => {
      const slideIndex = parseInt(slide.getAttribute('data-slide'));
      let elementsToShow = [];

      if (slideIndex === 0) {
        elementsToShow = slide.querySelectorAll(
          '.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image'
        );
      } else if (slideIndex === 4) {
        elementsToShow = slide.querySelectorAll(
          '.section-title, .cta-button, .cta-divider'
        );
      } else {
        elementsToShow = slide.querySelectorAll(
          '.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder'
        );
      }

      elementsToShow.forEach((element) => {
        if (element) {
          // Убираем все inline стили скрытия, чтобы элементы стали видимыми
          element.style.removeProperty('opacity');
          element.style.removeProperty('transform');
          element.style.removeProperty('transition');
        }
      });
    });
  }

  /**
   * Делает элементы активного слайда видимыми при переключении из tablet в desktop
   * Убирает inline стили скрытия без анимации
   * @private
   */
  showActiveSlideElements() {
    const activeSlide = this.slidesContainer.querySelector('.slide.active');
    if (!activeSlide) return;

    const slideIndex = parseInt(activeSlide.getAttribute('data-slide'));
    let elementsToShow = [];

    if (slideIndex === 0) {
      elementsToShow = activeSlide.querySelectorAll(
        '.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image'
      );
    } else if (slideIndex === 4) {
      elementsToShow = activeSlide.querySelectorAll(
        '.section-title, .cta-button, .cta-divider'
      );
    } else {
      elementsToShow = activeSlide.querySelectorAll(
        '.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder'
      );
    }

    elementsToShow.forEach((element) => {
      if (element) {
        // Убираем все inline стили скрытия, чтобы элементы стали видимыми
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
        element.style.removeProperty('transition');
      }
    });
  }

  /**
   * Скрывает элементы слайда перед анимацией
   * @param {HTMLElement} slide - Элемент слайда
   */
  hideSlideElementsBeforeAnimation(slide) {
    const slideIndex = parseInt(slide.getAttribute('data-slide'));

    // Первый слайд (слайд 0)
    if (slideIndex === 0) {
      const elementsToHide = slide.querySelectorAll(
        '.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image'
      );
      elementsToHide.forEach((el) => {
        if (el) {
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('transform', 'translateY(10px)', 'important');
          el.style.setProperty('transition', 'none', 'important');
        }
      });
      return;
    }

    // CTA слайд (слайд 4)
    if (slideIndex === 4) {
      const elementsToHide = slide.querySelectorAll(
        '.section-title, .cta-button, .cta-divider'
      );
      elementsToHide.forEach((el) => {
        if (el) {
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('transform', 'translateY(10px)', 'important');
          el.style.setProperty('transition', 'none', 'important');
        }
      });
      return;
    }

    // Проектные слайды (слайды 1-3)
    const elementsToHide = slide.querySelectorAll(
      '.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder'
    );
    elementsToHide.forEach((el) => {
      if (el) {
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('transform', 'translateY(10px)', 'important');
        el.style.setProperty('transition', 'none', 'important');
      }
    });
  }

  /**
   * Анимирует содержимое слайда при его активации
   * Работает как в desktop, так и в tablet/mobile режимах
   * @param {HTMLElement} slide - Элемент слайда для анимации
   */
  animateSlideContent(slide) {
    // Если происходит переключение режима, не запускаем анимацию
    if (this.isModeSwitching) {
      return;
    }

    const slideIndex = parseInt(slide.getAttribute('data-slide'));

    // Скрываем элементы слайда перед анимацией
    this.hideSlideElementsBeforeAnimation(slide);

    // Принудительный reflow для применения стилей
    if (slide.firstElementChild) {
      void slide.firstElementChild.offsetHeight;
    }

    // Используем requestAnimationFrame для синхронизации
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Небольшая задержка для гарантии применения стилей скрытия
        setTimeout(() => {
          // Первый слайд (слайд 0)
          if (slideIndex === 0) {
            const textElements = [
              '.main-content-name',
              '.main-content-tagline',
              '.main-content-title',
              '.cv-about-text',
            ];

            textElements.forEach((selector, index) => {
              const element = slide.querySelector(selector);
              if (element) {
                setTimeout(() => {
                  animateElementAppearance(element, { skipInitialState: true });
                }, index * 30);
              }
            });

            const portrait = slide.querySelector('.portrait-image');
            if (portrait) {
              setTimeout(() => {
                animateElementAppearance(portrait, { skipInitialState: true });
              }, textElements.length * 30);
            }
            return;
          }

          // CTA слайд (слайд 4)
          if (slideIndex === 4) {
            const title = slide.querySelector('.section-title');
            const buttons = slide.querySelectorAll('.cta-button');
            const divider = slide.querySelector('.cta-divider');

            if (title) {
              animateElementAppearance(title, { skipInitialState: true });
            }

            if (buttons.length > 0) {
              setTimeout(() => {
                buttons.forEach((button, index) => {
                  setTimeout(() => {
                    animateElementAppearance(button, {
                      skipInitialState: true,
                    });
                  }, index * 30);
                });
              }, 50);
            }

            if (divider) {
              setTimeout(
                () => {
                  animateElementAppearance(divider, { skipInitialState: true });
                },
                100 + buttons.length * 30
              );
            }

            return;
          }

          // Проектные слайды (слайды 1-3)
          const elementsToAnimate = [
            '.section-title',
            '.project-title',
            '.project-meta',
            '.project-placeholder',
            '.details-block',
          ];

          elementsToAnimate.forEach((selector, index) => {
            const elements = slide.querySelectorAll(selector);
            if (elements.length > 0) {
              setTimeout(() => {
                elements.forEach((element) => {
                  animateElementAppearance(element, { skipInitialState: true });
                });
              }, index * 30);
            }
          });

          // Анимируем preview изображения с небольшой задержкой
          const previewPlaceholders = slide.querySelectorAll(
            '.preview-placeholder'
          );
          if (previewPlaceholders.length > 0) {
            setTimeout(() => {
              previewPlaceholders.forEach((placeholder) => {
                animateElementAppearance(placeholder, {
                  skipInitialState: true,
                });
              });
            }, elementsToAnimate.length * 30);
          }
        }, 50); // 50ms задержка для гарантии применения стилей скрытия
      });
    });
  }

  /**
   * Скрывает элементы всех слайдов сразу при загрузке DOM
   * Это предотвращает видимость элементов до начала анимации
   * Работает как в desktop, так и в tablet/mobile режимах
   */
  hideAllSlideElementsImmediately() {
    if (!this.slidesContainer) return;

    const slides = this.slidesContainer.querySelectorAll('.slide');

    // Скрываем элементы всех слайдов
    slides.forEach((slide) => {
      const slideIndex = parseInt(slide.getAttribute('data-slide'));
      let elementsToHide = [];

      if (slideIndex === 0) {
        elementsToHide = slide.querySelectorAll(
          '.main-content-name, .main-content-tagline, .main-content-title, .cv-about-text, .portrait-image'
        );
      } else if (slideIndex === 4) {
        elementsToHide = slide.querySelectorAll(
          '.section-title, .cta-button, .cta-divider'
        );
      } else {
        elementsToHide = slide.querySelectorAll(
          '.section-title, .project-title, .project-meta, .project-placeholder, .details-block, .preview-placeholder'
        );
      }

      elementsToHide.forEach((el) => {
        if (el) {
          // Скрываем элементы сразу с высоким приоритетом
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('transform', 'translateY(10px)', 'important');
          el.style.setProperty('transition', 'none', 'important');
        }
      });
    });
  }
}
