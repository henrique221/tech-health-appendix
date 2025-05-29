import React from 'react';
import { HealthReport } from '../types';
import ScoreCard from './ScoreCard';
import { LanguageChart, ScoreRadar } from './MetricsChart';
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
      
      // Create a temporary container for PDF export
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1200px';
      tempContainer.innerHTML = reportElement.innerHTML;
      document.body.appendChild(tempContainer);
      
      // Add comprehensive PDF-safe CSS inline to override ALL problematic color functions
      const pdfSafeStyle = document.createElement('style');
      pdfSafeStyle.id = 'pdf-safe-css';
      pdfSafeStyle.textContent = `
        /* Force all elements to use standard colors - no oklch, color-mix, or complex gradients */
        #pdf-temp-container * {
          color: inherit !important;
        }
        
        #pdf-temp-container {
          background: #111827 !important;
          color: #f1f5f9 !important;
          font-family: system-ui, -apple-system, sans-serif !important;
        }
        
        /* Override all background colors with standard hex values */
        #pdf-temp-container .report-view,
        #pdf-temp-container .report-container {
          background: #111827 !important;
          background-image: none !important;
          background-color: #111827 !important;
        }
        
        #pdf-temp-container .repo-card,
        #pdf-temp-container .metric-card,
        #pdf-temp-container .chart-card,
        #pdf-temp-container .roadmap-card {
          background: #1f2937 !important;
          background-image: none !important;
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
          color: #f1f5f9 !important;
        }
        
        /* Text colors */
        #pdf-temp-container .report-title,
        #pdf-temp-container .header-title,
        #pdf-temp-container .landing-title {
          background: none !important;
          background-image: none !important;
          color: #60a5fa !important;
          -webkit-background-clip: unset !important;
          background-clip: unset !important;
        }
        
        #pdf-temp-container h1, #pdf-temp-container h2, #pdf-temp-container h3, #pdf-temp-container h4 {
          color: #f1f5f9 !important;
        }
        
        #pdf-temp-container p, #pdf-temp-container span, #pdf-temp-container div {
          color: #cbd5e1 !important;
        }
        
        /* Buttons */
        #pdf-temp-container .btn-primary,
        #pdf-temp-container .submit-button {
          background: #3b82f6 !important;
          background-image: none !important;
          background-color: #3b82f6 !important;
          color: #ffffff !important;
          border: none !important;
        }
        
        #pdf-temp-container .btn-secondary {
          background: #6b7280 !important;
          background-image: none !important;
          background-color: #6b7280 !important;
          color: #ffffff !important;
          border: none !important;
        }
        
        /* Score elements */
        #pdf-temp-container .score-circle,
        #pdf-temp-container .score-number {
          background: #3b82f6 !important;
          background-image: none !important;
          background-color: #3b82f6 !important;
          color: #ffffff !important;
        }
        
        #pdf-temp-container .score-bar {
          background: #3b82f6 !important;
          background-image: none !important;
          background-color: #3b82f6 !important;
        }
        
        /* Charts and progress bars */
        #pdf-temp-container .progress,
        #pdf-temp-container .progress-bar {
          background: #3b82f6 !important;
          background-image: none !important;
          background-color: #3b82f6 !important;
        }
        
        /* Override any Tailwind classes that might use oklch */
        #pdf-temp-container [class*="bg-"],
        #pdf-temp-container [class*="border-"],
        #pdf-temp-container [class*="text-"] {
          background-image: none !important;
        }
        
        /* Force canvas elements to have simple backgrounds */
        #pdf-temp-container canvas {
          background: #1f2937 !important;
        }
        
        /* Remove all gradients and complex backgrounds */
        #pdf-temp-container * {
          background-image: none !important;
          background-attachment: unset !important;
          filter: none !important;
          backdrop-filter: none !important;
        }
      `;
      tempContainer.id = 'pdf-temp-container';
      document.head.appendChild(pdfSafeStyle);
      
      // Wait a bit for styles to apply
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Convert report element to canvas with better options for html2canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#111827',
        ignoreElements: (element: Element) => {
          // Skip problematic elements
          return element.classList?.contains('btn-primary') || 
                 element.classList?.contains('btn-secondary') ||
                 element.tagName === 'BUTTON';
        }
      });
      
      // Clean up
      document.body.removeChild(tempContainer);
      const cssElement = document.getElementById('pdf-safe-css');
      if (cssElement) {
        document.head.removeChild(cssElement);
      }
      
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
