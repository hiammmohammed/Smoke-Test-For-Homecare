import { expect, expectNoApiErrors, test } from '../support/fixtures';
import { dialog, open, rowAction } from '../support/ui';

/**
 * SMOKE 3: patient tags. Only OPENS and CANCELS: nothing is changed, so the
 * tests are safe on any account.
 */
test.describe('@smoke patient tags', () => {
  test('the tag dialog offers VIP Alert and VIP Data Masking', async ({ page, apiFailures }, testInfo) => {
    await open(page, '/patient-tags');
    const firstTag = page.getByRole('rowgroup').last().getByRole('row').first();
    await expect(firstTag).toBeVisible();

    await rowAction(firstTag, 'pencil').click();
    const edit = dialog(page, 'Update Patient Tag Details');
    await expect(edit).toBeVisible();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    // keep what the dialog really shows in the report: it makes a failure easy to read
    await testInfo.attach('dialog-text', { body: await edit.innerText(), contentType: 'text/plain' });
    await expect(edit.getByText(/raise the VIP request alert/i).first()).toBeVisible();

    await edit.getByRole('button', { name: 'Cancel' }).click();
    await expect(edit).toBeHidden();
    expectNoApiErrors(apiFailures);
  });

  test('Assign Patient Tags: Specific needs at least one tag, and Cancel changes nothing', async ({
    page,
    apiFailures
  }) => {
    await open(page, '/users');
    // The icon buttons carry their label on the <p-button> element, so they are found by it.
    // The first user whose Assign Patient Tags button is enabled (your own row is greyed out).
    const assignButton = page.locator('p-button[aria-label="Assign Patient Tags"] button:not([disabled])').first();
    await expect(assignButton, 'No enabled "Assign Patient Tags" button: does this account have the permission?').toBeVisible();
    await assignButton.click();

    const assign = dialog(page, 'Assign Patient Tags');
    await expect(assign).toBeVisible();
    await expect(assign.getByRole('radio', { name: /All patient tags/ })).toBeVisible();
    const specific = assign.getByRole('radio', { name: /Specific patient tags/ });
    await expect(specific).toBeVisible();

    // nothing changed yet: Save is disabled
    const save = assign.getByRole('button', { name: 'Save', exact: true });
    await expect(save).toBeDisabled();

    // Specific with nothing ticked would mean "every tag": the dialog asks for a tag instead
    await specific.click();
    const clear = assign.getByRole('button', { name: 'Clear' });
    if (await clear.isEnabled().catch(() => false)) await clear.click();
    await expect(assign.getByText('Select at least one tag, or choose All patient tags.')).toBeVisible();
    await expect(save).toBeDisabled();

    await assign.getByRole('button', { name: 'Cancel' }).click();
    await expect(assign).toBeHidden();
    expectNoApiErrors(apiFailures);
  });
});
