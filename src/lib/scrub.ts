/* Scroll-scrubbed drift (motion plan step 6). Elements with data-drift slide
   horizontally with scroll progress through the viewport — conveyor feel, the
   scroll itself is the easing (ease:'none' per the token rules). Value =
   xPercent amplitude (default 4 → drifts from -4% to +4%).
   Wrap/clip overflow on the parent section — the drift may push past the
   container edge by design. Reduced motion / no-JS: static. */
import { gsap, reducedMotion } from './motion';

export function initScrubs(): void {
  if (reducedMotion()) return;

  document.querySelectorAll<HTMLElement>('[data-drift]').forEach((el) => {
    const amp = parseFloat(el.dataset.drift || '') || 4;
    gsap.fromTo(
      el,
      { xPercent: -amp },
      {
        xPercent: amp,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  /* Vertical sibling of data-drift, in px. Built for surfaces that sit BEHIND
     hanging objects (the garage wall): the layer lags the scroll by ±amp px,
     which is the parallax cue that reads as depth. The element must carry its
     own vertical overscan (inset ≥ amp) — the drift will push past its box by
     design, and the parent clips. Value = px amplitude (default 24). */
  document.querySelectorAll<HTMLElement>('[data-drift-y]').forEach((el) => {
    const amp = parseFloat(el.dataset.driftY || '') || 24;
    gsap.fromTo(
      el,
      { y: -amp },
      {
        y: amp,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}
