import { test, expect, type Page } from '@playwright/test';

// WelcomeDiscountPopup.astro — scroll-triggered "10% off your first order"
// popup. The backend (revlimiter-license Worker's POST /popup-signup) is
// mocked here: it isn't deployed yet, and even once it is, an E2E suite
// should never mint real Paddle discounts or send real emails on every run.
// These tests only exercise the frontend contract: trigger, submit, and the
// three response shapes the component handles (code / alreadyCustomer / error).

async function primePage(page: Page) {
  // Skip the exit-intent popup's own 15s arm timer stealing the "no dialog
  // open" guard during these tests — irrelevant to what's under test here.
  await page.addInitScript(() => {
    try { sessionStorage.setItem('ra-exit-gas-s', '1'); } catch {}
  });
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
}

async function scrollPastThreshold(page: Page) {
  // Component arms 2s after load, then fires past 35% scroll progress.
  await page.waitForTimeout(2100);
  await page.evaluate(() => {
    const doc = document.documentElement;
    window.scrollTo(0, (doc.scrollHeight - doc.clientHeight) * 0.5);
  });
}

// The site is cross-origin from the license Worker, so every POST the browser
// sends there is preceded by a real CORS preflight (OPTIONS). A route.fulfill
// without CORS response headers gets silently rejected by the browser itself
// (fetch() throws, never reaches .then/.json) — this mirrors what the real
// worker sends back (dlregCors) for both the OPTIONS preflight and the POST.
async function mockPopupSignup(page: Page, body: Record<string, unknown>) {
  await page.route('**/popup-signup', (route) => {
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST',
      'access-control-allow-headers': 'content-type',
    };
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) });
  });
}

test('popup does not appear before the visitor scrolls', async ({ page }) => {
  await primePage(page);
  await page.waitForTimeout(2100);
  await expect(page.locator('[data-welcome10]')).not.toBeVisible();
});

test('popup appears after scrolling past the threshold', async ({ page }) => {
  await primePage(page);
  await scrollPastThreshold(page);
  await expect(page.locator('[data-welcome10]')).toBeVisible();
});

test('close button dismisses the popup and sets the cooldown', async ({ page }) => {
  await primePage(page);
  await scrollPastThreshold(page);
  const modal = page.locator('[data-welcome10]');
  await expect(modal).toBeVisible();
  await page.locator('[data-wd-close]').first().click();
  await expect(modal).not.toBeVisible();
  // dialog.close() queues its 'close' event as a task rather than firing it
  // synchronously, so poll rather than reading localStorage right away.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ra-welcome10'))).toBeTruthy();
  const cooldown = await page.evaluate(() => localStorage.getItem('ra-welcome10'));
  expect(cooldown).not.toBe('got');
});

test('a previously-dismissed visitor within the cooldown never sees it again', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('ra-welcome10', String(Date.now())); } catch {}
  });
  await primePage(page);
  await scrollPastThreshold(page);
  await expect(page.locator('[data-welcome10]')).not.toBeVisible();
});

test('submitting a valid email shows the claimed code', async ({ page }) => {
  await mockPopupSignup(page, { ok: true, code: 'WELCOME7X9K2M' });
  await primePage(page);
  await scrollPastThreshold(page);
  await page.locator('#wd-email').fill('lead@example.com');
  await page.locator('[data-wd-form] .wd-cta').click();
  await expect(page.locator('[data-wd-success]')).toBeVisible();
  await expect(page.locator('[data-wd-code]')).toHaveText('WELCOME7X9K2M');
  const claimed = await page.evaluate(() => localStorage.getItem('ra-welcome10'));
  expect(claimed).toBe('got');
});

test('an existing customer sees a thank-you message, not a code', async ({ page }) => {
  await mockPopupSignup(page, { ok: true, alreadyCustomer: true });
  await primePage(page);
  await scrollPastThreshold(page);
  await page.locator('#wd-email').fill('buyer@example.com');
  await page.locator('[data-wd-form] .wd-cta').click();
  await expect(page.locator('[data-wd-success]')).toBeVisible();
  await expect(page.locator('[data-wd-success] h2')).toHaveText('Already one of ours');
  await expect(page.locator('[data-wd-code]')).toHaveCount(0);
  const claimed = await page.evaluate(() => localStorage.getItem('ra-welcome10'));
  expect(claimed).toBe('customer');
});

test('a backend error is shown inline and the form stays usable', async ({ page }) => {
  await mockPopupSignup(page, { ok: false, error: "Couldn't generate your code. Please try again in a minute." });
  await primePage(page);
  await scrollPastThreshold(page);
  await page.locator('#wd-email').fill('lead@example.com');
  await page.locator('[data-wd-form] .wd-cta').click();
  await expect(page.locator('.wd-status')).toBeVisible();
  await expect(page.locator('.wd-status')).toHaveText("Couldn't generate your code. Please try again in a minute.");
  await expect(page.locator('[data-wd-success]')).toBeHidden();
  await expect(page.locator('[data-wd-form]')).toBeVisible();
});

test('shows a generating state while the request is in flight, and resets it on error', async ({ page }) => {
  // The worker does a real customer-lookup scan (and, for a new lead, a live
  // Paddle call + email send) before answering, which can take a few real
  // seconds — this delay stands in for that so the loading state is
  // observable rather than racing past in a headless browser.
  await page.route('**/popup-signup', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type' } });
    }
    await new Promise((r) => setTimeout(r, 600));
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ ok: false, error: 'boom' }),
    });
  });
  await primePage(page);
  await scrollPastThreshold(page);
  const cta = page.locator('[data-wd-form] .wd-cta');
  const emailInput = page.locator('#wd-email');
  await emailInput.fill('lead@example.com');
  await cta.click();

  await expect(cta).toBeDisabled();
  await expect(cta).toHaveClass(/loading/);
  await expect(cta.locator('.wd-btn-label')).toHaveText('Generating…');
  await expect(emailInput).toBeDisabled();

  await expect(page.locator('.wd-status')).toBeVisible();
  await expect(cta).toBeEnabled();
  await expect(cta).not.toHaveClass(/loading/);
  await expect(cta.locator('.wd-btn-label')).toHaveText('Claim my code');
  await expect(emailInput).toBeEnabled();
});

test('never stacks on top of an already-open dialog', async ({ page }) => {
  await primePage(page);
  // Force a different dialog (the newsletter subscribe modal) open before the
  // scroll trigger would fire, and confirm the popup stays closed underneath it.
  await page.evaluate(() => {
    (document.querySelector('.sub-modal') as HTMLDialogElement | null)?.showModal();
  });
  await scrollPastThreshold(page);
  await expect(page.locator('[data-welcome10]')).not.toBeVisible();
});
