import { expect, test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ADMIN_STATE } from '../playwright.config';

/**
 * Signs in ONCE and saves the session for every other test. (Signing in ends the
 * account's other dashboard sessions, so tests must never sign in on their own.)
 */
setup('sign in once', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  expect(email, 'Set E2E_ADMIN_EMAIL in .env').toBeTruthy();
  expect(password, 'Set E2E_ADMIN_PASSWORD in .env').toBeTruthy();

  await page.goto('/auth/login');
  await page.locator('#email').fill(email!);
  const passwordField = page.locator('#password input');
  await passwordField.fill(password!);
  await page.locator('label[for="rememberMe"]').click();
  await page.getByRole('button', { name: /sign in/i }).click();

  try {
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 45_000 });
  } catch (error) {
    // keep the password out of the failure report's page snapshot
    await passwordField.fill('').catch(() => undefined);
    throw error;
  }
  await expect(page.locator('.layout-topbar').first()).toBeVisible();

  fs.mkdirSync(path.dirname(ADMIN_STATE), { recursive: true });
  await page.context().storageState({ path: ADMIN_STATE });
});
