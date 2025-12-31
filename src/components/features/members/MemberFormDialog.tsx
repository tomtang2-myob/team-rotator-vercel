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
} from '@mui/material';
import { Member } from '@/types';

interface MemberFormDialogProps {
  open: boolean;
  member: Partial<Member> | null;
  onSave: (member: Partial<Member>) => void;
  onClose: () => void;
}

/**
 * Dialog for creating or editing a team member
 */
export function MemberFormDialog({
  open,
  member,
  onSave,
  onClose,
}: MemberFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Member>>({
    host: '',
    slackMemberId: '',
  });

  const isEditing = !!member?.id;

  // Reset form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        id: member.id,
        host: member.host || '',
        slackMemberId: member.slackMemberId || '',
      });
    } else {
      setFormData({ host: '', slackMemberId: '' });
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEditing ? 'Edit Member' : 'Add Member'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              value={formData.host || ''}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Slack ID"
              fullWidth
              value={formData.slackMemberId || ''}
              onChange={(e) => setFormData({ ...formData, slackMemberId: e.target.value })}
              required
            />
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

