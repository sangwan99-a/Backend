/**
 * Advanced Search Module Type Definitions
 * Comprehensive types for semantic search, filters, suggestions, and AI Q&A
 */

// ==================== Search Query Types ====================

export type SearchSource = 'messages' | 'documents' | 'tasks' | 'calendar' | 'knowledge' | 'all';
export type SearchResultType = 'message' | 'document' | 'task' | 'event' | 'article' | 'person';
export type SearchViewMode = 'grid' | 'list' | 'timeline' | 'map';
export type SortBy = 'relevance' | 'recency' | 'modified' | 'size';

export interface SearchQuery {
  id: string;
  text: string;
  filters: SearchFilters;
  results: SearchResult[];
  totalResults: number;
  executionTime: number;
  timestamp: number;
  userId: string;
  tenantId: string;
}

export interface SearchFilters {
  sources: SearchSource[];
  dateRange: {
    start: number;
    end: number;
  };
  people: string[]; // User IDs
  fileTypes: string[]; // MIME types or extensions
  status?: 'open' | 'closed' | 'in_progress' | 'completed';
  priority?: 'p0' | 'p1' | 'p2' | 'p3';
  starred?: boolean;
  hasAttachments?: boolean;
  language?: string;
  customFields?: Record<string, string | number | boolean>;
}

// ==================== Search Result Types ====================

export interface SearchResult {
  id: string;
  type: SearchResultType;
  source: SearchSource;
  title: string;
  snippet: string; // Preview text
  content: string; // Full content (for preview)
  relevanceScore: number; // 0-100
  semanticSimilarity: number; // 0-100 (vector similarity)
  keywordMatches: string[]; // Matched search terms
  url: string;
  timestamp: number;
  modifiedAt: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  metadata: SearchResultMetadata;
  previewUrl?: string;
  tags: string[];
  mentions: string[]; // @mentions in content
  relatedContent: string[]; // IDs of related items
}

export interface SearchResultMetadata {
  fileSize?: number;
  mimeType?: string;
  duration?: number; // For media
  pageCount?: number;
  language?: string;
  readingTime?: number; // In seconds
  viewCount?: number;
  shareCount?: number;
  commentCount?: number;
  messageThread?: string;
  taskStatus?: 'open' | 'closed' | 'in_progress';
  taskPriority?: 'p0' | 'p1' | 'p2' | 'p3';
  eventDate?: number;
  eventAttendees?: string[];
  articleCategory?: string;
  articleAuthor?: string;
  articleVersion?: number;
  customData?: Record<string, any>;
}

// ==================== Search Suggestions ====================

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'person' | 'file' | 'tag' | 'recent' | 'trending';
  icon?: string;
  popularity?: number;
  frequency?: number;
  resultCount?: number;
}

export interface SearchSuggestionResponse {
  suggestions: SearchSuggestion[];
  trending: SearchSuggestion[];
  recent: SearchSuggestion[];
}

// ==================== Saved Searches ====================

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  filters: SearchFilters;
  color?: string;
  icon?: string;
  pinnedPosition?: number;
  createdAt: number;
  modifiedAt: number;
  userId: string;
  notificationsEnabled: boolean;
  tagIds: string[];
  sharedWith?: {
    userId: string;
    permission: 'view' | 'edit';
  }[];
}

// ==================== AI Q&A Types ====================

export interface AIQuestion {
  id: string;
  question: string;
  context: string; // Selected text or file content
  sources: SearchSource[];
  createdAt: number;
}

export interface AIAnswer {
  id: string;
  questionId: string;
  answer: string;
  sources: SearchResult[];
  confidence: number; // 0-100
  keyPoints: string[];
  actionItems?: {
    action: string;
    owner?: string;
    dueDate?: number;
  }[];
  followUpQuestions?: string[];
  generatedAt: number;
  model: string;
}

export interface AISummaryRequest {
  results: SearchResult[];
  summaryType: 'brief' | 'detailed' | 'executive';
  focusAreas?: string[];
}

