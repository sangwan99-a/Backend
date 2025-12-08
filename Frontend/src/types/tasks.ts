/**
 * Tasks & Project Management Type Definitions
 * 
 * Comprehensive types for task management, project planning, and collaboration
 */

/**
 * Priority levels for tasks
 */
export type TaskPriority = 'P1' | 'P2' | 'P3' | 'P4';

/**
 * Task status in workflow
 */
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';

/**
 * View mode for task display
 */
export type TaskViewMode = 'kanban' | 'list' | 'gantt' | 'calendar' | 'my-tasks';

/**
 * User role in project
 */
export type ProjectRole = 'admin' | 'editor' | 'viewer' | 'contributor';

/**
 * Task dependency type
 */
export type DependencyType = 'blocks' | 'blocked-by' | 'relates-to' | 'duplicates';

/**
 * Timer state for time tracking
 */
export type TimerState = 'stopped' | 'running' | 'paused';

/**
 * Sprint state
 */
export type SprintState = 'planning' | 'active' | 'completed' | 'archived';

/**
 * Core Task interface
 */
export interface Task {
  id: string;
  projectId: string;
  boardId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string[]; // User IDs
  createdBy: string;
  createdAt: string; // ISO string
  updatedAt: string;
  dueDate?: string; // ISO string
  startDate?: string; // ISO string
  estimatedHours?: number;
  actualHours?: number;
  progress: number; // 0-100, for subtasks
  subtasks: Subtask[];
  labels: string[];
  customFields: CustomFieldValue[];
  attachments: Attachment[];
  comments: Comment[];
  dependencies: TaskDependency[];
  watchers: string[]; // User IDs
  columnOrder?: number; // For ordering in Kanban column
  parentTaskId?: string; // For subtasks
  sprintId?: string;
  color?: string; // Hex color for visual distinction
}

/**
 * Subtask with progress tracking
 */
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Task dependency relationship
 */
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: DependencyType;
  createdAt: string;
}

/**
 * Attachment on task
 */
export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number; // Bytes
  type: string; // MIME type
  uploadedBy: string;
  uploadedAt: string;
}

/**
 * Comment on task with @mentions
 */
export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  mentions: string[]; // User IDs
  attachmentIds: string[];
  createdAt: string;
  updatedAt: string;
  likes: string[]; // User IDs
}

/**
 * Custom field value for extended metadata
 */
export interface CustomFieldValue {
  fieldId: string;
  fieldName: string;
  fieldType: 'text' | 'select' | 'date' | 'number' | 'checkbox';
  value: string | number | boolean | string[];
}

/**
 * Time tracking entry
 */
export interface TimeTrackingEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  duration: number; // Minutes
  description?: string;
  createdAt: string;
}

/**
 * Kanban board column
 */
export interface KanbanColumn {
  id: string;
  boardId: string;
  title: string;
  status: TaskStatus;
  order: number;
  color?: string;
  wip?: number; // Work in progress limit
}

/**
 * Board (like Trello/Asana board)
 */
export interface Board {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: 'kanban' | 'backlog' | 'sprint';
  columns: KanbanColumn[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  order: number;
}

/**
 * Project/Workspace
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  owner: string;
  members: ProjectMember[];
  boards: Board[];
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  settings: ProjectSettings;
}

/**
 * Project member with role
 */
export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  joinedBy: string;
}

/**
 * Project settings
 */
export interface ProjectSettings {
  allowPublicAccess: boolean;
  allowComments: boolean;
  allowAttachments: boolean;
  defaultTaskPriority: TaskPriority;
  estimateType: 'story-points' | 'hours' | 'days';
}

/**
 * Sprint for planning iterations
 */
export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  state: SprintState;
  startDate: string; // ISO string
  endDate: string; // ISO string
  goal?: string;
  tasks: Task[];
  burndownData: BurndownPoint[];
  capacity?: number; // Total estimated hours
  completed?: number; // Completed hours
  createdAt: string;
  updatedAt: string;
}

