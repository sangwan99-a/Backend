import { create } from 'zustand';
import type { Task } from '@/types/index';

interface TaskStore {
  tasks: Task[];
  filteredTasks: Task[];
  selectedTask: Task | null;
  filter: {
    status?: string;
    priority?: string;
    assignedTo?: string;
  };

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  selectTask: (task: Task | null) => void;
  setFilter: (filter: any) => void;
  applyFilter: () => void;
}

const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  filteredTasks: [],
  selectedTask: null,
  filter: {},

  setTasks: (tasks: any) => set({ tasks }),
  addTask: (task: any) => set((state: any) => ({ tasks: [...state.tasks, task] })),
  updateTask: (task: any) =>
    set((state: any) => ({
      tasks: state.tasks.map((t: any) => (t.id === task.id ? task : t)),
    })),
  deleteTask: (taskId: any) =>
    set((state: any) => ({
      tasks: state.tasks.filter((t: any) => t.id !== taskId),
    })),
  selectTask: (task: any) => set({ selectedTask: task }),
  setFilter: (filter: any) => set({ filter }),
  applyFilter: () =>
    set((state: any) => {
      let filtered = state.tasks;
      if (state.filter.status) {
        filtered = filtered.filter((t: any) => t.status === state.filter.status);
      }
      if (state.filter.priority) {
        filtered = filtered.filter((t: any) => t.priority === state.filter.priority);
      }
      if (state.filter.assignedTo) {
        filtered = filtered.filter((t: any) => t.assignedTo === state.filter.assignedTo);
      }
      return { filteredTasks: filtered };
    }),
}));

export default useTaskStore;
