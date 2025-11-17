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
      
      // Базовая конфигурация GA4
      const gaConfig = {
        // Настройки приватности
        anonymize_ip: true,
        // Отключаем автоматическое отслеживание рекламных функций
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      };
      
      // Для GitHub Pages отключаем cookies полностью
      if (isGitHubPages) {
        gaConfig.cookie_domain = 'none';
        gaConfig.cookie_update = false;
        gaConfig.cookie_expires = 0; // Отключаем cookies
      }
      
      gtag('config', GA_MEASUREMENT_ID, gaConfig);

  // Отслеживание переходов между страницами (для SPA)
  // Используем только page_path, не перезаписываем всю конфигурацию
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      // Используем event вместо config, чтобы не перезаписывать cookies
      gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
      });
    }
  }).observe(document, { subtree: true, childList: true });
}

