-- ==========================================
-- SIMPLE DRINK SEEDS
-- Basic drinks for testing
-- ==========================================

INSERT INTO drinks (id, name, name_es, category, markup_factor, actual_price, is_available)
VALUES 
  ('drink-margarita', 'Margarita', 'Margarita', 'cocktail', 3.0, 140.00, 1),
  ('drink-paloma', 'Paloma', 'Paloma', 'cocktail', 3.0, 130.00, 1),
  ('drink-mojito', 'Mojito', 'Mojito', 'cocktail', 3.0, 135.00, 1),
  ('drink-beer', 'Beer', 'Cerveza', 'beer', 2.5, 50.00, 1),
  ('drink-shot', 'Tequila Shot', 'Caballito', 'shot', 2.5, 80.00, 1),
  ('drink-soft-drink', 'Soft Drink', 'Refresco', 'non_alcoholic', 2.0, 30.00, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  actual_price = EXCLUDED.actual_price;
