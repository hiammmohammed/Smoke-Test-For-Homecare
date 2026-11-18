import { expect, test } from '../support/fixtures';
import { uniquePhone } from '../support/data';
import {
  findPatient,
  purgePatient,
  quickRegisterPatient,
  stubTranslation,
  type TestPatient
} from '../support/people';

/**
 * SMOKE 2: a patient can be registered (Quick Registration) and shows up in the
 * list with the ID and phone. The test removes the patient it created.
 */
test.describe('@smoke patients', () => {
  test.describe.configure({ timeout: 180_000 });

  let patient: TestPatient | undefined;

  test.beforeEach(async ({ page }) => stubTranslation(page));

  test.afterEach(async ({ page }) => {
    if (patient) await purgePatient(page, patient);
    patient = undefined;
  });

  test('a quick-registered patient is listed with their ID and phone', async ({ page }) => {
    patient = await quickRegisterPatient(page, { phone: uniquePhone() });

    const listed = await findPatient(page, patient);
    await expect(listed).toHaveCount(1);
    await expect(listed).toContainText(patient.fullName);
    await expect(listed).toContainText(patient.nationalId);
    await expect(listed).toContainText(`+966${patient.phone}`);
  });

  test('the full registration form offers the patient tags and Special Needs', async ({ page }) => {
    await page.goto('/patients/new');
    await expect(page.getByText('Special Needs').first()).toBeVisible();
    await expect(page.getByText('Basic Information').first()).toBeVisible();
  });
});
