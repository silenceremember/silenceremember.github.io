// Манифест на главной: на компьютере слова проявляются по мере прокрутки.
// По умолчанию текст виден целиком; эффект включается только с мышью и без «уменьшить движение».
const box = document.querySelector('.hm-text');
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (box && fine && !reduce) {
  box.classList.add('hm-ready');
  const lit = () => {
    const groups = [...box.children].filter((el) => el.offsetParent !== null);
    const ws = groups.flatMap((g) => [...g.querySelectorAll('.hm-w')]);
    const r = box.getBoundingClientRect();
    const vh = innerHeight;
    // полностью проявлен, когда низ абзаца поднялся до 70% высоты экрана
    const p = Math.min(1, Math.max(0, (vh * 0.95 - r.top) / (r.height + vh * 0.25)));
    const n = Math.ceil(p * ws.length);
    ws.forEach((w, i) => w.classList.toggle('on', i < n));
  };
  let raf = 0;
  const h = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; lit(); }); };
  // скроллится то окно, то body: ловим прокрутку любого контейнера
  document.addEventListener('scroll', h, { capture: true, passive: true });
  addEventListener('resize', h);
  document.addEventListener('languagechange', h);
  lit();
}
