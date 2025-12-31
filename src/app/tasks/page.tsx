'use client';

import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Hooks
import { useTasks, useSnackbar } from '@/hooks';

// Shared Components
import { PageHeader, ConfirmDialog, SnackbarNotification } from '@/components/shared';

// Feature Components
import { TasksTable, TaskFormDialog } from '@/components/features/tasks';

// Types
import { Task } from '@/types';

/**
 * Tasks Page
 * 
 * Page for managing tasks (CRUD operations).
 * Uses custom hooks for data fetching and feature components for UI.
 */
export default function TasksPage() {
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Custom hooks
  const {
    tasks,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
  } = useTasks();

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // Handlers
  const handleOpenForm = (task?: Task) => {
    setEditingTask(task || { name: '', rotationRule: '' });
    setFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTask(null);
    setFormDialogOpen(false);
  };

  const handleSave = async (task: Partial<Task>) => {
    try {
      if (!task.id) {
        // Create new task
        await createTaskMutation.mutateAsync({
          name: task.name!,
          rotationRule: task.rotationRule!,
        });
        showSuccess('Task created successfully');
      } else {
        // Update existing task
        await updateTaskMutation.mutateAsync(task as Task);
        showSuccess('Task updated successfully');
      }
      handleCloseForm();
    } catch (error) {
      showError('Failed to save task');
    }
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      try {
        await deleteTaskMutation.mutateAsync(taskToDelete.id);
        showSuccess('Task deleted successfully');
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
      } catch (error) {
        showError('Failed to delete task');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  return (
    <Box p={3}>
      {/* Header */}
      <PageHeader
        title="Tasks"
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Add Task
          </Button>
        }
      />

      {/* Tasks Table */}
      <TasksTable
        tasks={tasks}
        onEdit={handleOpenForm}
        onDelete={handleDeleteClick}
      />

      {/* Form Dialog */}
      <TaskFormDialog
        open={formDialogOpen}
        task={editingTask}
        onSave={handleSave}
        onClose={handleCloseForm}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Task"
        message={`Are you sure you want to delete ${taskToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Snackbar */}
      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
