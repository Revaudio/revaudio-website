# revaudio.net — Design Spec

Derived from `shared/wiki/pages/design-language.md` §6 (the constitution). Written 2026-09-06 for
the garage homepage pass. Product pages (`[slug].astro`) already follow it; this file writes down
what they do so the homepage and every future page stay in the same garage.

## 0. Metaphor

THE OBJECT: **the RevAudio garage**, the workshop the plugins are built in. Not a dashboard, not a
showroom: a dark two-bay garage at night, one tube light on, the bench lamp on, a car under cover.

ERA/VIBE: late-'60s muscle-car garage. Oiled walnut wall boards, brass fittings, oxide-red steel,
amber lamps, a little dust in the light.

MAPPING TABLE (every visible part of the site maps to something you could touch in that garage):

| garage object                      | site part                                       | what it does for the visitor                |
|------------------------------------|-------------------------------------------------|---------------------------------------------|
| the big tach on the wall           | hero gauge medallion (`/` hero)                 | the brand in one glance; needle = scroll    |
| the back wall (wood + brass rails) | `.garage-wall` (product pages, home story rows) | the surface every section hangs on          |
| the parts rack                     | plugin showcase coverflow (`#plugins`)          | what's for sale, price on the tag           |
| stencil sprayed on the wall        | the word wall (home)                            | what the sound does, in five words          |
| photos pinned above the bench      | story plates (home rows)                        | proof of craft: the car, the unit, the door |
| the truck door with the handle     | BuyButtonCrane / trial CTA                      | the ONE way in: pull the handle             |
| the "goes with every vehicle" sign | DAW strip                                       | compatibility                               |
| the pit-crew clipboard             | EmailCapture ("Join the pit crew")              | newsletter                                  |
| the steel roller door, half up     | closing CTA                                     | leave with the trial                        |

Plain language instructs, the metaphor only orients (PRODUCT.md): every CTA says what it does in
words ("Start your 30-day free trial"); the garage never has to be decoded.

## 1. Theme & atmosphere

You are standing inside the garage after hours. The tube light over the bench is the only cold
light; everything else is the amber of a bench lamp and the red of a tail-light. Surfaces are real:
walnut boards you could pry off, brass rails with rotated screws, a rust-pitted card plate, a
truck door with a handle that drops. Nothing floats; nothing glows without a lamp to explain it.
Depth comes from photographs bleeding into the dark, not from gradients painted on the page.

## 2. Palette

House tokens, reused verbatim from `src/styles/global.css` `:root`:

- darks: `--bg-0 #0b0a09` (bakelite, the page), `--bg-1 #14110f`, `--bg-2 #1d1916`, `--bg-3 #2a2420`
- inks: `--fg #efe9df` (parchment), `--fg-dim #8a8275`, `--fg-faint #827c74` (AA on bg-0/bg-1)
- brass: `--brass #c9a35c`, `--brass-bright #e8c878`, `--brass-dark #8c6f3a` (3-stop rule: dark, brass, bright)
- chrome: `--chrome #d8d4cc`, `--chrome-dark #76726a`
- oxide: `--oxide #8b3a1f`, `--oxide-deep #5a2410`, `--oxide-text #d4622a` (AA text oxide)
- race-red: `--redline #c8331f`. ONE hero element per page: the `.hh-redline` sweep on `/`, the
  RevLimiter wordmark on product pages. Never on a second element.
- `--emerald #2f6b4a` for "armed / live" pilot lights only.

Additive, page-local: none. Photographic plates bring their own colour (amber lamp, tail-light
red, cold tube spill) and are vignetted into `--bg-0` so the page palette stays in charge.

Forbidden: pure `#000` / `#fff` outside `html.hc`; yellow speculars on red; race-red on buttons;
neon or glow without a lamp; the retired scroll-driven ambient background (removed in `c3fc068`).

## 3. Typography

- Display: `--font-display` Bebas Neue (fallback Oswald, Arial Narrow). Headlines are stamped
  into the wall: `text-shadow: var(--engrave)` on the garage wall, `--engrave-fine` for small caps.
- Body: `--font-body` Inter. Readouts and specs: `--font-mono`, in object units (dB, ms, `$`, `VST3 · AU`).
- Painted copy erodes with wear: stencil words on the wall are outlined brass that fills on hover;
  the filled word is `--oxide-text`, never race-red (Law 5 + one-hero rule).
- Kickers (`.hh-tag`, `.sk-tag`): mono, letter-spaced 0.3em, `--brass`.

## 4. Components

- Hero gauge medallion: face PNG (static, lit), needle (rotates; the light never rotates), hub (static).
  Needle: -135° min, -90° idle, +90° redline, +135° max; scroll revs it; pointer micro-deflects.
