/**
 * Tasks List View Component - Sortable table of tasks with inline actions
 * 
 * Features:
 * - Sortable columns (title, priority, assignee, due date, progress)
 * - Inline editing
 * - Multi-select with bulk actions
 * - Filtering
 * - Row actions (edit, delete, move)
 */

import React, { useState } from 'react';
import {
  DataGridBody,
  DataGridRow,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  Button,
  Badge,
  Avatar,
  AvatarGroup,
  Tooltip,
  Text,
} from '@fluentui/react-components';
import {
  ChevronUp20Regular,
  ChevronDown20Regular,
  MoreVertical20Regular,
  DeleteRegular,
  EditRegular,
} from '@fluentui/react-icons';
import { tasksStore } from '../../store/tasksStore';
import { useProjectTasks, useDeleteTask } from '../../hooks/useTasksData';
import type { Task, TaskSort } from '../../types/tasks';

interface TasksListProps {
  projectId: string;
  onTaskClick: (taskId: string) => void;
}

const priorityOrder: Record<string, number> = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
};

const statusConfig: Record<string, { label: string; color: string }> = {
  'todo': { label: 'To Do', color: '#ccc' },
  'in-progress': { label: 'In Progress', color: '#0078d4' },
  'review': { label: 'Review', color: '#ffc700' },
  'done': { label: 'Done', color: '#27ae60' },
  'blocked': { label: 'Blocked', color: '#da3b01' },
};

/**
 * Tasks List View Component
 */
