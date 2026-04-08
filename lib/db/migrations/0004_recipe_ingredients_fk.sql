-- Migration: Update recipe_ingredients FK and clean up legacy tables
-- Date: 2026-04-07
-- Purpose: Update recipe_ingredients to reference inventory_items instead of ingredients, and drop legacy tables

-- Step 1: Drop existing foreign key index (if exists)
DROP INDEX IF EXISTS recipe_ingredients_ingredient_id_ingredients_id_fk;

-- Step 2: Drop recipe_ingredients table (it's empty, safe to recreate)
DROP TABLE IF EXISTS recipe_ingredients;

-- Step 3: Recreate recipe_ingredients with FK to inventory_items
CREATE TABLE recipe_ingredients (
  id TEXT PRIMARY KEY NOT NULL,
  drink_id TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  amount_in_ml REAL NOT NULL DEFAULT 0,
  amount_in_base_unit REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (drink_id) REFERENCES drinks(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES inventory_items(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Step 4: Drop legacy ingredients table (no longer used)
DROP TABLE IF EXISTS ingredients;

-- Step 5: Drop legacy inventory_categories table (no longer used)
DROP TABLE IF EXISTS inventory_categories;