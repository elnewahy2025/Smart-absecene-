import { test, expect, Page } from '@playwright/test';

const PASSWORD = process.env.EMULATOR_SEED_PASSWORD || '';

async function signIn(page: Page, email: string, query = '') {
  await page.goto(`/${query}`);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto(`/${query}`);
  await page.getByLabel(/البريد|email/i).fill(email).catch(async () => {
    await page.locator('#login-email').fill(email);
  });
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('#login-email')).toHaveCount(0);
}

test.describe('authentication and school isolation', () => {
  test.skip(!PASSWORD, 'EMULATOR_SEED_PASSWORD is not configured');

  test('school admin signs in to their own school and cannot switch schools', async ({ page }) => {
    await signIn(page, 'principal@andalus-school.edu.sa', '?tenant=school-2');

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('school_current_tenant_id')))
      .toBe('school-1');
    expect(await page.locator('header select').count()).toBe(0);
  });

  test('platform owner can see the school switcher', async ({ page }) => {
    await signIn(page, 'owner@smartschool.platform');

    const switcher = page.locator('header select');
    await expect(switcher).toBeVisible();
    const options = await switcher.locator('option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('platform owner can open a different school through the URL', async ({ page }) => {
    await signIn(page, 'owner@smartschool.platform', '?tenant=school-2');

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('school_current_tenant_id')))
      .toBe('school-2');
  });

  test('teacher sees no owner controls', async ({ page }) => {
    await signIn(page, 'fahad.teacher@andalus-school.edu.sa');

    expect(await page.locator('header select').count()).toBe(0);
    await expect(page.getByTitle(/Platform Owner Hub|مركز مالك المنصة/)).toHaveCount(0);
  });
});

test.describe('authenticated shell', () => {
  test.skip(!PASSWORD, 'EMULATOR_SEED_PASSWORD is not configured');

  test('dashboard renders seeded data for the admin', async ({ page }) => {
    await signIn(page, 'principal@andalus-school.edu.sa');
    await expect(page.locator('body')).not.toContainText(/تسجيل الدخول|Sign in/i);
    await expect(page.locator('header')).toBeVisible();
  });
});
