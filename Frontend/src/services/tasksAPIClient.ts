/**
 * Tasks API Integration
 * Task management microservice with collaborative drag-drop and subtasks
 */

import { getApiClient, useApi, useMutateApi } from '@/lib/api-client';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  parent?: string; // parent task ID for subtasks
  subtasks?: Task[];
  labels?: string[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  order: number; // for sorting within column
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface TaskComment {
  id: string;
  author: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mentions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface TaskBoard {
  id: string;
  projectId: string;
  name: string;
  columns: TaskColumn[];
}

export interface TaskColumn {
  id: string;
  name: string;
  status: string;
  tasks: Task[];
}

export interface TaskProject {
  id: string;
  name: string;
  description?: string;
  owner: string;
  members: string[];
  boards: TaskBoard[];
  createdAt: string;
}

export interface TaskBulkUpdate {
  taskIds: string[];
  updates: {
    status?: string;
    priority?: string;
    assignee?: string;
    dueDate?: string;
  };
}

/**
 * Tasks API Client
 */
export class TasksAPIClient {
  private api = getApiClient();
  private ws: Map<string, WebSocket> = new Map();

  /**
   * Get all projects for user
   */
  async getProjects(): Promise<TaskProject[]> {
    return this.api.get('/api/v1/tasks/projects');
  }

  /**
   * Get project details with boards and tasks
   */
  async getProject(projectId: string): Promise<TaskProject> {
    return this.api.get(`/api/v1/tasks/projects/${projectId}`);
  }

  /**
   * Create new project
   */
  async createProject(data: {
    name: string;
    description?: string;
    members?: string[];
  }): Promise<TaskProject> {
    return this.api.post('/api/v1/tasks/projects', data);
  }

  /**
   * Get board with tasks
   */
  async getBoard(boardId: string): Promise<TaskBoard> {
    return this.api.get(`/api/v1/tasks/boards/${boardId}`);
  }

  /**
   * Get all tasks in project
   */
  async getTasks(projectId: string, filter?: {
    status?: string;
    priority?: string;
    assignee?: string;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.priority) params.append('priority', filter.priority);
    if (filter?.assignee) params.append('assignee', filter.assignee);

    return this.api.get(`/api/v1/tasks/projects/${projectId}/tasks?${params}`);
  }

  /**
   * Get task details with subtasks
   */
  async getTask(taskId: string): Promise<Task> {
    return this.api.get(`/api/v1/tasks/${taskId}`);
  }

  /**
   * Get subtasks for a task
   */
  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    return this.api.get(`/api/v1/tasks/${parentTaskId}/subtasks`);
  }

  /**
   * Create new task
   */
  async createTask(data: {
    projectId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    dueDate?: string;
    estimatedHours?: number;
    parent?: string;
    labels?: string[];
  }): Promise<Task> {
    return this.api.post('/api/v1/tasks', data);
  }

  /**
   * Create subtask
   */
  async createSubtask(
    parentTaskId: string,
    data: {
      title: string;
      estimatedHours?: number;
    }
  ): Promise<Task> {
    return this.api.post(`/api/v1/tasks/${parentTaskId}/subtasks`, data);
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    return this.api.put(`/api/v1/tasks/${taskId}`, data);
  }

  /**
   * Update task status (drag-drop)
   */
  async updateTaskStatus(
    taskId: string,
    status: string,
    order: number
  ): Promise<Task> {
    return this.api.patch(`/api/v1/tasks/${taskId}/status`, {
      status,
      order,
    });
  }

  /**
   * Reorder task in column (drag-drop)
   */
  async reorderTask(
    taskId: string,
    boardId: string,
    status: string,
    order: number
  ): Promise<Task> {
    return this.api.patch(`/api/v1/tasks/${taskId}/reorder`, {
      boardId,
      status,
      order,
    });
  }

  /**
   * Complete task
   */
  async completeTask(taskId: string): Promise<Task> {
    return this.api.patch(`/api/v1/tasks/${taskId}`, {
      status: 'done',
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    return this.api.delete(`/api/v1/tasks/${taskId}`);
  }

  /**
   * Assign task to user
   */
  async assignTask(taskId: string, assignee: string): Promise<Task> {
    return this.api.patch(`/api/v1/tasks/${taskId}`, { assignee });
  }

  /**
   * Bulk update tasks
   */
  async bulkUpdateTasks(update: TaskBulkUpdate): Promise<{ updated: number }> {
    return this.api.post('/api/v1/tasks/bulk-update', update);
  }

  /**
   * Add comment to task
   */
  async addComment(taskId: string, content: string, mentions?: string[]): Promise<TaskComment> {
    return this.api.post(`/api/v1/tasks/${taskId}/comments`, {
      content,
      mentions,
    });
  }

  /**
   * Update comment
   */
  async updateComment(taskId: string, commentId: string, content: string): Promise<TaskComment> {
    return this.api.patch(`/api/v1/tasks/${taskId}/comments/${commentId}`, {
      content,
    });
  }

  /**
   * Delete comment
   */
  async deleteComment(taskId: string, commentId: string): Promise<void> {
    return this.api.delete(`/api/v1/tasks/${taskId}/comments/${commentId}`);
  }

  /**
   * Upload task attachment
   */
  async uploadAttachment(taskId: string, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.getClient().post(
      `/api/v1/tasks/${taskId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Subscribe to project updates via WebSocket
   */
  subscribeToProject(
    projectId: string,
    onUpdate: (update: { type: string; task: Task }) => void,
    onError?: (error: Error) => void
  ): () => void {
    const wsUrl = `${this.api.getClient().defaults.baseURL?.replace(/^http/, 'ws')}/ws/tasks/${projectId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`✅ Connected to project: ${projectId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (error) {
        console.error('Failed to parse task update:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Task WebSocket error:', error);
      if (onError) {
        onError(new Error('WebSocket connection failed'));
      }
    };

    ws.onclose = () => {
      console.log(`❌ Disconnected from project: ${projectId}`);
      this.ws.delete(projectId);
    };

    this.ws.set(projectId, ws);

    // Return unsubscribe function
    return () => {
      ws.close();
      this.ws.delete(projectId);
    };
  }

  /**
   * Cleanup subscriptions
   */
  unsubscribeAll(): void {
    this.ws.forEach((ws) => {
      ws.close();
    });
    this.ws.clear();
  }
}

/**
 * Export singleton instance
 */
export const tasksAPI = new TasksAPIClient();

/**
 * React hooks for task data
 */

/**
 * Hook to fetch projects
 */
export function useTaskProjects() {
  return useApi(['task-projects'], () => tasksAPI.getProjects(), {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch project with boards
 */
export function useTaskProject(projectId: string) {
  return useApi(['task-project', projectId], () => tasksAPI.getProject(projectId), {
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch board
 */
export function useTaskBoard(boardId: string) {
  return useApi(['task-board', boardId], () => tasksAPI.getBoard(boardId), {
    staleTime: 0, // Always fresh for collaborative updates
    cacheTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all tasks in project
 */
export function useProjectTasks(projectId: string, filter?: {
  status?: string;
  priority?: string;
  assignee?: string;
}) {
  return useApi(
    ['project-tasks', projectId, JSON.stringify(filter)],
    () => tasksAPI.getTasks(projectId, filter),
    {
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
}

/**
 * Hook to fetch single task
 */
export function useTask(taskId: string) {
  return useApi(['task', taskId], () => tasksAPI.getTask(taskId), {
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch subtasks
 */
export function useSubtasks(parentTaskId: string) {
  return useApi(['subtasks', parentTaskId], () => tasksAPI.getSubtasks(parentTaskId), {
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create project
 */
export function useCreateProject() {
  return useMutateApi(
    (data: {
      name: string;
      description?: string;
      members?: string[];
    }) => tasksAPI.createProject(data)
  );
}

/**
 * Hook to create task
 */
export function useCreateTask() {
  return useMutateApi(
    (data: {
      projectId: string;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      assignee?: string;
      dueDate?: string;
      estimatedHours?: number;
      parent?: string;
      labels?: string[];
    }) => tasksAPI.createTask(data)
  );
}

/**
 * Hook to create subtask
 */
export function useCreateSubtask() {
  return useMutateApi(
    ({
      parentTaskId,
      data,
    }: {
      parentTaskId: string;
      data: {
        title: string;
        estimatedHours?: number;
      };
    }) => tasksAPI.createSubtask(parentTaskId, data)
  );
}

/**
 * Hook to update task
 */
export function useUpdateTask() {
  return useMutateApi(
    ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      tasksAPI.updateTask(taskId, data)
  );
}

/**
 * Hook to update task status (drag-drop)
 */
export function useUpdateTaskStatus() {
  return useMutateApi(
    ({ taskId, status, order }: { taskId: string; status: string; order: number }) =>
      tasksAPI.updateTaskStatus(taskId, status, order)
  );
}

/**
 * Hook to reorder task (drag-drop)
 */
export function useReorderTask() {
  return useMutateApi(
    ({
      taskId,
      boardId,
      status,
      order,
    }: {
      taskId: string;
      boardId: string;
      status: string;
      order: number;
    }) => tasksAPI.reorderTask(taskId, boardId, status, order)
  );
}

/**
 * Hook to complete task
 */
export function useCompleteTask() {
  return useMutateApi((taskId: string) => tasksAPI.completeTask(taskId));
}

/**
 * Hook to delete task
 */
export function useDeleteTask() {
  return useMutateApi((taskId: string) => tasksAPI.deleteTask(taskId));
}

/**
 * Hook to assign task
 */
export function useAssignTask() {
  return useMutateApi(
    ({ taskId, assignee }: { taskId: string; assignee: string }) =>
      tasksAPI.assignTask(taskId, assignee)
  );
}

/**
 * Hook to bulk update tasks
 */
export function useBulkUpdateTasks() {
  return useMutateApi((update: TaskBulkUpdate) => tasksAPI.bulkUpdateTasks(update));
}

/**
 * Hook to add comment
 */
export function useAddTaskComment() {
  return useMutateApi(
    ({ taskId, content, mentions }: { taskId: string; content: string; mentions?: string[] }) =>
      tasksAPI.addComment(taskId, content, mentions)
  );
}

/**
 * Hook to upload attachment
 */
export function useUploadTaskAttachment() {
  return useMutateApi(
    ({ taskId, file }: { taskId: string; file: File }) =>
      tasksAPI.uploadAttachment(taskId, file)
  );
}
