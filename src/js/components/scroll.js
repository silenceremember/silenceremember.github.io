export function initScrollHandler(scrollContainerSelector, isTabletModeCallback) {
    const scrollContainer = document.querySelector(scrollContainerSelector);
    if (!scrollContainer) return;

    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    const decorativeLines = document.querySelectorAll('.decorative-line-horizontal');

    if (!header || !footer || decorativeLines.length === 0) {
        return;
    }

    let isTabletMode = false;
    let lastScrollTop = 0;

    function handleScroll() {
        if (!isTabletMode) return;

        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;
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
        const isNowTablet = window.innerWidth <= 768 || window.innerHeight < 1024;
        if (isNowTablet === isTabletMode) {
            return;
        }

        isTabletMode = isNowTablet;
        if (isTabletModeCallback) {
            isTabletModeCallback(isTabletMode);
        }

        if (isTabletMode) {
            scrollContainer.addEventListener('scroll', handleScroll);
            handleScroll();
        } else {
            scrollContainer.removeEventListener('scroll', handleScroll);
            header.classList.remove('hidden');
            footer.classList.remove('hidden');
            decorativeLines.forEach(line => line.classList.remove('hidden'));
        }
    }

    checkViewportForScroll();
    window.addEventListener('resize', checkViewportForScroll);
}
