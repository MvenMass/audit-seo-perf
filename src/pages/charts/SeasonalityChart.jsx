import { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function createGradient(ctx, chartArea, colorStart, colorEnd) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
}

function SeasonalityChart({ seasonalityData = {} }) {
  const chartRef = useRef();

  // ✅ ВОТ СЮДА
  console.log('🔍 SeasonalityChart получил:', seasonalityData);

  const labels = seasonalityData?.labels || [];
  const commercialData = seasonalityData?.commercial || [];
  const nonCommercialData = seasonalityData?.nonCommercial || [];

  // ✅ И ДОБАВЬ ЭТО ЗДЕСЬ
  console.log('📊 Данные:', {
    labelsCount: labels.length,
    commercialCount: commercialData.length,
    nonCommercialCount: nonCommercialData.length,
    firstCommercial: commercialData[0],
    lastCommercial: commercialData[commercialData.length - 1],
    maxCommercial: Math.max(...commercialData),
    minCommercial: Math.min(...commercialData),
    firstNonCommercial: nonCommercialData[0],
    maxNonCommercial: Math.max(...nonCommercialData)
  });

  // Проверка данных
  if (!labels || labels.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        <p>Нет данных о сезонности</p>
      </div>
    );
  }


  // ✅ Форматируем даты для отображения
  const formattedLabels = labels.map(date => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' });
    } catch (e) {
      return date;
    }
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 13 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toLocaleString('ru-RU');
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 15,
          font: { size: 11 }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          color: 'rgb(139, 92, 246)',
          font: { size: 13, weight: 'bold' }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'k';
            }
            return value.toLocaleString('ru-RU');
          },
          color: 'rgb(139, 92, 246)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          color: 'rgb(251, 146, 60)',
          font: { size: 13, weight: 'bold' }
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'k';
            }
            return value.toLocaleString('ru-RU');
          },
          color: 'rgb(251, 146, 60)'
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 3,
        hitRadius: 10,
        hoverRadius: 5
      }
    }
  };

  const data = {
    labels: formattedLabels,
    datasets: [
      {
        label: 'Коммерческие запросы',
        data: commercialData,
        borderColor: 'rgba(139, 92, 246, 0.9)',
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'rgba(139, 92, 246, 0.18)';
          return createGradient(ctx, chartArea, 'rgba(139, 92, 246, 0.3)', 'rgba(255, 255, 255, 0.1)');
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Некоммерческие запросы',
        data: nonCommercialData,
        borderColor: 'rgba(251, 146, 60, 0.8)',
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'rgba(251, 146, 60, 0.18)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(251, 146, 60, 0.2)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(251, 146, 60)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  };

  return (
    <div style={{ height: '520px', marginTop: '20px', background: '#fff', padding: '20px' }}>
      <Line ref={chartRef} options={options} data={data} />
    </div>
  );
}

export default SeasonalityChart;
