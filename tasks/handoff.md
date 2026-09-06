# Website handoff

Updated: 2026-09-06 (/gas conversion pass committed locally, NOT pushed; hero patina pass wired with stand-in plates, local only)

## 2026-09-06 (latest) - /gas sells more: DONE, committed locally, NOT pushed
Owner: Claude Code. Repo `revaudio-website`, branch `main` (local, ahead of `origin/main`).
Dan: "lets work on the gas page, lets make it sell more" + "work with psychologic and make it simple".
GAS is free, so "sell" = more email-gated downloads. One screen on desktop kept (Dan 2026-07-30).
- `src/pages/gas.astro`: hook "One knob. Sounds expensive."; three-line "what is the catch"
  list (full version / free forever / no trial clock / no credit card / Win + Mac + formats);
  CTA "Get GAS free" (still the TrialGateModal gate, never a plain link); fine print under the
  button says the email step BEFORE the modal opens; video badge labelled with its true length
  2:46, play dot brass so the CTA is the only warm block; named grid areas re-order for phones
  (CTA + fine print above the fold at 390x844, badge last). `<title>` "GAS: free one-knob
  saturator", description with formats. Copy pulls `plugin.oneLiner` from plugins.ts, unchanged.
- `src/layouts/BaseLayout.astro`: `og:image` is now an absolute URL (site-wide, one line).
- `public/og/gas.png` (new, 1200x630) + `public/og-default.png` (new; the live site 404ed it).
- Checks: `npm run build` green (19 pages). Headless shots 1280x665 DPR2 + 390x844 with the cookie
  banner declined + modal + video lightbox: all OK, sent to Dan. Nothing invented: no counts,
  stars, quotes, timers.
- Plan + review: `tasks/todo.md`. Not done on purpose: no audio A/B rack, no RevLimiter cross-sell.
- Next: Dan reviews the shots and says "push". Until then: local only.

## 2026-09-06 (later) — hero patina pass "the bench at night": WIRED, stand-in plates, NOT pushed
Owner: Claude Code. Repo `revaudio-website`, branch `main` (local, ahead of `origin/main`).
Dan: "lets see it !" so the wiring is built now with procedural stand-in plates (PIL: gunmetal
panels, seams, rivets, oxide patches, amber lamp top-left, dark centre). They are placeholders only;
Dan's Higgsfield plates replace the two jpgs 1:1 (same paths, same names), no code change needed.
- Built: `src/pages/index.astro` hero: `getImage()` both plates to webp, `--plate-d` / `--plate-m` on
  `.hero-feat`; `.hero-plate` > `.hero-plate-img[data-drift-y=16]` first child; CSS: `isolation:
  isolate` on `.hero-feat`, plate z:-2 full-bleed, `--plate-alpha` .88 (.8 on phones), `::after` =
  lamp spill + 30% `--bg-0` scrim + bottom fade; `html.hc` hides it; ≤860px swaps to the 9:16 plate.
- Checked: `npm run build` green; headless Edge 1280x800 + 390x844 shots: plate full-bleed behind
  gauge, headline contrast holds, phone swap works. Not yet re-measured: scrim knobs vs a REAL plate.
- Dan sent a 1600x2400 portrait image in chat (not on disk anywhere). Asked him to save it as
  `src/assets/hero/hero-wall-m.jpg`; a 16:9 desktop plate is still needed (prompt A).
- Still owed once real plates land: contrast re-measure (4.5:1 on kicker/lede), plate opacity vs smoke,
  `DESIGN.md` §0 / §4 / §5 / §7 / §10, plate size ≤250 KB check.
- Note: `tasks/todo.md` was rewritten in the working tree by Codex (/gas plan, uncommitted); Step 3
  hero plan text lives in commit `4c65acc`. Not staged by Claude.
Dan, with a screenshot of the live hero: patina / garage vibe on the first screen, keep the gauge and
its readings where they are, show "we are a music plugin company", assets from Higgsfield, creative,
on brand.
- Plan: `tasks/todo.md` Step 3. Prompts for Dan to run: `tasks/hero-higgsfield-prompts.md`.
- Shape: a Higgsfield photo plate behind the hero (patina steel wall, one caged trouble light top-left
  as the light source, headphones on a hook, a shelf with a reel-to-reel + a VU rack unit), full-bleed
  inside `.hero-feat` (isolation: isolate, z:-2, opacity ~.85 so the smoke still reads), a warm rake +
  `--bg-0` scrim over it, `data-drift-y` 16. Gauge / kicker / headline / sweep / lede: not moved.
