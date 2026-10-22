import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.EMULATOR_SEED_PASSWORD || 'FiazjEUvaWJhD26HZTR9bESu';

test.describe('E2E Attendance Workflow — Teacher Lifecycle', () => {

  test('1. Teacher logs in, reviews assigned session, applies quick-mark present, and submits session', async ({ page }) => {
    await page.goto('/');

    // 1. Sign in as teacher
    await page.fill('input[type="email"]', 'fahad.teacher@andalus-school.edu.sa');
    await page.fill('input[type="password"]', SEED_PASSWORD);
    await page.click('button[type="submit"]');

    // Verify teacher lands on Daily Attendance Sessions
    await expect(
      page.locator('text=كشوف الحضور والغياب اليومية').or(page.locator('text=Daily Attendance Sessions')).first()
    ).toBeVisible({ timeout: 15000 });

    // 2. Verify Session overview header is present
    await expect(page.getByRole('heading', { name: /كشف الحضور الصباحي|Morning Attendance Session/i })).toBeVisible();

    // 3. Trigger Quick Mark dropdown if session is editable
    const quickMarkBtn = page.getByRole('button', { name: /التحضير السريع الذكي|Quick Mark/i });
    if (await quickMarkBtn.isVisible()) {
      await quickMarkBtn.click();
      const markWholeClass = page.locator('text=تعيين كامل الفصل حاضر').or(page.locator('text=Mark Whole Class Present'));
      await expect(markWholeClass).toBeVisible();
      await markWholeClass.click();

      // Banner should confirm quick mark
      await expect(page.locator('text=تم تفعيل التحضير السريع').or(page.locator('text=Quick Mark applied'))).toBeVisible();
    }

    // 4. Submit & Confirm attendance session
    const submitBtn = page.getByRole('button', { name: /تأكيد واعتماد الكشف نهائياً|Submit & Confirm/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Verify session transitions to locked / submitted state
      await expect(
        page.locator('text=معتمد ومرسل رسميًا').or(page.locator('text=كشف مقفل ومحمي من التعديل العشوائي')).first()
      ).toBeVisible({ timeout: 10000 });
    } else {
      // Session was already submitted, verify locked state indicator is displayed
      await expect(
        page.locator('text=كشف مقفل ومحمي من التعديل العشوائي').or(page.locator('text=Locked & Immutable'))
      ).toBeVisible();
    }
  });

  test('2. Role-based edit restrictions prevent unauthorized modifications to submitted sessions', async ({ page }) => {
    await page.goto('/');

    // Sign in as teacher
    await page.fill('input[type="email"]', 'fahad.teacher@andalus-school.edu.sa');
    await page.fill('input[type="password"]', SEED_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=كشوف الحضور والغياب اليومية').or(page.locator('text=Daily Attendance Sessions')).first()
    ).toBeVisible({ timeout: 15000 });

    // If session is locked, teachers must not see the 'إعادة فتح الكشف للتصحيح' (Reopen) button
    const reopenButton = page.getByRole('button', { name: /إعادة فتح الكشف للتصحيح|Reopen with Audit/i });
    await expect(reopenButton).not.toBeVisible();
  });

});
