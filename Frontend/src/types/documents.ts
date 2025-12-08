/**
 * Documents & File Management Type Definitions
 * 
 * Comprehensive types for document collaboration, file sharing, and version control
 */

/**
 * File types for icons and handling
 */
export type FileType = 
  | 'folder'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'code'
  | 'text'
  | 'archive'
  | 'other';

/**
 * Permission levels for file sharing
 */
export type FilePermission = 'view' | 'comment' | 'edit' | 'admin';

/**
 * Share scope (who can access)
 */
export type ShareScope = 'private' | 'user' | 'team' | 'organization' | 'public';

/**
 * View mode for file explorer
 */
export type FilesViewMode = 'grid' | 'list';

/**
 * Sort options for files
 */
export type FileSortBy = 'name' | 'modified' | 'size' | 'type' | 'owner';

/**
 * File metadata and properties
 */
export interface File {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  folderId: string;
  parentFolderId?: string;
  owner: string;
  size: number; // Bytes
  createdAt: string; // ISO string
  modifiedAt: string; // ISO string
  createdBy: string;
  modifiedBy: string;
  description?: string;
  tags: string[];
  starred: boolean;
  trashed: boolean;
  trashedAt?: string;
  webViewLink?: string;
  webEditLink?: string;
  downloadLink?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  properties: FileProperties;
  sharing: FileSharingInfo;
  permissions: FilePermission[];
  versions: FileVersion[];
  comments: FileComment[];
  collaborators: string[]; // User IDs currently editing
  lastOpenedAt?: string;
  lastOpenedBy?: string;
}

/**
 * File-specific properties
 */
export interface FileProperties {
  // Images
  width?: number;
  height?: number;
  
  // Documents
  pageCount?: number;
  wordCount?: number;
  language?: string;
  
  // Videos
  duration?: number; // Seconds
  fps?: number;
  codec?: string;
  
  // Spreadsheets
  sheetCount?: number;
  rowCount?: number;
  columnCount?: number;
  
  // Custom
  [key: string]: any;
}

/**
 * File version for history tracking
 */
export interface FileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string; // ISO string
  createdBy: string;
  changesSummary: string;
  downloadUrl: string;
  isCurrentVersion: boolean;
}

/**
 * Folder for organizing files
 */
export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string;
  owner: string;
  createdAt: string; // ISO string
  modifiedAt: string; // ISO string
  createdBy: string;
  fileCount: number;
  folderCount: number;
  size: number; // Total bytes
  sharing: FileSharingInfo;
  permissions: FilePermission[];
  starred: boolean;
  trashed: boolean;
}

/**
 * File sharing configuration
 */
export interface FileSharingInfo {
  scope: ShareScope;
  shared: boolean;
  sharedAt?: string;
  sharedBy?: string;
  publicLink?: string;
  password?: string;
  expiresAt?: string; // ISO string
  allowDownload: boolean;
  allowComments: boolean;
  sharedWith: ShareUser[];
}

/**
 * User with shared file access
 */
export interface ShareUser {
  userId: string;
  userEmail: string;
  displayName: string;
  permission: FilePermission;
  sharedAt: string; // ISO string
  sharedBy: string;
  acceptedAt?: string; // ISO string
}

/**
 * File comment for discussions
 */
export interface FileComment {
  id: string;
  fileId: string;
  authorId: string;
  authorEmail: string;
  displayName: string;
  content: string;
  mentions: string[]; // User IDs
  replies: FileCommentReply[];
  attachments: string[]; // File IDs
  createdAt: string; // ISO string
  updatedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  position?: {
    // For inline comments (character position for text, coordinates for images)
    offset?: number;
    page?: number;
    x?: number;
    y?: number;
  };
}

/**
 * Reply to file comment
 */
export interface FileCommentReply {
  id: string;
  commentId: string;
  authorId: string;
  authorEmail: string;
  displayName: string;
  content: string;
  mentions: string[];
  createdAt: string; // ISO string
  updatedAt: string;
}

/**
 * Real-time collaboration state
 */
export interface CollaborationSession {
  fileId: string;
  userId: string;
  userEmail: string;
  displayName: string;
  color: string;
  action: 'viewing' | 'editing' | 'commenting';
  cursorPosition?: number;
  lastSeen: string; // ISO string
  sessionStart: string; // ISO string
}

/**
 * Document activity log entry
 */
export interface FileActivity {
  id: string;
  fileId: string;
  userId: string;
  action: 'created' | 'modified' | 'deleted' | 'shared' | 'commented' | 'viewed' | 'restored';
  details: Record<string, any>;
  timestamp: string; // ISO string
}

/**
 * Search result for files
 */
export interface FileSearchResult {
  files: File[];
  folders: Folder[];
  total: number;
  query: string;
  searchedAt: string; // ISO string
}

/**
 * File preview configuration
 */
export interface FilePreviewConfig {
  fileId: string;
  type: FileType;
  url: string;
  width?: number;
  height?: number;
  pages?: number;
  currentPage?: number;
  zoomLevel?: number;
  canEdit: boolean;
  canComment: boolean;
  canDownload: boolean;
}

/**
 * Upload session for large files
 */
export interface UploadSession {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  folderId: string;
  createdAt: string; // ISO string
  startedAt?: string;
  completedAt?: string;
  error?: string;
  chunks: UploadChunk[];
}

/**
 * Upload chunk for resumable uploads
 */
export interface UploadChunk {
  id: string;
  uploadSessionId: string;
  chunkNumber: number;
  chunkSize: number;
  uploadedBytes: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

/**
 * Document template
 */
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'personal' | 'legal' | 'marketing' | 'other';
  type: FileType;
  icon: string;
  preview?: string;
  content?: string;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Template field for fillable templates
 */
export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'email' | 'choice' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
}

/**
 * Files module UI state
 */
export interface FilesUIState {
  viewMode: FilesViewMode;
  currentFolderId?: string;
  selectedFileId?: string;
  selectedFileIds: string[]; // For bulk operations
  sortBy: FileSortBy;
  sortAscending: boolean;
  searchQuery: string;
  searchOpen: boolean;
  previewOpen: boolean;
  sharingDialogOpen: boolean;
  uploadInProgress: UploadSession[];
  sidebarCollapsed: boolean;
  showHidden: boolean;
  filterType?: FileType;
  showTrashed: boolean;
}

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  id: string;
  name: string;
  icon?: string;
}

/**
 * File drag state for move operations
 */
export interface FileDragState {
  draggedFileId: string;
  sourceFolder: string;
  targetFolder?: string;
  isDropAllowed: boolean;
}

/**
 * API request/response types
 */
export interface CreateFolderRequest {
  name: string;
  parentFolderId?: string;
  description?: string;
}

export interface MovFileRequest {
  fileId: string;
  targetFolderId: string;
}

export interface BulkMoveFilesRequest {
  fileIds: string[];
  targetFolderId: string;
}

export interface ShareFileRequest {
  fileId: string;
  userId: string;
  permission: FilePermission;
  message?: string;
}

export interface RestoreFileRequest {
  fileId: string;
  targetFolderId?: string;
}

export interface RenameFileRequest {
  fileId: string;
  newName: string;
}
