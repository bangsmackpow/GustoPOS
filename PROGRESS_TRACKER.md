# GustoPOS Improvement Progress Tracker

**Date:** April 6, 2026

---

## Summary

This document tracks the progress of critical improvements and workflow upgrades to the GustoPOS system, including security, inventory, workflow, and data integrity enhancements.

---

## Completed Improvements

### Security

- [x] Enforced bcrypt PINs for all users/admin (no plaintext PINs)
- [x] PIN regex validation and all-same digit prevention
- [x] PIN migration and admin seeding updated
- [x] Admin password hashed with bcrypt on initialization

### Workflow & Data Integrity

- [x] Order quantity update enabled (backend + frontend)
- [x] Shift close validation improved (backend + frontend)
- [x] Automatic inventory deduction on order creation
- [x] Ingredient availability checks block orders if insufficient
- [x] Order update/cancellation logic prevents negative inventory
- [x] Ingredient name shown in frontend error if stock is insufficient
- [x] CSV import: blank field detection, user confirmation, and incomplete item marking

### User Experience

- [x] Clear error feedback for shift close, order, and inventory actions
- [x] Modern UI for all new dialogs and modals

---

## In Progress / Next Steps

### PHASE 1: Critical Fixes

- [x] 1.1 PIN hashing (bcrypt, regex, migration)
- [x] 1.2 Rate limiting (API endpoints, brute force prevention)
- [x] 1.3 Order quantity modification (PATCH endpoint, frontend)
- [x] 1.4 CSV validation (blank fields, user confirmation)
- [x] 1.5 Confirmation dialogs (critical actions)
- [x] 1.6 Shift close validation (open tabs check)
- [x] All items in QA report verified

### PHASE 2: Core Features

- [x] 2.1 Gratuity/tips (add tip field to tabs, UI, reporting)
- [x] 2.2 Audit logging (event_logs table, inventory/price/staff/settings changes, frontend audit log view)
- [x] 2.3 Special notes/requests (notes field on orders, edit modal, API, kitchen view)
- [x] 2.4 Discount codes (promo_codes table, apply to tab, validation, frontend input)
- [x] 2.5 Margin display (COGS, margin %, drinks table)

### PHASE 3: UX Improvements

- [x] 3.1 Tabs: Search & Sort (search input, filter, sort)
- [x] 3.2 Menu: Search Drinks (search/filter drinks, show count)
- [x] 3.3 Drinks: Clone Function (clone button, edit copy)
- [ ] 3.4 Settings: Exchange Rate Validation (rate > 0, error, disable save)
- [ ] 3.5 Settings: Test Email (send test, show result)

### PHASE 4: Testing & Launch

- [ ] 4.1 Internal QA Testing (checklist, cross-browser, mobile, performance)
- [ ] 4.2 User Acceptance Testing (beta testers, feedback, bug log)
- [ ] 4.3 Documentation (user/admin/API guides, troubleshooting, video)
- [ ] 4.4 Deployment Preparation (backup, monitoring, analytics, status, support email)

---

## Summary Checklist

### Before Any Beta User Testing:

- [x] 1.1 PIN hashing
- [x] 1.2 Rate limiting
- [x] 1.3 Order quantity modification
- [x] 1.4 CSV validation
- [x] 1.5 Confirmation dialogs
- [x] 1.6 Shift close validation
- [x] All items in QA report verified

### For Beta Launch:

- [x] 2.1 Gratuity/tips
- [x] 2.2 Audit logging
- [ ] 2.3 Special notes
- [ ] 2.4 Discount codes (optional)
- [x] 2.5 Margin display
- [ ] 3.x UX improvements (mix of must/nice-to-have)
- [ ] Full QA testing complete
- [ ] Documentation ready

---

## Backend Bug Fixes (April 6, 2026)

### Critical Fixes (Would Crash at Runtime)

- [x] Malformed `lib/db/src/index.ts` — Extracted `migrateAllPinsToBcrypt()` from inside object literal
- [x] Admin password stored plaintext — Now hashed with bcrypt in `upsertAdmin()`
- [x] Missing `customHeaders` import in `tax-rates.ts`
- [x] Missing `customHeaders` import in `staff-shifts.ts`

