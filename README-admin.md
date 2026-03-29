Admin RBAC and Login Plan

- Admin roles: admin, manager, bartender, waitstaff
- Admin UI at /admin is production-ready and RBAC-protected
- Admin login uses password (admin@example.com / secret) as configured in stack.env
- Dev login is available for testing behind DEV_LOGIN
- Admin seed is automatic if ENABLE_ADMIN_SEED is true; can be re-run via a seed endpoint or script
- 2FA: admin-only via TOTPs (enable in admin user provisioning later; for now, 2FA flow is reserved for production)
