# GustoPOS Beta Testing Protocol

**Version**: 2.0  
**Last Updated**: April 12, 2026  
**Test Phase**: Onsite Beta

---

## Table of Contents

1. [Testing Overview](#1-testing-overview)
2. [Pre-Beta Checklist](#2-pre-beta-checklist)
3. [Test Scenarios](#3-test-scenarios)
4. [Test Data Setup](#4-test-data-setup)
5. [Acceptance Criteria](#5-acceptance-criteria)
6. [Bug Reporting](#6-bug-reporting)
7. [Performance Benchmarks](#7-performance-benchmarks)
8. [Beta Deployment Steps](#8-beta-deployment-steps)

---

## 1. Testing Overview

### 1.1 Objectives

The goal of beta testing is to validate GustoPOS in a real bar environment with:

- Live inventory management
- Real customer transactions
- Actual staff workflows
- Offline operation validation

### 1.2 Test Scope

| Feature Area       | Status | Priority      |
| ------------------ | ------ | ------------- |
| PIN Authentication | ✅     | P0 - Critical |
| Tab/Order Flow     | ✅     | P0 - Critical |
| Inventory Tracking | ✅     | P0 - Critical |
| Inventory Audits   | ✅     | P0 - Critical |
| Shift Management   | ✅     | P0 - Critical |
| Reports            | ✅     | P1 - High     |
| Split Payments     | ✅     | P1 - High     |
| Promo Codes        | ✅     | P2 - Medium   |
| Bulk Import        | ✅     | P2 - Medium   |
| Bilingual Support  | ✅     | P2 - Medium   |
| Rush Events        | ✅     | P3 - Low      |

### 1.3 Test Environment

- **Platform**: Desktop (Mac/Windows) or development
- **Database**: Local SQLite
- **User Count**: 2-5 concurrent users recommended
- **Duration**: 1-2 weeks minimum

---

## 2. Pre-Beta Checklist

### 2.1 Infrastructure

- [ ] Application builds without errors
- [ ] Database initializes correctly
- [ ] Admin account created and accessible
- [ ] Backup system functional

### 2.2 Test Data

- [ ] Staff accounts created (minimum 3: 1 admin, 2 employees)
- [ ] Inventory items loaded (minimum 20 items)
- [ ] Drinks with recipes created (minimum 10)
- [ ] Tax rates configured
- [ ] Exchange rates set

### 2.3 Documentation

- [ ] User Guide accessible to staff
- [ ] Admin Guide accessible to manager
- [ ] Quick reference cards printed (optional)

### 2.4 Training

- [ ] Staff trained on basic operations
- [ ] Manager trained on admin functions
- [ ] Troubleshooting procedures documented

---

## 3. Test Scenarios

### 3.1 Authentication (P0)

| ID      | Scenario        | Steps                                | Expected Result                         |
| ------- | --------------- | ------------------------------------ | --------------------------------------- |
| AUTH-01 | Admin login     | Enter admin email + PIN              | Successfully logged in, dashboard shows |
| AUTH-02 | Staff login     | Enter staff email + PIN              | Successfully logged in                  |
| AUTH-03 | Invalid PIN     | Enter wrong PIN 3 times              | "Invalid PIN" message                   |
| AUTH-04 | Auto-lock       | Wait 5 minutes, attempt action       | Lock screen appears                     |
| AUTH-05 | Unlock          | Enter correct PIN                    | Returns to previous state               |
| AUTH-06 | Switch staff    | Click profile, enter new credentials | Staff switched, UI updates              |
| AUTH-07 | Language switch | Click EN/ES toggle                   | All text changes to selected language   |

### 3.2 Shift Management (P0)

| ID       | Scenario                | Steps                         | Expected Result                  |
| -------- | ----------------------- | ----------------------------- | -------------------------------- |
| SHIFT-01 | Start shift             | Click Start Shift             | Shift created, status "active"   |
| SHIFT-02 | Open tab during shift   | Create tab with shift active  | Tab linked to shift              |
| SHIFT-03 | Close shift (no tabs)   | Close shift with no open tabs | Shift closed, report generated   |
| SHIFT-04 | Close shift (with tabs) | Attempt close with open tabs  | Warning shown, requires force    |
| SHIFT-05 | Shift report            | View end-of-night report      | Complete report with all metrics |

### 3.3 Tab & Order Flow (P0)

| ID     | Scenario        | Steps                            | Expected Result                    |
| ------ | --------------- | -------------------------------- | ---------------------------------- |
| TAB-01 | Create tab      | Click + New Tab, enter table #   | Tab created, $0.00                 |
| TAB-02 | Add order       | Add drink to tab                 | Order added, total updated         |
| TAB-03 | Add multiple    | Add 3 different drinks           | All appear in tab                  |
| TAB-04 | Change quantity | Increase quantity to 2           | Total doubles                      |
| TAB-05 | Void order      | Delete order, select reason      | Order marked voided, total updates |
| TAB-06 | Add note        | Add special instruction to order | Note displays on order             |
| TAB-07 | Cash payment    | Close tab with cash              | Tab closed, inventory finalized    |
| TAB-08 | Card payment    | Close tab with card              | Tab closed, inventory finalized    |
| TAB-09 | Split payment   | Split bill cash + card           | Both payments recorded             |
| TAB-10 | Add tip         | Add tip to payment               | Tip recorded separately            |
| TAB-11 | Promo code      | Apply valid promo code           | Discount applied to total          |
| TAB-12 | Delete tab      | Delete open tab                  | Tab deleted, stock returned        |

### 3.4 Inventory (P0)

| ID     | Scenario            | Steps                             | Expected Result                |
| ------ | ------------------- | --------------------------------- | ------------------------------ |
| INV-01 | Add item            | Create new inventory item         | Item saved, appears in list    |
| INV-02 | Edit item           | Modify item fields                | Changes saved                  |
| INV-03 | Delete item         | Soft-delete item                  | Item moved to trash            |
| INV-04 | View stock          | Check stock display               | Shows bulk + partial correctly |
| INV-05 | Pool tracking       | Add spirit with 5 bottles + 375ml | Shows "5 full + 375ml"         |
| INV-06 | Collection tracking | Add beer with 2 cases + 6 units   | Shows "2 full + 6 units"       |
| INV-07 | Low stock alert     | Set threshold, drop below         | Alert shows on dashboard       |
| INV-08 | Show on menu        | Enable isOnMenu                   | Drink automatically created    |
| INV-09 | Single serving      | Enable sellSingleServing          | Shot variant created           |

### 3.5 Inventory Audit (P0)

| ID       | Scenario             | Steps                     | Expected Result                     |
| -------- | -------------------- | ------------------------- | ----------------------------------- |
| AUDIT-01 | Record audit         | Enter bulk + partial      | Audit recorded, variance calculated |
| AUDIT-02 | Variance calculation | Audit with count ≠ system | Variance and % calculated           |
| AUDIT-03 | Audit history        | View past audits          | All audits listed with dates        |
| AUDIT-04 | Variance page        | View variance analysis    | Shows trends and recommendations    |

### 3.6 Reports (P1)

| ID     | Scenario       | Steps                    | Expected Result            |
| ------ | -------------- | ------------------------ | -------------------------- |
| RPT-01 | Shift report   | Close shift, view report | Complete sales breakdown   |
| RPT-02 | Sales by drink | View report              | Drinks sorted by revenue   |
| RPT-03 | Sales by staff | View report              | Staff performance metrics  |
| RPT-04 | Inventory used | View report              | Ingredient usage per shift |

### 3.7 Menu/Drinks (P1)

| ID     | Scenario       | Steps                 | Expected Result              |
| ------ | -------------- | --------------------- | ---------------------------- |
| DRK-01 | Create drink   | Add drink with recipe | Drink saved with ingredients |
| DRK-02 | Edit drink     | Modify price/recipe   | Changes saved                |
| DRK-03 | Delete drink   | Remove drink          | Drink no longer on menu      |
| DRK-04 | Clone drink    | Clone existing drink  | New drink created with copy  |
| DRK-05 | Enable/disable | Toggle availability   | Drink shows/hides from menu  |

### 3.8 Settings & Admin (P1)

| ID     | Scenario             | Steps                    | Expected Result             |
| ------ | -------------------- | ------------------------ | --------------------------- |
| SET-01 | Add staff            | Create new staff account | Account created, PIN works  |
| SET-02 | Edit staff           | Modify staff details     | Changes saved               |
| SET-03 | Deactivate staff     | Set staff inactive       | Cannot log in               |
| SET-04 | Change exchange rate | Update USD rate          | New rate used in tabs       |
| SET-05 | Change defaults      | Modify system defaults   | Applied to new items        |
| SET-06 | Bulk import          | Import CSV inventory     | Items created/updated       |
| SET-07 | Configure backup     | Enable auto-backup       | Backups created on schedule |

### 3.9 Edge Cases (P2)

| ID     | Scenario          | Steps                          | Expected Result          |
| ------ | ----------------- | ------------------------------ | ------------------------ |
| EDG-01 | Zero stock order  | Order when stock at 0          | Warning or prevention    |
| EDG-02 | Negative quantity | Try to set quantity -1         | Prevented                |
| EDG-03 | Empty tab close   | Close tab with no orders       | Allowed, $0 total        |
| EDG-04 | Expired promo     | Apply expired code             | Error message shown      |
| EDG-05 | Concurrent tabs   | Multiple tabs, same ingredient | Stock reserved correctly |

---

## 4. Test Data Setup

### 4.1 Staff Accounts

```javascript
const staffAccounts = [
  { email: "admin@gusto.local", pin: "1234", role: "admin", name: "Manager" },
  {
    email: "bartender1@gusto.local",
    pin: "5678",
    role: "employee",
    name: "Bartender 1",
  },
  {
    email: "bartender2@gusto.local",
    pin: "9012",
    role: "employee",
    name: "Bartender 2",
  },
];
```

### 4.2 Inventory Items

```javascript
const inventoryItems = [
  // Spirits (Pool mode)
  {
    name: "Don Julio Tequila",
    type: "spirit",
    baseUnitAmount: 750,
    orderCost: 450,
    currentBulk: 5,
  },
  {
    name: "Grey Goose Vodka",
    type: "spirit",
    baseUnitAmount: 750,
    orderCost: 380,
    currentBulk: 3,
  },
  {
    name: "Jack Daniels",
    type: "spirit",
    baseUnitAmount: 750,
    orderCost: 320,
    currentBulk: 4,
  },

  // Beer (Collection mode)
  {
    name: "Corona Extra",
    type: "beer",
    baseUnitAmount: 355,
    orderCost: 120,
    currentBulk: 2,
    unitsPerCase: 24,
  },
  {
    name: "Pacifico",
    type: "beer",
    baseUnitAmount: 355,
    orderCost: 100,
    currentBulk: 3,
    unitsPerCase: 24,
  },

  // Mixers
  {
    name: "Triple Sec",
    type: "mixer",
    baseUnitAmount: 750,
    orderCost: 150,
    currentBulk: 2,
  },
  {
    name: "Lime Juice",
    type: "mixer",
    baseUnitAmount: 1000,
    orderCost: 80,
    currentBulk: 1,
  },
];
```

### 4.3 Drinks with Recipes

```javascript
const drinks = [
  {
    name: "Margarita",
    price: 120,
    ingredients: [
      { name: "Don Julio Tequila", amount: 44.36 }, // 1.5oz
      { name: "Triple Sec", amount: 22.18 }, // 0.75oz
      { name: "Lime Juice", amount: 29.57 }, // 1oz
    ],
  },
  {
    name: "Tequila Shot",
    price: 80,
    isSingleServing: true,
    ingredients: [{ name: "Don Julio Tequila", amount: 44.36 }],
  },
];
```

### 4.4 Promo Codes

```javascript
const promoCodes = [
  { code: "WELCOME10", type: "percentage", value: 10, maxUses: 100 },
  { code: "FIFTY50", type: "fixed", value: 50, maxUses: 20 },
];
```

---

## 5. Acceptance Criteria

### 5.1 Critical Success Criteria

| Criterion          | Measurement                   |
| ------------------ | ----------------------------- |
| All P0 tests pass  | 100% pass rate                |
| No data loss       | Zero lost transactions        |
| Accurate inventory | Stock matches physical count  |
| Reliable backups   | Backups complete successfully |

### 5.2 Performance Criteria

| Operation       | Target  | Maximum |
| --------------- | ------- | ------- |
| App launch      | < 3s    | 10s     |
| Login           | < 500ms | 2s      |
| Add order       | < 200ms | 1s      |
| Close tab       | < 500ms | 2s      |
| Generate report | < 2s    | 5s      |

### 5.3 Visual Checkpoints

- [ ] Dashboard loads with all widgets
- [ ] Sidebar navigation works
- [ ] Tables render correctly
- [ ] Forms validate properly
- [ ] Modals display correctly
- [ ] Error messages show appropriately
- [ ] Language toggle updates all text
- [ ] Responsive layout works on different screens

---

## 6. Bug Reporting

### 6.1 Bug Report Template

```markdown
## Bug Report

**Date**: YYYY-MM-DD HH:MM
**Tester**: [Name]
**Feature**: [Area]

**Description**:
[Clear description of the issue]

**Steps to Reproduce**:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots/Logs**:
[Attach if relevant]

**Severity**:

- [ ] Critical - System unusable
- [ ] Major - Feature broken
- [ ] Minor - Issue exists but workable
- [ ] Cosmetic - UI issue only

**Priority**:

- [ ] P0 - Must fix before beta
- [ ] P1 - Should fix before beta
- [ ] P2 - Fix if time allows
- [ ] P3 - Future enhancement
```

### 6.2 Severity Definitions

| Severity | Definition                                |
| -------- | ----------------------------------------- |
| Critical | System crashes, data loss, security issue |
| Major    | Core feature completely broken            |
| Minor    | Feature works but has issues              |
| Cosmetic | UI/UX problem, doesn't affect function    |

---

## 7. Performance Benchmarks

### 7.1 Target Metrics

| Metric         | Target  | Acceptable |
| -------------- | ------- | ---------- |
| Page load      | < 1s    | < 3s       |
| API response   | < 200ms | < 500ms    |
| Database query | < 100ms | < 300ms    |
| Memory usage   | < 200MB | < 500MB    |
| Startup time   | < 5s    | < 15s      |

### 7.2 Load Testing

Simulate peak usage:

- 5 concurrent staff members
- 10 open tabs
- 50 orders per minute
- Report generation

---

## 8. Beta Deployment Steps

### 8.1 Pre-Deployment

1. **Final code review**
   - Run `pnpm run lint`
   - Run `pnpm run typecheck`
   - Verify all tests pass

2. **Build release**

   ```bash
   pnpm run build
   pnpm run build:desktop
   ```

3. **Prepare deployment package**
   - Executable file
   - Documentation
   - Test data template

### 8.2 Installation

1. **On-site computer**
   - Install GustoPOS desktop app
   - Or setup development environment

2. **Initial configuration**
   - Set ADMIN_PASSWORD
   - Start application
   - Complete first-time setup

3. **Data loading**
   - Import inventory (if pre-loaded)
   - Create staff accounts
   - Configure settings

### 8.3 Go-Live

1. **Morning of beta**
   - Start application
   - Verify all systems operational
   - Brief staff on procedures

2. **During beta**
   - Monitor system performance
   - Address issues as they arise
   - Document observations

3. **End of each day**
   - Review end-of-night report
   - Verify backup completed
   - Note any issues for next day

### 8.4 Beta Wrap-Up

1. **Collect feedback**
   - Staff survey
   - Issue logs
   - Performance metrics

2. **Evaluate**
   - Review bug reports
   - Assess feature completeness
   - Identify improvements

3. **Plan next release**
   - Prioritize fixes
   - Plan new features
   - Update roadmap

---

## Appendix A: Quick Test Commands

### Start Application

```bash
# Development
pnpm run dev

# Production (API only)
ADMIN_PASSWORD=yourpass node artifacts/api-server/dist/index.cjs
```

### Access Points

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:5173            |
| API      | http://localhost:3000            |
| Health   | http://localhost:3000/api/health |

### Common Queries

```sql
-- Check open tabs
SELECT * FROM tabs WHERE status = 'open';

-- Check active shift
SELECT * FROM shifts WHERE status = 'active';

-- Check low stock items
SELECT name, currentStock, lowStockThreshold
FROM inventory_items
WHERE currentStock <= lowStockThreshold;

-- Check voided orders today
SELECT * FROM orders
WHERE voided = 1
AND voidedAt > strftime('%s', 'now', '-1 day');
```

---

## Appendix B: Emergency Contacts

| Role           | Contact | Phone    |
| -------------- | ------- | -------- |
| Lead Developer | [Name]  | [Number] |
| On-site Lead   | [Name]  | [Number] |
| Backup Contact | [Name]  | [Number] |

---

**End of Beta Testing Protocol**
