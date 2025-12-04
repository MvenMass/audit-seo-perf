import React from 'react';

function FaviconChart({ favicon = [] }) {
  // Fallback если нет данных
  if (!favicon || favicon.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Фавикон не найден
      </div>
    );
  }

  return (
    <div className="traffic-table-container">
      <table className="traffic-table">
        <thead>
          <tr>
            <th>Сайт</th>
            <th>Тип</th>
            <th>Размер</th>
            <th>Метод</th>
          </tr>
        </thead>
        <tbody>
          {favicon.map((item, idx) => (
            <tr key={idx}>
              <td>{item.site}</td>
              <td>{item.type}</td>
              <td>{item.size}</td>
              <td>{item.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FaviconChart;