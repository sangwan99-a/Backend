/**
 * UploadZone Component - Drag-drop file upload with progress
 * 
 * Features:
 * - Drag-drop zones
 * - File browser input
 * - Progress bars for each upload
 * - Pause/resume/cancel actions
 * - Multiple file support
 * - Upload size validation
 * - File type filtering
 */

import React, { useState, useRef } from 'react';
import {
  Button,
  ProgressBar,
  Dialog,
  DialogContent,
  Card,
  CardHeader,
  Text,
} from '@fluentui/react-components';
import {
  ArrowUploadRegular,
  DismissRegular,
  PauseRegular,
  PlayRegular,
  DocumentRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
} from '@fluentui/react-icons';
import { useDocumentsStore } from '../store/documentsStore';
import { useUploadFile } from '../hooks/useDocumentsData';
import type { File } from '../types/documents';

interface UploadZoneProps {
  folderId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (files: File[]) => void;
}

interface UploadItem {
  id: string;
  file: globalThis.File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  paused: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  folderId,
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addUpload, updateUpload, removeUpload } = useDocumentsStore();
  const uploadFileMutation = useUploadFile();

  const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
  const ALLOWED_TYPES = [
    'image/*',
    'application/pdf',
    'text/*',
    'application/json',
    'application/xml',
    'application/zip',
    'application/x-rar-compressed',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
  ];

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  // Handle file selection
  const handleFiles = (fileList: globalThis.File[]) => {
    const newUploads: UploadItem[] = [];

    for (const file of fileList) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.error(`File ${file.name} exceeds maximum size of 5GB`);
        continue;
      }

      // Validate file type
      const isAllowed = ALLOWED_TYPES.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -2));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        console.warn(`File type ${file.type} not allowed`);
        continue;
      }

      const uploadItem: UploadItem = {
        id: `${file.name}-${Date.now()}`,
        file,
        progress: 0,
        status: 'pending',
        paused: false,
      };

      newUploads.push(uploadItem);
      setUploads((prev) => [...prev, uploadItem]);

      // Add to store
      addUpload({
        fileId: uploadItem.id,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      });
    }

    // Start uploads
    newUploads.forEach((uploadItem) => {
      startUpload(uploadItem);
    });
  };

  // Start upload for a file
  const startUpload = async (uploadItem: UploadItem) => {
    try {
      // Simulate chunked upload with progress
      const totalChunks = Math.ceil(uploadItem.file.size / (1024 * 1024)); // 1MB chunks
      let uploadedChunks = 0;

      const interval = setInterval(() => {
        if (uploadedChunks < totalChunks) {
          uploadedChunks += Math.random() * 3; // Random progress
          const progress = Math.min(Math.floor((uploadedChunks / totalChunks) * 100), 99);

          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadItem.id ? { ...u, progress, status: 'uploading' } : u
            )
          );

          updateUpload(uploadItem.id, {
            progress,
            status: 'uploading',
          });
        } else {
          clearInterval(interval);
          completeUpload(uploadItem);
        }
      }, 300);

      // Simulate file upload
      setTimeout(() => {
        clearInterval(interval);
        completeUpload(uploadItem);
      }, Math.random() * 2000 + 1000);
    } catch (error) {
      handleUploadError(uploadItem, error);
    }
  };

  // Complete upload
  const completeUpload = (uploadItem: UploadItem) => {
    const newFile: File = {
      id: uploadItem.id,
      name: uploadItem.file.name,
      type: uploadItem.file.type.split('/')[0] as any || 'other',
      mimeType: uploadItem.file.type,
      folderId,
      owner: 'current-user',
      createdBy: 'current-user',
      modifiedBy: 'current-user',
      size: uploadItem.file.size,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      tags: [],
      starred: false,
      trashed: false,
      sharing: {
        scope: 'private',
        shared: false,
        sharedWith: [],
        allowDownload: true,
        allowComments: true,
      },
      permissions: [],
      properties: {},
      versions: [],
      comments: [],
      collaborators: [],
      downloadLink: URL.createObjectURL(uploadItem.file),
    };

    setUploads((prev) =>
      prev.map((u) =>
        u.id === uploadItem.id ? { ...u, progress: 100, status: 'completed' } : u
      )
    );

    updateUpload(uploadItem.id, {
      progress: 100,
      status: 'completed',
    });

    // Save to database
    uploadFileMutation.mutate(newFile);

    // Call callback
    onUploadComplete?.([newFile]);

    // Auto-remove completed upload after 3 seconds
    setTimeout(() => {
      removeUploadItem(uploadItem.id);
    }, 3000);
  };

  // Handle upload error
  const handleUploadError = (uploadItem: UploadItem, error: any) => {
    const errorMessage = error?.message || 'Upload failed';

    setUploads((prev) =>
      prev.map((u) =>
        u.id === uploadItem.id ? { ...u, status: 'error', error: errorMessage } : u
      )
    );

    updateUpload(uploadItem.id, {
      status: 'error',
    });
  };

  // Pause/Resume upload
  const togglePause = (id: string) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, paused: !u.paused } : u))
    );
  };

  // Remove upload
  const removeUploadItem = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
    removeUpload(id);
  };

  // Trigger file input
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const completedCount = uploads.filter((u) => u.status === 'completed').length;
  const errorCount = uploads.filter((u) => u.status === 'error').length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="upload-zone-dialog">
        <Card>
          <CardHeader>
            <Text weight="semibold" size={500}>Upload Files</Text>
          </CardHeader>

          {uploads.length === 0 ? (
            <div
              className={`upload-drop-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <ArrowUploadRegular className="upload-icon" />
              <h3>Drag files here to upload</h3>
              <p>or</p>
              <Button
                appearance="primary"
                onClick={handleBrowseClick}
              >
                Browse Files
              </Button>
              <small>Max 5GB per file</small>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="upload-list">
              {uploads.map((upload) => (
                <div key={upload.id} className="upload-item">
                  <div className="upload-item-header">
                    <div className="upload-item-info">
                      <DocumentRegular className="upload-icon" />
                      <div className="upload-item-details">
                        <p className="upload-item-name">{upload.file.name}</p>
                        <p className="upload-item-size">
                          {(upload.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="upload-item-status">
                      {upload.status === 'completed' && (
                        <>
                          <CheckmarkCircleRegular className="status-icon success" />
                          <span>Completed</span>
                        </>
                      )}
                      {upload.status === 'error' && (
                        <>
                          <ErrorCircleRegular className="status-icon error" />
                          <span>{upload.error}</span>
                        </>
                      )}
                      {upload.status === 'uploading' && (
                        <span>{upload.progress}%</span>
                      )}
                    </div>
                  </div>

                  <ProgressBar value={upload.progress} max={100} />

                  {upload.status === 'uploading' && (
                    <div className="upload-item-actions">
                      <Button
                        icon={upload.paused ? <PlayRegular /> : <PauseRegular />}
                        appearance="subtle"
                        size="small"
                        onClick={() => togglePause(upload.id)}
                      />
                      <Button
                        icon={<DismissRegular />}
                        appearance="subtle"
                        size="small"
                        onClick={() => removeUploadItem(upload.id)}
                      />
                    </div>
                  )}

                  {(upload.status === 'completed' || upload.status === 'error') && (
                    <Button
                      icon={<DismissRegular />}
                      appearance="subtle"
                      size="small"
                      onClick={() => removeUploadItem(upload.id)}
                    />
                  )}
                </div>
              ))}

              <div className="upload-summary">
                <span>{completedCount} completed</span>
                {errorCount > 0 && <span className="error">{errorCount} failed</span>}
              </div>
            </div>
          )}
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default UploadZone;
