import { test } from '@playwright/test';
import { readFileSync } from 'fs';
import { autoFill } from './lib/aiFormFiller.js';

const profile = JSON.parse(readFileSync('tests/data/profile.json', 'utf-8'));

// LinkedIn renders the jobs UI inside an iframe.
const frame = (page) => page.locator('[data-testid="interop-iframe"]').contentFrame();

test('linkedin easy apply (AI-driven)', async ({ page }) => {
  test.setTimeout(2000);

  // --- Login ---
  await page.goto('https://www.linkedin.com/');
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email or phone' }).fill('anand.abhishekcorponizers@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('6591@Kiit');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');

  // --- Navigate to recommended jobs ---
  await page.getByRole('link', { name: /Jobs/ }).click();
  await page.getByRole('link', { name: 'Show all top job picks for you' }).click();

  const f = frame(page);
  await f.locator('.job-card-container').first().click();
  await f.getByRole('button', { name: /Easy Apply/ }).click();

  const jobContext = await f.locator('.jobs-details__main-content').innerText().catch(() => '');

  // --- Walk the multi-step Easy Apply modal ---
  for (let step = 0; step < 8; step++) {
    const answers = await autoFill(f, { profile, jobContext });
    console.log(`Step ${step}: filled ${answers.length} field(s)`);

    const submit = f.getByRole('button', { name: 'Submit application' });
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      break;
    }

    const review = f.getByRole('button', { name: 'Review your application' });
    const next   = f.getByRole('button', { name: 'Continue to next step' });
    if      (await review.isVisible().catch(() => false)) await review.click();
    else if (await next.isVisible().catch(() => false))   await next.click();
    else break;
  }

  await f.getByRole('button', { name: 'Dismiss' }).click().catch(() => {});
});
