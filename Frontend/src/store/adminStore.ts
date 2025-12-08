/**
 * Admin Console Zustand Store
 * UI state management for admin interface
 */

import { create } from 'zustand';
import {
  AdminUIState,
  TenantStatus,
  TenantPlan,
  UserRole,
  UserStatus,
  Tenant,
  AdminUser,
} from '../types/admin';

interface AdminStoreState {
  // Main navigation and views
  currentView: 'dashboard' | 'tenants' | 'users' | 'billing' | 'system' | 'plugins' | 'analytics';
  previousView?: string;

  // Selection state
  selectedTenantId?: string;
  selectedTenant?: Tenant;
  selectedUserId?: string;
  selectedUser?: AdminUser;
  selectedTenantIds: string[]; // For bulk operations
  selectedUserIds: string[]; // For bulk operations

  // UI state
  sidebarCollapsed: boolean;
  notificationsPanelOpen: boolean;
  settingsPanelOpen: boolean;
  searchOpen: boolean;

  // Filters
  tenantFilters: {
    status: TenantStatus[];
    plan: TenantPlan[];
    searchTerm: string;
    mrrRange: [number, number];
    sortBy: 'created' | 'name' | 'mrr' | 'users' | 'activity';
    sortOrder: 'asc' | 'desc';
  };

  userFilters: {
    tenantId?: string;
    role: UserRole[];
    status: UserStatus[];
    searchTerm: string;
    sortBy: 'created' | 'name' | 'email' | 'lastActive' | 'status';
    sortOrder: 'asc' | 'desc';
  };

  // Pagination
  tenantPageSize: number;
  tenantCurrentPage: number;
  userPageSize: number;
  userCurrentPage: number;
  systemLogsPageSize: number;
  systemLogsCurrentPage: number;
  auditLogsPageSize: number;
  auditLogsCurrentPage: number;

  // Modal state
  createTenantModalOpen: boolean;
  createUserModalOpen: boolean;
  tenantDetailsModalOpen: boolean;
  userDetailsModalOpen: boolean;
  bulkActionModalOpen: boolean;
  systemConfigModalOpen: boolean;
  pluginMarketplaceModalOpen: boolean;
  complianceReportModalOpen: boolean;

  // Bulk action state
  bulkActionType?: 'suspend' | 'activate' | 'delete' | 'change_plan' | 'reset_password' | 'export';
  bulkActionInProgress: boolean;
  bulkActionProgress: number; // 0-100

  // Date range for analytics/reports
  dateRangeStart: Date;
  dateRangeEnd: Date;

  // View preferences
  tenantListViewMode: 'table' | 'grid' | 'card';
  userListViewMode: 'table' | 'grid' | 'card';
  systemDetailLevel: 'basic' | 'detailed' | 'expert';

  // Preferences
  darkMode: boolean;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // milliseconds

  // Actions
  setCurrentView: (view: AdminStoreState['currentView']) => void;
  setPreviousView: (view: string) => void;
  setSelectedTenant: (tenantId: string, tenant?: Tenant) => void;
  clearSelectedTenant: () => void;
  setSelectedUser: (userId: string, user?: AdminUser) => void;
  clearSelectedUser: () => void;
  toggleTenantSelection: (tenantId: string) => void;
  toggleUserSelection: (userId: string) => void;
  clearTenantSelections: () => void;
  clearUserSelections: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleNotificationsPanel: () => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  toggleSettingsPanel: () => void;
  setSettingsPanelOpen: (open: boolean) => void;
  toggleSearchOpen: () => void;
  setSearchOpen: (open: boolean) => void;

  // Filter actions
  setTenantFilters: (filters: Partial<AdminStoreState['tenantFilters']>) => void;
  resetTenantFilters: () => void;
  setUserFilters: (filters: Partial<AdminStoreState['userFilters']>) => void;
  resetUserFilters: () => void;

  // Pagination actions
  setTenantPagination: (page: number, pageSize: number) => void;
  setUserPagination: (page: number, pageSize: number) => void;
  setSystemLogsPagination: (page: number, pageSize: number) => void;
  setAuditLogsPagination: (page: number, pageSize: number) => void;

  // Modal actions
  openCreateTenantModal: () => void;
  closeCreateTenantModal: () => void;
  openCreateUserModal: () => void;
  closeCreateUserModal: () => void;
  openTenantDetailsModal: () => void;
  closeTenantDetailsModal: () => void;
  openUserDetailsModal: () => void;
  closeUserDetailsModal: () => void;
  openBulkActionModal: (actionType: AdminStoreState['bulkActionType']) => void;
  closeBulkActionModal: () => void;
  openSystemConfigModal: () => void;
  closeSystemConfigModal: () => void;
  openPluginMarketplaceModal: () => void;
  closePluginMarketplaceModal: () => void;
  openComplianceReportModal: () => void;
  closeComplianceReportModal: () => void;

