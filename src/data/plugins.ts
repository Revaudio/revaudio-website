/**
 * Plugin catalog — single source of truth for store + marketing pages.
 *
 * Lifecycle:
 *   status: 'in-development' → no Buy CTA, only waitlist
 *   status: 'beta'           → Buy CTA shows but no checkoutUrl until product live
 *   status: 'live'           → Buy CTA active, set checkoutUrl to the Lemon Squeezy buy link
 *
 * Prices are intent — flip when commerce launches.
 * Checkout: Lemon Squeezy (merchant of record) on `main`. On this branch
 * (`feature/fastspring-checkout`) Cart.astro reads `fastspringPath` instead —
 * checkoutUrl (LS) is left populated so the branch stays revertible.
 */

export type PluginStatus = 'in-development' | 'beta' | 'live';
export type PluginCategory = 'limiter' | 'saturation' | 'panner' | 'eq' | 'multi-fx';

export interface Feature {
  name: string;
  desc: string;
  /** Optional slug into the plugin's `stage.parts` map — enables the
   *  scroll-linked part-highlighter on the product page. Omit for plugins
   *  without a `stage` (falls back to plain image crossfade). */
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
   *  configured in the FastSpring storefront admin, NOT a URL. Wired on
   *  `feature/fastspring-checkout` alongside checkoutUrl so the branch can be
   *  rolled back onto Lemon Squeezy by just not merging it. */
  fastspringPath?: string | null;
  /** True while a live product has no working checkout yet (checkoutUrl not set). */
  checkoutPaused: boolean;
  /** Discount code the buyer must enter at checkout to get the intro price. */
  promoCode?: string;
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
  /** Free-trial CTA target (the Downloads portal). When set, the product page
   *  mounts the trial stamp between the title and the buy card. */
  trialUrl?: string;
  /** Embedded YouTube tutorial — when set, a video section renders between
   *  "Hear it" and "System requirements" on the product page. */
  tutorialVideo?: { title: string; youtubeId: string; blurb?: string };
}

const baseSystemReq: SystemReq = {
  os: 'Windows 10/11 64-bit, macOS 12+',
  cpu: '2 GHz dual-core (Intel/AMD)',
  ram: '8 GB minimum, 16 GB recommended',
  formats: 'VST3, AU',
  daws: 'Cubase 12+, Studio One 6+, Reaper 7+, Ableton Live 11+, FL Studio 21+, Logic Pro 11+',
};

