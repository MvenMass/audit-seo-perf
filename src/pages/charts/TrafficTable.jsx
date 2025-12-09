function TrafficTable({ traffic = [], footerText = '' }) {
  if (!traffic || traffic.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Нет данных трафика
      </div>
    );
  }

  return (
    <div className="traffic-table-container">
      <table className="traffic-table">
        <thead>
          <tr>
            <th>Сайт</th>
            <th>CMS</th>
            <th>Страниц в индексе</th>
            <th>ТОП 5</th>
            <th>ТОП 10</th>
            <th>ТОП 50</th>
            <th>Орг. трафик/ день</th>
          </tr>
        </thead>
        <tbody>
          {traffic.map((row, idx) => (
            <tr key={idx}>
              <td>{row.site}</td>
              <td>{row.cms}</td>
              <td>{row.pages}</td>
              <td>{row.top5}</td>
              <td>{row.top10}</td>
              <td>{row.top50}</td>
              <td>{row.traffic}</td>
            </tr>
          ))}
        </tbody>
        {footerText && (
          <tfoot>
            <tr>
              <td colSpan={7} className="table-footer-text">
                {footerText}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default TrafficTable;
