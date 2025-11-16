/**
 * Кнопка прокрутки страницы наверх с анимацией появления/скрытия
 */
export class ScrollToTopButton {
  /**
   * @param {string} buttonId - ID кнопки (по умолчанию 'scroll-to-top')
   */
  constructor(buttonId = 'scroll-to-top') {
    this.buttonId = buttonId;
    this.scrollToTopButton = null;
    this.footer = null;
    this.pageWrapper = null;
    this.lastScrollTop = 0;
    this.hideTimeout = null;
    this.isAnimating = false;
    this.wasShown = false;
    this.wasScrollingDown = false;
    this.initAttempts = 0;
    this.MAX_INIT_ATTEMPTS = 10;
  }

  /**
   * Инициализирует кнопку
   */
  init() {
    this.scrollToTopButton = document.getElementById(this.buttonId);
    if (!this.scrollToTopButton) {
      // Если кнопка еще не загружена, пробуем еще раз через небольшую задержку
      this.initAttempts++;
      if (this.initAttempts < this.MAX_INIT_ATTEMPTS) {
        setTimeout(() => {
          this.init();
        }, 100);
      } else {
        console.warn(
          'Кнопка "Наверх" не найдена после нескольких попыток инициализации'
        );
      }
      return;
    }

    // Сбрасываем счетчик попыток при успешной инициализации
    this.initAttempts = 0;

    this.footer = document.querySelector('.footer');
    this.pageWrapper = document.querySelector('.page-wrapper');

    this.setupEventListeners();
    this.lastScrollTop = this.getScrollTop();
    this.handleScroll();
    this.updateButtonPosition();
  }

  /**
   * Определяет, находимся ли мы в tablet режиме
   * @returns {boolean} true если ширина окна меньше 1024px
   */
  isTabletMode() {
    return window.innerWidth < 1024;
  }

  /**
   * Получает элемент для скролла
   * @returns {HTMLElement|Window} Элемент для скролла
   */
  getScrollElement() {
    return this.isTabletMode() && this.pageWrapper ? this.pageWrapper : window;
  }

  /**
   * Получает текущую позицию скролла
   * @returns {number} Позиция скролла в пикселях
   */
  getScrollTop() {
    const scrollElement = this.getScrollElement();
    if (scrollElement === window) {
      return window.pageYOffset || document.documentElement.scrollTop;
    } else {
      return scrollElement.scrollTop;
    }
  }

  /**
   * Обновляет позицию кнопки в зависимости от состояния футера
   */
  updateButtonPosition() {
    if (!this.footer) {
      this.scrollToTopButton.classList.remove('footer-hidden');
      return;
    }

    const isFooterHidden = this.footer.classList.contains('hidden');

    if (isFooterHidden) {
      this.scrollToTopButton.classList.add('footer-hidden');
    } else {
      this.scrollToTopButton.classList.remove('footer-hidden');
    }
  }