// RevLimiter — Lemon Squeezy hosted checkout URL.
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
    introPriceUsd: 56,
    regularPriceUsd: 93,
    promoCode: 'VROOM',
    checkoutUrl: REVLIMITER_CHECKOUT_URL,
    fastspringPath: 'revlimiter',
    checkoutPaused: !REVLIMITER_CHECKOUT_URL,
    demoUrl: null,
    releaseTarget: 'Q3 2026',
    heroImage: 'revlimiter-hero.png',
    galleryImages: [],
    features: [
      { name: 'True-peak limiting', desc: 'Hit the ceiling, never cross it. Inter-sample peak control at oversampled rate, with a base-rate hard-clip as the safety net.', part: 'ceiling' },
      { name: 'Adaptive multi-band release', desc: 'Per-band envelope tracking. Bass holds, mids breathe, highs respond. No static release time fights your material.', part: 'bands' },
      { name: 'Multiband glue or EQ', desc: 'One switch flips the multiband stage between transparent glue compression and a live multiband EQ, so you shape each band’s tone, not just its level.', part: 'mb' },
      { name: 'Visual crossover', desc: 'Open the digital crossover: a live spectrum with two draggable split points that set exactly where Low, Mid and High divide.', part: 'crossover' },
      { name: 'Analog-modelled saturation', desc: 'Asymmetric soft-to-hard curve with DC-block. Adds density and weight before the brick wall.', part: 'saturation' },
      { name: 'Three engine modes', desc: 'One switch, three drive characters: Cruise for gentle, transparent glue; Sport for punchy, snappy grip; NOS for loud, aggressive hard-clip muscle.', part: 'modes' },
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
    tutorialVideo: {
      title: "Driver's Manual",
      youtubeId: 'Og4PRlBFco8',
      blurb: 'Everything under the hood: the full RevLimiter tutorial, from first insert to redline.',
    },
    // Part rects measured against src/assets/plugins/revlimiter-hero.png
    // (2542x1226 source). Percent of image, top-left origin.
    stage: {
      shot: 'revlimiter-hero.png',
      parts: {
        ceiling: { x: 66.5, y: 16.5, w: 18, h: 28, thumb: 'revlimiter-part-ceiling.png' },
        bands: { x: 2.5, y: 16.5, w: 18, h: 51, thumb: 'revlimiter-part-bands.png' },
        mb: { x: 22.5, y: 18, w: 6, h: 28.5, thumb: 'revlimiter-part-mb.png' },
        // Alternate shot — the X·OVER control opens its own modal window that
        // isn't on the base panel, so this part swaps the whole stage image.
        crossover: { shot: 'revlimiter-xover.png' },
        // Orphan (no discrete control) — whole drive/HEAT cluster.
        saturation: { x: 0.8, y: 44, w: 40, h: 54, thumb: 'revlimiter-part-saturation.png' },
        // Cruise / Sport / NOS bat-lever triplet (box all three).
        modes: { x: 62.5, y: 52.5, w: 21, h: 22, thumb: 'revlimiter-part-modes.png' },
        meters: { x: 83.5, y: 25, w: 15, h: 27, thumb: 'revlimiter-part-meters.png' },
        spectrum: { x: 19.5, y: 75, w: 69, h: 22, thumb: 'revlimiter-part-spectrum.png' },
        // Far-right column knobs (own the CLIPPER + OUTPUT labels).
        clipper: { x: 88, y: 55, w: 11, h: 18, thumb: 'revlimiter-part-clipper.png' },
        output: { x: 88, y: 75.5, w: 11, h: 23 },
        oversampling: { x: 76.5, y: 6, w: 7.5, h: 7, thumb: 'revlimiter-part-oversampling.png' },
        gauge: { x: 36, y: 0.5, w: 29.5, h: 61 },
        ab: { x: 29.5, y: 5.5, w: 6.5, h: 12, thumb: 'revlimiter-part-ab.png' },
      },
    },
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
    demoUrl: null,
    releaseTarget: 'Available now',
    heroImage: 'gas-hero.png',
    galleryImages: [],
    features: [
      { name: 'One-knob DRIVE macro', desc: 'A single control stages drive gain, pre/post EQ, dynamics, and calibrated loudness compensation together, so turning the knob changes character, never volume.' },
      { name: 'Three voices: Tube, Tape, Fuzz', desc: 'Tube: even-harmonic asymmetric warmth. Tape: symmetric saturation with programme-dependent squash. Fuzz: biased arctan/hard-clip blend with battery-sag sputter.' },
      { name: 'Calibrated loudness compensation', desc: 'A static calibrated gain match, not a live auto-gain loop. Deterministic, null-test friendly, no pumping, no cheating the sweep.' },
      { name: 'Check-engine heat lamp', desc: 'Lights up when you’re really flooring it, reading real DSP heat, not just knob position.' },
      { name: 'Up to 8× oversampling', desc: 'Antiderivative anti-aliasing on every shaper, oversampled per voice, for drive that stays clean instead of aliasing.' },
    ],
    audioDemos: [],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
  {
    slug: 'radio-roulette',
    name: 'Radio Roulette',
    category: 'multi-fx',
    tagline: 'You’ll never know what’s next',
    oneLiner: 'The station that never plays the same song twice.',
    plainHook: 'Spin the dial. Keep what lands.',
    plainWhat:
      'One button reshapes your sound through up to ten effects at once, and the same seed always plays back the same result.',
    longPitch:
      'A chaos/glitch multi-effect built around a single seed. RANDOMIZE rolls a new seed and instantly reconfigures a ten-stage chain (filter, EQ, fuzz, pitch-shift, chorus, delay, reverb, trance gate, stereo width, and pan), all deterministically, all level-matched and safety-limited so it never goes silent or blows up. Save a seed in your DAW to recall the exact sound later, or step through station presets like tuning an old dashboard radio.',
    status: 'live',
    statusLabel: 'Available now',
    hideStatusPill: true,
    cardThumbBare: true,
    introPriceUsd: 20,
    regularPriceUsd: null,
    checkoutUrl: RADIOROULETTE_CHECKOUT_URL,
    fastspringPath: 'radio-roulette',
    checkoutPaused: !RADIOROULETTE_CHECKOUT_URL,
    demoUrl: null,
    releaseTarget: '2026',
    heroImage: 'radioroulette-hero.png',
    galleryImages: [],
    features: [
      { name: 'One-seed chaos engine', desc: 'One seed (1–1,000,000) deterministically configures all ten effect stages at once. The same seed always reproduces the exact same sound.' },
      { name: 'RANDOMIZE', desc: 'Rolls a new seed and re-randomizes everything instantly. Every result is level-matched and safety-limited, so it can’t go silent or blow up.' },
      { name: '10-stage chain', desc: 'Filter → EQ → Fuzz → Pitch → Chorus → Delay → Reverb → Gate → Stereo → Pan, independently enabled per seed.' },
      { name: 'Filter', desc: 'State-variable low-pass, high-pass, or band-pass, with randomized cutoff and resonance.' },
      { name: 'Fuzz', desc: 'Drive into tanh, hard-clip, or foldback distortion.' },
      { name: 'Pitch shift', desc: 'Discrete semitone steps (±3, ±5, ±7, ±12) via a crossfaded ring buffer.' },
      { name: 'Chorus, delay & reverb', desc: 'Rate, depth, feedback, room size, damping, and width all randomized per seed.' },
      { name: 'Trance gate', desc: 'Square or sawtooth LFO gate, 1–12 Hz.' },
      { name: 'Stereo width & pan', desc: 'Mid/side width from narrow to wide, static pan or auto-pan LFO.' },
      { name: 'Station presets', desc: 'Five save slots: press to recall, shift-click to store your favorite seeds.' },
      { name: 'Seed recall', desc: 'Every seed is DAW-automatable and saved with your session. Dial in chaos once, keep it forever.' },
    ],
    audioDemos: [],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
];

export const bySlug = (slug: string) => plugins.find((p) => p.slug === slug);

export const isBuyable = (p: Plugin) => p.status === 'live' && !!p.checkoutUrl;

export const fmtPrice = (usd: number | null) => (usd == null ? '—' : `$${usd}`);

export const discountPct = (p: Plugin): number | null => {
  if (p.regularPriceUsd == null || p.introPriceUsd == null) return null;
  if (p.regularPriceUsd <= p.introPriceUsd) return null;
  return Math.round(((p.regularPriceUsd - p.introPriceUsd) / p.regularPriceUsd) * 100);
};
