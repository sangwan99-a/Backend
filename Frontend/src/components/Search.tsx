/**
 * Advanced Search Module (Main Component)
 * Hybrid search interface with semantic understanding, filters, and AI Q&A
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SearchBox,
  Button,
  Spinner,
  Badge,
  Tooltip,
  TabList,
  Tab,
} from '@fluentui/react-components';
import {
  Search20Regular,
  Filter20Regular,
  Pin20Regular,
  Share20Regular,
  ArrowDownload20Regular,
  SparkleRegular,
} from '@fluentui/react-icons';
import { useSearch, useSearchSuggestions, useSearchHistory, useSavedSearches } from '../hooks/useSearchData';
import { useSearchStore, useSearchBoxStore } from '../store/searchStore';
import '../styles/search.css';

interface SearchProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export const Search: React.FC<SearchProps> = ({ currentUser }) => {
  const [tabValue, setTabValue] = useState<string>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const searchStore = useSearchStore();
  const searchBoxStore = useSearchBoxStore();

  // Debounce search query (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useSearch(
    debouncedQuery,
    searchStore.filters,
    50,
    debouncedQuery.length > 0
  );

  const { data: suggestions } = useSearchSuggestions(
    searchQuery,
    searchQuery.length > 0 && !isLoading
  );

  const { data: history } = useSearchHistory(currentUser.id);
  const { data: savedSearches } = useSavedSearches(currentUser.id);

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
    if (!searchResults?.results) return [];

    let results = [...searchResults.results];

    // Apply sorting
    results.sort((a, b) => {
      let comparison = 0;
      switch (searchStore.sortBy) {
        case 'relevance':
          comparison = b.relevanceScore - a.relevanceScore;
          break;
        case 'recency':
          comparison = b.timestamp - a.timestamp;
          break;
        case 'modified':
          comparison = b.modifiedAt - a.modifiedAt;
          break;
        case 'size':
          comparison = (b.metadata.fileSize || 0) - (a.metadata.fileSize || 0);
          break;
      }

      return searchStore.sortAscending ? -comparison : comparison;
    });

    return results;
  }, [searchResults?.results, searchStore.sortBy, searchStore.sortAscending]);

  const handleSearchChange = useCallback(
    (_event: any, data: any) => {
      const value = data.value;
      setSearchQuery(value);
      searchBoxStore.setValue(value);
      if (value.length > 0) {
        searchBoxStore.setShowSuggestions(true);
      }
    },
    [searchBoxStore]
  );

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.length > 0) {
      // Search will be triggered via useEffect with debouncedQuery
      searchBoxStore.setShowSuggestions(false);
    }
  }, [searchQuery, searchBoxStore]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setSearchQuery(suggestion);
      handleSearchSubmit();
    },
    [handleSearchSubmit]
  );

  const handleSaveSearch = useCallback(() => {
    // Open save search dialog (implement in future)
  }, []);

  return (
    <div className='search-container'>
      {/* Header Section */}
      <div className='search-header'>
        <div className='search-title'>
          <SparkleRegular className='title-icon' />
          <h1>Advanced Search & AI Q&A</h1>
        </div>
        <p className='search-subtitle'>
          Semantic search across all your content with AI-powered insights
        </p>
      </div>

      {/* Main Search Layout */}
      <div className='search-layout'>
        {/* Left: Filters Panel */}
        {searchStore.showFiltersPanel && (
          <div className='search-filters-panel'>
            <div className='filters-header'>
              <Filter20Regular />
              <h3>Filters</h3>
            </div>

            {/* Source Filter */}
            <div className='filter-section'>
              <h4>Sources</h4>
              <div className='filter-options'>
                {['messages', 'documents', 'tasks', 'calendar', 'knowledge'].map((source: string) => (
                  <label key={source} className='filter-checkbox'>
                    <input
                      type='checkbox'
                      checked={searchStore.filters.sources.includes(source as any)}
                      onChange={(e) => {
                        const sources = e.target.checked
                          ? [...searchStore.filters.sources, source as any]
                          : searchStore.filters.sources.filter((s) => s !== (source as any));
                        searchStore.updateFilters({ sources });
                      }}
                    />
                    <span>{source.charAt(0).toUpperCase() + source.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className='filter-section'>
              <h4>Date Range</h4>
              <div className='filter-date-range'>
                <input
                  type='date'
                  onChange={(e) => {
                    searchStore.updateFilters({
                      dateRange: {
                        ...searchStore.filters.dateRange,
                        start: new Date(e.target.value).getTime(),
                      },
                    });
                  }}
                />
                <span>to</span>
                <input
                  type='date'
                  onChange={(e) => {
                    searchStore.updateFilters({
                      dateRange: {
                        ...searchStore.filters.dateRange,
                        end: new Date(e.target.value).getTime(),
                      },
                    });
                  }}
                />
              </div>
            </div>

            {/* File Type Filter */}
            <div className='filter-section'>
              <h4>File Types</h4>
              <div className='filter-options'>
                {['pdf', 'doc', 'xls', 'image', 'video', 'code'].map((type) => (
                  <label key={type} className='filter-checkbox'>
                    <input
                      type='checkbox'
                      onChange={(e) => {
                        const fileTypes = e.target.checked
                          ? [...searchStore.filters.fileTypes, type]
                          : searchStore.filters.fileTypes.filter((t) => t !== type);
                        searchStore.updateFilters({ fileTypes });
                      }}
                    />
                    <span>{type.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className='filter-section'>
              <h4>Sort By</h4>
              <select
                value={searchStore.sortBy}
                onChange={(e) =>
                  searchStore.setSortBy(
                    e.target.value as 'relevance' | 'recency' | 'modified' | 'size'
                  )
                }
              >
                <option value='relevance'>Relevance</option>
                <option value='recency'>Most Recent</option>
                <option value='modified'>Recently Modified</option>
                <option value='size'>File Size</option>
              </select>
              <label className='filter-checkbox'>
                <input
                  type='checkbox'
                  checked={searchStore.sortAscending}
                  onChange={(e) => searchStore.setSortAscending(e.target.checked)}
                />
                <span>Ascending</span>
              </label>
            </div>
          </div>
        )}

        {/* Center: Search Results */}
        <div className='search-main'>
          {/* Search Box */}
          <div className='search-box-container'>
            <SearchBox
              placeholder='Search across all your content... (try "john&#39;s emails about API last week")'
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                } else if (e.key === 'Escape') {
                  searchBoxStore.setShowSuggestions(false);
                }
              }}
              className='search-input-main'
            />

            {/* Toolbar */}
            <div className='search-toolbar'>
              <Tooltip content='Toggle filters panel' positioning='below' relationship='label'>
                <Button
                  icon={<Filter20Regular />}
                  onClick={() => searchStore.toggleShowFilters()}
                  appearance='subtle'
                />
              </Tooltip>

              <Tooltip content='Toggle AI Summary' positioning='below' relationship='label'>
                <Button
                  icon={<SparkleRegular />}
                  onClick={() => searchStore.toggleShowAISummary()}
                  appearance={searchStore.showAISummary ? 'primary' : 'subtle'}
                />
              </Tooltip>

              <Tooltip content='View saved searches' positioning='below' relationship='label'>
                <Button
                  icon={<Pin20Regular />}
                  onClick={handleSaveSearch}
                  appearance='subtle'
                />
              </Tooltip>

              <Tooltip content='Share search' positioning='below' relationship='label'>
                <Button icon={<Share20Regular />} appearance='subtle' />
              </Tooltip>

              <Tooltip content='Export results' positioning='below' relationship='label'>
                <Button icon={<ArrowDownload20Regular />} appearance='subtle' />
              </Tooltip>
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {searchBoxStore.showSuggestions && suggestions && (
            <div className='search-suggestions'>
              <div className='suggestions-section'>
                <h4>Suggestions</h4>
                {suggestions.suggestions.map((suggestion: any) => (
                  <div
                    key={suggestion.id}
                    className='suggestion-item'
                    onClick={() => handleSuggestionClick(suggestion.text)}
                  >
                    <Search20Regular className='suggestion-icon' />
                    <div className='suggestion-content'>
                      <div className='suggestion-text'>{suggestion.text}</div>
                      {suggestion.resultCount && (
                        <span className='suggestion-count'>{suggestion.resultCount} results</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {suggestions.recent.length > 0 && (
                <div className='suggestions-section'>
                  <h4>Recent</h4>
                  {suggestions.recent.map((recent: any) => (
                    <div
                      key={recent.id}
                      className='suggestion-item'
                      onClick={() => handleSuggestionClick(recent.text)}
                    >
                      <div className='suggestion-text'>{recent.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results Section */}
          <div className='search-results-tabs'>
            <TabList selectedValue={tabValue} onTabSelect={(_: any, data: any) => setTabValue(data.value)}>
              <Tab value='search'>Documents</Tab>
              <Tab value='timeline'>Timeline</Tab>
              <Tab value='people'>People</Tab>
              <Tab value='ai'>AI Q&A</Tab>
            </TabList>
          </div>

          {isLoading && (
            <div className='search-loading'>
              <Spinner label='Searching...' />
            </div>
          )}

          {!isLoading && debouncedQuery && filteredResults.length === 0 && (
            <div className='search-empty'>
              <p>No results found for "{debouncedQuery}"</p>
              <p>Try different keywords or adjust your filters</p>
            </div>
          )}

          {!isLoading && debouncedQuery && filteredResults.length > 0 && (
            <div className='search-results'>
              <div className='results-header'>
                <p>
                  Found <Badge>{filteredResults.length}</Badge> results in{' '}
                  {(searchResults?.executionTime || 0).toFixed(0)}ms
                </p>
              </div>

              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className={`search-result-card ${
                    searchStore.selectedResultId === result.id ? 'selected' : ''
                  }`}
                  onClick={() => searchStore.setSelectedResultId(result.id)}
                >
                  <div className='result-header'>
                    <div className='result-title'>{result.title}</div>
                    <Badge className='result-score'>{Math.round(result.relevanceScore)}%</Badge>
                  </div>

                  <div className='result-meta'>
                    <Badge className='source-badge'>{result.source}</Badge>
                    <Badge className='type-badge'>{result.type}</Badge>
                    <span className='result-date'>
                      {new Date(result.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className='result-snippet'>{result.snippet}</p>

                  {result.keywordMatches.length > 0 && (
                    <div className='result-matches'>
                      {result.keywordMatches.slice(0, 3).map((match: any, i: number) => (
                        <Badge key={i} className='match-badge'>
                          {match}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!debouncedQuery && (
            <div className='search-welcome'>
              <h2>Start searching or explore recent searches</h2>
              {history && history.length > 0 && (
                <div className='recent-searches'>
                  <h3>Recent Searches</h3>
                  <div className='recent-list'>
                    {history.slice(0, 5).map((item: any) => (
                      <div
                        key={item.id}
                        className='recent-item'
                        onClick={() => handleSuggestionClick(item.query)}
                      >
                        <Search20Regular />
                        <span>{item.query}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savedSearches && savedSearches.length > 0 && (
                <div className='saved-searches'>
                  <h3>Saved Searches</h3>
                  <div className='saved-list'>
                    {savedSearches.slice(0, 5).map((search: any) => (
                      <div
                        key={search.id}
                        className='saved-item'
                        onClick={() => handleSuggestionClick(search.query)}
                      >
                        <Pin20Regular />
                        <span>{search.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Preview & AI Summary Panel */}
        {searchStore.selectedResultId && (
          <div className='search-details-panel'>
            <div className='details-header'>
              <h3>Details</h3>
              <Button
                icon={<>✕</>}
                onClick={() => searchStore.setSelectedResultId(null)}
                appearance='subtle'
              />
            </div>

            {filteredResults.find((r) => r.id === searchStore.selectedResultId) && (
              <div className='details-content'>
                <div className='detail-section'>
                  <h4>Preview</h4>
                  <div className='preview-area'>
                    {filteredResults
                      .find((r) => r.id === searchStore.selectedResultId)
                      ?.previewUrl && (
                      <img
                        src={
                          filteredResults.find((r) => r.id === searchStore.selectedResultId)
                            ?.previewUrl
                        }
                        alt='preview'
                        className='preview-image'
                      />
                    )}
                  </div>
                </div>

                {searchStore.showAISummary && (
                  <div className='detail-section'>
                    <h4>AI Summary</h4>
                    <p className='ai-summary'>
                      This is a sample summary generated from the document content...
                    </p>
                  </div>
                )}

                <div className='detail-actions'>
                  <Button appearance='primary'>Open</Button>
                  <Button appearance='secondary'>Share</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
