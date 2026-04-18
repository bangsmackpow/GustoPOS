# Issue Tracking - April 14, 2026

---

## 🎉 PROGRESS UPDATE (April 14, 2026 - BUILD MODE)

### PHASE 0: CRITICAL FIXES - ✅ COMPLETED (1 hour)

**6 Issues Fixed**:

- ✅ Issue #7 - Menu item names now display (drink.name added to h4 tag)
- ✅ Issue #5 - Tab timestamps fixed ("56 years ago" bug resolved)
- ✅ Issue #35 - DiscountModal state properly resets after save
- ✅ Issue #36 - Calendar.tsx fetch errors now caught and displayed
- ✅ Issue #37 - Settings.tsx errors now show toast notifications
- ✅ Issue #30 - Ingredient dropdown verified stable

**Verification**: Typecheck ✅ | Lint ✅ | No new errors

**Next**: Proceeding to Phase 1 (Translations & Text Fixes)

---

## 📋 IMPLEMENTATION PLAN (Revised - April 14, 2026)

### Executive Summary

- **Total Issues**: 41 (34 original + 7 new from code review)
- **Organized into**: 5 phases + pre-work
- **Recommended Start**: Phase 0 (Critical Fixes)
- **Total Estimated Work**: ~40-50 hours
- **Risk Level**: LOW (phased approach, pre-work critical fixes first)

---

## 🎯 EXECUTION ROADMAP

### **PHASE 0: CRITICAL FIXES (Pre-Work)** ⚠️

**Status**: ✅ COMPLETED  
**Duration**: 1 hour  
**Risk**: VERY LOW  
**Goal**: Fix critical bugs before they compound

| #        | Issue                          | File(s)                   | Fix                             | Complexity |
| -------- | ------------------------------ | ------------------------- | ------------------------------- | ---------- | ----------- |
| 7        | Empty h4 drink name            | `TabDetail.tsx:816-820`   | Add `{drink.name}`              | 1 min      | ✅ DONE     |
| 5        | Timestamp "56 years ago"       | `Tabs.tsx:271-274`        | Multiply by 1000                | 1 min      | ✅ DONE     |
| 35 (NEW) | DiscountModal state leak       | `TabDetail.tsx:1202-1205` | Add `setDiscountingOrder(null)` | 2 min      | ✅ DONE     |
| 36 (NEW) | Missing .catch() handlers      | `Calendar.tsx:269-281`    | Add error handling              | 15 min     | ✅ DONE     |
| 37 (NEW) | Settings error toast           | `Settings.tsx:255-262`    | Add toast notification          | 15 min     | ✅ DONE     |
| 30       | Ingredient dropdown (resolved) | N/A                       | Verify stability                | 10 min     | ✅ VERIFIED |

**Verification**:

- ✅ All changes compile (typecheck passed)
- ✅ No new console errors (lint clean)
- ✅ Timestamp displays correctly
- ✅ Error handlers in place for API failures
- ✅ Modal state properly resets

**→ PHASE 0 COMPLETE - PROCEEDING TO PHASE 1**

---

### **PHASE 1: UI TEXT & TRANSLATIONS**

**Status**: NOT STARTED  
**Duration**: 4-5 hours  
**Risk**: LOW  
**Goal**: Fix all hardcoded text and ensure multilingual support

| #        | Issue                        | File(s)                                            | Fix                                   | Complexity |
| -------- | ---------------------------- | -------------------------------------------------- | ------------------------------------- | ---------- |
| 2        | Login translations           | `Login.tsx` + `utils.ts`                           | Add translation keys + hooks          | Medium     |
| 4        | Tabs "Sort by" translation   | `Tabs.tsx:187-204`                                 | Use `getTranslation()`                | Easy       |
| 1        | Language toggle visibility   | `Login.tsx`, `PinPad.tsx`                          | Add text label to button              | Easy       |
| 38 (NEW) | Hardcoded text (12+ strings) | `TabDetail.tsx`, `PinPad.tsx`, `DiscountModal.tsx` | Wrap with `getTranslation()`          | Medium     |
| 39 (NEW) | Remove console.log/error     | 5 files (13 instances)                             | Delete or replace with proper logging | Easy       |

**User Comment**: "Check app to make sure all displayed text has translation."

**Action**: This is a critical requirement. Phase 1 will audit ALL UI text to ensure 100% translation coverage. Will use grep to find any remaining hardcoded strings and ensure complete i18n compliance.

**Verification**:

