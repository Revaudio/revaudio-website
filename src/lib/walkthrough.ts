/* Sticky feature walkthrough (motion plan step 3 + the part-highlighter
   extension, docs/revlimiter-whats-inside-handoff.md). The stage column pins
   via CSS position:sticky — JS here only tracks which copy step is in the
   middle of the viewport, highlights it, and either:
     - crossfades the stage to that step's shot (legacy `[data-walk-shot]`
       path, still the fallback for plugins without a `stage`), or
     - (new) drives a dim mask + brass highlight box onto the matching region
       of a single screenshot, when the section renders in
       `data-walk-mode="stage"`. The screenshot itself never transforms —
       no zoom, no pan — only the box animates left/top/width/height/autoAlpha.
   Reduced motion: the carousel counter still runs (wayfinding is navigation,
   not decoration); everything that animates is gated off. No JS: CSS keeps
   every step fully visible, undimmed, with no box and no counter. */
import { gsap, ScrollTrigger, reducedMotion } from './motion';

type PartRect = { x: number; y: number; w: number; h: number };
/** A part either boxes a region of the base shot, or swaps the stage to its
 *  own screenshot (a control that lives in a separate window / modal). */
type StagePart = PartRect | { shot: string };
const isRect = (p: StagePart): p is PartRect => 'w' in p;

const pad = (n: number): string => String(n).padStart(2, '0');

