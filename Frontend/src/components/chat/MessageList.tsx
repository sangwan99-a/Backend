import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Spinner, Text, Avatar, Button, Popover, PopoverTrigger, PopoverSurface } from '@fluentui/react-components';
import { MoreVertical20Regular, ArrowReply20Regular, Edit20Regular, Delete20Regular } from '@fluentui/react-icons';
import { useMessages, useLoadOlderMessages } from '@/hooks/useChatData';
import { useChatStore } from '@/store/chatStore';
import { Message } from '@/types/chat';
import '../../styles/chat.css';

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString();
};

const MessageBubble: React.FC<{
  message: Message;
  isOwn: boolean;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
}> = ({ message, isOwn, onReply, onEdit, onDelete }) => (
  <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
    {!isOwn && (
      <Avatar
        name={message.user.name}
        image={{ src: message.user.avatar }}
        size={32}
      />
    )}

    <div className="message-content">
      {!isOwn && <div className="message-user-name">{message.user.name}</div>}

      <div className={`message-text ${isOwn ? 'own' : 'other'}`}>
        {message.replyTo && (
          <div className="message-reply-quote">
            <Text size={100}>
              Reply to {message.replyTo.userId}:
            </Text>
            <Text size={100}>{message.replyTo.content.substring(0, 100)}</Text>
          </div>
        )}

        <p>{message.formattedContent || message.content}</p>

        {message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((reaction) => (
              <div key={reaction.emoji} className="reaction">
                <span>{reaction.emoji}</span>
                <span className="reaction-count">{reaction.count}</span>
              </div>
            ))}
          </div>
        )}

        {message.attachments.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="attachment">
                {attachment.preview && (
                  <img src={attachment.preview} alt={attachment.name} />
                )}
                <a href={attachment.url} download={attachment.name}>
                  {attachment.name}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="message-footer">
        <Text size={100}>
          {formatTimestamp(message.timestamp)}
        </Text>
        {isOwn && message.readBy.length > 0 && (
          <span className="read-receipt">✓✓</span>
        )}
      </div>
    </div>

    {/* Message Actions */}
    <Popover>
      <PopoverTrigger disableButtonEnhancement>
        <Button
          icon={<MoreVertical20Regular />}
          appearance="subtle"
          size="small"
          className="message-actions-btn"
        />
      </PopoverTrigger>
      <PopoverSurface className="message-actions-menu">
        <Button
          icon={<ArrowReply20Regular />}
          appearance="subtle"
          onClick={() => onReply(message)}
          style={{ width: '100%' }}
        >
          Reply
        </Button>
        {isOwn && (
          <>
            <Button
              icon={<Edit20Regular />}
              appearance="subtle"
              onClick={() => onEdit(message)}
              style={{ width: '100%' }}
            >
              Edit
            </Button>
            <Button
              icon={<Delete20Regular />}
              appearance="subtle"
              onClick={() => onDelete(message.id)}
              style={{ width: '100%' }}
            >
              Delete
            </Button>
          </>
        )}
      </PopoverSurface>
    </Popover>
  </div>
);

export const MessageList: React.FC<{ channelId: string; userId: string }> = ({
  channelId,
  userId,
}) => {
  const { data: messages = [], isLoading } = useMessages(channelId, !!channelId);
  const { mutate: loadOlder } = useLoadOlderMessages(channelId);
  const { setSelectedThread } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLoadOlder = useCallback(() => {
    if (messages.length > 0) {
      loadOlder(messages[0].timestamp);
    }
  }, [messages, loadOlder]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (target.scrollTop === 0) {
        handleLoadOlder();
      }
    },
    [handleLoadOlder]
  );

  if (isLoading) {
    return (
      <div className="message-list-loading">
        <Spinner label="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="message-list" ref={scrollRef} onScroll={handleScroll}>
      {messages.length === 0 ? (
        <div className="message-list-empty">
          <Text>
            No messages yet. Start the conversation!
          </Text>
        </div>
      ) : (
        messages.map((message: Message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.userId === userId}
            onReply={setReplyingTo}
            onEdit={() => setEditingId(message.id)}
            onDelete={() => console.log('Delete:', message.id)}
          />
        ))
      )}
    </div>
  );
};
