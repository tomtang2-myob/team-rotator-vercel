/**
 * @fileoverview Database Layer - Edge Config Integration
 * 
 * This module provides the data access layer for the application.
 * It abstracts the underlying storage mechanism (Vercel Edge Config or in-memory cache)
 * and provides a consistent API for CRUD operations.
 * 
 * Storage Modes:
 * 1. **Production Mode**: Always uses Edge Config (Vercel's distributed key-value store)
 * 2. **Development Mode**:
 *    - By default: Uses in-memory cache (resets on server restart)
 *    - If NEXT_PUBLIC_USE_EDGE_CONFIG=true: Uses Edge Config (same as production)
 * 
 * Edge Config Benefits:
 * - Ultra-low latency reads (globally distributed)
 * - Persistent storage
 * - Shared across all team members
 * - No database management required
 * 
 * Data Structure in Edge Config:
 * - Key: "members" → Value: Member[]
 * - Key: "tasks" → Value: Task[]
 * - Key: "taskAssignments" → Value: TaskAssignment[]
 * - Key: "systemConfigs" → Value: SystemConfig[]
 * 
 * @module lib/db
 * @see {@link https://vercel.com/docs/storage/edge-config|Vercel Edge Config Docs}
 */

import { Member, Task, TaskAssignment, SystemConfig } from '@/types';
import { createClient } from '@vercel/edge-config';
import { logger } from './logger';

/**
 * Edge Config read client (singleton, lazy-loaded)
 * Initialized only when first needed to ensure environment variables are loaded
 */
let edgeConfigRead: ReturnType<typeof createClient> | null = null;

/**
 * Gets or creates the Edge Config client for read operations.
 * 
 * This uses lazy loading to avoid initialization issues with environment variables
 * in Next.js development mode. The client is created once and reused.
 * 
 * @returns Edge Config client if successfully initialized, null otherwise
 * 
 * @example
 * const client = getEdgeConfigClient();
 * if (client) {
 *   const members = await client.get('members');
 * }
 */
function getEdgeConfigClient() {
  if (edgeConfigRead) {
    return edgeConfigRead;
  }
  
  const EDGE_CONFIG = process.env.EDGE_CONFIG;
  
  if (!EDGE_CONFIG) {
    logger.warn('EDGE_CONFIG environment variable is not set');
    return null;
  }
  
  try {
    edgeConfigRead = createClient(EDGE_CONFIG);
    logger.info('Edge Config read client initialized successfully');
    return edgeConfigRead;
  } catch (error) {
    logger.error('Failed to initialize Edge Config client', { error: String(error) });
    return null;
  }
}

/**
 * Extracts the Edge Config ID from the EDGE_CONFIG connection string.
 * 
 * Edge Config URLs have format: https://edge-config.vercel.com/ecfg_xxx?token=xxx
 * This extracts "ecfg_xxx" which is needed for write operations via REST API.
 * 
 * @returns Edge Config ID (e.g., "ecfg_abc123"), or null if not found
 * 
 * @example
 * // EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_abc123?token=xyz"
 * const id = getEdgeConfigId();
 * // Returns: "ecfg_abc123"
 */
function getEdgeConfigId(): string | null {
  const EDGE_CONFIG = process.env.EDGE_CONFIG;
  if (!EDGE_CONFIG) return null;
  
  try {
    const url = new URL(EDGE_CONFIG);
    return url.pathname.split('/')[1] || null;
  } catch (error) {
    logger.error('Failed to parse EDGE_CONFIG URL', { error: String(error) });
    return null;
  }
}

/**
 * Gets the Vercel Access Token from environment variables.
 * 
 * This token is required for write operations to Edge Config.
 * Read operations use the token embedded in EDGE_CONFIG URL.
 * 
 * @returns Access token, or null if not set
 * @see {@link https://vercel.com/account/tokens|Create Vercel Access Token}
 */
function getVercelAccessToken(): string | null {
  return process.env.VERCEL_ACCESS_TOKEN || null;
}