export function initWalkthrough(): void {
  const motionOK = !reducedMotion();

  document.querySelectorAll<HTMLElement>('[data-walkthrough]').forEach((root) => {
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-walk-step]'));
    if (!steps.length) return;

    // Shared breakpoint: ≥901px = sticky-stage mode; below, the copy column
    // renders as a horizontal scroll-snap carousel (CSS in [slug].astro).
    const mq = window.matchMedia('(min-width: 901px)');

    let activeIdx = 0;
    let counterEl: HTMLSpanElement | null = null;

    /* Mobile carousel wayfinding: odometer-style "04 / 13" counter, injected
       here so no-JS readers never see an inert element. Runs OUTSIDE the
       reduced-motion gate below — reduced-motion users swipe the same
       carousel and need the same position feedback. The listener also keeps
       activeIdx in sync, so crossing the 901px breakpoint resumes the stage
       highlighter from the card the reader is actually on. The carousel
       itself is pure CSS (scroll-snap); listener is passive and cheap, and
       stays attached on desktop where the carousel scrollLeft doesn't exist. */
    const copy = root.querySelector<HTMLElement>('.walk-copy');
    if (copy && steps.length > 1) {
      const count = document.createElement('div');
      count.className = 'walk-count';
      // Cards read linearly to AT; the counter is visual scroll wayfinding.
      count.setAttribute('aria-hidden', 'true');
      counterEl = document.createElement('span');
      counterEl.className = 'wc-cur';
      counterEl.textContent = pad(1);
      count.append(counterEl, ` / ${pad(steps.length)}`);
      copy.after(count);

      copy.addEventListener(
        'scroll',
        () => {
          if (mq.matches) return;
          const stride = steps[1].offsetLeft - steps[0].offsetLeft; // card + gap
          const idx = Math.max(0, Math.min(steps.length - 1, Math.round(copy.scrollLeft / stride)));
          if (idx === activeIdx) return;
          activeIdx = idx;
          counterEl!.textContent = pad(idx + 1);
          steps.forEach((s, i) => s.classList.toggle('active', i === idx));
        },
        { passive: true },
      );

      /* Prev/next arrows (mobile only, ≤900px — CSS hides them on desktop).
         They just scrollBy one card stride; the scroll listener above keeps the
         counter + .active in sync. Runs OUTSIDE the reduced-motion gate below —
         navigation must work either way; only the scroll animation is gated. */
      const prevBtn = root.querySelector<HTMLButtonElement>('[data-walk-prev]');
      const nextBtn = root.querySelector<HTMLButtonElement>('[data-walk-next]');
      if (prevBtn && nextBtn) {
        const behavior: ScrollBehavior = motionOK ? 'smooth' : 'auto';
        const stride = () => steps[1].offsetLeft - steps[0].offsetLeft;
        prevBtn.addEventListener('click', () => copy.scrollBy({ left: -stride(), behavior }));
        nextBtn.addEventListener('click', () => copy.scrollBy({ left: stride(), behavior }));
      }
    }

    if (!motionOK) return; // everything below animates

    const shots = Array.from(root.querySelectorAll<HTMLElement>('[data-walk-shot]'));

    const isStageMode = root.dataset.walkMode === 'stage';
    const grid = root.querySelector<HTMLElement>('.walk-grid');
    const parts: Record<string, StagePart> | null =
      isStageMode && grid?.dataset.stageParts ? JSON.parse(grid.dataset.stageParts) : null;

    const boxEl = root.querySelector<HTMLElement>('[data-walk-box]');

    // Alternate full-panel shots (one per `{ shot }` part), keyed by part slug.
    const altEls = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>('[data-walk-alt]').forEach((el) => {
      if (el.dataset.walkAlt) altEls.set(el.dataset.walkAlt, el);
    });

    // Crossfade: the alt shot for `show` (if any) to opacity 1, all others to 0.
    const setAltShot = (show?: string): void => {
      altEls.forEach((el, slug) => {
        gsap.to(el, { opacity: slug === show ? 1 : 0, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
      });
    };

    const hideStageOverlay = (): void => {
      if (boxEl) gsap.to(boxEl, { autoAlpha: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    };

    const showStagePart = (rect: PartRect): void => {
      if (!boxEl) return;
      gsap.to(boxEl, {
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        height: `${rect.h}%`,
        autoAlpha: 1,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const setActive = (idx: number): void => {
      activeIdx = idx;
      if (counterEl) counterEl.textContent = pad(idx + 1);
      steps.forEach((s, i) => s.classList.toggle('active', i === idx));

      if (isStageMode && parts) {
        const slug = steps[idx].dataset.part;
        const part = slug ? parts[slug] : undefined;
        if (part && mq.matches) {
          if (isRect(part)) {
            setAltShot();          // back to the base panel
            showStagePart(part);
          } else {
            hideStageOverlay();    // no box on an alt shot — the shot IS the focus
            setAltShot(slug);      // crossfade in this part's own window
          }
        } else {
          hideStageOverlay();
          setAltShot();
        }
        return;
      }

      if (shots.length > 1) {
        const shotIdx = Math.min(Number(steps[idx].dataset.shot) || 0, shots.length - 1);
        shots.forEach((sh, i) => {
          // Base shot (i === 0) stays at opacity 1 underneath; overlays fade.
          if (i === 0) return;
          gsap.to(sh, { opacity: i === shotIdx ? 1 : 0, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
        });
      }
    };
    setActive(0);

    /* The line a step has to cross to become active is the PINNED STAGE'S OWN
       CENTRE, not a fixed slice of the viewport. The stage sticks high (top =
       sale + nav + 1.5rem) while the old 'top 55%' put the line mid-screen, so
       from step 2 on every card lit up ~150px below the shot it described and
       the two never read as one unit. Measured off the live elements so it
       tracks --nav-h, the sale banner and the shot's max-height cap instead of
       hardcoding any of them. */
    const stageEl = root.querySelector<HTMLElement>('.walk-stage');
    const frameEl = root.querySelector<HTMLElement>('.stage-frame');
    const stageLine = (): number => {
      // offsetHeight is 0 while the stage is display:none (≤900px) or before
      // the lazy shot has resolved its box — fall back to the old mid-viewport
      // line rather than return a degenerate one.
      const h = frameEl?.offsetHeight ?? 0;
      if (!stageEl || !h) return window.innerHeight * 0.55;
      return (parseFloat(getComputedStyle(stageEl).top) || 0) + h / 2;
    };

    /* Tail runway. The line now sits half a shot higher, so the LAST card would
       reach it exactly as the stage runs out of grid and unpins — the one card
       that would light up against a shot already sliding away. Padding the copy
       column lengthens the grid row, which IS the stage's sticky containing
       block, by just enough to cover that moment.
       Deliberately small (usually ~20px): once the stage does unpin, card and
       shot scroll together and keep whatever offset they had, so a bigger
       spacer would only hold the shot still while the card slid past it — worse
       alignment, not better. Set from JS and desktop-only on purpose: no-JS and
       reduced-motion readers get no highlighting, so to them it is dead space. */
    const padTail = (): void => {
      if (!copy) return;
      const frameH = frameEl?.offsetHeight ?? 0;
      const lastH = steps[steps.length - 1].offsetHeight;
      copy.style.paddingBottom =
        mq.matches && frameH ? `${Math.max(0, Math.round((frameH - lastH) / 2))}px` : '';
    };
    padTail();

    /* The base shot loads lazily, so both the line and the runway above are
       measured against a box that may not be final yet. Re-measure once it is.
       Lives here rather than in the stage-mode block below so the crossfade
       plugins (no `stage` in plugins.ts) get it too — their line depends on the
       same frame height. */
    const baseImg = root.querySelector<HTMLImageElement>('.stage-frame .walk-shot.base');
    if (baseImg && !baseImg.complete) {
      baseImg.addEventListener(
        'load',
        () => {
          padTail();
          ScrollTrigger.refresh();
        },
        { once: true },
      );
    }

    /* Crossing the 901px breakpoint changes both (the stage is display:none
       below it, so the runway must come off). ScrollTrigger refreshes itself on
       resize, but it has no reason to know the padding changed — so re-apply
       first, then refresh, and the function-based start/end below are re-read
       against the new layout. */
    mq.addEventListener('change', () => {
      padTail();
      ScrollTrigger.refresh();
    });

    steps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        // A step owns the line from the moment its top reaches it until its
        // bottom passes it, so at the middle of that window the card's centre
        // sits on the shot's centre. Function-based so every refresh re-reads
        // them.
        start: () => `top ${stageLine()}px`,
        end: () => `bottom ${stageLine()}px`,
        onToggle: (self) => {
          // Desktop only: on mobile the steps scroll HORIZONTALLY (carousel),
          // so vertical viewport triggers would fire nonsense toggles — the
          // carousel scroll listener above owns .active there.
          if (self.isActive && mq.matches) setActive(i);
        },
      });
    });

    /* Gentle scrubbed drift on the pinned frame — breath, not parallax-show.
       Transform lives on the frame (child), never the sticky element. */
    const stage = root.querySelector('[data-walk-stage]');
    if (stage) {
      gsap.fromTo(
        stage,
        { y: 12 },
        {
          y: -12,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    }

    if (!isStageMode || !parts) return;

    // Disable the box under 900px: the stage is display:none there — the
    // carousel cards carry their own part thumbs and the counter owns
    // wayfinding. Re-evaluate on breakpoint crossing; activeIdx is kept in
    // sync by the carousel listener, so the highlighter resumes on the card
    // the reader actually reached.
    const onBreakpoint = () => {
      if (!mq.matches) { hideStageOverlay(); setAltShot(); }
      else setActive(activeIdx);
    };
    mq.addEventListener('change', onBreakpoint);
  });
}
