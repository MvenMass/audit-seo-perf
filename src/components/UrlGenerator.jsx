const API_BASE_URL = 'https://audit.seo-performance.ru:3000/generate-url';

const cities = [
  { name: 'Москва', id: 213, code: 'msk' },
  { name: 'Ростов-на-Дону', id: 39, code: 'rnd' },
  { name: 'Екатеринбург', id: 54, code: 'ekb' },
  { name: 'Уфа', id: 172, code: 'ufa' },
  { name: 'Краснодар', id: 35, code: 'krr' },
  { name: 'Пермь', id: 50, code: 'prm' },
  { name: 'Самара', id: 51, code: 'sam' },
  { name: 'Красноярск', id: 62, code: 'kry' },
  { name: 'Омск', id: 66, code: 'oms' },
  { name: 'Казань', id: 43, code: 'kzn' },
  { name: 'Новосибирск', id: 65, code: 'nsk' },
  { name: 'Н. Новгород', id: 47, code: 'nnv' },
  { name: 'Волгоград', id: 38, code: 'vlg' },
  { name: 'Воронеж', id: 193, code: 'vrn' },
  { name: 'Санкт-Петербург', id: 2, code: 'spb' },
  { name: 'Томск', id: 67, code: 'tom' }
];

const buildPayload = (cityCode, cityId, urls) => {
  return {
    cityCode,
    cityId,
    urls
  };
};

export const generateAuditData = async (params) => {
  const city = cities.find(c => c.name === params.city);
  
  if (!city) {
    throw new Error(`❌ Город "${params.city}" не найден в справочнике`);
  }

  const urls = [
    params.site,
    ...(params.competitors || [])
  ].filter(url => url.trim() !== '');

  if (urls.length < 1) {
    throw new Error('❌ Укажите хотя бы один URL сайта');
  }

  const urlsArray = urls.slice(0, 5);
  
  while (urlsArray.length < 5) {
    urlsArray.push('');
  }

  const payload = buildPayload(city.code, city.id, urlsArray);
  
  console.log('[generateAuditData] 📤 Отправляем:', JSON.stringify(payload, null, 2));
  console.log(`[generateAuditData] Город: ${city.name} (${city.code}/${city.id})`);

  try {
    const startResponse = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit' 
    });

    console.log('[generateAuditData] 📊 Статус ответа:', startResponse.status);

    // ✅ ПОЛУЧИ ТЕКСТ ОШИБКИ ОТ СЕРВЕРА
    const responseText = await startResponse.text();
    console.log('[generateAuditData] 📝 Тело ответа:', responseText);

    if (!startResponse.ok) {
      console.error('[generateAuditData] ❌ Ошибка сервера:', responseText);
      throw new Error(`Ошибка запуска: ${startResponse.status} - ${responseText}`);
    }

    // Парси JSON только если статус OK
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Ошибка парсинга JSON: ${responseText}`);
    }

    const { taskId, statusUrl } = responseData;
    
    if (!taskId || !statusUrl) {
      console.error('[generateAuditData] ❌ Ошибка: отсутствует taskId или statusUrl');
      throw new Error('Сервер вернул неполные данные');
    }

    console.log(`[generateAuditData] ✅ Анализ запущен, taskId: ${taskId}`);

    // Опрашивание статуса...
    let completed = false;
    let attempts = 0;
    const maxAttempts = 360;

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;

      const statusResponse = await fetch(`${API_BASE_URL}${statusUrl}`);
      
      if (!statusResponse.ok) {
        throw new Error(`Ошибка проверки статуса: ${statusResponse.status}`);
      }

      const status = await statusResponse.json();
      console.log(`[generateAuditData] Попытка ${attempts}: статус = ${status.status}`);

      if (status.status === 'completed') {
        console.log('[generateAuditData] ✅ Успех!', status.data);
        return status.data;
      }

      if (status.status === 'failed') {
        throw new Error(`Анализ ошибка: ${status.error}`);
      }
    }

    throw new Error('Анализ занял слишком долго (30+ минут)');

  } catch (error) {
    console.error('[generateAuditData] ❌ Ошибка:', error.message);
    throw error;
  }
};

export { cities };
export default generateAuditData;
