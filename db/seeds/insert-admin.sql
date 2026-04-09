-- Admin seed with admin role
INSERT INTO users (email, first_name, last_name, role, language, pin, is_active)
VALUES ('admin@example.com', 'Admin', 'User', 'admin', 'es', '0000', TRUE)
ON CONFLICT (email) DO NOTHING;