export const TasksList: React.FC<TasksListProps> = ({ projectId, onTaskClick }) => {
  const { data: allTasks = [], isLoading, error } = useProjectTasks(projectId);
  const { mutate: deleteTask } = useDeleteTask();
  const { selectedTasks, toggleTaskSelection, clearTaskSelection, sortBy, setSortBy, activeFilter } = tasksStore();

  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (isLoading) {
    return <Text>Loading tasks...</Text>;
  }

  if (error) {
    return <Text>Failed to load tasks</Text>;
  }

  // Filter and sort tasks
  let filteredTasks = allTasks;

  if (activeFilter?.status?.length) {
    filteredTasks = filteredTasks.filter((t) => activeFilter.status?.includes(t.status));
  }

  if (activeFilter?.priority?.length) {
    filteredTasks = filteredTasks.filter((t) => activeFilter.priority?.includes(t.priority));
  }

  if (activeFilter?.assignedTo?.length) {
    filteredTasks = filteredTasks.filter((t) =>
      t.assignedTo.some((a) => activeFilter.assignedTo?.includes(a))
    );
  }

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aVal = a[sortBy.field as keyof Task] as any;
    let bVal = b[sortBy.field as keyof Task] as any;

    if (sortBy.field === 'priority') {
      aVal = priorityOrder[aVal] || 4;
      bVal = priorityOrder[bVal] || 4;
    }

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortBy.direction === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: TaskSort['field']) => {
    setSortBy({
      field,
      direction:
        sortBy.field === field && sortBy.direction === 'asc'
          ? 'desc'
          : 'asc',
    });
  };

  const SortIcon = ({ field }: { field: TaskSort['field'] }) => {
    if (sortBy.field !== field) return null;
    return sortBy.direction === 'asc' ? (
      <ChevronUp20Regular />
    ) : (
      <ChevronDown20Regular />
    );
  };

  return (
    <div className="tasks-list">
      <DataGrid
        items={sortedTasks}
        columns={[
          {
            columnId: 'checkbox',
            compare: () => 0,
            renderHeaderCell: () => (
              <input
                type="checkbox"
                checked={selectedTasks.length === sortedTasks.length && sortedTasks.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    sortedTasks.forEach((t) => {
                      if (!selectedTasks.includes(t.id)) {
                        toggleTaskSelection(t.id);
                      }
                    });
                  } else {
                    clearTaskSelection();
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
            ),
            renderCell: (item: Task) => (
              <input
                type="checkbox"
                checked={selectedTasks.includes(item.id)}
                onChange={() => toggleTaskSelection(item.id)}
                style={{ cursor: 'pointer' }}
              />
            ),
          },
          {
            columnId: 'title',
            compare: (a: Task, b: Task) => a.title.localeCompare(b.title),
            renderHeaderCell: () => (
              <button
                onClick={() => handleSort('title')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Title
                <SortIcon field="title" />
              </button>
            ),
            renderCell: (item: Task) => (
              <Text
                onClick={() => {
                  onTaskClick(item.id);
                }}
                style={{
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  color: 'var(--colorBrandBackground)',
                }}
              >
                {item.title}
              </Text>
            ),
          },
          {
            columnId: 'priority',
            compare: (a: Task, b: Task) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4),
            renderHeaderCell: () => (
              <button
                onClick={() => handleSort('priority')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Priority
                <SortIcon field="priority" />
              </button>
            ),
            renderCell: (item: Task) => (
              <Badge
                style={{
                  backgroundColor: '#' + (priorityOrder[item.priority] === 1 ? 'da3b01' : priorityOrder[item.priority] === 2 ? 'ffc700' : priorityOrder[item.priority] === 3 ? '0078d4' : 'ccc'),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '2px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {item.priority}
              </Badge>
            ),
          },
          {
            columnId: 'status',
            compare: (a: Task, b: Task) => a.status.localeCompare(b.status),
            renderHeaderCell: () => 'Status',
            renderCell: (item: Task) => (
              <Badge
                style={{
                  backgroundColor: statusConfig[item.status]?.color,
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '2px',
                  fontSize: '12px',
                }}
              >
                {statusConfig[item.status]?.label}
              </Badge>
            ),
          },
          {
            columnId: 'assignedTo',
            compare: () => 0,
            renderHeaderCell: () => 'Assigned To',
            renderCell: (item: Task) => (
              <AvatarGroup
                size={24}
                layout="spread"
                style={{ gap: '4px' }}
              >
                {item.assignedTo.slice(0, 3).map((userId) => (
                  <Tooltip key={userId} content={userId} relationship="label">
                    <Avatar
                      key={userId}
                      name={userId}
                      size={24}
                      style={{
                        fontSize: '10px',
                        backgroundColor: item.color || '#0078d4',
                      }}
                    />
                  </Tooltip>
                ))}
                {item.assignedTo.length > 3 && (
                  <span style={{ fontSize: '12px' }}>+{item.assignedTo.length - 3}</span>
                )}
              </AvatarGroup>
            ),
          },
          {
            columnId: 'dueDate',
            compare: (a: Task, b: Task) => {
              const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
              const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
              return aDate - bDate;
            },
            renderHeaderCell: () => (
              <button
                onClick={() => handleSort('dueDate')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Due Date
                <SortIcon field="dueDate" />
              </button>
            ),
            renderCell: (item: Task) => (
              <Text>
                {item.dueDate
                  ? new Date(item.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-'}
              </Text>
            ),
          },
          {
            columnId: 'progress',
            compare: (a: Task, b: Task) => (a.progress || 0) - (b.progress || 0),
            renderHeaderCell: () => 'Progress',
            renderCell: (item: Task) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '4px',
                    backgroundColor: 'var(--colorNeutralBackground3)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${item.progress || 0}%`,
                      backgroundColor: '#27ae60',
                    }}
                  />
                </div>
                <Text style={{ fontSize: '12px', minWidth: '30px' }}>
                  {item.progress || 0}%
                </Text>
              </div>
            ),
          },
          {
            columnId: 'actions',
            compare: () => 0,
            renderHeaderCell: () => '',
            renderCell: (item: Task) => (
              <div
                style={{
                  display: hoveredRow === item.id ? 'flex' : 'none',
                  gap: '4px',
                }}
              >
                <Tooltip content="Edit" relationship="label">
                  <Button
                    icon={<EditRegular />}
                    appearance="subtle"
                    size="small"
                    onClick={() => onTaskClick(item.id)}
                  />
                </Tooltip>
                <Tooltip content="Delete" relationship="label">
                  <Button
                    icon={<DeleteRegular />}
                    appearance="subtle"
                    size="small"
                    onClick={() => {
                      if (window.confirm('Delete this task?')) {
                        deleteTask(item.id);
                      }
                    }}
                  />
                </Tooltip>
              </div>
            ),
          },
        ]}
      >
        {(fluentUIProps: any) => (
          <DataGridBody {...fluentUIProps}>
            {({ item: task }: { item: Task }) => (
              <DataGridRow
                key={task.id}
                onMouseEnter={() => setHoveredRow(task.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {({ renderCell }) => (
                  <DataGridCell>{renderCell(task)}</DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        )}
      </DataGrid>
    </div>
  );
};

export default TasksList;
