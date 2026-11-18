import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { uniqueName } from './data';
import { confirmButton, control, row, rowAction } from './ui';

/** Region and city used for the test patient. On stage the region is called 'Riyadh Region'; a local stack says 'Riyadh Province'. */
const REGION = process.env.E2E_REGION ?? 'Riyadh';
const CITY = process.env.E2E_CITY ?? 'Riyadh';

/** Waits for the API, never for time. A busy stage can take many seconds per call. */
export const API_TIMEOUT = 60_000;

export function waitForApi(page: Page, method: string, path: RegExp, query?: RegExp): Promise<Response> {
  return page.waitForResponse(
    candidate =>
      candidate.request().method() === method &&
      path.test(new URL(candidate.url()).pathname) &&
      (!query || query.test(decodeURIComponent(new URL(candidate.url()).search))),
    { timeout: API_TIMEOUT }
  );
}

/** The name inputs ask the API to translate English to Arabic (Google Translate): answer "no translation". */
export async function stubTranslation(page: Page): Promise<void> {
  await page.route(/\/v1\/translation$/, route => route.fulfill({ json: { date: { translated_text: '' } } }));
}

/** Clicks and returns the JSON of the API call it makes, which must succeed. */
export async function clickAndRead<T = any>(
  page: Page,
  target: Locator,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET',
  path: RegExp
): Promise<T> {
  const [response] = await Promise.all([waitForApi(page, method, path), target.click()]);
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `${method} ${response.url()} ${JSON.stringify(body).slice(0, 500)}`).toBeLessThan(400);
  return body as T;
}

/** Opens a page and waits for the list call it makes. */
export async function visit(page: Page, path: string, api: RegExp): Promise<void> {
  const loaded = waitForApi(page, 'GET', api);
  await page.goto(path);
  const response = await loaded;
  expect(response.status(), `GET ${response.url()}`).toBeLessThan(400);
  await expect(page.locator('.p-progressspinner, .p-datatable-loading-overlay').first()).toBeHidden({
    timeout: API_TIMEOUT
  });
}

/** Types into a list's search box and waits for the list call that carries the text. */
export async function searchList(page: Page, box: Locator, text: string, path: RegExp): Promise<void> {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reloaded = waitForApi(page, 'GET', path, new RegExp(escaped));
  await box.fill(text);
  await box.press('Enter').catch(() => undefined);
  const response = await reloaded;
  expect(response.status(), `GET ${response.url()}`).toBeLessThan(400);
}

/** Picks an option of a PrimeNG select by its text, within the overlay that opened. */
export async function pick(scope: Page | Locator, name: string, option?: string | RegExp): Promise<string> {
  const page = 'page' in scope ? scope.page() : scope;
  const panel = page.locator('.p-select-overlay').last();
  await expect(async () => {
    if (!(await panel.isVisible())) await control(scope, name).click();
    await expect(panel).toBeVisible({ timeout: 2_000 });
  }).toPass();
  const filter = panel.locator('input.p-select-filter');
  if (typeof option === 'string' && (await filter.isVisible())) {
    await filter.fill(option);
  }
  const options = panel.locator('li.p-select-option');
  const target = option === undefined ? options.first() : options.filter({ hasText: option }).first();
  await expect(target).toBeVisible();
  const label = (await target.innerText()).split('\n')[0].trim();
  await target.click();
  await expect(page.locator('.p-select-overlay')).toHaveCount(0);
  return label;
}

/** Types a date (dd/mm/yyyy) into a PrimeNG datepicker (it ignores fill(): needs key presses). */
export async function typeDate(scope: Page | Locator, name: string, date: string): Promise<void> {
  const page = 'page' in scope ? scope.page() : scope;
  const input = control(scope, name).locator('input').first();
  await input.click();
  await input.press('ControlOrMeta+a');
  await input.press('Backspace');
  await input.pressSequentially(date);
  await expect(input).toHaveValue(date);
  await input.press('Enter');
  await expect(page.locator('.p-datepicker-panel:visible')).toHaveCount(0);
}

