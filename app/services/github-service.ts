import { Octokit } from "octokit";
import { Repository, Commit, GitHubAuth } from "../types";

export class GitHubService {
  private octokit: Octokit;

  constructor(auth?: GitHubAuth) {
    // Initialize Octokit with or without authentication
    if (auth?.token) {
      this.octokit = new Octokit({ auth: auth.token });
    } else {
      this.octokit = new Octokit();
    }
  }

  /**
   * Get repository information
   * @param owner Repository owner
   * @param repo Repository name
   */
  async getRepository(owner: string, repo: string): Promise<Repository> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data as Repository;
    } catch (error) {
      console.error('Error fetching repository:', error);
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
  async getLanguages(owner: string, repo: string): Promise<{ [key: string]: number }> {
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
  async getContributors(owner: string, repo: string): Promise<any[]> {
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
  async getWorkflowRuns(owner: string, repo: string): Promise<any> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/actions/runs', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow runs:', error);
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
  async getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all', count: number = 100): Promise<any[]> {
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
    } catch (error) {
      console.error('Error fetching pull requests:', error);
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
  async getIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all', count: number = 100): Promise<any[]> {
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
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  /**
   * Get releases for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param count Number of releases to retrieve
   */
  async getReleases(owner: string, repo: string, count: number = 50): Promise<any[]> {
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
  async getDirectoryContents(owner: string, repo: string, path: string = ''): Promise<any[]> {
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
  async getCodeFrequency(owner: string, repo: string): Promise<number[][]> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/stats/code_frequency', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return Array.isArray(response.data) ? response.data : [];
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
