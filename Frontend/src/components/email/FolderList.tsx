import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Input,
  Text,
} from '@fluentui/react-components';
import {
  Mailbox20Regular,
  Send20Regular,
  Drafts20Regular,
  Archive20Regular,
  Delete20Regular,
  AlertRegular,
  Tag20Regular,
  ChevronDown20Regular,
  ChevronRight20Regular,
  Add20Regular,
} from '@fluentui/react-icons';
import { useFolders, useLabels } from '@/hooks/useEmailData';
import { useEmailStore } from '@/store/emailStore';
import { EmailFolder, EmailLabel } from '@/types/email';

const FOLDER_ICONS: { [key: string]: React.ReactNode } = {
  inbox: <Mailbox20Regular />,
  sent: <Send20Regular />,
  drafts: <Drafts20Regular />,
  archive: <Archive20Regular />,
  spam: <AlertRegular />,
  trash: <Delete20Regular />,
};

interface FolderItemProps {
  folder: EmailFolder;
  selected: boolean;
  onSelect: (folderId: string) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, selected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    onSelect(folder.id);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <div
        className={`folder-item ${selected ? 'selected' : ''}`}
        onClick={handleClick}
      >
        {folder.children && folder.children.length > 0 && (
          <button
            className="folder-expand-button"
            onClick={handleExpandClick}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
          </button>
        )}

        <div className="folder-icon">
          {FOLDER_ICONS[folder.systemType || ''] || <Tag20Regular />}
        </div>

        <div className="folder-name">{folder.name}</div>

        {folder.unreadCount > 0 && (
          <div className="folder-unread-badge">{folder.unreadCount}</div>
        )}
      </div>

      {isExpanded && folder.children && folder.children.length > 0 && (
        <div className="folder-children">
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={{ ...child, nestLevel: (folder.nestLevel || 0) + 1 }}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface LabelItemProps {
  label: EmailLabel;
  onClick: (labelId: string) => void;
}

const LabelItem: React.FC<LabelItemProps> = ({ label, onClick }) => {
  return (
    <button
      className="label-item"
      onClick={() => onClick(label.id)}
      style={{ borderLeftColor: label.color }}
    >
      <div className="label-color-dot" style={{ backgroundColor: label.color }} />
      <span className="label-name">{label.name}</span>
      {label.unreadCount > 0 && (
        <span className="label-unread-count">{label.unreadCount}</span>
      )}
    </button>
  );
};

export const FolderList: React.FC = () => {
  const { data: folders = [], isLoading } = useFolders();
  const { data: labels = [] } = useLabels();
  const selectedFolderId = useEmailStore((state) => state.selectedFolderId);
  const selectedLabelId = useEmailStore((state) => state.selectedLabelId);
  const setSelectedFolder = useEmailStore((state) => state.setSelectedFolder);
  const [isCreateLabelOpen, setIsCreateLabelOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#0078D4');

  const COLORS = ['#0078D4', '#107C10', '#D83B01', '#FFB900', '#D13438', '#762E8C'];

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
  };

  const handleLabelSelect = (labelId: string) => {
    // TODO: Implement label selection
  };

  return (
    <div className="folder-list">
      {/* Folders Section */}
      <div className="folder-section">
        <div className="section-header">
          <Text weight="semibold" size={100}>
            FOLDERS
          </Text>
        </div>

        {isLoading ? (
          <div className="folder-loading">
            <Text>Loading folders...</Text>
          </div>
        ) : (
          <div className="folders-container">
            {folders
              .filter((f) => f.type === 'system')
              .map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  selected={selectedFolderId === folder.id}
                  onSelect={handleFolderSelect}
                />
              ))}
          </div>
        )}
      </div>

      {/* Labels Section */}
      {labels.length > 0 && (
        <div className="label-section">
          <div className="section-header">
            <Text weight="semibold" size={100}>
              LABELS
            </Text>
            <Dialog open={isCreateLabelOpen} onOpenChange={(_, data) => setIsCreateLabelOpen(data.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button
                  icon={<Add20Regular />}
                  appearance="subtle"
                  size="small"
                  title="Create label"
                />
              </DialogTrigger>
              <DialogSurface>
                <DialogTitle>Create New Label</DialogTitle>
                <DialogBody>
                  <div style={{ marginBottom: '16px' }}>
                    <Input
                      placeholder="Label name"
                      value={newLabelName}
                      onChange={(e, data) => setNewLabelName(data.value)}
                    />
                  </div>

                  <div className="color-picker">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </DialogBody>
                <DialogActions>
                  <Button appearance="secondary" onClick={() => setIsCreateLabelOpen(false)}>
                    Cancel
                  </Button>
                  <Button appearance="primary" onClick={() => setIsCreateLabelOpen(false)}>
                    Create
                  </Button>
                </DialogActions>
              </DialogSurface>
            </Dialog>
          </div>

          <div className="labels-container">
            {labels.map((label) => (
              <LabelItem key={label.id} label={label} onClick={handleLabelSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
