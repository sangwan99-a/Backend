/**
 * Tasks Database Service - IndexedDB layer for offline-first task management
 * 
 * Tables:
 * - projects: Project metadata
 * - boards: Kanban/Backlog boards
 * - tasks: Core task data
 * - subtasks: Task breakdowns
 * - comments: Task discussions
 * - attachments: File attachments
 * - timeTracking: Time tracking entries
 * - sprints: Sprint planning data
 * - dependencies: Task relationships
 * - notifications: Task notifications
 */

import Dexie, { Table } from 'dexie';
import type {
  Project,
  Task,
  Board,
  Sprint,
  Comment,
  Attachment,
  TimeTrackingEntry,
  TaskDependency,
  TaskNotification,
  TaskFilter,
  TaskSort,
  Subtask,
} from '../types/tasks';

/**
 * Tasks Database
 */
class TasksDB extends Dexie {
  projects!: Table<Project>;
  boards!: Table<Board>;
  tasks!: Table<Task>;
  comments!: Table<Comment>;
  attachments!: Table<Attachment>;
  timeTracking!: Table<TimeTrackingEntry>;
  sprints!: Table<Sprint>;
  dependencies!: Table<TaskDependency>;
  notifications!: Table<TaskNotification>;

  constructor() {
    super('FusionDeskTasksDB');
    this.version(1).stores({
      projects: 'id, owner, &id',
      boards: 'id, projectId, [projectId+id]',
      tasks: 'id, projectId, boardId, sprintId, status, priority, [projectId+status], [projectId+boardId], [assignedTo+dueDate]',
      comments: 'id, taskId, authorId, [taskId+createdAt]',
      attachments: 'id, taskId, [taskId+uploadedAt]',
      timeTracking: 'id, taskId, userId, [taskId+userId], [userId+startTime]',
      sprints: 'id, projectId, state, [projectId+state]',
      dependencies: 'id, taskId, dependsOnTaskId, [taskId+dependsOnTaskId]',
      notifications: 'id, userId, taskId, read, [userId+read], [userId+createdAt]',
    });
  }
}

export const db = new TasksDB();

/**
 * PROJECT OPERATIONS
 */

export const saveProject = async (project: Project): Promise<string> => {
  return (await db.projects.put(project)) as any as string;
};

export const getProject = async (projectId: string): Promise<Project | undefined> => {
  return db.projects.get(projectId);
};

export const getProjectsByUser = async (userId: string): Promise<Project[]> => {
  return db.projects.where('owner').equals(userId).toArray();
};

export const updateProject = async (
  projectId: string,
  updates: Partial<Project>
): Promise<void> => {
  await db.projects.update(projectId, updates);
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await db.projects.delete(projectId);
  // Cascade delete boards and tasks
  const boards = await db.boards.where('projectId').equals(projectId).toArray();
  for (const board of boards) {
    await deleteBoard(board.id);
  }
};

/**
 * BOARD OPERATIONS
 */

export const saveBoard = async (board: Board): Promise<string> => {
  return (await db.boards.put(board)) as any as string;
};

export const getBoard = async (boardId: string): Promise<Board | undefined> => {
  return db.boards.get(boardId);
};

export const getProjectBoards = async (projectId: string): Promise<Board[]> => {
  return db.boards.where('projectId').equals(projectId).toArray();
};

export const updateBoard = async (boardId: string, updates: Partial<Board>): Promise<void> => {
  await db.boards.update(boardId, updates);
};

export const deleteBoard = async (boardId: string): Promise<void> => {
  await db.boards.delete(boardId);
  // Cascade delete tasks
  const tasks = await db.tasks.where('boardId').equals(boardId).toArray();
  for (const task of tasks) {
    await deleteTask(task.id);
  }
};

/**
 * TASK OPERATIONS
 */

export const saveTask = async (task: Task): Promise<string> => {
  return (await db.tasks.put(task)) as any as string;
};

export const getTask = async (taskId: string): Promise<Task | undefined> => {
  return db.tasks.get(taskId);
};

