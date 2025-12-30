/**
 * @fileoverview Frontend API Client
 * 
 * This module provides type-safe API client functions for the React frontend.
 * It wraps all backend API endpoints with proper TypeScript types and error handling.
 * 
 * Used by:
 * - React Query hooks in frontend pages
 * - React components for data fetching
 * - Frontend event handlers (forms, buttons)
 * 
 * Features:
 * - Axios-based HTTP client
 * - Automatic base URL detection (dev vs prod)
 * - Centralized error handling and logging
 * - TypeScript type safety for all requests/responses
 * 
 * API Structure:
 * - Members: CRUD operations for team members
 * - Tasks: CRUD operations for tasks
 * - Assignments: Get/update assignments, trigger rotation
 * - System Config: Get/save Slack webhook and other settings
 * 
 * @module services/api
 */

import axios, { AxiosError } from 'axios';
import { Member, Task, TaskAssignment, SystemConfig, TaskAssignmentWithDetails } from '@/types';

/**
 * Base URL for API requests
 * - Development: http://localhost:3000/api (full URL needed for SSR)
 * - Production: /api (relative URL works)
 */
const baseURL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api'
  : '/api';

/**
 * Axios instance configured for the application
 * All API functions use this instance
 */
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Centralized error handler for API requests.
 * 
 * Logs detailed error information to console and re-throws the error
 * so React Query can handle it properly (show error state, retry, etc.)
 * 
 * @param error - Axios error object
 * @param context - Description of which API call failed (for logging)
 * @throws The original error after logging
 * 
 * @example
 * try {
 *   const response = await api.get('/members');
 *   return response.data;
 * } catch (error) {
 *   return handleApiError(error as AxiosError, 'getMembers');
 * }
 */
const handleApiError = (error: AxiosError, context: string) => {
  console.error(`API Error in ${context}:`, {
    status: error.response?.status,
    data: error.response?.data,
    config: {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
    }
  });
  throw error;
};

// ============================================================================
// MEMBERS API - Frontend client for /api/members
// ============================================================================

/**
 * Fetches all team members.
 * 
 * @returns Promise resolving to array of members
 * @throws AxiosError if request fails
 * 
 * @example
 * // In React component
 * const { data: members } = useQuery(['members'], getMembers);
 * 
 * @example
 * // In event handler
 * const members = await getMembers();
 * console.log(`Found ${members.length} members`);
 */
export const getMembers = async (): Promise<Member[]> => {
  try {
    const response = await api.get('/members');
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'getMembers');
  }
};

/**
 * Creates a new team member.
 * 
 * @param member - Member data (without ID, auto-generated)
 * @returns Promise resolving to created member with ID
 * @throws AxiosError if creation fails (e.g., duplicate slackMemberId)
 * 
 * @example
 * const newMember = await createMember({
 *   host: "John Doe",
 *   slackMemberId: "U12345678"
 * });
 * // Returns: { id: 17, host: "John Doe", slackMemberId: "U12345678" }
 */
export const createMember = async (member: { host: string; slackMemberId: string }): Promise<Member> => {
  try {
    const response = await api.post('/members', member);
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'createMember');
  }
};

/**
 * Updates an existing member.
 * 
 * @param member - Complete member object with ID
 * @returns Promise resolving to updated member
 * @throws AxiosError if update fails
 * 
 * @example
 * await updateMember({
 *   id: 8,
 *   host: "zhigang (updated)",
 *   slackMemberId: "U07F4TG8U8H"
 * });
 */
export const updateMember = async (member: Member): Promise<Member> => {
  try {
    const response = await api.put('/members', member);
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'updateMember');
  }
};

/**
 * Deletes a member by ID.
 * 
 * ⚠️ Warning: Does not check for active assignments. Deleting a member
 * with assignments will cause rotation errors.
 * 
 * @param id - Member ID to delete
 * @returns Promise resolving when deletion completes
 * @throws AxiosError if deletion fails
 * 
 * @example
 * await deleteMember(15);
 */
export const deleteMember = async (id: number): Promise<void> => {
  try {
    await api.delete(`/members?id=${id}`);
  } catch (error) {
    return handleApiError(error as AxiosError, 'deleteMember');
  }
};

// ============================================================================
// TASKS API - Frontend client for /api/tasks
// ============================================================================

/**
 * Fetches all tasks.
 * 
 * @returns Promise resolving to array of tasks
 * @throws AxiosError if request fails
 */
export const getTasks = async (): Promise<Task[]> => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'getTasks');
  }
};

/** Creates a new task. ID is auto-generated. */
export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  try {
    const response = await api.post('/tasks', task);
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'createTask');
  }
};

/** Updates an existing task. */
export const updateTask = async (task: Task): Promise<Task> => {
  try {
    const response = await api.put('/tasks', task);
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'updateTask');
  }
};

