import React, { useState, useMemo } from 'react';
import {
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  Button,
  Checkbox,
  Input,
  Text,
} from '@fluentui/react-components';
import {
  Star20Regular,
  Star20Filled,
  Attach20Regular,
  Search20Regular,
} from '@fluentui/react-icons';
import { useEmails, useStarEmail, useMarkAsRead } from '@/hooks/useEmailData';
import { useEmailStore } from '@/store/emailStore';
import { EmailMessage } from '@/types/email';

interface EmailListProps {
  folderId: string;
}

export const EmailList: React.FC<EmailListProps> = ({ folderId }) => {
  const { data: emails = [], isLoading } = useEmails(folderId);
  const selectedMessageIds = useEmailStore((state) => state.selectedMessageIds);
  const selectedMessageId = useEmailStore((state) => state.selectedMessageId);
  const setSelectedMessage = useEmailStore((state) => state.setSelectedMessage);
  const addSelectedMessage = useEmailStore((state) => state.addSelectedMessage);
  const removeSelectedMessage = useEmailStore((state) => state.removeSelectedMessage);
  const [searchQuery, setSearchQuery] = useState('');
  const starMutation = useStarEmail();
  const markReadMutation = useMarkAsRead();

  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;

    const query = searchQuery.toLowerCase();
    return emails.filter(
      (email) =>
        email.subject.toLowerCase().includes(query) ||
        email.from.email.toLowerCase().includes(query) ||
        email.from.name?.toLowerCase().includes(query)
    );
  }, [emails, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredEmails.map((e) => e.id);
      useEmailStore.setState({ selectedMessageIds: allIds });
    } else {
      useEmailStore.setState({ selectedMessageIds: [] });
    }
  };

  const handleSelectEmail = (messageId: string, checked: boolean) => {
    if (checked) {
      addSelectedMessage(messageId);
    } else {
      removeSelectedMessage(messageId);
    }
  };

  const handleEmailClick = (email: EmailMessage) => {
    setSelectedMessage(email.id);
    if (!email.isRead) {
      markReadMutation.mutate([email.id]);
    }
  };

  const handleStar = (email: EmailMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    starMutation.mutate({
      messageIds: [email.id],
      starred: !email.isStarred,
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const emailDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - emailDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return emailDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return emailDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return emailDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="email-list">
        <div className="email-list-header">
          <Input
            placeholder="Search emails..."
            contentBefore={<Search20Regular />}
            className="search-input"
          />
        </div>
        <div className="email-list-loading">
          <Text>Loading emails...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="email-list">
      {/* Search Bar */}
      <div className="email-list-header">
        <Input
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
          contentBefore={<Search20Regular />}
          className="search-input"
        />
      </div>

      {/* Email Table */}
      <div className="email-list-content">
        {filteredEmails.length === 0 ? (
          <div className="email-list-empty">
            <Text>No emails found</Text>
          </div>
        ) : (
          <div className="email-table">
            <div className="email-table-header">
              <div className="email-cell-checkbox">
                <Checkbox
                  checked={
                    filteredEmails.length > 0 &&
                    selectedMessageIds.length === filteredEmails.length
                  }
                  onChange={(_, data) => handleSelectAll(data.checked as boolean)}
                />
              </div>
              <div className="email-cell-star">Star</div>
              <div className="email-cell-from">From</div>
              <div className="email-cell-subject">Subject</div>
              <div className="email-cell-date">Date</div>
            </div>

            <div className="email-table-body">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`email-row ${
                    selectedMessageId === email.id ? 'selected' : ''
                  } ${email.isRead ? '' : 'unread'}`}
                  onClick={() => handleEmailClick(email)}
                >
                  <div className="email-cell-checkbox">
                    <Checkbox
                      checked={selectedMessageIds.includes(email.id)}
                      onChange={(_, data) =>
                        handleSelectEmail(email.id, data.checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="email-cell-star">
                    <Button
                      icon={
                        email.isStarred ? (
                          <Star20Filled />
                        ) : (
                          <Star20Regular />
                        )
                      }
                      appearance="subtle"
                      size="small"
                      onClick={(e) => handleStar(email, e)}
                    />
                  </div>

                  <div className="email-cell-from">
                    <Text size={100} weight={email.isRead ? 'regular' : 'semibold'}>
                      {email.from.name || email.from.email}
                    </Text>
                  </div>

                  <div className="email-cell-subject">
                    <div className="subject-content">
                      <Text size={100} weight={email.isRead ? 'regular' : 'semibold'}>
                        {email.subject || '(no subject)'}
                      </Text>
                      {email.hasAttachments && (
                        <Attach20Regular className="attachment-icon" />
                      )}
                    </div>
                  </div>

                  <div className="email-cell-date">
                    <Text size={100}>
                      {formatDate(email.receivedAt)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
