import { useState, useEffect } from 'react';

interface RepositoryFormProps {
  onSubmit: (owner: string, repo: string, token?: string) => void;
  isLoading: boolean;
  apiError?: string; // Error message from API calls
}

// Repository visibility status
type RepoVisibility = 'unknown' | 'public' | 'private' | 'checking';

export default function RepositoryForm({ onSubmit, isLoading, apiError }: RepositoryFormProps) {
  const [inputMode, setInputMode] = useState<'separate' | 'url'>('url'); // Default to URL input for ease of use
  const [repoUrl, setRepoUrl] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');
  const [repoVisibility, setRepoVisibility] = useState<RepoVisibility>('unknown');
  const [isCheckingRepo, setIsCheckingRepo] = useState(false);
  const [tokenRequired, setTokenRequired] = useState(false);

  // Parse repository URL if inputMode is 'url'
  useEffect(() => {
    if (inputMode === 'url' && repoUrl) {
      try {
        // Handle different GitHub URL formats
        let url: URL;
        try {
          url = new URL(repoUrl);
        } catch {
          // If not a valid URL, try prepending https://github.com/
          if (!repoUrl.startsWith('http')) {
            try {
              url = new URL(`https://github.com/${repoUrl}`);
            } catch {
              setError('Invalid repository URL format');
              return;
            }
          } else {
            setError('Invalid repository URL format');
            return;
          }
        }

        // Check if it's a GitHub URL
        if (!url.hostname.includes('github.com')) {
          setError('Only GitHub repositories are supported');
          return;
        }

        // Extract owner and repo from path
        const pathParts = url.pathname.split('/');
        // Remove empty strings from split
        const filteredParts = pathParts.filter(part => part.length > 0);
        
        if (filteredParts.length >= 2) {
          const ownerFromUrl = filteredParts[0];
          const repoFromUrl = filteredParts[1];
          
          setOwner(ownerFromUrl);
          setRepo(repoFromUrl);
          setError('');
        } else {
          setError('Could not extract repository information from URL');
        }
      } catch (err) {
        setError('Error parsing repository URL');
        console.error('Error parsing repo URL:', err);
      }
    }
  }, [repoUrl, inputMode]);

  // Check repository visibility when owner and repo change
  useEffect(() => {
    const checkRepoVisibility = async () => {
      if (!owner || !repo) {
        setRepoVisibility('unknown');
        setTokenRequired(false);
        return;
      }
      
      setIsCheckingRepo(true);
      setRepoVisibility('checking');
      
      try {
        // First try to access the repo without authentication
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        
        if (response.status === 200) {
          // Repository exists and is public
          setRepoVisibility('public');
          setTokenRequired(false);
        } else if (response.status === 404) {
          // Repository either doesn't exist or is private
          setRepoVisibility('private');
          setTokenRequired(true);
        } else {
          // Other error
          setRepoVisibility('unknown');
          setTokenRequired(false);
        }
      } catch (err) {
        console.error('Error checking repository visibility:', err);
        setRepoVisibility('unknown');
      } finally {
        setIsCheckingRepo(false);
      }
    };
    
    // Debounce the check to avoid too many requests
    const timeoutId = setTimeout(() => {
      checkRepoVisibility();
    }, 800);
    
    return () => clearTimeout(timeoutId);
  }, [owner, repo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (owner && repo) {
      // If repository is private, token is required
      if (repoVisibility === 'private' && !token) {
        setError('A GitHub token is required to analyze private repositories');
        return;
      }
      
      // Clear any previous errors
      setError('');
      onSubmit(owner, repo, token || undefined);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Analyze GitHub Repository</h2>
      
      <div className="input-mode-toggle">
        <button
          type="button"
          onClick={() => setInputMode('url')}
          className={`toggle-button ${inputMode === 'url' ? 'active' : ''}`}
        >
          Repository URL
        </button>
        <button
          type="button"
          onClick={() => setInputMode('separate')}
          className={`toggle-button ${inputMode === 'separate' ? 'active' : ''}`}
        >
          Owner & Name
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {inputMode === 'url' ? (
          <div className="form-group">
            <label htmlFor="repoUrl" className="form-label">
              Repository URL
            </label>
            <input
              type="text"
              id="repoUrl"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="form-input"
              placeholder="e.g., https://github.com/facebook/react or facebook/react"
              required
            />
            <p className="form-help-text">
              Enter the full GitHub repository URL or just &apos;owner/repo&apos;
            </p>
            {error && <p className="form-error">{error}</p>}
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="owner" className="form-label">
                Repository Owner
              </label>
              <input
                type="text"
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="form-input"
                placeholder="e.g., facebook"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="repo" className="form-label">
                Repository Name
              </label>
              <input
                type="text"
                id="repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="form-input"
                placeholder="e.g., react"
                required
              />
            </div>
          </>
        )}
        
        <div className="form-group">
          <div className="flex items-center justify-between">
            <label htmlFor="token" className="form-label">
              GitHub Token (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="form-link"
            >
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={`form-input ${tokenRequired ? 'border-yellow-500 bg-yellow-50' : ''}`}
              placeholder="For private repositories"
              required={tokenRequired}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="form-help-text">
              Your token is never stored and only used for this analysis
            </p>
            {isCheckingRepo && (
              <span className="visibility-indicator visibility-checking">
                <svg className="loading-spinner w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking repository...
              </span>
            )}
          </div>
          {repoVisibility === 'private' && (
            <div className="alert alert-warning mt-2">
              This appears to be a private repository. A GitHub token is required for access.
            </div>
          )}
          <div className="card mt-3">
            <details>
              <summary className="font-medium cursor-pointer text-blue-400">Need access to a private repository?</summary>
              <div className="mt-3 text-sm">
                <p className="mb-3">To analyze a private repository, you&apos;ll need a GitHub personal access token with these permissions:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="form-link font-medium">GitHub&apos;s Fine-grained Token page</a></li>
                  <li>Click &quot;Generate new token&quot;</li>
                  <li>Give your token a name (e.g. &quot;Tech Health Appendix&quot;)</li>
                  <li>Set an expiration date (recommended: 7 days)</li>
                  <li>Under &quot;Repository access&quot;, select &quot;Only select repositories&quot; and choose your repository</li>
                  <li>Under &quot;Permissions&quot;, expand &quot;Repository permissions&quot; and set:</li>
                  <ul className="list-disc pl-5 mt-1 mb-2 text-xs space-y-1">
                    <li><strong>Contents</strong>: Read-only (to analyze file structure and dependencies)</li>
                    <li><strong>Metadata</strong>: Read-only (to access repository information)</li>
                    <li><strong>Actions</strong>: Read-only (to analyze CI/CD workflows and deployment metrics)</li>
                    <li><strong>Issues</strong>: Read-only (to calculate mean time to recovery)</li>
                    <li><strong>Pull requests</strong>: Read-only (to analyze lead time and code review patterns)</li>
                  </ul>
                  <li>Click &quot;Generate token&quot;</li>
                  <li>Copy the token and paste it here</li>
                </ol>
                <p className="mt-3 text-sm font-medium">Note: These permissions are needed to perform comprehensive technical debt and deployment metrics analysis including workflow runs, PR patterns, issue resolution times, and dependency analysis.</p>
              </div>
            </details>
          </div>
        </div>
        
        {apiError && (
          <div className="alert alert-error mb-4">
            <p className="font-medium">Error analyzing repository:</p>
            <p className="mt-1">
              {apiError.includes('Resource not accessible by personal access token') ? (
                <>Your token doesn&apos;t have sufficient permissions. Please ensure your token has access to <strong>Actions</strong>, <strong>Metadata</strong>, <strong>Contents</strong>, <strong>Issues</strong>, and <strong>Pull requests</strong> with read-only permissions.</>
              ) : apiError}
            </p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || !owner || !repo || (tokenRequired && !token)}
          className={`btn btn-primary btn-full ${
            isLoading || !owner || !repo || (tokenRequired && !token) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="loading-spinner mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </div>
          ) : (
            'Generate Tech Health Appendix'
          )}
        </button>
      </form>
    </div>
  );
}