- Switch language → all UI text changes
- No console warnings about missing translations
- No console.log/error in DevTools
- ✅ AUDIT: All visible text wrapped with `getTranslation()` or translation keys

---

### **PHASE 2: UI/LAYOUT FIXES**

**Status**: NOT STARTED  
**Duration**: 5-6 hours  
**Risk**: LOW  
**Goal**: Fix visual display issues

| #        | Issue                    | File(s)                  | Fix                                            | Complexity |
| -------- | ------------------------ | ------------------------ | ---------------------------------------------- | ---------- |
| 3        | Dashboard 2x2 grid       | `Dashboard.tsx`          | Reorganize grid, merge low stock, add collapse | High       |
| 15       | Inventory item names     | `Inventory.tsx` table    | Ensure names display, not just bottle sizes    | Medium     |
| 19       | Remove "+ Xml" suffix    | `Inventory.tsx:996-1000` | Remove bottle size marker from display         | Easy       |
| 32       | Remove audit button      | `Inventory.tsx`          | Delete button and related handlers             | Easy       |
| 40 (NEW) | Replace confirm() dialog | `Inventory.tsx:601-603`  | Create styled modal instead                    | Medium     |
| 41 (NEW) | Unused variables         | `TabDetail.tsx`          | Remove 2 unused variables                      | 1 min      |

**Verification**:

- Dashboard displays as 2x2 grid
- All inventory items show names clearly
- No browser confirm() dialogs
- Inventory deletion uses styled modal

---

### **PHASE 3: DATA FLOW FIXES**

**Status**: NOT STARTED  
**Duration**: 6-8 hours  
**Risk**: MEDIUM (requires testing)  
**Goal**: Fix how data moves through the system

| #   | Issue                       | File(s)                 | Fix                                         | Complexity    | Dependencies                   |
| --- | --------------------------- | ----------------------- | ------------------------------------------- | ------------- | ------------------------------ |
| 6   | Tab order +/- buttons       | `TabDetail.tsx:373-431` | Add quantity controls to order items        | Medium        | None                           |
| 18  | Stock not saved in Add Item | `Inventory.tsx`         | Connect form fields to save                 | High          | None - BUT #21 depends on this |
| 21  | Price=0 when Show on Menu   | `inventory.ts:173`      | Require price before enabling menu          | Medium        | #18 first                      |
| 29  | Serving size unit display   | `Inventory.tsx`         | Fix ml vs oz label                          | Easy          | None                           |
| 33  | Staff always active         | `Settings.tsx`          | Fix active/inactive toggle logic            | Medium        | None                           |
| 31  | Batch audit fails           | Backend audit logic     | Investigate error, fix session creation     | High          | Investigate first              |
| 26  | Sales analytics behavior    | `analytics.ts`          | Document: only CLOSED tabs count in reports | Documentation | None                           |

**User Comment**: "Audit the data flow. Since Sales and inventory tracking is the priority of this app, the data flow is paramount."

**Action**: Phase 3 will include a comprehensive data flow audit before any fixes are made. This is CRITICAL since sales/inventory tracking is the core function. Will trace:

- Tab creation → order addition → inventory reservation → tab closure → analytics reporting
- Inventory item creation → menu drink linking → pricing → sales tracking
- Stock flow: Add Item → Add Inventory → Audit → Sales → Close Tab

**Critical Path**:

1. Fix #18 first (stock save)
2. Then #21 (price requirement)
3. Other fixes can be parallel

**Verification**:

- Add item → stock saves correctly
- Show on Menu requires price (not 0)
- Staff toggle works
- Batch audit session creates successfully
- +/- buttons work on orders

---

### **PHASE 4: MAJOR FEATURES**

**Status**: NOT STARTED  
**Duration**: 10-12 hours  
**Risk**: MEDIUM-HIGH (new features)  
**Goal**: Implement new functionality

| #   | Issue                        | Implementation                                       | Complexity | Dependencies                       |
| --- | ---------------------------- | ---------------------------------------------------- | ---------- | ---------------------------------- |
| 25  | Staff clock-in indicator     | Add top section with clocked staff + sales tracking  | High       | Need `/api/staff-shifts` query     |
| 27  | Cashbox verification         | Modal on shift start + default in System Defaults    | High       | None                               |
| 28  | Calendar → Events & Specials | Move Rushes/Promos/Specials from Settings to new tab | High       | Requires careful Settings cleanup  |
| 34  | Seed cocktails               | Add 20 standard bar drinks to SQL seed file          | Medium     | Do LAST - after menu features work |

**Critical**:

