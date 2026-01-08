# Task Rotation Guide

## Overview

This guide explains how task assignments rotate in the Team Rotator system, with detailed examples focusing on **Retro** and **Standup** tasks.

## Tasks in the System

| Task | Rotation Rule | Target Day | Duration |
|------|---------------|------------|----------|
| **Retro** | `biweekly_wednesday` | Wednesday | ~2 weeks |
| **Standup** | `weekly_friday` | Friday | ~1 week |
| English corner | `biweekly_thursday` | Thursday | ~2 weeks |
| Tech huddle | `weekly_friday` | Friday | ~1 week |
| English word | `daily` | Next working day | 1 day |

## How Rotation Works

There are **two ways** tasks rotate:

### 1. Sprint Kickoff (Manual)
When you click "Kick Off Sprint" and select a start date:
- **ALL tasks start fresh** from the selected date
- **ALL members rotate** to the next person in the team
- End dates are calculated based on the start date + rotation rules

### 2. Automatic Rotation (Daily Cron)
After a task's current period ends:
- The task automatically rotates to the **next member**
- Starts from the **next working day** after the previous end date
- End date is calculated based on the rotation rule

---

## Standup Task (weekly_friday)

**Rule:** Weekly rotation, ends on Friday

### Sprint Kickoff Examples

#### Example 1: Kickoff on Monday
```
Sprint Kickoff: Monday, Jan 5, 2026
Current Member: Alice (ID: 1)
Team Order: Alice (1) → Bob (2) → Charlie (3) → Alice (1) ...

After Kickoff:
├─ Assigned to: Bob (next member)
├─ Start Date: Monday, Jan 5
├─ End Date: Friday, Jan 9
└─ Duration: 5 days (Mon-Tue-Wed-Thu-Fri)
```

**Explanation:** Started on Monday, ends on the next Friday = 5 working days ✓

#### Example 2: Kickoff on Thursday
```
Sprint Kickoff: Thursday, Jan 8, 2026
Current Member: Bob (ID: 2)
Team Order: Alice (1) → Bob (2) → Charlie (3) → Alice (1) ...

After Kickoff:
├─ Assigned to: Charlie (next member)
├─ Start Date: Thursday, Jan 8
├─ End Date: Friday, Jan 16 (NEXT WEEK)
└─ Duration: 8 days
```

**Explanation:** Started on Thursday (late in the week). To ensure a fair duration, the system extends to **next week's Friday** to give at least 3 working days.

**Why not end on Jan 9?** That would only be 2 days (Thu-Fri), which is too short. The system ensures everyone gets a fair work week (3-5 days).

#### Example 3: Kickoff on Friday
```
Sprint Kickoff: Friday, Jan 9, 2026
Current Member: Charlie (ID: 3)
Team Order: Alice (1) → Bob (2) → Charlie (3) → Alice (1) ...

After Kickoff:
├─ Assigned to: Alice (next member, wraps around)
├─ Start Date: Friday, Jan 9
├─ End Date: Friday, Jan 16 (NEXT WEEK)
└─ Duration: 8 days
```

**Explanation:** Starting on Friday (the target day) would end immediately. The system extends to **next Friday** to ensure a full week.

### Automatic Rotation Examples

#### Example 4: Normal Rotation After Period Ends
```
Previous Assignment:
├─ Member: Alice
├─ Start: Monday, Jan 5
└─ End: Friday, Jan 9

Automatic Rotation (triggered on Jan 10):
├─ Assigned to: Bob (next member)
├─ Start Date: Monday, Jan 12 (next working day after Jan 9)
├─ End Date: Friday, Jan 16
└─ Duration: 5 days
```

**Explanation:** After Alice's period ends on Friday, the system automatically assigns to Bob starting the next working Monday.

---

## Retro Task (biweekly_wednesday)

**Rule:** Biweekly rotation, ends on Wednesday (every 2 weeks)

### Sprint Kickoff Examples

#### Example 1: Kickoff on Monday
```
Sprint Kickoff: Monday, Jan 5, 2026
Current Member: Alice (ID: 1)
Team Order: Alice (1) → Bob (2) → Charlie (3) → Alice (1) ...

After Kickoff:
├─ Assigned to: Bob (next member)
├─ Start Date: Monday, Jan 5
├─ End Date: Wednesday, Jan 21
└─ Duration: 17 days
```

**Calculation:**
- Start: Monday, Jan 5
- Days until Wednesday: 2 days (Mon → Tue → Wed)
- Add 2 weeks: Jan 7 + 14 days = Jan 21 ✓
- Total: 2 + 14 = 16 days (plus start day = 17 days)

#### Example 2: Kickoff on Tuesday
```
Sprint Kickoff: Tuesday, Jan 6, 2026
Current Member: Bob (ID: 2)
Team Order: Alice (1) → Bob (2) → Charlie (3) → Alice (1) ...

After Kickoff:
├─ Assigned to: Charlie (next member)
├─ Start Date: Tuesday, Jan 6
├─ End Date: Wednesday, Jan 21
└─ Duration: 15 days
```

