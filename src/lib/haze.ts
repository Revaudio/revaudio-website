/* haze — the smoke in the garage. A fixed layer behind all content carrying
   two screen-blended smoke plates that drift slowly, kick on a fast scroll
   (throttle blip) and lean a few px with the pointer. This is the ambient
   part of the old enginebg layer (removed in c3fc068) brought back on its
   own: no tach arc, no heat curve that slid the hue toward the redline, no
   ember canvas, no waveform. Dust in the lamp light, nothing more.
   One ticker, two lerped signals (blip, pointer). Reduced motion = static. */
import { gsap, reducedMotion } from './motion';

const BLIP_GAIN = 1.2; // scroll-velocity -> throttle sensitivity
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function initHaze(): void {
  const root = document.querySelector<HTMLElement>('[data-haze]');
  const haze1 = root?.querySelector<HTMLElement>('[data-haze-1]');
  const haze2 = root?.querySelector<HTMLElement>('[data-haze-2]');
  if (!root || !haze1 || !haze2) return;

  /* Static plates for reduced motion: the smoke is there, it just hangs. */
  if (reducedMotion()) return;

  /* Mobile: drift only, no pointer signal. */
  const mobile = window.matchMedia('(max-width: 900px)').matches;

  const state = { blip: 0, px: 0.5, py: 0.5, lastY: window.scrollY };

  /* Drift phases, integrated incrementally (phase += dt * rate * drift) so a
     blip changes drift SPEED smoothly. Multiplying t by a varying rate inside
     sin() would rescale all accumulated time and teleport the smoke on a fast
     scroll. Random offsets desync the two plates. */
  const ph = {
    x1: rand(0, Math.PI * 2),
    y1: rand(0, Math.PI * 2),
    x2: rand(0, Math.PI * 2),
    y2: rand(0, Math.PI * 2),
  };

  if (!mobile) {
    window.addEventListener(
      'pointermove',
      (e) => {
        state.px = e.clientX / window.innerWidth;
        state.py = e.clientY / window.innerHeight;
      },
      { passive: true },
    );
  }

  let t = 0;
  gsap.ticker.add((_time, deltaMS) => {
    const dt = Math.min(deltaMS / 1000, 0.05);
    t += dt;

    /* Throttle blip from scroll velocity: fast attack, slow settle. The first
       half second is ignored so a restored scroll position does not read as
       a blip on load. */
    const v = t < 0.5 ? 0 : Math.abs(window.scrollY - state.lastY) / Math.max(dt, 1e-4);
    state.lastY = window.scrollY;
    const targetBlip = Math.min((v / 2500) * BLIP_GAIN, 1);
    state.blip +=
      targetBlip > state.blip ? (targetBlip - state.blip) * 0.35 : (targetBlip - state.blip) * 0.04;

    const drift = 1 + state.blip * 2.5;
    ph.x1 += dt * 0.05 * drift;
    ph.y1 += dt * 0.04 * drift;
    ph.x2 += dt * 0.035 * drift;
    ph.y2 += dt * 0.045 * drift;

    const par = mobile ? { x: 0, y: 0 } : { x: (state.px - 0.5) * 14, y: (state.py - 0.5) * 10 };
    gsap.set(haze1, { x: Math.sin(ph.x1) * 40 + par.x, y: Math.cos(ph.y1) * 25 + par.y * 0.6 });
    gsap.set(haze2, { x: Math.cos(ph.x2) * 55 - par.x * 0.5, y: Math.sin(ph.y2) * 30 - par.y * 0.4 });
  });
}
