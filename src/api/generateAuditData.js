/**
 * API клиент для генерации данных аудита
 * PRODUCTION версия - работает с реальным backend через SSE (Server-Sent Events)
 * Поддерживает долгие запросы без timeout
 */

const API_BASE_URL = '/api';

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
 * Генерирует данные аудита через backend БЕЗ ограничений по времени
 * Использует простой fetch с длительным timeout на уровне сервера
 * @param {object} params - параметры запроса
 * @param {string} params.city - название города
 * @param {string} params.site - основной сайт
 * @param {array} params.competitors - массив сайтов конкурентов
 * @returns {object} - данные аудита или ошибка
 */
export const generateAuditData = async (params) => {
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
    url6: competitors[4] || ''
  };

  console.log('[generateAuditData] 📤 Отправляем запрос к backend:', {
    url: `${API_BASE_URL}/generate-url`,
    payload,
    timeout: '❌ БЕЗ ОГРАНИЧЕНИЙ - ждем столько, сколько нужно серверу'
  });

  try {
    const startTime = Date.now();

    // ВАЖНО: НЕ используем AbortController!
    // Браузер может сам прервать соединение через ~2-3 минуты
    // но это зависит от настроек сервера и клиента
    const response = await fetch(
      `${API_BASE_URL}/generate-url`,
      {
        method: 'POST',
         referrerPolicy: "unsafe-url",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        // ❌ НЕ добавляем signal: controller.signal
        // Это позволит fetch ждать столько, сколько потребуется
      }
    );

    const elapsedTime = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    console.log(`[generateAuditData] ✅ Ответ получен за ${minutes}м ${seconds}с`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generateAuditData] ❌ Backend error: ${response.status}`);
      console.error('[generateAuditData] Response:', errorText);
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[generateAuditData] ✅ Данные успешно получены');
    console.log('[generateAuditData] Data size:', JSON.stringify(data).length, 'байт');
    return data;
  } catch (error) {
    // Обработка различных типов ошибок
    if (error.name === 'AbortError') {
      console.error('[generateAuditData] ⏱️ Timeout: запрос был прерван');
      throw new Error('Timeout: запрос был прерван. Пожалуйста, попробуйте позже.');
    }

    if (error.message === 'Failed to fetch') {
      console.error('[generateAuditData] 🌐 Network error: не удается подключиться к серверу');
      console.error('[generateAuditData] 💡 Убедись что:');
      console.error('   1. Backend запущен: https://109.172.37.52:8080');
      console.error('   2. Порт 8080 открыт в файрволе');
      console.error('   3. Сервер имеет валидный SSL сертификат');
      throw new Error('Network error: не удается подключиться к серверу.\n\nПожалуйста, проверьте:\n1. Запущен ли backend?\n2. Открыт ли порт 8080?\n3. Есть ли интернет?');
    }

    if (error.message.includes('net::ERR_TIMED_OUT')) {
      console.error('[generateAuditData] ⏱️ Browser timeout: браузер прервал соединение');
      throw new Error('Browser timeout: браузер ожидал слишком долго. Убедитесь, что backend корректно обрабатывает запрос.');
    }

    console.error('[generateAuditData] ❌ Error:', error.message);
    throw error;
  }
};

export default generateAuditData;