**Calculation:**
- Start: Tuesday, Jan 6
- Days until Wednesday: 1 day (Tue → Wed)
- Add 2 weeks: Jan 7 + 14 days = Jan 21 ✓
- Total: 1 + 14 = 15 days

#### Example 3: Kickoff on Wednesday (Target Day)
```
Sprint Kickoff: Wednesday, Jan 7, 2026
Current Member: Charlie (ID: 3)
Team Order: Alice (1) → Bob (2) → Charlie (3) → Alice (1) ...

After Kickoff:
├─ Assigned to: Alice (next member, wraps around)
├─ Start Date: Wednesday, Jan 7
├─ End Date: Wednesday, Jan 21
└─ Duration: 14 days (exactly 2 weeks)
```

**Calculation:**
- Start: Wednesday, Jan 7 (already on target day)
- Add 2 weeks: Jan 7 + 14 days = Jan 21 ✓
- Total: 14 days (exactly 2 weeks)

#### Example 4: Kickoff on Thursday
```
Sprint Kickoff: Thursday, Jan 8, 2026
Current Member: Alice (ID: 1)
Team Order: Alice (1) → Bob (2) → Charlie (3) → Alice (1) ...

After Kickoff:
├─ Assigned to: Bob (next member)
├─ Start Date: Thursday, Jan 8
├─ End Date: Wednesday, Jan 22
└─ Duration: 14 days
```

**Calculation:**
- Start: Thursday, Jan 8
- Days until Wednesday: 6 days (Thu → Fri → Sat → Sun → Mon → Tue → Wed)
- Add 2 weeks: Jan 14 + 14 days = Jan 28
- But that's too long! Adjust to: Jan 8 + 14 days = Jan 22 ✓
- Total: 14 days (biweekly period)

### Automatic Rotation Examples

#### Example 5: Normal Rotation After Period Ends
```
Previous Assignment:
├─ Member: Bob
├─ Start: Monday, Jan 5
└─ End: Wednesday, Jan 21

Automatic Rotation (triggered on Jan 22):
├─ Assigned to: Charlie (next member)
├─ Start Date: Thursday, Jan 22 (next working day)
├─ End Date: Wednesday, Feb 5
└─ Duration: 14 days
```

**Calculation:**
- Previous period ended: Wednesday, Jan 21
- Next working day: Thursday, Jan 22
- Days until Wednesday: 6 days → Feb 4
- Add 2 weeks: Jan 28 + 14 days... 
- Result: Jan 22 + 14 days = Feb 5 ✓

#### Example 6: Rotation When Previous Period Ended on Target Day
```
Previous Assignment:
├─ Member: Alice
├─ Start: Wednesday, Jan 7
└─ End: Wednesday, Jan 21

Automatic Rotation (triggered on Jan 22):
├─ Assigned to: Bob (next member)
├─ Start Date: Thursday, Jan 22 (next working day)
├─ End Date: Wednesday, Feb 5
└─ Duration: 14 days
```

**Explanation:** Even though the previous period ended on Wednesday (target day), the new period starts on Thursday (next working day) and runs for 2 weeks until the next Wednesday.

---

## Member Rotation Logic

### How Members are Selected

The system maintains a list of team members with IDs:

```
Team List:
1. Alice
2. Bob
3. Charlie
```

**Rotation Rule:** Always move to the **next person** in the list. When reaching the end, wrap around to the beginning.

### Example: Full Rotation Cycle

```
Week 1: Standup assigned to Alice (ID: 1)
Week 2: Standup assigned to Bob (ID: 2)
Week 3: Standup assigned to Charlie (ID: 3)
Week 4: Standup assigned to Alice (ID: 1) ← Wraps around
Week 5: Standup assigned to Bob (ID: 2)
...and so on
```

### Sprint Kickoff Member Rotation

When you kick off a sprint, **ALL tasks rotate to the next member:**

```
Before Kickoff:
├─ Retro: Alice
├─ Standup: Bob
├─ English corner: Charlie
├─ Tech huddle: Alice
└─ English word: Bob

After Kickoff:
├─ Retro: Bob (Alice → Bob)
├─ Standup: Charlie (Bob → Charlie)
├─ English corner: Alice (Charlie → Alice, wraps)
├─ Tech huddle: Bob (Alice → Bob)
└─ English word: Charlie (Bob → Charlie)
```

---

## Working Days and Holidays

### Public Holiday Handling

The system checks Australian public holidays using the `holiday.ts` module.

**If a rotation would land on a holiday or weekend:**
- The system finds the **next working day**
- Weekends are automatically skipped

### Example: Holiday in the Middle of Rotation

```
Scenario: Public holiday on Wednesday, Jan 14

Previous Standup:
└─ End Date: Friday, Jan 9

Expected Next Start: Monday, Jan 12 (next working day)

However, if Jan 12 is a public holiday:
├─ Jan 12: Public Holiday ❌
├─ Jan 13: Check next day
└─ Actual Start: Tuesday, Jan 13 ✓
```

