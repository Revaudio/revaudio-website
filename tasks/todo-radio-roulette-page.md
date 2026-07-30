# Radio Roulette page — build out to RevLimiter level (2026-07-30)

Goal: `/radio-roulette` currently renders hero + "What's inside" + specs + install.
`/revlimiter` gets a scroll-linked part-highlighter, a real gallery, "Hear it", the
garage wall, a trial funnel and a video. Close the gap with everything that can be
grounded in real assets — and say plainly what can't.

Ground truth: shipped plugin **v1.9.1** (`RadioRoulette/Source/ui/public/index.html`),
served over http and shot in WebKit. No mockups, no invented controls.

## 1. Assets — real shots from the live UI

- [ ] Capture the canonical panel shot at 2x from the served UI, in a *live* state
      (a tuned station number, needle parked, effect lamps lit) — the current
      `radioroulette-hero.png` is the inert empty state.
- [ ] Capture 2–3 gallery states: a different station, a muted effect (dim red +
      strike), a saved preset key lit.
- [ ] Cut native-res part close-ups (`radioroulette-part-*.png`) from the canonical
      shot for the mobile step previews — same convention as `revlimiter-part-*.png`.

## 2. Data — `src/data/plugins.ts` (single source of truth, no component edits)

- [ ] Rewrite the 10 features to match what actually shipped. Corrections needed:
      "seed" -> STATION, "RANDOMIZE button" -> double-click TUNE = SCAN,
      "shift-click to store" -> double-click to store. Add the three real controls
      the page never mentions: MIX (global dry/wet), POWER (true bypass),
      OS (oversampling, 1x-32x), plus per-effect muting from the dial lamps.
- [ ] Give every feature a `part` slug (the highlighter only activates when *all*
      of them resolve) and add `stage: { shot, parts }` with rects measured from the
      DOM (`boundingBox` per control, as % of `#dash`) — not eyeballed.
- [ ] Add `galleryImages` from step 1.
- [ ] Fix stale wording in `plainWhat` / `longPitch` (seed -> station) in voice.
- [ ] Add `trialUrl` -> the download portal. Legitimate: the license worker has
      `radioroulette: { wired: true, platforms: rr-win/rr-mac }` and the plugin has a
      real 14-day trial (`LicenseManager.cpp:424`). This lights up TrialStamp +
      TrialPlates + the garage wall — the same funnel RevLimiter has.

## 3. Verify before done

- [ ] `npm run build` clean.
- [ ] WebKit screenshots at 1280x665 DPR2, 1512x950, 1920x1080, 1024x600, 920x700.
- [ ] All 10 walkthrough steps activate and the highlight box lands on the right
      control at every width; no console errors.

## Not doing — blocked on assets that don't exist

- **"Hear it" A/B demos** — needs bounced before/after clips. Can't fabricate audio.
- **Driver's-manual video** — no Radio Roulette video exists.
- **Testimonials / star rating** — honesty rule: real ones only.
- **Crane buy door** — RevLimiter's garage-door device is its own brand furniture;
  Radio Roulette keeps the classic buy card unless Dan wants a radio-specific
  equivalent designed.

## Review — done 2026-07-30

**Shipped (not committed, see below):**

- `src/assets/plugins/radioroulette-hero.png` replaced. Old shot was the inert
  state (no station, needle at 0, no lit lamps). New one is station 456149 with
  the whole chain lit, 2546px wide like the shot it replaces so no card or
  layout aspect changes.
- 14 `radioroulette-part-*.png` close-ups cut from the same master.
- `src/data/plugins.ts`: 11 features -> 14 -> **8** (Dan cut the six per-effect
  steps, Filter and EQ through Stereo width and pan, 2026-07-30; their `stage`
  parts and thumbs went with them). Each remaining feature maps to a `part`;
  `stage` block with DOM-measured rects; `trialUrl`; `plainWhat` / `longPitch`
  corrected. The chain step still names all ten effects in its description.
- `src/components/TrialPlates.astro`: gate-id fix + long-name plate print.

