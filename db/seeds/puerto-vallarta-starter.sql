-- ==========================================
-- 1. PUERTO VALLARTA INVENTORY ITEMS (Spirits, Beers, Mixers)
-- ==========================================
INSERT INTO inventory_items (id, name, name_es, type, base_unit, base_unit_amount, serving_size, current_stock, order_cost, low_stock_threshold)
VALUES 
  -- Tequilas
  ('teq-casamigos-blanco', 'Casamigos Blanco', 'Tequila Casamigos Blanco', 'spirit', 'ml', 750, 44.36, 1500, 950.00, 750),
  ('teq-don-julio-70', 'Don Julio 70', 'Tequila Don Julio 70', 'spirit', 'ml', 700, 44.36, 1400, 1250.00, 700),
  ('teq-herradura-repo', 'Herradura Reposado', 'Tequila Herradura Reposado', 'spirit', 'ml', 700, 44.36, 1400, 850.00, 700),
  ('teq-1800-anejo', '1800 Añejo', 'Tequila 1800 Añejo', 'spirit', 'ml', 750, 44.36, 750, 900.00, 375),
  ('teq-espolon-blanco', 'Espolòn Blanco', 'Tequila Espolòn Blanco', 'spirit', 'ml', 750, 44.36, 2250, 550.00, 750),
  ('teq-centenario-repo', 'Gran Centenario Reposado', 'Tequila Centenario Reposado', 'spirit', 'ml', 700, 44.36, 1400, 600.00, 700),
  ('teq-dj-1942', 'Don Julio 1942', 'Tequila Don Julio 1942', 'spirit', 'ml', 750, 44.36, 750, 3800.00, 375),
  
  -- Mezcal & Raicilla (Local Specialties)
  ('mez-400-conejos', '400 Conejos Mezcal', 'Mezcal 400 Conejos', 'spirit', 'ml', 750, 44.36, 1500, 650.00, 750),
  ('mez-montelobos', 'Montelobos Espadín', 'Mezcal Montelobos', 'spirit', 'ml', 750, 44.36, 750, 850.00, 375),
  ('rai-divisadero', 'Raicilla Hacienda El Divisadero', 'Raicilla El Divisadero', 'spirit', 'ml', 750, 44.36, 750, 800.00, 375),
  ('rai-venenosa-sierra', 'La Venenosa Raicilla (Sierra)', 'Raicilla La Venenosa Sierra', 'spirit', 'ml', 750, 44.36, 750, 1100.00, 375),
  
  -- Other Spirits
  ('vod-smirnoff', 'Smirnoff Vodka', 'Vodka Smirnoff', 'spirit', 'ml', 750, 44.36, 2250, 300.00, 750),
  ('vod-grey-goose', 'Grey Goose Vodka', 'Vodka Grey Goose', 'spirit', 'ml', 750, 44.36, 750, 950.00, 375),
  ('gin-tanqueray', 'Tanqueray Gin', 'Ginebra Tanqueray', 'spirit', 'ml', 750, 44.36, 1500, 550.00, 750),
  ('rum-bacardi-blanco', 'Bacardi White Rum', 'Ron Bacardi Blanco', 'spirit', 'ml', 750, 44.36, 2250, 280.00, 750),
  ('rum-captain-morgan', 'Captain Morgan Spiced', 'Ron Captain Morgan', 'spirit', 'ml', 750, 44.36, 1500, 320.00, 750),
  ('whi-jack-daniels', 'Jack Daniels', 'Whiskey Jack Daniels', 'spirit', 'ml', 700, 44.36, 1400, 650.00, 700),
  ('whi-jameson', 'Jameson Irish Whiskey', 'Whiskey Jameson', 'spirit', 'ml', 750, 44.36, 750, 700.00, 375),
  
  -- Liqueurs
  ('liq-triple-sec', 'Triple Sec', 'Triple Sec', 'spirit', 'ml', 750, 44.36, 1500, 250.00, 750),
  ('liq-kahlua', 'Kahlua Coffee Liqueur', 'Licor de Café Kahlúa', 'spirit', 'ml', 750, 44.36, 750, 350.00, 375),
  ('liq-damiana', 'Damiana Liqueur', 'Licor de Damiana', 'spirit', 'ml', 750, 44.36, 750, 450.00, 375),
  ('liq-ancho-reyes', 'Ancho Reyes Chile Liqueur', 'Licor de Chile Ancho Reyes', 'spirit', 'ml', 750, 44.36, 750, 650.00, 375),
  ('liq-controy', 'Controy Orange Liqueur', 'Licor de Naranja Controy', 'spirit', 'ml', 1000, 44.36, 1000, 400.00, 500),

  -- Beers
  ('beer-pacifico', 'Pacifico Clara', 'Cerveza Pacífico Clara', 'beer', 'unit', 1, 1, 48, 22.00, 24),
  ('beer-corona', 'Corona Extra', 'Cerveza Corona Extra', 'beer', 'unit', 1, 1, 48, 20.00, 24),
  ('beer-modelo-esp', 'Modelo Especial', 'Cerveza Modelo Especial', 'beer', 'unit', 1, 1, 48, 24.00, 24),
  ('beer-modelo-negra', 'Negra Modelo', 'Cerveza Negra Modelo', 'beer', 'unit', 1, 1, 24, 26.00, 12),
  ('beer-victoria', 'Victoria', 'Cerveza Victoria', 'beer', 'unit', 1, 1, 48, 20.00, 24),
  
  -- Mixers & Non-Alcoholic
  ('mix-squirt', 'Squirt Grapefruit Soda', 'Refresco Squirt', 'mixer', 'ml', 2000, 200, 10000, 28.00, 4000),
  ('mix-coke', 'Coca-Cola', 'Coca-Cola', 'mixer', 'ml', 2000, 200, 10000, 32.00, 4000),
  ('mix-sprite', 'Sprite', 'Sprite', 'mixer', 'ml', 2000, 200, 6000, 30.00, 2000),
  ('mix-orange-juice', 'Orange Juice', 'Jugo de Naranja', 'mixer', 'ml', 1000, 100, 5000, 25.00, 2000),
  ('mix-lime-juice', 'Fresh Lime Juice', 'Jugo de Limón Fresco', 'mixer', 'ml', 1000, 100, 5000, 40.00, 2000),
  ('mix-agave-syrup', 'Agave Syrup', 'Jarabe de Agave', 'mixer', 'ml', 750, 30, 1500, 120.00, 750),
  ('mix-clamato', 'Clamato', 'Clamato', 'mixer', 'ml', 946, 100, 3784, 45.00, 1892),
  ('mix-ginger-beer', 'Ginger Beer', 'Cerveza de Jengibre', 'mixer', 'ml', 355, 150, 4260, 35.00, 2130),
  ('mix-tonic', 'Tonic Water', 'Agua Quina', 'mixer', 'ml', 355, 200, 4260, 18.00, 2130),
  ('mix-pineapple-juice', 'Pineapple Juice', 'Jugo de Piña', 'mixer', 'ml', 1000, 100, 3000, 30.00, 1000),
  ('mix-jamaica', 'Hibiscus Water', 'Agua de Jamaica', 'mixer', 'ml', 1000, 200, 5000, 20.00, 2000),
  ('mix-tamarindo', 'Tamarind Pulp', 'Pulpa de Tamarindo', 'mixer', 'ml', 1000, 30, 2000, 45.00, 500),
  ('mix-grenadine', 'Grenadine', 'Granadina', 'mixer', 'ml', 750, 30, 750, 80.00, 250),
  ('mix-maggi', 'Maggi Seasoning', 'Jugo Maggi', 'mixer', 'ml', 100, 10, 200, 45.00, 100),
  ('mix-valentina', 'Valentina Hot Sauce', 'Salsa Valentina', 'mixer', 'ml', 370, 10, 740, 25.00, 370)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  order_cost = EXCLUDED.order_cost;

