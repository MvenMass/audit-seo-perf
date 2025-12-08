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

// ✅ УБЕДИСЬ, ЧТО ЭТО НЕ ASYNC
const UrlGenerator = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [site, setSite] = useState("");
  const [competitors, setCompetitors] = useState([
    "https://mosseo.ru/",
    "https://cinar.ru/",
    "https://stk-promo.com/",
    "https://www.gemius.ru/",
    "https://www.advertpro.ru/"
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompetitorChange = (index, value) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };

  const handleGenerate = async () => {
    if (!city.trim() || !site.trim()) {
      setError("❌ Пожалуйста, заполните поля 'Ваш город' и 'Ваш сайт'");
      return;
    }

    setError(null);

    const formData = {
      city,
      site,
      competitors: competitors.filter(comp => comp.trim() !== "")
    };

    console.log('📋 formData перед отправкой:', formData); // ✅ ДОБАВЛЕНО

    setLoading(true);

    try {
      console.log('[UrlGenerator] 📤 Начинаем анализ...');
      
      const auditData = await generateAuditData(formData);

      console.log('[UrlGenerator] ✅ Данные получены, переходим на страницу результатов');
      
      navigate('/audit-results', {
        state: {
          formData,
          auditData
        }
      });

    } catch (err) {
      console.error('[UrlGenerator] ❌ Error:', err.message);

      let errorMessage = "❌ Ошибка при анализе сайта";

      if (err.message.includes('timeout')) {
        errorMessage = "⏱️ Анализ занял слишком долго (более 30 минут). Пожалуйста, попробуйте позже.";
      } else if (err.message.includes('Network error') || err.message.includes('Failed to fetch')) {
        errorMessage = "🌐 Не удается подключиться к серверу. Проверьте интернет-соединение и убедитесь, что сервер запущен.";
      } else if (err.message.includes('не найден в справочнике')) {
        errorMessage = `❌ ${err.message}`;
      } else if (err.message.includes('Укажите хотя бы один URL')) {
        errorMessage = `❌ ${err.message}`;
      } else {
        errorMessage = `❌ ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCity("");
    setSite("");
    setCompetitors([
      "https://mosseo.ru/",
      "https://cinar.ru/",
      "https://stk-promo.com/",
      "https://www.gemius.ru/",
      "https://www.advertpro.ru/"
    ]);
    setError(null);
  };

  return (
    <div className="url-generator">
      <div className="url-generator-header">
        <span>Аудит сайта</span> от Seo Performance
      </div>

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
            setError(null);
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
            setError(null);
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
                setError(null);
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
          {loading ? '⏳ Анализирование...' : '🔍 Начать анализ'}
        </button>
        <button
          className="url-generator-clear"
          onClick={handleClear}
          disabled={loading}
        >
          🗑️ Очистить данные
        </button>
      </div>

      {loading && (
        <div className="url-generator-info">
          <p>⏳ Пожалуйста, подождите...</p>
          <p>Анализ может занять от 1 до 30 минут.</p>
        </div>
      )}
    </div>
  );
};

export default UrlGenerator;
