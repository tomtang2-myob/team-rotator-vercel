'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAssignments,
  updateAssignment,
  triggerRotationUpdate,
  sendToSlack,
} from '@/services/api';
import { TaskAssignmentWithDetails, Member } from '@/types';
import { parseISO } from 'date-fns';

/**
 * Custom hook for managing task assignments
 * 
 * Provides:
 * - assignments: List of all assignments
 * - currentAssignments: Only the latest assignment for each task
 * - isLoading: Loading state
 * - error: Error state
 * - updateAssignment: Mutation to update an assignment
 * - updateRotation: Mutation to trigger rotation update
 * - sendToSlack: Mutation to send assignments to Slack
 * 
 * @example
 * ```tsx
 * const { currentAssignments, updateRotationMutation } = useAssignments();
 * 
 * // Trigger rotation update
 * updateRotationMutation.mutate();
 * ```
 */
export function useAssignments() {
  const queryClient = useQueryClient();

  // Query for fetching assignments
  const {
    data: assignments = [],
    isLoading,
    error,
    refetch,
  } = useQuery<TaskAssignmentWithDetails[]>({
    queryKey: ['assignments'],
    queryFn: getAssignments,
    retry: 3,
    retryDelay: 1000,
  });

  // Compute current assignments (latest for each task)
  const currentAssignments = useMemo(() => {
    const latestAssignments = new Map<number, TaskAssignmentWithDetails>();
    
    assignments.forEach((assignment) => {
      const existingAssignment = latestAssignments.get(assignment.taskId);
      if (
        !existingAssignment ||
        new Date(assignment.startDate) > new Date(existingAssignment.startDate)
      ) {
        latestAssignments.set(assignment.taskId, assignment);
      }
    });

    return Array.from(latestAssignments.values()).sort((a, b) => a.id - b.id);
  }, [assignments]);

  // Compute sorted history (by start date descending)
  const assignmentHistory = useMemo(() => {
    return [...assignments].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [assignments]);

  // Mutation for updating an assignment
  const updateAssignmentMutation = useMutation({
    mutationFn: (assignment: TaskAssignmentWithDetails) => updateAssignment(assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  // Mutation for triggering rotation update
  const updateRotationMutation = useMutation({
    mutationFn: triggerRotationUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  // Mutation for sending to Slack
  const sendToSlackMutation = useMutation({
    mutationFn: sendToSlack,
  });

  return {
    // Data
    assignments,
    currentAssignments,
    assignmentHistory,
    isLoading,
    error,
    refetch,
    
    // Mutations
    updateAssignmentMutation,
    updateRotationMutation,
    sendToSlackMutation,
  };
}

/**
 * Helper function to get assignment status
 */
export function getAssignmentStatus(startDate: string, endDate: string): 'Current' | 'Upcoming' | 'Past' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (today >= start && today <= end) {
    return 'Current';
  } else if (today > end) {
    return 'Past';
  }
  return 'Upcoming';
}

/**
 * Generate Slack message preview
 */
export function generateSlackPreview(
  assignments: TaskAssignmentWithDetails[],
  members: Member[]
): string {
  const sortedAssignments = [...assignments].sort((a, b) => a.id - b.id);
  const allMembers = [...members].sort((a, b) => a.id - b.id);

  if (sortedAssignments.length === 0) {
    return '';
  }

  let message = '';
  for (const assignment of sortedAssignments) {
    message += `${assignment.taskName}: ${assignment.host}\n`;

    // Special handling for English word task
    if (assignment.taskName === 'English word') {
      const currentMemberIndex = allMembers.findIndex((m) => m.id === assignment.memberId);
      if (currentMemberIndex !== -1) {
        const nextOneMember = allMembers[(currentMemberIndex + 1) % allMembers.length];
        const nextTwoMember = allMembers[(currentMemberIndex + 2) % allMembers.length];

        message += `English word(Day + 1): ${nextOneMember.host}\n`;
        message += `English word(Day + 2): ${nextTwoMember.host}\n`;
      }
    }
  }

  return message;
}

