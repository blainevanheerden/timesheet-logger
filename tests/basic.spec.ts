import { test, expect } from '@playwright/test';

test('app loads and shows Timesheet Logger', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Timesheet Logger')).toBeVisible();
  await expect(page.getByPlaceholder('Your Name')).toBeVisible();
});