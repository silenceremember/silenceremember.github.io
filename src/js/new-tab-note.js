// Ссылки, которые открываются в новой вкладке, сообщают об этом скринридеру:
// невидимая пометка в тексте ссылки, а у ссылок с aria-label пометка дописывается в подпись.
const NOTE = { ru: 'откроется в новой вкладке', en: 'opens in a new tab' };
const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'ru');

function mark(a) {
  const note = ` (${NOTE[lang()]})`;
  const label = a.getAttribute('aria-label');
  if (label !== null) {
    // Подпись могли переписать при смене языка: базой считаем подпись без пометки
    const base = label.replace(/ \((откроется в новой вкладке|opens in a new tab)\)$/, '');
    if (label !== base + note) a.setAttribute('aria-label', base + note);
    return;
  }
  let span = a.querySelector(':scope > .nt-note');
  if (!span) {
    span = document.createElement('span');
    span.className = 'visually-hidden nt-note';
    a.appendChild(span);
  }
  // Меняем текст только при отличии, иначе MutationObserver зациклится
  if (span.textContent !== note) span.textContent = note;
}

function markAll(root = document) {
  root.querySelectorAll('a[target="_blank"]').forEach(mark);
}

markAll();
window.addEventListener('languageChanged', () => markAll());
// Карточки «Кейсов», «Науки» и резюме дорисовываются из JSON: размечаем новые ссылки
let queued = false;
new MutationObserver(() => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    markAll();
  });
}).observe(document.body, { childList: true, subtree: true });