/**
 * In-memory caches for development mode
 * These store data temporarily when not using Edge Config.
 * 
 * ⚠️ Warning: Data is lost on server restart!
 */
let membersCache: Member[] = [];
let tasksCache: Task[] = [];
let taskAssignmentsCache: TaskAssignment[] = [];
let systemConfigsCache: SystemConfig[] = [];

/**
 * Environment and configuration flags
 */
const isDev = process.env.NODE_ENV === 'development';
const useEdgeConfigInDev = process.env.NEXT_PUBLIC_USE_EDGE_CONFIG === 'true';

/**
 * Ensures a value is an array, converting null/undefined to empty array.
 * Prevents errors when Edge Config returns null for non-existent keys.
 * 
 * @param value - Value that might be null/undefined
 * @returns Array (empty if value was null/undefined)
 * 
 * @example
 * const members = ensureArray(await client.get('members'));
 * // If key doesn't exist, returns [] instead of null
 */
function ensureArray<T>(value: T[] | null | undefined): T[] {
  return value || [];
}

/**
 * Validates that Edge Config is initialized and ready to use.
 * Throws detailed error if not available.
 * 
 * @returns Edge Config client
 * @throws Error if Edge Config is not initialized
 * 
 * @example
 * try {
 *   const client = checkEdgeConfig();
 *   const data = await client.get('members');
 * } catch (error) {
 *   // Handle Edge Config not available
 * }
 */
function checkEdgeConfig() {
  const client = getEdgeConfigClient();
  if (!client) {
    const details = {
      hasEdgeConfig: !!process.env.EDGE_CONFIG,
      edgeConfigValue: process.env.EDGE_CONFIG ? 'SET' : 'NOT SET',
      isDev,
      useEdgeConfigInDev,
    };
    logger.error('Edge Config client is not initialized', details);
    console.error('Edge Config initialization failed:', details);
    throw new Error('Edge Config client is not initialized');
  }
  return client;
}

/**
 * Updates a key in Edge Config using Vercel's REST API.
 * 
 * This is used for all write operations (create, update, delete) because
 * the Edge Config SDK is read-only. The REST API requires VERCEL_ACCESS_TOKEN.
 * 
 * The operation is atomic - either succeeds completely or fails completely.
 * 
 * @param key - Edge Config key to update (e.g., "members", "tasks")
 * @param value - New value for the key (will be JSON-serialized)
 * @returns API response with status
 * @throws Error if update fails or credentials are missing
 * 
 * @example
 * // Update members array
 * const members = await getMembers();
 * members.push({ id: 17, host: "New Member", slackMemberId: "U123" });
 * await updateEdgeConfig('members', members);
 * 
 * @example
 * // Delete all tasks
 * await updateEdgeConfig('tasks', []);
 * 
 * @see {@link https://vercel.com/docs/rest-api/endpoints#update-your-edge-config-items|Edge Config API Docs}
 */