-- ==========================================
-- 2. DRINK MENU (50 Items)
-- ==========================================
INSERT INTO drinks (id, name, name_es, description, description_es, category, markup_factor, actual_price, source_type)
VALUES 
  -- Margaritas
  ('drk-marg-classic', 'Classic Margarita', 'Margarita Clásica', 'Tequila, lime, triple sec, agave.', 'Tequila, limón, triple sec, agave.', 'cocktail', 3.0, 140.00, 'standard'),
  ('drk-marg-spicy', 'Spicy Margarita', 'Margarita Picante', 'Tequila, lime, jalapeño, Ancho Reyes.', 'Tequila, limón, jalapeño, Ancho Reyes.', 'cocktail', 3.0, 155.00, 'standard'),
  ('drk-marg-jamaica', 'Hibiscus Margarita', 'Margarita de Jamaica', 'Tequila with fresh hibiscus water.', 'Tequila con agua fresca de jamaica.', 'cocktail', 3.0, 145.00, 'standard'),
  ('drk-marg-tamarind', 'Tamarind Margarita', 'Margarita de Tamarindo', 'Tequila, tamarind pulp, chili rim.', 'Tequila, pulpa de tamarindo, escarchado de chile.', 'cocktail', 3.0, 145.00, 'standard'),
  ('drk-marg-cadillac', 'Cadillac Margarita', 'Margarita Cadillac', 'Premium reposado tequila and Controy.', 'Tequila reposado premium y Controy.', 'cocktail', 3.0, 190.00, 'standard'),
  ('drk-marg-mango', 'Mango Margarita', 'Margarita de Mango', 'Fresh mango and tequila.', 'Mango fresco y tequila.', 'cocktail', 3.0, 145.00, 'standard'),
  
  -- Mexican Classics
  ('drk-paloma', 'Classic Paloma', 'Paloma Clásica', 'Tequila, lime, grapefruit soda.', 'Tequila, limón, refresco de toronja.', 'cocktail', 3.0, 130.00, 'standard'),
  ('drk-cantarito', 'Cantarito PV', 'Cantarito Vallartense', 'Tequila, orange, lime, grapefruit juice, Squirt.', 'Tequila, naranja, limón, jugo de toronja, Squirt.', 'cocktail', 3.0, 180.00, 'standard'),
  ('drk-vampiro', 'Vampiro', 'Vampiro', 'Tequila, sangrita, lime, grapefruit soda.', 'Tequila, sangrita, limón, refresco de toronja.', 'cocktail', 3.0, 140.00, 'standard'),
  ('drk-charro-negro', 'Charro Negro', 'Charro Negro', 'Tequila, coke, lime.', 'Tequila, coca, limón.', 'cocktail', 3.0, 120.00, 'standard'),
  ('drk-mex-mule', 'Mexican Mule', 'Mule Mexicano', 'Tequila, ginger beer, lime.', 'Tequila, cerveza de jengibre, limón.', 'cocktail', 3.0, 150.00, 'standard'),
  ('drk-teq-tonic', 'Tequila & Tonic', 'Tequila con Tonic', 'Tequila blanco and tonic water.', 'Tequila blanco y agua quina.', 'cocktail', 3.0, 125.00, 'standard'),
  
  -- Raicilla Specialties (Local PV)
  ('drk-rai-sour', 'Raicilla Sour', 'Raicilla Sour', 'El espíritu de Vallarta con limón y agave.', 'El espíritu de Vallarta con limón y agave.', 'cocktail', 3.5, 165.00, 'standard'),
  ('drk-rai-mule', 'Vallarta Mule', 'Mule de Vallarta', 'Raicilla, cerveza de jengibre, menta.', 'Raicilla, cerveza de jengibre, menta.', 'cocktail', 3.5, 175.00, 'standard'),
  ('drk-rai-passion', 'Piel Canela', 'Piel Canela', 'Raicilla, passion fruit, cinnamon.', 'Raicilla, maracuyá, canela.', 'cocktail', 3.5, 180.00, 'standard'),
  ('drk-rai-neat', 'Raicilla Neat (Divisadero)', 'Raicilla Directa', 'Raicilla local pura.', 'Raicilla local pura.', 'shot', 3.0, 120.00, 'standard'),
  
  -- Mezcal
  ('drk-mez-negroni', 'Mezcal Negroni', 'Negroni de Mezcal', 'Mezcal, campari, sweet vermouth.', 'Mezcal, campari, vermut dulce.', 'cocktail', 3.5, 185.00, 'standard'),
  ('drk-mez-mule', 'Smoky Mule', 'Mule Ahumado', 'Mezcal, ginger beer, lime.', 'Mezcal, cerveza de jengibre, limón.', 'cocktail', 3.0, 160.00, 'standard'),
  ('drk-mez-shot', 'Mezcal 400 Conejos', 'Mezcal 400 Conejos', 'Shot of artisanal mezcal.', 'Caballito de mezcal artesanal.', 'shot', 3.0, 110.00, 'standard'),
  
  -- Other Cocktails
  ('drk-mojito', 'Classic Mojito', 'Mojito Clásico', 'Rum, mint, lime, sugar, soda.', 'Ron, menta, limón, azúcar, soda.', 'cocktail', 3.0, 135.00, 'standard'),
  ('drk-daiquiri', 'Lime Daiquiri', 'Daiquirí de Limón', 'Rum, lime, simple syrup.', 'Ron, limón, jarabe.', 'cocktail', 3.0, 125.00, 'standard'),
  ('drk-gin-tonic', 'Gin & Tonic (Tanqueray)', 'Gin & Tonic', 'Gin, tonic, cucumber.', 'Ginebra, tonic, pepino.', 'cocktail', 3.0, 140.00, 'standard'),
  ('drk-vod-soda', 'Vodka Soda', 'Vodka con Soda', 'Vodka, sparkling water, lime.', 'Vodka, agua mineral, limón.', 'cocktail', 3.0, 110.00, 'standard'),
  ('drk-screwdriver', 'Screwdriver', 'Desarmador', 'Vodka and fresh orange juice.', 'Vodka y jugo de naranja fresco.', 'cocktail', 3.0, 115.00, 'standard'),
  ('drk-cuba-libre', 'Cuba Libre', 'Cuba Libre', 'Bacardi, coke, lime.', 'Bacardi, coca, limón.', 'cocktail', 3.0, 110.00, 'standard'),
  ('drk-black-russian', 'Black Russian', 'Ruso Negro', 'Vodka and Kahlua.', 'Vodka y Kahlúa.', 'cocktail', 3.0, 130.00, 'standard'),
  ('drk-white-russian', 'White Russian', 'Ruso Blanco', 'Vodka, Kahlua, cream.', 'Vodka, Kahlúa, crema.', 'cocktail', 3.0, 140.00, 'standard'),
  ('drk-old-fashioned', 'Old Fashioned', 'Old Fashioned', 'Whiskey, bitters, orange peel.', 'Whiskey, amargos, cáscara de naranja.', 'cocktail', 3.0, 170.00, 'standard'),
  ('drk-whiskey-sour', 'Whiskey Sour', 'Whiskey Sour', 'Jameson, lime, sugar.', 'Jameson, limón, azúcar.', 'cocktail', 3.0, 155.00, 'standard'),
  
  -- Shots & Specialty
  ('drk-teq-dj70', 'Don Julio 70 (Shot)', 'Don Julio 70', 'Clear añejo tequila shot.', 'Shot de tequila añejo cristalino.', 'shot', 3.0, 180.00, 'standard'),
  ('drk-teq-dj1942', 'Don Julio 1942 (Shot)', 'Don Julio 1942', 'Extra premium tequila shot.', 'Shot de tequila extra premium.', 'shot', 2.0, 450.00, 'standard'),
  ('drk-teq-herra', 'Herradura Repo (Shot)', 'Herradura Repo', 'Reposado tequila shot.', 'Shot de tequila reposado.', 'shot', 3.0, 130.00, 'standard'),
  ('drk-b52', 'B-52 Shot', 'B-52', 'Kahlua, Baileys, Grand Marnier.', 'Kahlúa, Baileys, Grand Marnier.', 'shot', 3.0, 120.00, 'standard'),
  ('drk-baby-mango', 'Baby Mango', 'Baby Mango', 'Vodka, mango, chamoy.', 'Vodka, mango, chamoy.', 'shot', 3.0, 95.00, 'standard'),
  
  -- Beers & Beer Mixes
  ('drk-beer-pacifico', 'Pacifico', 'Pacífico', 'Chilled Pacifico bottle.', 'Cerveza Pacífico bien fría.', 'beer', 2.5, 55.00, 'standard'),
  ('drk-beer-corona', 'Corona', 'Corona', 'Chilled Corona bottle.', 'Cerveza Corona bien fría.', 'beer', 2.5, 50.00, 'standard'),
  ('drk-beer-victoria', 'Victoria', 'Victoria', 'Chilled Victoria bottle.', 'Cerveza Victoria bien fría.', 'beer', 2.5, 50.00, 'standard'),
  ('drk-beer-modelo-esp', 'Modelo Especial', 'Modelo Especial', 'Chilled Modelo bottle.', 'Cerveza Modelo Especial.', 'beer', 2.5, 60.00, 'standard'),
  ('drk-beer-modelo-neg', 'Negra Modelo', 'Negra Modelo', 'Chilled dark Modelo.', 'Cerveza Negra Modelo.', 'beer', 2.5, 65.00, 'standard'),
  ('drk-michelada', 'Michelada (Add-on)', 'Michelada', 'Limón, sal y salsas mixtas.', 'Limón, sal y salsas mixtas.', 'beer', 3.0, 35.00, 'standard'),
  ('drk-chelada', 'Chelada (Add-on)', 'Chelada', 'Limón y sal.', 'Limón y sal.', 'beer', 3.0, 25.00, 'standard'),
  ('drk-ojorojo', 'Ojo Rojo', 'Ojo Rojo', 'Mezcla de Clamato para cerveza.', 'Mezcla de Clamato para cerveza.', 'beer', 3.0, 45.00, 'standard'),
  
  -- Non-Alcoholic
  ('drk-lemonade', 'Fresh Lemonade', 'Limonada Natural', 'Limonada de limón recién exprimido.', 'Limonada de limón recién exprimido.', 'non_alcoholic', 3.0, 45.00, 'standard'),
  ('drk-jamaica-water', 'Hibiscus Water', 'Agua de Jamaica', 'Agua fresca de jamaica.', 'Agua fresca de jamaica.', 'non_alcoholic', 3.0, 40.00, 'standard'),
  ('drk-horchata', 'Horchata', 'Horchata', 'Agua tradicional de arroz.', 'Agua tradicional de arroz.', 'non_alcoholic', 3.0, 45.00, 'standard'),
  ('drk-coke', 'Coca-Cola', 'Coca-Cola', 'Coca-Cola de botella.', 'Coca-Cola de botella.', 'non_alcoholic', 2.5, 35.00, 'standard'),
  ('drk-squirt-can', 'Squirt', 'Squirt', 'Refresco de toronja.', 'Refresco de toronja.', 'non_alcoholic', 2.5, 35.00, 'standard'),
  ('drk-sparkling', 'Mineral Water', 'Agua Mineral', 'Agua mineral Topochico o Peñafiel.', 'Agua mineral Topochico o Peñafiel.', 'non_alcoholic', 2.5, 40.00, 'standard'),
  ('drk-coffee', 'Coffee', 'Café', 'Café americano caliente.', 'Café americano caliente.', 'non_alcoholic', 3.0, 35.00, 'standard'),
  ('drk-espresso', 'Espresso', 'Espresso', 'Café espresso estilo italiano.', 'Café espresso estilo italiano.', 'non_alcoholic', 3.0, 45.00, 'standard')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  actual_price = EXCLUDED.actual_price;

