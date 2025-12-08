/**
 * Search API Integration
 * Full-text and semantic search microservice with AI-powered Q&A
 */

import { getApiClient, useApi, useMutateApi } from '@/lib/api-client';

export interface SearchResult {
  id: string;
  type: 'document' | 'email' | 'task' | 'chat' | 'calendar' | 'contact';
  title: string;
  description?: string;
  content?: string;
  preview?: string;
  score: number; // relevance score
  url: string;
  icon?: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface SearchFilter {
  key: string;
  label: string;
  values: FilterValue[];
}

export interface FilterValue {
  value: string;
  label: string;
  count: number;
  selected?: boolean;
}

export interface SearchFacets {
  type: SearchFilter;
  date: SearchFilter;
  owner: SearchFilter;
  tags?: SearchFilter;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'tag' | 'contact' | 'document';
  frequency?: number;
  icon?: string;
}

export interface SemanticQAResult {
  question: string;
  answer: string;
  confidence: number;
  sources: {
    documentId: string;
    title: string;
    excerpt: string;
    relevance: number;
  }[];
  followUpQuestions?: string[];
}

export interface SearchAnalytics {
  query: string;
  resultCount: number;
  timeSpent: number; // milliseconds
  resultClicked?: string; // clicked result ID
  timestamp: string;
}

/**
 * Search API Client
 */
export class SearchAPIClient {
  private api = getApiClient();
  private searchAnalytics: SearchAnalytics[] = [];

  /**
   * Full-text search
   */
  async search(
    query: string,
    filters?: {
      types?: string[];
      dateRange?: { from: string; to: string };
      owner?: string;
      tags?: string[];
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    results: SearchResult[];
    total: number;
    facets: SearchFacets;
    executionTime: number;
  }> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    if (filters) {
      if (filters.types?.length) {
        params.append('types', filters.types.join(','));
      }
      if (filters.dateRange) {
        params.append('dateFrom', filters.dateRange.from);
        params.append('dateTo', filters.dateRange.to);
      }
      if (filters.owner) {
        params.append('owner', filters.owner);
      }
      if (filters.tags?.length) {
        params.append('tags', filters.tags.join(','));
      }
    }

    return this.api.get(`/api/v1/search?${params}`);
  }

  /**
   * Semantic search with AI
   */
  async semanticSearch(
    query: string,
    limit: number = 10
  ): Promise<{
    results: SearchResult[];
    executionTime: number;
  }> {
    return this.api.post('/api/v1/search/semantic', {
      query,
      limit,
    });
  }

