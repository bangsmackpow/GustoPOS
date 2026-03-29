-- ==========================================
-- 1. PUERTO VALLARTA INGREDIENTS (Spirits, Beers, Mixers)
-- ==========================================
INSERT INTO ingredients (id, name, name_es, category, unit, unit_size, cost_per_unit, current_stock, minimum_stock)
VALUES 
  -- Tequilas
  ('teq-casamigos-blanco', 'Casamigos Blanco', 'Tequila Casamigos Blanco', 'spirits', 'ml', 750, 950.00, 1500, 750),
  ('teq-don-julio-70', 'Don Julio 70', 'Tequila Don Julio 70', 'spirits', 'ml', 700, 1250.00, 1400, 700),
  ('teq-herradura-repo', 'Herradura Reposado', 'Tequila Herradura Reposado', 'spirits', 'ml', 700, 850.00, 1400, 700),
  ('teq-1800-anejo', '1800 Añejo', 'Tequila 1800 Añejo', 'spirits', 'ml', 750, 900.00, 750, 375),
  ('teq-espolon-blanco', 'Espolòn Blanco', 'Tequila Espolòn Blanco', 'spirits', 'ml', 750, 550.00, 2250, 750),
  ('teq-centenario-repo', 'Gran Centenario Reposado', 'Tequila Centenario Reposado', 'spirits', 'ml', 700, 600.00, 1400, 700),
  ('teq-dj-1942', 'Don Julio 1942', 'Tequila Don Julio 1942', 'spirits', 'ml', 750, 3800.00, 750, 375),
  
  -- Mezcal & Raicilla (Local Specialties)
  ('mez-400-conejos', '400 Conejos Mezcal', 'Mezcal 400 Conejos', 'spirits', 'ml', 750, 650.00, 1500, 750),
  ('mez-montelobos', 'Montelobos Espadín', 'Mezcal Montelobos', 'spirits', 'ml', 750, 850.00, 750, 375),
  ('rai-divisadero', 'Raicilla Hacienda El Divisadero', 'Raicilla El Divisadero', 'spirits', 'ml', 750, 800.00, 750, 375),
  ('rai-venenosa-sierra', 'La Venenosa Raicilla (Sierra)', 'Raicilla La Venenosa Sierra', 'spirits', 'ml', 750, 1100.00, 750, 375),
  
  -- Other Spirits
  ('vod-smirnoff', 'Smirnoff Vodka', 'Vodka Smirnoff', 'spirits', 'ml', 750, 300.00, 2250, 750),
  ('vod-grey-goose', 'Grey Goose Vodka', 'Vodka Grey Goose', 'spirits', 'ml', 750, 950.00, 750, 375),
  ('gin-tanqueray', 'Tanqueray Gin', 'Ginebra Tanqueray', 'spirits', 'ml', 750, 550.00, 1500, 750),
  ('rum-bacardi-blanco', 'Bacardi White Rum', 'Ron Bacardi Blanco', 'spirits', 'ml', 750, 280.00, 2250, 750),
  ('rum-captain-morgan', 'Captain Morgan Spiced', 'Ron Captain Morgan', 'spirits', 'ml', 750, 320.00, 1500, 750),
  ('whi-jack-daniels', 'Jack Daniels', 'Whiskey Jack Daniels', 'spirits', 'ml', 700, 650.00, 1400, 700),
  ('whi-jameson', 'Jameson Irish Whiskey', 'Whiskey Jameson', 'spirits', 'ml', 750, 700.00, 750, 375),
  
  -- Liqueurs
  ('liq-triple-sec', 'Triple Sec', 'Triple Sec', 'spirits', 'ml', 750, 250.00, 1500, 750),
  ('liq-kahlua', 'Kahlua Coffee Liqueur', 'Licor de Café Kahlúa', 'spirits', 'ml', 750, 350.00, 750, 375),
  ('liq-damiana', 'Damiana Liqueur', 'Licor de Damiana', 'spirits', 'ml', 750, 450.00, 750, 375),
  ('liq-ancho-reyes', 'Ancho Reyes Chile Liqueur', 'Licor de Chile Ancho Reyes', 'spirits', 'ml', 750, 650.00, 750, 375),
  ('liq-controy', 'Controy Orange Liqueur', 'Licor de Naranja Controy', 'spirits', 'ml', 1000, 400.00, 1000, 500),

  -- Beers
  ('beer-pacifico', 'Pacifico Clara', 'Cerveza Pacífico Clara', 'beer', 'unit', 1, 22.00, 48, 24),
  ('beer-corona', 'Corona Extra', 'Cerveza Corona Extra', 'beer', 'unit', 1, 20.00, 48, 24),
  ('beer-modelo-esp', 'Modelo Especial', 'Cerveza Modelo Especial', 'beer', 'unit', 1, 24.00, 48, 24),
  ('beer-modelo-negra', 'Negra Modelo', 'Cerveza Negra Modelo', 'beer', 'unit', 1, 26.00, 24, 12),
  ('beer-victoria', 'Victoria', 'Cerveza Victoria', 'beer', 'unit', 1, 20.00, 48, 24),
  
  -- Mixers & Non-Alcoholic
  ('mix-squirt', 'Squirt Grapefruit Soda', 'Refresco Squirt', 'mixer', 'ml', 2000, 28.00, 10000, 4000),
  ('mix-coke', 'Coca-Cola', 'Coca-Cola', 'mixer', 'ml', 2000, 32.00, 10000, 4000),
  ('mix-sprite', 'Sprite', 'Sprite', 'mixer', 'ml', 2000, 30.00, 6000, 2000),
  ('mix-orange-juice', 'Orange Juice', 'Jugo de Naranja', 'mixer', 'ml', 1000, 25.00, 5000, 2000),
  ('mix-lime-juice', 'Fresh Lime Juice', 'Jugo de Limón Fresco', 'mixer', 'ml', 1000, 40.00, 5000, 2000),
  ('mix-agave-syrup', 'Agave Syrup', 'Jarabe de Agave', 'mixer', 'ml', 750, 120.00, 1500, 750),
  ('mix-clamato', 'Clamato', 'Clamato', 'mixer', 'ml', 946, 45.00, 3784, 1892),
  ('mix-ginger-beer', 'Ginger Beer', 'Cerveza de Jengibre', 'mixer', 'ml', 355, 35.00, 4260, 2130),
  ('mix-tonic', 'Tonic Water', 'Agua Quina', 'mixer', 'ml', 355, 18.00, 4260, 2130),
  ('mix-pineapple-juice', 'Pineapple Juice', 'Jugo de Piña', 'mixer', 'ml', 1000, 30.00, 3000, 1000),
  ('mix-jamaica', 'Hibiscus Water', 'Agua de Jamaica', 'mixer', 'ml', 1000, 20.00, 5000, 2000),
  ('mix-tamarindo', 'Tamarind Pulp', 'Pulpa de Tamarindo', 'mixer', 'ml', 1000, 45.00, 2000, 500),
  ('mix-grenadine', 'Grenadine', 'Granadina', 'mixer', 'ml', 750, 80.00, 750, 250),
  ('mix-maggi', 'Maggi Seasoning', 'Jugo Maggi', 'mixer', 'ml', 100, 45.00, 200, 100),
  ('mix-valentina', 'Valentina Hot Sauce', 'Salsa Valentina', 'mixer', 'ml', 370, 25.00, 740, 370)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  cost_per_unit = EXCLUDED.cost_per_unit;

