// Список кейсов на главной: при наведении рядом с курсором всплывает кадр
const list = document.querySelector('.home-index');
if (list && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const box = document.createElement('div');
  box.className = 'hi-float';
  box.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.alt = '';
  box.appendChild(img);
  document.body.appendChild(box);
  let x = 0, y = 0, raf = 0;
  const place = () => { raf = 0; box.style.transform = `translate(${x + 24}px, ${y - 90}px)`; };
  list.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(place); });
  list.querySelectorAll('a[data-preview]').forEach((a) => {
    a.addEventListener('mouseenter', () => { img.src = a.dataset.preview; box.classList.add('on'); });
    a.addEventListener('mouseleave', () => box.classList.remove('on'));
  });
}
