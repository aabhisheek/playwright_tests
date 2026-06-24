const { test, expect } = require('@playwright/test');


//npx playwright test,

//  npx playwright show-report  

// npx playwright test tests/google.spec.js

//npx playwright test tests/login.spec.js

//npx playwright test --headed

// test('My First Test', async ({ page }) => {
//     // Test steps here
// });

// test('My Second Test', async ({ page }) => {
//     // Test steps here
// });

// test('My Third Test', async ({ page }) => {
//     // Test steps here
// });



test("My First Test", async function({ page }) {
    expect(12).toBe(12);
});

test("My Second Test", async function({ page }) {
    expect(100).toBe(101);
});

test("My Third Test", async function({ page }) {
    expect(2.0).toBe(2.0);
    expect(truth).toBeTruthy();
});

test.only("My Fourth Test", async function({ page }) {
    expect("Hello, World!").toContain("World");
    // expect(truth).toBeFalsy();
});
 