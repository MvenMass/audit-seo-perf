// audit-seo-perf/src/api/generateAuditData.js

const API_BASE_URL = 'http://109.172.37.52:8080';

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

// 40 минут — реально нужно для анализа
const REQUEST_TIMEOUT_MS = 40 * 60 * 1000;

const buildPayload = ({ city, site, competitors }) => {
  const cityInfo = cityMapping[city];

  if (!cityInfo) {
    throw new Error(`Город "${city}" не найден в справочнике`);
  }

  const urls = [site, ...(competitors || [])];

  return {
    cityCode: cityInfo.cityCode,
    cityId: cityInfo.cityId,
    url1: urls[0] || '',
    url2: urls[1] || '',
    url3: urls[2] || '',
    url4: urls[3] || '',
    url5: urls[4] || ''
  };
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log('[generateAuditData] 📤 Отправляем запрос:', {
      url,
      method: options.method,
      timeout: `${Math.round(timeoutMs / 1000 / 60)} мин`
    });

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[generateAuditData] ❌ Backend ошибка ${response.status}:`, errorText);
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[generateAuditData] ✅ Успешный ответ от сервера');
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    console.error('[generateAuditData] 🔴 Ошибка:', error.message);

    // AbortError — это таймаут
    if (error.name === 'AbortError') {
      throw new Error(
        'Timeout: сервер не ответил за 40 минут. ' +
        'Анализ больших объёмов данных может занять время. ' +
        'Попробуйте позже или сократите количество URL.'
      );
    }

    // Failed to fetch — обычно сетевая ошибка
    if (error.message === 'Failed to fetch' || error.message.includes('ERR_TIMED_OUT')) {
      throw new Error(
        'Network error: не удается подключиться к серверу.\n\n' +
        'Проверьте:\n' +
        '1. Backend запущен на http://109.172.37.52:8080\n' +
        '2. Порт 8080 открыт в файрволе\n' +
        '3. Сеть доступна'
      );
    }

    throw error;
  }
};

export const generateAuditData = async (params) => {
  try {
    const payload = buildPayload(params);
    
    console.log('[generateAuditData] 📤 Payload:', payload);

    return await fetchWithTimeout(
      `${API_BASE_URL}/generate-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        referrerPolicy: 'unsafe-url'
      },
      REQUEST_TIMEOUT_MS
    );
  } catch (error) {
    console.error('[generateAuditData] 💥 Fatal error:', error.message);
    throw error;
  }
};

export default generateAuditData;
