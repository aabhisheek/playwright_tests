const { test, expect } = require("@playwright/test");

test("errorMessage", async function ({ page }) {

    await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { timeout: 60000 });

    await page.getByPlaceholder("Username").type("Admin", { delay: 100 });

    await page.locator("input[name='password']").type("admin123  12", { delay: 100 });

    await page.locator("//button[@type='submit']").click();

    await page.waitForTimeout(5000);

    await expect(
    page.getByText('Invalid credentials', { exact: true })
).toBeVisible();


});





