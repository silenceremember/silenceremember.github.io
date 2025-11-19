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
    this.previousIsTabletMode = false;
    this.scrollManager = null; // Ссылка на ScrollManager для синхронизации
    this.positionUpdateRafId = null; // ID requestAnimationFrame для отмены
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
        // Кнопка не найдена (может отсутствовать на некоторых страницах, например 404)
        // Не выводим предупреждение, так как это нормальное поведение
      }
      return;
    }

    // Сбрасываем счетчик попыток при успешной инициализации
    this.initAttempts = 0;

    this.footer = document.querySelector('.footer');
    this.pageWrapper = document.querySelector('.page-wrapper');

    this.setupEventListeners();
    // Округляем начальное значение для совместимости с браузерами
    const initialScrollTop = this.getScrollTop();
    this.lastScrollTop = initialScrollTop <= 0 ? 0 : Math.round(initialScrollTop);
    this.handleScroll();
    // Обновляем позицию при инициализации
    this.updateButtonPosition();
  }

  /**
   * Определяет, находимся ли мы в tablet режиме
   * @returns {boolean} true если ширина окна меньше 1024px или высота меньше 900px
   */
  isTabletMode() {
    return window.innerWidth < 1024 || window.innerHeight < 900;
  }

  /**
   * Проверяет, является ли это страницей со скроллом
   * @returns {boolean} true если body имеет класс page-with-scroll
   */
  isScrollPage() {
    return document.body.classList.contains('page-with-scroll');
  }

  /**
   * Получает элемент для скролла
   * @returns {HTMLElement|Window} Элемент для скролла
   */
  getScrollElement() {
    // На мобильных/планшетных устройствах и на страницах со скроллом 
    // всегда используется window
    if (this.isTabletMode() || this.isScrollPage()) {
      return window;
    }
    // Только на десктопе для главной страницы используется pageWrapper (если есть)
    return this.pageWrapper || window;
  }

  /**
   * Получает текущую позицию скролла
   * @returns {number} Позиция скролла в пикселях
   */
  getScrollTop() {
    const scrollElement = this.getScrollElement();
    if (scrollElement === window) {
      // Используем более надежный способ получения позиции скролла для совместимости со всеми браузерами
      // document.scrollingElement - современный стандарт, работает лучше всего в Firefox
      // window.scrollY - стандарт для большинства браузеров
      // window.pageYOffset - для старых браузеров
      // document.documentElement.scrollTop - запасной вариант
      // document.body.scrollTop - для очень старых браузеров
      const scrollingElement = document.scrollingElement || document.documentElement;
      
      // Проверяем значения явно, чтобы 0 не считался falsy
      if (typeof scrollingElement.scrollTop === 'number') {
        return scrollingElement.scrollTop;
      }
      if (typeof window.scrollY === 'number') {
        return window.scrollY;
      }
      if (typeof window.pageYOffset === 'number') {
        return window.pageYOffset;
      }
      if (typeof document.documentElement.scrollTop === 'number') {
        return document.documentElement.scrollTop;
      }
      if (typeof document.body.scrollTop === 'number') {
        return document.body.scrollTop;
      }
      return 0;
    } else {
      return scrollElement.scrollTop || 0;
    }
  }

  /**
   * Устанавливает ссылку на ScrollManager для синхронизации
   * @param {ScrollManager} scrollManager - Экземпляр ScrollManager
   */
  setScrollManager(scrollManager) {
    this.scrollManager = scrollManager;
  }

  /**
   * Прямое обновление позиции и opacity кнопки (вызывается из ScrollManager)
   * На мобильных/планшетах footer не скрывается, поэтому этот метод ничего не делает
   * @param {number} footerOffset - Текущее смещение футера
   */
  updateButtonPositionDirect(footerOffset) {
    // На мобильных/планшетах footer не скрывается, поэтому управление не требуется
    if (!this.scrollToTopButton || !this.footer || this.isTabletMode()) {
      return;
    }

    // Этот код выполняется только на desktop, но там footer управляется через классы
    // Оставляем метод для обратной совместимости, но не используем
  }

  /**
   * Обновляет позицию кнопки в зависимости от состояния футера
   * Позиция обновляется синхронно с изменениями футера для плавного следования
   */
  updateButtonPosition() {
    if (!this.scrollToTopButton) return;
    
    if (!this.footer) {
      this.scrollToTopButton.classList.remove('footer-hidden');
      this.scrollToTopButton.style.transform = '';
      this.scrollToTopButton.style.opacity = '';
      return;
    }

    // На мобильных/планшетах footer не скрывается
    if (this.isTabletMode()) {
      this.scrollToTopButton.classList.remove('footer-hidden');
      this.scrollToTopButton.style.transform = '';
      this.scrollToTopButton.style.transition = '';
      this.scrollToTopButton.style.opacity = '';
      return;
    }

    // На десктопе синхронизируем класс кнопки с состоянием футера
    const isFooterHidden = this.footer.classList.contains('hidden');
    const currentlyHasFooterHidden = this.scrollToTopButton.classList.contains('footer-hidden');
    
    // Если состояние не изменилось, ничего не делаем
    if (isFooterHidden === currentlyHasFooterHidden) {
      // Очищаем только transform и opacity
      this.scrollToTopButton.style.transform = '';
      this.scrollToTopButton.style.opacity = '';
      return;
    }
    
    // Используем двойной requestAnimationFrame для гарантии, что браузер успеет
    // зафиксировать начальное состояние перед изменением класса
    // Это критически важно для корректной работы CSS transition
    // Первый RAF дает браузеру время зафиксировать текущее состояние
    requestAnimationFrame(() => {
      // Второй RAF гарантирует, что браузер применил начальное состояние
      // перед изменением класса, что необходимо для плавной анимации
      requestAnimationFrame(() => {
        if (!this.scrollToTopButton || !this.footer) return;
        
        // Проверяем состояние еще раз, так как оно могло измениться
        const currentIsFooterHidden = this.footer.classList.contains('hidden');
        
        if (currentIsFooterHidden) {
          this.scrollToTopButton.classList.add('footer-hidden');
        } else {
          this.scrollToTopButton.classList.remove('footer-hidden');
        }
        
        // Очищаем только transform и opacity, не трогаем transition
        // Transition нужен для плавной анимации bottom при изменении класса
        this.scrollToTopButton.style.transform = '';
        this.scrollToTopButton.style.opacity = '';
      });
    });
  }
  
  /**
   * Планирует обновление позиции через requestAnimationFrame
   * Используется для батчинга обновлений в одном кадре
   */
  schedulePositionUpdate() {
    // Отменяем предыдущий запланированный вызов, если он есть
    if (this.positionUpdateRafId !== null) {
      cancelAnimationFrame(this.positionUpdateRafId);
    }
    
    this.positionUpdateRafId = requestAnimationFrame(() => {
      this.positionUpdateRafId = null;
      this.updateButtonPosition();
    });
  }

  /**
   * Проверяет, скрыта ли кнопка
   * @returns {boolean} true если кнопка скрыта
   */
  isButtonHidden() {
    if (!this.scrollToTopButton) return true;
    // Проверяем display стиль - это основной индикатор видимости
    const style = this.scrollToTopButton.style.display;
    if (style === 'none') return true;
    
    // Проверяем computed style для надежности
    const computedStyle = window.getComputedStyle(this.scrollToTopButton);
    if (computedStyle.display === 'none') return true;
    
    // Проверяем класс visible - если его нет, кнопка считается скрытой
    return !this.scrollToTopButton.classList.contains('visible');
  }
  
  /**
   * Проверяет, видима ли кнопка (имеет класс visible)
   * @returns {boolean} true если кнопка видима
   */
  isButtonVisible() {
    if (!this.scrollToTopButton) return false;
    return (
      this.scrollToTopButton.classList.contains('visible') &&
      this.scrollToTopButton.style.display !== 'none'
    );
  }

  /**
   * Показывает кнопку с анимацией
   */
  showButton() {
    if (!this.scrollToTopButton) return;
    
    // Отменяем таймаут скрытия, если он есть
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
      this.isAnimating = false;
    }

    // Если кнопка уже видима и не анимируется, просто обновляем позицию
    if (this.isButtonVisible() && !this.isAnimating) {
      this.updateButtonPosition();
      return;
    }

    // Определяем, нужна ли анимация
    const isHidden = this.isButtonHidden();
    const shouldAnimate = !this.wasShown || isHidden;

    // Убеждаемся, что элемент видим
    if (isHidden) {
      this.scrollToTopButton.style.display = 'flex';
    }

    if (shouldAnimate) {
      this.isAnimating = true;

      // Убираем класс visible, если он был, чтобы сбросить состояние для анимации
      this.scrollToTopButton.classList.remove('visible');

      // Обновляем позицию до показа
      this.updateButtonPosition();

      // Используем один requestAnimationFrame для быстрого старта анимации
      // Это обеспечивает начало анимации сразу во время прокрутки
      requestAnimationFrame(() => {
        if (this.scrollToTopButton) {
          this.scrollToTopButton.classList.add('visible');
          this.wasShown = true;
          // Обновляем позицию после показа для синхронизации с футером
          this.updateButtonPosition();
          setTimeout(() => {
            this.isAnimating = false;
          }, 300);
        }
      });
    } else {
      // Если кнопка уже была показана, просто делаем её видимой без анимации
      this.scrollToTopButton.classList.add('visible');
      this.wasShown = true;
      // Обновляем позицию сразу - позиция должна следовать за футером
      this.updateButtonPosition();
    }
  }

  /**
   * Скрывает кнопку с анимацией
   */
  hideButton() {
    if (!this.scrollToTopButton) return;
    
    // Если кнопка уже скрыта, ничего не делаем
    if (this.isButtonHidden()) {
      return;
    }

    // Отменяем предыдущий таймаут, если он есть
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Если кнопка видима, начинаем процесс скрытия
    if (this.isButtonVisible()) {
      this.isAnimating = true;
      this.scrollToTopButton.classList.remove('visible');

      // Используем плавную анимацию для всех устройств
      this.hideTimeout = setTimeout(() => {
        if (this.scrollToTopButton) {
          // Проверяем еще раз, что кнопка не стала видимой за это время
          if (!this.scrollToTopButton.classList.contains('visible')) {
            this.scrollToTopButton.style.display = 'none';
            // Сбрасываем флаг, чтобы при следующем показе была анимация
            this.wasShown = false;
          }
          this.isAnimating = false;
          this.hideTimeout = null;
        }
      }, 300);
    }
  }

  /**
   * Обработчик скролла
   */
  handleScroll() {
    if (!this.scrollToTopButton) return;
    
    const scrollTop = this.getScrollTop();
    // Используем минимальный порог для определения направления прокрутки
    // Порог должен быть очень маленьким, чтобы кнопка реагировала мгновенно
    const isTablet = this.isTabletMode();
    const scrollThreshold = 0.5; // Минимальный порог для всех устройств
    const scrollDelta = scrollTop - this.lastScrollTop;
    const isScrollingUp = scrollDelta < -scrollThreshold;
    const isScrollingDown = scrollDelta > scrollThreshold;
    // На мобильных кнопка должна скрываться только при прокрутке совсем наверх
    // На десктопе - при малейшей прокрутке к верху
    const topThreshold = isTablet ? 50 : scrollThreshold;
    const isAtTop = scrollTop <= topThreshold;
    
    // Обновляем lastScrollTop сразу для правильного определения направления в следующем вызове
    this.lastScrollTop = scrollTop <= 0 ? 0 : Math.round(scrollTop);

    // Если мы в самом верху страницы, скрываем кнопку
    if (isAtTop) {
      this.wasScrollingDown = false;
      this.hideButton();
      // Обновляем позицию сразу
      this.updateButtonPosition();
      return;
    }

    // Минимальный порог прокрутки для появления кнопки
    // На мобильных кнопка должна появляться быстро при прокрутке вверх
    const minScrollForShow = isTablet ? 10 : 100;
    if (scrollTop < minScrollForShow) {
      // Недостаточно прокрутили - не показываем кнопку
      this.hideButton();
      return;
    }

    // Если прокручиваем вверх
    if (isScrollingUp) {
      // Показываем кнопку сразу при прокрутке вверх
      if (!this.isButtonVisible()) {
        this.showButton();
      }
      this.wasScrollingDown = false;
    } else if (isScrollingDown) {
      // Прокручиваем вниз - скрываем кнопку
      this.wasScrollingDown = true;
      this.hideButton();
    }
    
    // На десктопе всегда обновляем позицию кнопки при скролле для синхронизации с футером
    // Используем schedulePositionUpdate для батчинга обновлений в одном кадре
    if (!this.isTabletMode() && this.footer) {
      this.schedulePositionUpdate();
    }
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

    // Наблюдаем за изменениями класса футера для синхронизации позиции кнопки
    if (this.footer) {
      // Сохраняем ссылку на observer для возможной очистки в будущем
      this.footerObserver = new MutationObserver((mutations) => {
        // Проверяем, что изменение действительно связано с классом 'hidden'
        const hasClassChange = mutations.some(mutation => 
          mutation.type === 'attributes' && 
          mutation.attributeName === 'class'
        );
        
        if (hasClassChange) {
          // Обновляем позицию синхронно при изменении класса футера
          // Это гарантирует, что кнопка следует за футером без задержек
          this.updateButtonPosition();
        }
      });

      this.footerObserver.observe(this.footer, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: false,
      });
    }

    // Настраиваем обработчик скролла
    this.setupScrollListener();

    // Сохраняем предыдущий режим для отслеживания изменений
    this.previousIsTabletMode = this.isTabletMode();

    // Обновляем обработчик при изменении размера окна
    window.addEventListener('resize', () => {
      const currentIsTabletMode = this.isTabletMode();
      // Обновляем обработчик только если изменился режим
      if (currentIsTabletMode !== this.previousIsTabletMode) {
        this.updateScrollListener();
        this.previousIsTabletMode = currentIsTabletMode;
      }
      this.handleScroll();
      // Обновляем позицию кнопки при изменении размера окна
      this.updateButtonPosition();
    });
  }

  /**
   * Настраивает обработчик скролла
   */
  setupScrollListener() {
    // Удаляем старый обработчик, если он был установлен
    if (this.handleScrollBound) {
      window.removeEventListener('scroll', this.handleScrollBound);
      if (this.pageWrapper) {
        this.pageWrapper.removeEventListener('scroll', this.handleScrollBound);
      }
    }
    
    const scrollElement = this.getScrollElement();
    this.handleScrollBound = this.handleScroll.bind(this);
    
    // Добавляем обработчик на соответствующий элемент
    scrollElement.addEventListener('scroll', this.handleScrollBound, {
      passive: true,
    });
  }

  /**
   * Обновляет обработчик скролла
   */
  updateScrollListener() {
    // Удаляем обработчики со всех возможных элементов
    if (this.handleScrollBound) {
      window.removeEventListener('scroll', this.handleScrollBound);
      if (this.pageWrapper) {
        this.pageWrapper.removeEventListener('scroll', this.handleScrollBound);
      }
    }
    
    // Обновляем lastScrollTop для предотвращения скачков
    // Округляем значение для совместимости с браузерами
    const currentScrollTop = this.getScrollTop();
    this.lastScrollTop = currentScrollTop <= 0 ? 0 : Math.round(currentScrollTop);
    
    // Настраиваем новый обработчик
    this.setupScrollListener();
    
    // Обновляем состояние кнопки
    this.handleScroll();
  }
}
