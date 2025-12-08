/**
 * Documents Component - Main file management interface
 * 
 * Features:
 * - 3-pane layout: Folder sidebar | Main file view | Details panel
 * - Grid and List view modes
 * - Search, filter, sort
 * - Multi-select actions (move, delete, star)
 * - File preview
 * - Sharing dialog
 * - Upload zone
 * - Real-time collaboration
 * - Keyboard shortcuts
 */

import React, { useState } from 'react';
import {
  Button,
  Spinner,
  Tab,
  TabList,
  Tooltip,
  Input,
  Select,
} from '@fluentui/react-components';
import {
  ArrowUploadRegular,
  StarRegular,
  StarFilled,
  DeleteRegular,
  ShareRegular,
  ChevronRightRegular,
  GridRegular,
  ListRegular,
  FolderRegular,
  DocumentRegular,
  MoreHorizontalRegular,
} from '@fluentui/react-icons';
import { useDocumentsStore } from '../store/documentsStore';
import { useFiles, useFolder, useSearchFiles, useTrashFile, useStarFile, useDeleteFile } from '../hooks/useDocumentsData';
import { useDocumentsKeyboardShortcuts } from '../utils/documentsKeyboardShortcuts';
import { FilePreviewer } from './FilePreviewer';
import { UploadZone } from './UploadZone';
import { SharingDialog } from './SharingDialog';
import '../styles/documents.css';

interface DocumentsProps {
  currentUser?: { id: string; name: string; email: string };
}

