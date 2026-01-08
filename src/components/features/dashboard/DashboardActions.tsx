'use client';

import { Button, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon, Send as SendIcon, RocketLaunch as RocketIcon } from '@mui/icons-material';

interface DashboardActionsProps {
  onUpdateRotation: () => void;
  onKickOffSprint: () => void;
  onSendToSlack: () => void;
  isUpdating: boolean;
}

/**
 * Action buttons for the dashboard header
 */
export function DashboardActions({
  onUpdateRotation,
  onKickOffSprint,
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
        color="secondary"
        onClick={onKickOffSprint}
        disabled={isUpdating}
        startIcon={<RocketIcon />}
        title="Start a new sprint from a selected date"
      >
        Kick Off Sprint
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

