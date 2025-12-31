'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask } from '@/services/api';
import { Task } from '@/types';

/**
 * Custom hook for managing tasks
 * 
 * Provides:
 * - tasks: List of all tasks
 * - isLoading: Loading state
 * - error: Error state
 * - createTask: Mutation to create a new task
 * - updateTask: Mutation to update a task
 * - deleteTask: Mutation to delete a task
 * 
 * @example
 * ```tsx
 * const { tasks, isLoading, createTaskMutation } = useTasks();
 * 
 * // Create a new task
 * createTaskMutation.mutate({ name: 'Daily Standup', rotationRule: 'daily' });
 * ```
 */
export function useTasks() {
  const queryClient = useQueryClient();

  // Query for fetching tasks
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: getTasks,
    retry: 3,
    retryDelay: 1000,
  });

  // Mutation for creating a task
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation for updating a task
  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation for deleting a task
  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    // Data
    tasks,
    isLoading,
    error,
    refetch,
    
    // Mutations
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
  };
}

