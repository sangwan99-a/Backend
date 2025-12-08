/**
 * Search Module Zustand Store
 * Manages UI state for search interface
 */

import { create } from 'zustand';
import { SearchUIState, SearchFilters, SearchBoxState } from '../types/search';

interface SearchStore extends SearchUIState {
  // SearchUIState actions
  setViewMode: (mode: 'grid' | 'list' | 'timeline' | 'map') => void;
  setSelectedResultId: (id: string | null) => void;
  setExpandedResultIds: (ids: string[]) => void;
  toggleExpandedResult: (id: string) => void;
  setSelectedResults: (ids: string[]) => void;
  toggleSelectedResult: (id: string) => void;
  clearSelectedResults: () => void;
  setFilters: (filters: SearchFilters) => void;
  updateFilters: (updates: Partial<SearchFilters>) => void;
  setSortBy: (sortBy: 'relevance' | 'recency' | 'modified' | 'size') => void;
  setSortAscending: (ascending: boolean) => void;
  toggleShowFilters: () => void;
  setShowFilters: (show: boolean) => void;
  toggleShowAISummary: () => void;
  setShowAISummary: (show: boolean) => void;
  setSearchBoxFocused: (focused: boolean) => void;
  setHighlightedSuggestion: (index: number) => void;
  toggleAdvancedOptions: () => void;
  setSelectedCollection: (collectionId: string | undefined) => void;
  toggleCollectionPanel: () => void;
  reset: () => void;
}

const defaultFilters: SearchFilters = {
  sources: ['all'],
  dateRange: {
    start: 0,
    end: Date.now(),
  },
  people: [],
  fileTypes: [],
};

export const useSearchStore = create<SearchStore>((set) => ({
  viewMode: 'grid',
  selectedResultId: null,
  expandedResultIds: [],
  selectedResults: [],
  filters: defaultFilters,
  sortBy: 'relevance',
  sortAscending: false,
  showFiltersPanel: true,
  showAISummary: false,
  searchBoxFocused: false,
  highlightedSuggestionIndex: -1,
  showAdvancedOptions: false,
  selectedCollection: undefined,
  showCollectionPanel: false,

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedResultId: (id) => set({ selectedResultId: id }),

  setExpandedResultIds: (ids) => set({ expandedResultIds: ids }),

  toggleExpandedResult: (id) =>
    set((state) => ({
      expandedResultIds: state.expandedResultIds.includes(id)
        ? state.expandedResultIds.filter((rid) => rid !== id)
        : [...state.expandedResultIds, id],
    })),

  setSelectedResults: (ids) => set({ selectedResults: ids }),

  toggleSelectedResult: (id) =>
    set((state) => ({
      selectedResults: state.selectedResults.includes(id)
        ? state.selectedResults.filter((rid) => rid !== id)
        : [...state.selectedResults, id],
    })),

  clearSelectedResults: () => set({ selectedResults: [] }),

  setFilters: (filters) => set({ filters }),

  updateFilters: (updates) =>
    set((state) => ({
      filters: { ...state.filters, ...updates },
    })),

  setSortBy: (sortBy) => set({ sortBy }),

  setSortAscending: (ascending) => set({ sortAscending: ascending }),

  toggleShowFilters: () =>
    set((state) => ({
      showFiltersPanel: !state.showFiltersPanel,
    })),

  setShowFilters: (show) => set({ showFiltersPanel: show }),

  toggleShowAISummary: () =>
    set((state) => ({
      showAISummary: !state.showAISummary,
    })),

  setShowAISummary: (show) => set({ showAISummary: show }),

  setSearchBoxFocused: (focused) => set({ searchBoxFocused: focused }),

  setHighlightedSuggestion: (index) => set({ highlightedSuggestionIndex: index }),

  toggleAdvancedOptions: () =>
    set((state) => ({
      showAdvancedOptions: !state.showAdvancedOptions,
    })),

  setSelectedCollection: (collectionId) => set({ selectedCollection: collectionId }),

  toggleCollectionPanel: () =>
    set((state) => ({
      showCollectionPanel: !state.showCollectionPanel,
    })),

  reset: () =>
    set({
      viewMode: 'grid',
      selectedResultId: null,
      expandedResultIds: [],
      selectedResults: [],
      filters: defaultFilters,
      sortBy: 'relevance',
      sortAscending: false,
      showFiltersPanel: true,
      showAISummary: false,
      searchBoxFocused: false,
      highlightedSuggestionIndex: -1,
      showAdvancedOptions: false,
      selectedCollection: undefined,
      showCollectionPanel: false,
    }),
}));

/**
 * Search box state store (for input value and suggestions)
 */
interface SearchBoxStore extends SearchBoxState {
  setValue: (value: string) => void;
  setFocused: (focused: boolean) => void;
  setShowSuggestions: (show: boolean) => void;
  setSuggestions: (suggestions: any[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  setVoiceInput: (active: boolean) => void;
  reset: () => void;
}

export const useSearchBoxStore = create<SearchBoxStore>((set) => ({
  value: '',
  isFocused: false,
  showSuggestions: false,
  suggestions: [],
  isLoading: false,
  error: undefined,
  voiceInput: false,

  setValue: (value) => set({ value }),

  setFocused: (focused) => set({ isFocused: focused }),

  setShowSuggestions: (show) => set({ showSuggestions: show }),

  setSuggestions: (suggestions) => set({ suggestions }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setVoiceInput: (active) => set({ voiceInput: active }),

  reset: () =>
    set({
      value: '',
      isFocused: false,
      showSuggestions: false,
      suggestions: [],
      isLoading: false,
      error: undefined,
      voiceInput: false,
    }),
}));