export interface AISummary {
  id: string;
  summary: string;
  keyPoints: string[];
  themes: {
    theme: string;
    occurrences: number;
    relatedResults: string[];
  }[];
  timeline?: {
    date: number;
    event: string;
    sourceId: string;
  }[];
  generatedAt: number;
  model: string;
}

// ==================== Search History ====================

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  executionTime: number;
  userId: string;
  timestamp: number;
  viewedResults: string[]; // IDs of results clicked
  savedAsSearch?: string; // SavedSearch ID if saved
}

// ==================== Search Collections ====================

export interface SearchCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  resultIds: string[];
  createdBy: string;
  createdAt: number;
  modifiedAt: number;
  sharedWith?: {
    userId: string;
    permission: 'view' | 'edit' | 'manage';
  }[];
  tags: string[];
  isPublic: boolean;
  viewCount: number;
}

// ==================== Search Analytics ====================

export interface SearchAnalytics {
  id: string;
  userId: string;
  queryCount: number;
  topQueries: {
    query: string;
    count: number;
  }[];
  topResults: {
    resultId: string;
    title: string;
    viewCount: number;
    clickCount: number;
  }[];
  averageResultsPerQuery: number;
  averageTimePerSearch: number;
  mostUsedFilters: string[];
  preferredSources: SearchSource[];
  timeRange: {
    start: number;
    end: number;
  };
}

// ==================== UI State Types ====================

export interface SearchUIState {
  viewMode: SearchViewMode;
  selectedResultId: string | null;
  expandedResultIds: string[];
  selectedResults: string[];
  filters: SearchFilters;
  sortBy: SortBy;
  sortAscending: boolean;
  showFiltersPanel: boolean;
  showAISummary: boolean;
  searchBoxFocused: boolean;
  highlightedSuggestionIndex: number;
  showAdvancedOptions: boolean;
  selectedCollection?: string;
  showCollectionPanel: boolean;
}

export interface SearchBoxState {
  value: string;
  isFocused: boolean;
  showSuggestions: boolean;
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error?: string;
  voiceInput: boolean;
}

// ==================== Export Types ====================

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'markdown';
  includeMetadata: boolean;
  includePreview: boolean;
  groupBy?: 'type' | 'source' | 'date' | 'person';
  maxResults?: number;
}

export interface ExportJob {
  id: string;
  searchId: string;
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

// ==================== API Request/Response Types ====================

export interface SearchRequest {
  query: string;
  filters: SearchFilters;
  limit: number;
  offset: number;
  tenantId: string;
  userId: string;
  includeSemanticSearch: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  executionTime: number;
  facets?: {
    sources: { source: SearchSource; count: number }[];
    types: { type: SearchResultType; count: number }[];
    people: { userId: string; name: string; count: number }[];
    dates: { range: string; count: number }[];
  };
  suggestions?: SearchSuggestion[];
}

export interface AIQARequest {
  question: string;
  context?: string;
  sources: SearchSource[];
  tenantId: string;
  userId: string;
}

export interface AIQAResponse {
  answer: string;
  sources: SearchResult[];
  keyPoints: string[];
  actionItems: {
    action: string;
    owner?: string;
    dueDate?: number;
  }[];
  followUpQuestions: string[];
  confidence: number;
  model: string;
  generatedAt: number;
}

// ==================== WebSocket Message Types ====================

export interface SearchNotificationMessage {
  type: 'new_result' | 'query_updated' | 'relevant_content' | 'ai_answer_ready' | 'indexing_progress';
  searchId: string;
  data: any;
  timestamp: number;
}

export interface IndexingProgressMessage {
  source: SearchSource;
  itemsIndexed: number;
  totalItems: number;
  progress: number; // 0-100
  lastIndexedAt: number;
}

// ==================== Search Events ====================

export interface SearchEvent {
  id: string;
  userId: string;
  type: 'query' | 'click' | 'view' | 'share' | 'save' | 'export' | 'ai_generate';
  searchId?: string;
  resultId?: string;
  timestamp: number;
  metadata: Record<string, any>;
}