- #28 requires REMOVING code from Settings.tsx (test carefully for orphaned code)
- #34 should wait until #2, #4, #38 are done (menu features working)

**Verification**:

- Staff indicator shows on Dashboard
- Cashbox modal appears on shift start
- Events & Specials tab works independently
- Rushes/Promos/Specials removed from Settings
- Seed cocktails appear in database after import

---

### **PHASE 5: CLEANUP & TECHNICAL DEBT**

**Status**: NOT STARTED  
**Duration**: 2-3 hours  
**Risk**: LOW  
**Goal**: Polish and prepare for next iteration

| #               | Issue              | Type                       | Complexity |
| --------------- | ------------------ | -------------------------- | ---------- |
| 14              | USB backup         | Feature gap (not wired up) | Medium     |
| 9-13, 16-17, 20 | Other feature gaps | Lower priority             | Varies     |

**Can defer to future sprints**

---

## 🚀 WHERE TO BEGIN

### **RECOMMENDED START: Phase 0 - Critical Fixes**

**Why?**

1. Only 2-3 hours of work
2. Fixes prevent bugs in later phases
3. Quick wins build momentum
4. All fixes are isolated (no dependencies)
5. Low risk of breaking anything

**How to start**:

1. Begin with Issue #7 (add drink.name) - 30 seconds
2. Then Issue #5 (timestamp fix) - 1 minute
3. Then Issues #35-37 (error handling) - 30-45 minutes
4. Test each fix immediately
5. Run `pnpm run typecheck` and `pnpm run lint`
6. Move to Phase 1 when Phase 0 is complete

**Expected Outcome**: System is more stable, fewer edge-case bugs

---

## 📊 PHASE SUMMARY TABLE

| Phase        | Duration | Risk        | Focus               | Start After |
| ------------ | -------- | ----------- | ------------------- | ----------- |
| 0 (Pre-Work) | 2-3h     | Very Low    | Critical bugs       | NOW ✅      |
| 1            | 4-5h     | Low         | Translations + text | Phase 0 ✅  |
| 2            | 5-6h     | Low         | UI/Layout           | Phase 1 ✅  |
| 3            | 6-8h     | Medium      | Data flow           | Phase 2 ✅  |
| 4            | 10-12h   | Medium-High | Major features      | Phase 3 ✅  |
| 5            | 2-3h     | Low         | Cleanup             | Phase 4 ✅  |

**Total**: ~30-37 hours of focused development

---

## ⚠️ CRITICAL DECISIONS MADE

Based on your approval of all recommendations:

1. **Issue #26 (Sales Analytics)**:
   - ✅ Document that only CLOSED tabs appear in reports
   - ✅ Add note on Dashboard explaining this

2. **Issue #21 (Price on Menu)**:
   - ✅ REQUIRE price before enabling "Show on Menu"
   - ✅ Prevent price=0 drinks

3. **Issue #28 (Calendar Tab)**:
   - ✅ Keep same database tables, move UI only (less risk)
   - ✅ Remove from Settings after integration complete

4. **Issue #31 (Batch Audit)**:
   - ✅ Investigate WHY batch audit fails first
   - ✅ Then code the fix

5. **Issue #34 (Seed Cocktails)**:
   - ✅ Create SQL seed file with 20 cocktails
   - ✅ Do LAST (after menu features work)

---

## 🔒 STABILITY GUARANTEES

This plan maintains system stability by:

1. **Phase 0 first**: Critical bugs fixed before any new work
2. **Isolated fixes**: Each phase is loosely coupled from others
3. **Testing between phases**: Run tests after each phase
4. **Clear dependencies**: Issues marked with dependencies are sequenced
5. **UI-first, then data**: Changes UI before touching data flow
6. **Documentation**: Issue #26 documents expected behavior
7. **Staged feature rollout**: Major features come last (Phase 4)

---

## 📝 ORIGINAL ISSUES (34)

### High Priority (18 issues)

