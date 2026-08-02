/* RevEdit client — Phase 2 (dev-only overlay, served at /__revedit/client.js).
   Phase 1: selection + per-element popup (move / resize / opacity / fade-in /
   layer order), persisted to revedit.overrides.json via the dev server.
   Phase 2: double-click drill-in from a group to its sub-elements, inline
   text editing, font family / size, delete text. Overrides re-apply after
   the GSAP hero entrance finishes, since its timeline ends by writing inline
   transform/opacity on the same elements. */
(() => {
  'use strict';
  if (window.__revedit) return;
  window.__revedit = true;

  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const DEF = { x: 0, y: 0, scale: 1, opacity: 1, hidden: false, fade: 0.6, note: '', ff: '', fz: 0, txt: '', needle: null };
  const FONTS = [
    ['', 'Site default'],
    ['"Arial Narrow", "Helvetica Neue", sans-serif', 'Arial Narrow'],
    ['Georgia, "Times New Roman", serif', 'Georgia serif'],
    ['Futura, "Century Gothic", sans-serif', 'Futura geometric'],
    ['Impact, "Arial Black", sans-serif', 'Impact display'],
    ['"Helvetica Neue", Helvetica, sans-serif', 'Helvetica'],
    ['ui-monospace, Menlo, monospace', 'Mono utility'],
  ];

  let editing = false;
  let selected = null; // PRIMARY element id ("hero.text" or "hero.text/line1")
  let selection = []; // every selected id, click order; selected === last one
  let drill = null;    // id of the drilled-into group
  let pop = null;
  let MF = {};         // manifest: id -> { props: [{key,label,min,max,step,unit,css|filter}] }
  const newEl = () => ({ ...DEF, props: {} });
  const deep = (x) => JSON.parse(JSON.stringify(x));

  // Overrides are kept per breakpoint (mirrors the hero's mobile/desktop split)
  const BP = matchMedia('(max-width: 860px)');
  const bpName = () => (BP.matches ? 'mobile' : 'desktop');
  const emptyBucket = () => ({ order: [], els: {} });
  let doc = { v: 2, desktop: emptyBucket(), mobile: emptyBucket(), snapshots: {} };
  let state = doc[bpName()];
  const targets = {}; // id -> DOM element
  BP.addEventListener('change', () => {
    state = doc[bpName()];
    discover(); applyAll(); deselect();
    toast('Now editing ' + bpName() + ' overrides');
  });

  /* ---------- styles ---------- */
  const css = `
  :root{--re-panel:#171009;--re-panel2:#20160c;--re-line:#3a2c18;--re-brass:#c9a35c;
    --re-red:#e0442b;--re-cream:#ece4d4;--re-dim:#9a8d76;--re-pit:#0c0906;}
  .re-ui{font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--re-cream);}
  /* pointer-events:auto is not cosmetic: a decorative layer that sets
     pointer-events:none in the page (so it doesn't swallow clicks on the text
     under it) is otherwise impossible to select here. Edit mode overrides it
     for anything tagged data-edit, and normal browsing is untouched. */
  body.re-on [data-edit]{cursor:grab;pointer-events:auto;}
  body.re-on [data-edit]:hover{outline:1px dashed rgba(201,163,92,.55);outline-offset:4px;}
  [data-edit].re-sel{outline:1.5px solid var(--re-brass)!important;outline-offset:4px;}
  body.re-on .re-drill [data-edit-sub]:hover{outline:1px dotted rgba(224,68,43,.75);outline-offset:3px;cursor:pointer;}
  .re-sel-sub{outline:1.5px solid var(--re-red)!important;outline-offset:3px;}
  [contenteditable].re-editing-text{outline:1.5px solid var(--re-red)!important;outline-offset:3px;cursor:text;}
  /* fixed, NOT absolute: positionChrome places both from getBoundingClientRect,
     which is viewport-relative, so absolute put them off by exactly scrollY.
     Worse, an absolute box parked past the viewport edge grows the document's
     scrollWidth/Height — that extra overflow toggles a scrollbar, the scrollbar
     reflows the page, the reflow fires positionChrome, which moves the box
     again: an endless wiggle once a scaled element pushed the handle out of
     view (~1.22x on a 1728px window). fixed elements never add scroll area. */
  .re-tag{position:fixed;z-index:2147483000;background:var(--re-brass);color:#140d05;
    font:700 10px/1 -apple-system,sans-serif;letter-spacing:.12em;text-transform:uppercase;
    padding:3px 8px;border-radius:2px;pointer-events:none;white-space:nowrap;}
  .re-tag.sub{background:var(--re-red);color:#fff;}
  .re-handle{position:fixed;z-index:2147483000;width:13px;height:13px;background:var(--re-brass);
    border:2px solid #140d05;border-radius:2px;cursor:nwse-resize;}
  .re-fab{position:fixed;right:16px;bottom:16px;z-index:2147483001;display:flex;gap:8px;}
  .re-btn{background:var(--re-panel);border:1px solid var(--re-line);color:var(--re-cream);
    font:600 12px/1 -apple-system,sans-serif;letter-spacing:.08em;padding:9px 14px;
    border-radius:5px;cursor:pointer;}
  .re-btn:hover{border-color:var(--re-brass);}
  .re-btn:focus-visible,.re-pop button:focus-visible,.re-pop input:focus-visible,.re-pop select:focus-visible{outline:2px solid var(--re-brass);outline-offset:2px;}
  .re-btn.on{background:var(--re-brass);color:#140d05;border-color:var(--re-brass);}
  .re-btn.bake{color:var(--re-red);border-color:rgba(224,68,43,.5);}
  .re-btn.bake:hover{background:var(--re-red);color:#fff;}
  .re-pop{position:fixed;width:286px;background:var(--re-panel);border:1px solid var(--re-line);
    border-radius:8px;z-index:2147483002;box-shadow:0 18px 50px rgba(0,0,0,.65);}
  .re-pop header{display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:grab;
    background:var(--re-panel2);border-bottom:1px solid var(--re-line);border-radius:8px 8px 0 0;}
  .re-crumb{font:700 11px/1 -apple-system,sans-serif;letter-spacing:.1em;color:var(--re-brass);text-transform:uppercase;}
  .re-crumb .re-up{color:var(--re-dim);cursor:pointer;font-weight:400;}
  .re-crumb .re-up:hover{color:var(--re-cream);}
  .re-x{margin-left:auto;background:none;border:0;color:var(--re-dim);font-size:15px;cursor:pointer;padding:0 2px;}
  .re-x:hover{color:var(--re-cream);}
  .re-body{padding:12px 14px 14px;max-height:60vh;overflow-y:scroll;scrollbar-gutter:stable;}
  .re-body::-webkit-scrollbar{width:10px;}
  .re-body::-webkit-scrollbar-track{background:var(--re-pit);border-radius:5px;}
  .re-body::-webkit-scrollbar-thumb{background:var(--re-line);border-radius:5px;border:2px solid var(--re-pit);}
  .re-body::-webkit-scrollbar-thumb:hover{background:var(--re-brass);}
  .re-row{display:flex;align-items:center;gap:10px;margin-bottom:11px;}
  .re-row label{width:64px;flex:none;font-size:11px;letter-spacing:.06em;color:var(--re-dim);text-transform:uppercase;}
  .re-row input[type=range]{flex:1;accent-color:var(--re-brass);min-width:0;}
  .re-row select{flex:1;background:var(--re-pit);border:1px solid var(--re-line);color:var(--re-cream);
    border-radius:4px;padding:6px 8px;font-size:12px;min-width:0;}
  .re-val{width:48px;flex:none;text-align:right;font:11px/1.3 ui-monospace,Menlo,monospace;color:var(--re-cream);}
  .re-sect{font-size:10px;letter-spacing:.2em;color:var(--re-brass);text-transform:uppercase;
    margin:14px 0 9px;padding-top:12px;border-top:1px solid var(--re-line);}
  .re-sect:first-child{margin-top:2px;padding-top:0;border-top:0;}
  .re-hint{font-size:11.5px;color:var(--re-dim);margin:-2px 0 10px;}
  .re-layers{display:flex;flex-direction:column;gap:5px;}
  .re-lrow{display:flex;align-items:center;gap:7px;background:var(--re-pit);border:1px solid var(--re-line);
    border-radius:4px;padding:6px 8px;}
  .re-lrow.me{border-color:rgba(201,163,92,.6);}
  .re-lname{font-size:11px;letter-spacing:.05em;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .re-lrow input[type=range]{width:56px;accent-color:var(--re-brass);}
  .re-arr{background:none;border:0;color:var(--re-dim);cursor:pointer;font-size:11px;padding:1px 3px;}
  .re-arr:hover{color:var(--re-brass);}
  .re-btnrow{display:flex;gap:8px;margin-top:4px;}
  .re-sbtn{flex:1;background:var(--re-panel2);border:1px solid var(--re-line);color:var(--re-cream);
    font:600 11px/1 -apple-system,sans-serif;letter-spacing:.08em;padding:8px 0;border-radius:5px;cursor:pointer;}
  .re-sbtn:hover{border-color:var(--re-brass);}
  .re-sbtn.danger{color:var(--re-red);border-color:rgba(224,68,43,.4);}
  .re-sbtn.danger:hover{background:var(--re-red);color:#fff;border-color:var(--re-red);}
  .re-ask{display:flex;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid var(--re-line);}
  .re-ask input{flex:1;background:var(--re-pit);border:1px solid var(--re-line);color:var(--re-cream);
    border-radius:4px;padding:7px 9px;font-size:12px;min-width:0;}
  .re-ask input::placeholder{color:#6b6152;}
  .re-ask button{background:var(--re-brass);color:#140d05;border:0;border-radius:4px;
    font-weight:800;font-size:11px;padding:0 12px;cursor:pointer;letter-spacing:.06em;}
  .re-modal{position:fixed;inset:0;background:rgba(5,4,3,.72);z-index:2147483003;
    display:flex;align-items:center;justify-content:center;}
  .re-mbox{width:min(560px,90vw);background:var(--re-panel);border:1px solid var(--re-brass);border-radius:10px;overflow:hidden;}
  .re-mbox h2{margin:0;padding:14px 20px;font-size:12px;letter-spacing:.24em;color:var(--re-brass);
    text-transform:uppercase;border-bottom:1px solid var(--re-line);background:var(--re-panel2);}
  .re-mbox pre{margin:0;padding:16px 20px;font:11.5px/1.6 ui-monospace,Menlo,monospace;color:var(--re-cream);
    max-height:52vh;overflow:auto;}
  .re-mbox footer{display:flex;gap:10px;padding:12px 20px;border-top:1px solid var(--re-line);align-items:center;}
  .re-mbox footer p{margin:0;flex:1;color:var(--re-dim);font-size:12px;}
  .re-transport{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:2147483001;
    display:flex;align-items:center;gap:12px;background:var(--re-panel);border:1px solid var(--re-line);
    border-radius:8px;padding:10px 14px;box-shadow:0 12px 40px rgba(0,0,0,.6);width:min(560px,84vw);}
  .re-transport input[type=range]{flex:1;accent-color:var(--re-brass);min-width:0;}
  .re-transport select{background:var(--re-pit);border:1px solid var(--re-line);color:var(--re-cream);
    border-radius:4px;padding:5px 6px;font-size:11px;}
  .re-transport .re-tt{font:11px/1 ui-monospace,Menlo,monospace;color:var(--re-dim);width:70px;text-align:right;}
  .re-toast{position:fixed;bottom:64px;left:50%;transform:translateX(-50%) translateY(20px);
    background:var(--re-panel2);border:1px solid var(--re-brass);color:var(--re-cream);border-radius:6px;
    padding:9px 16px;font-size:12.5px;z-index:2147483004;opacity:0;transition:.25s;}
  .re-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
  @media print{.re-fab,.re-pop,.re-tag,.re-handle{display:none!important;}}`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- text sanitizing (keep only text + <br>) ---------- */
  function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function sanitizeTxt(html) {
    return html.split(/<br\s*\/?>/i).map((part) => {
      const d = document.createElement('div'); d.innerHTML = part; return escapeHtml(d.textContent);
    }).join('<br>');
  }

  /* ---------- state apply / persist ---------- */
  function apply(id) {
    const el = targets[id], s = state.els[id];
    if (!el || !s) return;
    el.style.transform = (s.x || s.y || s.scale !== 1) ? `translate(${s.x}px,${s.y}px) scale(${s.scale})` : '';
    el.style.opacity = s.opacity === 1 ? '' : String(s.opacity);
    el.style.display = s.hidden ? 'none' : '';
    el.style.fontFamily = s.ff || '';
    el.style.fontSize = s.fz ? s.fz + 'px' : '';
    if (s.txt && el.innerHTML !== s.txt && !el.isContentEditable) el.innerHTML = s.txt; // sanitized at capture
    if (id === 'hero.gauge' && s.needle != null && window.__reveditHero) {
      window.__reveditHero.dials.forEach((d) => { d.base = s.needle; });
    }
    applyManifest(el, id, s);
  }
  /* Manifest lookup with a wildcard fallback: "hero.text/*" supplies props to
     every sub of hero.text, so shared controls (glow on each line) are declared
     once instead of copy-pasted per sub id. */
  function mf(id) {
    if (MF[id]) return MF[id];
    return id.includes('/') ? MF[id.split('/')[0] + '/*'] : null;
  }
  function applyManifest(el, id, s) {
    const m = mf(id);
    if (!m || !m.props) return;
    const filters = [];
    m.props.forEach((p) => {
      const v = s.props ? s.props[p.key] : null;
      if (p.filter) { if (v != null) filters.push(`${p.filter}(${v}${p.unit || ''})`); return; }
      /* tpl lets ONE slider drive a multi-part value — a glow needs three
         lengths and a colour, a mask needs a whole gradient. Without it those
         params can't be expressed declaratively at all. */
      const val = v == null ? '' : (p.tpl ? String(p.tpl).split('{v}').join(v) : v + (p.unit || ''));
      /* css may be a list, for prefix pairs like mask-image/-webkit-mask-image. */
      (Array.isArray(p.css) ? p.css : [p.css]).forEach((prop) => {
        /* Custom properties MUST go through setProperty — el.style['--x'] is a
           silent no-op — and they're the only way to reach a pseudo-element,
           which is how the hero scrim (.hero-head::before) becomes tunable. */
        if (prop.startsWith('--')) { if (val === '') el.style.removeProperty(prop); else el.style.setProperty(prop, val); }
        else el.style[prop] = val;
      });
    });
    el.style.filter = filters.length ? filters.join(' ') : '';
  }
  function applyOrder() {
    state.order.forEach((id, i) => {
      const el = targets[id];
      if (!el) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.zIndex = String(10 + i);
    });
  }
  function applyAll() { Object.keys(targets).forEach(apply); applyOrder(); }
  let saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      fetch('/__revedit/save', { method: 'POST', body: JSON.stringify(doc) }).catch(() => {});
    }, 300);
  }

  /* ---------- discovery + load ---------- */
  function discover() {
    $$('[data-edit]').forEach((el) => {
      const id = el.dataset.edit;
      targets[id] = el;
      if (!state.els[id]) state.els[id] = newEl();
      if (!state.order.includes(id)) state.order.push(id);
      $$('[data-edit-sub]', el).forEach((sub) => {
        const sid = id + '/' + sub.dataset.editSub;
        targets[sid] = sub;
        if (!state.els[sid]) state.els[sid] = newEl();
      });
    });
    state.order = state.order.filter((id) => targets[id]);
  }
  async function load() {
    try { MF = await (await fetch('/__revedit/manifest')).json(); } catch { MF = {}; }
    try {
      const j = await (await fetch('/__revedit/load')).json();
      if (j && j.v === 2) {
        doc = { v: 2, desktop: j.desktop || emptyBucket(), mobile: j.mobile || emptyBucket(), snapshots: j.snapshots || {} };
      } else if (j && j.els) {
        doc.desktop = { order: j.order || [], els: j.els }; // migrate v1 (was desktop-only)
      }
      ['desktop', 'mobile'].forEach((b) => {
        Object.entries(doc[b].els).forEach(([id, s]) => { doc[b].els[id] = { ...newEl(), ...s }; });
      });
      state = doc[bpName()];
    } catch { /* fresh session */ }
    rescan();
    // The hero entrance timeline ends by writing inline transform/opacity on
    // these same elements (gsap leaves final values inline) — re-apply after
    // it has finished so saved overrides win on reload.
    [3200, 5400].forEach((t) => setTimeout(rescan, t));
  }
  /* discover() again, not just applyAll(): SplitText (src/lib/splittext.ts)
     rewrites a [data-split] headline's innards to animate the words, then
     revert()s — and revert rebuilds the markup, so every [data-edit-sub] span
     inside it is a NEW node. Without re-discovering, `targets` still holds the
     original detached spans and edits to headline lines land on nothing at
     all, silently. Cheap to redo (idempotent, guarded inserts). */
  function rescan() { discover(); applyAll(); }

  /* ---------- chrome: fab / tag / handle ---------- */
  const fab = document.createElement('div');
  fab.className = 're-fab re-ui';
  fab.innerHTML = `<button class="re-btn" data-re-toggle aria-pressed="false">✎ EDIT</button>
    <button class="re-btn" data-re-transport>⏱ ENTRANCE</button>
    <button class="re-btn" data-re-snaps>⧉ SNAPS</button>
    <button class="re-btn bake" data-re-bake>BAKE ▸</button>`;
  document.body.appendChild(fab);
  const tag = document.createElement('div'); tag.className = 're-tag'; tag.hidden = true;
  const handle = document.createElement('div'); handle.className = 're-handle'; handle.hidden = true;
  document.body.append(tag, handle);

  function positionChrome() {
    if (!selected || !targets[selected] || state.els[selected].hidden) { tag.hidden = true; handle.hidden = true; return; }
    if (selection.length > 1) {
      /* Tag rides the union box's top-left. No resize handle for a group —
         "resize these five" has no one obvious meaning, and the popup's
         Scale× (which multiplies each element's own scale) is unambiguous. */
      const rs = selection.map((sid) => targets[sid]?.getBoundingClientRect()).filter(Boolean);
      if (!rs.length) { tag.hidden = true; handle.hidden = true; return; }
      tag.style.left = Math.min(...rs.map((x) => x.left)) + 'px';
      tag.style.top = (Math.min(...rs.map((x) => x.top)) - 26) + 'px';
      tag.textContent = selection.length + ' selected';
      tag.classList.remove('sub');
      tag.hidden = false; handle.hidden = true;
      return;
    }
    const r = targets[selected].getBoundingClientRect();
    tag.style.left = clamp(r.left, 0, innerWidth - 120) + 'px';
    tag.style.top = clamp(r.top - 26, 0, innerHeight - 20) + 'px';
    tag.textContent = selected;
    tag.classList.toggle('sub', selected.includes('/'));
    tag.hidden = false;
    /* Clamped into the viewport: scale an element past the window edge and an
       unclamped handle is simply unreachable — you can enlarge but never drag
       back. The resize math reads pointer distance from the element's centre,
       not the handle's position, so pinning it to the edge changes nothing. */
    handle.style.left = clamp(r.right - 6, 0, innerWidth - 15) + 'px';
    handle.style.top = clamp(r.bottom - 6, 0, innerHeight - 15) + 'px';
    handle.hidden = false;
  }
  addEventListener('scroll', positionChrome, { passive: true });
  addEventListener('resize', positionChrome);

  function toast(msg) {
    let t = document.querySelector('.re-toast');
    if (!t) { t = document.createElement('div'); t.className = 're-toast re-ui'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- popup ---------- */
  function row(label, min, max, step, val, fmt, oninput) {
    const w = document.createElement('div'); w.className = 're-row';
    w.innerHTML = `<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><span class="re-val"></span>`;
    const r = w.querySelector('input'), v = w.querySelector('.re-val');
    const upd = () => { v.textContent = fmt(parseFloat(r.value)); };
    r.addEventListener('input', () => { upd(); oninput(parseFloat(r.value)); save(); });
    upd(); return w;
  }
  function sect(body, t) {
    const d = document.createElement('div'); d.className = 're-sect'; d.textContent = t; body.appendChild(d);
  }
  function hint(body, t) {
    const d = document.createElement('div'); d.className = 're-hint'; d.innerHTML = t; body.appendChild(d);
  }

  function openPopup(id) {
    closePopup();
    discover(); // rebind to live nodes before wiring sliders (see rescan)
    const s = state.els[id];
    const el = targets[id];
    const isSub = id.includes('/');
    const parentId = isSub ? id.split('/')[0] : null;
    pop = document.createElement('div'); pop.className = 're-pop re-ui';
    const crumbHtml = isSub
      ? `<span class="re-up" data-re-up>${parentId}</span>&nbsp;› ${id.split('/')[1]}`
      : id;
    pop.innerHTML = `<header><span class="re-crumb">${crumbHtml}</span><button class="re-x" aria-label="Close">✕</button></header><div class="re-body"></div>`;
    document.body.appendChild(pop);
    const r = el.getBoundingClientRect();
    let px = r.right + 18, py = r.top;
    if (px + 300 > innerWidth) px = r.left - 306;
    if (px < 8) { px = clamp(r.left, 8, innerWidth - 300); py = r.bottom + 14; }
    pop.style.left = clamp(px, 8, innerWidth - 300) + 'px';
    pop.style.top = clamp(py, 8, innerHeight - 420) + 'px';
    pop.querySelector('.re-x').onclick = closePopup;
    pop.querySelector('[data-re-up]')?.addEventListener('click', () => select(parentId));
    pop.querySelector('header').addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || e.target.closest('[data-re-up]')) return;
      const sx = e.clientX - pop.offsetLeft, sy = e.clientY - pop.offsetTop;
      const mv = (ev) => { pop.style.left = (ev.clientX - sx) + 'px'; pop.style.top = (ev.clientY - sy) + 'px'; };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up); e.preventDefault();
    });

    const body = pop.querySelector('.re-body');
    sect(body, 'Transform');
    body.appendChild(row('X', -600, 600, 1, s.x, (v) => v + 'px', (v) => { s.x = v; apply(id); positionChrome(); }));
    body.appendChild(row('Y', -600, 600, 1, s.y, (v) => v + 'px', (v) => { s.y = v; apply(id); positionChrome(); }));
    body.appendChild(row('Scale', 0.3, 2, 0.01, s.scale, (v) => v.toFixed(2) + '×', (v) => { s.scale = v; apply(id); positionChrome(); }));
    const cb = document.createElement('div'); cb.className = 're-btnrow';
    cb.innerHTML = `<button class="re-sbtn">⇔ Center H</button><button class="re-sbtn">⇕ Center V</button><button class="re-sbtn">👻 Ghost</button>`;
    const [ch, cv, gh] = cb.querySelectorAll('button');
    ch.onclick = () => { const pr = el.parentElement.getBoundingClientRect(), r2 = el.getBoundingClientRect();
      s.x = Math.round(s.x + (pr.left + pr.width / 2) - (r2.left + r2.width / 2)); apply(id); positionChrome(); save(); };
    cv.onclick = () => { const pr = el.parentElement.getBoundingClientRect(), r2 = el.getBoundingClientRect();
      s.y = Math.round(s.y + (pr.top + pr.height / 2) - (r2.top + r2.height / 2)); apply(id); positionChrome(); save(); };
    gh.onclick = () => toggleGhost(id);
    body.appendChild(cb);

    sect(body, 'Fade');
    body.appendChild(row('Opacity', 0, 1, 0.01, s.opacity, (v) => Math.round(v * 100) + '%', (v) => { s.opacity = v; apply(id); }));
    body.appendChild(row('Fade-in', 0, 3, 0.05, s.fade, (v) => v.toFixed(2) + 's', (v) => { s.fade = v; }));
    const fr = document.createElement('div'); fr.className = 're-btnrow';
    fr.innerHTML = `<button class="re-sbtn">▶ Preview fade-in</button>`;
    fr.querySelector('button').onclick = () => {
      el.animate(
        [{ opacity: 0, transform: (el.style.transform || 'none') + ' translateY(24px)' },
         { opacity: s.opacity, transform: el.style.transform || 'none' }],
        { duration: s.fade * 1000, easing: 'cubic-bezier(.2,.7,.2,1)' });
    };
    body.appendChild(fr);

    /* Gauge: needle idle angle + rev blip (drives the live dial states). */
    if (id === 'hero.gauge' && window.__reveditHero) {
      sect(body, 'Gauge');
      const dials = window.__reveditHero.dials;
      body.appendChild(row('Needle', -135, 135, 1, s.needle != null ? s.needle : -90, (v) => v + '°', (v) => { s.needle = v; apply(id); }));
      const rb = document.createElement('div'); rb.className = 're-btnrow';
      rb.innerHTML = `<button class="re-sbtn">▶ Rev blip</button>`;
      rb.querySelector('button').onclick = () => {
        const idle = s.needle != null ? s.needle : -90;
        const t0 = performance.now();
        const step = (t) => {
          const p = (t - t0) / 900;
          if (p >= 1) { dials.forEach((d) => { d.base = idle; }); return; }
          const k = p < 0.35 ? p / 0.35 : 1 - (p - 0.35) / 0.65;
          dials.forEach((d) => { d.base = idle + k * (135 - idle); });
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      body.appendChild(rb);
    }

    /* Specific: extra per-element controls declared in revedit.manifest.json. */
    const mfe = mf(id);
    if (mfe && mfe.props) {
      sect(body, 'Specific');
      mfe.props.forEach((p) => {
        /* `def` is the value the page already renders at, so a freshly opened
           slider sits where the design actually is instead of snapping it to 0
           the first time it's touched. */
        const fallback = p.def != null ? p.def : (p.filter ? 1 : (p.css === 'lineHeight' ? 1.2 : 0));
        const init = (s.props && s.props[p.key] != null) ? s.props[p.key] : fallback;
        body.appendChild(row(p.label, p.min, p.max, p.step, init,
          (v) => v + (p.unit || (p.filter ? '×' : '')),
          (v) => { if (!s.props) s.props = {}; s.props[p.key] = v; apply(id); positionChrome(); }));
      });
    }

    /* Type: sub-elements with text get the full kit; the group gets font only. */
    const hasText = el.textContent.trim().length > 0;
    const hasSubs = !isSub && $$('[data-edit-sub]', el).length > 0;
    if ((isSub && hasText) || hasSubs) {
      sect(body, isSub ? 'Type' : 'Type · whole group');
      const fsel = document.createElement('div'); fsel.className = 're-row';
      fsel.innerHTML = `<label>Font</label><select>${FONTS.map(([v, l]) =>
        `<option value='${v.replace(/'/g, '&#39;')}'${v === s.ff ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
      fsel.querySelector('select').onchange = (e) => { s.ff = e.target.value; apply(id); save(); };
      body.appendChild(fsel);
      if (isSub) {
        const cur = s.fz || Math.round(parseFloat(getComputedStyle(el).fontSize));
        body.appendChild(row('Size', 9, 140, 1, cur, (v) => v + 'px', (v) => { s.fz = v; apply(id); positionChrome(); }));
        hint(body, 'Double-click the text on the page to edit it inline.');
        const dt = document.createElement('div'); dt.className = 're-btnrow';
        dt.innerHTML = `<button class="re-sbtn danger">DELETE THIS TEXT</button>`;
        dt.querySelector('button').onclick = () => { s.hidden = true; apply(id); positionChrome(); save(); openPopup(id); toast('Deleted — SHOW brings it back'); };
        body.appendChild(dt);
      } else {
        hint(body, 'Double-click the block to <b>drill in</b> — each line gets its own popup.');
      }
    }

    if (!isSub) {
      sect(body, 'Layers · back → front');
      const ly = document.createElement('div'); ly.className = 're-layers'; body.appendChild(ly);
      const redraw = () => {
        ly.innerHTML = '';
        state.order.forEach((lid, i) => {
          const lr = document.createElement('div'); lr.className = 're-lrow' + (lid === id ? ' me' : '');
          lr.innerHTML = `<button class="re-arr" aria-label="send back">▼</button><button class="re-arr" aria-label="bring forward">▲</button>
            <span class="re-lname">${lid}</span>
            <input type="range" min="0" max="1" step=".01" value="${state.els[lid].opacity}" aria-label="${lid} opacity">`;
          const [down, up] = lr.querySelectorAll('.re-arr');
          down.onclick = () => { if (i > 0) { [state.order[i - 1], state.order[i]] = [state.order[i], state.order[i - 1]]; applyOrder(); redraw(); save(); } };
          up.onclick = () => { if (i < state.order.length - 1) { [state.order[i], state.order[i + 1]] = [state.order[i + 1], state.order[i]]; applyOrder(); redraw(); save(); } };
          lr.querySelector('input').addEventListener('input', (e) => { state.els[lid].opacity = parseFloat(e.target.value); apply(lid); save(); });
          ly.appendChild(lr);
        });
      };
      redraw();
    }

    sect(body, '');
    const br = document.createElement('div'); br.className = 're-btnrow';
    br.innerHTML = `<button class="re-sbtn">RESET</button><button class="re-sbtn danger">${s.hidden ? 'SHOW' : 'HIDE'}</button>`;
    const [rst, hide] = br.querySelectorAll('button');
    rst.onclick = () => {
      const keepTxt = state.els[id].txt; // text edits survive a layout reset
      state.els[id] = { ...newEl(), txt: keepTxt };
      apply(id); positionChrome(); save(); openPopup(id); toast('Reset to source values');
    };
    hide.onclick = () => { s.hidden = !s.hidden; apply(id); positionChrome(); save(); openPopup(id); };
    body.appendChild(br);

    const a = document.createElement('div'); a.className = 're-ask';
    a.innerHTML = `<input type="text" placeholder="Ask Claude about this element…"><button>SAVE</button>`;
    a.querySelector('input').value = s.note || '';
    const send = () => { s.note = a.querySelector('input').value.trim(); save(); toast('Noted for Claude · attached to ' + id); };
    a.querySelector('button').onclick = send;
    a.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    body.appendChild(a);
  }
  function closePopup() { if (pop) { pop.remove(); pop = null; } }

  /* ---------- multi-selection popup ----------
     Absolute X/Y sliders are meaningless for a group (every element has its own
     origin), so Nudge/Scale here are RELATIVE: each input applies the change
     since its own last value, leaving the elements' differences intact. */
  function openMultiPopup() {
    closePopup();
    discover();
    const ids = selection.slice();
    pop = document.createElement('div'); pop.className = 're-pop re-ui';
    pop.innerHTML = `<header><span class="re-crumb">${ids.length} selected</span><button class="re-x" aria-label="Close">✕</button></header><div class="re-body"></div>`;
    document.body.appendChild(pop);
    const rs = ids.map((i) => targets[i]?.getBoundingClientRect()).filter(Boolean);
    const bx = { left: Math.min(...rs.map((r) => r.left)), right: Math.max(...rs.map((r) => r.right)),
                 top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)) };
    let px = bx.right + 18;
    if (px + 300 > innerWidth) px = bx.left - 306;
    pop.style.left = clamp(px, 8, innerWidth - 300) + 'px';
    pop.style.top = clamp(bx.top, 8, innerHeight - 420) + 'px';
    pop.querySelector('.re-x').onclick = closePopup;
    pop.querySelector('header').addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const sx = e.clientX - pop.offsetLeft, sy = e.clientY - pop.offsetTop;
      const mv = (ev) => { pop.style.left = (ev.clientX - sx) + 'px'; pop.style.top = (ev.clientY - sy) + 'px'; };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up); e.preventDefault();
    });

    const body = pop.querySelector('.re-body');
    hint(body, `Shift-click to add or remove. Everything here applies to all <b>${ids.length}</b>.<br>${ids.join(' · ')}`);
    const each = (fn) => { ids.forEach(fn); positionChrome(); };

    sect(body, 'Move · relative');
    let lx = 0, ly = 0, ls = 1;
    body.appendChild(row('Nudge X', -600, 600, 1, 0, (v) => v + 'px', (v) => {
      const d = v - lx; lx = v; each((i) => { state.els[i].x += d; apply(i); }); }));
    body.appendChild(row('Nudge Y', -600, 600, 1, 0, (v) => v + 'px', (v) => {
      const d = v - ly; ly = v; each((i) => { state.els[i].y += d; apply(i); }); }));
    body.appendChild(row('Scale ×', 0.3, 2, 0.01, 1, (v) => v.toFixed(2) + '×', (v) => {
      const k = v / ls; ls = v; each((i) => { const s2 = state.els[i]; s2.scale = clamp(s2.scale * k, 0.3, 2.2); apply(i); }); }));

    /* Align to the selection's own bounding box — measured live, then folded
       into each element's x/y so it persists like any other move. */
    sect(body, 'Align · to selection box');
    const mkAlign = (defs) => {
      const rowEl = document.createElement('div'); rowEl.className = 're-btnrow';
      rowEl.innerHTML = defs.map((d) => `<button class="re-sbtn">${d[0]}</button>`).join('');
      [...rowEl.querySelectorAll('button')].forEach((btn, n) => {
        btn.onclick = () => {
          const live = ids.map((i) => ({ i, r: targets[i].getBoundingClientRect() })).filter((o) => o.r);
          const box = { left: Math.min(...live.map((o) => o.r.left)), right: Math.max(...live.map((o) => o.r.right)),
                        top: Math.min(...live.map((o) => o.r.top)), bottom: Math.max(...live.map((o) => o.r.bottom)) };
          live.forEach(({ i, r }) => { const [dx, dy] = defs[n][1](r, box); state.els[i].x += dx; state.els[i].y += dy; apply(i); });
          positionChrome(); save();
        };
      });
      body.appendChild(rowEl);
    };
    mkAlign([
      ['⟸ L', (r, b) => [b.left - r.left, 0]],
      ['⟺ C', (r, b) => [(b.left + b.right) / 2 - (r.left + r.right) / 2, 0]],
      ['⟹ R', (r, b) => [b.right - r.right, 0]],
    ]);
    mkAlign([
      ['⟰ T', (r, b) => [0, b.top - r.top]],
      ['⟳ M', (r, b) => [0, (b.top + b.bottom) / 2 - (r.top + r.bottom) / 2]],
      ['⟱ B', (r, b) => [0, b.bottom - r.bottom]],
    ]);

    sect(body, 'Fade');
    body.appendChild(row('Opacity', 0, 1, 0.01, state.els[selected].opacity, (v) => Math.round(v * 100) + '%',
      (v) => each((i) => { state.els[i].opacity = v; apply(i); })));

    /* Only props every selected element actually has — setting "Glow" across a
       mixed selection must not write a property one of them doesn't declare. */
    const firstProps = (mf(ids[0]) || {}).props || [];
    const shared = firstProps.filter((p) => ids.every((i) => ((mf(i) || {}).props || []).some((q) => q.key === p.key)));
    if (shared.length) {
      sect(body, 'Shared · all ' + ids.length);
      shared.forEach((p) => {
        const fb = p.def != null ? p.def : (p.filter ? 1 : 0);
        const cur = (state.els[selected].props && state.els[selected].props[p.key] != null) ? state.els[selected].props[p.key] : fb;
        body.appendChild(row(p.label, p.min, p.max, p.step, cur, (v) => v + (p.unit || (p.filter ? '×' : '')),
          (v) => each((i) => { const st = state.els[i]; if (!st.props) st.props = {}; st.props[p.key] = v; apply(i); })));
      });
    }

    // Font applies to any selection; size only where every member is a text sub.
    sect(body, 'Type · all ' + ids.length);
    const fsel = document.createElement('div'); fsel.className = 're-row';
    fsel.innerHTML = `<label>Font</label><select>${FONTS.map(([v, l]) =>
      `<option value='${v.replace(/'/g, '&#39;')}'>${l}</option>`).join('')}</select>`;
    fsel.querySelector('select').onchange = (e) => { each((i) => { state.els[i].ff = e.target.value; apply(i); }); save(); };
    body.appendChild(fsel);
    if (ids.every((i) => i.includes('/') && targets[i] && targets[i].textContent.trim())) {
      const base = state.els[selected].fz || Math.round(parseFloat(getComputedStyle(targets[selected]).fontSize));
      body.appendChild(row('Size', 9, 140, 1, base, (v) => v + 'px', (v) => each((i) => { state.els[i].fz = v; apply(i); })));
    }

    const clr = document.createElement('div'); clr.className = 're-btnrow';
    clr.innerHTML = `<button class="re-sbtn">✕ Clear selection</button>`;
    clr.querySelector('button').onclick = () => deselect();
    body.appendChild(clr);
  }

  function paintSelection() {
    $$('.re-sel,.re-sel-sub').forEach((e) => e.classList.remove('re-sel', 're-sel-sub'));
    selection.forEach((sid) => targets[sid]?.classList.add(sid.includes('/') ? 're-sel-sub' : 're-sel'));
  }
  /* additive = shift-click: toggle this id in/out of the selection instead of
     replacing it. Clicking an already-selected element with shift removes it,
     so a mis-add is undone the same way it was made. */
  function select(id, additive) {
    if (additive && selection.includes(id)) {
      selection = selection.filter((x) => x !== id);
      if (!selection.length) { deselect(); return; }
    } else if (additive && selection.length) {
      selection.push(id);
    } else {
      selection = [id];
    }
    selected = selection[selection.length - 1];
    paintSelection();
    positionChrome();
    if (selection.length > 1) openMultiPopup(); else openPopup(selected);
  }
  function deselect() {
    $$('.re-sel,.re-sel-sub').forEach((e) => e.classList.remove('re-sel', 're-sel-sub'));
    selection = []; selected = null; positionChrome(); closePopup(); killGhost();
  }

  /* ---------- before/after ghost ---------- */
  let ghost = null;
  function killGhost() { if (ghost) { ghost.remove(); ghost = null; } }
  function toggleGhost(id) {
    if (ghost) { killGhost(); return; }
    const el = targets[id];
    const t = el.style.transform;
    el.style.transform = 'none';
    const r = el.getBoundingClientRect();
    el.style.transform = t;
    ghost = el.cloneNode(true);
    ghost.removeAttribute('data-edit');
    ghost.classList.remove('re-sel', 're-sel-sub');
    Object.assign(ghost.style, {
      position: 'fixed', left: r.left + 'px', top: r.top + 'px',
      width: r.width + 'px', height: r.height + 'px', margin: '0',
      opacity: '0.3', pointerEvents: 'none', zIndex: '2147482999',
      transform: 'none', filter: 'grayscale(1)',
    });
    document.body.appendChild(ghost);
    toast('Ghost = original position/size · click 👻 again to hide');
  }
  function exitDrill() {
    if (!drill) return;
    targets[drill]?.classList.remove('re-drill');
    drill = null;
  }

  /* ---------- inline text editing ---------- */
  let editingText = null;
  function startTextEdit(subEl, id) {
    editingText = subEl;
    try { subEl.contentEditable = 'plaintext-only'; } catch { subEl.contentEditable = 'true'; }
    subEl.classList.add('re-editing-text');
    subEl.focus();
    subEl.addEventListener('blur', () => {
      subEl.classList.remove('re-editing-text');
      subEl.contentEditable = 'false';
      editingText = null;
      state.els[id].txt = sanitizeTxt(subEl.innerHTML);
      apply(id); save(); toast('Text saved');
    }, { once: true });
  }

  /* ---------- element drag / resize / select ---------- */
  function idAt(target) {
    const parentEl = target.closest && target.closest('[data-edit]');
    if (!parentEl) return null;
    const subEl = target.closest('[data-edit-sub]');
    if (drill && parentEl.dataset.edit === drill && subEl) return parentEl.dataset.edit + '/' + subEl.dataset.editSub;
    return parentEl.dataset.edit;
  }
  document.addEventListener('pointerdown', (e) => {
    if (!editing || editingText) return;
    if (e.target === handle && selected) {
      const s = state.els[selected], el = targets[selected];
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d0 = Math.hypot(e.clientX - cx, e.clientY - cy), s0 = s.scale;
      const mv = (ev) => { s.scale = clamp(s0 * Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0, 0.3, 2.2); apply(selected); positionChrome(); };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); save(); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
      e.preventDefault(); return;
    }
    const id = idAt(e.target);
    if (!id) return;
    const additive = e.shiftKey;
    /* Grabbing any member of a multi-selection drags the whole group by the
       same delta — each element keeps its own origin, so relative spacing is
       preserved. Grabbing a non-member drags just it (and the pointerup below
       reselects it), which is what a plain click on something else means. */
    const group = (!additive && selection.length > 1 && selection.includes(id)) ? selection.slice() : [id];
    const starts = group.map((gid) => ({ id: gid, x: state.els[gid].x, y: state.els[gid].y }));
    const ox = e.clientX, oy = e.clientY;
    let moved = false;
    const mv = (ev) => {
      const dx = ev.clientX - ox, dy = ev.clientY - oy;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      starts.forEach((st) => { const s2 = state.els[st.id]; s2.x = st.x + dx; s2.y = st.y + dy; apply(st.id); });
      positionChrome();
    };
    const up = () => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up);
      if (moved) save(); else select(id, additive);
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
    e.preventDefault();
  }, true);

  document.addEventListener('dblclick', (e) => {
    if (!editing) return;
    const parentEl = e.target.closest && e.target.closest('[data-edit]');
    if (!parentEl) return;
    const pid = parentEl.dataset.edit;
    const subEl = e.target.closest('[data-edit-sub]');
    if (drill === pid && subEl) {
      const sid = pid + '/' + subEl.dataset.editSub;
      if (subEl.textContent.trim()) { select(sid); startTextEdit(subEl, sid); }
    } else if ($$('[data-edit-sub]', parentEl).length) {
      exitDrill();
      drill = pid;
      parentEl.classList.add('re-drill');
      toast('Drilled into ' + pid + ' — click a line for its own popup, double-click a line to edit text, Esc exits');
    }
    e.preventDefault();
  }, true);

  // block link navigation while editing (the sign is an <a>)
  document.addEventListener('click', (e) => {
    if (editing && e.target.closest && e.target.closest('[data-edit]')) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ---------- keyboard ---------- */
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); toggle(); return; }
    if (!editing) return;
    if (editingText) { if (e.key === 'Escape') editingText.blur(); return; }
    if (e.target.matches && e.target.matches('input,select,textarea')) return;
    if (e.key === 'Escape') { if (selected) deselect(); else exitDrill(); return; }
    if (!selected) return;
    const step = e.shiftKey ? 10 : 1;
    let dx = 0, dy = 0, hit = true;
    if (e.key === 'ArrowLeft') dx = -step; else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step; else if (e.key === 'ArrowDown') dy = step;
    else hit = false;
    // Nudge every selected element, not just the primary.
    if (hit) selection.forEach((sid) => { state.els[sid].x += dx; state.els[sid].y += dy; apply(sid); });
    if (hit) { apply(selected); positionChrome(); save(); e.preventDefault(); }
  });

  /* ---------- toggle / bake ---------- */
  const tbtn = fab.querySelector('[data-re-toggle]');
  function toggle() {
    editing = !editing;
    document.body.classList.toggle('re-on', editing);
    tbtn.classList.toggle('on', editing);
    tbtn.setAttribute('aria-pressed', String(editing));
    tbtn.textContent = editing ? '✎ EDITING' : '✎ EDIT';
    if (!editing) { deselect(); exitDrill(); }
  }
  tbtn.onclick = toggle;

  /* ---------- snapshots (save looks, flip between them) ---------- */
  let snapPanel = null;
  const snapOf = () => deep({ desktop: doc.desktop, mobile: doc.mobile });
  function snapApply(name) {
    doc.snapshots['~flipback'] = snapOf(); // one-step undo for A/B flips
    const s = doc.snapshots[name];
    doc.desktop = deep(s.desktop); doc.mobile = deep(s.mobile);
    state = doc[bpName()];
    discover(); applyAll(); deselect(); save();
    toast(`Applied “${name}” — “~flipback” restores the previous look`);
    renderSnaps();
  }
  function renderSnaps() {
    if (!snapPanel) return;
    const list = snapPanel.querySelector('[data-snap-list]');
    list.innerHTML = '';
    const names = Object.keys(doc.snapshots);
    if (!names.length) {
      const d = document.createElement('div'); d.className = 're-hint';
      d.textContent = 'No snapshots yet — name this look and SAVE.';
      list.appendChild(d);
    }
    names.forEach((name) => {
      const lr = document.createElement('div'); lr.className = 're-lrow';
      lr.innerHTML = `<span class="re-lname" style="cursor:pointer"></span><button class="re-arr" aria-label="delete snapshot">✕</button>`;
      const nm = lr.querySelector('.re-lname');
      nm.textContent = name;
      nm.onclick = () => snapApply(name);
      lr.querySelector('.re-arr').onclick = () => { delete doc.snapshots[name]; save(); renderSnaps(); };
      list.appendChild(lr);
    });
  }
  fab.querySelector('[data-re-snaps]').onclick = () => {
    if (snapPanel) { snapPanel.remove(); snapPanel = null; return; }
    snapPanel = document.createElement('div');
    snapPanel.className = 're-pop re-ui';
    snapPanel.style.right = '16px'; snapPanel.style.bottom = '64px';
    snapPanel.style.left = 'auto'; snapPanel.style.top = 'auto';
    snapPanel.innerHTML = `<header><span class="re-crumb">Snapshots</span><button class="re-x" aria-label="Close">✕</button></header>
      <div class="re-body"><div class="re-layers" data-snap-list></div>
      <div class="re-ask"><input type="text" placeholder="Name this look…"><button>SAVE</button></div></div>`;
    document.body.appendChild(snapPanel);
    snapPanel.querySelector('.re-x').onclick = () => { snapPanel.remove(); snapPanel = null; };
    const inp = snapPanel.querySelector('.re-ask input');
    const saveSnap = () => {
      const name = inp.value.trim();
      if (!name) return;
      doc.snapshots[name] = snapOf();
      inp.value = ''; save(); renderSnaps(); toast(`Snapshot “${name}” saved`);
    };
    snapPanel.querySelector('.re-ask button').onclick = saveSnap;
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveSnap(); });
    renderSnaps();
  };

  /* ---------- entrance transport (scrub the hero GSAP timeline) ---------- */
  let transport = null, transportRaf = 0;
  fab.querySelector('[data-re-transport]').onclick = () => {
    if (transport) { closeTransport(); return; }
    const hero = window.__reveditHero;
    if (!hero || !hero.tl) { toast('No entrance timeline on this page (or reduced motion is on)'); return; }
    const tl = hero.tl;
    transport = document.createElement('div');
    transport.className = 're-transport re-ui';
    transport.innerHTML = `
      <button class="re-sbtn" style="flex:none;padding:8px 14px" data-t-play>▶</button>
      <input type="range" min="0" max="1" step="0.001" value="${tl.progress()}" aria-label="Entrance progress">
      <span class="re-tt"></span>
      <select aria-label="Playback speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option></select>
      <button class="re-x" aria-label="Close transport">✕</button>`;
    document.body.appendChild(transport);
    const play = transport.querySelector('[data-t-play]');
    const range = transport.querySelector('input');
    const time = transport.querySelector('.re-tt');
    const speed = transport.querySelector('select');
    const fmt = () => { time.textContent = tl.time().toFixed(2) + 's / ' + tl.duration().toFixed(2) + 's'; };
    const tick = () => {
      if (!transport) return;
      if (!tl.paused()) { range.value = String(tl.progress()); fmt(); play.textContent = tl.progress() >= 1 ? '↺' : '⏸'; }
      transportRaf = requestAnimationFrame(tick);
    };
    tl.pause(); play.textContent = '▶'; fmt();
    range.addEventListener('input', () => { tl.pause(); tl.progress(parseFloat(range.value)); fmt(); play.textContent = '▶'; });
    play.onclick = () => {
      tl.timeScale(parseFloat(speed.value));
      if (tl.progress() >= 1 || play.textContent === '↺') tl.restart();
      else if (tl.paused()) tl.play();
      else { tl.pause(); play.textContent = '▶'; return; }
      play.textContent = '⏸';
    };
    speed.onchange = () => tl.timeScale(parseFloat(speed.value));
    transport.querySelector('.re-x').onclick = closeTransport;
    tick();
  };
  function closeTransport() {
    if (!transport) return;
    cancelAnimationFrame(transportRaf);
    const tl = window.__reveditHero?.tl;
    if (tl) { tl.timeScale(1); tl.progress(1); } // leave the page settled
    transport.remove(); transport = null;
    applyAll(); // the timeline just rewrote inline styles — restore overrides
  }

  fab.querySelector('[data-re-bake]').onclick = () => {
    const diff = { page: location.pathname, breakpoints: {}, askClaude: [] };
    const seenNotes = new Set();
    ['desktop', 'mobile'].forEach((b) => {
      const bucket = doc[b], out = {};
      for (const [id, s] of Object.entries(bucket.els)) {
        const d = {};
        for (const k of Object.keys(DEF)) {
          if (k === 'note') continue;
          if (s[k] !== DEF[k]) d[k] = typeof s[k] === 'number' ? Math.round(s[k] * 100) / 100 : s[k];
        }
        if (s.props && Object.keys(s.props).length) d.props = s.props;
        if (Object.keys(d).length) out[id] = d;
        if (s.note && !seenNotes.has(id + '·' + s.note)) { seenNotes.add(id + '·' + s.note); diff.askClaude.push({ el: id, note: s.note }); }
      }
      if (Object.keys(out).length || bucket.order.length) diff.breakpoints[b] = { order: bucket.order, overrides: out };
    });
    const json = JSON.stringify(diff, null, 2);
    const m = document.createElement('div'); m.className = 're-modal re-ui';
    m.innerHTML = `<div class="re-mbox"><h2>revedit.overrides.json → bake to source</h2><pre></pre>
      <footer><p>Saved on disk at the repo root (git-ignored). Tell Claude “bake it” to fold into source.</p>
      <button class="re-sbtn" style="flex:none;padding:8px 16px">COPY</button>
      <button class="re-sbtn" style="flex:none;padding:8px 16px">CLOSE</button></footer></div>`;
    m.querySelector('pre').textContent = json;
    const [cp, cl] = m.querySelectorAll('footer .re-sbtn');
    cp.onclick = () => { navigator.clipboard.writeText(json).then(() => toast('Copied')); };
    cl.onclick = () => m.remove();
    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
  };

  load();
})();
