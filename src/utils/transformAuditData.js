/**
 * Трансформирует данные от API в формат для компонентов
 */
export const transformAuditData = (serverData, formData) => {
  if (!serverData || !serverData.domainsDashboards) {
    console.error('❌ Неверная структура данных от сервера');
    return null;
  }

  const mainSite = formData?.site || Object.keys(serverData.domainsDashboards)[0];
  const domains = Object.keys(serverData.domainsDashboards);
  const mainDomain = serverData.domainsDashboards[mainSite];

  // 1. Метрики
  const metrics = [
    {
      label: "CMS:",
      value: mainDomain?.cms || "Unknown"
    },
    {
      label: "Запросы в ТОП-1:",
      value: mainDomain?.top1 || 0,
      highlight: true
    },
    {
      label: "Запросы в ТОП-10:",
      value: mainDomain?.top10 || 0
    },
    {
      label: "Страниц в индексе:",
      value: mainDomain?.pagesInIndex || 0
    },
    {
      label: "Посещаемость в день:",
      value: mainDomain?.visits || 0
    }
  ];

  // 2. Конкуренты
  const competitors = domains.map(domain => ({
    domain: domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
    age: serverData.domainsDashboards[domain]?.domainAge || "Не определен",
    source: "API",
    info: domain === mainSite ? "Основной домен" : "Конкурент"
  }));

  // 3. Трафик
  const traffic = domains.map(domain => {
    const data = serverData.domainsDashboards[domain];
    return {
      site: domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
      cms: data?.cms || "Unknown",
      pages: data?.pagesInIndex || 0,
      top5: data?.top5 || 0,
      top10: data?.top10 || 0,
      top50: data?.top50 || 0,
      traffic: data?.visits || 0
    };
  });

  // 4. График истории запросов
  const topDomainsChart = {
    labels: mainDomain?.history?.dates || [],
    datasets: {
      top1: domains.map((domain, idx) => ({
        label: domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
        data: serverData.domainsDashboards[domain]?.history?.top1 || [],
        borderColor: getColor(idx),
        backgroundColor: getColorAlpha(idx)
      })),
      top3: domains.map((domain, idx) => ({
        label: domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
        data: serverData.domainsDashboards[domain]?.history?.top3 || [],
        borderColor: getColor(idx),
        backgroundColor: getColorAlpha(idx)
      })),
      top5: domains.map((domain, idx) => ({
        label: domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
        data: serverData.domainsDashboards[domain]?.history?.top5 || [],
        borderColor: getColor(idx),
        backgroundColor: getColorAlpha(idx)
      })),
      top10: domains.map((domain, idx) => ({
        label: domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
        data: serverData.domainsDashboards[domain]?.history?.top10 || [],
        borderColor: getColor(idx),
        backgroundColor: getColorAlpha(idx)
      })),
      top50: domains.map((domain, idx) => ({
        label: domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
        data: serverData.domainsDashboards[domain]?.history?.top50 || [],
        borderColor: getColor(idx),
        backgroundColor: getColorAlpha(idx)
      }))
    }
  };

// 5. Сезонность
// 5. Сезонность
const commerceData = serverData.forSeasonChart?.commerce || [];
const nonCommerceData = serverData.forSeasonChart?.nonCommerce || [];

console.log('🔥 RAW forSeasonChart:', serverData.forSeasonChart);
console.log('🔥 Первый элемент commerce:', commerceData[0]);
console.log('🔥 Данные внутри data:', commerceData[0]?.data);

// Проверяем структуру первого значения
if (commerceData[0]?.data) {
  const firstKey = Object.keys(commerceData[0].data)[0];
  console.log('🔥 Первый ключ:', firstKey);
  console.log('🔥 Значение по ключу:', commerceData[0].data[firstKey]);
  console.log('🔥 Тип значения:', typeof commerceData[0].data[firstKey]);
}

// ✅ Собираем все месяцы и значения
const allMonthsSet = new Set();
const commerceMap = new Map();
const nonCommerceMap = new Map();

// Обрабатываем коммерческие запросы
commerceData.forEach(item => {
  if (item.data && typeof item.data === 'object') {
    Object.entries(item.data).forEach(([month, value]) => {
      allMonthsSet.add(month);
      
      // ✅ ИСПРАВЛЕНО: правильно извлекаем число
      let frequency = 0;
      if (typeof value === 'number') {
        frequency = value;
      } else if (typeof value === 'object' && value !== null) {
        // Если value это объект, ищем нужное поле
        frequency = value.frequency || value.count || value.value || 0;
      }
      
      commerceMap.set(month, (commerceMap.get(month) || 0) + frequency);
    });
  }
});

// Обрабатываем некоммерческие запросы
nonCommerceData.forEach(item => {
  if (item.data && typeof item.data === 'object') {
    Object.entries(item.data).forEach(([month, value]) => {
      allMonthsSet.add(month);
      
      // ✅ ИСПРАВЛЕНО: правильно извлекаем число
      let frequency = 0;
      if (typeof value === 'number') {
        frequency = value;
      } else if (typeof value === 'object' && value !== null) {
        frequency = value.frequency || value.count || value.value || 0;
      }
      
      nonCommerceMap.set(month, (nonCommerceMap.get(month) || 0) + frequency);
    });
  }
});

// Сортируем месяцы
const allMonths = Array.from(allMonthsSet).sort();

const seasonality = {
  labels: allMonths,
  commercial: allMonths.map(month => commerceMap.get(month) || 0),
  nonCommercial: allMonths.map(month => nonCommerceMap.get(month) || 0)
};

console.log('🔥 Seasonality результат (первые 5):', {
  labels: seasonality.labels.slice(0, 5),
  commercial: seasonality.commercial.slice(0, 5),
  nonCommercial: seasonality.nonCommercial.slice(0, 5),
  totalCommercial: seasonality.commercial.reduce((a, b) => a + b, 0),
  totalNonCommercial: seasonality.nonCommercial.reduce((a, b) => a + b, 0)
});




  // 6. Семантическое ядро
  const semanticCore = {
    totalRequests: serverData.comparisonResults?.allWordsCount || 0,
    uniqueRequests: serverData.comparisonResults?.uniqueInFirstCount || 0,
    missedRequests: serverData.comparisonResults?.uniqueInSecondCount || 0
  };

  // 7. Favicon
  const favicon = serverData.faviconCheck?.foundIcons?.map(icon => ({
    site: icon.url,
    type: icon.type,
    size: icon.size,
    method: icon.method
  })) || [];

  // 8. PageSpeed
  const mobileScore = serverData.checkPageSpeedMobile?.mobile?.lighthouseResult?.categories?.performance?.score || 0;
  const desktopScore = serverData.checkPageSpeedMobile?.desktop?.lighthouseResult?.categories?.performance?.score || 0;
  
  const pageSpeed = [
    {
      metric: "Скорость загрузки",
      mobile: `${Math.round(mobileScore * 100)}/100`,
      desktop: `${Math.round(desktopScore * 100)}/100`
    }
    // TODO: добавить остальные метрики из lighthouseResult.audits
  ];

  // 9. SSL
  const ssl = {
    owner: serverData.sslReport?.subject || "N/A",
    issuer: serverData.sslReport?.issuer || "N/A",
    validFrom: serverData.sslReport?.valid_from || "N/A",
    validTo: serverData.sslReport?.valid_to || "N/A",
    status: serverData.sslReport?.is_expired || "Неизвестно",
    serialNumber: "N/A", // Если есть в ответе, добавь
    thumbprint: "N/A"
  };

// 10. Robots и Sitemap
console.log('🤖 RAW robotsReport:', serverData.robotsReport);
console.log('🤖 RAW sitemapReport:', serverData.sitemapReport);

const robotsReport = serverData.robotsReport || {};
const sitemapReport = serverData.sitemapReport || {};

const robots = {
  httpStatus: robotsReport.statusCode || 0,
  found: robotsReport.exists || false,
  errors: robotsReport.isValid === false,
  errorsList: robotsReport.errors || [],
  warningsList: robotsReport.warnings || [],
  suggestionsList: robotsReport.suggestions || [],
  content: robotsReport.content || '',
  stats: robotsReport.stats || {},
  seo: robotsReport.seo || {},
  
  // Sitemap данные
  sitemapUrl: robotsReport.directives?.sitemaps?.[0] || "N/A",
  sitemapExists: sitemapReport.totalUrls > 0,
  sitemapStatus: sitemapReport.totalUrls > 0 ? 200 : 404,
  totalSitemaps: sitemapReport.totalSitemaps || 0,
  sitemapUrls: sitemapReport.totalUrls || 0,
  checkedUrls: sitemapReport.checkedUrls || 0,
  successfulUrls: sitemapReport.successfulUrls || 0,
  duplicates: sitemapReport.duplicateUrls || 0,
  inaccessible: sitemapReport.failedUrls || 0,
  blocked: sitemapReport.blockedUrls || 0
};

console.log('🤖 Трансформированный robots:', robots);

// ✅ Данные для графика robots
const robotsData = {
  top1: {
    title: 'Статистика robots.txt',
    labels: ['Всего строк', 'User-Agents', 'Disallow правил', 'Allow правил'],
    data: [
      robots.stats.totalLines || 0,
      robots.stats.userAgents || 0,
      robots.stats.disallowRules || 0,
      robots.stats.allowRules || 0
    ]
  },
  top3: {
    title: 'Проверка URL в sitemap',
    labels: ['Всего URL', 'Успешных', 'Недоступных', 'Дубликатов'],
    data: [
      robots.sitemapUrls,
      robots.successfulUrls,
      robots.inaccessible,
      robots.duplicates
    ]
  },
  top5: {
    title: 'Статус файлов',
    labels: ['robots.txt найден', 'sitemap найдена', 'Ошибки robots', 'Предупреждения'],
    data: [
      robots.found ? 1 : 0,
      robots.sitemapExists ? 1 : 0,
      robots.errorsList.length,
      robots.warningsList.length
    ]
  },
  percentage: {
    title: 'Процент проблем в sitemap',
    labels: ['Дубликаты %', 'Недоступные %', 'Успешные %'],
    data: [
      robots.checkedUrls > 0 ? Number(((robots.duplicates / robots.checkedUrls) * 100).toFixed(1)) : 0,
      robots.checkedUrls > 0 ? Number(((robots.inaccessible / robots.checkedUrls) * 100).toFixed(1)) : 0,
      robots.checkedUrls > 0 ? Number(((robots.successfulUrls / robots.checkedUrls) * 100).toFixed(1)) : 0
    ]
  },
  pages: {
    title: 'Карты сайта',
    labels: ['Всего sitemaps', 'Всего URL', 'Проверено URL'],
    data: [
      robots.totalSitemaps,
      robots.sitemapUrls,
      robots.checkedUrls
    ]
  },
  traffic: {
    title: 'HTTP статусы',
    labels: ['robots.txt', 'sitemap.xml'],
    data: [
      robots.httpStatus,
      robots.sitemapStatus
    ]
  }
};

// ✅ Данные для таблицы robots - показываем ошибки и предупреждения
const robotsTableData = [];

// Добавляем ошибки
robots.errorsList.forEach((error, index) => {
  robotsTableData.push({
    id: robotsTableData.length + 1,
    status: '❌ Ошибка',
    query: `Критическая проблема ${index + 1}`,
    info: error
  });
});

// Добавляем предупреждения
robots.warningsList.forEach((warning, index) => {
  robotsTableData.push({
    id: robotsTableData.length + 1,
    status: '⚠️ Предупреждение',
    query: `Внимание ${index + 1}`,
    info: warning
  });
});

// Добавляем рекомендации
robots.suggestionsList.forEach((suggestion, index) => {
  robotsTableData.push({
    id: robotsTableData.length + 1,
    status: '💡 Рекомендация',
    query: `Совет ${index + 1}`,
    info: suggestion
  });
});

// Если нет данных - показываем заглушку
if (robotsTableData.length === 0) {
  robotsTableData.push({
    id: 1,
    status: '✅ OK',
    query: 'Проблем не обнаружено',
    info: 'robots.txt и sitemap.xml настроены корректно'
  });
}

console.log('🤖 robotsData:', robotsData);
console.log('🤖 robotsTableData:', robotsTableData);


  // 11. Видимость
  const visibility = {
    commercial: serverData.vidimostData?.vidimostCom || 0,
    nonCommercial: serverData.vidimostData?.vidimostNonCom || 0,
    total: serverData.vidimostData?.vidimostTotal || 0,
    dynamics: [] // TODO: если есть данные динамики
  };

  // 12. Позиции по запросам (бар-диаграммы)
  const positionStats = {
    top1: {
      labels: domains.map(d => d.replace('https://', '').replace('http://', '').replace(/\/$/, '')),
      data: domains.map(d => serverData.domainsDashboards[d]?.top1 || 0),
      title: "Запросы в ТОП 1"
    },
    top3: {
      labels: domains.map(d => d.replace('https://', '').replace('http://', '').replace(/\/$/, '')),
      data: domains.map(d => serverData.domainsDashboards[d]?.top3 || 0),
      title: "Запросы в ТОП 3"
    },
    top5: {
      labels: domains.map(d => d.replace('https://', '').replace('http://', '').replace(/\/$/, '')),
      data: domains.map(d => serverData.domainsDashboards[d]?.top5 || 0),
      title: "Запросы в ТОП 5"
    },
    percentage: {
      labels: domains.map(d => d.replace('https://', '').replace('http://', '').replace(/\/$/, '')),
      data: domains.map(d => {
        const top10 = serverData.domainsDashboards[d]?.top10 || 0;
        const top50 = serverData.domainsDashboards[d]?.top50 || 1;
        return Math.round((top10 / top50) * 100);
      }),
      title: "Процент в ТОП 5"
    },
    pages: {
      labels: domains.map(d => d.replace('https://', '').replace('http://', '').replace(/\/$/, '')),
      data: domains.map(d => serverData.domainsDashboards[d]?.pagesInIndex || 0),
      title: "Страницы в индексе"
    },
    traffic: {
      labels: domains.map(d => d.replace('https://', '').replace('http://', '').replace(/\/$/, '')),
      data: domains.map(d => serverData.domainsDashboards[d]?.visits || 0),
      title: "Посещаемость в день"
    }
  };

// 13. Семантические ключевые слова (из forSeasonChart)
console.log('🔑 Формируем ключевые слова из forSeasonChart');

const commerceKeywords = serverData.forSeasonChart?.commerce || [];
const nonCommerceKeywords = serverData.forSeasonChart?.nonCommerce || [];

const allKeywords = [
  ...commerceKeywords.map(item => ({ ...item, type: 'Коммерческий' })),
  ...nonCommerceKeywords.map(item => ({ ...item, type: 'Некоммерческий' }))
];

const semanticKeywords = {
  total: allKeywords.length,
  data: allKeywords.map((item, index) => {
    // Подсчитываем общую частотность из всех месяцев
    let totalFrequency = 0;
    let maxMonthValue = 0;
    
    if (item.data && typeof item.data === 'object') {
      Object.values(item.data).forEach(value => {
        let freq = 0;
        if (typeof value === 'number') {
          freq = value;
        } else if (typeof value === 'object' && value !== null) {
          freq = value.frequency || value.count || value.value || 0;
        }
        totalFrequency += freq;
        maxMonthValue = Math.max(maxMonthValue, freq);
      });
    }

    return {
      id: index + 1,
      keyword: item.keyword || item.query || 'N/A',
      frequency: totalFrequency, // Общая частотность за все месяцы
      type: item.type,
      maxMonth: maxMonthValue, // Пиковое значение
      top1: '-',  // Нет данных с бэкенда
      top5: '-',  // Нет данных с бэкенда
      top10: '-'  // Нет данных с бэкенда
    };
  }).sort((a, b) => b.frequency - a.frequency) // Сортировка по убыванию частотности
};

console.log('🔑 Трансформированный semanticKeywords:', {
  total: semanticKeywords.total,
  firstItem: semanticKeywords.data[0],
  sample: semanticKeywords.data.slice(0, 3)
});

console.log('🔑 Трансформированный semanticKeywords:', {
  total: semanticKeywords.total,
  firstItem: semanticKeywords.data[0],
  lastItem: semanticKeywords.data[semanticKeywords.data.length - 1]
});

  return {
    domainInfo: {
      site: mainSite.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
      siteUrl: mainSite,
      hasSSL: serverData.sslReport?.is_expired === 'Действителен',
      hasRobots: serverData.robotsReport?.exists || false
    },
    metrics,
    competitors,
    traffic,
    topDomainsChart,
    seasonality,
    semanticCore,
    favicon,
    pageSpeed,
    ssl,
    robots,
    visibility,
    positionStats,
    robotsData,     
    robotsTableData,  
     semanticKeywords
  };
};

// Вспомогательные функции для цветов
const colors = [
  'rgb(139, 92, 246)',
  'rgb(251, 146, 60)',
  'rgb(34, 197, 94)',
  'rgb(239, 68, 68)',
  'rgb(59, 130, 246)'
];

function getColor(index) {
  return colors[index % colors.length];
}

function getColorAlpha(index) {
  return colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)');
}
