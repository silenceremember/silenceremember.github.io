async function loadSvg(element) {
  const SvgUrl = element.getAttribute('data-svg-src');
  if (!SvgUrl) return;

  try {
    const response = await fetch(SvgUrl);
    if (!response.ok) return;

    const svgText = await response.text();
    const svgNode = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
    
    // Переносим классы и атрибуты с placeholder'а на SVG-элемент
    svgNode.setAttribute('class', element.getAttribute('class'));
    
    element.parentNode.replaceChild(svgNode, element);
  } catch (error) {
    console.error('Ошибка при загрузке SVG:', error);
  }
}

export default async function initSvgLoader() {
  const svgPlaceholders = document.querySelectorAll('[data-svg-src]');
  const promises = Array.from(svgPlaceholders).map(loadSvg);
  await Promise.all(promises);
}
