# Custom Hooks

This directory contains custom React hooks that encapsulate reusable stateful logic.

## 📁 Structure

```
src/hooks/
├── useMembers.ts      # Member data management
├── useTasks.ts        # Task data management
├── useAssignments.ts  # Assignment data management
├── useSnackbar.ts     # Snackbar notifications
└── index.ts           # Exports all hooks
```

---

## 🎣 Available Hooks

### `useMembers`

Manages team member data with CRUD operations.

```tsx
import { useMembers } from '@/hooks';

function MembersPage() {
  const {
    members,           // Member[]
    isLoading,         // boolean
    error,             // Error | null
    createMemberMutation,
    updateMemberMutation,
    deleteMemberMutation,
  } = useMembers();

  // Create a member
  await createMemberMutation.mutateAsync({
    host: 'John Doe',
    slackMemberId: 'U12345',
  });

  // Update a member
  await updateMemberMutation.mutateAsync({
    id: 1,
    host: 'Jane Doe',
    slackMemberId: 'U67890',
  });

  // Delete a member
  await deleteMemberMutation.mutateAsync(1);
}
```

---

### `useTasks`

Manages task data with CRUD operations.

```tsx
import { useTasks } from '@/hooks';

function TasksPage() {
  const {
    tasks,             // Task[]
    isLoading,         // boolean
    error,             // Error | null
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
  } = useTasks();

  // Create a task
  await createTaskMutation.mutateAsync({
    name: 'Daily Standup',
    rotationRule: 'daily',
  });
}
```

---

### `useAssignments`

Manages task assignments with rotation and Slack integration.

```tsx
import { useAssignments, generateSlackPreview } from '@/hooks';

function DashboardPage() {
  const {
    assignments,           // All assignments
    currentAssignments,    // Latest assignment per task
    assignmentHistory,     // Sorted by date desc
    isLoading,
    error,
    updateAssignmentMutation,
    updateRotationMutation,
    sendToSlackMutation,
  } = useAssignments();

  // Update rotation
  await updateRotationMutation.mutateAsync();

  // Send to Slack
  await sendToSlackMutation.mutateAsync();

  // Generate Slack preview
  const preview = generateSlackPreview(currentAssignments, members);
}
```

**Helper Functions:**

```tsx
import { getAssignmentStatus, generateSlackPreview } from '@/hooks';

// Get assignment status
const status = getAssignmentStatus('2024-01-01', '2024-01-07');
// Returns: 'Current' | 'Upcoming' | 'Past'

// Generate Slack preview
const message = generateSlackPreview(assignments, members);
```

---

### `useSnackbar`

Manages snackbar/toast notifications.

```tsx
import { useSnackbar } from '@/hooks';

function MyComponent() {
  const {
    snackbar,       // { open, message, severity }
    showSuccess,    // (message: string) => void
    showError,      // (message: string) => void
    showWarning,    // (message: string) => void
    showInfo,       // (message: string) => void
    closeSnackbar,  // () => void
  } = useSnackbar();

  // Show notifications
  showSuccess('Operation completed!');
  showError('Something went wrong');
  showWarning('Please check your input');
  showInfo('New updates available');

  // Use with SnackbarNotification component
  return (
    <SnackbarNotification
      open={snackbar.open}
      message={snackbar.message}
      severity={snackbar.severity}
      onClose={closeSnackbar}
    />
  );
}
```

---

## 📝 Best Practices

### ✅ Do's

1. **Use hooks at the page level**
   ```tsx
   // ✅ Good - Hook in page
   export default function MembersPage() {
     const { members } = useMembers();
     return <MembersTable members={members} />;
   }
   ```

2. **Handle mutations with try/catch**
   ```tsx
   // ✅ Good - Error handling
   try {
     await createMemberMutation.mutateAsync(data);
     showSuccess('Created!');
   } catch (error) {
     showError('Failed!');
   }
   ```

3. **Combine hooks for complex features**
   ```tsx
   // ✅ Good - Multiple hooks
   const { members } = useMembers();
   const { currentAssignments } = useAssignments();
   const { showSuccess, showError } = useSnackbar();
   ```

### ❌ Don'ts

1. **Don't use hooks inside callbacks**
   ```tsx
   // ❌ Bad - Hook in callback
   const handleClick = () => {
     const { members } = useMembers(); // Error!
   };
   ```

2. **Don't conditionally call hooks**
   ```tsx
   // ❌ Bad - Conditional hook
   if (isAdmin) {
     const { members } = useMembers(); // Error!
   }
   ```

---

## 🔧 Creating New Hooks

Template for new data hooks:

```tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getData, createData, updateData, deleteData } from '@/services/api';
import { DataType } from '@/types';

export function useData() {
  const queryClient = useQueryClient();

  // Query
  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useQuery<DataType[]>({
    queryKey: ['data'],
    queryFn: getData,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data'] });
    },
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
```

---

## 📚 Related Documentation

- [Components README](../components/README.md)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)

