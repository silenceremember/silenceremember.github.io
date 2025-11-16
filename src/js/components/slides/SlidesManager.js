/**
 * Менеджер слайдов для главной страницы
 * Управляет переключением слайдов, анимациями и режимами отображения
 */
import { ScrollManager } from '../scroll/ScrollManager.js';

export class SlidesManager {
  /**
   * Создает экземпляр менеджера слайдов
   */
  constructor() {
    this.slidesContainer = null;
    this.slides = null;
    this.progressContainer = null;
    this.header = null;
    this.footer = null;
    this.decorativeLines = null;
    this.currentSlideIndex = 0;
    this.isScrolling = false;
    this.SLIDE_TRANSITION_DURATION = 300;
    this.scrollTimeout = this.SLIDE_TRANSITION_DURATION + 50;
    this.progressDots = [];
    this.slideTransitionTimeout = null;
    this.isTabletMode = false;
    this.menuButton = null;
    this.ctaSection = null;
    this.slideHint = null;
    this.HINT_DELAY = 7000;
    this.hintTimeout = null;
    this.hintShown = false;
    this.hasLeftFirstSlide = false;
    this.scrollManager = null;
  }

  /**
   * Инициализирует менеджер слайдов
   */
  init() {
    this.slidesContainer = document.querySelector('.slides-container');
    this.slides = document.querySelectorAll('.slide');
    this.progressContainer = document.querySelector('.footer-decorative');
    this.header = document.querySelector('.header');
    this.footer = document.querySelector('.footer');
    this.decorativeLines = document.querySelectorAll(
      '.decorative-line-horizontal'
    );

    if (
      !this.slidesContainer ||
      this.slides.length === 0 ||
      !this.progressContainer ||
      !this.header ||
      !this.footer ||
      this.decorativeLines.length === 0
    ) {
      return;
    }

    this.menuButton = document.querySelector('.header-menu-button');
    this.ctaSection = document.getElementById('cta-section');
    this.slideHint = document.getElementById('slide-hint');

    if (this.menuButton) {
      this.menuButton.addEventListener('click', () => {
        if (this.isTabletMode && this.ctaSection) {
          this.ctaSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Инициализируем индикаторы
    this.createProgressDots();

    // Первоначальная настройка - сначала убедимся, что все слайды скрыты
    this.slides.forEach((slide) => {
      slide.classList.remove('active');
    });

    // Инициализируем обработчик скролла
    this.scrollManager = new ScrollManager('.page-wrapper', (isTablet) => {
      this.isTabletMode = isTablet;
      this.checkViewport(isTablet);
    });
    this.scrollManager.init();

    // Настраиваем обработчик колесика мыши
    this.setupWheelHandler();

    // Первоначальная настройка после определения режима
    if (!this.isTabletMode) {
      this.showSlideImmediate(0);
      // Запускаем таймер подсказки для первого слайда
      this.startHintTimer();
    }
  }

  /**
   * Показывает подсказку о прокрутке на первом слайде
   */
  showHint() {
    if (
      this.slideHint &&
      !this.isTabletMode &&
      this.currentSlideIndex === 0 &&
      !this.hintShown &&
      !this.hasLeftFirstSlide
    ) {
      this.slideHint.classList.add('visible');
      this.hintShown = true;
    }
  }

  /**
   * Скрывает подсказку
   */
  hideHint() {
    if (this.slideHint) {
      this.slideHint.classList.remove('visible');
      this.hintShown = false;
    }
  }

  /**
   * Запускает таймер подсказки
   */
  startHintTimer() {
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }

    this.hideHint();

    if (
      this.currentSlideIndex === 0 &&
      !this.isTabletMode &&
      this.slideHint &&
      !this.hasLeftFirstSlide
    ) {
      this.hintTimeout = setTimeout(() => {
        this.showHint();
      }, this.HINT_DELAY);
    }
  }

  /**
   * Останавливает таймер подсказки
   */
  stopHintTimer() {
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }
    this.hideHint();
  }

  /**
   * Проверяет размер окна и настраивает режим отображения
   * @param {boolean} isTablet - Флаг режима планшета
   */
  checkViewport(isTablet) {
    if (isTablet) {
      this.slidesContainer.classList.add('tablet-scroll-mode');
      document.documentElement.classList.add('page-with-scroll');
      document.body.classList.add('page-with-scroll');

      // Восстанавливаем кнопку "наверх" при переходе в tablet/mobile
      const scrollToTopButton = document.getElementById('scroll-to-top');
      if (scrollToTopButton) {
        scrollToTopButton.style.display = '';
        scrollToTopButton.style.opacity = '';
        scrollToTopButton.style.visibility = '';
        scrollToTopButton.style.transition = '';
      }

      // В tablet-scroll-mode все слайды должны быть видимы
      this.slides.forEach((slide) => {
        slide.classList.remove('active');
        slide.style.opacity = '1';
        slide.style.visibility = 'visible';
        slide.style.display = 'block';
        slide.style.position = 'static';
      });

      // Немедленно скрываем подсказку без анимации при переходе в tablet/mobile
      if (this.slideHint) {
        this.slideHint.classList.remove('visible');
        this.slideHint.style.opacity = '0';
        this.slideHint.style.visibility = 'hidden';
        this.slideHint.style.transition = 'none';
        this.hintShown = false;
      }

      this.stopHintTimer();
    } else {
      this.slidesContainer.classList.add('is-resizing');
      this.slidesContainer.classList.remove('tablet-scroll-mode');
      document.documentElement.classList.remove('page-with-scroll');
      document.body.classList.remove('page-with-scroll');

      // Немедленно скрываем кнопку "наверх" без анимации при переходе в desktop
      const scrollToTopButton = document.getElementById('scroll-to-top');
      if (scrollToTopButton) {
        scrollToTopButton.classList.remove('visible');
        scrollToTopButton.style.display = 'none';
        scrollToTopButton.style.opacity = '0';
        scrollToTopButton.style.visibility = 'hidden';
        scrollToTopButton.style.transition = 'none';
      }

      // Восстанавливаем подсказку при возврате в desktop
      if (this.slideHint) {
        this.slideHint.style.opacity = '';
        this.slideHint.style.visibility = '';
        this.slideHint.style.transition = '';
      }

      // Убираем inline стили при возврате в desktop режим
      this.slides.forEach((slide) => {
        slide.style.opacity = '';
        slide.style.visibility = '';
        slide.style.display = '';
        slide.style.position = '';
      });

      this.showSlideImmediate(this.currentSlideIndex);
      setTimeout(() => {
        this.slidesContainer.classList.remove('is-resizing');
        const button = document.getElementById('scroll-to-top');
        if (button) {
          button.style.transition = '';
        }
      }, 50);

      // Запускаем таймер подсказки, если мы на первом слайде
      if (this.currentSlideIndex === 0) {
        this.startHintTimer();
      }
    }
  }

  /**
   * Создает индикаторы прогресса
   */
  createProgressDots() {
    this.progressContainer.innerHTML = '';
    this.progressDots.length = 0;

    this.slides.forEach((slide, index) => {
      const dot = document.createElement('div');
      dot.classList.add('footer-decorative-square');
      dot.setAttribute('data-slide-index', index);
      dot.addEventListener('click', () => this.changeSlide(index));
      this.progressContainer.appendChild(dot);
      this.progressDots.push(dot);
    });
  }

  /**
   * Показывает активный слайд без анимации
   * @param {number} index - Индекс слайда для отображения
   */
  showSlideImmediate(index) {
    this.currentSlideIndex = index;

    this.slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    this.progressDots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  /**
   * Показывает активный слайд с обновлением индикаторов
   * @param {number} index - Индекс слайда для отображения
   */
  showSlide(index) {
    // Отслеживаем, покидали ли мы первый слайд
    if (this.currentSlideIndex === 0 && index !== 0) {
      this.hasLeftFirstSlide = true;
    }

    this.currentSlideIndex = index;
    this.slides.forEach((slide, i) =>
      slide.classList.toggle('active', i === index)
    );
    this.progressDots.forEach((dot, i) =>
      dot.classList.toggle('active', i === index)
    );

    // Управление подсказкой
    if (index === 0 && !this.isTabletMode && !this.hasLeftFirstSlide) {
      this.startHintTimer();
    } else {
      this.stopHintTimer();
    }
  }

  /**
   * Переключает слайд на указанный индекс
   * @param {number} newIndex - Индекс нового слайда
   */
  changeSlide(newIndex) {
    if (this.isScrolling) return;

    if (newIndex >= 0 && newIndex < this.slides.length) {
      // Сбрасываем выделение текста
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }

      this.isScrolling = true;
      this.showSlide(newIndex);
      setTimeout(() => {
        this.isScrolling = false;
      }, this.scrollTimeout);
    }
  }

  /**
   * Настраивает обработчик колесика мыши
   */
  setupWheelHandler() {
    window.addEventListener('wheel', (event) => {
      if (this.isScrolling || this.isTabletMode) return;

      // Скрываем подсказку при прокрутке
      this.stopHintTimer();

      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = this.currentSlideIndex + direction;
      this.changeSlide(nextIndex);
    });
  }
}
