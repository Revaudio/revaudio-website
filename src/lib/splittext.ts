/* Headline word-splitting (motion plan step 4 — Larose technique 5).
   Any element with data-split gets its words masked and risen from below on
   viewport entry (80ms stagger, expo.out — bible text-reveal timing), then the
   split is fully reverted so the DOM ends exactly as authored: no resize
   re-flow bugs, nothing left for screen readers to trip on (SplitText's
   aria:"auto" covers the brief animated window).
   Headlines only — never paragraphs (a11y + cost). Reduced motion / no-JS:
   nothing splits, text is static. Waits for fonts so word boxes are measured
   against the real display face, not the fallback. */
import { gsap, ScrollTrigger, reducedMotion } from './motion';
import { SplitText } from 'gsap/SplitText';

export async function initSplitHeadlines(): Promise<void> {
  if (reducedMotion()) return;
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-split]'));
  if (!els.length) return;

  gsap.registerPlugin(SplitText);
  // Bounded wait: fonts.ready has no timeout of its own, and one pending or
  // failed font request (Safari + a stalled Google Fonts fetch) left the
  // pre-hidden headline stranded invisible. A hung font may only delay the
  // reveal, never block it — same 2.5s budget as the hero entrance gate.
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

  els.forEach((el) => {
    try {
      const split = SplitText.create(el, { type: 'words', mask: 'words', aria: 'auto' });
      // Words start below their masks (immediateRender), so the element can go
      // visible now — releases the CSS pre-hide without anything flashing.
      el.classList.add('split-ready');
      gsap.fromTo(
        split.words,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.6,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onComplete: () => split.revert(),
        },
      );
    } catch {
      // Splitting failed — release the pre-hide and show the text static.
      el.classList.add('split-ready');
    }
  });
}
