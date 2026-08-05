/**
 * Plugin catalog — single source of truth for store + marketing pages.
 *
 * Lifecycle:
 *   status: 'in-development' → no Buy CTA, only waitlist
 *   status: 'beta'           → Buy CTA shows but no checkoutUrl until product live
 *   status: 'live'           → Buy CTA active, set checkoutUrl to the Lemon Squeezy buy link
 *
 * ARRAY ORDER IS THE STORE ORDER: /store renders this list as-is, so shipping
 * plugins lead and in-development ones trail. Nothing else depends on order
 * (Header/Cart/TrialGateModal look plugins up by slug).
 *
 * Prices are intent — flip when commerce launches.
 * Checkout: engine-switched in src/data/site.ts (checkoutEngine). 2026-08-03:
 * 'ls' — Lemon Squeezy re-activated as the interim engine (checkoutUrl) while
 * FastSpring onboarding finishes (fastspringPath, ready to flip to). The
 * site-wide trial gate is LIFTED for the paid plugins; GAS keeps
 * `trialGateActive` on purpose — its email-gate IS the free download's
 * delivery mechanism, not a checkout pause.
 */

export type PluginStatus = 'in-development' | 'beta' | 'live';
export type PluginCategory = 'limiter' | 'saturation' | 'panner' | 'eq' | 'multi-fx';

export interface Feature {
  name: string;
  desc: string;
  /** Optional slug into the plugin's `stage.parts` map — enables the
   *  scroll-linked part-highlighter on the product page. Omit for plugins
   *  without a `stage` (falls back to plain image crossfade). A plugin with a
   *  `stage` must map EVERY feature: one unmapped feature turns the whole
   *  highlighter off, so a typo fails loudly instead of silently. */
  part?: string;
}

/** A part is EITHER a region on `stage.shot` (percent rect, 0-100) that the
 *  highlight box animates onto, OR an alternate full-panel screenshot the stage
 *  crossfades to (for a control that lives in its own window — e.g. a modal not
 *  present on the base shot). The base screenshot itself never transforms
 *  (no zoom/pan).
 *  `thumb`: optional native-resolution close-up (src/assets/plugins/) used as
 *  the mobile step preview instead of a CSS crop of the base shot — crops of
 *  the 700px stage image upscale badly on small screens. */
export type StagePart =
  | { x: number; y: number; w: number; h: number; thumb?: string }
  | { shot: string };

/** Data-driven config for the "What's inside" part-highlighter. Add this to
 *  a plugin + `part` slugs on its features to get the interactive overlay;
 *  omit both to keep the plain image-crossfade walkthrough. */
export interface Stage {
  /** Screenshot filename, resolved the same way as heroImage/galleryImages. */
  shot: string;
  parts: Record<string, StagePart>;
}

export interface AudioDemo {
  label: string;
  description?: string;
  beforeUrl: string | null;
  afterUrl: string | null;
}

export interface SystemReq {
  os: string;
  cpu: string;
  ram: string;
  formats: string;
  daws: string;
}