/** A ten-digit Saudi ID (national IDs start with 1, iqamas with 2). */
function randomNationalId(first: '1' | '2' = '1'): string {
  return `${first}${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;
}

/** Types an ID number nobody has yet, using the form's own "is it registered?" check. */
async function fillUnusedPatientId(scope: Page | Locator): Promise<string> {
  const page = 'page' in scope ? scope.page() : scope;
  const input = control(scope, 'personal_id_number');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = randomNationalId();
    await input.fill(id);
    const [response] = await Promise.all([
      waitForApi(page, 'GET', /\/v1\/check-patient-personal-id$/, new RegExp(id)),
      input.blur()
    ]);
    if ((await response.json())?.data?.exists === false) {
      await expect(scope.getByText('ID number is available')).toBeVisible();
      return id;
    }
  }
  throw new Error('No unused ID found in 5 attempts');
}

const PATIENTS_API = /\/v1\/patients$/;

/** Opens the patients list and waits for the countries the registration dialog needs. */
export async function openPatientsList(page: Page): Promise<void> {
  const nationalities = waitForApi(page, 'GET', /\/v1\/countries$/, /^\?limit=0&page=0$/);
  const addressCountries = waitForApi(page, 'GET', /\/v1\/countries$/, /^\?limit=0&page=0&allowedCountriesOnly=1$/);
  await visit(page, '/patients', PATIENTS_API);
  await Promise.all([nationalities, addressCountries]);
}

/** Opens the Quick Registration dialog (a dialog, not a page). */
export async function openQuickRegistration(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'add new patient' }).click();
  await Promise.all([
    waitForApi(page, 'GET', /\/v1\/regions$/),
    page.getByRole('menuitem', { name: 'Quick Registration' }).click()
  ]);
  const form = page.getByRole('dialog', { name: 'Quick Registration' });
  await expect(form).toBeVisible();
  return form;
}

export type TestPatient = { id: string; firstName: string; fullName: string; nationalId: string; phone: string };

/** Registers a patient through Quick Registration and returns it as the API created it. */
export async function quickRegisterPatient(page: Page, options: { phone: string }): Promise<TestPatient> {
  const firstName = uniqueName('Smoke');
  await openPatientsList(page);
  const form = await openQuickRegistration(page);

  const english = form.getByRole('textbox', { name: 'english name' });
  await english.nth(0).fill(firstName);
  await english.nth(1).fill('Quick');
  await english.nth(2).fill('Registered');
  await form.getByRole('radio', { name: 'Male', exact: true }).check();
  await typeDate(form, 'birth', '15/05/1990');
  await pick(form, 'country_id', 'Saudi Arabia');
  await form.getByRole('textbox', { name: 'Phone number' }).fill(options.phone);
  const nationalId = await fillUnusedPatientId(form);
  await pick(form, 'address_region_id', REGION);
  await pick(form, 'address_city_id', CITY);

  const created = await clickAndRead(page, form.getByRole('button', { name: 'Create Patient' }), 'POST', PATIENTS_API);
  await expect(form).toBeHidden();

  return {
    id: created.data.id,
    firstName,
    fullName: `${firstName} Quick Registered`,
    nationalId,
    phone: options.phone
  };
}

/** The patients list, searched for this patient. */
export async function findPatient(page: Page, patient: Pick<TestPatient, 'firstName'>): Promise<Locator> {
  await visit(page, '/patients', PATIENTS_API);
  await searchList(page, page.getByRole('textbox', { name: 'search' }), patient.firstName, PATIENTS_API);
  return row(page, patient.firstName);
}

async function findDeletedPatient(page: Page, patient: Pick<TestPatient, 'firstName'>): Promise<Locator> {
  const loaded = waitForApi(page, 'GET', PATIENTS_API, /only_trashed=1/);
  await page.goto('/patients/deleted');
  await loaded;
  await searchList(
    page,
    page.getByRole('textbox', { name: 'Search deleted patients' }),
    patient.firstName,
    PATIENTS_API
  );
  return row(page, patient.firstName);
}

/** Removes the test patient for good: deletes it, then deletes it permanently. */
export async function purgePatient(page: Page, patient: TestPatient): Promise<void> {
  const listed = await findPatient(page, patient);
  if ((await listed.count()) > 0) {
    await rowAction(listed, 'trash').click();
    await clickAndRead(page, confirmButton(page), 'DELETE', new RegExp(`/v1/patients/${patient.id}$`));
  }
  const deleted = await findDeletedPatient(page, patient);
  if ((await deleted.count()) > 0) {
    await deleted.getByRole('button', { name: 'Permanently delete patient' }).click();
    await clickAndRead(page, confirmButton(page), 'DELETE', new RegExp(`/v1/patients/${patient.id}/force$`));
  }
}
