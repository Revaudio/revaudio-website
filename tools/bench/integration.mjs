/* Bench — the shared RevAudio WYSIWYG harness, running ON the real site.

   Why this exists next to the standalone bench/*.html files: those are copies,
   and a copy can only ever be as honest as its extraction. Benching the live
   dev page means you are dragging the actual production DOM, with the real
   cascade, the real fonts and the real neighbours around it — nothing to
   reconcile afterwards.

   Safety: `command !== 'dev'` bails, so this can never reach a build. In
   normal dev it is an inert ~40-line inline script; the harness itself is only
   fetched when the URL carries ?bench.

   Usage:  http://localhost:4321/revlimiter?bench
   Then:   click = select · drag = move · corner = resize · dbl-click = edit
           text · E = try the UI live · Ctrl+Z = undo · ⬇ EXPORT when happy.

   Deltas autosave to localStorage under `bench:<last path segment>`, so each
   page keeps its own work and none of it collides with the standalone
   bench-trial-plates.html (which keys off its filename). */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* The shared clone sits in a different place on each laptop — sibling dir on
   Dan's Mac, C:\RevAudio\shared on the Windows boxes. Try both rather than
   hardcoding one and breaking the other partner's checkout. */
const CANDIDATES = [
  new URL('../../../revaudio-shared/tools/bench/bench.js', import.meta.url), // mac: sibling of the site repo
  new URL('../../../../shared/tools/bench/bench.js', import.meta.url),       // win: C:\RevAudio\shared
].map(fileURLToPath);

export default function bench() {
  return {
    name: 'bench',
    hooks: {
      'astro:config:setup': ({ command, updateConfig, injectScript }) => {
        if (command !== 'dev') return;

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'bench-server',
                configureServer(server) {
                  server.middlewares.use(async (req, res, next) => {
                    if ((req.url || '').split('?')[0] !== '/__bench/bench.js') return next();
                    const hit = CANDIDATES.find(existsSync);
                    res.setHeader('Content-Type', 'text/javascript');
                    if (!hit) {
                      res.statusCode = 404;
                      res.end(
                        `console.error("bench: shared harness not found. Looked in:\\n${CANDIDATES.join('\\n')}")`
                      );
                      return;
                    }
                    try {
                      res.end(await readFile(hit, 'utf8'));
                    } catch (e) {
                      res.statusCode = 500;
                      res.end(`console.error("bench: ${e && e.message}")`);
                    }
                  });
                },
              },
            ],
          },
        });

        injectScript(
          'head-inline',
          `(function(){
  if (!new URLSearchParams(location.search).has('bench')) return;

  /* Desktop only, by request — the harness panel needs the room, and the
     layouts being tuned here are the >=901px ones. */
  if (window.innerWidth < 901) {
    console.warn('bench: desktop only — widen the window past 900px and reload.');
    return;
  }

  /* ?bench=reset — wipe this page's saved deltas BEFORE the harness reads
     them, so the bench opens mirroring committed source exactly. Same key
     the harness uses (bench.js: 'bench:' + last path segment). Then strip
     the value from the URL so a refresh doesn't wipe fresh work. */
  if (new URLSearchParams(location.search).get('bench') === 'reset') {
    try { localStorage.removeItem('bench:' + location.pathname.split('/').pop()); } catch (e) {}
    var u = new URL(location.href);
    u.searchParams.set('bench', '');
    history.replaceState(null, '', u.toString().replace('bench=', 'bench'));
  }

  document.documentElement.classList.add('bench-on');

  /* The page hides anything not yet scrolled into view (reveal.ts) and parks
     split headline words below a mask until GSAP runs (splittext.ts). In a
     bench that means invisible-but-draggable elements, so force the finished
     state everywhere. Stylesheet !important beats GSAP's inline styles. */
  var css = document.createElement('style');
  css.textContent = [
    'html.bench-on [data-reveal], html.bench-on [data-reveal-item] { opacity: 1 !important; }',
    'html.bench-on [data-split] { opacity: 1 !important; }',
    'html.bench-on [data-split] div { transform: none !important; }'
    /* The garage wall fits itself to one screen via zoom (--wall-fit), and
       the bench leaves that alone on purpose: you place elements against the
       scale that actually ships, not against an un-minimized version of the
       page nobody sees. The harness divides pointer deltas by the cumulative
       zoom (bench.js zoomOf) so drags still track the cursor 1:1. */
  ].join('\\n');
  document.head.appendChild(css);

  var s = document.createElement('script');
  s.src = '/__bench/bench.js';
  s.defer = true;
  document.head.appendChild(s);
})();`
        );
      },
    },
  };
}
