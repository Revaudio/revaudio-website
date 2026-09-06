# Website — garage homepage pass (2026-09-06)

Request (Dan): "remove the background clock that gradients to red, then give us your best shot —
make the vibe like the garage" — reference https://kaelalden.com/products/vibe-rewind (depth,
photographic plates, restraint).

## Step 1 — remove enginebg (explicit) → production
- [x] BaseLayout.astro: drop `.ebg` markup + `initEngineBg` import/call
- [x] global.css: delete `.ebg*` block, body opaque again, section panels opaque
- [x] `[slug].astro` comment no longer cites `.ebg`
- [x] delete `src/lib/enginebg.ts` + `public/bg/enginebg-*.webp`
- [x] `npm run build` clean, screenshot verify, commit → pull --rebase → push (`c3fc068`)

## Step 2 — garage homepage (best shot)
- [x] website `DESIGN.md` (constitution gate)
- [x] `/garage` preview: word wall + three photo story rows + door (`7e4b3b6`, pushed)
- [x] Dan: "revert to the website we had before you pushed" → reverted on main (`3d2e17e`), work
      kept on branch `garage-pass`. Rule from now: NEVER push until Dan says push clearly.
- [x] Dan: keep ONLY the word wall (stencil words + RevLimiter window on the wood). Story rows,
      plates, door, `/garage` route: gone. Word wall goes straight onto `/` (index.astro).
- [x] build + screenshots 1280 / 390, send to Dan, commit LOCAL only (`2f5ff2c`)
- [x] Dan: "add the vibe of the smoke that we had before" → haze plates back (`src/lib/haze.ts`,
      `.haze` in global.css, markup in BaseLayout, `public/bg/haze1.webp` + `haze2.webp`), no arc /
      embers / heat. Built, screenshots sent, committed LOCAL only.
- [x] Dan's word "push" → pull --rebase → push (`18afe01`, deploy green, live on revaudio.net)

## Review
- Local main = pre-garage site + word wall between the showcase and the DAW strip.
- Files: `src/pages/index.astro` (import + one line), `src/components/GarageWall.astro`,
  `src/components/WordWall.astro`, `DESIGN.md` (trimmed to what ships), `tasks/*`.
- One race-red element on `/` (hero sweep); the filled stencil word is oxide, not red.
- No new external hosts, CSP untouched.
- Smoke: fixed `.haze` layer z:-1 paints `--bg-0` under a transparent body; footer translucent again
  (rgba .55) so it reads through. hc hides the plates. Reduced motion = static plates.

## Step 3 — hero patina pass: "the bench at night" — PLAN, awaiting Dan's go (2026-09-06)

Request (Dan, with a screenshot of the live hero): "plan a design for this area, a vibe of patina /
garage, keep the clock and the reading where it is, show we are a music plugin company, vintage
patina retro vibe on this first page, we will use Higgsfield for that task, be creative, go with
the brand."

Concept: the gauge stops floating. It hangs on the back wall of the shop at night. One caged
trouble light top-left is the only lamp (Law 4: the light has a source). The gear on the shelf next
to it says "music" without a word: a reel-to-reel, a rack unit with amber VU needles, headphones on
a hook, a coiled cable. Gauge, kicker, headline, red sweep, lede: untouched, same place, same size.
Everything new sits BEHIND them.

Layer stack inside `.hero-feat` (gets `isolation: isolate`; bottom → top):
  smoke            existing fixed layer, still reads through the plate's dark areas
  .hero-plate      z:-2  Higgsfield photo plate, full-bleed, object-fit cover, opacity ~.85, data-drift-y 16
  .hero-plate rake z:-1  warm amber spill from the lamp corner (screen) + `--bg-0` scrim ~.35 (the AA dial)
  .hero-medallion + .hero-head   unchanged markup; medallion opacity re-tuned (.8 → ~.9), scrim knobs re-measured
  round 2: .hero-mount   alpha ring in the medallion cell so the gauge is bolted to the wall

Assets — Dan generates in Higgsfield, prompts verbatim in `tasks/hero-higgsfield-prompts.md`:
- [ ] A. wall plate 16:9, widest output → `src/assets/hero/hero-wall.jpg` (Astro Picture, widths 1280/1920/2560, webp, eager)
- [ ] B. wall plate 9:16 → `src/assets/hero/hero-wall-m.jpg` (source for ≤860px)
- [ ] C. round 2, optional: mount ring 1:1 on flat black → alpha cut here (flood-mask recipe)
Pick rules for the plates: NO red lights / LEDs / neon (the sweep is the page's one race-red); no
text, no logos, no cars; the centre of the frame stays plain dark wall (the gauge lands there); the
light comes from the lamp only, upper-left; palette near-black / brass / walnut / oxide.

Build (after Dan's go + assets in place):
- [ ] `index.astro`: `<Picture>` plate + rake/scrim as the first child of `.hero-feat`; `isolation: isolate`
- [ ] entrance: plate fades 0→1 over 1.2s at t=0, before the text cascade; reduced motion: static plate, no drift
- [ ] `html.hc .hero-plate { display: none }` (same as the wall art)
- [ ] re-measure `--scrim` / `--scrim-fade` against the new worst-case background (kicker + lede ≥ 4.5:1)
- [ ] plate opacity tuned so the smoke still reads in the dark areas
- [ ] mobile ≤860: 9:16 source, drift off, nothing busy under the headline band
- [ ] round 2 (only if Dan wants it): mount ring; lamp spill leans 6px with the pointer via the haze pointer signal
- [ ] `DESIGN.md`: §0 rows (trouble light → the hero's lamp; shelf gear → what the plugins model), §4 / §5 / §7, §10 entry
- [ ] checks: `npm run build`; 1280 + 390 screenshots (motion on / reduced / hc); 0 console errors; plate ≤ 250 KB
      at 1920 and LCP no worse than today; no new hosts (CSP untouched); one race-red on the page
- [ ] commit LOCAL only; Dan's word "push" → pull --rebase → push
