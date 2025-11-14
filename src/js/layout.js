export async function loadHTML(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load HTML from ${url}`);
  }
  return response.text();
}

function setActiveNavLink() {
  const navLinks = document.querySelectorAll('.header-nav-item');
  let currentPage = window.location.pathname.split('/').pop();
  if (currentPage === '' || currentPage === 'index.html') {
    currentPage = 'index.html';
  }

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

export async function initLayout() {
  const headerElement = document.querySelector('header.header');
  const footerElement = document.querySelector('footer.footer');
  const scrollToTopContainer = document.querySelector('#scroll-to-top-container');

  // Use Promise.all to load components in parallel
  const loadPromises = [
    headerElement ? loadHTML('/components/header.html') : Promise.resolve(null),
    footerElement ? loadHTML('/components/footer.html') : Promise.resolve(null),
  ];

  // Загружаем кнопку "наверх" для страниц с классом page-with-scroll
  if (document.body.classList.contains('page-with-scroll') && scrollToTopContainer) {
    loadPromises.push(loadHTML('/components/scroll-to-top.html'));
  } else {
    loadPromises.push(Promise.resolve(null));
  }

  const [headerHTML, footerHTML, scrollToTopHTML] = await Promise.all(loadPromises);

  if (headerElement && headerHTML) {
    headerElement.innerHTML = headerHTML;
    setActiveNavLink();
  }

  if (footerElement && footerHTML) {
    footerElement.innerHTML = footerHTML;
  }

  if (scrollToTopContainer && scrollToTopHTML) {
    scrollToTopContainer.innerHTML = scrollToTopHTML;
  }
}