  /**
   * AI-powered Q&A
   */
  async askQuestion(
    question: string,
    context?: {
      documentIds?: string[];
      scope?: 'all' | 'documents' | 'emails' | 'tasks';
    }
  ): Promise<SemanticQAResult> {
    return this.api.post('/api/v1/search/ai-qa', {
      question,
      context,
    });
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(
    query: string,
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    return this.api.get(`/api/v1/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  /**
   * Get instant search results (fast, limited)
   */
  async getInstantResults(
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    return this.api.get(`/api/v1/search/instant?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(): Promise<{
    id: string;
    name: string;
    query: string;
    filters: any;
    createdAt: string;
  }[]> {
    return this.api.get('/api/v1/search/saved');
  }

  /**
   * Save search
   */
  async saveSearch(
    name: string,
    query: string,
    filters?: any
  ): Promise<{
    id: string;
    name: string;
    query: string;
    filters?: any;
    createdAt: string;
  }> {
    return this.api.post('/api/v1/search/saved', {
      name,
      query,
      filters,
    });
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(searchId: string): Promise<void> {
    return this.api.delete(`/api/v1/search/saved/${searchId}`);
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(limit: number = 10): Promise<{
    query: string;
    frequency: number;
    trend: 'up' | 'down' | 'stable';
  }[]> {
    return this.api.get(`/api/v1/search/trending?limit=${limit}`);
  }

  /**
   * Get recent searches
   */
  async getRecentSearches(limit: number = 10): Promise<{
    query: string;
    timestamp: string;
  }[]> {
    return this.api.get(`/api/v1/search/recent?limit=${limit}`);
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    return this.api.delete('/api/v1/search/history');
  }

  /**
   * Get search filters for type
   */
  async getFilters(resultType: string): Promise<SearchFilter[]> {
    return this.api.get(`/api/v1/search/filters?type=${resultType}`);
  }

  /**
   * Track search analytics
   */
  trackSearch(query: string, resultCount: number): void {
    this.searchAnalytics.push({
      query,
      resultCount,
      timeSpent: 0,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track result click
   */
  trackResultClick(query: string, resultId: string): void {
    const analytics = this.searchAnalytics.find((a) => a.query === query);
    if (analytics) {
      analytics.resultClicked = resultId;
    }
  }

  /**
   * Submit analytics (periodically)
   */
  async submitAnalytics(): Promise<void> {
    if (this.searchAnalytics.length === 0) return;

    await this.api.post('/api/v1/search/analytics', {
      events: this.searchAnalytics,
    });

    this.searchAnalytics = [];
  }

  /**
   * Get search index status
   */
  async getIndexStatus(): Promise<{
    indexed: number;
    lastUpdated: string;
    indexSize: string;
  }> {
    return this.api.get('/api/v1/search/index-status');
  }
}

/**
 * Export singleton instance
 */
export const searchAPI = new SearchAPIClient();

/**
 * React hooks for search functionality
 */

/**
 * Hook for full-text search
 */
export function useSearch(
  query: string,
  filters?: {
    types?: string[];
    dateRange?: { from: string; to: string };
    owner?: string;
    tags?: string[];
  }
) {
  return useApi(
    ['search', query, JSON.stringify(filters)],
    () => searchAPI.search(query, filters),
    {
      enabled: !!query && query.length > 2,
      staleTime: 0, // Always fresh
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );
}

/**
 * Hook for semantic search
 */
export function useSemanticSearch(query: string) {
  return useApi(['semantic-search', query], () => searchAPI.semanticSearch(query), {
    enabled: !!query && query.length > 3,
    staleTime: 0,
    cacheTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for AI Q&A
 */
export function useAskQuestion(
  question: string,
  context?: {
    documentIds?: string[];
    scope?: 'all' | 'documents' | 'emails' | 'tasks';
  }
) {
  return useApi(
    ['ask-question', question, JSON.stringify(context)],
    () => searchAPI.askQuestion(question, context),
    {
      enabled: !!question && question.length > 5,
      staleTime: 0,
      cacheTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Hook for search suggestions
 */
export function useSearchSuggestions(query: string) {
  return useApi(
    ['search-suggestions', query],
    () => searchAPI.getSuggestions(query),
    {
      enabled: !!query && query.length > 1,
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for instant search
 */
export function useInstantSearch(query: string) {
  return useApi(
    ['instant-search', query],
    () => searchAPI.getInstantResults(query),
    {
      enabled: !!query && query.length > 2,
      staleTime: 0,
      cacheTime: 2 * 60 * 1000,
    }
  );
}

/**
 * Hook for saved searches
 */
export function useSavedSearches() {
  return useApi(['saved-searches'], () => searchAPI.getSavedSearches(), {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to save search
 */
export function useSaveSearch() {
  return useMutateApi(
    ({
      name,
      query,
      filters,
    }: {
      name: string;
      query: string;
      filters?: any;
    }) => searchAPI.saveSearch(name, query, filters)
  );
}

/**
 * Hook to delete saved search
 */
export function useDeleteSavedSearch() {
  return useMutateApi((searchId: string) => searchAPI.deleteSavedSearch(searchId));
}

/**
 * Hook for trending searches
 */
export function useTrendingSearches() {
  return useApi(['trending-searches'], () => searchAPI.getTrendingSearches(), {
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook for recent searches
 */
export function useRecentSearches() {
  return useApi(['recent-searches'], () => searchAPI.getRecentSearches(), {
    staleTime: 0, // Always fresh
    cacheTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get filters
 */
export function useSearchFilters(resultType: string) {
  return useApi(['search-filters', resultType], () => searchAPI.getFilters(resultType), {
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for search index status
 */
export function useSearchIndexStatus() {
  return useApi(['search-index-status'], () => searchAPI.getIndexStatus(), {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
