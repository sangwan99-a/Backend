import React, { useState } from 'react';
import {
  Button,
  Input,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Badge,
  Tooltip,
} from '@fluentui/react-components';
import {
  SearchRegular,
  Settings20Regular,
  SignOut20Regular,
  Person20Regular,
  Info20Regular,
  WeatherMoon20Regular,
  Lightbulb20Regular,
  Navigation20Regular,
} from '@fluentui/react-icons';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import { NotificationBadge } from '@/components/NotificationCenter';
import { useUnreadCount } from '@/hooks/useNotificationData';
import '../styles/topbar.css';

interface TopBarProps {
  onMenuToggle: () => void;
  onThemeToggle: (theme: string) => void;
  currentTheme: string;
  showMenuButton?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMenuToggle,
  onThemeToggle,
  currentTheme,
  showMenuButton = false,
}) => {
  const { user } = useAuthStore();
  const [searchValue, setSearchValue] = useState('');
  const openNotificationPanel = useNotificationStore((s) => s.openPanel);
  const { data: unreadCount } = useUnreadCount(user?.id || '', !!user?.id);

  const handleThemeChange = (theme: string) => {
    onThemeToggle(theme);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showMenuButton && (
          <Tooltip content="Toggle sidebar" relationship="label">
            <Button
              icon={<Navigation20Regular />}
              appearance="subtle"
              onClick={onMenuToggle}
              aria-label="Toggle navigation menu"
            />
          </Tooltip>
        )}

        <div className="topbar-search">
          <Input
            placeholder="Search messages, files, people..."
            value={searchValue}
            onChange={(_, data) => setSearchValue(data.value)}
            contentBefore={<SearchRegular />}
            aria-label="Global search"
          />
        </div>
      </div>

      <div className="topbar-right">
        {/* Status Indicator */}
        <Tooltip content="Online" relationship="label">
          <Badge color="success" appearance="filled" />
        </Tooltip>

        {/* Notifications */}
        <Tooltip content="Notifications" relationship="label">
          <Button
            icon={<>🔔</>}
            appearance="subtle"
            onClick={openNotificationPanel}
            aria-label="Open notifications"
            style={{ position: 'relative' }}
          >
            {unreadCount && unreadCount > 0 && (
              <NotificationBadge count={unreadCount} />
            )}
          </Button>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip content="Theme settings" relationship="label">
          <Button
            icon={currentTheme === 'dark' ? <WeatherMoon20Regular /> : <Lightbulb20Regular />}
            appearance="subtle"
            onClick={() => handleThemeChange(currentTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Theme toggle"
          />
        </Tooltip>

        {/* User Profile Menu */}
        <Menu>
          <MenuTrigger>
            <Button
              icon={<Person20Regular />}
              appearance="subtle"
              aria-label={`User menu for ${user?.email || 'User'}`}
            />
          </MenuTrigger>

          <MenuPopover>
            <MenuList>
              <MenuItem disabled>
                <div className="menu-header">
                  <strong>{user?.email || 'User'}</strong>
                  <small>{user?.email || 'user@example.com'}</small>
                </div>
              </MenuItem>
              <MenuItem icon={<Settings20Regular />} onClick={() => {}}>
                Settings
              </MenuItem>
              <MenuItem icon={<Info20Regular />} onClick={() => {}}>
                About FusionDesk
              </MenuItem>
              <MenuItem icon={<SignOut20Regular />} className="menu-danger">
                Sign Out
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </header>
  );
};