**Copy corrections (the old page described a plugin that doesn't exist):**
"seed" -> station, "RANDOMIZE button" -> double-click TUNE = SCAN, "shift-click
to store" -> double-click to store. Added MIX, POWER, OS and per-effect muting,
none of which the page mentioned. Every claim re-checked against
`PluginProcessor.cpp` (pitch steps, gate 1-12 Hz, width 0.5-1.6, pan +/-0.6,
per-seed makeup + -0.3 dBFS wet ceiling, audibility guarantee, OS 1x-32x).

**Two bugs found and fixed on the way:**

1. `TrialPlates` posted `plugin.slug` to the license worker, which keys on the
   flat id and falls back to revlimiter on anything else. Radio Roulette is the
   only plugin whose slug differs, so switching its trial on would have
   registered RevLimiter trials. Now `dlGateId(plugin)`, like every other CTA.
2. The plate's two printed lines are nowrap and were sized around "RevLimiter".
   "Radio Roulette" ran past the eyelets and got clipped to "TERM: 14 DAY".
   Fixed with a `.plate--long-name` tracking pass, verified 1280 down to 320.

**Verified:** build clean; all 14 steps activate and the box lands on the
authored rect exactly at 1280x665 DPR2 / 1512x950 / 1920x1080 / 1024x600 /
920x700; frames eyeballed per part; no console errors on the product page,
store, or home; mobile carousel reads 01 / 14; RevLimiter's plate unchanged.

**Known-inert:** `StagePart.thumb` is declared and documented but no component
reads it (true for RevLimiter's 11 thumbs too). The 14 files are generated and
match the hero exactly, so wiring the mobile preview later is a component-only
job. Wiring it is a shared-component change across all three plugin pages, so
it was left out of this scope.

**Still not done, needs assets that don't exist:** "Hear it" A/B demos (needs
bounced clips), tutorial video, testimonials.

## Crane door — added 2026-07-30 (Dan)

Originally scoped out as RevLimiter-only furniture; Dan asked for it.

- `crane` in `[slug].astro` was `plugin.slug === 'revlimiter' && buyable`. Now
  `!!plugin.craneBuy && buyable`, with `craneBuy?: boolean` on `Plugin` and set
  on RevLimiter + Radio Roulette. Data flag, not a second hardcoded slug.
- Nothing else needed: `BuyButtonCrane` paints all its copy from data, so with
  no `regularPriceUsd` and no `promoCode` the discount tag and code line simply
  don't render and the door reads a clean painted "$20".
- Verified: BUY NOW carries `pluginSlug=radioroulette` and opens "Grab the free
  Radio Roulette trial instead" (checkout is gated site-wide); door + drop zone
  render; mobile aside geometry is pixel-identical to RevLimiter's (x99 y58
  w193); no page overflow; 8 walkthrough steps and the trial section unaffected;
  no console errors at 1280 or 390.

**Pre-existing, not introduced here:** the door never stops swaying — measured
sub-pixel drift per frame on RevLimiter too, 12s after load. Playwright refuses
to click it ("element is not stable"). Harmless for mouse users, but it is a
permanently moving click target; worth a look if anyone revisits `/cranelab`.

## Bug — trial line vanishes while the door falls (Dan, 2026-07-30)

**Report:** "when the door is falling the 'start your free trail' disappears
and when the door comes back up it appears again."

**Cause.** The crane rig is TWO doors. `BuyButtonCrane` hangs in the aside;
at the page bottom `CraneDropZone` takes over — the top one goes
`visibility:hidden` under `.crane-released` and the zone's own `.dz-door`
falls, sits on the cracked footer border, and gets hauled back until the dock
swap hands control back. `.dz-door` is a hand-maintained clone that only ever
cloned the tag, the price and the promo code, so the free-trial call added to
the hanging door earlier the same day existed on exactly one of the two. Not a
Radio Roulette bug — a clone-divergence bug that any future painted copy would
have hit.

**Fix.** `CraneDropZone` now renders both trial slots with the same conditions
and the same %/cqw values as `BuyButtonCrane`: `.dz-freetrial` (upper, before
the square) and `.dz-trial` (lower, after it). Two deliberate deltas, both
forced by this component's existing contract — no `#rc-worn-*` filters (nothing
filtered may translate in Safari, same reason `.dz-price` dropped its own) and
`pointer-events:auto` (the zone root is `pointer-events:none`). Real `<a>`s,
not paint: the landed door's BUY NOW works, so a dead trial line beside it
would be a trap. Kept OUT of `.dz-copy`, which is `aria-hidden` — a focusable
element in an aria-hidden container is invisible to AT but still tabbable.
`BuyButtonCrane`'s header now states the parity rule so the next line added up
top gets cloned down.

`.dz-trial` renders on neither plugin today (both are `trialGateActive`, and
that slot also needs a sale chip in the upper one). It's there so RevLimiter
doesn't reproduce this exact bug the day the checkout gate lifts.

**Verified** — a sampler at 50ms over the whole cycle (seated → crane lets go →
fall → landed → haul → dock swap), counting visible instances across both
doors:

| build | frames | 0 lines | 2 lines |
|---|---|---|---|
| pre-fix (control) | 263 | **251** | 0 |
| after, dev | 263 | 0 | 0 |
| after, production build | 263 | 0 | 0 |

Exactly one visible line in every sampled frame, including the dock hand-off.
Also: fallen-door rect matches the hanging door's to ≤0.24% of door width
(x 54.89 vs 55.04, y 64.36 vs 64.31, both 113.5px wide, both 16.6px type);
click goes to `#trial` and scrolls there; a 7x4 hit grid over BUY NOW returns
`dz-buysq` at all 28 points, so the link's `::after` pad steals nothing; the
lower slot was proven by injecting both elements with their components'
`data-astro-cid-*` attributes — x 24.58 vs 24.59, y 85.57 vs 85.59, identical
type/colour/rotation, filter the only difference; `npm run build` clean;
zone stays `display:none` under reduced motion, at 900px and at 390px, where
the top card hides its own line too; no console errors; no horizontal overflow
at 390 / 900 / 901 / 1280; RevLimiter's fallen door unchanged (tag, price,
code, BUY NOW).

**Not touched:** `/cranelab` is a git-excluded local bench and carries no trial
line, so it needs no clone.
