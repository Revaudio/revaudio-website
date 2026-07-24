/* RevEdit client — Phase 1 (dev-only overlay, served at /__revedit/client.js).
   Selection + per-element popup (General tab): move / resize / opacity /
   fade-in / layer order, persisted to revedit.overrides.json via the dev
   server. BAKE shows the overrides for folding into source. */
(() => {
  'use strict';
  if (window.__revedit) return;
  window.__revedit = true;

  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const DEF = { x: 0, y: 0, scale: 1, opacity: 1, hidden: false, fade: 0.6, note: '' };

  let editing = false;
  let selected = null; // element id
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
  .re-tag{position:absolute;z-index:2147483000;background:var(--re-brass);color:#140d05;
    font:700 10px/1 -apple-system,sans-serif;letter-spacing:.12em;text-transform:uppercase;
    padding:3px 8px;border-radius:2px;pointer-events:none;white-space:nowrap;}
  .re-handle{position:absolute;z-index:2147483000;width:13px;height:13px;background:var(--re-brass);
    border:2px solid #140d05;border-radius:2px;cursor:nwse-resize;}
  .re-fab{position:fixed;right:16px;bottom:16px;z-index:2147483001;display:flex;gap:8px;}
  .re-btn{background:var(--re-panel);border:1px solid var(--re-line);color:var(--re-cream);
    font:600 12px/1 -apple-system,sans-serif;letter-spacing:.08em;padding:9px 14px;
    border-radius:5px;cursor:pointer;}
  .re-btn:hover{border-color:var(--re-brass);}
  .re-btn:focus-visible,.re-pop button:focus-visible,.re-pop input:focus-visible{outline:2px solid var(--re-brass);outline-offset:2px;}
  .re-btn.on{background:var(--re-brass);color:#140d05;border-color:var(--re-brass);}
  .re-btn.bake{color:var(--re-red);border-color:rgba(224,68,43,.5);}
  .re-btn.bake:hover{background:var(--re-red);color:#fff;}
  .re-pop{position:fixed;width:286px;background:var(--re-panel);border:1px solid var(--re-line);
    border-radius:8px;z-index:2147483002;box-shadow:0 18px 50px rgba(0,0,0,.65);}
  .re-pop header{display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:grab;
    background:var(--re-panel2);border-bottom:1px solid var(--re-line);border-radius:8px 8px 0 0;}
  .re-crumb{font:700 11px/1 -apple-system,sans-serif;letter-spacing:.1em;color:var(--re-brass);text-transform:uppercase;}
  .re-x{margin-left:auto;background:none;border:0;color:var(--re-dim);font-size:15px;cursor:pointer;padding:0 2px;}
  .re-x:hover{color:var(--re-cream);}
  .re-body{padding:12px 14px 14px;max-height:60vh;overflow-y:auto;}
  .re-row{display:flex;align-items:center;gap:10px;margin-bottom:11px;}
  .re-row label{width:64px;flex:none;font-size:11px;letter-spacing:.06em;color:var(--re-dim);text-transform:uppercase;}
  .re-row input[type=range]{flex:1;accent-color:var(--re-brass);min-width:0;}
  .re-val{width:48px;flex:none;text-align:right;font:11px/1.3 ui-monospace,Menlo,monospace;color:var(--re-cream);}
  .re-sect{font-size:10px;letter-spacing:.2em;color:var(--re-brass);text-transform:uppercase;
    margin:14px 0 9px;padding-top:12px;border-top:1px solid var(--re-line);}
  .re-sect:first-child{margin-top:2px;padding-top:0;border-top:0;}
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
  .re-toast{position:fixed;bottom:64px;left:50%;transform:translateX(-50%) translateY(20px);
    background:var(--re-panel2);border:1px solid var(--re-brass);color:var(--re-cream);border-radius:6px;
    padding:9px 16px;font-size:12.5px;z-index:2147483004;opacity:0;transition:.25s;}
  .re-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
  @media print{.re-fab,.re-pop,.re-tag,.re-handle{display:none!important;}}`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- state apply / persist ---------- */
  function apply(id) {
    const el = targets[id], s = state.els[id];
    if (!el || !s) return;
    el.style.transform = (s.x || s.y || s.scale !== 1) ? `translate(${s.x}px,${s.y}px) scale(${s.scale})` : '';
    el.style.opacity = s.opacity === 1 ? '' : String(s.opacity);
    el.style.display = s.hidden ? 'none' : '';
  }
  function applyOrder() {
    state.order.forEach((id, i) => {
      const el = targets[id];
      if (!el) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.zIndex = String(10 + i);
    });
  }
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
    Object.keys(targets).forEach(apply);
    applyOrder();
  }

  /* ---------- chrome: fab / tag / handle ---------- */
  const fab = document.createElement('div');
  fab.className = 're-fab re-ui';
  fab.innerHTML = `<button class="re-btn" data-re-toggle aria-pressed="false">✎ EDIT</button>
    <button class="re-btn bake" data-re-bake>BAKE ▸</button>`;
  document.body.appendChild(fab);
  const tag = document.createElement('div'); tag.className = 're-tag'; tag.hidden = true;
  const handle = document.createElement('div'); handle.className = 're-handle'; handle.hidden = true;
  document.body.append(tag, handle);

  function positionChrome() {
    if (!selected || !targets[selected] || state.els[selected].hidden) { tag.hidden = true; handle.hidden = true; return; }
    const r = targets[selected].getBoundingClientRect();
    tag.style.left = r.left + 'px'; tag.style.top = (r.top - 26) + 'px';
    tag.textContent = selected; tag.hidden = false;
    handle.style.left = (r.right - 6) + 'px'; handle.style.top = (r.bottom - 6) + 'px';
    handle.hidden = false;
  }
  addEventListener('scroll', positionChrome, { passive: true });
  addEventListener('resize', positionChrome);

  function toast(msg) {
    let t = document.querySelector('.re-toast');
    if (!t) { t = document.createElement('div'); t.className = 're-toast re-ui'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2400);
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

  function openPopup(id) {
    closePopup();
    const s = state.els[id];
    pop = document.createElement('div'); pop.className = 're-pop re-ui';
    pop.innerHTML = `<header><span class="re-crumb">${id}</span><button class="re-x" aria-label="Close">✕</button></header><div class="re-body"></div>`;
    document.body.appendChild(pop);
    const r = targets[id].getBoundingClientRect();
    let px = r.right + 18, py = r.top;
    if (px + 300 > innerWidth) px = r.left - 306;
    if (px < 8) { px = clamp(r.left, 8, innerWidth - 300); py = r.bottom + 14; }
    pop.style.left = clamp(px, 8, innerWidth - 300) + 'px';
    pop.style.top = clamp(py, 8, innerHeight - 420) + 'px';
    pop.querySelector('.re-x').onclick = closePopup;
    pop.querySelector('header').addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
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
      const el = targets[id];
      el.animate(
        [{ opacity: 0, transform: (el.style.transform || 'none') + ' translateY(24px)' },
         { opacity: s.opacity, transform: el.style.transform || 'none' }],
        { duration: s.fade * 1000, easing: 'cubic-bezier(.2,.7,.2,1)' });
    };
    body.appendChild(fr);

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
        up.onclick = () => { if (i < state.order.length - 1) { [state.order[i + 1], state.order[i]] = [state.order[i], state.order[i + 1]]; applyOrder(); redraw(); save(); } };
        lr.querySelector('input').addEventListener('input', (e) => { state.els[lid].opacity = parseFloat(e.target.value); apply(lid); save(); });
        ly.appendChild(lr);
      });
    };
    redraw();

    sect(body, '');
    const br = document.createElement('div'); br.className = 're-btnrow';
    br.innerHTML = `<button class="re-sbtn">RESET</button><button class="re-sbtn danger">${s.hidden ? 'SHOW' : 'HIDE'}</button>`;
    const [rst, hide] = br.querySelectorAll('button');
    rst.onclick = () => { state.els[id] = { ...DEF }; apply(id); positionChrome(); save(); openPopup(id); toast('Reset to source values'); };
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
    $$('[data-edit].re-sel').forEach((e) => e.classList.remove('re-sel'));
    selected = id;
    targets[id].classList.add('re-sel');
    positionChrome();
    openPopup(id);
  }
  function deselect() {
    $$('[data-edit].re-sel').forEach((e) => e.classList.remove('re-sel'));
    selected = null; positionChrome(); closePopup();
  }

  /* ---------- element drag / resize ---------- */
  document.addEventListener('pointerdown', (e) => {
    if (!editing) return;
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
    const el = e.target.closest && e.target.closest('[data-edit]');
    if (!el) return;
    const id = el.dataset.edit, s = state.els[id];
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
  // block link navigation while editing (the sign is an <a>)
  document.addEventListener('click', (e) => {
    if (editing && e.target.closest && e.target.closest('[data-edit]')) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ---------- keyboard ---------- */
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); toggle(); return; }
    if (!editing || !selected) return;
    if (e.target.matches && e.target.matches('input,select,textarea')) return;
    const step = e.shiftKey ? 10 : 1, s = state.els[selected];
    let hit = true;
    if (e.key === 'ArrowLeft') s.x -= step; else if (e.key === 'ArrowRight') s.x += step;
    else if (e.key === 'ArrowUp') s.y -= step; else if (e.key === 'ArrowDown') s.y += step;
    else if (e.key === 'Escape') { deselect(); hit = false; }
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
    if (!editing) deselect();
  }
  tbtn.onclick = toggle;

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
