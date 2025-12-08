/* Playwright E2E Tests */

import { test, expect } from '@playwright/test';

test.describe('FusionDesk Desktop App', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('FusionDesk');
  });

  test('should display sidebar navigation', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('should toggle sidebar', async ({ page }) => {
    await page.goto('/');
    const toggleBtn = page.locator('.toggle-btn');
    await toggleBtn.click();
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveClass(/collapsed/);
  });

  test('should navigate to chat module', async ({ page }) => {
    await page.goto('/');
    const chatBtn = page.locator('.nav-item').filter({ hasText: 'Chat' });
    await chatBtn.click();
    const chatContainer = page.locator('.chat-container');
    await expect(chatContainer).toBeVisible();
  });

  test('should send a message', async ({ page }) => {
    await page.goto('/');
    const chatBtn = page.locator('.nav-item').filter({ hasText: 'Chat' });
    await chatBtn.click();

    const input = page.locator('.chat-input');
    await input.fill('Test message');
    const sendBtn = page.locator('.send-btn');
    await sendBtn.click();

    const message = page.locator('.message-content').last();
    await expect(message).toContainText('Test message');
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    const dashboardBtn = page.locator('.nav-item').filter({ hasText: 'Dashboard' });
    await dashboardBtn.click();
    const dashboard = page.locator('.dashboard');
    await expect(dashboard).toBeVisible();
  });

  test('should apply theme preference', async ({ page }) => {
    await page.goto('/');
    // Theme application test
    const html = page.locator('html');
    const theme = await html.getAttribute('data-theme');
    expect(['light', 'dark', 'system']).toContain(theme);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    // Test Ctrl+B to toggle sidebar
    await page.keyboard.press('Control+b');
    const sidebar = page.locator('.sidebar');
    const classes = await sidebar.getAttribute('class');
    expect(classes).toContain('collapsed');
  });
});
