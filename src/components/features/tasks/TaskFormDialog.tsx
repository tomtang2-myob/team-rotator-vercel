'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Task } from '@/types';

interface TaskFormDialogProps {
  open: boolean;
  task: Partial<Task> | null;
  onSave: (task: Partial<Task>) => void;
  onClose: () => void;
}

const ROTATION_RULES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly_monday', label: 'Weekly (Monday)' },
  { value: 'biweekly_monday', label: 'Biweekly (Monday)' },
  { value: 'weekly_friday', label: 'Weekly (Friday)' },
  { value: 'biweekly_wednesday', label: 'Biweekly (Wednesday)' },
  { value: 'biweekly_thursday', label: 'Biweekly (Thursday)' },
];

/**
 * Dialog for creating or editing a task
 */
export function TaskFormDialog({
  open,
  task,
  onSave,
  onClose,
}: TaskFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    name: '',
    rotationRule: '',
  });

  const isEditing = !!task?.id;

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        id: task.id,
        name: task.name || '',
        rotationRule: task.rotationRule || '',
      });
    } else {
      setFormData({ name: '', rotationRule: '' });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEditing ? 'Edit Task' : 'Add Task'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Rotation Rule</InputLabel>
              <Select
                value={formData.rotationRule || ''}
                onChange={(e) => setFormData({ ...formData, rotationRule: e.target.value })}
                label="Rotation Rule"
              >
                {ROTATION_RULES.map((rule) => (
                  <MenuItem key={rule.value} value={rule.value}>
                    {rule.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {isEditing ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