export interface Plugin {
  slug: string;
  name: string;
  category: PluginCategory;
  tagline: string;
  oneLiner: string;
  /** Optional bold hook — one line, in the plugin's character. Rendered on its own
   *  line above plainWhat inside the same paragraph. Omit for no hook. */
  plainHook?: string;
  /** Jargon-free plain tail — what it does, no metaphor needed to parse it. Shown
   *  first on the product page (after plainHook when present). */
  plainWhat: string;
  longPitch: string;
  status: PluginStatus;
  statusLabel: string;
  /** Suppress the status-pill badge next to the product-page title (e.g. while
   *  the label reads awkwardly next to a fresh launch — kept per-plugin so the
   *  default badge still shows for everything else). */
  hideStatusPill?: boolean;
  /** Store-card thumbnail floats frameless at its own aspect ratio, no dark
   *  letterbox box — for hero shots that aren't the wide RevLimiter-style
   *  desktop panel (e.g. a portrait or narrower screenshot). */
  cardThumbBare?: boolean;
  /** Caps the bare thumbnail's width within the card (percent). A tall
   *  portrait shot at 100% width reads oversized next to the wide panels —
   *  this shrinks it back down to a proportionate product photo. */
  cardThumbMaxWidthPct?: number;
  /** Overrides the card-thumb frame's aspect-ratio (e.g. '800/1190') to match
   *  a hero shot that isn't the wide RevLimiter-style panel — a narrow/portrait
   *  shot in the default wide box left huge dark flanks either side (the
   *  surrounding card background reading as a big empty void). Keeps the
   *  bordered frame (unlike cardThumbBare), just reshaped to fit. */
  cardThumbAspect?: string;
  /** Promo disclaimer shown next to price everywhere the plugin appears
   *  (product page buy card, store card, homepage carousel) — e.g. a
   *  bundle-in freebie tied to buying a different plugin. */
  bundleNote?: string;
  introPriceUsd: number | null;
  regularPriceUsd: number | null;
  /** Lemon Squeezy hosted checkout URL. Null until wired → product shows the "checkout reopening" state. */
  checkoutUrl: string | null;
  /** FastSpring product path (Store Builder Library) — the catalog SKU/path
   *  configured in the FastSpring storefront admin, NOT a URL. Kept alongside
   *  checkoutUrl (LS) so the checkout engine can roll back by just switching
   *  which one Cart.astro reads. */
  fastspringPath?: string | null;
  /** True while a live product has no working checkout yet (checkoutUrl not set). */
  checkoutPaused: boolean;
  /** Discount code the buyer must enter at checkout to get the intro price. */
  promoCode?: string;
  /** Forever-price posture line painted by the price wherever the door sells
   *  (crane door + its fallen .dz twin). Line-wide rule (ratified 2026-08-04):
   *  every plugin launches at its forever price — $49/$69/$99 tiers. */
  pricePolicy?: string;
  /** True for no-cost plugins — product page shows FREE + a Download CTA
   *  instead of pricing/checkout, and skips serial/licence-key copy. */
  isFree?: boolean;
  /** Hosted installer URL for free plugins. Null until the build is packaged
   *  and uploaded — product page shows a "download coming soon" waitlist
   *  state instead (mirrors checkoutUrl's null-state convention above). */
  downloadUrl?: string | null;
  demoUrl: string | null;
  releaseTarget: string;
  heroImage: string | null;
  galleryImages: string[];
  features: Feature[];
  audioDemos: AudioDemo[];
  systemReq: SystemReq;
  reviewsCount: number;
  reviewsAvg: number;
  /** Optional part-highlighter stage config — see `Stage`. */
  stage?: Stage;
  /** Use the crane-hung garage door as the buy card instead of the classic
   *  BuyButton aside (BuyButtonCrane + CraneDropZone, bench /cranelab). The
   *  door is brand furniture, not RevLimiter's alone — its painted copy is all
   *  data (price, discount tag, promo code), so it reads correctly for any
   *  plugin. Only takes effect on a buyable product. */
  craneBuy?: boolean;
  /** Free-trial CTA target (the Downloads portal). When set, the product page
   *  mounts the trial stamp between the title and the buy card. */
  trialUrl?: string;
  /** Embedded YouTube tutorial — when set, a video section renders between
   *  "Hear it" and "System requirements" on the product page. */
  tutorialVideo?: { title: string; youtubeId: string; blurb?: string };
  /** True while checkout is intentionally paused for a payment-provider
   *  migration (2026-07-26). Every buy/download CTA (BuyButton,
   *  BuyButtonCrane, CraneDropZone, MobileBuyBar, PluginCard) swaps its
   *  normal action for the TrialGateModal popup instead — "checkout's under
   *  construction, get the trial" + an email gate. Drop this flag once
   *  checkout is back to restore the real buy/download buttons everywhere. */
  trialGateActive?: boolean;
}

const baseSystemReq: SystemReq = {
  os: 'Windows 10/11 64-bit, macOS 12+',
  cpu: '2 GHz dual-core (Intel/AMD)',
  ram: '8 GB minimum, 16 GB recommended',
  formats: 'VST3, AU, AAX',
  daws: 'Cubase 12+, Studio One 6+, Reaper 7+, Ableton Live 11+, FL Studio 21+, Logic Pro 11+',
};

