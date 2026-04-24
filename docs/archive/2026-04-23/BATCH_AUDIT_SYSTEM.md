# Batch Audit System Documentation

**Last Updated:** April 17, 2026  
**Status:** Implemented & Testing

---

## Overview

The Batch Audit system allows managers/staff to perform inventory audits on multiple items at once, grouped by category (spirits, beer, mixers, ingredients) or "all items".

---

## Features

### 1. Create Audit Session

**Location:** Settings → Batch Audit dropdown

**Options:**

- All Items
- Spirits
- Beer
- Mixers
- Ingredients

When selected, creates an audit session with:

- `typeFilter`: The selected category
- `status`: "in_progress"
- `itemCount`: Number of items matching the filter

### 2. Audit Session Workflow

**Session Table (audit_sessions):**

| Column            | Type    | Description                  |
| ----------------- | ------- | ---------------------------- |
| id                | text    | UUID                         |
| status            | text    | "in_progress" or "completed" |
| typeFilter        | text    | Category filter              |
| categoryFilter    | text    | (reserved)                   |
| startedByUserId   | text    | User who started             |
| startedAt         | integer | Unix timestamp               |
| completedByUserId | text    | User who completed           |
| completedAt       | integer | Unix timestamp               |
| itemCount         | integer | Total items                  |
| completedCount    | integer | Items audited                |

### 3. Performing Audit

**Location:** `/settings/batch-audit/:id`

**Interface:**

- Lists all items in the session
- Shows current stock for each item
- Input fields for:
  - Bulk (full bottles/cases)
  - Partial (open bottle weight in grams)

### 4. Submitting Audit

When submitting:

- Creates an `inventory_audits` record for each item
- Updates item's `currentBulk`, `currentPartial`, `currentStock`
- Sets `lastAuditedAt`, `lastAuditedByUserId`
- Marks session as completed

---

## Database Schema

### inventory_audits Table

| Column              | Type    | Description             |
| ------------------- | ------- | ----------------------- |
| id                  | text    | UUID                    |
| itemId              | text    | FK to inventory_items   |
| sessionId           | text    | FK to audit_sessions    |
| auditDate           | integer | Timestamp               |
| auditEntryMethod    | text    | "bulk_partial"          |
| reportedBulk        | real    | Full containers counted |
| reportedPartial     | real    | Partial weight (g)      |
| reportedTotal       | real    | Total in base units     |
| previousTotal       | real    | Previous stock          |
| expectedTotal       | real    | System expected         |
| systemStock         | real    | System stock            |
| physicalCount       | real    | Physical count          |
| variance            | real    | Difference              |
| variancePercent     | real    | % variance              |
| auditReason         | text    | Reason code             |
| weightG             | real    | Weight in grams         |
| calculatedBaseUnits | real    | Calculated units        |
| countedByUserId     | text    | User who counted        |
| notes               | text    | Notes                   |
| auditedByUserId     | text    | User who audited        |
| auditedAt           | integer | Timestamp               |
| countedAt           | integer | Timestamp               |
| createdAt           | integer | Timestamp               |

### audit_sessions Table

| Column            | Type    | Description                 |
| ----------------- | ------- | --------------------------- |
| id                | text    | UUID                        |
| status            | text    | "in_progress" / "completed" |
| typeFilter        | text    | Category filter             |
| categoryFilter    | text    | (reserved)                  |
| startedByUserId   | text    | Initiator                   |
| completedByUserId | text    | Completer                   |
| startedAt         | integer | Start timestamp             |
| completedAt       | integer | Completion timestamp        |
| itemCount         | integer | Total items                 |
| completedCount    | integer | Items processed             |

---

## API Endpoints

### Create Session

```
POST /api/inventory/audit-sessions
Body: { typeFilter: string, startedByUserId: string }
Response: { session object }
```

### Get Session

```
GET /api/inventory/audit-sessions/:id
Response: { session object }
```

### Get Session Items

```
GET /api/inventory/audit-sessions/:id/items
Response: [ inventory items ]
```

### Submit Batch Audit

```
POST /api/inventory/audit-sessions/:id/submit
Body: { items: [{ itemId, bulk, partial }], completedByUserId }
Response: { success: true, auditsCreated: n, errors: [] }
```

### List Sessions

```
GET /api/inventory/audit-sessions
Response: [ sessions ]
```

---

## Bug Fixes Applied

### 1. Missing crypto import

**Issue:** `crypto is not defined` error when creating audit session  
**Fix:** Added `import crypto from "crypto"` to `audit-sessions.ts`

### 2. Missing session_id column

**Issue:** `Failed query: insert into "inventory_audits"` - column "session_id" does not exist  
**Fix:** Added auto-migration to add `session_id` column to `inventory_audits` table in `lib/db/src/index.ts`

---

## Files Modified

| File                                                | Changes                                    |
| --------------------------------------------------- | ------------------------------------------ |
| `lib/db/src/schema/inventory.ts`                    | Added sessionId to inventoryAuditsTable    |
| `lib/db/src/index.ts`                               | Added auto-migration for session_id column |
| `artifacts/api-server/src/routes/audit-sessions.ts` | Added crypto import                        |

---

## Future Enhancements

1. **Resume Incomplete Sessions** - Allow picking up where left off
2. **Batch Variance Report** - Summary of all items audited
3. **Audit Aging Alerts** - Remind staff when items weren't audited recently
