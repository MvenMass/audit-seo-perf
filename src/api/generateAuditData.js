const API_BASE_URL = 'http://localhost:3000/generate-url'; 

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

const buildPayload = (params) => {
  return {
    cityCode: params.cityCode,
    cityId: params.cityId,
    urls: [
      params.url1,
      params.url2,
      params.url3,
      params.url4,
      params.url5
    ]
  };
};

export const generateAuditData = async (params) => {
  // Проверка параметров
  if (!params?.cityCode || !params?.cityId) {
    console.error('[generateAuditData] ❌ cityCode и cityId обязательны!');
    throw new Error('cityCode и cityId не переданы');
  }

  const payload = buildPayload(params);
  console.log('[generateAuditData] 📤 Отправляем:', payload);

  try {
    const startResponse = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!startResponse.ok) {
      throw new Error(`Ошибка запуска: ${startResponse.status}`);
    }

    const { taskId, statusUrl } = await startResponse.json();
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
