# Next.js and React.js Architecture Guide

This document explains how Next.js and React.js work together in this Team Rotator project.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Next.js App Router](#nextjs-app-router)
3. [Server vs Client Components](#server-vs-client-components)
4. [File-Based Routing](#file-based-routing)
5. [API Routes](#api-routes)
6. [Data Fetching](#data-fetching)
7. [Project Examples](#project-examples)
8. [Best Practices](#best-practices)

---

## 🎯 Overview

### What is React?

**React** is a JavaScript library for building user interfaces using components. It handles:
- UI rendering
- Component state management
- Event handling
- Client-side interactivity

### What is Next.js?

**Next.js** is a React framework that adds powerful features on top of React:
- File-based routing
- Server-side rendering (SSR)
- API routes (backend endpoints)
- Built-in optimization (images, fonts, etc.)
- Production-ready build system

### How They Work Together

```
┌─────────────────────────────────────────┐
│         Next.js Framework               │
│  ┌───────────────────────────────────┐  │
│  │    React Components & UI Logic    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  • Routing       • API Routes          │
│  • SSR/SSG       • Optimization        │
│  • Build Tools   • Deployment          │
└─────────────────────────────────────────┘
```

**In simple terms:**
- **React** = The UI components and interactivity
- **Next.js** = The framework that handles routing, server-side logic, and optimization

---

## 🗂️ Next.js App Router

This project uses the **Next.js 13+ App Router** (not the older Pages Router).

### Directory Structure

```
src/app/
├── layout.tsx          # Root layout (wraps all pages)
├── page.tsx            # Home page (/)
├── members/
│   └── page.tsx        # Members page (/members)
├── tasks/
│   └── page.tsx        # Tasks page (/tasks)
├── login/
│   └── page.tsx        # Login page (/login)
└── api/
    ├── members/
    │   └── route.ts    # API endpoint (/api/members)
    ├── tasks/
    │   └── route.ts    # API endpoint (/api/tasks)
    └── auth/
        ├── login/route.ts   # API endpoint (/api/auth/login)
        └── logout/route.ts  # API endpoint (/api/auth/logout)
```

### Key Files

| File | Purpose |
|------|---------|
| `layout.tsx` | Wraps all pages, contains navigation and shared UI |
| `page.tsx` | Actual page content for a route |
| `route.ts` | API endpoint (backend logic) |

---

## 🔄 Server vs Client Components

Next.js 13+ introduces a new concept: **Server Components** vs **Client Components**.

### Server Components (Default)

**Components that run on the server** and send HTML to the browser.

**Benefits:**
- ✅ Faster initial page load
- ✅ Better SEO (search engines see full HTML)
- ✅ Smaller JavaScript bundle
- ✅ Direct access to backend resources

**Limitations:**
- ❌ Cannot use browser APIs (localStorage, window, etc.)
- ❌ Cannot use React hooks (useState, useEffect, etc.)
- ❌ Cannot handle user interactions directly

**Example in this project:**

```typescript
// src/app/page.tsx (Server Component - default)
export default async function HomePage() {
  // Can fetch data directly on the server
  const data = await fetch('...');
  
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Render UI */}
    </div>
  );
}
```

### Client Components

**Components that run in the browser** and have full React functionality.

**Marked with `'use client'` directive at the top of the file.**

**Benefits:**
- ✅ Can use React hooks (useState, useEffect, etc.)
- ✅ Can handle user interactions
- ✅ Can access browser APIs
- ✅ Can use third-party libraries that rely on browser features

**Example in this project:**

```typescript
// src/app/login/page.tsx (Client Component)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    // Client-side logic
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.ok) {
      router.push('/');
    }
  };

  return (
    <form>
      <input 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
      />
      {/* ... */}
    </form>
  );
}
```

### When to Use Each?

| Use Server Component | Use Client Component |
|---------------------|---------------------|
| Static content | Forms and inputs |
| Data fetching | Interactive UI |
| Layouts and navigation structure | useState, useEffect |
| SEO-important pages | Browser APIs |
| Reducing JavaScript bundle | Third-party UI libraries |

---

## 🛣️ File-Based Routing

Next.js automatically creates routes based on your file structure.

### How It Works

| File Path | URL Route |
|-----------|-----------|
| `app/page.tsx` | `/` |
| `app/members/page.tsx` | `/members` |
| `app/tasks/page.tsx` | `/tasks` |
| `app/login/page.tsx` | `/login` |
| `app/assignments/page.tsx` | `/assignments` |

### Special Files

| File | Purpose |
|------|---------|
| `layout.tsx` | Shared layout for all pages in that folder |
| `page.tsx` | The actual page component |
| `loading.tsx` | Loading UI (shown while page loads) |
| `error.tsx` | Error UI (shown when errors occur) |
| `not-found.tsx` | 404 page |

### Navigation

Use Next.js's `Link` component for client-side navigation (no page reload):

```typescript
import Link from 'next/link';

<Link href="/members">Go to Members</Link>
```

Or use the `useRouter` hook for programmatic navigation:

```typescript
'use client';
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/members');
```

---

## 🔌 API Routes

API routes are **backend endpoints** built into your Next.js app.

### Structure

```typescript
// src/app/api/members/route.ts
import { NextResponse } from 'next/server';

// GET /api/members
export async function GET() {
  const members = await getMembers(); // Fetch from database/Edge Config
  return NextResponse.json(members);
}

// POST /api/members
export async function POST(request: Request) {
  const body = await request.json();
  const newMember = await createMember(body);
  return NextResponse.json(newMember);
}

// PUT /api/members
export async function PUT(request: Request) {
  const body = await request.json();
  const updatedMember = await updateMember(body);
  return NextResponse.json(updatedMember);
}

// DELETE /api/members
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await deleteMember(id);
  return NextResponse.json({ success: true });
}
```

### Calling API Routes from Client

```typescript
'use client';

// GET request
const response = await fetch('/api/members');
const members = await response.json();

// POST request
const response = await fetch('/api/members', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
});
const newMember = await response.json();
```

### Why Use API Routes?

✅ **Security** - Hide sensitive credentials (API keys, database passwords)  
✅ **Backend Logic** - Run server-side code (database queries, authentication)  
✅ **Third-party APIs** - Proxy requests to external services  
✅ **Data Processing** - Heavy computations on the server  

---

## 📊 Data Fetching

This project uses different patterns for fetching data.

### Pattern 1: Server Component + Direct Fetch

**Use for:** Static or initial data

```typescript
// Server Component
export default async function MembersPage() {
  // Fetch data directly on the server
  const members = await fetch('/api/members').then(r => r.json());
  
  return (
    <div>
      {members.map(member => (
        <div key={member.id}>{member.name}</div>
      ))}
    </div>
  );
}
```

### Pattern 2: Client Component + useEffect

**Use for:** Dynamic data that needs to refresh

```typescript
'use client';
import { useState, useEffect } from 'react';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/members')
      .then(r => r.json())
      .then(data => {
        setMembers(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {members.map(member => (
        <div key={member.id}>{member.name}</div>
      ))}
    </div>
  );
}
```

### Pattern 3: Centralized API Client

**Use for:** Consistent API calls across the app

```typescript
// src/services/api.ts
export const api = {
  async getMembers() {
    const response = await fetch('/api/members');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
  
  async createMember(data: any) {
    const response = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create');
    return response.json();
  },
};

// Usage in component
import { api } from '@/services/api';

const members = await api.getMembers();
```

---

## 💡 Project Examples

### Example 1: Layout + Authentication

```typescript
// src/app/layout.tsx
'use client';

export default function RootLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check authentication on mount
    fetch('/api/auth/verify')
      .then(r => r.json())
      .then(data => {
        if (!data.isAuthenticated && pathname !== '/login') {
          router.push('/login');
        }
        setIsAuthenticated(data.isAuthenticated);
      });
  }, []);
  
  return (
    <html>
      <body>
        <AppBar /> {/* Navigation */}
        <main>{children}</main> {/* Page content */}
      </body>
    </html>
  );
}
```

**How it works:**
1. Layout is a **Client Component** (uses hooks)
2. Checks authentication when app loads
3. Redirects to login if not authenticated
4. Wraps all pages with navigation

### Example 2: Members Page

```typescript
// src/app/members/page.tsx
'use client';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  
  useEffect(() => {
    fetchMembers();
  }, []);
  
  const fetchMembers = async () => {
    const data = await fetch('/api/members').then(r => r.json());
    setMembers(data);
  };
  
  const handleCreate = async (newMember) => {
    await fetch('/api/members', {
      method: 'POST',
      body: JSON.stringify(newMember),
    });
    fetchMembers(); // Refresh list
  };
  
  return (
    <div>
      <h1>Members</h1>
      <MemberForm onSubmit={handleCreate} />
      <MemberList members={members} />
    </div>
  );
}
```

**Flow:**
```
User visits /members
    ↓
MembersPage loads (Client Component)
    ↓
useEffect runs → fetch('/api/members')
    ↓
API route.ts executes on server
    ↓
Fetches data from Edge Config
    ↓
Returns JSON to client
    ↓
Page displays members
```

### Example 3: Login Flow

```typescript
// src/app/login/page.tsx (Client Component)
'use client';

export default function LoginPage() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.ok) {
      router.push('/'); // Redirect to home
    } else {
      setError('Invalid credentials');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

```typescript
// src/app/api/auth/login/route.ts (API Route)
import { validateCredentials, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const { username, password } = await request.json();
  
  // Validate credentials (server-side)
  const isValid = validateCredentials(username, password);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
  
  // Create JWT token
  const token = await createToken(username);
  
  // Set HTTP-only cookie
  const response = NextResponse.json({ success: true });
  setAuthCookie(response, token);
  
  return response;
}
```

**Flow:**
```
User enters credentials
    ↓
Client calls /api/auth/login (POST)
    ↓
Server validates credentials
    ↓
Server creates JWT token
    ↓
Server sets HTTP-only cookie
    ↓
Client receives success response
    ↓
Client redirects to home page
```

### Example 4: Cron Job (Server-Side)

```typescript
// src/app/api/cron/route.ts (API Route)
export async function GET() {
  // This runs on the server only
  // Called by Vercel Cron (not by browser)
  
  const assignments = await getTaskAssignments();
  const needsUpdate = checkIfRotationNeeded(assignments);
  
  if (needsUpdate) {
    await updateRotation();
    await sendSlackNotification();
  }
  
  return NextResponse.json({ success: true });
}
```

**How it works:**
- Vercel calls this endpoint daily (configured in `vercel.json`)
- Runs entirely on the server
- No client-side code involved
- Can access environment variables and secrets

---

## ✅ Best Practices

### 1. Component Organization

```
✅ GOOD: Separate concerns
- UI Components (React) → src/app/*/page.tsx
- Business Logic → src/lib/*.ts
- API Endpoints → src/app/api/*/route.ts
- Services → src/services/*.ts

❌ BAD: Mix everything together
- All logic in page.tsx
```

### 2. State Management

```typescript
✅ GOOD: Use client components for state
'use client';
const [data, setData] = useState([]);

❌ BAD: Try to use state in server component
// Server component - will error!
const [data, setData] = useState([]);
```

### 3. API Calls

```typescript
✅ GOOD: Centralized API client
import { api } from '@/services/api';
const members = await api.getMembers();

❌ BAD: Duplicate fetch logic everywhere
fetch('/api/members').then(r => r.json())...
```

### 4. Error Handling

```typescript
✅ GOOD: Handle errors gracefully
try {
  const data = await fetch('/api/members');
} catch (error) {
  console.error('Failed to fetch members:', error);
  toast.error('Failed to load members');
}

❌ BAD: Ignore errors
const data = await fetch('/api/members');
```

### 5. Loading States

```typescript
✅ GOOD: Show loading UI
const [loading, setLoading] = useState(true);
if (loading) return <Spinner />;

❌ BAD: No loading indicator
// User sees blank page while loading
```

---

## 🎓 Learning Resources

### Official Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Next.js App Router](https://nextjs.org/docs/app)

### Key Concepts to Learn
1. **React Basics** - Components, props, state, hooks
2. **Next.js App Router** - File-based routing, layouts
3. **Server vs Client Components** - When to use each
4. **API Routes** - Building backend endpoints
5. **Data Fetching** - Different patterns and when to use them

---

## 🔍 Quick Reference

### Component Types

| Type | Marker | Use Case |
|------|--------|----------|
| Server Component | (default) | Static content, SEO, data fetching |
| Client Component | `'use client'` | Interactive UI, hooks, browser APIs |

### File Types

| File | Purpose | Example |
|------|---------|---------|
| `page.tsx` | Page component | User-facing pages |
| `route.ts` | API endpoint | Backend logic |
| `layout.tsx` | Shared layout | Navigation, wrappers |

### Navigation

```typescript
// Link component (declarative)
<Link href="/members">Members</Link>

// useRouter hook (programmatic)
const router = useRouter();
router.push('/members');
```

### Data Fetching

```typescript
// Server Component (SSR)
const data = await fetch('...');

// Client Component (CSR)
useEffect(() => {
  fetch('...').then(setData);
}, []);
```

---

## 📝 Summary

**React** provides:
- Component-based UI
- State management
- Event handling

**Next.js** adds:
- File-based routing
- Server-side rendering
- API routes
- Build optimization

**Together they create:**
- Fast, SEO-friendly pages (Server Components)
- Interactive UI (Client Components)
- Full-stack application (API Routes)
- Optimized production builds

This project uses Next.js 13+ App Router with a mix of Server and Client Components to create a performant, maintainable full-stack application.