export async function updateEdgeConfig(key: string, value: any) {
  const EDGE_CONFIG_ID = getEdgeConfigId();
  const VERCEL_ACCESS_TOKEN = getVercelAccessToken();
  
  if (!EDGE_CONFIG_ID) {
    logger.error('Edge Config ID not found');
    throw new Error('Edge Config ID not found');
  }

  if (!VERCEL_ACCESS_TOKEN) {
    logger.error('VERCEL_ACCESS_TOKEN not found. This token is required for write operations.');
    throw new Error('VERCEL_ACCESS_TOKEN not found');
  }

  const url = `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`;
  
  try {
    logger.info('Updating Edge Config', { key, url });
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VERCEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key,
            value,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Failed to update Edge Config', { error, status: response.status });
      throw new Error(`Failed to update Edge Config: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    logger.info('Successfully updated Edge Config', { key, result });
    return result;
  } catch (error) {
    logger.error('Failed to update Edge Config', { error, key });
    throw error;
  }
}

// ============================================================================
// MEMBERS - CRUD Operations
// ============================================================================

/**
 * Retrieves all team members from storage.
 * 
 * Storage Source:
 * - Development (default): In-memory cache
 * - Development (NEXT_PUBLIC_USE_EDGE_CONFIG=true): Edge Config
 * - Production: Edge Config
 * 
 * @returns Array of all members, or empty array if none exist or fetch fails
 * 
 * @example
 * const members = await getMembers();
 * // Returns: [
 * //   { id: 8, host: "zhigang", slackMemberId: "U07F4TG8U8H" },
 * //   { id: 10, host: "An", slackMemberId: "U02JX33H8SY" },
 * //   ...
 * // ]
 * 
 * @example
 * // Check if any members exist
 * const members = await getMembers();
 * if (members.length === 0) {
 *   console.log('No members found!');
 * }
 */
export async function getMembers(): Promise<Member[]> {
  if (isDev && !useEdgeConfigInDev) {
    logger.info('Using local cache for members in development mode');
    return membersCache;
  }
  
  try {
    const client = checkEdgeConfig();
    const members = await client.get('members') as Member[] | null;
    return ensureArray(members);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to get members from Edge Config: ${errorMessage}`);
    console.error('Edge Config Error Details:', error);
    return [];
  }
}

/**
 * Creates a new team member with auto-generated ID.
 * 
 * The ID is automatically assigned as (max existing ID + 1).
 * If no members exist, starts at ID 1.
 * 
 * @param member - Member data without ID (host and slackMemberId required)
 * @returns Newly created member with assigned ID
 * @throws Error if Edge Config update fails
 * 
 * @example
 * const newMember = await createMember({
 *   host: "John Doe",
 *   slackMemberId: "U12345678"
 * });
 * // Returns: { id: 17, host: "John Doe", slackMemberId: "U12345678" }
 * 
 * @example
 * // Create first member (ID will be 1)
 * const firstMember = await createMember({
 *   host: "Alice",
 *   slackMemberId: "U11111111"
 * });
 * // Returns: { id: 1, host: "Alice", slackMemberId: "U11111111" }
 */
export async function createMember(member: Omit<Member, 'id'>): Promise<Member> {
  const members = await getMembers();
  
  // Filter out null IDs and find the maximum ID
  const maxId = members
    .filter(m => m.id !== null && m.id !== undefined)
    .reduce((max, m) => Math.max(max, m.id || 0), 0);
  
  const newMember: Member = {
    ...member,
    id: maxId + 1
  };

  if (isDev && !useEdgeConfigInDev) {
    membersCache.push(newMember);
    return newMember;
  }

  try {
    members.push(newMember);
    await updateEdgeConfig('members', members);
    return newMember;
  } catch (error) {
    logger.error('Failed to create member in Edge Config');
    throw error;
  }
}

/**
 * Updates an existing member or creates if not found.
 * 
 * If a member with the given ID exists, it's replaced.
 * If no member with that ID exists, the member is added.
 * 
 * @param member - Complete member object with ID
 * @returns Promise that resolves when update is complete
 * @throws Error if Edge Config update fails
 * 
 * @example
 * // Update existing member
 * await updateMember({
 *   id: 8,
 *   host: "zhigang (updated)",
 *   slackMemberId: "U07F4TG8U8H"
 * });
 * 
 * @example
 * // Update Slack ID only
 * const members = await getMembers();
 * const member = members.find(m => m.id === 10);
 * if (member) {
 *   member.slackMemberId = "U_NEW_ID";
 *   await updateMember(member);
 * }
 */
export async function updateMember(member: Member): Promise<void> {
  if (isDev && !useEdgeConfigInDev) {
    const index = membersCache.findIndex(m => m.id === member.id);
    if (index !== -1) {
      membersCache[index] = member;
    } else {
      membersCache.push(member);
    }
    return;
  }

  try {
    const members = await getMembers();
    const index = members.findIndex(m => m.id === member.id);
    if (index !== -1) {
      members[index] = member;
    } else {
      members.push(member);
    }
    await updateEdgeConfig('members', members);
  } catch (error) {
    logger.error('Failed to update member in Edge Config');
    throw error;
  }
}

