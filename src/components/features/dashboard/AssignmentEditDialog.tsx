'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
} from '@mui/material';
import { TaskAssignmentWithDetails, Member } from '@/types';

interface AssignmentEditDialogProps {
  open: boolean;
  assignment: TaskAssignmentWithDetails | null;
  members: Member[];
  onSave: (assignment: TaskAssignmentWithDetails) => void;
  onClose: () => void;
}

/**
 * Dialog for editing a task assignment
 */
export function AssignmentEditDialog({
  open,
  assignment,
  members,
  onSave,
  onClose,
}: AssignmentEditDialogProps) {
  const [formData, setFormData] = useState({
    host: '',
    startDate: '',
    endDate: '',
  });

  // Reset form when assignment changes
  useEffect(() => {
    if (assignment) {
      setFormData({
        host: assignment.host,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
      });
    }
  }, [assignment]);

  const handleSave = () => {
    if (!assignment) return;

    const selectedMember = members.find((m) => m.host === formData.host);
    if (!selectedMember) return;

    onSave({
      ...assignment,
      memberId: selectedMember.id,
      host: formData.host,
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Assignment</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Assignee"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            fullWidth
          >
            {members.map((member) => (
              <MenuItem key={member.id} value={member.host}>
                {member.host}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

