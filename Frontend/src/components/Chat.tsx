import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Title2, Text, Divider, Button, Spinner } from '@fluentui/react-components';
import { Chat20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import useAuthStore from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { ChannelList } from './chat/ChannelList';
import { MessageList } from './chat/MessageList';
import { MessageComposer } from './chat/MessageComposer';
import { MemberList } from './chat/MemberList';
import { TypingIndicators } from './chat/TypingIndicators';
import { WebSocketService } from '@/services/chatWebSocket';
import '../styles/chat.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const Chat: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const {
    selectedChannelId,
    selectedUserId,
    wsConnected,
    showMemberList,
    setWsConnected,
    toggleMemberList,
  } = useChatStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [ws, setWs] = useState<WebSocketService | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user?.id) {
      setIsInitializing(false);
      return;
    }

    // Initialize WebSocket
    const wsService = new WebSocketService(
      process.env.REACT_APP_WS_URL || `ws://${window.location.host}`
    );
    wsService.connect(user.id).catch((error) => {
      console.error('WebSocket connection failed:', error);
      setWsConnected(false);
    });

    setWs(wsService);

    // Message events
    wsService.on('message', (data: any) => {
      queryClient.invalidateQueries(['messages', selectedChannelId]);
    });

    wsService.on('message:update', (data: any) => {
      queryClient.invalidateQueries(['messages', selectedChannelId]);
    });

    wsService.on('message:delete', (data: any) => {
      queryClient.invalidateQueries(['messages', selectedChannelId]);
    });

    // Reaction events
    wsService.on('reaction:add', (data: any) => {
      queryClient.invalidateQueries(['messages', selectedChannelId]);
    });

    wsService.on('reaction:remove', (data: any) => {
      queryClient.invalidateQueries(['messages', selectedChannelId]);
    });

    // Typing indicators
    wsService.on('typing', (data: any) => {
      const { userId, userName, isTyping, channelId } = data;
      
      if (channelId !== selectedChannelId) return;

      setTypingUsers((prev) => {
        const updated = new Map(prev);
        if (isTyping) {
          updated.set(userId, userName || 'User');
          // Auto-remove after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev2) => {
              const updated2 = new Map(prev2);
              updated2.delete(userId);
              return updated2;
            });
          }, 3000);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
    });

    // Presence updates
    wsService.on('presence', (data: any) => {
      queryClient.invalidateQueries(['presence']);
    });

    // Channel events
    wsService.on('channel:created', (data: any) => {
      queryClient.invalidateQueries(['channels']);
    });

    wsService.on('channel:updated', (data: any) => {
      queryClient.invalidateQueries(['channels']);
      queryClient.invalidateQueries(['channelDetails', selectedChannelId]);
    });

    wsService.on('channel:deleted', (data: any) => {
      queryClient.invalidateQueries(['channels']);
    });

    // Connection events
    wsService.on('connected', () => {
      setWsConnected(true);
      if (selectedChannelId) {
        wsService.subscribeToChannel(selectedChannelId);
      }
      wsService.subscribeToPresence();
    });

    wsService.on('disconnected', () => {
      setWsConnected(false);
    });

    setIsInitializing(false);

    return () => {
      wsService.disconnect();
    };
  }, [user?.id, selectedChannelId, setWsConnected]);

  if (isInitializing) {
    return (
      <div className="module-page">
        <div className="module-header">
          <Chat20Regular className="module-icon" />
          <div>
            <Title2>Chat</Title2>
            <Text>Initializing...</Text>
          </div>
        </div>
        <Divider />
        <div
          className="module-content"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Spinner label="Loading chat..." />
        </div>
      </div>
    );
  }

  const selectedChatId = selectedChannelId || selectedUserId;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="module-page chat-page">
        <div className="module-header">
          <Chat20Regular className="module-icon" />
          <div>
            <Title2>Chat</Title2>
            <Text>Real-time messaging and collaboration</Text>
            {wsConnected && (
              <div className="connection-status">
                <span className="status-indicator online"></span>
                <Text size={200}>
                  Connected
                </Text>
              </div>
            )}
          </div>
        </div>

        <Divider />

        <div className="chat-container">
          {/* Left Sidebar - Channel List */}
          <aside className="chat-sidebar">
            <ChannelList />
          </aside>

          {/* Center - Message List */}
          <div className="chat-main">
            {selectedChatId ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-title">
                    {selectedChannelId && <Text># General</Text>}
                    {selectedUserId && <Text>@User</Text>}
                  </div>
                  <Button
                    icon={<ChevronRight20Regular />}
                    appearance="subtle"
                    onClick={toggleMemberList}
                  />
                </div>

                <MessageList
                  channelId={selectedChatId}
                  userId={user?.id || ''}
                />

                <TypingIndicators typingUsers={typingUsers} />

                <MessageComposer
                  channelId={selectedChatId}
                  replyingTo={replyingTo}
                  onReplyCancel={() => setReplyingTo(null)}
                  wsService={ws}
                />
              </>
            ) : (
              <div className="chat-empty">
                <Chat20Regular />
                <Text>
                  Select a channel or user to start messaging
                </Text>
              </div>
            )}
          </div>

          {/* Right Sidebar - Member List */}
          {showMemberList && selectedChannelId && (
            <aside className="chat-members">
              <MemberList channelId={selectedChannelId} />
            </aside>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
};
