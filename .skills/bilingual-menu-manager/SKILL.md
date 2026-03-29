---
name: bilingual-menu-manager
description: Manage English and Spanish localization for GustoPOS. Use when adding new menu items, ingredients, or UI elements to ensure full bilingual support and consistent translation coverage.
---

# bilingual-menu-manager

Specialized guidance for maintaining the multilingual integrity of GustoPOS.

## Translation Locations
- **Database (Drinks/Ingredients)**: Columns `name` (EN) and `name_es` (ES).
- **UI Strings**: `artifacts/gusto-pos/src/lib/utils.ts` in the `translations` object.
- **API Response Helpers**: `formatTab`, `formatOrder`, etc., in API routes.

## Core Rules

### 1. Mandatory Dual Names
Every new `Drink` or `Ingredient` MUST include both a `name` and a `name_es`.
- Avoid auto-translation if possible; use local Mexican bar terminology (e.g., "Refresco de toronja" for Grapefruit Soda).

### 2. UI Translation Keys
Always use the `getTranslation(key, language)` helper in the frontend.
- If a new UI element is added, add the corresponding key to both `en` and `es` sections in `lib/utils.ts`.

### 3. Localization Consistency
Ensure that currency formatting follows Mexican standards when language is set to 'es' (e.g., using proper decimal separators if necessary, though MXN usually follows the same dot notation as USD).

## Validation Checklist
- [ ] Do all new database seed entries have `name_es` populated?
- [ ] Are new UI strings added to both language sets in `utils.ts`?
- [ ] Is the language toggle correctly triggering updates in the Zustand store?
- [ ] Does the `StaffUser` schema correctly enforce the `en` | `es` enum?
