/**
 * Search Module React Query Hooks
 * Manages search queries, suggestions, AI Q&A, and saved searches with optimistic updates
 */

import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  SearchRequest,
  SearchResponse,
  SearchSuggestionResponse,
  AIQARequest,
  AIQAResponse,
  SavedSearch,
  SearchHistory,
  SearchCollection,
} from '../types/search';
import { searchDb } from '../services/searchDatabase';

const SEARCH_API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// ==================== Query Hooks ====================

/**
 * Execute search with filters and get results
 */
export const useSearch = (
  query: string,
  filters: any,
  limit: number = 50,
  enabled: boolean = true
) => {
  return useQuery(
    ['search', query, JSON.stringify(filters)],
    async () => {
      const response = await fetch(`${SEARCH_API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters,
          limit,
          tenantId: 'default',
          userId: 'current',
          includeSemanticSearch: true,
        } as SearchRequest),
      });
      if (!response.ok) throw new Error('Search failed');
      return response.json() as Promise<SearchResponse>;
    },
    {
      enabled: enabled && query.length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    }
  );
};

/**
 * Get search suggestions and recent searches
 */
export const useSearchSuggestions = (query: string, enabled: boolean = true) => {
  return useQuery(
    ['searchSuggestions', query],
    async () => {
      const response = await fetch(
        `${SEARCH_API_BASE}/search/suggestions?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json() as Promise<SearchSuggestionResponse>;
    },
    {
      enabled: enabled && query.length > 0,
      staleTime: 1000 * 60, // 1 minute
      cacheTime: 1000 * 60 * 5, // 5 minutes
    }
  );
};

/**
 * Get trending searches
 */
export const useTrendingSearches = () => {
  return useQuery(
    ['trendingSearches'],
    async () => {
      const response = await fetch(`${SEARCH_API_BASE}/search/trending`);
      if (!response.ok) throw new Error('Failed to fetch trending');
      return response.json();
    },
    {
      staleTime: 1000 * 60 * 30, // 30 minutes
      cacheTime: 1000 * 60 * 60, // 1 hour
    }
  );
};

/**
 * Get search history
 */
export const useSearchHistory = (userId: string, enabled: boolean = true) => {
  return useQuery(
    ['searchHistory', userId],
    async () => {
      return searchDb.getSearchHistory(userId, 50);
    },
    {
      enabled,
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    }
  );
};

/**
 * Get saved searches
 */
export const useSavedSearches = (userId: string, enabled: boolean = true) => {
  return useQuery(
    ['savedSearches', userId],
    async () => {
      return searchDb.getSavedSearches(userId);
    },
    {
      enabled,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
    }
  );
};

/**
 * Get pinned saved searches
 */
export const usePinnedSearches = (userId: string, enabled: boolean = true) => {
  return useQuery(
    ['pinnedSearches', userId],
    async () => {
      return searchDb.getPinnedSavedSearches(userId);
    },
    {
      enabled,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
    }
  );
};

/**
 * Get search collections
 */
export const useSearchCollections = (userId: string, enabled: boolean = true) => {
  return useQuery(
    ['searchCollections', userId],
    async () => {
      return searchDb.getSearchCollections(userId);
    },
    {
      enabled,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
    }
  );
};

// ==================== Mutation Hooks ====================

/**
 * Save a search to history
 */
export const useSaveSearchHistory = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (entry: SearchHistory) => {
      return searchDb.saveSearchHistoryEntry(entry);
    },
    {
      onSuccess: (_: any, variables: SearchHistory) => {
        queryClient.invalidateQueries(['searchHistory']);
      },
    }
  );
};

/**
 * Create a new saved search
 */
export const useCreateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (search: SavedSearch) => {
      return searchDb.saveSavedSearch(search);
    },
    {
      onSuccess: (_: any, variables: SavedSearch) => {
        queryClient.invalidateQueries(['savedSearches']);
      },
    }
  );
};

