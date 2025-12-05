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
  const [competitors, setCompetitors] = useState(""); // Одно текстовое поле!
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!city.trim() || !site.trim()) {
      setError("❌ Заполните город и ваш сайт");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Парсим конкурентов: разделяем по переносам, пробелам или запятым
      const competitorsList = competitors
        .split(/[\n,\s]+/)
        .map(url => url.trim())
        .filter(url => url && url !== site.trim())
        .slice(0, 5); // Макс 5 конкурентов

      const formData = {
        city,
        site: site.trim(),
        competitors: competitorsList
      };

      const auditData = await generateAuditData(formData);

      navigate('/audit-results', {
        state: { formData, auditData }
      });
    } catch (err) {
      console.error('[UrlGenerator] Error:', err);
      
      const errorMessages = {
        'timeout': '⏱️ Анализ занял слишком долго',
        'город': '❌ ' + err.message,
        'default': '❌ Ошибка при анализе: ' + err.message
      };

      const errorMsg = Object.keys(errorMessages).find(key => err.message.includes(key));
      setError(errorMessages[errorMsg] || errorMessages.default);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCity("");
    setSite("");
    setCompetitors("");
    setError(null);
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text');
    
    // Если в буфере обмена несколько URL — добавляем их все
    if (paste.includes('\n') || paste.includes(',')) {
      setCompetitors(prev => (prev ? prev + '\n' : '') + paste);
      e.preventDefault();
    }
  };

  return (
    <div className="url-generator">
      <div className="url-generator-header">
        <span>Аудит сайта</span> от Seo Performance
      </div>

      {error && <div className="url-generator-error">{error}</div>}

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
          {BASE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="url-generator-block">
        <label className="url-generator-label">Ваш сайт:</label>
        <input
          type="text"
          value={site}
          onChange={e => {
            setSite(e.target.value);
            setError(null);
          }}
          placeholder="example.com"
          className="url-generator-input"
          disabled={loading}
        />
      </div>

      <div className="url-generator-block">
        <label className="url-generator-label">
          Сайты конкурентов:
        </label>
        <textarea
          value={competitors}
          onChange={e => {
            setCompetitors(e.target.value);
            setError(null);
          }}
          onPaste={handlePaste}
          placeholder={`Вставьте URL конкурентов по одному на строку\nПримеры:\ncompetitor1.com\ncompetitor2.com\ncompetitor3.com`}
          className="url-generator-input url-generator-textarea"
          rows={5}
          disabled={loading}
        />
        <small style={{ color: '#999', marginTop: '8px', display: 'block' }}>
          Введено: {competitors.split(/[\n,\s]+/).filter(u => u.trim()).length} URL
        </small>
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
          🗑️ Очистить
        </button>
      </div>

      {loading && (
        <div className="url-generator-info">
          <p>⏳ Анализ может занять 1-5 минут...</p>
        </div>
      )}
    </div>
  );
};

export default UrlGenerator;
