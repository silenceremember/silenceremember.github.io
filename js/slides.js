/**
 * Система управления слайдами для главной страницы
 * Аналогично transitions.js из референса
 */

function initSlidesManager() {
    const slidesContainer = document.querySelector('.slides-container');
    const slides = document.querySelectorAll('.slide');
    const progressContainer = document.querySelector('.footer-decorative');
    
    if (!slidesContainer || slides.length === 0 || !progressContainer) {
        console.warn('Slides manager: Required elements not found');
        return;
    }

    const MOBILE_BREAKPOINT = 800;
    const SLIDE_TRANSITION_DURATION = 300; // Длительность анимации в миллисекундах (0.3s)
    let currentSlideIndex = 0;
    let isScrolling = false;
    // Общее время анимации (300ms) + небольшой запас, чтобы избежать прерываний
    const scrollTimeout = SLIDE_TRANSITION_DURATION + 50;
    const progressDots = [];
    let slideTransitionTimeout = null; // Таймер для отслеживания перехода слайдов

    let isMobileLayout = window.innerWidth < MOBILE_BREAKPOINT;

    // Функция создания индикаторов прогресса
    function createProgressDots() {
        // Очищаем контейнер перед созданием новых индикаторов
        progressContainer.innerHTML = '';
        progressDots.length = 0;
        
        // Создаем индикаторы прогресса (квадратики)
        slides.forEach((slide, index) => {
            const dot = document.createElement('div');
            dot.classList.add('footer-decorative-square');
            // Активное состояние будет установлено через showSlideImmediate или showSlide
            dot.setAttribute('data-slide-index', index);
            dot.addEventListener('click', () => changeSlide(index));
            progressContainer.appendChild(dot);
            progressDots.push(dot);
        });
    }

    // Показываем активный слайд (без анимации, сразу) - используется при инициализации
    function showSlideImmediate(index) {
        if (isMobileLayout) return;
        
        currentSlideIndex = index;
        
        // Обновляем видимость слайдов
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        // Обновляем индикаторы прогресса
        progressDots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Вспомогательная функция для очистки всех активных классов (кроме указанного индекса)
    function clearAllActiveClasses(exceptIndex = -1) {
        slides.forEach((slide, i) => {
            if (i !== exceptIndex) {
                slide.classList.remove('active');
            }
        });
    }
    
    // Вспомогательная функция для проверки, полностью ли скрыт слайд
    function isSlideFullyHidden(slide) {
        // Проверяем computed style для точного определения состояния
        const style = window.getComputedStyle(slide);
        const opacity = parseFloat(style.opacity);
        // Слайд считается скрытым, если opacity близко к 0 (с учетом переходов)
        // И не имеет класса active (для надежности)
        const isHidden = (opacity <= 0.01 || style.visibility === 'hidden') && !slide.classList.contains('active');
        return isHidden;
    }
    
    // Вспомогательная функция для проверки, полностью ли видимый слайд
    function isSlideFullyVisible(slide) {
        if (!slide.classList.contains('active')) {
            return false; // Если нет класса active, слайд не видим
        }
        const style = window.getComputedStyle(slide);
        const opacity = parseFloat(style.opacity);
        const isVisible = opacity >= 0.99 && style.visibility === 'visible';
        return isVisible;
    }
    
    // Показываем активный слайд - улучшенная логика с защитой от наложения
    function showSlide(index) {
        if (isMobileLayout) return;
        currentSlideIndex = index;
        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
        progressDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    // Переключение слайда
    function changeSlide(newIndex) {
        if (isMobileLayout || isScrolling) return;
        
        if (newIndex >= 0 && newIndex < slides.length) {
            isScrolling = true;
            showSlide(newIndex);
            setTimeout(() => { 
                isScrolling = false; 
            }, scrollTimeout);
        }
    }

    // Обработка колесика мыши
    window.addEventListener('wheel', (event) => {
        if (isMobileLayout || isScrolling) return;
        
        const direction = event.deltaY > 0 ? 1 : -1;
        const nextIndex = currentSlideIndex + direction;
        changeSlide(nextIndex);
    });

    // Обработка изменения размера окна
    function updateLayout() {
        const shouldBeMobile = window.innerWidth < MOBILE_BREAKPOINT;
        if (shouldBeMobile === isMobileLayout) return;

        isMobileLayout = shouldBeMobile;

        if (isMobileLayout) {
            // На мобильных устройствах показываем все слайды с обычной прокруткой
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                slide.style.position = 'relative';
                slide.style.opacity = '1';
                slide.style.visibility = 'visible';
            });
        } else {
            // На десктопе показываем только активный слайд
            slides.forEach((slide, i) => {
                slide.style.position = '';
                slide.style.opacity = '';
                slide.style.visibility = '';
            });
            // Пересоздаем индикаторы перед показом слайда
            createProgressDots();
            // Используем immediate версию при изменении размера, чтобы избежать задержки
            showSlideImmediate(currentSlideIndex);
        }
    }

    window.addEventListener('resize', updateLayout);

    // Инициализируем индикаторы
    createProgressDots();

    // Первоначальная настройка
    if (isMobileLayout) {
        // На мобильных - обычная прокрутка, показываем все слайды
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            slide.style.position = 'relative';
            slide.style.opacity = '1';
            slide.style.visibility = 'visible';
        });
    } else {
        // На десктопе - показываем первый слайд сразу (без анимации при загрузке)
        // Сначала убедимся, что все слайды скрыты
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
        });
        // Затем показываем первый слайд
        showSlideImmediate(0);
    }
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlidesManager);
} else {
    initSlidesManager();
}
