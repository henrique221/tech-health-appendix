import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

interface LanguageChartProps {
  languages: { [key: string]: number };
}

export function LanguageChart({ languages }: LanguageChartProps) {
  // Process language data
  const entries = Object.entries(languages);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  
  // Take top 5 languages, group others
  const topLanguages = entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const otherLanguages = entries
    .sort((a, b) => b[1] - a[1])
    .slice(5)
    .reduce((sum, [, value]) => sum + value, 0);
  
  // Prepare chart data
  const labels = [...topLanguages.map(([lang]) => lang)];
  if (otherLanguages > 0) {
    labels.push('Other');
  }
  
  const data = [...topLanguages.map(([, value]) => Math.round((value / total) * 100))];
  if (otherLanguages > 0) {
    data.push(Math.round((otherLanguages / total) * 100));
  }
  
  // Generate colors for dark theme
  const backgroundColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray for "Other"
  ];
  
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderColor: '#374151',
        borderWidth: 2,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#d1d5db',
          font: {
            size: 12,
          },
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: (context: { label: string; raw: number }) => `${context.label}: ${context.raw}%`,
        },
      },
    },
  };
  
  return (
    <div className="h-64 relative">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

interface ScoreRadarProps {
  codeQualityScore: number;
  technicalDebtScore: number;
  deploymentScore: number;
  benchmarkScore: number;
}

export function ScoreRadar({
  codeQualityScore,
  technicalDebtScore,
  deploymentScore,
  benchmarkScore,
}: ScoreRadarProps) {
  const data = {
    labels: ['Code Quality', 'Technical Debt', 'Deployment'],
    datasets: [
      {
        label: 'Your Repository',
        data: [codeQualityScore, technicalDebtScore, deploymentScore],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#1f2937',
        pointBorderWidth: 2,
      },
      {
        label: 'Industry Average',
        data: [benchmarkScore, benchmarkScore, benchmarkScore],
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 3,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#1f2937',
        pointBorderWidth: 2,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: '#374151',
        },
        grid: {
          color: '#374151',
        },
        pointLabels: {
          color: '#d1d5db',
          font: {
            size: 12,
          },
        },
        ticks: {
          color: '#9ca3af',
          backdropColor: 'transparent',
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#d1d5db',
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
  };
  
  return (
    <div className="h-80 w-full relative">
      <Radar data={data} options={options} />
    </div>
  );
}

interface MetricsBarChartProps {
  title: string;
  labels: string[];
  data: number[];
  maxValue?: number;
}

export function MetricsBarChart({ title, labels, data, maxValue = 100 }: MetricsBarChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#d1d5db',
        },
      },
      y: {
        beginAtZero: true,
        max: maxValue,
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#d1d5db',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#d1d5db',
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
  };
  
  return (
    <div className="h-64 relative">
      <Bar data={chartData} options={options} />
    </div>
  );
}
