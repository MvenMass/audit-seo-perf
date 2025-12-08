import { useState } from 'react';

function SemanticKeywordsTable({ keywords = { total: 0, data: [] } }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const allKeywords = keywords.data || [];

  if (!allKeywords || allKeywords.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>
          📊 Нет данных ключевых слов
        </p>
        <p style={{ fontSize: '14px', color: '#aaa' }}>
          Данные отсутствуют в ответе API
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(allKeywords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = allKeywords.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const maxDotsPages = 3;

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) endPage = Math.min(totalPages - 1, maxDotsPages + 1);
      if (currentPage > totalPages - 3) startPage = Math.max(2, totalPages - maxDotsPages);

      if (startPage > 2) pages.push('...');
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page) => {
    if (typeof page === 'number') {
      setCurrentPage(page);
      document.getElementById('semantic-keywords-table')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) handlePageChange(currentPage + 1);
  };

  return (
    <div className="traffic-table-container">
      <table
        className="traffic-table semantic-keywords-table"
        id="semantic-keywords-table"
      >
        <thead>
          <tr>
            <th>Ключевое слово/фраза</th>
            <th>Тип</th>
            <th>Общая частотность</th>
            <th>Пик за месяц</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((row) => (
            <tr key={row.id}>
              <td>{row.keyword}</td>
              <td>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: row.type === 'Коммерческий' 
                    ? 'rgba(139, 92, 246, 0.1)' 
                    : 'rgba(251, 146, 60, 0.1)',
                  color: row.type === 'Коммерческий' 
                    ? 'rgb(139, 92, 246)' 
                    : 'rgb(251, 146, 60)'
                }}>
                  {row.type}
                </span>
              </td>
              <td>{row.frequency.toLocaleString('ru-RU')}</td>
              <td>{row.maxMonth.toLocaleString('ru-RU')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-buttons">
            {pageNumbers.map((page, idx) => (
              <button
                key={idx}
                className={`pagination-btn ${
                  page === currentPage ? 'active' : ''
                } ${page === '...' ? 'dots' : ''}`}
                onClick={() => handlePageChange(page)}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}

            {currentPage < totalPages && (
              <button
                className="pagination-btn arrow-btn"
                onClick={handleNextPage}
                title="Следующая страница"
              >
                →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



export default SemanticKeywordsTable;