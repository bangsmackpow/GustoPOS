# Inventory Audit System - Design Document

**Last Updated**: April 11, 2026  
**Version**: 1.1

---

## Implementation Status

### ✅ Backend Complete

- `auditSessionsTable` exists in schema (migration 0002)
- Inventory audits linked to sessions via `sessionId` field

### ❌ Frontend UI Pending

- Batch audit workflow from Settings → Audit Logs not yet implemented
- Design document serves as specification for future implementation

### ✅ Audit Age Stats Implemented

New endpoint: `GET /api/inventory/items/audit-age-stats`

Returns:

- `totalItems`: Total inventory items
- `itemsNeverAuditedCount`: Items never audited
- `itemsOverdueCount`: Items not audited in >4 days
- `itemsRecentlyAuditedCount`: Items audited within threshold
- `oldestAuditDays`: Days since oldest audit
- `shouldAlert`: Boolean flag for dashboard alert

---

## Overview

This document outlines the design for a comprehensive inventory auditing system that allows batch auditing of multiple inventory items at once. The system is accessible via "Audit Logs" in the Settings menu.

---

## Current State

### Existing Audit Functionality

- Single-item audit via Inventory page → Audit button
- Modal for entering bulk + partial counts
- Variance calculation and recording
- Audit history stored in `inventory_audits` table

### Limitations

- Only one item can be audited at a time
- No batch/multi-item audit workflow
- No audit session management (grouping related audits)
- No bulk audit from settings menu

---

## Proposed System Architecture

### 1. Audit Sessions

An audit session groups multiple item audits together:

```
inventory_audit_sessions
├── id (UUID)
├── name (string) - e.g., "Morning Audit - Bar 1"
├── status (enum) - draft | in_progress | completed | cancelled
├── started_at (timestamp)
├── completed_at (timestamp)
├── started_by_user_id (UUID)
├── completed_by_user_id (UUID)
├── notes (text)
└── shift_id (UUID, optional)
```

### 2. Audit Session Items

```
inventory_audit_session_items
├── id (UUID)
├── session_id (FK)
├── item_id (FK to inventory_items)
├── reported_bulk (number)
├── reported_partial (number)
├── reported_total (calculated)
├── expected_total (from current stock)
├── variance (calculated)
├── variance_percent (calculated)
├── audit_reason (string)
├── notes (text)
└── created_at (timestamp)
```

---

## UI/UX Design

### Settings Menu Addition

```
Settings
├── General
├── Staff Management
├── Inventory Settings
├── Tax Rates
├── Audit Logs (NEW)
│   ├── View Past Sessions
│   └── Start New Audit (opens batch audit)
├── Backup & Export
└── System Info
```

### Batch Audit Flow

#### Step 1: Start New Audit

- User clicks "Start New Audit" in Settings → Audit Logs
- User enters session name (e.g., "Morning Audit - 4/11")
- Optional: Link to current shift
- User selects which items to audit:
  - All items
  - By type (spirits, mixers, beer, etc.)
  - By location (future: bar, back stock)
  - Custom selection

#### Step 2: Audit Entry Screen

- Table displays all selected items
- Columns: Item Name | Expected (current) | Full Bottles | Partial | Notes
- User enters counts for each item
- Running variance total shown at bottom
- Items can be marked as "skipped" or "not counted"

#### Step 3: Review & Submit

- Summary screen shows:
  - Total items audited
  - Items with significant variance (>5%)
  - Items with critical variance (>20%)
- User can adjust individual items or cancel
- Submit records all audits and updates inventory

---

## Key Features

### 1. Variance Highlighting

- Green: Within tolerance (±2%)
- Yellow: Minor variance (±2-5%)
- Orange: Moderate variance (±5-15%)
- Red: Critical variance (>15%)

### 2. Quick Filters

- Show all items
- Show items with variance only
- Show items with critical variance
- Show pending items (not yet counted)

### 3. Scanning Integration (Future)

- Barcode scanner support for item lookup
- Weight scale integration for partial bottles

### 4. Audit Templates

- Save commonly used item sets as templates
- Quick-start audit from template

---

## Database Schema Additions

### New Tables

```sql
-- Audit Sessions (groups multiple audits)
CREATE TABLE inventory_audit_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  started_at INTEGER,
  completed_at INTEGER,
  started_by_user_id TEXT,
  completed_by_user_id TEXT,
  notes TEXT,
  shift_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (started_by_user_id) REFERENCES users(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- Session Items (individual item audits within session)
CREATE TABLE inventory_audit_session_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  reported_bulk REAL DEFAULT 0,
  reported_partial REAL DEFAULT 0,
  reported_total REAL,
  expected_total REAL,
  variance REAL,
  variance_percent REAL,
  audit_reason TEXT,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (session_id) REFERENCES inventory_audit_sessions(id),
  FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);
```

---

## API Endpoints

### Sessions

- `GET /api/inventory-audit-sessions` - List all sessions
- `POST /api/inventory-audit-sessions` - Create new session
- `GET /api/inventory-audit-sessions/:id` - Get session details
- `PATCH /api/inventory-audit-sessions/:id` - Update session (add items)
- `POST /api/inventory-audit-sessions/:id/complete` - Submit and finalize
- `DELETE /api/inventory-audit-sessions/:id` - Cancel session

### Session Items

- `GET /api/inventory-audit-sessions/:id/items` - Get items in session
- `POST /api/inventory-audit-sessions/:id/items` - Add item to session
- `PATCH /api/inventory-audit-sessions/:id/items/:itemId` - Update count
- `DELETE /api/inventory-audit-sessions/:id/items/:itemId` - Remove item

---

## Implementation Phases

### Phase 1: Basic Batch Audit (Priority: High)

1. Add audit session table and schema
2. Create "Start New Audit" flow in Settings
3. Multi-item audit entry screen
4. Submit updates all inventory counts
5. View past audit sessions

### Phase 2: Enhanced Features (Priority: Medium)

1. Variance highlighting with color coding
2. Quick filters (variance, pending, etc.)
3. Audit templates
4. Session notes and reasons

### Phase 3: Advanced Features (Priority: Low)

1. Barcode scanner integration
2. Weight scale integration
3. Audit scheduling/reminders
4. Comparative analysis across sessions

---

## Testing Protocol

### Test Cases

| ID   | Test            | Steps                             | Expected Result                                |
| ---- | --------------- | --------------------------------- | ---------------------------------------------- |
| BA-1 | Create session  | Click Start New Audit, enter name | Session created, status=draft                  |
| BA-2 | Add items       | Select items to audit             | Items appear in audit table                    |
| BA-3 | Enter counts    | Enter bulk/partial for items      | Running variance updates                       |
| BA-4 | Submit audit    | Click Submit                      | Inventory updated, session completed           |
| BA-5 | View history    | Open Audit Logs                   | Past sessions listed                           |
| BA-6 | Session details | Click past session                | Shows all items and counts                     |
| BA-7 | Cancel session  | Click Cancel                      | Session marked cancelled, no inventory changes |

### Edge Cases

| Scenario                      | Expected Behavior                                   |
| ----------------------------- | --------------------------------------------------- |
| Network error mid-submit      | Transaction rollback, session remains draft         |
| User closes browser mid-audit | Session saved as draft, can resume                  |
| Inventory deleted mid-audit   | Item marked as "unavailable", audit continues       |
| Negative variance (overage)   | Allowed, shows positive variance in different color |

---

## Related Documentation

- `docs/TEST_PROTOCOL.md` - Updated with audit system test cases
- `docs/CALCULATIONS.md` - Variance calculation formulas
- `ARCHITECTURE.md` - Database schema overview
