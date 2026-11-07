// Манифест на главной: слова проявляются по мере прокрутки
const box = document.querySelector('.hm-text');
if (box) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lit = () => {
    const groups = [...box.children].filter((el) => el.offsetParent !== null);
    const ws = groups.flatMap((g) => [...g.querySelectorAll('.hm-w')]);
    if (reduce) { ws.forEach((w) => w.classList.add('on')); return; }
    const r = box.getBoundingClientRect();
    const vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    const n = Math.round(p * ws.length);
    ws.forEach((w, i) => w.classList.toggle('on', i < n));
  };
  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; lit(); }); }, { passive: true });
  addEventListener('resize', lit);
  document.addEventListener('languagechange', lit);
  lit();
}