  /**
   * Показывает кнопку с анимацией
   */
  showButton() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
      this.isAnimating = false;
    }

    // Если кнопка уже видима, просто обновляем позицию без анимации
    if (
      this.scrollToTopButton.classList.contains('visible') &&
      !this.isAnimating
    ) {
      this.updateButtonPosition();
      return;
    }

    // Анимация показывается только один раз при первом появлении или после скрытия
    const shouldAnimate =
      !this.wasShown || this.scrollToTopButton.style.display === 'none';

    if (shouldAnimate) {
      this.isAnimating = true;

      // Убеждаемся, что элемент видим
      if (this.scrollToTopButton.style.display === 'none') {
        this.scrollToTopButton.style.display = 'flex';
      }

      // Убираем класс visible, если он был, чтобы сбросить состояние для анимации
      this.scrollToTopButton.classList.remove('visible');

      // Обновляем позицию до показа
      this.updateButtonPosition();

      // Ждем кадр, чтобы браузер успел применить начальное состояние (opacity: 0), затем добавляем класс для анимации
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.scrollToTopButton.classList.add('visible');
          this.wasShown = true;
          setTimeout(() => {
            this.isAnimating = false;
          }, 300);
        });
      });
    } else {
      // Если кнопка уже была показана, просто делаем её видимой без анимации
      if (this.scrollToTopButton.style.display === 'none') {
        this.scrollToTopButton.style.display = 'flex';
      }
      this.scrollToTopButton.classList.add('visible');
      this.updateButtonPosition();
    }
  }

  /**
   * Скрывает кнопку с анимацией
   */
  hideButton() {
    if (
      !this.scrollToTopButton.classList.contains('visible') &&
      this.scrollToTopButton.style.display === 'none'
    ) {
      return;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.isAnimating = true;
    this.scrollToTopButton.classList.remove('visible');

    this.hideTimeout = setTimeout(() => {
      if (!this.scrollToTopButton.classList.contains('visible')) {
        this.scrollToTopButton.style.display = 'none';
        // Сбрасываем флаг, чтобы при следующем показе была анимация
        this.wasShown = false;
      }
      this.isAnimating = false;
      this.hideTimeout = null;
    }, 300);
  }

  /**
   * Обработчик скролла
   */
  handleScroll() {
    const scrollTop = this.getScrollTop();
    const isScrollingUp = scrollTop < this.lastScrollTop;
    const isAtTop = scrollTop <= 0;

    if (isScrollingUp && !isAtTop) {
      // Определяем, изменилось ли направление прокрутки с вниз на вверх
      const directionChanged = this.wasScrollingDown && isScrollingUp;

      // Показываем кнопку с анимацией только при изменении направления с вниз на вверх
      // или если кнопка еще не была показана
      if (directionChanged || !this.wasShown) {
        this.showButton();
      } else {
        // Если кнопка уже видима и мы продолжаем прокручивать вверх,
        // просто обновляем позицию без анимации
        if (this.scrollToTopButton.classList.contains('visible')) {
          this.updateButtonPosition();
        } else {
          // Если кнопка не видима, но мы прокручиваем вверх, показываем её без анимации
          if (this.scrollToTopButton.style.display === 'none') {
            this.scrollToTopButton.style.display = 'flex';
          }
          this.scrollToTopButton.classList.add('visible');
          this.updateButtonPosition();
        }
      }
      this.wasScrollingDown = false;
    } else {
      // Прокручиваем вниз или в самом верху
      if (!isAtTop) {
        this.wasScrollingDown = true;
      }
      this.hideButton();
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

    requestAnimationFrame(() => {
      this.updateButtonPosition();
    });
  }

  /**
   * Настраивает обработчики событий
   */
  setupEventListeners() {
    // Обработчик клика - плавный скролл наверх
    this.scrollToTopButton.addEventListener('click', () => {
      const scrollElement = this.getScrollElement();
      if (scrollElement === window) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      } else {
        scrollElement.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    });

    // Наблюдаем за изменениями класса футера
    if (this.footer) {
      const footerObserver = new MutationObserver(() => {
        requestAnimationFrame(() => {
          this.updateButtonPosition();
        });
      });

      footerObserver.observe(this.footer, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    // Настраиваем обработчик скролла
    this.setupScrollListener();

    // Обновляем обработчик при изменении размера окна
    window.addEventListener('resize', () => {
      this.updateScrollListener();
      this.handleScroll();
    });
  }

  /**
   * Настраивает обработчик скролла
   */
  setupScrollListener() {
    const scrollElement = this.getScrollElement();
    this.handleScrollBound = this.handleScroll.bind(this);
    if (scrollElement === window) {
      window.addEventListener('scroll', this.handleScrollBound, {
        passive: true,
      });
    } else {
      scrollElement.addEventListener('scroll', this.handleScrollBound, {
        passive: true,
      });
    }
  }

  /**
   * Обновляет обработчик скролла
   */
  updateScrollListener() {
    window.removeEventListener('scroll', this.handleScrollBound);
    if (this.pageWrapper) {
      this.pageWrapper.removeEventListener('scroll', this.handleScrollBound);
    }
    this.lastScrollTop = this.getScrollTop();
    this.setupScrollListener();
  }
}
