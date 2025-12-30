# Team Rotator

A team rotation management system built with Next.js and Vercel Edge Config. This application helps teams manage and automate task rotations among team members with automatic Slack notifications.

## Table of Contents

- [Quick Start](#quick-start)
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

## Quick Start

Get the app running in 5 minutes:

```bash
# 1. Clone and install
git clone <repository-url>
cd team-rotator-vercel
npm install

# 2. Create .env.local file
cat > .env.local << 'EOF'
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxx?token=xxx
VERCEL_ACCESS_TOKEN=your_vercel_access_token
NEXT_PUBLIC_USE_EDGE_CONFIG=true
EOF

# 3. Import sample data to Edge Config
npm run migrate

# 4. Start the development server
npm run dev

# 5. Open http://localhost:3000
```

**Get credentials:**

- `EDGE_CONFIG`: [Vercel Dashboard](https://vercel.com/dashboard) → Project → Storage → Edge Config
- `VERCEL_ACCESS_TOKEN`: [Vercel Account Settings](https://vercel.com/account/tokens) → Create Token

**That's it! 🚀** Continue reading for detailed setup and configuration options.

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

| Category             | Technology                           |
| -------------------- | ------------------------------------ |
| **Framework**        | Next.js 13+ (App Router)             |
| **UI Library**       | Material-UI (MUI) + Tailwind CSS     |
| **State Management** | TanStack Query (React Query)         |
| **Data Storage**     | Vercel Edge Config                   |
| **API**              | Next.js API Routes                   |
| **Deployment**       | Vercel                               |
| **Date Handling**    | date-fns                             |
| **HTTP Client**      | Axios                                |
| **Logging**          | Custom logger with in-memory storage |
| **Script Runner**    | tsx (TypeScript execution)           |
| **Environment**      | dotenv-cli, cross-env                |

---

## Project Structure

```
team-rotator-vercel/
├── data/                          # Local JSON files (sample data for migration)
│   ├── members.json               # ⚠️ Use sample data only
│   ├── tasks.json                 # ⚠️ Use sample data only
│   ├── task_assignments.json      # ⚠️ Use sample data only
│   └── system_configs.json        # ⚠️ Use placeholder URLs only
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

# Use Edge Config in Development Mode (Optional)
# Set to 'true' to use Edge Config even in development mode
# Set to 'false' or leave unset to use in-memory cache in development
NEXT_PUBLIC_USE_EDGE_CONFIG=true
```

**Important Notes:**

- ⚠️ **Do not use inline comments** in `.env.local` (comments must be on separate lines)
- ✅ Each variable should be on its own line
- ✅ No trailing spaces or comments after the values

#### Step 5: Initialize Data in Edge Config

You can either:

**Option A: Import sample data (Recommended)**

Create sample data files in the `data/` folder (or use existing ones), then import:

```bash
npm run migrate
```

This will:

- ✅ Read JSON files from `data/` folder
- ✅ Upload them to Edge Config
- ✅ Validate the connection
- ✅ Create all necessary keys (`members`, `tasks`, `taskAssignments`, `systemConfigs`)

**Option B: Manually add data via Vercel Dashboard**

1. Go to your Edge Config in Vercel Dashboard
2. Add the following keys with empty arrays:
   - `members`: `[]`
   - `tasks`: `[]`
   - `taskAssignments`: `[]`
   - `systemConfigs`: `[{"key": "Slack:WebhookUrl", "value": "your_webhook_url", "lastModified": "2025-01-01T00:00:00.000Z", "modifiedBy": null}]`

---

### ⚠️ Important: `.env.local` File Format

The `.env.local` file **must follow strict formatting rules**:

**✅ Correct Format:**

```bash
# Comment on its own line
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxx?token=xxx

# Another comment
VERCEL_ACCESS_TOKEN=your_token_here
NEXT_PUBLIC_USE_EDGE_CONFIG=true
```

**❌ Incorrect Format (Will Fail):**

```bash
# DO NOT DO THIS:
VERCEL_ACCESS_TOKEN=your_token  # inline comment ❌
EDGE_CONFIG = https://...  # spaces around = ❌
EDGE_CONFIG="https://..."  # quotes not needed ❌
```

**Rules:**

- ✅ Comments must be on their own line
- ✅ No spaces around the `=` sign
- ✅ No quotes around values (unless the value itself contains quotes)
- ✅ No trailing spaces or inline comments
- ✅ One variable per line

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

   This automatically:

   - ✅ Loads environment variables from `.env.local`
   - ✅ Disables SSL verification for local development
   - ✅ Uses Edge Config if `NEXT_PUBLIC_USE_EDGE_CONFIG=true`

2. **Open your browser:**

   ```
   http://localhost:3000
   ```

3. **Navigate through the app:**
   - **Dashboard** (`/`) - View current assignments
   - **Members** (`/members`) - Manage team members
   - **Tasks** (`/tasks`) - Manage tasks and rotation rules
   - **Settings** (`/settings`) - Configure Slack webhook

### Development Modes

The app supports two development modes:

#### **Option 1: Using Edge Config (Recommended)**

Set in `.env.local`:

```bash
NEXT_PUBLIC_USE_EDGE_CONFIG=true
```

- ✅ Uses real Edge Config data
- ✅ Data persists between restarts
- ✅ Matches production behavior
- ✅ Multiple team members can share data

#### **Option 2: In-Memory Cache**

Set in `.env.local`:

```bash
NEXT_PUBLIC_USE_EDGE_CONFIG=false
# or don't set it at all
```

- ✅ Fast local development
- ❌ Data resets on server restart
- ❌ Each team member has separate data
- ✅ No network dependency

### Available Scripts

| Command                     | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| `npm run dev`               | Start development server on port 3000 (with SSL bypass for local) |
| `npm run dev:secure`        | Start development server with SSL verification enabled            |
| `npm run build`             | Build for production                                              |
| `npm start`                 | Start production server                                           |
| `npm run lint`              | Run ESLint                                                        |
| `npm run test-edge-config`  | Test Edge Config connection (loads `.env.local`)                  |
| `npm run migrate`           | Migrate local data to Edge Config (loads `.env.local`)            |
| `npm run clear-edge-config` | Clear all Edge Config data (loads `.env.local`)                   |
| `npm run export-data`       | Export Edge Config data to local files (loads `.env.local`)       |

**Note:** All scripts automatically load environment variables from `.env.local` using `dotenv-cli`.

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

#### Testing Holiday Logic

The app uses the [holiday-cn](https://github.com/NateScarlet/holiday-cn) API for Chinese holidays:

```typescript
// Test if a date is a working day
import { isWorkingDay } from "@/lib/holiday";

const date = new Date("2025-01-01"); // New Year's Day
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
  id: number; // Unique identifier
  host: string; // Display name
  slackMemberId: string; // Slack user ID (format: U12345678)
}
```

#### `tasks` (Array)

```typescript
interface Task {
  id: number; // Unique identifier
  name: string; // Task name
  rotationRule: string; // Rotation pattern
  // Examples:
  // - "daily"
  // - "weekly_friday"
  // - "biweekly_thursday"
}
```

#### `taskAssignments` (Array)

```typescript
interface TaskAssignment {
  id: number; // Unique identifier
  taskId: number; // Reference to Task.id
  memberId: number; // Reference to Member.id
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
}
```

#### `systemConfigs` (Array)

```typescript
interface SystemConfig {
  key: string; // Config key (e.g., "Slack:WebhookUrl")
  value: string; // Config value
  lastModified: string; // ISO timestamp
  modifiedBy: string | null;
}
```

### Rotation Rules Explained

| Rule         | Format             | Behavior                               | Example                                |
| ------------ | ------------------ | -------------------------------------- | -------------------------------------- |
| **Daily**    | `"daily"`          | Rotates every working day              | English word task                      |
| **Weekly**   | `"weekly_<day>"`   | Rotates weekly on specified day        | `weekly_friday` for Standup            |
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

## Cron Job: Automated Daily Rotation

The application includes an **automated cron job** that runs daily to check and update task assignments. This eliminates the need for manual rotation management.

### Schedule Configuration

From `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule Breakdown:**

```
0 0 * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)

0 0 * * * = Every day at 00:00 (midnight UTC)
```

**When it runs:**

- ⏰ **Midnight UTC** (00:00) every day
- 🇨🇳 **8:00 AM Beijing time** (UTC+8)
- 🇺🇸 **5:00 PM PST** / **8:00 PM EST** (previous day)

### Complete Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│            DAILY CRON JOB EXECUTION FLOW                     │
└─────────────────────────────────────────────────────────────┘

1. TRIGGER (Midnight UTC)
   │
   ├─ Vercel automatically calls: GET /api/cron
   └─ Generate Request ID for tracking

2. CHECK WORKING DAY
   │
   ├─ Get today's date
   ├─ Query Chinese Holiday API
   │  └─ Check: Is today a holiday?
   │     ├─ If holiday → Check if it's a working day
   │     └─ If not holiday → Check if it's weekend
   │
   └─ Result:
       ├─ Working Day → Continue ✅
       └─ Not Working Day → STOP ❌ (return "skipped")

3. FOR EACH TASK ASSIGNMENT
   │
   ├─ Fetch all tasks, members, and assignments
   │
   └─ For each assignment:
       │
       ├─ Check: Has assignment period ended?
       │  └─ If today > endDate → Need to rotate
       │
       ├─ Check: Should rotate today?
       │  └─ Based on rotation rule (daily/weekly/biweekly)
       │
       ├─ Calculate next rotation period
       │  ├─ Find next working day
       │  ├─ Calculate new end date based on rule
       │  └─ Determine new date range
       │
       ├─ Rotate member
       │  ├─ Sort members by ID
       │  ├─ Find current member position
       │  └─ Move to next member (circular)
       │
       └─ Update assignment in Edge Config

4. SEND SLACK NOTIFICATIONS
   │
   ├─ Get webhook URL from system config
   ├─ Format message for all current assignments
   │  └─ Special handling for "English word" task
   └─ POST to Slack webhook

5. RETURN RESULT
   └─ Success or Skipped status
```

### Example Scenarios

#### **Scenario 1: Normal Working Day (Rotation Happens)**

```javascript
// Monday, January 1, 2026 (normal working day)

// 1. Cron triggers at midnight
GET /api/cron

// 2. Check if working day
isWorkingDay(2026-01-01)
→ Not a holiday ✓
→ Not a weekend (Monday) ✓
→ Result: true (is working day)

// 3. Check assignments
Current assignments:
  - Standup (weekly_friday): Tom (ends 2025-12-31)
  - English word (daily): Harry (ends 2025-12-31)

// 4. Both assignments ended yesterday, rotate!

// For Standup:
  - Current: Tom (ID 15)
  - Next member: An (ID 16)
  - New period: 2026-01-01 to 2026-01-03
  - Update: Standup → An

// For English word:
  - Current: Harry (ID 13)
  - Next member: Thuc Hoang (ID 14)
  - New period: 2026-01-01 to 2026-01-01
  - Update: English word → Thuc Hoang

// 5. Send Slack notification
POST to Slack:
"""
Standup: @An
English word: @ThucHoang
English word(Day + 1): @TomTang
English word(Day + 2): @An
...
"""

// 6. Return success ✅
```

#### **Scenario 2: Weekend (No Rotation)**

```javascript
// Saturday, January 4, 2026

// 1. Cron triggers at midnight
GET /api/cron

// 2. Check if working day
isWorkingDay(2026-01-04)
→ dayOfWeek = 6 (Saturday) ❌
→ Result: false (not a working day)

// 3. Skip rotation
logger.info('Not a working day, skipping update')

// 4. Return skipped ⏭️
{ message: "Not a working day, skipping update", skipped: true }
```

#### **Scenario 3: Chinese Holiday (Working Day Makeup)**

```javascript
// Saturday, February 1, 2026 (makeup working day)

// 1. Cron triggers at midnight
GET /api/cron

// 2. Check if working day
isWorkingDay(2026-02-01)
→ Query holiday API...
→ Found: { date: "2026-02-01", isOffDay: false }
→ isOffDay = false → It's a WORKING day ✅

// 3. Proceed with rotation (even though it's Saturday!)
// 4-6. Update assignments and send notifications
```

### Rotation Rules in Action

#### **1. Daily Rotation** (`daily`)

```javascript
// Example: "English word" task
{
  name: "English word",
  rotationRule: "daily"
}

// Rotates: Every working day
// Period: Single day (startDate = endDate)
// Example:
//   Day 1: Tom (2026-01-01 to 2026-01-01)
//   Day 2: An (2026-01-02 to 2026-01-02)
//   Day 3: Terri (2026-01-03 to 2026-01-03)
```

#### **2. Weekly Rotation** (`weekly_friday`)

```javascript
// Example: "Standup" task
{
  name: "Standup",
  rotationRule: "weekly_friday"
}

// Rotates: Every week
// Period: Next working day → next Friday
// Example:
//   Week 1: Tom (Mon 12/30 to Fri 1/3)
//   Week 2: An (Mon 1/6 to Fri 1/10)
//   Week 3: Terri (Mon 1/13 to Fri 1/17)
```

#### **3. Biweekly Rotation** (`biweekly_thursday`)

```javascript
// Example: "English corner" task
{
  name: "English corner",
  rotationRule: "biweekly_thursday"
}

// Rotates: Every 2 weeks
// Period: Next working day → Thursday + 1 week
// Example:
//   Weeks 1-2: Tom (Thu 12/19 to Thu 1/2)
//   Weeks 3-4: An (Thu 1/2 to Thu 1/16)
//   Weeks 5-6: Terri (Thu 1/16 to Thu 1/30)
```

### Slack Notification Format

The cron job sends formatted messages to Slack:

```
Retro: @Yahui
English word: @zhigang
English word(Day + 1): @An
English word(Day + 2): @Terri
Standup: @Taylor
Tech huddle: @Yichen
English corner: @AnPham
```

**Note:** The "English word" task shows 3 days:

- Current day's assignee
- Next day's assignee (Day + 1)
- Day after next (Day + 2)

This helps the team prepare in advance!

### Manual Trigger Options

You don't have to wait for the cron job. You can trigger rotation manually:

**1. Via Dashboard UI:**

- Go to http://localhost:3000
- Click **"Update Rotation"** button

**2. Via API:**

```bash
curl https://your-app.vercel.app/api/cron
```

**3. Via Vercel Dashboard:**

- Go to your project → Deployments → Functions
- Find cron function → Click **"Run"**

### Logging & Monitoring

Every cron execution is logged for debugging:

**View logs in your app:**

```
http://localhost:3000 → System Logs tab
```

**Or via API:**

```bash
GET /api/logs
```

**What's logged:**

- Request ID (for tracking specific executions)
- Execution timestamp
- Working day check result
- Each assignment check and decision
- Rotation calculations
- Member changes
- Slack notification status
- Success/failure status

### Configuration Settings

The cron job respects these settings:

| Setting            | Value               | Description                                                  |
| ------------------ | ------------------- | ------------------------------------------------------------ |
| **Timeout**        | 60 seconds          | Maximum execution time                                       |
| **Holiday Source** | Chinese Holiday API | From [holiday-cn](https://github.com/NateScarlet/holiday-cn) |
| **Slack Webhook**  | System Config       | Configured in Settings page                                  |
| **Rotation Logic** | Task rotation rules | daily/weekly/biweekly                                        |
| **Member Order**   | Sorted by ID        | Ascending order (8, 10, 13, 14, 15, 16)                      |

### Key Features

✅ **Automatic** - Runs every day without manual intervention  
✅ **Smart** - Skips weekends and holidays automatically  
✅ **Reliable** - Comprehensive logging for debugging  
✅ **Flexible** - Supports daily, weekly, and biweekly rotations  
✅ **Integrated** - Posts updates to Slack automatically  
✅ **Trackable** - Each execution has a unique request ID  
✅ **Holiday-Aware** - Respects Chinese public holidays  
✅ **Circular** - Members rotate in a continuous loop

### Important Notes

⚠️ **Cron jobs only work in production (Vercel deployment)**

- Local development doesn't support cron jobs
- Use manual trigger for local testing
- The cron endpoint is publicly accessible but safe to expose

⚠️ **Timezone considerations**

- Cron runs at midnight UTC
- Adjust your schedule if needed for your timezone
- Use [crontab.guru](https://crontab.guru/) to test schedules

⚠️ **Edge Config access**

- Ensure production has correct environment variables
- Both `EDGE_CONFIG` and `VERCEL_ACCESS_TOKEN` are required
- Test with `npm run test-edge-config` before deploying

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
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This runs daily at midnight UTC (8:00 AM Beijing time).

**To change the schedule:**

- Modify the `schedule` field using [cron syntax](https://crontab.guru/)
- Redeploy the application

---

## Security Best Practices

### ⚠️ Never Commit Secrets to Git

The `data/` folder is tracked in Git and should **only contain sample/placeholder data**, never real secrets:

**✅ Safe to commit:**

```json
{
  "key": "Slack:WebhookUrl",
  "value": "https://hooks.slack.com/services/YOUR_WEBHOOK_URL_HERE",
  "lastModified": "2025-01-01T00:00:00.000Z",
  "modifiedBy": null
}
```

**❌ NEVER commit:**

```json
{
  "key": "Slack:WebhookUrl",
  "value": "https://hooks.slack.com/services/T02998537/B0970HFURLP/...", // ❌ Real webhook
  "lastModified": "2025-07-29T02:27:47.569Z",
  "modifiedBy": null
}
```

### Where to Store Real Secrets

**Development (Local):**

- ✅ Real webhook URL → Configure in Settings page after running `npm run dev`
- ✅ Or manually update via Edge Config dashboard
- ❌ Never store in `data/system_configs.json`

**Production (Vercel):**

- ✅ Real webhook URL → Configure in Settings page after deployment
- ✅ Or update directly in Edge Config via Vercel dashboard
- ✅ Environment variables → Vercel project settings

### If You Accidentally Committed a Secret

**Option 1: Amend the last commit (if not pushed yet)**

```bash
# Fix the file with placeholder
# Then amend the commit
git add data/system_configs.json
git commit --amend --no-edit
git push origin main
```

**Option 2: Create a new commit (if push was blocked)**

```bash
# GitHub already blocked the push, so just commit the fix
git add data/system_configs.json
git commit -m "chore: replace real webhook with placeholder"
git push origin main
```

**Option 3: Secret was already pushed**

1. **Revoke the exposed secret immediately** (regenerate Slack webhook)
2. Remove from history:
   ```bash
   # Use BFG or git filter-branch (advanced)
   # Or contact your Git admin for help
   ```
3. Update with new secret in production (via Edge Config)

---

## Troubleshooting

### Common Issues

#### ❌ "EDGE_CONFIG environment variable is not set"

**Solution:**

1. Create `.env.local` file in project root
2. Add: `EDGE_CONFIG=your_connection_string`
3. Restart development server
4. For scripts (migrate, export-data), ensure `dotenv-cli` is installed: `npm install -D dotenv-cli`

#### ❌ "VERCEL_ACCESS_TOKEN not found"

**Solution:**

1. Generate token at [Vercel Account Settings](https://vercel.com/account/tokens)
2. Add to `.env.local`: `VERCEL_ACCESS_TOKEN=your_token`
3. Ensure token has Edge Config write permissions
4. **Remove any inline comments** from the line (comments must be on separate lines)

#### ❌ "Failed to update Edge Config"

**Possible causes:**

- Invalid `VERCEL_ACCESS_TOKEN`
- Token doesn't have write permissions
- Edge Config ID is incorrect

**Solution:**

1. Verify token is valid: `npm run test-edge-config`
2. Regenerate token with correct permissions
3. Check Edge Config connection string format

#### ❌ "Unable to get local issuer certificate" / SSL Certificate Errors

**Problem:**
This occurs when Node.js cannot verify SSL certificates, common in:

- Corporate networks with proxy/firewall
- Self-signed certificates
- VPN connections

**Solution (Development Only):**
The development server already has SSL verification disabled via `NODE_TLS_REJECT_UNAUTHORIZED=0` in the `npm run dev` script.

If you need SSL verification enabled (not recommended for local dev):

```bash
npm run dev:secure
```

**Note:** ⚠️ SSL bypass is **only for local development**. Production on Vercel works normally without this workaround.

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

1. Check if `EDGE_CONFIG` is set in `.env.local`
2. Ensure environment variables are loading correctly
3. Restart the development server
4. If using Edge Config in development, set: `NEXT_PUBLIC_USE_EDGE_CONFIG=true`

#### ❌ "Current member not found" during rotation

**Problem:**
Task assignments reference member IDs that don't exist in the members list.

**Solution:**

1. Check your data consistency:
   ```bash
   npm run export-data
   ```
2. Verify that all `memberId` values in `task_assignments.json` exist in `members.json`
3. Fix any mismatched IDs
4. Re-import the data:
   ```bash
   npm run migrate
   ```

#### ❌ Scripts fail with "Environment variable not set"

**Problem:**
Scripts like `npm run migrate` can't find environment variables.

**Solution:**
This is already fixed in the latest version. The scripts now use `dotenv-cli` to load `.env.local` automatically.

If still failing:

1. Ensure `dotenv-cli` is installed: `npm install -D dotenv-cli`
2. Ensure `cross-env` is installed: `npm install -D cross-env`
3. Verify `.env.local` exists and has no syntax errors

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
