# Team Rotator

A team rotation management system built with Next.js and Vercel Edge Config. This application helps teams manage and automate task rotations among team members with automatic Slack notifications.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Main Flows](#main-flows)
  - [Rotation Flow](#rotation-flow)
  - [Assignment Flow](#assignment-flow)
  - [Notification Flow](#notification-flow)
- [Development](#development)
  - [Running Locally](#running-locally)
  - [Available Scripts](#available-scripts)
  - [Testing](#testing)
- [Data Management](#data-management)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

### Member Management
- View all team members with Slack integration
- Add new team members with name and Slack member ID
- Edit existing member information
- Delete members from the system
- Member list sorted by ID for consistent rotation order

### Task Management
- View all tasks with their rotation rules
- Add new tasks with configurable rotation patterns
- Edit existing task details
- Delete tasks from the system
- Supported rotation rules:
  - **Daily**: Rotates every working day
  - **Weekly**: Rotates weekly (e.g., `weekly_friday` rotates every Friday)
  - **Biweekly**: Rotates every two weeks (e.g., `biweekly_thursday`)

### Task Assignment
- **Automatic rotation** based on configurable rules and working days
- **Manual rotation trigger** via UI or API
- **Slack notifications** for new assignments
- View current and historical assignments
- Holiday-aware rotation (respects Chinese holidays via API)
- Weekend-aware rotation (skips weekends automatically)

### System Management
- Configure Slack webhook URL
- View system logs with filtering
- Manual and automatic rotation triggers
- Cron job for daily automatic rotation

---

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 13+ (App Router) |
| **UI Library** | Material-UI (MUI) + Tailwind CSS |
| **State Management** | TanStack Query (React Query) |
| **Data Storage** | Vercel Edge Config |
| **API** | Next.js API Routes |
| **Deployment** | Vercel |
| **Date Handling** | date-fns |
| **HTTP Client** | Axios |
| **Logging** | Custom logger with in-memory storage |

---

## Project Structure

```
team-rotator-vercel/
├── data/                          # Local JSON files (legacy/backup)
│   ├── members.json
│   ├── tasks.json
│   ├── task_assignments.json
│   └── system_configs.json
│
├── scripts/                       # Utility scripts
│   ├── clear-edge-config.ts      # Clear all data from Edge Config
│   ├── create-edge-config.ts     # Create new Edge Config
│   ├── export-data.ts            # Export data from Edge Config
│   ├── fix-assignment-dates.ts   # Fix date inconsistencies
│   └── migrate-to-edge-config.ts # Migrate local data to Edge Config
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── assignments/      # Assignment-related endpoints
│   │   │   │   ├── route.ts      # CRUD operations
│   │   │   │   ├── fix-dates/    # Date fixing endpoint
│   │   │   │   ├── send-to-slack/ # Slack notification endpoint
│   │   │   │   └── update-rotation/ # Manual rotation trigger
│   │   │   ├── config/           # System configuration
│   │   │   ├── cron/             # Cron job endpoint
│   │   │   ├── fix-data/         # Data fixing utilities
│   │   │   ├── logs/             # System logs API
│   │   │   ├── members/          # Member CRUD operations
│   │   │   └── tasks/            # Task CRUD operations
│   │   │
│   │   ├── components/           # React components
│   │   │   └── LogViewer.tsx     # System log viewer
│   │   │
│   │   ├── members/              # Member management page
│   │   ├── settings/             # Settings page
│   │   ├── tasks/                # Task management page
│   │   ├── page.tsx              # Dashboard (main page)
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   │
│   ├── components/               # Shared UI components
│   │   └── ui/                   # shadcn/ui components
│   │
│   ├── lib/                      # Core business logic
│   │   ├── db.ts                 # Edge Config database layer
│   │   ├── holiday.ts            # Holiday checking logic
│   │   ├── logger.ts             # Logging utility
│   │   ├── rotation.ts           # Rotation calculation logic
│   │   └── utils.ts              # Utility functions
│   │
│   ├── services/                 # Service layer
│   │   ├── api.ts                # API client (Axios)
│   │   └── assignments.ts        # Assignment business logic
│   │
│   └── types/                    # TypeScript type definitions
│       └── index.ts
│
├── .env.local                    # Local environment variables (not in git)
├── components.json               # shadcn/ui configuration
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
├── test-edge-config.sh           # Edge Config testing script
├── tsconfig.json                 # TypeScript configuration
└── vercel.json                   # Vercel deployment configuration
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Vercel Account**: For Edge Config and deployment
- **Slack Workspace**: For notifications (optional but recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd team-rotator-vercel
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Environment Setup

#### Step 1: Create Edge Config on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project (or create a new one)
3. Go to **Storage** → **Edge Config**
4. Click **Create Edge Config**
5. Name it (e.g., "team-rotator-vercel-store")
6. Copy the **Connection String** (format: `https://edge-config.vercel.com/ecfg_xxx?token=xxx`)

#### Step 2: Generate Vercel Access Token

1. Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Give it a name (e.g., "Team Rotator Write Access")
4. Select the appropriate scope (needs Edge Config write permissions)
5. Click **Create** and **copy the token immediately** (you won't see it again)

#### Step 3: Configure Slack Webhook (Optional)

1. Go to your Slack workspace
2. Create a new [Slack App](https://api.slack.com/apps)
3. Enable **Incoming Webhooks**
4. Create a webhook for your desired channel
5. Copy the webhook URL (format: `https://hooks.slack.com/services/...`)

#### Step 4: Create `.env.local` File

Create a `.env.local` file in the project root:

```bash
# Edge Config Connection String (Required)
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxx?token=xxx

# Vercel Access Token for write operations (Required)
VERCEL_ACCESS_TOKEN=your_vercel_access_token_here
```

#### Step 5: Initialize Data in Edge Config

You can either:

**Option A: Import sample data**

Create a sample data structure in Edge Config:

```bash
npm run migrate
```

**Option B: Manually add data via Vercel Dashboard**

1. Go to your Edge Config in Vercel Dashboard
2. Add the following keys with empty arrays:
   - `members`: `[]`
   - `tasks`: `[]`
   - `taskAssignments`: `[]`
   - `systemConfigs`: `[{"key": "Slack:WebhookUrl", "value": "your_webhook_url", "lastModified": "2025-01-01T00:00:00.000Z", "modifiedBy": null}]`

---

## Main Flows

### Rotation Flow

The rotation system automatically manages task assignments based on rotation rules and working days.

```
┌─────────────────────────────────────────────────────────────┐
│                    ROTATION FLOW                            │
└─────────────────────────────────────────────────────────────┘

1. TRIGGER (Automatic or Manual)
   ├─ Automatic: Cron job runs daily at midnight UTC
   └─ Manual: User clicks "Update Rotation" button

2. CHECK WORKING DAY
   ├─ Query holiday API for Chinese holidays
   ├─ Check if current date is weekend (Sat/Sun)
   └─ Skip rotation if not a working day

3. FOR EACH TASK ASSIGNMENT
   ├─ Check if assignment end date has passed
   ├─ Calculate next rotation period based on rule:
   │  ├─ Daily: Next working day
   │  ├─ Weekly: Next occurrence of target weekday
   │  └─ Biweekly: Next occurrence + 1 week
   │
   ├─ Rotate member (next in sorted member list)
   └─ Update assignment in Edge Config

4. SEND NOTIFICATIONS
   └─ Post assignments to Slack channel
```

**Key Components:**
- `src/lib/rotation.ts` - Core rotation logic
- `src/lib/holiday.ts` - Working day validation
- `src/services/assignments.ts` - Assignment orchestration
- `src/app/api/cron/route.ts` - Scheduled trigger

### Assignment Flow

How task assignments are created and managed:

```
┌─────────────────────────────────────────────────────────────┐
│                   ASSIGNMENT FLOW                            │
└─────────────────────────────────────────────────────────────┘

1. USER CREATES/EDITS ASSIGNMENT
   └─ Frontend: Dashboard page (src/app/page.tsx)

2. API REQUEST
   ├─ POST /api/assignments (create)
   └─ PUT /api/assignments (update)

3. VALIDATION
   ├─ Check member exists
   ├─ Check task exists
   ├─ Validate date range
   └─ Ensure no overlapping assignments

4. PERSIST TO EDGE CONFIG
   └─ Update via Vercel REST API (src/lib/db.ts)

5. INVALIDATE CACHE
   └─ React Query refetches updated data

6. UI UPDATE
   └─ Display updated assignments in table
```

### Notification Flow

How Slack notifications are sent:

```
┌─────────────────────────────────────────────────────────────┐
│                  NOTIFICATION FLOW                           │
└─────────────────────────────────────────────────────────────┘

1. TRIGGER
   ├─ Automatic: After rotation completes
   └─ Manual: User clicks "Send to Slack" button

2. GATHER ASSIGNMENTS
   ├─ Get current assignments from Edge Config
   ├─ Get member details (name, Slack ID)
   └─ Get task details (name, rule)

3. FORMAT MESSAGE
   ├─ For each assignment: "Task: @SlackUser"
   └─ Special handling for "English word" task:
       ├─ Show current assignee
       ├─ Show Day + 1 assignee
       └─ Show Day + 2 assignee

4. SEND TO SLACK
   ├─ POST to webhook URL
   ├─ Handle errors gracefully (log but don't fail)
   └─ Return success/failure status
```

**Key Files:**
- `src/services/assignments.ts` - Notification logic
- `src/app/api/assignments/send-to-slack/route.ts` - API endpoint

---

## Development

### Running Locally

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

3. **Navigate through the app:**
   - **Dashboard** (`/`) - View current assignments
   - **Members** (`/members`) - Manage team members
   - **Tasks** (`/tasks`) - Manage tasks and rotation rules
   - **Settings** (`/settings`) - Configure Slack webhook

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test-edge-config` | Test Edge Config connection |
| `npm run migrate` | Migrate local data to Edge Config |
| `npm run clear-edge-config` | Clear all Edge Config data |
| `npm run export-data` | Export Edge Config data to local files |

### Testing

#### Test Edge Config Connection

Verify that your Edge Config credentials are working:

```bash
npm run test-edge-config
```

This script will:
1. ✅ List all Edge Configs in your account
2. ✅ Retrieve all items from your Edge Config
3. ✅ Test write operation (update an item)

**Expected Output:**
```
Getting all Edge Configs...
[{"id":"ecfg_xxx","slug":"team-rotator-vercel-store",...}]

Getting all items from specific Edge Config...
[{"key":"members","value":[...]},{"key":"tasks","value":[...]}]

Updating specific item...
{"status":"ok"}
```

#### Manual Testing Checklist

**Member Management:**
- [ ] Add a new member
- [ ] Edit member details
- [ ] Delete a member
- [ ] Verify member list updates

**Task Management:**
- [ ] Create task with daily rule
- [ ] Create task with weekly rule
- [ ] Create task with biweekly rule
- [ ] Edit task rotation rule
- [ ] Delete a task

**Assignment & Rotation:**
- [ ] View current assignments on dashboard
- [ ] Manually trigger rotation
- [ ] Verify assignments update correctly
- [ ] Check rotation respects working days
- [ ] Verify member rotation order

**Slack Integration:**
- [ ] Configure webhook in settings
- [ ] Send test notification
- [ ] Verify message format in Slack
- [ ] Check @mentions work correctly

#### Testing Holiday Logic

The app uses the [holiday-cn](https://github.com/NateScarlet/holiday-cn) API for Chinese holidays:

```typescript
// Test if a date is a working day
import { isWorkingDay } from '@/lib/holiday';

const date = new Date('2025-01-01'); // New Year's Day
const result = await isWorkingDay(date);
console.log(result); // false (holiday)
```

---

## Data Management

### Data Structure

All data is stored in Vercel Edge Config with the following keys:

#### `members` (Array)
```typescript
interface Member {
  id: number;              // Unique identifier
  host: string;            // Display name
  slackMemberId: string;   // Slack user ID (format: U12345678)
}
```

#### `tasks` (Array)
```typescript
interface Task {
  id: number;              // Unique identifier
  name: string;            // Task name
  rotationRule: string;    // Rotation pattern
  // Examples:
  // - "daily"
  // - "weekly_friday"
  // - "biweekly_thursday"
}
```

#### `taskAssignments` (Array)
```typescript
interface TaskAssignment {
  id: number;              // Unique identifier
  taskId: number;          // Reference to Task.id
  memberId: number;        // Reference to Member.id
  startDate: string;       // ISO date string (YYYY-MM-DD)
  endDate: string;         // ISO date string (YYYY-MM-DD)
}
```

#### `systemConfigs` (Array)
```typescript
interface SystemConfig {
  key: string;             // Config key (e.g., "Slack:WebhookUrl")
  value: string;           // Config value
  lastModified: string;    // ISO timestamp
  modifiedBy: string | null;
}
```

### Rotation Rules Explained

| Rule | Format | Behavior | Example |
|------|--------|----------|---------|
| **Daily** | `"daily"` | Rotates every working day | English word task |
| **Weekly** | `"weekly_<day>"` | Rotates weekly on specified day | `weekly_friday` for Standup |
| **Biweekly** | `"biweekly_<day>"` | Rotates every 2 weeks on specified day | `biweekly_thursday` for English corner |

**Valid days:** `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`

### Importing/Exporting Data

**Export current data:**
```bash
npm run export-data
```
This creates JSON files in the `data/` directory.

**Import data to Edge Config:**
```bash
npm run migrate
```
This reads from `data/*.json` and uploads to Edge Config.

---

## API Reference

### Members API

**Get all members**
```http
GET /api/members
```

**Create member**
```http
POST /api/members
Content-Type: application/json

{
  "host": "John Doe",
  "slackMemberId": "U12345678"
}
```

**Update member**
```http
PUT /api/members
Content-Type: application/json

{
  "id": 1,
  "host": "John Doe",
  "slackMemberId": "U12345678"
}
```

**Delete member**
```http
DELETE /api/members?id=1
```

### Tasks API

**Get all tasks**
```http
GET /api/tasks
```

**Create task**
```http
POST /api/tasks
Content-Type: application/json

{
  "name": "Standup",
  "rotationRule": "weekly_friday"
}
```

**Update task**
```http
PUT /api/tasks
Content-Type: application/json

{
  "id": 1,
  "name": "Standup",
  "rotationRule": "weekly_friday"
}
```

**Delete task**
```http
DELETE /api/tasks?id=1
```

### Assignments API

**Get all assignments**
```http
GET /api/assignments
```

**Trigger rotation**
```http
POST /api/assignments/update-rotation
```

**Send to Slack**
```http
POST /api/assignments/send-to-slack
```

**Fix assignment dates**
```http
POST /api/assignments/fix-dates
```

### Configuration API

**Get system config**
```http
GET /api/config
```

**Update system config**
```http
POST /api/config
Content-Type: application/json

{
  "key": "Slack:WebhookUrl",
  "value": "https://hooks.slack.com/services/...",
  "lastModified": "2025-01-01T00:00:00.000Z",
  "modifiedBy": null
}
```

### System API

**Trigger cron job manually**
```http
GET /api/cron
```

**View logs**
```http
GET /api/logs
```

**Clear logs**
```http
DELETE /api/logs
```

---

## Deployment

### Deploy to Vercel

1. **Push code to Git repository** (GitHub, GitLab, or Bitbucket)

2. **Import project to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **Add New** → **Project**
   - Import your repository

3. **Configure Environment Variables:**
   - In Vercel project settings → **Environment Variables**
   - Add:
     - `EDGE_CONFIG`: Your Edge Config connection string
     - `VERCEL_ACCESS_TOKEN`: Your Vercel access token
   - Apply to: **Production**, **Preview**, and **Development**

4. **Deploy:**
   - Vercel will automatically build and deploy
   - Subsequent pushes to main branch will auto-deploy

### Cron Job Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 0 * * *"
  }]
}
```

This runs daily at midnight UTC (8:00 AM Beijing time).

**To change the schedule:**
- Modify the `schedule` field using [cron syntax](https://crontab.guru/)
- Redeploy the application

---

## Troubleshooting

### Common Issues

#### ❌ "EDGE_CONFIG environment variable is not set"

**Solution:**
1. Create `.env.local` file in project root
2. Add: `EDGE_CONFIG=your_connection_string`
3. Restart development server

#### ❌ "VERCEL_ACCESS_TOKEN not found"

**Solution:**
1. Generate token at [Vercel Account Settings](https://vercel.com/account/tokens)
2. Add to `.env.local`: `VERCEL_ACCESS_TOKEN=your_token`
3. Ensure token has Edge Config write permissions

#### ❌ "Failed to update Edge Config"

**Possible causes:**
- Invalid `VERCEL_ACCESS_TOKEN`
- Token doesn't have write permissions
- Edge Config ID is incorrect

**Solution:**
1. Verify token is valid: `npm run test-edge-config`
2. Regenerate token with correct permissions
3. Check Edge Config connection string format

#### ❌ Slack notifications not working

**Possible causes:**
- Webhook URL not configured
- Invalid webhook URL
- Network error

**Solution:**
1. Verify webhook URL in Settings page
2. Test webhook manually:
   ```bash
   curl -X POST -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}' \
     YOUR_WEBHOOK_URL
   ```
3. Check system logs in Dashboard → System Logs tab

#### ❌ Rotation not happening automatically

**Check:**
1. Cron job is configured in `vercel.json`
2. Application is deployed to Vercel (cron jobs don't work locally)
3. Check logs at `/api/logs`
4. Verify it's a working day (not weekend or holiday)

#### ❌ "Edge Config client is not initialized"

**Solution:**
- This usually means development mode is trying to use Edge Config
- In development, the app uses in-memory cache
- Ensure `NODE_ENV=development` for local development
- For production-like testing, set `NODE_ENV=production`

### Debug Mode

Enable detailed logging:

1. Check application logs:
   - Navigate to Dashboard → System Logs tab
   - Or call `GET /api/logs`

2. View Vercel logs (for production):
   - Go to Vercel Dashboard → Your Project → Logs
   - Filter by function or time range

3. Check browser console:
   - Open DevTools (F12)
   - Look for API errors in Network tab

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit with clear message: `git commit -m "Add: your feature"`
5. Push and create a Pull Request


## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review [Vercel Edge Config docs](https://vercel.com/docs/storage/edge-config)
- Check application logs at `/api/logs`

---

**Happy Rotating! 🔄**
