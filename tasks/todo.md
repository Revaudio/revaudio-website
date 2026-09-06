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
- [ ] build + screenshots 1280 / 390, send to Dan, commit LOCAL only
- [ ] Dan's word "push" → pull --rebase → push

## Review
- Local main = pre-garage site + word wall between the showcase and the DAW strip.
- Files: `src/pages/index.astro` (import + one line), `src/components/GarageWall.astro`,
  `src/components/WordWall.astro`, `DESIGN.md` (trimmed to what ships), `tasks/*`.
- One race-red element on `/` (hero sweep); the filled stencil word is oxide, not red.
- No new external hosts, CSP untouched.
