/**
 * Менеджер скролла страницы
 * Управляет скрытием/показом header и footer при прокрутке
 */
export class ScrollManager {
  /**
   * @param {string} scrollContainerSelector - Селектор контейнера для скролла
   * @param {Function} isTabletModeCallback - Callback для уведомления об изменении режима
   */
  constructor(scrollContainerSelector, isTabletModeCallback) {
    this.scrollContainerSelector = scrollContainerSelector;
    this.isTabletModeCallback = isTabletModeCallback;
    this.scrollContainer = null;
    this.header = null;
    this.footer = null;
    this.decorativeLines = null;
    this.isTabletMode = false;
    this.lastScrollTop = 0;
    this.isInitialized = false;
  }

  /**
   * Инициализирует менеджер скролла
   */
  init() {
    this.scrollContainer = document.querySelector(this.scrollContainerSelector);
    if (!this.scrollContainer) return;

    this.header = document.querySelector('.header');
    this.footer = document.querySelector('.footer');
    this.decorativeLines = document.querySelectorAll(
      '.decorative-line-horizontal'
    );

    if (!this.header || !this.footer || this.decorativeLines.length === 0) {
      return;
    }

    // Проверяем, является ли это страницей со скроллом
    this.isScrollPage = document.body.classList.contains('page-with-scroll');

    this.checkViewportForScroll();
    window.addEventListener('resize', () => this.checkViewportForScroll());
  }

  /**
   * Определяет контейнер для скролла в зависимости от режима
   * @returns {HTMLElement|Window} Элемент для скролла
   */
  getScrollElement() {
    if (this.isTabletMode) {
      return this.scrollContainer;
    } else if (this.isScrollPage) {
      return window;
    }
    return this.scrollContainer;
  }

  /**
   * Получает высоту header и footer
   * @returns {number} Высота header/footer в пикселях
   */
  getHeaderFooterHeight() {
    if (!this.header || !this.footer) return 0;

    // Пытаемся получить значение из CSS переменной
    const root = document.documentElement;
    const cssValue = getComputedStyle(root).getPropertyValue(
      '--header-footer-height'
    );
    if (cssValue) {
      // Убираем 'px' и преобразуем в число
      const height = parseFloat(cssValue);
      if (!isNaN(height)) {
        return height;
      }
    }

    // Если CSS переменная недоступна, получаем из DOM
    const headerHeight = this.header.offsetHeight || 0;
    const footerHeight = this.footer.offsetHeight || 0;
    // Возвращаем максимальное значение (обычно они одинаковые)
    return Math.max(headerHeight, footerHeight);
  }

  /**
   * Проверяет, видимы ли header и footer (не скрыты)
   * @returns {boolean} true если header и footer видимы
   */
  areHeaderFooterVisible() {
    if (!this.header || !this.footer) return false;
    return (
      !this.header.classList.contains('hidden') &&
      !this.footer.classList.contains('hidden')
    );
  }

  /**
   * Обработчик события скролла
   */
  handleScroll() {
    const scrollElement = this.getScrollElement();
    let scrollTop;
    let scrollHeight;
    let clientHeight;

    if (scrollElement === window) {
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    } else {
      scrollTop = scrollElement.scrollTop;
      scrollHeight = scrollElement.scrollHeight;
      clientHeight = scrollElement.clientHeight;
    }

    // Для страниц со скроллом на десктопе всегда обрабатываем скролл
    // Для других страниц только в режиме планшета
    if (!this.isScrollPage && !this.isTabletMode) return;

    // Учитываем высоту header и footer при расчете atBottom, если они видимы
    // Когда header и footer видимы, они перекрывают контент, уменьшая доступную область прокрутки
    let effectiveClientHeight = clientHeight;
    if (this.areHeaderFooterVisible()) {
      const headerFooterHeight = this.getHeaderFooterHeight();
      // Вычитаем высоты header и footer из доступной высоты viewport
      effectiveClientHeight = clientHeight - headerFooterHeight * 2;
    }

    const atTop = scrollTop <= 2;
    const atBottom = scrollTop + effectiveClientHeight >= scrollHeight - 2;
    const scrollDelta = Math.abs(scrollTop - this.lastScrollTop);
    const isScrollingDown = scrollTop > this.lastScrollTop;
    const isScrollingUp = scrollTop < this.lastScrollTop;

    if (atTop || atBottom) {
      // Если вверху или внизу страницы, показываем хедер и футер
      this.header.classList.remove('hidden');
      this.footer.classList.remove('hidden');
      this.decorativeLines.forEach((line) => line.classList.remove('hidden'));
    } else if (isScrollingDown && scrollDelta > 1) {
      // Прокрутка вниз: скрываем хедер и футер
      this.header.classList.add('hidden');
      this.footer.classList.add('hidden');
      this.decorativeLines.forEach((line) => line.classList.add('hidden'));
    } else if (isScrollingUp && scrollDelta > 1) {
      // Прокрутка вверх: показываем хедер и футер
      this.header.classList.remove('hidden');
      this.footer.classList.remove('hidden');
      this.decorativeLines.forEach((line) => line.classList.remove('hidden'));
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  /**
   * Проверяет viewport и настраивает обработчики скролла
   */
  checkViewportForScroll() {
    // Определяем, является ли это главной страницей (есть контейнер слайдов)
    const isIndexPage = !!document.querySelector('.slides-container');

    // Обновляем isScrollPage на основе текущего состояния класса
    this.isScrollPage = document.body.classList.contains('page-with-scroll');

    // Для страницы проектов проверяем только ширину (<1024)
    // Для главной страницы проверяем ширину (<1024) ИЛИ высоту (<900)
    const isNowTablet = isIndexPage
      ? window.innerWidth < 1024 || window.innerHeight < 900
      : window.innerWidth < 1024;

    const wasTabletMode = this.isTabletMode;

    // Для страницы проектов проверяем изменение состояния только если режим действительно изменился
    if (
      isNowTablet === this.isTabletMode &&
      this.isScrollPage &&
      this.isInitialized
    ) {
      return;
    }

    this.isTabletMode = isNowTablet;

    if (this.isTabletModeCallback) {
      this.isTabletModeCallback(this.isTabletMode);
    }

    // Удаляем старые обработчики
    if (wasTabletMode) {
      this.scrollContainer.removeEventListener(
        'scroll',
        this.handleScrollBound
      );
    }
    if (this.isScrollPage && !wasTabletMode) {
      window.removeEventListener('scroll', this.handleScrollBound);
    }

    // Инициализируем lastScrollTop перед добавлением обработчиков
    let scrollElement;
    if (this.isTabletMode) {
      scrollElement = this.scrollContainer;
    } else if (this.isScrollPage) {
      scrollElement = window;
    } else {
      scrollElement = this.scrollContainer;
    }

    if (scrollElement === window) {
      this.lastScrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
    } else {
      this.lastScrollTop = scrollElement.scrollTop;
    }

    // Привязываем обработчик
    this.handleScrollBound = this.handleScroll.bind(this);

    // Добавляем новые обработчики
    if (this.isTabletMode) {
      this.scrollContainer.addEventListener('scroll', this.handleScrollBound);
      this.handleScroll();
    } else if (this.isScrollPage) {
      window.addEventListener('scroll', this.handleScrollBound, {
        passive: true,
      });
      this.handleScroll();
    } else {
      this.header.classList.remove('hidden');
      this.footer.classList.remove('hidden');
      this.decorativeLines.forEach((line) => line.classList.remove('hidden'));
    }

    this.isInitialized = true;
  }
}