-- ==========================================
-- 3. RECIPES (Sample Logic)
-- ==========================================
INSERT INTO recipe_ingredients (id, drink_id, ingredient_id, amount_in_base_unit)
VALUES
  -- Classic Margarita
  ('ri-marg-teq', 'drk-marg-classic', 'teq-herradura-repo', 60),
  ('ri-marg-triple', 'drk-marg-classic', 'liq-triple-sec', 30),
  ('ri-marg-lime', 'drk-marg-classic', 'mix-lime-juice', 30),
  ('ri-marg-agave', 'drk-marg-classic', 'mix-agave-syrup', 15),
  
  -- Spicy Margarita
  ('ri-spicy-teq', 'drk-marg-spicy', 'teq-espolon-blanco', 60),
  ('ri-spicy-ancho', 'drk-marg-spicy', 'liq-ancho-reyes', 15),
  ('ri-spicy-lime', 'drk-marg-spicy', 'mix-lime-juice', 30),
  ('ri-spicy-agave', 'drk-marg-spicy', 'mix-agave-syrup', 15),
  
  -- Paloma
  ('ri-paloma-teq', 'drk-paloma', 'teq-casamigos-blanco', 60),
  ('ri-paloma-lime', 'drk-paloma', 'mix-lime-juice', 15),
  ('ri-paloma-squirt', 'drk-paloma', 'mix-squirt', 150),
  
  -- Raicilla Sour
  ('ri-rai-teq', 'drk-rai-sour', 'rai-divisadero', 60),
  ('ri-rai-lime', 'drk-rai-sour', 'mix-lime-juice', 30),
  ('ri-rai-agave', 'drk-rai-sour', 'mix-agave-syrup', 20),
  
  -- Cantarito
  ('ri-cant-teq', 'drk-cantarito', 'teq-espolon-blanco', 60),
  ('ri-cant-orange', 'drk-cantarito', 'mix-orange-juice', 45),
  ('ri-cant-lime', 'drk-cantarito', 'mix-lime-juice', 15),
  ('ri-cant-squirt', 'drk-cantarito', 'mix-squirt', 120),
  
  -- Mexican Mule
  ('ri-mule-teq', 'drk-mex-mule', 'teq-casamigos-blanco', 60),
  ('ri-mule-ginger', 'drk-mex-mule', 'mix-ginger-beer', 150),
  ('ri-mule-lime', 'drk-mex-mule', 'mix-lime-juice', 15),
  
  -- Smirnoff Screwdriver
  ('ri-screw-vod', 'drk-screwdriver', 'vod-smirnoff', 60),
  ('ri-screw-orange', 'drk-screwdriver', 'mix-orange-juice', 150),
  
  -- Pacifico (Uses 1 bottle)
  ('ri-beer-pac', 'drk-beer-pacifico', 'beer-pacifico', 1),
  ('ri-beer-esp', 'drk-beer-modelo-esp', 'beer-modelo-esp', 1)
ON CONFLICT (drink_id, ingredient_id) DO NOTHING;
