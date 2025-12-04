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

  // Fallback если нет данных
  if (!seasonalityData || !seasonalityData.labels) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных о сезонности</div>;
  }

  const labels = seasonalityData.labels || [];
  const commercialData = seasonalityData.commercial || [];
  const nonCommercialData = seasonalityData.nonCommercial || [];

  if (labels.length === 0 || commercialData.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13
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
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        max: 400000,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 50000,
          callback: function(value) {
            return value.toString();
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0
      }
    }
  };

  const data = {
    labels,
    datasets: [
      {
        label: 'Сезонность некоммерческих запросов',
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
        tension: 0,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(251, 146, 60)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Сезонность коммерческих запросов',
        data: commercialData,
        borderColor: 'rgba(139, 92, 246, 0.9)',
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'rgba(139, 92, 246, 0.18)';
          return createGradient(ctx, chartArea, 'rgba(139, 92, 246, 0.3)', 'rgba(255, 255, 255, 0.1)');
        },
        fill: true,
        tension: 0,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  return (
    <div style={{ height: '520px', marginTop: '20px', background: '#fff' }}>
      <Line ref={chartRef} options={options} data={data} />
    </div>
  );
}

export default SeasonalityChart;