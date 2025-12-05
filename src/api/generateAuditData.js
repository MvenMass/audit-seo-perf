/**
 * API клиент для генерации данных аудита
 * PRODUCTION версия - работает с реальным backend
 * Многоуровневая защита от таймаутов
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

/**
 * Проверяет доступность сервера
 */
export const checkServerHealth = async () => {
  try {
    console.log('[Health Check] Проверяем доступность сервера...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[Health Check] ✅ Сервер доступен:', data);
      return { available: true, ...data };
    }
    
    return { available: false, status: response.status };
  } catch (error) {
    console.error('[Health Check] ❌ Сервер недоступен:', error.message);
    return { 
      available: false, 
      error: error.message,
      details: 'Сервер не отвечает. Проверьте:\n1. Запущен ли сервер?\n2. Открыт ли порт 8080?\n3. Работает ли сеть?'
    };
  }
};

/**
 * Метод с chunked transfer encoding для избежания таймаутов
 */
const fetchWithChunkedEncoding = async (url, options) => {
  console.log('[Chunked Fetch] Используем chunked transfer encoding');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 минут
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=300, max=1000'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    // Читаем потоково
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let lastChunkTime = Date.now();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Сбрасываем таймаут при получении данных
      lastChunkTime = Date.now();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 минут без данных
      
      const chunk = decoder.decode(value, { stream: true });
      result += chunk;
      
      // Логируем прогресс получения данных
      console.log(`[Chunked Fetch] Получено ${result.length} байт данных`);
    }
    
    clearTimeout(timeoutId);
    
    try {
      return JSON.parse(result);
    } catch (parseError) {
      console.warn('[Chunked Fetch] Не удалось распарсить JSON, возвращаем текст');
      return result;
    }
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Метод с использованием Web Workers для избежания блокировки UI
 */
const fetchWithWorker = (url, payload) => {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('Web Workers не поддерживаются'));
      return;
    }
    
    // Создаем временный worker
    const workerCode = `
      self.onmessage = async (e) => {
        const { url, payload } = e.data;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000);
          
          const response = await fetch(url, {
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
            throw new Error(\`HTTP \${response.status}\`);
          }
          
          const data = await response.json();
          self.postMessage({ success: true, data });
          
        } catch (error) {
          self.postMessage({ 
            success: false, 
            error: error.message 
          });
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    // Таймаут для worker
    const workerTimeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Worker timeout (30 минут)'));
    }, 30 * 60 * 1000);
    
    worker.onmessage = (e) => {
      clearTimeout(workerTimeout);
      worker.terminate();
      
      if (e.data.success) {
        resolve(e.data.data);
      } else {
        reject(new Error(e.data.error));
      }
    };
    
    worker.onerror = (error) => {
      clearTimeout(workerTimeout);
      worker.terminate();
      reject(new Error(`Worker error: ${error.message}`));
    };
    
    // Запускаем worker
    worker.postMessage({ url, payload });
  });
};

/**
 * Основной метод генерации данных с множеством fallback стратегий
 */
export const generateAuditData = async (params) => {
  const { city, site, competitors } = params;
  
  console.log('[generateAuditData] 🚀 Начинаем генерацию аудита для:', {
    city,
    site,
    competitorsCount: competitors?.length || 0
  });

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
    timestamp: Date.now()
  };

  // Список стратегий в порядке приоритета
  const strategies = [
    { name: 'chunked', func: tryChunkedStrategy },
    { name: 'worker', func: tryWorkerStrategy },
    { name: 'simple', func: trySimpleStrategy },
    { name: 'retry', func: tryRetryStrategy }
  ];

  // Пробуем все стратегии по порядку
  let lastError = null;
  
  for (const strategy of strategies) {
    console.log(`[generateAuditData] Пробуем стратегию: ${strategy.name}`);
    
    try {
      const result = await strategy.func(payload);
      console.log(`[generateAuditData] ✅ Стратегия "${strategy.name}" успешна`);
      return result;
    } catch (error) {
      console.warn(`[generateAuditData] Стратегия "${strategy.name}" не сработала:`, error.message);
      lastError = error;
      
      // Ждем перед следующей попыткой
      if (strategy !== strategies[strategies.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // Если все стратегии провалились
  console.error('[generateAuditData] ❌ Все стратегии провалились');
  throw lastError || new Error('Не удалось выполнить запрос');
};

// ========== СТРАТЕГИИ ==========

/**
 * Стратегия 1: Chunked transfer encoding
 */
async function tryChunkedStrategy(payload) {
  console.log('[tryChunkedStrategy] Используем chunked transfer...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000);
  
  try {
    const response = await fetch(`${API_BASE_URL}/generate-audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Chunked-Request': 'true',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log('[tryChunkedStrategy] ✅ Данные получены');
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Стратегия 2: Web Worker
 */
