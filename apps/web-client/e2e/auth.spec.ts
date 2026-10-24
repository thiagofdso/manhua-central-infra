import { test, expect } from '@playwright/test';

test.describe('End-to-End Authentication and Account Deletion Flow', () => {
  const uniqueId = Date.now();
  const testUser = {
    displayName: `E2E Tester ${uniqueId}`,
    email: `e2e_${uniqueId}@example.com`,
    password: 'Password123!'
  };

  test('should complete registration -> logout -> login -> profile -> account deletion', async ({ page }) => {
    // 1. Navigate to Register
    await page.goto('/register');
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('input[name="displayName"]', testUser.displayName);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Submit registration
    await page.click('button[type="submit"]');

    // Should redirect to /profile
    await page.waitForURL('**/profile', { timeout: 10000 });
    await expect(page.locator('h2')).toContainText(testUser.displayName);
    await expect(page.locator('p')).toContainText(testUser.email);

    // 2. Logout
    await page.click('text="Sair da Conta"');
    await page.waitForURL('**/login', { timeout: 10000 });

    // 3. Login
    const emailInput = page.locator('input[name="email"]');
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill(testUser.email);
    await expect(emailInput).toHaveValue(testUser.email);

    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill(testUser.password);
    await expect(passwordInput).toHaveValue(testUser.password);

    await page.click('button[type="submit"]');

    // Should redirect to /profile
    await page.waitForURL('**/profile', { timeout: 10000 });
    await expect(page.locator('h2')).toContainText(testUser.displayName);

    // 4. Account Deletion (Google Play Compliance)
    await page.click('#btnDeleteAccount');

    // Modal should be visible
    await expect(page.locator('#btnConfirmDelete')).toBeVisible();

    // Confirm Deletion
    await page.click('#btnConfirmDelete');

    // Should redirect to /login after permanent account wipeout
    await page.waitForURL('**/login', { timeout: 10000 });

    // 5. Verify deleted credentials cannot log in
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('text="Email ou senha inválidos"')).toBeVisible({ timeout: 5000 });
  });
});
