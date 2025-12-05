/**
 * API клиент для генерации данных аудита
 * PRODUCTION версия - работает с реальным backend через XMLHttpRequest
 * Поддерживает долгие запросы без timeout
 */

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
 * Генерирует данные аудита через XMLHttpRequest
 * БЕЗ ограничений по времени на уровне браузера
 * @param {object} params - параметры запроса
 * @param {string} params.city - название города
 * @param {string} params.site - основной сайт
 * @param {array} params.competitors - массив сайтов конкурентов
 * @returns {Promise<object>} - данные аудита или ошибка
 */
export const generateAuditData = async (params) => {
  return new Promise((resolve, reject) => {
    const { city, site, competitors } = params;

    // Получаем cityCode и cityId
    const cityInfo = cityMapping[city];
    if (!cityInfo) {
      reject(new Error(`Город "${city}" не найден в справочнике`));
      return;
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

    console.log('[generateAuditData] 📤 Отправляем XMLHttpRequest:', {
      url: `${API_BASE_URL}/generate-url`,
      payload,
      timeout: '❌ БЕЗ ОГРАНИЧЕНИЙ - ждем столько, сколько нужно серверу'
    });

    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    // ✅ БЕЗ timeout - XMLHttpRequest будет ждать столько, сколько нужно
    // xhr.timeout = 0; // 0 = без ограничений (по умолчанию)

    // Обработчик успешного ответа
    xhr.onload = () => {
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      console.log(`[generateAuditData] ✅ Ответ получен за ${minutes}м ${seconds}с`);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log('[generateAuditData] ✅ Данные успешно получены');
          console.log('[generateAuditData] Data size:', xhr.responseText.length, 'байт');
          resolve(data);
        } catch (error) {
          console.error('[generateAuditData] ❌ JSON parse error:', error.message);
          reject(new Error(`JSON parse error: ${error.message}`));
        }
      } else {
        console.error(`[generateAuditData] ❌ Backend error: ${xhr.status}`);
        console.error('[generateAuditData] Response:', xhr.responseText);
        reject(new Error(`Backend error: ${xhr.status} - ${xhr.responseText}`));
      }
    };

    // Обработчик ошибки сети
    xhr.onerror = () => {
      console.error('[generateAuditData] 🌐 Network error');
      console.error('[generateAuditData] 💡 Убедись что:');
      console.error('   1. Backend запущен: http://109.172.37.52:8080');
      console.error('   2. Порт 8080 открыт в файрволе');
      console.error('   3. Backend отправляет CORS заголовки');
      reject(new Error(
        'Network error: не удается подключиться к серверу.\n\n' +
        'Пожалуйста, проверьте:\n' +
        '1. Запущен ли backend?\n' +
        '2. Открыт ли порт 8080?\n' +
        '3. Есть ли интернет?'
      ));
    };

    // Обработчик timeout (если вдруг сработает)
    xhr.ontimeout = () => {
      console.error('[generateAuditData] ⏱️ Timeout: запрос был прерван');
      reject(new Error('Timeout: запрос был прерван. Пожалуйста, попробуйте позже.'));
    };

    // Обработчик прогресса (опционально, для отслеживания загрузки)
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        console.log(`[generateAuditData] 📊 Прогресс: ${percentComplete}%`);
      }
    };

    // Инициализируем запрос
    xhr.open('POST', `${API_BASE_URL}/generate-url`, true);

    // Устанавливаем заголовки
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    // 🔧 ОПЦИОНАЛЬНО: если нужна авторизация
    // xhr.withCredentials = true; // отправляем cookies вместе с запросом

    // Отправляем запрос
    xhr.send(JSON.stringify(payload));
  });
};

export default generateAuditData;
