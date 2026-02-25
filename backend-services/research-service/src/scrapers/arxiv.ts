/**
 * ArXiv Scraper
 * 
 * Scrapes academic papers from ArXiv using their official API.
 * Follows rate limiting and respects robots.txt.
 */

import { BaseScraper, ScraperConfig, ScraperResult, ResearchQuery, ResearchPaper } from '../types/index.js';

const ARXIV_API_BASE = 'http://export.arxiv.org/api/query';
const ARXIV_RATE_LIMIT_MS = 3000; // 3 seconds between requests

export class ArxivScraper implements BaseScraper {
  readonly config: ScraperConfig = {
    source: 'arxiv',
    baseUrl: ARXIV_API_BASE,
    rateLimitMs: ARXIV_RATE_LIMIT_MS,
    maxRetries: 3,
    timeoutMs: 30000
  };

  private lastRequestTime: number = 0;

  async search(query: ResearchQuery): Promise<ScraperResult> {
    await this.enforceRateLimit();

    const searchQuery = this.buildSearchQuery(query);
    const start = 0;
    const maxResults = Math.min(query.maxResults, 100);

    const url = new URL(ARXIV_API_BASE);
    url.searchParams.set('search_query', searchQuery);
    url.searchParams.set('start', start.toString());
    url.searchParams.set('max_results', maxResults.toString());
    url.searchParams.set('sortBy', 'relevance');
    url.searchParams.set('sortOrder', 'descending');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/atom+xml'
        }
      });

      if (!response.ok) {
        throw new Error(`ArXiv API error: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const papers = this.parseArxivResponse(xmlText);

      // Filter by year if specified
      const filteredPapers = this.filterByYear(papers, query.yearFrom, query.yearTo);

      // Filter PDF requirement if specified
      const finalPapers = query.requirePdf 
        ? filteredPapers.filter(p => p.pdfUrl)
        : filteredPapers;

      this.lastRequestTime = Date.now();

      return {
        papers: finalPapers.slice(0, query.maxResults),
        totalFound: papers.length,
        hasMore: papers.length >= maxResults,
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

    const url = new URL(ARXIV_API_BASE);
    url.searchParams.set('id_list', paperId);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) return null;

      const xmlText = await response.text();
      const papers = this.parseArxivResponse(xmlText);
      
      this.lastRequestTime = Date.now();
      
      return papers[0] || null;
    } catch {
      return null;
    }
  }

  private buildSearchQuery(query: ResearchQuery): string {
    // ArXiv search syntax: all:term AND cat:cs.AI
    const terms = query.query.split(' ').filter(t => t.length > 0);
    const searchParts = terms.map(t => `all:${t}`);
    
    // Add category filter for CS papers if query seems technical
    if (this.isTechnicalQuery(query.query)) {
      searchParts.push('cat:cs.*');
    }

    return searchParts.join(' AND ');
  }

  private isTechnicalQuery(query: string): boolean {
    const technicalTerms = [
      'algorithm', 'neural', 'machine learning', 'deep learning',
      'artificial intelligence', 'computer vision', 'nlp',
      'framework', 'system', 'architecture'
    ];
    
    const lowerQuery = query.toLowerCase();
    return technicalTerms.some(term => lowerQuery.includes(term));
  }

  private parseArxivResponse(xmlText: string): ResearchPaper[] {
    const papers: ResearchPaper[] = [];
    
    // Simple XML parsing using regex (for production, use proper XML parser)
    const entryRegex = /<entry[>\s][\s\S]*?<\/entry>/g;
    const entries = xmlText.match(entryRegex) || [];

    for (const entry of entries) {
      try {
        const paper = this.parseEntry(entry);
        if (paper) papers.push(paper);
      } catch (error) {
        console.warn('Failed to parse ArXiv entry:', error);
      }
    }

    return papers;
  }

  private parseEntry(entryXml: string): ResearchPaper | null {
    const idMatch = entryXml.match(/<id>([^\s]+)<\/id>/);
    const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
    const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/);
    const publishedMatch = entryXml.match(/<published>([^\s]+)<\/published>/);
    
    if (!idMatch || !titleMatch) return null;

    // Extract authors
    const authorMatches = entryXml.matchAll(/<author>[\s\S]*?<name>([^\s][\s\S]*?)<\/name>[\s\S]*?<\/author>/g);
    const authors = Array.from(authorMatches).map(m => m[1].trim());

    // Extract categories/keywords
    const categoryMatches = entryXml.matchAll(/term="([^"]+)"/g);
    const keywords = Array.from(categoryMatches).map(m => m[1]);

    // Extract arXiv ID from URL
    const arxivId = idMatch[1].split('/').pop()?.replace('abs/', '') || '';
    
    const publishedDate = publishedMatch?.[1];
    const year = publishedDate ? new Date(publishedDate).getFullYear() : undefined;

    return {
      id: `arxiv:${arxivId}`,
      title: this.cleanText(titleMatch[1]),
      authors,
      abstract: summaryMatch ? this.cleanText(summaryMatch[1]) : undefined,
      url: `https://arxiv.org/abs/${arxivId}`,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
      publishedDate,
      year,
      source: 'arxiv',
      keywords: keywords.length > 0 ? keywords : undefined,
      fetchedAt: new Date().toISOString()
    };
  }

  private cleanText(text: string): string {
    return text
      .replace(/\n\s+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private filterByYear(
    papers: ResearchPaper[], 
    yearFrom?: number, 
    yearTo?: number
  ): ResearchPaper[] {
    return papers.filter(paper => {
      if (!paper.year) return true;
      if (yearFrom && paper.year < yearFrom) return false;
      if (yearTo && paper.year > yearTo) return false;
      return true;
    });
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

export default ArxivScraper;
