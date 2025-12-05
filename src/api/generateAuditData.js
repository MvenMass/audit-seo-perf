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

const buildPayload = ({ city, site, competitors }) => {
  const cityInfo = cityMapping[city];
  if (!cityInfo) throw new Error(`Город "${city}" не найден`);

  const urls = [site, ...competitors].filter(Boolean);

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

export const generateAuditData = async (params, onProgress) => {
  const payload = buildPayload(params);
  
  console.log('[generateAuditData] 📤 Отправляем:', payload);

  const controller = new AbortController();
  
  // ⚠️ ВАЖНО: браузер сам может отменить запрос раньше (ERR_TIMED_OUT)
  // Устанавливаем очень большой таймаут, просто для подстраховки
  const timeout = setTimeout(() => {
    console.log('[generateAuditData] ⏱️ AbortController timeout срабатывает');
    controller.abort();
  }, 10 * 60 * 1000); // 10 минут для AbortController (очень много)

  try {
    const response = await fetch(`${API_BASE_URL}/generate-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Ошибка ${response.status}`);
    
    const data = await response.json();
    console.log('[generateAuditData] ✅ Успех');
    return data;
  } catch (error) {
    clearTimeout(timeout);
    
    console.error('[generateAuditData] Ошибка:', error.name, error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: запрос отменён (10+ минут)');
    }
    
    // Специальная обработка ERR_TIMED_OUT
    if (error.message.includes('Failed to fetch')) {
      throw new Error(
        'Анализ занял слишком долго или сервер недоступен. ' +
        'Попробуйте позже.'
      );
    }
    
    throw error;
  }
};

export default generateAuditData;
