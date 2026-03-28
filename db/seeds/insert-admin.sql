-- Admin user seed (best run against a fresh or existing users table)
-- This seeds a default admin account if one does not already exist by email.
-- Adapt columns as necessary to your schema (pin may be nullable).
INSERT INTO users (email, firstName, lastName, profileImageUrl, role, language, isActive)
VALUES ('admin@example.com', 'System', 'Admin', NULL, 'manager', 'en', TRUE)
ON CONFLICT (email) DO NOTHING;
