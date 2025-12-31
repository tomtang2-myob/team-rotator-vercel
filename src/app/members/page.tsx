'use client';

import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Hooks
import { useMembers, useSnackbar } from '@/hooks';

// Shared Components
import { PageHeader, ConfirmDialog, SnackbarNotification } from '@/components/shared';

// Feature Components
import { MembersTable, MemberFormDialog } from '@/components/features/members';

// Types
import { Member } from '@/types';

/**
 * Members Page
 * 
 * Page for managing team members (CRUD operations).
 * Uses custom hooks for data fetching and feature components for UI.
 */
export default function MembersPage() {
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Custom hooks
  const {
    members,
    createMemberMutation,
    updateMemberMutation,
    deleteMemberMutation,
  } = useMembers();

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // Handlers
  const handleOpenForm = (member?: Member) => {
    setEditingMember(member || { host: '', slackMemberId: '' });
    setFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setEditingMember(null);
    setFormDialogOpen(false);
  };

  const handleSave = async (member: Partial<Member>) => {
    try {
      if (!member.id) {
        // Create new member
        await createMemberMutation.mutateAsync({
          host: member.host!,
          slackMemberId: member.slackMemberId!,
        });
        showSuccess('Member created successfully');
      } else {
        // Update existing member
        await updateMemberMutation.mutateAsync(member as Member);
        showSuccess('Member updated successfully');
      }
      handleCloseForm();
    } catch (error) {
      showError('Failed to save member');
    }
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (memberToDelete) {
      try {
        await deleteMemberMutation.mutateAsync(memberToDelete.id);
        showSuccess('Member deleted successfully');
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      } catch (error) {
        showError('Failed to delete member');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  return (
    <Box p={3}>
      {/* Header */}
      <PageHeader
        title="Team Members"
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Add Member
          </Button>
        }
      />

      {/* Members Table */}
      <MembersTable
        members={members}
        onEdit={handleOpenForm}
        onDelete={handleDeleteClick}
      />

      {/* Form Dialog */}
      <MemberFormDialog
        open={formDialogOpen}
        member={editingMember}
        onSave={handleSave}
        onClose={handleCloseForm}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Member"
        message={`Are you sure you want to delete ${memberToDelete?.host}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Snackbar */}
      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
