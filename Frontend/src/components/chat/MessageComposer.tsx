import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Text,
} from '@fluentui/react-components';
import {
  AttachRegular,
  EmojiRegular,
  Send20Regular,
  TextBoldRegular,
  TextItalicRegular,
  TextUnderlineRegular,
} from '@fluentui/react-icons';
import { useSendMessage } from '@/hooks/useChatData';
import { WebSocketService } from '@/services/chatWebSocket';

interface MessageComposerProps {
  channelId: string;
  replyingTo?: any;
  onReplyCancel: () => void;
  wsService?: WebSocketService | null;
}

const EMOJIS = ['👍', '❤️', '😂', '😲', '😢', '🔥', '🎉', '🚀'];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  channelId,
  replyingTo,
  onReplyCancel,
  wsService,
}) => {
  const [content, setContent] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const sendMutation = useSendMessage(channelId);

  // Handle typing indicator
  useEffect(() => {
    if (!wsService || !channelId) return;

    if (content.length > 0) {
      wsService.startTyping(channelId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        wsService.stopTyping(channelId);
      }, 2000);
    } else {
      wsService.stopTyping(channelId);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, wsService, channelId]);

  const handleSend = useCallback(async () => {
    if (!content.trim() && attachments.length === 0) return;

    const { mutateAsync } = sendMutation;
    await mutateAsync({
      content,
      replyTo: replyingTo?.id,
      attachments,
    });

    setContent('');
    setAttachments([]);
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    onReplyCancel();

    if (wsService) {
      wsService.stopTyping(channelId);
    }
  }, [content, attachments, sendMutation, replyingTo, onReplyCancel, wsService, channelId]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleAttachmentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const insertEmoji = useCallback((emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  return (
    <div className="message-composer">
      {replyingTo && (
        <div className="message-composer-reply">
          <div>
            <div className="message-composer-reply-user">Replying to {replyingTo.senderName}</div>
            <div className="message-composer-reply-text">{replyingTo.content}</div>
          </div>
          <button className="message-composer-reply-close" onClick={onReplyCancel}>
            ✕
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="attachment-preview">
          {attachments.map((file, index) => (
            <div key={index} className="attachment-preview-item">
              <span>{file.name}</span>
              <button
                className="attachment-preview-remove"
                onClick={() => removeAttachment(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="message-input-area">
        <div className="message-input-field">
          <textarea
            className="message-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Ctrl+Enter to send)"
            rows={1}
          />
        </div>

        <div className="composer-toolbar">
          <button
            className={`composer-toolbar-button ${isBold ? 'active' : ''}`}
            onClick={() => setIsBold(!isBold)}
            title="Bold (Ctrl+B)"
          >
            <TextBoldRegular />
          </button>

          <button
            className={`composer-toolbar-button ${isItalic ? 'active' : ''}`}
            onClick={() => setIsItalic(!isItalic)}
            title="Italic (Ctrl+I)"
          >
            <TextItalicRegular />
          </button>

          <button
            className={`composer-toolbar-button ${isUnderline ? 'active' : ''}`}
            onClick={() => setIsUnderline(!isUnderline)}
            title="Underline (Ctrl+U)"
          >
            <TextUnderlineRegular />
          </button>

          <Popover open={showEmojiPicker} onOpenChange={(e, data) => setShowEmojiPicker(data.open)}>
            <PopoverTrigger disableButtonEnhancement>
              <button className="composer-toolbar-button" title="Add emoji">
                <EmojiRegular />
              </button>
            </PopoverTrigger>

            <PopoverSurface className="emoji-picker">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className="emoji-button"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </PopoverSurface>
          </Popover>

          <button
            className="composer-toolbar-button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <AttachRegular />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="file-input"
            onChange={handleAttachmentChange}
          />

          <Button
            onClick={handleSend}
            icon={<Send20Regular />}
            appearance="primary"
            disabled={!content.trim() && attachments.length === 0}
            className="send-button"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
