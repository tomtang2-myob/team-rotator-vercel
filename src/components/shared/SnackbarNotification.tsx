'use client';

import { Snackbar, Alert } from '@mui/material';
import { SnackbarSeverity } from '@/hooks/useSnackbar';

interface SnackbarNotificationProps {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
  onClose: () => void;
  autoHideDuration?: number;
}

/**
 * Reusable snackbar notification component
 * 
 * @example
 * ```tsx
 * const { snackbar, closeSnackbar } = useSnackbar();
 * 
 * <SnackbarNotification
 *   open={snackbar.open}
 *   message={snackbar.message}
 *   severity={snackbar.severity}
 *   onClose={closeSnackbar}
 * />
 * ```
 */
export function SnackbarNotification({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
}: SnackbarNotificationProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert severity={severity} onClose={onClose} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}

