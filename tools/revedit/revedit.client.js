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
  let selected = null; // element id ("hero.text" or "hero.text/line1")
  let drill = null;    // id of the drilled-into group
  let pop = null;
  const state = { order: [], els: {} };
  const targets = {}; // id -> DOM element

  /* ---------- styles ---------- */
  const css = `
  :root{--re-panel:#171009;--re-panel2:#20160c;--re-line:#3a2c18;--re-brass:#c9a35c;
    --re-red:#e0442b;--re-cream:#ece4d4;--re-dim:#9a8d76;--re-pit:#0c0906;}
  .re-ui{font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--re-cream);}
  body.re-on [data-edit]{cursor:grab;}
  body.re-on [data-edit]:hover{outline:1px dashed rgba(201,163,92,.55);outline-offset:4px;}
  [data-edit].re-sel{outline:1.5px solid var(--re-brass)!important;outline-offset:4px;}
  body.re-on .re-drill [data-edit-sub]:hover{outline:1px dotted rgba(224,68,43,.75);outline-offset:3px;cursor:pointer;}
  .re-sel-sub{outline:1.5px solid var(--re-red)!important;outline-offset:3px;}
  [contenteditable].re-editing-text{outline:1.5px solid var(--re-red)!important;outline-offset:3px;cursor:text;}
  .re-tag{position:absolute;z-index:2147483000;background:var(--re-brass);color:#140d05;
    font:700 10px/1 -apple-system,sans-serif;letter-spacing:.12em;text-transform:uppercase;
    padding:3px 8px;border-radius:2px;pointer-events:none;white-space:nowrap;}
  .re-tag.sub{background:var(--re-red);color:#fff;}
  .re-handle{position:absolute;z-index:2147483000;width:13px;height:13px;background:var(--re-brass);
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
      fetch('/__revedit/save', { method: 'POST', body: JSON.stringify(state) }).catch(() => {});
    }, 300);
  }

  /* ---------- discovery + load ---------- */
  function discover() {
    $$('[data-edit]').forEach((el) => {
      const id = el.dataset.edit;
      targets[id] = el;
      if (!state.els[id]) state.els[id] = { ...DEF };
      if (!state.order.includes(id)) state.order.push(id);
      $$('[data-edit-sub]', el).forEach((sub) => {
        const sid = id + '/' + sub.dataset.editSub;
        targets[sid] = sub;
        if (!state.els[sid]) state.els[sid] = { ...DEF };
      });
    });
    state.order = state.order.filter((id) => targets[id]);
  }
  async function load() {
    try {
      const r = await fetch('/__revedit/load');
      const j = await r.json();
      if (j && j.els) {
        Object.entries(j.els).forEach(([id, s]) => { state.els[id] = { ...DEF, ...s }; });
        if (Array.isArray(j.order)) state.order = j.order;
      }
    } catch { /* fresh session */ }
    discover();
    applyAll();
    // The hero entrance timeline ends by writing inline transform/opacity on
    // these same elements (gsap leaves final values inline) — re-apply after
    // it has finished so saved overrides win on reload.
    [3200, 5400].forEach((t) => setTimeout(applyAll, t));
  }

  /* ---------- chrome: fab / tag / handle ---------- */
  const fab = document.createElement('div');
  fab.className = 're-fab re-ui';
  fab.innerHTML = `<button class="re-btn" data-re-toggle aria-pressed="false">✎ EDIT</button>
    <button class="re-btn" data-re-transport>⏱ ENTRANCE</button>
    <button class="re-btn bake" data-re-bake>BAKE ▸</button>`;
  document.body.appendChild(fab);
  const tag = document.createElement('div'); tag.className = 're-tag'; tag.hidden = true;
  const handle = document.createElement('div'); handle.className = 're-handle'; handle.hidden = true;
  document.body.append(tag, handle);

  function positionChrome() {
    if (!selected || !targets[selected] || state.els[selected].hidden) { tag.hidden = true; handle.hidden = true; return; }
    const r = targets[selected].getBoundingClientRect();
    tag.style.left = r.left + 'px'; tag.style.top = (r.top - 26) + 'px';
    tag.textContent = selected;
    tag.classList.toggle('sub', selected.includes('/'));
    tag.hidden = false;
    handle.style.left = (r.right - 6) + 'px'; handle.style.top = (r.bottom - 6) + 'px';
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
      state.els[id] = { ...DEF, txt: keepTxt };
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

  function select(id) {
    $$('.re-sel,.re-sel-sub').forEach((e) => e.classList.remove('re-sel', 're-sel-sub'));
    selected = id;
    targets[id].classList.add(id.includes('/') ? 're-sel-sub' : 're-sel');
    positionChrome();
    openPopup(id);
  }
  function deselect() {
    $$('.re-sel,.re-sel-sub').forEach((e) => e.classList.remove('re-sel', 're-sel-sub'));
    selected = null; positionChrome(); closePopup();
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
    const s = state.els[id];
    const sx = e.clientX - s.x, sy = e.clientY - s.y;
    let moved = false;
    const mv = (ev) => {
      if (!moved && Math.hypot(ev.clientX - (sx + s.x), ev.clientY - (sy + s.y)) < 3) return;
      moved = true; s.x = ev.clientX - sx; s.y = ev.clientY - sy; apply(id); positionChrome();
    };
    const up = () => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up);
      if (moved) save(); else select(id);
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
    const step = e.shiftKey ? 10 : 1, s = state.els[selected];
    let hit = true;
    if (e.key === 'ArrowLeft') s.x -= step; else if (e.key === 'ArrowRight') s.x += step;
    else if (e.key === 'ArrowUp') s.y -= step; else if (e.key === 'ArrowDown') s.y += step;
    else hit = false;
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
    const diff = { page: location.pathname, order: state.order, overrides: {}, askClaude: [] };
    for (const [id, s] of Object.entries(state.els)) {
      const d = {};
      for (const k of Object.keys(DEF)) {
        if (k === 'note') continue;
        if (s[k] !== DEF[k]) d[k] = typeof s[k] === 'number' ? Math.round(s[k] * 100) / 100 : s[k];
      }
      if (Object.keys(d).length) diff.overrides[id] = d;
      if (s.note) diff.askClaude.push({ el: id, note: s.note });
    }
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
