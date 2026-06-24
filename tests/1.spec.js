import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  //from here we  start due diligence from a diff account than logged in here
  //so we redirect to login page and login with another account
  await page.goto('https://internaltrunkcore.auracloud.com/login.0');
  await page.getByRole('textbox', { name: 'User name' }).click();
  await page.waitForTimeout(200);
  await page.getByRole('textbox', { name: 'User name' }).type('anshu');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('6591@Kiit');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByText('Main').click();
  await page.getByRole('link', { name: 'CRM' }).click();
  await page.getByText('Due diligence').click();
  await page.getByRole('link', { name: 'Person' }).click();
  await page.getByRole('textbox', { name: 'Search...' }).click();
  await page.getByRole('textbox', { name: 'Search...' }).fill('a');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByText('ansh1234 jh').click();
  await page.getByRole('link', { name: 'Verification' }).click();
await page
  .locator('.tabpanel', {
    has: page.getByText('Employment', { exact: true })
  })
  .getByRole('button', { name: 'Add' })
  .click();
  await page.getByRole('img', { name: '...' }).first().click();
  await page.getByRole('img', { name: '...' }).nth(1).click();
  await page.getByRole('link', { name: '24' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('link', { name: 'Status' }).click();
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('combobox').selectOption('APPROVED');
  await page.getByRole('button', { name: 'Save' }).click();
});