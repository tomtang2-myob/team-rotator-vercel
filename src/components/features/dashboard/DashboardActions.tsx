'use client';

import { Button, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon, Send as SendIcon } from '@mui/icons-material';

interface DashboardActionsProps {
  onUpdateRotation: () => void;
  onSendToSlack: () => void;
  isUpdating: boolean;
}

/**
 * Action buttons for the dashboard header
 */
export function DashboardActions({
  onUpdateRotation,
  onSendToSlack,
  isUpdating,
}: DashboardActionsProps) {
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={onUpdateRotation}
        disabled={isUpdating}
        startIcon={isUpdating ? <CircularProgress size={20} /> : <RefreshIcon />}
      >
        Update Rotation
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={onSendToSlack}
        disabled={isUpdating}
        startIcon={<SendIcon />}
      >
        Send to Slack
      </Button>
    </>
  );
}

