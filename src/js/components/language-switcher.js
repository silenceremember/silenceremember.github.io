export function initLanguageSwitcher() {
  const languageButton = document.querySelector('.header-language');
  if (!languageButton) return;

  let currentLanguage = 'ru'; // Начальный язык - RU

  const applyLanguage = (lang) => {
    const ruIcon = languageButton.querySelector('.language-icon-ru');
    const enIcon = languageButton.querySelector('.language-icon-en');
    
    if (!ruIcon || !enIcon) return;

    const ruSvg = ruIcon.querySelector('svg') || ruIcon;
    const enSvg = enIcon.querySelector('svg') || enIcon;

    if (lang === 'ru') {
      ruSvg.style.display = 'block';
      enSvg.style.display = 'none';
    } else {
      ruSvg.style.display = 'none';
      enSvg.style.display = 'block';
    }
  };

  const toggleLanguage = () => {
    currentLanguage = currentLanguage === 'ru' ? 'en' : 'ru';
    applyLanguage(currentLanguage);
  };

  // Применяем начальное состояние
  applyLanguage(currentLanguage);

  // Добавляем обработчик клика
  languageButton.addEventListener('click', toggleLanguage);

  // Периодически проверяем и обновляем состояние после загрузки SVG
  const checkInterval = setInterval(() => {
    const ruSvg = languageButton.querySelector('.language-icon-ru svg');
    const enSvg = languageButton.querySelector('.language-icon-en svg');
    
    if (ruSvg && enSvg) {
      applyLanguage(currentLanguage);
      clearInterval(checkInterval);
    }
  }, 50);

  // Останавливаем проверку через 2 секунды, если SVG не загрузились
  setTimeout(() => clearInterval(checkInterval), 2000);
}

