import { expect, test as base, type Response } from '@playwright/test';

export type ApiFailure = { status: number; method: string; url: string };

/**
 * Every smoke test also watches the page: it fails if the page throws an
 * uncaught error or the API answers 5xx. 4xx answers are collected too, for the
 * tests that expect none (expectNoApiErrors).
 */
export const test = base.extend<{ apiFailures: ApiFailure[] }>({
  apiFailures: async ({ page }, use, testInfo) => {
    const failures: ApiFailure[] = [];
    const pageErrors: string[] = [];
    const onResponse = (response: Response) => {
      const url = response.url();
      if (/\/(api\/)?v1\//.test(url) && response.status() >= 400) {
        failures.push({
          status: response.status(),
          method: response.request().method(),
          url: url.replace(/^https?:\/\/[^/]+/, '')
        });
      }
    };
    page.on('response', onResponse);
    page.on('pageerror', error => pageErrors.push(error.message));

    await use(failures);

    page.off('response', onResponse);
    const serverErrors = failures.filter(failure => failure.status >= 500);
    if (testInfo.status === testInfo.expectedStatus) {
      expect(serverErrors, 'API answered 5xx').toEqual([]);
      expect(pageErrors, 'Uncaught errors in the page').toEqual([]);
    }
  }
});

export { expect };

/** Fails on any 4xx/5xx the API returned during the test so far. */
export function expectNoApiErrors(failures: ApiFailure[]): void {
  expect(failures, 'API errors (4xx/5xx)').toEqual([]);
}
