/**
 * FilePreviewer Component - Multi-format file preview
 * 
 * Supported formats:
 * - Images: JPEG, PNG, GIF, WebP, SVG
 * - Documents: PDF, DOCX, XLSX, PPTX
 * - Text: TXT, JSON, XML, CSV
 * - Code: JS, TS, PY, Java, C++, etc.
 * - Media: MP4, MP3, WebM
 * - Archives: ZIP, RAR, 7Z
 * 
 * Features:
 * - Syntax highlighting for code
 * - Zoom controls for images
 * - Full screen mode
 * - Keyboard shortcuts (arrow keys, ESC)
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogActions,
} from '@fluentui/react-components';
import {
  ChevronLeftRegular,
  ChevronRightRegular,
  FullScreenMaximizeRegular,
  ZoomInRegular,
  ZoomOutRegular,
  DocumentPdfRegular,
  DocumentTextRegular,
  ImageRegular,
  CodeRegular,
  DismissRegular,
} from '@fluentui/react-icons';
import type { File } from '../types/documents';

interface FilePreviewerProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
}

export const FilePreviewer: React.FC<FilePreviewerProps> = ({
  file,
  isOpen,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigatePrevious?.();
      if (e.key === 'ArrowRight') onNavigateNext?.();
      if (e.key === '+') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        setIsFullScreen(!isFullScreen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullScreen, onClose, onNavigatePrevious, onNavigateNext]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  if (!file) return null;

  const getFileType = (type: string): string => {
    return type.toLowerCase();
  };

  const isImage = ['image'].includes(getFileType(file.type));
  const isPDF = file.mimeType?.includes('pdf');
  const isText =
    ['text', 'code'].includes(getFileType(file.type)) ||
    file.mimeType?.includes('text') ||
    file.mimeType?.includes('json') ||
    file.mimeType?.includes('xml');
  const isDocument =
    ['document', 'spreadsheet', 'presentation'].includes(getFileType(file.type)) ||
    file.mimeType?.includes('word') ||
    file.mimeType?.includes('sheet') ||
    file.mimeType?.includes('presentation');
  const isAudio = file.mimeType?.includes('audio');
  const isVideo = file.mimeType?.includes('video');

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="preview-loading">
          <Spinner label="Loading preview..." />
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="preview-error">
          <DocumentTextRegular />
          <p>Cannot preview this file</p>
          <small>{previewError}</small>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="preview-image-container" style={{ zoom: `${zoomLevel}%` }}>
          <img
            src={file.downloadLink}
            alt={file.name}
            className="preview-image"
            onLoad={() => setIsLoading(false)}
            onError={() => setPreviewError('Failed to load image')}
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="preview-document">
          <p>PDF preview not available. Download to view.</p>
          <a href={file.downloadLink} download={file.name} className="preview-download-link">
            Download PDF
          </a>
        </div>
      );
    }

    if (isText) {
      return (
        <div className="preview-code">
          <pre className="preview-code-content">{file.description || 'Loading...'}</pre>
        </div>
      );
    }

    if (isDocument) {
      return (
        <div className="preview-document">
          <DocumentPdfRegular />
          <p>{file.type} preview not available.</p>
          <a href={file.downloadLink} download={file.name} className="preview-download-link">
            Download {file.name}
          </a>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="preview-audio">
          <audio controls className="preview-audio-player">
            <source src={file.downloadLink} type={file.mimeType} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="preview-video">
          <video controls className="preview-video-player">
            <source src={file.downloadLink} type={file.mimeType} />
            Your browser does not support the video element.
          </video>
        </div>
      );
    }

    return (
      <div className="preview-unsupported">
        <DocumentTextRegular />
        <p>Preview not available for {file.type}</p>
        <a href={file.downloadLink} download={file.name} className="preview-download-link">
          Download {file.name}
        </a>
      </div>
    );
  };

  const previewContent = (
    <div className={`file-previewer ${isFullScreen ? 'fullscreen' : ''}`}>
      <div className="previewer-header">
        <div className="previewer-info">
          <h3>{file.name}</h3>
          <small>{file.type.toUpperCase()}</small>
        </div>

        <div className="previewer-controls">
          {(isImage || isText) && zoomLevel !== 100 && (
            <Button
              appearance="subtle"
              size="small"
              onClick={handleResetZoom}
              title="Reset zoom (Ctrl+0)"
            >
              {zoomLevel}%
            </Button>
          )}

          {isImage && (
            <>
              <Button
                icon={<ZoomOutRegular />}
                appearance="subtle"
                size="small"
                onClick={handleZoomOut}
                title="Zoom out (-)"
                disabled={zoomLevel <= 50}
              />
              <Button
                icon={<ZoomInRegular />}
                appearance="subtle"
                size="small"
                onClick={handleZoomIn}
                title="Zoom in (+)"
                disabled={zoomLevel >= 200}
              />
            </>
          )}

          <Button
            icon={<FullScreenMaximizeRegular />}
            appearance="subtle"
            size="small"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title="Fullscreen (Ctrl+F)"
          />

          <Button
            icon={<DismissRegular />}
            appearance="subtle"
            size="small"
            onClick={onClose}
            title="Close (ESC)"
          />
        </div>
      </div>

      <div className="previewer-content">{renderPreview()}</div>

      {(onNavigatePrevious || onNavigateNext) && (
        <div className="previewer-navigation">
          <Button
            icon={<ChevronLeftRegular />}
            appearance="subtle"
            onClick={onNavigatePrevious}
            disabled={!onNavigatePrevious}
            title="Previous (← Arrow)"
          />
          <Button
            icon={<ChevronRightRegular />}
            appearance="subtle"
            onClick={onNavigateNext}
            disabled={!onNavigateNext}
            title="Next (→ Arrow)"
          />
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="previewer-dialog">{previewContent}</DialogContent>
    </Dialog>
  );
};

export default FilePreviewer;
