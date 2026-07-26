// Generate bench/bench-trial-plates.html from the LIVE rendered section.
// Law: a bench is generated from current real source and must share the
// production layout model — this section is flow + container queries, so the
// markup and its scoped CSS are lifted verbatim, never retyped.
// Playwright is not a dependency of this site (it is only ever used for
// tooling like this), so resolve it wherever it already exists on the machine
// rather than adding it to package.json or symlinking node_modules into the
// repo. Falls back to the npx cache, which is where the team's copy lives.
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  const root = join(homedir(), '.npm', '_npx');
  const hit = existsSync(root)
    ? readdirSync(root)
        .map((h) => join(root, h, 'node_modules', 'playwright', 'index.mjs'))
        .find(existsSync)
    : null;
  if (!hit) throw new Error('playwright not found — run `npx -y playwright@1.62 --version` once, then retry');
  ({ chromium } = await import(hit));
}

const REPO = '/Users/danavivi/projects/revaudio/revaudio-website';
const OUT = `${REPO}/bench/bench-trial-plates.html`;
const HARNESS = 'file:///Users/danavivi/projects/revaudio/revaudio-shared/tools/bench/bench.js';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => localStorage.setItem('ra-cookie-consent', 'accepted'));
await page.goto('http://localhost:4321/revlimiter', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

const got = await page.evaluate(() => {
  const sec = document.querySelector('#trial');

  /* The headline ships through splittext.ts: each word becomes a masked
     inline-block whose inner div is parked at translate(0%,110%) until GSAP
     ScrollTrigger reveals it. A bench has no GSAP, so lifting that markup
     verbatim gives an invisible headline (same failure mode as the 2026-07-19
     "bench opens WHITE" entry — production gating first paint behind an
     animation the bench never runs). Flatten it back to the original string
     (splittext stashes it in aria-label): always visible, and dbl-click text
     editing works, which is half the point of a bench. Word wrapping and
     line-height are unchanged — the masks were inline-block words. */
  const h2 = sec.querySelector('h2[data-split]');
  if (h2) {
    h2.textContent = h2.getAttribute('aria-label') || h2.textContent;
    h2.removeAttribute('data-split');
    h2.removeAttribute('aria-label');
    h2.classList.remove('split-ready');
  }

  /* Lift every rule that ACTUALLY styles this subtree — asking the DOM, not
     guessing with a selector regex. The regex version silently dropped the
     site's global heading rules, so the bench's h2 fell back to the body's
     1.6 line-height and the section rendered 20px taller than production —
     exactly the "pixel-perfect in bench, off in prod" failure the law book
     warns about. */
  const subtree = [sec, ...sec.querySelectorAll('*')];
  const hits = (sel) => sel.split(',').some((one) => {
    // matches() can't parse pseudo-elements / state pseudo-classes
    const clean = one.replace(/::?(before|after|placeholder|marker|selection|first-line|hover|active|focus-visible|focus-within|focus|disabled|checked|enabled)\b(\([^)]*\))?/g, '').trim();
    if (!clean || /^[>+~]/.test(clean)) return false;
    try {
      return subtree.some((e) => e.matches(clean)) ||
             document.documentElement.matches(clean) || document.body.matches(clean);
    } catch { return false; }
  });

  const css = [];
  const walk = (rules, wrap) => {
    for (const r of rules) {
      if (r.type === CSSRule.STYLE_RULE) {
        if (hits(r.selectorText)) css.push(wrap ? `${wrap}{ ${r.cssText} }` : r.cssText);
      } else if (r.cssRules && r.conditionText !== undefined) {
        // @media / @container / @supports — keep the condition, recurse inside
        const kw = r.type === CSSRule.MEDIA_RULE ? '@media' : (r.constructor.name.includes('Container') ? '@container' : '@supports');
        walk(r.cssRules, `${kw} ${r.conditionText}`);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    walk(rules, '');
  }

  // keyframes the lifted rules reference (sway, shake, mount, fade-up…)
  const body = css.join('\n');
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.type === CSSRule.KEYFRAMES_RULE && new RegExp(`\\b${r.name}\\b`).test(body)) css.push(r.cssText);
    }
  }

  // the CSS custom properties the section actually resolves against
  const cs = getComputedStyle(document.documentElement);
  const tokens = ['--bg-0','--bg-1','--fg','--fg-dim','--fg-faint','--brass','--brass-bright',
                  '--brass-dark','--oxide-text','--redline','--font-display','--font-body','--font-mono']
    .map(k => `    ${k}: ${cs.getPropertyValue(k).trim()};`).join('\n');

  return { html: sec.outerHTML, css: css.join('\n'), tokens, plateUrl: sec.getAttribute('style') };
});

