import React, { useMemo } from 'react';
import {
  Listbox,
  Badge,
  Avatar,
  Button,
  Input,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogBody,
  DialogTitle,
  DialogActions,
  Option,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Search20Regular,
  NumberSymbol20Regular,
  Person20Regular,
} from '@fluentui/react-icons';
import { useChannels } from '@/hooks/useChatData';
import { useChatStore } from '@/store/chatStore';
import { Channel } from '@/types/chat';
import '../../styles/chat.css';

export const ChannelList: React.FC = () => {
  const { data: channels = [] } = useChannels();
  const { selectedChannelId, selectedUserId, setSelectedChannel, setSelectedUser } =
    useChatStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  const filteredChannels = useMemo(() => {
    return channels.filter(
      (ch: Channel) =>
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  const groupedChannels = useMemo(() => {
    const dmChannels = filteredChannels.filter((ch: Channel) => ch.type === 'dm');
    const regularChannels = filteredChannels.filter((ch: Channel) => ch.type !== 'dm');
    return { dmChannels, regularChannels };
  }, [filteredChannels]);

  const handleChannelSelect = (channel: Channel) => {
    if (channel.type === 'dm') {
      setSelectedUser(channel.members[0]?.id || null);
      setSelectedChannel(null);
    } else {
      setSelectedChannel(channel.id);
      setSelectedUser(null);
    }
  };

  return (
    <div className="channel-list">
      <div className="channel-list-header">
        <h3>Channels</h3>
        <Dialog
          open={showCreateDialog}
          onOpenChange={(_, { open }) => setShowCreateDialog(open)}
        >
          <DialogTrigger disableButtonEnhancement>
            <Button icon={<Add20Regular />} appearance="subtle" size="small" />
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Create Channel</DialogTitle>
            <DialogBody>
              <Input placeholder="Channel name" />
              <Input placeholder="Description (optional)" />
            </DialogBody>
            <DialogActions>
              <Button appearance="secondary">Cancel</Button>
              <Button appearance="primary">Create</Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
      </div>

      <div className="channel-search">
        <Input
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(_, data: any) => setSearchQuery(data.value || '')}
          size="small"
        />
      </div>

      <Listbox className="channel-list-items">
        {/* Regular Channels */}
        {groupedChannels.regularChannels.length > 0 && (
          <div className="channel-group">
            <div className="channel-group-label">Channels</div>
            {groupedChannels.regularChannels.map((channel: Channel) => (
              <Option
                key={channel.id}
                value={channel.id}
                text={channel.name}
                onClick={() => handleChannelSelect(channel)}
                className="channel-item"
              >
                <div className="channel-item-content">
                  <NumberSymbol20Regular className="channel-icon" />
                  <div className="channel-info">
                    <span className="channel-name">{channel.name}</span>
                    {channel.unreadCount > 0 && (
                      <Badge color="informative" appearance="filled">
                        {channel.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </Option>
            ))}
          </div>
        )}

        {/* Direct Messages */}
        {groupedChannels.dmChannels.length > 0 && (
          <div className="channel-group">
            <div className="channel-group-label">Direct Messages</div>
            {groupedChannels.dmChannels.map((channel: Channel) => {
              const user = channel.members[0];
              return (
                <Option
                  key={channel.id}
                  value={channel.id}
                  text={user?.name || ''}
                  onClick={() => handleChannelSelect(channel)}
                  className="channel-item dm-item"
                >
                  <div className="channel-item-content">
                    <Avatar
                      name={user?.name}
                      image={{ src: user?.avatar }}
                      size={32}
                    />
                    <div className="channel-info">
                      <span className="channel-name">{user?.name}</span>
                      {channel.unreadCount > 0 && (
                        <Badge color="informative" appearance="filled">
                          {channel.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {user?.status === 'online' && (
                      <div className="status-indicator online" />
                    )}
                  </div>
                </Option>
              );
            })}
          </div>
        )}

        {filteredChannels.length === 0 && (
          <div className="channel-empty">No channels found</div>
        )}
      </Listbox>
    </div>
  );
};
