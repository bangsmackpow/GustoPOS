# Next Agent Prompt: GustoPOS Phase 3 Cleanup

## Context

A cleanup session was completed on branch `cleanup/refactor-2026`. Phase 1 and Phase 2 are done. Phase 3 was deferred.

## What's Been Done

### Phase 1: Lint Cleanup ✅

- Fixed 31 unused imports/variables
- Lint warnings reduced from 37 to 5 (87% reduction)
- All lint warnings are acceptable placeholders

### Phase 2: Architecture Cleanup ✅

- Deprecated `ingredientsTable` → `_ingredientsTable` in favor of `inventoryItemsTable`
- Removed debug route `dev-login.ts`
- Updated `AGENTS.md` with package structure and inventory guidance
- Fixed scripts typecheck issue

### Quality Gates ✅

- Typecheck: Passes
- Lint: 5 warnings (acceptable)

### Documentation ✅

- `CLEANUP_SESSION.md` - Complete session details
- `AGENTS.md` - Updated architecture docs

---

## Remaining Work (Phase 3)

### 1. Group UI Components

- **Location:** `artifacts/gusto-pos/src/components/ui/`
- **Issue:** 60+ components in flat directory
- **Suggested:** Create subdirectories (forms/, layout/, data-display/, etc.)
- **Risk:** Medium - requires updating imports

### 2. Group API Routes

- **Location:** `artifacts/api-server/src/routes/`
- **Issue:** All routes in flat directory
- **Suggested:** Create subdirectories (inventory/, tabs/, auth/, admin/)
- **Risk:** Medium - requires updating route imports

### 3. Review Untracked Files

```
lib/db/migrations/0004_recipe_ingredients_fk.sql  - pending migration
scripts/GustoPOS_Data_Management_Workflow.xlsx     - may want to remove
scripts/create-data-workflow-spreadsheet.mjs       - may want to remove
```

### 4. Remaining Lint Warnings (5)

These are intentionally reserved placeholders - do NOT fix:

- `pendingImport`, `refetchUsers`, `isAdmin` in Settings.tsx (future features)
- `type` parameter in Settings.tsx (handler argument)
- `forceCheckbox` in smoke.spec.ts (test placeholder)

---

## Commands

```bash
# Verify clean state
pnpm run typecheck   # Should pass
pnpm run lint        # Should show 5 warnings

# Switch to branch
git checkout cleanup/refactor-2026
```

---

## Recommendations

1. **Create PR** from `cleanup/refactor-2026` to `main` (or `lukesasshole` depending on workflow)
2. **Review Phase 3** - Only do if time permits and imports are carefully updated
3. **Decision on untracked files** - Commit or remove before merging

---

## Branch Status

```
cleanup/refactor-2026  - 8 commits ahead of main
```

Ready for PR creation and handoff.
