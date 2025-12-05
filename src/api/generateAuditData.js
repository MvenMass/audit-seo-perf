const API_BASE_URL = 'http://109.172.37.52:8080/test';

export const generateAuditData = async (params) => {
  const payload = buildPayload(params);
  
  console.log('[generateAuditData] 📤 Отправляем:', payload);

  try {
    // Шаг 1: Запустить анализ
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

    // Шаг 2: Опрашивать статус каждые 5 секунд
    let completed = false;
    let attempts = 0;
    const maxAttempts = 360; // 30 минут (5 сек × 360)

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Ждём 5 сек
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

export default generateAuditData;
