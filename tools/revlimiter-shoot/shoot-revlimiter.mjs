// True-state shoot for the RevLimiter product-page assets (hero + xover shot +
// DOM-measured anchor rects). Paints the plugin's real idle defaults into the
// served WebView UI first — the standalone Juce shim boots with wrong values
// (mid-range knobs, NOS booster lit) and must never be shot as-is.
//
// Run:
//   cd ~/projects/revaudio/Revlimiter/Source/ui/public && python3 -m http.server 8787 --bind 127.0.0.1
//     (fonts/ -> Assets symlink must exist, same as preview-ui.sh)
//   npm i playwright && npx playwright install webkit   (one-time, anywhere)
//   node shoot-revlimiter.mjs
// Then: sips --resampleWidth 2600 out/{hero,xover}.png + assemble-assets.py
// for part rects overlay + mobile card thumbs. Rects land in src/data/plugins.ts.
import { webkit } from 'playwright';
import fs from 'fs';

const PAGE_URL = 'http://127.0.0.1:8787/index.html';
const OUT = new URL('./out/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const ANCHORS = [
  'knobLow', 'knobMid', 'knobHigh', 'low_gain', 'mid_gain', 'high_gain',
  'knobInput', 'valInput', 'knobSpec', 'valHeat', 'heat',
  'knobThreshold', 'threshold', 'thresholdCol', 'thrMark', 'valThreshold',
  'knobCeiling', 'knobOutput', 'valOutput',
  'osCombo', 'sizeCombo', 'presetCombo', 'undoRedo', 'agToggle',
  'abToggle', 'abCopy',
  'swBypassMbComp', 'mbEqDigital', 'xoverTitle', 'xoverBtn', 'xoverMini',
  'swCruise', 'swSport', 'swNos', 'nosArm', 'nosArmBtn', 'nosState',
  'readouts', 'readoutsLufsGr', 'rdResetBtn',
  'spectrumCanvas', 'checkEngine', 'infoBtn',
];

const browser = await webkit.launch();
const page = await browser.newPage({
  viewport: { width: 1920, height: 980 },
  deviceScaleFactor: 2,
});
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));

