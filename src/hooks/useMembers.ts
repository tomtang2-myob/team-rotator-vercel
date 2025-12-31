'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMembers, createMember, updateMember, deleteMember } from '@/services/api';
import { Member } from '@/types';

/**
 * Custom hook for managing team members
 * 
 * Provides:
 * - members: List of all members
 * - isLoading: Loading state
 * - error: Error state
 * - createMember: Mutation to create a new member
 * - updateMember: Mutation to update a member
 * - deleteMember: Mutation to delete a member
 * 
 * @example
 * ```tsx
 * const { members, isLoading, createMemberMutation } = useMembers();
 * 
 * // Create a new member
 * createMemberMutation.mutate({ host: 'John', slackMemberId: 'U123' });
 * ```
 */
export function useMembers() {
  const queryClient = useQueryClient();

  // Query for fetching members
  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: getMembers,
    retry: 3,
    retryDelay: 1000,
  });

  // Mutation for creating a member
  const createMemberMutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  // Mutation for updating a member
  const updateMemberMutation = useMutation({
    mutationFn: updateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  // Mutation for deleting a member
  const deleteMemberMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  return {
    // Data
    members,
    isLoading,
    error,
    refetch,
    
    // Mutations
    createMemberMutation,
    updateMemberMutation,
    deleteMemberMutation,
  };
}

