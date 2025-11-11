export function initScrollHandler(scrollContainerSelector, isTabletModeCallback) {
    const scrollContainer = document.querySelector(scrollContainerSelector);
    if (!scrollContainer) return;

    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    const decorativeLines = document.querySelectorAll('.decorative-line-horizontal');

    if (!header || !footer || decorativeLines.length === 0) {
        return;
    }

    // Проверяем, является ли это страницей со скроллом (projects.html)
    const isScrollPage = document.body.classList.contains('page-with-scroll');
    
    let isTabletMode = false;
    let lastScrollTop = 0;

    // Определяем контейнер для скролла в зависимости от режима
    function getScrollElement() {
        if (isTabletMode) {
            return scrollContainer;
        } else if (isScrollPage) {
            // На десктопе для страниц со скроллом используем window
            return window;
        }
        return scrollContainer;
    }

    function handleScroll() {
        const scrollElement = getScrollElement();
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
        if (!isScrollPage && !isTabletMode) return;

        const atBottom = scrollTop + clientHeight >= scrollHeight - 2;

        if (atBottom) {
            header.classList.remove('hidden');
            footer.classList.remove('hidden');
            decorativeLines.forEach(line => line.classList.remove('hidden'));
        } else if (scrollTop > lastScrollTop && scrollTop > header.offsetHeight) {
            header.classList.add('hidden');
            footer.classList.add('hidden');
            decorativeLines.forEach(line => line.classList.add('hidden'));
        } else if (scrollTop < lastScrollTop) {
            header.classList.remove('hidden');
            footer.classList.remove('hidden');
            decorativeLines.forEach(line => line.classList.remove('hidden'));
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }

    function checkViewportForScroll() {
        // Для страницы проектов проверяем только ширину (<768)
        // Для главной страницы проверяем ширину (<768) ИЛИ высоту (<1024)
        const isNowTablet = isScrollPage 
            ? window.innerWidth <= 768 
            : window.innerWidth <= 768 || window.innerHeight < 1024;
        
        // Для страницы проектов проверяем изменение состояния
        // Для главной страницы всегда проверяем (так как может измениться высота)
        if (isNowTablet === isTabletMode && isScrollPage) {
            return;
        }

        const wasTabletMode = isTabletMode;
        isTabletMode = isNowTablet;
        
        if (isTabletModeCallback) {
            isTabletModeCallback(isTabletMode);
        }

        // Удаляем старые обработчики
        if (wasTabletMode) {
            scrollContainer.removeEventListener('scroll', handleScroll);
        }
        if (isScrollPage && !wasTabletMode) {
            window.removeEventListener('scroll', handleScroll);
        }

        // Добавляем новые обработчики
        if (isTabletMode) {
            scrollContainer.addEventListener('scroll', handleScroll);
            handleScroll();
        } else if (isScrollPage) {
            // На десктопе для страниц со скроллом слушаем window
            window.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll();
        } else {
            header.classList.remove('hidden');
            footer.classList.remove('hidden');
            decorativeLines.forEach(line => line.classList.remove('hidden'));
        }
    }

    checkViewportForScroll();
    window.addEventListener('resize', checkViewportForScroll);
}
