'use client';

import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';

// Hooks
import { useAssignments, useMembers, useSnackbar, generateSlackPreview } from '@/hooks';

// Shared Components
import { PageHeader, LoadingSpinner, ErrorAlert, SnackbarNotification } from '@/components/shared';

// Feature Components
import {
  AssignmentsTable,
  HistoryTable,
  AssignmentEditDialog,
  SlackPreviewDialog,
  SprintKickoffDialog,
  DashboardActions,
} from '@/components/features/dashboard';

// Client Components
import { LogViewer } from '@/components/client';

// Types
import { TaskAssignmentWithDetails } from '@/types';

/**
 * Dashboard Page
 * 
 * Main page displaying current task assignments, history, and system logs.
 * Uses custom hooks for data fetching and feature components for UI.
 */
export default function Dashboard() {
  // Tab state
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);
  const [sprintKickoffDialogOpen, setSprintKickoffDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignmentWithDetails | null>(null);

  // Custom hooks
  const {
    currentAssignments,
    assignmentHistory,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    updateAssignmentMutation,
    updateRotationMutation,
    sprintKickoffMutation,
    sendToSlackMutation,
  } = useAssignments();

  const {
    members,
    isLoading: isLoadingMembers,
    error: membersError,
  } = useMembers();

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // Handlers
  const handleEditClick = (assignment: TaskAssignmentWithDetails) => {
    setSelectedAssignment(assignment);
    setEditDialogOpen(true);
  };

  const handleEditSave = async (assignment: TaskAssignmentWithDetails) => {
    try {
      await updateAssignmentMutation.mutateAsync(assignment);
      setEditDialogOpen(false);
      setSelectedAssignment(null);
      showSuccess('Assignment updated successfully');
    } catch (error) {
      showError('Failed to update assignment');
    }
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedAssignment(null);
  };

  const handleUpdateRotation = async () => {
    try {
      await updateRotationMutation.mutateAsync();
      showSuccess('Rotation updated successfully');
    } catch (error) {
      showError('Failed to update rotation');
    }
  };

  const handleSprintKickoff = async (startDate: string) => {
    try {
      await sprintKickoffMutation.mutateAsync(startDate);
      setSprintKickoffDialogOpen(false);
      showSuccess(`Sprint kicked off successfully from ${startDate}`);
    } catch (error) {
      showError('Failed to kick off sprint');
    }
  };

  const handleSendToSlack = async () => {
    try {
      await sendToSlackMutation.mutateAsync();
      setSlackDialogOpen(false);
      showSuccess('Successfully sent assignments to Slack');
    } catch (error) {
      showError('Failed to send assignments to Slack');
    }
  };

  // Loading state
  if (isLoadingAssignments || isLoadingMembers) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  // Error state
  if (assignmentsError || membersError) {
    return (
      <ErrorAlert
        message={assignmentsError ? 'Failed to load assignments' : 'Failed to load members'}
      />
    );
  }

  // Generate Slack preview
  const slackPreview = generateSlackPreview(currentAssignments, members);

  return (
    <Box p={3}>
      <Box display="flex" flexDirection="column" gap={2}>
        {/* Header */}
        <PageHeader
          title="Dashboard"
          actions={
            <DashboardActions
              onUpdateRotation={handleUpdateRotation}
              onKickOffSprint={() => setSprintKickoffDialogOpen(true)}
              onSendToSlack={() => setSlackDialogOpen(true)}
              isUpdating={updateRotationMutation.isPending}
            />
          }
        />

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              transition: 'background-color 0.3s',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
              '&.Mui-selected': { color: 'primary.main' },
            },
            '& .MuiTabs-indicator': { backgroundColor: 'primary.main' },
          }}
        >
          <Tab label="Current Assignments" />
          <Tab label="History" />
          <Tab label="System Logs" />
        </Tabs>

        {/* Tab Content */}
        {selectedTab === 0 && (
          <AssignmentsTable
            assignments={currentAssignments}
            onEdit={handleEditClick}
          />
        )}

        {selectedTab === 1 && (
          <HistoryTable assignments={assignmentHistory} />
        )}

        {selectedTab === 2 && <LogViewer />}

        {/* Dialogs */}
        <AssignmentEditDialog
          open={editDialogOpen}
          assignment={selectedAssignment}
          members={members}
          onSave={handleEditSave}
          onClose={handleEditClose}
        />

        <SlackPreviewDialog
          open={slackDialogOpen}
          preview={slackPreview}
          onSend={handleSendToSlack}
          onClose={() => setSlackDialogOpen(false)}
        />

        <SprintKickoffDialog
          open={sprintKickoffDialogOpen}
          onKickoff={handleSprintKickoff}
          onClose={() => setSprintKickoffDialogOpen(false)}
          isLoading={sprintKickoffMutation.isPending}
        />

        {/* Snackbar */}
        <SnackbarNotification
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Box>
    </Box>
  );
}
