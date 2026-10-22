import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PASSWORD = process.env.EMULATOR_SEED_PASSWORD || '';

async function signIn(page: Page, email: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('#login-email')).toHaveCount(0);
}

test.describe('accessibility baseline', () => {
  test.skip(!PASSWORD, 'EMULATOR_SEED_PASSWORD is not configured');

  test('login page has no critical axe violations', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page.locator('#login-email')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    test.info().attach('axe-login.json', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, JSON.stringify(critical.map((v) => v.id))).toEqual([]);
  });

  test('dashboard has no critical axe violations', async ({ page }) => {
    await signIn(page, 'principal@andalus-school.edu.sa');
    await expect(page.locator('header')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    test.info().attach('axe-dashboard.json', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    const critical = results.violations.filter((v) => v.impact === 'critical');
    console.log(
      'AXE_DASHBOARD',
      JSON.stringify(
        results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          targets: v.nodes.slice(0, 3).map((n) => n.target),
        }))
      )
    );
    expect(critical, JSON.stringify(critical.map((v) => v.id))).toEqual([]);
  });
});
