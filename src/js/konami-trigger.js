// Пасхалка: код Конами (↑↑↓↓←→←→BA) или 7 быстрых тапов по глазу в подвале открывают бой с боссом.
// Сама игра лежит в public/konami/ и грузится только после срабатывания.
const SEQ = 'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight KeyB KeyA'.split(' ');
let i = 0, taps = 0, lastTap = 0, open = false;

function go() {
  if (open) return;
  open = true;
  const url = new URL('/konami/game.js', location.origin).href;
  import(/* @vite-ignore */ url).then(
    (m) => m.start({ onClose: () => { open = false; } }),
    () => { open = false; }
  );
}

addEventListener('keydown', (e) => {
  const t = e.target, c = e.code;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  i = c === SEQ[i] ? i + 1 : c === SEQ[0] ? (i === 2 ? 2 : 1) : 0;
  if (i === SEQ.length) { i = 0; go(); }
});

addEventListener('click', (e) => {
  const m = e.target.closest && e.target.closest('[data-konami-tap]');
  if (!m) return;
  const now = Date.now();
  e.preventDefault();
  taps = now - lastTap < 700 ? taps + 1 : 1;
  lastTap = now;
  if (taps > 6) { taps = 0; go(); }
}, true);
