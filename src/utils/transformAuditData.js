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
 // 2. Конкуренты
const competitors = domains.map(domain => {
  const dash = serverData.domainsDashboards[domain] || {};
  const ageObj = dash.domainAge;

  return {
    domain: domain
      .replace('https://', '')
      .replace('http://', '')
      .replace(/\/$/, ''),
    age: ageObj?.formattedAge || 'Не определен', // ✅ только строка
    // если нужно где‑то отдельно использовать структуру age:
    ageRaw: ageObj || null,
    source: 'API',
    info: domain === mainSite ? 'Основной домен' : 'Конкурент',
  };
});


// 3. Трафик
const traffic = domains.map(domain => {
  const data = serverData.domainsDashboards[domain] || {};
  return {
    site: domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
    cms: data.cms || 'Unknown',
    pages: data.pagesInIndex || 0,
    top5: data.top5 || 0,
    top10: data.top10 || 0,
    top50: data.top50 || 0,
    traffic: data.visits || 0,
  };
});

// отдельный трафик по Google
const trafficGoogle = domains.map(domain => {
  const data = serverData.domainsDashboards[domain] || {};
  const google = data.google || {};
  return {
    site: domain.replace('https://', '').replace('http://', '').replace(/\/$/, ''),
    cms: google.cms || data.cms || 'Unknown',
    pages: google.pagesInIndex || 0,
    top5: google.top5 || 0,
    top10: google.top10 || 0,
    top50: google.top50 || 0,
    traffic: google.visits || 0,
  };
});

console.log('📊 TRANSFORMED traffic (общий):', traffic);
console.log('📊 TRANSFORMED trafficGoogle:', trafficGoogle);
console.log('📊 TRANSFORMED traffic (общий):', traffic);

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
const lighthouseMobile = serverData.checkPageSpeedMobile?.mobile?.lighthouseResult;
const lighthouseDesktop = serverData.checkPageSpeedMobile?.desktop?.lighthouseResult;

const mobilePerfScore =
  lighthouseMobile?.categories?.performance?.score || 0;
const desktopPerfScore =
  lighthouseDesktop?.categories?.performance?.score || 0;

const getAuditValue = (lh, id) =>
  lh?.audits?.[id]?.displayValue || '—';

