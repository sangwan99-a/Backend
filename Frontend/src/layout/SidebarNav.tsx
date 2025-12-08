import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Nav,
  NavItem,
  NavDivider,
  Tooltip,
} from '@fluentui/react-components';
import {
  Home20Regular,
  Chat20Regular,
  Mail20Regular,
  Calendar20Regular,
  Checkmark20Regular,
  DocumentMultiple20Regular,
  BookDatabase20Regular,
  Settings20Regular,
} from '@fluentui/react-icons';
import '../styles/sidebar.css';

interface SidebarNavProps {
  onNavigate?: () => void;
}

interface NavModule {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

const modules: NavModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home20Regular />,
    path: '/',
    description: 'Overview and quick actions',
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: <Chat20Regular />,
    path: '/chat',
    description: 'Messages and conversations',
  },
  {
    id: 'email',
    label: 'Email',
    icon: <Mail20Regular />,
    path: '/email',
    description: 'Email management',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <Calendar20Regular />,
    path: '/calendar',
    description: 'Events and scheduling',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: <Checkmark20Regular />,
    path: '/tasks',
    description: 'Task management',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: <DocumentMultiple20Regular />,
    path: '/documents',
    description: 'File and document management',
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: <BookDatabase20Regular />,
    path: '/knowledge',
    description: 'Knowledge base and articles',
  },
];

const adminModules: NavModule[] = [
  {
    id: 'admin',
    label: 'Admin',
    icon: <Settings20Regular />,
    path: '/admin',
    description: 'Administration panel',
  },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = useCallback(
    (path: string, moduleId: string) => {
      navigate(path);
      // Emit analytics or tracking event
      console.log(`Navigated to ${moduleId}`);
      onNavigate?.();
    },
    [navigate, onNavigate]
  );

  const getSelectedValue = (): string => {
    // Map current path to module ID
    const path = location.pathname;
    const module = [...modules, ...adminModules].find((m) => m.path === path);
    return module?.id || 'dashboard';
  };

  return (
    <nav className="sidebar-nav">
      <div className="sidebar-brand">
        <h2>FusionDesk</h2>
      </div>

      <Nav
        selectedValue={getSelectedValue()}
        onSelect={(e: any) => {
          const moduleId = (e.currentTarget as any).value || e.currentTarget.getAttribute('value');
          const module = [...modules, ...adminModules].find(
            (m) => m.id === moduleId
          );
          if (module) {
            handleNavClick(module.path, moduleId);
          }
        }}
        aria-label="Main application navigation"
      >
        {/* Primary Modules */}
        {modules.map((module) => (
          <Tooltip
            key={module.id}
            content={module.description}
            relationship="label"
          >
            <NavItem
              value={module.id}
              icon={module.icon as any}
              aria-label={module.description}
            >
              {module.label}
            </NavItem>
          </Tooltip>
        ))}

        <NavDivider />

        {/* Admin Module */}
        {adminModules.map((module) => (
          <Tooltip
            key={module.id}
            content={module.description}
            relationship="label"
          >
            <NavItem
              value={module.id}
              icon={module.icon as any}
              aria-label={module.description}
            >
              {module.label}
            </NavItem>
          </Tooltip>
        ))}
      </Nav>

      {/* Sidebar Footer Info */}
      <div className="sidebar-footer">
        <small>Version 1.0.0</small>
      </div>
    </nav>
  );
};
