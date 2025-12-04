import React from 'react';

function PageSpeedTable({ pageSpeed = [], siteUrl = 'https://example.com' }) {
  // Fallback если нет данных
  if (!pageSpeed || pageSpeed.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Нет данных о скорости загрузки
      </div>
    );
  }

  return (
    <div className="traffic-table-container">
      <div className="table-wrapper">
        <table className="traffic-table">
          <thead>
            {/* Заголовок с URL сайта */}
            <tr>
              <th colSpan="3" className="pagespeed-site-header">
                Результаты PageSpeed для:{' '}
                <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                  {siteUrl}
                </a>
              </th>
            </tr>
            {/* Заголовки колонок */}
            <tr>
              <th>Показатель</th>
              <th>Mobile</th>
              <th>Desktop</th>
            </tr>
          </thead>
          <tbody>
            {pageSpeed.map((row, idx) => (
              <tr key={idx}>
                <td>{row.metric}</td>
                <td>{row.mobile}</td>
                <td>{row.desktop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PageSpeedTable;