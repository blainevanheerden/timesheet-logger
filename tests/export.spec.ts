import { test, expect } from '@playwright/test';

// Test exporting month triggers a download
test('export month generates a PDF download', async ({ page }) => {
  // Pre-set login so the test doesn't need to interact with the welcome screen
  await page.addInitScript(() => localStorage.setItem('technicianName', 'Tester'));
  await page.goto('/');

  // Wait for app to be ready and confirm login
  await page.waitForSelector('text=Technician:', { timeout: 30000 });
  await expect(page.locator('text=Technician:')).toContainText('Tester');

  // Ensure we are online
  await page.context().setOffline(false);

  // Create and complete a job so there's data for the month
  await page.fill('input[placeholder="Client Name"]', 'Export Client');
  await page.fill('input[placeholder="Client Phone Number"]', '0123456789');
  await page.fill('input[placeholder="Client Email Address"]', 'export@example.com');
  await page.fill('input[placeholder="Client Address"]', '42 Export Ave');
  await page.fill('textarea[placeholder="Job Description / Call Out Reason"]', 'Export job');
  await page.click('button:has-text("Start Job")');
  await page.fill('textarea[placeholder="What was done to resolve the issue?"]', 'Done');
  await page.click('button:has-text("End Job")');

  // Verify help modal opens and shows save info
  await page.click('button[title="How saving works"]');
  await expect(page.locator('text=When you export a PDF')).toBeVisible();
  await page.click('button:has-text("Got it")');

  // Click Export Month and wait for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Export Month")')
  ]);

  // Ensure we received a download
  const path = await download.path();
  expect(path).not.toBeNull();
  const suggested = download.suggestedFilename();
  expect(suggested).toMatch(/timesheet-month-\d{4}-\d{1,2}\.pdf/);
});