export const Documents: React.FC<DocumentsProps> = ({ currentUser }) => {
  const [uploadZoneOpen, setUploadZoneOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<string | null>(null);
  const [selectedSharingFile, setSelectedSharingFile] = useState<string | null>(null);

  const {
    viewMode,
    currentFolderId,
    selectedFileIds,
    sortBy,
    sortAscending,
    searchQuery,
    filterType,
    setViewMode,
    setCurrentFolder,
    selectFile,
    clearSelection,
    setSortBy,
    setSortAscending,
    setSearchQuery,
    setFilterType,
  } = useDocumentsStore();

  const owner = currentUser?.id || 'default';

  // Queries
  const filesQuery = useFiles(currentFolderId || 'root', true);
  const folderQuery = useFolder(currentFolderId);
  const searchQuery$ = useSearchFiles((searchQuery as string) || undefined, currentFolderId, owner);
  const trashFileMutation = useTrashFile();
  const starFileMutation = useStarFile();
  const deleteFileMutation = useDeleteFile();

  // Get files
  const isLoading = filesQuery.isLoading;
  const files = searchQuery ? searchQuery$.data || [] : filesQuery.data || [];
  const selectedFile = selectedFileIds.length === 1 ? files.find(f => f.id === selectedFileIds[0]) : null;

  // Setup keyboard shortcuts
  useDocumentsKeyboardShortcuts({
    store: useDocumentsStore() as any,
    onUpload: () => setUploadZoneOpen(true),
    onCreateFolder: () => {/* TODO: implement create folder */},
    onDelete: () => {
      if (selectedFileIds.length > 0) {
        selectedFileIds.forEach(id => trashFileMutation.mutate(id));
      }
    },
    onSearch: () => {
      const searchInput = document.querySelector('.documents-toolbar input');
      (searchInput as HTMLInputElement)?.focus();
    },
    onSelectAll: () => {
      files.forEach(f => selectFile(f.id));
    },
    onOpenFile: () => {
      if (selectedFile) {
        setSelectedPreviewFile(selectedFile.id);
        setPreviewOpen(true);
      }
    },
  });

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  // Handle sort change
  const handleSortChange = (newSort: typeof sortBy) => {
    if (sortBy === newSort) {
      setSortAscending(!sortAscending);
    } else {
      setSortBy(newSort);
      setSortAscending(false);
    }
  };

  // Sort files
  const sortedFiles = React.useMemo(() => {
    const sorted = [...files];
    sorted.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'size':
          compareValue = (a.size || 0) - (b.size || 0);
          break;
        case 'modified':
          compareValue = new Date(a.modifiedAt || a.createdAt).getTime() -
            new Date(b.modifiedAt || b.createdAt).getTime();
          break;
        case 'owner':
          compareValue = a.owner.localeCompare(b.owner);
          break;
      }

      return sortAscending ? compareValue : -compareValue;
    });

    return sorted;
  }, [files, sortBy, sortAscending]);

  // Filter files by type
  const filteredFiles = React.useMemo(() => {
    if (!filterType) return sortedFiles;
    return sortedFiles.filter((f) => f.type === filterType);
  }, [sortedFiles, filterType]);

  return (
    <div className="documents-container">
      {/* Sidebar - Folder tree */}
      <div className="documents-sidebar">
        <div className="documents-sidebar-header">
          <h3>My Drive</h3>
          <Tooltip content="Create new folder" relationship="label">
            <Button icon={<FolderRegular />} appearance="subtle" size="small" />
          </Tooltip>
        </div>

        <div className="documents-folder-tree">
          <div
            className={`folder-item ${!currentFolderId || currentFolderId === 'root' ? 'active' : ''}`}
            onClick={() => setCurrentFolder(null)}
          >
            <FolderRegular />
            <span>My Files</span>
          </div>
          <div className="folder-item">
            <StarFilled />
            <span>Starred</span>
          </div>
          <div className="folder-item">
            <DocumentRegular />
            <span>Recent</span>
          </div>
          <div className="folder-item">
            <DeleteRegular />
            <span>Trash</span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="documents-main">
        {/* Toolbar */}
        <div className="documents-toolbar">
          <div className="toolbar-left">
            {folderQuery.data && (
              <div className="breadcrumb">
                <Button appearance="subtle">My Drive</Button>
                <ChevronRightRegular />
                <span>{folderQuery.data.name}</span>
              </div>
            )}
          </div>

          <div className="toolbar-center">
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              contentBefore={<DocumentRegular />}
            />
          </div>

          <div className="toolbar-right">
            <Select value={sortBy} onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}>
              <option value="modified">Modified</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="owner">Owner</option>
            </Select>

            <TabList
              onTabSelect={() => {}}
              selectedValue={viewMode}
              className="view-mode-tabs"
            >
              <Tab
                value="grid"
                onClick={() => handleViewModeChange('grid')}
                icon={<GridRegular />}
              />
              <Tab
                value="list"
                onClick={() => handleViewModeChange('list')}
                icon={<ListRegular />}
              />
            </TabList>

            <Tooltip content="Upload files" relationship="label">
              <Button 
                icon={<ArrowUploadRegular />} 
                appearance="primary"
                onClick={() => setUploadZoneOpen(true)}
              />
            </Tooltip>
          </div>
        </div>

        {/* Files view */}
        <div className={`files-view files-${viewMode}`}>
          {isLoading ? (
            <div className="loading-state">
              <Spinner label="Loading files..." />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="empty-state">
              <DocumentRegular />
              <h3>No files yet</h3>
              <p>Upload or create files to get started</p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="files-grid">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`file-card ${selectedFileIds.includes(file.id) ? 'selected' : ''}`}
                      onClick={() => selectFile(file.id)}
                      onDoubleClick={() => {
                        setSelectedPreviewFile(file.id);
                        setPreviewOpen(true);
                      }}
                    >
                      <div className="file-thumbnail">
                        <DocumentRegular />
                      </div>
                      <div className="file-info">
                        <p className="file-name">{file.name}</p>
                        <p className="file-details">
                          {file.size} bytes • {new Date(file.modifiedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        appearance="subtle"
                        icon={file.starred ? <StarFilled /> : <StarRegular />}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          starFileMutation.mutate(file.id);
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="files-list">
                  <div className="files-list-header">
                    <div className="col-name">Name</div>
                    <div className="col-size">Size</div>
                    <div className="col-modified">Modified</div>
                    <div className="col-owner">Owner</div>
                    <div className="col-actions">Actions</div>
                  </div>
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`files-list-row ${selectedFileIds.includes(file.id) ? 'selected' : ''}`}
                      onClick={() => selectFile(file.id)}
                      onDoubleClick={() => {
                        setSelectedPreviewFile(file.id);
                        setPreviewOpen(true);
                      }}
                    >
                      <div className="col-name">
                        <DocumentRegular />
                        <span>{file.name}</span>
                      </div>
                      <div className="col-size">{file.size} B</div>
                      <div className="col-modified">{new Date(file.modifiedAt).toLocaleDateString()}</div>
                      <div className="col-owner">{file.owner}</div>
                      <div className="col-actions">
                        <Button
                          appearance="subtle"
                          icon={file.starred ? <StarFilled /> : <StarRegular />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            starFileMutation.mutate(file.id);
                          }}
                        />
                        <Button
                          appearance="subtle"
                          icon={<ShareRegular />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSharingFile(file.id);
                            setSharingOpen(true);
                          }}
                        />
                        <Button
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            trashFileMutation.mutate(file.id);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details panel */}
      {selectedFileIds.length > 0 && (
        <div className="documents-details-panel">
          <div className="panel-header">
            <h3>{selectedFileIds.length} selected</h3>
            <Button
              appearance="subtle"
              icon={<DeleteRegular />}
              onClick={clearSelection}
            />
          </div>

          <div className="panel-content">
            {selectedFileIds.length === 1 && (
              <>
                <div className="detail-section">
                  <h4>File Info</h4>
                  <p className="detail-row">
                    <span>Owner:</span>
                    <span>You</span>
                  </p>
                  <p className="detail-row">
                    <span>Created:</span>
                    <span>Today</span>
                  </p>
                </div>

                <div className="detail-section">
                  <h4>Sharing</h4>
                  <Button 
                    appearance="outline"
                    icon={<ShareRegular />}
                    onClick={() => setSharingOpen(true)}
                  >
                    Share
                  </Button>
                </div>

                <div className="detail-section">
                  <h4>Actions</h4>
                  <Button 
                    appearance="subtle"
                    icon={<StarRegular />}
                    onClick={() => selectedFile && starFileMutation.mutate(selectedFile.id)}
                  >
                    Add Star
                  </Button>
                  <Button 
                    appearance="subtle"
                    icon={<DeleteRegular />}
                    onClick={() => selectedFile && trashFileMutation.mutate(selectedFile.id)}
                  >
                    Move to Trash
                  </Button>
                </div>
              </>
            )}

            {selectedFileIds.length > 1 && (
              <div className="detail-section">
                <h4>Bulk Actions</h4>
                <Button 
                  appearance="subtle"
                  icon={<StarRegular />}
                >
                  Star All
                </Button>
                <Button 
                  appearance="subtle"
                  icon={<ShareRegular />}
                  onClick={() => setSharingOpen(true)}
                >
                  Share All
                </Button>
                <Button 
                  appearance="subtle"
                  icon={<DeleteRegular />}
                  onClick={() => selectedFileIds.forEach(id => trashFileMutation.mutate(id))}
                >
                  Delete All
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <FilePreviewer
          file={selectedFile}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          onNavigatePrevious={() => {
            const currentIndex = files.findIndex(f => f.id === selectedFile.id);
            if (currentIndex > 0) {
              selectFile(files[currentIndex - 1].id);
            }
          }}
          onNavigateNext={() => {
            const currentIndex = files.findIndex(f => f.id === selectedFile.id);
            if (currentIndex < files.length - 1) {
              selectFile(files[currentIndex + 1].id);
            }
          }}
        />
      )}

      {/* Upload Zone Dialog */}
      <UploadZone
        folderId={currentFolderId || 'root'}
        isOpen={uploadZoneOpen}
        onClose={() => setUploadZoneOpen(false)}
        onUploadComplete={() => {
          filesQuery.refetch();
        }}
      />

      {/* Sharing Dialog */}
      {selectedFile && (
        <SharingDialog
          file={selectedFile}
          isOpen={sharingOpen}
          onClose={() => setSharingOpen(false)}
        />
      )}
    </div>
  );
};

export default Documents;
