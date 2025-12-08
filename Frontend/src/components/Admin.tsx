/**
 * Admin Console Main Component
 * Comprehensive admin interface for tenant, user, and system management
 */

import React, { useEffect, useState } from 'react';
import {
  Button,
  Spinner,
  Input,
  Text,
  Badge,
  Tab,
  TabList,
} from '@fluentui/react-components';
import { useAdminStore } from '../store/adminStore';
import {
  useTenants,
  useUsers,
  usePermissions,
  useRoles,
  useTenant,
} from '../hooks/useAdminData';
import '../styles/admin.css';

interface AdminComponentProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'tenant_admin';
  };
}

/**
 * Admin Console Main Component
 */
export const Admin: React.FC<AdminComponentProps> = ({ currentUser }) => {
  const adminStore = useAdminStore();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

  // Data hooks
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants(
    {
      limit: adminStore.tenantPageSize,
      offset: adminStore.tenantCurrentPage * adminStore.tenantPageSize,
      status: adminStore.tenantFilters.status,
      plan: adminStore.tenantFilters.plan,
      search: adminStore.tenantFilters.searchTerm || undefined,
      sortBy: adminStore.tenantFilters.sortBy,
      sortOrder: adminStore.tenantFilters.sortOrder,
    },
    adminStore.currentView === 'tenants'
  );

  const { data: usersData, isLoading: usersLoading } = useUsers(
    {
      tenantId: adminStore.userFilters.tenantId,
      limit: adminStore.userPageSize,
      offset: adminStore.userCurrentPage * adminStore.userPageSize,
      role: adminStore.userFilters.role?.[0],
    },
    adminStore.currentView === 'users'
  );

  // System data - initialize with empty defaults since they're not in store
  const systemMetrics = null;
  const metricsLoading = false;

  const services: any[] = [];
  const servicesLoading = false;

  const plugins: any[] = [];
  const pluginsLoading = false;

  const auditLogsData = { items: [], total: 0 };

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation items
  const navItems = [
    { name: 'Dashboard', key: 'dashboard' },
    { name: 'Tenants', key: 'tenants' },
    { name: 'Users', key: 'users' },
    { name: 'System', key: 'system' },
  ];

  // Command bar items (top actions)
  const commandBarItems = [
    { key: 'search', text: 'Search' },
    { key: 'refresh', text: 'Refresh' },
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // G T -> Tenants
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea')) {
          adminStore.setCurrentView('tenants');
        }
      }

      // G U -> Users
      if (e.key === 'u' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea')) {
          adminStore.setCurrentView('users');
        }
      }

      // Cmd/Ctrl + K -> Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        adminStore.toggleSearchOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render content based on current view
  const renderContent = () => {
    switch (adminStore.currentView) {
      case 'dashboard':
        return (
          <div className="admin-dashboard">
            <h2>Dashboard</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{tenantsData?.total || 0}</div>
                <div className="metric-label">Active Tenants</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{usersData?.total || 0}</div>
                <div className="metric-label">Total Users</div>
              </div>
            </div>
          </div>
        );

      case 'tenants':
        return (
          <div className="admin-tenants">
            <h2>Tenant Management</h2>
            {tenantsLoading ? (
              <Spinner />
            ) : (
              <div className="tenants-list">
                {(tenantsData?.items || []).length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tenantsData?.items || []).map((tenant: any) => (
                        <tr key={tenant.id}>
                          <td>{tenant.name}</td>
                          <td><Badge>{tenant.status}</Badge></td>
                          <td>{tenant.userCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Text>No tenants found</Text>
                )}
              </div>
            )}
          </div>
        );

      case 'users':
        return (
          <div className="admin-users">
            <h2>User Management</h2>
            {usersLoading ? (
              <Spinner />
            ) : (
              <div className="users-list">
                {(usersData?.items || []).length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(usersData?.items || []).map((user: any) => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td><Badge>{user.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Text>No users found</Text>
                )}
              </div>
            )}
          </div>
        );

      case 'system':
        return (
          <div className="admin-system">
            <h2>System Management</h2>
            <div className="system-status">
              <div>Services: {services.length}</div>
              <div>Plugins: {plugins.length}</div>
            </div>
          </div>
        );

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="admin-console">
      <div className="admin-header">
        <h1>Admin Console</h1>
        <Text>{currentUser.name} ({currentUser.role})</Text>
      </div>

      <div className="admin-nav">
        <div className="nav-tabs">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => adminStore.setCurrentView(item.key as any)}
              className={`nav-tab ${adminStore.currentView === item.key ? 'active' : ''}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-content">
        {renderContent()}
      </div>
    </div>
  );
};