// RevLimiter — Lemon Squeezy hosted checkout URL. Forever-price posture
// (partner call 2026-08-04): flat $49, we don't do sales — no discount code
// rides the URL, no visible coupon field anywhere on the site.
// VERIFY on the next test purchase: LS list price must show $49 (the LS-side
// variant price change is Yoni/Gil's lane).
const REVLIMITER_CHECKOUT_URL: string | null = 'https://revaudiopg.lemonsqueezy.com/checkout/buy/78885904-8a19-4e23-9510-31b50775ada5';

// Radio Roulette — Lemon Squeezy hosted checkout URL. Interim: we're
// migrating the whole payment system to FastSpring, but this LS variant
// covers checkout in the meantime until that account is approved.
// Reopened 2026-07-23 — fixes are in, checkout is back on.
const RADIOROULETTE_CHECKOUT_URL: string | null = 'https://revaudiopg.lemonsqueezy.com/checkout/buy/884e8eb9-903e-497d-a9ec-41153a6b1738';

// GAS — always free, no checkout. Ships via the same download portal as
// RevLimiter's trial (also linked from the header "Downloads" nav).
const GAS_DOWNLOAD_URL: string | null = 'https://revlimiter-license.revaudio.workers.dev/download';

export const plugins: Plugin[] = [
  {
    slug: 'revlimiter',
    name: 'RevLimiter',
    category: 'limiter',
    tagline: 'A mastering limiter you read like a tachometer',
    oneLiner:
      'The redline is your threshold. The needle is your gain reduction. Mastering loudness with the muscle of a tuned engine.',
    plainHook: 'Easy to drive. Hard to crash.',
    plainWhat:
      'It goes last on your master bus and makes your track commercial-release loud. Punchy, not squashed.',
    longPitch:
      'Multi-band compression, analog-modelled saturation, and an adaptive limiter, chained the way a top-tier mastering engineer would chain them, under a true-peak ceiling at oversampled rate.',
    status: 'live',
    statusLabel: REVLIMITER_CHECKOUT_URL ? 'Available now' : 'Checkout reopening soon',
    // Forever price (partner call 2026-08-04): flat $49, never on sale —
    // no was-price anchor, no promo code. discountPct() returns null, which
    // retires every "launch sale" tag and code hint site-wide on its own.
    introPriceUsd: 49,
    regularPriceUsd: null,
    pricePolicy: "We don't do sales. This is the price.",
    checkoutUrl: REVLIMITER_CHECKOUT_URL,
    fastspringPath: 'revlimiter',
    checkoutPaused: !REVLIMITER_CHECKOUT_URL,
    // Gate lifted 2026-08-03: checkout re-opened on the LS interim engine
    // (site.checkoutEngine) — BUY is a real add-to-cart again and the door's
    // painted trial line carries the trial offer. Re-set to true only if
    // checkout pauses again.
    trialGateActive: false,
    demoUrl: null,
    releaseTarget: 'Q3 2026',
    heroImage: 'revlimiter-hero.png',
    galleryImages: [],
    features: [
      { name: 'True-peak limiting', desc: 'Hit the ceiling, never cross it. Inter-sample peak control at oversampled rate, with a base-rate hard-clip as the safety net.', part: 'ceiling' },
      { name: 'Adaptive multi-band release', desc: 'Per-band envelope tracking. Bass holds, mids breathe, highs respond. No static release time fights your material.', part: 'bands' },
      { name: 'Multiband glue', desc: 'One switch engages transparent multiband glue: Low, Mid and High gain density, with no tone coloring.', part: 'mb' },
      { name: 'Visual crossover', desc: 'Open the digital crossover: a live spectrum with two draggable split points that set exactly where Low, Mid and High divide. The dashed lines are each band’s comp threshold — drag them to set.', part: 'crossover' },
      { name: 'Analog-modelled saturation', desc: 'Asymmetric soft-to-hard curve with DC-block. Adds density and weight before the brick wall.', part: 'saturation' },
      { name: 'Three engine modes', desc: 'One switch, three drive characters: Cruise for gentle, transparent glue; Sport for punchy, snappy grip; NOS for loud, aggressive hard-clip muscle.', part: 'modes' },
      { name: 'Auto gain', desc: 'Auto makeup gain recovers loudness as the threshold digs deeper. Click it off to hear the honest level — no loudness flattery. Built for fair A/B checks.', part: 'again' },
      { name: 'Clipper ceiling', desc: 'The hard ceiling nothing gets past. Set the absolute peak limit: pull it down for safe true-peak headroom, push it up for raw loudness.', part: 'clipper' },
      { name: 'Pro-tier metering', desc: 'Trust your eyes, not a guess: true peak, max peak, LUFS-M/S/I, LRA and per-band GR, RT-safe and audited against external mastering meters.', part: 'meters' },
      { name: 'Live spectrum analyser', desc: 'An always-on spectrum across the bottom deck. Watch your master’s balance in real time as it hits the wall.', part: 'spectrum' },
      { name: 'Up to 32× oversampling', desc: 'Catch the peaks between samples, selectable up to 32×, for the dense mixes that fight the ceiling and need surgical inter-sample control.', part: 'oversampling' },
      { name: 'Visual rev gauge', desc: 'Redline = threshold. Needle = gain reduction. You know what is happening at a glance.', part: 'gauge' },
      { name: 'Output trim', desc: 'Final volume out the tailpipe. Trim the master level after limiting: it does not change the squeeze, just how loud it leaves.', part: 'output' },
      { name: 'A/B compare', desc: 'Two state slots. Switch instantly. Compare without leaving the plugin.', part: 'ab' },
    ],
    audioDemos: [
      { label: 'RevLimiter', beforeUrl: '/audio/revlimiter/revlimiter-before.m4a', afterUrl: '/audio/revlimiter/revlimiter-after.m4a' },
      { label: 'Crash Test', beforeUrl: '/audio/revlimiter/gods-test-before.m4a', afterUrl: '/audio/revlimiter/gods-test-after.m4a' },
      { label: 'High Beams', beforeUrl: '/audio/revlimiter/light-the-way-before.m4a', afterUrl: '/audio/revlimiter/light-the-way-after.m4a' },
    ],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
    trialUrl: 'https://revlimiter-license.revaudio.workers.dev/download',
    craneBuy: true,
    tutorialVideo: {
      title: "Driver's Manual",
      youtubeId: 'Og4PRlBFco8',
      blurb: 'Everything under the hood: the full RevLimiter tutorial, from first insert to redline.',
    },
    // Part rects for the v3.1.9 panel shot (2600x1256 source). Measured from
    // the live WebView UI DOM (getBoundingClientRect as % of .plugin, served
    // over http in WebKit), then padded so each box frames its control.
    // Shot + thumbs regenerate from tools/revlimiter-shoot/.
    stage: {
      shot: 'revlimiter-hero.png',
      parts: {
        ceiling: { x: 65.5, y: 16.5, w: 19, h: 29.5, thumb: 'revlimiter-part-ceiling.png' },
        bands: { x: 2.3, y: 12.5, w: 17.5, h: 58, thumb: 'revlimiter-part-bands.png' },
        mb: { x: 22, y: 18, w: 6.6, h: 32.5, thumb: 'revlimiter-part-mb.png' },
        // Alternate shot — the X·OVER control opens its own modal window that
        // isn't on the base panel, so this part swaps the whole stage image.
        crossover: { shot: 'revlimiter-xover.png' },
        // Orphan (no discrete control) — whole drive/HEAT cluster.
        saturation: { x: 1, y: 44.5, w: 39.5, h: 54.5, thumb: 'revlimiter-part-saturation.png' },
        // Cruise / Sport / NOS bat-lever triplet (box all three).
        modes: { x: 60.8, y: 51.5, w: 24, h: 30.3, thumb: 'revlimiter-part-modes.png' },
        // A-GAIN press button (gain comp), left of the mode switches.
        again: { x: 55.1, y: 62.3, w: 6.4, h: 12.7 },
        meters: { x: 83.8, y: 25, w: 14.9, h: 27, thumb: 'revlimiter-part-meters.png' },
        spectrum: { x: 19.6, y: 76.5, w: 70, h: 21.5, thumb: 'revlimiter-part-spectrum.png' },
        // Far-right column knobs (own the CLIPPER + OUTPUT labels).
        clipper: { x: 86, y: 50.5, w: 12.6, h: 23, thumb: 'revlimiter-part-clipper.png' },
        output: { x: 87.9, y: 74, w: 10.5, h: 25 },
        oversampling: { x: 77.2, y: 5.8, w: 6.7, h: 7, thumb: 'revlimiter-part-oversampling.png' },
        gauge: { x: 36, y: 0.5, w: 30, h: 62 },
        ab: { x: 29.5, y: 6, w: 6.4, h: 11.5, thumb: 'revlimiter-part-ab.png' },
      },
    },
  },
  {
    slug: 'radio-roulette',
    name: 'Radio Roulette',
    category: 'multi-fx',
    tagline: 'You’ll never know what’s next',
    oneLiner: 'The station that never plays the same song twice.',
    plainHook: 'Spin the dial. Keep what lands.',
    plainWhat:
      'One dial reshapes your sound through up to ten effects at once, and the same station always plays back the same result.',
    longPitch:
      'A chaos engine with a memory. Every station is one number, and that number sets all ten stages at once: filter, EQ, fuzz, pitch, chorus, delay, reverb, trance gate, stereo width and pan. Double-click TUNE and it scans off to a new one. Whatever it lands on is level-matched and ceiling-safe, so the surprise is always the sound and never the volume. Find a station worth keeping and it stays: saved with your session, stored on a key, recalled exactly.',
    status: 'live',
    statusLabel: 'Available now',
    hideStatusPill: true,
    cardThumbBare: true,
    introPriceUsd: 19,
    regularPriceUsd: null,
    checkoutUrl: RADIOROULETTE_CHECKOUT_URL,
    fastspringPath: 'radio-roulette',
    checkoutPaused: !RADIOROULETTE_CHECKOUT_URL,
    // Gate lifted 2026-08-03 with RevLimiter's — see that entry. Re-set to
    // true only if checkout pauses again.
    trialGateActive: false,
    demoUrl: null,
    releaseTarget: '2026',
    heroImage: 'radioroulette-hero.png',
    galleryImages: [],
    features: [
      { name: 'One station, one sound', desc: 'A station is a single number from 0 to 1,000,000, and that number configures all ten stages at once. The same station always plays back the same result, on any machine, forever.', part: 'station' },
      { name: 'Tune it, or let it scan', desc: 'Drag TUNE to walk the dial station by station. Double-click and it sweeps like a scanner, then lands somewhere you would never have picked yourself.', part: 'tune' },
      { name: 'Ten effects on one dial', desc: 'Filter, EQ, fuzz, pitch, chorus, delay, reverb, gate, stereo and pan. The names lit on the glass are the ones this station is running. Click a lit name to mute that stage, click again to bring it back.', part: 'chain' },
      { name: 'Five station keys', desc: 'Click a key to recall its station, double-click to store the one you are on. The keys keep their stations on your machine, so your five favourites are always one press away.', part: 'keys' },
      { name: 'MIX', desc: 'Global dry/wet blend, smoothed. At zero the dry path is bit-transparent, so you can park Radio Roulette on a bus and dial the damage in from nothing.', part: 'mix' },
      { name: 'Oversampling, 1x to 32x', desc: 'The fuzz stage runs oversampled up to 32x. Click OS to cycle it: higher for clean drive on hot material, lower when you want the CPU back. House default is 2x.', part: 'os' },
      { name: 'True bypass', desc: 'Flip POWER down and the dry signal passes untouched, on a 10 ms fade so the switch never clicks.', part: 'power' },
      { name: 'It cannot blow up', desc: 'Every station is level-matched by a per-station gain model, then finished with a soft ceiling at -0.3 dBFS on the wet path. At least two character effects are always on, so it cannot land on silence either. Watch the VU: chaos, at a sane level.', part: 'vu' },
    ],
    audioDemos: [],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
    trialUrl: 'https://revlimiter-license.revaudio.workers.dev/download',
    craneBuy: true,
    tutorialVideo: {
      title: "Driver's Manual",
      youtubeId: '610pUxqBSks',
      blurb: 'Everything under the hood: the full Radio Roulette tutorial, station by station.',
    },
    /* Part rects measured off the live v1.9.1 WebView UI (served over http,
       WebKit): each control's getBoundingClientRect as a percent of #dash, then
       padded so the walkthrough box frames the control instead of tracing it.
       The dial-name rects are 1.4% tall in the DOM, hence the vertical padding.
       Shot + thumbs regenerate from scratchpad/rr-shoot-true.mjs + rr-assets.py.

       The shot is station 456149 with all ten names lit. Served without a DSP
       behind it the UI lights its lamps from a mulberry32 demo, which is NOT
       what the plugin does for a given station, so the shoot script recomputes
       the real enables (mt19937, ported from deriveSettings) and paints those
       instead. The panel in the shot is a station the plugin genuinely produces. */
    stage: {
      shot: 'radioroulette-hero.png',
      parts: {
        station: { x: 27.0, y: 67.7, w: 11.5, h: 4.4, thumb: 'radioroulette-part-station.png' },
        tune: { x: 76.6, y: 52.6, w: 11.6, h: 24.0, thumb: 'radioroulette-part-tune.png' },
        chain: { x: 26.8, y: 63.3, w: 43.6, h: 4.2, thumb: 'radioroulette-part-chain.png' },
        keys: { x: 35.5, y: 78.7, w: 28.8, h: 14.3, thumb: 'radioroulette-part-keys.png' },
        mix: { x: 11.4, y: 52.0, w: 11.8, h: 24.6, thumb: 'radioroulette-part-mix.png' },
        os: { x: 56.8, y: 67.7, w: 6.8, h: 4.4, thumb: 'radioroulette-part-os.png' },
        power: { x: 25.1, y: 78.0, w: 6.5, h: 15.5, thumb: 'radioroulette-part-power.png' },
        vu: { x: 65.7, y: 79.5, w: 11.6, h: 12.5, thumb: 'radioroulette-part-vu.png' },
      },
    },
  },
  {
    slug: 'gas',
    name: 'GAS',
    category: 'saturation',
    tagline: 'A one-knob saturator you drive like a gas pedal',
    oneLiner:
      'One DRIVE knob, three voices: Tube, Tape, Fuzz. Floor it for character, not just loudness.',
    plainHook: 'Step on it.',
    plainWhat:
      'A free saturator: one DRIVE knob adds grit and warmth, and Tube, Tape or Fuzz picks the flavor.',
    longPitch:
      'One knob does the work of five. GAS stages drive gain, tone shaping, and calibrated loudness compensation together, so turning DRIVE changes character, never just volume. Three voices: Tube for even-harmonic warmth, Tape for symmetric saturation with programme-dependent squash, Fuzz for a dying-battery snarl that cleans up under sustain. A check-engine lamp lights up when you’re really flooring it.',
    status: 'live',
    statusLabel: 'Available now',
    hideStatusPill: true,
    cardThumbAspect: '800/1190',
    cardThumbMaxWidthPct: 40,
    introPriceUsd: null,
    regularPriceUsd: null,
    checkoutUrl: null,
    checkoutPaused: false,
    isFree: true,
    downloadUrl: GAS_DOWNLOAD_URL,
    // Checkout paused site-wide during the payment-provider migration
    // (2026-07-26) — every download CTA opens TrialGateModal instead. Drop
    // this once checkout's back.
    trialGateActive: true,
    demoUrl: null,
    releaseTarget: 'Available now',
    heroImage: 'gas-hero.png',
    galleryImages: [],
    tutorialVideo: {
      title: "Driver's Manual",
      youtubeId: 'b4RpGt4-k44',
      blurb: 'Everything under the hood: the full GAS tutorial, one knob, three voices.',
    },
    // ORDER IS EDITORIAL: /gas (src/pages/gas.astro) prints the first three
    // names as its only feature copy, so the three that sell GAS lead the list.
    // No `stage` / `part` slugs — GAS left the shared product layout on
    // 2026-07-30 and its one-screen page has no part-highlighter to feed. The
    // measured rects are in git if that page ever wants them (1724a27, daf25ba).
    features: [
      { name: 'One-knob DRIVE macro', desc: 'A single control stages drive gain, pre/post EQ, dynamics, and calibrated loudness compensation together, so turning the knob changes character, never volume.' },
      { name: 'Three voices: Tube, Tape, Fuzz', desc: 'Tube: even-harmonic asymmetric warmth. Tape: symmetric saturation with programme-dependent squash. Fuzz: biased arctan/hard-clip blend with battery-sag sputter.' },
      { name: 'Up to 8× oversampling', desc: 'Antiderivative anti-aliasing on every shaper, oversampled 8× on HQ and 4× on Eco, for drive that stays clean instead of aliasing.' },
      { name: 'Calibrated loudness compensation', desc: 'A static calibrated gain match, not a live auto-gain loop. The 0 to 10 arc reads character, not level: deterministic, null-test friendly, no pumping, no cheating the sweep.' },
      { name: 'Check-engine heat lamp', desc: 'Lights up when you’re really flooring it, reading real DSP heat, not just knob position.' },
      { name: 'Parallel MIX blend', desc: 'The mini knob blends the driven signal against a latency-matched dry path, so you can park GAS on a bus and dial the grit in behind the clean. Double-click for fully wet.' },
    ],
    audioDemos: [],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
  {
    slug: 'drift',
    name: 'Drift',
    category: 'panner',
    tagline: 'A multiband panner you steer like a drift car',
    oneLiner:
      'Send your selected freq. band to a trip across the stereo field.',
    plainHook: 'Controlled slides. No spinouts.',
    plainWhat:
      'It moves chosen frequency bands across the stereo image, with saturation, reverb and tremolo per band. Wide and alive, never seasick.',
    longPitch:
      'A multiband panner built for movement. Slice your mix into bands and send each one drifting across the stereo image, with saturation, reverb and tremolo per band. Flip on Autopilot and an LFO steers the motion for you, controlled slides that keep the mix wide and alive.',
    status: 'in-development',
    statusLabel: 'In development',
    introPriceUsd: null,
    regularPriceUsd: null,
    checkoutUrl: null,
    checkoutPaused: false,
    demoUrl: null,
    releaseTarget: '2026',
    heroImage: 'coming-soon-plate.png',
    galleryImages: [],
    features: [
      { name: 'Multiband panning', desc: 'Split the spectrum and send each band sliding across the stereo field independently.' },
      { name: 'Per-band character', desc: 'Saturation, reverb and tremolo dialled in per band. Movement with tone, not just position.' },
      { name: 'Autopilot', desc: 'LFO-driven motion that steers the pan or a chosen band for you. Hands-off, living stereo.' },
    ],
    audioDemos: [],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
  {
    slug: 'the-ac',
    name: 'The AC',
    category: 'saturation',
    tagline: 'An air-band exciter that brings the breeze',
    oneLiner:
      'Add clean air and shine to your top end.',
    plainHook: 'Cold for air. Hot for warmth.',
    plainWhat:
      'It opens the top of your mix with sparkle instead of harshness, all from one temperature dial.',
    longPitch:
      'An air-band specialist. The AC adds breeze and shine to the top of your mix with a harmonic exciter, tube saturation, and intelligent resonance taming, all set by a single car-AC temperature dial. Cold leans bright and airy, hot leans warm and saturated, the middle blends both.',
    status: 'in-development',
    statusLabel: 'In development',
    introPriceUsd: null,
    regularPriceUsd: null,
    checkoutUrl: null,
    checkoutPaused: false,
    demoUrl: null,
    releaseTarget: '2026',
    heroImage: 'coming-soon-plate.png',
    galleryImages: [],
    features: [
      { name: 'Air-band excitement', desc: 'Harmonic exciter focused on the top octaves. Openness and shine without harshness.' },
      { name: 'Tube saturation', desc: 'Warm valve-style saturation on the air band for density and sheen.' },
      { name: 'Smart resonance taming', desc: 'Dynamic EQ / resonance suppression keeps the boosted top smooth.' },
      { name: 'Temperature dial', desc: 'One car-AC temperature control blends exciter (cold) to tube (hot); mid is both.' },
    ],
    audioDemos: [],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
];

export const bySlug = (slug: string) => plugins.find((p) => p.slug === slug);

/** License-worker plugin id for the download gate — the worker's DL_PLUGINS
 *  key. Site slugs are kebab-case, worker ids are flat ('radio-roulette' →
 *  'radioroulette'); the flatten covers all current and conventional names. */
export const dlGateId = (p: Plugin) => p.slug.replace(/-/g, '');

export const isBuyable = (p: Plugin) => p.status === 'live' && !!p.checkoutUrl;

export const fmtPrice = (usd: number | null) => (usd == null ? '—' : `$${usd}`);

export const discountPct = (p: Plugin): number | null => {
  if (p.regularPriceUsd == null || p.introPriceUsd == null) return null;
  if (p.regularPriceUsd <= p.introPriceUsd) return null;
  return Math.round(((p.regularPriceUsd - p.introPriceUsd) / p.regularPriceUsd) * 100);
};
