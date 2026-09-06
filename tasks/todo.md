# Website — garage homepage pass (2026-09-06)

Request (Dan): "remove the background clock that gradients to red, then give us your best shot —
make the vibe like the garage" — reference https://kaelalden.com/products/vibe-rewind (depth,
photographic plates, restraint).

## Step 1 — remove enginebg (explicit) → production
- [ ] BaseLayout.astro: drop `.ebg` markup + `initEngineBg` import/call
- [ ] global.css: delete `.ebg*` block, body opaque again, section panels opaque
- [ ] `[slug].astro` comment no longer cites `.ebg`
- [ ] delete `src/lib/enginebg.ts` + `public/bg/enginebg-*.webp`
- [ ] `npm run build` clean, screenshot verify, commit → pull --rebase → push

## Step 2 — garage homepage (best shot) → `/garage` preview route first
- [ ] website `DESIGN.md` (constitution gate)
- [ ] 4 photographic plates via gpt-image-1 (hero wall, bench, dash, door) → `src/assets/garage/`
- [ ] `src/pages/garage.astro` (index=false): hero on the garage wall, showcase, stencil word wall,
      three photo story rows (data-reveal), DAW strip, signup, closing CTA
- [ ] build + screenshots 1280×665 / 390 / 1600, commit, push, send screenshots
- [ ] promote to `/` after Dan verifies (one swap of index.astro body)

## Review
(filled at the end)
