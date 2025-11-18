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
    this.spacerElement = null; // Фиктивный элемент для резервирования места под footer
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
    window.addEventListener('resize', () => {
      this.updateSpacerElement();
      this.checkViewportForScroll();
    });
  }

  /**
   * Определяет контейнер для скролла в зависимости от режима
   * @returns {HTMLElement|Window} Элемент для скролла
   */
  getScrollElement() {
    // На мобильных/планшетных устройствах прокрутка происходит на body (window)
    // На десктопе для страниц с прокруткой также используется window
    if (this.isTabletMode || this.isScrollPage) {
      return window;
    }
    // Только на десктопе для главной страницы используется scrollContainer
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
   * Создает фиктивный элемент внизу страницы для резервирования места под footer
   */
  createSpacerElement() {
    // Находим контейнер для скролла
    // На мобильных скролл идет в page-wrapper, поэтому добавляем туда
    // Ищем page-wrapper напрямую, так как он является контейнером для скролла
    let targetContainer = document.querySelector('.page-wrapper');
    if (!targetContainer) {
      // Если page-wrapper не найден, используем scrollContainer
      targetContainer = this.scrollContainer;
    }
    if (!targetContainer) {
      // Если и scrollContainer не найден, используем content-wrapper как запасной вариант
      targetContainer = document.querySelector('.content-wrapper');
    }
    if (!targetContainer) return;

    // Удаляем существующий элемент, если есть
    if (this.spacerElement) {
      this.spacerElement.remove();
    }

    // Создаем новый фиктивный элемент
    this.spacerElement = document.createElement('div');
    this.spacerElement.className = 'scroll-spacer-footer';
    this.spacerElement.style.cssText = `
      width: 100%;
      height: 0;
      pointer-events: none;
      visibility: hidden;
      flex-shrink: 0;
      box-sizing: border-box;
    `;

    // Добавляем в конец контейнера для скролла
    targetContainer.appendChild(this.spacerElement);

    // Обновляем высоту
    this.updateSpacerElement();
  }

  /**
   * Обновляет высоту фиктивного элемента
   */
  updateSpacerElement() {
    if (!this.spacerElement) return;

    const headerFooterHeight = this.getHeaderFooterHeight();
    // Устанавливаем высоту равную высоте footer плюс запас
    // Увеличиваем запас до 20px для надежности на мобильных устройствах
    // Это гарантирует, что когда footer появится, он не перекроет контент
    // и пользователь сможет прокрутить до самого низа
    this.spacerElement.style.height = `${headerFooterHeight + 20}px`;
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

    // Проверяем достижение низа страницы
    // Фиктивный элемент уже занимает место под footer, поэтому просто проверяем реальный низ
    const atTop = scrollTop <= 2;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 2;
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

    // Создаем фиктивный элемент при первой инициализации, если нужно
    if (!this.isInitialized && (this.isScrollPage || window.innerWidth < 1024)) {
      const willBeTablet = isIndexPage
        ? window.innerWidth < 1024 || window.innerHeight < 900
        : window.innerWidth < 1024;
      if (willBeTablet || this.isScrollPage) {
        this.createSpacerElement();
      }
    }

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

    // Создаем или обновляем фиктивный элемент при изменении режима
    // Фиктивный элемент нужен только в режиме tablet или на страницах со скроллом
    if (this.isTabletMode || this.isScrollPage) {
      if (!this.spacerElement) {
        this.createSpacerElement();
      } else {
        this.updateSpacerElement();
      }
    } else if (this.spacerElement) {
      // Удаляем фиктивный элемент, если он не нужен
      this.spacerElement.remove();
      this.spacerElement = null;
    }

    if (this.isTabletModeCallback) {
      this.isTabletModeCallback(this.isTabletMode);
    }

    // Удаляем старые обработчики
    // Если был режим tablet или isScrollPage, удаляем обработчик с window
    if (wasTabletMode || (this.isScrollPage && !wasTabletMode)) {
      window.removeEventListener('scroll', this.handleScrollBound);
    }
    // Если не был режим tablet и не isScrollPage, удаляем обработчик со scrollContainer
    if (!wasTabletMode && !this.isScrollPage) {
      this.scrollContainer.removeEventListener(
        'scroll',
        this.handleScrollBound
      );
    }

    // Инициализируем lastScrollTop перед добавлением обработчиков
    const scrollElement = this.getScrollElement();

    if (scrollElement === window) {
      this.lastScrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
    } else {
      this.lastScrollTop = scrollElement.scrollTop;
    }

    // Привязываем обработчик
    this.handleScrollBound = this.handleScroll.bind(this);

    // Добавляем новые обработчики
    // На мобильных/планшетных и страницах с прокруткой используем window
    if (this.isTabletMode || this.isScrollPage) {
      window.addEventListener('scroll', this.handleScrollBound, {
        passive: true,
      });
      // Устанавливаем начальное состояние при инициализации
      this.handleScroll();
    } else {
      // Для десктоп режима без скролла показываем header и footer
      this.header.classList.remove('hidden');
      this.footer.classList.remove('hidden');
      this.decorativeLines.forEach((line) => line.classList.remove('hidden'));
    }

    this.isInitialized = true;
  }
}
