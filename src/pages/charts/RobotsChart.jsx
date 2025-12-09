import { useState } from 'react';

function RobotsChart({ robotsTables = {}, robotsIssues = {}, sitemapTables = {} }) {
  const [activeRobotsTab, setActiveRobotsTab] = useState('general');
  const [activeSitemapTab, setActiveSitemapTab] = useState('main');

  console.log('🔍 RobotsChart received:');
  console.log('  robotsTables:', robotsTables);
  console.log('  robotsIssues:', robotsIssues);
  console.log('  sitemapTables:', sitemapTables);

  if (!robotsTables || Object.keys(robotsTables).length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Нет данных robots
      </div>
    );
  }

  const robotsTabs = [
    { id: 'general', label: 'Данные robots.txt' },
    { id: 'status', label: 'Статус проверки' },
    { id: 'seo', label: 'SEO-анализ' },
    { id: 'critical', label: 'Критические ошибки' },
    { id: 'warnings', label: 'Предупреждения' },
  ];

  const sitemapTabs = [
    { id: 'main', label: 'Основная статистика' },
    { id: 'statusCodes', label: 'Коды ответа' },
    { id: 'recommendations', label: 'Рекомендации' },
  ];

  const currentRobotsTable =
    activeRobotsTab === 'critical' || activeRobotsTab === 'warnings'
      ? null
      : robotsTables[activeRobotsTab];

  const currentSitemapTable = sitemapTables[activeSitemapTab] || null;

  const renderRobotsBody = () => {
    // Для вкладок с ошибками/предупреждениями
    if (activeRobotsTab === 'critical' || activeRobotsTab === 'warnings') {
      const list =
        activeRobotsTab === 'critical'
          ? robotsIssues.critical || []
          : robotsIssues.warnings || [];

      console.log(`🔍 renderRobotsBody ${activeRobotsTab}:`, list);

      if (!list || list.length === 0) {
        return (
          <tbody>
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: '#999' }}>
                Нет данных
              </td>
            </tr>
          </tbody>
        );
      }

      return (
        <tbody>
          {list.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.title}</td>
              <td>{item.description}</td>
            </tr>
          ))}
        </tbody>
      );
    }

    // Для обычных таблиц (general/status/seo)
    const rows = currentRobotsTable?.rows || [];

    if (!rows.length) {
      return (
        <tbody>
          <tr>
            <td colSpan={3} style={{ textAlign: 'center', color: '#999' }}>
              Нет данных
            </td>
          </tr>
        </tbody>
      );
    }

    if (activeRobotsTab === 'status') {
      return (
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row.label}</td>
              <td>{row.value}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      );
    }

    if (activeRobotsTab === 'seo') {
      return (
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row.label}</td>
              <td>{row.value}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      );
    }

    // general
    return (
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            <td>{row.label}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    );
  };

  const renderSitemapBody = () => {
    // Проверяем, существует ли вообще таблица
    if (!currentSitemapTable || !currentSitemapTable.rows) {
      console.log(`🔍 No sitemap table for ${activeSitemapTab}`);
      return (
        <tbody>
          <tr>
            <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
              Нет данных
            </td>
          </tr>
        </tbody>
      );
    }

    const rows = currentSitemapTable.rows || [];

    console.log(`🔍 renderSitemapBody ${activeSitemapTab}:`, rows);

    if (!rows.length) {
      return (
        <tbody>
          <tr>
            <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
              Нет данных
            </td>
          </tr>
        </tbody>
      );
    }

    if (activeSitemapTab === 'statusCodes') {
      return (
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row.http}</td>
              <td>{row.count}</td>
              <td>{row.percent}%</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      );
    }

    if (activeSitemapTab === 'recommendations') {
      if (!rows.length) {
        return (
          <tbody>
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
                Рекомендаций нет
              </td>
            </tr>
          </tbody>
        );
      }

      return (
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.type}</td>
              <td>{row.title}</td>
              <td>{row.description}</td>
              <td>{row.suggestion}</td>
            </tr>
          ))}
        </tbody>
      );
    }

    // main
    return (
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            <td>{row.label}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="chart-container">
      {/* ROBOTS.TXT */}
      <h3 className="section-subtitle">robots.txt</h3>
      <div className="chart-buttons">
        {robotsTabs.map((tab) => (
          <button
            key={tab.id}
            className={`chart-btn ${activeRobotsTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveRobotsTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="traffic-table-container" style={{ marginTop: 20 }}>
        <table className="traffic-table">
          <thead>
            {activeRobotsTab === 'status' ? (
              <tr>
                <th>Категория</th>
                <th>Количество</th>
                <th>Статус</th>
              </tr>
            ) : activeRobotsTab === 'seo' ? (
              <tr>
                <th>Проверяемый параметр</th>
                <th>Результат</th>
                <th>Статус</th>
              </tr>
            ) : activeRobotsTab === 'critical' ||
              activeRobotsTab === 'warnings' ? (
              <tr>
                <th>№</th>
                <th>Название</th>
                <th>Описание</th>
              </tr>
            ) : (
              <tr>
                <th>Показатель</th>
                <th>Значение</th>
              </tr>
            )}
          </thead>
          {renderRobotsBody()}
        </table>
      </div>

      {/* SITEMAP.XML */}
      <h3 className="section-subtitle" style={{ marginTop: 40 }}>
        sitemap.xml
      </h3>
      <div className="chart-buttons">
        {sitemapTabs.map((tab) => (
          <button
            key={tab.id}
            className={`chart-btn ${activeSitemapTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSitemapTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="traffic-table-container" style={{ marginTop: 20 }}>
        <table className="traffic-table">
          <thead>
            {activeSitemapTab === 'statusCodes' ? (
              <tr>
                <th>HTTP код</th>
                <th>Количество</th>
                <th>Процент</th>
                <th>Статус</th>
              </tr>
            ) : activeSitemapTab === 'recommendations' ? (
              <tr>
                <th>Тип</th>
                <th>Название</th>
                <th>Описание</th>
                <th>Рекомендация</th>
              </tr>
            ) : (
              <tr>
                <th>Показатель</th>
                <th>Значение</th>
              </tr>
            )}
          </thead>
          {renderSitemapBody()}
        </table>
      </div>
    </div>
  );
}

export default RobotsChart;
