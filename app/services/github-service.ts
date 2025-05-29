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
      
      // Decode the base64-encoded content
      if (response.data.encoding === 'base64') {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      return response.data.content;
    } catch (error) {
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
}