/**
 * Deletes a member by ID.
 * 
 * ⚠️ Warning: This does NOT check if the member is assigned to any tasks.
 * Deleting a member who has active assignments will cause rotation errors.
 * Consider checking assignments first or implementing soft delete.
 * 
 * @param id - ID of the member to delete
 * @returns Promise that resolves when deletion is complete
 * @throws Error if Edge Config update fails
 * 
 * @example
 * // Delete member with ID 15
 * await deleteMember(15);
 * 
 * @example
 * // Safe deletion - check assignments first
 * const assignments = await getTaskAssignments();
 * const hasAssignments = assignments.some(a => a.memberId === 15);
 * if (!hasAssignments) {
 *   await deleteMember(15);
 * } else {
 *   console.error('Cannot delete member with active assignments');
 * }
 */
export async function deleteMember(id: number): Promise<void> {
  if (isDev && !useEdgeConfigInDev) {
    membersCache = membersCache.filter(m => m.id !== id);
    return;
  }

  try {
    const members = await getMembers();
    const filteredMembers = members.filter(m => m.id !== id);
    await updateEdgeConfig('members', filteredMembers);
  } catch (error) {
    logger.error('Failed to delete member from Edge Config');
    throw error;
  }
}

// ============================================================================
// TASKS - CRUD Operations
// ============================================================================

/**
 * Retrieves all tasks from storage.
 * 
 * Tasks define what needs to be rotated and how often.
 * Each task has a rotation rule (daily, weekly, biweekly).
 * 
 * @returns Array of all tasks, or empty array if none exist or fetch fails
 * 
 * @example
 * const tasks = await getTasks();
 * // Returns: [
 * //   { id: 1, name: "Standup", rotationRule: "weekly_friday" },
 * //   { id: 2, name: "English word", rotationRule: "daily" },
 * //   { id: 3, name: "Retro", rotationRule: "biweekly_wednesday" },
 * //   ...
 * // ]
 * 
 * @example
 * // Find all daily tasks
 * const tasks = await getTasks();
 * const dailyTasks = tasks.filter(t => t.rotationRule === 'daily');
 */
export async function getTasks(): Promise<Task[]> {
  if (isDev && !useEdgeConfigInDev) {
    logger.info('Using local cache for tasks in development mode');
    return tasksCache;
  }

  try {
    const client = checkEdgeConfig();
    const tasks = await client.get('tasks') as Task[] | null;
    return ensureArray(tasks);
  } catch (error) {
    logger.error('Failed to get tasks from Edge Config');
    return [];
  }
}

/**
 * Creates a new task with auto-generated ID.
 * 
 * The ID is automatically assigned as (max existing ID + 1).
 * Rotation rule must be valid: "daily" or "<frequency>_<day>".
 * 
 * @param task - Task data without ID (name and rotationRule required)
 * @returns Newly created task with assigned ID
 * @throws Error if Edge Config update fails
 * 
 * @example
 * const newTask = await createTask({
 *   name: "Code Review",
 *   rotationRule: "weekly_monday"
 * });
 * // Returns: { id: 6, name: "Code Review", rotationRule: "weekly_monday" }
 * 
 * @example
 * // Create daily task
 * const dailyTask = await createTask({
 *   name: "Stand-up Host",
 *   rotationRule: "daily"
 * });
 */
export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const tasks = await getTasks();
  
  // Filter out null IDs and find the maximum ID
  const maxId = tasks
    .filter(t => t.id !== null && t.id !== undefined)
    .reduce((max, t) => Math.max(max, t.id || 0), 0);
  
  const newTask: Task = {
    ...task,
    id: maxId + 1
  };

  if (isDev && !useEdgeConfigInDev) {
    tasksCache.push(newTask);
    return newTask;
  }

  try {
    tasks.push(newTask);
    await updateEdgeConfig('tasks', tasks);
    return newTask;
  } catch (error) {
    logger.error('Failed to create task in Edge Config');
    throw error;
  }
}

