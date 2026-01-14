import { test, expect } from '@playwright/test';

// This test simulates going offline, creating/ending a job, and then syncing when back online.
test('offline job is pending and sync clears pending', async ({ page }) => {
  // Ensure app is reachable
  await page.goto('/');

  // Login
  await page.fill('input[placeholder="Your Name"]', 'Tester');
  await page.click('button:has-text("Login")');
  await expect(page.locator('text=Technician:')).toContainText('Tester');

  // Ensure we are online then go offline before starting the job
  await page.context().setOffline(true);

  // Clock in for day (if not already)
  const clockInBtn = page.locator('button:has-text("Clock In for Day")');
  if (await clockInBtn.count() > 0) {
    await clockInBtn.click();
  }

  // Fill job details
  await page.fill('input[placeholder="Client Name"]', 'Offline Client');
  await page.fill('input[placeholder="Client Phone Number"]', '0123456789');
  await page.fill('input[placeholder="Client Address"]', '123 Test St');
  await page.fill('textarea[placeholder="Job Description / Call Out Reason"]', 'Test offline job');

  // Start job
  await page.click('button:has-text("Start Job")');
  await expect(page.locator('text=Client:')).toBeVisible();

  // End job while offline - we must provide a resolution
  await page.fill('textarea[placeholder="What was done to resolve the issue?"]', 'Fixed offline');
  await page.click('button:has-text("End Job")');

  // Verify pending sync count increased
  const pending = page.locator('text=Pending syncs:').locator('..').locator('span.font-semibold');
  await expect(pending).toHaveText(/^[0-9]+$/);
  const pendingCountText = await pending.innerText();
  expect(parseInt(pendingCountText, 10)).toBeGreaterThan(0);

  // Check localStorage job has synced:false
  const jobs = await page.evaluate(() => JSON.parse(localStorage.getItem('jobs') || '[]'));
  expect(jobs.length).toBeGreaterThan(0);
  expect(jobs[jobs.length - 1].synced).toBe(false);

  // Now simulate coming back online and click 'Sync Now'
  await page.context().setOffline(false);
  await page.click('button:has-text("Sync Now")');

  // After sync, pending should be 0
  await expect(pending).toHaveText('0');

  // And localStorage jobs should be marked synced
  const jobsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('jobs') || '[]'));
  expect(jobsAfter[jobsAfter.length - 1].synced).toBe(true);

  // Verify server received the job
  const res = await page.request.get('http://localhost:4000/api/jobs', { headers: { 'x-api-key': process.env.SERVER_API_KEY || 'dev-key' } });
  expect(res.ok()).toBeTruthy();
  const serverJobs = await res.json();
  expect(serverJobs.length).toBeGreaterThan(0);
  const found = serverJobs.find(j => j.client === 'Offline Client');
  expect(found).toBeTruthy();
});