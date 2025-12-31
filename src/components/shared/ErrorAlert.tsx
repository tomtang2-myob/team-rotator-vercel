'use client';

import { Box, Alert, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Reusable error alert component with optional retry button
 * 
 * @example
 * ```tsx
 * <ErrorAlert 
 *   message="Failed to load data" 
 *   onRetry={() => refetch()} 
 * />
 * ```
 */
export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <Box p={3}>
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
      >
        {message}
      </Alert>
    </Box>
  );
}

