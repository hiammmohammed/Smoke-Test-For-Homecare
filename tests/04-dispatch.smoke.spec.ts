import { expect, expectNoApiErrors, test } from '../support/fixtures';
import { open } from '../support/ui';

/**
 * SMOKE 4: the dispatch panel and the app-requests screens load, and their main
 * controls are there. (The full request lifecycle is in the product repo's
 * e2e/tests/requests/request-lifecycle.spec.ts: it needs E2E_ALLOW_MESSAGES=true.)
 */
test.describe('@smoke dispatch', () => {
  test('the dispatch panel lists requests and its filters work', async ({ page, apiFailures }) => {
    await open(page, '/dispatched-orders/dispatch-panel');

    await expect(page.getByRole('button', { name: 'Add New Request' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply Filters' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Request ID/ })).toBeVisible();

    await page.getByRole('button', { name: 'Apply Filters' }).click();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByRole('columnheader', { name: /Request ID/ })).toBeVisible();
    expectNoApiErrors(apiFailures);
  });

  test('Add New Request opens the new-request screen', async ({ page }) => {
    await open(page, '/dispatched-orders/dispatch-panel');
    await page.getByRole('button', { name: 'Add New Request' }).click();
    await expect(page).toHaveURL(/\/dispatched-orders\/create/);
  });

  test('every App Requests tab (cancellation, handover, reschedule) loads', async ({ page, apiFailures }) => {
    await open(page, '/dispatched-orders/pending-app-requests');
    const tabs = page.getByRole('tab');
    await expect(tabs.first()).toBeVisible();

    const count = await tabs.count();
    for (let i = 0; i < count; i += 1) {
      await tabs.nth(i).click();
      await page.waitForLoadState('networkidle').catch(() => undefined);
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
    }
    expectNoApiErrors(apiFailures);
  });
});