/**
 * Updates an existing task or creates if not found.
 * 
 * ⚠️ Warning: Changing rotation rule affects future rotations immediately.
 * Existing assignments are not automatically updated.
 * 
 * @param task - Complete task object with ID
 * @returns Promise that resolves when update is complete
 * @throws Error if Edge Config update fails
 * 
 * @example
 * // Change rotation frequency
 * await updateTask({
 *   id: 1,
 *   name: "Standup",
 *   rotationRule: "biweekly_friday" // Changed from weekly to biweekly
 * });
 * 
 * @example
 * // Rename task
 * const tasks = await getTasks();
 * const task = tasks.find(t => t.id === 2);
 * if (task) {
 *   task.name = "Daily English Word (New Name)";
 *   await updateTask(task);
 * }
 */
export async function updateTask(task: Task): Promise<void> {
  if (isDev && !useEdgeConfigInDev) {
    const index = tasksCache.findIndex(t => t.id === task.id);
    if (index !== -1) {
      tasksCache[index] = task;
    } else {
      tasksCache.push(task);
    }
    return;
  }

  try {
    const tasks = await getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    await updateEdgeConfig('tasks', tasks);
  } catch (error) {
    logger.error('Failed to update task in Edge Config');
    throw error;
  }
}

/**
 * Deletes a task by ID.
 * 
 * ⚠️ Warning: This does NOT delete associated task assignments.
 * Orphaned assignments will cause errors. Delete assignments first.
 * 
 * @param id - ID of the task to delete
 * @returns Promise that resolves when deletion is complete
 * @throws Error if Edge Config update fails
 * 
 * @example
 * // Safe deletion - remove assignments first
 * const assignments = await getTaskAssignments();
 * const taskAssignments = assignments.filter(a => a.taskId === 5);
 * 
 * // Delete all assignments for this task
 * for (const assignment of taskAssignments) {
 *   // (Note: there's no deleteAssignment function, 
 *   //  so you'd need to update the array manually)
 * }
 * 
 * // Then delete the task
 * await deleteTask(5);
 */
export async function deleteTask(id: number): Promise<void> {
  if (isDev && !useEdgeConfigInDev) {
    tasksCache = tasksCache.filter(t => t.id !== id);
    return;
  }

  try {
    const tasks = await getTasks();
    const filteredTasks = tasks.filter(t => t.id !== id);
    await updateEdgeConfig('tasks', filteredTasks);
  } catch (error) {
    logger.error('Failed to delete task from Edge Config');
    throw error;
  }
}

// ============================================================================
// TASK ASSIGNMENTS - Operations
// ============================================================================

/**
 * Retrieves all task assignments from storage.
 * 
 * Task assignments link tasks to members with a date range.
 * Each task typically has ONE active assignment at a time.
 * 
 * @returns Array of all assignments, or empty array if none exist or fetch fails
 * 
 * @example
 * const assignments = await getTaskAssignments();
 * // Returns: [
 * //   { id: 1, taskId: 1, memberId: 15, startDate: "2025-12-30", endDate: "2026-01-03" },
 * //   { id: 2, taskId: 2, memberId: 13, startDate: "2025-12-30", endDate: "2025-12-30" },
 * //   ...
 * // ]
 * 
 * @example
 * // Find current assignment for a specific task
 * const assignments = await getTaskAssignments();
 * const today = new Date().toISOString().split('T')[0];
 * const currentAssignment = assignments.find(a => 
 *   a.taskId === 1 && 
 *   a.startDate <= today && 
 *   a.endDate >= today
 * );
 */