/** Deletes a task by ID. ⚠️ Does not delete associated assignments. */
export const deleteTask = async (id: number): Promise<void> => {
  try {
    await api.delete(`/tasks?id=${id}`);
  } catch (error) {
    return handleApiError(error as AxiosError, 'deleteTask');
  }
};

// ============================================================================
// TASK ASSIGNMENTS API - Frontend client for /api/assignments
// ============================================================================

/**
 * Fetches all task assignments with enriched details.
 * Includes task name, member name, and Slack ID for display.
 * 
 * @returns Promise resolving to array of detailed assignments
 */
export const getAssignments = async (): Promise<TaskAssignmentWithDetails[]> => {
  try {
  const response = await api.get('/assignments');
  return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'getAssignments');
  }
};

/** Creates a new assignment. ID is auto-generated. */
export const saveAssignment = async (assignment: Omit<TaskAssignment, 'id'>): Promise<TaskAssignmentWithDetails> => {
  try {
  const response = await api.post('/assignments', assignment);
  return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'saveAssignment');
  }
};

/** Updates an existing assignment. */
export const updateAssignment = async (assignment: TaskAssignmentWithDetails): Promise<TaskAssignmentWithDetails> => {
  try {
  const response = await api.put('/assignments', assignment);
  return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'updateAssignment');
  }
};

/**
 * Triggers manual rotation update.
 * 
 * This calls the updateRotation() service which:
 * 1. Checks if today is a working day
 * 2. Updates all task assignments
 * 3. Sends Slack notifications
 * 
 * Used by: "Update Rotation" button on Dashboard
 * 
 * @throws AxiosError if rotation fails
 * 
 * @example
 * // Button click handler
 * const handleRotate = async () => {
 *   await triggerRotationUpdate();
 *   refetch(); // Refresh assignments display
 * };
 */
export const triggerRotationUpdate = async (): Promise<void> => {
  try {
  await api.post('/assignments/update-rotation');
  } catch (error) {
    return handleApiError(error as AxiosError, 'triggerRotationUpdate');
  }
};

/**
 * Sends current assignments to Slack without updating them.
 * 
 * Used by: "Send to Slack" button on Dashboard
 * 
 * @throws AxiosError if send fails or webhook not configured
 * 
 * @example
 * // Button click handler
 * const handleSendToSlack = async () => {
 *   await sendToSlack();
 *   alert('Sent to Slack!');
 * };
 */
export const sendToSlack = async (): Promise<void> => {
  try {
  await api.post('/assignments/send-to-slack');
  } catch (error) {
    return handleApiError(error as AxiosError, 'sendToSlack');
  }
};

// ============================================================================
// SYSTEM CONFIG API - Frontend client for /api/config
// ============================================================================

/** Fetches all system configuration settings. */
export const getSystemConfigs = async (): Promise<SystemConfig[]> => {
  try {
  const response = await api.get('/config');
  return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'getSystemConfigs');
  }
};

/** Saves a system configuration setting (create or update). */
export const saveSystemConfig = async (config: SystemConfig): Promise<SystemConfig> => {
  try {
  const response = await api.post('/config', config);
  return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, 'saveSystemConfig');
  }
};

// ============================================================================
// WEBHOOK URL HELPERS - Convenience functions for Slack config
// ============================================================================

/**
 * Gets the current Slack webhook URL from system config.
 * 
 * @returns Webhook URL string, or empty string if not configured
 * 
 * @example
 * const webhookUrl = await getWebhookUrl();
 * if (!webhookUrl) {
 *   alert('Please configure Slack webhook in Settings');
 * }
 */
export const getWebhookUrl = async (): Promise<string> => {
  try {
  const response = await api.get('/config');
  const configs = response.data;
  const webhookConfig = configs.find((c: SystemConfig) => c.key === 'Slack:WebhookUrl');
  return webhookConfig?.value || '';
  } catch (error) {
    return handleApiError(error as AxiosError, 'getWebhookUrl');
  }
};

/**
 * Updates the Slack webhook URL in system config.
 * 
 * Used by: Settings page form
 * 
 * @param webhookUrl - New webhook URL
 * @throws AxiosError if update fails
 * 
 * @example
 * // Settings form submit handler
 * const handleSubmit = async (url: string) => {
 *   await updateWebhookUrl(url);
 *   alert('Webhook URL updated!');
 * };
 */
export const updateWebhookUrl = async (webhookUrl: string): Promise<void> => {
  try {
  await saveSystemConfig({
    key: 'Slack:WebhookUrl',
    value: webhookUrl,
    lastModified: new Date().toISOString(),
    modifiedBy: null
  });
  } catch (error) {
    return handleApiError(error as AxiosError, 'updateWebhookUrl');
  }
}; 