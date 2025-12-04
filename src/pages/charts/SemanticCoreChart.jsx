import React from 'react';

function SemanticCoreChart({ semanticCore = {} }) {
  const { totalRequests = 0, uniqueRequests = 0, missedRequests = 0 } = semanticCore;

  if (!semanticCore || Object.keys(semanticCore).length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных семантического ядра</div>;
  }

  return (
    <div className="traffic-table-container">
      <table className="traffic-table">
        <thead>
          <tr>
            <th>Всего запросов</th>
            <th>Уникальных запросов</th>
            <th>Упущенных запросов</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{totalRequests}</td>
            <td>{uniqueRequests}</td>
            <td>{missedRequests}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default SemanticCoreChart;