/**
 * API клиент для генерации данных аудита
 * РАБОЧАЯ ВЕРСИЯ - исправлена проблема с SSL
 */

// ИСПРАВЛЕНО: Используем HTTP вместо HTTPS для порта 8080
const API_BASE_URL = 'http://109.172.37.52:8080';

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
 * Проверяем доступность сервера и правильный протокол
 */
export const checkServerConnection = async () => {
  console.log('[Connection Test] Проверяем соединение с сервером...');
  
  // Тестируем оба протокола
  const testUrls = [
    'http://109.172.37.52:8080/',
    'http://109.172.37.52:8080/health',
    'http://109.172.37.52:8080/generate-url',
    'https://109.172.37.52:8080/', // на случай если SSL заработает
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      console.log(`[Connection Test] Тестируем: ${url}`);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-store'
      });
      
      const elapsed = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        results.push({
          url,
          success: true,
          status: response.status,
          time: elapsed,
          protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
          data
        });
        console.log(`[Connection Test] ✅ ${url}: OK (${elapsed}ms)`);
      } else {
        results.push({
          url,
          success: false,
          status: response.status,
          protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
          error: `HTTP ${response.status}`
        });
        console.log(`[Connection Test] ❌ ${url}: HTTP ${response.status}`);
      }
    } catch (error) {
      results.push({
        url,
        success: false,
        protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
        error: error.message
      });
      console.log(`[Connection Test] ❌ ${url}: ${error.message}`);
    }
    
    // Пауза между тестами
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Находим рабочий протокол
  const workingProtocol = results.find(r => r.success)?.protocol || 'none';
  console.log(`[Connection Test] Рабочий протокол: ${workingProtocol}`);
  
  return {
    tests: results,
    workingProtocol,
    timestamp: new Date().toISOString(),
    recommendation: workingProtocol === 'HTTP' 
      ? 'Используйте HTTP для подключения к порту 8080'
      : 'Проверьте настройки сервера'
  };
};

/**
 * Основной метод генерации данных аудита
 * Автоматически определяет правильный протокол и эндпоинт
 */