### High Priority Fixes (Would Cause Runtime Bugs)

- [x] `logEvent` called with wrong signature in `promo-codes.ts` — Removed transaction arg, changed `changes` to `newValue`
- [x] `logEvent` called with `changes` instead of `oldValue`/`newValue` in `inventory-audits.ts`
- [x] `shift.endedAt` should be `shift.closedAt` in `staff-shifts.ts` and `staff-performance.ts`
- [x] `requireRole` missing role types — Added `manager`, `head_bartender`, `server` to type union

### Medium Priority Fixes

- [x] Dead `ingredient.maxStock` check removed from `tabs.ts` order deletion handler
- [x] `pinVerifyRouter` no-op mount removed from `routes/index.ts`

### Typecheck Fixes (All Zero Errors)

- [x] `tax-rates.ts` — Fixed `req.params.category` type casting, added missing `return` statements
- [x] `staff-shifts.ts` — Fixed `req.params` type casting, added missing `return` statements
- [x] `staff-performance.ts` — Fixed `req.params` type casting, added missing `return` statements
- [x] `inventory-audits.ts` — Fixed Drizzle query building with `and()`, added missing `return` statements
- [x] `promo-codes.ts` — Fixed `req.params` type casting
- [x] `Dashboard.tsx` — Fixed broken import statement, fixed `closeShift.mutate` call signature
- [x] `use-pos-mutations.ts` — Fixed duplicate code block, updated `useCloseShiftMutation` to accept `force` parameter
- [x] `use-update-order-mutation.ts` — Changed `patchOrder` to `updateOrder`, added required `tabId` parameter
- [x] `Settings.tsx` — Replaced undefined `DialogActions`, fixed audit filter type casting
- [x] `TabDetail.tsx` — Added required `tabId` parameter to `updateOrder.mutate` call

### Electron/DMG Packaging Fixes

- [x] `main.ts` — Added missing `adminInitialized` variable declaration
- [x] `bcrypt` → `bcryptjs` migration — Replaced native C module with pure JS equivalent in:
  - `lib/db/src/index.ts`
  - `lib/db/package.json`
  - `artifacts/api-server/src/routes/pin-login.ts`
  - Updated `build.mjs` external list
- [x] DMG builds successfully at `artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg`

---

## Notes

All changes are tracked in the codebase and this document is updated after each major improvement.
For a detailed roadmap and remaining tasks, see BETA_TODO_LIST.md.

---

## Codebase Cleanup & QA

### Unused Variables (to remove or refactor)

- showDeleteDataModal, setShowDeleteDataModal
- deletingRush, setDeletingRush
- qc (useQueryClient)
- toast (useToast)
- language
- editingStaff, setEditingStaff
- createUser, updateUser, createRush
- newRush, setNewRush
- showAddRush, setShowAddRush
- refetchRushes
- isSeeding, setIsSeeding
- showSeedModal, setShowSeedModal
- ingredientPreview
- handleResetImport
- InventoryItem type
- Mail (imported icon)
- refetchUsers
- isAdmin

### Missing Handlers/Functions (to implement)

- ~~handleAbortBlankImport~~ — Replaced with inline `setShowBlankFieldModal(false)`
- ~~handleProceedBlankImport~~ — Replaced with inline `setShowBlankFieldModal(false)`

### Linter Warnings (to resolve)

- ~~React Hooks must be called inside a React function component~~ — Fixed
- ~~DialogActions is not defined~~ — Replaced with div + Buttons
- ~~Argument of type 'string' is not assignable~~ — Fixed with type casting
- [ ] Unescaped characters in JSX: `'` and `"` should be escaped as `&apos;` and `&quot;` respectively

---

**Last updated:** April 6, 2026

---

## Notes

- All changes are tracked in the codebase and this document is updated after each major improvement.
- For a detailed roadmap and remaining tasks, see BETA_TODO_LIST.md.

---

**Last updated:** April 6, 2026
