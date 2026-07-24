# Website handoff

Updated: 2026-07-24 (TEMP PLATES on-page trial live; CSP blocks its fetch — Cloudflare rule edit pending)

## 2026-07-24 — BLOCKER: edge CSP blocks the on-page trial capture (and the Google Ads tag)
TEMP PLATES (#trial on product pages, `5c14c14` + `ba183a3`) POSTs the license worker's
`/download/register` cross-origin. Worker-side CORS is deployed & verified (DLREG_CORS,
version 64e6b84b), BUT the edge Cloudflare CSP (Rules → Transform Rules → Modify Response
Header, "Security Headers" — same rule as the 2026-07-19 Formspree fix) blocks the browser
fetch first: `connect-src` lacks the worker origin. Live behavior today: every submit shows
the graceful fallback ("open the download page instead") — nothing broken, but the plate
never stamps. Console also shows `script-src` blocking `googletagmanager.com/gtag/js`, so
the AW-18334323184 Ads conversion tag has never loaded on this page.
**Fix (dashboard, zone write needed — wrangler OAuth here is zone:read only):**
- `connect-src` add: `https://revlimiter-license.revaudio.workers.dev https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com`
- `script-src` add: `https://www.googletagmanager.com`
Then cache-bust re-test a real submit on https://revaudio.net/revlimiter#trial (expect
screws + PLATES ISSUED stamp, verification email via Resend).

## 2026-07-20 (evening) — Hero: hanging STORE sign SHIPPED & LIVE (4e281b8 + 78196fc)
- Gauge removed from hero. Replaced by a hanging wooden STORE sign off the LEFT edge:
  Higgsfield nano_banana_pro 2k true-alpha asset (bg-removed, green-despilled), sliced into
  `src/assets/hero/sign-beam.png` (static) + `sign-hanger.png` (swings: sway/click-kick/hover,
  links /store). Slice geometry + pivot documented in index.astro comments. Kick must stay ≤6°
  (seam overlap limit). Desktop/tablet only — hidden ≤860px per Dan. Hero↔showcase divider
  removed (scoped; global .hero border untouched elsewhere). Live bundle verified on revaudio.net.
