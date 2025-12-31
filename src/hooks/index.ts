/**
 * Custom Hooks Index
 * 
 * This module exports all custom hooks used throughout the application.
 * Custom hooks encapsulate reusable stateful logic and data fetching.
 * 
 * @example
 * ```tsx
 * import { useMembers, useTasks, useSnackbar } from '@/hooks';
 * ```
 */

export { useMembers } from './useMembers';
export { useTasks } from './useTasks';
export { useAssignments, getAssignmentStatus, generateSlackPreview } from './useAssignments';
export { useSnackbar } from './useSnackbar';
export type { SnackbarSeverity } from './useSnackbar';

