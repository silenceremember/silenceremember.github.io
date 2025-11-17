/**
 * Google Analytics 4 (GA4) Configuration
 * Measurement ID: G-PGX35FVEM1
 */

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-PGX35FVEM1';

// Проверяем, включена ли аналитика (можно отключить для разработки)
const isAnalyticsEnabled = () => {
  // Отключаем аналитику в development режиме
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return false;
  }
  return true;
};

// Инициализация Google Analytics
if (isAnalyticsEnabled() && GA_MEASUREMENT_ID) {
  // Загружаем Google Analytics скрипт
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Инициализируем gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
      gtag('js', new Date());
      
      // Определяем правильный домен для cookies
      const hostname = window.location.hostname;
      let cookieDomain = 'none'; // По умолчанию отключаем cookies
      
      // Для GitHub Pages используем явный домен без точки
      if (hostname.includes('github.io')) {
        cookieDomain = hostname; // Используем полный домен без точки в начале
      } else if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        cookieDomain = 'auto'; // Для других доменов используем автоопределение
      }
      
      gtag('config', GA_MEASUREMENT_ID, {
        // Настройки приватности
        anonymize_ip: true,
        // Отключаем автоматическое отслеживание рекламных функций
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        // Настройка cookies для GitHub Pages домена
        cookie_domain: cookieDomain,
        cookie_flags: cookieDomain !== 'none' ? 'SameSite=Lax;Secure' : undefined,
        // Используем localStorage вместо cookies если cookies отключены
        storage: cookieDomain === 'none' ? 'none' : undefined,
      });

  // Отслеживание переходов между страницами (для SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }).observe(document, { subtree: true, childList: true });
}

