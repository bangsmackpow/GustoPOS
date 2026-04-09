-- ==========================================
-- BARTENDER TEST SEEDS
-- Creates test users for bartender workflow testing
-- ==========================================

-- Bartender users with test PINs (hashed with bcrypt cost 10)
INSERT INTO users (id, first_name, last_name, email, role, pin, language, is_active)
VALUES 
  ('bartender-maria', 'Maria', 'Garcia', 'maria@gusto.local', 'bartender', '$2b$10$tGJ13Z6XQjY2q3ThdJ2e9OJq2jfxpmDXoHWeAyLxRaRkhUn.x9/xu', 'en', 1),
  ('bartender-carlos', 'Carlos', 'Rodriguez', 'carlos@gusto.local', 'bartender', '$2b$10$ke.9lOTnQSmXpWfl.MXN2OhbnPu0/lAeOEaoLQepAueBPjTkUq/K6', 'en', 1),
  ('bartender-ana', 'Ana', 'Lopez', 'ana@gusto.local', 'bartender', '$2b$10$oZbAwqeal38ubSKuUU2brOtBoGR/lVyEvBHpRiO4B2o0JSUEDM3ae', 'es', 1)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  pin = EXCLUDED.pin;
