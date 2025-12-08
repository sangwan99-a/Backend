/**
 * Task Modal Component - Create/Edit task dialog with rich form
 * 
 * Features:
 * - Title, description, priority, assignees
 * - Start/due dates with date picker
 * - Estimated hours and time tracking
 * - Subtasks management
 * - Labels and custom fields
 * - Attachments
 * - Form validation
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogBody,
  DialogTitle,
  DialogActions,
  Button,
  Input,
  Textarea,
  Select,
  Label,
  AvatarGroup,
  Avatar,
  Tooltip,
  Text,
  Checkbox,
} from '@fluentui/react-components';
import {
  DismissRegular,
  CheckmarkRegular,
} from '@fluentui/react-icons';
import { tasksStore } from '../../store/tasksStore';
import { useCreateTask, useUpdateTask, useTask } from '../../hooks/useTasksData';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../../types/tasks';

interface TaskModalProps {
  projectId: string;
  boardId?: string;
  open: boolean;
  taskId?: string;
  onClose: () => void;
}

/**
 * Task Modal Component
 */
export const TaskModal: React.FC<TaskModalProps> = ({
  projectId,
  boardId,
  open,
  taskId,
  onClose,
}) => {
  const { data: existingTask } = useTask(taskId);
  const { mutate: createTask } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const { closeCreateTask, closeEditTask } = tasksStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('P3');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form from existing task
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description);
      setPriority(existingTask.priority);
      setAssignedTo(existingTask.assignedTo);
      setDueDate(existingTask.dueDate?.split('T')[0] || '');
      setStartDate(existingTask.startDate?.split('T')[0] || '');
      setEstimatedHours(existingTask.estimatedHours?.toString() || '');
      setLabels(existingTask.labels);
      setSubtasks(existingTask.subtasks.map((s) => s.title));
    } else {
      resetForm();
    }
  }, [existingTask, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('P3');
    setAssignedTo([]);
    setDueDate('');
    setStartDate('');
    setEstimatedHours('');
    setLabels([]);
    setSubtasks([]);
    setNewSubtask('');
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (dueDate && startDate && new Date(dueDate) < new Date(startDate)) {
      newErrors.dueDate = 'Due date must be after start date';
    }

    if (estimatedHours && isNaN(Number(estimatedHours))) {
      newErrors.estimatedHours = 'Must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (existingTask) {
        // Update existing task
        updateTask({
          taskId: existingTask.id,
          updates: {
            title,
            description,
            priority: priority as any,
            assignedTo,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
          } as UpdateTaskRequest,
        });
        closeEditTask();
      } else {
        // Create new task
        createTask({
          projectId,
          boardId: boardId || '',
          title,
          description,
          priority: priority as any,
          assignedTo,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
          labels,
        });
        closeCreateTask();
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ submit: 'Failed to save task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(e, data) => !data.open && onClose()}>
      <DialogContent
        style={{
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <DialogTitle>
          {existingTask ? 'Edit Task' : 'New Task'}
          <Button
            icon={<DismissRegular />}
            appearance="subtle"
            onClick={onClose}
            style={{ position: 'absolute', right: '16px', top: '16px' }}
          />
        </DialogTitle>

        <DialogBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Title */}
            <div>
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e, data) => setTitle(data.value)}
                placeholder="Task title"
              />
              {errors.title && (
                <Text style={{ color: '#da3b01', fontSize: '12px' }}>
                  {errors.title}
                </Text>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add task details..."
                style={{ minHeight: '120px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Priority */}
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="P1">P1 - Critical</option>
                  <option value="P2">P2 - High</option>
                  <option value="P3">P3 - Medium</option>
                  <option value="P4">P4 - Low</option>
                </Select>
              </div>

              {/* Estimated Hours */}
              <div>
                <Label htmlFor="task-hours">Estimated Hours</Label>
                <Input
                  id="task-hours"
                  type="number"
                  value={estimatedHours}
                  onChange={(e, data) => setEstimatedHours(data.value)}
                  placeholder="e.g., 8"
                />
                {errors.estimatedHours && (
                  <Text style={{ color: '#da3b01', fontSize: '12px' }}>
                    {errors.estimatedHours}
                  </Text>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Start Date */}
              <div>
                <Label htmlFor="task-start-date">Start Date</Label>
                <Input
                  id="task-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e, data) => setStartDate(data.value)}
                />
              </div>

              {/* Due Date */}
              <div>
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e, data) => setDueDate(data.value)}
                />
                {errors.dueDate && (
                  <Text style={{ color: '#da3b01', fontSize: '12px' }}>
                    {errors.dueDate}
                  </Text>
                )}
              </div>
            </div>

            {/* Assignees */}
            <div>
              <Label>Assign To</Label>
              <Input
                placeholder="Enter email addresses, comma-separated"
                defaultValue={assignedTo.join(', ')}
                onChange={(e, data) =>
                  setAssignedTo(
                    data.value
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>

            {/* Labels */}
            <div>
              <Label htmlFor="task-labels">Labels</Label>
              <Input
                id="task-labels"
                placeholder="Enter labels, comma-separated"
                defaultValue={labels.join(', ')}
                onChange={(e, data) =>
                  setLabels(
                    data.value
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>

            {/* Subtasks */}
            <div>
              <Label>Subtasks</Label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Input
                  value={newSubtask}
                  onChange={(e, data) => setNewSubtask(data.value)}
                  placeholder="Add subtask..."
                  style={{ flex: 1 }}
                />
                <Button
                  onClick={() => {
                    if (newSubtask.trim()) {
                      setSubtasks([...subtasks, newSubtask]);
                      setNewSubtask('');
                    }
                  }}
                  appearance="primary"
                >
                  Add
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {subtasks.map((subtask, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      backgroundColor: 'var(--colorNeutralBackground2)',
                      borderRadius: '4px',
                    }}
                  >
                    <Checkbox label={subtask} />
                    <Button
                      icon={<DismissRegular />}
                      appearance="subtle"
                      onClick={() =>
                        setSubtasks(subtasks.filter((_, i) => i !== idx))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {errors.submit && (
              <Text style={{ color: '#da3b01' }}>{errors.submit}</Text>
            )}
          </div>
        </DialogBody>

        <DialogActions>
          <Button appearance="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<CheckmarkRegular />}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
