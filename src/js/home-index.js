// Список кейсов на главной: при наведении у строки появляется кадр.
// Кадр привязан к строке, а не к курсору: стоит справа, перед подписью, по центру строки по вертикали
// и не закрывает ни наведённое название, ни соседние строки.
const list = document.querySelector('.home-index');
if (list && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const box = document.createElement('div');
  box.className = 'hi-float';
  box.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.alt = '';
  box.appendChild(img);
  document.body.appendChild(box);

  const GAP = 24;
  const EDGE = 8;
  const BAR = 72; // фиксированные шапка и подвал по 64 px

  const place = (a) => {
    const row = a.getBoundingClientRect();
    const meta = a.querySelector('.hi-meta');
    const title = a.querySelector('.hi-title');
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    const metaLeft = meta ? meta.getBoundingClientRect().left : row.right;
    const titleRight = title ? title.getBoundingClientRect().right : row.left;
    let x = metaLeft - w - GAP;
    x = Math.max(x, titleRight + GAP);
    x = Math.max(EDGE, Math.min(x, innerWidth - w - EDGE));
    let y = row.top + row.height / 2 - h / 2;
    y = Math.max(BAR, Math.min(y, innerHeight - h - BAR));
    box.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  };
  const show = (a) => {
    img.src = a.dataset.preview;
    place(a);
    box.classList.add('on');
  };
  const hide = () => box.classList.remove('on');

  list.querySelectorAll('a[data-preview]').forEach((a) => {
    a.addEventListener('mouseenter', () => show(a));
    a.addEventListener('mouseleave', hide);
    a.addEventListener('focus', () => show(a));
    a.addEventListener('blur', hide);
  });
  addEventListener('scroll', hide, { capture: true, passive: true });
}
