import React from 'react';

function SitemapSummary({ sitemap = {} }) {
  const { sitemapStatus = 200, sitemapUrls = 0, duplicates = 0, inaccessible = 0, blocked = 0 } = sitemap;

  if (!sitemap || Object.keys(sitemap).length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных sitemap</div>;
  }

  return (
    <div className="traffic-table-container">
      <table className="traffic-table">
        <thead>
          <tr>
            <th>HTTP Статус</th>
            <th>URLs в Sitemap</th>
            <th>Дубликаты</th>
            <th>Недоступные</th>
            <th>Закрытые</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{sitemapStatus}</td>
            <td>{sitemapUrls}</td>
            <td>{duplicates}</td>
            <td>{inaccessible}</td>
            <td>{blocked}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default SitemapSummary;