-- ==========================================
-- 2. DRINK MENU (50 Items)
-- ==========================================
INSERT INTO drinks (id, name, name_es, description, description_es, category, markup_factor, actual_price)
VALUES 
  -- Margaritas
  ('drk-marg-classic', 'Classic Margarita', 'Margarita Clásica', 'Tequila, lime, triple sec, agave.', 'Tequila, limón, triple sec, agave.', 'cocktail', 3.0, 140.00),
  ('drk-marg-spicy', 'Spicy Margarita', 'Margarita Picante', 'Tequila, lime, jalapeño, Ancho Reyes.', 'Tequila, limón, jalapeño, Ancho Reyes.', 'cocktail', 3.0, 155.00),
  ('drk-marg-jamaica', 'Hibiscus Margarita', 'Margarita de Jamaica', 'Tequila with fresh hibiscus water.', 'Tequila con agua fresca de jamaica.', 'cocktail', 3.0, 145.00),
  ('drk-marg-tamarind', 'Tamarind Margarita', 'Margarita de Tamarindo', 'Tequila, tamarind pulp, chili rim.', 'Tequila, pulpa de tamarindo, escarchado de chile.', 'cocktail', 3.0, 145.00),
  ('drk-marg-cadillac', 'Cadillac Margarita', 'Margarita Cadillac', 'Premium reposado tequila and Controy.', 'Tequila reposado premium y Controy.', 'cocktail', 3.0, 190.00),
  ('drk-marg-mango', 'Mango Margarita', 'Margarita de Mango', 'Fresh mango and tequila.', 'Mango fresco y tequila.', 'cocktail', 3.0, 145.00),
  
  -- Mexican Classics
  ('drk-paloma', 'Classic Paloma', 'Paloma Clásica', 'Tequila, lime, grapefruit soda.', 'Tequila, limón, refresco de toronja.', 'cocktail', 3.0, 130.00),
  ('drk-cantarito', 'Cantarito PV', 'Cantarito Vallartense', 'Tequila, orange, lime, grapefruit juice, Squirt.', 'Tequila, naranja, limón, jugo de toronja, Squirt.', 'cocktail', 3.0, 180.00),
  ('drk-vampiro', 'Vampiro', 'Vampiro', 'Tequila, sangrita, lime, grapefruit soda.', 'Tequila, sangrita, limón, refresco de toronja.', 'cocktail', 3.0, 140.00),
  ('drk-charro-negro', 'Charro Negro', 'Charro Negro', 'Tequila, coke, lime.', 'Tequila, coca, limón.', 'cocktail', 3.0, 120.00),
  ('drk-mex-mule', 'Mexican Mule', 'Mule Mexicano', 'Tequila, ginger beer, lime.', 'Tequila, cerveza de jengibre, limón.', 'cocktail', 3.0, 150.00),
  ('drk-teq-tonic', 'Tequila & Tonic', 'Tequila con Tonic', 'Tequila blanco and tonic water.', 'Tequila blanco y agua quina.', 'cocktail', 3.0, 125.00),
  
  -- Raicilla Specialties (Local PV)
  ('drk-rai-sour', 'Raicilla Sour', 'Raicilla Sour', 'The spirit of Vallarta with lime and agave.', 'El espíritu de Vallarta con limón y agave.', 'cocktail', 3.5, 165.00),
  ('drk-rai-mule', 'Vallarta Mule', 'Mule de Vallarta', 'Raicilla, ginger beer, mint.', 'Raicilla, cerveza de jengibre, menta.', 'cocktail', 3.5, 175.00),
  ('drk-rai-passion', 'Piel Canela', 'Piel Canela', 'Raicilla, passion fruit, cinnamon.', 'Raicilla, maracuyá, canela.', 'cocktail', 3.5, 180.00),
  ('drk-rai-neat', 'Raicilla Neat (Divisadero)', 'Raicilla Directa', 'Pure local raicilla pour.', 'Raicilla local pura.', 'shot', 3.0, 120.00),
  
  -- Mezcal
  ('drk-mez-negroni', 'Mezcal Negroni', 'Negroni de Mezcal', 'Mezcal, campari, sweet vermouth.', 'Mezcal, campari, vermut dulce.', 'cocktail', 3.5, 185.00),
  ('drk-mez-mule', 'Smoky Mule', 'Mule Ahumado', 'Mezcal, ginger beer, lime.', 'Mezcal, cerveza de jengibre, limón.', 'cocktail', 3.0, 160.00),
  ('drk-mez-shot', 'Mezcal 400 Conejos', 'Mezcal 400 Conejos', 'Shot of artisanal mezcal.', 'Caballito de mezcal artesanal.', 'shot', 3.0, 110.00),
  
  -- Other Cocktails
  ('drk-mojito', 'Classic Mojito', 'Mojito Clásico', 'Rum, mint, lime, sugar, soda.', 'Ron, menta, limón, azúcar, soda.', 'cocktail', 3.0, 135.00),
  ('drk-daiquiri', 'Lime Daiquiri', 'Daiquirí de Limón', 'Rum, lime, simple syrup.', 'Ron, limón, jarabe.', 'cocktail', 3.0, 125.00),
  ('drk-gin-tonic', 'Gin & Tonic (Tanqueray)', 'Gin & Tonic', 'Gin, tonic, cucumber.', 'Ginebra, tonic, pepino.', 'cocktail', 3.0, 140.00),
  ('drk-vod-soda', 'Vodka Soda', 'Vodka con Soda', 'Vodka, sparkling water, lime.', 'Vodka, agua mineral, limón.', 'cocktail', 3.0, 110.00),
  ('drk-screwdriver', 'Screwdriver', 'Desarmador', 'Vodka and fresh orange juice.', 'Vodka y jugo de naranja fresco.', 'cocktail', 3.0, 115.00),
  ('drk-cuba-libre', 'Cuba Libre', 'Cuba Libre', 'Bacardi, coke, lime.', 'Bacardi, coca, limón.', 'cocktail', 3.0, 110.00),
  ('drk-black-russian', 'Black Russian', 'Ruso Negro', 'Vodka and Kahlua.', 'Vodka y Kahlúa.', 'cocktail', 3.0, 130.00),
  ('drk-white-russian', 'White Russian', 'Ruso Blanco', 'Vodka, Kahlua, cream.', 'Vodka, Kahlúa, crema.', 'cocktail', 3.0, 140.00),
  ('drk-old-fashioned', 'Old Fashioned', 'Old Fashioned', 'Whiskey, bitters, orange peel.', 'Whiskey, amargos, cáscara de naranja.', 'cocktail', 3.0, 170.00),
  ('drk-whiskey-sour', 'Whiskey Sour', 'Whiskey Sour', 'Jameson, lime, sugar.', 'Jameson, limón, azúcar.', 'cocktail', 3.0, 155.00),
  
  -- Shots & Specialty
  ('drk-teq-dj70', 'Don Julio 70 (Shot)', 'Don Julio 70', 'Clear añejo tequila shot.', 'Shot de tequila añejo cristalino.', 'shot', 3.0, 180.00),
  ('drk-teq-dj1942', 'Don Julio 1942 (Shot)', 'Don Julio 1942', 'Extra premium tequila shot.', 'Shot de tequila extra premium.', 'shot', 2.0, 450.00),
  ('drk-teq-herra', 'Herradura Repo (Shot)', 'Herradura Repo', 'Reposado tequila shot.', 'Shot de tequila reposado.', 'shot', 3.0, 130.00),
  ('drk-b52', 'B-52 Shot', 'B-52', 'Kahlua, Baileys, Grand Marnier.', 'Kahlúa, Baileys, Grand Marnier.', 'shot', 3.0, 120.00),
  ('drk-baby-mango', 'Baby Mango', 'Baby Mango', 'Vodka, mango, chamoy.', 'Vodka, mango, chamoy.', 'shot', 3.0, 95.00),
  
  -- Beers & Beer Mixes
  ('drk-beer-pacifico', 'Pacifico', 'Pacífico', 'Chilled Pacifico bottle.', 'Cerveza Pacífico bien fría.', 'beer', 2.5, 55.00),
  ('drk-beer-corona', 'Corona', 'Corona', 'Chilled Corona bottle.', 'Cerveza Corona bien fría.', 'beer', 2.5, 50.00),
  ('drk-beer-victoria', 'Victoria', 'Victoria', 'Chilled Victoria bottle.', 'Cerveza Victoria bien fría.', 'beer', 2.5, 50.00),
  ('drk-beer-modelo-esp', 'Modelo Especial', 'Modelo Especial', 'Chilled Modelo bottle.', 'Cerveza Modelo Especial.', 'beer', 2.5, 60.00),
  ('drk-beer-modelo-neg', 'Negra Modelo', 'Negra Modelo', 'Chilled dark Modelo.', 'Cerveza Negra Modelo.', 'beer', 2.5, 65.00),
  ('drk-michelada', 'Michelada (Add-on)', 'Michelada', 'Lime, salt, and mixed sauces.', 'Limón, sal y salsas mixtas.', 'beer', 3.0, 35.00),
  ('drk-chelada', 'Chelada (Add-on)', 'Chelada', 'Lime and salt only.', 'Limón y sal.', 'beer', 3.0, 25.00),
  ('drk-ojorojo', 'Ojo Rojo', 'Ojo Rojo', 'Clamato mix for beer.', 'Mezcla de Clamato para cerveza.', 'beer', 3.0, 45.00),
  
  -- Non-Alcoholic
  ('drk-lemonade', 'Fresh Lemonade', 'Limonada Natural', 'Fresh squeezed lime juice.', 'Limonada de limón recién exprimido.', 'non_alcoholic', 3.0, 45.00),
  ('drk-jamaica-water', 'Hibiscus Water', 'Agua de Jamaica', 'Chilled hibiscus tea water.', 'Agua fresca de jamaica.', 'non_alcoholic', 3.0, 40.00),
  ('drk-horchata', 'Horchata', 'Horchata', 'Traditional rice milk drink.', 'Agua tradicional de arroz.', 'non_alcoholic', 3.0, 45.00),
  ('drk-coke', 'Coca-Cola', 'Coca-Cola', 'Glass bottle Coke.', 'Coca-Cola de botella.', 'non_alcoholic', 2.5, 35.00),
  ('drk-squirt-can', 'Squirt', 'Squirt', 'Grapefruit soda.', 'Refresco de toronja.', 'non_alcoholic', 2.5, 35.00),
  ('drk-sparkling', 'Mineral Water', 'Agua Mineral', 'Topochico or Peñafiel.', 'Agua mineral Topochico o Peñafiel.', 'non_alcoholic', 2.5, 40.00),
  ('drk-coffee', 'Coffee', 'Café', 'Hot black coffee.', 'Café americano caliente.', 'non_alcoholic', 3.0, 35.00),
  ('drk-espresso', 'Espresso', 'Espresso', 'Italian style espresso.', 'Café espresso estilo italiano.', 'non_alcoholic', 3.0, 45.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  actual_price = EXCLUDED.actual_price;

-- ==========================================
-- 3. RECIPES (Sample Logic)
-- ==========================================
INSERT INTO recipe_ingredients (drink_id, ingredient_id, amount_in_ml)
VALUES
  -- Classic Margarita
  ('drk-marg-classic', 'teq-herradura-repo', 60),
  ('drk-marg-classic', 'liq-triple-sec', 30),
  ('drk-marg-classic', 'mix-lime-juice', 30),
  ('drk-marg-classic', 'mix-agave-syrup', 15),
  
  -- Spicy Margarita
  ('drk-marg-spicy', 'teq-espolon-blanco', 60),
  ('drk-marg-spicy', 'liq-ancho-reyes', 15),
  ('drk-marg-spicy', 'mix-lime-juice', 30),
  ('drk-marg-spicy', 'mix-agave-syrup', 15),
  
  -- Paloma
  ('drk-paloma', 'teq-casamigos-blanco', 60),
  ('drk-paloma', 'mix-lime-juice', 15),
  ('drk-paloma', 'mix-squirt', 150),
  
  -- Raicilla Sour
  ('drk-rai-sour', 'rai-divisadero', 60),
  ('drk-rai-sour', 'mix-lime-juice', 30),
  ('drk-rai-sour', 'mix-agave-syrup', 20),
  
  -- Cantarito
  ('drk-cantarito', 'teq-espolon-blanco', 60),
  ('drk-cantarito', 'mix-orange-juice', 45),
  ('drk-cantarito', 'mix-lime-juice', 15),
  ('drk-cantarito', 'mix-squirt', 120),
  
  -- Mexican Mule
  ('drk-mex-mule', 'teq-casamigos-blanco', 60),
  ('drk-mex-mule', 'mix-ginger-beer', 150),
  ('drk-mex-mule', 'mix-lime-juice', 15),
  
  -- Smirnoff Screwdriver
  ('drk-screwdriver', 'vod-smirnoff', 60),
  ('drk-screwdriver', 'mix-orange-juice', 150),
  
  -- Pacifico (Uses 1 bottle)
  ('drk-beer-pacifico', 'beer-pacifico', 1),
  ('drk-beer-modelo-esp', 'beer-modelo-esp', 1)
ON CONFLICT (drink_id, ingredient_id) DO NOTHING;
