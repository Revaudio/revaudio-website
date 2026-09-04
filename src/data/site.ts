/**
 * Site-wide config. One place for the small operational knobs.
 */

export const site = {
  /**
   * Which engine the cart's Checkout button drives.
   * 'ls'         — Lemon Squeezy hosted-overlay checkout (plugins.ts checkoutUrl).
   *                Dormant since the 2026-08-31 Paddle cutover; kept as an
   *                instant rollback (flip this value back, nothing else to undo).
   * 'fastspring' — FastSpring SBL popup (plugins.ts fastspringPath). Dormant —
   *                superseded by the Paddle migration before this ever went live.
   * 'paddle'     — Paddle Billing overlay checkout (plugins.ts paddlePriceId,
   *                site.paddle below). LIVE as of 2026-08-31. On
   *                checkout.completed, redirects to site.paddle.purchaseUrl
   *                with ?_ptxn=<transaction id> — the revlimiter-license
   *                worker's /purchase page picks up from there (mints/emails
   *                license keys via its own webhook, entirely separate from
   *                this redirect).
   */
  checkoutEngine: 'paddle' as 'ls' | 'fastspring' | 'paddle',

  /**
   * Paddle Billing (see checkoutEngine above).
   * `clientToken` is the PUBLIC client-side token (Paddle → Developer tools →
   * Authentication → Client-side tokens) — safe to ship in browser JS, that's
   * its whole purpose, unlike the secret API key the license worker uses.
   * `purchaseUrl` is the license worker's post-purchase downloads page.
   */
  paddle: {
    clientToken: 'live_a9cf17fde62d1195468c886f910',
    purchaseUrl: 'https://revlimiter-license.revaudio.workers.dev/purchase',
  },

  /**
   * Google Ads PURCHASE conversion (fired by Cart.astro on Checkout.Success).
   * GO-LIVE: Google Ads → Tools → Conversions → New conversion action →
   * Website → category "Purchase", then paste the full send_to value here,
   * e.g. 'AW-18334323184/AbCdEfGhIjK'. While empty, no purchase conversion
   * fires — the trial-start conversions (TrialGateModal / TrialStamp /
   * TrialPlates) are separate actions and unaffected. Only ever fires when
   * the visitor accepted cookies (window.gtag exists).
   */
  gadsPurchaseSendTo: 'AW-18334323184/dnFDCP3mxOIcEPCjvqZE',

  /**
   * Cloudflare Web Analytics beacon token (free, cookieless, privacy-friendly).
   * How to get it: Cloudflare dashboard → Analytics & Logs → Web Analytics →
   * "Add a site" → enter revaudio.net → copy the token from the JS snippet
   * (the value of `"token": "..."`). Paste it below.
   *
   * The beacon token is public by design (it ships in the page), so committing
   * it here is fine. While this is empty, NO analytics script loads. Analytics
   * also only loads in production builds, never in `astro dev`.
   */
  cfBeaconToken: '5d066ad6e2f04d18b87dafcbcb5e8d33',

  /**
   * Formspree endpoint for newsletter capture (bottom EmailCapture section +
   * the hero subscribe modal). GO-LIVE: create a free form at
   * https://formspree.io and replace the REPLACE_WITH_FORM_ID token. While the
   * token is in place, forms show an honest "goes live shortly" notice and
   * never pretend to capture.
   */
  formspreeEndpoint: 'https://formspree.io/f/maqzlgwa',

  /**
   * RevLimiter Beta feedback form (src/pages/beta.astro). The form POSTs each
   * response to a Cloudflare Worker (revlimiter-beta) that stores it in D1 — a
   * separate worker from the license service. The URL is public by design (it
   * ships in the page); the worker re-validates the beta code + survey version,
   * and reads are gated behind a separate admin token the worker never exposes.
   *
   * GO-LIVE: deploy the worker (see ~/projects/revaudio/revbeta-dashboard/worker/),
   * then paste its `/submit` URL below. While `workerUrl` is empty the form shows
   * an honest "opens shortly" notice and never pretends to capture.
   *
   * `betaAccessCode`: shared code printed in the invite email; the form checks it
   * client-side AND the worker re-checks it server-side. '' disables the gate
   * (keep it in sync with the worker's BETA_CODE var).
   */
  betaFeedback: {
    workerUrl: 'https://revlimiter-beta.revaudio.workers.dev/submit',
    betaAccessCode: 'REVBETA',
  },

  /**
   * Affiliate Program application form (src/pages/affiliate.astro). Separate
   * Formspree form from the newsletter one — different data, different
   * destination. GO-LIVE: create a free form at https://formspree.io (log in
   * with / add info@revaudio.net as a notification recipient, since that's
   * where applications need manual review), then replace the
   * REPLACE_WITH_FORM_ID token below. While the token is in place, the form
   * shows an honest "applications open shortly" notice and never pretends to
   * capture.
   */
  affiliateFormEndpoint: 'https://formspree.io/f/mykrwolg',

  /**
   * Download email gate — the license worker behind every download popup on
   * the site (TrialGateModal triggers in BuyButton / BuyButtonCrane /
   * CraneDropZone / MobileBuyBar / PluginCard / ExitIntentPopup; TrialPlates
   * derives the same endpoint from plugin.trialUrl). Popups POST
   * {email, plugin} to `workerUrl`/download/register (CORS-allowed for
   * revaudio.net + localhost); the worker emails a verify link that unlocks
   * the download. `portalUrl` is the no-JS/new-tab fallback target.
   */
  downloadGate: {
    workerUrl: 'https://revlimiter-license.revaudio.workers.dev',
    portalUrl: 'https://revlimiter-license.revaudio.workers.dev/download',
  },

  // Same `downloadGate.workerUrl` above also serves WelcomeDiscountPopup.astro's
  // POST `${workerUrl}/popup-signup` (the scroll-triggered "10% off your first
  // order" popup) — no separate config needed, it's the same license Worker.
};