/**
 * Burndown chart data point
 */
export interface BurndownPoint {
  date: string; // ISO string
  remainingWork: number;
  planned: number;
}

/**
 * Gantt chart task representation
 */
export interface GanttTask {
  id: string;
  name: string;
  start: string; // ISO string
  end: string; // ISO string
  progress: number; // 0-100
  dependencies?: string[]; // Task IDs
  type: 'task' | 'milestone' | 'project';
  assignedTo?: string;
  priority?: TaskPriority;
  color?: string;
}

/**
 * User presence on task (real-time collaboration)
 */
export interface UserPresence {
  userId: string;
  taskId: string;
  action: 'viewing' | 'editing' | 'commenting';
  lastSeen: string; // ISO string
  color?: string;
}

/**
 * Task notification
 */
export interface TaskNotification {
  id: string;
  userId: string;
  taskId: string;
  type: 'assigned' | 'mentioned' | 'commented' | 'due-soon' | 'overdue' | 'unblocked' | 'status-changed';
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

/**
 * Time tracking timer state
 */
export interface TimerSession {
  taskId: string;
  userId: string;
  state: TimerState;
  startTime: string; // ISO string
  pausedDuration: number; // Milliseconds
  sessionStart: string; // ISO string when last resumed
}

/**
 * Task filter for queries
 */
export interface TaskFilter {
  projectIds?: string[];
  boardIds?: string[];
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string[];
  createdBy?: string;
  dueDateRange?: [string, string]; // [start, end] ISO strings
  labels?: string[];
  search?: string;
  sprintId?: string;
  showCompleted?: boolean;
}

/**
 * Task sort options
 */
export interface TaskSort {
  field: 'title' | 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'progress';
  direction: 'asc' | 'desc';
}

/**
 * My Tasks dashboard state
 */
export interface MyTasksState {
  overdueTasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  blockedTasks: Task[];
  assignedToMe: Task[];
  createdByMe: Task[];
}

/**
 * Project template for quick setup
 */
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultBoards: Omit<Board, 'id' | 'projectId' | 'createdAt' | 'createdBy'>[];
  defaultSprints?: Omit<Sprint, 'id' | 'projectId' | 'tasks' | 'burndownData' | 'createdAt' | 'updatedAt'>[];
  defaultLabels: string[];
  defaultCustomFields?: Array<{
    name: string;
    type: 'text' | 'select' | 'date' | 'number' | 'checkbox';
    options?: string[];
  }>;
}

/**
 * Tasks module UI state
 */
export interface TasksUIState {
  viewMode: TaskViewMode;
  selectedProjectId?: string;
  selectedBoardId?: string;
  selectedTaskId?: string;
  isCreateTaskOpen: boolean;
  isEditTaskOpen: boolean;
  selectedTasks: string[]; // IDs for bulk operations
  filterOpen: boolean;
  activeFilter: TaskFilter;
  sortBy: TaskSort;
  searchQuery: string;
  sidebarCollapsed: boolean;
  showArchived: boolean;
  timerTaskId?: string;
  ganttZoom: 'day' | 'week' | 'month';
  selectedSprintId?: string;
}

/**
 * Drag operation context for Kanban
 */
export interface KanbanDragState {
  draggedTaskId: string;
  sourceColumnId: string;
  sourcePosition: number;
  targetColumnId?: string;
  targetPosition?: number;
  offsetY?: number;
}

/**
 * API request/response types
 */
export interface CreateTaskRequest {
  projectId: string;
  boardId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedTo?: string[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  labels?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
}

export interface MoveTaskRequest {
  taskId: string;
  targetBoardId: string;
  targetColumnId: string;
  position: number;
}

export interface BulkMoveTasksRequest {
  taskIds: string[];
  targetBoardId: string;
  targetColumnId: string;
  targetStatus: TaskStatus;
}

export interface ProjectSearchResult {
  projects: Project[];
  boards: Board[];
  tasks: Task[];
  total: number;
}
