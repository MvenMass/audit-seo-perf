const API_BASE_URL = '/api';

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

const REQUEST_TIMEOUT_MS = 60 * 60 * 1000; // 1 час

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
    url5: urls[4] || '',
    url6: urls[5] || ''
  };
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: сервер слишком долго не отвечал. Попробуйте позже или сократите объем анализа.');
    }

    if (error.message === 'Failed to fetch') {
      throw new Error(
        'Network error: не удается подключиться к серверу.\n\n' 
      );
    }

    if (error.message.includes('net::ERR_TIMED_OUT')) {
      throw new Error(
        'Browser timeout: браузер ожидал ответа слишком долго. ' +
        'Возможна проблема с сетевой инфраструктурой или прокси между браузером и backend.'
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const generateAuditData = async (params) => {
  const payload = buildPayload(params);

  return fetchWithTimeout(
    `${API_BASE_URL}/generate-url`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      referrerPolicy: 'unsafe-url'
    }
  );
};

export default generateAuditData;
 