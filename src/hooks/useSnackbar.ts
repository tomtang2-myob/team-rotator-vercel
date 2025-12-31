'use client';

import { useState, useCallback } from 'react';

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

/**
 * Custom hook for managing snackbar notifications
 * 
 * Provides a simple interface for showing success/error messages
 * 
 * @example
 * ```tsx
 * const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
 * 
 * // Show success message
 * showSuccess('Operation completed!');
 * 
 * // Show error message
 * showError('Something went wrong');
 * 
 * // Use in JSX
 * <Snackbar open={snackbar.open} onClose={closeSnackbar}>
 *   <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
 * </Snackbar>
 * ```
 */
export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const showSuccess = useCallback((message: string) => {
    showSnackbar(message, 'success');
  }, [showSnackbar]);

  const showError = useCallback((message: string) => {
    showSnackbar(message, 'error');
  }, [showSnackbar]);

  const showWarning = useCallback((message: string) => {
    showSnackbar(message, 'warning');
  }, [showSnackbar]);

  const showInfo = useCallback((message: string) => {
    showSnackbar(message, 'info');
  }, [showSnackbar]);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    snackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeSnackbar,
  };
}

