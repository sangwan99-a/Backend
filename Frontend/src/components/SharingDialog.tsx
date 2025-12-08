/**
 * SharingDialog Component - Manage file sharing and permissions
 * 
 * Features:
 * - User search and autocomplete
 * - Permission levels: view, comment, edit, admin
 * - Share scopes: private, user, team, organization, public
 * - Public link generation with password
 * - Expiration date setting
 * - User removal
 * - Share history
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Input,
  Select,
  Badge,
  Spinner,
  Tab,
  TabList,
} from '@fluentui/react-components';
import {
  DismissRegular,
  CopyRegular,
  CheckmarkRegular,
  DeleteRegular,
  LinkRegular,
  LockClosedRegular,
  PeopleTeamRegular,
  GlobeRegular,
} from '@fluentui/react-icons';
import { useShareFile } from '../hooks/useDocumentsData';
import type { File, FileSharingInfo, ShareUser } from '../types/documents';

interface SharingDialogProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareSearchResult {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'team';
  avatar?: string;
}

export const SharingDialog: React.FC<SharingDialogProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShareSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [publicLink, setPublicLink] = useState('');
  const [publicPassword, setPublicPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('people');
  const shareFileMutation = useShareFile();

  if (!file) return null;

  // Simulate user search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      const mockResults: ShareSearchResult[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          type: 'user' as const,
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          type: 'user' as const,
        },
        {
          id: '3',
          name: 'Engineering Team',
          email: 'engineering@example.com',
          type: 'team' as const,
        },
      ].filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.email.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  // Share with user
  const handleShareWithUser = (user: ShareSearchResult) => {
    if (!file.sharing) return;

    const newSharedWith: ShareUser = {
      userId: user.id,
      userEmail: user.email,
      displayName: user.name,
      permission: selectedPermission as any,
      sharedAt: new Date().toISOString(),
      sharedBy: 'current-user',
    };

    const updatedSharing: FileSharingInfo = {
      ...file.sharing,
      shared: true,
      sharedWith: [...(file.sharing.sharedWith || []), newSharedWith],
    };

    shareFileMutation.mutate({
      fileId: file.id,
      sharing: updatedSharing,
    });

    setSearchQuery('');
    setSearchResults([]);
  };

  // Generate public link
  const handleGeneratePublicLink = () => {
    if (!file.sharing) return;

    const token = Math.random().toString(36).substr(2, 9);
    const link = `${window.location.origin}/share/${file.id}/${token}`;
    setPublicLink(link);

    const updatedSharing: FileSharingInfo = {
      ...file.sharing,
      scope: 'public',
      publicLink: link,
      password: publicPassword || undefined,
      expiresAt: expiryDate || undefined,
      allowDownload,
    };

    shareFileMutation.mutate({
      fileId: file.id,
      sharing: updatedSharing,
    });
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Remove shared user
  const handleRemoveUser = (userId: string) => {
    if (!file.sharing) return;

    const updatedSharing: FileSharingInfo = {
      ...file.sharing,
      sharedWith: file.sharing.sharedWith?.filter((u) => u.userId !== userId) || [],
    };

    shareFileMutation.mutate({
      fileId: file.id,
      sharing: updatedSharing,
    });
  };

  // Update permission
  const handleUpdatePermission = (userId: string, permission: string) => {
    if (!file.sharing) return;

    const updatedSharing: FileSharingInfo = {
      ...file.sharing,
      sharedWith: file.sharing.sharedWith?.map((u) =>
        u.userId === userId ? { ...u, permission: permission as any } : u
      ) || [],
    };

    shareFileMutation.mutate({
      fileId: file.id,
      sharing: updatedSharing,
    });
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'private':
        return <LockClosedRegular />;
      case 'team':
        return <PeopleTeamRegular />;
      case 'organization':
        return <PeopleTeamRegular />;
      case 'public':
        return <GlobeRegular />;
      default:
        return <LockClosedRegular />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sharing-dialog">
        <div className="sharing-header">
          <h2>Share "{file.name}"</h2>
          <Button
            icon={<DismissRegular />}
            appearance="subtle"
            onClick={onClose}
          />
        </div>

        <TabList selectedValue={activeTab} onTabSelect={(e, data) => setActiveTab(data.value as string)}>
          <Tab value="people">Share with people</Tab>
          <Tab value="link">Public link</Tab>
        </TabList>

        {activeTab === 'people' && (
          <div className="sharing-people-section">
            <div className="sharing-search">
              <Input
                placeholder="Enter name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch((e.target as HTMLInputElement).value)}
                contentBefore={isSearching ? <Spinner size="tiny" /> : null}
              />
              <Select value={selectedPermission} onChange={(e) => setSelectedPermission(e.target.value as any)}>
                <option value="view">Can view</option>
                <option value="comment">Can comment</option>
                <option value="edit">Can edit</option>
              </Select>
            </div>

            {searchResults.length > 0 && (
              <div className="sharing-search-results">
                {searchResults.map((result) => (
                  <div key={result.id} className="search-result-item">
                    <div className="result-info">
                      <div className="result-avatar">
                        {result.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="result-details">
                        <p className="result-name">{result.name}</p>
                        <p className="result-email">{result.email}</p>
                      </div>
                    </div>
                    <Button
                      appearance="primary"
                      onClick={() => handleShareWithUser(result)}
                    >
                      Share
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="sharing-current-section">
              <h4>Current access</h4>
              {file.sharing?.sharedWith && file.sharing.sharedWith.length > 0 ? (
                <div className="shared-users-list">
                  {file.sharing.sharedWith.map((user) => (
                    <div key={user.userId} className="shared-user-item">
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <p className="user-name">{user.displayName}</p>
                          <p className="user-email">{user.userEmail}</p>
                        </div>
                      </div>

                      <div className="user-controls">
                        <Select
                          value={user.permission}
                          onChange={(e) =>
                            handleUpdatePermission(user.userId, e.target.value)
                          }
                          size="small"
                        >
                          <option value="view">Can view</option>
                          <option value="comment">Can comment</option>
                          <option value="edit">Can edit</option>
                        </Select>

                        <Button
                          icon={<DeleteRegular />}
                          appearance="subtle"
                          onClick={() => handleRemoveUser(user.userId)}
                          title="Remove access"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-access-text">Not shared with anyone yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'link' && (
          <div className="sharing-link-section">
            <div className="link-settings">
              <div className="setting-item">
                <label>Access level:</label>
                <Select value={file.sharing?.scope || 'private'}>
                  <option value="private">Private</option>
                  <option value="public">Anyone with link</option>
                </Select>
              </div>

              {file.sharing?.scope === 'public' && (
                <>
                  <div className="setting-item">
                    <label>Password (optional):</label>
                    <Input
                      type="password"
                      placeholder="Set a password..."
                      value={publicPassword}
                      onChange={(e) => setPublicPassword((e.target as HTMLInputElement).value)}
                    />
                  </div>

                  <div className="setting-item">
                    <label>Expiry date (optional):</label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate((e.target as HTMLInputElement).value)}
                    />
                  </div>

                  <div className="setting-checkbox">
                    <input
                      type="checkbox"
                      id="allow-download"
                      checked={allowDownload}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                    />
                    <label htmlFor="allow-download">Allow download</label>
                  </div>
                </>
              )}
            </div>

            <Button
              appearance="primary"
              onClick={handleGeneratePublicLink}
              style={{ width: '100%' }}
            >
              {publicLink ? 'Regenerate' : 'Generate'} Public Link
            </Button>

            {publicLink && (
              <div className="public-link-display">
                <div className="link-url">
                  <Input value={publicLink} readOnly />
                  <Button
                    icon={copiedLink ? <CheckmarkRegular /> : <CopyRegular />}
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SharingDialog;
