function CompetitorTable({ competitors = [] }) {
  // Fallback если пропс не передан
  if (!competitors || competitors.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных о конкурентах</div>;
  }

  return (
    <div className="competitor-table-container">
      <table className="traffic-table">
        <thead>
          <tr>
            <th>Домен</th>
            <th>Возраст домена</th>
            <th>Источник расчёта</th>
            <th>Доп. информация</th>
          </tr>
        </thead>
        <tbody>
          {competitors.map((comp, idx) => (
            <tr key={idx}>
              <td>{comp.domain}</td>
              <td>{comp.age}</td>
              <td>{comp.source}</td>
              <td>{comp.info}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CompetitorTable;