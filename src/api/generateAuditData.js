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
]

const EXTERNAL_API_URL = "http://109.172.37.52:3000/generate-url"

const buildPayload = (cityCode, cityId, urls) => {
  return {
    cityCode,
    cityId,
    urls
  }
}

const validateRequest = (body) => {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body")
  }

  if (!body.city) {
    throw new Error("Город не указан")
  }

  if (!body.site) {
    throw new Error("Сайт не указан")
  }
}

const findCity = (cityName) => {
  const city = cities.find(c => c.name === cityName)
  if (!city) {
    throw new Error(`Город "${cityName}" не найден в справочнике`)
  }
  return city
}

const buildUrlsArray = (site, competitors) => {
  const urls = [
    site,
    ...(competitors || [])
  ].filter(url => typeof url === 'string' && url.trim() !== '')

  if (urls.length < 1) {
    throw new Error("Укажите хотя бы один URL сайта")
  }

  const urlsArray = urls.slice(0, 5)
  while (urlsArray.length < 5) {
    urlsArray.push('')
  }

  return urlsArray
}

export const generateAuditData = async (params) => {
  try {
    // 1. Валидация
    validateRequest(params)

    // 2. Преобразуем город
    const city = findCity(params.city)

    // 3. Строим массив URL
    const urlsArray = buildUrlsArray(params.site, params.competitors)

    // 4. Формируем payload
    const payload = buildPayload(city.code, city.id, urlsArray)
    
    console.log('[generateAuditData] 📤 Отправляем:', payload)
    console.log(`[generateAuditData] Город: ${city.name} (${city.code}/${city.id})`)

    // 5. Отправляем запрос
    const startResponse = await fetch(EXTERNAL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const responseData = await startResponse.json().catch(() => null)

    if (!startResponse.ok) {
      console.error("External API error:", {
        status: startResponse.status,
        data: responseData
      })
      throw new Error(responseData?.error || "External API error")
    }

    const { taskId, statusUrl } = responseData

    if (!taskId || !statusUrl) {
      throw new Error("Invalid response from external API")
    }

    console.log(`[generateAuditData] ✅ Анализ запущен, taskId: ${taskId}`)

    // 6. Опрашиваем статус
    let completed = false
    let attempts = 0
    const maxAttempts = 360

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++

      const statusResponse = await fetch(`${EXTERNAL_API_URL}${statusUrl}`)
      
      if (!statusResponse.ok) {
        throw new Error(`Ошибка проверки статуса: ${statusResponse.status}`)
      }

      const status = await statusResponse.json()
      console.log(`[generateAuditData] Попытка ${attempts}: статус = ${status.status}`)

      if (status.status === 'completed') {
        console.log('[generateAuditData] ✅ Успех!', status.data)
        return status.data
      }

      if (status.status === 'failed') {
        throw new Error(`Анализ ошибка: ${status.error}`)
      }
    }

    throw new Error("Анализ занял слишком долго (30+ минут)")

  } catch (error) {
    console.error('[generateAuditData] ❌ Ошибка:', error.message)
    throw error
  }
}

export { cities }
export default generateAuditData
