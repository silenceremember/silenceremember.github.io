/**
 * Система управления слайдами для главной страницы
 * Аналогично transitions.js из референса
 */

import { initScrollHandler } from './scroll';

const initSlidesManager = () => {
    const slidesContainer = document.querySelector('.slides-container');
    const slides = document.querySelectorAll('.slide');
    const progressContainer = document.querySelector('.footer-decorative');
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    const decorativeLines = document.querySelectorAll('.decorative-line-horizontal');
    
    if (!slidesContainer || slides.length === 0 || !progressContainer || !header || !footer || decorativeLines.length === 0) {
        // Тихая проверка - если элементов нет, просто выходим без предупреждения
        // Это нормально для страниц без слайдера
        return;
    }

    const SLIDE_TRANSITION_DURATION = 300; // Длительность анимации в миллисекундах (0.3s)
    let currentSlideIndex = 0;
    let isScrolling = false;
    // Общее время анимации (300ms) + небольшой запас, чтобы избежать прерываний
    const scrollTimeout = SLIDE_TRANSITION_DURATION + 50;
    const progressDots = [];
    let slideTransitionTimeout = null; // Таймер для отслеживания перехода слайдов
    let isTabletMode = false;
    const menuButton = document.querySelector('.header-menu-button');
    const ctaSection = document.getElementById('cta-section');
    
    // Подсказка для первого слайда
    const slideHint = document.getElementById('slide-hint');
    const HINT_DELAY = 7000; // 7 секунд
    let hintTimeout = null;
    let hintShown = false;
    let hasLeftFirstSlide = false; // Флаг: покидали ли мы первый слайд

    if (menuButton) {
        menuButton.addEventListener('click', () => {
            if (isTabletMode && ctaSection) {
                ctaSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Функция показа/скрытия подсказки
    function showHint() {
        if (slideHint && !isTabletMode && currentSlideIndex === 0 && !hintShown && !hasLeftFirstSlide) {
            slideHint.classList.add('visible');
            hintShown = true;
        }
    }
    
    function hideHint() {
        if (slideHint) {
            slideHint.classList.remove('visible');
            hintShown = false;
        }
    }
    
    function startHintTimer() {
        // Очищаем предыдущий таймер, если он есть
        if (hintTimeout) {
            clearTimeout(hintTimeout);
            hintTimeout = null;
        }
        
        // Скрываем подсказку, если она была показана
        hideHint();
        
        // Запускаем таймер только если мы на первом слайде, не в режиме планшета и еще не покидали первый слайд
        if (currentSlideIndex === 0 && !isTabletMode && slideHint && !hasLeftFirstSlide) {
            hintTimeout = setTimeout(() => {
                showHint();
            }, HINT_DELAY);
        }
    }
    
    function stopHintTimer() {
        if (hintTimeout) {
            clearTimeout(hintTimeout);
            hintTimeout = null;
        }
        hideHint();
    }

    // Функция проверки размера окна
    function checkViewport(isTablet) {
        if (isTablet) {
            slidesContainer.classList.add('tablet-scroll-mode');
            // В tablet-scroll-mode все слайды должны быть видимы
            slides.forEach(slide => {
                slide.classList.remove('active');
                // Явно устанавливаем видимость для tablet-scroll-mode
                slide.style.opacity = '1';
                slide.style.visibility = 'visible';
                slide.style.display = 'block';
                slide.style.position = 'static';
            });
            // Скрываем подсказку в режиме планшета
            stopHintTimer();
        } else {
            slidesContainer.classList.add('is-resizing');
            slidesContainer.classList.remove('tablet-scroll-mode');
            // Убираем inline стили при возврате в desktop режим
            slides.forEach(slide => {
                slide.style.opacity = '';
                slide.style.visibility = '';
                slide.style.display = '';
                slide.style.position = '';
            });
            showSlideImmediate(currentSlideIndex);
            setTimeout(() => {
                slidesContainer.classList.remove('is-resizing');
            }, 50);
            // Запускаем таймер подсказки, если мы на первом слайде
            if (currentSlideIndex === 0) {
                startHintTimer();
            }
        }
    }

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
        // Отслеживаем, покидали ли мы первый слайд
        if (currentSlideIndex === 0 && index !== 0) {
            hasLeftFirstSlide = true;
        }
        
        currentSlideIndex = index;
        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
        progressDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        
        // Управление подсказкой
        if (index === 0 && !isTabletMode && !hasLeftFirstSlide) {
            startHintTimer();
        } else {
            stopHintTimer();
        }
    }

    // Переключение слайда
    function changeSlide(newIndex) {
        if (isScrolling) return;
        
        if (newIndex >= 0 && newIndex < slides.length) {
            // Сбрасываем выделение текста
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }

            isScrolling = true;
            showSlide(newIndex);
            setTimeout(() => { 
                isScrolling = false; 
            }, scrollTimeout);
        }
    }

    // Обработка колесика мыши
    window.addEventListener('wheel', (event) => {
        if (isScrolling || isTabletMode) return;
        
        // Скрываем подсказку при прокрутке
        stopHintTimer();
        
        const direction = event.deltaY > 0 ? 1 : -1;
        const nextIndex = currentSlideIndex + direction;
        changeSlide(nextIndex);
    });

    // Инициализируем индикаторы
    createProgressDots();
    
    // Инициализируем обработчик скролла (используем .page-wrapper для унификации с портфолио)
    initScrollHandler('.page-wrapper', (isTablet) => {
        isTabletMode = isTablet;
        checkViewport(isTablet);
    });

    // Первоначальная настройка
    // На десктопе - показываем первый слайд сразу (без анимации при загрузке)
    // Сначала убедимся, что все слайды скрыты
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
    });
    // Затем показываем первый слайд, если не в режиме планшета
    if (!isTabletMode) {
        showSlideImmediate(0);
        // Запускаем таймер подсказки для первого слайда
        startHintTimer();
    }
};

export default initSlidesManager;

