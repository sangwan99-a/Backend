/**
 * Kanban Board Component - Drag-drop task board with status columns
 * 
 * Features:
 * - Drag-drop between columns
 * - Task cards with priority, assignee, due date
 * - Column headers with WIP limits
 * - Quick task creation
 * - Loading and error states
 */

import React, { useState } from 'react';
import {
  Button,
  Card,
  Spinner,
  Text,
  Badge,
  Avatar,
  Tooltip,
} from '@fluentui/react-components';
import {
  AddRegular,
  ChevronDown20Regular,
  ClockRegular,
} from '@fluentui/react-icons';
import { tasksStore } from '../../store/tasksStore';
import { useProjectTasks, useMoveTask } from '../../hooks/useTasksData';
import type { Task, Board, TaskStatus } from '../../types/tasks';

interface KanbanBoardProps {
  board?: Board;
  projectId: string;
  onTaskClick: (taskId: string) => void;
}

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  'todo': { label: 'To Do', color: '#ccc' },
  'in-progress': { label: 'In Progress', color: '#0078d4' },
  'review': { label: 'Review', color: '#ffc700' },
  'done': { label: 'Done', color: '#27ae60' },
  'blocked': { label: 'Blocked', color: '#da3b01' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  P1: { label: 'P1', color: '#da3b01' },
  P2: { label: 'P2', color: '#ffc700' },
  P3: { label: 'P3', color: '#0078d4' },
  P4: { label: 'P4', color: '#ccc' },
};

/**
 * Kanban Board Component
 */
export const KanbanBoard: React.FC<KanbanBoardProps> = ({ board, projectId, onTaskClick }) => {
  const { data: allTasks = [], isLoading, error } = useProjectTasks(projectId);
  const { mutate: moveTask } = useMoveTask();
  const { selectedTaskId, setSelectedTask, openCreateTask } = tasksStore();

  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner label="Loading tasks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', background: 'var(--colorPaletteRedBackground2)' }}>
        <Text>Failed to load tasks. Please try again.</Text>
      </div>
    );
  }

  // Group tasks by status
  const columns: TaskStatus[] = board ? 
    board.columns.map((c) => c.status as TaskStatus) : 
    ['todo', 'in-progress', 'review', 'done'];

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    'todo': [],
    'in-progress': [],
    'review': [],
    'done': [],
    'blocked': [],
  };

  allTasks.forEach((task) => {
    if (tasksByStatus[task.status]) {
      tasksByStatus[task.status].push(task);
    }
  });

  // Sort tasks in each column by columnOrder
  Object.keys(tasksByStatus).forEach((status) => {
    tasksByStatus[status as TaskStatus].sort((a, b) => {
      return (a.columnOrder || 0) - (b.columnOrder || 0);
    });
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask) return;

    const draggedTaskData = allTasks.find((t) => t.id === draggedTask);
    if (!draggedTaskData) return;

    // Move task to new column
    moveTask({
      taskId: draggedTask,
      targetBoardId: draggedTaskData.boardId,
      targetColumnId: targetStatus,
      position: tasksByStatus[targetStatus].length,
    });

    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="kanban-board">
      <div className="kanban-columns">
        {columns.map((status) => {
          const config = statusConfig[status];
          const columnTasks = tasksByStatus[status];
          const wip = board?.columns.find((c) => c.status === status)?.wip;
          const isWipExceeded = wip && columnTasks.length > wip;

          return (
            <div
              key={status}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDropOnColumn(e, status)}
              style={{
                backgroundColor: dragOverColumn === status ? 'var(--colorNeutralBackground3)' : undefined,
              }}
            >
              {/* Column Header */}
              <div className="kanban-column-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      backgroundColor: config.color,
                    }}
                  />
                  <Text weight="semibold">{config.label}</Text>
                  <Badge appearance="tint" color="brand">
                    {columnTasks.length}
                  </Badge>
                </div>
                {isWipExceeded && (
                  <Tooltip content={`WIP limit exceeded (${wip})`} relationship="label">
                    <Text style={{ color: '#da3b01', fontSize: '12px' }}>⚠️</Text>
                  </Tooltip>
                )}
              </div>

              {/* Task Cards */}
              <div className="kanban-cards">
                {columnTasks.map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    isSelected={task.id === selectedTaskId}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => {
                      setSelectedTask(task.id);
                      onTaskClick(task.id);
                    }}
                  />
                ))}
              </div>

              {/* Add Task Button */}
              <Button
                icon={<AddRegular />}
                appearance="subtle"
                onClick={() => openCreateTask(projectId, board?.id)}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  justifyContent: 'flex-start',
                  color: 'var(--colorNeutralForeground3)',
                }}
              >
                Add task
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Individual Task Card
 */
interface KanbanTaskCardProps {
  task: Task;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
}

const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({
  task,
  isSelected,
  onDragStart,
  onClick,
}) => {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const isDueSoon = dueDate && dueDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`kanban-task-card ${isSelected ? 'selected' : ''}`}
      style={{
        cursor: 'move',
        opacity: 0.95,
        borderLeft: `4px solid ${task.color || '#0078d4'}`,
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '8px',
        backgroundColor: isSelected ? 'var(--colorNeutralBackground2)' : 'var(--colorNeutralBackground1)',
        border: isSelected ? '2px solid var(--colorBrandBackground)' : undefined,
      }}
    >
      {/* Task Title */}
      <Text
        weight="semibold"
        style={{
          display: 'block',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {task.title}
      </Text>

      {/* Priority Badge and Due Date */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '12px',
        }}
      >
        <Badge
          appearance="outline"
          color="informative"
          style={{
            backgroundColor: priorityConfig[task.priority]?.color,
            color: 'white',
            fontSize: '11px',
            padding: '2px 6px',
          }}
        >
          {task.priority}
        </Badge>

        {dueDate && (
          <span
            style={{
              color: isOverdue ? '#da3b01' : isDueSoon ? '#ffc700' : '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ClockRegular fontSize="12px" />
            {dueDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* Progress and Subtasks */}
      {task.subtasks.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px',
              color: 'var(--colorNeutralForeground3)',
            }}
          >
            <span>Subtasks</span>
            <span>
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          </div>
          <div
            style={{
              height: '4px',
              backgroundColor: 'var(--colorNeutralBackground3)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(task.progress || 0)}%`,
                backgroundColor: '#27ae60',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Assignees */}
      {task.assignedTo.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          {task.assignedTo.slice(0, 3).map((userId) => (
            <Tooltip key={userId} content={userId} relationship="label">
              <Avatar
                name={userId}
                size={24}
                style={{
                  fontSize: '10px',
                  backgroundColor: task.color || '#0078d4',
                  color: 'white',
                }}
              />
            </Tooltip>
          ))}
          {task.assignedTo.length > 3 && (
            <Avatar
              size={24}
              badge="+3"
              style={{ fontSize: '10px' }}
            />
          )}
        </div>
      )}

      {/* Labels */}
      {task.labels.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
          {task.labels.map((label) => (
            <Badge
              key={label}
              appearance="outline"
              size="small"
              style={{
                fontSize: '11px',
                padding: '2px 4px',
              }}
            >
              {label}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
};

export default KanbanBoard;
