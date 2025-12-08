/**
 * Documents Store - Zustand UI state management
 * 
 * State:
 * - viewMode: 'grid' | 'list'
 * - currentFolderId: Current folder being viewed
 * - selectedFileIds: Multi-select file IDs
 * - sortBy: 'name' | 'size' | 'modified' | 'owner'
 * - sortAscending: Sort direction
 * - searchQuery: Active search query
 * - filterType: Filter by file type (or null for all)
 * - previewOpen: Preview panel visible
 * - sharingDialogOpen: Sharing dialog visible
 * - uploadInProgress: Active uploads
 */

import { create } from 'zustand';

export type FilesViewMode = 'grid' | 'list';
export type FilesSortBy = 'name' | 'size' | 'modified' | 'owner';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface DocumentsStore {
  // View state
  viewMode: FilesViewMode;
  currentFolderId: string | null;
  selectedFileId: string | null;
  selectedFileIds: string[];
  
  // Filter & sort state
  sortBy: FilesSortBy;
  sortAscending: boolean;
  searchQuery: string;
  filterType: string | null; // File type filter
  
  // UI state
  previewOpen: boolean;
  previewFileId: string | null;
  sharingDialogOpen: boolean;
  sharingFileId: string | null;
  uploadInProgress: UploadProgress[];
  
  // Actions
  setViewMode: (mode: FilesViewMode) => void;
  setCurrentFolder: (folderId: string | null) => void;
  selectFile: (fileId: string) => void;
  deselectFile: (fileId: string) => void;
  toggleFileSelection: (fileId: string) => void;
  clearSelection: () => void;
  setSortBy: (sortBy: FilesSortBy) => void;
  setSortAscending: (ascending: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string | null) => void;
  openPreview: (fileId: string) => void;
  closePreview: () => void;
  openSharingDialog: (fileId: string) => void;
  closeSharingDialog: () => void;
  addUpload: (upload: UploadProgress) => void;
  updateUpload: (fileId: string, progress: Partial<UploadProgress>) => void;
  removeUpload: (fileId: string) => void;
  clearUploads: () => void;
}

export const useDocumentsStore = create<DocumentsStore>((set) => ({
  // Initial state
  viewMode: 'grid',
  currentFolderId: null,
  selectedFileId: null,
  selectedFileIds: [],
  sortBy: 'modified',
  sortAscending: false,
  searchQuery: '',
  filterType: null,
  previewOpen: false,
  previewFileId: null,
  sharingDialogOpen: false,
  sharingFileId: null,
  uploadInProgress: [],

  // View actions
  setViewMode: (mode: FilesViewMode) => {
    set({ viewMode: mode });
  },

  setCurrentFolder: (folderId: string | null) => {
    set({ currentFolderId: folderId });
  },

  selectFile: (fileId: string) => {
    set((state) => ({
      selectedFileId: fileId,
      selectedFileIds: [fileId],
    }));
  },

  deselectFile: (fileId: string) => {
    set((state) => ({
      selectedFileIds: state.selectedFileIds.filter((id) => id !== fileId),
      selectedFileId: state.selectedFileId === fileId ? null : state.selectedFileId,
    }));
  },

  toggleFileSelection: (fileId: string) => {
    set((state) => {
      const isSelected = state.selectedFileIds.includes(fileId);
      return {
        selectedFileIds: isSelected
          ? state.selectedFileIds.filter((id) => id !== fileId)
          : [...state.selectedFileIds, fileId],
        selectedFileId: !isSelected ? fileId : state.selectedFileId,
      };
    });
  },

  clearSelection: () => {
    set({ selectedFileId: null, selectedFileIds: [] });
  },

  // Sort & filter actions
  setSortBy: (sortBy: FilesSortBy) => {
    set({ sortBy });
  },

  setSortAscending: (ascending: boolean) => {
    set({ sortAscending: ascending });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilterType: (type: string | null) => {
    set({ filterType: type });
  },

  // Dialog actions
  openPreview: (fileId: string) => {
    set({ previewOpen: true, previewFileId: fileId });
  },

  closePreview: () => {
    set({ previewOpen: false, previewFileId: null });
  },

  openSharingDialog: (fileId: string) => {
    set({ sharingDialogOpen: true, sharingFileId: fileId });
  },

  closeSharingDialog: () => {
    set({ sharingDialogOpen: false, sharingFileId: null });
  },

  // Upload actions
  addUpload: (upload: UploadProgress) => {
    set((state) => ({
      uploadInProgress: [...state.uploadInProgress, upload],
    }));
  },

  updateUpload: (fileId: string, progress: Partial<UploadProgress>) => {
    set((state) => ({
      uploadInProgress: state.uploadInProgress.map((upload) =>
        upload.fileId === fileId ? { ...upload, ...progress } : upload
      ),
    }));
  },

  removeUpload: (fileId: string) => {
    set((state) => ({
      uploadInProgress: state.uploadInProgress.filter((upload) => upload.fileId !== fileId),
    }));
  },

  clearUploads: () => {
    set({ uploadInProgress: [] });
  },
}));
