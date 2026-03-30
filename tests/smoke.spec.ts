import { test, expect } from '@playwright/test';

// Use environment variables for login, fallback to defaults for local dev
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-immediately';

test.describe('GustoPOS Smoke Tests', () => {
  test('should login as admin and navigate to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Login
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Login"), button:has-text("Iniciar Sesión")');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText(['Dashboard', 'Panel']);
  });

  test('should navigate through main sections', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Login"), button:has-text("Iniciar Sesión")');
    await expect(page).toHaveURL('/');

    // Check Menu
    await page.click('button:has-text("Menu"), button:has-text("Menú")');
    await expect(page.locator('h1')).toContainText(['Menu', 'Menú']);

    // Check Inventory
    await page.click('button:has-text("Inventory"), button:has-text("Inventario")');
    await expect(page.locator('h1')).toContainText(['Inventory', 'Inventario']);

    // Check Reports
    await page.click('button:has-text("Reports"), button:has-text("Reportes")');
    await expect(page.locator('h1')).toContainText(['Reports', 'Reportes']);

    // Check Settings
    await page.click('button:has-text("Settings"), button:has-text("Ajustes")');
    await expect(page.locator('h1')).toContainText(['Settings', 'Ajustes']);
  });

  test('should open quick search with keyboard shortcut', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Login"), button:has-text("Iniciar Sesión")');
    await expect(page).toHaveURL('/');

    // Press Cmd+K (using Control on non-Mac agents)
    await page.keyboard.press('Control+k');

    // Check if search input is visible
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Buscar"]');
    await expect(searchInput).toBeVisible();
  });
});
