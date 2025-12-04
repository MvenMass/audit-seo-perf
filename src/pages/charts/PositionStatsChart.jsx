import { Bar } from 'react-chartjs-2';
import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function PositionStatsChart({ positionStats = {} }) {
  const [activeButton, setActiveButton] = useState('top1');

  // Fallback если нет данных
  if (!positionStats || Object.keys(positionStats).length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных о позициях</div>;
  }

  const chartDataSets = positionStats;
  const currentData = chartDataSets[activeButton];

  if (!currentData) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  const data = {
    labels: currentData.labels,
    datasets: [{
      label: currentData.title,
      data: currentData.data,
      backgroundColor: [
        'rgba(139, 92, 246, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(59, 130, 246, 0.8)'
      ],
      borderRadius: 6,
      borderSkipped: false
    }]
  };

  const buttons = [
    { id: 'top1', label: 'Запросы в ТОП 1' },
    { id: 'top3', label: 'Запросы в ТОП 3' },
    { id: 'top5', label: 'Запросы в ТОП 5' },
    { id: 'percentage', label: 'Процент в ТОП 5' },
    { id: 'pages', label: 'Страницы в индексе' },
    { id: 'traffic', label: 'Посещаемость в день' }
  ];

  return (
    <div className="position-stats-container">
      <div className="position-buttons">
        {buttons.map(btn => (
          <button
            key={btn.id}
            className={`position-btn ${activeButton === btn.id ? 'active' : ''}`}
            onClick={() => setActiveButton(btn.id)}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div style={{ height: '400px', marginTop: '20px' }}>
        <Bar options={options} data={data} />
      </div>
    </div>
  );
}

export default PositionStatsChart;