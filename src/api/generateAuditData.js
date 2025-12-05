/**
 * API клиент для генерации данных аудита
 * PRODUCTION версия - работает с реальным backend через SSE (Server-Sent Events)
 * Поддерживает долгие запросы без timeout
 */

const API_BASE_URL = 'https://109.172.37.52:8080';

// Маппинг городов на cityCode и cityId
const cityMapping = {
  'Москва': { cityCode: 'msk', cityId: 213 },
  'Ростов-на-Дону': { cityCode: 'rnd', cityId: 39 },
  'Екатеринбург': { cityCode: 'ekb', cityId: 54 },
  'Уфа': { cityCode: 'ufa', cityId: 172 },
  'Краснодар': { cityCode: 'krr', cityId: 35 },
  'Пермь': { cityCode: 'prm', cityId: 50 },
  'Самара': { cityCode: 'sam', cityId: 51 },
  'Красноярск': { cityCode: 'kry', cityId: 62 },
  'Омск': { cityCode: 'oms', cityId: 66 },
  'Казань': { cityCode: 'kzn', cityId: 43 },
  'Новосибирск': { cityCode: 'nsk', cityId: 65 },
  'Нижний Новгород': { cityCode: 'nnv', cityId: 47 },
  'Волгоград': { cityCode: 'vlg', cityId: 38 },
  'Воронеж': { cityCode: 'vrn', cityId: 193 },
  'Санкт-Петербург': { cityCode: 'spb', cityId: 2 },
  'Томск': { cityCode: 'tom', cityId: 67 },
  'Челябинск': { cityCode: 'chel', cityId: 56 },
  'Саратов': { cityCode: 'sar', cityId: 64 },
  'Тюмень': { cityCode: 'tum', cityId: 60 }
};

// SSE поллинг для отслеживания прогресса
const SSE_PROGRESS_ENDPOINT = '/sse-progress';

/**
 * Проверяет поддержку SSE в браузере
 */
const isSSESupported = () => {
  return typeof EventSource !== 'undefined';
};

/**
 * Устанавливает SSE соединение для отслеживания прогресса
 * @param {string} taskId - ID задачи
 * @param {Function} onProgress - callback при обновлении прогресса
 * @param {Function} onComplete - callback при завершении
 * @param {Function} onError - callback при ошибке
 */
const setupSSEConnection = (taskId, onProgress, onComplete, onError) => {
  if (!isSSESupported()) {
    console.warn('[SSE] EventSource не поддерживается в этом браузере');
    return null;
  }

  const eventSource = new EventSource(
    `${API_BASE_URL}${SSE_PROGRESS_ENDPOINT}?taskId=${taskId}`
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'progress':
          console.log(`[SSE] Прогресс: ${data.progress}% - ${data.message || ''}`);
          if (onProgress) onProgress(data.progress, data.message);
          break;
          
        case 'complete':
          console.log('[SSE] Задача завершена:', data.result ? 'есть результат' : 'без результата');
          eventSource.close();
          if (onComplete) onComplete(data.result);
          break;
          
        case 'error':
          console.error('[SSE] Ошибка задачи:', data.error);
          eventSource.close();
          if (onError) onError(new Error(data.error));
          break;
          
        case 'heartbeat':
          // Просто обновляем таймаут, ничего не делаем
          console.log('[SSE] Heartbeat получен');
          break;
          
        default:
          console.warn('[SSE] Неизвестный тип сообщения:', data.type);
      }
    } catch (parseError) {
      console.error('[SSE] Ошибка парсинга сообщения:', parseError);
    }
  };

  eventSource.onerror = (error) => {
    console.error('[SSE] Ошибка соединения:', error);
    eventSource.close();
    if (onError) onError(new Error('Ошибка SSE соединения'));
  };

  return eventSource;
};

/**
 * Основной метод для генерации данных аудита через SSE
 * @param {object} params - параметры запроса
 * @param {string} params.city - название города
 * @param {string} params.site - основной сайт
 * @param {array} params.competitors - массив сайтов конкурентов
 * @returns {Promise<object>} - данные аудита
 */
