/**
 * Task Details Panel Component - Right sidebar showing full task details
 * 
 * Features:
 * - Task metadata (title, status, priority)
 * - Assignees and watchers
 * - Dates, progress, time tracking
 * - Comments and activity
 * - Attachments
 * - Quick actions (edit, delete, move)
 */

import React, { useState } from 'react';
import {
  Button,
  Text,
  Avatar,
  AvatarGroup,
  Tooltip,
  Badge,
  Divider,
  Spinner,
} from '@fluentui/react-components';
import {
  EditRegular,
  DeleteRegular,
  DismissRegular,
  CheckmarkRegular,
  CommentRegular,
  Attach20Regular,
  Clock20Regular,
} from '@fluentui/react-icons';
import { tasksStore } from '../../store/tasksStore';
import { useTask, useTaskComments, useUpdateTask, useDeleteTask } from '../../hooks/useTasksData';

interface TaskDetailsPanelProps {
  taskId: string;
  onClose: () => void;
}

/**
 * Task Details Panel Component
 */
const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({ taskId, onClose }) => {
  const { data: task, isLoading } = useTask(taskId);
  const { data: comments = [] } = useTaskComments(taskId);
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { openEditTask } = tasksStore();

  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: '16px' }}>
        <Text>Task not found</Text>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    'todo': { label: 'To Do', color: '#ccc' },
    'in-progress': { label: 'In Progress', color: '#0078d4' },
    'review': { label: 'Review', color: '#ffc700' },
    'done': { label: 'Done', color: '#27ae60' },
    'blocked': { label: 'Blocked', color: '#da3b01' },
  };

  const priorityConfig: Record<string, { label: string; color: string }> = {
    P1: { label: 'P1 - Critical', color: '#da3b01' },
    P2: { label: 'P2 - High', color: '#ffc700' },
    P3: { label: 'P3 - Medium', color: '#0078d4' },
    P4: { label: 'P4 - Low', color: '#ccc' },
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';

  return (
    <div className="tasks-details-panel">
      {/* Header */}
      <div className="tasks-details-header">
        <div>
          <Text className="tasks-details-title">{task.title}</Text>
        </div>
        <Tooltip content="Close" relationship="label">
          <Button
            icon={<DismissRegular />}
            appearance="subtle"
            size="small"
            onClick={onClose}
          />
        </Tooltip>
      </div>

      {/* Status & Priority */}
      <div className="tasks-details-section">
        <div className="tasks-details-section-title">Status & Priority</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge
            style={{
              backgroundColor: statusConfig[task.status]?.color,
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
          >
            {statusConfig[task.status]?.label}
          </Badge>

          <Badge
            style={{
              backgroundColor: priorityConfig[task.priority]?.color,
              color: task.priority === 'P4' ? '#333' : 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            {priorityConfig[task.priority]?.label}
          </Badge>
        </div>
      </div>

      {/* Due Date */}
      {dueDate && (
        <div className="tasks-details-section">
          <div className="tasks-details-section-title">Due Date</div>
          <div
            className="tasks-details-section-content"
            style={{
              color: isOverdue ? '#da3b01' : 'var(--colorNeutralForeground1)',
              fontWeight: isOverdue ? 600 : 400,
            }}
          >
            {isOverdue && '⚠️ '}
            {dueDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      )}

      {/* Progress */}
      {task.subtasks.length > 0 && (
        <div className="tasks-details-section">
          <div className="tasks-details-section-title">Progress</div>
          <div className="tasks-progress-bar">
            <div className="tasks-progress-bar-label">
              <span>Subtasks</span>
              <span>
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
              </span>
            </div>
            <div className="tasks-progress-bar-container">
              <div
                className="tasks-progress-bar-fill"
                style={{
                  width: `${task.progress || 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Assignees */}
      <div className="tasks-details-section">
        <div className="tasks-details-section-title">Assigned To</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {task.assignedTo.length === 0 ? (
            <Text style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>
              Unassigned
            </Text>
          ) : (
            task.assignedTo.map((userId) => (
              <Tooltip key={userId} content={userId} relationship="label">
                <Avatar
                  name={userId}
                  size={32}
                  style={{
                    backgroundColor: task.color || '#0078d4',
                    color: 'white',
                  }}
                />
              </Tooltip>
            ))
          )}
        </div>
      </div>

      {/* Watchers */}
      {task.watchers.length > 0 && (
        <div className="tasks-details-section">
          <div className="tasks-details-section-title">Watchers</div>
          <AvatarGroup size={24}>
            {task.watchers.map((userId) => (
              <Tooltip key={userId} content={userId} relationship="label">
                <Avatar name={userId} size={24} />
              </Tooltip>
            ))}
          </AvatarGroup>
        </div>
      )}

      {/* Attachments */}
      {task.attachments.length > 0 && (
        <div className="tasks-details-section">
          <div className="tasks-details-section-title">Attachments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {task.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  backgroundColor: 'var(--colorNeutralBackground1)',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: 'var(--colorBrandBackground)',
                  fontSize: '12px',
                }}
              >
                <Attach20Regular fontSize="14px" />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {attachment.name}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--colorNeutralForeground3)' }}>
                  {(attachment.size / 1024).toFixed(1)}KB
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Time Tracking */}
      {task.estimatedHours && (
        <div className="tasks-details-section">
          <div className="tasks-details-section-title">Time Tracking</div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
            <div>
              <Text style={{ fontSize: '11px', color: 'var(--colorNeutralForeground3)' }}>
                Estimated
              </Text>
              <Text weight="semibold">{task.estimatedHours}h</Text>
            </div>
            {task.actualHours && (
              <div>
                <Text style={{ fontSize: '11px', color: 'var(--colorNeutralForeground3)' }}>
                  Logged
                </Text>
                <Text weight="semibold">{task.actualHours}h</Text>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {task.description && (
        <div className="tasks-details-section">
          <div className="tasks-details-section-title">Description</div>
          <div
            className="tasks-details-section-content"
            style={{
              fontSize: '12px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {task.description}
          </div>
        </div>
      )}

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="tasks-details-section">
          <div className="tasks-details-section-title">Labels</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {task.labels.map((label) => (
              <Badge
                key={label}
                appearance="outline"
                style={{
                  fontSize: '11px',
                  padding: '3px 6px',
                }}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Divider style={{ margin: '16px 0' }} />

      {/* Comments */}
      <div className="tasks-details-section">
        <div className="tasks-details-section-title">
          <CommentRegular fontSize="14px" style={{ marginRight: '4px' }} />
          Comments ({comments.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflow: 'auto' }}>
          {comments.length === 0 ? (
            <Text style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>
              No comments yet
            </Text>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  padding: '8px',
                  backgroundColor: 'var(--colorNeutralBackground1)',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                  {comment.authorId}
                </div>
                <div>{comment.content}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <Button
          icon={<EditRegular />}
          appearance="outline"
          size="small"
          onClick={() => openEditTask(task.id)}
          style={{ flex: 1 }}
        >
          Edit
        </Button>

        <Button
          icon={<DeleteRegular />}
          appearance="outline"
          size="small"
          onClick={() => {
            if (window.confirm('Delete this task?')) {
              deleteTask(task.id);
              onClose();
            }
          }}
          style={{ flex: 1 }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default TaskDetailsPanel;
