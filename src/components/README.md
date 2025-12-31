# Components Directory Structure

This directory contains all reusable React components organized by their purpose and rendering context.

## 📁 Directory Structure

```
src/components/
├── features/               # Feature-specific components
│   ├── dashboard/          # Dashboard page components (5 files)
│   ├── members/            # Members page components (2 files)
│   └── tasks/              # Tasks page components (2 files)
├── shared/                 # Shared reusable components (5 files)
├── client/                 # Client-only components (1 file)
├── server/                 # Server components (empty)
├── ui/                     # UI Library components - shadcn/ui (4 files)
└── README.md               # This file
```

---

## 🎯 Component Categories

### 📦 `features/` - Feature Components

**Domain-specific components organized by feature/page.**

These components contain business logic specific to a feature and are composed of shared components.

#### Dashboard Components (`features/dashboard/`)

| Component | File | Purpose |
|-----------|------|---------|
| `AssignmentsTable` | `AssignmentsTable.tsx` | Displays current task assignments with edit action |
| `HistoryTable` | `HistoryTable.tsx` | Displays assignment history with status indicators |
| `AssignmentEditDialog` | `AssignmentEditDialog.tsx` | Modal for editing a task assignment |
| `SlackPreviewDialog` | `SlackPreviewDialog.tsx` | Preview Slack message before sending |
| `DashboardActions` | `DashboardActions.tsx` | Action buttons (Update Rotation, Send to Slack) |

#### Members Components (`features/members/`)

| Component | File | Purpose |
|-----------|------|---------|
| `MembersTable` | `MembersTable.tsx` | Displays team members with edit/delete actions |
| `MemberFormDialog` | `MemberFormDialog.tsx` | Modal for adding/editing a member |

#### Tasks Components (`features/tasks/`)

| Component | File | Purpose |
|-----------|------|---------|
| `TasksTable` | `TasksTable.tsx` | Displays tasks with edit/delete actions |
| `TaskFormDialog` | `TaskFormDialog.tsx` | Modal for adding/editing a task |

**Usage:**

```tsx
// Import from features index
import { 
  AssignmentsTable, 
  MemberFormDialog,
  TasksTable 
} from '@/components/features';

// Or import from specific feature
import { AssignmentsTable } from '@/components/features/dashboard';
import { MembersTable } from '@/components/features/members';
```

---

### 🔧 `shared/` - Shared Components

**Generic, reusable components used across multiple features.**

These components have no business logic and can be used anywhere in the application.

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| `ConfirmDialog` | `ConfirmDialog.tsx` | Reusable confirmation modal | `open`, `title`, `message`, `onConfirm`, `onCancel` |
| `LoadingSpinner` | `LoadingSpinner.tsx` | Loading indicator with optional message | `message?`, `fullScreen?`, `size?` |
| `PageHeader` | `PageHeader.tsx` | Page title with action buttons | `title`, `actions?` |
| `ErrorAlert` | `ErrorAlert.tsx` | Error message with retry button | `message`, `onRetry?` |
| `SnackbarNotification` | `SnackbarNotification.tsx` | Toast notifications | `open`, `message`, `severity`, `onClose` |

**Usage:**

```tsx
import { 
  ConfirmDialog, 
  LoadingSpinner, 
  PageHeader,
  ErrorAlert,
  SnackbarNotification
} from '@/components/shared';

// Examples
<PageHeader 
  title="Team Members" 
  actions={<Button>Add Member</Button>} 
/>

<ConfirmDialog
  open={isOpen}
  title="Delete Member"
  message="Are you sure you want to delete this member?"
  confirmLabel="Delete"
  confirmColor="error"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
/>

<LoadingSpinner fullScreen message="Loading data..." />

<ErrorAlert message="Failed to load data" onRetry={refetch} />

<SnackbarNotification
  open={snackbar.open}
  message={snackbar.message}
  severity={snackbar.severity}
  onClose={closeSnackbar}
/>
```

---

### 📱 `client/` - Client Components

**Components that require client-side React features (`'use client'` directive).**

Use for components that:
- Use React hooks (useState, useEffect, useRef, etc.)
- Handle user interactions (onClick, onChange, etc.)
- Access browser APIs (localStorage, window, document)
- Use client-side libraries (charts, animations)

| Component | File | Purpose |
|-----------|------|---------|
| `LogViewer` | `LogViewer.tsx` | System logs viewer with auto-refresh every 30 seconds |

**Usage:**

```tsx
import { LogViewer } from '@/components/client';

// In your page
<LogViewer />
```

---

### 🖥️ `server/` - Server Components

**Components that run on the server (no `'use client'` directive).**

Use for:
- Static content that doesn't need interactivity
- Server-side data fetching
- Better SEO (content visible to crawlers)
- Reduced JavaScript bundle size

*Currently empty - add server components as needed.*

**When to create server components:**

```tsx
// ✅ Good candidates for server components:
// - Static headers/footers
// - Content that fetches data on server
// - SEO-critical content

// ❌ Not suitable for server components:
// - Forms with state
// - Interactive UI elements
// - Components using browser APIs
```

---

### 🎨 `ui/` - UI Library Components

