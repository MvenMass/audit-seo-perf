function SSLReportTable({ ssl = {} }) {
  const sslData = [
    { label: 'Субъект', value: ssl.owner || 'N/A' },
    { label: 'Эмитент', value: ssl.issuer || 'N/A' },
    { label: 'Действителен с', value: ssl.validFrom || 'N/A' },
    { label: 'Действителен до', value: ssl.validTo || 'N/A' },
    { label: 'Статус', value: ssl.status || 'N/A', isStatus: true },
    { label: 'Серийный номер', value: ssl.serialNumber || 'N/A' },
    { label: 'Отпечаток', value: ssl.thumbprint || 'N/A' }
  ];

  if (!ssl || Object.keys(ssl).length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных SSL</div>;
  }

  return (
    <div className="ssl-report-container">
      <table className="ssl-report-table">
        <tbody>
          {sslData.map((row, idx) => (
            <tr key={idx} className="ssl-report-row">
              <td className="ssl-report-label">{row.label}</td>
              <td className={`ssl-report-value ${row.isStatus && row.value.includes('действител') ? 'ssl-status-active' : ''}`}>
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SSLReportTable;