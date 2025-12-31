'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

/**
 * Reusable confirmation dialog component
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   confirmLabel="Delete"
 *   confirmColor="error"
 *   onConfirm={handleDelete}
 *   onCancel={() => setIsOpen(false)}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {typeof message === 'string' ? (
          <DialogContentText>{message}</DialogContentText>
        ) : (
          message
        )}
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button onClick={onConfirm} variant="contained" color={confirmColor}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

