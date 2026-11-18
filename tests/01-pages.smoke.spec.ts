import { expect, expectNoApiErrors, test } from '../support/fixtures';
import { open } from '../support/ui';

/**
 * SMOKE 1: the pages people use every day open, with no API error and no crash.
 * (The full menu list lives in the product repo's e2e/tests/smoke/menu-pages.spec.ts.)
 */
const PAGES = [
  '/dashboard',
  '/patients',
  '/dispatched-orders/dispatch-panel',
  '/dispatched-orders/pending-app-requests',
  '/dispatched-orders/status-tracker',
  '/dispatched-orders/create',
  '/follow-up-reminders',
  '/rosters',
  '/slots/manage',
  '/specialists',
  '/users',
  '/patient-tags',
  '/payers',
  '/contracts',
  '/providers',
  '/regions',
  '/cities',
  '/districts',
  '/service-categories',
  '/insurance-companies',
  '/cancellation-reasons',
  '/tickets',
  '/notification-settings'
];

test.describe('@smoke pages open', () => {
  for (const path of PAGES) {
    test(path, async ({ page, apiFailures }) => {
      await open(page, path);

      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\?|$)`));
      await expect(
        page
          .getByRole('navigation', { name: 'Breadcrumb' })
          .or(page.locator('.layout-main h1, .layout-main h2'))
          .first()
      ).toBeVisible();
      expectNoApiErrors(apiFailures);
    });
  }
});
