function TrafficTable({ traffic = [] }) {
  if (!traffic || traffic.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных трафика</div>;
  }

  // Разделяем данные: первые половину - Яндекс, вторую - Google
  const yandexData = traffic.slice(0, Math.ceil(traffic.length / 2));
  const googleData = traffic.slice(Math.ceil(traffic.length / 2));

  const yandexFooter = "По данным Яндекса: 48/день";
  const googleFooter = "По данным Google: 31/день";

  const renderTable = (data, footer) => (
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
        {data.map((row, idx) => (
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
      <tfoot>
        <tr>
          <td colSpan={7} className="table-footer-text">
            {footer}
          </td>
        </tr>
      </tfoot>
    </table>
  );

  return (
    <div className="traffic-table-container">
      {yandexData.length > 0 && renderTable(yandexData, yandexFooter)}
      {googleData.length > 0 && renderTable(googleData, googleFooter)}
    </div>
  );
}

export default TrafficTable;