- Local mockup bench `/signlab` (git-excluded) holds the approved CSS mockup lineage.
- NOTE: this session pushed around ANOTHER session's uncommitted enginebg WIP in this same
  worktree (BaseLayout/global.css/src/lib/enginebg.ts/public/bg/*) — those files untouched.


## 2026-07-20 — Plugin carousel "showroom polish" (pushed, live)
Six upgrades to `PluginShowcase.astro` only (spec + plan in `docs/superpowers/`):
- Peeks: blur killed → `saturate(0.55) brightness(0.7)`, legible side cards; hover brightens.
- Brass-trimmed frame: border-box gradient edge + CSS texture + `::before` glow — NO new DOM/assets; bench coords untouched, `/_cardbench` parity holds.
- Switch: 0.4s overshoot spring (`cubic-bezier(0.34,1.3,0.35,1)`).
- Arrows: brighter at rest + one-time glint via IntersectionObserver (skipped reduced-motion).
- Auto-advance: 6s, in-view only, hover pause, dies PERMANENTLY on first interaction, aria-live silent on auto (`go(target, announceChange)`).
- Height-aware `fit()`: measures `.site-nav`/`.sc-heading`/`.sc-dots` (site has NO `<header>` tag — don't `querySelector('header')`); also resets `scaler.style.height='auto'` before measuring — REQUIRED, removing it re-triggers a flex feedback loop that shrinks the stage across refits.
- Emblems (`.sc-emblem` + drift/ac/rev icon imports) removed as dead code.

## 2026-07-20 — Checkout/bundle review done (response to checkout-bundle-handoff.md)
Full verified review + ranked recommendation in **`tasks/checkout-bundle-review.md`**. TL;DR:
- **Now:** stay on Lemon Squeezy; implement GAS-free-bundle via the EXISTING `revlimiter-license`
  Worker (the brief's "no backend exists" premise was wrong) — cart passes
  `checkout[custom][gas_bundle]=1`, webhook grants GAS in the same branded key email. No second
  checkout, no new infra.
- **Later (trigger = second paid plugin live, or LS hard-sunset date):** migrate to **FastSpring**
  (only MoR with confirmed cart + bundles + built-in license fulfillment incl. remote-keygen URL
  + audio-plugin industry base: oeksound, Baby Audio, AudioThing).
- LS is in soft-sunset (Stripe acquisition → Stripe Managed Payments); LS will never ship a cart.
- Open questions for Gil listed in §5 of the review (starts with: why was Paddle dropped —
  evidence says LS just cleared KYC first, not a hard blocker).
Nothing implemented yet — review-only per the brief.

## 2026-07-19 — CSP connect-src fixed, forms POST successfully; email delivery still unconfirmed
Gil added `https://formspree.io` to the `connect-src` directive in the Cloudflare Transform Rule
("Security Headers", Rules → Transform Rules → Modify Response Header). Verified via curl
(cache-busted) that the edge now serves the updated CSP, then re-tested both forms end-to-end in
a real browser tab (had to cache-bust the tab's own load once — the first retry still hit a
pre-fix cached document even though the edge was already updated):
- **Affiliate form**: real UI submission → success message rendered, POST returned `ok:true`.
- **Newsletter form** (`f/maqzlgwa`): same fix covers it (same connect-src rule) — confirmed with
  a direct POST, `ok:true`.
- **BUT: Gil reports no email received yet at info@revaudio.net.** `ok:true` from Formspree's API
  only means the submission was accepted, not that a notification email actually sent. Likely
  cause: Formspree requires a one-time "confirm this form" click (sent to the notification email)
  on a newly created form's first submission before ANY notifications deliver — same behavior
  noted for the newsletter form back on 2026-06-13 ("Formspree sends owner a one-time confirm
  email on the FIRST submission to activate the form"). **Next step: check info@revaudio.net inbox
  + spam for that confirmation email, click it, then re-test.**
- **Cleanup needed regardless:** several test submissions (names like "CSP Fix Verification...")
  landed in both Formspree forms' Submissions tabs during this diagnosis — clear those out so they
  aren't mistaken for real applicants/subscribers.
- New CSP connect-src for reference: `'self' https://api.paddle.com https://*.lemonsqueezy.com
  https://www.facebook.com https://formspree.io`.

## 2026-07-19 — Affiliate Program Formspree endpoint wired (e0f8160, live)
- `site.affiliateFormEndpoint` now points at the real form: `https://formspree.io/f/mykrwolg`
  ("RevAudio Affiliate Applications" form, created by Gil). No longer a placeholder — the form
  will actually submit.
- Also added (a34dbb4): H1 splits "Affiliate" / "Program" across two lines; an optional
  "Other platforms" textarea lets applicants list more than one channel (one per line) instead
  of being limited to a single URL + platform pick.
- Notification recipient confirmed set to info@revaudio.net in Formspree Settings (2026-07-19).
- **BLOCKER found 2026-07-19: real submissions fail with "Failed to fetch"/"Network hiccup" on the
  LIVE site.** Root cause is the edge Cloudflare CSP (Rules → Transform Rules → Modify Response
  Header) — its `connect-src` is `'self' https://api.paddle.com https://*.lemonsqueezy.com
  https://www.facebook.com` and does NOT include `https://formspree.io`, so the browser blocks the
  fetch() before it reaches Formspree at all. Confirmed via `curl -sI https://revaudio.net/affiliate/`
  and reproducing the fetch directly in-page (TypeError: Failed to fetch). Same class of bug as the
  earlier webfonts/YouTube-frame CSP gaps — dashboard-only fix, Wrangler token is zone:read so CLI
  can't touch Transform Rules. **Fix: add `https://formspree.io` to connect-src.**
  **This almost certainly also breaks the newsletter form** (same fetch-to-formspree.io pattern) —
  re-test both once the CSP is fixed.
- STILL TO DO once CSP is fixed: one real test submission on the live site to confirm the email
  actually lands in the info@revaudio.net inbox end-to-end.

## 2026-07-16 — Affiliate Program page (693e2f3, live)
- New `/affiliate` page (nav label "Affiliates" — full "Affiliate Program" kept as page title/H1;
  "Affiliate Program" alone was the widest nav item by 60px+, so shortened to avoid worsening the
  existing 700px-to-~1074px dead zone where the desktop nav has no burger fallback and can overflow —
  that gap pre-dates this change, not fixed here, just not made worse).
- Application form (name, email, channel URL, platform select, audience size, why) POSTs to
  `site.affiliateFormEndpoint` in `src/data/site.ts`.
- Approval flow is manual-review-only by design (matches how Waves/iZotope-style plugin affiliate
  programs work) — no auto-accept path was built.

## 2026-07-14 — RevLimiter free-trial stamp + Driver's Manual video (2c6e166, live)
- New `TrialStamp.astro`: "GET YOUR FREE 14 DAYS TRIAL" on the door's buy-patch asset (B3 night-plate take), L2 hover lamp, press-in → navigates to the license worker `/download`. Mounted in `[slug].astro` between title and door (`.trial-slot` top 25px / left 48.4%, user-placed).
- Position bench ON the real page: open `/revlimiter/#cranep=1&stampedit=1` → drag stamp / arrow-nudge, readout prints paste-ready CSS. Conditional Astro scripts ship VERBATIM — keep that block plain JS (no TS).
- New "Driver's Manual" section between Hear-it and System requirements — data-driven via `plugins.ts` `tutorialVideo` (+ `trialUrl`); youtube-nocookie embed.
- **BLOCKER: the edge Cloudflare CSP (Transform Rules → Modify Response Header) frame-src only allows lemonsqueezy → the video shows a grey broken frame on live. Fix in CF dashboard: add `https://www.youtube-nocookie.com` to frame-src. Wrangler token is zone:read — CLI can't do it.**
- Pre-existing, FYI Gil: `connect.facebook.net/fbevents.js` (Meta pixel) is also CSP-blocked by script-src.
- Design bench kept at `bench/trial-stamp-test.html`.

## 2026-06-18 — RevLimiter checkout LIVE on Lemon Squeezy
- Back on Lemon Squeezy (Paddle plan dropped); store now activated, RevLimiter live.
- `REVLIMITER_CHECKOUT_URL` in `src/data/plugins.ts` = LS LIVE variant `.../checkout/buy/78885904-8a19-4e23-9510-31b50775ada5` (commit e43bcbf). Single source of truth; Cart/BuyButton read it.
- **Bug fixed (875e8d4):** Cart.astro was persisting `checkoutUrl` in localStorage, so a cart that added RevLimiter before the URL swap kept launching the OLD test link → LS orange TEST banner on-site while the direct link was clean. Now Cart bakes a `slug->checkoutUrl` catalog map (`[data-checkout-map]` JSON) and resolves fresh at checkout; never trusts stored URL. URL changes now take effect for everyone on deploy.
- LS test vs live: same `revaudiopg` subdomain + (here) same variant URL — the TEST banner is store-activation-level, not a separate URL. Don't chase "live variant URLs".
- STILL TO VERIFY (user): real test purchase delivers download + license key; LS-generated key must match plugin LicenseManager format `REVL.<b64>.<sig>` or fulfillment breaks despite checkout working. See memory project_revlimiter_lemonsqueezy_migration.


## Shipped today (all live on revaudio.net)
- **Scroll-scrub background system**: fixed `.page-bg` layer behind everything, brass dashboard art
  (`public/bg/aurora-test.webp`, 2048x6144, 106KB) sweeps top-to-bottom with page scroll.
  Logic in `src/lib/pagebg.ts`, wired in BaseLayout. Art width 90vw, side-fade via `.page-bg::after`.
- **Fluid layout**: `--maxw: min(1240px, 98vw)` (was fixed 1200px), nav follows.
- **Hero tuning**: gauge column `min(38vw, 520px)`; redline/lede/cta offsets via
  `--redline-x/--lede-x/--cta-x` defaults (198/92/218px) in index.astro.
- **Plugin section**: heading centered above card, card 730px, status label removed from PluginCard
  ("Checkout reopening soon" no longer shows on cards; product-page pill untouched).
- **Sections**: DAW strip tightened (2.5rem pad, 1.25rem gap, 1.05rem chips); newsletter 6rem pad,
  150px button, **fully transparent** (sits on bg art); footer 1.25/1.75rem.
- **New pages/nav**: `/terms` T&C page (14 sections, industry standard); nav = Home/Store/About/Support/T&C.

## Benches (the big workflow win)
`public/bench/home-bench.html` — master bench, live on prod too. Every homepage section has
sliders (bg width, hero, page frame, plugin, DAW, testimonials, press, newsletter, footer up/down).
User tunes on THEIR screen, hits COPY VALUES FOR CLAUDE, pastes; Claude bakes values into source
and syncs bench defaults. Also: `layout-bench.html`, `hero-bench.html` (superseded by home-bench).
**Bench defaults must stay synced with shipped CSS** — RESET ALL = production state.

## Open threads
- `aurora-test.webp` is the FINAL art for now but still has the test name — rename when user locks art direction.
- Newsletter/Formspree + Paddle checkout still on placeholder tokens (site.ts / plugins.ts).
- Background asset pipeline: ChatGPT art -> Real-ESRGAN 4x (C:\RevAudio\shared\tools\realesrgan) -> sharp resize 2048w -> webp q84.
- User laptop renders at 1280x665 CSS (sometimes dpr 2) — Playwright-test at 1280x665 FIRST.

## Don't touch
- DSP/plugin repos unaffected. Partner's motion system (lib/motion, reveal, scrub, splittext, walkthrough) untouched except pagebg addition.

## 2026-07-22 — Mobile high-end rebuild on `feat/mobile-high-end` (NOT pushed)
Branch = full mobile-only rework (~30 commits), reviewed section-by-section with Dan. Desktop
verified pixel-identical throughout. Highlights: lazy demo audio + YouTube facade (product page
~10.5MB → ~1.5MB), hero BUY/TRY buttons, slim cookie sheet, 44px targets, anchor sub-nav,
showcase→coverflow on phones, DAW strip brass logo marks + CSS 3D floor, crane door 322→242px.
- Dan KILLED (components deleted): HotspotTour, RedlineScrub, DawBridge — don't resurrect.
- Content: AAX claims removed from ALL buyer-facing copy (specs/buy/install/support/store/about)
  — AAX is deferred, and Pro Tools dropped from tested DAWs. NOTE: daws.ts still has
  pro-tools tested:true → homepage strip shows a PRO TOOLS chip; Gil to decide.
- Gil's main commits (checkout wiring + GAS badge nudges) cherry-picked in; badge values ported
  to the new coverflow (top:27px right:12px rotate(10deg) scale(.945) + 1.05rem inside stage).
- Touched partner motion files (mobile-scoped, Dan-directed): lib/reveal.ts (force-reveal
  2.5s failsafe), lib/walkthrough.ts (carousel arrow wiring). Desktop paths unchanged.
- Merge to main = live deploy → waits for Dan's explicit OK after a real-iPhone pass.