await page.goto(PAGE_URL, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

// ---- paint true idle state ----
const stateReport = await page.evaluate(() => {
  const rep = { set: [], failed: [], nos: null };
  // 1. knobs -> data-default via the Juce slider states
  document.querySelectorAll('[data-revaudio="knob"]').forEach((el) => {
    const id = el.dataset.paramId;
    const min = +el.dataset.min, max = +el.dataset.max, def = +el.dataset.default;
    const norm = (def - min) / (max - min);
    try {
      const st = window.Juce.getSliderState(id);
      st.setNormalisedValue(norm);
      if (st.valueChangedEvent?.callListeners) st.valueChangedEvent.callListeners();
      rep.set.push(`${id}=${def}`);
    } catch (e) { rep.failed.push(`${id}: ${e.message}`); }
  });
  // 1b. mode combo true defaults: base CRUISE, all boost levers FOLLOW,
  // modes_off false — the shim boots clip_mode at NOS's home value which
  // lights the NOS booster and flips its lid
  const setP = (id, norm) => {
    try {
      const st = window.Juce.getSliderState(id);
      st.setNormalisedValue(norm);
      st.valueChangedEvent?.callListeners?.();
      rep.set.push(`${id}~${norm.toFixed(3)}`);
    } catch (e) { rep.failed.push(`${id}: ${e.message}`); }
  };
  setP('mode', 0);
  setP('comp_mode', 0); setP('lim_mode', 0); setP('clip_mode', 0);
  try {
    const t = window.Juce.getToggleState('modes_off');
    t.setValue(false); t.valueChangedEvent?.callListeners?.();
  } catch (e) { rep.failed.push('modes_off: ' + e.message); }
  // 1c. crossover splits at the real defaults (log-skewed ranges): 150 / 2500 Hz
  setP('xover_low', Math.log(150 / 20) / Math.log(1000 / 20));
  setP('xover_high', Math.log(2500 / 200) / Math.log(16000 / 200));
  // 2. OS 8x
  const os = document.getElementById('osCombo');
  if (os) { os.value = '1'; os.dispatchEvent(new Event('change', { bubbles: true })); }
  // 3. UI scale 85%
  const sz = document.getElementById('sizeCombo');
  if (sz) {
    const opt = [...sz.options].find((o) => o.textContent.trim().startsWith('85'));
    if (opt) { sz.value = opt.value; sz.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  // 4. LUFS idle floor
  const lufs = document.getElementById('rdLufs');
  if (lufs) lufs.textContent = '-70.0';
  // 5. NOS cover state — report for inspection
  const nosArm = document.getElementById('nosArm');
  rep.nos = {
    nosArm: nosArm ? nosArm.className : null,
    nosState: document.getElementById('nosState')?.className ?? null,
    nosArmBtn: document.getElementById('nosArmBtn')?.className ?? null,
  };
  return rep;
});

await page.waitForTimeout(800);

// idle-state cleanup: our scripted param writes armed the undo history and the
// shim boots swNos with its guard flipped — the real plugin idles with both off
await page.evaluate(() => {
  // The lid IS closed (rotateX(0), no anims) — headless WebKit just doesn't
  // honor backface-visibility, so the guard's grey back face paints over the
  // red front. Hide the back face for the static shot.
  const fix = document.createElement('style');
  fix.textContent = '#swNos .guard-face.back { visibility: hidden !important; }';
  document.head.appendChild(fix);
  ['undoBtn', 'redoBtn'].forEach((id) => document.getElementById(id)?.classList.add('disabled'));
});
await page.waitForTimeout(600); // guard close animation

// verify a few readouts took
const verify = await page.evaluate(() => ({
  thresh: document.getElementById('valThreshold')?.textContent,
  input: document.getElementById('valInput')?.textContent,
  low: document.getElementById('low_gain')?.textContent ?? document.getElementById('valLow')?.textContent,
  output: document.getElementById('valOutput')?.textContent,
  os: document.getElementById('osCombo')?.selectedOptions[0]?.textContent,
  size: document.getElementById('sizeCombo')?.selectedOptions[0]?.textContent,
  lufs: document.getElementById('rdLufs')?.textContent,
}));

const plugin = page.locator('.plugin');
await plugin.screenshot({ path: OUT + 'hero.png' });

const data = await page.evaluate((ids) => {
  const p = document.querySelector('.plugin').getBoundingClientRect();
  const pct = (r) => ({
    x: +(((r.left - p.left) / p.width) * 100).toFixed(2),
    y: +(((r.top - p.top) / p.height) * 100).toFixed(2),
    w: +((r.width / p.width) * 100).toFixed(2),
    h: +((r.height / p.height) * 100).toFixed(2),
  });
  const out = { _plugin: { w: p.width, h: p.height }, anchors: {} };
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) out.anchors[id] = pct(el.getBoundingClientRect());
  }
  const svg = document.getElementById('needleWrap')?.closest('svg');
  if (svg) out.anchors['gaugeSvg'] = pct(svg.getBoundingClientRect());
  const heatSvg = document.getElementById('heat-face')?.closest('svg');
  if (heatSvg) out.anchors['heatGaugeSvg'] = pct(heatSvg.getBoundingClientRect());
  return out;
}, ANCHORS);
fs.writeFileSync(OUT + 'anchors.json', JSON.stringify(data, null, 2));

// X-OVER modal shot
await page.click('#xoverBtn');
await page.waitForSelector('#xoverModal', { state: 'visible', timeout: 5000 }).catch(() => errors.push('xoverModal never visible'));
await page.waitForTimeout(1000);
await plugin.screenshot({ path: OUT + 'xover.png' });

console.log(JSON.stringify({ stateReport, verify, plugin: data._plugin, errors }, null, 1));
await browser.close();
