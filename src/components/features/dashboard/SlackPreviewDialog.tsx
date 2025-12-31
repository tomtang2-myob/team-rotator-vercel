'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material';

interface SlackPreviewDialogProps {
  open: boolean;
  preview: string;
  onSend: () => void;
  onClose: () => void;
}

/**
 * Dialog showing Slack message preview before sending
 */
export function SlackPreviewDialog({
  open,
  preview,
  onSend,
  onClose,
}: SlackPreviewDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Send to Slack</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to send the current assignments to Slack?
        </DialogContentText>
        <Box sx={{ mt: 2, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {preview}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSend} variant="contained" color="primary">
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}

