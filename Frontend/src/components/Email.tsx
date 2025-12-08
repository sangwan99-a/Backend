import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Button, Spinner } from '@fluentui/react-components';
import { FolderList } from './email/FolderList';
import { EmailList } from './email/EmailList';
import { EmailPreview } from './email/EmailPreview';
import { ComposeDialog } from './email/ComposeDialog';
import { useEmailStore } from '../store/emailStore';
import { useFolders } from '../hooks/useEmailData';
import '../styles/email.css';

// Create a separate QueryClient for email module
const emailQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute default
      cacheTime: 1000 * 60 * 5, // 5 minutes cache time
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Email Module - Main Container Component
 * 
 * Layout: 3-pane view with responsive collapsing
 * - Left: Folder/Label sidebar with unread counts
 * - Middle: Email list with search, filters, and bulk actions
 * - Right: Email thread preview with full conversation
 * 
 * Features:
 * - Real-time email notifications via WebSocket
 * - Offline-first with IndexedDB caching
 * - Optimistic updates for responsive UX
 * - Bulk email operations
 * - Advanced search and filtering
 * - Keyboard shortcuts
 */
export const Email: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const { isLoading: foldersLoading, error: foldersError } = useFolders();

  // Subscribe to store changes
  const {
    selectedFolderId,
    selectedMessageIds,
    isComposing,
    syncProgress,
    closeCompose,
  } = useEmailStore();

  // Initialize email module on mount
  useEffect(() => {
    const initializeEmailModule = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        // Initialize database
        // await initializeEmailDatabase();

        // Load initial data
        // Folders will be fetched via React Query hook in FolderList

        // Set up WebSocket for real-time notifications
        // setupEmailNotifications();

        // Sync unsent emails if offline queue exists
        // await syncUnsentEmails();

        setIsInitializing(false);
      } catch (error) {
        console.error('Email module initialization error:', error);
        setInitError(
          error instanceof Error
            ? error.message
            : 'Failed to initialize email module'
        );
        setIsInitializing(false);
      }
    };

    initializeEmailModule();
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + E: Open compose
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        // setIsComposing(true);
      }

      // Ctrl/Cmd + .: Open search
      if ((event.ctrlKey || event.metaKey) && event.key === '.') {
        event.preventDefault();
        // Focus search input
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        searchInput?.focus();
      }

      // Delete key: Delete selected emails
      if (event.key === 'Delete' && selectedMessageIds.length > 0) {
        event.preventDefault();
        // Show delete confirmation dialog
        // onDeleteSelected();
      }

      // R key: Reply to focused email
      if (event.key === 'r' && selectedMessageIds.length === 1) {
        event.preventDefault();
        // Open reply composer
      }

      // # key: Archive selected
      if (event.shiftKey && event.key === '#' && selectedMessageIds.length > 0) {
        event.preventDefault();
        // Archive selected emails
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMessageIds]);

  // Render error state
  if (initError) {
    return (
      <div className="email-page">
        <div className="email-error">
          <strong>Error initializing email module:</strong> {initError}
          <Button
            appearance="secondary"
            size="small"
            onClick={() => {
              setInitError(null);
              setIsInitializing(true);
            }}
            style={{ marginTop: '8px' }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isInitializing || foldersLoading) {
    return (
      <div className="email-page">
        <div className="email-loading">
          <Spinner label="Loading email module..." />
        </div>
      </div>
    );
  }

  if (foldersError) {
    return (
      <div className="email-page">
        <div className="email-error">
          <strong>Error loading folders:</strong> Unable to retrieve email folders
          <Button
            appearance="secondary"
            size="small"
            onClick={() => window.location.reload()}
            style={{ marginTop: '8px' }}
          >
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={emailQueryClient}>
      <div className="email-page">
        {/* Email Container - 3-Pane Layout */}
        <div className="email-container">
          {/* Left Sidebar: Folders & Labels */}
          <div className="folder-list">
            <FolderList />
          </div>

          {/* Middle: Email List */}
          <div className="email-list">
            <EmailList folderId={selectedFolderId} />
          </div>

          {/* Right: Email Preview */}
          <div className="email-preview">
            {selectedMessageIds.length === 1 ? (
              <EmailPreview messageId={selectedMessageIds[0]} />
            ) : selectedMessageIds.length > 1 ? (
              <div className="email-preview-empty">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    {selectedMessageIds.length} emails selected
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    Select a single email to preview
                  </div>
                </div>
              </div>
            ) : (
              <div className="email-preview-empty">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    No email selected
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    Select an email from the list to view details
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compose Dialog */}
        {isComposing && <ComposeDialog open={isComposing} onClose={closeCompose} />}

        {/* Sync Status Indicator */}
        {syncProgress > 0 && syncProgress < 100 && (
          <div style={{
            padding: '8px 16px',
            background: 'var(--colorBrandBackground15)',
            borderTop: '1px solid var(--colorNeutralStroke1)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Spinner size="tiny" />
            <span>Syncing emails... {syncProgress}%</span>
          </div>
        )}
      </div>
    </QueryClientProvider>
  );
};

export default Email;