await browser.close();

// Asset refs: the page serves Astro-processed webp from the dev server. Point
// the bench at the ORIGINAL masters on disk instead, so it keeps working with
// the dev server down (law: a bench with broken art is not dummy-proof).
// Two shapes to catch: the dev server's image endpoint (/_image?href=<encoded
// src path>&w=…&f=webp — what you get with `astro dev` running) and the built
// /_astro/<name>.<hash>.webp. Both map back to the master PNG under src/assets.
const toMaster = (encodedHref) => {
  const p = decodeURIComponent(encodedHref).split('?')[0];      // strip origWidth&co
  const i = p.indexOf('/src/');
  return i === -1 ? null : '..' + p.slice(i);                   // bench/ -> ../src/…
};
const fixAssets = (s) => s
  .replace(/\/_image\?href=([^"'&)\s]+)(?:&amp;|&)[^"')\s]*/g, (m, href) => toMaster(href) || m)
  .replace(/\/_astro\/([a-zA-Z0-9-]+?)\.[A-Za-z0-9_-]+\.(webp|png|jpg)/g,
           (m, name) => `../src/assets/ui/${name}.png`);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>bench — trial plates (#trial, RevLimiter)</title>

<!-- GENERATED — do not hand-edit, and never treat this file as the master.
     Regenerate (with \`npm run dev\` up) via:
       node bench/make-trial-plates-bench.mjs
     Source of truth: src/components/TrialPlates.astro rendered at /revlimiter.
     Markup + the CSS rules that actually match the subtree are lifted from the
     live page, so the bench shares the PRODUCTION layout model — this section
     is flow + container queries (cqw), and a re-authored absolute-position mock
     would tune numbers that cannot map back to source.

     Two deliberate bench-only differences:
     - the headline is flat text (production runs it through splittext.ts, which
       parks each word at translate(0%,110%) behind a mask until GSAP reveals
       it — no GSAP here, so verbatim markup = invisible headline);
     - the backdrop is flat --bg-0, without the page's ambient engine glow. Do
       not judge glow-dependent contrast here; measure that on the real page. -->

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Oswald:wght@400;600&family=Special+Elite&family=VT323&display=swap" rel="stylesheet">

<style>
  /* site tokens, read off the live page's :root */
  :root {
${got.tokens}
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    background: var(--bg-0);
    color: var(--fg);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  body { min-height: 100vh; padding: 2rem 0 6rem; }

  /* bench chrome — the page around the section, not part of it */
  .bench-bar {
    position: fixed; left: 0; right: 0; top: 0; z-index: 5;
    display: flex; gap: .5rem; align-items: center; justify-content: center;
    padding: .5rem; background: rgba(11,10,9,.86); border-bottom: 1px solid #2a2420;
    font: 600 .66rem/1 var(--font-mono); letter-spacing: .14em; text-transform: uppercase;
  }
  .bench-bar span { color: var(--fg-faint); margin-right: .4rem; }
  .bench-bar button {
    padding: .42rem .7rem; cursor: pointer;
    background: #14110f; color: var(--fg-dim);
    border: 1px solid #3d342c; border-radius: 3px;
    font: inherit; letter-spacing: .12em;
  }
  .bench-bar button:hover { color: var(--brass-bright); border-color: var(--brass-dark); }
  .bench-bar button[aria-pressed="true"] { color: var(--bg-0); background: var(--brass); border-color: var(--brass); }

  /* the width harness — the section is fluid, so the thing worth benching is
     how it behaves at each real breakpoint, not one frozen width */
  #frame {
    width: 1440px; max-width: 100%;
    margin: 3.2rem auto 0;
    outline: 1px dashed #2a2420;
    transition: width .18s ease;
  }
  #frame[data-w="390"], #frame[data-w="320"] { outline-color: #3d342c; }

  /* ── lifted verbatim from the live page ── */
${fixAssets(got.css)}
</style>
</head>
<body>

<div class="bench-bar">
  <span>width</span>
  <button data-w="1440" aria-pressed="true">1440</button>
  <button data-w="1280">1280</button>
  <button data-w="900">900</button>
  <button data-w="480">480</button>
  <button data-w="390">390</button>
  <button data-w="320">320</button>
  <span style="margin-left:1rem">state</span>
  <button data-state="idle" aria-pressed="true">idle</button>
  <button data-state="typed">typed</button>
  <button data-state="issued">issued</button>
</div>

<div id="frame" data-w="1440">
${fixAssets(got.html)}
</div>

<script>
  // ── bench controls (not part of the section) ──
  var frame = document.getElementById('frame');
  var sec = frame.querySelector('#trial');
  var form = sec.querySelector('[data-tp-wrap]');
  var email = sec.querySelector('[data-tp-email]');

  function press(group, btn) {
    document.querySelectorAll('.bench-bar button[' + group + ']').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b === btn));
    });
  }

  document.querySelectorAll('.bench-bar button[data-w]').forEach(function (b) {
    b.addEventListener('click', function () {
      frame.style.width = b.dataset.w + 'px';
      frame.dataset.w = b.dataset.w;
      press('data-w', b);
    });
  });

  function setState(s) {
    form.classList.remove('issued');
    sec.classList.remove('issued');
    email.disabled = false;
    sec.querySelectorAll('[data-tp-before]').forEach(function (e) { e.hidden = false; });
    sec.querySelectorAll('[data-tp-after]').forEach(function (e) { e.hidden = true; });
    email.value = '';
    email.classList.remove('long');
    if (s === 'typed' || s === 'issued') {
      email.value = 'daniel.production@studiobrand.com';
      email.classList.toggle('long', email.value.length > 22);
    }
    if (s === 'issued') {
      form.classList.add('issued');
      sec.classList.add('issued');
      email.disabled = true;
      sec.querySelectorAll('[data-tp-before]').forEach(function (e) { e.hidden = true; });
      sec.querySelectorAll('[data-tp-after]').forEach(function (e) { e.hidden = false; });
      var to = sec.querySelector('[data-tp-sentto]');
      if (to) to.textContent = email.value;
    }
  }
  document.querySelectorAll('.bench-bar button[data-state]').forEach(function (b) {
    b.addEventListener('click', function () { setState(b.dataset.state); press('data-state', b); });
  });

  // ── the section's own behaviour, mirrored from TrialPlates.astro so the
  //    bench feels like the real thing (no network: submit just stamps it) ──
  email.addEventListener('input', function () {
    email.classList.toggle('long', email.value.length > 22);
  });
  sec.querySelector('[data-tp-plate]').addEventListener('click', function (e) {
    if (email.disabled || e.target === email) return;
    email.focus();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); setState('issued'); press('data-state', document.querySelector('[data-state="issued"]')); });
</script>

<script src="${HARNESS}"></script>
</body>
</html>
`;

writeFileSync(OUT, html);
const bytes = readFileSync(OUT).length;
console.log('wrote', OUT, bytes, 'bytes · css rules lifted:', got.css.split('\n').length);
