import { useState, useEffect } from 'react';

/**
 * Hook для загрузки данных аудита
 * @param {string|object} dataSource - путь к JSON или объект данных от backend
 * @returns {object} - { data, loading, error }
 */
export const useAuditData = (dataSource = '/auditData.json') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Если dataSource - это объект (данные от backend), используем его напрямую
        if (typeof dataSource === 'object' && dataSource !== null) {
          setData(dataSource);
          setLoading(false);
          return;
        }

        // Если dataSource - это строка (путь), загружаем из файла
        const response = await fetch(dataSource);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        console.error('Ошибка загрузки данных аудита:', err);
        setError(err.message || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataSource]);

  return { data, loading, error };
};

export default useAuditData;