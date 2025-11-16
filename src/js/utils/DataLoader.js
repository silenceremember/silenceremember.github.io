/**
 * Утилита для оптимизированной загрузки данных с кешированием и дедупликацией запросов
 */

// Кеш для хранения загруженных данных
const cache = new Map();

// Активные запросы для дедупликации
const pendingRequests = new Map();

// Время жизни кеша (5 минут)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Загружает данные с кешированием и дедупликацией запросов
 * @param {string} url - URL для загрузки
 * @param {Object} options - Опции для fetch
 * @returns {Promise<any>} - Загруженные данные
 */
export async function loadData(url, options = {}) {
  // Проверяем кеш
  const cached = cache.get(url);
  if (cached) {
    const { data, timestamp } = cached;
    const age = Date.now() - timestamp;

    // Если данные свежие, возвращаем из кеша
    if (age < CACHE_TTL) {
      return Promise.resolve(data);
    }

    // Удаляем устаревшие данные из кеша
    cache.delete(url);
  }

  // Проверяем, есть ли уже активный запрос для этого URL
  if (pendingRequests.has(url)) {
    // Возвращаем существующий промис
    return pendingRequests.get(url);
  }

  // Создаем новый запрос с оптимизацией приоритета
  const requestPromise = fetch(url, {
    ...options,
    // Оптимизация: используем высокий приоритет для критических данных
    priority: options.priority || 'high',
    headers: {
      'Cache-Control': 'max-age=300', // 5 минут
      ...options.headers,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Сохраняем в кеш
      cache.set(url, {
        data,
        timestamp: Date.now(),
      });

      return data;
    })
    .catch((error) => {
      console.error(`Ошибка загрузки данных из ${url}:`, error);
      throw error;
    })
    .finally(() => {
      // Удаляем из активных запросов после завершения
      pendingRequests.delete(url);
    });

  // Сохраняем промис для дедупликации
  pendingRequests.set(url, requestPromise);

  return requestPromise;
}