export const generateAuditData = async (params) => {
  const { city, site, competitors } = params;
  
  console.log('[generateAuditData] 🚀 Начинаем генерацию аудита...', {
    city,
    site,
    competitors: competitors?.length || 0
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
    timestamp: Date.now(),
    request_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  };

  console.log('[generateAuditData] 📤 Отправляем запрос:', payload);

  // Пробуем разные эндпоинты и протоколы
  const endpoints = [
    // Основные эндпоинты через HTTP (так как SSL не работает на 8080)
    'http://109.172.37.52:8080/generate-url',
    'http://109.172.37.52:8080/generate-audit',
    'http://109.172.37.52:8080/api/generate',
    'http://109.172.37.52:8080/audit/generate',
    
    // Альтернативные пути
    'http://109.172.37.52:8080/',
    'http://109.172.37.52:8080/process',
    
    // На всякий случай пробуем HTTPS (может быть настроен позже)
    'https://109.172.37.52:8080/generate-url',
  ];

  let lastError = null;
  
  for (const endpoint of endpoints) {
    console.log(`[generateAuditData] Пробуем эндпоинт: ${endpoint}`);
    
    try {
      const controller = new AbortController();
      // Очень большой таймаут - до 30 минут
      const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000);
      
      const startTime = Date.now();
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Request-ID': payload.request_id,
          'X-City-Code': payload.cityCode
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });
      
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text');
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
      const data = await response.json();
      
      console.log(`[generateAuditData] ✅ Успех! Эндпоинт: ${endpoint}`);
      console.log(`[generateAuditData] Время выполнения: ${elapsed}ms`);
      console.log(`[generateAuditData] Размер данных: ${JSON.stringify(data).length} байт`);
      
      // Добавляем метаданные о запросе
      data._metadata = {
        generated_at: new Date().toISOString(),
        endpoint_used: endpoint,
        processing_time: elapsed,
        request_id: payload.request_id
      };
      
      return data;
      
    } catch (error) {
      console.warn(`[generateAuditData] Эндпоинт ${endpoint} не сработал:`, error.message);
      lastError = error;
      
      // Пауза перед следующей попыткой
      if (endpoint !== endpoints[endpoints.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // Если все эндпоинты провалились
  console.error('[generateAuditData] ❌ Все эндпоинты недоступны');
  
  // Генерируем локальные данные с информацией об ошибке
  return generateEmergencyResponse(payload, lastError);
};

/**
 * Аварийный ответ, когда сервер недоступен
 */
function generateEmergencyResponse(payload, error) {
  console.warn('[generateAuditData] ⚠️ Сервер недоступен, генерируем аварийный ответ');
  
  const sites = [
    payload.url1,
    payload.url2,
    payload.url3,
    payload.url4,
    payload.url5,
    payload.url6
  ].filter(url => url && url.trim() !== '');
  
  const cityName = Object.keys(cityMapping).find(
    city => cityMapping[city].cityCode === payload.cityCode
  ) || 'Неизвестный город';
  
  return {
    status: 'emergency_mode',
    error: error?.message || 'Сервер недоступен',
    timestamp: new Date().toISOString(),
    request_id: payload.request_id,
    
    audit_data: {
      city: cityName,
      city_code: payload.cityCode,
      analyzed_sites: sites.length,
      
      sites: sites.map((url, index) => ({
        id: index + 1,
        url: url,
        basic_analysis: {
          domain: url ? new URL(url).hostname : 'invalid',
          protocol: url ? (url.startsWith('https://') ? 'HTTPS' : 'HTTP') : 'none',
          has_ssl: url ? url.startsWith('https://') : false,
          is_reachable: 'unknown (сервер недоступен)'
        }
      })),
      
      summary: {
        note: '⚠️ ВНИМАНИЕ: Данные сгенерированы в аварийном режиме',
        reason: 'Сервер аудита временно недоступен',
        recommendations: [
          'Проверьте, запущен ли Python сервер на порту 8080',
          'Убедитесь, что сервер слушает на 0.0.0.0:8080',
          'Проверьте логи сервера на наличие ошибок',
          'Для порта 8080 используйте HTTP, а не HTTPS'
        ],
        
        technical_details: {
          expected_endpoint: 'http://109.172.37.52:8080/generate-url',
          actual_error: error?.message || 'Connection timeout',
          timestamp: new Date().toISOString(),
          diagnostic_command: 'curl -X POST http://109.172.37.52:8080/generate-url -H "Content-Type: application/json" -d \'{"test":"data"}\''
        }
      }
    },
    
    debug_info: {
      payload_sent: payload,
      connection_advice: [
        'SSL не настроен на порту 8080 - используйте HTTP',
        'Проверьте: sudo netstat -tulpn | grep :8080',
        'Запустите сервер: python3 /path/to/your/server.py'
      ]
    }
  };
}

/**
 * Простой тест сервера через HTTP
 */
export const testServerSimple = async () => {
  try {
    console.log('[Test] Простой тест сервера через HTTP...');
    
    const response = await fetch('http://109.172.37.52:8080/', {
      method: 'GET',
      headers: { 'Accept': 'text/plain' },
      mode: 'no-cors', // Не проверяем CORS для теста
      cache: 'no-store'
    });
    
    const text = await response.text();
    console.log('[Test] Ответ сервера:', text.substring(0, 100));
    
    return {
      success: true,
      status: 'Сервер отвечает',
      protocol: 'HTTP',
      response_preview: text.substring(0, 100)
    };
  } catch (error) {
    console.error('[Test] Ошибка:', error.message);
    
    return {
      success: false,
      error: error.message,
      advice: [
        '1. Убедитесь, что сервер запущен: python3 server.py',
        '2. Проверьте, что сервер слушает на 0.0.0.0:8080',
        '3. Используйте HTTP, а не HTTPS для порта 8080'
      ]
    };
  }
};

/**
 * Быстрая диагностика проблемы
 */
export const diagnoseIssue = async () => {
  console.log('[Diagnose] Быстрая диагностика...');
  
  // Проверяем базовую доступность
  try {
    // Пробуем HTTP GET
    const httpTest = await fetch('http://109.172.37.52:8080/', {
      method: 'GET',
      mode: 'no-cors'
    }).catch(() => null);
    
    // Пробуем HTTP POST
    const postTest = await fetch('http://109.172.37.52:8080/generate-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'diagnostic' }),
      mode: 'no-cors'
    }).catch(() => null);
    
    return {
      http_get: httpTest ? 'possible' : 'failed',
      http_post: postTest ? 'possible' : 'failed',
      ssl_issue: 'SSL не настроен на порту 8080 - используйте HTTP',
      recommendation: 'Измените API_BASE_URL на http://109.172.37.52:8080'
    };
  } catch (error) {
    return {
      error: error.message,
      critical_issue: 'Сервер полностью недоступен',
      immediate_actions: [
        '1. Запустите сервер: cd /path/to/server && python3 main.py',
        '2. Проверьте: curl http://localhost:8080/',
        '3. Убедитесь, что в коде сервера: app.run(host="0.0.0.0", port=8080)'
      ]
    };
  }
};

export default generateAuditData;