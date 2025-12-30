import { Member, Task, TaskAssignment, SystemConfig } from '@/types';
import { createClient } from '@vercel/edge-config';
import { logger } from './logger';

// Edge Config client configuration (lazy-loaded)
let edgeConfigRead: ReturnType<typeof createClient> | null = null;

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

function getVercelAccessToken(): string | null {
  return process.env.VERCEL_ACCESS_TOKEN || null;
}

// In-memory cache for development environment
let membersCache: Member[] = [];
let tasksCache: Task[] = [];
let taskAssignmentsCache: TaskAssignment[] = [];
let systemConfigsCache: SystemConfig[] = [];

const isDev = process.env.NODE_ENV === 'development';
const useEdgeConfigInDev = process.env.NEXT_PUBLIC_USE_EDGE_CONFIG === 'true';

// Helper function: ensure array exists
function ensureArray<T>(value: T[] | null | undefined): T[] {
  return value || [];
}

// Helper function: check if Edge Config is available
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

// Helper function: update Edge Config using Vercel REST API
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

// Members
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

// Tasks
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

// Task Assignments
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

// System Configs
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

// Get task assignments with detailed information
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