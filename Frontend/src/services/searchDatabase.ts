/**
 * Search Database Service (Dexie)
 * Handles indexing, persistence, and retrieval of search data
 */

import Dexie, { Table } from 'dexie';
import {
  SearchQuery,
  SearchResult,
  SavedSearch,
  SearchHistory,
  SearchCollection,
  SearchAnalytics,
  SearchEvent,
} from '../types/search';

export class SearchDatabase extends Dexie {
  searchResults!: Table<SearchResult>;
  searchQueries!: Table<SearchQuery>;
  searchHistory!: Table<SearchHistory>;
  savedSearches!: Table<SavedSearch>;
  searchCollections!: Table<SearchCollection>;
  searchAnalytics!: Table<SearchAnalytics>;
  searchEvents!: Table<SearchEvent>;

  constructor() {
    super('FusionDeskSearch');
    this.version(1).stores({
      searchResults: 'id, [userId+timestamp], source, type, [createdBy.id]',
      searchQueries: 'id, [userId+timestamp], tenantId',
      searchHistory: 'id, [userId+timestamp], query',
      savedSearches: 'id, [userId+createdAt], pinnedPosition',
      searchCollections: 'id, [createdBy+createdAt], isPublic',
      searchAnalytics: 'id, userId',
      searchEvents: 'id, [userId+timestamp], type',
    });
  }

  // ==================== Search Results ====================

  async saveSearchResult(result: SearchResult): Promise<string> {
    return (await this.searchResults.add(result)) as any as string;
  }

  async getSearchResult(id: string): Promise<SearchResult | undefined> {
    return this.searchResults.get(id);
  }