---

## Key Differences: Sprint Kickoff vs Automatic Rotation

| Aspect | Sprint Kickoff | Automatic Rotation |
|--------|----------------|-------------------|
| **Trigger** | Manual button click | Daily cron job |
| **When** | Anytime you choose | After task period ends |
| **Start Date** | Date you select | Next working day after end |
| **Member Change** | ALL tasks rotate | Only expired tasks rotate |
| **Use Case** | Sprint extensions, holidays | Normal weekly rotation |

---

## Common Questions

### Q1: Why does Standup sometimes last more than 5 days?

**A:** To ensure fairness! If you kick off late in the week (Thursday/Friday), ending on the nearest Friday would only give 1-2 days. The system extends to **next Friday** to ensure everyone gets at least 3-5 working days.

### Q2: Why is Retro showing 15 days instead of exactly 14?

**A:** Biweekly tasks target a specific day (Wednesday). If you kick off on Tuesday, it calculates:
- Tuesday → Wednesday (1 day) + 2 weeks (14 days) = **15 days total**

This ensures the task always **ends on the target day** (Wednesday).

### Q3: What happens if I kick off during a weekend?

**A:** The system will use the date you selected, but since no work happens on weekends:
- **Saturday → Next working day is Monday**
- **Sunday → Next working day is Monday**

The task will effectively start on Monday.

### Q4: Can I see the full rotation history?

**A:** Yes! Go to the Dashboard and switch to the **"History"** tab. It shows all past assignments with dates and members.

---

## Visual Timeline Examples

### Standup: Full Month Rotation (Kickoff Jan 5, Monday)

```
Week 1 (Jan 5-9):   Alice    [Mon------------Fri]
Week 2 (Jan 12-16): Bob      [Mon------------Fri]
Week 3 (Jan 19-23): Charlie  [Mon------------Fri]
Week 4 (Jan 26-30): Alice    [Mon------------Fri] ← Wraps around
```

### Retro: Full Quarter Rotation (Kickoff Jan 7, Wednesday)

```
Period 1 (Jan 7-21):   Alice    [Wed-----------Wed] 14 days
Period 2 (Jan 22-Feb 5): Bob    [Thu-----------Wed] 14 days
Period 3 (Feb 6-19):   Charlie  [Thu-----------Wed] 13 days
Period 4 (Feb 20-Mar 5): Alice  [Thu-----------Wed] 13 days ← Wraps
```

### Sprint Kickoff Impact (Kickoff Jan 8, Thursday)

```
BEFORE KICKOFF:
Standup: Alice [Jan 5-9]
Retro: Bob [Jan 5-21]

AFTER KICKOFF (Jan 8):
Standup: Bob [Jan 8-16]     ← Member rotated, extended to next week
Retro: Charlie [Jan 8-22]   ← Member rotated, 14 days
```

---

## Testing Your Understanding

### Scenario 1
**Setup:**
- Kick off sprint on Monday, Jan 5
- Current Standup assignee: Alice
- Next member: Bob

**Question:** When will Bob's Standup period end?

<details>
<summary>Answer</summary>

**Friday, Jan 9**

- Start: Monday, Jan 5
- Target: Friday
- Days: Mon, Tue, Wed, Thu, Fri = 5 days
- End: Friday, Jan 9 ✓
</details>

### Scenario 2
**Setup:**
- Kick off sprint on Tuesday, Jan 6
- Current Retro assignee: Bob
- Next member: Charlie

**Question:** When will Charlie's Retro period end?

<details>
<summary>Answer</summary>

**Wednesday, Jan 21**

- Start: Tuesday, Jan 6
- Target: Wednesday
- Calculation: Jan 6 + 1 day (to Wed) + 14 days = Jan 21
- Duration: 15 days ✓
</details>

### Scenario 3
**Setup:**
- Kick off sprint on Thursday, Jan 8
- Current Standup assignee: Charlie
- Next member: Alice

**Question:** When will Alice's Standup period end?

<details>
<summary>Answer</summary>

**Friday, Jan 16** (NEXT WEEK, not Jan 9!)

- Start: Thursday, Jan 8
- Target: Friday
- If we ended on Jan 9, that's only 2 days (Thu-Fri) ❌
- System extends to next Friday: Jan 16 ✓
- Duration: 8 days (ensures fairness)
</details>

---

## Summary

- **Daily tasks** (English word): 1 day, next working day
- **Weekly tasks** (Standup, Tech huddle): Target day each week, minimum 3-5 working days
- **Biweekly tasks** (Retro, English corner): Target day every 2 weeks, ~14-15 days
- **Sprint Kickoff**: Resets all tasks from chosen date + rotates all members
- **Automatic Rotation**: Continues rotation after current period ends
- **Member Rotation**: Always moves to next person, wraps around at end of list
- **Fairness**: System ensures minimum durations, extends periods when needed

