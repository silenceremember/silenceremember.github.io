// Рисунки в кейсах открываются в <dialog> поверх страницы.
// Без JS ссылка остаётся обычной ссылкой на файл в той же вкладке.
// Esc и кнопка «Закрыть» закрывают окно, клик по затемнению тоже; фокус заперт в окне и возвращается к рисунку.
const links = document.querySelectorAll('.case-figure a[data-lightbox]');
if (links.length && typeof HTMLDialogElement === 'function') {
  const d = document.createElement('dialog');
  d.className = 'lightbox';
  d.innerHTML =
    '<div class="lightbox-bar"><p class="lightbox-caption"></p>' +
    '<button type="button" class="cta-button lightbox-close"></button></div>' +
    '<div class="lightbox-frame"><img alt="" decoding="async" /></div>';
  document.body.appendChild(d);
  const img = d.querySelector('img');
  const cap = d.querySelector('.lightbox-caption');
  const btn = d.querySelector('.lightbox-close');
  let opener = null;

  const open = (a) => {
    const en = document.documentElement.lang === 'en';
    const thumb = a.querySelector('img');
    const fc = a.closest('.case-figure')?.querySelector('figcaption');
    const capText = fc ? [...fc.querySelectorAll(en ? '.i18n-en' : '.i18n-ru')].map((n) => n.textContent).join(' ') : '';
    img.src = a.getAttribute('href');
    img.alt = thumb?.getAttribute('alt') || '';
    cap.textContent = capText;
    cap.hidden = !capText;
    btn.textContent = en ? 'Close' : 'Закрыть';
    d.setAttribute('aria-label', img.alt || (en ? 'Image' : 'Изображение'));
    // Широкие схемы (навыки B.I.T.E.) на телефоне листаются вбок в полном размере
    d.classList.toggle('lightbox--wide', a.scrollWidth > a.clientWidth + 1);
    opener = a;
    d.showModal();
    btn.focus();
  };

  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      open(a);
    });
  });

  btn.addEventListener('click', () => d.close());
  // Клик по затемнению попадает в сам <dialog>, а не в его содержимое
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  });
  d.addEventListener('close', () => {
    img.removeAttribute('src');
    if (opener) opener.focus({ preventScroll: true });
    opener = null;
  });
}
