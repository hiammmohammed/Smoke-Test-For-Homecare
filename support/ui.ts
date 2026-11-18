import { expect, type Locator, type Page } from '@playwright/test';

/** Opens a dashboard page and waits until its data has loaded. */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('.p-progressspinner, .p-datatable-loading-overlay').first()).toBeHidden();
}

/** A form control by its Angular formControlName. */
export function control(scope: Page | Locator, name: string): Locator {
  return scope.locator(`[formcontrolname="${name}"]`).first();
}

/** The open dialog with this title. */
export function dialog(page: Page, title: string | RegExp): Locator {
  return page.getByRole('dialog', { name: title });
}

/** The table row that mentions this text. */
export function row(page: Page | Locator, text: string | RegExp): Locator {
  return page.getByRole('row').filter({ hasText: text });
}

/** The edit (pencil) / delete (trash) / view (eye) icon button of a row. */
export function rowAction(target: Locator, icon: 'pencil' | 'trash' | 'eye' | string): Locator {
  return target.locator(`button:has(.pi-${icon}), a:has(.pi-${icon}), [class*="pi-${icon}"]`).first();
}

/** The accept button of the open confirmation dialog (delete / restore ...). */
export function confirmButton(page: Page): Locator {
  return page
    .locator('.p-confirmdialog:visible, .p-dialog:visible')
    .last()
    .locator(
      '.p-confirmdialog-accept-button, button:has-text("Yes"), button:has-text("Delete"), button:has-text("Confirm")'
    )
    .first();
}