export const generateAuditDataSSE = async (params) => {
  const { city, site, competitors } = params;

  // Получаем cityCode и cityId
  const cityInfo = cityMapping[city];
  if (!cityInfo) {
    throw new Error(`Город "${city}" не найден в справочнике`);
  }

  // Подготавливаем данные для отправки
  const payload = {
    cityCode: cityInfo.cityCode,
    cityId: cityInfo.cityId,
    url1: site,
    url2: competitors[0] || '',
    url3: competitors[1] || '',
    url4: competitors[2] || '',
    url5: competitors[3] || '',
    url6: competitors[4] || '',
    // Добавляем timestamp для уникальности
    timestamp: Date.now()
  };

  console.log('[generateAuditDataSSE] 📤 Отправляем запрос к backend:', {
    url: `${API_BASE_URL}/generate-audit-sse`,
    payload
  });

  try {
    const response = await fetch(`${API_BASE_URL}/generate-audit-sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generateAuditDataSSE] ❌ Backend error: ${response.status}`);
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.taskId) {
      console.log(`[generateAuditDataSSE] ✅ Задача создана, ID: ${result.taskId}`);
      
      // Возвращаем промис, который резолвится когда задача будет выполнена
      return new Promise((resolve, reject) => {
        let progress = 0;
        let lastUpdate = Date.now();
        
        const eventSource = setupSSEConnection(
          result.taskId,
          (newProgress, message) => {
            progress = newProgress;
            lastUpdate = Date.now();
            console.log(`[generateAuditDataSSE] Прогресс обновлен: ${progress}%`);
          },
          (resultData) => {
            console.log('[generateAuditDataSSE] ✅ Задача завершена успешно');
            if (eventSource) eventSource.close();
            resolve(resultData);
          },
          (error) => {
            console.error('[generateAuditDataSSE] ❌ Ошибка в задаче:', error);
            if (eventSource) eventSource.close();
            reject(error);
          }
        );
        
        if (!eventSource) {
          reject(new Error('SSE не поддерживается в этом браузере'));
          return;
        }
        
        // Таймаут на случай если соединение потеряно
        const checkInterval = setInterval(() => {
          if (Date.now() - lastUpdate > 5 * 60 * 1000) { // 5 минут без обновлений
            console.error('[generateAuditDataSSE] ⏱️ Нет обновлений более 5 минут');
            clearInterval(checkInterval);
            if (eventSource) eventSource.close();
            reject(new Error('Нет обновлений от сервера более 5 минут'));
          }
        }, 30000); // Проверяем каждые 30 секунд
        
        // Очистка при завершении
        const originalClose = eventSource.close;
        eventSource.close = function() {
          clearInterval(checkInterval);
          originalClose.call(this);
        };
      });
    } else if (result.data) {
      // Если результат получен сразу
      console.log('[generateAuditDataSSE] ✅ Данные получены сразу');
      return result.data;
    } else {
      throw new Error('Некорректный ответ от сервера');
    }
  } catch (error) {
    console.error('[generateAuditDataSSE] ❌ Error:', error.message);
    throw error;
  }
};

/**
 * Fallback метод для старых браузеров (если SSE не поддерживается)
 */
export const generateAuditDataFallback = async (params) => {
  const { city, site, competitors } = params;

  const cityInfo = cityMapping[city];
  if (!cityInfo) {
    throw new Error(`Город "${city}" не найден в справочнике`);
  }

  const payload = {
    cityCode: cityInfo.cityCode,
    cityId: cityInfo.cityId,
    url1: site,
    url2: competitors[0] || '',
    url3: competitors[1] || '',
    url4: competitors[2] || '',
    url5: competitors[3] || '',
    url6: competitors[4] || ''
  };

  console.log('[generateAuditDataFallback] 📤 Отправляем запрос (fallback):', {
    url: `${API_BASE_URL}/generate-audit-long`,
    payload
  });

  try {
    // Используем очень большой таймаут (30 минут)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000);

    const response = await fetch(`${API_BASE_URL}/generate-audit-long`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[generateAuditDataFallback] ✅ Данные получены');
    return data;
  } catch (error) {
    console.error('[generateAuditDataFallback] ❌ Error:', error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('Запрос был отменен из-за таймаута (30 минут). Пожалуйста, попробуйте позже или используйте современный браузер.');
    }
    
    throw error;
  }
};

/**
 * Универсальный метод для генерации данных аудита
 * Автоматически выбирает лучший способ в зависимости от поддержки браузера
 */
export const generateAuditData = async (params) => {
  console.log('[generateAuditData] 🚀 Начинаем генерацию аудита...');
  
  // Проверяем поддержку SSE
  if (isSSESupported()) {
    console.log('[generateAuditData] Браузер поддерживает SSE, используем продвинутый метод');
    try {
      return await generateAuditDataSSE(params);
    } catch (sseError) {
      console.warn('[generateAuditData] SSE метод не сработал, пробуем fallback:', sseError.message);
      // Пробуем fallback метод
      return await generateAuditDataFallback(params);
    }
  } else {
    console.log('[generateAuditData] Браузер не поддерживает SSE, используем fallback метод');
    return await generateAuditDataFallback(params);
  }
};

/**
 * Проверяет статус существующей задачи по ID
 * @param {string} taskId - ID задачи
 * @returns {Promise<object>} - статус задачи
 */
export const checkTaskStatus = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/task-status/${taskId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[checkTaskStatus] ❌ Error:', error.message);
    throw error;
  }
};

/**
 * Отменяет выполнение задачи
 * @param {string} taskId - ID задачи
 */
export const cancelTask = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cancel-task/${taskId}`, {
      method: 'POST'
    });
    return response.ok;
  } catch (error) {
    console.error('[cancelTask] ❌ Error:', error.message);
    return false;
  }
};

export default generateAuditData;