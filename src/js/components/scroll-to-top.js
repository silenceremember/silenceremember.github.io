/**
 * Инициализирует кнопку "Наверх"
 */
// Глобальная переменная для отслеживания попыток инициализации
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

export function initScrollToTop() {
  const scrollToTopButton = document.getElementById('scroll-to-top');
  if (!scrollToTopButton) {
    // Если кнопка еще не загружена, пробуем еще раз через небольшую задержку
    initAttempts++;
    if (initAttempts < MAX_INIT_ATTEMPTS) {
      setTimeout(() => {
        initScrollToTop();
      }, 100);
    } else {
      console.warn('Кнопка "Наверх" не найдена после нескольких попыток инициализации');
    }
    return;
  }
  
  // Сбрасываем счетчик попыток при успешной инициализации
  initAttempts = 0;
  
  const footer = document.querySelector('.footer');
  const pageWrapper = document.querySelector('.page-wrapper');
  
  let lastScrollTop = 0;
  let hideTimeout = null;
  let isAnimating = false;
  let wasShown = false; // Флаг для отслеживания, была ли кнопка уже показана
  let wasScrollingDown = false; // Флаг для отслеживания направления прокрутки
  
  function isTabletMode() {
    return window.innerWidth < 1024;
  }
  
  function getScrollElement() {
    return isTabletMode() && pageWrapper ? pageWrapper : window;
  }
  
  function getScrollTop() {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      return window.pageYOffset || document.documentElement.scrollTop;
    } else {
      return scrollElement.scrollTop;
    }
  }
  
  function updateButtonPosition() {
    if (!footer) {
      scrollToTopButton.classList.remove('footer-hidden');
      return;
    }
    
    const isFooterHidden = footer.classList.contains('hidden');
    
    if (isFooterHidden) {
      scrollToTopButton.classList.add('footer-hidden');
    } else {
      scrollToTopButton.classList.remove('footer-hidden');
    }
  }
  
  function showButton() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
      isAnimating = false;
    }
    
    // Если кнопка уже видима, просто обновляем позицию без анимации
    if (scrollToTopButton.classList.contains('visible') && !isAnimating) {
      updateButtonPosition();
      return;
    }
    
    // Анимация показывается только один раз при первом появлении или после скрытия
    const shouldAnimate = !wasShown || scrollToTopButton.style.display === 'none';
    
    if (shouldAnimate) {
      isAnimating = true;
      
      // Убеждаемся, что элемент видим
      if (scrollToTopButton.style.display === 'none') {
        scrollToTopButton.style.display = 'flex';
      }
      
      // Убираем класс visible, если он был, чтобы сбросить состояние для анимации
      scrollToTopButton.classList.remove('visible');
      
      // Обновляем позицию до показа
      updateButtonPosition();
      
      // Ждем кадр, чтобы браузер успел применить начальное состояние (opacity: 0), затем добавляем класс для анимации
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToTopButton.classList.add('visible');
          wasShown = true;
          setTimeout(() => {
            isAnimating = false;
          }, 300);
        });
      });
    } else {
      // Если кнопка уже была показана, просто делаем её видимой без анимации
      if (scrollToTopButton.style.display === 'none') {
        scrollToTopButton.style.display = 'flex';
      }
      scrollToTopButton.classList.add('visible');
      updateButtonPosition();
    }
  }
  
  function hideButton() {
    if (!scrollToTopButton.classList.contains('visible') && scrollToTopButton.style.display === 'none') {
      return;
    }
    
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    
    isAnimating = true;
    scrollToTopButton.classList.remove('visible');
    
    hideTimeout = setTimeout(() => {
      if (!scrollToTopButton.classList.contains('visible')) {
        scrollToTopButton.style.display = 'none';
        // Сбрасываем флаг, чтобы при следующем показе была анимация
        wasShown = false;
      }
      isAnimating = false;
      hideTimeout = null;
    }, 300);
  }
  
  function handleScroll() {
    const scrollTop = getScrollTop();
    const isScrollingUp = scrollTop < lastScrollTop;
    const isAtTop = scrollTop <= 0;
    
    if (isScrollingUp && !isAtTop) {
      // Определяем, изменилось ли направление прокрутки с вниз на вверх
      const directionChanged = wasScrollingDown && isScrollingUp;
      
      // Показываем кнопку с анимацией только при изменении направления с вниз на вверх
      // или если кнопка еще не была показана
      if (directionChanged || !wasShown) {
        showButton();
      } else {
        // Если кнопка уже видима и мы продолжаем прокручивать вверх, 
        // просто обновляем позицию без анимации
        if (scrollToTopButton.classList.contains('visible')) {
          updateButtonPosition();
        } else {
          // Если кнопка не видима, но мы прокручиваем вверх, показываем её без анимации
          if (scrollToTopButton.style.display === 'none') {
            scrollToTopButton.style.display = 'flex';
          }
          scrollToTopButton.classList.add('visible');
          updateButtonPosition();
        }
      }
      wasScrollingDown = false;
    } else {
      // Прокручиваем вниз или в самом верху
      if (!isAtTop) {
        wasScrollingDown = true;
      }
      hideButton();
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    
    requestAnimationFrame(() => {
      updateButtonPosition();
    });
  }
  
  scrollToTopButton.addEventListener('click', () => {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      scrollElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
  
  if (footer) {
    const footerObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        updateButtonPosition();
      });
    });
    
    footerObserver.observe(footer, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  function setupScrollListener() {
    const scrollElement = getScrollElement();
    if (scrollElement === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    }
  }
  
  function updateScrollListener() {
    window.removeEventListener('scroll', handleScroll);
    if (pageWrapper) {
      pageWrapper.removeEventListener('scroll', handleScroll);
    }
    lastScrollTop = getScrollTop();
    setupScrollListener();
  }
  
  setupScrollListener();
  
  window.addEventListener('resize', () => {
    updateScrollListener();
    handleScroll();
  });
  
  lastScrollTop = getScrollTop();
  handleScroll();
  updateButtonPosition();
}

