import React, { useState } from 'react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onModuleChange }) => {
  const [collapsed, setCollapsed] = useState(false);

  const modules = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'tasks', label: 'Tasks', icon: '✓' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'knowledge', label: 'Knowledge Base', icon: '🧠' },
    { id: 'admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          ☰
        </button>
        {!collapsed && <span className="sidebar-title">Navigation</span>}
      </div>

      <nav className="sidebar-nav">
        {modules.map((module) => (
          <button
            key={module.id}
            className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
            onClick={() => onModuleChange(module.id)}
            title={module.label}
          >
            <span className="nav-icon">{module.icon}</span>
            {!collapsed && <span className="nav-label">{module.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="profile-btn" title="Profile">
          👤
        </button>
      </div>
    </aside>
  );
};
