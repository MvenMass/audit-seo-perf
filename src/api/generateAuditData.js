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
    url1: urls[0] || '',
    url2: urls[1] || '',
    url3: urls[2] || '',
    url4: urls[3] || '',
    url5: urls[4] || ''
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

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error('[generateAuditData] ❌ Ошибка сервера:', errorText);
      throw new Error(`Ошибка запуска: ${startResponse.status} - ${errorText}`);
    }

    // ✅ Сервер сразу возвращает данные
    const auditData = await startResponse.json();
    console.log('[generateAuditData] ✅ Данные получены!');
    
    return auditData;

  } catch (error) {
    console.error('[generateAuditData] ❌ Ошибка:', error.message);
    throw error;
  }
};

export { cities };
export default generateAuditData;
