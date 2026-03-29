-- Admin seed with admin role
INSERT INTO users (email, firstName, lastName, role, language, isActive)
VALUES ('admin@example.com', 'Admin', 'User', 'admin', 'en', TRUE)
ON CONFLICT (email) DO NOTHING;