- Files that WILL change on build: `src/pages/index.astro` (hero only), `src/assets/hero/hero-wall*.jpg`
  (new), `DESIGN.md` (§0 / §4 / §5 / §7 / §10). Nothing else.
- Blocked on: Dan's go on the plan + the two plates from Higgsfield (A 16:9, B 9:16).
- Rule still in force: no push without Dan's word "push".

## 2026-09-06 — garage homepage pass: word wall + smoke (pushed as `18afe01`)
Owner: Claude Code. Repo `revaudio-website`, branch `main` (local, ahead of `origin/main`).
Dan's sequence today: "remove the background clock that gradients to red" (done, `c3fc068`, pushed);
"give us your best shot, garage vibe" (built as `/garage` preview, `7e4b3b6`, pushed too early);
"never push until i say to push clearly"; "revert to the website we had before you pushed"
(`3d2e17e` on main); then, pointing at the stencil-words section: "this is the only keeper all
others remove". So:
- **`src/pages/index.astro`** — imports `WordWall` and places `<WordWall />` between
  `<PluginShowcase />` and `<DAWStrip />`. That is the whole homepage change.
- **`src/components/WordWall.astro`** — LOUD / WARM / PUNCHY / GLUED / DEEP stencil words (brass
  outline, PUNCHY filled oxide) beside the RevLimiter window + one caption line, on the wood wall.
- **`src/components/GarageWall.astro`** — the product-page `.garage-wall` (wood tile, brass rails,
  top light, 38% scrim, `data-drift-y` parallax) as a reusable wrapper.
- **`DESIGN.md`** — website design spec per the constitution, trimmed to what ships.
- **Cut, not lost:** the three photo story rows (car plate, unit render, "30 days" door), the
  `/garage` route and `src/assets/garage/*.jpg` live on branch `garage-pass` (= `7e4b3b6`).
- **RULE (Dan, 2026-09-06): no `git push` on this repo until Dan writes "push".** Commit locally,
  report "committed locally, not pushed", wait. `tasks/lessons.md` has the entry.
- **Smoke (Dan, same day: "add the vibe of the smoke that we had before"):** the two haze plates of
  the old enginebg layer are back as their own thing. `src/lib/haze.ts` (drift + scroll-velocity
  blip + desktop pointer lean, reduced motion = static), `.haze` block in `global.css` (fixed,
  z:-1, paints `--bg-0`; body `background: none`; footer translucent again), markup + `initHaze()`
  in `BaseLayout.astro`, plates `public/bg/haze1.webp` + `haze2.webp`. NOT back: the tach arc that
  hue-shifted to red (the thing Dan asked to remove first), embers, waveform, heat curve.
- Checks: `npm run build` clean (19 pages, `/garage` gone), screenshots 1280 + 390 sent to Dan
  (word wall, then the smoke pass). Preview server left up on http://localhost:4321/.
- Pushed on Dan's word as `18afe01` (deploy green, live). Open question in DESIGN.md §10: which
  stencil word should be the filled one (currently PUNCHY).


## 2026-07-30 (later) — /gas left the shared product layout for a one-screen page
Dan, after seeing the walkthrough below: "ditch this revlimiter layout idea, make it a one pager
short like the size of a regular laptop." So GAS is off `[slug].astro` entirely.
- **`src/pages/gas.astro`** — new, owns the route. Portrait plate left, copy right, vertically
  centred, `min-height: calc(100svh - var(--nav-h))`. The plate is capped by HEIGHT
  (`min(66svh, 600px)`) not width — that cap is what keeps it one screen on a short laptop window.
  Content: name + FREE stamp, `plainHook`, `tagline`, three feature names, the download CTA, one
  mono spec line. Nothing else.
- **`src/pages/[slug].astro`** — `getStaticPaths` now filters out `'gas'`. Without that filter two
  files emit `/gas`. Also reverted the `hasStage` relaxation from earlier today: with GAS gone, no
  plugin has a partless feature (audited: revlimiter 13/13, radio-roulette 14/14), so the strict
  every-feature-mapped invariant is back and unused generality is gone.
