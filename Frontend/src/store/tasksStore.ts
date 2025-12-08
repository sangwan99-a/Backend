/**
 * Tasks Zustand Store - UI state management for tasks module
 * 
 * Manages:
 * - View mode (kanban, list, gantt, calendar, my-tasks)
 * - Selected items (project, board, task)
 * - Task creation/editing state
 * - Filtering and sorting
 * - Drag-drop state
 * - Timer state
 * - Sidebar state
 */

import { create } from 'zustand';
import type {
  TasksUIState,
  TaskViewMode,
  TaskFilter,
  TaskSort,
  KanbanDragState,
} from '../types/tasks';

const defaultSort: TaskSort = {
  field: 'dueDate',
  direction: 'asc',
};

const defaultFilter: TaskFilter = {
  showCompleted: false,
};

/**
 * Tasks UI Store
 */
export const tasksStore = create<TasksUIState & {
  setViewMode: (mode: TaskViewMode) => void;
  setSelectedProject: (projectId?: string) => void;
  setSelectedBoard: (boardId?: string) => void;
  setSelectedTask: (taskId?: string) => void;
  openCreateTask: (projectId?: string, boardId?: string) => void;
  closeCreateTask: () => void;
  openEditTask: (taskId: string) => void;
  closeEditTask: () => void;
  toggleTaskSelection: (taskId: string) => void;
  clearTaskSelection: () => void;
  setFilterOpen: (open: boolean) => void;
  setActiveFilter: (filter: TaskFilter) => void;
  setSortBy: (sort: TaskSort) => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  setShowArchived: (show: boolean) => void;
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  setGanttZoom: (zoom: 'day' | 'week' | 'month') => void;
  setSelectedSprint: (sprintId?: string) => void;
}>((set) => ({
  // Initial state
  viewMode: 'kanban',
  selectedProjectId: undefined,
  selectedBoardId: undefined,
  selectedTaskId: undefined,
  isCreateTaskOpen: false,
  isEditTaskOpen: false,
  selectedTasks: [],
  filterOpen: false,
  activeFilter: defaultFilter,
  sortBy: defaultSort,
  searchQuery: '',
  sidebarCollapsed: false,
  showArchived: false,
  timerTaskId: undefined,
  ganttZoom: 'week',
  selectedSprintId: undefined,

  // Actions
  setViewMode: (mode: TaskViewMode) =>
    set({ viewMode: mode }),

  setSelectedProject: (projectId?: string) =>
    set({ selectedProjectId: projectId }),

  setSelectedBoard: (boardId?: string) =>
    set({ selectedBoardId: boardId }),

  setSelectedTask: (taskId?: string) =>
    set({ selectedTaskId: taskId }),

  openCreateTask: (projectId?: string, boardId?: string) =>
    set({
      isCreateTaskOpen: true,
      selectedProjectId: projectId,
      selectedBoardId: boardId,
    }),

  closeCreateTask: () =>
    set({ isCreateTaskOpen: false }),

  openEditTask: (taskId: string) =>
    set({
      isEditTaskOpen: true,
      selectedTaskId: taskId,
    }),

  closeEditTask: () =>
    set({
      isEditTaskOpen: false,
      selectedTaskId: undefined,
    }),

  toggleTaskSelection: (taskId: string) =>
    set((state) => ({
      selectedTasks: state.selectedTasks.includes(taskId)
        ? state.selectedTasks.filter((id) => id !== taskId)
        : [...state.selectedTasks, taskId],
    })),

  clearTaskSelection: () =>
    set({ selectedTasks: [] }),

  setFilterOpen: (open: boolean) =>
    set({ filterOpen: open }),

  setActiveFilter: (filter: TaskFilter) =>
    set({ activeFilter: filter }),

  setSortBy: (sort: TaskSort) =>
    set({ sortBy: sort }),

  setSearchQuery: (query: string) =>
    set({ searchQuery: query }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setShowArchived: (show: boolean) =>
    set({ showArchived: show }),

  startTimer: (taskId: string) =>
    set({ timerTaskId: taskId }),

  stopTimer: () =>
    set({ timerTaskId: undefined }),

  setGanttZoom: (zoom: 'day' | 'week' | 'month') =>
    set({ ganttZoom: zoom }),

  setSelectedSprint: (sprintId?: string) =>
    set({ selectedSprintId: sprintId }),
}));
