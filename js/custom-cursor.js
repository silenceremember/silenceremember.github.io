document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.querySelector('.custom-cursor');

    // Проверяем, поддерживает ли устройство ховер (не тачскрин)
    const isHoverSupported = window.matchMedia('(hover: hover)').matches;

    if (!cursor || !isHoverSupported) {
        if(cursor) cursor.style.display = 'none';
        return;
    }

    window.addEventListener('mousemove', e => {
        // Позиционируем курсор через top и left
        cursor.style.top = `${e.clientY}px`;
        cursor.style.left = `${e.clientX}px`;
    });

    const interactiveElements = document.querySelectorAll(
        'a, button, .header-language, .header-theme, .social-link, .footer-decorative-square, .header-menu-button'
    );

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
        });
    });
});
