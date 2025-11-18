/**
 * Менеджер скролла страницы
 * Управляет скрытием/показом header и footer при прокрутке на desktop
 * На mobile/tablet header и footer всегда видны и зафиксированы
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
    this.ticking = false; // Флаг для requestAnimationFrame
    this.isScrolling = false; // Флаг активной прокрутки
    this.scrollTimeout = null; // Таймаут для определения окончания прокрутки
    this.headerFooterHeight = 0; // Кешированная высота хедера/футера
    this.currentTranslateY = 0; // Текущее смещение хедера/футера (только для desktop)
    this.scrollToTopButton = null; // Ссылка на кнопку "наверх"
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

    // Кешируем высоту хедера/футера
    this.updateHeaderFooterHeight();

    this.checkViewportForScroll();
    window.addEventListener('resize', () => {
      this.updateHeaderFooterHeight();
      this.updateSpacerElement();
      this.checkViewportForScroll();
    });
  }

  /**
   * Обновляет кешированную высоту header и footer
   */
  updateHeaderFooterHeight() {
    this.headerFooterHeight = this.getHeaderFooterHeight();
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
    // На мобильных устройствах используем больший запас из-за плавающей адресной строки
    // и других особенностей браузеров
    const extraSpace = this.isTabletMode ? 60 : 20;
    // Это гарантирует, что когда footer появится, он не перекроет контент
    // и пользователь сможет прокрутить до самого низа
    this.spacerElement.style.height = `${headerFooterHeight + extraSpace}px`;
  }

  /**
   * Обработчик события скролла с оптимизацией через requestAnimationFrame
   */
  handleScroll() {
    // Отмечаем, что идет прокрутка
    this.isScrolling = true;

    // Сбрасываем таймаут окончания прокрутки
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Устанавливаем новый таймаут для определения окончания прокрутки
    this.scrollTimeout = setTimeout(() => {
      this.onScrollEnd();
    }, 150);

    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.updateHeaderFooterVisibility();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  /**
   * Обработчик окончания прокрутки
   */
  onScrollEnd() {
    this.isScrolling = false;

    // На мобильных/планшетах header и footer всегда видны
    if (this.isTabletMode) return;

    // Только для страниц со скроллом на десктопе
    if (!this.isScrollPage) return;

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

    const atTop = scrollTop <= 10;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;

    // Если на верху или внизу страницы - показываем полностью
    if (atTop || atBottom) {
      this.animateToFullyVisible();
      return;
    }

    // На десктопе проверяем, больше ли половины скрыто
    if (Math.abs(this.currentTranslateY) > this.headerFooterHeight / 2) {
      this.animateToFullyHidden();
    } else {
      this.animateToFullyVisible();
    }
  }

  /**
   * Анимирует header и footer до полностью видимого состояния
   */
  animateToFullyVisible() {
    this.currentTranslateY = 0;
    this.showHeaderFooter();
  }

  /**
   * Анимирует header и footer до полностью скрытого состояния
   */
  animateToFullyHidden() {
    this.currentTranslateY = -this.headerFooterHeight;
    this.hideHeaderFooter();
  }

  /**
   * Обновляет видимость header и footer
   */
  updateHeaderFooterVisibility() {
    // На мобильных/планшетах header и footer всегда видны
    if (this.isTabletMode) return;

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
    if (!this.isScrollPage) return;

    // Проверяем достижение верха и низа страницы
    const atTop = scrollTop <= 10;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    
    const scrollDelta = scrollTop - this.lastScrollTop;
    const isScrollingDown = scrollDelta > 0;
    const isScrollingUp = scrollDelta < 0;

    // На десктопе используем логику с классами
    const minDelta = 0.5;

    if (atTop || atBottom) {
      this.showHeaderFooter();
    } else if (isScrollingDown && Math.abs(scrollDelta) > minDelta) {
      this.hideHeaderFooter();
    } else if (isScrollingUp && Math.abs(scrollDelta) > minDelta) {
      this.showHeaderFooter();
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  /**
   * Устанавливает ссылку на ScrollToTopButton для синхронного обновления
   * @param {ScrollToTopButton} button - Экземпляр кнопки
   */
  setScrollToTopButton(button) {
    this.scrollToTopButton = button;
  }

  /**
   * Показывает header и footer
   */
  showHeaderFooter() {
    this.header.classList.remove('hidden');
    this.footer.classList.remove('hidden');
    this.decorativeLines.forEach((line) => line.classList.remove('hidden'));
    this.currentTranslateY = 0;
  }

  /**
   * Скрывает header и footer
   */
  hideHeaderFooter() {
    this.header.classList.add('hidden');
    this.footer.classList.add('hidden');
    this.decorativeLines.forEach((line) => line.classList.add('hidden'));
    this.currentTranslateY = -this.headerFooterHeight;
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

    // При переключении режимов сбрасываем состояние
    if (wasTabletMode !== this.isTabletMode) {
      if (this.isTabletMode) {
        // Переход в tablet режим - показываем header и footer
        this.showHeaderFooter();
        this.currentTranslateY = 0;
      } else {
        // Переход в desktop режим - сбрасываем состояние
        this.currentTranslateY = 0;
      }
    }

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
      if (!this.isTabletMode) {
        this.updateHeaderFooterVisibility();
      }
    } else {
      // Для десктоп режима без скролла показываем header и footer
      this.showHeaderFooter();
    }

    this.isInitialized = true;
  }

  /**
   * Возвращает текущее смещение футера для других компонентов
   * @returns {number} Смещение в пикселях (положительное значение = виден больше)
   */
  getFooterOffset() {
    // На мобильных/планшетах footer всегда видим, смещение = 0
    if (this.isTabletMode) return 0;
    // На десктопе проверяем класс hidden
    return this.footer && this.footer.classList.contains('hidden') ? this.headerFooterHeight : 0;
  }
}
