import { test, expect } from '@playwright/test';

// Return leg of the trial gate (verify-email link) on a PHONE. Until 2026-09-06
// the download buttons were hidden on coarse-pointer devices; Dan wants phones
// to download too (save + move to a computer). Both buttons must stay live,
// the desktop-installer note shows on touch only.
const RETURN_URL = '/gas#dl=test-token&p=gas';

test.describe('trial gate return leg on a phone', () => {
  // Chromium only (see playwright.config) — iPhone viewport + touch, which is
  // what flips (pointer: coarse) in the modal.
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('download buttons are visible on a touch device', async ({ page }) => {
    await page.goto(RETURN_URL);
    const modal = page.locator('[data-tg-modal]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-tg-dl="mac"]')).toBeVisible();
    await expect(page.locator('[data-tg-dl="win"]')).toBeVisible();
    await expect(page.locator('[data-tg-mobile]')).toBeVisible();
    await expect(page.locator('[data-tg-sub]')).toContainText('Pick your platform');
  });
});

test.describe('trial gate return leg on desktop', () => {
  test('download buttons visible, mobile note hidden', async ({ page }) => {
    await page.goto(RETURN_URL);
    await expect(page.locator('[data-tg-dl="mac"]')).toBeVisible();
    await expect(page.locator('[data-tg-dl="win"]')).toBeVisible();
    await expect(page.locator('[data-tg-mobile]')).toBeHidden();
  });
});
