/**
 * Tasks React Query Hooks - Server state management for task operations
 * 
 * Provides:
 * - Query hooks for fetching projects, boards, tasks, sprints
 * - Mutation hooks for creating/updating/deleting tasks
 * - Optimistic updates for responsive UX
 * - Automatic fallback to IndexedDB on network errors
 * - Real-time sync with cache invalidation
 */

import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import {
  saveProject,
  saveBoard,
  saveTask,
  getTask,
  getTasks,
  getProjectTasks,
  getAssignedTasks,
  updateTask as updateTaskDb,
  deleteTask as deleteTaskDb,
  saveComment,
  getTaskComments,
  saveAttachment,
  getTaskAttachments,
  saveTimeEntry,
  getTotalTimeSpent,
  saveSprint,
  saveDependency,
  saveNotification,
  moveTask as moveTaskDb,
  bulkMoveTasks as bulkMoveTasksDb,
} from '../services/tasksDatabase';
import type {
  Project,
  Task,
  Board,
  Sprint,
  Comment,
  Attachment,
  TimeTrackingEntry,
  TaskFilter,
  TaskSort,
  TaskNotification,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  BulkMoveTasksRequest,
} from '../types/tasks';

const API_BASE = '/api/v1';

/**
 * PROJECT QUERIES
 */

export const useProjects = (userId?: string) => {
  return useQuery(['projects', userId], async () => {
    try {
      const response = await axios.get(`${API_BASE}/projects`, {
        params: { userId },
      });
      return response.data as Project[];
    } catch (error) {
      console.warn('Failed to fetch projects from API, using cache:', error);
      throw error;
    }
  });
};

export const useProject = (projectId?: string) => {
  return useQuery(
    ['project', projectId],
    async () => {
      if (!projectId) return null;
      try {
        const response = await axios.get(`${API_BASE}/projects/${projectId}`);
        return response.data as Project;
      } catch (error) {
        console.warn('Failed to fetch project from API, using cache:', error);
        throw error;
      }
    },
    { enabled: !!projectId }
  );
};

/**
 * BOARD QUERIES
 */

export const useProjectBoards = (projectId?: string) => {
  return useQuery(
    ['boards', projectId],
    async () => {
      if (!projectId) return [];
      try {
        const response = await axios.get(`${API_BASE}/projects/${projectId}/boards`);
        return response.data as Board[];
      } catch (error) {
        console.warn('Failed to fetch boards from API, using cache:', error);
        throw error;
      }
    },
    { enabled: !!projectId }
  );
};

/**
 * TASK QUERIES
 */

export const useTasks = (filter?: TaskFilter, sort?: TaskSort) => {
  return useQuery(
    ['tasks', filter, sort],
    async () => {
      try {
        const response = await axios.get(`${API_BASE}/tasks`, {
          params: {
            projectIds: filter?.projectIds?.join(','),
            boardIds: filter?.boardIds?.join(','),
            status: filter?.status?.join(','),
            priority: filter?.priority?.join(','),
            assignedTo: filter?.assignedTo?.join(','),
            search: filter?.search,
            sprintId: filter?.sprintId,
            sortBy: sort?.field,
            sortDir: sort?.direction,
          },
        });
        return response.data as Task[];
      } catch (error) {
        console.warn('Failed to fetch tasks from API, using cache:', error);
        return getTasks(filter, sort);
      }
    }
  );
};

export const useTask = (taskId?: string) => {
  return useQuery(
    ['task', taskId],
    async () => {
      if (!taskId) return null;
      try {
        const response = await axios.get(`${API_BASE}/tasks/${taskId}`);
        return response.data as Task;
      } catch (error) {
        console.warn('Failed to fetch task from API, using cache:', error);
        return getTask(taskId);
      }
    },
    { enabled: !!taskId }
  );
};

export const useProjectTasks = (projectId?: string) => {
  return useQuery(
    ['projectTasks', projectId],
    async () => {
      if (!projectId) return [];
      try {
        const response = await axios.get(`${API_BASE}/projects/${projectId}/tasks`);
        return response.data as Task[];
      } catch (error) {
        console.warn('Failed to fetch project tasks, using cache:', error);
        return getProjectTasks(projectId);
      }
    },
    { enabled: !!projectId }
  );
};

export const useAssignedTasks = (userId?: string) => {
  return useQuery(
    ['assignedTasks', userId],
    async () => {
      if (!userId) return [];
      try {
        const response = await axios.get(`${API_BASE}/users/${userId}/tasks`);
        return response.data as Task[];
      } catch (error) {
        console.warn('Failed to fetch assigned tasks, using cache:', error);
        return getAssignedTasks(userId);
      }
    },
    { enabled: !!userId }
  );
};