const pageSpeed = [
  {
    metric: 'Итоговый балл (Performance)',
    mobile: `${Math.round(mobilePerfScore * 100)}/100`,
    desktop: `${Math.round(desktopPerfScore * 100)}/100`,
  },
  {
    metric: 'First Contentful Paint (FCP)',
    mobile: getAuditValue(lighthouseMobile, 'first-contentful-paint'),
    desktop: getAuditValue(lighthouseDesktop, 'first-contentful-paint'),
  },
  {
    metric: 'Largest Contentful Paint (LCP)',
    mobile: getAuditValue(lighthouseMobile, 'largest-contentful-paint'),
    desktop: getAuditValue(lighthouseDesktop, 'largest-contentful-paint'),
  },
  {
    metric: 'Speed Index',
    mobile: getAuditValue(lighthouseMobile, 'speed-index'),
    desktop: getAuditValue(lighthouseDesktop, 'speed-index'),
  },
  {
    metric: 'Time to Interactive (TTI)',
    mobile: getAuditValue(lighthouseMobile, 'interactive'),
    desktop: getAuditValue(lighthouseDesktop, 'interactive'),
  },
  {
    metric: 'Total Blocking Time (TBT)',
    mobile: getAuditValue(lighthouseMobile, 'total-blocking-time'),
    desktop: getAuditValue(lighthouseDesktop, 'total-blocking-time'),
  },
  {
    metric: 'Cumulative Layout Shift (CLS)',
    mobile: getAuditValue(lighthouseMobile, 'cumulative-layout-shift'),
    desktop: getAuditValue(lighthouseDesktop, 'cumulative-layout-shift'),
  },
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
const robotsReport = serverData.robotsReport || {};
const sitemapReport = serverData.sitemapReport || {};

const robots = {
  httpStatus: robotsReport.statusCode || 0,
  found: robotsReport.exists || false,
  isValid: robotsReport.isValid !== false, // ← поправка: использовать isValid
  errorsList: robotsReport.errors || [],
  warningsList: robotsReport.warnings || [],
  suggestionsList: robotsReport.suggestions || [],
  content: robotsReport.content || '',
  stats: robotsReport.stats || {},
  seo: robotsReport.seo || {},
  sitemapUrl: robotsReport.directives?.sitemaps?.[0] || 'N/A',
  sitemapExists: sitemapReport.totalUrls > 0,
  sitemapStatus: sitemapReport.totalUrls > 0 ? 200 : 404,
  totalSitemaps: sitemapReport.totalSitemaps || 0,
  sitemapUrls: sitemapReport.totalUrls || 0,
  checkedUrls: sitemapReport.checkedUrls || 0,
  successfulUrls: sitemapReport.successfulUrls || 0,
  duplicates: sitemapReport.duplicateUrls || 0,
  inaccessible: sitemapReport.failedUrls || 0,
  blocked: sitemapReport.blockedUrls || 0,
};

// Таблицы для robots.txt
const robotsTables = {
  general: {
    title: 'Данные robots.txt',
    columns: ['Показатель', 'Значение'],
    rows: [
      { label: 'Найден', value: robots.found ? 'Да' : 'Нет' },
      { label: 'HTTP статус', value: `${robots.httpStatus} (OK)` },
      { label: 'Валидность файла', value: robots.isValid ? 'Валидный' : 'НЕВАЛИДНЫЙ' }, // ← исправлено
      { label: 'Всего строк', value: robots.stats.totalLines || 0 },
      { label: 'User-Agents', value: robots.stats.userAgents || 0 },
      { label: 'Disallow правил', value: robots.stats.disallowRules || 0 },
      { label: 'Allow правил', value: robots.stats.allowRules || 0 },
    ],
  },
  status: {
    title: 'Статус проверки',
    columns: ['Категория', 'Количество', 'Статус'],
    rows: [
      {
        label: 'Критические ошибки',
        value: (robots.errorsList || []).length,
        status: (robots.errorsList || []).length > 0 ? 'ОШИБКИ' : 'Нет',
      },
      {
        label: 'Предупреждения',
        value: (robots.warningsList || []).length,
        status: (robots.warningsList || []).length > 0 ? 'ЕСТЬ' : 'Нет',
      },
      {
        label: 'Рекомендации',
        value: (robots.suggestionsList || []).length,
        status: (robots.suggestionsList || []).length > 0 ? 'ЕСТЬ' : 'Нет',
      },
    ],
  },
  seo: {
    title: 'SEO-анализ',
    columns: ['Проверяемый параметр', 'Результат', 'Статус'],
    rows: [
      {
        label: 'Блокировка CSS/JS файлов',
        value: robots.seo?.blocksCssJs ? '❌ Заблокированы' : '✅ Не блокируются',
        status: robots.seo?.blocksCssJs ? '❌' : '✅',
      },
      {
        label: 'Блокировка изображений',
        value: robots.seo?.blocksImages ? '❌ Заблокированы' : '✅ Не блокируются',
        status: robots.seo?.blocksImages ? '❌' : '✅',
      },
      {
        label: 'Доступность карты сайта',
        value: robots.seo?.sitemapAccessible ? '✅ Доступна' : '❌ Недоступна',
        status: robots.seo?.sitemapAccessible ? '✅' : '❌',
      },
      {
        label: 'Специальные правила для Googlebot',
        value: robots.seo?.googlebotSpecificRules ? '✅ Есть' : '❌ Отсутствуют', // ← исправлено имя поля
        status: robots.seo?.googlebotSpecificRules ? '✅' : '⚠️',
      },
      {
        label: 'ВАЖНО: Сайт закрыт для индексации',
        value: robots.seo?.blocksCssJs && robots.seo?.blocksImages ? '❌ Disallow: /' : '✅ Открыт', // временно, для демо
        status: robots.seo?.blocksCssJs && robots.seo?.blocksImages ? '❌' : '✅',
      },
    ],
  },
};

// Отдельные списки ошибок/предупреждений robots.txt
const robotsIssues = {
  critical: robots.errorsList.map((error, index) => ({
    id: index + 1,
    type: 'Критическая ошибка',
    title: `Ошибка ${index + 1}`,
    description: error,
  })),
  warnings: robots.warningsList.map((warning, index) => ({
    id: index + 1,
    type: 'Предупреждение',
    title: `Предупреждение ${index + 1}`,
    description: warning,
  })),
  recommendations: robots.suggestionsList.map((s, index) => ({
    id: index + 1,
    type: 'Рекомендация',
    title: `Рекомендация ${index + 1}`,
    description: s,
  })),
};

// Таблицы для sitemap.xml
const sitemapTables = {
  main: {
    title: 'Основная статистика sitemap',
    columns: ['Показатель', 'Значение'],
    rows: [
      { label: 'Общее количество карт сайта', value: robots.totalSitemaps },
      { label: 'Общее количество URL', value: robots.sitemapUrls },
      { label: 'Проверено URL', value: robots.checkedUrls },
      {
        label: 'Успешные запросы',
        value:
          robots.checkedUrls > 0
            ? `${robots.successfulUrls} (${((robots.successfulUrls / robots.checkedUrls) * 100).toFixed(1)}%) ✅`
            : `${robots.successfulUrls}`,
      },
      {
        label: 'Неработающие ссылки',
        value:
          robots.checkedUrls > 0
            ? `${robots.inaccessible} (${((robots.inaccessible / robots.checkedUrls) * 100).toFixed(1)}%) ❌`
            : `${robots.inaccessible}`,
      },
      { label: 'Внешние ссылки', value: sitemapReport.externalUrls || 0 },
      { label: 'Редиректы', value: sitemapReport.redirectUrls || 0 },
    ],
  },
  statusCodes: {
    title: 'Статистика по кодам ответа',
    columns: ['HTTP код', 'Количество', 'Процент', 'Статус'],
    rows: Object.entries(sitemapReport.statusCodes || {}).map(([code, count]) => {
      const percent =
        robots.sitemapUrls > 0
          ? ((count / robots.sitemapUrls) * 100).toFixed(1)
          : '0.0';
      const ok = code === '200';
      return {
        http: `${code} (${code === '200' ? 'OK' : 'Not Found'})`,
        count,
        percent,
        status: ok ? '✅ Успешно' : '❌ Ошибка',
      };
    }),
  },
  recommendations: {
    title: 'Рекомендации',
    columns: ['Тип', 'Название', 'Описание', 'Рекомендация'],
    rows: (sitemapReport.recommendations || []).map((rec, index) => ({
      id: index + 1,
      type: rec.type === 'critical' ? '⚠️ Критическая' : 'Рекомендация',
      title: rec.title || rec.name || 'Проблема sitemap',
      description: rec.description || '',
      suggestion: rec.action || rec.suggestion || rec.recommendation || '', // ← исправлено: action вместо suggestion
    })),
  },
};

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

// 13. Семантические ключевые слова (только из CommerceForecast)
console.log('🔑 Формируем ключевые слова из CommerceForecast');

const commerceForecastObj = serverData.CommerceForecast || {};

const semanticKeywordsData = Object.entries(commerceForecastObj)
  .map(([keyword, regionData], index) => {
    let base = 0;

    if (regionData && typeof regionData === 'object') {
      Object.values(regionData).forEach((value) => {
        if (value && typeof value === 'object') {
          const v = Number(value.base) || 0;
          base += v;
        }
      });
    }

    const top1 = base * 0.3;
    const top2 = base * 0.15;
    const top3 = base * 0.1;
    const totalScore = top1 + top2 + top3;

    return {
      id: index + 1,
      keyword: keyword || 'N/A',
      top1,
      top2,
      top3,
      total: totalScore,
    };
  })
  .sort((a, b) => b.total - a.total);

const semanticTotals = semanticKeywordsData.reduce(
  (acc, row) => {
    acc.top1 += row.top1 || 0;
    acc.top2 += row.top2 || 0;
    acc.top3 += row.top3 || 0;
    acc.total += row.total || 0;
    return acc;
  },
  { top1: 0, top2: 0, top3: 0, total: 0 }
);

const semanticKeywords = {
  total: semanticKeywordsData.length,
  data: semanticKeywordsData,
  totals: semanticTotals, // ← общие суммы по всем запросам
};

console.log('🔑 TRANSFORMED semanticKeywords:', {
  total: semanticKeywords.total,
  firstItem: semanticKeywords.data[0],
  sample: semanticKeywords.data.slice(0, 5),
  totals: semanticKeywords.totals,
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
  trafficGoogle,
    topDomainsChart,
    seasonality,
    semanticCore,
    favicon,
    pageSpeed,
    ssl,
    robots,
    visibility,
    positionStats,
     robotsTables,       
  robotsIssues,         
  sitemapTables,   
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
