/**
 * Knowledge Base Module Zustand Store
 * Manages UI state for knowledge base interface
 */

import { create } from 'zustand';
import { KnowledgeUIState, ArticleEditorState, EditorMode } from '../types/knowledge';

interface KnowledgeStore extends KnowledgeUIState {
  // Navigation & Views
  setCurrentArticleId: (id: string | null) => void;
  setCurrentCategoryId: (id: string | null) => void;
  setViewMode: (mode: 'list' | 'grid' | 'card') => void;

  // Editor
  setEditorMode: (mode: EditorMode) => void;
  toggleTableOfContents: () => void;
  setShowTableOfContents: (show: boolean) => void;
  setShowRelatedArticles: (show: boolean) => void;
  setShowComments: (show: boolean) => void;
  toggleShowComments: () => void;

  // Search & Filter
  setSearchQuery: (query: string) => void;
  setSelectedCategoryIds: (ids: string[]) => void;
  toggleCategorySelection: (id: string) => void;

  // Comments
  setExpandedComments: (ids: string[]) => void;
  toggleExpandedComment: (id: string) => void;

  // Templates & Dialogs
  setSelectedTemplate: (id: string | undefined) => void;
  toggleTemplateModal: () => void;
  setShowTemplateModal: (show: boolean) => void;
  toggleCollectionModal: () => void;
  setShowCollectionModal: (show: boolean) => void;

  // Display
  toggleReadingProgress: () => void;
  setReadingProgressVisible: (visible: boolean) => void;

  // Reset
  reset: () => void;
}

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  currentArticleId: null,
  currentCategoryId: null,
  editorMode: 'view',
  searchQuery: '',
  selectedCategoryIds: [],
  viewMode: 'list',
  showTableOfContents: true,
  showRelatedArticles: true,
  showComments: true,
  expandedComments: [],
  selectedTemplate: undefined,
  showTemplateModal: false,
  showCollectionModal: false,
  readingProgressVisible: false,

  setCurrentArticleId: (id) => set({ currentArticleId: id }),

  setCurrentCategoryId: (id) => set({ currentCategoryId: id }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setEditorMode: (mode) => set({ editorMode: mode }),

  toggleTableOfContents: () =>
    set((state) => ({
      showTableOfContents: !state.showTableOfContents,
    })),

  setShowTableOfContents: (show) => set({ showTableOfContents: show }),

  setShowRelatedArticles: (show) => set({ showRelatedArticles: show }),

  setShowComments: (show) => set({ showComments: show }),

  toggleShowComments: () =>
    set((state) => ({
      showComments: !state.showComments,
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCategoryIds: (ids) => set({ selectedCategoryIds: ids }),

  toggleCategorySelection: (id) =>
    set((state) => ({
      selectedCategoryIds: state.selectedCategoryIds.includes(id)
        ? state.selectedCategoryIds.filter((cid) => cid !== id)
        : [...state.selectedCategoryIds, id],
    })),

  setExpandedComments: (ids) => set({ expandedComments: ids }),

  toggleExpandedComment: (id) =>
    set((state) => ({
      expandedComments: state.expandedComments.includes(id)
        ? state.expandedComments.filter((cid) => cid !== id)
        : [...state.expandedComments, id],
    })),

  setSelectedTemplate: (id) => set({ selectedTemplate: id }),

  toggleTemplateModal: () =>
    set((state) => ({
      showTemplateModal: !state.showTemplateModal,
    })),

  setShowTemplateModal: (show) => set({ showTemplateModal: show }),

  toggleCollectionModal: () =>
    set((state) => ({
      showCollectionModal: !state.showCollectionModal,
    })),

  setShowCollectionModal: (show) => set({ showCollectionModal: show }),

  toggleReadingProgress: () =>
    set((state) => ({
      readingProgressVisible: !state.readingProgressVisible,
    })),

  setReadingProgressVisible: (visible) => set({ readingProgressVisible: visible }),

  reset: () =>
    set({
      currentArticleId: null,
      currentCategoryId: null,
      editorMode: 'view',
      searchQuery: '',
      selectedCategoryIds: [],
      viewMode: 'list',
      showTableOfContents: true,
      showRelatedArticles: true,
      showComments: true,
      expandedComments: [],
      selectedTemplate: undefined,
      showTemplateModal: false,
      showCollectionModal: false,
      readingProgressVisible: false,
    }),
}));

/**
 * Article Editor State Store
 */
interface ArticleEditorStore extends ArticleEditorState {
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setSummary: (summary: string) => void;
  setCategoryId: (id: string) => void;
  setSubcategoryIds: (ids: string[]) => void;
  setTags: (tags: string[]) => void;
  setStatus: (status: 'draft' | 'published' | 'archived' | 'review') => void;
  setVisibility: (visibility: 'private' | 'team' | 'organization' | 'public') => void;
  setDifficulty: (difficulty: 'beginner' | 'intermediate' | 'advanced') => void;
  setDirty: (dirty: boolean) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  togglePreview: () => void;
  setShowPreview: (show: boolean) => void;
  reset: () => void;
}

export const useArticleEditorStore = create<ArticleEditorStore>((set) => ({
  title: '',
  content: '',
  summary: '',
  categoryId: '',
  subcategoryIds: [],
  tags: [],
  status: 'draft',
  visibility: 'private',
  difficulty: 'beginner',
  isDirty: false,
  autoSaveEnabled: true,
  showPreview: false,

  setTitle: (title) => set({ title, isDirty: true }),

  setContent: (content) => set({ content, isDirty: true }),

  setSummary: (summary) => set({ summary, isDirty: true }),

  setCategoryId: (id) => set({ categoryId: id, isDirty: true }),

  setSubcategoryIds: (ids) => set({ subcategoryIds: ids, isDirty: true }),

  setTags: (tags) => set({ tags, isDirty: true }),

  setStatus: (status) => set({ status, isDirty: true }),

  setVisibility: (visibility) => set({ visibility, isDirty: true }),

  setDifficulty: (difficulty) => set({ difficulty, isDirty: true }),

  setDirty: (dirty) => set({ isDirty: dirty }),

  setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),

  togglePreview: () =>
    set((state) => ({
      showPreview: !state.showPreview,
    })),

  setShowPreview: (show) => set({ showPreview: show }),

  reset: () =>
    set({
      title: '',
      content: '',
      summary: '',
      categoryId: '',
      subcategoryIds: [],
      tags: [],
      status: 'draft',
      visibility: 'private',
      difficulty: 'beginner',
      isDirty: false,
      autoSaveEnabled: true,
      showPreview: false,
    }),
}));
