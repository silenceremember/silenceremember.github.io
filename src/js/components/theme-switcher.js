export function initThemeSwitcher() {
  const themeButton = document.querySelector('.header-theme');
  if (!themeButton) return;

  const moonIcon = themeButton.querySelector('.theme-icon-moon');
  const sunIcon = themeButton.querySelector('.theme-icon-sun');
  const documentElement = document.documentElement;

  const applyTheme = (theme) => {
    documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
    } else {
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
    }
  };

  const toggleTheme = () => {
    const currentTheme = documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  themeButton.addEventListener('click', toggleTheme);

  // Apply saved theme on initial load
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // If no theme is saved, use light theme as default
    applyTheme('light');
  }
}