- **`plugins.ts`** — GAS keeps its 6 features but loses `stage` + all `part` slugs (dead once the
  walkthrough went). Feature ORDER is now editorial: gas.astro prints the first three names as its
  only feature copy, so DRIVE macro / three voices / 8x oversampling lead. There is no second copy
  of that text on the page.
- **The CTA speaks TrialGateModal's trigger contract directly** rather than reusing `BuyButton` —
  BuyButton's bordered card (price block + 3-line `includes` list) is taller than the whole layout.
  Non-gated branch kept, so dropping `trialGateActive` restores the direct download here too.
  **Verified by clicking it:** modal opens with the free-plugin copy ("GAS is free — grab it",
  "Free forever. Full version, no trial clock"), email field present, `data-plugin-slug=gas` and
  the register URL both correct. The `#dl=`/`#p=` verify-email bounce-back still lands here because
  TrialGateModal lives in BaseLayout. **The download funnel is intact — do not "simplify" the CTA
  into a plain `<a href={downloadUrl}>`, that skips the email gate.**
- Measured: **5293px → 856px of content**, 5.3 screens → 1 screen. Everything above the fold at
  1440x900, 1366x768 and 1280x720. Mobile 390x844 also fits, but the plate had to come down to
  `32svh`: at 44svh the CTA landed under the fixed a11y/cart FABs and the spec line fell below the
  fold. `docScreens` still reads ~1.4 because the site Footer sits below the one screen — the page
  itself is one screen. Squeezing the footer in too would mean a ~480px plate; Dan's call.
- Zero console errors. RevLimiter and Radio Roulette both still render `data-walkthrough` (the
  route filter and the gate revert are no-ops for them).
- **Superseded, not deleted:** the part-highlighter work from earlier today is in `1724a27` +
  `daf25ba` with the 5 measured rects, if a future page ever wants them.

## 2026-07-30 — /gas moved from crossfade to the real part-highlighter stage (SUPERSEDED, see above)
GAS was the thinnest product page: one hero, no `stage`, so "What's inside" just pinned a single
shot. It now runs the same highlighter RevLimiter does.
- `src/data/plugins.ts` — GAS gets a `stage` with 5 part rects + `part` slugs on its features, and
  a 6th feature (**Parallel MIX blend**) for the top-left mini knob, which is a real control the
  page never mentioned. Also fixed a wrong claim: the old oversampling desc said "oversampled per
  voice", but `GAS/plugin/Source/GasEngine.h` explicitly uses ONE oversampler at one factor for
  all voices (HQ 8x / Eco 4x) so PDC never changes on a voice switch. Copy now says that.
- `src/pages/[slug].astro` — `hasStage` no longer demands that EVERY feature carry a `part`. It
  needs one resolvable part, and tolerates features with none. GAS's oversampling bullet is the
  Quality parameter, host-side only, with nothing on the panel to box; that step shows the plate
  undimmed. `walkthrough.ts` already did this for a missing `data-part` — only the gate was strict.
  A `part` that IS set but unresolvable still kills the stage (a typo should fail loudly).
- `src/assets/plugins/gas-hero.png` — replaced 802x1192 with a 1600x2380 headless render of the
  real WebView UI (`GAS/plugin/Source/ui/public/index.html`, served over http, Chrome
  `--window-size=1600,2380`; the UI's `applyZoom` scales its 400x595 canvas by innerWidth/400, and
  `inJuce` is false so it renders standalone). Pixel-for-pixel the same panel as before, just 2x
  the master. The stage asks for a 1200px-wide derivative, which was a 1.5x UPSCALE off the old
  source. Repeat the render the same way if the plugin UI changes.
- **Rect recipe for the next plugin:** compute from the UI's own CSS (element left/top/size, then
  fold in inline `translate`/`scale` and `transform-origin`), then verify by drawing the boxes onto
  the actual hero PNG before trusting them. Two of five were visibly off from CSS math alone,
  because `object-fit: contain` art and drop-shadows inset the visible control inside its box.
- Verified in a real browser (Playwright, built output on `astro preview`): stage mode active, all
  6 steps activate, live-measured box rects match plugins.ts exactly (26.8/27.5/46.8/30 etc.), the
  no-part step goes `visibility: hidden` + opacity 0, mobile ≤900px gives 6 carousel cards +
  "06 / 06" counter, zero console errors, RevLimiter still in stage mode (gate change is a no-op
  for it), /store card serves a 480x714 derivative of the new hero.
