# Website — garage homepage pass (2026-09-06)

Request (Dan): "remove the background clock that gradients to red, then give us your best shot —
make the vibe like the garage" — reference https://kaelalden.com/products/vibe-rewind (depth,
photographic plates, restraint).

## Step 1 — remove enginebg (explicit) → production
- [x] BaseLayout.astro: drop `.ebg` markup + `initEngineBg` import/call
- [x] global.css: delete `.ebg*` block, body opaque again, section panels opaque
- [x] `[slug].astro` comment no longer cites `.ebg`
- [x] delete `src/lib/enginebg.ts` + `public/bg/enginebg-*.webp`
- [x] `npm run build` clean, screenshot verify, commit → pull --rebase → push

## Step 2 — garage homepage (best shot) → `/garage` preview route first
- [x] website `DESIGN.md` (constitution gate)
- [x] plates → `src/assets/garage/` (gpt-image-1 out of credits: car = teaser frame x4 Real-ESRGAN,
      unit = Instagram concept render; door + wood = existing site assets)
- [x] `src/pages/garage.astro` (index=false): hero (unchanged), showcase, stencil word wall,
      three photo story rows (data-reveal), DAW strip, signup, closing CTA
- [x] build + screenshots 1280 / 390 / 1600, commit, push, send screenshots
- [ ] promote to `/` after Dan verifies (one swap of index.astro body)

## Review
- Step 1 shipped as `c3fc068`: enginebg layer gone, body paints `--bg-0`, footer opaque.
- Step 2 lives at `/garage` (noindex) so Dan can compare against `/` before promotion. garage.astro is
  index.astro plus three marked lines (two imports + `<WordWall />` `<GarageStory />` after the showcase);
  promotion = move those lines into index.astro, delete garage.astro.
- New parts: `GarageWall.astro` (reusable wood + rails wrapper, same tokens as the product page wall),
  `WordWall.astro` (LOUD / WARM / PUNCHY / GLUED / DEEP beside the RevLimiter UI), `GarageStory.astro`
  (car plate, unit plate captioned "Concept render", crane door with "30 DAYS / FULL VERSION" + trial CTA).
- Checks: `npm run build` 20 pages; /garage 200 with `noindex`; screenshots at 1280, 1600 (headless Edge)
  and 390 (Playwright — headless Edge clamps narrow windows, do not trust its <500px shots).
  One race-red element on the page (hero sweep); no new external hosts (CSP untouched).
- Open for Dan: DESIGN.md §10 (keep the concept-render plate? car plate good enough? which stencil word
  filled? promote to `/`?).
