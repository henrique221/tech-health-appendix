import React from 'react';
import { HealthReport } from '../types';
import ScoreCard from './ScoreCard';
import { LanguageChart, ScoreRadar, MetricsBarChart } from './MetricsChart';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/report-view-dark.css';

interface ReportViewProps {
  report: HealthReport;
  onReset: () => void;
}

export default function ReportView({ report, onReset }: ReportViewProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  // Format date
  const formattedDate = new Date(report.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Convert number to score color class
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
  };

  // Export report as PDF
  const exportAsPDF = async () => {
    try {
      setIsExporting(true);
      
      const reportElement = document.getElementById('report-container');
      if (!reportElement) return;
      
      // Create a new jsPDF instance
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Tech Health Appendix', pageWidth / 2, 15, { align: 'center' });
      
      // Add repository info
      doc.setFontSize(16);
      doc.text(`Repository: ${report.repository.full_name}`, pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Generated on: ${formattedDate}`, pageWidth / 2, 32, { align: 'center' });
      
      // Convert report element to canvas
      const canvas = await html2canvas(reportElement, {
        scale: 1.5,
        logging: false,
        useCORS: true,
      });
      
      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate image height to maintain aspect ratio
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      
      // Add image to PDF
      doc.addImage(imgData, 'PNG', 0, 40, pageWidth, imgHeight);
      
      // Save PDF
      doc.save(`TechHealthAppendix-${report.repository.name}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="report-view">
      <div className="report-container">
        <div className="report-header">
          <div className="report-title-section">
            <h1 className="report-title">Tech Health Appendix</h1>
            <p className="report-subtitle">Generated on {formattedDate}</p>
          </div>
          <div className="report-actions">
            <button
              onClick={exportAsPDF}
              disabled={isExporting}
              className="btn-primary"
            >
              {isExporting ? (
                <>
                  <svg className="loading-spinner mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as PDF
                </>
              )}
            </button>
            <button
              onClick={onReset}
              className="btn-secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 1115.357 2m-15.357-2H15" />
              </svg>
              Analyze Another Repository
            </button>
          </div>
        </div>

        <div className="repo-card">
          <div className="repo-header">
            <img 
              src={report.repository.owner.avatar_url} 
              alt={report.repository.owner.login}
              className="repo-avatar"
            />
            <div className="flex-1">
              <h2 className="repo-name">{report.repository.full_name}</h2>
              <p className="repo-description">{report.repository.description || 'No description available'}</p>
            </div>
          </div>
          
          <div className="repo-info-grid">
            <div className="info-section">
              <h3 className="info-title">Repository Information</h3>
              <div className="info-grid">
                <div className="info-label">Created</div>
                <div className="info-value">{new Date(report.repository.created_at).toLocaleDateString()}</div>
                
                <div className="info-label">Last Updated</div>
                <div className="info-value">{new Date(report.repository.updated_at).toLocaleDateString()}</div>
                
                <div className="info-label">Primary Language</div>
                <div className="info-value">{report.repository.language || 'Not specified'}</div>
                
                <div className="info-label">Size</div>
                <div className="info-value">{(report.repository.size / 1024).toFixed(2)} MB</div>
              </div>
            </div>
            
            <div className="info-section">
              <h3 className="info-title">Overall Health Score</h3>
              <div className="score-display">
                <div className={`score-number ${getScoreColorClass(report.overallScore)}`}>
                  {report.overallScore}
                </div>
                <div className="score-details">
                  <p className="score-text">
                    Your score is <span className="font-semibold">{report.overallScore > report.benchmarkScore ? 'above' : 'below'}</span> the industry average of {report.benchmarkScore}.
                  </p>
                  <div className="score-bar-container">
                    <div 
                      className="score-bar"
                      style={{ width: `${report.overallScore}%` }}
                    ></div>
                    <div 
                      className="benchmark-line"
                      style={{ left: `${report.benchmarkScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="report-container" className="space-y-10">
          <div className="cards-grid">
            <ScoreCard
              title="Code Quality"
              score={report.codeQuality.score}
              metrics={[
                { label: 'Critical Issues', value: report.codeQuality.issues.critical },
                { label: 'High Issues', value: report.codeQuality.issues.high },
                { label: 'Medium Issues', value: report.codeQuality.issues.medium },
                { label: 'Low Issues', value: report.codeQuality.issues.low },
              ]}
              recommendations={report.codeQuality.recommendations}
            />
            
            <ScoreCard
              title="Technical Debt"
              score={report.technicalDebt.score}
              metrics={[
                { label: 'Complexity Score', value: report.technicalDebt.metrics.complexityScore },
                { label: 'Duplications', value: `${report.technicalDebt.metrics.duplications}%` },
                { label: 'Test Coverage', value: `${report.technicalDebt.metrics.testCoverage}%` },
                { label: 'Outdated Dependencies', value: report.technicalDebt.metrics.outdatedDependencies },
              ]}
              recommendations={report.technicalDebt.recommendations}
            />
            
            <ScoreCard
              title="Deployment Metrics"
              score={report.deploymentMetrics.score}
              metrics={[
                { label: 'Deployment Frequency', value: `${report.deploymentMetrics.frequency}/week` },
                { label: 'Lead Time', value: `${report.deploymentMetrics.leadTime} hours` },
                { label: 'Change Failure Rate', value: `${report.deploymentMetrics.changeFailureRate}%` },
                { label: 'Mean Time to Recover', value: `${report.deploymentMetrics.meanTimeToRecover} hours` },
              ]}
              recommendations={report.deploymentMetrics.recommendations}
            />
          </div>
          
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Code Metrics</h3>
              <div className="code-metrics-grid">
                <div className="metric-box">
                  <div className="metric-box-label">Total Lines</div>
                  <div className="metric-box-value">{report.codeMetrics.totalLines.toLocaleString()}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box-label">Code Lines</div>
                  <div className="metric-box-value">{report.codeMetrics.codeLines.toLocaleString()}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box-label">Comment Lines</div>
                  <div className="metric-box-value">{report.codeMetrics.commentLines.toLocaleString()}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box-label">Files</div>
                  <div className="metric-box-value">{report.codeMetrics.files.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="languages-section">
                <h4 className="languages-title">Languages Distribution</h4>
                <LanguageChart languages={report.codeMetrics.languages} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">Score Comparison</h3>
              <ScoreRadar
                codeQualityScore={report.codeQuality.score}
                technicalDebtScore={report.technicalDebt.score}
                deploymentScore={report.deploymentMetrics.score}
                benchmarkScore={report.benchmarkScore}
              />
            </div>
          </div>
          
          <div className="roadmap-card">
            <h3 className="roadmap-title">Optimization Roadmap</h3>
            <div className="roadmap-grid">
              <div className="roadmap-immediate">
                <div className="roadmap-section">
                  <h4 className="roadmap-section-title">
                    <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Immediate Actions
                  </h4>
                  <ul className="roadmap-list">
                    {report.codeQuality.recommendations.slice(0, 2).map((rec, index) => (
                      <li key={`imm-${index}`}>{rec}</li>
                    ))}
                    {report.technicalDebt.recommendations.slice(0, 1).map((rec, index) => (
                      <li key={`imm-td-${index}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="roadmap-short">
                <div className="roadmap-section">
                  <h4 className="roadmap-section-title">
                    <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Short-term (2-4 weeks)
                  </h4>
                  <ul className="roadmap-list">
                    {report.deploymentMetrics.recommendations.slice(0, 1).map((rec, index) => (
                      <li key={`short-${index}`}>{rec}</li>
                    ))}
                    {report.technicalDebt.recommendations.slice(1, 3).map((rec, index) => (
                      <li key={`short-td-${index}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="roadmap-long">
                <div className="roadmap-section">
                  <h4 className="roadmap-section-title">
                    <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Long-term (1-3 months)
                  </h4>
                  <ul className="roadmap-list">
                    {report.deploymentMetrics.recommendations.slice(1, 3).map((rec, index) => (
                      <li key={`long-${index}`}>{rec}</li>
                    ))}
                    {report.codeQuality.recommendations.slice(2, 3).map((rec, index) => (
                      <li key={`long-cq-${index}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
