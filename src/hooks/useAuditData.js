import { useState, useEffect, useRef } from 'react';

export const useAuditData = (dataSource = '/auditData.json') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Используем ref для предотвращения повторных загрузок
  const isLoadedRef = useRef(false);

  useEffect(() => {
    // ✅ Если объект — сразу устанавливаем
    if (typeof dataSource === 'object' && dataSource !== null) {
      setData(dataSource);
      setLoading(false);
      isLoadedRef.current = true;
      return;
    }

    // ✅ Если уже загружали — не загружаем снова
    if (isLoadedRef.current) {
      return;
    }

    // ✅ Если строка — загружаем из файла
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(dataSource);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        setData(jsonData);
        isLoadedRef.current = true;
      } catch (err) {
        console.error('Ошибка загрузки данных аудита:', err);
        setError(err.message || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // ✅ Пустой массив зависимостей!

  return { data, loading, error };
};

export default useAuditData;