export const getTasks = async (
  filter?: TaskFilter,
  sort?: TaskSort,
  limit = 1000
): Promise<Task[]> => {
  let query = db.tasks.toCollection();

  if (filter) {
    if (filter.projectIds?.length) {
      query = query.filter((t) => filter.projectIds!.includes(t.projectId));
    }
    if (filter.boardIds?.length) {
      query = query.filter((t) => filter.boardIds!.includes(t.boardId));
    }
    if (filter.status?.length) {
      query = query.filter((t) => filter.status!.includes(t.status));
    }
    if (filter.priority?.length) {
      query = query.filter((t) => filter.priority!.includes(t.priority));
    }
    if (filter.assignedTo?.length) {
      query = query.filter((t) => t.assignedTo.some((a) => filter.assignedTo!.includes(a)));
    }
    if (filter.labels?.length) {
      query = query.filter((t) => t.labels.some((l) => filter.labels!.includes(l)));
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      query = query.filter(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower)
      );
    }
    if (filter.sprintId) {
      query = query.filter((t) => t.sprintId === filter.sprintId);
    }
    if (filter.dueDateRange) {
      const [start, end] = filter.dueDateRange;
      query = query.filter((t) => {
        if (!t.dueDate) return false;
        return t.dueDate >= start && t.dueDate <= end;
      });
    }
    if (!filter.showCompleted) {
      query = query.filter((t) => t.status !== 'done');
    }
  }

  let results = await query.toArray();

  if (sort) {
    results.sort((a, b) => {
      let aVal = a[sort.field as keyof Task] as any;
      let bVal = b[sort.field as keyof Task] as any;

      if (aVal === undefined) aVal = sort.field === 'priority' ? 'P4' : '';
      if (bVal === undefined) bVal = sort.field === 'priority' ? 'P4' : '';

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  return results.slice(0, limit);
};

export const getBoardTasks = async (boardId: string): Promise<Task[]> => {
  return db.tasks.where('boardId').equals(boardId).toArray();
};

export const getProjectTasks = async (projectId: string): Promise<Task[]> => {
  return db.tasks.where('projectId').equals(projectId).toArray();
};

export const getAssignedTasks = async (userId: string): Promise<Task[]> => {
  return db.tasks
    .toCollection()
    .filter((t) => t.assignedTo.includes(userId))
    .toArray();
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  await db.tasks.update(taskId, updates);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await db.tasks.delete(taskId);
  // Cascade delete related data
  await db.comments.where('taskId').equals(taskId).delete();
  await db.attachments.where('taskId').equals(taskId).delete();
  await db.timeTracking.where('taskId').equals(taskId).delete();
  await db.dependencies.where('taskId').equals(taskId).delete();
  await db.notifications.where('taskId').equals(taskId).delete();
};

export const moveTask = async (
  taskId: string,
  boardId: string,
  columnId: string,
  position: number
): Promise<void> => {
  const task = await getTask(taskId);
  if (task) {
    task.boardId = boardId;
    task.status = columnId as any;
    task.columnOrder = position;
    await saveTask(task);
  }
};

export const bulkMoveTasks = async (
  taskIds: string[],
  boardId: string,
  columnId: string,
  status: string
): Promise<void> => {
  const now = new Date().toISOString();
  for (const taskId of taskIds) {
    const task = await getTask(taskId);
    if (task) {
      task.boardId = boardId;
      task.status = status as any;
      task.updatedAt = now;
      await saveTask(task);
    }
  }
};

export const bulkUpdateTasks = async (
  taskIds: string[],
  updates: Partial<Task>
): Promise<void> => {
  const now = new Date().toISOString();
  for (const taskId of taskIds) {
    await db.tasks.update(taskId, {
      ...updates,
      updatedAt: now,
    });
  }
};

/**
 * COMMENT OPERATIONS
 */

export const saveComment = async (comment: Comment): Promise<string> => {
  return (await db.comments.put(comment)) as any as string;
};

export const getTaskComments = async (taskId: string): Promise<Comment[]> => {
  return db.comments.where('taskId').equals(taskId).toArray();
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await db.comments.delete(commentId);
};

/**
 * ATTACHMENT OPERATIONS
 */

export const saveAttachment = async (attachment: Attachment): Promise<string> => {
  return (await db.attachments.put(attachment)) as any as string;
};

export const getTaskAttachments = async (taskId: string): Promise<Attachment[]> => {
  return db.attachments.where('taskId').equals(taskId).toArray();
};

export const deleteAttachment = async (attachmentId: string): Promise<void> => {
  await db.attachments.delete(attachmentId);
};

/**
 * TIME TRACKING OPERATIONS
 */

export const saveTimeEntry = async (entry: TimeTrackingEntry): Promise<string> => {
  return (await db.timeTracking.put(entry)) as any as string;
};

export const getTaskTimeEntries = async (taskId: string): Promise<TimeTrackingEntry[]> => {
  return db.timeTracking.where('taskId').equals(taskId).toArray();
};

export const getUserTimeEntries = async (userId: string): Promise<TimeTrackingEntry[]> => {
  return db.timeTracking.where('userId').equals(userId).toArray();
};

export const getTotalTimeSpent = async (taskId: string): Promise<number> => {
  const entries = await getTaskTimeEntries(taskId);
  return entries.reduce((sum, entry) => sum + entry.duration, 0);
};

/**
 * SPRINT OPERATIONS
 */

export const saveSprint = async (sprint: Sprint): Promise<string> => {
  return (await db.sprints.put(sprint)) as any as string;
};

export const getSprint = async (sprintId: string): Promise<Sprint | undefined> => {
  return db.sprints.get(sprintId);
};

export const getProjectSprints = async (projectId: string): Promise<Sprint[]> => {
  return db.sprints.where('projectId').equals(projectId).toArray();
};

export const updateSprint = async (sprintId: string, updates: Partial<Sprint>): Promise<void> => {
  await db.sprints.update(sprintId, updates);
};

export const deleteSprint = async (sprintId: string): Promise<void> => {
  await db.sprints.delete(sprintId);
};

/**
 * DEPENDENCY OPERATIONS
 */

export const saveDependency = async (dependency: TaskDependency): Promise<string> => {
  return (await db.dependencies.put(dependency)) as any as string;
};

export const getTaskDependencies = async (taskId: string): Promise<TaskDependency[]> => {
  return db.dependencies.where('taskId').equals(taskId).toArray();
};

export const getBlockingDependencies = async (taskId: string): Promise<TaskDependency[]> => {
  return db.dependencies.where('dependsOnTaskId').equals(taskId).toArray();
};

export const deleteDependency = async (dependencyId: string): Promise<void> => {
  await db.dependencies.delete(dependencyId);
};

/**
 * NOTIFICATION OPERATIONS
 */

export const saveNotification = async (notification: TaskNotification): Promise<string> => {
  return (await db.notifications.put(notification)) as any as string;
};

export const getUserNotifications = async (
  userId: string,
  unreadOnly = true
): Promise<TaskNotification[]> => {
  let query = db.notifications.where('userId').equals(userId);
  if (unreadOnly) {
    query = query.filter((n) => !n.read);
  }
  return query.reverse().sortBy('createdAt');
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await db.notifications.update(notificationId, { read: true });
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  const notifications = await db.notifications.where('userId').equals(userId).toArray();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  await db.notifications.bulkPut(updated);
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await db.notifications.delete(notificationId);
};

/**
 * SEARCH OPERATIONS
 */

export const searchTasks = async (query: string, projectId?: string): Promise<Task[]> => {
  const queryLower = query.toLowerCase();
  let results = await db.tasks
    .toCollection()
    .filter(
      (t) =>
        (projectId === undefined || t.projectId === projectId) &&
        (t.title.toLowerCase().includes(queryLower) ||
          t.description.toLowerCase().includes(queryLower))
    )
    .toArray();
  return results.slice(0, 50);
};

/**
 * BULK DELETE OPERATIONS
 */

export const deleteExpiredNotifications = async (beforeDate: string): Promise<number> => {
  const notifications = await db.notifications
    .where('createdAt')
    .below(beforeDate)
    .toArray();
  await db.notifications.bulkDelete(notifications.map((n) => n.id));
  return notifications.length;
};

/**
 * SYNC OPERATIONS
 */

export const getTasksModifiedSince = async (since: string): Promise<Task[]> => {
  return db.tasks.where('updatedAt').aboveOrEqual(since).toArray();
};

export const clearAllData = async (): Promise<void> => {
  await db.delete();
  await db.open();
};
