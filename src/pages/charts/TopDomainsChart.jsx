import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function TopDomainsChart({ topDomainsChart = { labels: [], datasets: [] } }) {
  const [activeTab, setActiveTab] = useState('top1');

  if (!topDomainsChart || topDomainsChart.labels.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных топ доменов</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 10
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const labels = topDomainsChart.labels;
  const tabsData = topDomainsChart.datasets || {};

  if (!tabsData[activeTab]) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных для этого таба</div>;
  }

  const datasets = (tabsData[activeTab] || []).map((item, index) => ({
    label: item.label,
    data: item.data,
    borderColor: item.borderColor,
    backgroundColor: item.backgroundColor,
    tension: 0.4,
    borderWidth: index === 0 ? 3 : 2,
    fill: false,
    pointRadius: 4,
    pointBackgroundColor: item.borderColor,
    pointBorderColor: '#fff',
    pointBorderWidth: 1
  }));

  const data = { labels, datasets };

  const tabs = [
    { id: 'top1', label: 'Запросы в ТОП 1' },
    { id: 'top3', label: 'Запросы в ТОП 3' },
    { id: 'top5', label: 'Запросы в ТОП 5' },
    { id: 'top10', label: 'Запросы в ТОП 10' },
    { id: 'top50', label: 'Запросы в ТОП 50' }
  ];

  return (
    <div className="chart-container">
      <div className="chart-buttons">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`chart-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ height: '400px', marginTop: '20px' }}>
        <Line options={options} data={data} />
      </div>
    </div>
  );
}

export default TopDomainsChart;
