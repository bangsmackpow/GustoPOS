-- Popular Puerto Vallarta Alcohols and Mixers
INSERT INTO ingredients (id, name, name_es, category, unit, unit_size, cost_per_unit, current_stock, minimum_stock)
VALUES 
  ('tequila-casamigos-blanco', 'Casamigos Blanco Tequila', 'Tequila Casamigos Blanco', 'spirits', 'ml', '750', '950.00', '1500', '750'),
  ('tequila-don-julio-70', 'Don Julio 70 Tequila', 'Tequila Don Julio 70', 'spirits', 'ml', '700', '1200.00', '1400', '700'),
  ('tequila-herradura-reposado', 'Herradura Reposado Tequila', 'Tequila Herradura Reposado', 'spirits', 'ml', '700', '850.00', '1400', '700'),
  ('raicilla-divisadero', 'Raicilla Hacienda El Divisadero', 'Raicilla Hacienda El Divisadero', 'spirits', 'ml', '750', '800.00', '750', '375'),
  ('mezcal-400-conejos', '400 Conejos Mezcal', 'Mezcal 400 Conejos', 'spirits', 'ml', '750', '650.00', '1500', '750'),
  ('vodka-smirnoff', 'Smirnoff Vodka', 'Vodka Smirnoff', 'spirits', 'ml', '750', '300.00', '2250', '750'),
  ('gin-tanqueray', 'Tanqueray Gin', 'Ginebra Tanqueray', 'spirits', 'ml', '750', '550.00', '1500', '750'),
  ('rum-bacardi-blanco', 'Bacardi White Rum', 'Ron Bacardi Blanco', 'spirits', 'ml', '750', '280.00', '2250', '750'),
  ('liqueur-triple-sec', 'Triple Sec', 'Triple Sec', 'spirits', 'ml', '750', '250.00', '1500', '750'),
  ('liqueur-kahlua', 'Kahlua Coffee Liqueur', 'Licor de Café Kahlúa', 'spirits', 'ml', '750', '350.00', '750', '375'),
  ('liqueur-damiana', 'Damiana Liqueur', 'Licor de Damiana', 'spirits', 'ml', '750', '450.00', '750', '375'),
  ('beer-pacifico', 'Pacifico Clara', 'Cerveza Pacífico Clara', 'beers', 'unit', '1', '22.00', '48', '24'),
  ('beer-corona', 'Corona Extra', 'Cerveza Corona Extra', 'beers', 'unit', '1', '20.00', '48', '24'),
  ('beer-modelo-esp', 'Modelo Especial', 'Cerveza Modelo Especial', 'beers', 'unit', '1', '24.00', '48', '24'),
  ('beer-victoria', 'Victoria', 'Cerveza Victoria', 'beers', 'unit', '1', '20.00', '48', '24'),
  ('mixer-squirt', 'Squirt Grapefruit Soda', 'Refresco Squirt', 'mixers', 'ml', '2000', '28.00', '10000', '4000'),
  ('mixer-coke', 'Coca-Cola', 'Coca-Cola', 'mixers', 'ml', '2000', '32.00', '10000', '4000'),
  ('mixer-orange-juice', 'Orange Juice', 'Jugo de Naranja', 'mixers', 'ml', '1000', '25.00', '5000', '2000'),
  ('mixer-lime-juice', 'Fresh Lime Juice', 'Jugo de Limón Fresco', 'mixers', 'ml', '1000', '40.00', '5000', '2000'),
  ('mixer-agave-syrup', 'Agave Syrup', 'Jarabe de Agave', 'mixers', 'ml', '750', '120.00', '1500', '750'),
  ('mixer-clamato', 'Clamato', 'Clamato', 'mixers', 'ml', '946', '45.00', '3784', '1892'),
  ('mixer-ginger-beer', 'Ginger Beer', 'Cerveza de Jengibre', 'mixers', 'ml', '355', '35.00', '4260', '2130'),
  ('mixer-tonic', 'Tonic Water', 'Agua Quina', 'mixers', 'ml', '355', '18.00', '4260', '2130')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  cost_per_unit = EXCLUDED.cost_per_unit;

-- Drink Menu (Some Favorites)
INSERT INTO drinks (id, name, name_es, description, description_es, category, markup_factor, actual_price)
VALUES 
  ('drink-margarita-classic', 'Classic Margarita', 'Margarita Clásica', 'The quintessential Mexican cocktail with tequila, lime and triple sec.', 'El cóctel mexicano por excelencia con tequila, limón y triple sec.', 'tequila', '3.0', '140.00'),
  ('drink-paloma', 'Paloma', 'Paloma', 'Refreshing mix of tequila, lime and grapefruit soda.', 'Refrescante mezcla de tequila, limón y refresco de toronja.', 'tequila', '3.0', '130.00'),
  ('drink-raicilla-sour', 'Raicilla Sour', 'Raicilla Sour', 'Local Puerto Vallarta specialty. Smoky and citrusy.', 'Especialidad local de Puerto Vallarta. Ahumado y cítrico.', 'house_specialty', '3.5', '160.00'),
  ('drink-michelada-esp', 'Michelada Especial', 'Michelada Especial', 'Beer with lime, sauces, and spices.', 'Cerveza con limón, salsas y especias.', 'beers', '2.5', '85.00'),
  ('drink-mexican-mule', 'Mexican Mule', 'Mexican Mule', 'Tequila, ginger beer and lime.', 'Tequila, cerveza de jengibre y limón.', 'tequila', '3.0', '150.00'),
  ('drink-charro-negro', 'Charro Negro', 'Charro Negro', 'Tequila and Coke with a squeeze of lime.', 'Tequila y Coca-Cola con un toque de limón.', 'tequila', '3.0', '120.00'),
  ('drink-cantarito', 'Cantarito', 'Cantarito', 'Tequila, citrus juices and grapefruit soda.', 'Tequila, jugos cítricos y refresco de toronja.', 'house_specialty', '3.0', '180.00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  actual_price = EXCLUDED.actual_price;

-- Recipes
INSERT INTO recipe_ingredients (drink_id, ingredient_id, amount_in_ml)
VALUES
  -- Margarita
  ('drink-margarita-classic', 'tequila-herradura-reposado', '60'),
  ('drink-margarita-classic', 'liqueur-triple-sec', '30'),
  ('drink-margarita-classic', 'mixer-lime-juice', '30'),
  ('drink-margarita-classic', 'mixer-agave-syrup', '15'),
  -- Paloma
  ('drink-paloma', 'tequila-herradura-reposado', '60'),
  ('drink-paloma', 'mixer-lime-juice', '15'),
  ('drink-paloma', 'mixer-squirt', '120'),
  -- Raicilla Sour
  ('drink-raicilla-sour', 'raicilla-divisadero', '60'),
  ('drink-raicilla-sour', 'mixer-lime-juice', '30'),
  ('drink-raicilla-sour', 'mixer-agave-syrup', '20'),
  -- Mexican Mule
  ('drink-mexican-mule', 'tequila-casamigos-blanco', '60'),
  ('drink-mexican-mule', 'mixer-lime-juice', '15'),
  ('drink-mexican-mule', 'mixer-ginger-beer', '150'),
  -- Cantarito
  ('drink-cantarito', 'tequila-casamigos-blanco', '60'),
  ('drink-cantarito', 'mixer-orange-juice', '30'),
  ('drink-cantarito', 'mixer-lime-juice', '15'),
  ('drink-cantarito', 'mixer-squirt', '150')
ON CONFLICT (drink_id, ingredient_id) DO NOTHING;