1. [Issue 1](###-issue-1-login-screen---language-toggle-visibility) - Language toggle visibility
2. [Issue 2](###-issue-2-login-screen---missing-translations) - Login translations
3. [Issue 3](###-issue-3-dashboard---layout-organization) - Dashboard layout
4. [Issue 4](###-issue-4-tabs---translation-issues) - Tabs translation
5. [Issue 5](###-issue-5-tabs---datetime-error) - Timestamp "56 years ago"
6. [Issue 6](###-issue-6-tabdetail---add-quantity-controls) - Tab order +/- buttons
7. [Issue 7](###-issue-7-tabdetail---menu-item-names) - Empty drink names
8. [Issue 15](###-issue-15-inventory-table---item-name-display) - Inventory name display
9. [Issue 18](###-issue-18-inventory-add-item---stock-not-saved) - Stock not saved
10. [Issue 21](###-issue-21-inventory-add-item---price-not-connected) - Price not connected
11. [Issue 25](###-issue-25-dashboard---staff-clock-in-indicator) - Staff indicator
12. [Issue 26](###-issue-26-dashboard--reports---sales-stats-not-updating) - Sales stats
13. [Issue 27](###-issue-27-shift-start---cashbox-verification) - Cashbox verification
14. [Issue 28](###-issue-28-calendar-tab-redesign---events--specials) - Calendar redesign
15. [Issue 29](###-issue-29-menu--add-new-item--edit-item---serving-size) - Serving size unit
16. [Issue 31](###-issue-31-inventory-tab---batch-audit-feature) - Batch audit fails
17. [Issue 33](###-issue-33-staff-management---staff-always-active) - Staff always active
18. [Issue 34](###-issue-34-seed-library---populate-with-20-standard) - Seed cocktails

### Medium Priority (8 issues)

19. [Issue 8](###-issue-8-menu-organization-schema) - Menu organization
20. [Issue 9](###-issue-9-batch-multi-item-auditing) - Batch auditing (partial)
21. [Issue 10](###-issue-10-audit-sessions) - Audit sessions (partial)
22. [Issue 14](###-issue-14-usb-backup) - USB backup
23. [Issue 16](###-issue-16-inventory-table---categorysubtype-order) - Type/subtype order
24. [Issue 17](###-issue-17-inventory-table---column-headers) - Column headers
25. [Issue 20](###-issue-20-inventory---duplicate-audit-button) - Duplicate audit button
26. [Issue 30](###-issue-30-menu--edit-drink---ingredient-dropdown) - Dropdown (resolved)

### Low Priority (8 issues)

27. [Issue 11](###-issue-11-keyboard-shortcuts) - Keyboard shortcuts
28. [Issue 12](###-issue-12-recurring-rush-events) - Recurring events
29. [Issue 13](###-issue-13-staff-break-tracking) - Break tracking
30. [Issue 19](###-issue-19-row-stock-display-x--xml) - Stock display format
31. [Issue 22](###-issue-22-menu--edit-drink---ingredient-search) - Ingredient search
32. [Issue 23](###-issue-23-menu--edit-drink---wrong-default-serving) - Serving size default
33. [Issue 24](###-issue-24-menu--edit-drink---save-button) - Save button issues
34. [Issue 32](###-issue-32-inventory-tab---remove-individual-audit) - Remove audit button

---

## 📋 NEW ISSUES (7 - from code review)

35. **DiscountModal State Leak** - `TabDetail.tsx:1202-1205` - Reset `discountingOrder` on close
36. **Missing .catch() in Calendar** - `Calendar.tsx:269-281` - Add error handlers
37. **Settings Error Toast** - `Settings.tsx:255-262` - Notify user on fetch fail
38. **Hardcoded Text in Components** - Multiple files - Wrap with `getTranslation()`
39. **console.log/error in Production** - 5 files (13 instances) - Remove debug code
40. **Browser confirm() Dialog** - `Inventory.tsx:601-603` - Replace with styled modal
41. **Unused Variables** - `TabDetail.tsx` - Remove dead code

---

---

## High Priority Issues (User-Reported)

### Issue 1: Login Screen - Language Toggle Visibility

**Priority**: High  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- Globe icon in corner does not communicate language toggle clearly enough
- Users may not realize they can switch languages

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 2: Login Screen - Missing Translations

**Priority**: High  
**Status**: Open  
**Category**: i18n

**Problem**:

- Nothing gets translated when language is switched
- All text on screen must be connected to bilingual function

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 3: Dashboard - Layout Organization

**Priority**: High  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- Current layout: free-flowing, not organized into 2x2 grid
- Two panes for low stock are redundant
- Need collapsible/expandable panes
- Max 5 items when collapsed (both active tabs and low stock)

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 4: Tabs - Translation Issues

**Priority**: High  
**Status**: Open  
**Category**: i18n

**Problem**:

- "Sort By" and dropdown menu do not translate to Spanish
- Only part of text on tab button translates

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 5: Tabs - Date/Timestamp Error

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- When opening a new tab, it shows "opened 56 years ago"
- System calendar/clock not accurate

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 6: TabDetail - Add Quantity Controls

**Priority**: High  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- Items added to tab should have +/- buttons to add additional drinks
- Need quantity selector on existing orders

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 7: TabDetail - Menu Item Names

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- Menu item names not displayed on their buttons
- Need clear drink name labels

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 15: Inventory Table - Item Name Display

**Priority**: High  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- Item name does not display on inventory table rows
- Only shows small bottle size marker (to mark variation)
- Item name should always be priority and visible

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 18: Inventory Add Item - Stock Not Saved

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- After entering full bottles and partial bottle weight in Add Item, Stock shows "0 full" with alert
- Clicking Edit Item shows no inventory stored
- Break in field connection - needs to properly save and display
- Also shows 0 servings

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 25: Dashboard - Staff Clock In Indicator & Sales Tracking

**Priority**: High  
**Status**: Open  
**Category**: Feature

**Problem**:

- Add indicator at top of Dashboard showing who is clocked in and when they clocked in
- Track their sales by name
- This feature should span both columns to maintain 2x2 layout under it

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 26: Dashboard & Reports - Sales Stats Not Updating

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- Dashboard sales reports and Reports tab sales reports do not seem to be connected to actual sales
- After simulating sales, the value of all stats remains 0
- Sales data not flowing through to analytics/reporting

**Reported**: April 14, 2026  
**Reporter**: User

**Research Notes**:

- Dashboard calculates `totalSales` from open tabs: `tabs?.reduce((sum, tab) => sum + Number(tab.totalMxn), 0)` - this shows current open tab totals, not historical sales
- Reports page calls `/api/analytics/sales` endpoint which queries only CLOSED tabs with closedAt timestamp
- Analytics query (`analytics.ts:47-64`) filters: `eq(tabsTable.status, "closed")` AND date range on `closedAt`
- Root cause: Analytics only counts CLOSED tabs, not open tabs. Need to close tabs for them to appear in reports.
- Also need to verify date range filter is working correctly

---

### Issue 27: Shift Start - Cashbox Verification Required

**Priority**: High  
**Status**: Open  
**Category**: Feature

**Problem**:

- When clocking onto a shift, employee needs to verify the amount of money in the cashbox before they can confirm any sales
- They will return the cashbox to a set predetermined amount
- This amount should be able to be set in Settings > System Defaults
- Include an entry field for a note in case employee needs to leave a different amount in the cashbox
- Make sure this note is included in whatever report this information appears in

**Reported**: April 14, 2026  
**Reporter**: User

**Implementation Notes**:

- Add "defaultCashboxAmount" to System Defaults in settings
- Create cashbox verification modal on shift start
- Track starting cashbox amount and note in staff_shifts or shifts table
- Include in shift close report / end-of-night report

---

### Issue 28: Calendar Tab Redesign - Events & Specials

**Priority**: High  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- Calendar tab is new and isn't quite right
- Settings tab has rushes, promos, and specials tabs that function well
- Wish these three panes were housed in what's being called the Calendar tab
- This tab should be "Events and Specials"
- Should include a calendar, but current nested layout is clunky
- Need to reorganize and consolidate Rushes, Promos, and Specials into this tab

**Reported**: April 14, 2026  
**Reporter**: User

**Notes**:

- Rename/reorganize Calendar tab to "Events & Specials"
- Move Rushes, Promos, Specials from Settings to this new tab
- Improve calendar layout - make it less clunky/nested
- Keep existing functionality but improve UX
- **IMPORTANT**: Once integrated into new tab, REMOVE these sections from Settings

---

### Issue 29: Menu > Add New Item / Edit Item - Serving Size Unit Display

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- The ingredient serving size field displays in ml but says oz
- Should use the servingSize field for this display

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 30: Menu > Edit Drink - Ingredient Dropdown (RESOLVED)

**Priority**: Medium  
**Status**: Resolved  
**Category**: Bug

**Problem**:

- Select ingredient dropdown had a glitch and is now working
- Still need to verify stability but may not need the fix previously thought

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 31: Inventory Tab - Batch Audit Feature Not Working

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- Batch audit feature has never worked
- Generates error: "Fails to begin an audit session"

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 32: Inventory Tab - Remove Individual Audit Button

**Priority**: Medium  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- Individual audit button is pointless
- Remove it from the page and architecture

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 33: Staff Management - Staff Always Active

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- No matter what options are selected, staff are always active
- Need to fix the active/inactive toggle logic

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 34: Seed Library - Populate with 20 Standard Bar Cocktails

**Priority**: High  
**Status**: Open  
**Category**: Feature

**Problem**:

- After fixing the menu features, repopulate Seed Library with 20 standard bar cocktails
- Drinks must match app's architecture and SQL
- Include ingredients and amounts

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 8: Menu Organization Schema

**Priority**: Medium  
**Status**: Research  
**Category**: Architecture

**Problem**:

- With many menu items, current setup is overwhelming
- Need research for better schema to organize menu buttons and information

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 9: Batch/Multi-Item Auditing

**Priority**: Medium  
**Status**: Not Implemented  
**Category**: Feature Gap

**Problem**:

- Cannot audit multiple inventory items at once
- Need to create audit sessions to group related audits
- Currently can only audit one item at a time

**Reported**: April 14, 2026  
**Reporter**: System Analysis

---

### Issue 10: Audit Sessions

**Priority**: Medium  
**Status**: Partial  
**Category**: Feature Gap

**Problem**:

- API exists for audit sessions but limited frontend
- Cannot group multiple audits into a session
- Need ability to start/complete audit sessions with multiple items

**Reported**: April 14, 2026  
**Reporter**: System Analysis

---

### Issue 14: USB Backup

**Priority**: Medium  
**Status**: Not Implemented  
**Category**: Feature Gap

**Problem**:

- Setting exists in Settings but not wired up
- Cannot backup database to mounted USB drive
- Need to implement USB drive detection and file copy functionality

**Reported**: April 14, 2026  
**Reporter**: User

---

## Lower Priority / Feature Gaps

### Issue 11: Keyboard Shortcuts

**Priority**: Low  
**Status**: Partial  
**Category**: Feature Gap

**Problem**:

- Only Ctrl+K for search is implemented
- Missing other useful shortcuts: navigate sections, quick actions, etc.

**Reported**: April 14, 2026  
**Reporter**: System Analysis

---

### Issue 12: Recurring Rush Events

**Priority**: Low  
**Status**: Partial  
**Category**: Feature Gap

**Problem**:

- Database fields exist (repeat_event, repeat_interval, etc.)
- Recurrence logic not implemented
- Cannot create weekly/monthly repeating events

**Reported**: April 14, 2026  
**Reporter**: System Analysis

---

### Issue 13: Staff Break Tracking

**Priority**: Low  
**Status**: Partial  
**Category**: Feature Gap

**Problem**:

- Database fields exist (break_start, break_end, break_minutes)
- Not fully wired in UI
- Cannot properly track staff breaks during shift

**Reported**: April 14, 2026  
**Reporter**: System Analysis

---

### Issue 16: Inventory Table - Category/Subtype Order

**Priority**: Medium  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- Currently shows type over subtype
- Should show subtype over type - subtype is more important for employees
- Bottle size shown after name is redundant if also shown below name

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 17: Inventory Table - Column Headers & Removal

**Priority**: Medium  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- Change "Stock" column header to "Back Stock"
- Remove "avg. $" column (unnecessary)
- Remove "weight" column (unnecessary)

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 19: Row Stock Display "X + Xml"

**Priority**: Medium  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- When clicking Add Inventory in row, it updates but shows odd text
- Displays "sealedContainers + bottleSizeMl" (e.g., "3 + 750ml")
- Should only display sealedContainers count (matches "Back Stock" header)

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 20: Inventory - Duplicate Audit Button

**Priority**: Low  
**Status**: Open  
**Category**: UI/UX

**Problem**:

- Audit link exists in Edit Item menu
- Audit button also appears in inventory table row (duplicate)
- Remove button from row, keep in Edit menu

**Reported**: April 14, 2026  
**Reporter**: User

---

### Issue 21: Inventory Add Item - Price Not Connected to Tab

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- When adding a drink created via "Add Item" (Settings > Add Inventory > Add Item) to a tab, the price does not come through
- When adding a drink created via "Add Inventory" modal (Inventory page > row button), price comes through correctly
- Need to trace why price field is missing or not connected for items created through the Add Item flow

**Reported**: April 14, 2026  
**Reporter**: User

**Research Notes**:

- "Add Item" creates new inventory item in Settings
- "Add Inventory" modal adds to existing item's stock
- Need to compare the two creation flows to find missing price field
- **Root Cause Found**: When enabling "Show on Menu" without setting "Single Serving Price", drink is created with actualPrice: 0

---

### Issue 22: Menu > Edit Drink - Ingredient Search Empty

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- When adding an ingredient in Menu > Edit Drink, the "select ingredient" dropdown shows no results
- Cannot search or find any inventory items to add as recipe ingredients

**Research Notes**:

- UI requires selecting Type first, then Subtype, before ingredient dropdown enables
- Filter logic (`Drinks.tsx:748-758`): `getIngredientsFiltered(typeFilter, subtype)` filters by exact type AND subtype match
- If inventory items don't have subtype field set, no matches will appear
- Likely cause: Inventory items have type (e.g., "spirit") but no subtype (e.g., "tequila"), so filter returns empty

---

### Issue 23: Menu > Edit Drink - Wrong Default Serving Size

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- When adding an ingredient, it defaults to 1.33 fluid ounces
- System default is 1.5 fl oz
- Specific inventory item may have 2 fl oz serving size
- Not pulling the correct serving size from inventory item

**Research Notes**:

- Code at `Drinks.tsx:798` sets: `newRecipe[idx].amountInBaseUnit = ing.servingSize || 1.5`
- This correctly tries to pull from ingredient's servingSize field
- If ingredients have servingSize=0 or not set, it falls back to 1.5
- 1.33 might come from: inventory item servingSize stored in different unit (ml?), or default from somewhere else

---

### Issue 24: Menu > Edit Drink - Save Button Not Working

**Priority**: High  
**Status**: Open  
**Category**: Bug

**Problem**:

- Save button in Edit Drink modal does not work
- Changes are not persisted

**Research Notes**:

- `handleSave` function (`Drinks.tsx:705-735`) validates name, price, recipe
- Calls `onSave(editing)` which triggers `saveDrink.mutate()` at line 632
- PATCH endpoint at `drinks.ts:140-149` validates recipe required (unless sourceType is inventory_single)
- Possible issue: If saving a drink with sourceType = "inventory_single", recipe validation may fail differently
- Or: The save completes but there's no success feedback to user

---

## Resolved Issues

None yet.

---

## Skipped Features (Require Email/Internet)

These features require network/internet and are out of scope for offline POS:

| Feature                | Reason                         |
| ---------------------- | ------------------------------ |
| Email Notifications    | Requires SMTP server           |
| Inventory Alert Emails | Requires SMTP server           |
| Litestream Cloud Sync  | Requires S3-compatible storage |

---

## Related Documentation

- [USER_GUIDE.md](../USER_GUIDE.md) - User guide
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Technical architecture
- [AGENTS.md](../AGENTS.md) - Agent workflow
- [FEATURE_INVENTORY.md](./FEATURE_INVENTORY.md) - Feature inventory reference

---

## Research Findings (April 14, 2026)

### Issue 1: Login Language Toggle Visibility

- **Location**: `Login.tsx:125-132`, `PinPad.tsx:151-158`
- **Finding**: Currently just a globe icon with subtle styling, no text label
- **Fix**: Add visible text label or make button more prominent

### Issue 2: Login Missing Translations

- **Location**: `Login.tsx:138-188,201-248`
- **Finding**: Hardcoded text throughout: "Username", "Password", "Login", "Forgot Password?", etc.
- **Fix**: Add translations to `utils.ts` and replace with `getTranslation()` calls

### Issue 3: Dashboard Layout

- **Location**: `Dashboard.tsx`
- **Finding**: Free-flowing layout, not 2x2 grid. Low stock shows in both stats card AND separate pane (redundant)
- **Fix**: Reorganize into 2x2 grid, merge low stock into single section, add collapsible behavior

### Issue 4: Tabs Translation Issues

- **Location**: `Tabs.tsx:187-204`
- **Finding**: Hardcoded: "Sort by:", "Opened Time", "Name", "Total"
- **Fix**: Add translation keys and use getTranslation()

### Issue 5: Date/Timestamp Error "56 years ago"

- **Location**: `Tabs.tsx:271-274` - uses `formatDistanceToNow(new Date(tab.openedAt))`
- **Finding**: Likely the `openedAt` timestamp stored in DB is incorrect (wrong format or epoch)
- **Fix**: Need to trace how timestamps are created in API/backend

### Issue 6: Quantity Controls on Tab Orders

- **Location**: `TabDetail.tsx:373-431` (order items), lines 836-862 (menu card - WRONG LOCATION)
- **Finding**: +/- buttons exist on menu drink card (wrong location), NEEDED on tab order items for quick reordering
- **Fix**: Move +/- controls to order items in the tab, remove from menu card

### Issue 7: Menu Item Names Empty (BUG)

- **Location**: `TabDetail.tsx:816-820`
- **Finding**: **BUG FOUND** - The `<h4>` tag is EMPTY - no drink.name is rendered!
  ```tsx
  <h4 className="font-bold...">{/* EMPTY - drink.name not added! */}</h4>
  ```
- **Fix**: Add `{drink.name}` between the tags (30 second fix)

### Issue 15: Inventory Table Item Name Display

- **Location**: `Inventory.tsx` table rendering
- **Finding**: Need to verify if name is being displayed or if bottle size marker is shown instead

### Issue 18: Add Item Stock Not Saved

- **Location**: Inventory "Add Item" creation flow vs "Add Inventory" modal
- **Finding**: The Add Inventory modal (lines 1945-1988) correctly saves currentBulk, currentPartial, currentStock. Issue is likely in the initial "Add Item" creation form not having stock fields connected

### Issue 19: Row Stock Display "X + Xml"

- **Location**: `Inventory.tsx:996-1000` - shows bottle size marker for each variation
- **Finding**: Display is `{item.name}` + `{getContainerDisplay(v)}` which shows "3 + 750ml" pattern
- **Fix**: Remove the bottle size suffix from row display

### Issue 21: Add Item Price Not Connected

- **Location**: Need to trace Settings > Add Item flow vs Add Inventory modal flow
- **Finding**: "Add Item" creates inventory but price may not be set for drink creation. "Add Inventory" flow works correctly
- **Next Step**: Compare the two creation flows in Settings.tsx to find missing price field

### Issue 5 (UPDATED): Date/Timestamp Root Cause

- **Root Cause Found**: Tab `openedAt` stored as Unix timestamp (seconds), but JavaScript `new Date()` expects milliseconds
- **Example**: Timestamp `1704067200` (Jan 2024) becomes `new Date(1704067200)` = "1970-01-20" - that's where "56 years ago" comes from
- **Fix**: Multiply timestamp by 1000 when converting: `new Date(tab.openedAt * 1000)` or use backend to store in ISO format

### Additional Research Notes

**Issue 6 - Menu Card vs Tab Order Quantity Controls**:

- Current: +/- buttons on menu drink cards (lines 836-862 in TabDetail.tsx) - appears on hover
- Needed: +/- buttons directly on order items in the tab's order list for quick reordering
- The order items (lines 373-431) currently have edit/delete buttons but no +/- for quick quantity adjustments

**Issue 7 - Empty Drink Name Root Cause**:

- TabDetail.tsx line 816-820: `<h4>` tag exists but has no content between tags
- Simple fix: Add `{drink.name}` as child content

**Inventory Table Structure**:

- Main items show in main table (line 779)
- Variations show as expandable rows (lines 983-1030)
- Each variation shows bottle size marker next to name (line 998) - causing "X + Xml" display issue

**Drinks Creation Flow**:

- When inventory item is added, it does NOT automatically create a drink
- Drinks page creates drinks separately with actualPrice field
- "Add Inventory" modal updates stock on existing items, but doesn't affect drink pricing
- The price connection is through the Drinks page, not directly from inventory

**Issue 5 Root Cause (Confirmed)**:

- tabsTable schema (gusto.ts:99-101): `openedAt` uses `unixepoch()` - stores as Unix timestamp in SECONDS
- Tab creation (tabs.ts:279-290): Does NOT explicitly set openedAt, relies on default
- Frontend display (Tabs.tsx:271-274): Uses `formatDistanceToNow(new Date(tab.openedAt))`
- JavaScript `new Date(unix_timestamp)` expects MILLISECONDS, not seconds
- Example: 1704067200 (Jan 1, 2024) becomes "1970-01-20" = "56 years ago" when not multiplied by 1000

**Fix Options**:

1. Frontend: Change to `new Date(tab.openedAt * 1000)`
2. Backend: Store timestamp in milliseconds or ISO string format

---

## Research Complete - Ready for Implementation

**Summary**: 41 issues identified (34 original + 7 new from code review)

**Immediate Fixes (Fast Wins)**:

- Issue 7: Add drink.name to empty h4 tag (30 sec)
- Issue 5: Multiply timestamp by 1000 in formatDistanceToNow call

**Next Steps**:

1. Start with Phase 0 (Critical Fixes) - fast wins to build momentum
2. Address translations (Phase 1 - issues 1, 2, 4, 38)
3. Fix UI/layout issues (Phase 2 - issues 3, 6, 15-20)
4. Investigate complex bugs (Phase 3 - issues 5, 18, 21-24)
5. Implement major features (Phase 4 - issues 25-28, 34)
