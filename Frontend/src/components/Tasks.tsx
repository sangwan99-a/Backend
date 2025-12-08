/**
 * Tasks Module - Main Container Component
 * 
 * Layout: Sidebar (projects/boards) | Main Area (views) | Details Panel
 * Views: Kanban, List, Gantt, Calendar, My Tasks
 * 
 * Features:
 * - Multi-view task management
 * - Real-time collaboration
 * - Task creation/editing
 * - Drag-drop operations
 * - Search and filtering
 * - Time tracking
 */

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  Button,
  Spinner,
  Text,
  Input,
  Tooltip,
  Badge,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Search20Regular,
  Settings20Regular,
  Filter20Regular,
} from '@fluentui/react-icons';
import { tasksStore } from '../store/tasksStore';
import { useProjects, useProjectBoards, useProjectTasks } from '../hooks/useTasksData';
import KanbanBoard from './tasks/KanbanBoard';
import TasksList from './tasks/TasksList';
import TaskModal from './tasks/TaskModal';
import TaskDetailsPanel from './tasks/TaskDetailsPanel';
import '../styles/tasks.css';

// Create a separate QueryClient for tasks module
const tasksQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Tasks Module - Main Component
 */
const TasksContent: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(true);

  const {
    viewMode,
    selectedProjectId,
    selectedBoardId,
    selectedTaskId,
    isCreateTaskOpen,
    isEditTaskOpen,
    setViewMode,
    setSelectedProject,
    setSelectedBoard,
    setSelectedTask,
    openCreateTask,
    closeCreateTask,
    closeEditTask,
    searchQuery,
    setSearchQuery,
  } = tasksStore();

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: boards = [], isLoading: boardsLoading } = useProjectBoards(selectedProjectId);
  const { data: tasks = [], isLoading: tasksLoading } = useProjectTasks(selectedProjectId);

  // Initialize module
  useEffect(() => {
    const initializeTasksModule = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        // Initialize database and load initial data
        // Projects will be fetched via React Query

        // Set default project if available
        if (projects.length > 0 && !selectedProjectId) {
          setSelectedProject(projects[0].id);
          if (projects[0].boards.length > 0) {
            setSelectedBoard(projects[0].boards[0].id);
          }
        }

        setIsInitializing(false);
      } catch (error) {
        console.error('Tasks module initialization error:', error);
        setInitError(
          error instanceof Error ? error.message : 'Failed to initialize tasks module'
        );
        setIsInitializing(false);
      }
    };

    initializeTasksModule();
  }, []);

  if (initError) {
    return (
      <div className="tasks-page">
        <div style={{ padding: '16px', background: 'var(--colorPaletteRedBackground2)' }}>
          <Text>{initError}</Text>
        </div>
      </div>
    );
  }

  if (isInitializing || projectsLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Spinner label="Loading tasks module..." />
      </div>
    );
  }

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const currentBoard = boards.find((b) => b.id === selectedBoardId);

  const handleTaskClick = (taskId: string) => {
    setSelectedTask(taskId);
    setDetailsPanelOpen(true);
  };

  return (
    <div className="tasks-page">
      {/* Sidebar */}
      <div className={`tasks-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="tasks-sidebar-header">
          <Text weight="bold">Projects</Text>
          <Tooltip content="New project" relationship="label">
            <Button
              icon={<Add20Regular />}
              appearance="subtle"
              size="small"
            />
          </Tooltip>
        </div>

        {/* Projects List */}
        <div className="tasks-sidebar-section">
          <div className="tasks-sidebar-section-title">My Projects</div>
          {projects.map((project) => (
            <div
              key={project.id}
              className={`tasks-sidebar-item ${
                project.id === selectedProjectId ? 'active' : ''
              }`}
              onClick={() => {
                setSelectedProject(project.id);
                if (project.boards.length > 0) {
                  setSelectedBoard(project.boards[0].id);
                }
              }}
            >
              <div
                className="tasks-sidebar-item-icon"
                style={{
                  backgroundColor: project.color || '#0078d4',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {project.name.charAt(0)}
              </div>
              <span style={{ flex: 1 }}>{project.name}</span>
              <span className="tasks-sidebar-item-badge">{project.boards.length}</span>
            </div>
          ))}
        </div>

        {/* Boards List */}
        {currentProject && currentProject.boards.length > 0 && (
          <div className="tasks-sidebar-section">
            <div className="tasks-sidebar-section-title">Boards</div>
            {currentProject.boards.map((board) => (
              <div
                key={board.id}
                className={`tasks-sidebar-item ${
                  board.id === selectedBoardId ? 'active' : ''
                }`}
                onClick={() => setSelectedBoard(board.id)}
                style={{ paddingLeft: '32px' }}
              >
                <span style={{ flex: 1 }}>{board.name}</span>
                <span className="tasks-sidebar-item-badge">{board.columns.length}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick Views */}
        <div className="tasks-sidebar-section">
          <div className="tasks-sidebar-section-title">Quick Views</div>
          <div
            className={`tasks-sidebar-item ${viewMode === 'my-tasks' ? 'active' : ''}`}
            onClick={() => setViewMode('my-tasks')}
          >
            <span>My Tasks</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="tasks-main">
        {/* Header */}
        <div className="tasks-header">
          <div className="tasks-header-left">
            <Tooltip content="Toggle sidebar" relationship="label">
              <Button
                icon={<Settings20Regular />}
                appearance="subtle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              />
            </Tooltip>

            <Text weight="semibold">
              {currentProject?.name || 'Projects'}
              {currentBoard && ` / ${currentBoard.name}`}
            </Text>
          </div>

          <div className="tasks-header-right">
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search20Regular />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e, data) => setSearchQuery(data.value)}
                style={{ width: '200px' }}
              />
            </div>

            {/* View Selector */}
            <div className="tasks-view-selector">
              {['kanban', 'list', 'gantt', 'calendar', 'my-tasks'].map((mode) => (
                <button
                  key={mode}
                  className={`${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode as any)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Filter & Create */}
            <Tooltip content="Filter" relationship="label">
              <Button icon={<Filter20Regular />} appearance="subtle" />
            </Tooltip>

            <Button
              icon={<Add20Regular />}
              appearance="primary"
              onClick={() => openCreateTask(selectedProjectId, selectedBoardId)}
            >
              New Task
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="tasks-content">
          {tasksLoading ? (
            <Spinner label="Loading tasks..." />
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              board={currentBoard}
              projectId={selectedProjectId || ''}
              onTaskClick={handleTaskClick}
            />
          ) : viewMode === 'list' ? (
            <TasksList
              projectId={selectedProjectId || ''}
              onTaskClick={handleTaskClick}
            />
          ) : viewMode === 'my-tasks' ? (
            <MyTasksDashboard tasks={tasks} onTaskClick={handleTaskClick} />
          ) : (
            <Text>View "{viewMode}" coming soon</Text>
          )}
        </div>
      </div>

      {/* Details Panel */}
      <div className={`tasks-details-panel ${detailsPanelOpen ? 'open' : ''}`}>
        {selectedTaskId ? (
          <TaskDetailsPanel
            taskId={selectedTaskId}
            onClose={() => setDetailsPanelOpen(false)}
          />
        ) : (
          <Text style={{ padding: '16px', textAlign: 'center', color: 'var(--colorNeutralForeground3)' }}>
            Select a task to view details
          </Text>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        projectId={selectedProjectId || ''}
        boardId={selectedBoardId}
        open={isCreateTaskOpen || isEditTaskOpen}
        taskId={isEditTaskOpen ? selectedTaskId : undefined}
        onClose={() => {
          closeCreateTask();
          closeEditTask();
        }}
      />
    </div>
  );
};

/**
 * My Tasks Dashboard
 */
interface MyTasksDashboardProps {
  tasks: any[];
  onTaskClick: (taskId: string) => void;
}

const MyTasksDashboard: React.FC<MyTasksDashboardProps> = ({ tasks, onTaskClick }) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < today && t.status !== 'done'
  );
  const todayTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) < tomorrow && t.status !== 'done'
  );
  const upcomingTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) >= tomorrow && new Date(t.dueDate) <= nextWeek && t.status !== 'done'
  );

  const renderTaskSection = (title: string, sectionTasks: any[], color: string) => (
    <div className="my-tasks-section">
      <div className="my-tasks-section-title" style={{ borderBottomColor: color }}>
        {title} <Badge appearance="filled">{sectionTasks.length}</Badge>
      </div>
      <div className="my-tasks-section-content">
        {sectionTasks.length === 0 ? (
          <Text style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>
            No tasks
          </Text>
        ) : (
          sectionTasks.map((task) => (
            <div
              key={task.id}
              className="my-tasks-item"
              onClick={() => onTaskClick(task.id)}
            >
              <div className="my-tasks-item-title">{task.title}</div>
              <div className="my-tasks-item-meta">
                <span>{task.priority}</span>
                {task.dueDate && (
                  <span>
                    Due {new Date(task.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="my-tasks-dashboard">
      {renderTaskSection('⚠️ Overdue', overdueTasks, '#da3b01')}
      {renderTaskSection('📌 Today', todayTasks, '#ffc700')}
      {renderTaskSection('📅 Upcoming', upcomingTasks, '#0078d4')}
    </div>
  );
};

/**
 * Export with QueryClient Provider
 */
export const Tasks: React.FC = () => {
  return (
    <QueryClientProvider client={tasksQueryClient}>
      <TasksContent />
    </QueryClientProvider>
  );
};
