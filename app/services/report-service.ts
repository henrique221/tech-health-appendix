import { HealthReport } from '../types';

export class ReportService {
  /**
   * Generate HTML template for the health report
   * @param report Health report data
   */
  generateReportHTML(report: HealthReport): string {
    // Format date
    const generatedDate = new Date(report.generatedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calculate health score color
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#4ade80'; // green
      if (score >= 60) return '#facc15'; // yellow
      return '#ef4444'; // red
    };
    
    const overallScoreColor = getScoreColor(report.overallScore);
    const codeQualityColor = getScoreColor(report.codeQuality.score);
    const technicalDebtColor = getScoreColor(report.technicalDebt.score);
    const deploymentColor = getScoreColor(report.deploymentMetrics.score);
    
    // Format recommendations
    const formatRecommendations = (recs: string[]) => {
      return recs.map(rec => `<li>${rec}</li>`).join('');
    };
    
    // Format languages
    const formatLanguages = () => {
      const entries = Object.entries(report.codeMetrics.languages);
      const total = entries.reduce((sum, [_, value]) => sum + value, 0);
      
      return entries
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang, bytes]) => {
          const percentage = Math.round((bytes / total) * 100);
          return `<div class="language-item">
            <span>${lang}</span>
            <div class="progress-bar">
              <div class="progress" style="width: ${percentage}%"></div>
            </div>
            <span>${percentage}%</span>
          </div>`;
        })
        .join('');
    };
    
    return `<!DOCTYPE html>
    <html>
    <head>
      <title>Tech Health Appendix - ${report.repository.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .header h1 {
          color: #111;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
        }
        .repo-info {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .repo-info img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          margin-right: 15px;
        }
        .score-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .score-card {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .score-card h3 {
          margin-top: 0;
          color: #333;
        }
        .score-display {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin-right: 15px;
          color: white;
        }
        .metrics-list {
          margin-bottom: 20px;
        }
        .metrics-list p {
          margin: 5px 0;
          display: flex;
          justify-content: space-between;
        }
        .recommendations {
          background-color: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          border-radius: 0 4px 4px 0;
        }
        .recommendations h4 {
          margin-top: 0;
          color: #3b82f6;
        }
        .recommendations ul {
          margin: 10px 0 0;
          padding-left: 20px;
        }
        .benchmark {
          display: flex;
          align-items: center;
          margin: 20px 0;
          padding: 15px;
          background-color: #f3f4f6;
          border-radius: 8px;
        }
        .benchmark-bar {
          flex-grow: 1;
          height: 20px;
          background-color: #e5e7eb;
          border-radius: 10px;
          margin: 0 15px;
          position: relative;
        }
        .benchmark-progress {
          position: absolute;
          height: 100%;
          border-radius: 10px;
          background-color: #3b82f6;
        }
        .benchmark-marker {
          position: absolute;
          height: 100%;
          width: 3px;
          background-color: #ef4444;
        }
        .language-item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .language-item span {
          width: 80px;
        }
        .progress-bar {
          flex-grow: 1;
          height: 12px;
          background-color: #e5e7eb;
          border-radius: 6px;
          margin: 0 10px;
          overflow: hidden;
        }
        .progress {
          height: 100%;
          background-color: #3b82f6;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Tech Health Appendix</h1>
        <div class="repo-info">
          <img src="${report.repository.owner.avatar_url}" alt="Repository Owner" />
          <div>
            <h2>${report.repository.full_name}</h2>
            <p>${report.repository.description || 'No description available'}</p>
          </div>
        </div>
        <p>Generated on ${generatedDate}</p>
      </div>
      
      <div class="score-section">
        <div class="score-card">
          <h3>Overall Health Score</h3>
          <div class="score-display">
            <div class="score-circle" style="background-color: ${overallScoreColor}">
              ${report.overallScore}
            </div>
            <div>
              <p>Your score is ${report.overallScore > report.benchmarkScore ? 'above' : 'below'} the industry average of ${report.benchmarkScore}.</p>
            </div>
          </div>
          
          <div class="benchmark">
            <span>0</span>
            <div class="benchmark-bar">
              <div class="benchmark-progress" style="width: ${report.overallScore}%"></div>
              <div class="benchmark-marker" style="left: ${report.benchmarkScore}%"></div>
            </div>
            <span>100</span>
          </div>
        </div>
      </div>
      
      <div class="score-section">
        <div class="score-card">
          <h3>Code Quality</h3>
          <div class="score-display">
            <div class="score-circle" style="background-color: ${codeQualityColor}">
              ${report.codeQuality.score}
            </div>
          </div>
          
          <div class="metrics-list">
            <p><strong>Critical Issues:</strong> <span>${report.codeQuality.issues.critical}</span></p>
            <p><strong>High Issues:</strong> <span>${report.codeQuality.issues.high}</span></p>
            <p><strong>Medium Issues:</strong> <span>${report.codeQuality.issues.medium}</span></p>
            <p><strong>Low Issues:</strong> <span>${report.codeQuality.issues.low}</span></p>
          </div>
          
          <div class="recommendations">
            <h4>Recommendations</h4>
            <ul>
              ${formatRecommendations(report.codeQuality.recommendations)}
            </ul>
          </div>
        </div>
        
        <div class="score-card">
          <h3>Technical Debt</h3>
          <div class="score-display">
            <div class="score-circle" style="background-color: ${technicalDebtColor}">
              ${report.technicalDebt.score}
            </div>
          </div>
          
          <div class="metrics-list">
            <p><strong>Complexity Score:</strong> <span>${report.technicalDebt.metrics.complexityScore}</span></p>
            <p><strong>Duplications:</strong> <span>${report.technicalDebt.metrics.duplications}%</span></p>
            <p><strong>Test Coverage:</strong> <span>${report.technicalDebt.metrics.testCoverage}%</span></p>
            <p><strong>Outdated Dependencies:</strong> <span>${report.technicalDebt.metrics.outdatedDependencies}</span></p>
          </div>
          
          <div class="recommendations">
            <h4>Recommendations</h4>
            <ul>
              ${formatRecommendations(report.technicalDebt.recommendations)}
            </ul>
          </div>
        </div>
        
        <div class="score-card">
          <h3>Deployment Metrics</h3>
          <div class="score-display">
            <div class="score-circle" style="background-color: ${deploymentColor}">
              ${report.deploymentMetrics.score}
            </div>
          </div>
          
          <div class="metrics-list">
            <p><strong>Deployment Frequency:</strong> <span>${report.deploymentMetrics.frequency}/week</span></p>
            <p><strong>Lead Time:</strong> <span>${report.deploymentMetrics.leadTime} hours</span></p>
            <p><strong>Change Failure Rate:</strong> <span>${report.deploymentMetrics.changeFailureRate}%</span></p>
            <p><strong>Mean Time to Recover:</strong> <span>${report.deploymentMetrics.meanTimeToRecover} hours</span></p>
          </div>
          
          <div class="recommendations">
            <h4>Recommendations</h4>
            <ul>
              ${formatRecommendations(report.deploymentMetrics.recommendations)}
            </ul>
          </div>
        </div>
      </div>
      
      <div class="score-section">
        <div class="score-card">
          <h3>Code Metrics</h3>
          <div class="metrics-list">
            <p><strong>Total Lines:</strong> <span>${report.codeMetrics.totalLines.toLocaleString()}</span></p>
            <p><strong>Code Lines:</strong> <span>${report.codeMetrics.codeLines.toLocaleString()}</span></p>
            <p><strong>Comment Lines:</strong> <span>${report.codeMetrics.commentLines.toLocaleString()}</span></p>
            <p><strong>Files:</strong> <span>${report.codeMetrics.files.toLocaleString()}</span></p>
          </div>
          
          <h4>Languages</h4>
          ${formatLanguages()}
        </div>
      </div>
      
      <div class="footer">
        <p>This report was generated by Tech Health Appendix Generator by Ego Eimi.</p>
        <p>&copy; ${new Date().getFullYear()} Ego Eimi. All rights reserved.</p>
      </div>
    </body>
    </html>`;
  }
}