  // Bulk action state
  setBulkActionInProgress: (inProgress: boolean, progress?: number) => void;
  setBulkActionProgress: (progress: number) => void;

  // Date range actions
  setDateRange: (start: Date, end: Date) => void;

  // View preference actions
  setTenantListViewMode: (mode: 'table' | 'grid' | 'card') => void;
  setUserListViewMode: (mode: 'table' | 'grid' | 'card') => void;
  setSystemDetailLevel: (level: 'basic' | 'detailed' | 'expert') => void;

  // Preference actions
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean, interval?: number) => void;

  // Utility
  saveUIState: () => AdminUIState;
  loadUIState: (state: AdminUIState) => void;
}

const defaultTenantFilters = {
  status: ['active'] as TenantStatus[],
  plan: [] as TenantPlan[],
  searchTerm: '',
  mrrRange: [0, 100000] as [number, number],
  sortBy: 'activity' as const,
  sortOrder: 'desc' as const,
};

const defaultUserFilters = {
  role: [] as UserRole[],
  status: ['active'] as UserStatus[],
  searchTerm: '',
  sortBy: 'lastActive' as const,
  sortOrder: 'desc' as const,
};

export const useAdminStore = create<AdminStoreState>((set, get) => ({
  currentView: 'dashboard',
  selectedTenantIds: [],
  selectedUserIds: [],
  sidebarCollapsed: false,
  notificationsPanelOpen: false,
  settingsPanelOpen: false,
  searchOpen: false,

  tenantFilters: defaultTenantFilters,
  userFilters: defaultUserFilters,

  tenantPageSize: 20,
  tenantCurrentPage: 0,
  userPageSize: 20,
  userCurrentPage: 0,
  systemLogsPageSize: 50,
  systemLogsCurrentPage: 0,
  auditLogsPageSize: 50,
  auditLogsCurrentPage: 0,

  createTenantModalOpen: false,
  createUserModalOpen: false,
  tenantDetailsModalOpen: false,
  userDetailsModalOpen: false,
  bulkActionModalOpen: false,
  systemConfigModalOpen: false,
  pluginMarketplaceModalOpen: false,
  complianceReportModalOpen: false,

  bulkActionInProgress: false,
  bulkActionProgress: 0,

  dateRangeStart: (() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  })(),
  dateRangeEnd: new Date(),

  tenantListViewMode: 'table',
  userListViewMode: 'table',
  systemDetailLevel: 'basic',

  darkMode: false,
  autoRefreshEnabled: true,
  autoRefreshInterval: 30000,

  // Navigation actions
  setCurrentView: (view) => set({ currentView: view }),
  setPreviousView: (view) => set({ previousView: view }),

  // Selection actions
  setSelectedTenant: (tenantId, tenant) =>
    set({ selectedTenantId: tenantId, selectedTenant: tenant }),
  clearSelectedTenant: () => set({ selectedTenantId: undefined, selectedTenant: undefined }),
  setSelectedUser: (userId, user) => set({ selectedUserId: userId, selectedUser: user }),
  clearSelectedUser: () => set({ selectedUserId: undefined, selectedUser: undefined }),

  toggleTenantSelection: (tenantId) =>
    set((state) => {
      const ids = state.selectedTenantIds.includes(tenantId)
        ? state.selectedTenantIds.filter((id) => id !== tenantId)
        : [...state.selectedTenantIds, tenantId];
      return { selectedTenantIds: ids };
    }),

  toggleUserSelection: (userId) =>
    set((state) => {
      const ids = state.selectedUserIds.includes(userId)
        ? state.selectedUserIds.filter((id) => id !== userId)
        : [...state.selectedUserIds, userId];
      return { selectedUserIds: ids };
    }),

  clearTenantSelections: () => set({ selectedTenantIds: [] }),
  clearUserSelections: () => set({ selectedUserIds: [] }),

  // Panel actions
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleNotificationsPanel: () =>
    set((state) => ({ notificationsPanelOpen: !state.notificationsPanelOpen })),
  setNotificationsPanelOpen: (open) => set({ notificationsPanelOpen: open }),
  toggleSettingsPanel: () =>
    set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen })),
  setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),
  toggleSearchOpen: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Filter actions
  setTenantFilters: (filters) =>
    set((state) => ({
      tenantFilters: { ...state.tenantFilters, ...filters },
      tenantCurrentPage: 0, // Reset to first page when filters change
    })),
  resetTenantFilters: () =>
    set({
      tenantFilters: defaultTenantFilters,
      tenantCurrentPage: 0,
    }),
  setUserFilters: (filters) =>
    set((state) => ({
      userFilters: { ...state.userFilters, ...filters },
      userCurrentPage: 0,
    })),
  resetUserFilters: () =>
    set({
      userFilters: defaultUserFilters,
      userCurrentPage: 0,
    }),

  // Pagination actions
  setTenantPagination: (page, pageSize) =>
    set({ tenantCurrentPage: page, tenantPageSize: pageSize }),
  setUserPagination: (page, pageSize) =>
    set({ userCurrentPage: page, userPageSize: pageSize }),
  setSystemLogsPagination: (page, pageSize) =>
    set({ systemLogsCurrentPage: page, systemLogsPageSize: pageSize }),
  setAuditLogsPagination: (page, pageSize) =>
    set({ auditLogsCurrentPage: page, auditLogsPageSize: pageSize }),

  // Modal actions
  openCreateTenantModal: () => set({ createTenantModalOpen: true }),
  closeCreateTenantModal: () => set({ createTenantModalOpen: false }),
  openCreateUserModal: () => set({ createUserModalOpen: true }),
  closeCreateUserModal: () => set({ createUserModalOpen: false }),
  openTenantDetailsModal: () => set({ tenantDetailsModalOpen: true }),
  closeTenantDetailsModal: () => set({ tenantDetailsModalOpen: false }),
  openUserDetailsModal: () => set({ userDetailsModalOpen: true }),
  closeUserDetailsModal: () => set({ userDetailsModalOpen: false }),
  openBulkActionModal: (actionType) =>
    set({ bulkActionModalOpen: true, bulkActionType: actionType }),
  closeBulkActionModal: () =>
    set({
      bulkActionModalOpen: false,
      bulkActionType: undefined,
      bulkActionInProgress: false,
      bulkActionProgress: 0,
    }),
  openSystemConfigModal: () => set({ systemConfigModalOpen: true }),
  closeSystemConfigModal: () => set({ systemConfigModalOpen: false }),
  openPluginMarketplaceModal: () => set({ pluginMarketplaceModalOpen: true }),
  closePluginMarketplaceModal: () => set({ pluginMarketplaceModalOpen: false }),
  openComplianceReportModal: () => set({ complianceReportModalOpen: true }),
  closeComplianceReportModal: () => set({ complianceReportModalOpen: false }),

  // Bulk action state
  setBulkActionInProgress: (inProgress, progress) =>
    set({
      bulkActionInProgress: inProgress,
      bulkActionProgress: progress ?? 0,
    }),
  setBulkActionProgress: (progress) => set({ bulkActionProgress: progress }),

  // Date range
  setDateRange: (start, end) => set({ dateRangeStart: start, dateRangeEnd: end }),

  // View preferences
  setTenantListViewMode: (mode) => set({ tenantListViewMode: mode }),
  setUserListViewMode: (mode) => set({ userListViewMode: mode }),
  setSystemDetailLevel: (level) => set({ systemDetailLevel: level }),

  // Preferences
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setDarkMode: (enabled) => set({ darkMode: enabled }),
  setAutoRefresh: (enabled, interval) =>
    set({
      autoRefreshEnabled: enabled,
      autoRefreshInterval: interval ?? 30000,
    }),

  // Utility
  saveUIState: () => {
    const state = get();
    return {
      currentView: state.currentView,
      selectedTenantId: state.selectedTenantId,
      selectedUserId: state.selectedUserId,
      sidebarCollapsed: state.sidebarCollapsed,
      notificationsPanelOpen: state.notificationsPanelOpen,
      filters: {
        tenantStatus: state.tenantFilters.status,
        tenantPlan: state.tenantFilters.plan,
        userRole: state.userFilters.role,
        userStatus: state.userFilters.status,
        dateRange: {
          start: state.dateRangeStart,
          end: state.dateRangeEnd,
        },
      },
      sortBy: state.tenantFilters.sortBy,
      pageSize: state.tenantPageSize,
      currentPage: state.tenantCurrentPage,
    } as AdminUIState;
  },

  loadUIState: (state: AdminUIState) => {
    set({
      currentView: state.currentView,
      selectedTenantId: state.selectedTenantId,
      selectedUserId: state.selectedUserId,
      sidebarCollapsed: state.sidebarCollapsed,
      notificationsPanelOpen: state.notificationsPanelOpen,
      tenantFilters: {
        ...defaultTenantFilters,
        status: state.filters?.tenantStatus || defaultTenantFilters.status,
        plan: state.filters?.tenantPlan || defaultTenantFilters.plan,
      },
      userFilters: {
        ...defaultUserFilters,
        role: state.filters?.userRole || defaultUserFilters.role,
        status: state.filters?.userStatus || defaultUserFilters.status,
      },
      dateRangeStart: state.filters?.dateRange?.start || new Date(),
      dateRangeEnd: state.filters?.dateRange?.end || new Date(),
      tenantPageSize: state.pageSize || 20,
      tenantCurrentPage: state.currentPage || 0,
    });
  },
}));