  async getSearchResults(userId: string, limit: number = 50): Promise<SearchResult[]> {
    return this.searchResults
      .where('[userId+timestamp]')
      .between([userId, 0], [userId, Date.now()])
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getSearchResultsBySource(
    userId: string,
    source: string,
    limit: number = 50
  ): Promise<SearchResult[]> {
    return this.searchResults
      .where('source')
      .equals(source)
      .filter((r) => r.createdBy.id === userId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getSearchResultsByType(
    userId: string,
    type: string,
    limit: number = 50
  ): Promise<SearchResult[]> {
    return this.searchResults
      .where('type')
      .equals(type)
      .filter((r) => r.createdBy.id === userId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  async searchResultsByTitle(
    userId: string,
    query: string
  ): Promise<SearchResult[]> {
    const normalizedQuery = query.toLowerCase();
    return this.searchResults
      .filter((r) => r.createdBy.id === userId && r.title.toLowerCase().includes(normalizedQuery))
      .toArray();
  }

  async deleteSearchResult(id: string): Promise<void> {
    return this.searchResults.delete(id);
  }

  async bulkDeleteSearchResults(ids: string[]): Promise<void> {
    return this.searchResults.bulkDelete(ids);
  }

  async clearOldSearchResults(daysOld: number): Promise<number> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const oldResults = await this.searchResults
      .where('timestamp')
      .below(cutoffTime)
      .toArray();
    await this.bulkDeleteSearchResults(oldResults.map((r) => r.id));
    return oldResults.length;
  }

  // ==================== Search Queries ====================

  async saveSearchQuery(query: SearchQuery): Promise<string> {
    return (await this.searchQueries.add(query)) as any as string;
  }

  async getSearchQuery(id: string): Promise<SearchQuery | undefined> {
    return this.searchQueries.get(id);
  }

  async getSearchQueries(userId: string, limit: number = 20): Promise<SearchQuery[]> {
    return this.searchQueries
      .where('[userId+timestamp]')
      .between([userId, 0], [userId, Date.now()])
      .reverse()
      .limit(limit)
      .toArray();
  }

  async updateSearchQuery(id: string, query: Partial<SearchQuery>): Promise<void> {
    await this.searchQueries.update(id, query);
  }

  // ==================== Search History ====================

  async saveSearchHistoryEntry(entry: SearchHistory): Promise<string> {
    return (await this.searchHistory.add(entry)) as any as string;
  }

  async getSearchHistory(userId: string, limit: number = 50): Promise<SearchHistory[]> {
    return this.searchHistory
      .where('[userId+timestamp]')
      .between([userId, 0], [userId, Date.now()])
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getSearchHistoryByQuery(userId: string, query: string): Promise<SearchHistory[]> {
    return this.searchHistory
      .where('query')
      .equals(query)
      .filter((h) => h.userId === userId)
      .toArray();
  }

  async deleteSearchHistoryEntry(id: string): Promise<void> {
    return this.searchHistory.delete(id);
  }

  async clearSearchHistory(userId: string): Promise<number> {
    const entries = await this.searchHistory
      .where('userId')
      .equals(userId)
      .toArray();
    await this.searchHistory.bulkDelete(entries.map((e) => e.id));
    return entries.length;
  }

  async clearOldSearchHistory(daysOld: number): Promise<number> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const oldEntries = await this.searchHistory
      .where('timestamp')
      .below(cutoffTime)
      .toArray();
    await this.searchHistory.bulkDelete(oldEntries.map((e) => e.id));
    return oldEntries.length;
  }

  // ==================== Saved Searches ====================

  async saveSavedSearch(search: SavedSearch): Promise<string> {
    return (await this.savedSearches.add(search)) as any as string;
  }

  async getSavedSearch(id: string): Promise<SavedSearch | undefined> {
    return this.savedSearches.get(id);
  }

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    return this.savedSearches
      .where('[userId+createdAt]')
      .between([userId, 0], [userId, Date.now()])
      .reverse()
      .toArray();
  }

  async getPinnedSavedSearches(userId: string): Promise<SavedSearch[]> {
    const searches = await this.getSavedSearches(userId);
    return searches
      .filter((s) => s.pinnedPosition !== undefined)
      .sort((a, b) => (a.pinnedPosition || 0) - (b.pinnedPosition || 0));
  }

  async updateSavedSearch(
    id: string,
    updates: Partial<SavedSearch>
  ): Promise<void> {
    await this.savedSearches.update(id, updates);
  }

  async deleteSavedSearch(id: string): Promise<void> {
    return this.savedSearches.delete(id);
  }

  async toggleSavedSearchNotification(id: string, enabled: boolean): Promise<void> {
    await this.savedSearches.update(id, { notificationsEnabled: enabled });
  }

  async updateSavedSearchPinnedPosition(
    id: string,
    position: number | undefined
  ): Promise<void> {
    await this.savedSearches.update(id, { pinnedPosition: position });
  }

  // ==================== Search Collections ====================

  async saveSearchCollection(collection: SearchCollection): Promise<string> {
    return (await this.searchCollections.add(collection)) as any as string;
  }

  async getSearchCollection(id: string): Promise<SearchCollection | undefined> {
    return this.searchCollections.get(id);
  }

  async getSearchCollections(userId: string): Promise<SearchCollection[]> {
    return this.searchCollections
      .where('[createdBy+createdAt]')
      .between([userId, 0], [userId, Date.now()])
      .reverse()
      .toArray();
  }

  async addToSearchCollection(collectionId: string, resultIds: string[]): Promise<void> {
    const collection = await this.getSearchCollection(collectionId);
    if (collection) {
      const newIds = Array.from(new Set([...collection.resultIds, ...resultIds]));
      await this.updateSearchCollection(collectionId, { resultIds: newIds });
    }
  }

  async removeFromSearchCollection(collectionId: string, resultIds: string[]): Promise<void> {
    const collection = await this.getSearchCollection(collectionId);
    if (collection) {
      const newIds = collection.resultIds.filter((id) => !resultIds.includes(id));
      await this.updateSearchCollection(collectionId, { resultIds: newIds });
    }
  }

  async updateSearchCollection(
    id: string,
    updates: Partial<SearchCollection>
  ): Promise<void> {
    await this.searchCollections.update(id, updates);
  }

  async deleteSearchCollection(id: string): Promise<void> {
    await this.searchCollections.delete(id);
  }

  // ==================== Search Analytics ====================

  async getOrCreateSearchAnalytics(userId: string): Promise<SearchAnalytics> {
    const existing = await this.searchAnalytics.where('userId').equals(userId).first();
    if (existing) return existing;

    const newAnalytics: SearchAnalytics = {
      id: `analytics_${userId}_${Date.now()}`,
      userId,
      queryCount: 0,
      topQueries: [],
      topResults: [],
      averageResultsPerQuery: 0,
      averageTimePerSearch: 0,
      mostUsedFilters: [],
      preferredSources: [],
      timeRange: { start: Date.now(), end: Date.now() },
    };
    await this.searchAnalytics.add(newAnalytics);
    return newAnalytics;
  }

  async updateSearchAnalytics(
    id: string,
    updates: Partial<SearchAnalytics>
  ): Promise<void> {
    await this.searchAnalytics.update(id, updates);
  }

  async getSearchAnalytics(userId: string): Promise<SearchAnalytics | undefined> {
    return this.searchAnalytics.where('userId').equals(userId).first();
  }

  // ==================== Search Events ====================

  async logSearchEvent(event: SearchEvent): Promise<string> {
    return (await this.searchEvents.add(event)) as any as string;
  }

  async getSearchEvents(userId: string, limit: number = 100): Promise<SearchEvent[]> {
    return this.searchEvents
      .where('[userId+timestamp]')
      .between([userId, 0], [userId, Date.now()])
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getSearchEventsByType(userId: string, type: string): Promise<SearchEvent[]> {
    return this.searchEvents
      .where('type')
      .equals(type)
      .filter((e) => e.userId === userId)
      .toArray();
  }

  async deleteSearchEvent(id: string): Promise<void> {
    await this.searchEvents.delete(id);
  }

  async clearOldSearchEvents(daysOld: number): Promise<number> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const oldEvents = await this.searchEvents
      .where('timestamp')
      .below(cutoffTime)
      .toArray();
    await this.searchEvents.bulkDelete(oldEvents.map((e) => e.id));
    return oldEvents.length;
  }

  // ==================== Utility Functions ====================

  async getAllData(): Promise<{
    searchResults: SearchResult[];
    searchQueries: SearchQuery[];
    searchHistory: SearchHistory[];
    savedSearches: SavedSearch[];
    searchCollections: SearchCollection[];
    searchAnalytics: SearchAnalytics[];
    searchEvents: SearchEvent[];
  }> {
    return {
      searchResults: await this.searchResults.toArray(),
      searchQueries: await this.searchQueries.toArray(),
      searchHistory: await this.searchHistory.toArray(),
      savedSearches: await this.savedSearches.toArray(),
      searchCollections: await this.searchCollections.toArray(),
      searchAnalytics: await this.searchAnalytics.toArray(),
      searchEvents: await this.searchEvents.toArray(),
    };
  }

  async clearAllData(): Promise<void> {
    await this.delete();
    await this.open();
  }

  async getSearchStats(userId: string): Promise<{
    totalSearches: number;
    totalResults: number;
    avgExecutionTime: number;
    favoriteSource: string | null;
  }> {
    const queries = await this.getSearchQueries(userId, 1000);
    const history = await this.getSearchHistory(userId, 1000);

    const totalSearches = queries.length;
    const totalResults = queries.reduce((sum, q) => sum + q.totalResults, 0);
    const avgExecutionTime =
      totalSearches > 0
        ? queries.reduce((sum, q) => sum + q.executionTime, 0) / totalSearches
        : 0;

    const sources = history.flatMap((h) => h.filters.sources);
    const sourceCount = sources.reduce(
      (acc, source) => ({
        ...acc,
        [source]: (acc[source as string] || 0) + 1,
      }),
      {} as Record<string, number>
    );

    const favoriteSource =
      Object.keys(sourceCount).length > 0
        ? Object.entries(sourceCount).sort(([, a], [, b]) => b - a)[0][0]
        : null;

    return {
      totalSearches,
      totalResults,
      avgExecutionTime,
      favoriteSource,
    };
  }
}

export const searchDb = new SearchDatabase();
