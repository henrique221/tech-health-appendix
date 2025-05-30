import { Octokit } from "octokit";
import { Repository, Commit, GitHubAuth } from "../types";

// Custom error class for GitHub API rate limit errors
export class GitHubRateLimitError extends Error {
  public resetTime: Date;
  public limit: number;
  public remaining: number;

  constructor(message: string, resetTime: Date, limit: number, remaining: number) {
    super(message);
    this.name = 'GitHubRateLimitError';
    this.resetTime = resetTime;
    this.limit = limit;
    this.remaining = remaining;
  }
}

// Define an interface for GitHubService to ensure TypeScript recognizes all methods
export interface IGitHubService {
  getRepository(owner: string, name: string): Promise<Repository>;
  getCommits(owner: string, repo: string, count?: number): Promise<Commit[]>;
  getLanguages(owner: string, repo: string): Promise<Record<string, number>>;
  getContributors(owner: string, repo: string): Promise<Array<Record<string, unknown>>>;
  getFileContent(owner: string, repo: string, path: string): Promise<string>;
  getWorkflowRuns(owner: string, repo: string): Promise<{ workflow_runs: Array<Record<string, unknown>>; total_count: number }>;
  getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all', count?: number): Promise<Array<Record<string, unknown>>>;
  getIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all', count?: number): Promise<Array<Record<string, unknown>>>;
  getReleases(owner: string, repo: string, count?: number): Promise<Array<Record<string, unknown>>>;
  getDirectoryContents(owner: string, repo: string, path?: string): Promise<Array<Record<string, unknown>>>;
  getCodeFrequencyStats(owner: string, repo: string): Promise<Array<[number, number, number]>>;
}

// Implement the interface
export class GitHubService implements IGitHubService {
  private octokit: Octokit;
  private hasAuth: boolean;

  constructor(auth?: GitHubAuth) {
    // Initialize Octokit with or without authentication
    this.hasAuth = !!auth?.token;
    if (auth?.token) {
      this.octokit = new Octokit({ auth: auth.token });
    } else {
      this.octokit = new Octokit();
    }
  }
  
  /**
   * Check if an error is a GitHub API rate limit error and handle it
   * @param error The error object from the GitHub API
   * @throws GitHubRateLimitError if the error is a rate limit error
   */
  private checkRateLimitError(error: Record<string, unknown>): void {
    // Check if it's a rate limit error (HTTP 403 with specific message)
    if (error.status === 403 && 
        ((typeof error.message === 'string' && error.message.includes('API rate limit exceeded')) || 
         (error.response && typeof error.response === 'object' && 
          'data' in error.response && error.response.data && 
          typeof error.response.data === 'object' && 
          'message' in error.response.data && 
          typeof error.response.data.message === 'string' && 
          error.response.data.message.includes('API rate limit exceeded')))) {
      
      // Extract rate limit information from headers
      const headers = error.response && typeof error.response === 'object' && 
                      'headers' in error.response ? error.response.headers : {};
      const resetTimestamp = headers && 
                           typeof headers === 'object' && 
                           'x-ratelimit-reset' in headers && 
                           headers['x-ratelimit-reset'] ? 
        parseInt(String(headers['x-ratelimit-reset'])) * 1000 : // Convert to milliseconds
        Date.now() + 3600000; // Default to 1 hour from now if not available
      
      const limit = headers && typeof headers === 'object' && 'x-ratelimit-limit' in headers ?
        parseInt(String(headers['x-ratelimit-limit'])) : 60;
      const remaining = headers && typeof headers === 'object' && 'x-ratelimit-remaining' in headers ?
        parseInt(String(headers['x-ratelimit-remaining'])) : 0;
      
      // Create and throw a custom rate limit error
      throw new GitHubRateLimitError(
        'GitHub API rate limit exceeded. Please try again later or provide an access token.',
        new Date(resetTimestamp),
        limit,
        remaining
      );
    }
    
    // Re-throw the original error if it's not a rate limit error
    throw error;
  }