export const useSearchTasks = (query?: string, projectId?: string) => {
  return useQuery(
    ['searchTasks', query, projectId],
    async () => {
      if (!query) return [];
      try {
        const response = await axios.get(`${API_BASE}/tasks/search`, {
          params: { query, projectId },
        });
        return response.data as Task[];
      } catch (error) {
        console.warn('Failed to search tasks, using local search:', error);
        const tasks = await getTasks();
        return tasks.filter((t) =>
          t.title.toLowerCase().includes(query.toLowerCase())
        );
      }
    },
    { enabled: !!query }
  );
};

/**
 * TASK MUTATIONS
 */

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (request: CreateTaskRequest) => {
      const response = await axios.post(`${API_BASE}/tasks`, request);
      return response.data as Task;
    },
    {
      onMutate: async (request) => {
        // Optimistic update
        const newTask: Task = {
          id: `temp-${Date.now()}`,
          projectId: request.projectId,
          boardId: request.boardId,
          title: request.title,
          description: request.description || '',
          status: 'todo',
          priority: request.priority || 'P3',
          assignedTo: request.assignedTo || [],
          createdBy: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: request.dueDate,
          startDate: request.startDate,
          estimatedHours: request.estimatedHours,
          progress: 0,
          subtasks: [],
          labels: request.labels || [],
          customFields: [],
          attachments: [],
          comments: [],
          dependencies: [],
          watchers: [],
        };

        await saveTask(newTask);

        queryClient.setQueryData(['tasks', {}], (old: Task[] | undefined) => {
          return [...(old || []), newTask];
        });

        return { newTask };
      },
      onError: (error, request, context) => {
        console.error('Failed to create task:', error);
        if (context?.newTask) {
          queryClient.setQueryData(['tasks', {}], (old: Task[] | undefined) => {
            return (old || []).filter((t) => t.id !== context.newTask.id);
          });
        }
      },
      onSuccess: async (task) => {
        await saveTask(task);
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['projectTasks']);
        queryClient.invalidateQueries(['assignedTasks']);
      },
    }
  );
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ taskId, updates }: { taskId: string; updates: UpdateTaskRequest }) => {
      const response = await axios.put(`${API_BASE}/tasks/${taskId}`, updates);
      return response.data as Task;
    },
    {
      onMutate: async ({ taskId, updates }) => {
        const oldTask = await getTask(taskId);
        const updatedTask = { ...oldTask, ...updates, updatedAt: new Date().toISOString() } as Task;
        await updateTaskDb(taskId, updatedTask);

        queryClient.setQueryData(['task', taskId], updatedTask);

        return { oldTask };
      },
      onError: (error, { taskId }, context) => {
        console.error('Failed to update task:', error);
        if (context?.oldTask) {
          queryClient.setQueryData(['task', taskId], context.oldTask);
        }
      },
      onSuccess: async (task) => {
        await saveTask(task);
        queryClient.invalidateQueries(['task', task.id]);
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['projectTasks', task.projectId]);
      },
    }
  );
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (taskId: string) => {
      await axios.delete(`${API_BASE}/tasks/${taskId}`);
    },
    {
      onMutate: async (taskId) => {
        const oldTask = await getTask(taskId);
        await deleteTaskDb(taskId);

        queryClient.setQueryData(['tasks', {}], (old: Task[] | undefined) => {
          return (old || []).filter((t) => t.id !== taskId);
        });

        return { oldTask };
      },
      onError: (error, taskId, context) => {
        console.error('Failed to delete task:', error);
        if (context?.oldTask) {
          queryClient.setQueryData(['task', taskId], context.oldTask);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['projectTasks']);
      },
    }
  );
};

export const useMoveTask = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (request: MoveTaskRequest) => {
      const response = await axios.post(`${API_BASE}/tasks/${request.taskId}/move`, {
        boardId: request.targetBoardId,
        columnId: request.targetColumnId,
        position: request.position,
      });
      return response.data as Task;
    },
    {
      onMutate: async (request) => {
        const oldTask = await getTask(request.taskId);
        await moveTaskDb(request.taskId, request.targetBoardId, request.targetColumnId, request.position);

        const updatedTask = {
          ...oldTask,
          boardId: request.targetBoardId,
          status: request.targetColumnId as any,
          columnOrder: request.position,
        } as Task;

        queryClient.setQueryData(['task', request.taskId], updatedTask);

        return { oldTask };
      },
      onError: (error, request, context) => {
        console.error('Failed to move task:', error);
        if (context?.oldTask) {
          queryClient.setQueryData(['task', request.taskId], context.oldTask);
        }
      },
      onSuccess: (task) => {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['projectTasks', task.projectId]);
      },
    }
  );
};

