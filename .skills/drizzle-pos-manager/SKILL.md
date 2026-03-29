---
name: drizzle-pos-manager
description: Manage Drizzle ORM migrations, seeding, and schema validation for GustoPOS. Use when schema changes occur in lib/db or when manual database operations like seeding are required.
---

# drizzle-pos-manager

Specialized guidance for managing the database layer of GustoPOS using Drizzle ORM.

## Schema Location
- The source of truth for the database schema is in `lib/db/src/schema/`.
- `auth.ts`: Authentication and session tables.
- `gusto.ts`: POS business logic (ingredients, drinks, tabs, shifts, etc.).

## Common Workflows

### 1. Pushing Schema Changes (Development)
For rapid development, use `db push` to sync the database with the schema.
```bash
pnpm --filter @workspace/db run push
```
If changes are destructive, use:
```bash
pnpm --filter @workspace/db run push-force
```

### 2. Seeding Admin Data
To ensure an admin account exists, run the seed script. Requires `DATABASE_URL` to be set.
```bash
# From workspace root
./scripts/seed-admin.sh
```
Or via the API (if enabled):
`POST /api/admin/seed`

### 3. Adding New Tables
1. Define the table in `lib/db/src/schema/gusto.ts`.
2. Export the new table and its types.
3. Run `db push`.
4. Update `lib/api-spec/openapi.yaml` if the table is exposed via the API.

## Validation Checklist
- Ensure `sql` is used for complex defaults or atomic updates.
- Verify `onDelete: "cascade"` is applied to relevant foreign keys (e.g., orders on tabs).
- Check that `updatedAt` uses `$onUpdate(() => new Date())`.
