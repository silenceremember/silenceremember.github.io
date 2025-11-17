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
      
      // Для GitHub Pages отключаем cookies полностью из-за ограничений браузера
      // GA4 будет использовать localStorage для хранения данных
      const isGitHubPages = hostname.includes('github.io');
      
      gtag('config', GA_MEASUREMENT_ID, {
        // Настройки приватности
        anonymize_ip: true,
        // Отключаем автоматическое отслеживание рекламных функций
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        // Для GitHub Pages отключаем cookies, используем только localStorage
        cookie_domain: isGitHubPages ? 'none' : 'auto',
        // Отключаем cookies полностью для GitHub Pages
        cookie_flags: isGitHubPages ? undefined : 'SameSite=Lax;Secure',
        // Используем только localStorage для GitHub Pages (без cookies)
        storage: isGitHubPages ? 'none' : undefined,
        // Отключаем автоматическое создание cookies
        cookie_update: !isGitHubPages,
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

