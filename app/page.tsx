"use client";

import { useState } from 'react';
import RepositoryForm from './components/RepositoryForm';
import ReportView from './components/ReportView';
import { GitHubService, GitHubRateLimitError } from './services/github-service';
import { CodeAnalysisService } from './services/code-analysis-service';
import { HealthReport } from './types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (owner: string, repo: string, token?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize services
      const githubService = new GitHubService({ token });
      const codeAnalysisService = new CodeAnalysisService(githubService);
      
      // Generate health report
      const healthReport = await codeAnalysisService.generateHealthReport(owner, repo);
      
      // Set report data
      setReport(healthReport);
    } catch (err) {
      console.error('Error generating report:', err);
      
      // Check specifically for GitHub rate limit errors
      if (err instanceof GitHubRateLimitError) {
        // Format the reset time in a user-friendly way
        const resetTime = err.resetTime;
        const now = new Date();
        
        // Calculate time until reset
        const timeUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / 60000); // in minutes
        
        const formattedTime = resetTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const formattedDate = resetTime.toLocaleDateString([], {
          month: 'short',
          day: 'numeric'
        });
        
        // Create a user-friendly error message
        setError(
          `GitHub API rate limit exceeded. You've reached the limit of ${err.limit} requests. ` +
          `Rate limit will reset in ${timeUntilReset} minute${timeUntilReset !== 1 ? 's' : ''} ` +
          `(at ${formattedTime} on ${formattedDate}). ` +
          `To continue without waiting, provide a GitHub token which has a higher rate limit.`
        );
      } else {
        setError(
          err instanceof Error 
            ? err.message 
            : 'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-container">
          <div className="flex items-center">
            <h1 className="header-title">Tech Health Appendix</h1>
          </div>
          <div className="header-badge">
            Ego Eimi Challenge
          </div>
        </div>
      </header>
      
      <main className="main-container">
        {error && (
          <div className={`alert ${error.includes('rate limit exceeded') ? 'alert-warning' : 'alert-error'}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {error.includes('rate limit exceeded') ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className="font-semibold">{error.includes('rate limit exceeded') ? 'GitHub API Rate Limit Exceeded' : 'Error'}</h3>
                <p className="mt-1">{error}</p>
                {error.includes('rate limit exceeded') && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <h4 className="font-medium text-amber-800">Sugestões:</h4>
                    <ul className="list-disc ml-5 mt-1 text-sm space-y-1 text-amber-700">
                      <li>Forneça um token de acesso pessoal do GitHub para aumentar o limite de requisições</li>
                      <li>Aguarde até que o limite seja redefinido no horário indicado acima</li>
                      <li>Use um token com escopo para o repositório específico que você está analisando</li>
                    </ul>
                  </div>
                )}
                <div className="mt-3 flex space-x-3">
                  <button 
                    onClick={handleReset}
                    className="btn btn-sm btn-secondary"
                  >
                    Tentar novamente
                  </button>
                  {error.includes('rate limit exceeded') && (
                    <a 
                      href="https://github.com/settings/tokens?type=beta" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                    >
                      Criar token do GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!report ? (
          <div className="landing-section">
            <div className="landing-content">
              <h2 className="landing-title">Generate Your Tech Health Appendix</h2>
              <p className="landing-description">
                Analyze your GitHub repository&apos;s technical health and generate an investor-ready appendix
                that showcases your codebase quality and identifies improvement opportunities.
              </p>
              
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Quick Analysis</h3>
                  <p className="feature-description">
                    Get comprehensive insights about your codebase in minutes, not hours
                  </p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Data-Driven Insights</h3>
                  <p className="feature-description">
                    Metrics and benchmarks that help investors understand your technical foundation
                  </p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Actionable Roadmap</h3>
                  <p className="feature-description">
                    Clear recommendations to improve your technical health and impress investors
                  </p>
                </div>
              </div>
            </div>
            
            <RepositoryForm onSubmit={handleSubmit} isLoading={isLoading} apiError={error || undefined} />
          </div>
        ) : (
          <ReportView report={report} onReset={handleReset} />
        )}
      </main>
      
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-content">
            <p className="footer-text">
              &copy; {new Date().getFullYear()} Ego Eimi Tech Health Appendix Generator
            </p>
            <div className="footer-links">
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
              <a href="#" className="footer-link">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
