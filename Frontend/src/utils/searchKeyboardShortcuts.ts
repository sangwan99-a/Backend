/**
 * Search Module Keyboard Shortcuts
 * Navigation and quick actions for search interface
 */

import { useEffect } from 'react';
import { useSearchStore, useSearchBoxStore } from '../store/searchStore';

export const useSearchKeyboardShortcuts = () => {
  const searchStore = useSearchStore();
  const searchBoxStore = useSearchBoxStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Focus search box
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchBoxStore.setFocused(true);
      }

      // /: Focus search box
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea')) {
          e.preventDefault();
          searchBoxStore.setFocused(true);
        }
      }

      // Escape: Clear focus and close suggestions
      if (e.key === 'Escape') {
        searchBoxStore.setShowSuggestions(false);
        searchBoxStore.setFocused(false);
      }

      // ArrowUp/ArrowDown: Navigate suggestions
      if (
        (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
        searchBoxStore.showSuggestions
      ) {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        const maxIndex = searchBoxStore.suggestions.length - 1;
        const newIndex = Math.max(
          0,
          Math.min(maxIndex, searchStore.highlightedSuggestionIndex + direction)
        );
        searchStore.setHighlightedSuggestion(newIndex);
      }

      // Enter: Submit search
      if (e.key === 'Enter' && searchBoxStore.isFocused) {
        e.preventDefault();
        searchBoxStore.setShowSuggestions(false);
      }

      // Ctrl/Cmd + F: Toggle filters
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchStore.toggleShowFilters();
      }

      // Ctrl/Cmd + S: Save search
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Trigger save search dialog
      }

      // Ctrl/Cmd + E: Export results
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        // Trigger export dialog
      }

      // Ctrl/Cmd + A: Select all results
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !searchBoxStore.isFocused) {
        e.preventDefault();
        // Select all results
      }

      // Delete/Backspace: Deselect
      if ((e.key === 'Delete' || e.key === 'Backspace') && searchStore.selectedResults.length > 0) {
        e.preventDefault();
        searchStore.clearSelectedResults();
      }

      // V: Toggle view mode
      if (e.key === 'v' && !searchBoxStore.isFocused) {
        e.preventDefault();
        const modes: ('grid' | 'list' | 'timeline' | 'map')[] = ['grid', 'list', 'timeline', 'map'];
        const currentIndex = modes.indexOf(searchStore.viewMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        searchStore.setViewMode(nextMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchStore, searchBoxStore]);
};

export const SEARCH_KEYBOARD_SHORTCUTS = [
  { key: 'Cmd/Ctrl + K', action: 'Focus search' },
  { key: '/', action: 'Focus search' },
  { key: 'Escape', action: 'Close suggestions' },
  { key: '↑↓', action: 'Navigate suggestions' },
  { key: 'Enter', action: 'Submit search' },
  { key: 'Cmd/Ctrl + F', action: 'Toggle filters' },
  { key: 'Cmd/Ctrl + S', action: 'Save search' },
  { key: 'Cmd/Ctrl + E', action: 'Export results' },
  { key: 'V', action: 'Change view mode' },
  { key: 'Delete', action: 'Deselect all' },
];