  /**
   * Get repository information
   * @param owner Repository owner
   * @param repo Repository name
   * @throws GitHubRateLimitError if the API rate limit is exceeded
   */
  async getRepository(owner: string, name: string): Promise<Repository> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo: name,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data as Repository;
    } catch (error: any) {
      console.error('Error fetching repository:', error);
      // Check for rate limit errors
      this.checkRateLimitError(error);
      // If it's not a rate limit error, just throw the original error
      throw error;
    }
  }

  /**
   * Get recent commits for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param count Number of commits to retrieve (default: 30)
   */
  async getCommits(owner: string, repo: string, count: number = 30): Promise<Commit[]> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/commits', {
        owner,
        repo,
        per_page: count,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data as Commit[];
    } catch (error) {
      console.error('Error fetching commits:', error);
      throw error;
    }
  }

  /**
   * Get languages used in the repository
   * @param owner Repository owner
   * @param repo Repository name
   */
  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/languages', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching languages:', error);
      throw error;
    }
  }

  /**
   * Get contributors to the repository
   * @param owner Repository owner
   * @param repo Repository name
   */
  async getContributors(owner: string, repo: string): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/contributors', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching contributors:', error);
      throw error;
    }
  }

  /**
   * Get the content of a file
   * @param owner Repository owner
   * @param repo Repository name
   * @param path File path
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      // Handle file content (single file response)
      if (!Array.isArray(response.data) && 'content' in response.data) {
        const fileData = response.data as any;
        if (fileData.encoding === 'base64') {
          return Buffer.from(fileData.content, 'base64').toString('utf-8');
        }
        return fileData.content || '';
      }
      
      return '';
    } catch (error: any) {
      // Handle 404 errors gracefully (file not found is expected for dependency analysis)
      if (error.status === 404) {
        // Don't log 404 errors as they are expected when files don't exist
        throw error; // Keep the original GitHub API error structure
      }
      
      // Log other errors as they may indicate real issues
      console.error(`Error fetching content for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow runs (CI/CD) for a repository
   * @param owner Repository owner
   * @param repo Repository name
   */
  async getWorkflowRuns(owner: string, repo: string): Promise<{ workflow_runs: Array<Record<string, unknown>>; total_count: number }> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/actions/runs', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching workflow runs:', error);
      // If no authentication and it's a 401/403 error, return empty data
      if ((error.status === 401 || error.status === 403) && !this.hasAuth) {
        console.warn('No authentication provided for workflow runs - returning empty data');
        return { workflow_runs: [], total_count: 0 };
      }
      throw error;
    }
  }

  /**
   * Get pull requests for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param state PR state (open, closed, all)
   * @param count Number of PRs to retrieve
   */
  async getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all', count: number = 30): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/pulls', {
        owner,
        repo,
        state,
        per_page: count,
        sort: 'updated',
        direction: 'desc',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pull requests:', error);
      // If no authentication and it's a 401/403 error, return empty data
      if ((error.status === 401 || error.status === 403) && !this.hasAuth) {
        console.warn('No authentication provided for pull requests - returning empty data');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get issues for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param state Issue state (open, closed, all)
   * @param count Number of issues to retrieve
   */
  async getIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all', count: number = 30): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner,
        repo,
        state,
        per_page: count,
        sort: 'updated',
        direction: 'desc',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching issues:', error);
      // If no authentication and it's a 401/403 error, return empty data
      if ((error.status === 401 || error.status === 403) && !this.hasAuth) {
        console.warn('No authentication provided for issues - returning empty data');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get releases for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param count Number of releases to retrieve
   */
  async getReleases(owner: string, repo: string, count: number = 50): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/releases', {
        owner,
        repo,
        per_page: count,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching releases:', error);
      throw error;
    }
  }

  /**
   * Get repository directory contents
   * @param owner Repository owner
   * @param repo Repository name
   * @param path Directory path (empty for root)
   */
  async getDirectoryContents(owner: string, repo: string, path: string = ''): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      console.error(`Error fetching directory contents for ${path}:`, error);
      return [];
    }
  }

  /**
   * Get code frequency stats (additions and deletions per week)
   * @param owner Repository owner
   * @param repo Repository name
   */
  async getCodeFrequencyStats(owner: string, repo: string): Promise<Array<[number, number, number]>> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/stats/code_frequency', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      // Ensure the data conforms to the expected [number, number, number][] format
      if (Array.isArray(response.data)) {
        return response.data.map(item => {
          if (Array.isArray(item) && item.length >= 3) {
            return [Number(item[0]), Number(item[1]), Number(item[2])] as [number, number, number];
          }
          return [0, 0, 0] as [number, number, number];
        });
      }
      return [];
    } catch (error) {
      console.error('Error fetching code frequency:', error);
      return [];
    }
  }

  /**
   * Get commit activity stats
   * @param owner Repository owner
   * @param repo Repository name
   */
  async getCommitActivity(owner: string, repo: string): Promise<any[]> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/stats/commit_activity', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching commit activity:', error);
      return [];
    }
  }
}
