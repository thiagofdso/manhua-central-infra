import { test, expect } from '@playwright/test';

test.describe('End-to-End Canonical Catalog Browsing and Search Flow', () => {
  test('should browse catalog, search, filter by domain, and inspect manhua details', async ({ page }) => {
    // 1. Open Catalog page
    await page.goto('/catalog');
    await expect(page).toHaveURL(/.*catalog/);

    // Verify main header
    await expect(page.locator('h1')).toContainText('Catálogo Canônico Global');

    // Wait for manhua cards to load
    await expect(page.locator('h3').first()).toBeVisible({ timeout: 10000 });

    // 2. Filter by Domain (RavenScans)
    await page.click('button:has-text("RavenScans")');
    await page.waitForTimeout(500);

    // Should display RavenScans titles
    await expect(page.getByRole('heading', { name: 'Return of the Mount Hua Sect' })).toBeVisible();

    // 3. Search by Text
    const searchInput = page.locator('input[placeholder*="Pesquisar"]');
    await page.click('button:has-text("Todos")'); // Reset to all domains
    await searchInput.fill('Overgeared');
    await page.waitForTimeout(500);

    // Overgeared should be displayed
    await expect(page.locator('h3:has-text("Overgeared")')).toBeVisible();

    // 4. Navigate to Details
    await page.click('a:has-text("Detalhes")');
    await page.waitForURL('**/catalog/overgeared', { timeout: 10000 });

    // Verify detail page elements
    await expect(page.locator('h1')).toContainText('Overgeared');
    await expect(page.locator('text=Score Bayesiano')).toBeVisible();
    await expect(page.locator('text=Último Capítulo')).toBeVisible();
    await expect(page.locator('text=Capítulos Disponíveis')).toBeVisible();
    await expect(page.locator('text=Cap. 1').first()).toBeVisible();

    // 5. Add to Library button interaction
    const addBtn = page.locator('button:has-text("+ Adicionar à Biblioteca")');
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await expect(page.locator('button:has-text("Na Minha Biblioteca")')).toBeVisible();

    // 6. Return to Catalog
    await page.click('text=Voltar ao Catálogo');
    await page.waitForURL('**/catalog', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Catálogo Canônico Global');
  });
});
