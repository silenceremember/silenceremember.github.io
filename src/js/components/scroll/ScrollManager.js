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
    this.ticking = false; // Флаг для requestAnimationFrame
    this.lastKnownScrollPosition = 0;
    this.isScrolling = false; // Флаг активной прокрутки
    this.scrollTimeout = null; // Таймаут для определения окончания прокрутки
    this.headerFooterHeight = 0; // Кешированная высота хедера/футера
    this.currentTranslateY = 0; // Текущее смещение хедера/футера (от 0 до headerFooterHeight)
    this.currentFooterOffset = 0; // Текущее смещение футера для других компонентов
    this.scrollToTopButton = null; // Ссылка на кнопку "наверх" для синхронного обновления
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

    // Для страниц со скроллом на десктопе всегда обрабатываем скролл
    // Для других страниц только в режиме планшета
    if (!this.isScrollPage && !this.isTabletMode) return;

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
    const bottomThreshold = this.isTabletMode ? 50 : 10;
    const atBottom = scrollTop + clientHeight >= scrollHeight - bottomThreshold;

    // Если на верху или внизу страницы - показываем полностью
    if (atTop || atBottom) {
      this.animateToFullyVisible();
      return;
    }

    // На мобильных устройствах применяем логику "больше половины"
    if (this.isTabletMode) {
      const visiblePercentage = (this.headerFooterHeight - Math.abs(this.currentTranslateY)) / this.headerFooterHeight;
      
      if (visiblePercentage > 0.5) {
        // Показалось больше половины - доводим до полного показа
        this.animateToFullyVisible();
      } else {
        // Показалось меньше половины - скрываем
        this.animateToFullyHidden();
      }
    } else {
      // На десктопе используем старую логику
      if (Math.abs(this.currentTranslateY) > this.headerFooterHeight / 2) {
        this.animateToFullyHidden();
      } else {
        this.animateToFullyVisible();
      }
    }
  }

  /**
   * Анимирует header и footer до полностью видимого состояния
   */
  animateToFullyVisible() {
    this.currentTranslateY = 0;
    this.enableTransitions();
    
    if (this.isTabletMode) {
      // На мобильных используем transform с transition
      this.applyPartialTransform(0, true);
      // Убираем класс hidden для совместимости
      this.header.classList.remove('hidden');
      this.footer.classList.remove('hidden');
      this.decorativeLines.forEach((line) => line.classList.remove('hidden'));
    } else {
      this.showHeaderFooter();
    }
  }

  /**
   * Анимирует header и footer до полностью скрытого состояния
   */
  animateToFullyHidden() {
    this.currentTranslateY = -this.headerFooterHeight;
    this.enableTransitions();
    
    if (this.isTabletMode) {
      // На мобильных используем transform с transition
      this.applyPartialTransform(-this.headerFooterHeight, true);
      // Добавляем класс hidden для совместимости
      this.header.classList.add('hidden');
      this.footer.classList.add('hidden');
      this.decorativeLines.forEach((line) => line.classList.add('hidden'));
    } else {
      this.hideHeaderFooter();
    }
  }

  /**
   * Включает CSS transitions для плавной анимации
   */
  enableTransitions() {
    if (this.isTabletMode) {
      this.header.style.transition = 'transform 0.3s ease';
      this.footer.style.transition = 'transform 0.3s ease';
      this.decorativeLines.forEach((line) => {
        line.style.transition = 'transform 0.3s ease';
      });
    }
  }

  /**
   * Отключает CSS transitions для прямого управления
   */
  disableTransitions() {
    if (this.isTabletMode) {
      this.header.style.transition = 'none';
      this.footer.style.transition = 'none';
      this.decorativeLines.forEach((line) => {
        line.style.transition = 'none';
      });
    }
  }

  /**
   * Обновляет видимость header и footer
   */
  updateHeaderFooterVisibility() {
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

    // Проверяем достижение верха и низа страницы
    const atTop = scrollTop <= 10;
    const bottomThreshold = this.isTabletMode ? 50 : 10;
    const atBottom = scrollTop + clientHeight >= scrollHeight - bottomThreshold;
    
    const scrollDelta = scrollTop - this.lastScrollTop;
    const isScrollingDown = scrollDelta > 0;
    const isScrollingUp = scrollDelta < 0;

    // На мобильных устройствах применяем постепенное появление
    if (this.isTabletMode && this.isScrolling) {
      if (atTop || atBottom) {
        // На верху или внизу - плавно показываем полностью
        if (this.currentTranslateY !== 0) {
          this.currentTranslateY = 0;
          this.enableTransitions();
          this.applyPartialTransform(0, true);
        }
      } else {
        // Постепенное движение в зависимости от прокрутки
        // Отключаем transitions для плавного следования за пальцем
        this.disableTransitions();
        
        if (isScrollingUp) {
          // Прокрутка вверх - показываем header/footer
          this.currentTranslateY = Math.min(0, this.currentTranslateY + Math.abs(scrollDelta));
        } else if (isScrollingDown) {
          // Прокрутка вниз - скрываем header/footer
          this.currentTranslateY = Math.max(-this.headerFooterHeight, this.currentTranslateY - Math.abs(scrollDelta));
        }
        
        this.applyPartialTransform(this.currentTranslateY, true);
      }
    } else if (!this.isTabletMode) {
      // На десктопе используем старую логику с классами
      const minDelta = 0.5;

      if (atTop || atBottom) {
        this.showHeaderFooter();
      } else if (isScrollingDown && Math.abs(scrollDelta) > minDelta) {
        this.hideHeaderFooter();
      } else if (isScrollingUp && Math.abs(scrollDelta) > minDelta) {
        this.showHeaderFooter();
      }
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  /**
   * Применяет частичное смещение к header и footer
   * @param {number} translateY - Смещение в пикселях (отрицательное для скрытия)
   * @param {ScrollToTopButton} scrollToTopButton - Опциональная ссылка на кнопку для синхронного обновления
   */
  applyPartialTransform(translateY, scrollToTopButton = null) {
    // Ограничиваем значения
    const clampedY = Math.max(-this.headerFooterHeight, Math.min(0, translateY));
    
    // Применяем transform напрямую для header
    this.header.style.transform = `translate3d(0, ${clampedY}px, 0)`;
    
    // Применяем transform для footer (в обратную сторону)
    this.footer.style.transform = `translate3d(0, ${-clampedY}px, 0)`;
    
    // Применяем transform для всех декоративных линий
    // Добавляем дополнительный 1px для полного скрытия (как на desktop)
    this.decorativeLines.forEach((line) => {
      // Определяем, это линия под header или над footer
      const isHeaderLine = line.previousElementSibling === this.header;
      const isFooterLine = line.nextElementSibling === this.footer;
      
      if (isHeaderLine) {
        // Линия под header - движется вместе с header
        // Добавляем -1px при скрытии для полного ухода за край
        const lineOffset = clampedY < 0 ? clampedY - 1 : clampedY;
        line.style.transform = `translate3d(0, ${lineOffset}px, 0)`;
      } else if (isFooterLine) {
        // Линия над footer - движется вместе с footer
        // Добавляем +1px при скрытии для полного ухода за край
        const lineOffset = clampedY < 0 ? -clampedY + 1 : -clampedY;
        line.style.transform = `translate3d(0, ${lineOffset}px, 0)`;
      }
    });
    
    // Обновляем footerOffset для доступа из других компонентов
    this.currentFooterOffset = Math.abs(clampedY);
    
    // Если передана кнопка, обновляем её позицию синхронно
    if (scrollToTopButton && this.scrollToTopButton) {
      this.scrollToTopButton.updateButtonPositionDirect(this.currentFooterOffset);
    }
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
    if (this.isTabletMode) {
      // На мобильных используем прямое управление transform
      this.applyPartialTransform(0, true);
      // Убираем класс hidden, если был
      this.header.classList.remove('hidden');
      this.footer.classList.remove('hidden');
      this.decorativeLines.forEach((line) => line.classList.remove('hidden'));
    } else {
      // На десктопе используем классы
      this.header.classList.remove('hidden');
      this.footer.classList.remove('hidden');
      this.decorativeLines.forEach((line) => line.classList.remove('hidden'));
    }
    this.currentTranslateY = 0;
  }

  /**
   * Скрывает header и footer
   */
  hideHeaderFooter() {
    if (this.isTabletMode) {
      // На мобильных используем прямое управление transform
      this.applyPartialTransform(-this.headerFooterHeight, true);
      // Добавляем класс hidden для совместимости
      this.header.classList.add('hidden');
      this.footer.classList.add('hidden');
      this.decorativeLines.forEach((line) => line.classList.add('hidden'));
    } else {
      // На десктопе используем классы
      this.header.classList.add('hidden');
      this.footer.classList.add('hidden');
      this.decorativeLines.forEach((line) => line.classList.add('hidden'));
    }
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
        // Переход в tablet режим - инициализируем currentTranslateY на основе текущего состояния
        // Проверяем, скрыты ли сейчас header и footer
        const isCurrentlyHidden = this.header.classList.contains('hidden');
        if (isCurrentlyHidden) {
          // Если скрыты, устанавливаем начальное смещение равным высоте
          this.currentTranslateY = -this.headerFooterHeight;
          // Применяем transform сразу, чтобы не было скачка
          this.disableTransitions();
          this.applyPartialTransform(this.currentTranslateY, true);
        } else {
          // Если видимы, оставляем на месте
          this.currentTranslateY = 0;
          this.disableTransitions();
          this.applyPartialTransform(0, true);
        }
      } else {
        // Переход в desktop режим - очищаем inline стили
        this.header.style.transform = '';
        this.footer.style.transform = '';
        this.header.style.transition = '';
        this.footer.style.transition = '';
        this.decorativeLines.forEach((line) => {
          line.style.transform = '';
          line.style.transition = '';
        });
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
    // Удаляем touchend обработчик если был tablet режим
    if (wasTabletMode && this.handleTouchEndBound) {
      document.removeEventListener('touchend', this.handleTouchEndBound);
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
      
      // На мобильных также слушаем touch события для более быстрой реакции
      if (this.isTabletMode) {
        this.handleTouchEndBound = this.handleTouchEnd.bind(this);
        document.addEventListener('touchend', this.handleTouchEndBound, {
          passive: true,
        });
      }
      
      // Устанавливаем начальное состояние при инициализации
      this.updateHeaderFooterVisibility();
    } else {
      // Для десктоп режима без скролла показываем header и footer
      this.showHeaderFooter();
    }

    this.isInitialized = true;
  }

  /**
   * Обработчик события touchend для мобильных устройств
   */
  handleTouchEnd() {
    // При окончании касания немедленно проверяем, нужно ли доводить анимацию
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    // Устанавливаем минимальную задержку для обработки окончания
    this.scrollTimeout = setTimeout(() => {
      this.onScrollEnd();
    }, 50);
  }

  /**
   * Возвращает текущее смещение футера для других компонентов
   * @returns {number} Смещение в пикселях (положительное значение = виден больше)
   */
  getFooterOffset() {
    if (this.isTabletMode && this.currentTranslateY !== undefined) {
      // На мобильных возвращаем текущее смещение
      // currentTranslateY отрицательное, поэтому инвертируем
      return Math.abs(this.currentTranslateY);
    }
    // На десктопе проверяем класс hidden
    return this.footer && this.footer.classList.contains('hidden') ? this.headerFooterHeight : 0;
  }
}
