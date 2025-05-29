import React from 'react';

interface ScoreCardProps {
  title: string;
  score: number;
  metrics: { label: string; value: string | number }[];
  recommendations: string[];
}

export default function ScoreCard({ title, score, metrics, recommendations }: ScoreCardProps) {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-br from-green-500 to-green-600';
    if (score >= 60) return 'bg-gradient-to-br from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-br from-red-500 to-red-600';
  };

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="card-title">{title}</h3>
        <div className={`flex items-center justify-center w-16 h-16 rounded-full ${getScoreColor(score)} text-white font-bold text-2xl shadow-lg`}>
          {score}
        </div>
      </div>

      <div className="card-metrics">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-item">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">{metric.value}</span>
          </div>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
          <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Recommendations
          </h4>
          <ul className="text-sm text-gray-300 pl-4 list-disc space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="leading-relaxed">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
