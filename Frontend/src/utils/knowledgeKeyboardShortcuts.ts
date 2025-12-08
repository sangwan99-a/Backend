/**
 * Knowledge Base Module Keyboard Shortcuts
 * Navigation and editor shortcuts
 */

import { useEffect } from 'react';
import { useKnowledgeStore, useArticleEditorStore } from '../store/knowledgeStore';

export const useKnowledgeKeyboardShortcuts = () => {
  const knowledgeStore = useKnowledgeStore();
  const editorStore = useArticleEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + .: Focus knowledge search
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        // Focus search input
      }

      // Cmd/Ctrl + N: New article
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        knowledgeStore.setShowTemplateModal(true);
      }

      // Escape: Back to list
      if (e.key === 'Escape' && knowledgeStore.currentArticleId) {
        e.preventDefault();
        knowledgeStore.setCurrentArticleId(null);
      }

      // Editor shortcuts (when in edit mode)
      if (knowledgeStore.editorMode === 'edit') {
        // Cmd/Ctrl + S: Save article
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          // Trigger save
        }

        // Cmd/Ctrl + P: Preview
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
          e.preventDefault();
          knowledgeStore.setEditorMode('preview');
        }

        // Tab: Indent (in editor)
        if (e.key === 'Tab') {
          e.preventDefault();
          const target = e.target as HTMLTextAreaElement;
          if (target.tagName === 'TEXTAREA') {
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newValue = target.value.substring(0, start) + '\t' + target.value.substring(end);
            target.value = newValue;
            target.selectionStart = target.selectionEnd = start + 1;
            editorStore.setContent(newValue);
          }
        }
      }

      // Viewer shortcuts
      if (knowledgeStore.editorMode === 'view' && knowledgeStore.currentArticleId) {
        // E: Edit article
        if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
          const target = e.target as HTMLElement;
          if (!target.matches('input, textarea')) {
            e.preventDefault();
            knowledgeStore.setEditorMode('edit');
          }
        }

        // B: Bookmark article
        if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
          const target = e.target as HTMLElement;
          if (!target.matches('input, textarea')) {
            e.preventDefault();
            // Toggle bookmark
          }
        }

        // T: Toggle table of contents
        if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
          const target = e.target as HTMLElement;
          if (!target.matches('input, textarea')) {
            e.preventDefault();
            knowledgeStore.toggleTableOfContents();
          }
        }

        // C: Toggle comments
        if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
          const target = e.target as HTMLElement;
          if (!target.matches('input, textarea')) {
            e.preventDefault();
            knowledgeStore.toggleShowComments();
          }
        }
      }

      // View mode toggle (anywhere)
      if (e.key === '1' && !e.ctrlKey && !e.metaKey && !knowledgeStore.currentArticleId) {
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea')) {
          e.preventDefault();
          knowledgeStore.setViewMode('list');
        }
      }

      if (e.key === '2' && !e.ctrlKey && !e.metaKey && !knowledgeStore.currentArticleId) {
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea')) {
          e.preventDefault();
          knowledgeStore.setViewMode('grid');
        }
      }

      if (e.key === '3' && !e.ctrlKey && !e.metaKey && !knowledgeStore.currentArticleId) {
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea')) {
          e.preventDefault();
          knowledgeStore.setViewMode('card');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [knowledgeStore, editorStore]);
};

export const KNOWLEDGE_KEYBOARD_SHORTCUTS = [
  { key: 'Cmd/Ctrl + .', action: 'Focus search' },
  { key: 'Cmd/Ctrl + N', action: 'New article' },
  { key: 'Escape', action: 'Back to list' },
  { key: 'Cmd/Ctrl + S', action: 'Save article' },
  { key: 'Cmd/Ctrl + P', action: 'Toggle preview' },
  { key: 'E', action: 'Edit article' },
  { key: 'B', action: 'Bookmark article' },
  { key: 'T', action: 'Toggle table of contents' },
  { key: 'C', action: 'Toggle comments' },
  { key: '1/2/3', action: 'Change view mode' },
];