export const useBulkMoveTasks = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (request: BulkMoveTasksRequest) => {
      await axios.post(`${API_BASE}/tasks/bulk-move`, request);
    },
    {
      onMutate: async (request) => {
        await bulkMoveTasksDb(request.taskIds, request.targetBoardId, request.targetColumnId, request.targetStatus);
      },
      onError: () => {
        console.error('Failed to bulk move tasks');
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['projectTasks']);
      },
    }
  );
};

/**
 * COMMENT MUTATIONS
 */

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ taskId, content }: { taskId: string; content: string }) => {
      const response = await axios.post(`${API_BASE}/tasks/${taskId}/comments`, { content });
      return response.data as Comment;
    },
    {
      onSuccess: (comment) => {
        saveComment(comment);
        queryClient.invalidateQueries(['taskComments', comment.taskId]);
      },
    }
  );
};

export const useTaskComments = (taskId?: string) => {
  return useQuery(
    ['taskComments', taskId],
    async () => {
      if (!taskId) return [];
      try {
        const response = await axios.get(`${API_BASE}/tasks/${taskId}/comments`);
        return response.data as Comment[];
      } catch (error) {
        console.warn('Failed to fetch comments, using cache:', error);
        return getTaskComments(taskId);
      }
    },
    { enabled: !!taskId }
  );
};

/**
 * ATTACHMENT MUTATIONS
 */

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ taskId, file }: { taskId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as Attachment;
    },
    {
      onSuccess: (attachment, { taskId }) => {
        saveAttachment(attachment);
        queryClient.invalidateQueries(['taskAttachments', taskId]);
      },
    }
  );
};

export const useTaskAttachments = (taskId?: string) => {
  return useQuery(
    ['taskAttachments', taskId],
    async () => {
      if (!taskId) return [];
      try {
        const response = await axios.get(`${API_BASE}/tasks/${taskId}/attachments`);
        return response.data as Attachment[];
      } catch (error) {
        console.warn('Failed to fetch attachments, using cache:', error);
        return getTaskAttachments(taskId);
      }
    },
    { enabled: !!taskId }
  );
};

/**
 * TIME TRACKING MUTATIONS
 */

export const useLogTime = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ taskId, duration, description }: { taskId: string; duration: number; description?: string }) => {
      const response = await axios.post(`${API_BASE}/tasks/${taskId}/time-tracking`, {
        duration,
        description,
      });
      return response.data as TimeTrackingEntry;
    },
    {
      onSuccess: async (entry) => {
        await saveTimeEntry(entry);
        queryClient.invalidateQueries(['taskTimeTotal', entry.taskId]);
      },
    }
  );
};

export const useTaskTimeTotal = (taskId?: string) => {
  return useQuery(
    ['taskTimeTotal', taskId],
    async () => {
      if (!taskId) return 0;
      return getTotalTimeSpent(taskId);
    },
    { enabled: !!taskId }
  );
};

/**
 * SPRINT MUTATIONS
 */

export const useCreateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (sprint: Sprint) => {
      const response = await axios.post(`${API_BASE}/sprints`, sprint);
      return response.data as Sprint;
    },
    {
      onSuccess: async (sprint) => {
        await saveSprint(sprint);
        queryClient.invalidateQueries(['sprints', sprint.projectId]);
      },
    }
  );
};

export const useProjectSprints = (projectId?: string) => {
  return useQuery(
    ['sprints', projectId],
    async () => {
      if (!projectId) return [];
      try {
        const response = await axios.get(`${API_BASE}/projects/${projectId}/sprints`);
        return response.data as Sprint[];
      } catch (error) {
        console.warn('Failed to fetch sprints, using cache:', error);
        throw error;
      }
    },
    { enabled: !!projectId }
  );
};

/**
 * NOTIFICATION QUERIES
 */

export const useTaskNotifications = (userId?: string) => {
  return useQuery(
    ['taskNotifications', userId],
    async () => {
      if (!userId) return [];
      try {
        const response = await axios.get(`${API_BASE}/users/${userId}/task-notifications`);
        return response.data as TaskNotification[];
      } catch (error) {
        console.warn('Failed to fetch notifications:', error);
        throw error;
      }
    },
    { enabled: !!userId }
  );
};
