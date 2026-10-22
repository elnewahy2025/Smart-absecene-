import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const env = fs.readFileSync('.env','utf8');
const password = env.match(/^EMULATOR_SEED_PASSWORD=(.*)$/m)?.[1]?.trim();
const browser = await chromium.launch();
const context = await browser.newContext(); const page = await context.newPage();
await page.goto('http://127.0.0.1:5051/');
await page.evaluate(()=>localStorage.clear());
await page.goto('http://127.0.0.1:5051/');
await page.locator('#login-email').fill('principal@andalus-school.edu.sa');
await page.locator('#login-password').fill(password);
await page.locator('form button[type="submit"]').click();
await page.locator('#login-email').waitFor({state:'detached'});
await page.locator('header').waitFor();
const results = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
for (const v of results.violations) {
  console.log('VIOLATION', v.id, v.impact, v.help);
  for (const n of v.nodes) {
    console.log('TARGET', JSON.stringify(n.target), 'HTML', n.html.slice(0,300), 'SUMMARY', n.failureSummary?.replace(/\n/g,' | '));
  }
}
await browser.close();