/**
 * Update a saved search
 */
export const useUpdateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<SavedSearch>;
    }) => {
      return searchDb.updateSavedSearch(id, updates);
    },
    {
      onSuccess: (_: any, { id }: { id: string }) => {
        queryClient.invalidateQueries(['savedSearches']);
        queryClient.invalidateQueries(['pinnedSearches']);
      },
    }
  );
};

/**
 * Delete a saved search
 */
export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      return searchDb.deleteSavedSearch(id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['savedSearches']);
        queryClient.invalidateQueries(['pinnedSearches']);
      },
    }
  );
};

/**
 * Toggle notifications for a saved search
 */
export const useToggleSearchNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      enabled,
    }: {
      id: string;
      enabled: boolean;
    }) => {
      return searchDb.toggleSavedSearchNotification(id, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
    },
  });
};

/**
 * Pin or unpin a saved search
 */
export const usePinSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      position,
    }: {
      id: string;
      position: number | undefined;
    }) => {
      return searchDb.updateSavedSearchPinnedPosition(id, position);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      queryClient.invalidateQueries({ queryKey: ['pinnedSearches'] });
    },
  });
};

/**
 * Create a new search collection
 */
export const useCreateSearchCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collection: SearchCollection) => {
      return searchDb.saveSearchCollection(collection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchCollections'] });
    },
  });
};

/**
 * Add results to a collection
 */
export const useAddToCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      resultIds,
    }: {
      collectionId: string;
      resultIds: string[];
    }) => {
      return searchDb.addToSearchCollection(collectionId, resultIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchCollections'] });
    },
  });
};

/**
 * Remove results from a collection
 */
export const useRemoveFromCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      resultIds,
    }: {
      collectionId: string;
      resultIds: string[];
    }) => {
      return searchDb.removeFromSearchCollection(collectionId, resultIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchCollections'] });
    },
  });
};

/**
 * Delete a search collection
 */
export const useDeleteSearchCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return searchDb.deleteSearchCollection(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchCollections'] });
    },
  });
};

/**
 * Get AI Q&A for a question
 */
export const useAIQuestion = (question: string, context?: string, enabled: boolean = false) => {
  return useQuery(
    ['aiQuestion', question],
    async () => {
      const response = await fetch(`${SEARCH_API_BASE}/search/ai-qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context,
          sources: ['all'],
          tenantId: 'default',
          userId: 'current',
        } as AIQARequest),
      });
      if (!response.ok) throw new Error('AI Q&A failed');
      return response.json() as Promise<AIQAResponse>;
    },
    {
      enabled: enabled && question.length > 0,
      staleTime: 1000 * 60 * 30, // 30 minutes
      cacheTime: 1000 * 60 * 60, // 1 hour
    }
  );
};

/**
 * Clear search history
 */
export const useClearSearchHistory = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (userId: string) => {
      return searchDb.clearSearchHistory(userId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['searchHistory']);
      },
    }
  );
};

/**
 * Delete search history entry
 */
export const useDeleteSearchHistoryEntry = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      return searchDb.deleteSearchHistoryEntry(id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['searchHistory']);
      },
    }
  );
};

/**
 * Get search statistics
 */
export const useSearchStats = (userId: string, enabled: boolean = true) => {
  return useQuery(
    ['searchStats', userId],
    async () => {
      return searchDb.getSearchStats(userId);
    },
    {
      enabled,
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 20, // 20 minutes
    }
  );
};

/**
 * Export search results
 */
export const useExportSearchResults = () => {
  return useMutation(
    async ({
      resultIds,
      format,
    }: {
      resultIds: string[];
      format: 'pdf' | 'csv' | 'json' | 'markdown';
    }) => {
      const response = await fetch(`${SEARCH_API_BASE}/search/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultIds,
          format,
          tenantId: 'default',
          userId: 'current',
        }),
      });
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    }
  );
};
