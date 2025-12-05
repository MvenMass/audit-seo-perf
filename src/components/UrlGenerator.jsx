import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateAuditData } from "../api/generateAuditData";

const BASE_CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Ростов-на-Дону",
  "Уфа",
  "Воронеж",
  "Пермь",
  "Красноярск",
  "Волгоград",
  "Саратов",
  "Тюмень"
];

const UrlGenerator = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [site, setSite] = useState("");
  const [competitors, setCompetitors] = useState(["https://mosseo.ru/", "https://cinar.ru/", "https://stk-promo.com/", "https://www.gemius.ru/", "https://www.advertpro.ru/"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompetitorChange = (index, value) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };

  const handleGenerate = async () => {
    // Проверяем обязательные поля
    if (!city.trim() || !site.trim()) {
      setError("❌ Пожалуйста, заполните поля 'Ваш город' и 'Ваш сайт'");
      return;
    }

    // Очищаем предыдущие ошибки
    setError(null);

    const formData = {
      city,
      site,
      competitors: competitors.filter(comp => comp.trim() !== "")
    };

    setLoading(true);

    try {
      console.log('[UrlGenerator] 📤 Начинаем анализ...');
      
      // Пытаемся получить данные от backend
      const auditData = await generateAuditData(formData);

      console.log('[UrlGenerator] ✅ Данные получены, переходим на страницу результатов');
      
      // Если успешно, передаем оба набора данных
      navigate('/audit-results', {
        state: {
          formData,
          auditData // Данные от backend
        }
      });
    } catch (err) {
      console.error('[UrlGenerator] ❌ Error:', err.message);

      // Определяем тип ошибки и показываем соответствующее сообщение
      let errorMessage = "❌ Ошибка при анализе сайта";

      if (err.message.includes('timeout')) {
        errorMessage = "⏱️ Анализ занял слишком долго (более 5 минут). Пожалуйста, попробуйте позже.";
      } else if (err.message.includes('Network error') || err.message.includes('Failed to fetch')) {
        errorMessage = "🌐 Не удается подключиться к серверу. Проверьте интернет-соединение и убедитесь, что сервер запущен.";
      } else if (err.message.includes('Backend error')) {
        errorMessage = `⚠️ Ошибка сервера: ${err.message}`;
      } else if (err.message.includes('не найден в справочнике')) {
        errorMessage = `❌ ${err.message}`;
      } else {
        errorMessage = `❌ ${err.message}`;
      }

      setError(errorMessage);

      // Опционально: все равно показать результаты с fallback данными
      // Раскомментируй эту часть, если хочешь показывать результаты даже при ошибке
      /*
      console.warn('[UrlGenerator] 📊 Backend недоступен, используем fallback данные');
      navigate('/audit-results', {
        state: {
          formData,
          // auditData не передаем - будет использован fallback из auditData.json
          errorMessage: 'Анализ данных выполнен с использованием кэша (backend недоступен)'
        }
      });
      */
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCity("");
    setSite("");
    setCompetitors(["https://mosseo.ru/", "https://cinar.ru/", "https://stk-promo.com/", "https://www.gemius.ru/", "https://www.advertpro.ru/"]);
    setError(null);
  };

  return (
    <div className="url-generator">
      <div className="url-generator-header">
        <span>Аудит сайта</span> от Seo Performance
      </div>

      {/* Показываем ошибку, если она есть */}
      {error && (
        <div className="url-generator-error">
          {error}
        </div>
      )}

      <div className="url-generator-block">
        <label className="url-generator-label">Ваш город:</label>
        <select
          className="url-generator-input"
          value={city}
          onChange={e => {
            setCity(e.target.value);
            setError(null); // Очищаем ошибку при изменении поля
          }}
          disabled={loading}
        >
          <option value="">Выберите город</option>
          {BASE_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="url-generator-block">
        <label className="url-generator-label">Ваш сайт:</label>
        <input
          type="text"
          value={site}
          onChange={(e) => {
            setSite(e.target.value);
            setError(null); // Очищаем ошибку при изменении поля
          }}
          placeholder="Введите сайт (например: example.com)"
          className="url-generator-input"
          disabled={loading}
        />
      </div>

      <div className="url-generator-block url-generator-block__container">
        <label className="url-generator-label">Укажите сайты конкурентов (опционально):</label>
        <div className="url-generator-block__conc">
          {competitors.map((comp, index) => (
            <input
              key={index}
              type="text"
              value={comp}
              onChange={(e) => {
                handleCompetitorChange(index, e.target.value);
                setError(null); // Очищаем ошибку при изменении поля
              }}
              placeholder={`Сайт конкурента ${index + 1}`}
              className="url-generator-input url-generator-input-conc"
              disabled={loading}
            />
          ))}
        </div>
      </div>

      <div className="url-generator-buttons">
        <button
          className="url-generator-generate"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? '⏳ Анализирование... (может занять до 5 минут)' : '🔍 Начать анализ'}
        </button>
        <button
          className="url-generator-clear"
          onClick={handleClear}
          disabled={loading}
        >
          🗑️ Очистить данные
        </button>
      </div>

      {/* Информация о процессе загрузки */}
      {loading && (
        <div className="url-generator-info">
          <p>⏳ Пожалуйста, подождите...</p>
          <p>Анализ может занять от 1 до 5 минут в зависимости от нагрузки на сервер.</p>
        </div>
      )}
    </div>
  );
};

export default UrlGenerator;