export async function getTaskAssignments(): Promise<TaskAssignment[]> {
  if (isDev && !useEdgeConfigInDev) {
    logger.info('Using local cache for task assignments in development mode');
    return taskAssignmentsCache;
  }

  try {
    const client = checkEdgeConfig();
    const assignments = await client.get('taskAssignments') as TaskAssignment[] | null;
    return ensureArray(assignments);
  } catch (error) {
    logger.error('Failed to get task assignments from Edge Config');
    return [];
  }
}

/**
 * Updates an existing task assignment or creates if not found.
 * 
 * This is the PRIMARY function used by the rotation system to update assignments.
 * Called automatically by updateTaskAssignments() during rotation.
 * 
 * The function updates:
 * - memberId: Who is assigned to the task
 * - startDate: When the assignment period starts
 * - endDate: When the assignment period ends
 * 
 * @param assignment - Complete assignment object with ID
 * @returns Promise that resolves when update is complete
 * @throws Error if Edge Config update fails
 * 
 * @example
 * // Rotate to next member (done by rotation system)
 * const assignment = await getTaskAssignments().then(a => a.find(a => a.id === 1));
 * if (assignment) {
 *   assignment.memberId = 16; // Next member
 *   assignment.startDate = "2026-01-06";
 *   assignment.endDate = "2026-01-10";
 *   await updateTaskAssignment(assignment);
 * }
 * 
 * @example
 * // Manual assignment override
 * await updateTaskAssignment({
 *   id: 2,
 *   taskId: 2,
 *   memberId: 14, // Assign to specific member
 *   startDate: "2025-12-30",
 *   endDate: "2025-12-30"
 * });
 * 
 * @see {@link updateTaskAssignments} Main rotation orchestrator that calls this
 */
export async function updateTaskAssignment(assignment: TaskAssignment): Promise<void> {
  if (isDev && !useEdgeConfigInDev) {
    const index = taskAssignmentsCache.findIndex(a => a.id === assignment.id);
    if (index !== -1) {
      taskAssignmentsCache[index] = assignment;
    } else {
      taskAssignmentsCache.push(assignment);
    }
    return;
  }

  try {
    const assignments = await getTaskAssignments();
    const index = assignments.findIndex(a => a.id === assignment.id);
    if (index !== -1) {
      assignments[index] = assignment;
    } else {
      assignments.push(assignment);
    }
    await updateEdgeConfig('taskAssignments', assignments);
  } catch (error) {
    logger.error('Failed to update task assignment in Edge Config');
    throw error;
  }
}

// ============================================================================
// SYSTEM CONFIGS - Settings Management
// ============================================================================

/**
 * Retrieves all system configuration settings.
 * 
 * System configs store application-wide settings like:
 * - Slack webhook URL
 * - Feature flags
 * - Other global configuration
 * 
 * @returns Array of all configs, or empty array if none exist or fetch fails
 * 
 * @example
 * const configs = await getSystemConfigs();
 * // Returns: [
 * //   {
 * //     key: "Slack:WebhookUrl",
 * //     value: "https://hooks.slack.com/services/...",
 * //     lastModified: "2025-12-30T00:00:00.000Z",
 * //     modifiedBy: null
 * //   }
 * // ]
 * 
 * @example
 * // Get Slack webhook URL
 * const configs = await getSystemConfigs();
 * const slackConfig = configs.find(c => c.key === 'Slack:WebhookUrl');
 * const webhookUrl = slackConfig?.value;
 */
export async function getSystemConfigs(): Promise<SystemConfig[]> {
  if (isDev && !useEdgeConfigInDev) {
    logger.info('Using local cache for system configs in development mode');
    return systemConfigsCache;
  }

  try {
    const client = checkEdgeConfig();
    const configs = await client.get('systemConfigs') as SystemConfig[] | null;
    return ensureArray(configs);
  } catch (error) {
    logger.error('Failed to get system configs from Edge Config');
    return [];
  }
}