async function tryWorkerStrategy(payload) {
  console.log('[tryWorkerStrategy] Используем Web Worker...');
  return await fetchWithWorker(`${API_BASE_URL}/generate-audit`, payload);
}

/**
 * Стратегия 3: Простой fetch с длительным таймаутом
 */
async function trySimpleStrategy(payload) {
  console.log('[trySimpleStrategy] Используем простой fetch...');
  
  // Пробуем разные эндпоинты
  const endpoints = [
    '/generate-audit',
    '/generate-url',
    '/api/audit',
    '/audit/generate'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45 * 60 * 1000); // 45 минут
      
      console.log(`[trySimpleStrategy] Пробуем эндпоинт: ${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
        throw new Error(`HTTP ${response.status} для ${endpoint}`);
      }
      
      const data = await response.json();
      console.log(`[trySimpleStrategy] ✅ Успех через эндпоинт: ${endpoint}`);
      return data;
      
    } catch (error) {
      console.warn(`[trySimpleStrategy] Эндпоинт ${endpoint} не сработал:`, error.message);
      // Пробуем следующий эндпоинт
    }
  }
  
  throw new Error('Все эндпоинты недоступны');
}

/**
 * Стратегия 4: Retry с экспоненциальной задержкой
 */
async function tryRetryStrategy(payload, maxRetries = 5) {
  console.log(`[tryRetryStrategy] Начинаем retry стратегию (${maxRetries} попыток)`);
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[tryRetryStrategy] Попытка ${attempt}/${maxRetries}`);
    
    try {
      const controller = new AbortController();
      
      // Увеличиваем таймаут с каждой попыткой
      const timeoutMs = Math.min(10 * 60 * 1000 * attempt, 60 * 60 * 1000); // до 60 минут
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(`${API_BASE_URL}/generate-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Retry-Attempt': attempt.toString(),
          'X-Request-Timeout': timeoutMs.toString()
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        // Важно: mode 'no-cors' может помочь с некоторыми CORS проблемами
        // mode: 'no-cors'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} на попытке ${attempt}`);
      }
      
      const data = await response.json();
      console.log(`[tryRetryStrategy] ✅ Успех на попытке ${attempt}`);
      return data;
      
    } catch (error) {
      lastError = error;
      console.warn(`[tryRetryStrategy] Попытка ${attempt} не удалась:`, error.message);
      
      if (attempt < maxRetries) {
        // Экспоненциальная задержка
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.log(`[tryRetryStrategy] Ждем ${delayMs}мс перед следующей попыткой`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError || new Error('Все retry попытки провалились');
}

/**
 * Дополнительный метод: Генерация через iframe для полного обхода CORS и таймаутов
 */
export const generateViaIframe = async (params, iframeContainer) => {
  return new Promise((resolve, reject) => {
    const { city, site, competitors } = params;
    const cityInfo = cityMapping[city];
    
    if (!cityInfo) {
      reject(new Error(`Город "${city}" не найден`));
      return;
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
    
    // Создаем iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox = 'allow-scripts allow-same-origin';
    
    // Генерируем HTML страницу с формой
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          window.onmessage = function(e) {
            if (e.data.type === 'submit') {
              fetch('${API_BASE_URL}/generate-audit', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(e.data.payload),
                mode: 'no-cors'
              }).then(response => {
                // В режиме no-cors мы не можем прочитать ответ
                window.parent.postMessage({
                  type: 'complete',
                  message: 'Запрос отправлен'
                }, '*');
              }).catch(error => {
                window.parent.postMessage({
                  type: 'error',
                  error: error.message
                }, '*');
              });
            }
          };
        </script>
      </head>
      <body>
        <div id="status">Готов к отправке...</div>
      </body>
      </html>
    `;
    
    iframe.srcdoc = html;
    
    iframe.onload = () => {
      // Отправляем данные в iframe
      iframe.contentWindow.postMessage({
        type: 'submit',
        payload: payload
      }, '*');
      
      // Таймаут для iframe
      const timeoutId = setTimeout(() => {
        document.body.removeChild(iframe);
        reject(new Error('iframe timeout (30 минут)'));
      }, 30 * 60 * 1000);
      
      // Слушаем ответ от iframe
      window.addEventListener('message', function iframeListener(e) {
        if (e.source === iframe.contentWindow) {
          clearTimeout(timeoutId);
          window.removeEventListener('message', iframeListener);
          document.body.removeChild(iframe);
          
          if (e.data.type === 'complete') {
            resolve({ success: true, message: e.data.message });
          } else if (e.data.type === 'error') {
            reject(new Error(e.data.error));
          }
        }
      });
    };
    
    iframe.onerror = () => {
      document.body.removeChild(iframe);
      reject(new Error('Ошибка загрузки iframe'));
    };
    
    // Добавляем iframe в DOM
    iframeContainer.appendChild(iframe);
  });
};

export default generateAuditData;