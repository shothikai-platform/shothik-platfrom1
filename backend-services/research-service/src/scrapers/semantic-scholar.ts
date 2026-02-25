/**
 * Semantic Scholar Scraper
 * 
 * Uses Semantic Scholar API for academic paper search.
 * Free tier: 100 requests/5 minutes
 * https://api.semanticscholar.org/api-docs/
 */

import { BaseScraper, ScraperConfig, ScraperResult, ResearchQuery, ResearchPaper } from '../types/index.js';

const SEMANTIC_SCHOLAR_API_BASE = 'https://api.semanticscholar.org/graph/v1';
const SEMANTIC_SCHOLAR_RATE_LIMIT_MS = 100; // 100ms between requests (10 req/sec)

export class SemanticScholarScraper implements BaseScraper {
  readonly config: ScraperConfig = {
    source: 'semantic_scholar',
    baseUrl: SEMANTIC_SCHOLAR_API_BASE,
    rateLimitMs: SEMANTIC_SCHOLAR_RATE_LIMIT_MS,
    maxRetries: 3,
    timeoutMs: 30000
  };

  private lastRequestTime: number = 0;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  async search(query: ResearchQuery): Promise<ScraperResult> {
    await this.enforceRateLimit();

    const fields = 'paperId,title,abstract,year,authors,citationCount,url,openAccessPdf';
    const limit = Math.min(query.maxResults, 100);

    const url = new URL(`${SEMANTIC_SCHOLAR_API_BASE}/paper/search`);
    url.searchParams.set('query', query.query);
    url.searchParams.set('fields', fields);
    url.searchParams.set('limit', limit.toString());
    
    if (query.yearFrom) {
      url.searchParams.set('publicationDateOrYear', `${query.yearFrom}:${query.yearTo || query.yearFrom}`);
    }

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(url.toString(), { headers });

      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const papers = this.parseResponse(data, query);

      this.lastRequestTime = Date.now();

      return {
        papers,
        totalFound: data.total || papers.length,
        hasMore: (data.offset || 0) + papers.length < (data.total || 0),
        errors: []
      };
    } catch (error) {
      return {
        papers: [],
        totalFound: 0,
        hasMore: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async getPaperDetails(paperId: string): Promise<ResearchPaper | null> {
    await this.enforceRateLimit();

    const fields = 'paperId,title,abstract,year,authors,citationCount,url,openAccessPdf,references,citations';
    
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(
        `${SEMANTIC_SCHOLAR_API_BASE}/paper/${paperId}?fields=${fields}`,
        { headers }
      );

      if (!response.ok) return null;

      const data = await response.json();
      this.lastRequestTime = Date.now();

      return this.transformPaper(data);
    } catch {
      return null;
    }
  }

  private parseResponse(data: any, query: ResearchQuery): ResearchPaper[] {
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    let papers = data.data.map((item: any) => this.transformPaper(item));

    // Filter PDF requirement if specified
    if (query.requirePdf) {
      papers = papers.filter((p: ResearchPaper) => p.pdfUrl);
    }

    return papers;
  }

  private transformPaper(item: any): ResearchPaper {
    const authors = item.authors?.map((a: any) => a.name) || [];
    
    return {
      id: `semantic_scholar:${item.paperId}`,
      title: item.title,
      authors,
      abstract: item.abstract,
      url: item.url || `https://www.semanticscholar.org/paper/${item.paperId}`,
      pdfUrl: item.openAccessPdf?.url,
      year: item.year,
      citationCount: item.citationCount,
      source: 'semantic_scholar',
      keywords: undefined, // Semantic Scholar doesn't provide keywords directly
      relevanceScore: undefined,
      fetchedAt: new Date().toISOString()
    };
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.config.rateLimitMs) {
      const waitTime = this.config.rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export default SemanticScholarScraper;
