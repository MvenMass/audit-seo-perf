
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [competitors, setCompetitors] = useState(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleCompetitorChange = (index, value) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };

  const handleGenerate = async () => {
    if (!city.trim() || !site.trim()) {
      alert("Пожалуйста, заполните поля 'Ваш город' и 'Ваш сайт'");
      return;
    }

    const formData = {
      city,
      site,
      competitors: competitors.filter(comp => comp.trim() !== "")
    };

    setLoading(true);

    // ✅ В разработке (localhost) используем fallback JSON
    // Когда деплоишь на production, можно вернуть backend
    try {
      // Имитируем задержку загрузки
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      navigate('/audit-results', { 
        state: { 
          formData
          // auditData не передаем - будет использован fallback /auditData.json
        } 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCity("");
    setSite("");
    setCompetitors(["", "", "", "", ""]);
  };

  return (
    <div className="url-generator">
      <div className="url-generator-header">
        <span>Аудит сайта</span> от Seo Performance 
      </div>

      <div className="url-generator-block">
        <label className="url-generator-label">Ваш город:</label>
        <select
          className="url-generator-input"
          value={city}
          onChange={e => setCity(e.target.value)}
          disabled={loading}
        >
          <option value="">Выберите город</option>
          {BASE_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="url-generator-block">
        <label className="url-generator-label">Ваш сайт:</label>
        <input
          type="text"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          placeholder="Введите сайт"
          className="url-generator-input"
          disabled={loading}
        />
      </div>

      <div className="url-generator-block url-generator-block__container">
        <label className="url-generator-label">Укажите сайты конкурентов:</label>
        <div className="url-generator-block__conc">
          {competitors.map((comp, index) => (
            <input
              key={index}
              type="text"
              value={comp}
              onChange={(e) => handleCompetitorChange(index, e.target.value)}
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
          {loading ? '⏳ Анализирование...' : 'Начать анализ'}
        </button>
        <button 
          className="url-generator-clear" 
          onClick={handleClear}
          disabled={loading}
        >
          Очистить данные
        </button>
      </div>
    </div>
  );
};

export default UrlGenerator;