**Primitive UI components from [shadcn/ui](https://ui.shadcn.com/).**

Low-level building blocks styled with Tailwind CSS. These are foundational components used by feature and shared components.

| Component | File | Purpose |
|-----------|------|---------|
| `Button` | `button.tsx` | Button with multiple variants (default, outline, ghost, etc.) |
| `Card` | `card.tsx` | Card layout (Card, CardHeader, CardTitle, CardContent, CardFooter) |
| `ScrollArea` | `scroll-area.tsx` | Custom scrollable container |
| `Tabs` | `tabs.tsx` | Tab navigation (Tabs, TabsList, TabsTrigger, TabsContent) |

**Usage:**

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Examples
<Button variant="outline" size="sm">Click me</Button>

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

---

## 📝 Best Practices

### ✅ Component Guidelines

1. **Keep pages thin** - Pages should compose components, not contain logic

   ```tsx
   // ✅ Good - Page as composition
   export default function MembersPage() {
     const { members } = useMembers();
     const { snackbar, showSuccess } = useSnackbar();
     
     return (
       <Box p={3}>
         <PageHeader title="Members" actions={...} />
         <MembersTable members={members} onEdit={...} />
         <SnackbarNotification {...snackbar} />
       </Box>
     );
   }

   // ❌ Bad - All logic in page (500+ lines)
   export default function MembersPage() {
     const [members, setMembers] = useState([]);
     const [loading, setLoading] = useState(true);
     // ... hundreds of lines of inline logic and JSX
   }
   ```

2. **Use custom hooks for data fetching**

   ```tsx
   // ✅ Good - Custom hook encapsulates logic
   const { members, createMemberMutation, isLoading } = useMembers();

   // ❌ Bad - Inline useQuery in component
   const { data } = useQuery({ queryKey: ['members'], queryFn: getMembers });
   ```

3. **Feature components receive data via props**

   ```tsx
   // ✅ Good - Data passed as props
   <MembersTable 
     members={members} 
     onEdit={handleEdit} 
     onDelete={handleDelete} 
   />

   // ❌ Bad - Component fetches its own data
   function MembersTable() {
     const { data } = useQuery(...); // Don't do this!
   }
   ```

4. **Shared components are generic**

   ```tsx
   // ✅ Good - Generic, reusable
   <ConfirmDialog
     title="Delete Item"
     message="Are you sure?"
     confirmLabel="Delete"
     confirmColor="error"
   />

   // ❌ Bad - Too specific
   <DeleteMemberConfirmDialog member={member} />
   ```

5. **Add `'use client'` only when needed**

   ```tsx
   // ✅ Good - Only add when using client features
   'use client';
   import { useState } from 'react';
   
   // ❌ Bad - Adding 'use client' unnecessarily
   'use client';
   export function StaticContent() {
     return <div>No hooks or interactivity needed</div>;
   }
   ```

---

## 📥 Import Patterns

```tsx
// Custom Hooks (from src/hooks)
import { useMembers, useTasks, useAssignments, useSnackbar } from '@/hooks';

// Feature Components (all features)
import { 
  AssignmentsTable, 
  MembersTable, 
  TaskFormDialog 
} from '@/components/features';

// Feature Components (specific feature)
import { AssignmentsTable } from '@/components/features/dashboard';

// Shared Components
import { 
  ConfirmDialog, 
  LoadingSpinner, 
  PageHeader,
  ErrorAlert,
  SnackbarNotification
} from '@/components/shared';

// Client Components
import { LogViewer } from '@/components/client';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
```

---

## 🔄 Component Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Page (thin wrapper)               │
│  src/app/members/page.tsx                           │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Hooks     │  │  Feature    │  │   Shared    │
│             │  │  Components │  │  Components │
│ useMembers  │  │ MembersTable│  │ PageHeader  │
│ useSnackbar │  │ MemberForm  │  │ ConfirmDlg  │
└─────────────┘  └─────────────┘  └─────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    UI Components    │
              │   Button, Card,...  │
              └─────────────────────┘
```

**Data Flow:**

1. **Page** uses custom hooks to fetch data
2. **Page** passes data to feature components as props
3. **Feature components** render UI using shared and ui components
4. **Shared components** handle common patterns (dialogs, loading, etc.)
5. **UI components** provide styled primitives

---

## 🆕 Adding New Components

### Adding a Feature Component

1. Create file in appropriate feature folder:
   ```
   src/components/features/members/NewComponent.tsx
   ```

2. Add export to feature's index.ts:
   ```tsx
   // src/components/features/members/index.ts
   export { NewComponent } from './NewComponent';
   ```

3. Component will be auto-exported from `@/components/features`

### Adding a Shared Component

1. Create file in shared folder:
   ```
   src/components/shared/NewSharedComponent.tsx
   ```

2. Add export to shared index.ts:
   ```tsx
   // src/components/shared/index.ts
   export { NewSharedComponent } from './NewSharedComponent';
   ```

### Adding a Client Component

1. Create file in client folder with `'use client'`:
   ```tsx
   // src/components/client/NewClientComponent.tsx
   'use client';
   
   export function NewClientComponent() { ... }
   ```

2. Add export to client index.ts:
   ```tsx
   export { NewClientComponent } from './NewClientComponent';
   ```

---

## 📊 Component Summary

| Category | Count | Location |
|----------|-------|----------|
| Feature - Dashboard | 5 | `features/dashboard/` |
| Feature - Members | 2 | `features/members/` |
| Feature - Tasks | 2 | `features/tasks/` |
| Shared | 5 | `shared/` |
| Client | 1 | `client/` |
| Server | 0 | `server/` |
| UI | 4 | `ui/` |
| **Total** | **19** | |

---

## 📚 Related Documentation

- [Custom Hooks Documentation](../hooks/README.md)
- [Next.js + React Guide](../../NEXTJS_REACT_GUIDE.md)
- [Project README](../../README.md)
- [Authentication Setup](../../AUTHENTICATION_SETUP.md)

---

## 🔧 Maintenance

When refactoring or adding components:

1. **Check if a shared component exists** before creating feature-specific ones
2. **Keep components focused** - one component, one responsibility
3. **Document complex props** with JSDoc comments
4. **Update this README** when adding new component categories
5. **Run linting** after changes: `npm run lint`
