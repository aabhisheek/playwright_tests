const { test, expect } = require('@playwright/test');

test("Verify Application URL", async ({ page }) => {
    await page.goto("https://google.com");

    const url = page.url();   // page.url() is synchronous
    console.log("URL is " + url);

    await expect(page).toHaveURL("https://www.google.com/");
});




