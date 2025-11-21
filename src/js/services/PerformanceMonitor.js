/**
 * Performance Monitor Service
 * Мониторинг Core Web Vitals и других метрик производительности
 */

/**
 * Класс для мониторинга производительности сайта
 * Отслеживает Core Web Vitals: LCP, CLS, INP, FCP, TTFB
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      LCP: null, // Largest Contentful Paint
      CLS: null, // Cumulative Layout Shift
      INP: null, // Interaction to Next Paint (replaces FID)
      FCP: null, // First Contentful Paint
      TTFB: null, // Time to First Byte
    };
    this.thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      INP: { good: 200, needsImprovement: 500 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 },
    };
    this.observers = [];
    this.initialized = false;
  }

  /**
   * Инициализация мониторинга
   */
  async init() {
    if (this.initialized) return;

    try {
      // Динамический импорт web-vitals для уменьшения initial bundle
      // Note: onFID removed in web-vitals v5.x, use onINP instead
      const { onLCP, onCLS, onINP, onFCP, onTTFB } = await import(
        'web-vitals'
      );

      // Отслеживание LCP
      onLCP(this.handleMetric.bind(this, 'LCP'));

      // Отслеживание CLS
      onCLS(this.handleMetric.bind(this, 'CLS'));

      // Отслеживание INP (новая метрика вместо FID)
      onINP(this.handleMetric.bind(this, 'INP'));

      // Отслеживание FCP
      onFCP(this.handleMetric.bind(this, 'FCP'));

      // Отслеживание TTFB
      onTTFB(this.handleMetric.bind(this, 'TTFB'));

      // Дополнительные метрики производительности
      this.monitorResourceTiming();
      this.monitorNavigationTiming();

      this.initialized = true;

      console.log('✅ Performance Monitor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Performance Monitor:', error);
    }
  }

  /**
   * Обработчик метрик
   * @param {string} metricName - Название метрики
   * @param {Object} metric - Объект метрики
   */
  handleMetric(metricName, metric) {
    this.metrics[metricName] = metric.value;

    const rating = this.getRating(metricName, metric.value);
    const color = this.getRatingColor(rating);

    // Логируем метрику с цветовой индикацией
    console.log(
      `%c${metricName}: ${this.formatValue(metricName, metric.value)} (${rating})`,
      `color: ${color}; font-weight: bold;`
    );

    // Отправляем метрики в аналитику (если настроено)
    this.sendToAnalytics(metricName, metric);
  }

  /**
   * Получить оценку метрики
   * @param {string} metricName - Название метрики
   * @param {number} value - Значение метрики
   * @returns {string} - good, needs-improvement, poor
   */
  getRating(metricName, value) {
    const threshold = this.thresholds[metricName];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Получить цвет для оценки
   * @param {string} rating - Оценка
   * @returns {string} - CSS цвет
   */
  getRatingColor(rating) {
    switch (rating) {
      case 'good':
        return '#0cce6b';
      case 'needs-improvement':
        return '#ffa400';
      case 'poor':
        return '#ff4e42';
      default:
        return '#888888';
    }
  }

  /**
   * Форматирование значения метрики
   * @param {string} metricName - Название метрики
   * @param {number} value - Значение
   * @returns {string} - Форматированное значение
   */
  formatValue(metricName, value) {
    if (metricName === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  }

  /**
   * Мониторинг загрузки ресурсов
   */
  monitorResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Отслеживаем медленные ресурсы
        if (entry.duration > 1000) {
          console.warn(
            `⚠️ Slow resource: ${entry.name} (${Math.round(entry.duration)}ms)`
          );
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing monitoring not supported:', error);
    }
  }

  /**
   * Мониторинг навигации
   */
  monitorNavigationTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        console.group('📊 Navigation Timing');
        console.log(
          `DNS Lookup: ${Math.round(navigation.domainLookupEnd - navigation.domainLookupStart)}ms`
        );
        console.log(
          `TCP Connection: ${Math.round(navigation.connectEnd - navigation.connectStart)}ms`
        );
        console.log(
          `Request: ${Math.round(navigation.responseStart - navigation.requestStart)}ms`
        );
        console.log(
          `Response: ${Math.round(navigation.responseEnd - navigation.responseStart)}ms`
        );
        console.log(
          `DOM Processing: ${Math.round(navigation.domComplete - navigation.domLoading)}ms`
        );
        console.log(
          `Load Complete: ${Math.round(navigation.loadEventEnd - navigation.loadEventStart)}ms`
        );
        console.groupEnd();
      }
    });
  }

  /**
   * Отправка метрик в аналитику
   * @param {string} metricName - Название метрики
   * @param {Object} metric - Объект метрики
   */
  sendToAnalytics(metricName, metric) {
    // Интеграция с Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', metricName, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: this.getRating(metricName, metric.value),
      });
    }

    // Можно добавить отправку на собственный сервер аналитики
    // this.sendToCustomAnalytics(metricName, metric);
  }

  /**
   * Получить все метрики
   * @returns {Object} - Объект с метриками
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Получить сводку производительности
   * @returns {Object} - Сводка с оценками
   */
  getSummary() {
    const summary = {};
    for (const [name, value] of Object.entries(this.metrics)) {
      if (value !== null) {
        summary[name] = {
          value: value,
          rating: this.getRating(name, value),
          formatted: this.formatValue(name, value),
        };
      }
    }
    return summary;
  }

  /**
   * Очистка и отключение мониторинга
   */
  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.initialized = false;
  }
}

// Создаем singleton instance
let performanceMonitorInstance = null;

/**
 * Получить или создать экземпляр Performance Monitor
 * @returns {PerformanceMonitor}
 */
export function getPerformanceMonitor() {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
}

export default PerformanceMonitor;

