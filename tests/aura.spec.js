import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

const clientData = JSON.parse(readFileSync('tests/data/clientData2.json', 'utf-8'));

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

async function selectDOB(page, { year, month, day }) {
  await page.getByRole('img', { name: '...' }).click();
  const picker = page.locator('#ui-datepicker-div');
  await picker.getByRole('combobox').selectOption(String(year));
  const monthText = await picker.locator('.ui-datepicker-month').innerText();
  const currentMonth = MONTHS.indexOf(monthText) + 1;
  const steps = month - currentMonth;
  for (let i = 0; i < steps; i++) {
    await page.getByTitle('Next').click();
  }
  await page.getByRole('link', { name: String(day), exact: true }).click();
}

test('test', async ({ page }) => {
  await page.goto('https://internaltrunkcore.auracloud.com/login.0');
  await page.waitForLoadState('networkidle');
  const username = page.locator('input[name="oAuthContainer:username"]');
  await username.waitFor({ state: 'visible' });
await expect(username).toBeEditable();

await username.click();

// Verify it really has focus
await expect(username).toBeFocused();
await page.waitForTimeout(200);
await username.type(clientData.username, { delay: 100 });
  await page.waitForTimeout(200);
  console.log(await username.inputValue());
  await expect(username).toHaveValue(clientData.username);
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill(clientData.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.locator('#MainMenuArrow').click();
  await page.getByRole('link', { name: 'CRM' }).click();
  await page.getByText('Clients').click();
  await page.getByRole('link', { name: 'Maintain' }).click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('[name="view:content:innerForm:personInputPanel:inner:firstName"]').click();
  await page.locator('[name="view:content:innerForm:personInputPanel:inner:firstName"]').type(clientData.firstName);
  await page.locator('[name="view:content:innerForm:personInputPanel:inner:lastName"]').click();
  await page.locator('[name="view:content:innerForm:personInputPanel:inner:lastName"]').type(clientData.lastName);
  await page.locator('select[name="view:content:innerForm:personInputPanel:inner:gender"]').selectOption(clientData.gender);
  await selectDOB(page, clientData.dob);
  await page.locator('select[name="view:content:innerForm:personInputPanel:inner:language"]').selectOption(clientData.language);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('[name="view:content:inner:citizenCountry"]').selectOption(clientData.citizenCountry);
  await page.locator('[name="view:content:inner:domicileCountry"]').selectOption(clientData.domicileCountry);
  await page.locator('input[name="view:content:inner:SSN"]').click();
  await page.waitForTimeout(200);
  await page.locator('input[name="view:content:inner:SSN"]').fill(clientData.ssn);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await  page.locator('[name="view:content:container:inputPanel:innerForm:customList:0:integerComponentId"]').click();
  await page.locator('[name="view:content:container:inputPanel:innerForm:customList:0:integerComponentId"]').fill('2');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('[name="view:content:innerForm:customList:0:integerComponentId"]').click();
  await page.locator('[name="view:content:innerForm:customList:0:integerComponentId"]').fill('2');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Finish' }).click();


  //from here we  start due diligence from a diff account than logged in here
  //so we redirect to login page and login with another account
  await page.goto('https://internaltrunkcore.auracloud.com/login.0');
  await page.getByRole('textbox', { name: 'User name' }).click();
  await page.getByRole('textbox', { name: 'User name' }).fill('anshu');
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
  await page.locator('span').filter({ hasText: 'Add' }).first().click();
  await page.getByRole('img', { name: '...' }).first().click();
  await page.getByRole('img', { name: '...' }).nth(1).click();
  await page.getByRole('link', { name: '24' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('link', { name: 'Status' }).click();
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('combobox').selectOption('APPROVED');
  await page.getByRole('button', { name: 'Save' }).click();
});
