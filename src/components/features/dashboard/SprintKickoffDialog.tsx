'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { RocketLaunch as RocketIcon } from '@mui/icons-material';

interface SprintKickoffDialogProps {
  open: boolean;
  onKickoff: (date: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

/**
 * Dialog for kicking off a new sprint with a date picker
 */
export function SprintKickoffDialog({
  open,
  onKickoff,
  onClose,
  isLoading,
}: SprintKickoffDialogProps) {
  // Default to today's date
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const handleKickoff = async () => {
    await onKickoff(selectedDate);
  };

  // Reset date when dialog opens
  const handleClose = () => {
    setSelectedDate(today);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RocketIcon color="primary" />
        Kick Off Sprint
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Select the start date for the new sprint. All tasks will rotate to the next member and start fresh from this date.
          </Typography>
          <TextField
            label="Sprint Start Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Each task will rotate to the next member with fresh rotation periods"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleKickoff}
          variant="contained"
          color="primary"
          disabled={isLoading || !selectedDate}
          startIcon={isLoading ? <CircularProgress size={20} /> : <RocketIcon />}
        >
          {isLoading ? 'Kicking Off...' : 'Kick Off Sprint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

