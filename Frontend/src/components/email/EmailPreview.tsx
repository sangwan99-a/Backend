import React, { useState } from 'react';
import {
  Button,
  Text,
  Divider,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
} from '@fluentui/react-components';
import {
  Archive20Regular,
  Delete20Regular,
  ArrowReply20Regular,
  ArrowReplyAll20Regular,
  Share20Regular,
  MoreHorizontal20Regular,
  Star20Regular,
  Star20Filled,
  ArrowDownload20Regular,
  Attach20Regular,
} from '@fluentui/react-icons';
import { useEmailThread, useMarkAsRead, useDeleteEmail } from '@/hooks/useEmailData';
import { EmailMessage } from '@/types/email';

interface EmailPreviewProps {
  messageId?: string;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({ messageId }) => {
  const { data: thread = [], isLoading } = useEmailThread(messageId || '');
  const deleteEmailMutation = useDeleteEmail();
  const [expandedThreadIds, setExpandedThreadIds] = useState<Set<string>>(new Set());

  if (!messageId) {
    return (
      <div className="email-preview-empty">
        <Text>Select an email to view details</Text>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="email-preview-loading">
        <Text>Loading email...</Text>
      </div>
    );
  }

  const currentMessage = thread[thread.length - 1];
  if (!currentMessage) {
    return (
      <div className="email-preview-empty">
        <Text>Email not found</Text>
      </div>
    );
  }

  const toggleExpanded = (messageId: string) => {
    const newSet = new Set(expandedThreadIds);
    if (newSet.has(messageId)) {
      newSet.delete(messageId);
    } else {
      newSet.add(messageId);
    }
    setExpandedThreadIds(newSet);
  };

  const handleDelete = () => {
    deleteEmailMutation.mutate([currentMessage.id]);
  };

  return (
    <div className="email-preview">
      {/* Thread List */}
      <div className="email-thread">
        {thread.map((email, index) => {
          const isExpanded = expandedThreadIds.has(email.id) || index === thread.length - 1;
          const isCollapsed = index < thread.length - 1 && !isExpanded;

          return (
            <div key={email.id} className={`email-message ${isCollapsed ? 'collapsed' : ''}`}>
              {/* Message Header */}
              <div className="email-message-header" onClick={() => toggleExpanded(email.id)}>
                <div className="message-sender-info">
                  <div className="sender-avatar">
                    {email.from.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="sender-details">
                    <Text weight="semibold" size={200}>
                      {email.from.name || email.from.email}
                    </Text>
                    <Text size={100}>
                      {email.from.email}
                    </Text>
                  </div>
                </div>

                <div className="message-meta">
                  <Text size={100}>
                    {new Date(email.receivedAt).toLocaleString()}
                  </Text>
                  {email.isStarred && <Star20Filled />}
                </div>
              </div>

              {/* Message Body */}
              {isExpanded && (
                <>
                  {/* Recipients */}
                  <div className="email-recipients">
                    {(email.to.length > 0 || email.cc?.length || email.bcc?.length) && (
                      <div className="recipient-row">
                        <Text size={100}>
                          To:{' '}
                          {email.to.map((r) => r.email).join(', ')}
                          {email.cc && email.cc.length > 0 && ` Cc: ${email.cc.map((r) => r.email).join(', ')}`}
                          {email.bcc && email.bcc.length > 0 && ` Bcc: ${email.bcc.map((r) => r.email).join(', ')}`}
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Subject */}
                  {index === thread.length - 1 && (
                    <div className="email-subject">
                      <Text weight="semibold" size={500}>
                        {email.subject}
                      </Text>
                    </div>
                  )}

                  <Divider />

                  {/* Body */}
                  <div className="email-body">
                    {email.bodyHtml ? (
                      <div
                        className="email-html-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.bodyHtml) }}
                      />
                    ) : (
                      <Text>{email.body}</Text>
                    )}
                  </div>

                  {/* Attachments */}
                  {email.attachments.length > 0 && (
                    <div className="email-attachments">
                      <Text weight="semibold" size={100}>
                        Attachments ({email.attachments.length})
                      </Text>
                      <div className="attachments-list">
                        {email.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            className="attachment-item"
                            download
                          >
                            <Attach20Regular />
                            <span className="attachment-name">{attachment.filename}</span>
                            <span className="attachment-size">
                              ({formatFileSize(attachment.size)})
                            </span>
                            <Button
                              icon={<ArrowDownload20Regular />}
                              appearance="subtle"
                              size="small"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions (only for last message) */}
                  {index === thread.length - 1 && (
                    <div className="email-actions">
                      <Button icon={<ArrowReply20Regular />}>Reply</Button>
                      <Button icon={<ArrowReplyAll20Regular />}>Reply All</Button>
                      <Button icon={<Share20Regular />}>Forward</Button>
                      <Button icon={<Archive20Regular />}>Archive</Button>
                      <Button
                        icon={<Delete20Regular />}
                        onClick={handleDelete}
                        disabled={deleteEmailMutation.isLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple HTML sanitization (basic protection against XSS)
function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
