const { test, expect } = require("@playwright/test");

test("Valid Login", async function ({ page }) {

    await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { timeout: 60000 });

    await page.getByPlaceholder("Username").type("Admin", { delay: 100 });

    await page.locator("input[name='password']").type("admin123", { delay: 100 });

    await page.locator("//button[@type='submit']").click();

    await page.waitForTimeout(5000);

    await expect(page).toHaveURL(/dashboard/);

    await page.getByAltText("profile picture").first().click();
    //there were two elements with profile picture as alt text, so we used first() to click on the first one

    await page.getByText("Logout").click();

    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/login/);

});





