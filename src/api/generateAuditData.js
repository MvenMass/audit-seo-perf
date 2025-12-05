/**
 * API клиент для генерации данных аудита
 */

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
  'Н. Новгород': { cityCode: 'nnv', cityId: 47 },
  'Нижний Новгород': { cityCode: 'nnv', cityId: 47 },
  'Волгоград': { cityCode: 'vlg', cityId: 38 },
  'Воронеж': { cityCode: 'vrn', cityId: 193 },
  'Санкт-Петербург': { cityCode: 'spb', cityId: 2 },
  'Томск': { cityCode: 'tom', cityId: 67 },
  'Челябинск': { cityCode: 'chel', cityId: 56 },
  'Саратов': { cityCode: 'sar', cityId: 64 },
  'Тюмень': { cityCode: 'tum', cityId: 60 }
};

export const generateAuditData = async (params) => {
  const { city, site, competitors } = params;

  const cityInfo = cityMapping[city];
  if (!cityInfo) {
    throw new Error(`Город "${city}" не найден`);
  }

  // ВАЖНО: Нужно МИНИМУМ 5 сайтов!
  const allSites = [site, ...(competitors || [])];
  
  if (allSites.length < 5) {
    throw new Error(
      `Нужно 5 сайтов! Основной: 1, Конкурентов: 4. ` +
      `У тебя есть: ${allSites.length}`
    );
  }

  const payload = {
    cityCode: cityInfo.cityCode,
    cityId: cityInfo.cityId,
    url1: allSites[0],  // Твой сайт
    url2: allSites[1],  // Конкурент 1
    url3: allSites[2],  // Конкурент 2
    url4: allSites[3],  // Конкурент 3
    url5: allSites[4]   // Конкурент 4
  };

  console.log('[generateAuditData] 📤 Запрос:', payload);

  try {
    const response = await fetch(
      `${API_BASE_URL}/generate-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Backend ошибка: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('[generateAuditData] ✅ Успешно!', data);
    return data;
    
  } catch (error) {
    console.error('[generateAuditData] ❌ Ошибка:', error.message);
    throw error;
  }
};

export default generateAuditData;
