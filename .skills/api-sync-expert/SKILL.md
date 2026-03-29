---
name: api-sync-expert
description: Synchronize OpenAPI specifications with the React client and Zod schemas using Orval. Use when openapi.yaml is modified or when there are type mismatches between frontend and backend.
---

# api-sync-expert

Specialized guidance for keeping the GustoPOS API specification and generated clients in sync.

## Core Configuration
- **Specification**: `lib/api-spec/openapi.yaml`
- **Orval Config**: `lib/api-spec/orval.config.ts`
- **Output Targets**:
  - React Client: `lib/api-client-react/src/generated/api.ts`
  - Zod Schemas: `lib/api-zod/src/generated/api.ts`

## Workflows

### 1. Regenerating Clients
Run this command whenever `openapi.yaml` is updated:
```bash
pnpm --filter @workspace/api-spec run codegen
```

### 2. Updating the API
1. Modify `lib/api-spec/openapi.yaml` to define new endpoints or schemas.
2. Run the codegen command above.
3. Update `artifacts/api-server/src/routes/` to implement the new backend logic.
4. Update `artifacts/gusto-pos/src/hooks/use-pos-mutations.ts` if custom wrappers are needed.

## Best Practices
- **Single File Mode**: Ensure `zod` output mode is set to `single` in `orval.config.ts` to prevent naming collisions.
- **Custom Fetch**: All generated hooks use `lib/api-client-react/src/custom-fetch.ts`. Ensure `credentials: "include"` remains set for session persistence.
- **Parameter Structure**: Pay attention to mutation parameters. Orval usually generates `{ id, data }` for PATCH/POST requests with path parameters.

## Troubleshooting
- **Type Collisions**: If `api-zod` has export errors, check `lib/api-zod/src/index.ts` and ensure it only exports from the single generated file.
- **Mutation Errors**: If `mutate` calls fail in the frontend, verify if the data needs to be wrapped in a `{ data: ... }` object according to the generated hook signature.