/**
 * Saves a system configuration setting (creates or updates).
 * 
 * Configs are identified by key. If a config with the same key exists,
 * it's updated. Otherwise, a new config is created.
 * 
 * Common use case: Updating Slack webhook URL from Settings page.
 * 
 * @param config - Complete config object with key and value
 * @returns Promise that resolves when save is complete
 * @throws Error if Edge Config update fails
 * 
 * @example
 * // Save Slack webhook URL
 * await saveSystemConfig({
 *   key: "Slack:WebhookUrl",
 *   value: "https://hooks.slack.com/services/T02998537/B0970HFURLP/...",
 *   lastModified: new Date().toISOString(),
 *   modifiedBy: "admin"
 * });
 * 
 * @example
 * // Add a new config
 * await saveSystemConfig({
 *   key: "Feature:EnableNotifications",
 *   value: "true",
 *   lastModified: new Date().toISOString(),
 *   modifiedBy: null
 * });
 * 
 * @example
 * // Update existing config
 * const configs = await getSystemConfigs();
 * const slackConfig = configs.find(c => c.key === 'Slack:WebhookUrl');
 * if (slackConfig) {
 *   slackConfig.value = "https://hooks.slack.com/services/NEW_URL";
 *   slackConfig.lastModified = new Date().toISOString();
 *   await saveSystemConfig(slackConfig);
 * }
 */
export async function saveSystemConfig(config: SystemConfig): Promise<void> {
  if (isDev && !useEdgeConfigInDev) {
    const index = systemConfigsCache.findIndex(c => c.key === config.key);
    if (index !== -1) {
      systemConfigsCache[index] = config;
    } else {
      systemConfigsCache.push(config);
    }
    return;
  }

  try {
    const configs = await getSystemConfigs();
    const index = configs.findIndex(c => c.key === config.key);
    if (index !== -1) {
      configs[index] = config;
    } else {
      configs.push(config);
    }

    // Update Edge Config and wait for result
    const result = await updateEdgeConfig('systemConfigs', configs);
    logger.info('System config saved successfully', { config, result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to save system config in Edge Config', { error: errorMessage, config });
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS - Composite Queries
// ============================================================================

/**
 * Gets task assignments enriched with task and member details.
 * 
 * This is a convenience function that joins assignments with their
 * related task and member data. Used for displaying assignments in the UI.
 * 
 * Returns assignments with additional fields:
 * - taskName: Name of the task
 * - host: Name of the assigned member
 * - slackMemberId: Slack ID of the assigned member
 * 
 * @returns Array of enriched assignments with task and member details
 * 
 * @example
 * const detailedAssignments = await getTaskAssignmentsWithDetails();
 * // Returns: [
 * //   {
 * //     id: 1,
 * //     taskId: 1,
 * //     memberId: 15,
 * //     startDate: "2025-12-30",
 * //     endDate: "2026-01-03",
 * //     taskName: "Standup",              // Added from tasks
 * //     host: "Tom",                      // Added from members
 * //     slackMemberId: "U07F4TGYYYY"      // Added from members
 * //   },
 * //   ...
 * // ]
 * 
 * @example
 * // Display in UI table
 * const assignments = await getTaskAssignmentsWithDetails();
 * assignments.forEach(a => {
 *   console.log(`${a.taskName}: ${a.host} (${a.startDate} - ${a.endDate})`);
 * });
 * // Output:
 * // Standup: Tom (2025-12-30 - 2026-01-03)
 * // English word: zhigang (2025-12-30 - 2025-12-30)
 * // ...
 */
export async function getTaskAssignmentsWithDetails(): Promise<any[]> {
  const [assignments, tasks, members] = await Promise.all([
    getTaskAssignments(),
    getTasks(),
    getMembers(),
  ]);

  return assignments.map(assignment => {
    const task = tasks.find(t => t.id === assignment.taskId);
    const member = members.find(m => m.id === assignment.memberId);
    return {
      ...assignment,
      taskName: task?.name || 'Unknown Task',
      host: member?.host || 'Unknown Host',
      slackMemberId: member?.slackMemberId || '',
    };
  });
} 