- **Still missing for true RevLimiter parity, both blocked on content, not code:** `audioDemos`
  (RevLimiter has 3; nothing exists for GAS, and no demos means no "Hear it" AND no garage wall,
  since `hasWall` = demos || trialUrl and GAS is free with no trialUrl) and `tutorialVideo`
  (RevLimiter has one on YouTube). `galleryImages` is NOT a gap — RevLimiter's is empty too.
- **Dead data spotted, not touched:** `StagePart.thumb` is populated for all 10 RevLimiter parts
  (`revlimiter-part-*.png`, ~10 files in `src/assets/plugins/`) but nothing in the templates or
  `walkthrough.ts` reads it. Either the mobile step-preview was dropped or never landed. Left
  alone deliberately — GAS therefore got no part thumbs. Worth a decision: wire it or delete them.

## 2026-07-26 — "What's inside" active card now aligns with the pinned shot (60e3123, live)
Dan reported the walkthrough section reading misaligned. Cause: `.walk-stage` pins high
(`top: sale + nav + 1.5rem` = 68px at 1280x665) but the per-step ScrollTriggers activated on a
hardcoded `top 55%` line at mid-viewport, so from step 2 on every card lit up 118-156px BELOW
the shot it described.
- `src/lib/walkthrough.ts` only — no CSS/markup change. The activation line is now the pinned
  stage's own centre, measured live (`sticky top + .stage-frame offsetHeight / 2`), via
  FUNCTION-BASED `start`/`end` so every `ScrollTrigger.refresh()` re-reads it. Do not re-hardcode
  a percentage here — it has to follow `--nav-h`, the sale banner and the shot's max-height cap.
- Tail runway: the higher line meant the LAST card reached it exactly as the stage unpinned, so
  `.walk-copy` gets a small JS-set `padding-bottom` (`max(0,(frameH-lastCardH)/2)` — 21px at
  1280x665, 0 on tall viewports, 144px on /gas). **Counterintuitive: bigger is worse.** Once the
  stage unpins, card and shot scroll together and hold their offset, so a large spacer only keeps
  the shot still while the card slides past (tested: 24px → last card exits at -2px; 128px → -105px).
  Set from JS + desktop-only on purpose — no-JS and reduced-motion get no highlighting, so a CSS
  spacer would be dead space to them.
- The lazy-shot `load` → `ScrollTrigger.refresh()` moved ABOVE the `if (!isStageMode || !parts) return`
  early return: the crossfade plugins' line depends on the same frame height and never got it before.
- Verified: card-to-shot centre delta went +118..+156px → -3..+14px, all 13 steps activate at their
  own line, at 1280x665 / 1512x950 / 1920x1080 / 1024x600 / 920x700, and on live revaudio.net.
  Drift / The AC / GAS / Radio Roulette (crossfade path) within ±4px after step 0. Step 0 shows a
  bigger delta on tall-shot plugins ((frameH-cardH)/2) — that is the pre-existing in-flow top-aligned
  opening, NOT a regression; it measured the same before the change.
- Residual ±12px wobble is the intentional scrubbed drift tween on `.stage-frame`. Leave it.
- Harness kept out of the repo (scratchpad): playwright scripts that park at each step's alignment
  midpoint and report delta + pinned. Rebuild from this note if the section is touched again.

## 2026-07-24 (later) — RESOLVED: CSP fixed via dashboard; trial funnel human-verified end-to-end
The Transform Rule was updated in the Cloudflare dashboard (Claude drove Dan's Chrome; Dan
approved): `connect-src` += license worker + www.google-analytics.com + googleads.g.doubleclick.net
+ www.googleadservices.com; `script-src` += www.googletagmanager.com. Verified: edge serves the
new header, live submit on /revlimiter#trial stamps PLATES ISSUED, verification email delivered,
**Dan clicked the verify link twice — portal unlocks, funnel works end-to-end.**
Remaining (optional "round 2", Dan aware): Google Ads conversion pings still blocked — needs
`https://www.google.com https://ad.doubleclick.net` in connect-src and
`https://googleads.g.doubleclick.net` in script-src. Until then gtag loads + fires but the
conversion never reaches Google. Meta's *.on.aws / *.run.app beacons also blocked (cosmetic).
Memory: revaudio-shared `reference_revaudio_edge_csp_transform_rule.md` (the recurring trap).

## 2026-07-24 — BLOCKER (resolved above): edge CSP blocks the on-page trial capture (and the Google Ads tag)
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