- Garage wall: `wall-wood.png` tile 512px, brass rail `wall-rail.png` top + bottom (`--rail-h` 30px,
  22px at 480px and below), rail cast shadow, `data-drift-y` 24px parallax on the wood.
- Story plate: frameless. The photo fills its grid cell (`object-fit: cover`) and every edge
  vignettes into the page (`inset 0 0 96px 12px --bg-0`) so it reads as a window into the shop,
  not a card. The hung parts (UI window, door) carry the shadow stack and lift 1px on hover.
- Word wall: five stencil words in Bebas, `-webkit-text-stroke` brass, opacity 1 / .7 / .5 / .35
  outward from the filled word; hover fills any word in ~120ms house curve.
- Trial CTA / buy: flat brass-bright button (`.trial-cta`) on `/`; the crane door on product pages.
- Coverflow showcase, DAW strip, EmailCapture, SubscribeModal, TrialGateModal: unchanged house parts.

## 5. Depth & lighting

One light source, upper-left (~35% 25%). On the wall: a warm top light `rgba(255,214,150,.07)` to 0
over the first 32% of height, plus a 38% `--bg-0` scrim so parchment ink passes AA on the wood.
Photos: their own lamps stay where the photographer put them; the page adds only the vignette
into `--bg-0` (outer and bottom edges) so the plate reads as a window into the shop, not a card.
Shadow stack (all raised parts): `0 1px 0 #000` contact + `0 8-24px 24-48px rgba(0,0,0,.5-.6)`.
Hover: lift 1px + shadow grows; press: return, 2px max travel.

## 6. Motion

Canon = the crane door (`BuyButtonCrane.astro`): physics, feedback only, in the page. Curves
`--ease-settle cubic-bezier(.22,1,.36,1)` entries 600ms, `--ease-exit` 300ms, stagger 90ms; hover
strikes ~120ms `cubic-bezier(.2,.9,.25,1.25)`. Scroll: needle revs; wood drifts 24px; reveals via
`data-reveal` (top 80%) with a 2.5s force-reveal. Reduced motion: everything visible at rest, no
parallax, no needle rev. Nothing loops idle.

## 7. Hero + glanceability

THE hero is the gauge medallion with "Engineered, Then Tuned." over it. One glance: brass tach,
red sweep under the headline, "Boutique plugins" above. Everything below is the walk through the
garage: rack, stencil wall, three photos, the door. No second hero, no metric grid, no card grid.

## 8. Layout

```
+------------------------------------------------------+
| HERO  gauge medallion + 2-line headline               |  ~100svh, vignette
+------------------------------------------------------+
| OUR PLUGINS  coverflow rack (#plugins)                |  unchanged
+------------------------------------------------------+
| WORD WALL  LOUD / WARM / PUNCHY / GLUED / DEEP        |  wood wall + rails; RevLimiter UI right
+------------------------------------------------------+
| STORY 1  photo | copy   "Built in a garage"           |  photo bleeds to left edge
| STORY 2  copy | photo   "Read it in one glance"       |  photo bleeds to right edge
| STORY 3  door | copy    "Honest by design"            |  crane door on the wall
+------------------------------------------------------+
| GOES WITH EVERY VEHICLE  DAW strip                    |  unchanged
| JOIN THE PIT CREW  EmailCapture                       |  unchanged
| HEAR IT ON YOUR OWN MIX  trial CTA                    |  unchanged
+------------------------------------------------------+
```

Base: `--maxw min(1440px, 95vw)`; rows collapse to one column at 860px and below, photo first.

## 9. Do's & don'ts

- DO bleed photos to the viewport edge; DON'T box them in card grids (PRODUCT.md anti-reference).
- DO keep every claim checkable against the plugin source; DON'T caption a plate with a sound claim
  the plugin can't back. Stencil words describe the intent of the tools, in plain adjectives.
- DON'T add a second race-red element, a countdown, a star rating, or a press logo (data files are
  empty by design until real ones exist).
- DON'T absolute-position decorative props to pixel coordinates; wall, rails and plates are flow +
  percentages so every viewport works.
- Astro scoped styles: anything injected at runtime or living in another component needs `:global()`.
- Plates ship as JPEG in `src/assets/garage/` (2000px wide max, q86); `<Image>` emits the webp set.

## 10. Open questions (for Dan)

- The `unit-floor` plate is the Instagram-era render of RevLimiter as a hardware unit; its panel
  predates the shipping UI (MB COMP / CRUISE labels). Keep it as mood, re-render with the current
  plate, or drop it?
- The car plate is a frame from the 2026-06 photoreal teaser (`revlimiter-teaser-v1.mp4`),
  upscaled x4 locally with Real-ESRGAN. Good enough, or generate a wide garage plate once image
  credits are back?
- Stencil words: LOUD / WARM / PUNCHY / GLUED / DEEP. Which one should be the filled (oxide) word?
- Promote `/garage` to `/` once reviewed?
